import { Router } from 'express';
import { asyncHandler, validate, AppError } from '../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import { db } from '../../db/index.js';
import { PROFILE_SECTIONS, VERIFICATION_STATUSES, AWARD_LEVELS, WRITABLE_DOMAINS, DERIVED_DOMAINS, identifiersSchema, notApplicableSchema, recordCreateSchema, recordUpdateSchema, evidenceMetaSchema, verificationActionSchema, } from './types.js';
import { resolveTarget, actorEmployee, canVerify, canActAsVerifier, hodDepartmentIds } from './access.js';
import { coreProfile, updateIdentifiers, setNotApplicable, academicYears } from './profile.js';
import { listRecords, getRecord, createRecord, updateRecord, archiveRecord } from './records.js';
import { attachEvidence, readEvidence, deleteEvidence } from './evidence.js';
import { submitRecord, actOnVerification, verificationInbox } from './verification.js';
import { allDerived } from './derive.js';
import { computeCompleteness } from './completeness.js';
import { profileOverview } from './overview.js';
import { resolveLeadershipContext } from '../academicLeadership/leadership.js';
function actor(req) {
    return {
        facultyUserId: req.user.facultyUserId,
        collegeId: req.user.collegeId,
        departmentId: req.user.departmentId ?? null,
        role: req.user.role,
        name: req.user.name,
        hodDepartmentIds: req.hodDepartmentIds,
    };
}
const num = (v) => {
    if (v === undefined || v === null || v === '')
        return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};
export const facultyProfileRouter = Router();
facultyProfileRouter.use(requireAuth);
/**
 * Canonical HOD authority enrichment. Resolves the Academic Leadership context
 * once per request so Faculty Profile authorization consumes the institution's
 * existing HOD model (department-scoped leadership assignments) instead of only
 * the legacy `faculty_users.role` field. Failures are non-fatal: the actor then
 * falls back to legacy role-based semantics.
 */
