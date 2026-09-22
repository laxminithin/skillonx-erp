import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { ExamActor } from './access.js';
import { assertExamPermission, assertStudentOwnsResult } from './access.js';
import { assertInstitutionOwnsCapability } from './capabilities.js';
import { recordExamAudit } from './audit.js';
import { correctResult } from './result.js';

export const revaluationSchema = z.object({
  subjectResultId: z.number().int().positive(),
  requestType: z.enum(['RETOTALING', 'REVALUATION', 'PHOTOCOPY']),
  reason: z.string().trim().max(500).optional(),
});

export async function requestRevaluation(
  studentId: number,
  collegeId: number,
  body: z.infer<typeof revaluationSchema>,
) {
  const result = await assertStudentOwnsResult(studentId, body.subjectResultId, collegeId);
  if (!result.published) throw new AppError(400, 'Results are not yet published');
  const existing = await db('exam_revaluation_requests')
    .where({ student_id: studentId, subject_result_id: body.subjectResultId, status: 'REQUESTED' })
    .first();
  if (existing) throw new AppError(400, 'A pending request already exists');
  const [id] = await db('exam_revaluation_requests').insert({
    college_id: collegeId,
    student_id: studentId,
    subject_result_id: body.subjectResultId,
    request_type: body.requestType,
    status: 'REQUESTED',
    reason: body.reason ?? null,
  });
  await recordExamAudit({
    collegeId,
    actorId: studentId,
    actorType: 'STUDENT',
    action: 'REVALUATION_REQUESTED',
    entityType: 'exam_revaluation',
    entityId: Number(id),
    afterState: body,
  });

  try {
    const { createRevaluationFeeDemand } = await import('../finance/integration.js');
    await createRevaluationFeeDemand(collegeId, studentId, Number(id));
  } catch {
    /* finance optional */
  }

  return { id: Number(id), status: 'REQUESTED' };
}

// --- Institution-owned revaluation lifecycle (§29): REQUESTED -> ACCEPTED/REJECTED -> ASSIGNED -> REVALUATED -> COMPLETED ---
const REVAL_FLOW: Record<string, string[]> = {
  REQUESTED: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['ASSIGNED'],
  ASSIGNED: ['REVALUATED'],
  REVALUATED: ['COMPLETED'],
  REJECTED: [],
  COMPLETED: [],
};

async function loadRevaluation(collegeId: number, id: number) {
  const row = await db('exam_revaluation_requests').where({ id, college_id: collegeId }).first();
  if (!row) throw new AppError(404, 'Revaluation request not found');
  return row;
}

// COE reviews the application, validating institution ownership + published result (window/eligibility gate).
export async function reviewRevaluation(actor: ExamActor, id: number, accept: boolean, note?: string) {
  assertExamPermission(actor, 'exam.result.process');
  await assertInstitutionOwnsCapability(actor, 'REVALUATION'); // VTU revaluation is external authority (§30)
  const row = await loadRevaluation(actor.collegeId, id);
  if (String(row.status) !== 'REQUESTED') throw new AppError(409, 'Only a requested revaluation can be reviewed');
  const to = accept ? 'ACCEPTED' : 'REJECTED';
  await db('exam_revaluation_requests').where({ id }).update({ status: to, reviewed_by: actor.facultyUserId, reviewed_at: db.fn.now(), admin_notes: note ?? row.admin_notes, updated_at: db.fn.now() });
  await recordExamAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: `REVALUATION_${to}`, entityType: 'exam_revaluation', entityId: id, beforeState: { status: row.status }, afterState: { status: to }, reason: note });
  return { id, status: to };
}

export async function assignRevaluationExaminer(actor: ExamActor, id: number, examinerId: number) {
  assertExamPermission(actor, 'exam.result.process');
  const row = await loadRevaluation(actor.collegeId, id);
  if (!REVAL_FLOW[String(row.status)]?.includes('ASSIGNED')) throw new AppError(409, 'Revaluation must be ACCEPTED before assignment');
  const examiner = await db('faculty_users').where({ id: examinerId, college_id: actor.collegeId, is_active: true }).first();
  if (!examiner) throw new AppError(404, 'Examiner not found');
  await db('exam_revaluation_requests').where({ id }).update({ status: 'ASSIGNED', examiner_id: examinerId, assigned_at: db.fn.now(), updated_at: db.fn.now() });
  await recordExamAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'REVALUATION_ASSIGNED', entityType: 'exam_revaluation', entityId: id, afterState: { examinerId } });
  return { id, status: 'ASSIGNED', examinerId };
}

