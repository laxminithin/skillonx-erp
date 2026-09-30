import type { Knex } from 'knex';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { FinanceActor, StudentFinanceActor } from './types.js';
import { assertFinancePermission, assertStudentCollege } from './access.js';
import { recordFinanceAudit } from './audit.js';
import { toMoney } from './money.js';
import { getFinancePolicy } from './feeHeads.js';
import { applyScholarshipToDemands } from './scholarships.js';
import { evaluateEligibility, parseCriteria, type EligibilityCriteria } from './eligibility.js';
import {
  notifyApplicationSubmitted,
  notifyApplicationReturned,
  notifyApplicationDecision,
  notifyApplicationSanctioned,
} from './notifications.js';
import * as documentEngine from '../documentEngine/service.js';
import type { DocumentActor } from '../documentEngine/types.js';

function n(value: unknown) {
  return Number(value ?? 0);
}

// Non-terminal states an application can still move through or be withdrawn from.
const OPEN_STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_VERIFICATION', 'RETURNED'] as const;
const TERMINAL_STATUSES = ['REJECTED', 'WITHDRAWN', 'EXPIRED', 'CANCELLED', 'COMPLETED'] as const;

function studentDocumentActor(actor: StudentFinanceActor): DocumentActor {
  return { studentId: actor.studentId, collegeId: actor.collegeId, departmentId: null, role: 'STUDENT' };
}

function staffDocumentActor(actor: FinanceActor): DocumentActor {
  return { facultyUserId: actor.facultyUserId, collegeId: actor.collegeId, departmentId: actor.departmentId ?? null, role: actor.role, name: actor.name };
}

// ── Scheme discovery (student-facing) ────────────────────────────────────

export async function listApplicableSchemes(collegeId: number) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db('scholarship_schemes')
    .where({ college_id: collegeId, is_active: true })
    .andWhere((qb) => qb.whereNull('application_start_date').orWhere('application_start_date', '<=', today))
    .andWhere((qb) => qb.whereNull('application_end_date').orWhere('application_end_date', '>=', today))
    .orderBy('name');
  return rows.map((r) => ({
    id: Number(r.id),
    code: r.code,
    name: r.name,
    description: r.description,
    provider: r.provider,
    providerType: r.provider_type,
    benefitType: r.benefit_type,
    isExternal: !!r.is_external,
    externalPortalUrl: r.external_portal_url,
    allowMultipleApplications: !!r.allow_multiple_applications,
    renewalAllowed: !!r.renewal_allowed,
    applicationStartDate: r.application_start_date,
    applicationEndDate: r.application_end_date,
  }));
}

// ── Eligibility policy (staff) ───────────────────────────────────────────

export async function createEligibilityPolicy(
  actor: FinanceActor,
  body: { schemeId: number; academicYearId: number; criteria: EligibilityCriteria },
) {
  assertFinancePermission(actor, 'finance.scholarship.manage');
  const scheme = await db('scholarship_schemes').where({ id: body.schemeId, college_id: actor.collegeId }).first();
  if (!scheme) throw new AppError(404, 'Scholarship scheme not found');

  return db.transaction(async (trx) => {
    const latest = await trx('scholarship_eligibility_policies')
      .where({ college_id: actor.collegeId, scheme_id: body.schemeId, academic_year_id: body.academicYearId })
      .orderBy('version', 'desc')
      .first();
    const version = latest ? n(latest.version) + 1 : 1;
    if (latest) {
      await trx('scholarship_eligibility_policies').where({ id: latest.id }).update({ is_active: false, updated_at: trx.fn.now() });
    }
    const [id] = await trx('scholarship_eligibility_policies').insert({
      college_id: actor.collegeId,
      scheme_id: body.schemeId,
      academic_year_id: body.academicYearId,
      version,
      criteria: JSON.stringify(body.criteria),
      is_active: true,
      created_by: actor.facultyUserId,
    });
    await recordFinanceAudit({
      collegeId: actor.collegeId,
      actorId: actor.facultyUserId,
      action: 'SCHOLARSHIP_ELIGIBILITY_POLICY_CREATED',
      entityType: 'scholarship_eligibility_policy',
      entityId: n(id),
      afterState: body,
    });
    return trx('scholarship_eligibility_policies').where({ id }).first();
  });
}

