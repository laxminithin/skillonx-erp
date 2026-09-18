/**
 * Succession Planning — critical roles.
 */
import { db } from '../../../db/index.js';
import { AppError } from '../../../utils/errors.js';
import { recordHrAudit } from '../audit.js';
import { assertHrPermission, successionScope, roleVisible, assertRoleVisible, rowInCollege } from './access.js';
function serialize(input) {
    return {
        code: input.code,
        role_title: input.roleTitle,
        department_id: input.departmentId ?? null,
        designation_id: input.designationId ?? null,
        incumbent_employee_id: input.incumbentEmployeeId ?? null,
        criticality: input.criticality,
        impact_notes: input.impactNotes ?? null,
        vacancy_risk: input.vacancyRisk,
        exit_risk: input.exitRisk,
        replacement_urgency: input.replacementUrgency,
        required_competencies: input.requiredCompetencies ? JSON.stringify(input.requiredCompetencies) : null,
        min_experience_years: input.minExperienceYears ?? null,
        min_readiness: input.minReadiness ?? null,
        notes: input.notes ?? null,
        effective_from: input.effectiveFrom ?? null,
        effective_to: input.effectiveTo ?? null,
    };
}
export async function createRole(actor, input) {
    assertHrPermission(actor, 'hr.succession.manage');
    const dup = await db('succession_critical_roles').where({ college_id: actor.collegeId, code: input.code }).first();
    if (dup)
        throw new AppError(409, 'A critical role with this code already exists');
    if (input.incumbentEmployeeId) {
        const inc = await db('employees').where({ id: input.incumbentEmployeeId, college_id: actor.collegeId }).first();
        if (!inc)
            throw new AppError(400, 'Incumbent must be an employee of this college');
    }
    const [id] = await db('succession_critical_roles').insert({
        college_id: actor.collegeId,
        ...serialize({ ...input }),
        is_active: true,
        created_by: actor.facultyUserId,
        updated_by: actor.facultyUserId,
    });
    await recordHrAudit({ actor, action: 'SUCCESSION_ROLE_CREATED', entityType: 'succession_critical_roles', entityId: id });
    return { id };
}
export async function updateRole(actor, roleId, input) {
    assertHrPermission(actor, 'hr.succession.manage');
    const role = await rowInCollege(actor, 'succession_critical_roles', roleId);
    const patch = {};
    const map = {
        roleTitle: 'role_title', departmentId: 'department_id', designationId: 'designation_id', incumbentEmployeeId: 'incumbent_employee_id',
        criticality: 'criticality', impactNotes: 'impact_notes', vacancyRisk: 'vacancy_risk', exitRisk: 'exit_risk', replacementUrgency: 'replacement_urgency',
        minExperienceYears: 'min_experience_years', minReadiness: 'min_readiness', notes: 'notes', effectiveFrom: 'effective_from', effectiveTo: 'effective_to',
    };
    for (const [k, col] of Object.entries(map)) {
        if (input[k] !== undefined)
            patch[col] = input[k];
    }
    if (input.requiredCompetencies !== undefined)
        patch.required_competencies = input.requiredCompetencies ? JSON.stringify(input.requiredCompetencies) : null;
    if (Object.keys(patch).length) {
        patch.updated_by = actor.facultyUserId;
        patch.updated_at = db.fn.now();
        await db('succession_critical_roles').where({ id: roleId }).update(patch);
    }
    await recordHrAudit({ actor, action: 'SUCCESSION_ROLE_UPDATED', entityType: 'succession_critical_roles', entityId: roleId, before: { criticality: role.criticality } });
    return { id: roleId };
}
export async function setRoleActive(actor, roleId, active) {
    assertHrPermission(actor, 'hr.succession.manage');
    await rowInCollege(actor, 'succession_critical_roles', roleId);
    await db('succession_critical_roles').where({ id: roleId }).update({ is_active: active, updated_by: actor.facultyUserId, updated_at: db.fn.now() });
    await recordHrAudit({ actor, action: active ? 'SUCCESSION_ROLE_ACTIVATED' : 'SUCCESSION_ROLE_DEACTIVATED', entityType: 'succession_critical_roles', entityId: roleId });
    return { id: roleId, isActive: active };
}
export async function listRoles(actor, filters = {}) {
    assertHrPermission(actor, 'hr.succession.view');
    const scope = successionScope(actor);
    let q = db('succession_critical_roles as r')
        .leftJoin('departments as d', 'd.id', 'r.department_id')
        .leftJoin('employees as e', 'e.id', 'r.incumbent_employee_id')
        .where('r.college_id', actor.collegeId);
    if (scope)
        q = q.whereIn('r.department_id', scope);
    if (filters.departmentId)
        q = q.where('r.department_id', filters.departmentId);
    if (filters.criticality)
        q = q.where('r.criticality', filters.criticality);
    if (filters.active !== undefined)
        q = q.where('r.is_active', filters.active);
    return q.orderByRaw("FIELD(r.criticality,'CRITICAL','HIGH','MEDIUM','LOW')").select('r.id', 'r.code', 'r.role_title', 'r.department_id', 'd.name as department', 'r.criticality', 'r.vacancy_risk', 'r.exit_risk', 'r.is_active', 'r.incumbent_employee_id', 'e.display_name as incumbent_name');
}
export async function getRole(actor, roleId) {
    assertHrPermission(actor, 'hr.succession.view');
    const role = await rowInCollege(actor, 'succession_critical_roles', roleId);
    assertRoleVisible(actor, role);
    return role;
}
export { roleVisible };
