import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { writeCopoAudit } from './audit.js';
import { BLOOMS_LEVELS, COURSE_TYPES } from './types.js';
import { applicablePsos, currentPoFramework, listOfficialSdgs, mapCo, mapPo, mapProgram, mapPso, mapScheme, mapSubject, } from './helpers.js';
import { PENDING_PSO_STATEMENT } from './types.js';
export const schemeSchema = z.object({
    name: z.string().min(2).max(255),
    code: z.string().min(1).max(64),
    university: z.string().max(255).optional().nullable(),
    effectiveAcademicYear: z.string().max(32).optional().nullable(),
    startYear: z.number().int().min(1990).max(2100).optional().nullable(),
    endYear: z.number().int().min(1990).max(2100).optional().nullable(),
    status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
    notes: z.string().max(4000).optional().nullable(),
});
export const programSchema = z.object({
    name: z.string().min(2).max(255),
    code: z.string().min(1).max(64),
    departmentId: z.number().int().positive().optional().nullable(),
    schemeId: z.number().int().positive().optional().nullable(),
    degree: z.string().max(64).optional().nullable(),
    durationYears: z.number().min(0).max(10).optional().nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
export const subjectSchema = z.object({
    name: z.string().min(2).max(255),
    code: z.string().min(1).max(64),
    departmentId: z.number().int().positive().optional().nullable(),
    schemeId: z.number().int().positive().optional().nullable(),
    semesterId: z.number().int().positive().optional().nullable(),
    courseType: z.enum(COURSE_TYPES).optional().nullable(),
    lectureHours: z.number().min(0).max(40).optional().nullable(),
    tutorialHours: z.number().min(0).max(40).optional().nullable(),
    practicalHours: z.number().min(0).max(40).optional().nullable(),
    credits: z.number().min(0).max(30).optional().nullable(),
    cieMarks: z.number().min(0).max(200).optional().nullable(),
    seeMarks: z.number().min(0).max(200).optional().nullable(),
    totalMarks: z.number().min(0).max(400).optional().nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
    programIds: z.array(z.number().int().positive()).optional(),
});
export const courseOutcomeSchema = z.object({
    courseId: z.number().int().positive(),
    number: z.number().int().positive(),
    code: z.string().min(1).max(32).optional(),
    statement: z.string().min(8).max(4000),
    bloomsLevel: z.enum(BLOOMS_LEVELS).optional().nullable(),
    knowledgeLevel: z.string().max(64).optional().nullable(),
    source: z.string().max(255).optional().nullable(),
    sourcePage: z.string().max(32).optional().nullable(),
    sourceDocumentId: z.number().int().positive().optional().nullable(),
    officialTextPending: z.boolean().optional(),
});
export const programOutcomeSchema = z.object({
    schemeId: z.number().int().positive(),
    programId: z.number().int().positive().optional().nullable(),
    number: z.number().int().positive(),
    code: z.string().min(1).max(32).optional(),
    shortTitle: z.string().max(255).optional().nullable(),
    officialStatement: z.string().max(8000).optional().nullable(),
    source: z.string().max(255).optional().nullable(),
    programIds: z.array(z.number().int().positive()).optional(),
});
export const assignmentSchema = z.object({
    facultyId: z.number().int().positive(),
    courseId: z.number().int().positive(),
    academicYearId: z.number().int().positive().optional().nullable(),
    programId: z.number().int().positive().optional().nullable(),
    semesterId: z.number().int().positive().optional().nullable(),
});
export const psoSchema = z.object({
    schemeId: z.number().int().positive(),
    programId: z.number().int().positive(),
    number: z.number().int().positive().optional(),
    code: z.string().min(1).max(32).optional(),
    shortTitle: z.string().max(255).optional().nullable(),
    officialStatement: z.string().max(8000).optional().nullable(),
    effectiveAcademicYear: z.string().max(32).optional().nullable(),
    source: z.string().max(255).optional().nullable(),
    approvalReference: z.string().max(255).optional().nullable(),
});
async function auditMaster(actor, action, metadata) {
    await writeCopoAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action,
        metadata,
    });
}
export async function listSchemes(collegeId) {
    const rows = await db('academic_schemes').where({ college_id: collegeId }).orderBy('start_year', 'desc').orderBy('name');
    return rows.map(mapScheme);
}
export async function createScheme(collegeId, actor, input) {
    try {
        const [id] = await db('academic_schemes').insert({
            college_id: collegeId,
            name: input.name.trim(),
            code: input.code.trim().toUpperCase(),
            university: input.university?.trim() || null,
            effective_academic_year: input.effectiveAcademicYear?.trim() || null,
            start_year: input.startYear ?? null,
            end_year: input.endYear ?? null,
            status: input.status ?? 'ACTIVE',
            notes: input.notes ?? null,
        });
        await auditMaster(actor, 'SCHEME_CREATE', { id, code: input.code });
        return db('academic_schemes').where({ id }).first().then((r) => mapScheme(r));
    }
    catch {
        throw new AppError(409, 'A scheme with this code already exists');
    }
}
export async function updateScheme(collegeId, id, actor, input) {
    const existing = await db('academic_schemes').where({ id, college_id: collegeId }).first();
    if (!existing)
        throw new AppError(404, 'Scheme not found');
    await db('academic_schemes')
        .where({ id })
        .update({
        name: input.name?.trim() ?? existing.name,
        code: input.code ? input.code.trim().toUpperCase() : existing.code,
        university: input.university !== undefined ? input.university : existing.university,
        effective_academic_year: input.effectiveAcademicYear !== undefined ? input.effectiveAcademicYear : existing.effective_academic_year,
        start_year: input.startYear !== undefined ? input.startYear : existing.start_year,
        end_year: input.endYear !== undefined ? input.endYear : existing.end_year,
        status: input.status ?? existing.status,
        notes: input.notes !== undefined ? input.notes : existing.notes,
        updated_at: db.fn.now(),
    });
    await auditMaster(actor, 'SCHEME_UPDATE', { id });
    return db('academic_schemes').where({ id }).first().then((r) => mapScheme(r));
}
export async function listPrograms(collegeId, schemeId) {
    const q = db('programs as p')
        .leftJoin('departments as d', 'd.id', 'p.department_id')
        .leftJoin('academic_schemes as s', 's.id', 'p.scheme_id')
        .where('p.college_id', collegeId)
        .select('p.*', 'd.name as department_name', 's.name as scheme_name')
        .orderBy('p.name');
    if (schemeId) {
        q.leftJoin('scheme_programs as sp', 'sp.program_id', 'p.id').andWhere((b) => b.where('p.scheme_id', schemeId).orWhere('sp.scheme_id', schemeId));
    }
    const rows = await q;
    return rows.map(mapProgram);
}
export async function createProgram(collegeId, actor, input) {
    try {
        const [id] = await db('programs').insert({
            college_id: collegeId,
            name: input.name.trim(),
            code: input.code.trim().toUpperCase(),
            department_id: input.departmentId ?? null,
            scheme_id: input.schemeId ?? null,
            degree: input.degree ?? null,
            duration_years: input.durationYears ?? null,
            status: input.status ?? 'ACTIVE',
        });
        if (input.schemeId) {
            await db('scheme_programs')
                .insert({
                college_id: collegeId,
                scheme_id: input.schemeId,
                program_id: id,
                status: 'ACTIVE',
            })
                .onConflict(['scheme_id', 'program_id'])
                .ignore();
        }
        await auditMaster(actor, 'PROGRAM_CREATE', { id });
        return (await listPrograms(collegeId)).find((p) => p.id === id);
    }
    catch {
        throw new AppError(409, 'A program with this code already exists');
    }
}
export async function updateProgram(collegeId, id, actor, input) {
    const existing = await db('programs').where({ id, college_id: collegeId }).first();
    if (!existing)
        throw new AppError(404, 'Program not found');
    await db('programs')
        .where({ id })
        .update({
        name: input.name?.trim() ?? existing.name,
        code: input.code ? input.code.trim().toUpperCase() : existing.code,
        department_id: input.departmentId !== undefined ? input.departmentId : existing.department_id,
        scheme_id: input.schemeId !== undefined ? input.schemeId : existing.scheme_id,
        degree: input.degree !== undefined ? input.degree : existing.degree,
        duration_years: input.durationYears !== undefined ? input.durationYears : existing.duration_years,
        status: input.status ?? existing.status,
        updated_at: db.fn.now(),
    });
    if (input.schemeId) {
        await db('scheme_programs')
            .insert({ college_id: collegeId, scheme_id: input.schemeId, program_id: id, status: 'ACTIVE' })
            .onConflict(['scheme_id', 'program_id'])
            .ignore();
    }
    await auditMaster(actor, 'PROGRAM_UPDATE', { id });
    return (await listPrograms(collegeId)).find((p) => p.id === id);
}
function subjectQuery(collegeId) {
    return db('courses as c')
        .leftJoin('departments as d', 'd.id', 'c.department_id')
        .leftJoin('academic_schemes as s', 's.id', 'c.scheme_id')
        .leftJoin('semesters as sem', 'sem.id', 'c.semester_id')
        .where('c.college_id', collegeId)
        .select('c.*', 'd.name as department_name', 's.name as scheme_name', 's.code as scheme_code', 'sem.label as semester_label')
        .orderBy('c.code');
}
export async function listSubjects(collegeId, filters) {
    const q = subjectQuery(collegeId);
    if (filters?.schemeId)
        q.andWhere('c.scheme_id', filters.schemeId);
    if (filters?.semesterId)
        q.andWhere('c.semester_id', filters.semesterId);
    if (filters?.programId) {
        q.join('program_subjects as ps', 'ps.course_id', 'c.id').andWhere('ps.program_id', filters.programId);
    }
    const rows = await q;
    const subjects = rows.map(mapSubject);
    if (!subjects.length)
        return subjects;
    const links = await db('program_subjects as ps')
        .join('programs as p', 'p.id', 'ps.program_id')
        .where('ps.college_id', collegeId)
        .whereIn('ps.course_id', subjects.map((s) => s.id))
        .select('ps.course_id', 'p.id as program_id', 'p.name as program_name', 'p.code as program_code');
    const byCourse = new Map();
    for (const link of links) {
        const list = byCourse.get(Number(link.course_id)) ?? [];
        list.push({ id: Number(link.program_id), name: String(link.program_name), code: String(link.program_code) });
        byCourse.set(Number(link.course_id), list);
    }
    return subjects.map((s) => ({ ...s, programs: byCourse.get(s.id) ?? [] }));
}
async function syncProgramSubjects(collegeId, courseId, schemeId, semesterId, programIds) {
    if (!programIds)
        return;
    await db('program_subjects').where({ course_id: courseId }).del();
    if (!programIds.length)
        return;
    await db('program_subjects').insert(programIds.map((programId) => ({
        college_id: collegeId,
        program_id: programId,
        course_id: courseId,
        scheme_id: schemeId,
        semester_id: semesterId,
        status: 'ACTIVE',
    })));
}
export async function createSubject(collegeId, actor, input) {
    const total = input.totalMarks ??
        (input.cieMarks != null && input.seeMarks != null ? Number(input.cieMarks) + Number(input.seeMarks) : null);
    try {
        const [id] = await db('courses').insert({
            college_id: collegeId,
            name: input.name.trim(),
            code: input.code.trim().toUpperCase(),
            department_id: input.departmentId ?? null,
            scheme_id: input.schemeId ?? null,
            semester_id: input.semesterId ?? null,
            course_type: input.courseType ?? null,
            lecture_hours: input.lectureHours ?? null,
            tutorial_hours: input.tutorialHours ?? null,
            practical_hours: input.practicalHours ?? null,
            credits: input.credits ?? null,
            cie_marks: input.cieMarks ?? null,
            see_marks: input.seeMarks ?? null,
            total_marks: total,
            status: input.status ?? 'ACTIVE',
        });
        await syncProgramSubjects(collegeId, id, input.schemeId ?? null, input.semesterId ?? null, input.programIds);
        await auditMaster(actor, 'SUBJECT_CREATE', { id, code: input.code });
        const list = await listSubjects(collegeId);
        return list.find((s) => s.id === id);
    }
    catch {
        throw new AppError(409, 'A subject with this code already exists for the selected scheme');
    }
}
export async function updateSubject(collegeId, id, actor, input) {
    const existing = await db('courses').where({ id, college_id: collegeId }).first();
    if (!existing)
        throw new AppError(404, 'Subject not found');
    const total = input.totalMarks !== undefined
        ? input.totalMarks
        : input.cieMarks != null && input.seeMarks != null
            ? Number(input.cieMarks) + Number(input.seeMarks)
            : existing.total_marks;
    await db('courses')
        .where({ id })
        .update({
        name: input.name?.trim() ?? existing.name,
        code: input.code ? input.code.trim().toUpperCase() : existing.code,
        department_id: input.departmentId !== undefined ? input.departmentId : existing.department_id,
        scheme_id: input.schemeId !== undefined ? input.schemeId : existing.scheme_id,
        semester_id: input.semesterId !== undefined ? input.semesterId : existing.semester_id,
        course_type: input.courseType !== undefined ? input.courseType : existing.course_type,
        lecture_hours: input.lectureHours !== undefined ? input.lectureHours : existing.lecture_hours,
        tutorial_hours: input.tutorialHours !== undefined ? input.tutorialHours : existing.tutorial_hours,
        practical_hours: input.practicalHours !== undefined ? input.practicalHours : existing.practical_hours,
        credits: input.credits !== undefined ? input.credits : existing.credits,
        cie_marks: input.cieMarks !== undefined ? input.cieMarks : existing.cie_marks,
        see_marks: input.seeMarks !== undefined ? input.seeMarks : existing.see_marks,
        total_marks: total,
        status: input.status ?? existing.status,
        updated_at: db.fn.now(),
    });
    const schemeId = input.schemeId !== undefined ? input.schemeId : existing.scheme_id;
    const semesterId = input.semesterId !== undefined ? input.semesterId : existing.semester_id;
    await syncProgramSubjects(collegeId, id, schemeId, semesterId, input.programIds);
    await auditMaster(actor, 'SUBJECT_UPDATE', { id });
    const list = await listSubjects(collegeId);
    return list.find((s) => s.id === id);
}
export async function listCourseOutcomes(collegeId, courseId, includeHistory = false) {
    const q = db('course_outcomes').where({ college_id: collegeId, course_id: courseId }).orderBy('co_number').orderBy('version_number', 'desc');
    if (!includeHistory)
        q.andWhere({ is_current: true }).whereNot('status', 'ARCHIVED');
    return (await q).map(mapCo);
}
export async function createCourseOutcome(collegeId, actor, input) {
    const course = await db('courses').where({ id: input.courseId, college_id: collegeId }).first();
    if (!course)
        throw new AppError(404, 'Subject not found');
    const code = (input.code || `CO${input.number}`).trim().toUpperCase();
    const dup = await db('course_outcomes')
        .where({ college_id: collegeId, course_id: input.courseId, co_code: code, is_current: true })
        .first();
    if (dup)
        throw new AppError(409, `${code} already exists for this subject. Create a new version instead of overwriting the official statement.`);
    const [id] = await db('course_outcomes').insert({
        college_id: collegeId,
        course_id: input.courseId,
        scheme_id: course.scheme_id,
        co_number: input.number,
        co_code: code,
        statement: input.statement.trim(),
        blooms_level: input.bloomsLevel ?? null,
        knowledge_level: input.knowledgeLevel ?? null,
        source: input.source ?? 'VTU Official Syllabus',
        source_page: input.sourcePage ?? null,
        source_document_id: input.sourceDocumentId ?? null,
        version_number: 1,
        is_current: true,
        status: 'ACTIVE',
        official_text_pending: input.officialTextPending ?? false,
        created_by: actor.facultyUserId,
        updated_by: actor.facultyUserId,
    });
    await auditMaster(actor, 'CO_CREATE', { id, courseId: input.courseId, code });
    return mapCo((await db('course_outcomes').where({ id }).first()));
}
export async function updateCourseOutcome(collegeId, id, actor, input) {
    const existing = await db('course_outcomes').where({ id, college_id: collegeId }).first();
    if (!existing)
        throw new AppError(404, 'Course outcome not found');
    const mode = input.mode ?? 'IN_PLACE';
    if (mode === 'NEW_VERSION' && input.statement && input.statement.trim() !== existing.statement) {
        await db('course_outcomes').where({ id }).update({ is_current: false, status: 'ARCHIVED', updated_at: db.fn.now() });
        const [newId] = await db('course_outcomes').insert({
            college_id: collegeId,
            course_id: existing.course_id,
            scheme_id: existing.scheme_id,
            co_number: existing.co_number,
            co_code: existing.co_code,
            statement: input.statement.trim(),
            blooms_level: input.bloomsLevel !== undefined ? input.bloomsLevel : existing.blooms_level,
            knowledge_level: input.knowledgeLevel !== undefined ? input.knowledgeLevel : existing.knowledge_level,
            source: input.source !== undefined ? input.source : existing.source,
            source_page: input.sourcePage !== undefined ? input.sourcePage : existing.source_page,
            source_document_id: existing.source_document_id,
            version_number: Number(existing.version_number) + 1,
            is_current: true,
            status: 'ACTIVE',
            official_text_pending: false,
            supersedes_id: existing.id,
            created_by: actor.facultyUserId,
            updated_by: actor.facultyUserId,
        });
        await auditMaster(actor, 'CO_NEW_VERSION', { previousId: id, id: newId });
        return mapCo((await db('course_outcomes').where({ id: newId }).first()));
    }
    await db('course_outcomes')
        .where({ id })
        .update({
        blooms_level: input.bloomsLevel !== undefined ? input.bloomsLevel : existing.blooms_level,
        knowledge_level: input.knowledgeLevel !== undefined ? input.knowledgeLevel : existing.knowledge_level,
        source: input.source !== undefined ? input.source : existing.source,
        source_page: input.sourcePage !== undefined ? input.sourcePage : existing.source_page,
        statement: input.statement !== undefined ? input.statement.trim() : existing.statement,
        updated_by: actor.facultyUserId,
        updated_at: db.fn.now(),
    });
    await auditMaster(actor, 'CO_UPDATE', { id, previous: existing.statement, next: input.statement ?? existing.statement });
    return mapCo((await db('course_outcomes').where({ id }).first()));
}
export async function listPoFrameworks(collegeId, schemeId) {
    const q = db('program_outcome_versions as v')
        .join('academic_schemes as s', 's.id', 'v.scheme_id')
        .leftJoin('programs as p', 'p.id', 'v.program_id')
        .where('v.college_id', collegeId)
        .select('v.*', 's.name as scheme_name', 's.code as scheme_code', 'p.name as program_name')
        .orderBy('s.start_year', 'desc')
        .orderBy('v.version_number', 'desc');
    if (schemeId)
        q.andWhere('v.scheme_id', schemeId);
    const versions = await q;
    const ids = versions.map((v) => v.id);
    const outcomes = ids.length
        ? await db('program_outcomes').whereIn('framework_version_id', ids).orderBy('po_number')
        : [];
    return versions.map((v) => ({
        id: Number(v.id),
        schemeId: Number(v.scheme_id),
        schemeName: v.scheme_name,
        schemeCode: v.scheme_code,
        programId: v.program_id ?? null,
        programName: v.program_name ?? null,
        versionNumber: Number(v.version_number),
        label: v.label,
        source: v.source,
        status: v.status,
        outcomes: outcomes.filter((o) => Number(o.framework_version_id) === Number(v.id)).map(mapPo),
    }));
}
export async function ensurePoFramework(collegeId, schemeId, actor, programId) {
    const existing = await currentPoFramework(collegeId, schemeId, programId);
    if (existing)
        return existing;
    const [id] = await db('program_outcome_versions').insert({
        college_id: collegeId,
        scheme_id: schemeId,
        program_id: programId ?? null,
        version_number: 1,
        label: 'Version 1',
        source: 'Official programme outcome framework',
        status: 'ACTIVE',
        created_by: actor.facultyUserId,
    });
    return db('program_outcome_versions').where({ id }).first();
}
export async function createProgramOutcome(collegeId, actor, input) {
    const scheme = await db('academic_schemes').where({ id: input.schemeId, college_id: collegeId }).first();
    if (!scheme)
        throw new AppError(404, 'Scheme not found');
    const framework = await ensurePoFramework(collegeId, input.schemeId, actor, input.programId);
    const code = (input.code || `PO${input.number}`).trim().toUpperCase();
    const statement = input.officialStatement?.trim() || null;
    try {
        const [id] = await db('program_outcomes').insert({
            college_id: collegeId,
            framework_version_id: framework.id,
            scheme_id: input.schemeId,
            po_number: input.number,
            po_code: code,
            short_title: input.shortTitle?.trim() || null,
            official_statement: statement,
            source: input.source ?? 'Official programme outcome framework',
            status: 'ACTIVE',
            official_text_pending: !statement,
            sort_order: input.number,
        });
        if (input.programIds?.length) {
            await db('program_outcome_programs').insert(input.programIds.map((programId) => ({ program_outcome_id: id, program_id: programId })));
        }
        await auditMaster(actor, 'PO_CREATE', { id, code });
        return mapPo((await db('program_outcomes').where({ id }).first()));
    }
    catch {
        throw new AppError(409, `${code} already exists in this PO framework`);
    }
}
export async function updateProgramOutcome(collegeId, id, actor, input) {
    const existing = await db('program_outcomes').where({ id, college_id: collegeId }).first();
    if (!existing)
        throw new AppError(404, 'Programme outcome not found');
    const statement = input.officialStatement !== undefined ? input.officialStatement?.trim() || null : existing.official_statement;
    await db('program_outcomes')
        .where({ id })
        .update({
        short_title: input.shortTitle !== undefined ? input.shortTitle : existing.short_title,
        official_statement: statement,
        source: input.source !== undefined ? input.source : existing.source,
        official_text_pending: !statement,
        updated_at: db.fn.now(),
    });
    await auditMaster(actor, 'PO_UPDATE', { id });
    return mapPo((await db('program_outcomes').where({ id }).first()));
}
export async function listAssignments(collegeId, filters) {
    const q = db('faculty_subject_assignments as a')
        .join('faculty_users as f', 'f.id', 'a.faculty_id')
        .join('courses as c', 'c.id', 'a.course_id')
        .leftJoin('academic_years as y', 'y.id', 'a.academic_year_id')
        .leftJoin('programs as p', 'p.id', 'a.program_id')
        .where('a.college_id', collegeId)
        .select('a.*', 'f.name as faculty_name', 'c.code as course_code', 'c.name as course_name', 'y.label as academic_year_label', 'p.name as program_name')
        .orderBy('c.code');
    if (filters?.facultyId)
        q.andWhere('a.faculty_id', filters.facultyId);
    if (filters?.courseId)
        q.andWhere('a.course_id', filters.courseId);
    const rows = await q;
    return rows.map((r) => ({
        id: Number(r.id),
        facultyId: Number(r.faculty_id),
        facultyName: r.faculty_name,
        courseId: Number(r.course_id),
        courseCode: r.course_code,
        courseName: r.course_name,
        academicYearId: r.academic_year_id,
        academicYearLabel: r.academic_year_label,
        programId: r.program_id,
        programName: r.program_name,
        semesterId: r.semester_id,
        status: r.status,
    }));
}
export async function createAssignment(collegeId, actor, input) {
    const [id] = await db('faculty_subject_assignments').insert({
        college_id: collegeId,
        faculty_id: input.facultyId,
        course_id: input.courseId,
        academic_year_id: input.academicYearId ?? null,
        program_id: input.programId ?? null,
        semester_id: input.semesterId ?? null,
        status: 'ACTIVE',
    });
    await auditMaster(actor, 'ASSIGNMENT_CREATE', { id, ...input });
    return (await listAssignments(collegeId, { courseId: input.courseId })).find((a) => a.id === id);
}
export async function deleteAssignment(collegeId, id, actor) {
    const row = await db('faculty_subject_assignments').where({ id, college_id: collegeId }).first();
    if (!row)
        throw new AppError(404, 'Assignment not found');
    await db('faculty_subject_assignments').where({ id }).del();
    await auditMaster(actor, 'ASSIGNMENT_DELETE', { id });
    return { ok: true };
}
export async function listProgramSpecificOutcomes(collegeId, filters) {
    const q = db('program_specific_outcomes as pso')
        .join('academic_schemes as s', 's.id', 'pso.scheme_id')
        .join('programs as p', 'p.id', 'pso.program_id')
        .leftJoin('departments as d', 'd.id', 'pso.department_id')
        .where('pso.college_id', collegeId)
        .select('pso.*', 's.name as scheme_name', 's.code as scheme_code', 'p.name as program_name', 'p.code as program_code', 'd.name as department_name')
        .orderBy('p.name')
        .orderBy('pso.pso_number')
        .orderBy('pso.version_number', 'desc');
    if (filters?.schemeId)
        q.andWhere('pso.scheme_id', filters.schemeId);
    if (filters?.programId)
        q.andWhere('pso.program_id', filters.programId);
    if (!filters?.history)
        q.andWhere('pso.is_current', true);
    const rows = await q;
    return rows.map((row) => ({
        ...mapPso(row),
        schemeName: row.scheme_name,
        schemeCode: row.scheme_code,
        programName: row.program_name,
        programCode: row.program_code,
        departmentName: row.department_name ?? null,
        displayStatement: row.official_statement || PENDING_PSO_STATEMENT,
    }));
}
export async function psoHistory(collegeId, schemeId, programId, code) {
    const rows = await db('program_specific_outcomes')
        .where({ college_id: collegeId, scheme_id: schemeId, program_id: programId, pso_code: code })
        .orderBy('version_number', 'desc');
    return rows.map(mapPso);
}
export async function psoMappingUsage(collegeId, psoId) {
    const pso = await db('program_specific_outcomes').where({ id: psoId, college_id: collegeId }).first();
    if (!pso)
        throw new AppError(404, 'PSO not found');
    const items = await db('copo_mapping_items as i')
        .join('copo_mapping_versions as v', 'v.id', 'i.mapping_version_id')
        .join('courses as c', 'c.id', 'i.course_id')
        .leftJoin('course_outcomes as co', 'co.id', 'i.course_outcome_id')
        .where('i.program_specific_outcome_id', psoId)
        .where('i.college_id', collegeId)
        .select('i.*', 'v.status as mapping_status', 'v.version_number as mapping_version_number', 'v.mapping_kind', 'c.code as course_code', 'c.name as course_name', 'co.co_code');
    return {
        pso: mapPso(pso),
        referencedByApproved: items.some((i) => i.mapping_status === 'APPROVED'),
        usage: items.map((i) => ({
            mappingVersionId: Number(i.mapping_version_id),
            mappingStatus: i.mapping_status,
            mappingVersionNumber: Number(i.mapping_version_number),
            subjectCode: i.course_code,
            subjectName: i.course_name,
            coCode: i.co_code,
            strength: i.correlation_strength == null ? null : Number(i.correlation_strength),
        })),
    };
}
export async function createProgramSpecificOutcome(collegeId, actor, input) {
    const scheme = await db('academic_schemes').where({ id: input.schemeId, college_id: collegeId }).first();
    if (!scheme)
        throw new AppError(404, 'Scheme not found');
    const program = await db('programs').where({ id: input.programId, college_id: collegeId }).first();
    if (!program)
        throw new AppError(404, 'Program not found');
    const current = await applicablePsos(collegeId, input.schemeId, input.programId);
    const nextNumber = input.number ?? (current.reduce((max, row) => Math.max(max, row.number), 0) + 1);
    const code = (input.code || `PSO${nextNumber}`).trim().toUpperCase();
    const dup = current.find((row) => row.code === code || row.number === nextNumber);
    if (dup)
        throw new AppError(409, `${code} already exists for this program. Create a new version instead of overwriting it.`);
    const statement = input.officialStatement?.trim() || null;
    const [id] = await db('program_specific_outcomes').insert({
        college_id: collegeId,
        scheme_id: input.schemeId,
        program_id: input.programId,
        department_id: program.department_id ?? null,
        pso_number: nextNumber,
        pso_code: code,
        short_title: input.shortTitle?.trim() || null,
        official_statement: statement,
        effective_academic_year: input.effectiveAcademicYear?.trim() || null,
        version_number: 1,
        is_current: true,
        source: input.source?.trim() || null,
        approval_reference: input.approvalReference?.trim() || null,
        status: 'ACTIVE',
        official_text_pending: !statement,
        sort_order: nextNumber,
        created_by: actor.facultyUserId,
        updated_by: actor.facultyUserId,
    });
    await auditMaster(actor, 'PSO_CREATE', { id, code, programId: input.programId, schemeId: input.schemeId });
    return mapPso((await db('program_specific_outcomes').where({ id }).first()));
}
export async function updateProgramSpecificOutcome(collegeId, id, actor, input) {
    const existing = await db('program_specific_outcomes').where({ id, college_id: collegeId }).first();
    if (!existing)
        throw new AppError(404, 'PSO not found');
    const mode = input.mode ?? 'IN_PLACE';
    const statement = input.officialStatement !== undefined ? input.officialStatement?.trim() || null : existing.official_statement;
    if (mode === 'NEW_VERSION') {
        await db('program_specific_outcomes').where({ id }).update({ is_current: false, updated_at: db.fn.now(), updated_by: actor.facultyUserId });
        const [newId] = await db('program_specific_outcomes').insert({
            college_id: collegeId,
            scheme_id: existing.scheme_id,
            program_id: existing.program_id,
            department_id: existing.department_id,
            pso_number: existing.pso_number,
            pso_code: existing.pso_code,
            short_title: input.shortTitle !== undefined ? input.shortTitle?.trim() || null : existing.short_title,
            official_statement: statement,
            effective_academic_year: input.effectiveAcademicYear !== undefined ? input.effectiveAcademicYear : existing.effective_academic_year,
            version_number: Number(existing.version_number) + 1,
            is_current: true,
            source: input.source !== undefined ? input.source : existing.source,
            approval_reference: input.approvalReference !== undefined ? input.approvalReference : existing.approval_reference,
            status: 'ACTIVE',
            official_text_pending: !statement,
            supersedes_id: existing.id,
            sort_order: existing.sort_order,
            created_by: actor.facultyUserId,
            updated_by: actor.facultyUserId,
        });
        await auditMaster(actor, 'PSO_NEW_VERSION', { previousId: id, id: newId, code: existing.pso_code });
        return mapPso((await db('program_specific_outcomes').where({ id: newId }).first()));
    }
    await db('program_specific_outcomes')
        .where({ id })
        .update({
        short_title: input.shortTitle !== undefined ? input.shortTitle : existing.short_title,
        official_statement: statement,
        effective_academic_year: input.effectiveAcademicYear !== undefined ? input.effectiveAcademicYear : existing.effective_academic_year,
        source: input.source !== undefined ? input.source : existing.source,
        approval_reference: input.approvalReference !== undefined ? input.approvalReference : existing.approval_reference,
        official_text_pending: !statement,
        updated_by: actor.facultyUserId,
        updated_at: db.fn.now(),
    });
    await auditMaster(actor, 'PSO_UPDATE', { id, code: existing.pso_code });
    return mapPso((await db('program_specific_outcomes').where({ id }).first()));
}
export async function archiveProgramSpecificOutcome(collegeId, id, actor) {
    const existing = await db('program_specific_outcomes').where({ id, college_id: collegeId }).first();
    if (!existing)
        throw new AppError(404, 'PSO not found');
    await db('program_specific_outcomes').where({ id }).update({
        status: 'ARCHIVED',
        is_current: false,
        updated_by: actor.facultyUserId,
        updated_at: db.fn.now(),
    });
    await auditMaster(actor, 'PSO_ARCHIVE', { id, code: existing.pso_code });
    return mapPso((await db('program_specific_outcomes').where({ id }).first()));
}
export async function deleteProgramSpecificOutcome(collegeId, id, actor) {
    const usage = await psoMappingUsage(collegeId, id);
    if (usage.referencedByApproved) {
        throw new AppError(409, 'This PSO is referenced by approved mappings and cannot be deleted. Archive it instead.');
    }
    if (usage.usage.length) {
        throw new AppError(409, 'This PSO is referenced by existing mappings and cannot be deleted. Archive it instead.');
    }
    await db('program_specific_outcomes').where({ id, college_id: collegeId }).del();
    await auditMaster(actor, 'PSO_DELETE', { id, code: usage.pso.code });
    return { ok: true };
}
export async function listSdgs() {
    return listOfficialSdgs(false);
}
export async function catalog(collegeId) {
    const [schemes, programs, semesters, years, subjects, departments] = await Promise.all([
        listSchemes(collegeId),
        listPrograms(collegeId),
        db('semesters').where({ college_id: collegeId }).orderBy('number'),
        db('academic_years').where({ college_id: collegeId }).orderBy('label', 'desc'),
        listSubjects(collegeId),
        db('departments').where({ college_id: collegeId }).orderBy('name'),
    ]);
    return {
        schemes,
        programs,
        semesters: semesters.map((s) => ({ id: Number(s.id), label: s.label, number: s.number })),
        academicYears: years.map((y) => ({ id: Number(y.id), label: y.label, isCurrent: Boolean(y.is_current) })),
        subjects,
        departments: departments.map((d) => ({ id: Number(d.id), name: d.name, code: d.code })),
    };
}
