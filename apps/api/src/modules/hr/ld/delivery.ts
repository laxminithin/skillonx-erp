/**
 * Employee L&D — training attendance, completion, certificates, effectiveness.
 *
 * L&D training attendance lives ONLY in ld_attendance and NEVER writes to HR
 * attendance (punches / daily / monthly / LOP / leave). Completion is
 * server-derived from the program's completion rule.
 */
import { db } from '../../../db/index.js';
import { AppError } from '../../../utils/errors.js';
import type { Knex } from 'knex';
import type { HrActor } from '../types.js';
import { recordHrAudit } from '../audit.js';
import { notifyEmployee } from '../notifications.js';
import {
  assertHrPermission,
  hasHrPermission,
  requireSelfEmployee,
  selfEmployee,
  employeeInCollege,
  programInCollege,
  assertManagesEmployee,
  assertTrainerForProgram,
  isSelf,
  parseJson,
} from './access.js';
import type { z } from 'zod';
import type { attendanceSchema, completionSchema, certificateIssueSchema, externalCertSchema, certVerifySchema, feedbackSchema, managerReviewSchema } from './types.js';

// ── Attendance (isolated from HR attendance) ─────────────────────────────────
export async function recordAttendance(actor: HrActor, programId: number, input: z.infer<typeof attendanceSchema>) {
  const program = await programInCollege(actor, programId);
  await assertTrainerForProgram(actor, program);
  if (input.sessionId != null) {
    const session = await db('ld_program_sessions').where({ id: input.sessionId, program_id: programId }).first();
    if (!session) throw new AppError(404, 'Session not found for this program');
  }

  const results: Array<{ employeeId: number; status: string }> = [];
  for (const entry of input.entries) {
    // Guard: employee must belong to this college (tenant isolation).
    const emp = await db('employees').where({ id: entry.employeeId, college_id: actor.collegeId }).first();
    if (!emp) continue;
    const existing = await db('ld_attendance')
      .where({ college_id: actor.collegeId, program_id: programId, session_id: input.sessionId ?? null, employee_id: entry.employeeId })
      .first();
    if (existing?.finalized) throw new AppError(409, 'Finalized attendance cannot be modified');
    const enrollment = await db('ld_enrollments').where({ college_id: actor.collegeId, program_id: programId, employee_id: entry.employeeId }).first();
    if (existing) {
      await db('ld_attendance').where({ id: existing.id }).update({ status: entry.status, recorded_by: actor.facultyUserId, recorded_at: db.fn.now(), updated_at: db.fn.now() });
    } else {
      await db('ld_attendance').insert({
        college_id: actor.collegeId, program_id: programId, session_id: input.sessionId ?? null,
        employee_id: entry.employeeId, enrollment_id: enrollment?.id ?? null, status: entry.status,
        recorded_by: actor.facultyUserId,
      });
    }
    results.push({ employeeId: entry.employeeId, status: entry.status });
  }
  await recordHrAudit({ actor, action: 'LD_ATTENDANCE_RECORDED', entityType: 'ld_programs', entityId: programId, after: { count: results.length, sessionId: input.sessionId ?? null } });
  return { programId, recorded: results.length };
}

export async function finalizeAttendance(actor: HrActor, programId: number, sessionId?: number | null) {
  const program = await programInCollege(actor, programId);
  await assertTrainerForProgram(actor, program);
  const q = db('ld_attendance').where({ college_id: actor.collegeId, program_id: programId });
  if (sessionId != null) q.where('session_id', sessionId);
  const n = await q.update({ finalized: true, updated_at: db.fn.now() });
  await recordHrAudit({ actor, action: 'LD_ATTENDANCE_FINALIZED', entityType: 'ld_programs', entityId: programId, after: { sessionId: sessionId ?? null } });
  return { programId, finalized: n };
}

async function attendancePct(collegeId: number, programId: number, employeeId: number): Promise<number> {
  const rows = await db('ld_attendance').where({ college_id: collegeId, program_id: programId, employee_id: employeeId });
  const required = rows.filter((r) => r.status !== 'NOT_REQUIRED');
  if (required.length === 0) return 0;
  const present = required.filter((r) => r.status === 'PRESENT' || r.status === 'EXCUSED').length;
  return Math.round((present / required.length) * 10000) / 100;
}

