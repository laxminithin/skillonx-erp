import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import ExcelJS from 'exceljs';
import { buildExportFilename } from '../../utils/filename.js';
async function getSurveyOrThrow(surveyId, collegeId) {
    const survey = await db('surveys')
        .where({ id: surveyId, college_id: collegeId })
        .whereNull('deleted_at')
        .first();
    if (!survey)
        throw new AppError(404, 'Survey not found');
    return survey;
}
export async function listResponses(surveyId, collegeId) {
    const survey = await getSurveyOrThrow(surveyId, collegeId);
    const anonymous = survey.identity_mode === 'ANONYMOUS';
    const rows = await db('survey_submissions as ss')
        .join('students as st', 'st.id', 'ss.student_id')
        .where({ 'ss.survey_id': surveyId, 'ss.status': 'COMPLETED' })
        .select('ss.id', 'ss.submitted_at', 'ss.attempt_number', 'ss.started_at', anonymous ? db.raw('NULL as usn') : 'st.usn', anonymous ? db.raw('NULL as name') : 'st.name', anonymous ? db.raw('NULL as email') : 'st.email', anonymous ? db.raw("'Anonymous' as display_name") : 'st.name as display_name')
        .orderBy('ss.submitted_at', 'desc');
    return {
        identityMode: survey.identity_mode,
        responses: rows.map((r, idx) => ({
            id: r.id,
            submittedAt: r.submitted_at,
            attemptNumber: r.attempt_number,
            startedAt: r.started_at,
            usn: anonymous ? `R-${String(idx + 1).padStart(3, '0')}` : r.usn,
            name: anonymous ? `Respondent ${idx + 1}` : r.name,
            email: anonymous ? null : r.email,
        })),
    };
}
export async function getResponseDetail(surveyId, collegeId, submissionId) {
    const survey = await getSurveyOrThrow(surveyId, collegeId);
    const anonymous = survey.identity_mode === 'ANONYMOUS';
    const submission = await db('survey_submissions as ss')
        .join('students as st', 'st.id', 'ss.student_id')
        .where({ 'ss.id': submissionId, 'ss.survey_id': surveyId, 'ss.status': 'COMPLETED' })
        .select('ss.*', 'st.name', 'st.usn', 'st.email')
        .first();
    if (!submission)
        throw new AppError(404, 'Response not found');
    const answers = await db('survey_answers as sa')
        .join('questions as q', 'q.id', 'sa.question_id')
        .leftJoin('question_options as qo', 'qo.id', 'sa.selected_option_id')
        .where('sa.submission_id', submissionId)
        .select('sa.*', 'q.prompt', 'q.question_type', 'qo.label as option_label')
        .orderBy('q.sort_order', 'asc');
    return {
        identityMode: survey.identity_mode,
        submission: {
            id: submission.id,
            submittedAt: submission.submitted_at,
            attemptNumber: submission.attempt_number,
            student: anonymous
                ? null
                : { name: submission.name, usn: submission.usn, email: submission.email },
        },
        answers: answers.map((a) => ({
            questionId: a.question_id,
            prompt: a.prompt,
            questionType: a.question_type,
            textAnswer: a.text_answer,
            numericAnswer: a.numeric_answer != null ? Number(a.numeric_answer) : null,
            selectedOptionId: a.selected_option_id,
            optionLabel: a.option_label,
            jsonAnswer: typeof a.json_answer === 'string' ? JSON.parse(a.json_answer) : a.json_answer,
            comment: a.comment ?? null,
        })),
    };
}
export async function getAnalytics(surveyId, collegeId) {
    const survey = await getSurveyOrThrow(surveyId, collegeId);
    const completedCount = await db('survey_submissions')
        .where({ survey_id: surveyId, status: 'COMPLETED' })
        .count({ c: '*' })
        .first();
    const responses = Number(completedCount?.c ?? 0);
    const startedRow = await db('survey_submissions')
        .where({ survey_id: surveyId })
        .count({ c: '*' })
        .first();
    const started = Number(startedRow?.c ?? 0);
    // Guard against divide-by-zero — an untouched survey reports 0%, never NaN.
    const completionRate = started > 0 ? Math.round((responses / started) * 1000) / 10 : 0;
    const questions = await db('questions')
        .where({ survey_id: surveyId })
        .orderBy('sort_order', 'asc');
    const options = await db('question_options')
        .whereIn('question_id', questions.map((q) => q.id))
        .orderBy('sort_order', 'asc');
    const answers = await db('survey_answers as sa')
        .join('survey_submissions as ss', 'ss.id', 'sa.submission_id')
        .where({ 'ss.survey_id': surveyId, 'ss.status': 'COMPLETED' })
        .select('sa.*');
    const questionAnalytics = [];
    const numericAverages = [];
    for (const q of questions) {
        const qAnswers = answers.filter((a) => a.question_id === q.id);
        const qOptions = options.filter((o) => o.question_id === q.id);
        if (['LIKERT', 'RATING', 'STAR_RATING', 'SMILE_RATING', 'NUMERICAL', 'YES_NO', 'MULTIPLE_CHOICE', 'DROPDOWN'].includes(q.question_type)) {
            const distribution = qOptions.map((opt) => {
                const count = qAnswers.filter((a) => a.selected_option_id === opt.id).length;
                return {
                    optionId: opt.id,
                    label: opt.label,
                    value: opt.value,
                    count,
                    percent: responses ? Math.round((count / responses) * 1000) / 10 : 0,
                };
            });
            const values = qAnswers
                .map((a) => {
                if (a.numeric_answer != null)
                    return Number(a.numeric_answer);
                const opt = qOptions.find((o) => o.id === a.selected_option_id);
                return opt?.value != null ? Number(opt.value) : null;
            })
                .filter((v) => v != null);
            const average = values.length > 0 ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100 : null;
            if (average != null &&
                ['LIKERT', 'RATING', 'STAR_RATING', 'SMILE_RATING', 'NUMERICAL'].includes(q.question_type)) {
                numericAverages.push(average);
            }
            questionAnalytics.push({
                questionId: q.id,
                prompt: q.prompt,
                questionType: q.question_type,
                distribution,
                average,
                textResponses: [],
            });
        }
        else if (q.question_type === 'CHECKBOX') {
            const counts = new Map();
            for (const a of qAnswers) {
                const raw = typeof a.json_answer === 'string' ? JSON.parse(a.json_answer) : a.json_answer;
                const ids = Array.isArray(raw) ? raw : [];
                for (const id of ids) {
                    counts.set(String(id), (counts.get(String(id)) ?? 0) + 1);
                }
            }
            const distribution = qOptions.map((opt) => {
                const count = counts.get(String(opt.id)) ?? 0;
                return {
                    optionId: opt.id,
                    label: opt.label,
                    value: opt.value,
                    count,
                    percent: responses ? Math.round((count / responses) * 1000) / 10 : 0,
                };
            });
            questionAnalytics.push({
                questionId: q.id,
                prompt: q.prompt,
                questionType: q.question_type,
                distribution,
                average: null,
                textResponses: [],
            });
        }
        else {
            questionAnalytics.push({
                questionId: q.id,
                prompt: q.prompt,
                questionType: q.question_type,
                distribution: [],
                average: null,
                textResponses: qAnswers
                    .map((a) => a.text_answer)
                    .filter(Boolean)
                    .slice(0, 50),
            });
        }
    }
    const averageRating = numericAverages.length > 0
        ? Math.round((numericAverages.reduce((s, v) => s + v, 0) / numericAverages.length) * 100) / 100
        : null;
    return {
        surveyId,
        title: survey.title,
        responses,
        started,
        completed: responses,
        completionRate,
        averageRating,
        participation: null,
        questions: questionAnalytics,
    };
}
export async function exportResponses(surveyId, collegeId, format) {
    const survey = await getSurveyOrThrow(surveyId, collegeId);
    const anonymous = survey.identity_mode === 'ANONYMOUS';
    const questions = await db('questions').where({ survey_id: surveyId }).orderBy('sort_order', 'asc');
    const options = await db('question_options').whereIn('question_id', questions.map((q) => q.id));
    const optMap = new Map(options.map((o) => [o.id, o.label]));
    const submissions = await db('survey_submissions as ss')
        .join('students as st', 'st.id', 'ss.student_id')
        .where({ 'ss.survey_id': surveyId, 'ss.status': 'COMPLETED' })
        .select('ss.id', 'ss.submitted_at', 'st.name', 'st.usn', 'st.email')
        .orderBy('ss.submitted_at', 'asc');
    const answers = await db('survey_answers')
        .whereIn('submission_id', submissions.map((s) => s.id))
        .select('*');
    const headers = [
        ...(anonymous ? ['Respondent'] : ['USN', 'Name', 'Email']),
        'Submitted At',
        ...questions.map((q, i) => `Q${i + 1}: ${q.prompt}`),
    ];
    const rows = submissions.map((sub, idx) => {
        const base = anonymous
            ? [`Respondent ${idx + 1}`]
            : [sub.usn, sub.name, sub.email];
        const answerCells = questions.map((q) => {
            const a = answers.find((x) => x.submission_id === sub.id && x.question_id === q.id);
            if (!a)
                return '';
            if (a.selected_option_id)
                return optMap.get(a.selected_option_id) ?? '';
            if (a.numeric_answer != null)
                return String(a.numeric_answer);
            if (a.text_answer)
                return a.text_answer;
            if (a.json_answer) {
                const raw = typeof a.json_answer === 'string' ? JSON.parse(a.json_answer) : a.json_answer;
                if (Array.isArray(raw)) {
                    return raw.map((id) => optMap.get(Number(id)) ?? String(id)).join('; ');
                }
                return JSON.stringify(raw);
            }
            return '';
        });
        return [...base, sub.submitted_at ? new Date(sub.submitted_at).toISOString() : '', ...answerCells];
    });
    if (format === 'csv') {
        const escape = (v) => {
            const s = String(v ?? '');
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
                return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
        };
        const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
        return {
            contentType: 'text/csv',
            filename: buildExportFilename(String(survey.title), 'csv'),
            body: csv,
        };
    }
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Responses');
    sheet.addRow(headers);
    for (const row of rows)
        sheet.addRow(row);
    const buffer = await workbook.xlsx.writeBuffer();
    return {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: buildExportFilename(String(survey.title), 'xlsx'),
        body: Buffer.from(buffer),
    };
}
