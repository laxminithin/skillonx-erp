import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { recordServicesAudit } from '../studentServices/audit.js';
import { assertMentorOf } from './permissions.js';
import type { MentoringActor } from './types.js';
import type { z } from 'zod';
import type {
  createEscalationSchema,
  resolveEscalationSchema,
  createReferralSchema,
  closeReferralSchema,
  createParentInteractionSchema,
} from './types.js';

type Row = Record<string, unknown>;

// ── Escalations ─────────────────────────────────────────────────────────

export async function createEscalation(actor: MentoringActor, input: z.infer<typeof createEscalationSchema>) {
  await assertMentorOf(actor, input.studentId);
  const student = await db('students').where({ id: input.studentId, college_id: actor.collegeId }).first();
  if (!student) throw new AppError(404, 'Student not found');

  const [id] = await db('mentoring_escalations').insert({
    college_id: actor.collegeId,
    student_id: input.studentId,
    department_id: student.department_id ?? null,
    mentor_faculty_id: actor.facultyUserId,
    meeting_id: input.meetingId ?? null,
    reason_code: input.reasonCode,
    reason: input.reason,
    target_level: input.targetLevel ?? 'HOD',
    status: 'OPEN',
    initiated_by_faculty_id: actor.facultyUserId,
  });

  await recordServicesAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    actorType: 'FACULTY',
    actorName: actor.name,
    action: 'MENTORING_ESCALATION_CREATED',
    entityType: 'mentoring_escalation',
    entityId: Number(id),
    afterState: { studentId: input.studentId, targetLevel: input.targetLevel ?? 'HOD', reasonCode: input.reasonCode },
  });

  return { id: Number(id), status: 'OPEN' };
}

/** Escalations raised by the acting mentor. */
export async function listMentorEscalations(actor: MentoringActor) {
  const rows = await db('mentoring_escalations as e')
    .join('students as s', 's.id', 'e.student_id')
    .where({ 'e.mentor_faculty_id': actor.facultyUserId, 'e.college_id': actor.collegeId })
    .orderBy('e.created_at', 'desc')
    .select('e.*', 's.name as student_name', 's.usn');
  return rows.map(serializeEscalation);
}

/** Escalations targeted at leadership scope (HOD department / Principal institution). */
export async function listLeadershipEscalations(
  actor: MentoringActor,
  opts: { departmentIds: number[] | null; level?: 'HOD' | 'PRINCIPAL'; status?: string },
) {
  let q = db('mentoring_escalations as e')
    .join('students as s', 's.id', 'e.student_id')
    .leftJoin('faculty_users as f', 'f.id', 'e.mentor_faculty_id')
    .leftJoin('departments as d', 'd.id', 'e.department_id')
    .where('e.college_id', actor.collegeId);
  if (opts.departmentIds !== null) {
    if (opts.departmentIds.length === 0) return [];
    q = q.whereIn('e.department_id', opts.departmentIds);
  }
  if (opts.level) q = q.where('e.target_level', opts.level);
  if (opts.status) q = q.where('e.status', opts.status);
  const rows = await q
    .orderBy('e.created_at', 'desc')
    .select('e.*', 's.name as student_name', 's.usn', 'f.name as mentor_name', 'd.name as department_name');
  return rows.map(serializeEscalation);
}

export async function resolveEscalation(
  actor: MentoringActor,
  escalationId: number,
  departmentIds: number[] | null,
  input: z.infer<typeof resolveEscalationSchema>,
) {
  const e = await db('mentoring_escalations').where({ id: escalationId, college_id: actor.collegeId }).first();
  if (!e) throw new AppError(404, 'Escalation not found');
  // Department scope guard (Principal / admin pass with departmentIds === null).
  if (departmentIds !== null && (departmentIds.length === 0 || !departmentIds.includes(Number(e.department_id)))) {
    throw new AppError(403, 'Escalation is outside your department scope');
  }

  const patch: Row = { updated_at: db.fn.now() };
  let auditAction = 'MENTORING_ESCALATION_UPDATED';
  switch (input.action) {
    case 'ACKNOWLEDGE':
      patch.status = 'ACKNOWLEDGED';
      patch.acknowledged_at = db.fn.now();
      patch.assigned_faculty_id = actor.facultyUserId;
      auditAction = 'MENTORING_ESCALATION_ACKNOWLEDGED';
      break;
    case 'RETURN':
      patch.status = 'RETURNED';
      patch.resolution = input.resolution ?? null;
      auditAction = 'MENTORING_ESCALATION_RETURNED';
      break;
    case 'RESOLVE':
      patch.status = 'RESOLVED';
      patch.resolution = input.resolution ?? null;
      patch.resolved_at = db.fn.now();
      patch.resolved_by_faculty_id = actor.facultyUserId;
      auditAction = 'MENTORING_ESCALATION_RESOLVED';
      break;
    case 'ESCALATE_PRINCIPAL':
      patch.target_level = 'PRINCIPAL';
      patch.status = 'OPEN';
      auditAction = 'MENTORING_ESCALATION_TO_PRINCIPAL';
      break;
  }

  await db('mentoring_escalations').where({ id: escalationId }).update(patch);
  await recordServicesAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    actorType: 'FACULTY',
    actorName: actor.name,
    action: auditAction,
    entityType: 'mentoring_escalation',
    entityId: escalationId,
    beforeState: { status: e.status, targetLevel: e.target_level },
    afterState: patch,
  });
  return { id: escalationId, status: patch.status ?? e.status, targetLevel: patch.target_level ?? e.target_level };
}

