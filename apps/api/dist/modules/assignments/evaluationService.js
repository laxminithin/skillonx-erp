import { z } from 'zod';
import ExcelJS from 'exceljs';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
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
export const evaluationItemSchema = z.object({
    questionId: z.union([z.number(), z.string()]),
    awardedMarks: z.number().min(0),
    feedback: z.string().max(5000).optional().nullable(),
});
export const evaluationSchema = z.object({
    items: z.array(evaluationItemSchema).min(1),
    releaseResults: z.boolean().optional().default(false),
});
export async function listSubmissions(assignmentId, collegeId) {
    const assignment = await db('assignments')
        .where({ id: assignmentId, college_id: collegeId })
        .whereNull('deleted_at')
        .first();
    if (!assignment)
        throw new AppError(404, 'Assignment not found');
    const rows = await db('assignment_submissions as s')
        .join('students as st', 'st.id', 's.student_id')
        .where({ 's.assignment_id': assignmentId })
        .whereIn('s.status', ['SUBMITTED', 'LATE_SUBMITTED', 'IN_PROGRESS'])
        .orderBy('s.submitted_at', 'desc')
        .select('s.id', 's.public_token as publicToken', 's.status', 's.is_late as isLate', 's.started_at as startedAt', 's.submitted_at as submittedAt', 's.obtained_marks as obtainedMarks', 's.total_marks as totalMarks', 's.percentage', 's.evaluation_status as evaluationStatus', 's.results_released as resultsReleased', 'st.name as studentName', 'st.usn as studentUsn', 'st.email as studentEmail');
    return { submissions: rows };
}
export async function getSubmissionDetail(assignmentId, submissionId, collegeId) {
    const submission = await db('assignment_submissions as s')
        .join('students as st', 'st.id', 's.student_id')
        .join('assignments as a', 'a.id', 's.assignment_id')
        .where({
        's.id': submissionId,
        's.assignment_id': assignmentId,
        'a.college_id': collegeId,
    })
        .select('s.*', 'st.name as student_name', 'st.usn as student_usn', 'st.email as student_email', 'a.title as assignment_title')
        .first();
    if (!submission)
        throw new AppError(404, 'Submission not found');
    const questions = parseJson(submission.question_snapshot, []);
    const answers = await db('assignment_answers').where({ submission_id: submissionId });
    const byQ = new Map(answers.map((a) => [String(a.snapshot_question_id), a]));
    return {
        id: submission.id,
        publicToken: submission.public_token,
        status: submission.status,
        isLate: !!submission.is_late,
        startedAt: submission.started_at,
        submittedAt: submission.submitted_at,
        obtainedMarks: submission.obtained_marks,
        totalMarks: submission.total_marks,
        percentage: submission.percentage,
        evaluationStatus: submission.evaluation_status,
        resultsReleased: !!submission.results_released,
        evaluatedAt: submission.evaluated_at,
        student: {
            name: submission.student_name,
            usn: submission.student_usn,
            email: submission.student_email,
        },
        questions: questions.map((q) => {
            const a = byQ.get(String(q.id));
            return {
                id: q.id,
                questionText: q.questionText,
                questionType: q.questionType,
                marks: Number(q.marks),
                difficulty: q.difficulty,
                primaryCoCode: q.primaryCoCode,
                derivedOutcomes: q.derivedOutcomes,
                expectedAnswerGuidance: q.expectedAnswerGuidance,
                textAnswer: a?.text_answer ?? '',
                wordCount: a?.word_count ?? 0,
                awardedMarks: a?.awarded_marks,
                feedback: a?.feedback,
            };
        }),
    };
}
export async function saveEvaluation(assignmentId, submissionId, collegeId, facultyUserId, body) {
    const detail = await getSubmissionDetail(assignmentId, submissionId, collegeId);
    if (!['SUBMITTED', 'LATE_SUBMITTED'].includes(String(detail.status))) {
        throw new AppError(400, 'Only submitted work can be evaluated');
    }
    const maxById = new Map(detail.questions.map((q) => [String(q.id), Number(q.marks)]));
    let obtained = 0;
    await db.transaction(async (trx) => {
        for (const item of body.items) {
            const qid = String(item.questionId);
            const max = maxById.get(qid);
            if (max == null)
                throw new AppError(400, `Unknown question ${qid}`);
            if (item.awardedMarks > max) {
                throw new AppError(400, `Marks for question ${qid} cannot exceed ${max}`);
            }
            obtained += item.awardedMarks;
            await trx('assignment_answers')
                .where({ submission_id: submissionId, snapshot_question_id: qid })
                .update({
                awarded_marks: item.awardedMarks,
                feedback: item.feedback ?? null,
                evaluated_by: facultyUserId,
                evaluated_at: trx.fn.now(),
                updated_at: trx.fn.now(),
            });
        }
        const total = Number(detail.totalMarks ?? 0);
        const percentage = total > 0 ? Math.round((obtained / total) * 10000) / 100 : 0;
        await trx('assignment_submissions')
            .where({ id: submissionId })
            .update({
            obtained_marks: obtained,
            percentage,
            passed: percentage >= 40,
            evaluation_status: body.releaseResults ? 'RELEASED' : 'EVALUATED',
            results_released: !!body.releaseResults,
            evaluated_by: facultyUserId,
            evaluated_at: trx.fn.now(),
            updated_at: trx.fn.now(),
        });
    });
    return getSubmissionDetail(assignmentId, submissionId, collegeId);
}
export async function releaseResults(assignmentId, submissionId, collegeId) {
    await getSubmissionDetail(assignmentId, submissionId, collegeId);
    await db('assignment_submissions').where({ id: submissionId }).update({
        results_released: true,
        evaluation_status: 'RELEASED',
        updated_at: db.fn.now(),
    });
    return getSubmissionDetail(assignmentId, submissionId, collegeId);
}
/** CO Performance Summary — NOT final attainment. */
export async function coPerformanceSummary(assignmentId, collegeId) {
    const assignment = await db('assignments')
        .where({ id: assignmentId, college_id: collegeId })
        .whereNull('deleted_at')
        .first();
    if (!assignment)
        throw new AppError(404, 'Assignment not found');
    const submissions = await db('assignment_submissions')
        .where({ assignment_id: assignmentId })
        .whereIn('status', ['SUBMITTED', 'LATE_SUBMITTED'])
        .whereIn('evaluation_status', ['EVALUATED', 'RELEASED']);
    const coAgg = new Map();
    for (const sub of submissions) {
        const questions = parseJson(sub.question_snapshot, []);
        const answers = await db('assignment_answers').where({ submission_id: sub.id });
        const byQ = new Map(answers.map((a) => [String(a.snapshot_question_id), a]));
        const seenCoInSub = new Set();
        for (const q of questions) {
            const co = String(q.primaryCoCode || 'UNMAPPED').toUpperCase();
            const bucket = coAgg.get(co) ??
                { questions: new Set(), marksAvailable: 0, marksAwardedSum: 0, studentCount: 0 };
            const qKey = String(q.id);
            if (!bucket.questions.has(qKey)) {
                bucket.questions.add(qKey);
                bucket.marksAvailable += Number(q.marks ?? 0);
            }
            const ans = byQ.get(qKey);
            bucket.marksAwardedSum += Number(ans?.awarded_marks ?? 0);
            seenCoInSub.add(co);
            coAgg.set(co, bucket);
        }
        for (const co of seenCoInSub) {
            const bucket = coAgg.get(co);
            bucket.studentCount += 1;
        }
    }
    // Prefer marks available from assignment structure for class average denominator
    const structure = await db('assignment_questions')
        .where({ assignment_id: assignmentId })
        .select('id', 'primary_co_code', 'marks');
    const structureByCo = new Map();
    for (const q of structure) {
        const co = String(q.primary_co_code || 'UNMAPPED').toUpperCase();
        const bucket = structureByCo.get(co) ?? { questionCount: 0, marksAvailable: 0 };
        bucket.questionCount += 1;
        bucket.marksAvailable += Number(q.marks);
        structureByCo.set(co, bucket);
    }
    const evaluatedCount = submissions.length;
    const rows = [...structureByCo.entries()].map(([co, meta]) => {
        const agg = coAgg.get(co);
        const classAverage = evaluatedCount > 0 && agg
            ? Math.round((agg.marksAwardedSum / evaluatedCount) * 100) / 100
            : 0;
        return {
            coCode: co,
            questionCount: meta.questionCount,
            marksAvailable: meta.marksAvailable,
            classAverage,
            evaluatedSubmissions: evaluatedCount,
            label: 'CO Performance Summary',
        };
    });
    return {
        kind: 'CO_PERFORMANCE_SUMMARY',
        note: 'Not final CO attainment — raw performance against mapped questions.',
        evaluatedSubmissions: evaluatedCount,
        rows: rows.sort((a, b) => a.coCode.localeCompare(b.coCode)),
    };
}
export async function exportAssignmentResults(assignmentId, collegeId) {
    const assignment = await db('assignments as a')
        .leftJoin('courses as c', 'c.id', 'a.course_id')
        .where({ 'a.id': assignmentId, 'a.college_id': collegeId })
        .whereNull('a.deleted_at')
        .select('a.*', 'c.name as course_name', 'c.code as course_code')
        .first();
    if (!assignment)
        throw new AppError(404, 'Assignment not found');
    const { submissions } = await listSubmissions(assignmentId, collegeId);
    const questions = await db('assignment_questions')
        .where({ assignment_id: assignmentId })
        .orderBy('sort_order');
    const coPerf = await coPerformanceSummary(assignmentId, collegeId);
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SkillonX';
    const summary = wb.addWorksheet('SUMMARY');
    summary.addRows([
        ['Title', assignment.title],
        ['Subject', assignment.course_name],
        ['Subject Code', assignment.course_code],
        ['Submissions', submissions.filter((s) => s.status !== 'IN_PROGRESS').length],
        ['Questions', questions.length],
    ]);
    const subSheet = wb.addWorksheet('SUBMISSIONS');
    subSheet.addRow(['Student', 'USN', 'Email', 'Status', 'Late', 'Submitted', 'Marks', 'Percentage', 'Evaluation']);
    for (const s of submissions) {
        subSheet.addRow([
            s.studentName,
            s.studentUsn,
            s.studentEmail,
            s.status,
            s.isLate ? 'YES' : 'NO',
            s.submittedAt,
            s.obtainedMarks,
            s.percentage,
            s.evaluationStatus,
        ]);
    }
    const qm = wb.addWorksheet('QUESTION_MARKS');
    qm.addRow(['Student', 'USN', 'Question', 'CO', 'Max', 'Awarded', 'Feedback']);
    for (const s of submissions.filter((x) => x.status !== 'IN_PROGRESS')) {
        const detail = await getSubmissionDetail(assignmentId, Number(s.id), collegeId);
        for (const q of detail.questions) {
            qm.addRow([
                detail.student.name,
                detail.student.usn,
                q.questionText,
                q.primaryCoCode,
                q.marks,
                q.awardedMarks,
                q.feedback,
            ]);
        }
    }
    const coSheet = wb.addWorksheet('CO_PERFORMANCE');
    coSheet.addRow(['CO', 'Questions', 'Marks Available', 'Class Average', 'Evaluated Submissions']);
    for (const row of coPerf.rows) {
        coSheet.addRow([row.coCode, row.questionCount, row.marksAvailable, row.classAverage, row.evaluatedSubmissions]);
    }
    const mapSheet = wb.addWorksheet('QUESTION_MAPPING');
    mapSheet.addRow(['Question', 'Module', 'Difficulty', 'CO', 'PO', 'PSO', 'SDG', 'Marks', 'Mapping Source']);
    for (const q of questions) {
        const derived = parseJson(q.derived_outcomes_snapshot, {});
        const mod = q.module_id
            ? await db('subject_modules').where({ id: q.module_id }).first()
            : null;
        mapSheet.addRow([
            q.question_text,
            mod?.name,
            q.difficulty,
            q.primary_co_code,
            (derived.pos || []).join(', '),
            (derived.psos || []).join(', '),
            (derived.sdgs || []).join(', '),
            q.marks,
            q.mapping_source,
        ]);
    }
    const buffer = await wb.xlsx.writeBuffer();
    const safeSubject = String(assignment.course_name || 'Subject').replace(/[^\w\-]+/g, '_');
    const safeTitle = String(assignment.title || 'Assignment').replace(/[^\w\-]+/g, '_');
    return {
        filename: `${safeSubject}-Assignment-${safeTitle}-Results.xlsx`,
        buffer: Buffer.from(buffer),
    };
}