export async function listEligibilityPolicies(actor: FinanceActor, schemeId?: number) {
  assertFinancePermission(actor, 'finance.view');
  let q = db('scholarship_eligibility_policies').where({ college_id: actor.collegeId });
  if (schemeId) q = q.andWhere({ scheme_id: schemeId });
  const rows = await q.orderBy(['scheme_id', { column: 'version', order: 'desc' }]);
  return rows.map((r) => ({
    id: Number(r.id),
    schemeId: Number(r.scheme_id),
    academicYearId: Number(r.academic_year_id),
    version: Number(r.version),
    criteria: parseCriteria(r.criteria),
    isActive: !!r.is_active,
    createdAt: r.created_at,
  }));
}

async function getActivePolicy(collegeId: number, schemeId: number, academicYearId: number) {
  return db('scholarship_eligibility_policies')
    .where({ college_id: collegeId, scheme_id: schemeId, academic_year_id: academicYearId, is_active: true })
    .first();
}

// ── Student application lifecycle ────────────────────────────────────────

export async function createDraftApplication(
  actor: StudentFinanceActor,
  body: { schemeId: number; academicYearId: number; requestedAmount?: number; selfDeclaredIncome?: number; selfDeclaredCategory?: string },
) {
  const student = await assertStudentCollege(actor.studentId, actor.collegeId);
  const scheme = await db('scholarship_schemes').where({ id: body.schemeId, college_id: actor.collegeId, is_active: true }).first();
  if (!scheme) throw new AppError(404, 'Scholarship scheme not found');

  const [id] = await db('scholarship_applications').insert({
    college_id: actor.collegeId,
    student_id: actor.studentId,
    scheme_id: body.schemeId,
    academic_year_id: body.academicYearId,
    status: 'DRAFT',
    eligibility_status: 'PENDING',
    requested_amount: body.requestedAmount != null ? toMoney(body.requestedAmount) : null,
    self_declared_income: body.selfDeclaredIncome != null ? toMoney(body.selfDeclaredIncome) : null,
    self_declared_category: body.selfDeclaredCategory ?? null,
  });
  await recordFinanceAudit({
    collegeId: actor.collegeId,
    actorId: actor.studentId,
    actorType: 'STUDENT',
    action: 'SCHOLARSHIP_APPLICATION_DRAFTED',
    entityType: 'scholarship_application',
    entityId: n(id),
    afterState: body,
  });
  void student;
  return getStudentApplication(actor, n(id));
}

export async function updateDraftApplication(
  actor: StudentFinanceActor,
  applicationId: number,
  body: { requestedAmount?: number; selfDeclaredIncome?: number; selfDeclaredCategory?: string },
) {
  const app = await loadOwnedApplication(actor, applicationId);
  if (app.status !== 'DRAFT' && app.status !== 'RETURNED') {
    throw new AppError(400, `Application cannot be edited in status ${app.status}`);
  }
  await db('scholarship_applications').where({ id: applicationId }).update({
    requested_amount: body.requestedAmount != null ? toMoney(body.requestedAmount) : app.requested_amount,
    self_declared_income: body.selfDeclaredIncome != null ? toMoney(body.selfDeclaredIncome) : app.self_declared_income,
    self_declared_category: body.selfDeclaredCategory ?? app.self_declared_category,
    updated_at: db.fn.now(),
  });
  return getStudentApplication(actor, applicationId);
}