function serializeEscalation(e: Row) {
  return {
    id: Number(e.id),
    studentId: Number(e.student_id),
    studentName: e.student_name,
    usn: e.usn,
    mentorName: e.mentor_name ?? null,
    department: e.department_name ?? null,
    reasonCode: e.reason_code,
    reason: e.reason,
    targetLevel: e.target_level,
    status: e.status,
    resolution: e.resolution ?? null,
    createdAt: e.created_at,
    acknowledgedAt: e.acknowledged_at ?? null,
    resolvedAt: e.resolved_at ?? null,
  };
}

// ── Referrals ─────────────────────────────────────────────────────────

export async function createReferral(actor: MentoringActor, input: z.infer<typeof createReferralSchema>) {
  await assertMentorOf(actor, input.studentId);
  const [id] = await db('mentoring_referrals').insert({
    college_id: actor.collegeId,
    student_id: input.studentId,
    mentor_faculty_id: actor.facultyUserId,
    target_function: input.targetFunction,
    subject: input.subject,
    context: input.context ?? null,
    status: 'OPEN',
    created_by_faculty_id: actor.facultyUserId,
  });
  await recordServicesAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    actorType: 'FACULTY',
    actorName: actor.name,
    action: 'MENTORING_REFERRAL_CREATED',
    entityType: 'mentoring_referral',
    entityId: Number(id),
    afterState: { studentId: input.studentId, targetFunction: input.targetFunction },
  });
  return { id: Number(id), status: 'OPEN' };
}

export async function listReferrals(actor: MentoringActor, studentId: number) {
  await assertMentorOf(actor, studentId);
  const rows = await db('mentoring_referrals')
    .where({ student_id: studentId, college_id: actor.collegeId })
    .orderBy('created_at', 'desc');
  return rows.map((r) => ({
    id: Number(r.id),
    targetFunction: r.target_function,
    subject: r.subject,
    context: r.context ?? null,
    status: r.status,
    outcome: r.outcome ?? null,
    createdAt: r.created_at,
  }));
}

export async function closeReferral(actor: MentoringActor, referralId: number, input: z.infer<typeof closeReferralSchema>) {
  const r = await db('mentoring_referrals').where({ id: referralId, college_id: actor.collegeId }).first();
  if (!r) throw new AppError(404, 'Referral not found');
  await assertMentorOf(actor, Number(r.student_id));
  await db('mentoring_referrals').where({ id: referralId }).update({
    status: 'CLOSED',
    outcome: input.outcome ?? null,
    closed_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  await recordServicesAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    actorType: 'FACULTY',
    actorName: actor.name,
    action: 'MENTORING_REFERRAL_CLOSED',
    entityType: 'mentoring_referral',
    entityId: referralId,
  });
  return { id: referralId, status: 'CLOSED' };
}

// ── Parent / guardian interactions ────────────────────────────────────

export async function createParentInteraction(actor: MentoringActor, input: z.infer<typeof createParentInteractionSchema>) {
  await assertMentorOf(actor, input.studentId);
  const [id] = await db('mentoring_parent_interactions').insert({
    college_id: actor.collegeId,
    student_id: input.studentId,
    mentor_faculty_id: actor.facultyUserId,
    interaction_date: input.interactionDate,
    mode: input.mode ?? 'PHONE',
    initiated_by: input.initiatedBy ?? 'MENTOR',
    purpose: input.purpose,
    summary: input.summary ?? null,
    agreed_follow_up: input.agreedFollowUp ?? null,
    visibility: input.visibility ?? 'MENTORING_TEAM',
    created_by_faculty_id: actor.facultyUserId,
  });
  await recordServicesAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    actorType: 'FACULTY',
    actorName: actor.name,
    action: 'MENTORING_PARENT_INTERACTION_CREATED',
    entityType: 'mentoring_parent_interaction',
    entityId: Number(id),
    afterState: { studentId: input.studentId, mode: input.mode ?? 'PHONE' },
  });
  return { id: Number(id) };
}

export async function listParentInteractions(actor: MentoringActor, studentId: number) {
  await assertMentorOf(actor, studentId);
  const rows = await db('mentoring_parent_interactions')
    .where({ student_id: studentId, college_id: actor.collegeId })
    .orderBy('interaction_date', 'desc');
  return rows.map((r) => ({
    id: Number(r.id),
    interactionDate: r.interaction_date,
    mode: r.mode,
    initiatedBy: r.initiated_by,
    purpose: r.purpose,
    summary: r.summary ?? null,
    agreedFollowUp: r.agreed_follow_up ?? null,
    visibility: r.visibility,
    createdAt: r.created_at,
  }));
}
