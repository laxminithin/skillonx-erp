/**
 * Succession Planning — talent assessments, performance×potential matrix, pools.
 * Finalized assessments are immutable; corrections create an audited new version.
 * Reads finalized appraisal evidence read-only; never mutates appraisal.
 */
import { db } from '../../../db/index.js';
import { AppError } from '../../../utils/errors.js';
import { recordHrAudit } from '../audit.js';
import { assertHrPermission, hasHrPermission, employeeInCollege, assertManagesEmployee, successionScope, rowInCollege } from './access.js';
import { BAND } from './types.js';
// ── Talent assessments ───────────────────────────────────────────────────────
/** Read the employee's latest finalized appraisal rating (read-only) for evidence. */
async function latestAppraisalBand(collegeId, employeeId) {
    const a = await db('hr_employee_appraisals')
        .where({ college_id: collegeId, employee_id: employeeId })
        .whereNotNull('finalized_at')
        .whereNotNull('final_rating_value')
        .orderBy('finalized_at', 'desc')
        .first();
    if (!a)
        return null;
    const v = Number(a.final_rating_value);
    if (!Number.isFinite(v))
        return null;
    // Map on a 5-point convention; leaves null when unmappable rather than fabricating.
    if (v >= 4)
        return 'HIGH';
    if (v >= 2.5)
        return 'MEDIUM';
    return 'LOW';
}
export async function createAssessment(actor, input) {
    assertHrPermission(actor, 'hr.succession.assess');
    const emp = await employeeInCollege(actor, input.employeeId);
    if (!hasHrPermission(actor, 'hr.succession.manage'))
        await assertManagesEmployee(actor, emp);
    // Derive performance band from finalized appraisal when requested and not supplied.
    let performanceBand = input.performanceBand ?? null;
    let source = input.classificationSource;
    if (!performanceBand && source === 'APPRAISAL') {
        performanceBand = await latestAppraisalBand(actor.collegeId, emp.id);
        if (!performanceBand)
            source = 'ASSESSMENT'; // evidence incomplete — do not fabricate
    }
    const version = ((await db('succession_talent_assessments').where({ college_id: actor.collegeId, employee_id: emp.id, assessment_period: input.assessmentPeriod }).max('version_no as m').first())?.m ?? 0) + 1;
    const [id] = await db('succession_talent_assessments').insert({
        college_id: actor.collegeId,
        employee_id: emp.id,
        assessment_period: input.assessmentPeriod,
        assessor_faculty_id: actor.facultyUserId,
        performance_band: performanceBand,
        potential_band: input.potentialBand ?? null,
        overall_potential: input.overallPotential ?? input.potentialBand ?? null,
        readiness: input.readiness ?? null,
        leadership_capability: input.leadershipCapability ?? null,
        functional_capability: input.functionalCapability ?? null,
        institutional_knowledge: input.institutionalKnowledge ?? null,
        mobility: input.mobility ?? null,
        retention_concern: input.retentionConcern ?? null,
        development_summary: input.developmentSummary ?? null,
        comments: input.comments ?? null,
        classification_source: source,
        status: 'DRAFT',
        version_no: version,
    });
    await recordHrAudit({ actor, action: 'SUCCESSION_ASSESSMENT_CREATED', entityType: 'succession_talent_assessments', entityId: id });
    return { id, versionNo: version };
}
export async function updateAssessment(actor, id, input) {
    assertHrPermission(actor, 'hr.succession.assess');
    const a = await rowInCollege(actor, 'succession_talent_assessments', id);
    if (a.status === 'FINALIZED')
        throw new AppError(409, 'Finalized assessments are immutable; create a correction version instead');
    const patch = {};
    const map = {
        performanceBand: 'performance_band', potentialBand: 'potential_band', overallPotential: 'overall_potential', readiness: 'readiness',
        leadershipCapability: 'leadership_capability', functionalCapability: 'functional_capability', institutionalKnowledge: 'institutional_knowledge',
        mobility: 'mobility', retentionConcern: 'retention_concern', developmentSummary: 'development_summary', comments: 'comments', classificationSource: 'classification_source',
    };
    for (const [k, col] of Object.entries(map))
        if (input[k] !== undefined)
            patch[col] = input[k];
    if (Object.keys(patch).length) {
        patch.updated_at = db.fn.now();
        await db('succession_talent_assessments').where({ id }).update(patch);
    }
    return { id };
}
export async function finalizeAssessment(actor, id) {
    assertHrPermission(actor, 'hr.succession.assess');
    const a = await rowInCollege(actor, 'succession_talent_assessments', id);
    if (a.status === 'FINALIZED')
        return { id, status: 'FINALIZED', idempotent: true };
    await db('succession_talent_assessments').where({ id }).update({ status: 'FINALIZED', finalized_at: db.fn.now(), finalized_by: actor.facultyUserId, updated_at: db.fn.now() });
    await recordHrAudit({ actor, action: 'SUCCESSION_ASSESSMENT_FINALIZED', entityType: 'succession_talent_assessments', entityId: id });
    return { id, status: 'FINALIZED' };
}
/** Correction of a finalized assessment → new DRAFT version (history preserved). */
export async function correctAssessment(actor, id) {
    assertHrPermission(actor, 'hr.succession.assess');
    const a = await rowInCollege(actor, 'succession_talent_assessments', id);
    if (a.status !== 'FINALIZED')
        throw new AppError(409, 'Only a finalized assessment can be corrected');
    const version = ((await db('succession_talent_assessments').where({ college_id: actor.collegeId, employee_id: a.employee_id, assessment_period: a.assessment_period }).max('version_no as m').first())?.m ?? 0) + 1;
    const [newId] = await db('succession_talent_assessments').insert({
        ...pickAssessment(a), college_id: actor.collegeId, assessor_faculty_id: actor.facultyUserId, status: 'DRAFT',
        version_no: version, parent_assessment_id: a.id, finalized_at: null, finalized_by: null,
    });
    await recordHrAudit({ actor, action: 'SUCCESSION_ASSESSMENT_CORRECTION', entityType: 'succession_talent_assessments', entityId: newId, before: { parent: a.id } });
    return { id: newId, versionNo: version, parentId: a.id };
}
function pickAssessment(a) {
    return {
        employee_id: a.employee_id, assessment_period: a.assessment_period, performance_band: a.performance_band, potential_band: a.potential_band,
        overall_potential: a.overall_potential, readiness: a.readiness, leadership_capability: a.leadership_capability, functional_capability: a.functional_capability,
        institutional_knowledge: a.institutional_knowledge, mobility: a.mobility, retention_concern: a.retention_concern, development_summary: a.development_summary,
        comments: a.comments, classification_source: a.classification_source,
    };
}
export async function listAssessments(actor, opts = {}) {
    assertHrPermission(actor, 'hr.succession.view');
    const scope = successionScope(actor);
    let q = db('succession_talent_assessments as a').join('employees as e', 'e.id', 'a.employee_id').where('a.college_id', actor.collegeId);
    if (scope)
        q = q.whereIn('e.department_id', scope);
    if (opts.employeeId)
        q = q.where('a.employee_id', opts.employeeId);
    if (opts.period)
        q = q.where('a.assessment_period', opts.period);
    if (opts.status)
        q = q.where('a.status', opts.status);
    return q.orderBy('a.updated_at', 'desc').select('a.id', 'a.employee_id', 'e.display_name', 'a.assessment_period', 'a.performance_band', 'a.potential_band', 'a.overall_potential', 'a.readiness', 'a.classification_source', 'a.status', 'a.version_no', 'a.finalized_at');
}
/** Performance × Potential matrix from the latest FINALIZED assessment per employee. */
export async function talentMatrix(actor) {
    assertHrPermission(actor, 'hr.succession.view');
    const scope = successionScope(actor);
    let q = db('succession_talent_assessments as a')
        .join('employees as e', 'e.id', 'a.employee_id')
        .where('a.college_id', actor.collegeId)
        .where('a.status', 'FINALIZED')
        .whereNotNull('a.performance_band')
        .whereNotNull('a.potential_band');
    if (scope)
        q = q.whereIn('e.department_id', scope);
    // Latest finalized version per employee wins.
    const rows = await q.orderBy('a.employee_id').orderBy('a.version_no', 'desc').select('a.employee_id', 'a.performance_band', 'a.potential_band', 'a.classification_source');
    const seen = new Set();
    const cells = {};
    let classified = 0;
    const sources = {};
    for (const r of rows) {
        const eid = Number(r.employee_id);
        if (seen.has(eid))
            continue;
        seen.add(eid);
        const key = `${r.performance_band}:${r.potential_band}`;
        cells[key] = (cells[key] ?? 0) + 1;
        classified += 1;
        sources[String(r.classification_source)] = (sources[String(r.classification_source)] ?? 0) + 1;
    }
    const matrix = BAND.map((perf) => BAND.map((pot) => ({ performance: perf, potential: pot, count: cells[`${perf}:${pot}`] ?? 0 }))).flat();
    return { classifiedEmployees: classified, matrix, sources, note: 'Counts use the latest finalized assessment per employee; unclassified employees are excluded.' };
}
// ── Talent pools ─────────────────────────────────────────────────────────────
export async function createPool(actor, input) {
    assertHrPermission(actor, 'hr.succession.manage');
    const dup = await db('succession_talent_pools').where({ college_id: actor.collegeId, name: input.name }).first();
    if (dup)
        throw new AppError(409, 'A talent pool with this name already exists');
    const [id] = await db('succession_talent_pools').insert({
        college_id: actor.collegeId, name: input.name, description: input.description ?? null,
        department_id: input.departmentId ?? null, eligibility_criteria: input.eligibilityCriteria ?? null,
        owner_faculty_id: actor.facultyUserId, is_active: true,
    });
    await recordHrAudit({ actor, action: 'SUCCESSION_POOL_CREATED', entityType: 'succession_talent_pools', entityId: id });
    return { id };
}
export async function listPools(actor) {
    assertHrPermission(actor, 'hr.succession.view');
    const rows = await db('succession_talent_pools as p').where('p.college_id', actor.collegeId).orderBy('p.name')
        .select('p.*', db.raw('(select count(*) from succession_talent_pool_members m where m.pool_id = p.id and m.status = ?) as member_count', ['ACTIVE']));
    return rows;
}
export async function addPoolMember(actor, poolId, input) {
    assertHrPermission(actor, 'hr.succession.manage');
    const pool = await rowInCollege(actor, 'succession_talent_pools', poolId);
    const emp = await employeeInCollege(actor, input.employeeId);
    // Idempotent: an existing ACTIVE membership is returned unchanged.
    const existing = await db('succession_talent_pool_members').where({ college_id: actor.collegeId, pool_id: pool.id, employee_id: emp.id }).first();
    if (existing) {
        if (existing.status === 'ACTIVE')
            return { id: Number(existing.id), idempotent: true };
        await db('succession_talent_pool_members').where({ id: existing.id }).update({ status: 'ACTIVE', entry_date: db.fn.now(), exit_date: null, entry_reason: input.entryReason ?? null, updated_at: db.fn.now() });
        return { id: Number(existing.id), reactivated: true };
    }
    const [id] = await db('succession_talent_pool_members').insert({
        college_id: actor.collegeId, pool_id: pool.id, employee_id: emp.id, entry_date: db.fn.now(),
        entry_reason: input.entryReason ?? null, status: 'ACTIVE', added_by: actor.facultyUserId,
    });
    await recordHrAudit({ actor, action: 'SUCCESSION_POOL_MEMBER_ADDED', entityType: 'succession_talent_pool_members', entityId: id });
    return { id };
}
export async function removePoolMember(actor, poolId, memberId) {
    assertHrPermission(actor, 'hr.succession.manage');
    await rowInCollege(actor, 'succession_talent_pools', poolId);
    const m = await db('succession_talent_pool_members').where({ id: memberId, college_id: actor.collegeId, pool_id: poolId }).first();
    if (!m)
        throw new AppError(404, 'Pool member not found');
    if (m.status === 'EXITED')
        return { id: memberId, idempotent: true };
    await db('succession_talent_pool_members').where({ id: memberId }).update({ status: 'EXITED', exit_date: db.fn.now(), updated_at: db.fn.now() });
    await recordHrAudit({ actor, action: 'SUCCESSION_POOL_MEMBER_EXITED', entityType: 'succession_talent_pool_members', entityId: memberId });
    return { id: memberId, status: 'EXITED' };
}
export async function listPoolMembers(actor, poolId) {
    assertHrPermission(actor, 'hr.succession.view');
    await rowInCollege(actor, 'succession_talent_pools', poolId);
    return db('succession_talent_pool_members as m').join('employees as e', 'e.id', 'm.employee_id')
        .where({ 'm.college_id': actor.collegeId, 'm.pool_id': poolId })
        .orderBy('m.status').orderBy('e.display_name')
        .select('m.id', 'm.employee_id', 'e.display_name', 'e.department_id', 'm.entry_date', 'm.exit_date', 'm.status');
}
