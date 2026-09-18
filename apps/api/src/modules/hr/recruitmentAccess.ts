import { createHash, randomBytes } from 'node:crypto';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole } from '../../utils/permissions.js';
import { asISODate } from '../timetable/time.js';
import type { HrActor, HrPermission } from './types.js';
import { assertHrPermission, hasHrPermission, resolveEmployeeForActor } from './access.js';
import type { Row } from './recruitmentTypes.js';

export function asYmd(value: unknown): string {
  return asISODate(value);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits.length ? digits : null;
}

export function hashCandidateToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function generateCandidateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('hex');
  return { raw, hash: hashCandidateToken(raw) };
}

export function assertRecruitmentTransition(
  kind: 'REQUISITION' | 'OPENING' | 'APPLICATION' | 'OFFER',
  from: string,
  to: string,
  allowed: string[],
) {
  if (!allowed.includes(to)) {
    throw new AppError(
      400,
      `Invalid ${kind.toLowerCase()} transition ${from} → ${to}`,
      undefined,
      `RECRUITMENT_${kind}_INVALID_TRANSITION`,
    );
  }
}

export function hodDepartmentIds(actor: HrActor): number[] {
  if (actor.hodDepartmentIds?.length) return actor.hodDepartmentIds.map(Number);
  if ((actor.role === 'HOD' || (actor.leadershipRoles ?? []).includes('HOD')) && actor.departmentId) {
    return [Number(actor.departmentId)];
  }
  return [];
}

export function isHodActor(actor: HrActor): boolean {
  return actor.role === 'HOD' || (actor.leadershipRoles ?? []).includes('HOD');
}

export function canManageRecruitment(actor: HrActor): boolean {
  return (
    isAdminRole(actor.role) ||
    hasHrPermission(actor, 'hr.recruitment.manage') ||
    hasHrPermission(actor, 'hr.recruitment.offer') ||
    hasHrPermission(actor, 'hr.recruitment.join')
  );
}

export function assertDeptScope(actor: HrActor, departmentId: number | null | undefined, permission: HrPermission = 'hr.recruitment.view') {
  if (isAdminRole(actor.role) || hasHrPermission(actor, 'hr.recruitment.manage')) return;
  if (hasHrPermission(actor, permission) && !isHodActor(actor)) return;
  if (isHodActor(actor)) {
    const depts = hodDepartmentIds(actor);
    if (departmentId != null && depts.includes(Number(departmentId))) return;
    throw new AppError(403, 'Outside your department scope', undefined, 'RECRUITMENT_DEPT_SCOPE');
  }
  assertHrPermission(actor, permission);
}

export function redactSensitiveApplication(row: Row, actor: HrActor): Row {
  const out = { ...row };
  if (!hasHrPermission(actor, 'hr.recruitment.manage') && !hasHrPermission(actor, 'hr.recruitment.offer')) {
    delete out.salaryExpectation;
    delete out.salary_expectation;
  }
  return out;
}

export function redactSensitiveOffer(row: Row, actor: HrActor): Row {
  const out = { ...row };
  if (!hasHrPermission(actor, 'hr.recruitment.offer') && !hasHrPermission(actor, 'hr.recruitment.manage')) {
    delete out.compensationJson;
    delete out.compensation_json;
    delete out.compensation;
  }
  return out;
}

export async function assertInterviewerAccess(actor: HrActor, interviewId: number) {
  if (canManageRecruitment(actor) || hasHrPermission(actor, 'hr.recruitment.view')) {
    const interview = await db('hr_interviews').where({ id: interviewId, college_id: actor.collegeId }).first();
    if (!interview) throw new AppError(404, 'Interview not found');
    return interview;
  }
  const emp = await resolveEmployeeForActor(actor);
  if (!emp) throw new AppError(403, 'Interviewer access denied');
  const panel = await db('hr_interview_panel')
    .where({ interview_id: interviewId, employee_id: emp.id, college_id: actor.collegeId })
    .first();
  if (!panel) throw new AppError(403, 'Interviewer access denied', undefined, 'RECRUITMENT_INTERVIEWER_SCOPE');
  const interview = await db('hr_interviews').where({ id: interviewId, college_id: actor.collegeId }).first();
  if (!interview) throw new AppError(404, 'Interview not found');
  return interview;
}

export type CandidateAuth = {
  candidateId: number;
  collegeId: number;
  tokenId: number;
};