async function loadOwnedApplication(actor: StudentFinanceActor, applicationId: number, trx: Knex.Transaction | typeof db = db) {
  const app = await trx('scholarship_applications')
    .where({ id: applicationId, student_id: actor.studentId, college_id: actor.collegeId })
    .first();
  if (!app) throw new AppError(404, 'Application not found');
  return app;
}

async function reloadForStudent(trx: Knex.Transaction | typeof db, collegeId: number, studentId: number, applicationId: number) {
  const row = await trx('scholarship_applications as sa')
    .join('scholarship_schemes as sc', 'sc.id', 'sa.scheme_id')
    .where('sa.id', applicationId)
    .andWhere('sa.student_id', studentId)
    .andWhere('sa.college_id', collegeId)
    .select('sa.*', 'sc.name as scheme_name', 'sc.code as scheme_code', 'sc.benefit_type')
    .first();
  return serializeApplication(row, { includeInternal: false });
}

async function reloadForStaff(trx: Knex.Transaction | typeof db, collegeId: number, applicationId: number) {
  const row = await trx('scholarship_applications as sa')
    .join('scholarship_schemes as sc', 'sc.id', 'sa.scheme_id')
    .join('students as s', 's.id', 'sa.student_id')
    .where('sa.id', applicationId)
    .andWhere('sa.college_id', collegeId)
    .select('sa.*', 'sc.name as scheme_name', 'sc.code as scheme_code', 'sc.benefit_type', 's.name as student_name', 's.usn')
    .first();
  return serializeApplication(row, { includeInternal: true });
}

export async function submitApplication(actor: StudentFinanceActor, applicationId: number) {
  return db.transaction(async (trx) => {
    const app = await trx('scholarship_applications').where({ id: applicationId, student_id: actor.studentId, college_id: actor.collegeId }).forUpdate().first();
    if (!app) throw new AppError(404, 'Application not found');
    if (!['DRAFT', 'RETURNED'].includes(String(app.status))) {
      throw new AppError(400, `Application cannot be submitted from status ${app.status}`);
    }
    const scheme = await trx('scholarship_schemes').where({ id: app.scheme_id }).first();
    if (!scheme || !scheme.is_active) throw new AppError(400, 'Scholarship scheme is no longer active');

    // One-active-application-per-(student, scheme, year) guard, enforced by
    // a real unique index — a concurrent duplicate submit fails here, not
    // after both requests believed they were first (directive §16/§61).
    if (!scheme.allow_multiple_applications) {
      try {
        await trx('scholarship_application_slots').insert({
          college_id: actor.collegeId,
          student_id: actor.studentId,
          scheme_id: n(app.scheme_id),
          academic_year_id: n(app.academic_year_id),
          application_id: applicationId,
        });
      } catch (err) {
        const dbErr = err as { code?: string; errno?: number };
        if (dbErr?.code === 'ER_DUP_ENTRY' || dbErr?.errno === 1062) {
          throw new AppError(409, 'You already have an active application for this scheme and academic year');
        }
        throw err;
      }
    }

    const policy = await getActivePolicy(actor.collegeId, n(app.scheme_id), n(app.academic_year_id));
    const criteria = policy ? parseCriteria(policy.criteria) : {};
    const eligibility = await evaluateEligibility(actor.studentId, actor.collegeId, criteria, {
      income: app.self_declared_income != null ? Number(app.self_declared_income) : null,
      category: app.self_declared_category ?? null,
    });

    if (criteria.requiredDocumentCategories?.length) {
      const docs = await documentEngine.listDocumentsForEntity(studentDocumentActor(actor), 'scholarship_application', applicationId);
      const activeCategories = new Set(docs.filter((d) => d.status !== 'ARCHIVED').map((d) => String(d.category)));
      const missing = criteria.requiredDocumentCategories.filter((c) => !activeCategories.has(c));
      if (missing.length) {
        throw new AppError(400, `Missing required documents: ${missing.join(', ')}`);
      }
    }

    await trx('scholarship_applications').where({ id: applicationId }).update({
      status: 'SUBMITTED',
      eligibility_status: eligibility.status,
      eligibility_snapshot: JSON.stringify(eligibility.snapshot),
      eligibility_policy_id: policy ? n(policy.id) : null,
      submitted_at: trx.fn.now(),
      student_remarks: null,
      updated_at: trx.fn.now(),
    });

    await recordFinanceAudit({
      collegeId: actor.collegeId,
      actorId: actor.studentId,
      actorType: 'STUDENT',
      action: 'SCHOLARSHIP_APPLICATION_SUBMITTED',
      entityType: 'scholarship_application',
      entityId: applicationId,
      beforeState: { status: app.status },
      afterState: { status: 'SUBMITTED', eligibilityStatus: eligibility.status },
    });

    await notifyApplicationSubmitted(actor.studentId, actor.collegeId, applicationId, String(scheme.name));
    return reloadForStudent(trx, actor.collegeId, actor.studentId, applicationId);
  });
}

