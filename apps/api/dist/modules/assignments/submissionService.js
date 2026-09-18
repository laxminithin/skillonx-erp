import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { generateAttemptToken } from '../../utils/codes.js';
import { normalizeUsn } from '../../types/domain.js';
import { countWords } from '../../types/assignment.js';
import { DEFAULT_TIMEZONE } from '../../utils/timezone.js';
import { assignmentAvailabilityMessage, assignmentAvailabilityReason, getAssignmentAvailabilityStatus, isStudentAccessible, } from './status.js';
import { assertNoAnswerLeak, canShowAssignmentMarks, canShowAssignmentSolutions, parseSnapshotQuestions, toPublicAssignmentQuestion, } from './serialize.js';
import { lockStructureIfNeeded } from './service.js';
import { upsertIdentifiedStudent } from '../quizzes/attemptService.js';
export const studentInfoSchema = z.object({
    name: z.string().min(1, 'Student name is required').max(255),
    usn: z
        .string()
        .min(5, 'Enter a valid USN')
        .max(64)
        .transform((v) => normalizeUsn(v))
        .refine((v) => /^[A-Z0-9]+$/.test(v), 'USN can only contain letters and numbers'),
    email: z.string().email('Enter a valid email address'),
});
export const submissionAnswerSchema = z.object({
    questionId: z.union([z.number().int().positive(), z.string().min(1)]),
    textAnswer: z.string().max(50000).optional().nullable(),
});
export const saveAnswersSchema = z.object({
    submissionToken: z.string().min(8).max(32),
    answers: z.array(submissionAnswerSchema),
});
export const submitSchema = z.object({
    submissionToken: z.string().min(8).max(32),
    answers: z.array(submissionAnswerSchema).optional().default([]),
});
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
async function getAssignmentByCode(code) {
    const row = await db('assignment_links as al')
        .join('assignments as a', 'a.id', 'al.assignment_id')
        .leftJoin('courses as c', 'c.id', 'a.course_id')
        .leftJoin('subject_modules as m', 'm.id', 'a.module_id')
        .leftJoin('colleges as col', 'col.id', 'a.college_id')
        .where({ 'al.code': code, 'al.is_active': true })
        .whereNull('a.deleted_at')
        .select('a.*', 'al.code as share_code', 'c.name as course_name', 'c.code as course_code', 'm.name as module_name', 'col.timezone as college_timezone')
        .first();
    if (!row)
        throw new AppError(404, 'Assignment not found');
    return row;
}
function availability(assignment, now = new Date()) {
    return getAssignmentAvailabilityStatus({
        status: String(assignment.status),
        startAt: assignment.start_at ?? null,
        endAt: assignment.due_at ?? null,
        closedAt: assignment.closed_at ?? null,
        archivedAt: assignment.archived_at ?? null,
        deletedAt: assignment.deleted_at ?? null,
    }, now);
}
function publicSummary(assignment, effective) {
    return {
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.instructions,
        assignmentNumber: assignment.assignment_number ?? null,
        courseName: assignment.course_name,
        courseCode: assignment.course_code,
        moduleName: assignment.module_name,
        attemptsAllowed: Number(assignment.attempts_allowed ?? 1),
        passPercentage: Number(assignment.pass_percentage ?? 40),
        lateSubmissionAllowed: !!assignment.late_submission_allowed,
        lateDeadlineAt: assignment.late_deadline_at ?? null,
        startAt: assignment.start_at ?? null,
        dueAt: assignment.due_at ?? null,
        endAt: assignment.due_at ?? null,
        effectiveStatus: effective,
        availabilityReason: assignmentAvailabilityReason(effective),
        timezone: assignment.college_timezone || DEFAULT_TIMEZONE,
    };
}
async function questionStats(assignmentId) {
    const row = await db('assignment_questions')
        .where({ assignment_id: assignmentId })
        .count({ c: '*' })
        .sum({ marks: 'marks' })
        .first();
    return { questionCount: Number(row?.c ?? 0), totalMarks: Number(row?.marks ?? 0) };
}
function snapshotQuestions(assignment) {
    const published = parseJson(assignment.published_snapshot, {});
    return published.questions ?? [];
}
function isLateNow(assignment, now = new Date()) {
    const due = assignment.due_at ? new Date(assignment.due_at) : null;
    if (!due || now.getTime() <= due.getTime())
        return false;
    return true;
}
function canAcceptLate(assignment, now = new Date()) {
    if (!assignment.late_submission_allowed)
        return false;
    const lateDeadline = assignment.late_deadline_at
        ? new Date(assignment.late_deadline_at)
        : null;
    if (!lateDeadline)
        return true;
    return now.getTime() <= lateDeadline.getTime();
}
export async function getPublicAssignment(code) {
    const assignment = await getAssignmentByCode(code);
    const effective = availability(assignment);
    if (effective === 'DRAFT' || effective === 'ARCHIVED') {
        throw new AppError(404, 'Assignment not found', undefined, assignmentAvailabilityReason(effective));
    }
    const stats = await questionStats(Number(assignment.id));
    const summary = { ...publicSummary(assignment, effective), ...stats };
    assertNoAnswerLeak(summary, 'public-assignment-summary');
    if (!isStudentAccessible(effective)) {
        // After due date, still allow late window if configured
        if (effective === 'ENDED' && canAcceptLate(assignment)) {
            return {
                accessible: true,
                lateWindow: true,
                reason: 'ASSIGNMENT_LATE_WINDOW',
                assignment: summary,
            };
        }
        return {
            accessible: false,
            reason: assignmentAvailabilityReason(effective),
            message: assignmentAvailabilityMessage(effective),
            assignment: summary,
        };
    }
    return {
        accessible: true,
        reason: assignmentAvailabilityReason(effective),
        assignment: summary,
    };
}
async function loadSavedAnswers(submissionId, trx = db) {
    const rows = await trx('assignment_answers').where({ submission_id: submissionId });
    return rows.map((r) => ({
        questionId: r.snapshot_question_id,
        textAnswer: r.text_answer,
        wordCount: r.word_count != null ? Number(r.word_count) : null,
    }));
}
async function persistAnswers(trx, submissionId, answers, questions) {
    const allowed = new Set(questions.map((q) => String(q.id)));
    for (const answer of answers) {
        const qid = String(answer.questionId);
        if (!allowed.has(qid))
            continue;
        const question = questions.find((q) => String(q.id) === qid);
        const text = answer.textAnswer ?? null;
        const payload = {
            text_answer: text,
            response_format: question.responseFormat,
            word_count: countWords(text),
            updated_at: trx.fn.now(),
        };
        const existing = await trx('assignment_answers')
            .where({ submission_id: submissionId, snapshot_question_id: qid })
            .first();
        if (existing) {
            await trx('assignment_answers').where({ id: existing.id }).update(payload);
        }
        else {
            await trx('assignment_answers').insert({
                submission_id: submissionId,
                snapshot_question_id: qid,
                ...payload,
            });
        }
    }
}
function publicSubmissionPayload(submission, questions, saved) {
    const byId = new Map(saved.map((a) => [String(a.questionId), a]));
    const payload = {
        submissionToken: submission.public_token,
        attemptNumber: Number(submission.attempt_number),
        startedAt: submission.started_at,
        status: submission.status,
        isLate: !!submission.is_late,
        questions: questions.map(toPublicAssignmentQuestion),
        answers: questions.map((q) => {
            const a = byId.get(String(q.id));
            return {
                questionId: q.id,
                textAnswer: a?.textAnswer ?? null,
                wordCount: countWords(a?.textAnswer),
            };
        }),
    };
    assertNoAnswerLeak(payload, 'student-submission');
    return payload;
}
export async function startSubmission(code, info, meta) {
    const assignment = await getAssignmentByCode(code);
    const effective = availability(assignment);
    const now = new Date();
    const late = isLateNow(assignment, now);
    const lateOk = canAcceptLate(assignment, now);
    return db.transaction(async (trx) => {
        const studentId = await upsertIdentifiedStudent(Number(assignment.college_id), info, assignment.department_id, trx);
        const inProgress = await trx('assignment_submissions')
            .where({
            assignment_id: assignment.id,
            student_id: studentId,
            status: 'IN_PROGRESS',
        })
            .forUpdate()
            .first();
        if (inProgress) {
            const questions = parseSnapshotQuestions(inProgress.question_snapshot);
            const saved = await loadSavedAnswers(inProgress.id, trx);
            return {
                resumed: true,
                assignment: publicSummary(assignment, effective),
                ...publicSubmissionPayload(inProgress, questions, saved),
            };
        }
        const accessible = isStudentAccessible(effective) || (effective === 'ENDED' && lateOk);
        if (!accessible) {
            throw new AppError(400, assignmentAvailabilityMessage(effective), { effectiveStatus: effective }, assignmentAvailabilityReason(effective));
        }
        if (late && !lateOk) {
            throw new AppError(400, 'The late submission window has closed.', undefined, 'ASSIGNMENT_ENDED');
        }
        const submitted = await trx('assignment_submissions')
            .where({ assignment_id: assignment.id, student_id: studentId })
            .whereIn('status', ['SUBMITTED', 'LATE_SUBMITTED'])
            .count({ c: '*' })
            .first();
        const attemptsAllowed = Number(assignment.attempts_allowed ?? 1);
        if (attemptsAllowed > 0 && Number(submitted?.c ?? 0) >= attemptsAllowed) {
            throw new AppError(409, 'You have no remaining attempts for this assignment.', undefined, 'ATTEMPT_LIMIT');
        }
        const snapshot = snapshotQuestions(assignment);
        if (!snapshot.length)
            throw new AppError(400, 'This assignment has no questions');
        let token = generateAttemptToken();
        while (await trx('assignment_submissions').where({ public_token: token }).first()) {
            token = generateAttemptToken();
        }
        const attemptNumber = Number(submitted?.c ?? 0) + 1;
        const inserted = await trx('assignment_submissions').insert({
            assignment_id: assignment.id,
            student_id: studentId,
            college_id: assignment.college_id,
            attempt_number: attemptNumber,
            public_token: token,
            started_at: now,
            status: 'IN_PROGRESS',
            is_late: late,
            question_snapshot: JSON.stringify(snapshot),
            ip_address: meta.ip ?? null,
            device_information: meta.userAgent?.slice(0, 512) ?? null,
        });
        const submissionId = inserted[0];
        await lockStructureIfNeeded(Number(assignment.id), trx);
        const submission = await trx('assignment_submissions').where({ id: submissionId }).first();
        return {
            resumed: false,
            assignment: publicSummary(assignment, effective),
            ...publicSubmissionPayload(submission, snapshot, []),
        };
    });
}
export async function saveSubmissionAnswers(code, body) {
    const assignment = await getAssignmentByCode(code);
    return db.transaction(async (trx) => {
        const submission = await trx('assignment_submissions')
            .where({ public_token: body.submissionToken, assignment_id: assignment.id })
            .forUpdate()
            .first();
        if (!submission)
            throw new AppError(404, 'Submission not found');
        if (submission.status !== 'IN_PROGRESS') {
            return { saved: false, status: submission.status };
        }
        const questions = parseSnapshotQuestions(submission.question_snapshot);
        await persistAnswers(trx, submission.id, body.answers, questions);
        return { saved: true, status: 'IN_PROGRESS' };
    });
}
export async function submitAssignment(code, body) {
    const assignment = await getAssignmentByCode(code);
    const now = new Date();
    const late = isLateNow(assignment, now);
    const lateOk = canAcceptLate(assignment, now);
    return db.transaction(async (trx) => {
        const submission = await trx('assignment_submissions')
            .where({ public_token: body.submissionToken, assignment_id: assignment.id })
            .forUpdate()
            .first();
        if (!submission)
            throw new AppError(404, 'Submission not found');
        if (submission.status !== 'IN_PROGRESS') {
            return getSubmission(code, body.submissionToken);
        }
        if (late && !lateOk) {
            throw new AppError(400, 'The late submission window has closed.', undefined, 'ASSIGNMENT_ENDED');
        }
        const questions = parseSnapshotQuestions(submission.question_snapshot);
        if (body.answers?.length) {
            await persistAnswers(trx, submission.id, body.answers, questions);
        }
        await trx('assignment_submissions')
            .where({ id: submission.id })
            .update({
            status: late ? 'LATE_SUBMITTED' : 'SUBMITTED',
            is_late: late || !!submission.is_late,
            submitted_at: now,
            evaluation_status: 'PENDING',
            updated_at: trx.fn.now(),
        });
        return getSubmission(code, body.submissionToken);
    });
}
export async function getSubmission(code, token) {
    const assignment = await getAssignmentByCode(code);
    const submission = await db('assignment_submissions')
        .where({ public_token: token, assignment_id: assignment.id })
        .first();
    if (!submission)
        throw new AppError(404, 'Submission not found');
    const questions = parseSnapshotQuestions(submission.question_snapshot);
    const saved = await loadSavedAnswers(submission.id);
    const effective = availability(assignment);
    if (submission.status === 'IN_PROGRESS') {
        return {
            assignment: publicSummary(assignment, effective),
            ...publicSubmissionPayload(submission, questions, saved),
        };
    }
    const showMarks = canShowAssignmentMarks({
        showMarksImmediately: !!assignment.show_marks_immediately,
        resultsReleased: !!submission.results_released,
        evaluationStatus: String(submission.evaluation_status),
    });
    const showFeedback = !!assignment.show_feedback_after_evaluation &&
        (submission.results_released || submission.evaluation_status === 'RELEASED');
    const showSolutions = canShowAssignmentSolutions({
        policy: assignment.solution_release_policy,
        dueAt: assignment.due_at,
        solutionsReleasedAt: assignment.solutions_released_at,
        evaluationComplete: ['EVALUATED', 'RELEASED'].includes(String(submission.evaluation_status)),
    });
    const answers = await db('assignment_answers').where({ submission_id: submission.id });
    const byQ = new Map(answers.map((a) => [String(a.snapshot_question_id), a]));
    const payload = {
        status: submission.status,
        isLate: !!submission.is_late,
        submissionToken: submission.public_token,
        attemptNumber: Number(submission.attempt_number),
        startedAt: submission.started_at,
        submittedAt: submission.submitted_at,
        assignment: publicSummary(assignment, effective),
        obtainedMarks: showMarks && submission.obtained_marks != null ? Number(submission.obtained_marks) : null,
        totalMarks: showMarks && submission.total_marks != null ? Number(submission.total_marks) : null,
        percentage: showMarks && submission.percentage != null ? Number(submission.percentage) : null,
        passed: showMarks ? (submission.passed == null ? null : !!submission.passed) : null,
        overallFeedback: showFeedback ? submission.overall_feedback ?? null : null,
        questions: questions.map((q) => {
            const answer = byQ.get(String(q.id));
            const publicQ = toPublicAssignmentQuestion(q);
            return {
                ...publicQ,
                textAnswer: answer?.text_answer ?? null,
                wordCount: answer?.word_count != null ? Number(answer.word_count) : countWords(answer?.text_answer),
                awardedMarks: showMarks && answer?.awarded_marks != null ? Number(answer.awarded_marks) : null,
                feedback: showFeedback ? answer?.feedback ?? null : null,
                modelSolution: showSolutions
                    ? (q.modelSolution ?? q.expectedAnswerGuidance ?? null)
                    : undefined,
            };
        }),
    };
    // Strip undefined modelSolution keys when not shown so leak check stays clean
    for (const q of payload.questions) {
        if (q.modelSolution === undefined)
            delete q.modelSolution;
    }
    assertNoAnswerLeak({
        ...payload,
        questions: payload.questions.map(({ modelSolution: _m, ...rest }) => rest),
    }, 'student-submission-result');
    // When solutions are released, modelSolution is intentionally present for the student.
    if (!showSolutions) {
        assertNoAnswerLeak(payload, 'student-submission-result');
    }
    return payload;
}
