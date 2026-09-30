import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isSuperAdmin } from '../../utils/permissions.js';
const ROLE_HOSTEL_PERMISSIONS = {
    SUPER_ADMIN: ['hostel.view', 'hostel.config.manage', 'hostel.report.view', 'hostel.management.view'],
    COLLEGE_ADMIN: ['hostel.view', 'hostel.config.manage', 'hostel.report.view', 'hostel.management.view'],
    PRINCIPAL: ['hostel.report.view', 'hostel.management.view'],
    CHIEF_WARDEN: [
        'hostel.view', 'hostel.application.review', 'hostel.resident.manage',
        'hostel.allocation.manage', 'hostel.transfer.manage', 'hostel.outpass.approve',
        'hostel.leave.approve', 'hostel.visitor.manage', 'hostel.complaint.manage',
        'hostel.incident.manage', 'hostel.damage.manage', 'hostel.vacating.manage',
        'hostel.clearance.manage', 'hostel.report.view', 'hostel.gate.manage',
    ],
    WARDEN: [
        'hostel.view', 'hostel.application.review', 'hostel.resident.manage',
        'hostel.allocation.manage', 'hostel.transfer.manage', 'hostel.outpass.approve',
        'hostel.leave.approve', 'hostel.visitor.manage', 'hostel.complaint.manage',
        'hostel.vacating.manage', 'hostel.report.view', 'hostel.gate.manage',
    ],
    ASSISTANT_WARDEN: [
        'hostel.view', 'hostel.application.review', 'hostel.resident.manage',
        'hostel.outpass.approve', 'hostel.leave.approve', 'hostel.visitor.manage',
        'hostel.complaint.manage', 'hostel.gate.manage',
    ],
    MESS_MANAGER: ['hostel.view', 'hostel.mess.manage', 'hostel.report.view'],
    SECURITY: ['hostel.view', 'hostel.gate.manage', 'hostel.visitor.manage'],
    MAINTENANCE: ['hostel.view', 'hostel.maintenance.manage', 'hostel.complaint.manage'],
    HOD: [],
    MANAGEMENT: ['hostel.view', 'hostel.report.view', 'hostel.management.view'],
    FACULTY: [],
};
export function hostelPermissionsForRole(role) {
    if (isSuperAdmin(role))
        return ROLE_HOSTEL_PERMISSIONS.SUPER_ADMIN;
    if (role === 'CHAIRMAN')
        return ROLE_HOSTEL_PERMISSIONS.MANAGEMENT;
    return ROLE_HOSTEL_PERMISSIONS[role] ?? [];
}
export function hasHostelPermission(actor, permission) {
    return hostelPermissionsForRole(actor.role).includes(permission);
}
export function assertHostelPermission(actor, permission) {
    if (!hasHostelPermission(actor, permission)) {
        throw new AppError(403, 'You do not have permission for this hostel action');
    }
}
export function assertManagementReadOnly(actor) {
    if (!hasHostelPermission(actor, 'hostel.management.view')) {
        throw new AppError(403, 'Management analytics access denied');
    }
}
export function hasInstitutionWideHostelRead(actor) {
    return ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN'].includes(actor.role);
}
export async function assertHostelCollege(table, id, collegeId) {
    const row = await db(table).where({ id }).first();
    if (!row)
        throw new AppError(404, 'Record not found');
    if (Number(row.college_id) !== collegeId)
        throw new AppError(404, 'Record not found');
    return row;
}
export async function assertStudentCollege(studentId, collegeId) {
    const student = await db('students').where({ id: studentId, college_id: collegeId }).first();
    if (!student)
        throw new AppError(404, 'Student not found');
    return student;
}
export async function getWardenHostelIds(actor) {
    if (hasInstitutionWideHostelRead(actor)) {
        const rows = await db('hostels').where({ college_id: actor.collegeId, status: 'ACTIVE' }).select('id');
        return rows.map((r) => Number(r.id));
    }
    const rows = await db('hostel_warden_assignments')
        .where({ faculty_user_id: actor.facultyUserId, college_id: actor.collegeId, status: 'ACTIVE' })
        .select('hostel_id');
    return rows.map((r) => Number(r.hostel_id));
}
export async function assertWardenHostelAccess(actor, hostelId) {
    if (hasInstitutionWideHostelRead(actor) && !hasHostelPermission(actor, 'hostel.allocation.manage'))
        return;
    const ids = await getWardenHostelIds(actor);
    if (!ids.includes(hostelId)) {
        throw new AppError(403, 'You are not assigned to this hostel');
    }
}
export async function assertStudentOwnsApplication(studentId, applicationId, collegeId) {
    const app = await db('hostel_applications')
        .where({ id: applicationId, student_id: studentId, college_id: collegeId })
        .first();
    if (!app)
        throw new AppError(404, 'Application not found');
    return app;
}
export async function assertActiveResident(studentId, collegeId) {
    const resident = await db('hostel_residents')
        .where({ student_id: studentId, college_id: collegeId })
        .whereIn('status', ['ACTIVE', 'TEMPORARILY_AWAY', 'VACATING'])
        .first();
    if (!resident)
        throw new AppError(403, 'Active hostel resident access required');
    return resident;
}
export async function assertStudentOwnsResident(studentId, residentId, collegeId) {
    const resident = await db('hostel_residents')
        .where({ id: residentId, student_id: studentId, college_id: collegeId })
        .first();
    if (!resident)
        throw new AppError(404, 'Resident record not found');
    return resident;
}