export async function resolveCandidateToken(rawToken: string | null | undefined): Promise<CandidateAuth> {
  if (!rawToken?.trim()) throw new AppError(401, 'Candidate token required', undefined, 'CANDIDATE_TOKEN_REQUIRED');
  const hash = hashCandidateToken(rawToken.trim());
  const row = await db('hr_candidate_access_tokens').where({ token_hash: hash }).first();
  if (!row || row.revoked_at) throw new AppError(401, 'Invalid candidate token', undefined, 'CANDIDATE_TOKEN_INVALID');
  if (new Date(String(row.expires_at)).getTime() < Date.now()) {
    throw new AppError(401, 'Candidate token expired', undefined, 'CANDIDATE_TOKEN_EXPIRED');
  }
  await db('hr_candidate_access_tokens').where({ id: row.id }).update({ last_used_at: db.fn.now() });
  return {
    candidateId: Number(row.candidate_id),
    collegeId: Number(row.college_id),
    tokenId: Number(row.id),
  };
}

export async function assertCandidateOwns(
  auth: CandidateAuth,
  opts: { candidateId?: number; applicationId?: number },
) {
  if (opts.candidateId != null && Number(opts.candidateId) !== auth.candidateId) {
    throw new AppError(403, 'Candidate scope denied', undefined, 'CANDIDATE_SCOPE');
  }
  if (opts.applicationId != null) {
    const app = await db('hr_recruitment_applications')
      .where({ id: opts.applicationId, college_id: auth.collegeId })
      .first();
    if (!app || Number(app.candidate_id) !== auth.candidateId) {
      throw new AppError(403, 'Candidate scope denied', undefined, 'CANDIDATE_SCOPE');
    }
  }
}

export async function ensureRecruitmentDefaults(collegeId: number) {
  if (!(await db.schema.hasTable('hr_interview_round_templates'))) return;

  const existingTpl = await db('hr_interview_round_templates')
    .where({ college_id: collegeId, code: 'DEFAULT' })
    .first();
  if (!existingTpl) {
    const [tplId] = await db('hr_interview_round_templates').insert({
      college_id: collegeId,
      code: 'DEFAULT',
      name: 'Standard interview rounds',
      description: 'HR screen → Technical → HR/Cultural',
      is_active: true,
    });
    const items = [
      { name: 'HR Screening', sequence: 1, round_type: 'HR', required: true, panel_min: 1 },
      { name: 'Technical', sequence: 2, round_type: 'TECHNICAL', required: true, panel_min: 1 },
      { name: 'HR / Cultural Fit', sequence: 3, round_type: 'HR', required: true, panel_min: 1 },
    ];
    for (const item of items) {
      await db('hr_interview_round_template_items').insert({
        template_id: tplId,
        college_id: collegeId,
        ...item,
        evaluation_criteria: JSON.stringify([
          { code: 'OVERALL', name: 'Overall', max: 10 },
        ]),
      });
    }
  }

  const existingPre = await db('hr_prejoining_checklist_templates')
    .where({ college_id: collegeId, code: 'DEFAULT' })
    .first();
  if (!existingPre) {
    const [tplId] = await db('hr_prejoining_checklist_templates').insert({
      college_id: collegeId,
      code: 'DEFAULT',
      name: 'Standard pre-joining checklist',
      employee_category: null,
      is_active: true,
    });
    const items = [
      { code: 'ID_PROOF', name: 'Identity proof', mandatory: true, sort_order: 1, item_type: 'DOCUMENT' },
      { code: 'EDU_CERT', name: 'Education certificates', mandatory: true, sort_order: 2, item_type: 'DOCUMENT' },
      { code: 'EXP_LETTER', name: 'Experience / relieving letter', mandatory: false, sort_order: 3, item_type: 'DOCUMENT' },
      { code: 'BGV', name: 'Background verification', mandatory: true, sort_order: 4, item_type: 'BGV' },
      { code: 'OFFER_ACK', name: 'Offer acknowledgement', mandatory: true, sort_order: 5, item_type: 'ACK' },
    ];
    for (const item of items) {
      await db('hr_prejoining_checklist_items').insert({
        template_id: tplId,
        college_id: collegeId,
        ...item,
      });
    }
  }
}

export async function recruitmentSchemaReady(): Promise<boolean> {
  try {
    return (
      (await db.schema.hasTable('hr_recruitment_requisitions')) &&
      (await db.schema.hasTable('hr_job_openings')) &&
      (await db.schema.hasTable('hr_recruitment_candidates')) &&
      (await db.schema.hasTable('hr_recruitment_applications')) &&
      (await db.schema.hasTable('hr_recruitment_offers')) &&
      (await db.schema.hasTable('hr_prejoining_tasks'))
    );
  } catch {
    return false;
  }
}
