/**
 * Succession Planning — succession slates: successor nomination + approval,
 * readiness-review history, development actions, and succession events.
 *
 * Nomination is idempotent + concurrency-safe (unique role+employee, row locks).
 * Never mutates designation, payroll or frozen L&D/appraisal records.
 */
import { db } from '../../../db/index.js';
import { AppError } from '../../../utils/errors.js';
import type { HrActor } from '../types.js';
import { recordHrAudit } from '../audit.js';
import { notifyEmployee } from '../notifications.js';
import {
  assertHrPermission, hasHrPermission, employeeInCollege, assertManagesEmployee, selfEmployee, isSelf,
  successionScope, assertRoleVisible, assertNominable, rowInCollege,
} from './access.js';
import { CANDIDATE_TRANSITIONS, canTransition } from './types.js';
import type { z } from 'zod';
import type { nominateSchema, readinessReviewSchema, devActionSchema, devActionStatusSchema, eventSchema, eventDecisionSchema } from './types.js';

// ── Successor nomination ─────────────────────────────────────────────────────
export async function nominate(actor: HrActor, input: z.infer<typeof nominateSchema>) {
  assertHrPermission(actor, 'hr.succession.nominate');
  const role = await rowInCollege(actor, 'succession_critical_roles', input.criticalRoleId);
  assertRoleVisible(actor, role);
  const emp = await employeeInCollege(actor, input.employeeId);
  assertNominable(emp);

  // A nominee may not nominate themselves.
  const self = await selfEmployee(actor);
  if (isSelf(self, emp.id)) throw new AppError(403, 'You cannot nominate yourself as a successor');
  // HOD/manager may only nominate within their scope (HR-wide bypasses).
  if (!hasHrPermission(actor, 'hr.succession.manage')) await assertManagesEmployee(actor, emp);

  const source = hasHrPermission(actor, 'hr.succession.manage') ? 'HR' : actor.role === 'PRINCIPAL' ? 'PRINCIPAL' : actor.role === 'HOD' ? 'HOD' : 'MANAGER';

  try {
    const [id] = await db('succession_candidates').insert({
      college_id: actor.collegeId, critical_role_id: role.id, employee_id: emp.id,
      nomination_source: source, nominated_by: actor.facultyUserId, nominated_at: db.fn.now(),
      readiness: input.readiness, rank: input.rank ?? null, strengths: input.strengths ?? null, development_gaps: input.developmentGaps ?? null,
      status: 'NOMINATED',
    });
    await recordHrAudit({ actor, action: 'SUCCESSION_NOMINATED', entityType: 'succession_candidates', entityId: id });
    return { id, status: 'NOMINATED' };
  } catch (e) {
    // Unique(college, role, employee) → duplicate nomination is idempotent.
    const existing = await db('succession_candidates').where({ college_id: actor.collegeId, critical_role_id: role.id, employee_id: emp.id }).first();
    if (existing) return { id: Number(existing.id), status: existing.status, idempotent: true };
    throw e;
  }
}

export async function decideCandidate(actor: HrActor, candidateId: number, decision: 'APPROVE' | 'REJECT', remarks?: string) {
  assertHrPermission(actor, 'hr.succession.approve');
  const self = await selfEmployee(actor);
  return db.transaction(async (trx) => {
    const cand = await trx('succession_candidates').where({ id: candidateId, college_id: actor.collegeId }).forUpdate().first();
    if (!cand) throw new AppError(404, 'Candidate not found');
    // Separation of duties: cannot approve one's own nomination nor one's own candidacy.
    if (Number(cand.nominated_by) === actor.facultyUserId) throw new AppError(403, 'You cannot approve a nomination you created');
    if (isSelf(self, Number(cand.employee_id))) throw new AppError(403, 'You cannot approve your own candidacy');

    const target = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    if (cand.status === target) return { id: candidateId, status: target, idempotent: true };
    if (!canTransition(CANDIDATE_TRANSITIONS, String(cand.status), target)) {
      throw new AppError(409, `Invalid candidate transition ${cand.status} → ${target}`);
    }
    const patch: Record<string, unknown> = { status: target, decision_remarks: remarks ?? null, updated_at: trx.fn.now() };
    if (decision === 'APPROVE') { patch.approved_by = actor.facultyUserId; patch.approved_at = trx.fn.now(); }
    else { patch.rejected_by = actor.facultyUserId; patch.rejected_at = trx.fn.now(); }
    await trx('succession_candidates').where({ id: candidateId }).update(patch);
    await recordHrAudit({ actor, action: `SUCCESSION_CANDIDATE_${target}`, entityType: 'succession_candidates', entityId: candidateId, before: { status: cand.status }, after: { status: target }, reason: remarks });
    return { id: candidateId, status: target };
  });
}