export async function withdrawApplication(actor: StudentFinanceActor, applicationId: number) {
  return db.transaction(async (trx) => {
    const app = await trx('scholarship_applications').where({ id: applicationId, student_id: actor.studentId, college_id: actor.collegeId }).forUpdate().first();
    if (!app) throw new AppError(404, 'Application not found');
    if (!OPEN_STATUSES.includes(app.status as (typeof OPEN_STATUSES)[number])) {
      throw new AppError(400, `Application cannot be withdrawn once it is ${app.status} — contact the scholarship office`);
    }
    await trx('scholarship_applications').where({ id: applicationId }).update({
      status: 'WITHDRAWN',
      withdrawn_at: trx.fn.now(),
      updated_at: trx.fn.now(),
    });
    await trx('scholarship_application_slots').where({ application_id: applicationId }).delete();
    await recordFinanceAudit({
      collegeId: actor.collegeId,
      actorId: actor.studentId,
      actorType: 'STUDENT',
      action: 'SCHOLARSHIP_APPLICATION_WITHDRAWN',
      entityType: 'scholarship_application',
      entityId: applicationId,
      beforeState: { status: app.status },
      afterState: { status: 'WITHDRAWN' },
    });
    return reloadForStudent(trx, actor.collegeId, actor.studentId, applicationId);
  });
}

export async function uploadApplicationDocument(
  actor: StudentFinanceActor,
  applicationId: number,
  input: { category: string; fileName: string; mimeType: string; contentBase64: string; description?: string | null; expiryDate?: string | null },
) {
  const app = await loadOwnedApplication(actor, applicationId);
  if (!OPEN_STATUSES.includes(app.status as (typeof OPEN_STATUSES)[number])) {
    throw new AppError(400, `Documents cannot be uploaded once the application is ${app.status}`);
  }
  // entityType/entityId are always server-derived from the route — never
  // trust a client-supplied value here (this application's own ownership
  // check above is what actually authorizes the upload).
  return documentEngine.uploadDocument(studentDocumentActor(actor), {
    entityType: 'scholarship_application',
    entityId: applicationId,
    category: input.category,
    fileName: input.fileName,
    mimeType: input.mimeType,
    contentBase64: input.contentBase64,
    description: input.description ?? null,
    expiryDate: input.expiryDate ?? null,
  });
}

export async function listApplicationDocuments(actor: StudentFinanceActor, applicationId: number) {
  await loadOwnedApplication(actor, applicationId);
  return documentEngine.listDocumentsForEntity(studentDocumentActor(actor), 'scholarship_application', applicationId);
}

export async function getStudentApplication(actor: StudentFinanceActor, applicationId: number) {
  const row = await db('scholarship_applications as sa')
    .join('scholarship_schemes as sc', 'sc.id', 'sa.scheme_id')
    .where('sa.id', applicationId)
    .andWhere('sa.student_id', actor.studentId)
    .andWhere('sa.college_id', actor.collegeId)
    .select('sa.*', 'sc.name as scheme_name', 'sc.code as scheme_code', 'sc.benefit_type')
    .first();
  if (!row) throw new AppError(404, 'Application not found');
  return serializeApplication(row, { includeInternal: false });
}

