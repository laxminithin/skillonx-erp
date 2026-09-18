import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { catalog as copoCatalog } from '../copo/masters.js';
import { canManageAllCoEvaluations } from './access.js';
import { listCoEvalAudit, recordCoEvalAudit } from './audit.js';
import { computeMarksDistribution, validateEvaluationMatrix, } from './matrixValidation.js';
import { isReviewMarked, nearlyEqual, normalizeCode, numOrNull, parseCoOrder } from './types.js';
import { missingAcademicMasterPayload, overlayByNaturalKey, scopeMasterQuery, } from '../academicMaster/lookup.js';
export const createCoEvalSchema = z.object({
    courseId: z.number().int().positive(),
    academicYearId: z.number().int().positive(),
    programId: z.number().int().positive().nullable().optional(),
    semesterId: z.number().int().positive().nullable().optional(),
    schemeId: z.number().int().positive().nullable().optional(),
});
export const cellUpdateSchema = z.object({
    currentValue: z.number().min(0).max(10000),
    changeJustification: z.string().max(4000).optional().nullable(),
});
export const percentUpdateSchema = z.object({
    currentEvaluationPercent: z.number().min(0).max(100),
    changeJustification: z.string().max(4000).optional().nullable(),
});
export const marksDistUpdateSchema = z.object({
    currentMarksDistribution: z.number().min(0).max(10000),
    changeJustification: z.string().max(4000).optional().nullable(),
});
async function actorName(actorId) {
    const row = await db('faculty_users').where({ id: actorId }).first('name');
    return row?.name ? String(row.name) : null;
}
function parseJson(value) {
    if (value == null)
        return null;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        }
        catch {
            return null;
        }
    }
    return value;
}
async function loadCourseContext(collegeId, input) {
    const course = await db('courses as c')
        .leftJoin('academic_schemes as s', 's.id', 'c.scheme_id')
        .leftJoin('departments as d', 'd.id', 'c.department_id')
        .where({ 'c.id': input.courseId, 'c.college_id': collegeId })
        .select('c.id', 'c.name', 'c.code', 'c.scheme_id as schemeId', 'c.department_id as departmentId', 'c.semester_id as semesterId', 's.name as schemeName', 'd.name as departmentName')
        .first();
    if (!course)
        throw new AppError(404, 'Subject not found');
    const year = await db('academic_years')
        .where({ id: input.academicYearId, college_id: collegeId })
        .first('id', 'label');
    if (!year)
        throw new AppError(400, 'Academic year not found');
    let program = null;
    if (input.programId) {
        program = await db('programs').where({ id: input.programId, college_id: collegeId }).first('id', 'name');
        if (!program)
            throw new AppError(400, 'Program not found');
    }
    let semester = null;
    const semesterId = input.semesterId ?? course.semesterId;
    if (semesterId) {
        semester = await db('semesters').where({ id: semesterId }).first('id', 'label', 'number');
    }
    let scheme = null;
    const schemeId = input.schemeId ?? course.schemeId;
    if (schemeId) {
        scheme = await db('academic_schemes').where({ id: schemeId, college_id: collegeId }).first('id', 'name', 'code');
    }
    return { course, year, program, semester, scheme, schemeId, semesterId };
}
async function findSubjectMaster(collegeId, courseId, courseCode, schemeLabel, subjectName) {
    const code = normalizeCode(courseCode);
    const byId = await scopeMasterQuery(db('co_evaluation_subject_masters').where({ is_active: true, course_id: courseId }), collegeId).first();
    if (byId)
        return byId;
    const rows = overlayByNaturalKey(await scopeMasterQuery(db('co_evaluation_subject_masters').where({ is_active: true }), collegeId).andWhere((b) => {
        b.where('course_code', code);
        if (subjectName)
            b.orWhere('subject_name', subjectName).orWhere('subject_name', 'like', `%${subjectName}%`);
    }), (r) => `${normalizeCode(String(r.course_code))}|${r.scheme_label || ''}`);
    if (!rows.length)
        return null;
    if (rows.length === 1)
        return rows[0];
    if (schemeLabel) {
        const schemeDigits = String(schemeLabel).replace(/[^0-9]/g, '');
        const exact = rows.find((r) => String(r.scheme_label || '') === schemeDigits ||
            String(r.scheme_label || '') === schemeLabel ||
            String(r.scheme_label || '').includes(schemeDigits));
        if (exact)
            return exact;
    }
    return rows.find((r) => r.is_evaluable) || rows[0];
}
async function findAssessmentStructure(collegeId, courseId, courseCode) {
    const rows = await scopeMasterQuery(db('course_assessment_structures').where({ is_active: true }), collegeId).andWhere((b) => {
        b.where('course_id', courseId).orWhere('course_code', normalizeCode(courseCode));
    });
    const overlay = overlayByNaturalKey(rows, (r) => String(r.course_assessment_id || r.course_code));
    return overlay[0] || null;
}
async function findExistingActive(collegeId, createdBy, input) {
    const q = db('faculty_co_evaluations')
        .where({
        college_id: collegeId,
        created_by: createdBy,
        course_id: input.courseId,
        academic_year_id: input.academicYearId,
    })
        .whereNotIn('status', ['ARCHIVED']);
    if (input.programId)
        q.andWhere({ program_id: input.programId });
    else
        q.whereNull('program_id');
    if (input.semesterId)
        q.andWhere({ semester_id: input.semesterId });
    else
        q.whereNull('semester_id');
    if (input.schemeId)
        q.andWhere({ scheme_id: input.schemeId });
    else
        q.whereNull('scheme_id');
    return q.first('id', 'status');
}
function assertEditable(status) {
    if (status === 'FINALIZED') {
        throw new AppError(400, 'Finalized CO Evaluation cannot be edited. Reopen to revise.', undefined, 'FINALIZED_LOCKED');
    }
    if (status === 'ARCHIVED') {
        throw new AppError(400, 'Archived CO Evaluation cannot be edited.', undefined, 'ARCHIVED_LOCKED');
    }
}
export async function getCatalog(collegeId) {
    return copoCatalog(collegeId);
}
export async function listEvaluations(actor, filters = {}) {
    const q = db('faculty_co_evaluations as e')
        .leftJoin('courses as c', 'c.id', 'e.course_id')
        .leftJoin('faculty_users as f', 'f.id', 'e.created_by')
        .leftJoin('programs as p', 'p.id', 'e.program_id')
        .leftJoin('academic_years as y', 'y.id', 'e.academic_year_id')
        .leftJoin('semesters as sem', 'sem.id', 'e.semester_id')
        .where('e.college_id', actor.collegeId)
        .select('e.id', 'e.status', 'e.subject_name as subjectName', 'e.course_code as courseCode', 'e.scheme_label as schemeLabel', 'e.program_name as programName', 'e.semester_label as semesterLabel', 'e.academic_year_label as academicYearLabel', 'e.course_type as courseType', 'e.updated_at as updatedAt', 'e.created_by as createdBy', 'e.verification_status as verificationStatus', 'f.name as facultyName', 'c.department_id as departmentId', 'p.name as programJoinName', 'y.label as yearJoinLabel', 'sem.label as semesterJoinName')
        .orderBy('e.updated_at', 'desc');
    if (!canManageAllCoEvaluations(actor.role) && actor.role === 'FACULTY') {
        q.andWhere('e.created_by', actor.facultyUserId);
    }
    else if (filters.facultyId) {
        q.andWhere('e.created_by', filters.facultyId);
    }
    if (filters.academicYearId)
        q.andWhere('e.academic_year_id', filters.academicYearId);
    if (filters.programId)
        q.andWhere('e.program_id', filters.programId);
    if (filters.semesterId)
        q.andWhere('e.semester_id', filters.semesterId);
    if (filters.courseId)
        q.andWhere('e.course_id', filters.courseId);
    if (filters.status)
        q.andWhere('e.status', filters.status);
    if (filters.departmentId)
        q.andWhere('c.department_id', filters.departmentId);
    const rows = await q;
    const out = [];
    for (const row of rows) {
        const coCountRow = await db('faculty_co_evaluation_cos')
            .where({ evaluation_id: row.id })
            .count({ c: '*' })
            .first();
        const cells = await db('faculty_co_evaluation_cells')
            .where({ evaluation_id: row.id })
            .select('master_value', 'current_value');
        let modifiedValues = 0;
        for (const cell of cells) {
            if (!nearlyEqual(Number(cell.master_value || 0), Number(cell.current_value || 0))) {
                modifiedValues += 1;
            }
        }
        out.push({
            id: Number(row.id),
            subjectName: row.subjectName,
            courseCode: row.courseCode,
            academicYearLabel: row.academicYearLabel || row.yearJoinLabel,
            programName: row.programName || row.programJoinName,
            semesterLabel: row.semesterLabel || row.semesterJoinName,
            schemeLabel: row.schemeLabel,
            courseType: row.courseType,
            status: row.status,
            facultyName: row.facultyName,
            createdBy: Number(row.createdBy),
            updatedAt: row.updatedAt,
            coCount: Number(coCountRow?.c || 0),
            verificationStatus: row.verificationStatus,
            modifiedValues,
        });
    }
    return { evaluations: out };
}
export async function previewGeneration(actor, input) {
    const ctx = await loadCourseContext(actor.collegeId, input);
    const schemeLabel = String(ctx.scheme?.name || ctx.course.schemeName || '');
    const subjectMaster = await findSubjectMaster(actor.collegeId, input.courseId, String(ctx.course.code), schemeLabel, String(ctx.course.name));
    const existing = await findExistingActive(actor.collegeId, actor.facultyUserId, {
        ...input,
        schemeId: input.schemeId ?? ctx.schemeId ?? undefined,
        semesterId: input.semesterId ?? ctx.semesterId ?? undefined,
    });
    const structure = await findAssessmentStructure(actor.collegeId, input.courseId, String(ctx.course.code));
    if (!subjectMaster || subjectMaster.is_blocked || !subjectMaster.is_evaluable) {
        const blockedReason = subjectMaster?.blocked_reason ||
            (structure
                ? 'CO Evaluation unavailable because official Course Outcomes are not available in the current CO Master.'
                : missingAcademicMasterPayload({
                    subjectCode: String(ctx.course.code),
                    subjectName: String(ctx.course.name),
                    scheme: String(ctx.scheme?.name || ctx.course.schemeName || '') || null,
                    missing: ['CO Evaluation master'],
                }).message);
        return {
            found: false,
            reason: subjectMaster?.is_blocked ? 'BLOCKED' : 'NO_MASTER',
            message: blockedReason,
            diagnostics: missingAcademicMasterPayload({
                subjectCode: String(ctx.course.code),
                subjectName: String(ctx.course.name),
                scheme: String(ctx.scheme?.name || ctx.course.schemeName || '') || null,
                missing: subjectMaster?.is_blocked ? ['CO Evaluation blocked'] : ['CO Evaluation master'],
            }).diagnostics,
            assessmentStructureAvailable: Boolean(structure),
            course: {
                id: Number(ctx.course.id),
                name: ctx.course.name,
                code: ctx.course.code,
                schemeName: ctx.scheme?.name || ctx.course.schemeName,
                courseType: subjectMaster?.course_type || structure?.course_type || null,
            },
            existingEvaluationId: existing ? Number(existing.id) : null,
        };
    }
    const coRows = await db('co_evaluation_co_masters').where({ subject_master_id: subjectMaster.id }).count({ c: '*' }).first();
    const comps = await db('co_evaluation_component_masters')
        .where({ subject_master_id: subjectMaster.id })
        .distinct('assessment_component_id');
    return {
        found: true,
        course: {
            id: Number(ctx.course.id),
            name: subjectMaster.subject_name || ctx.course.name,
            code: subjectMaster.course_code || ctx.course.code,
            schemeName: subjectMaster.scheme_label || ctx.scheme?.name || ctx.course.schemeName,
            courseType: subjectMaster.course_type,
        },
        counts: {
            courseOutcomes: Number(coRows?.c || subjectMaster.co_count || 0),
            assessmentComponents: comps.length || Number(subjectMaster.component_count || 0),
        },
        standardDistribution: 'Available',
        verification: subjectMaster.verification_status || subjectMaster.standard_evaluation_status,
        needsReview: isReviewMarked(subjectMaster.verification_status) ||
            isReviewMarked(subjectMaster.standard_evaluation_status),
        existingEvaluationId: existing ? Number(existing.id) : null,
    };
}
export async function createFromMaster(actor, input) {
    const ctx = await loadCourseContext(actor.collegeId, input);
    const schemeId = input.schemeId ?? ctx.schemeId ?? null;
    const semesterId = input.semesterId ?? ctx.semesterId ?? null;
    const normalizedInput = { ...input, schemeId: schemeId ?? undefined, semesterId: semesterId ?? undefined };
    const existing = await findExistingActive(actor.collegeId, actor.facultyUserId, normalizedInput);
    if (existing) {
        throw new AppError(409, 'CO Evaluation already exists.', { existingEvaluationId: Number(existing.id) }, 'DUPLICATE_CO_EVALUATION');
    }
    const schemeLabel = String(ctx.scheme?.name || ctx.course.schemeName || '');
    const subjectMaster = await findSubjectMaster(actor.collegeId, input.courseId, String(ctx.course.code), schemeLabel, String(ctx.course.name));
    if (!subjectMaster || subjectMaster.is_blocked || !subjectMaster.is_evaluable) {
        const structure = await findAssessmentStructure(actor.collegeId, input.courseId, String(ctx.course.code));
        throw new AppError(400, subjectMaster?.blocked_reason ||
            (structure
                ? 'CO Evaluation unavailable because official Course Outcomes are not available in the current CO Master.'
                : 'Academic master data for this subject has not yet been configured.'), missingAcademicMasterPayload({
            subjectCode: String(ctx.course.code),
            subjectName: String(ctx.course.name),
            scheme: String(ctx.scheme?.name || ctx.course.schemeName || '') || null,
            missing: ['CO Evaluation master'],
        }).diagnostics, 'NO_CO_EVAL_MASTER');
    }
    const coMasters = await db('co_evaluation_co_masters')
        .where({ subject_master_id: subjectMaster.id })
        .orderBy('display_order')
        .orderBy('co_code');
    if (!coMasters.length) {
        throw new AppError(400, 'No Course Outcomes found in CO Evaluation master for this subject.', undefined, 'NO_COS');
    }
    const componentMappings = await db('co_evaluation_component_masters').where({ subject_master_id: subjectMaster.id });
    const justifications = await db('co_evaluation_justification_masters').where({ subject_master_id: subjectMaster.id });
    const sources = await db('co_evaluation_sources').where({ subject_master_id: subjectMaster.id });
    const reviews = await scopeMasterQuery(db('co_evaluation_review_queue'), actor.collegeId).andWhere({
        course_code: subjectMaster.course_code,
    });
    const structure = await findAssessmentStructure(actor.collegeId, input.courseId, String(subjectMaster.course_code));
    const courseComponents = overlayByNaturalKey(await scopeMasterQuery(db('course_assessment_components'), actor.collegeId)
        .andWhere({ course_code: subjectMaster.course_code })
        .orderBy('display_order'), (c) => String(c.course_assessment_component_id || c.component_id));
    const assessmentCatalog = overlayByNaturalKey(await scopeMasterQuery(db('assessment_component_masters'), actor.collegeId), (a) => String(a.component_id));
    const catalogById = new Map(assessmentCatalog.map((a) => [String(a.component_id), a]));
    // Matrix columns = components that appear in CO evaluation mappings (master config), not every official component
    const matrixComponentIds = [
        ...new Set(componentMappings.map((m) => String(m.assessment_component_id))),
    ];
    const officialById = new Map(courseComponents.map((c) => [String(c.component_id), c]));
    const name = await actorName(actor.facultyUserId);
    const evaluationId = await db.transaction(async (trx) => {
        const [id] = await trx('faculty_co_evaluations').insert({
            college_id: actor.collegeId,
            created_by: actor.facultyUserId,
            course_id: input.courseId,
            academic_year_id: input.academicYearId,
            program_id: input.programId ?? null,
            semester_id: semesterId,
            scheme_id: schemeId,
            department_id: ctx.course.departmentId ?? null,
            subject_master_id: subjectMaster.id,
            subject_name: subjectMaster.subject_name || ctx.course.name,
            course_code: subjectMaster.course_code || ctx.course.code,
            scheme_label: subjectMaster.scheme_label || schemeLabel,
            program_name: ctx.program?.name || subjectMaster.program_name,
            semester_label: ctx.semester?.label ||
                (ctx.semester?.number != null
                    ? `Semester ${ctx.semester.number}`
                    : subjectMaster.semester_label),
            academic_year_label: ctx.year.label,
            course_type: subjectMaster.course_type || structure?.course_type || null,
            status: 'DRAFT',
            verification_status: subjectMaster.verification_status || subjectMaster.standard_evaluation_status,
            source_status: subjectMaster.source_status,
            import_batch: subjectMaster.import_batch,
            snapshot_meta: JSON.stringify({
                subjectMasterId: subjectMaster.id,
                coCount: coMasters.length,
                componentCount: matrixComponentIds.length,
                importedAt: new Date().toISOString(),
                reviews: reviews.map((r) => ({
                    reviewId: r.review_id,
                    issueType: r.issue_type,
                    reason: r.reason,
                    status: r.review_status,
                })),
            }),
            assessment_structure_snapshot: JSON.stringify({
                structure: structure || null,
                courseComponents,
                sources,
            }),
        });
        const componentRowIds = new Map();
        for (const componentId of matrixComponentIds) {
            const catalog = catalogById.get(componentId);
            const official = officialById.get(componentId);
            const sample = componentMappings.find((m) => String(m.assessment_component_id) === componentId);
            const [compRowId] = await trx('faculty_co_evaluation_components').insert({
                evaluation_id: id,
                assessment_component_id: componentId,
                component_code: catalog?.code || null,
                display_name: official?.component_name ||
                    sample?.assessment_component_name ||
                    catalog?.display_name ||
                    componentId,
                category: catalog?.category || null,
                official_max_marks: official?.max_marks ?? null,
                display_order: catalog?.display_order ?? official?.display_order ?? 100,
                include_in_matrix: true,
                lecturer_editable: true,
                snapshot_json: JSON.stringify({ official, catalog, sample }),
            });
            componentRowIds.set(componentId, Number(compRowId));
        }
        const justMap = new Map(justifications.map((j) => [
            `${String(j.co_code).toUpperCase()}|${j.assessment_component_id}`,
            j,
        ]));
        for (const co of coMasters) {
            const [coRowId] = await trx('faculty_co_evaluation_cos').insert({
                evaluation_id: id,
                co_code: co.co_code,
                co_statement: co.co_statement,
                display_order: co.display_order ?? parseCoOrder(String(co.co_code)),
                master_marks_distribution: co.standard_marks_distribution,
                current_marks_distribution: co.standard_marks_distribution,
                master_evaluation_percent: co.standard_evaluation_percent,
                current_evaluation_percent: co.standard_evaluation_percent,
                marks_distribution_editable: Boolean(co.lecturer_editable),
                evaluation_percent_editable: Boolean(co.lecturer_editable),
                co_source_status: co.co_source_status,
                verification_status: co.verification_status,
                snapshot_json: JSON.stringify(co),
            });
            for (const componentId of matrixComponentIds) {
                const mapping = componentMappings.find((m) => String(m.co_code).toUpperCase() === String(co.co_code).toUpperCase() &&
                    String(m.assessment_component_id) === componentId);
                const masterValue = mapping ? numOrNull(mapping.standard_marks_assigned) : null;
                const just = justMap.get(`${String(co.co_code).toUpperCase()}|${componentId}`);
                await trx('faculty_co_evaluation_cells').insert({
                    evaluation_id: id,
                    co_row_id: coRowId,
                    component_row_id: componentRowIds.get(componentId),
                    co_code: co.co_code,
                    assessment_component_id: componentId,
                    master_value: masterValue,
                    current_value: masterValue,
                    lecturer_editable: mapping ? Boolean(mapping.lecturer_editable) : true,
                    master_justification: just?.justification || null,
                    change_justification: null,
                    mapping_basis: mapping?.mapping_basis || null,
                    source_origin: mapping?.source_origin || null,
                    verification_status: mapping?.verification_status || null,
                    snapshot_json: JSON.stringify({ mapping: mapping || null, justification: just || null }),
                });
            }
        }
        await recordCoEvalAudit({
            collegeId: actor.collegeId,
            evaluationId: Number(id),
            actorId: actor.facultyUserId,
            actorName: name,
            action: 'CO_EVALUATION_CREATED',
            metadata: {
                courseId: input.courseId,
                coCount: coMasters.length,
                componentCount: matrixComponentIds.length,
            },
        }, trx);
        return Number(id);
    });
    return getEvaluation(evaluationId, actor.collegeId);
}
export async function getEvaluation(evaluationId, collegeId) {
    const header = await db('faculty_co_evaluations as e')
        .leftJoin('faculty_users as f', 'f.id', 'e.created_by')
        .leftJoin('colleges as col', 'col.id', 'e.college_id')
        .leftJoin('departments as d', 'd.id', 'e.department_id')
        .where({ 'e.id': evaluationId, 'e.college_id': collegeId })
        .select('e.*', 'f.name as facultyName', 'col.name as collegeName', 'col.logo_url as logoUrl', 'd.name as departmentName')
        .first();
    if (!header)
        throw new AppError(404, 'CO Evaluation not found');
    const components = await db('faculty_co_evaluation_components')
        .where({ evaluation_id: evaluationId })
        .orderBy('display_order')
        .orderBy('id');
    const cos = await db('faculty_co_evaluation_cos')
        .where({ evaluation_id: evaluationId })
        .orderBy('display_order')
        .orderBy('co_code');
    const cells = await db('faculty_co_evaluation_cells').where({ evaluation_id: evaluationId });
    const matrixCos = cos.map((co) => ({
        id: Number(co.id),
        coCode: String(co.co_code),
        coStatement: co.co_statement,
        displayOrder: Number(co.display_order || 0),
        masterMarksDistribution: numOrNull(co.master_marks_distribution),
        currentMarksDistribution: numOrNull(co.current_marks_distribution),
        masterEvaluationPercent: numOrNull(co.master_evaluation_percent),
        currentEvaluationPercent: numOrNull(co.current_evaluation_percent),
        marksDistributionEditable: Boolean(co.marks_distribution_editable),
        evaluationPercentEditable: Boolean(co.evaluation_percent_editable),
        marksDistributionChangeJustification: co.marks_distribution_change_justification,
        evaluationPercentChangeJustification: co.evaluation_percent_change_justification,
        coSourceStatus: co.co_source_status,
        verificationStatus: co.verification_status,
        modified: !nearlyEqual(Number(co.master_marks_distribution || 0), Number(co.current_marks_distribution || 0)) ||
            !nearlyEqual(Number(co.master_evaluation_percent || 0), Number(co.current_evaluation_percent || 0)),
    }));
    const matrixComponents = components.map((c) => ({
        id: Number(c.id),
        assessmentComponentId: String(c.assessment_component_id),
        componentCode: c.component_code,
        displayName: String(c.display_name),
        category: c.category,
        officialMaxMarks: numOrNull(c.official_max_marks),
        displayOrder: Number(c.display_order || 0),
        includeInMatrix: Boolean(c.include_in_matrix),
        lecturerEditable: Boolean(c.lecturer_editable),
    }));
    const matrixCells = cells.map((cell) => {
        const master = numOrNull(cell.master_value);
        const current = numOrNull(cell.current_value);
        const modified = !nearlyEqual(Number(master || 0), Number(current || 0));
        return {
            id: Number(cell.id),
            coRowId: Number(cell.co_row_id),
            componentRowId: Number(cell.component_row_id),
            coCode: String(cell.co_code),
            assessmentComponentId: String(cell.assessment_component_id),
            masterValue: master,
            currentValue: current,
            lecturerEditable: Boolean(cell.lecturer_editable),
            masterJustification: cell.master_justification,
            changeJustification: cell.change_justification,
            mappingBasis: cell.mapping_basis,
            sourceOrigin: cell.source_origin,
            verificationStatus: cell.verification_status,
            modified,
        };
    });
    const validation = validateEvaluationMatrix({
        components: matrixComponents,
        cos: matrixCos.map((c) => ({
            coCode: c.coCode,
            currentMarksDistribution: c.currentMarksDistribution,
            currentEvaluationPercent: c.currentEvaluationPercent,
        })),
        cells: matrixCells.map((c) => ({
            coCode: c.coCode,
            assessmentComponentId: c.assessmentComponentId,
            currentValue: c.currentValue,
            masterValue: c.masterValue,
            changeJustification: c.changeJustification,
            lecturerEditable: c.lecturerEditable,
        })),
    });
    const justifications = matrixCells
        .filter((c) => (c.masterValue != null && c.masterValue !== 0) || c.modified)
        .map((c) => ({
        coCode: c.coCode,
        assessmentComponentId: c.assessmentComponentId,
        componentName: matrixComponents.find((x) => x.assessmentComponentId === c.assessmentComponentId)?.displayName ||
            c.assessmentComponentId,
        standardValue: c.masterValue,
        currentValue: c.currentValue,
        masterJustification: c.masterJustification,
        lecturerChangeJustification: c.changeJustification,
        sourceStatus: c.verificationStatus,
        modified: c.modified,
    }));
    return {
        id: Number(header.id),
        status: String(header.status),
        subjectName: header.subject_name,
        courseCode: header.course_code,
        schemeLabel: header.scheme_label,
        programName: header.program_name,
        semesterLabel: header.semester_label,
        academicYearLabel: header.academic_year_label,
        courseType: header.course_type,
        facultyName: header.facultyName,
        createdBy: Number(header.created_by),
        departmentName: header.departmentName,
        collegeName: header.collegeName,
        logoUrl: header.logoUrl,
        verificationStatus: header.verification_status,
        sourceStatus: header.source_status,
        finalizedAt: header.finalized_at,
        archivedAt: header.archived_at,
        updatedAt: header.updated_at,
        createdAt: header.created_at,
        snapshotMeta: parseJson(header.snapshot_meta),
        assessmentStructure: parseJson(header.assessment_structure_snapshot),
        components: matrixComponents,
        cos: matrixCos,
        cells: matrixCells,
        justifications,
        validation,
        summary: {
            courseOutcomes: matrixCos.length,
            assessmentComponents: matrixComponents.filter((c) => c.includeInMatrix).length,
            allocatedMarks: validation.allocatedMarks,
            expectedMarks: validation.expectedMarks,
            evaluationAllocation: validation.evaluationPercentTotal,
            modifiedValues: validation.modifiedCellCount,
            status: header.status,
        },
    };
}
export async function updateCell(actor, evaluationId, cellId, input) {
    const evaluation = await db('faculty_co_evaluations')
        .where({ id: evaluationId, college_id: actor.collegeId })
        .first();
    if (!evaluation)
        throw new AppError(404, 'CO Evaluation not found');
    assertEditable(String(evaluation.status));
    const cell = await db('faculty_co_evaluation_cells')
        .where({ id: cellId, evaluation_id: evaluationId })
        .first();
    if (!cell)
        throw new AppError(404, 'Cell not found');
    if (!cell.lecturer_editable) {
        throw new AppError(400, 'This cell is not lecturer-editable.', undefined, 'NOT_EDITABLE');
    }
    const master = Number(cell.master_value || 0);
    const next = Number(input.currentValue);
    const changed = !nearlyEqual(master, next);
    if (changed && !String(input.changeJustification || '').trim()) {
        throw new AppError(400, 'Change justification is required when modifying a standard value.', undefined, 'JUSTIFICATION_REQUIRED');
    }
    const name = await actorName(actor.facultyUserId);
    await db.transaction(async (trx) => {
        await trx('faculty_co_evaluation_cells')
            .where({ id: cellId })
            .update({
            current_value: next,
            change_justification: changed ? input.changeJustification : null,
            updated_at: trx.fn.now(),
        });
        const coCells = await trx('faculty_co_evaluation_cells').where({
            evaluation_id: evaluationId,
            co_row_id: cell.co_row_id,
        });
        const derived = computeMarksDistribution(coCells.map((c) => ({
            coCode: String(c.co_code),
            assessmentComponentId: String(c.assessment_component_id),
            currentValue: c.id === cellId ? next : numOrNull(c.current_value),
            masterValue: numOrNull(c.master_value),
        })), String(cell.co_code));
        await trx('faculty_co_evaluation_cos').where({ id: cell.co_row_id }).update({
            current_marks_distribution: derived,
            updated_at: trx.fn.now(),
        });
        await trx('faculty_co_evaluations').where({ id: evaluationId }).update({ updated_at: trx.fn.now() });
        await recordCoEvalAudit({
            collegeId: actor.collegeId,
            evaluationId,
            cellId,
            coRowId: Number(cell.co_row_id),
            actorId: actor.facultyUserId,
            actorName: name,
            action: 'CELL_CHANGED',
            metadata: {
                coCode: cell.co_code,
                assessmentComponentId: cell.assessment_component_id,
                oldValue: numOrNull(cell.current_value),
                newValue: next,
                masterValue: numOrNull(cell.master_value),
                changeJustification: changed ? input.changeJustification : null,
            },
        }, trx);
    });
    return getEvaluation(evaluationId, actor.collegeId);
}
export async function updateEvaluationPercent(actor, evaluationId, coRowId, input) {
    const evaluation = await db('faculty_co_evaluations')
        .where({ id: evaluationId, college_id: actor.collegeId })
        .first();
    if (!evaluation)
        throw new AppError(404, 'CO Evaluation not found');
    assertEditable(String(evaluation.status));
    const co = await db('faculty_co_evaluation_cos')
        .where({ id: coRowId, evaluation_id: evaluationId })
        .first();
    if (!co)
        throw new AppError(404, 'CO row not found');
    if (!co.evaluation_percent_editable) {
        throw new AppError(400, 'Evaluation % is not lecturer-editable for this CO.', undefined, 'NOT_EDITABLE');
    }
    const master = Number(co.master_evaluation_percent || 0);
    const next = Number(input.currentEvaluationPercent);
    const changed = !nearlyEqual(master, next);
    if (changed && !String(input.changeJustification || '').trim()) {
        throw new AppError(400, 'Change justification is required when modifying evaluation %.', undefined, 'JUSTIFICATION_REQUIRED');
    }
    const name = await actorName(actor.facultyUserId);
    await db.transaction(async (trx) => {
        await trx('faculty_co_evaluation_cos')
            .where({ id: coRowId })
            .update({
            current_evaluation_percent: next,
            evaluation_percent_change_justification: changed ? input.changeJustification : null,
            updated_at: trx.fn.now(),
        });
        await trx('faculty_co_evaluations').where({ id: evaluationId }).update({ updated_at: trx.fn.now() });
        await recordCoEvalAudit({
            collegeId: actor.collegeId,
            evaluationId,
            coRowId,
            actorId: actor.facultyUserId,
            actorName: name,
            action: 'EVALUATION_PERCENT_CHANGED',
            metadata: {
                coCode: co.co_code,
                oldValue: numOrNull(co.current_evaluation_percent),
                newValue: next,
                masterValue: numOrNull(co.master_evaluation_percent),
                changeJustification: changed ? input.changeJustification : null,
            },
        }, trx);
    });
    return getEvaluation(evaluationId, actor.collegeId);
}
export async function resetToStandard(actor, evaluationId) {
    const evaluation = await db('faculty_co_evaluations')
        .where({ id: evaluationId, college_id: actor.collegeId })
        .first();
    if (!evaluation)
        throw new AppError(404, 'CO Evaluation not found');
    assertEditable(String(evaluation.status));
    const name = await actorName(actor.facultyUserId);
    await db.transaction(async (trx) => {
        const cells = await trx('faculty_co_evaluation_cells').where({ evaluation_id: evaluationId });
        for (const cell of cells) {
            await trx('faculty_co_evaluation_cells')
                .where({ id: cell.id })
                .update({
                current_value: cell.master_value,
                change_justification: null,
                updated_at: trx.fn.now(),
            });
        }
        const cos = await trx('faculty_co_evaluation_cos').where({ evaluation_id: evaluationId });
        for (const co of cos) {
            await trx('faculty_co_evaluation_cos')
                .where({ id: co.id })
                .update({
                current_marks_distribution: co.master_marks_distribution,
                current_evaluation_percent: co.master_evaluation_percent,
                marks_distribution_change_justification: null,
                evaluation_percent_change_justification: null,
                updated_at: trx.fn.now(),
            });
        }
        await trx('faculty_co_evaluations').where({ id: evaluationId }).update({ updated_at: trx.fn.now() });
        await recordCoEvalAudit({
            collegeId: actor.collegeId,
            evaluationId,
            actorId: actor.facultyUserId,
            actorName: name,
            action: 'RESET_TO_STANDARD',
            metadata: { cellCount: cells.length, coCount: cos.length },
        }, trx);
    });
    return getEvaluation(evaluationId, actor.collegeId);
}
export async function resetCell(actor, evaluationId, cellId) {
    const evaluation = await db('faculty_co_evaluations')
        .where({ id: evaluationId, college_id: actor.collegeId })
        .first();
    if (!evaluation)
        throw new AppError(404, 'CO Evaluation not found');
    assertEditable(String(evaluation.status));
    const cell = await db('faculty_co_evaluation_cells')
        .where({ id: cellId, evaluation_id: evaluationId })
        .first();
    if (!cell)
        throw new AppError(404, 'Cell not found');
    const name = await actorName(actor.facultyUserId);
    await db.transaction(async (trx) => {
        await trx('faculty_co_evaluation_cells')
            .where({ id: cellId })
            .update({
            current_value: cell.master_value,
            change_justification: null,
            updated_at: trx.fn.now(),
        });
        const coCells = await trx('faculty_co_evaluation_cells').where({
            evaluation_id: evaluationId,
            co_row_id: cell.co_row_id,
        });
        const derived = computeMarksDistribution(coCells.map((c) => ({
            coCode: String(c.co_code),
            assessmentComponentId: String(c.assessment_component_id),
            currentValue: c.id === cellId ? numOrNull(cell.master_value) : numOrNull(c.current_value),
            masterValue: numOrNull(c.master_value),
        })), String(cell.co_code));
        await trx('faculty_co_evaluation_cos').where({ id: cell.co_row_id }).update({
            current_marks_distribution: derived,
            updated_at: trx.fn.now(),
        });
        await trx('faculty_co_evaluations').where({ id: evaluationId }).update({ updated_at: trx.fn.now() });
        await recordCoEvalAudit({
            collegeId: actor.collegeId,
            evaluationId,
            cellId,
            coRowId: Number(cell.co_row_id),
            actorId: actor.facultyUserId,
            actorName: name,
            action: 'CELL_RESET',
            metadata: {
                coCode: cell.co_code,
                assessmentComponentId: cell.assessment_component_id,
                restoredValue: numOrNull(cell.master_value),
            },
        }, trx);
    });
    return getEvaluation(evaluationId, actor.collegeId);
}
export async function saveDraft(actor, evaluationId) {
    const evaluation = await db('faculty_co_evaluations')
        .where({ id: evaluationId, college_id: actor.collegeId })
        .first();
    if (!evaluation)
        throw new AppError(404, 'CO Evaluation not found');
    assertEditable(String(evaluation.status));
    const name = await actorName(actor.facultyUserId);
    await db('faculty_co_evaluations').where({ id: evaluationId }).update({
        status: 'DRAFT',
        updated_at: db.fn.now(),
    });
    await recordCoEvalAudit({
        collegeId: actor.collegeId,
        evaluationId,
        actorId: actor.facultyUserId,
        actorName: name,
        action: 'DRAFT_SAVED',
    });
    return getEvaluation(evaluationId, actor.collegeId);
}
export async function finalizeEvaluation(actor, evaluationId) {
    const detail = await getEvaluation(evaluationId, actor.collegeId);
    assertEditable(detail.status);
    if (!detail.validation.okForFinalize) {
        throw new AppError(400, 'Cannot finalize: validation errors remain.', { issues: detail.validation.issues }, 'VALIDATION_FAILED');
    }
    const name = await actorName(actor.facultyUserId);
    await db('faculty_co_evaluations').where({ id: evaluationId }).update({
        status: 'FINALIZED',
        finalized_at: db.fn.now(),
        finalized_by: actor.facultyUserId,
        updated_at: db.fn.now(),
    });
    await recordCoEvalAudit({
        collegeId: actor.collegeId,
        evaluationId,
        actorId: actor.facultyUserId,
        actorName: name,
        action: 'FINALIZED',
    });
    return getEvaluation(evaluationId, actor.collegeId);
}
export async function reopenEvaluation(actor, evaluationId) {
    const evaluation = await db('faculty_co_evaluations')
        .where({ id: evaluationId, college_id: actor.collegeId })
        .first();
    if (!evaluation)
        throw new AppError(404, 'CO Evaluation not found');
    if (String(evaluation.status) !== 'FINALIZED') {
        throw new AppError(400, 'Only finalized evaluations can be reopened.');
    }
    const name = await actorName(actor.facultyUserId);
    await db('faculty_co_evaluations').where({ id: evaluationId }).update({
        status: 'DRAFT',
        finalized_at: null,
        finalized_by: null,
        updated_at: db.fn.now(),
    });
    await recordCoEvalAudit({
        collegeId: actor.collegeId,
        evaluationId,
        actorId: actor.facultyUserId,
        actorName: name,
        action: 'REOPENED',
    });
    return getEvaluation(evaluationId, actor.collegeId);
}
export async function archiveEvaluation(actor, evaluationId) {
    const evaluation = await db('faculty_co_evaluations')
        .where({ id: evaluationId, college_id: actor.collegeId })
        .first();
    if (!evaluation)
        throw new AppError(404, 'CO Evaluation not found');
    const name = await actorName(actor.facultyUserId);
    await db('faculty_co_evaluations').where({ id: evaluationId }).update({
        status: 'ARCHIVED',
        archived_at: db.fn.now(),
        updated_at: db.fn.now(),
    });
    await recordCoEvalAudit({
        collegeId: actor.collegeId,
        evaluationId,
        actorId: actor.facultyUserId,
        actorName: name,
        action: 'ARCHIVED',
    });
    return getEvaluation(evaluationId, actor.collegeId);
}
export async function getAudit(evaluationId, collegeId) {
    return { events: await listCoEvalAudit(evaluationId, collegeId) };
}
export async function listMasterSubjects(collegeId, filters = {}) {
    const q = scopeMasterQuery(db('co_evaluation_subject_masters as s').where({ 's.is_active': true }), collegeId, 's.college_id')
        .select('s.id', 's.college_id', 's.id', 's.subject_name as subjectName', 's.course_code as courseCode', 's.scheme_label as schemeLabel', 's.program_name as programName', 's.semester_label as semesterLabel', 's.course_type as courseType', 's.co_count as coCount', 's.component_count as componentCount', 's.assessment_components_label as assessmentComponentsLabel', 's.official_structure_status as officialStructureStatus', 's.standard_evaluation_status as standardEvaluationStatus', 's.evaluation_percent_total as evaluationPercentTotal', 's.component_total_validation as componentTotalValidation', 's.source_status as sourceStatus', 's.review_items as reviewItems', 's.ready_for_import as readyForImport', 's.is_evaluable as isEvaluable', 's.is_blocked as isBlocked', 's.blocked_reason as blockedReason', 's.verification_status as verificationStatus')
        .orderBy('s.course_code');
    if (filters.courseId)
        q.andWhere('s.course_id', filters.courseId);
    if (filters.courseCode)
        q.andWhere('s.course_code', normalizeCode(filters.courseCode));
    const subjects = overlayByNaturalKey(await q, (s) => `${s.courseCode}|${s.schemeLabel || ''}`);
    const reviews = await scopeMasterQuery(db('co_evaluation_review_queue'), collegeId).select('review_id as reviewId', 'subject_name as subjectName', 'course_code as courseCode', 'issue_type as issueType', 'reason', 'review_status as reviewStatus', 'priority')
        .orderBy('id');
    return { subjects, reviews };
}
export { validateEvaluationMatrix };
