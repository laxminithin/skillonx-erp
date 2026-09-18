import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { signToken } from '../../utils/token.js';
import { parsePermissions, ROLE_LABELS } from '../../utils/permissions.js';
import { getPasswordError, PASSWORD_MIN_LENGTH } from '../../utils/password.js';
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
export const forgotPasswordSchema = z.object({
    email: z.string().email(),
});
export const changePasswordSchema = z
    .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(PASSWORD_MIN_LENGTH),
    confirmPassword: z.string().min(1),
})
    .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match.',
    path: ['confirmPassword'],
});
export const updateProfileSchema = z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255).optional(),
    phone: z
        .string()
        .trim()
        .max(32)
        .regex(/^[0-9+()\-\s]*$/, 'Enter a valid phone number')
        .nullable()
        .optional(),
});
export async function login(email, password) {
    const user = await db('faculty_users')
        .where({ email, is_active: true })
        .first();
    if (!user) {
        throw new AppError(401, 'Invalid email or password');
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
        throw new AppError(401, 'Invalid email or password');
    }
    // Tenant suspension policy: a suspended/archived tenant blocks its members,
    // but never a platform Super Admin (who must be able to restore it).
    if (user.role !== 'SUPER_ADMIN') {
        const college = await db('colleges').where({ id: user.college_id }).select('status').first();
        if (college && (college.status === 'SUSPENDED' || college.status === 'ARCHIVED')) {
            throw new AppError(403, 'This institution is currently suspended. Contact your administrator.', undefined, 'TENANT_SUSPENDED');
        }
    }
    await db('faculty_users').where({ id: user.id }).update({ last_login_at: db.fn.now() });
    const token = signToken({
        kind: 'faculty',
        facultyUserId: user.id,
        collegeId: user.college_id,
        departmentId: user.department_id,
        role: user.role,
        email: user.email,
        name: user.name,
    });
    const profile = await me(user.id);
    return {
        token,
        user: profile,
    };
}
export async function me(facultyUserId) {
    const user = await db('faculty_users as f')
        .leftJoin('departments as d', 'd.id', 'f.department_id')
        .leftJoin('colleges as c', 'c.id', 'f.college_id')
        .where('f.id', facultyUserId)
        .select('f.id', 'f.name', 'f.email', 'f.role', 'f.is_active as isActive', 'f.employee_id as employeeId', 'f.phone', 'f.designation', 'f.permissions', 'f.last_login_at as lastLoginAt', 'f.last_password_change_at as lastPasswordChangeAt', 'f.created_at as createdAt', 'f.college_id as collegeId', 'f.department_id as departmentId', 'd.name as departmentName', 'd.code as departmentCode', 'c.name as collegeName', 'c.code as collegeCode', 'c.timezone as timezone')
        .first();
    if (!user)
        throw new AppError(404, 'User not found');
    if (!user.isActive)
        throw new AppError(403, 'Account is deactivated');
    let leadership = null;
    try {
        const { serializeMeLeadership } = await import('../academicLeadership/leadership.js');
        leadership = await serializeMeLeadership({
            facultyUserId: Number(user.id),
            collegeId: Number(user.collegeId),
            departmentId: user.departmentId != null ? Number(user.departmentId) : null,
            role: String(user.role),
            name: String(user.name),
        });
    }
    catch {
        leadership = null;
    }
    let tp = null;
    try {
        const { enrichPlacementActor } = await import('../placement/access.js');
        const ctx = await enrichPlacementActor({
            facultyUserId: Number(user.id),
            collegeId: Number(user.collegeId),
            departmentId: user.departmentId != null ? Number(user.departmentId) : null,
            role: String(user.role),
        });
        tp = {
            roles: ctx.tpRoles ?? [],
            departmentIds: ctx.tpDepartmentIds ?? [],
            employeeId: ctx.employeeId ?? null,
        };
    }
    catch {
        tp = null;
    }
    return {
        ...user,
        isActive: Boolean(user.isActive),
        timezone: user.timezone || 'Asia/Kolkata',
        permissions: parsePermissions(user.permissions),
        roleLabel: ROLE_LABELS[user.role] ?? user.role,
        leadership,
        tp,
    };
}
export async function forgotPassword(email) {
    const user = await db('faculty_users').where({ email }).first();
    // Always return success to avoid email enumeration
    if (!user) {
        return { message: 'If that email exists, a reset link has been logged for development.' };
    }
    const token = randomBytes(24).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await db('faculty_users').where({ id: user.id }).update({
        reset_token: token,
        reset_token_expires_at: expires,
    });
    // Never log the reset token — it is a bearer credential. Delivery of the
    // token belongs to an email/SMS integration, not the application log.
    return { message: 'If that email exists, password reset instructions will be sent.' };
}
export async function changePassword(facultyUserId, input) {
    const user = await db('faculty_users').where({ id: facultyUserId }).first();
    if (!user)
        throw new AppError(404, 'User not found');
    if (!user.is_active)
        throw new AppError(403, 'Account is deactivated');
    const ok = await bcrypt.compare(input.currentPassword, user.password_hash);
    if (!ok) {
        throw new AppError(400, 'Current password is incorrect.');
    }
    const sameAsCurrent = await bcrypt.compare(input.newPassword, user.password_hash);
    if (sameAsCurrent) {
        throw new AppError(400, 'Your new password must be different from your current password.');
    }
    const policyError = getPasswordError(input.newPassword);
    if (policyError) {
        throw new AppError(400, policyError);
    }
    const passwordHash = await bcrypt.hash(input.newPassword, 10);
    await db('faculty_users').where({ id: facultyUserId }).update({
        password_hash: passwordHash,
        last_password_change_at: db.fn.now(),
        // Invalidate any pending self-service reset once the password is changed.
        reset_token: null,
        reset_token_expires_at: null,
    });
    return { message: 'Your password has been changed successfully.' };
}
export async function updateProfile(facultyUserId, input) {
    const patch = {};
    if (input.name !== undefined)
        patch.name = input.name;
    if (input.phone !== undefined)
        patch.phone = input.phone === '' ? null : input.phone;
    if (Object.keys(patch).length) {
        await db('faculty_users').where({ id: facultyUserId }).update(patch);
    }
    return me(facultyUserId);
}