export async function listStudentApplications(actor: StudentFinanceActor) {
  const rows = await db('scholarship_applications as sa')
    .join('scholarship_schemes as sc', 'sc.id', 'sa.scheme_id')
    .where({ 'sa.student_id': actor.studentId, 'sa.college_id': actor.collegeId })
    .select('sa.*', 'sc.name as scheme_name', 'sc.code as scheme_code', 'sc.benefit_type')
    .orderBy('sa.created_at', 'desc');
  return rows.map((r) => serializeApplication(r, { includeInternal: false }));
}

// ── Staff processing ──────────────────────────────────────────────────────

export async function listApplicationsForStaff(actor: FinanceActor, filters?: { status?: string; schemeId?: number }) {
  assertFinancePermission(actor, 'finance.view');
  let q = db('scholarship_applications as sa')
    .join('scholarship_schemes as sc', 'sc.id', 'sa.scheme_id')
    .join('students as s', 's.id', 'sa.student_id')
    .where('sa.college_id', actor.collegeId)
    .select('sa.*', 'sc.name as scheme_name', 'sc.code as scheme_code', 'sc.benefit_type', 's.name as student_name', 's.usn');
  if (filters?.status) q = q.andWhere('sa.status', filters.status);
  if (filters?.schemeId) q = q.andWhere('sa.scheme_id', filters.schemeId);
  const rows = await q.orderBy('sa.created_at', 'desc').limit(200);
  return rows.map((r) => serializeApplication(r, { includeInternal: true }));
}

export async function getApplicationForStaff(actor: FinanceActor, applicationId: number) {
  assertFinancePermission(actor, 'finance.view');
  const row = await db('scholarship_applications as sa')
    .join('scholarship_schemes as sc', 'sc.id', 'sa.scheme_id')
    .join('students as s', 's.id', 'sa.student_id')
    .where('sa.id', applicationId)
    .andWhere('sa.college_id', actor.collegeId)
    .select('sa.*', 'sc.name as scheme_name', 'sc.code as scheme_code', 'sc.benefit_type', 's.name as student_name', 's.usn')
    .first();
  if (!row) throw new AppError(404, 'Application not found');
  return serializeApplication(row, { includeInternal: true });
}

export async function listApplicationDocumentsForStaff(actor: FinanceActor, applicationId: number) {
  assertFinancePermission(actor, 'finance.view');
  const app = await db('scholarship_applications').where({ id: applicationId, college_id: actor.collegeId }).first();
  if (!app) throw new AppError(404, 'Application not found');
  return documentEngine.listDocumentsForEntity(staffDocumentActor(actor), 'scholarship_application', applicationId);
}

async function lockStaffApplication(trx: Knex.Transaction, actor: FinanceActor, applicationId: number) {
  const app = await trx('scholarship_applications').where({ id: applicationId, college_id: actor.collegeId }).forUpdate().first();
  if (!app) throw new AppError(404, 'Application not found');
  return app;
}

function assertStatus(app: Record<string, unknown>, allowed: string[]) {
  if (!allowed.includes(String(app.status))) {
    throw new AppError(400, `Invalid transition: application is ${app.status}, expected one of ${allowed.join(', ')}`);
  }
}

export async function startVerification(actor: FinanceActor, applicationId: number) {
  assertFinancePermission(actor, 'finance.scholarship_application.process');
  return db.transaction(async (trx) => {
    const app = await lockStaffApplication(trx, actor, applicationId);
    assertStatus(app, ['SUBMITTED']);
    await trx('scholarship_applications').where({ id: applicationId }).update({ status: 'UNDER_VERIFICATION', updated_at: trx.fn.now() });
    await recordFinanceAudit({
      collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'SCHOLARSHIP_APPLICATION_VERIFICATION_STARTED',
      entityType: 'scholarship_application', entityId: applicationId, beforeState: { status: app.status }, afterState: { status: 'UNDER_VERIFICATION' },
    });
    return reloadForStaff(trx, actor.collegeId, applicationId);
  });
}