// ── Completion (server-derived) ──────────────────────────────────────────────
export async function recordCompletion(actor: HrActor, programId: number, input: z.infer<typeof completionSchema>) {
  const program = await programInCollege(actor, programId);
  await assertTrainerForProgram(actor, program);
  const emp = await employeeInCollege(actor, input.employeeId);

  const existing = await db('ld_completions').where({ college_id: actor.collegeId, program_id: programId, employee_id: emp.id }).first();
  if (existing) return { id: Number(existing.id), result: existing.result, idempotent: true };

  const enrollment = await db('ld_enrollments').where({ college_id: actor.collegeId, program_id: programId, employee_id: emp.id }).first();
  if (!enrollment || !['CONFIRMED', 'COMPLETED'].includes(String(enrollment.status))) {
    throw new AppError(409, 'Employee has no confirmed enrollment in this program');
  }

  const rule = (parseJson(program.completion_rule) as {
    attendanceThreshold?: number;
    requireAssessment?: boolean;
    assessmentPassMark?: number;
    requireMandatorySessions?: boolean;
  } | null) ?? {};

  const pct = await attendancePct(actor.collegeId, programId, emp.id);

  // Mandatory-session rule: every mandatory session must have a PRESENT/EXCUSED record.
  if (rule.requireMandatorySessions) {
    const sessions = await db('ld_program_sessions').where({ program_id: programId, is_mandatory: true });
    for (const s of sessions) {
      const att = await db('ld_attendance').where({ program_id: programId, session_id: s.id, employee_id: emp.id }).first();
      if (!att || !['PRESENT', 'EXCUSED'].includes(String(att.status))) {
        throw new AppError(409, 'Mandatory session attendance is incomplete; cannot record completion');
      }
    }
  }
  if (rule.attendanceThreshold != null && pct < rule.attendanceThreshold) {
    throw new AppError(409, `Attendance ${pct}% is below the required ${rule.attendanceThreshold}%`);
  }
  let assessmentPassed: boolean | null = null;
  if (rule.requireAssessment) {
    const pass = rule.assessmentPassMark ?? 40;
    if (input.assessmentScore == null) throw new AppError(409, 'Assessment score required for completion');
    assessmentPassed = input.assessmentScore >= pass;
    if (!assessmentPassed) throw new AppError(409, `Assessment score ${input.assessmentScore} is below pass mark ${pass}`);
  }

  // A failing assessment already threw above, so reaching here means a pass.
  const result = rule.requireAssessment ? 'PASSED' : 'COMPLETED';
  const [id] = await db('ld_completions').insert({
    college_id: actor.collegeId, program_id: programId, employee_id: emp.id, enrollment_id: enrollment.id,
    result, attendance_pct: pct, assessment_score: input.assessmentScore ?? null, assessment_passed: assessmentPassed,
    grade: input.grade ?? null, confirmed_by: actor.facultyUserId,
  });
  await db('ld_enrollments').where({ id: enrollment.id }).update({ completion_status: 'COMPLETED', updated_at: db.fn.now() });
  await recordHrAudit({ actor, action: 'LD_COMPLETION_RECORDED', entityType: 'ld_completions', entityId: id });
  await notifyEmployee({ employeeId: emp.id, collegeId: actor.collegeId, type: 'LD_COMPLETED', title: 'Training completed', relatedType: 'ld_programs', relatedId: programId, dedupeKey: `ld-comp-${programId}-${emp.id}` });
  return { id: Number(id), result, attendancePct: pct };
}

// ── Certificates ─────────────────────────────────────────────────────────────
async function nextCertNumber(trx: Knex.Transaction, collegeId: number): Promise<string> {
  const year = new Date().getFullYear();
  const series = 'LD';
  let seq = await trx('certificate_number_sequences').where({ college_id: collegeId, series_code: series, year }).forUpdate().first();
  if (!seq) {
    await trx('certificate_number_sequences').insert({ college_id: collegeId, series_code: series, year, last_number: 1 });
    seq = { last_number: 1 };
  } else {
    await trx('certificate_number_sequences').where({ college_id: collegeId, series_code: series, year }).update({ last_number: Number(seq.last_number) + 1, updated_at: trx.fn.now() });
    seq.last_number = Number(seq.last_number) + 1;
  }
  return `${series}/${year}/${String(seq.last_number).padStart(5, '0')}`;
}

