import { AppError } from '../../utils/errors.js';
import { isClassAdmin } from '../academicClasses/access.js';
import { getClassAccess, loadClassRow } from '../academicClasses/service.js';
export function canScheduleTimetable(actor, access) {
    return isClassAdmin(actor.role) || actor.role === 'PRINCIPAL' || access.manage;
}
export async function assertCanScheduleClass(actor, classId) {
    const classRow = await loadClassRow(classId, actor.collegeId);
    if (Number(classRow.college_id) !== actor.collegeId) {
        throw new AppError(403, 'You cannot access this class', undefined, 'TENANT_MISMATCH');
    }
    const access = await getClassAccess(actor, classRow);
    if (!canScheduleTimetable(actor, access)) {
        throw new AppError(403, 'You are not authorized to edit this class timetable');
    }
    return { classRow, access };
}
export async function assertCanViewClassSchedule(actor, classId) {
    const classRow = await loadClassRow(classId, actor.collegeId);
    if (Number(classRow.college_id) !== actor.collegeId) {
        throw new AppError(403, 'You cannot access this class', undefined, 'TENANT_MISMATCH');
    }
    const access = await getClassAccess(actor, classRow);
    if (!access.view && !isClassAdmin(actor.role) && actor.role !== 'PRINCIPAL') {
        throw new AppError(403, 'You are not authorized to view this class timetable');
    }
    return { classRow, access };
}
export function assertInstitutionAdmin(actor) {
    if (!isClassAdmin(actor.role) && actor.role !== 'PRINCIPAL' && actor.role !== 'HOD') {
        throw new AppError(403, 'Only college admin, principal, or HOD can manage this resource');
    }
}
export function assertPeriodAdmin(actor) {
    if (!isClassAdmin(actor.role) && actor.role !== 'PRINCIPAL') {
        throw new AppError(403, 'Only college admin can change institution timetable periods');
    }
}
