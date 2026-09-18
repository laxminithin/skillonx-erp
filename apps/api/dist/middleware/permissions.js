import { db } from '../db/index.js';
import { AppError } from '../utils/errors.js';
import { isAdminRole, parsePermissions, } from '../utils/permissions.js';
export function requirePermission(permission) {
    return async (req, _res, next) => {
        try {
            if (!req.user)
                throw new AppError(401, 'Authentication required');
            if (isAdminRole(req.user.role))
                return next();
            const row = await db('faculty_users')
                .where({ id: req.user.facultyUserId, is_active: true })
                .first();
            if (!row)
                throw new AppError(403, 'Account is inactive');
            const permissions = parsePermissions(row.permissions);
            if (!permissions[permission]) {
                throw new AppError(403, 'You do not have permission for this action');
            }
            next();
        }
        catch (err) {
            next(err);
        }
    };
}
