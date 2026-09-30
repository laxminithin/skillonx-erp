import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';
// Two-layer authorization by design:
//  1) this capability check (can this role touch the workflow engine at all), then
//  2) the step's own `allowed_roles` (can this role act at THIS step of THIS instance),
//     enforced in service.ts. Defining new workflows is admin-tier only; acting on an
//     instance is available to the operational roles likely to be future consumers
//     (Security/Gate, Scholarship), gated tighter per-step by workflow data itself.
const ROLE_PERMISSIONS = {
    SUPER_ADMIN: ['workflow.definition.manage', 'workflow.instance.start', 'workflow.instance.view', 'workflow.instance.act'],
    COLLEGE_ADMIN: ['workflow.definition.manage', 'workflow.instance.start', 'workflow.instance.view', 'workflow.instance.act'],
    PRINCIPAL: ['workflow.instance.view', 'workflow.instance.act'],
    MANAGEMENT: ['workflow.instance.view'],
    CHAIRMAN: ['workflow.instance.view'],
    HOD: ['workflow.instance.start', 'workflow.instance.view', 'workflow.instance.act'],
    FACULTY: ['workflow.instance.start', 'workflow.instance.view', 'workflow.instance.act'],
    MAINTENANCE_MANAGER: ['workflow.instance.start', 'workflow.instance.view', 'workflow.instance.act'],
    FACILITIES_OFFICER: ['workflow.instance.start', 'workflow.instance.view', 'workflow.instance.act'],
    PROCUREMENT_OFFICER: ['workflow.instance.start', 'workflow.instance.view', 'workflow.instance.act'],
    ACCOUNTANT: ['workflow.instance.start', 'workflow.instance.view', 'workflow.instance.act'],
    RESEARCH_COORDINATOR: ['workflow.instance.start', 'workflow.instance.view', 'workflow.instance.act'],
};
export function workflowPermissionsForRole(role) {
    if (isSuperAdmin(role))
        return ROLE_PERMISSIONS.SUPER_ADMIN;
    return ROLE_PERMISSIONS[role] ?? [];
}
export function hasWorkflowPermission(actor, permission) {
    if (isAdminRole(actor.role))
        return true;
    return workflowPermissionsForRole(actor.role).includes(permission);
}
export function assertWorkflowPermission(actor, permission) {
    if (!hasWorkflowPermission(actor, permission)) {
        throw new AppError(403, 'You do not have permission for this workflow action');
    }
}
