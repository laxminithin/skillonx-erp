import { z } from 'zod';
export const LEADERSHIP_ROLES = ['HOD', 'PRINCIPAL'];
export const LEADERSHIP_ASSIGNMENT_STATUSES = ['ACTIVE', 'ENDED', 'REVOKED'];
export const HOD_CAPABILITIES = [
    'academic.faculty.self',
    'academic.department.view',
    'academic.department.manage',
    'academic.department.faculty.view',
    'academic.department.workload.view',
    'academic.department.timetable.view',
    'academic.department.attendance.view',
    'academic.department.leave.approve',
    'academic.department.performance.view',
    'academic.department.continuity.view',
    'academic.department.allocation.manage',
];
export const PRINCIPAL_CAPABILITIES = [
    'academic.faculty.self',
    'academic.institution.view',
    'academic.institution.departments.view',
    'academic.institution.performance.view',
    'academic.institution.continuity.view',
    'academic.institution.approvals',
    'academic.department.view',
    'academic.department.faculty.view',
    'academic.department.workload.view',
    'academic.department.timetable.view',
    'academic.department.attendance.view',
    'academic.department.performance.view',
    'academic.department.continuity.view',
];
// Executive leadership (Management / Chairman): institution-level academic
// visibility for the read-only command center. Deliberately EXCLUDES
// 'academic.institution.approvals' — strategic governance does not silently
// acquire academic operational approval authority.
export const MANAGEMENT_CAPABILITIES = [
    'academic.faculty.self',
    'academic.institution.view',
    'academic.institution.departments.view',
    'academic.institution.performance.view',
    'academic.institution.continuity.view',
    'academic.department.view',
    'academic.department.faculty.view',
    'academic.department.workload.view',
    'academic.department.timetable.view',
    'academic.department.attendance.view',
    'academic.department.performance.view',
    'academic.department.continuity.view',
];
export const FACULTY_CAPABILITIES = ['academic.faculty.self'];
export const createAssignmentSchema = z.object({
    employeeId: z.number().int().positive(),
    role: z.enum(LEADERSHIP_ROLES),
    departmentId: z.number().int().positive().nullable().optional(),
    effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    remarks: z.string().max(2000).nullable().optional(),
});
export const updateAssignmentSchema = z.object({
    effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    status: z.enum(LEADERSHIP_ASSIGNMENT_STATUSES).optional(),
    remarks: z.string().max(2000).nullable().optional(),
});
export const assignFacultySchema = z.object({
    classId: z.number().int().positive(),
    classSubjectId: z.number().int().positive(),
    facultyId: z.number().int().positive(),
    isPrimary: z.boolean().optional(),
    canManage: z.boolean().optional(),
});
export const FAR_FUTURE = '9999-12-31';
export function asDateOnly(value) {
    if (!value)
        return '';
    if (value instanceof Date) {
        const y = value.getFullYear();
        const m = String(value.getMonth() + 1).padStart(2, '0');
        const d = String(value.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    const s = String(value);
    const iso = s.match(/\d{4}-\d{2}-\d{2}/);
    if (iso)
        return iso[0];
    const parsed = new Date(s);
    if (!Number.isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    return s.slice(0, 10);
}
export function rangesOverlap(aFrom, aTo, bFrom, bTo) {
    const aEnd = aTo && aTo.length ? aTo : FAR_FUTURE;
    const bEnd = bTo && bTo.length ? bTo : FAR_FUTURE;
    return aFrom <= bEnd && bFrom <= aEnd;
}
export function isEffectiveOn(from, to, asOf) {
    if (from > asOf)
        return false;
    if (to && to < asOf)
        return false;
    return true;
}