facultyProfileRouter.use(asyncHandler(async (req, _res, next) => {
    try {
        const ctx = await resolveLeadershipContext({
            facultyUserId: req.user.facultyUserId,
            collegeId: req.user.collegeId,
            role: req.user.role,
            departmentId: req.user.departmentId ?? null,
        });
        req.hodDepartmentIds = ctx.hodDepartmentIds;
    }
    catch {
        req.hodDepartmentIds = undefined;
    }
    next();
}));
// ── Meta / capabilities ────────────────────────────────────────────────────
facultyProfileRouter.get('/meta', asyncHandler(async (req, res) => {
    const a = actor(req);
    const own = await actorEmployee(a);
    res.json({
        role: a.role,
        hasEmployeeRecord: !!own,
        sections: PROFILE_SECTIONS,
        verificationStatuses: VERIFICATION_STATUSES,
        awardLevels: AWARD_LEVELS,
        domains: Object.values(WRITABLE_DOMAINS).map((d) => ({
            domain: d.domain, label: d.label, section: d.section, recordTypes: d.recordTypes,
            verifiable: d.verifiable, evidenceExpected: d.evidenceExpected, uniqueRefField: d.uniqueRefField ?? null,
        })),
        derivedDomains: Object.values(DERIVED_DOMAINS),
        canVerify: canActAsVerifier(a),
    });
}));
facultyProfileRouter.get('/academic-years', asyncHandler(async (req, res) => {
    res.json(await academicYears(actor(req).collegeId));
}));
// ── Profile ─────────────────────────────────────────────────────────────────
facultyProfileRouter.get('/profile', asyncHandler(async (req, res) => {
    const a = actor(req);
    const emp = await resolveTarget(a, num(req.query.employeeId));
    res.json(await coreProfile(a.collegeId, emp));
}));
facultyProfileRouter.get('/overview', asyncHandler(async (req, res) => {
    const a = actor(req);
    const emp = await resolveTarget(a, num(req.query.employeeId));
    res.json(await profileOverview(a, emp));
}));
facultyProfileRouter.get('/completeness', asyncHandler(async (req, res) => {
    const a = actor(req);
    const emp = await resolveTarget(a, num(req.query.employeeId));
    res.json(await computeCompleteness(a, emp));
}));
facultyProfileRouter.get('/derived', asyncHandler(async (req, res) => {
    const a = actor(req);
    const emp = await resolveTarget(a, num(req.query.employeeId));
    res.json(await allDerived(a, emp));
}));
facultyProfileRouter.patch('/identifiers', asyncHandler(async (req, res) => {
    const a = actor(req);
    const emp = await actorEmployee(a);
    if (!emp)
        throw new AppError(404, 'No employee record is linked to your account');
    const input = validate(identifiersSchema, req.body);
    res.json(await updateIdentifiers(a, emp, input));
}));
facultyProfileRouter.post('/not-applicable', asyncHandler(async (req, res) => {
    const a = actor(req);
    const emp = await actorEmployee(a);
    if (!emp)
        throw new AppError(404, 'No employee record is linked to your account');
    const input = validate(notApplicableSchema, req.body);
    res.json(await setNotApplicable(a, emp, input.section, input.notApplicable));
}));
// ── Records ───────────────────────────────────────────────────────────────
facultyProfileRouter.get('/records', asyncHandler(async (req, res) => {
    const a = actor(req);
    const emp = await resolveTarget(a, num(req.query.employeeId));
    const q = req.query;
    res.json(await listRecords(a, emp, {
        domain: q.domain ? String(q.domain) : undefined,
        academicYearLabel: q.academicYear ? String(q.academicYear) : undefined,
        category: q.category ? String(q.category) : undefined,
        status: q.status ? String(q.status) : undefined,
        verificationStatus: q.verificationStatus ? String(q.verificationStatus) : undefined,
        recordType: q.recordType ? String(q.recordType) : undefined,
        includeArchived: q.includeArchived === 'true',
    }));
}));
facultyProfileRouter.post('/records', asyncHandler(async (req, res) => {
    const a = actor(req);
    const emp = await actorEmployee(a);
    if (!emp)
        throw new AppError(404, 'No employee record is linked to your account');
    const input = validate(recordCreateSchema, req.body);
    res.status(201).json(await createRecord(a, emp, input));
}));
facultyProfileRouter.get('/records/:id', asyncHandler(async (req, res) => {
    const a = actor(req);
    const emp = await resolveTarget(a, num(req.query.employeeId));
    res.json(await getRecord(a, emp, Number(req.params.id)));
}));
facultyProfileRouter.patch('/records/:id', asyncHandler(async (req, res) => {
    const a = actor(req);
    const emp = await actorEmployee(a);
    if (!emp)
        throw new AppError(404, 'No employee record is linked to your account');
    const input = validate(recordUpdateSchema, req.body);
    res.json(await updateRecord(a, emp, Number(req.params.id), input));
}));
facultyProfileRouter.post('/records/:id/archive', asyncHandler(async (req, res) => {
    const a = actor(req);
    const emp = await actorEmployee(a);
    if (!emp)
        throw new AppError(404, 'No employee record is linked to your account');
    res.json(await archiveRecord(a, emp, Number(req.params.id)));
}));
facultyProfileRouter.post('/records/:id/submit', asyncHandler(async (req, res) => {
    const a = actor(req);
    const emp = await actorEmployee(a);
    if (!emp)
        throw new AppError(404, 'No employee record is linked to your account');
    res.json(await submitRecord(a, emp, Number(req.params.id)));
}));
// ── Evidence ────────────────────────────────────────────────────────────────
facultyProfileRouter.post('/records/:id/evidence', asyncHandler(async (req, res) => {
    const a = actor(req);
    const emp = await actorEmployee(a);
    if (!emp)
        throw new AppError(404, 'No employee record is linked to your account');
    const input = validate(evidenceMetaSchema, req.body);
    res.status(201).json(await attachEvidence(a, emp, Number(req.params.id), input));
}));
facultyProfileRouter.get('/evidence/:id/download', asyncHandler(async (req, res) => {
    const a = actor(req);
    const { evidence, body } = await readEvidence(a, Number(req.params.id));
    res.setHeader('Content-Type', String(evidence.mime_type || 'application/octet-stream'));
    res.setHeader('Content-Disposition', `inline; filename="${String(evidence.file_name).replace(/[^\w.\-]/g, '_')}"`);
    res.send(body);
}));
facultyProfileRouter.delete('/evidence/:id', asyncHandler(async (req, res) => {
    const a = actor(req);
    const emp = await actorEmployee(a);
    if (!emp)
        throw new AppError(404, 'No employee record is linked to your account');
    res.json(await deleteEvidence(a, emp, Number(req.params.id)));
}));
// ── Verification (verifier roles; never the owner) ────────────────────────────
facultyProfileRouter.get('/verification/inbox', asyncHandler(async (req, res) => {
    const a = actor(req);
    res.json(await verificationInbox(a, {
        departmentId: num(req.query.departmentId),
        verificationStatus: req.query.verificationStatus ? String(req.query.verificationStatus) : undefined,
    }));
}));
facultyProfileRouter.post('/records/:id/verification', asyncHandler(async (req, res) => {
    const a = actor(req);
    const employeeId = num(req.query.employeeId ?? req.body?.employeeId);
    if (employeeId == null)
        throw new AppError(400, 'employeeId is required to verify a record');
    const emp = await resolveTarget(a, employeeId);
    if (!canVerify(a, emp))
        throw new AppError(403, 'You are not authorized to verify this faculty’s records');
    const input = validate(verificationActionSchema, req.body);
    res.json(await actOnVerification(a, emp, Number(req.params.id), input.action, input.remarks));
}));
// ── Directory (HOD / institution scope) ───────────────────────────────────────
facultyProfileRouter.get('/directory', asyncHandler(async (req, res) => {
    const a = actor(req);
    const isInstitution = ['PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN', 'IQAC_COORDINATOR', 'NBA_COORDINATOR', 'COLLEGE_ADMIN', 'SUPER_ADMIN'].includes(a.role);
    const hodDepts = hodDepartmentIds(a);
    const q = db('employees as e')
        .leftJoin('departments as d', 'd.id', 'e.department_id')
        .leftJoin('hr_designations as g', 'g.id', 'e.designation_id')
        .where('e.college_id', a.collegeId)
        .whereNotNull('e.faculty_user_id');
    if (isInstitution) {
        if (num(req.query.departmentId) != null)
            q.where('e.department_id', num(req.query.departmentId));
    }
    else if (hodDepts.length > 0) {
        q.whereIn('e.department_id', hodDepts);
    }
    else {
        // A plain faculty only ever sees themselves in the directory.
        q.where('e.faculty_user_id', a.facultyUserId);
    }
    const search = req.query.q ? String(req.query.q).trim() : '';
    if (search)
        q.where((b) => b.where('e.display_name', 'like', `%${search}%`).orWhere('e.employee_number', 'like', `%${search}%`));
    const rows = await q
        .select('e.id', 'e.display_name', 'e.employee_number', 'e.employment_status', 'd.name as department', 'g.name as designation', 'e.department_id')
        .orderBy('e.display_name', 'asc')
        .limit(200);
    res.json(rows.map((r) => ({
        employeeId: Number(r.id),
        fullName: r.display_name,
        employeeNumber: r.employee_number,
        department: r.department ?? null,
        departmentId: r.department_id ? Number(r.department_id) : null,
        designation: r.designation ?? null,
        employmentStatus: r.employment_status,
    })));
}));