export async function returnApplication(actor: FinanceActor, applicationId: number, remarks: string) {
  assertFinancePermission(actor, 'finance.scholarship_application.process');
  if (!remarks?.trim()) throw new AppError(400, 'Remarks are required when returning an application');
  return db.transaction(async (trx) => {
    const app = await lockStaffApplication(trx, actor, applicationId);
    assertStatus(app, ['UNDER_VERIFICATION']);
    await trx('scholarship_applications').where({ id: applicationId }).update({
      status: 'RETURNED', student_remarks: remarks, updated_at: trx.fn.now(),
    });
    await recordFinanceAudit({
      collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'SCHOLARSHIP_APPLICATION_RETURNED',
      entityType: 'scholarship_application', entityId: applicationId, beforeState: { status: app.status }, afterState: { status: 'RETURNED' }, reason: remarks,
    });
    const scheme = await trx('scholarship_schemes').where({ id: app.scheme_id }).first();
    await notifyApplicationReturned(n(app.student_id), actor.collegeId, applicationId, String(scheme?.name ?? ''), remarks);
    return reloadForStaff(trx, actor.collegeId, applicationId);
  });
}

export async function verifyApplication(actor: FinanceActor, applicationId: number, remarks?: string) {
  assertFinancePermission(actor, 'finance.scholarship_application.process');
  return db.transaction(async (trx) => {
    const app = await lockStaffApplication(trx, actor, applicationId);
    assertStatus(app, ['UNDER_VERIFICATION']);
    await trx('scholarship_applications').where({ id: applicationId }).update({
      status: 'VERIFIED', internal_remarks: remarks ?? app.internal_remarks, verified_by: actor.facultyUserId, verified_at: trx.fn.now(), updated_at: trx.fn.now(),
    });
    await recordFinanceAudit({
      collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'SCHOLARSHIP_APPLICATION_VERIFIED',
      entityType: 'scholarship_application', entityId: applicationId, beforeState: { status: app.status }, afterState: { status: 'VERIFIED' }, reason: remarks,
    });
    return reloadForStaff(trx, actor.collegeId, applicationId);
  });
}

export async function approveApplication(actor: FinanceActor, applicationId: number, remarks?: string) {
  assertFinancePermission(actor, 'finance.scholarship_application.approve');
  return db.transaction(async (trx) => {
    const app = await lockStaffApplication(trx, actor, applicationId);
    assertStatus(app, ['VERIFIED']);
    if (app.eligibility_status === 'INELIGIBLE') {
      throw new AppError(400, 'Cannot approve an application the eligibility engine marked INELIGIBLE');
    }
    await trx('scholarship_applications').where({ id: applicationId }).update({
      status: 'APPROVED', decided_by: actor.facultyUserId, decided_at: trx.fn.now(),
      internal_remarks: remarks ?? app.internal_remarks, updated_at: trx.fn.now(),
    });
    await recordFinanceAudit({
      collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'SCHOLARSHIP_APPLICATION_APPROVED',
      entityType: 'scholarship_application', entityId: applicationId, beforeState: { status: app.status }, afterState: { status: 'APPROVED' }, reason: remarks,
    });
    const scheme = await trx('scholarship_schemes').where({ id: app.scheme_id }).first();
    await notifyApplicationDecision(n(app.student_id), actor.collegeId, applicationId, String(scheme?.name ?? ''), 'APPROVED');
    return reloadForStaff(trx, actor.collegeId, applicationId);
  });
}

