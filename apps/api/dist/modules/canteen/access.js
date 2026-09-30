import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';
// Least-privilege, same convention as Procurement's STORE_KEEPER/PROCUREMENT_OFFICER
// (docs/CAMPUS_OS_PHASE1_PREIMPLEMENTATION_AUDIT.md): smallest new operational roles,
// oversight roles get read-only visibility, never operational mutation.
const ROLE_PERMISSIONS = {
    SUPER_ADMIN: ['canteen.menu.manage', 'canteen.order.create', 'canteen.order.view', 'canteen.settlement.manage', 'canteen.reports.view'],
    COLLEGE_ADMIN: ['canteen.menu.manage', 'canteen.order.create', 'canteen.order.view', 'canteen.settlement.manage', 'canteen.reports.view'],
    CANTEEN_MANAGER: ['canteen.menu.manage', 'canteen.order.create', 'canteen.order.view', 'canteen.settlement.manage', 'canteen.reports.view'],
    CANTEEN_STAFF: ['canteen.order.create', 'canteen.order.view'],
    PRINCIPAL: ['canteen.order.view', 'canteen.reports.view'],
    MANAGEMENT: ['canteen.order.view', 'canteen.reports.view'],
    CHAIRMAN: ['canteen.order.view', 'canteen.reports.view'],
    ACCOUNTANT: ['canteen.order.view', 'canteen.reports.view'],
};
export function canteenPermissionsForRole(role) {
    if (isSuperAdmin(role))
        return ROLE_PERMISSIONS.SUPER_ADMIN;
    return ROLE_PERMISSIONS[role] ?? [];
}
export function hasCanteenPermission(actor, permission) {
    if (isAdminRole(actor.role))
        return true;
    return canteenPermissionsForRole(actor.role).includes(permission);
}
export function assertCanteenPermission(actor, permission) {
    if (!hasCanteenPermission(actor, permission)) {
        throw new AppError(403, 'You do not have permission for this canteen action');
    }
}
