import { isAdminRole } from '../../utils/permissions.js';

export type ClassActor = {
  facultyUserId: number;
  collegeId: number;
  departmentId?: number | null;
  role: string;
};

export type ClassAccess = {
  view: boolean;
  manage: boolean;
  approve: boolean;
  share: boolean;
  mapped: boolean;
  coordinator: boolean;
};

export function isClassAdmin(role: string) {
  return isAdminRole(role);
}

export function canApproveByRole(role: string) {
  return isAdminRole(role) || role === 'HOD' || role === 'PRINCIPAL';
}

export function resolveClassAccess(input: {
  role: string;
  isCoordinator: boolean;
  isMapped: boolean;
  canManageAssignment: boolean;
  sameDepartment: boolean;
}): ClassAccess {
  const admin = isClassAdmin(input.role);
  const hod = input.role === 'HOD' && input.sameDepartment;
  const coordinator = input.isCoordinator;
  const authorized = input.canManageAssignment;
  return {
    view: admin || coordinator || input.isMapped || hod || input.role === 'PRINCIPAL',
    manage: admin || coordinator || hod,
    approve: admin || coordinator || authorized || hod || input.role === 'PRINCIPAL',
    share: admin || coordinator || input.isMapped || hod,
    mapped: input.isMapped,
    coordinator,
  };
}