export async function withdrawCandidate(actor: HrActor, candidateId: number) {
  assertHrPermission(actor, 'hr.succession.nominate');
  const cand = await rowInCollege(actor, 'succession_candidates', candidateId);
  const manages = hasHrPermission(actor, 'hr.succession.manage') || Number(cand.nominated_by) === actor.facultyUserId;
  if (!manages) throw new AppError(403, 'Only the nominator or HR may withdraw this nomination');
  if (['WITHDRAWN', 'REJECTED'].includes(String(cand.status))) return { id: candidateId, status: cand.status, idempotent: true };
  await db('succession_candidates').where({ id: candidateId }).update({ status: 'WITHDRAWN', updated_at: db.fn.now() });
  await recordHrAudit({ actor, action: 'SUCCESSION_CANDIDATE_WITHDRAWN', entityType: 'succession_candidates', entityId: candidateId });
  return { id: candidateId, status: 'WITHDRAWN' };
}

export async function listCandidates(actor: HrActor, roleId: number) {
  assertHrPermission(actor, 'hr.succession.view');
  const role = await rowInCollege(actor, 'succession_critical_roles', roleId);
  assertRoleVisible(actor, role);
  return db('succession_candidates as c').join('employees as e', 'e.id', 'c.employee_id')
    .where({ 'c.college_id': actor.collegeId, 'c.critical_role_id': roleId })
    .orderByRaw("FIELD(c.readiness,'READY_NOW','READY_1_YEAR','READY_2_YEARS','DEVELOPING','NOT_READY'), c.rank")
    .select('c.id', 'c.employee_id', 'e.display_name', 'e.department_id', 'c.readiness', 'c.rank', 'c.status', 'c.strengths', 'c.development_gaps', 'e.employment_status');
}

// ── Readiness reviews (append-only history) ──────────────────────────────────
export async function reviewReadiness(actor: HrActor, candidateId: number, input: z.infer<typeof readinessReviewSchema>) {
  assertHrPermission(actor, 'hr.succession.assess');
  const cand = await rowInCollege(actor, 'succession_candidates', candidateId);
  const previous = String(cand.readiness);
  const [reviewId] = await db('succession_readiness_reviews').insert({
    college_id: actor.collegeId, candidate_id: cand.id, critical_role_id: cand.critical_role_id, employee_id: cand.employee_id,
    previous_readiness: previous, new_readiness: input.newReadiness, review_date: db.fn.now(),
    reviewer_faculty_id: actor.facultyUserId, development_gaps: input.developmentGaps ?? null, comments: input.comments ?? null,
  });
  await db('succession_candidates').where({ id: candidateId }).update({ readiness: input.newReadiness, development_gaps: input.developmentGaps ?? cand.development_gaps, updated_at: db.fn.now() });
  await recordHrAudit({ actor, action: 'SUCCESSION_READINESS_REVIEWED', entityType: 'succession_candidates', entityId: candidateId, before: { readiness: previous }, after: { readiness: input.newReadiness } });
  return { reviewId, previousReadiness: previous, newReadiness: input.newReadiness };
}

export async function readinessHistory(actor: HrActor, candidateId: number) {
  assertHrPermission(actor, 'hr.succession.view');
  await rowInCollege(actor, 'succession_candidates', candidateId);
  return db('succession_readiness_reviews').where({ college_id: actor.collegeId, candidate_id: candidateId }).orderBy('id', 'desc');
}

// ── Development actions ───────────────────────────────────────────────────────
export async function createDevAction(actor: HrActor, input: z.infer<typeof devActionSchema>) {
  assertHrPermission(actor, 'hr.succession.assess');
  const emp = await employeeInCollege(actor, input.employeeId);
  if (!hasHrPermission(actor, 'hr.succession.manage')) await assertManagesEmployee(actor, emp);
  if (input.mentorEmployeeId) await employeeInCollege(actor, input.mentorEmployeeId);
  // Validate L&D program reference is in this college (read-only link; never mutated).
  if (input.linkedLdProgramId) {
    const prog = await db('ld_programs').where({ id: input.linkedLdProgramId, college_id: actor.collegeId }).first();
    if (!prog) throw new AppError(400, 'Linked L&D program not found in this college');
  }
  const [id] = await db('succession_development_actions').insert({
    college_id: actor.collegeId, candidate_id: input.candidateId ?? null, critical_role_id: input.criticalRoleId ?? null,
    employee_id: emp.id, action_type: input.actionType, description: input.description, owner_faculty_id: actor.facultyUserId,
    mentor_employee_id: input.mentorEmployeeId ?? null, due_date: input.dueDate ?? null, status: 'OPEN', linked_ld_program_id: input.linkedLdProgramId ?? null,
  });
  await recordHrAudit({ actor, action: 'SUCCESSION_DEV_ACTION_CREATED', entityType: 'succession_development_actions', entityId: id });
  return { id };
}

