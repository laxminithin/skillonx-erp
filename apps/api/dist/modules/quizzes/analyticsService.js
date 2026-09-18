import ExcelJS from 'exceljs';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { buildExportFilename } from '../../utils/filename.js';
function parseJson(value, fallback) {
    if (value == null)
        return fallback;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        }
        catch {
            return fallback;
        }
    }
    return value;
}
async function assertQuiz(quizId, collegeId) {
    const quiz = await db('quizzes').where({ id: quizId, college_id: collegeId }).whereNull('deleted_at').first();
    if (!quiz)
        throw new AppError(404, 'Quiz not found');
    return quiz;
}
export async function listResults(quizId, collegeId) {
    await assertQuiz(quizId, collegeId);
    const rows = await db('quiz_attempts as a')
        .join('students as st', 'st.id', 'a.student_id')
        .where({ 'a.quiz_id': quizId })
        .whereIn('a.status', ['SUBMITTED', 'EXPIRED_SUBMITTED'])
        .select('a.public_token as attemptToken', 'a.attempt_number as attemptNumber', 'a.obtained_marks as obtainedMarks', 'a.total_marks as totalMarks', 'a.percentage', 'a.passed', 'a.started_at as startedAt', 'a.submitted_at as submittedAt', 'a.time_taken_seconds as timeTakenSeconds', 'a.status', 'st.name as studentName', 'st.usn', 'st.email')
        .orderBy('a.submitted_at', 'desc');
    const submitted = rows.map((r) => ({
        ...r,
        obtainedMarks: Number(r.obtainedMarks ?? 0),
        totalMarks: Number(r.totalMarks ?? 0),
        percentage: Number(r.percentage ?? 0),
        passed: !!r.passed,
        result: r.passed ? 'PASSED' : 'FAILED',
    }));
    const marks = submitted.map((r) => r.obtainedMarks);
    const summary = {
        attempted: submitted.length,
        averageMarks: marks.length ? Math.round((marks.reduce((s, n) => s + n, 0) / marks.length) * 100) / 100 : 0,
        highestMarks: marks.length ? Math.max(...marks) : 0,
        lowestMarks: marks.length ? Math.min(...marks) : 0,
        passPercentage: submitted.length
            ? Math.round((submitted.filter((r) => r.passed).length / submitted.length) * 1000) / 10
            : 0,
        completion: submitted.length,
    };
    return { summary, attempts: submitted };
}
export async function getAttemptDetail(quizId, collegeId, token) {
    await assertQuiz(quizId, collegeId);
    const attempt = await db('quiz_attempts as a')
        .join('students as st', 'st.id', 'a.student_id')
        .where({ 'a.quiz_id': quizId, 'a.public_token': token, 'a.college_id': collegeId })
        .select('a.*', 'st.name as student_name', 'st.usn', 'st.email')
        .first();
    if (!attempt)
        throw new AppError(404, 'Attempt not found');
    const questions = parseJson(attempt.question_snapshot, []);
    const answers = await db('quiz_attempt_answers').where({ attempt_id: attempt.id });
    const byQ = new Map(answers.map((r) => [Number(r.snapshot_question_id), r]));
    return {
        attemptToken: attempt.public_token,
        attemptNumber: Number(attempt.attempt_number),
        studentName: attempt.student_name,
        usn: attempt.usn,
        email: attempt.email,
        startedAt: attempt.started_at,
        submittedAt: attempt.submitted_at,
        timeTakenSeconds: Number(attempt.time_taken_seconds ?? 0),
        obtainedMarks: Number(attempt.obtained_marks ?? 0),
        totalMarks: Number(attempt.total_marks ?? 0),
        percentage: Number(attempt.percentage ?? 0),
        passed: !!attempt.passed,
        status: attempt.status,
        questions: questions.map((q) => {
            const row = byQ.get(q.id);
            return {
                id: q.id,
                questionText: q.questionText,
                questionType: q.questionType,
                marks: q.marks,
                explanation: q.explanation,
                moduleName: q.moduleName,
                options: q.options.map((o) => ({ id: o.id, label: o.label, isCorrect: o.isCorrect })),
                correctOptionIds: q.correctOptionIds,
                numericAnswer: q.numericAnswer,
                studentOptionIds: parseJson(row?.selected_option_ids, []),
                studentNumericAnswer: row?.numeric_answer != null ? Number(row.numeric_answer) : null,
                studentTextAnswer: row?.text_answer ?? null,
                awardedMarks: row?.awarded_marks != null ? Number(row.awarded_marks) : 0,
                isCorrect: row?.is_correct == null ? null : !!row.is_correct,
            };
        }),
    };
}
export async function getQuizAnalytics(quizId, collegeId) {
    const quiz = await assertQuiz(quizId, collegeId);
    const attempts = await db('quiz_attempts')
        .where({ quiz_id: quizId })
        .whereIn('status', ['SUBMITTED', 'EXPIRED_SUBMITTED']);
    const answers = attempts.length
        ? await db('quiz_attempt_answers').whereIn('attempt_id', attempts.map((a) => a.id))
        : [];
    const snapshots = attempts.map((a) => parseJson(a.question_snapshot, []));
    const questionIndex = new Map();
    for (const list of snapshots) {
        for (const q of list)
            questionIndex.set(q.id, q);
    }
    const perQuestion = [...questionIndex.values()].map((q) => {
        const rows = answers.filter((a) => Number(a.snapshot_question_id) === q.id);
        const appeared = rows.length;
        const correct = rows.filter((r) => r.is_correct === 1 || r.is_correct === true).length;
        const unanswered = rows.filter((r) => {
            const ids = parseJson(r.selected_option_ids, []);
            return !ids.length && r.numeric_answer == null && !r.text_answer;
        }).length;
        const incorrect = Math.max(0, appeared - correct - unanswered);
        const pct = (n) => (appeared ? Math.round((n / appeared) * 1000) / 10 : 0);
        return {
            id: q.id,
            questionText: q.questionText,
            moduleId: q.moduleId,
            moduleName: q.moduleName,
            correctPct: pct(correct),
            incorrectPct: pct(incorrect),
            unansweredPct: pct(unanswered),
            appeared,
        };
    });
    const byModule = new Map();
    for (const q of perQuestion) {
        const name = q.moduleName || 'Unassigned';
        const entry = byModule.get(name) ?? { moduleName: name, correct: 0, total: 0 };
        entry.correct += (q.correctPct / 100) * q.appeared;
        entry.total += q.appeared;
        byModule.set(name, entry);
    }
    const modulePerformance = [...byModule.values()].map((m) => ({
        moduleName: m.moduleName,
        averagePct: m.total ? Math.round((m.correct / m.total) * 1000) / 10 : 0,
    }));
    // CO Performance (NOT final CO Attainment). Not Assessed ≠ 0%.
    const courseId = quiz.course_id != null ? Number(quiz.course_id) : null;
    const subjectCos = courseId
        ? await db('course_outcomes')
            .where({ college_id: collegeId, course_id: courseId, is_current: true })
            .select('co_code', 'statement')
            .orderBy('co_number')
        : [];
    const coBuckets = new Map();
    // Structure marks from latest snapshot / question index
    const structureMarks = new Map();
    for (const q of questionIndex.values()) {
        const co = q.primaryCoCode ? String(q.primaryCoCode).toUpperCase() : null;
        if (!co)
            continue;
        const meta = structureMarks.get(co) ?? { questionCount: 0, availableMarks: 0 };
        meta.questionCount += 1;
        meta.availableMarks += Number(q.maxMarks ?? q.marks ?? 1);
        structureMarks.set(co, meta);
    }
    for (const attempt of attempts) {
        const questions = parseJson(attempt.question_snapshot, []);
        const attemptAnswers = answers.filter((a) => Number(a.attempt_id) === Number(attempt.id));
        const byQ = new Map(attemptAnswers.map((a) => [Number(a.snapshot_question_id), a]));
        for (const q of questions) {
            const co = q.primaryCoCode ? String(q.primaryCoCode).toUpperCase() : 'UNMAPPED';
            const bucket = coBuckets.get(co) ??
                {
                    coCode: co,
                    coStatement: subjectCos.find((c) => String(c.co_code).toUpperCase() === co)?.statement != null
                        ? String(subjectCos.find((c) => String(c.co_code).toUpperCase() === co).statement)
                        : null,
                    questionIds: new Set(),
                    availableMarks: 0,
                    awardedMarks: 0,
                    correctResponses: 0,
                    totalResponses: 0,
                };
            const maxMarks = Number(q.maxMarks ?? q.marks ?? 1);
            if (!bucket.questionIds.has(q.id)) {
                bucket.questionIds.add(q.id);
                bucket.availableMarks += maxMarks;
            }
            const row = byQ.get(q.id);
            if (row) {
                bucket.totalResponses += 1;
                bucket.awardedMarks += Number(row.awarded_marks ?? 0);
                if (row.is_correct === 1 || row.is_correct === true)
                    bucket.correctResponses += 1;
            }
            coBuckets.set(co, bucket);
        }
    }
    const assessedCodes = new Set(coBuckets.keys());
    const coPerformance = subjectCos.map((c) => {
        const code = String(c.co_code).toUpperCase();
        const bucket = coBuckets.get(code);
        const structure = structureMarks.get(code);
        if (!bucket && !structure) {
            return {
                coCode: code,
                coStatement: c.statement != null ? String(c.statement) : null,
                status: 'NOT_ASSESSED',
                questionCount: 0,
                availableMarks: 0,
                marksAwarded: null,
                averagePerformancePct: null,
                correctResponseRate: null,
                note: 'Not Assessed — no questions mapped to this CO in this quiz',
            };
        }
        const questionCount = structure?.questionCount ?? bucket?.questionIds.size ?? 0;
        const availableMarks = structure?.availableMarks ?? bucket?.availableMarks ?? 0;
        const marksAwarded = bucket?.awardedMarks ?? 0;
        const responses = bucket?.totalResponses ?? 0;
        const averagePerformancePct = availableMarks > 0 && attempts.length > 0
            ? Math.round((marksAwarded / (availableMarks * attempts.length)) * 1000) / 10
            : responses > 0 && bucket
                ? Math.round((marksAwarded / Math.max(bucket.availableMarks * attempts.length, 1)) * 1000) / 10
                : 0;
        const correctResponseRate = responses > 0 ? Math.round(((bucket?.correctResponses ?? 0) / responses) * 1000) / 10 : 0;
        return {
            coCode: code,
            coStatement: c.statement != null ? String(c.statement) : null,
            status: 'ASSESSED',
            questionCount,
            availableMarks,
            marksAwarded,
            averagePerformancePct,
            correctResponseRate,
            note: 'CO Assessment Performance — not final CO Attainment',
        };
    });
    // Include UNMAPPED / extra COs present in attempts but not in master list
    for (const [code, bucket] of coBuckets) {
        if (subjectCos.some((c) => String(c.co_code).toUpperCase() === code))
            continue;
        const responses = bucket.totalResponses;
        coPerformance.push({
            coCode: code,
            coStatement: bucket.coStatement,
            status: 'ASSESSED',
            questionCount: bucket.questionIds.size,
            availableMarks: bucket.availableMarks,
            marksAwarded: bucket.awardedMarks,
            averagePerformancePct: attempts.length > 0 && bucket.availableMarks > 0
                ? Math.round((bucket.awardedMarks / (bucket.availableMarks * attempts.length)) * 1000) / 10
                : 0,
            correctResponseRate: responses > 0 ? Math.round((bucket.correctResponses / responses) * 1000) / 10 : 0,
            note: 'CO Assessment Performance — not final CO Attainment',
        });
    }
    // Subject COs with no quiz questions remain NOT_ASSESSED (already handled).
    void assessedCodes;
    const marks = attempts.map((a) => Number(a.obtained_marks ?? 0));
    const percentages = attempts.map((a) => Number(a.percentage ?? 0));
    return {
        kind: 'QUIZ_ANALYTICS',
        overview: {
            attempted: attempts.length,
            averageMarks: marks.length ? Math.round((marks.reduce((s, n) => s + n, 0) / marks.length) * 100) / 100 : 0,
            averagePercentage: percentages.length
                ? Math.round((percentages.reduce((s, n) => s + n, 0) / percentages.length) * 10) / 10
                : 0,
            highestMarks: marks.length ? Math.max(...marks) : 0,
            lowestMarks: marks.length ? Math.min(...marks) : 0,
            passPercentage: attempts.length
                ? Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 1000) / 10
                : 0,
        },
        // Backward-compatible flat fields
        attempted: attempts.length,
        averageMarks: marks.length ? Math.round((marks.reduce((s, n) => s + n, 0) / marks.length) * 100) / 100 : 0,
        averagePercentage: percentages.length
            ? Math.round((percentages.reduce((s, n) => s + n, 0) / percentages.length) * 10) / 10
            : 0,
        highestMarks: marks.length ? Math.max(...marks) : 0,
        lowestMarks: marks.length ? Math.min(...marks) : 0,
        passPercentage: attempts.length
            ? Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 1000) / 10
            : 0,
        questions: perQuestion,
        questionPerformance: perQuestion,
        modulePerformance,
        coPerformance: coPerformance.sort((a, b) => a.coCode.localeCompare(b.coCode)),
        label: 'CO Performance / CO Assessment Performance',
    };
}
export async function exportResults(quizId, collegeId, format) {
    const quiz = await assertQuiz(quizId, collegeId);
    const { attempts } = await listResults(quizId, collegeId);
    const filename = buildExportFilename(String(quiz.title), format);
    if (format === 'csv') {
        const header = [
            'Student',
            'USN',
            'Attempt',
            'Marks',
            'Total',
            'Percentage',
            'Result',
            'Started',
            'Submitted',
            'Time Taken (s)',
        ];
        const lines = [
            header.join(','),
            ...attempts.map((a) => [
                csv(a.studentName),
                csv(a.usn),
                a.attemptNumber,
                a.obtainedMarks,
                a.totalMarks,
                a.percentage,
                a.result,
                a.startedAt ?? '',
                a.submittedAt ?? '',
                a.timeTakenSeconds ?? '',
            ].join(',')),
        ];
        return { filename, contentType: 'text/csv; charset=utf-8', body: Buffer.from(lines.join('\n')) };
    }
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Results');
    sheet.columns = [
        { header: 'Student', key: 'studentName', width: 24 },
        { header: 'USN', key: 'usn', width: 16 },
        { header: 'Attempt', key: 'attemptNumber', width: 10 },
        { header: 'Marks', key: 'obtainedMarks', width: 10 },
        { header: 'Total', key: 'totalMarks', width: 10 },
        { header: 'Percentage', key: 'percentage', width: 12 },
        { header: 'Result', key: 'result', width: 12 },
        { header: 'Started', key: 'startedAt', width: 22 },
        { header: 'Submitted', key: 'submittedAt', width: 22 },
        { header: 'Time Taken (s)', key: 'timeTakenSeconds', width: 16 },
    ];
    sheet.addRows(attempts);
    const questionSheet = wb.addWorksheet('Question-wise');
    if (attempts.length) {
        const first = await getAttemptDetail(quizId, collegeId, attempts[0].attemptToken);
        const headers = ['Student', 'USN', 'Attempt', ...first.questions.map((_, i) => `Q${i + 1}`), 'Total'];
        questionSheet.addRow(headers);
        for (const row of attempts) {
            const detail = await getAttemptDetail(quizId, collegeId, row.attemptToken);
            questionSheet.addRow([
                row.studentName,
                row.usn,
                row.attemptNumber,
                ...detail.questions.map((q) => q.awardedMarks),
                row.obtainedMarks,
            ]);
        }
    }
    const body = Buffer.from(await wb.xlsx.writeBuffer());
    return {
        filename,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body,
    };
}
function csv(value) {
    const s = String(value ?? '');
    if (/[",\n]/.test(s))
        return `"${s.replaceAll('"', '""')}"`;
    return s;
}