// Only the assigned examiner may submit revised marks.
export async function submitRevaluation(actor: ExamActor, id: number, revisedMarks: number, revisedMax: number) {
  const row = await loadRevaluation(actor.collegeId, id);
  if (String(row.status) !== 'ASSIGNED') throw new AppError(409, 'Revaluation is not awaiting examiner submission');
  if (Number(row.examiner_id) !== actor.facultyUserId) throw new AppError(403, 'You are not the assigned examiner');
  if (revisedMarks < 0 || revisedMax <= 0 || revisedMarks > revisedMax) throw new AppError(400, 'Revised marks must be within [0, max]');
  await db('exam_revaluation_requests').where({ id }).update({ status: 'REVALUATED', revised_marks: revisedMarks, revised_max: revisedMax, revaluated_at: db.fn.now(), updated_at: db.fn.now() });
  await recordExamAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'REVALUATION_SUBMITTED', entityType: 'exam_revaluation', entityId: id, afterState: { revisedMarks, revisedMax } });
  return { id, status: 'REVALUATED', revisedMarks };
}

// COE decides: REVISED produces a governed versioned result consequence via correctResult; UNCHANGED closes with no change.
export async function decideRevaluation(actor: ExamActor, id: number, decision: 'REVISED' | 'UNCHANGED', reason: string) {
  assertExamPermission(actor, 'exam.result.publish');
  await assertInstitutionOwnsCapability(actor, 'REVALUATION');
  const row = await loadRevaluation(actor.collegeId, id);
  if (String(row.status) !== 'REVALUATED') throw new AppError(409, 'Revaluation must be REVALUATED before a decision');
  if (!reason?.trim()) throw new AppError(400, 'Decision reason is required');
  let newSemesterResultId: number | null = null;
  if (decision === 'REVISED') {
    const subject = await db('subject_results').where({ id: row.subject_result_id, college_id: actor.collegeId }).first();
    if (!subject) throw new AppError(404, 'Subject result not found for this revaluation');
    const corrected = await correctResult(actor, Number(subject.semester_result_id), {
      reason: `Revaluation #${id}: ${reason}`,
      subjectCorrections: [{ courseId: Number(subject.course_id), totalMarks: Number(row.revised_marks), maxMarks: Number(row.revised_max) }],
    });
    newSemesterResultId = corrected.newSemesterResultId;
  }
  await db('exam_revaluation_requests').where({ id }).update({ status: 'COMPLETED', decision, decision_reason: reason, new_semester_result_id: newSemesterResultId, processed_by: actor.facultyUserId, processed_at: db.fn.now(), completed_at: db.fn.now(), updated_at: db.fn.now() });
  await recordExamAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'REVALUATION_DECIDED', entityType: 'exam_revaluation', entityId: id, afterState: { decision, newSemesterResultId }, reason });
  return { id, status: 'COMPLETED', decision, newSemesterResultId };
}

export async function studentRevaluationOutcomes(studentId: number, collegeId: number) {
  const rows = await db('exam_revaluation_requests as r')
    .join('subject_results as sr', 'sr.id', 'r.subject_result_id')
    .join('courses as c', 'c.id', 'sr.course_id')
    .where({ 'r.student_id': studentId, 'r.college_id': collegeId })
    .select('r.*', 'c.code as course_code', 'c.name as course_name')
    .orderBy('r.created_at', 'desc');
  return rows.map((r) => ({
    id: Number(r.id),
    courseCode: r.course_code,
    courseName: r.course_name,
    requestType: r.request_type,
    status: r.status,
    decision: r.decision,
    decisionReason: r.decision_reason,
    revisedMarks: r.revised_marks != null ? Number(r.revised_marks) : null,
    completedAt: r.completed_at,
  }));
}

export async function listRevaluationRequests(collegeId: number, status?: string) {
  let q = db('exam_revaluation_requests as r')
    .join('students as s', 's.id', 'r.student_id')
    .join('subject_results as sr', 'sr.id', 'r.subject_result_id')
    .join('courses as c', 'c.id', 'sr.course_id')
    .where('r.college_id', collegeId)
    .select('r.*', 's.name as student_name', 's.usn', 'c.code as course_code', 'c.name as course_name');
  if (status) q = q.andWhere('r.status', status);
  const rows = await q.orderBy('r.created_at', 'desc');
  return rows.map((r) => ({
    id: Number(r.id),
    studentId: Number(r.student_id),
    studentName: r.student_name,
    usn: r.usn,
    courseCode: r.course_code,
    courseName: r.course_name,
    requestType: r.request_type,
    status: r.status,
    reason: r.reason,
    createdAt: r.created_at,
  }));
}
