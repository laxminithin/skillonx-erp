import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';
import type { PlacementActor, PlacementPermission, RecruiterActor } from './types.js';
import { listActiveTpForFaculty } from './tpAssignments.js';
import { resolveLeadershipContext } from '../academicLeadership/leadership.js';

const ROLE_PLACEMENT_PERMISSIONS: Record<string, PlacementPermission[]> = {
  SUPER_ADMIN: [
    'placement.view',
    'placement.student.manage',
    'placement.company.manage',
    'placement.opportunity.manage',
    'placement.eligibility.override',
    'placement.application.manage',
    'placement.drive.manage',
    'placement.offer.manage',
    'placement.training.manage',
    'placement.report.view',
    'placement.config.manage',
    'placement.management.view',
  ],
  COLLEGE_ADMIN: [
    'placement.view',
    'placement.student.manage',
    'placement.company.manage',
    'placement.opportunity.manage',
    'placement.eligibility.override',
    'placement.application.manage',
    'placement.drive.manage',
    'placement.offer.manage',
    'placement.training.manage',
    'placement.report.view',
    'placement.config.manage',
    'placement.management.view',
  ],
  PRINCIPAL: [
    'placement.view',
    'placement.report.view',
    'placement.management.view',
  ],
  PLACEMENT_OFFICER: [
    'placement.view',
    'placement.student.manage',
    'placement.company.manage',
    'placement.opportunity.manage',
    'placement.eligibility.override',
    'placement.application.manage',
    'placement.drive.manage',
    'placement.offer.manage',
    'placement.training.manage',
    'placement.report.view',
  ],
  TPO: [
    'placement.view',
    'placement.student.manage',
    'placement.company.manage',
    'placement.opportunity.manage',
    'placement.eligibility.override',
    'placement.application.manage',
    'placement.drive.manage',
    'placement.offer.manage',
    'placement.training.manage',
    'placement.report.view',
  ],
  PLACEMENT_COORDINATOR: [
    'placement.coordinator.view',
    'placement.view',
    'placement.student.manage',
    'placement.application.manage',
    'placement.training.manage',
    'placement.report.view',
  ],
  TRAINING_COORDINATOR: [
    'placement.trainer.view',
    'placement.training.manage',
    'placement.view',
  ],
  HOD: ['placement.coordinator.view', 'placement.view', 'placement.report.view'],
  // Executive leadership: read-only placement outcomes + management analytics.
  MANAGEMENT: ['placement.view', 'placement.report.view', 'placement.management.view'],
  FACULTY: [],
};

const TP_ROLE_PERMISSIONS: Record<string, PlacementPermission[]> = {
  'T&P_OFFICER': ROLE_PLACEMENT_PERMISSIONS.PLACEMENT_OFFICER,
  'T&P_COORDINATOR': [
    'placement.view',
    'placement.student.manage',
    'placement.company.manage',
    'placement.opportunity.manage',
    'placement.application.manage',
    'placement.drive.manage',
    'placement.offer.manage',
    'placement.training.manage',
    'placement.report.view',
  ],
  DEPARTMENT_TP_COORDINATOR: [
    'placement.coordinator.view',
    'placement.view',
    'placement.student.manage',
    'placement.application.manage',
    'placement.training.manage',
    'placement.report.view',
  ],
};

export function placementPermissionsForRole(role: string): PlacementPermission[] {
  if (isSuperAdmin(role)) return ROLE_PLACEMENT_PERMISSIONS.SUPER_ADMIN;
  if (role === 'CHAIRMAN') return ROLE_PLACEMENT_PERMISSIONS.MANAGEMENT;
  return ROLE_PLACEMENT_PERMISSIONS[role] ?? [];
}

export async function enrichPlacementActor(actor: PlacementActor): Promise<PlacementActor> {
  const extra = new Set<PlacementPermission>();
  let tpRoles: string[] = [];
  let tpDepartmentIds: number[] = [];
  let employeeId: number | null = actor.employeeId ?? null;
  try {
    const assignments = await listActiveTpForFaculty(actor.facultyUserId, actor.collegeId);
    tpRoles = assignments.map((a) => a.role);
    tpDepartmentIds = assignments
      .filter((a) => a.role === 'DEPARTMENT_TP_COORDINATOR' && a.departmentId != null)
      .map((a) => a.departmentId!);
    for (const a of assignments) {
      for (const p of TP_ROLE_PERMISSIONS[a.role] ?? []) extra.add(p);
    }
    if (!employeeId) {
      const emp = await db('employees').where({ faculty_user_id: actor.facultyUserId, college_id: actor.collegeId }).first();
      employeeId = emp ? Number(emp.id) : null;
    }
  } catch {
    /* schema may be absent */
  }
  try {
    const lead = await resolveLeadershipContext({
      facultyUserId: actor.facultyUserId,
      collegeId: actor.collegeId,
      departmentId: actor.departmentId,
      role: actor.role,
    });
    if (lead.isHod) {
      tpDepartmentIds = [...new Set([...tpDepartmentIds, ...lead.hodDepartmentIds])];
      for (const p of ROLE_PLACEMENT_PERMISSIONS.HOD) extra.add(p);
    }
    if (lead.isPrincipal) {
      for (const p of ROLE_PLACEMENT_PERMISSIONS.PRINCIPAL) extra.add(p);
    }
  } catch {
    /* academic leadership optional */
  }
  return {
    ...actor,
    employeeId,
    tpRoles,
    tpDepartmentIds,
    extraPermissions: [...extra],
  };
}

