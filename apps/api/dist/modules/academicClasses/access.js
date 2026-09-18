import { isAdminRole } from '../../utils/permissions.js';
export function isClassAdmin(role) {
    return isAdminRole(role);
}
export function canApproveByRole(role) {
    return isAdminRole(role) || role === 'HOD' || role === 'PRINCIPAL';
}
export function resolveClassAccess(input) {
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
