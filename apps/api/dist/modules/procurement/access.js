import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';
const ROLE_PERMISSIONS = {
    SUPER_ADMIN: [
        'procurement.view', 'procurement.indent.create', 'procurement.indent.approve',
        'procurement.vendor.manage', 'procurement.rfq.manage', 'procurement.quotation.manage',
        'procurement.po.create', 'procurement.po.approve', 'procurement.grn.create',
        'inventory.view', 'inventory.master.manage', 'inventory.issue', 'inventory.return',
        'inventory.transfer', 'inventory.adjust', 'procurement.analytics.view',
        'procurement.finance.handoff', 'procurement.asset.handoff',
    ],
    COLLEGE_ADMIN: [
        'procurement.view', 'procurement.indent.create', 'procurement.indent.approve',
        'procurement.vendor.manage', 'procurement.rfq.manage', 'procurement.quotation.manage',
        'procurement.po.create', 'procurement.po.approve', 'procurement.grn.create',
        'inventory.view', 'inventory.master.manage', 'inventory.issue', 'inventory.return',
        'inventory.transfer', 'inventory.adjust', 'procurement.analytics.view',
        'procurement.finance.handoff', 'procurement.asset.handoff',
    ],
    PRINCIPAL: ['procurement.view', 'procurement.indent.approve', 'procurement.po.approve', 'inventory.view', 'procurement.analytics.view'],
    MANAGEMENT: ['procurement.view', 'inventory.view', 'procurement.analytics.view'],
    CHAIRMAN: ['procurement.view', 'inventory.view', 'procurement.analytics.view'],
    HOD: ['procurement.view', 'procurement.indent.create', 'procurement.indent.approve', 'inventory.view'],
    FACULTY: ['procurement.view', 'procurement.indent.create', 'inventory.view'],
    LAB_ASSISTANT: ['procurement.view', 'procurement.indent.create', 'inventory.view'],
    MAINTENANCE_MANAGER: ['procurement.view', 'procurement.indent.create', 'inventory.view'],
    FACILITIES_OFFICER: ['procurement.view', 'procurement.indent.create', 'inventory.view', 'inventory.issue', 'inventory.return', 'inventory.transfer'],
    STORE_KEEPER: ['procurement.view', 'procurement.indent.create', 'inventory.view', 'inventory.issue', 'inventory.return', 'inventory.transfer', 'procurement.grn.create', 'procurement.asset.handoff'],
    PROCUREMENT_OFFICER: [
        'procurement.view', 'procurement.indent.create', 'procurement.vendor.manage',
        'procurement.rfq.manage', 'procurement.quotation.manage', 'procurement.po.create',
        'procurement.grn.create', 'inventory.view', 'inventory.master.manage',
        'inventory.issue', 'inventory.return', 'inventory.transfer', 'procurement.analytics.view',
        'procurement.finance.handoff', 'procurement.asset.handoff',
    ],
    ACCOUNTANT: ['procurement.view', 'inventory.view', 'procurement.finance.handoff'],
    // Campus OS Phase 2 — Canteen consumes createIssue/createReturn for its own POS
    // stock consumption/refund; these grants let those calls pass procurement's own
    // permission check without duplicating inventory movement logic in Canteen.
    CANTEEN_MANAGER: ['procurement.view', 'inventory.view', 'inventory.issue', 'inventory.return'],
    CANTEEN_STAFF: ['procurement.view', 'inventory.view', 'inventory.issue', 'inventory.return'],
};
export function procurementPermissionsForRole(role) {
    if (isSuperAdmin(role))
        return ROLE_PERMISSIONS.SUPER_ADMIN;
    return ROLE_PERMISSIONS[role] ?? [];
}
export function hasProcurementPermission(actor, permission) {
    if (isAdminRole(actor.role))
        return true;
    return procurementPermissionsForRole(actor.role).includes(permission);
}
export function assertProcurementPermission(actor, permission) {
    if (!hasProcurementPermission(actor, permission)) {
        throw new AppError(403, 'You do not have permission for this procurement action');
    }
}
export function assertDepartmentScope(actor, departmentId) {
    if (!departmentId || isAdminRole(actor.role) || ['PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN'].includes(actor.role))
        return;
    if (actor.role === 'HOD' && actor.departmentId === departmentId)
        return;
    if (actor.departmentId === departmentId && actor.role !== 'HOD')
        return;
    throw new AppError(403, 'This record is outside your department scope');
}