export async function setDevActionStatus(actor: HrActor, id: number, input: z.infer<typeof devActionStatusSchema>) {
  assertHrPermission(actor, 'hr.succession.assess');
  const action = await rowInCollege(actor, 'succession_development_actions', id);
  if (action.status === input.status) return { id, status: input.status, idempotent: true };
  const patch: Record<string, unknown> = { status: input.status, updated_at: db.fn.now() };
  if (input.status === 'COMPLETED') {
    patch.completed_at = db.fn.now();
    patch.completion_evidence = input.completionEvidence ?? action.completion_evidence ?? null;
    // Pull read-only L&D completion evidence when linked (never mutates L&D).
    if (action.linked_ld_program_id) {
      const comp = await db('ld_completions').where({ college_id: actor.collegeId, program_id: action.linked_ld_program_id, employee_id: action.employee_id }).first();
      if (comp) patch.linked_ld_completion_id = comp.id;
    }
  }
  await db('succession_development_actions').where({ id }).update(patch);
  await recordHrAudit({ actor, action: `SUCCESSION_DEV_ACTION_${input.status}`, entityType: 'succession_development_actions', entityId: id });
  return { id, status: input.status };
}

export async function listDevActions(actor: HrActor, opts: { employeeId?: number; candidateId?: number; status?: string } = {}) {
  assertHrPermission(actor, 'hr.succession.view');
  const scope = successionScope(actor);
  let q = db('succession_development_actions as a').join('employees as e', 'e.id', 'a.employee_id').where('a.college_id', actor.collegeId);
  if (scope) q = q.whereIn('e.department_id', scope);
  if (opts.employeeId) q = q.where('a.employee_id', opts.employeeId);
  if (opts.candidateId) q = q.where('a.candidate_id', opts.candidateId);
  if (opts.status) q = q.where('a.status', opts.status);
  return q.orderBy('a.due_date').select('a.id', 'a.employee_id', 'e.display_name', 'a.action_type', 'a.description', 'a.due_date', 'a.status', 'a.mentor_employee_id', 'a.linked_ld_program_id');
}

// ── Succession events ────────────────────────────────────────────────────────
export async function openEvent(actor: HrActor, input: z.infer<typeof eventSchema>) {
  assertHrPermission(actor, 'hr.succession.manage');
  const role = await rowInCollege(actor, 'succession_critical_roles', input.criticalRoleId);
  const [id] = await db('succession_events').insert({
    college_id: actor.collegeId, critical_role_id: role.id, opened_by: actor.facultyUserId, reason: input.reason ?? null, status: 'OPEN',
  });
  await recordHrAudit({ actor, action: 'SUCCESSION_EVENT_OPENED', entityType: 'succession_events', entityId: id });
  return { id, status: 'OPEN' };
}

export async function decideEvent(actor: HrActor, eventId: number, input: z.infer<typeof eventDecisionSchema>) {
  assertHrPermission(actor, 'hr.succession.approve');
  const evt = await rowInCollege(actor, 'succession_events', eventId);
  if (['DECIDED', 'CLOSED', 'CANCELLED'].includes(String(evt.status))) throw new AppError(409, `Event already ${evt.status}`);
  if (input.selectedCandidateId) {
    const cand = await db('succession_candidates').where({ id: input.selectedCandidateId, college_id: actor.collegeId, critical_role_id: evt.critical_role_id }).first();
    if (!cand) throw new AppError(400, 'Selected candidate is not on this role slate');
  }
  if (input.selectedEmployeeId) await employeeInCollege(actor, input.selectedEmployeeId);
  await db('succession_events').where({ id: eventId }).update({
    status: 'DECIDED', selected_candidate_id: input.selectedCandidateId ?? null, selected_employee_id: input.selectedEmployeeId ?? null,
    decision_notes: input.decisionNotes ?? null, effective_date: input.effectiveDate ?? null, updated_at: db.fn.now(),
  });
  // NOTE: actual promotion/transfer/payroll changes go through Employee Lifecycle,
  // not succession. This only documents the decision.
  await recordHrAudit({ actor, action: 'SUCCESSION_EVENT_DECIDED', entityType: 'succession_events', entityId: eventId, after: { selectedCandidateId: input.selectedCandidateId ?? null } });
  return { id: eventId, status: 'DECIDED' };
}

export async function closeEvent(actor: HrActor, eventId: number) {
  assertHrPermission(actor, 'hr.succession.manage');
  const evt = await rowInCollege(actor, 'succession_events', eventId);
  if (evt.status === 'CLOSED') return { id: eventId, status: 'CLOSED', idempotent: true };
  await db('succession_events').where({ id: eventId }).update({ status: 'CLOSED', closed_at: db.fn.now(), updated_at: db.fn.now() });
  return { id: eventId, status: 'CLOSED' };
}

export async function listEvents(actor: HrActor, status?: string) {
  assertHrPermission(actor, 'hr.succession.view');
  let q = db('succession_events as ev').join('succession_critical_roles as r', 'r.id', 'ev.critical_role_id').where('ev.college_id', actor.collegeId);
  if (status) q = q.where('ev.status', status);
  const scope = successionScope(actor);
  if (scope) q = q.whereIn('r.department_id', scope);
  return q.orderBy('ev.opened_at', 'desc').select('ev.id', 'ev.critical_role_id', 'r.role_title', 'ev.status', 'ev.opened_at', 'ev.effective_date', 'ev.selected_employee_id');
}