export async function rejectApplication(actor: FinanceActor, applicationId: number, remarks: string) {
  assertFinancePermission(actor, 'finance.scholarship_application.approve');
  if (!remarks?.trim()) throw new AppError(400, 'Remarks are required when rejecting an application');
  return db.transaction(async (trx) => {
    const app = await lockStaffApplication(trx, actor, applicationId);
    assertStatus(app, ['SUBMITTED', 'UNDER_VERIFICATION', 'VERIFIED']);
    await trx('scholarship_applications').where({ id: applicationId }).update({
      status: 'REJECTED', decided_by: actor.facultyUserId, decided_at: trx.fn.now(), student_remarks: remarks, updated_at: trx.fn.now(),
    });
    await trx('scholarship_application_slots').where({ application_id: applicationId }).delete();
    await recordFinanceAudit({
      collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'SCHOLARSHIP_APPLICATION_REJECTED',
      entityType: 'scholarship_application', entityId: applicationId, beforeState: { status: app.status }, afterState: { status: 'REJECTED' }, reason: remarks,
    });
    const scheme = await trx('scholarship_schemes').where({ id: app.scheme_id }).first();
    await notifyApplicationDecision(n(app.student_id), actor.collegeId, applicationId, String(scheme?.name ?? ''), 'REJECTED');
    return reloadForStaff(trx, actor.collegeId, applicationId);
  });
}

export async function cancelApplication(actor: FinanceActor, applicationId: number, reason: string) {
  assertFinancePermission(actor, 'finance.scholarship_application.approve');
  if (!reason?.trim()) throw new AppError(400, 'A reason is required to cancel an application');
  return db.transaction(async (trx) => {
    const app = await lockStaffApplication(trx, actor, applicationId);
    if (TERMINAL_STATUSES.includes(app.status as (typeof TERMINAL_STATUSES)[number])) {
      throw new AppError(400, `Application already reached a terminal state (${app.status})`);
    }
    await trx('scholarship_applications').where({ id: applicationId }).update({
      status: 'CANCELLED', student_remarks: reason, updated_at: trx.fn.now(),
    });
    await trx('scholarship_application_slots').where({ application_id: applicationId }).delete();
    await recordFinanceAudit({
      collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'SCHOLARSHIP_APPLICATION_CANCELLED',
      entityType: 'scholarship_application', entityId: applicationId, beforeState: { status: app.status }, afterState: { status: 'CANCELLED' }, reason,
    });
    return reloadForStaff(trx, actor.collegeId, applicationId);
  });
}

/**
 * Sanction + Finance handoff, atomically. Idempotent: if this application
 * already has a linked `student_scholarship_id` (a prior attempt already
 * completed the handoff), this call is a no-op that returns the existing
 * state rather than posting a second financial effect (directive §37/§62).
 */
