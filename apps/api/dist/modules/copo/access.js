import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';
import { EDITABLE_MAPPING_STATUSES } from './types.js';
export function canManageOfficialMasters(role) {
    return role === 'SUPER_ADMIN' || role === 'COLLEGE_ADMIN';
}
export function canReviewMappings(role) {
    return (isSuperAdmin(role) ||
        isAdminRole(role) ||
        role === 'HOD' ||
        role === 'NBA_COORDINATOR' ||
        role === 'IQAC_COORDINATOR' ||
        role === 'PRINCIPAL');
}
export function canApproveMappings(role) {
    return canReviewMappings(role);
}
export function canViewCollegeMappings(role) {
    return canReviewMappings(role);
}
/** True when the actor may manage all operational mappings in their institution. */
export function canManageAllOperationalMappings(role) {
    return isAdminRole(role);
}
export function canEditMapping(role, status, isAssigned) {
    if (canManageOfficialMasters(role))
        return true;
    if (!EDITABLE_MAPPING_STATUSES.includes(status) && status !== 'NOT_STARTED')
        return false;
    if (role === 'HOD' && isAssigned)
        return true;
    return role === 'FACULTY' && isAssigned;
}
export function canSubmitMapping(role, isAssigned) {
    if (canManageOfficialMasters(role))
        return true;
    return (role === 'FACULTY' || role === 'HOD') && isAssigned;
}
export function isFacultyScoped(role) {
    return role === 'FACULTY';
}
export function isDepartmentScoped(role) {
    return role === 'HOD';
}
export function decideMasterWriteAccess(actor, collegeId) {
    if (isSuperAdmin(actor.role))
        return 'ALLOW';
    if (actor.collegeId !== collegeId)
        return 'NOT_FOUND';
    if (canManageOfficialMasters(actor.role))
        return 'ALLOW';
    return 'FORBIDDEN';
}
/**
 * Workspace / legacy mapping read access.
 * Kept for non-operational workspace flows. Faculty may read if assigned OR creator.
 */
export function decideMappingReadAccess(actor, mapping) {
    if (isSuperAdmin(actor.role))
        return 'ALLOW';
    if (mapping.collegeId !== actor.collegeId)
        return 'NOT_FOUND';
    if (canViewCollegeMappings(actor.role) && !isDepartmentScoped(actor.role))
        return 'ALLOW';
    if (isDepartmentScoped(actor.role)) {
        if (!actor.departmentId || !mapping.departmentId)
            return 'ALLOW';
        return actor.departmentId === mapping.departmentId ? 'ALLOW' : 'FORBIDDEN';
    }
    const assigned = mapping.assignedFacultyIds ?? [];
    if (assigned.includes(actor.facultyUserId) || mapping.createdBy === actor.facultyUserId)
        return 'ALLOW';
    return 'FORBIDDEN';
}
/**
 * Hardened operational mapping ownership (Survey-aligned).
 *
 * FACULTY (and non-admin roles that are not intentional reviewers): creator only.
 * COLLEGE_ADMIN / SUPER_ADMIN: institution / cross-institution per policy.
 * HOD / NBA / IQAC / PRINCIPAL: retain existing broader college/department review access.
 */
export function decideOperationalMappingAccess(actor, mapping) {
    if (isSuperAdmin(actor.role))
        return 'ALLOW';
    if (mapping.collegeId !== actor.collegeId)
        return 'NOT_FOUND';
    if (canManageAllOperationalMappings(actor.role))
        return 'ALLOW';
    if (canViewCollegeMappings(actor.role)) {
        if (isDepartmentScoped(actor.role)) {
            if (!actor.departmentId || !mapping.departmentId)
                return 'ALLOW';
            return actor.departmentId === mapping.departmentId ? 'ALLOW' : 'FORBIDDEN';
        }
        return 'ALLOW';
    }
    if (mapping.createdBy != null && mapping.createdBy === actor.facultyUserId)
        return 'ALLOW';
    return 'FORBIDDEN';
}
export function decideOperationalMappingMutateAccess(actor, mapping) {
    if (isSuperAdmin(actor.role))
        return 'ALLOW';
    if (mapping.collegeId !== actor.collegeId)
        return 'NOT_FOUND';
    if (canManageAllOperationalMappings(actor.role))
        return 'ALLOW';
    // Reviewers may finalize/approve institution mappings; edits still require creator or admin.
    if (mapping.createdBy != null && mapping.createdBy === actor.facultyUserId)
        return 'ALLOW';
    return 'FORBIDDEN';
}
async function loadOperationalOwnership(mappingId) {
    const row = await db('copo_mapping_versions as v')
        .leftJoin('courses as c', 'c.id', 'v.course_id')
        .where({ 'v.id': mappingId })
        .select('v.id', 'v.college_id as collegeId', 'v.created_by as createdBy', 'v.course_id as courseId', 'v.academic_year_id as academicYearId', 'v.status', 'v.source_mapping_version_id as sourceMappingVersionId', 'c.department_id as departmentId')
        .first();
    if (!row)
        return null;
    return {
        id: Number(row.id),
        collegeId: Number(row.collegeId),
        createdBy: row.createdBy == null ? null : Number(row.createdBy),
        departmentId: row.departmentId == null ? null : Number(row.departmentId),
        courseId: Number(row.courseId),
        academicYearId: row.academicYearId == null ? null : Number(row.academicYearId),
        status: String(row.status || 'DRAFT'),
        isOperational: row.sourceMappingVersionId != null,
    };
}
/**
 * Assert the actor may access an operational mapping.
 * Cross-tenant → 404. Same-college non-owner faculty → 403 MAPPING_FORBIDDEN.
 */
export async function assertOperationalMappingAccess(mappingId, actor, mode = 'read') {
    if (!Number.isFinite(mappingId))
        throw new AppError(404, 'Mapping not found');
    const mapping = await loadOperationalOwnership(mappingId);
    if (!mapping || !mapping.isOperational)
        throw new AppError(404, 'Mapping not found');
    const decision = mode === 'mutate'
        ? decideOperationalMappingMutateAccess(actor, mapping)
        : decideOperationalMappingAccess(actor, mapping);
    if (decision === 'ALLOW')
        return mapping;
    if (decision === 'NOT_FOUND')
        throw new AppError(404, 'Mapping not found');
    throw new AppError(403, "You don't have access to this mapping.", undefined, 'MAPPING_FORBIDDEN');
}
