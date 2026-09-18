import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { parseSnapshotQuestions } from './serialize.js';
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
/**
 * Per-CO class performance from evaluated submissions only.
 * This is NOT final CO attainment — just observed average performance.
 */
export async function getAssignmentCoPerformance(assignmentId, collegeId) {
    const assignment = await db('assignments')
        .where({ id: assignmentId, college_id: collegeId })
        .whereNull('deleted_at')
        .first();
    if (!assignment)
        throw new AppError(404, 'Assignment not found');
    const questions = await db('assignment_questions')
        .where({ assignment_id: assignmentId })
        .select('id', 'marks', 'primary_co_code');
    const byCo = new Map();
    for (const q of questions) {
        const co = q.primary_co_code ? String(q.primary_co_code).toUpperCase() : 'UNMAPPED';
        const row = byCo.get(co) ?? { questionCount: 0, availableMarks: 0, questionIds: [] };
        row.questionCount += 1;
        row.availableMarks += Number(q.marks);
        row.questionIds.push(Number(q.id));
        byCo.set(co, row);
    }
    const submissions = await db('assignment_submissions')
        .where({ assignment_id: assignmentId, college_id: collegeId })
        .whereIn('evaluation_status', ['EVALUATED', 'RELEASED'])
        .select('id', 'question_snapshot');
    const awardedByCo = new Map();
    for (const sub of submissions) {
        const questionsSnap = parseSnapshotQuestions(sub.question_snapshot);
        const answers = await db('assignment_answers').where({ submission_id: sub.id });
        const byQ = new Map(answers.map((a) => [String(a.snapshot_question_id), a]));
        const perCoObtained = new Map();
        for (const q of questionsSnap) {
            const co = q.primaryCoCode ? String(q.primaryCoCode).toUpperCase() : 'UNMAPPED';
            const answer = byQ.get(String(q.id));
            const obtained = answer?.awarded_marks != null ? Number(answer.awarded_marks) : 0;
            const max = Number(q.marks) || 0;
            const bucket = perCoObtained.get(co) ?? { obtained: 0, max: 0 };
            bucket.obtained += obtained;
            bucket.max += max;
            perCoObtained.set(co, bucket);
        }
        for (const [co, bucket] of perCoObtained) {
            const list = awardedByCo.get(co) ?? [];
            list.push(bucket.max > 0 ? (bucket.obtained / bucket.max) * 100 : 0);
            awardedByCo.set(co, list);
        }
    }
    const rows = [...byCo.entries()]
        .map(([coCode, meta]) => {
        const percents = awardedByCo.get(coCode) ?? [];
        const avgPercent = percents.length > 0
            ? Math.round((percents.reduce((s, n) => s + n, 0) / percents.length) * 100) / 100
            : null;
        const classAverageMarks = meta.availableMarks > 0 && avgPercent != null
            ? Math.round(((avgPercent / 100) * meta.availableMarks) * 100) / 100
            : 0;
        return {
            coCode,
            questionCount: meta.questionCount,
            availableMarks: Math.round(meta.availableMarks * 100) / 100,
            classAverageMarks,
            averagePercent: avgPercent,
        };
    })
        .sort((a, b) => a.coCode.localeCompare(b.coCode));
    return {
        assignmentId,
        evaluatedSubmissionCount: submissions.length,
        note: 'Class average performance by mapped CO — not final CO attainment.',
        cos: rows,
    };
}
/** Light helper for quiz CO performance using primary_co_code on quiz_questions. */
export async function getQuizCoPerformance(quizId, collegeId) {
    const quiz = await db('quizzes').where({ id: quizId, college_id: collegeId }).whereNull('deleted_at').first();
    if (!quiz)
        throw new AppError(404, 'Quiz not found');
    const questions = await db('quiz_questions')
        .where({ quiz_id: quizId })
        .select('id', 'marks', 'primary_co_code');
    const byCo = new Map();
    for (const q of questions) {
        const co = q.primary_co_code ? String(q.primary_co_code).toUpperCase() : 'UNMAPPED';
        const row = byCo.get(co) ?? { questionCount: 0, availableMarks: 0 };
        row.questionCount += 1;
        row.availableMarks += Number(q.marks);
        byCo.set(co, row);
    }
    const attempts = await db('quiz_attempts')
        .where({ quiz_id: quizId, college_id: collegeId })
        .whereIn('status', ['SUBMITTED', 'EXPIRED_SUBMITTED'])
        .select('id', 'question_snapshot');
    const percentByCo = new Map();
    for (const attempt of attempts) {
        const snap = parseJson(attempt.question_snapshot, []);
        const answers = await db('quiz_attempt_answers').where({ attempt_id: attempt.id });
        const byQ = new Map(answers.map((a) => [Number(a.snapshot_question_id), a]));
        const perCo = new Map();
        for (const q of snap) {
            // Prefer live mapping from quiz_questions when snapshot lacks CO
            const live = questions.find((lq) => Number(lq.id) === Number(q.id));
            const co = (q.primaryCoCode || live?.primary_co_code || 'UNMAPPED').toString().toUpperCase();
            const answer = byQ.get(Number(q.id));
            const obtained = answer?.awarded_marks != null ? Number(answer.awarded_marks) : 0;
            const bucket = perCo.get(co) ?? { obtained: 0, max: 0 };
            bucket.obtained += obtained;
            bucket.max += Number(q.marks);
            perCo.set(co, bucket);
        }
        for (const [co, bucket] of perCo) {
            const list = percentByCo.get(co) ?? [];
            list.push(bucket.max > 0 ? (bucket.obtained / bucket.max) * 100 : 0);
            percentByCo.set(co, list);
        }
    }
    return {
        quizId,
        evaluatedAttemptCount: attempts.length,
        note: 'Class average performance by mapped CO — not final CO attainment.',
        cos: [...byCo.entries()]
            .map(([coCode, meta]) => {
            const percents = percentByCo.get(coCode) ?? [];
            const averagePercent = percents.length > 0
                ? Math.round((percents.reduce((s, n) => s + n, 0) / percents.length) * 100) / 100
                : null;
            return {
                coCode,
                questionCount: meta.questionCount,
                availableMarks: Math.round(meta.availableMarks * 100) / 100,
                classAverageMarks: meta.availableMarks > 0 && averagePercent != null
                    ? Math.round(((averagePercent / 100) * meta.availableMarks) * 100) / 100
                    : 0,
                averagePercent,
            };
        })
            .sort((a, b) => a.coCode.localeCompare(b.coCode)),
    };
}