export async function sanctionApplication(actor: FinanceActor, applicationId: number, sanctionedAmount: number) {
  assertFinancePermission(actor, 'finance.scholarship.manage');
  return db.transaction(async (trx) => {
    const app = await lockStaffApplication(trx, actor, applicationId);

    if (app.student_scholarship_id != null) {
      // Already handed off — idempotent retry, not an error.
      return reloadForStaff(trx, actor.collegeId, applicationId);
    }
    assertStatus(app, ['APPROVED']);

    const scheme = await trx('scholarship_schemes').where({ id: app.scheme_id }).first();
    const policy = await getFinancePolicy(actor.collegeId);

    const [scholarshipId] = await trx('student_scholarships').insert({
      college_id: actor.collegeId,
      student_id: app.student_id,
      scheme_id: app.scheme_id,
      academic_year_id: app.academic_year_id,
      expected_amount: app.requested_amount,
      sanctioned_amount: toMoney(sanctionedAmount),
      status: 'SANCTIONED',
      remarks: `Scholarship application #${applicationId}`,
      approved_by: actor.facultyUserId,
      approved_at: trx.fn.now(),
      application_id: applicationId,
    });

    if (policy.scholarshipTreatment === 'REDUCE_DEMAND') {
      await applyScholarshipToDemands(actor.collegeId, n(app.student_id), sanctionedAmount, trx);
    }

    const finalStatus = policy.scholarshipTreatment === 'REDUCE_DEMAND' ? 'COMPLETED' : 'SANCTIONED';
    await trx('scholarship_applications').where({ id: applicationId }).update({
      status: finalStatus,
      sanctioned_amount: toMoney(sanctionedAmount),
      sanctioned_by: actor.facultyUserId,
      sanctioned_at: trx.fn.now(),
      student_scholarship_id: n(scholarshipId),
      finance_handoff_key: `scholarship_application:${applicationId}`,
      updated_at: trx.fn.now(),
    });

    await recordFinanceAudit({
      collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'SCHOLARSHIP_APPLICATION_SANCTIONED',
      entityType: 'scholarship_application', entityId: applicationId,
      beforeState: { status: app.status },
      afterState: { status: finalStatus, sanctionedAmount, studentScholarshipId: n(scholarshipId) },
    });

    await notifyApplicationSanctioned(n(app.student_id), actor.collegeId, applicationId, String(scheme?.name ?? ''), sanctionedAmount);
    return reloadForStaff(trx, actor.collegeId, applicationId);
  });
}

export async function completeApplication(actor: FinanceActor, applicationId: number, evidenceReference: string) {
  assertFinancePermission(actor, 'finance.scholarship_application.process');
  if (!evidenceReference?.trim()) throw new AppError(400, 'An evidence reference is required to mark a benefit complete');
  return db.transaction(async (trx) => {
    const app = await lockStaffApplication(trx, actor, applicationId);
    assertStatus(app, ['SANCTIONED']);
    await trx('scholarship_applications').where({ id: applicationId }).update({
      status: 'COMPLETED', internal_remarks: `Completed with evidence: ${evidenceReference}`, updated_at: trx.fn.now(),
    });
    await recordFinanceAudit({
      collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'SCHOLARSHIP_APPLICATION_COMPLETED',
      entityType: 'scholarship_application', entityId: applicationId, beforeState: { status: app.status }, afterState: { status: 'COMPLETED' }, reason: evidenceReference,
    });
    return reloadForStaff(trx, actor.collegeId, applicationId);
  });
}

function serializeApplication(row: Record<string, unknown>, opts: { includeInternal: boolean }) {
  const base = {
    id: Number(row.id),
    studentId: Number(row.student_id),
    studentName: row.student_name ?? null,
    usn: row.usn ?? null,
    schemeId: Number(row.scheme_id),
    schemeName: row.scheme_name,
    schemeCode: row.scheme_code,
    benefitType: row.benefit_type,
    academicYearId: Number(row.academic_year_id),
    status: row.status,
    eligibilityStatus: row.eligibility_status,
    requestedAmount: row.requested_amount != null ? toMoney(row.requested_amount) : null,
    sanctionedAmount: row.sanctioned_amount != null ? toMoney(row.sanctioned_amount) : null,
    selfDeclaredIncome: row.self_declared_income != null ? toMoney(row.self_declared_income) : null,
    selfDeclaredCategory: row.self_declared_category ?? null,
    studentRemarks: row.student_remarks ?? null,
    submittedAt: row.submitted_at,
    verifiedAt: row.verified_at,
    decidedAt: row.decided_at,
    sanctionedAt: row.sanctioned_at,
    withdrawnAt: row.withdrawn_at,
    createdAt: row.created_at,
  };
  if (!opts.includeInternal) return base;
  return {
    ...base,
    internalRemarks: row.internal_remarks ?? null,
    eligibilitySnapshot: row.eligibility_snapshot ? JSON.parse(String(row.eligibility_snapshot)) : null,
    studentScholarshipId: row.student_scholarship_id != null ? Number(row.student_scholarship_id) : null,
  };
}