export async function issueCertificate(actor: HrActor, programId: number, input: z.infer<typeof certificateIssueSchema>) {
  assertHrPermission(actor, 'hr.ld.manage');
  const program = await programInCollege(actor, programId);
  const emp = await employeeInCollege(actor, input.employeeId);
  const completion = await db('ld_completions').where({ college_id: actor.collegeId, program_id: programId, employee_id: emp.id }).first();
  if (!completion || completion.result === 'FAILED') throw new AppError(409, 'A passing completion is required before issuing a certificate');

  return db.transaction(async (trx) => {
    const existing = await trx('ld_certificates')
      .where({ college_id: actor.collegeId, program_id: programId, employee_id: emp.id, certificate_type: 'INTERNAL' })
      .first();
    if (existing) return { id: Number(existing.id), certificateNumber: existing.certificate_number, idempotent: true };

    const course = program.course_id ? await trx('ld_courses').where({ id: program.course_id }).first() : null;
    const issuedOn = new Date().toISOString().slice(0, 10);
    let expiresOn: string | null = null;
    if (course?.validity_months) {
      const d = new Date(`${issuedOn}T00:00:00Z`);
      d.setUTCMonth(d.getUTCMonth() + Number(course.validity_months));
      expiresOn = d.toISOString().slice(0, 10);
    }
    const number = await nextCertNumber(trx, actor.collegeId);
    const [id] = await trx('ld_certificates').insert({
      college_id: actor.collegeId, employee_id: emp.id, program_id: programId, completion_id: completion.id,
      certificate_type: 'INTERNAL', certificate_number: number, title: input.title ?? program.title,
      provider: program.provider_type === 'INTERNAL' ? 'Institution' : null, issued_on: issuedOn, expires_on: expiresOn,
      status: 'ISSUED',
    });
    await recordHrAudit({ actor, action: 'LD_CERTIFICATE_ISSUED', entityType: 'ld_certificates', entityId: id });
    await notifyEmployee({ employeeId: emp.id, collegeId: actor.collegeId, type: 'LD_CERTIFICATE', title: 'Training certificate issued', relatedType: 'ld_certificates', relatedId: Number(id), dedupeKey: `ld-cert-${programId}-${emp.id}` });
    return { id: Number(id), certificateNumber: number, issuedOn, expiresOn };
  });
}

export async function submitExternalCertificate(actor: HrActor, input: z.infer<typeof externalCertSchema>) {
  assertHrPermission(actor, 'hr.ld.self');
  const self = await requireSelfEmployee(actor);
  const [id] = await db('ld_certificates').insert({
    college_id: actor.collegeId, employee_id: self.id, program_id: input.programId ?? null, certificate_type: 'EXTERNAL',
    title: input.title, provider: input.provider ?? null, issued_on: input.issuedOn ?? null, expires_on: input.expiresOn ?? null,
    file_reference: input.fileReference ?? null, status: 'SUBMITTED',
  });
  await recordHrAudit({ actor, action: 'LD_EXTERNAL_CERT_SUBMITTED', entityType: 'ld_certificates', entityId: id });
  return { id, status: 'SUBMITTED' };
}

export async function verifyCertificate(actor: HrActor, certId: number, input: z.infer<typeof certVerifySchema>) {
  assertHrPermission(actor, 'hr.ld.manage');
  const cert = await db('ld_certificates').where({ id: certId, college_id: actor.collegeId }).first();
  if (!cert) throw new AppError(404, 'Certificate not found');
  if (cert.certificate_type !== 'EXTERNAL') throw new AppError(409, 'Only external certificates require verification');
  if (['VERIFIED', 'REJECTED'].includes(String(cert.status))) return { id: certId, status: cert.status, idempotent: true };
  await db('ld_certificates').where({ id: certId }).update({
    status: input.decision, verified_by: actor.facultyUserId, verified_at: db.fn.now(),
    reject_reason: input.decision === 'REJECTED' ? input.reason ?? null : null, updated_at: db.fn.now(),
  });
  await recordHrAudit({ actor, action: `LD_CERT_${input.decision}`, entityType: 'ld_certificates', entityId: certId, reason: input.reason });
  return { id: certId, status: input.decision };
}

