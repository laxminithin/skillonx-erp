import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
function yearsBetween(from, to) {
    const ms = to.getTime() - from.getTime();
    if (ms <= 0)
        return 0;
    return Math.round((ms / (365.25 * 24 * 3600 * 1000)) * 10) / 10;
}
/** Ensure a faculty_academic_profiles row exists for the employee; returns it. */
export async function ensureProfile(collegeId, employee) {
    const existing = await db('faculty_academic_profiles')
        .where({ college_id: collegeId, employee_id: employee.id })
        .first();
    if (existing)
        return existing;
    await db('faculty_academic_profiles')
        .insert({
        college_id: collegeId,
        employee_id: employee.id,
        faculty_user_id: employee.facultyUserId,
    })
        .onConflict(['college_id', 'employee_id'])
        .ignore();
    return db('faculty_academic_profiles').where({ college_id: collegeId, employee_id: employee.id }).first();
}
/**
 * Core profile — HRMS is authoritative for identity/service info (projected
 * read-only); the faculty-maintained layer adds only academic identifiers and
 * the optional photo override.
 */
export async function coreProfile(collegeId, employee) {
    const emp = (await db('employees as e')
        .leftJoin('departments as d', 'd.id', 'e.department_id')
        .leftJoin('hr_designations as g', 'g.id', 'e.designation_id')
        .leftJoin('employment_types as t', 't.id', 'e.employment_type_id')
        .where({ 'e.id': employee.id, 'e.college_id': collegeId })
        .select('e.*', 'd.name as department_name', 'g.name as designation_name', 't.name as employment_type_name')
        .first());
    if (!emp)
        throw new AppError(404, 'Faculty not found');
    const profile = await ensureProfile(collegeId, employee);
    const doj = emp.date_of_joining ? new Date(String(emp.date_of_joining)) : null;
    const institutionalYears = doj ? yearsBetween(doj, new Date()) : null;
    return {
        // HRMS-authoritative (read-only)
        employeeId: Number(emp.id),
        employeeNumber: emp.employee_number,
        facultyUserId: emp.faculty_user_id ? Number(emp.faculty_user_id) : null,
        fullName: emp.display_name,
        department: emp.department_name ?? null,
        departmentId: emp.department_id ? Number(emp.department_id) : null,
        designation: emp.designation_name ?? null,
        employmentType: emp.employment_type_name ?? null,
        employmentStatus: emp.employment_status,
        dateOfJoining: emp.date_of_joining,
        institutionalExperienceYears: institutionalYears,
        officialEmail: emp.official_email ?? null,
        officialPhone: emp.official_phone ?? null,
        photoReference: profile.photo_reference ?? emp.profile_photo_reference ?? null,
        authoritative: {
            identity: 'HRMS',
            service: 'HRMS',
        },
        // Faculty-maintained academic identifiers (unverified unless separately validated)
        identifiers: {
            orcid: profile.orcid ?? null,
            googleScholarId: profile.google_scholar_id ?? null,
            scopusAuthorId: profile.scopus_author_id ?? null,
            wosResearcherId: profile.wos_researcher_id ?? null,
            vidwanId: profile.vidwan_id ?? null,
            otherResearchId: profile.other_research_id ?? null,
            verified: false,
        },
        notApplicable: parseJson(profile.not_applicable, {}),
    };
}
export async function updateIdentifiers(actor, employee, input) {
    await ensureProfile(actor.collegeId, employee);
    const patch = { updated_at: db.fn.now() };
    if (input.orcid !== undefined)
        patch.orcid = input.orcid || null;
    if (input.googleScholarId !== undefined)
        patch.google_scholar_id = input.googleScholarId || null;
    if (input.scopusAuthorId !== undefined)
        patch.scopus_author_id = input.scopusAuthorId || null;
    if (input.wosResearcherId !== undefined)
        patch.wos_researcher_id = input.wosResearcherId || null;
    if (input.vidwanId !== undefined)
        patch.vidwan_id = input.vidwanId || null;
    if (input.otherResearchId !== undefined)
        patch.other_research_id = input.otherResearchId || null;
    if (input.photoReference !== undefined)
        patch.photo_reference = input.photoReference || null;
    await db('faculty_academic_profiles')
        .where({ college_id: actor.collegeId, employee_id: employee.id })
        .update(patch);
    return coreProfile(actor.collegeId, employee);
}
export async function setNotApplicable(actor, employee, section, notApplicable) {
    const profile = await ensureProfile(actor.collegeId, employee);
    const map = parseJson(profile.not_applicable, {});
    if (notApplicable)
        map[section] = true;
    else
        delete map[section];
    await db('faculty_academic_profiles')
        .where({ college_id: actor.collegeId, employee_id: employee.id })
        .update({ not_applicable: JSON.stringify(map), updated_at: db.fn.now() });
    return map;
}
/** Academic-year context: current + all labels (spec §B25). */
export async function academicYears(collegeId) {
    const rows = await db('academic_years')
        .where({ college_id: collegeId })
        .orderBy('label', 'desc')
        .select('id', 'label', 'is_current');
    const current = rows.find((r) => r.is_current) ?? null;
    return {
        current: current ? { id: Number(current.id), label: current.label } : null,
        all: rows.map((r) => ({ id: Number(r.id), label: r.label, isCurrent: !!r.is_current })),
    };
}
export function parseJson(raw, fallback) {
    if (raw == null)
        return fallback;
    if (typeof raw === 'object')
        return raw;
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        }
        catch {
            return fallback;
        }
    }
    return fallback;
}