export function hasPlacementPermission(actor: PlacementActor, permission: PlacementPermission): boolean {
  if (isAdminRole(actor.role)) return true;
  if (placementPermissionsForRole(actor.role).includes(permission)) return true;
  return (actor.extraPermissions ?? []).includes(permission);
}

export function assertPlacementPermission(actor: PlacementActor, permission: PlacementPermission) {
  if (!hasPlacementPermission(actor, permission)) {
    throw new AppError(403, 'You do not have permission for this placement action');
  }
}

export function isCollegeTpOperator(actor: PlacementActor): boolean {
  if (isAdminRole(actor.role)) return true;
  if (['TPO', 'PLACEMENT_OFFICER'].includes(actor.role)) return true;
  return (actor.tpRoles ?? []).some((r) => r === 'T&P_OFFICER' || r === 'T&P_COORDINATOR');
}

export function assertManagementReadOnly(actor: PlacementActor) {
  if (!hasPlacementPermission(actor, 'placement.management.view') && !isAdminRole(actor.role)) {
    throw new AppError(403, 'Management analytics access denied');
  }
}

export async function assertPlacementCollege(table: string, id: number, collegeId: number) {
  const row = await db(table).where({ id }).first();
  if (!row) throw new AppError(404, 'Record not found');
  if (Number(row.college_id) !== collegeId) throw new AppError(404, 'Record not found');
  return row;
}

export async function assertStudentCollege(studentId: number, collegeId: number) {
  const student = await db('students').where({ id: studentId, college_id: collegeId }).first();
  if (!student) throw new AppError(404, 'Student not found');
  return student;
}

export async function assertStudentOwnsApplication(studentId: number, applicationId: number, collegeId: number) {
  const app = await db('placement_applications')
    .where({ id: applicationId, student_id: studentId, college_id: collegeId })
    .first();
  if (!app) throw new AppError(404, 'Application not found');
  return app;
}

export async function getCoordinatorScope(actor: PlacementActor) {
  const fromTp = actor.tpDepartmentIds ?? [];
  const rows = await db('placement_coordinator_assignments')
    .where({ faculty_user_id: actor.facultyUserId, college_id: actor.collegeId });
  const departmentIds = [
    ...new Set([
      ...fromTp,
      ...rows.map((r) => r.department_id).filter(Boolean).map(Number),
    ]),
  ];
  const programIds = [...new Set(rows.map((r) => r.program_id).filter(Boolean).map(Number))];
  if (!departmentIds.length && !programIds.length && actor.departmentId) {
    return { departmentIds: [actor.departmentId], programIds: [] as number[] };
  }
  return { departmentIds, programIds };
}

export async function assertCoordinatorStudentAccess(actor: PlacementActor, studentId: number) {
  if (isAdminRole(actor.role) || isCollegeTpOperator(actor)) return;
  if (!hasPlacementPermission(actor, 'placement.coordinator.view') && !hasPlacementPermission(actor, 'placement.student.manage')) {
    throw new AppError(403, 'Coordinator access denied');
  }
  const scope = await getCoordinatorScope(actor);
  const student = await assertStudentCollege(studentId, actor.collegeId);
  const enrollment = await db('academic_class_enrollments as e')
    .join('academic_classes as ac', 'ac.id', 'e.academic_class_id')
    .where({ 'e.student_id': studentId, 'e.status': 'APPROVED' })
    .select('ac.department_id', 'ac.program_id')
    .first();
  const hasDeptScope = scope.departmentIds.length > 0;
  const hasProgScope = scope.programIds.length > 0;
  const deptOk = hasDeptScope && enrollment && scope.departmentIds.includes(Number(enrollment.department_id));
  const progOk = hasProgScope && enrollment && scope.programIds.includes(Number(enrollment.program_id));
  if (hasDeptScope || hasProgScope) {
    if (!deptOk && !progOk) throw new AppError(403, 'Student outside your department scope');
  }
  return student;
}

export async function getTrainerProgramIds(actor: PlacementActor): Promise<number[]> {
  const rows = await db('placement_trainer_assignments')
    .where({ faculty_user_id: actor.facultyUserId, college_id: actor.collegeId })
    .select('training_program_id');
  return rows.map((r) => Number(r.training_program_id));
}

export async function assertTrainerProgramAccess(actor: PlacementActor, programId: number) {
  if (isAdminRole(actor.role) || isCollegeTpOperator(actor)) return;
  if (
    hasPlacementPermission(actor, 'placement.training.manage')
    && (actor.tpRoles ?? []).includes('DEPARTMENT_TP_COORDINATOR')
  ) {
    return;
  }
  const ids = await getTrainerProgramIds(actor);
  if (!ids.includes(programId)) throw new AppError(403, 'Training program access denied');
}

export async function assertRecruiterCompany(recruiter: RecruiterActor, companyId: number) {
  if (Number(recruiter.companyId) !== Number(companyId)) {
    throw new AppError(403, 'Company access denied');
  }
}

export async function assertRecruiterOpportunity(recruiter: RecruiterActor, opportunityId: number) {
  const opp = await db('placement_opportunities')
    .where({ id: opportunityId, college_id: recruiter.collegeId, company_id: recruiter.companyId })
    .first();
  if (!opp) throw new AppError(404, 'Opportunity not found');
  return opp;
}