export async function listMyCertificates(actor: HrActor) {
  assertHrPermission(actor, 'hr.ld.self');
  const self = await selfEmployee(actor);
  if (!self) return [];
  return db('ld_certificates').where({ college_id: actor.collegeId, employee_id: self.id }).orderBy('issued_on', 'desc');
}

export async function getCertificate(actor: HrActor, certId: number) {
  assertHrPermission(actor, 'hr.ld.self');
  const cert = await db('ld_certificates').where({ id: certId, college_id: actor.collegeId }).first();
  if (!cert) throw new AppError(404, 'Certificate not found');
  const self = await selfEmployee(actor);
  if (isSelf(self, Number(cert.employee_id))) return cert;
  // Otherwise require management scope over the certificate owner.
  const owner = await employeeInCollege(actor, Number(cert.employee_id));
  await assertManagesEmployee(actor, owner);
  return cert;
}

// ── Effectiveness ────────────────────────────────────────────────────────────
export async function submitFeedback(actor: HrActor, input: z.infer<typeof feedbackSchema>) {
  assertHrPermission(actor, 'hr.ld.self');
  const self = await requireSelfEmployee(actor);
  await programInCollege(actor, input.programId);
  const enrollment = await db('ld_enrollments').where({ college_id: actor.collegeId, program_id: input.programId, employee_id: self.id }).first();
  const existing = await db('ld_effectiveness').where({ college_id: actor.collegeId, program_id: input.programId, employee_id: self.id, kind: 'EMPLOYEE_FEEDBACK' }).first();
  if (existing) return { id: Number(existing.id), idempotent: true };
  const [id] = await db('ld_effectiveness').insert({
    college_id: actor.collegeId, program_id: input.programId, employee_id: self.id, enrollment_id: enrollment?.id ?? null,
    kind: 'EMPLOYEE_FEEDBACK', rating: input.rating ?? null, relevance_rating: input.relevanceRating ?? null,
    learning_gained: input.learningGained ?? null, comments: input.comments ?? null, created_by: actor.facultyUserId,
  });
  return { id: Number(id) };
}

export async function managerReview(actor: HrActor, input: z.infer<typeof managerReviewSchema>) {
  assertHrPermission(actor, 'hr.ld.nominate');
  await programInCollege(actor, input.programId);
  const emp = await employeeInCollege(actor, input.employeeId);
  await assertManagesEmployee(actor, emp); // cross-department blocked
  const enrollment = await db('ld_enrollments').where({ college_id: actor.collegeId, program_id: input.programId, employee_id: emp.id }).first();
  const existing = await db('ld_effectiveness').where({ college_id: actor.collegeId, program_id: input.programId, employee_id: emp.id, kind: 'MANAGER_REVIEW' }).first();
  if (existing) {
    await db('ld_effectiveness').where({ id: existing.id }).update({
      improvement_observed: input.improvementObserved ?? existing.improvement_observed,
      objective_met: input.objectiveMet ?? existing.objective_met,
      follow_up_required: input.followUpRequired ?? existing.follow_up_required,
      comments: input.comments ?? existing.comments, updated_at: db.fn.now(),
    });
    return { id: Number(existing.id), updated: true };
  }
  const [id] = await db('ld_effectiveness').insert({
    college_id: actor.collegeId, program_id: input.programId, employee_id: emp.id, enrollment_id: enrollment?.id ?? null,
    kind: 'MANAGER_REVIEW', improvement_observed: input.improvementObserved ?? null, objective_met: input.objectiveMet ?? null,
    follow_up_required: input.followUpRequired ?? null, comments: input.comments ?? null, created_by: actor.facultyUserId,
  });
  await recordHrAudit({ actor, action: 'LD_MANAGER_REVIEW', entityType: 'ld_effectiveness', entityId: id });
  return { id: Number(id) };
}
