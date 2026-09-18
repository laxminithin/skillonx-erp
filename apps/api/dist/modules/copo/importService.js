import { nanoid } from 'nanoid';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { writeCopoAudit } from './audit.js';
import { BLOOMS_LEVELS } from './types.js';
const importedCoSchema = z.object({
    number: z.number().int().positive(),
    code: z.string().min(1).max(32).optional(),
    statement: z.string().min(8).max(4000),
    bloomsLevel: z.enum(BLOOMS_LEVELS).optional().nullable(),
    knowledgeLevel: z.string().max(64).optional().nullable(),
    page: z.string().max(32).optional().nullable(),
    source: z.string().max(255).optional().nullable(),
});
const importedSubjectSchema = z.object({
    code: z.string().min(1).max(64),
    name: z.string().min(2).max(255),
    semesterNumber: z.number().int().positive().optional().nullable(),
    courseType: z.string().max(32).optional().nullable(),
    lectureHours: z.number().optional().nullable(),
    tutorialHours: z.number().optional().nullable(),
    practicalHours: z.number().optional().nullable(),
    credits: z.number().optional().nullable(),
    cieMarks: z.number().optional().nullable(),
    seeMarks: z.number().optional().nullable(),
    outcomes: z.array(importedCoSchema).default([]),
});
export const importPayloadSchema = z.object({
    scheme: z.object({
        name: z.string().min(2),
        code: z.string().min(1),
        university: z.string().optional().nullable(),
        startYear: z.number().int().optional().nullable(),
        endYear: z.number().int().optional().nullable(),
        effectiveAcademicYear: z.string().optional().nullable(),
    }),
    program: z.object({
        name: z.string().min(2),
        code: z.string().min(1),
        degree: z.string().optional().nullable(),
    }),
    sourceLabel: z.string().max(255).optional().nullable(),
    subjects: z.array(importedSubjectSchema).min(1),
});
function normalizeCode(value) {
    return value.trim().toUpperCase().replace(/\s+/g, '');
}
function statementsDiffer(a, b) {
    return a.trim().replace(/\s+/g, ' ') !== b.trim().replace(/\s+/g, ' ');
}
export async function previewImport(collegeId, actor, payload) {
    const schemeCode = normalizeCode(payload.scheme.code);
    const programCode = normalizeCode(payload.program.code);
    const scheme = await db('academic_schemes').where({ college_id: collegeId, code: schemeCode }).first();
    const program = await db('programs').where({ college_id: collegeId, code: programCode }).first();
    const subjectPreview = [];
    let newSubjects = 0;
    let matchedSubjects = 0;
    let newCos = 0;
    let changedCos = 0;
    let ambiguous = 0;
    for (const subject of payload.subjects) {
        const code = normalizeCode(subject.code);
        const matches = await db('courses')
            .where({ college_id: collegeId, code })
            .modify((q) => {
            if (scheme)
                q.andWhere((b) => b.where({ scheme_id: scheme.id }).orWhereNull('scheme_id'));
        });
        const exact = scheme ? matches.find((m) => Number(m.scheme_id) === Number(scheme.id)) : matches[0];
        const match = exact || (matches.length === 1 ? matches[0] : null);
        if (!match && matches.length > 1)
            ambiguous += 1;
        if (!match)
            newSubjects += 1;
        else
            matchedSubjects += 1;
        const existingCos = match
            ? await db('course_outcomes').where({ college_id: collegeId, course_id: match.id, is_current: true })
            : [];
        const outcomes = subject.outcomes.map((co) => {
            const coCode = normalizeCode(co.code || `CO${co.number}`);
            const existing = existingCos.find((row) => String(row.co_code).toUpperCase() === coCode);
            if (!existing) {
                newCos += 1;
                return { ...co, code: coCode, status: 'NEW' };
            }
            if (statementsDiffer(String(existing.statement), co.statement)) {
                changedCos += 1;
                return {
                    ...co,
                    code: coCode,
                    status: 'CHANGED',
                    existingId: Number(existing.id),
                    existingStatement: String(existing.statement),
                    importedStatement: co.statement,
                };
            }
            return { ...co, code: coCode, status: 'UNCHANGED', existingId: Number(existing.id) };
        });
        subjectPreview.push({
            code,
            name: subject.name,
            matchStatus: !match && matches.length > 1 ? 'AMBIGUOUS' : match ? 'MATCHED' : 'NEW',
            courseId: match ? Number(match.id) : null,
            existingName: match?.name ?? null,
            outcomes,
        });
    }
    const preview = {
        newSubjects,
        matchedSubjects,
        newCos,
        changedCos,
        ambiguousMatches: ambiguous,
        scheme: { exists: Boolean(scheme), id: scheme?.id ?? null, name: scheme?.name ?? payload.scheme.name, code: schemeCode },
        program: { exists: Boolean(program), id: program?.id ?? null, name: program?.name ?? payload.program.name, code: programCode },
        subjects: subjectPreview,
    };
    const batchId = nanoid(12);
    await db('syllabus_import_batches').insert({
        college_id: collegeId,
        batch_id: batchId,
        source_file: payload.sourceLabel ?? null,
        payload: JSON.stringify(payload),
        preview: JSON.stringify(preview),
        status: 'PREVIEWED',
        dry_run: true,
        imported_by: actor.facultyUserId,
    });
    return { batchId, preview };
}
export async function commitImport(collegeId, actor, batchId, resolutions = []) {
    const batch = await db('syllabus_import_batches').where({ college_id: collegeId, batch_id: batchId }).first();
    if (!batch)
        throw new AppError(404, 'Import preview not found');
    if (batch.status === 'COMMITTED')
        throw new AppError(409, 'This import has already been committed');
    const payload = importPayloadSchema.parse(typeof batch.payload === 'string' ? JSON.parse(batch.payload) : batch.payload);
    const resolutionMap = new Map(resolutions.map((r) => [`${r.courseId}:${r.coCode}`, r.action]));
    const result = await db.transaction(async (trx) => {
        const schemeCode = normalizeCode(payload.scheme.code);
        let scheme = await trx('academic_schemes').where({ college_id: collegeId, code: schemeCode }).first();
        if (!scheme) {
            const [schemeId] = await trx('academic_schemes').insert({
                college_id: collegeId,
                name: payload.scheme.name.trim(),
                code: schemeCode,
                university: payload.scheme.university ?? 'Visvesvaraya Technological University',
                effective_academic_year: payload.scheme.effectiveAcademicYear ?? null,
                start_year: payload.scheme.startYear ?? null,
                end_year: payload.scheme.endYear ?? null,
                status: 'ACTIVE',
            });
            scheme = await trx('academic_schemes').where({ id: schemeId }).first();
        }
        const programCode = normalizeCode(payload.program.code);
        let program = await trx('programs').where({ college_id: collegeId, code: programCode }).first();
        if (!program) {
            const [programId] = await trx('programs').insert({
                college_id: collegeId,
                name: payload.program.name.trim(),
                code: programCode,
                scheme_id: scheme.id,
                degree: payload.program.degree ?? 'B.E.',
                status: 'ACTIVE',
            });
            program = await trx('programs').where({ id: programId }).first();
        }
        await trx('scheme_programs')
            .insert({ college_id: collegeId, scheme_id: scheme.id, program_id: program.id, status: 'ACTIVE' })
            .onConflict(['scheme_id', 'program_id'])
            .ignore();
        const created = { subjects: 0, outcomes: 0, versions: 0, skipped: 0 };
        for (const subject of payload.subjects) {
            const code = normalizeCode(subject.code);
            let course = await trx('courses').where({ college_id: collegeId, code, scheme_id: scheme.id }).first();
            if (!course) {
                course = await trx('courses').where({ college_id: collegeId, code }).whereNull('scheme_id').first();
                if (course) {
                    await trx('courses').where({ id: course.id }).update({ scheme_id: scheme.id, updated_at: trx.fn.now() });
                    course = await trx('courses').where({ id: course.id }).first();
                }
            }
            if (!course) {
                let semesterId = null;
                if (subject.semesterNumber) {
                    const sem = await trx('semesters').where({ college_id: collegeId, number: subject.semesterNumber }).first();
                    semesterId = sem?.id ?? null;
                }
                const [courseId] = await trx('courses').insert({
                    college_id: collegeId,
                    code,
                    name: subject.name.trim(),
                    scheme_id: scheme.id,
                    semester_id: semesterId,
                    course_type: subject.courseType ?? null,
                    lecture_hours: subject.lectureHours ?? null,
                    tutorial_hours: subject.tutorialHours ?? null,
                    practical_hours: subject.practicalHours ?? null,
                    credits: subject.credits ?? null,
                    cie_marks: subject.cieMarks ?? null,
                    see_marks: subject.seeMarks ?? null,
                    total_marks: subject.cieMarks != null && subject.seeMarks != null ? Number(subject.cieMarks) + Number(subject.seeMarks) : null,
                    status: 'ACTIVE',
                });
                course = await trx('courses').where({ id: courseId }).first();
                created.subjects += 1;
            }
            await trx('program_subjects')
                .insert({
                college_id: collegeId,
                program_id: program.id,
                course_id: course.id,
                scheme_id: scheme.id,
                semester_id: course.semester_id,
                status: 'ACTIVE',
            })
                .onConflict(['program_id', 'course_id'])
                .ignore();
            for (const co of subject.outcomes) {
                const coCode = normalizeCode(co.code || `CO${co.number}`);
                const existing = await trx('course_outcomes')
                    .where({ college_id: collegeId, course_id: course.id, co_code: coCode, is_current: true })
                    .first();
                if (!existing) {
                    await trx('course_outcomes').insert({
                        college_id: collegeId,
                        course_id: course.id,
                        scheme_id: scheme.id,
                        co_number: co.number,
                        co_code: coCode,
                        statement: co.statement.trim(),
                        blooms_level: co.bloomsLevel ?? null,
                        knowledge_level: co.knowledgeLevel ?? null,
                        source: co.source || payload.sourceLabel || 'VTU Official Syllabus',
                        source_page: co.page ?? null,
                        version_number: 1,
                        is_current: true,
                        status: 'ACTIVE',
                        official_text_pending: false,
                        created_by: actor.facultyUserId,
                        updated_by: actor.facultyUserId,
                    });
                    created.outcomes += 1;
                    continue;
                }
                if (!statementsDiffer(String(existing.statement), co.statement))
                    continue;
                const action = resolutionMap.get(`${Number(course.id)}:${coCode}`) || 'REVIEW_LATER';
                if (action === 'KEEP_EXISTING' || action === 'REVIEW_LATER') {
                    created.skipped += 1;
                    continue;
                }
                await trx('course_outcomes').where({ id: existing.id }).update({ is_current: false, status: 'ARCHIVED', updated_at: trx.fn.now() });
                await trx('course_outcomes').insert({
                    college_id: collegeId,
                    course_id: course.id,
                    scheme_id: scheme.id,
                    co_number: existing.co_number,
                    co_code: existing.co_code,
                    statement: co.statement.trim(),
                    blooms_level: co.bloomsLevel ?? existing.blooms_level,
                    knowledge_level: co.knowledgeLevel ?? existing.knowledge_level,
                    source: co.source || payload.sourceLabel || existing.source,
                    source_page: co.page ?? existing.source_page,
                    version_number: Number(existing.version_number) + 1,
                    is_current: true,
                    status: 'ACTIVE',
                    official_text_pending: false,
                    supersedes_id: existing.id,
                    created_by: actor.facultyUserId,
                    updated_by: actor.facultyUserId,
                });
                created.versions += 1;
            }
        }
        await trx('syllabus_import_batches').where({ id: batch.id }).update({
            status: 'COMMITTED',
            dry_run: false,
            resolutions: JSON.stringify(resolutions),
            imported_at: trx.fn.now(),
            updated_at: trx.fn.now(),
        });
        await writeCopoAudit({
            collegeId,
            actorId: actor.facultyUserId,
            action: 'SYLLABUS_IMPORT',
            metadata: { batchId, ...created },
        }, trx);
        return created;
    });
    return result;
}
export { previewWorkbookImport, commitWorkbookImport, workbookErrorReport, importCopoMasterFile } from './workbookImport.js';
