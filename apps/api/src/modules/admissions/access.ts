import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';
import type { AdmissionActor, AdmissionPermission } from './types.js';

const ROLE_PERMISSIONS: Record<string, AdmissionPermission[]> = {
  SUPER_ADMIN: [
    'admissions.config.manage',
    'admissions.enquiry.manage',
    'admissions.application.manage',
    'admissions.document.verify',
    'admissions.eligibility.evaluate',
    'admissions.eligibility.override',
    'admissions.selection.manage',
    'admissions.offer.manage',
    'admissions.confirm',
    'admissions.convert',
    'admissions.report.view',
    'admissions.oversight.view',
  ],
  COLLEGE_ADMIN: [
    'admissions.config.manage',
    'admissions.enquiry.manage',
    'admissions.application.manage',
    'admissions.document.verify',
    'admissions.eligibility.evaluate',
    'admissions.eligibility.override',
    'admissions.selection.manage',
    'admissions.offer.manage',
    'admissions.confirm',
    'admissions.convert',
    'admissions.report.view',
    'admissions.oversight.view',
  ],
  ADMISSIONS_MANAGER: [
    'admissions.config.manage',
    'admissions.enquiry.manage',
    'admissions.application.manage',
    'admissions.document.verify',
    'admissions.eligibility.evaluate',
    'admissions.eligibility.override',
    'admissions.selection.manage',
    'admissions.offer.manage',
    'admissions.confirm',
    'admissions.convert',
    'admissions.report.view',
    'admissions.oversight.view',
  ],
  ADMISSIONS_OFFICER: [
    'admissions.enquiry.manage',
    'admissions.application.manage',
    'admissions.document.verify',
    'admissions.eligibility.evaluate',
    'admissions.selection.manage',
    'admissions.offer.manage',
    'admissions.report.view',
  ],
  HOD: ['admissions.oversight.view', 'admissions.report.view'],
  PRINCIPAL: ['admissions.confirm', 'admissions.oversight.view', 'admissions.report.view'],
  MANAGEMENT: ['admissions.report.view', 'admissions.oversight.view'],
  ACCOUNTANT: [],
  COE: [],
  FACULTY: [],
};

export function admissionPermissionsForRole(role: string): AdmissionPermission[] {
  if (isSuperAdmin(role)) return ROLE_PERMISSIONS.SUPER_ADMIN;
  if (role === 'CHAIRMAN') return ROLE_PERMISSIONS.MANAGEMENT;
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasAdmissionPermission(actor: AdmissionActor, permission: AdmissionPermission) {
  if (actor.kind === 'APPLICANT') return false;
  if (isAdminRole(actor.role)) return true;
  return admissionPermissionsForRole(actor.role).includes(permission);
}

export function assertAdmissionPermission(actor: AdmissionActor, permission: AdmissionPermission) {
  if (!hasAdmissionPermission(actor, permission)) {
    throw new AppError(403, 'You do not have permission for this admissions action');
  }
}

export async function hodDepartmentIds(actor: AdmissionActor): Promise<number[]> {
  if (actor.kind !== 'FACULTY' || !actor.facultyUserId) return [];
  const rows = await db('academic_leadership_assignments')
    .where({
      college_id: actor.collegeId,
      leadership_role: 'HOD',
      status: 'ACTIVE',
      employee_id: actor.facultyUserId,
    })
    .whereNotNull('department_id')
    .select('department_id');
  const ids = rows.map((r) => Number(r.department_id));
  if (actor.role === 'HOD' && actor.departmentId && !ids.includes(actor.departmentId)) ids.push(actor.departmentId);
  return [...new Set(ids)];
}

export async function assertApplicantVisible(actor: AdmissionActor, applicantId: number) {
  const applicant = await db('admission_applicants').where({ id: applicantId }).first();
  if (!applicant || Number(applicant.college_id) !== actor.collegeId) throw new AppError(404, 'Applicant not found');
  if (actor.kind === 'APPLICANT') {
    if (Number(applicant.id) !== actor.applicantId) throw new AppError(404, 'Applicant not found');
    return applicant;
  }
  if (hasAdmissionPermission(actor, 'admissions.application.manage') || hasAdmissionPermission(actor, 'admissions.oversight.view')) {
    if (actor.role === 'HOD') {
      const pref = await db('admission_program_preferences as p')
        .join('programs as pr', 'pr.id', 'p.program_id')
        .where({ 'p.applicant_id': applicantId })
        .select('pr.department_id')
        .first();
      const depts = await hodDepartmentIds(actor);
      if (!pref?.department_id || !depts.includes(Number(pref.department_id))) {
        throw new AppError(403, 'This applicant is outside your department scope');
      }
    }
    return applicant;
  }
  throw new AppError(403, 'You do not have access to this applicant');
}

export async function assertDocumentVisible(actor: AdmissionActor, documentId: number) {
  const doc = await db('admission_documents').where({ id: documentId }).first();
  if (!doc || Number(doc.college_id) !== actor.collegeId) throw new AppError(404, 'Document not found');
  await assertApplicantVisible(actor, Number(doc.applicant_id));
  return doc;
}
