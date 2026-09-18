import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { generateAssignmentCode } from '../../utils/codes.js';
import { DEFAULT_TIMEZONE } from '../../utils/timezone.js';
import { ASSIGNMENT_QUESTION_TYPES, ASSIGNMENT_RESPONSE_FORMATS, SOLUTION_RELEASE_POLICIES, normalizeQuestionText, } from '../../types/assignment.js';
import { deriveStoredStatusAfterSchedule, getAssignmentAvailabilityStatus, isValidSchedule, } from './status.js';
import { listAssignmentAudit } from './audit.js';
import { parseSecondaryCos, resolveDerivedOutcomes, snapshotDerivedOutcomes } from '../questions/coMapping.js';
import { buildDefaultScheme, findDuplicateNormalizedTexts, hasModelSolution, parseEvaluationScheme, validateSchemeMatchesMarks, } from './scheme.js';
import { applyCriterionMarks, resolveSchemeFromSnapshotQuestion, summarizeEvaluation, } from './evaluation.js';
import { parseSnapshotQuestions } from './serialize.js';
export const assignmentMetaSchema = z.object({
    title: z.string().min(1, 'Assignment title is required').max(255),
    description: z.string().optional().nullable(),
    instructions: z.string().optional().nullable(),
    assignmentNumber: z.string().max(64).optional().nullable(),
    courseId: z.number().int().positive().optional().nullable(),
    moduleId: z.number().int().positive().optional().nullable(),
    programId: z.number().int().positive().optional().nullable(),
    academicYearId: z.number().int().positive().optional().nullable(),
    semesterId: z.number().int().positive().optional().nullable(),
    departmentId: z.number().int().positive().optional().nullable(),
    classSectionId: z.number().int().positive().optional().nullable(),
    startAt: z.string().datetime().optional().nullable(),
    dueAt: z.string().datetime().optional().nullable(),
    lateSubmissionAllowed: z.boolean().optional(),
    lateDeadlineAt: z.string().datetime().optional().nullable(),
    attemptsAllowed: z.number().int().min(0).max(20).optional(),
    showMarksImmediately: z.boolean().optional(),
    showFeedbackAfterEvaluation: z.boolean().optional(),
    passPercentage: z.number().min(0).max(100).optional(),
    solutionReleasePolicy: z.enum(SOLUTION_RELEASE_POLICIES).optional(),
    randomSelection: z.any().optional().nullable(),
});
export const assignmentQuestionSchema = z.object({
    bankQuestionId: z.number().int().positive().optional().nullable(),
    moduleId: z.number().int().positive().optional().nullable(),
    questionText: z.string().min(1),
    questionType: z.enum(ASSIGNMENT_QUESTION_TYPES).optional().default('DESCRIPTIVE'),
    responseFormat: z.enum(ASSIGNMENT_RESPONSE_FORMATS).optional().default('LONG_TEXT'),
    marks: z.number().positive().max(100).optional().default(10),
    difficulty: z.string().optional().nullable(),
    expectedAnswerGuidance: z.string().optional().nullable(),
    evaluationRubric: z.any().optional().nullable(),
    primaryCoCode: z.string().max(32).optional().nullable(),
    secondaryCoCodes: z.array(z.string()).optional().nullable(),
    mappingBasis: z.string().max(512).optional().nullable(),
    mappingSource: z.string().max(255).optional().nullable(),
    verificationStatus: z.string().max(32).optional().nullable(),
});
export const reorderSchema = z.object({
    questions: z.array(z.object({ id: z.number().int().positive(), sortOrder: z.number().int() })),
});
function parseJson(value, fallback) {
    if (value == null)
        return fallback;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        }
        catch {
            return fallback;
        }
    }
    return value;
}
async function assertAssignmentRow(assignmentId, collegeId) {
    const row = await db('assignments')
        .where({ id: assignmentId, college_id: collegeId })
        .whereNull('deleted_at')
        .first();
    if (!row)
        throw new AppError(404, 'Assignment not found');
    return row;
}
function assertStructureEditable(row) {
    if (row.status === 'ARCHIVED')
        throw new AppError(400, 'Archived assignments cannot be edited');
    if (row.structure_locked) {
        throw new AppError(400, 'This assignment structure is locked because students have already started. Duplicate to make changes.', undefined, 'ASSIGNMENT_LOCKED');
    }
}
function mapAssignmentRow(row) {
    const effectiveStatus = getAssignmentAvailabilityStatus({
        status: String(row.status),
        startAt: row.start_at ?? null,
        endAt: row.due_at ?? null,
        closedAt: row.closed_at ?? null,
        archivedAt: row.archived_at ?? null,
        deletedAt: row.deleted_at ?? null,
    });
    return {
        id: row.id,
        collegeId: row.college_id,
        createdBy: row.created_by,
        createdByName: row.created_by_name,
        title: row.title,
        description: row.description,
        instructions: row.instructions,
        courseId: row.course_id,
        moduleId: row.module_id,
        programId: row.program_id,
        academicYearId: row.academic_year_id,
        semesterId: row.semester_id,
        departmentId: row.department_id,
        classSectionId: row.class_section_id,
        startAt: row.start_at,
        dueAt: row.due_at,
        endAt: row.due_at,
        lateSubmissionAllowed: !!row.late_submission_allowed,
        lateDeadlineAt: row.late_deadline_at,
        status: row.status,
        effectiveStatus,
        attemptsAllowed: Number(row.attempts_allowed ?? 1),
        showMarksImmediately: !!row.show_marks_immediately,
        showFeedbackAfterEvaluation: row.show_feedback_after_evaluation == null ? true : !!row.show_feedback_after_evaluation,
        passPercentage: Number(row.pass_percentage ?? 40),
        randomSelection: parseJson(row.random_selection, null),
        publishedAt: row.published_at,
        closedAt: row.closed_at,
        archivedAt: row.archived_at,
        structureLocked: !!row.structure_locked,
        structureVersion: Number(row.structure_version ?? 1),
        canEditStructure: !row.structure_locked && row.status !== 'ARCHIVED',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        submissionCount: row.submission_count != null ? Number(row.submission_count) : undefined,
        evaluatedCount: row.evaluated_count != null ? Number(row.evaluated_count) : undefined,
        questionCount: row.question_count != null ? Number(row.question_count) : undefined,
        totalMarks: row.total_marks != null ? Number(row.total_marks) : undefined,
        departmentName: row.department_name ?? undefined,
        courseName: row.course_name ?? undefined,
        courseCode: row.course_code ?? undefined,
        moduleName: row.module_name ?? undefined,
        academicYearLabel: row.academic_year_label ?? undefined,
        semesterLabel: row.semester_label ?? undefined,
        shareCode: row.share_code ?? undefined,
        timezone: row.timezone ?? DEFAULT_TIMEZONE,
        assignmentNumber: row.assignment_number ?? null,
        solutionReleasePolicy: row.solution_release_policy || 'MANUAL_RELEASE',
        solutionsReleasedAt: row.solutions_released_at ?? null,
    };
}
function mapQuestion(q, moduleNames) {
    return {
        id: q.id,
        bankQuestionId: q.bank_question_id,
        moduleId: q.module_id,
        moduleName: q.module_id ? moduleNames.get(Number(q.module_id)) ?? null : null,
        questionText: q.question_text,
        questionType: q.question_type,
        responseFormat: q.response_format,
        marks: Number(q.marks),
        difficulty: q.difficulty,
        expectedAnswerGuidance: q.expected_answer_guidance,
        modelSolution: q.expected_answer_guidance,
        evaluationRubric: parseJson(q.evaluation_rubric, null),
        evaluationScheme: parseEvaluationScheme(q.evaluation_rubric),
        primaryCoCode: q.primary_co_code,
        primaryCoId: q.primary_co_id,
        secondaryCoCodes: parseSecondaryCos(q.secondary_co_codes),
        mappingBasis: q.mapping_basis,
        mappingSource: q.mapping_source,
        verificationStatus: q.verification_status,
        derivedOutcomes: parseJson(q.derived_outcomes_snapshot, null),
        sortOrder: Number(q.sort_order),
    };
}
const assignmentSelect = [
    'a.*',
    'd.name as department_name',
    'c.name as course_name',
    'c.code as course_code',
    'm.name as module_name',
    'ay.label as academic_year_label',
    'se.label as semester_label',
    'col.timezone as timezone',
    'fu.name as created_by_name',
    'al.code as share_code',
];
function assignmentBaseQuery() {
    return db('assignments as a')
        .leftJoin('departments as d', 'd.id', 'a.department_id')
        .leftJoin('courses as c', 'c.id', 'a.course_id')
        .leftJoin('subject_modules as m', 'm.id', 'a.module_id')
        .leftJoin('academic_years as ay', 'ay.id', 'a.academic_year_id')
        .leftJoin('semesters as se', 'se.id', 'a.semester_id')
        .leftJoin('colleges as col', 'col.id', 'a.college_id')
        .leftJoin('faculty_users as fu', 'fu.id', 'a.created_by')
        .leftJoin('assignment_links as al', function joinLink() {
        this.on('al.assignment_id', '=', 'a.id').andOn('al.is_active', '=', db.raw('1'));
    });
}
export async function listAssignments(collegeId, opts = {}) {
    let query = assignmentBaseQuery().where('a.college_id', collegeId).whereNull('a.deleted_at');
    if (opts.createdBy)
        query = query.andWhere('a.created_by', opts.createdBy);
    if (opts.status)
        query = query.andWhere('a.status', opts.status);
    const rows = await query
        .select(...assignmentSelect)
        .select(db.raw(`(select count(*) from assignment_questions aq where aq.assignment_id = a.id) as question_count`), db.raw(`(select coalesce(sum(aq.marks), 0) from assignment_questions aq where aq.assignment_id = a.id) as total_marks`), db.raw(`(select count(*) from assignment_submissions s where s.assignment_id = a.id and s.status in ('SUBMITTED','LATE_SUBMITTED')) as submission_count`), db.raw(`(select count(*) from assignment_submissions s where s.assignment_id = a.id and s.evaluation_status in ('EVALUATED','RELEASED')) as evaluated_count`))
        .orderBy('a.created_at', 'desc');
    return rows.map((r) => mapAssignmentRow(r));
}
export async function getAssignment(assignmentId, collegeId) {
    const row = await assignmentBaseQuery()
        .where({ 'a.id': assignmentId, 'a.college_id': collegeId })
        .whereNull('a.deleted_at')
        .select(...assignmentSelect)
        .first();
    if (!row)
        throw new AppError(404, 'Assignment not found');
    const questions = await db('assignment_questions')
        .where({ assignment_id: assignmentId })
        .orderBy('sort_order', 'asc');
    const moduleIds = [...new Set(questions.map((q) => q.module_id).filter(Boolean))];
    const moduleRows = moduleIds.length
        ? await db('subject_modules').whereIn('id', moduleIds).select('id', 'name')
        : [];
    const moduleNames = new Map(moduleRows.map((m) => [Number(m.id), String(m.name)]));
    const submissionCount = await db('assignment_submissions')
        .where({ assignment_id: assignmentId })
        .whereIn('status', ['SUBMITTED', 'LATE_SUBMITTED'])
        .count({ c: '*' })
        .first();
    return {
        ...mapAssignmentRow({ ...row, submission_count: submissionCount?.c }),
        questions: questions.map((q) => mapQuestion(q, moduleNames)),
        audit: await listAssignmentAudit(assignmentId, collegeId),
    };
}
export async function createAssignment(collegeId, createdBy, input) {
    if (input.startAt && input.dueAt && !isValidSchedule(input.startAt, input.dueAt)) {
        throw new AppError(400, 'Due date must be after start date');
    }
    const [id] = await db('assignments').insert({
        college_id: collegeId,
        created_by: createdBy,
        title: input.title,
        description: input.description ?? null,
        instructions: input.instructions ?? null,
        assignment_number: input.assignmentNumber ?? null,
        course_id: input.courseId ?? null,
        module_id: input.moduleId ?? null,
        program_id: input.programId ?? null,
        academic_year_id: input.academicYearId ?? null,
        semester_id: input.semesterId ?? null,
        department_id: input.departmentId ?? null,
        class_section_id: input.classSectionId ?? null,
        start_at: input.startAt ? new Date(input.startAt) : null,
        due_at: input.dueAt ? new Date(input.dueAt) : null,
        late_submission_allowed: input.lateSubmissionAllowed ?? false,
        late_deadline_at: input.lateDeadlineAt ? new Date(input.lateDeadlineAt) : null,
        attempts_allowed: input.attemptsAllowed ?? 1,
        show_marks_immediately: input.showMarksImmediately ?? false,
        show_feedback_after_evaluation: input.showFeedbackAfterEvaluation ?? true,
        pass_percentage: input.passPercentage ?? 40,
        solution_release_policy: input.solutionReleasePolicy ?? 'MANUAL_RELEASE',
        random_selection: input.randomSelection ? JSON.stringify(input.randomSelection) : null,
        status: 'DRAFT',
    });
    return getAssignment(Number(id), collegeId);
}
export async function updateAssignment(assignmentId, collegeId, input) {
    const row = await assertAssignmentRow(assignmentId, collegeId);
    if (row.status === 'ARCHIVED')
        throw new AppError(400, 'Archived assignments cannot be edited');
    const startAt = input.startAt !== undefined ? input.startAt : row.start_at;
    const dueAt = input.dueAt !== undefined ? input.dueAt : row.due_at;
    if (startAt && dueAt && !isValidSchedule(String(startAt), String(dueAt))) {
        throw new AppError(400, 'Due date must be after start date');
    }
    const patch = { updated_at: db.fn.now() };
    if (input.title !== undefined)
        patch.title = input.title;
    if (input.description !== undefined)
        patch.description = input.description;
    if (input.instructions !== undefined)
        patch.instructions = input.instructions;
    if (input.assignmentNumber !== undefined)
        patch.assignment_number = input.assignmentNumber;
    if (input.courseId !== undefined)
        patch.course_id = input.courseId;
    if (input.moduleId !== undefined)
        patch.module_id = input.moduleId;
    if (input.programId !== undefined)
        patch.program_id = input.programId;
    if (input.academicYearId !== undefined)
        patch.academic_year_id = input.academicYearId;
    if (input.semesterId !== undefined)
        patch.semester_id = input.semesterId;
    if (input.departmentId !== undefined)
        patch.department_id = input.departmentId;
    if (input.classSectionId !== undefined)
        patch.class_section_id = input.classSectionId;
    if (input.startAt !== undefined)
        patch.start_at = input.startAt ? new Date(input.startAt) : null;
    if (input.dueAt !== undefined)
        patch.due_at = input.dueAt ? new Date(input.dueAt) : null;
    if (input.lateSubmissionAllowed !== undefined)
        patch.late_submission_allowed = input.lateSubmissionAllowed;
    if (input.lateDeadlineAt !== undefined) {
        patch.late_deadline_at = input.lateDeadlineAt ? new Date(input.lateDeadlineAt) : null;
    }
    if (input.attemptsAllowed !== undefined)
        patch.attempts_allowed = input.attemptsAllowed;
    if (input.showMarksImmediately !== undefined)
        patch.show_marks_immediately = input.showMarksImmediately;
    if (input.showFeedbackAfterEvaluation !== undefined) {
        patch.show_feedback_after_evaluation = input.showFeedbackAfterEvaluation;
    }
    if (input.passPercentage !== undefined)
        patch.pass_percentage = input.passPercentage;
    if (input.solutionReleasePolicy !== undefined) {
        patch.solution_release_policy = input.solutionReleasePolicy;
    }
    if (input.randomSelection !== undefined) {
        patch.random_selection = input.randomSelection ? JSON.stringify(input.randomSelection) : null;
    }
    if (input.startAt !== undefined || input.dueAt !== undefined) {
        const stored = String(row.status);
        if (stored !== 'DRAFT' && stored !== 'ARCHIVED' && stored !== 'CLOSED') {
            patch.status = deriveStoredStatusAfterSchedule(startAt, dueAt);
        }
    }
    await db('assignments').where({ id: assignmentId }).update(patch);
    return getAssignment(assignmentId, collegeId);
}
export async function softDeleteAssignment(assignmentId, collegeId) {
    const assignment = await assertAssignmentRow(assignmentId, collegeId);
    if (assignment.structure_locked) {
        throw new AppError(400, 'Assignments with student submissions cannot be deleted. Archive them instead.');
    }
    await db('assignments').where({ id: assignmentId }).update({
        deleted_at: db.fn.now(),
        status: 'ARCHIVED',
        archived_at: db.fn.now(),
    });
    return { ok: true };
}
async function resolveCoForCourse(collegeId, courseId, primaryCoCode) {
    if (!courseId || !primaryCoCode)
        return { primaryCoId: null, derived: null };
    const co = await db('course_outcomes')
        .where({
        college_id: collegeId,
        course_id: courseId,
        is_current: true,
        co_code: primaryCoCode.toUpperCase(),
    })
        .first();
    const derived = await resolveDerivedOutcomes({
        collegeId,
        courseId,
        primaryCoCode,
        primaryCoId: co ? Number(co.id) : null,
    });
    return {
        primaryCoId: co ? Number(co.id) : null,
        derived: snapshotDerivedOutcomes(derived),
    };
}
export async function addQuestion(assignmentId, collegeId, input) {
    const row = await assertAssignmentRow(assignmentId, collegeId);
    assertStructureEditable(row);
    const maxOrder = await db('assignment_questions')
        .where({ assignment_id: assignmentId })
        .max('sort_order as m')
        .first();
    if (input.evaluationRubric != null) {
        validateSchemeMatchesMarks(input.evaluationRubric, Number(input.marks ?? 10));
    }
    const co = await resolveCoForCourse(collegeId, row.course_id, input.primaryCoCode);
    await db('assignment_questions').insert({
        assignment_id: assignmentId,
        bank_question_id: input.bankQuestionId ?? null,
        module_id: input.moduleId ?? null,
        question_text: input.questionText,
        question_type: input.questionType,
        response_format: input.responseFormat,
        marks: input.marks,
        difficulty: input.difficulty ?? null,
        expected_answer_guidance: input.expectedAnswerGuidance ?? null,
        evaluation_rubric: input.evaluationRubric ? JSON.stringify(input.evaluationRubric) : null,
        primary_co_code: input.primaryCoCode ? input.primaryCoCode.toUpperCase() : null,
        primary_co_id: co.primaryCoId,
        secondary_co_codes: input.secondaryCoCodes ? JSON.stringify(input.secondaryCoCodes) : null,
        mapping_basis: input.mappingBasis ?? null,
        mapping_source: input.mappingSource ?? 'FACULTY_CUSTOM',
        verification_status: input.verificationStatus ?? 'ACADEMIC_ANALYSIS',
        derived_outcomes_snapshot: co.derived ? JSON.stringify(co.derived) : null,
        sort_order: Number(maxOrder?.m ?? -1) + 1,
    });
    return getAssignment(assignmentId, collegeId);
}
export async function updateQuestion(assignmentId, collegeId, questionId, input) {
    const row = await assertAssignmentRow(assignmentId, collegeId);
    assertStructureEditable(row);
    const existing = await db('assignment_questions')
        .where({ id: questionId, assignment_id: assignmentId })
        .first();
    if (!existing)
        throw new AppError(404, 'Question not found');
    const primaryCoCode = input.primaryCoCode !== undefined ? input.primaryCoCode : existing.primary_co_code;
    const co = await resolveCoForCourse(collegeId, row.course_id, primaryCoCode);
    const patch = { updated_at: db.fn.now() };
    if (input.questionText !== undefined)
        patch.question_text = input.questionText;
    if (input.questionType !== undefined)
        patch.question_type = input.questionType;
    if (input.responseFormat !== undefined)
        patch.response_format = input.responseFormat;
    if (input.marks !== undefined)
        patch.marks = input.marks;
    if (input.difficulty !== undefined)
        patch.difficulty = input.difficulty;
    if (input.moduleId !== undefined)
        patch.module_id = input.moduleId;
    if (input.expectedAnswerGuidance !== undefined) {
        patch.expected_answer_guidance = input.expectedAnswerGuidance;
    }
    if (input.evaluationRubric !== undefined) {
        if (input.evaluationRubric != null) {
            const marks = input.marks !== undefined ? input.marks : Number(existing.marks);
            validateSchemeMatchesMarks(input.evaluationRubric, Number(marks));
        }
        patch.evaluation_rubric = input.evaluationRubric ? JSON.stringify(input.evaluationRubric) : null;
    }
    if (input.primaryCoCode !== undefined) {
        patch.primary_co_code = input.primaryCoCode ? input.primaryCoCode.toUpperCase() : null;
        patch.primary_co_id = co.primaryCoId;
        patch.derived_outcomes_snapshot = co.derived ? JSON.stringify(co.derived) : null;
    }
    if (input.secondaryCoCodes !== undefined) {
        patch.secondary_co_codes = input.secondaryCoCodes ? JSON.stringify(input.secondaryCoCodes) : null;
    }
    if (input.mappingBasis !== undefined)
        patch.mapping_basis = input.mappingBasis;
    if (input.mappingSource !== undefined)
        patch.mapping_source = input.mappingSource;
    if (input.verificationStatus !== undefined)
        patch.verification_status = input.verificationStatus;
    await db('assignment_questions').where({ id: questionId }).update(patch);
    return getAssignment(assignmentId, collegeId);
}
export async function deleteQuestion(assignmentId, collegeId, questionId) {
    const row = await assertAssignmentRow(assignmentId, collegeId);
    assertStructureEditable(row);
    await db('assignment_questions').where({ id: questionId, assignment_id: assignmentId }).del();
    return getAssignment(assignmentId, collegeId);
}
export async function reorderQuestions(assignmentId, collegeId, items) {
    const row = await assertAssignmentRow(assignmentId, collegeId);
    assertStructureEditable(row);
    await db.transaction(async (trx) => {
        for (const item of items) {
            await trx('assignment_questions')
                .where({ id: item.id, assignment_id: assignmentId })
                .update({ sort_order: item.sortOrder });
        }
    });
    return getAssignment(assignmentId, collegeId);
}
export async function addFromBank(assignmentId, collegeId, bankIds) {
    const row = await assertAssignmentRow(assignmentId, collegeId);
    assertStructureEditable(row);
    const bank = await db('assignment_bank_questions')
        .whereIn('id', bankIds)
        .andWhere({ college_id: collegeId, is_active: true });
    if (bank.length !== bankIds.length)
        throw new AppError(400, 'Some bank questions were not found');
    const maxOrder = await db('assignment_questions')
        .where({ assignment_id: assignmentId })
        .max('sort_order as m')
        .first();
    let order = Number(maxOrder?.m ?? -1) + 1;
    for (const id of bankIds) {
        const q = bank.find((b) => Number(b.id) === id);
        const marks = Number(q.marks);
        let rubric = parseEvaluationScheme(q.evaluation_rubric);
        if (!rubric || Math.abs(rubric.criteria.reduce((s, c) => s + Number(c.maxMarks), 0) - marks) > 0.05) {
            rubric = buildDefaultScheme(q.question_type || 'DESCRIPTIVE', marks);
        }
        await db('assignment_questions').insert({
            assignment_id: assignmentId,
            bank_question_id: q.id,
            module_id: q.module_id,
            question_text: q.question_text,
            question_type: q.question_type,
            response_format: q.response_format,
            marks: q.marks,
            difficulty: q.difficulty,
            expected_answer_guidance: q.expected_answer_guidance,
            evaluation_rubric: JSON.stringify(rubric),
            primary_co_code: q.primary_co_code,
            primary_co_id: q.primary_co_id,
            secondary_co_codes: q.secondary_co_codes,
            mapping_basis: q.mapping_basis,
            mapping_source: q.mapping_source,
            verification_status: q.verification_status,
            derived_outcomes_snapshot: q.derived_outcomes_snapshot,
            sort_order: order++,
        });
    }
    return getAssignment(assignmentId, collegeId);
}
export async function publishAssignment(assignmentId, collegeId) {
    const assignment = await getAssignment(assignmentId, collegeId);
    if (!assignment.questions.length)
        throw new AppError(400, 'Add at least one question before publishing');
    if (assignment.status === 'ARCHIVED')
        throw new AppError(400, 'Cannot publish an archived assignment');
    const startAt = assignment.startAt;
    const dueAt = assignment.dueAt;
    if (startAt && dueAt && !isValidSchedule(String(startAt), String(dueAt))) {
        throw new AppError(400, 'Due date must be after start date');
    }
    if (assignment.lateSubmissionAllowed && assignment.lateDeadlineAt && dueAt) {
        if (!isValidSchedule(String(dueAt), String(assignment.lateDeadlineAt))) {
            throw new AppError(400, 'Late deadline must be after due date');
        }
    }
    const bankIds = assignment.questions
        .map((q) => q.bankQuestionId)
        .filter((id) => id != null && Number.isFinite(Number(id)))
        .map(Number);
    if (bankIds.length !== new Set(bankIds).size) {
        throw new AppError(400, 'Duplicate bank questions are not allowed on an assignment');
    }
    const dupTexts = findDuplicateNormalizedTexts(assignment.questions.map((q) => String(q.questionText)));
    if (dupTexts.length) {
        throw new AppError(400, 'Duplicate question text is not allowed on an assignment');
    }
    for (const q of assignment.questions) {
        if (!hasModelSolution(q.expectedAnswerGuidance)) {
            throw new AppError(400, `Question #${q.id} needs a model solution before publishing`);
        }
        try {
            validateSchemeMatchesMarks(q.evaluationRubric ?? q.evaluationScheme, Number(q.marks), {
                required: true,
            });
        }
        catch (err) {
            if (err instanceof AppError) {
                throw new AppError(400, `Question #${q.id}: ${err.message}`, err.details, err.code);
            }
            throw err;
        }
    }
    if (assignment.courseId) {
        const cos = await db('course_outcomes')
            .where({ college_id: collegeId, course_id: assignment.courseId, is_current: true })
            .count({ c: '*' })
            .first();
        const hasCos = Number(cos?.c ?? 0) > 0;
        if (hasCos) {
            const missing = assignment.questions.filter((q) => !q.primaryCoCode);
            if (missing.length) {
                throw new AppError(400, 'Every question must map to a Course Outcome (CO) before publishing', { missingQuestionIds: missing.map((q) => q.id) }, 'CO_REQUIRED');
            }
            const blocked = assignment.questions.filter((q) => q.verificationStatus === 'CO_MAPPING_BLOCKED');
            if (blocked.length) {
                throw new AppError(400, 'One or more questions have blocked CO mapping', { questionIds: blocked.map((q) => q.id) }, 'CO_MAPPING_BLOCKED');
            }
        }
    }
    const snapshot = {
        capturedAt: new Date().toISOString(),
        structureVersion: assignment.structureVersion,
        questions: assignment.questions.map((q) => ({
            id: q.id,
            bankQuestionId: q.bankQuestionId,
            moduleId: q.moduleId,
            moduleName: q.moduleName,
            questionText: q.questionText,
            questionType: q.questionType,
            responseFormat: q.responseFormat,
            marks: q.marks,
            difficulty: q.difficulty,
            expectedAnswerGuidance: q.expectedAnswerGuidance,
            modelSolution: q.expectedAnswerGuidance,
            evaluationRubric: q.evaluationRubric,
            evaluationScheme: q.evaluationScheme ?? q.evaluationRubric,
            primaryCoCode: q.primaryCoCode,
            primaryCoId: q.primaryCoId,
            secondaryCoCodes: q.secondaryCoCodes,
            mappingBasis: q.mappingBasis,
            mappingSource: q.mappingSource,
            verificationStatus: q.verificationStatus,
            derivedOutcomes: q.derivedOutcomes,
            sortOrder: q.sortOrder,
        })),
    };
    const existingLink = await db('assignment_links')
        .where({ assignment_id: assignmentId, is_active: true })
        .first();
    let shareCode = existingLink?.code;
    if (!existingLink) {
        shareCode = generateAssignmentCode();
        await db('assignment_links').insert({
            assignment_id: assignmentId,
            code: shareCode,
            is_active: true,
        });
    }
    const avail = getAssignmentAvailabilityStatus({
        status: 'PUBLISHED',
        startAt: assignment.startAt,
        endAt: assignment.dueAt,
        closedAt: null,
        archivedAt: null,
        deletedAt: null,
    });
    const status = avail === 'ACTIVE' ? 'ACTIVE' : 'PUBLISHED';
    await db('assignments').where({ id: assignmentId }).update({
        status,
        published_at: db.fn.now(),
        published_snapshot: JSON.stringify(snapshot),
        structure_version: Number(assignment.structureVersion) + 1,
        closed_at: null,
        updated_at: db.fn.now(),
    });
    return { assignment: await getAssignment(assignmentId, collegeId), shareCode };
}
export async function closeAssignment(assignmentId, collegeId) {
    await assertAssignmentRow(assignmentId, collegeId);
    await db('assignments').where({ id: assignmentId }).update({
        status: 'CLOSED',
        closed_at: db.fn.now(),
    });
    return getAssignment(assignmentId, collegeId);
}
export async function reopenAssignment(assignmentId, collegeId) {
    const row = await assertAssignmentRow(assignmentId, collegeId);
    if (row.status === 'ARCHIVED')
        throw new AppError(400, 'Cannot reopen archived assignment');
    await db('assignments').where({ id: assignmentId }).update({
        status: 'ACTIVE',
        closed_at: null,
    });
    return getAssignment(assignmentId, collegeId);
}
export async function archiveAssignment(assignmentId, collegeId) {
    await assertAssignmentRow(assignmentId, collegeId);
    await db('assignments').where({ id: assignmentId }).update({
        status: 'ARCHIVED',
        archived_at: db.fn.now(),
    });
    return getAssignment(assignmentId, collegeId);
}
export async function duplicateAssignment(assignmentId, collegeId, createdBy) {
    const source = await getAssignment(assignmentId, collegeId);
    const copy = await createAssignment(collegeId, createdBy, {
        title: `${source.title} (Copy)`,
        description: source.description ?? null,
        instructions: source.instructions ?? null,
        assignmentNumber: source.assignmentNumber ?? null,
        solutionReleasePolicy: source.solutionReleasePolicy ?? 'MANUAL_RELEASE',
        courseId: source.courseId,
        moduleId: source.moduleId,
        programId: source.programId,
        academicYearId: source.academicYearId,
        semesterId: source.semesterId,
        departmentId: source.departmentId,
        classSectionId: source.classSectionId,
        lateSubmissionAllowed: source.lateSubmissionAllowed,
        attemptsAllowed: source.attemptsAllowed,
        showMarksImmediately: source.showMarksImmediately,
        showFeedbackAfterEvaluation: source.showFeedbackAfterEvaluation,
        passPercentage: source.passPercentage,
    });
    for (const q of source.questions) {
        await addQuestion(Number(copy.id), collegeId, {
            bankQuestionId: q.bankQuestionId,
            moduleId: q.moduleId,
            questionText: String(q.questionText),
            questionType: q.questionType,
            responseFormat: q.responseFormat || 'LONG_TEXT',
            marks: Number(q.marks),
            difficulty: q.difficulty,
            expectedAnswerGuidance: q.expectedAnswerGuidance,
            evaluationRubric: q.evaluationRubric,
            primaryCoCode: q.primaryCoCode,
            secondaryCoCodes: q.secondaryCoCodes,
            mappingBasis: q.mappingBasis,
            mappingSource: q.mappingSource,
            verificationStatus: q.verificationStatus,
        });
    }
    await db('assignments').where({ id: copy.id }).update({ duplicated_from_id: assignmentId });
    return getAssignment(Number(copy.id), collegeId);
}
export async function listSubmissions(assignmentId, collegeId) {
    await assertAssignmentRow(assignmentId, collegeId);
    const rows = await db('assignment_submissions as s')
        .join('students as st', 'st.id', 's.student_id')
        .where({ 's.assignment_id': assignmentId, 's.college_id': collegeId })
        .select('s.id', 's.public_token as submissionToken', 's.attempt_number as attemptNumber', 's.status', 's.is_late as isLate', 's.started_at as startedAt', 's.submitted_at as submittedAt', 's.obtained_marks as obtainedMarks', 's.total_marks as totalMarks', 's.percentage', 's.passed', 's.evaluation_status as evaluationStatus', 's.results_released as resultsReleased', 's.evaluated_at as evaluatedAt', 'st.name as studentName', 'st.usn', 'st.email')
        .orderBy('s.submitted_at', 'desc');
    return {
        submissions: rows.map((r) => ({
            ...r,
            obtainedMarks: r.obtainedMarks != null ? Number(r.obtainedMarks) : null,
            totalMarks: r.totalMarks != null ? Number(r.totalMarks) : null,
            percentage: r.percentage != null ? Number(r.percentage) : null,
            passed: r.passed == null ? null : !!r.passed,
            isLate: !!r.isLate,
            resultsReleased: !!r.resultsReleased,
        })),
    };
}
export async function getSubmissionDetail(assignmentId, collegeId, token) {
    await assertAssignmentRow(assignmentId, collegeId);
    const submission = await db('assignment_submissions as s')
        .join('students as st', 'st.id', 's.student_id')
        .leftJoin('faculty_users as f', 'f.id', 's.evaluated_by')
        .where({
        's.assignment_id': assignmentId,
        's.college_id': collegeId,
        's.public_token': token,
    })
        .select('s.*', 'st.name as student_name', 'st.usn', 'st.email', 'f.name as evaluator_name')
        .first();
    if (!submission)
        throw new AppError(404, 'Submission not found');
    const questions = parseSnapshotQuestions(submission.question_snapshot);
    const answers = await db('assignment_answers').where({ submission_id: submission.id });
    const byQ = new Map(answers.map((a) => [String(a.snapshot_question_id), a]));
    return {
        submissionToken: submission.public_token,
        attemptNumber: Number(submission.attempt_number),
        studentName: submission.student_name,
        usn: submission.usn,
        email: submission.email,
        status: submission.status,
        isLate: !!submission.is_late,
        startedAt: submission.started_at,
        submittedAt: submission.submitted_at,
        obtainedMarks: submission.obtained_marks != null ? Number(submission.obtained_marks) : null,
        totalMarks: submission.total_marks != null ? Number(submission.total_marks) : null,
        percentage: submission.percentage != null ? Number(submission.percentage) : null,
        passed: submission.passed == null ? null : !!submission.passed,
        evaluationStatus: submission.evaluation_status,
        resultsReleased: !!submission.results_released,
        overallFeedback: submission.overall_feedback ?? null,
        evaluatedBy: submission.evaluator_name ?? null,
        evaluatedAt: submission.evaluated_at,
        questions: questions.map((q) => {
            const answer = byQ.get(String(q.id));
            return {
                ...q,
                textAnswer: answer?.text_answer ?? null,
                wordCount: answer?.word_count != null ? Number(answer.word_count) : null,
                awardedMarks: answer?.awarded_marks != null ? Number(answer.awarded_marks) : null,
                feedback: answer?.feedback ?? null,
                schemeMarks: parseJson(answer?.scheme_marks, null),
            };
        }),
    };
}
export async function evaluateSubmission(assignmentId, collegeId, token, facultyUserId, input) {
    await assertAssignmentRow(assignmentId, collegeId);
    const assignment = await db('assignments').where({ id: assignmentId, college_id: collegeId }).first();
    if (!assignment)
        throw new AppError(404, 'Assignment not found');
    const submission = await db('assignment_submissions')
        .where({
        assignment_id: assignmentId,
        college_id: collegeId,
        public_token: token,
    })
        .first();
    if (!submission)
        throw new AppError(404, 'Submission not found');
    if (!['SUBMITTED', 'LATE_SUBMITTED'].includes(String(submission.status))) {
        throw new AppError(400, 'Only submitted work can be evaluated');
    }
    const questions = parseSnapshotQuestions(submission.question_snapshot);
    if (!questions.length) {
        throw new AppError(400, 'Submission has no question snapshot. The student may need to re-attempt after the assignment is re-published.', { submissionId: submission.id, assignmentId }, 'ASSIGNMENT_SNAPSHOT_EMPTY');
    }
    // RELEASE is independent of mark entry — requires a finalized evaluation.
    if (input.mode === 'RELEASE' || (input.mode === 'FINALIZE' && input.releaseResults && !input.questions.length)) {
        return releaseSubmissionResults(assignmentId, collegeId, token, facultyUserId);
    }
    const byId = new Map(questions.map((q) => [String(q.id), q]));
    const inputIds = new Set(input.questions.map((q) => String(q.snapshotQuestionId)));
    const finalize = input.mode === 'FINALIZE';
    const releaseAfter = finalize && !!input.releaseResults;
    if (finalize) {
        const missing = questions.filter((q) => !inputIds.has(String(q.id)));
        if (missing.length) {
            throw new AppError(400, missing.length === 1
                ? '1 question still requires evaluation.'
                : `${missing.length} questions still require evaluation.`, { questionIds: missing.map((q) => q.id) }, 'ASSIGNMENT_EVALUATION_INCOMPLETE');
        }
    }
    if (process.env.NODE_ENV !== 'production') {
        console.info('[assignment-evaluate]', {
            assignmentId,
            submissionId: submission.id,
            mode: input.mode,
            releaseAfter,
            questionCount: input.questions.length,
            snapshotCount: questions.length,
        });
    }
    const questionMarks = [];
    await db.transaction(async (trx) => {
        for (const item of input.questions) {
            const qid = String(item.snapshotQuestionId);
            const question = byId.get(qid);
            if (!question) {
                throw new AppError(400, `Unknown question ${qid}`, { questionId: qid }, 'ASSIGNMENT_EVALUATION_INVALID');
            }
            const scheme = resolveSchemeFromSnapshotQuestion({
                evaluationRubric: question.evaluationRubric,
                evaluationScheme: question.evaluationScheme,
                marks: Number(question.marks),
                questionType: question.questionType,
            });
            const marks = applyCriterionMarks(scheme, item.criteria);
            // Always derive question total from scheme criteria — never trust a separate frontend total.
            questionMarks.push({ awarded: marks.awardedTotal, max: Number(question.marks) });
            const existing = await trx('assignment_answers')
                .where({ submission_id: submission.id, snapshot_question_id: qid })
                .first();
            const payload = {
                awarded_marks: marks.awardedTotal,
                feedback: item.feedback ?? null,
                scheme_marks: JSON.stringify(marks),
                evaluated_by: facultyUserId,
                evaluated_at: trx.fn.now(),
                updated_at: trx.fn.now(),
            };
            if (existing) {
                await trx('assignment_answers').where({ id: existing.id }).update(payload);
            }
            else {
                await trx('assignment_answers').insert({
                    submission_id: submission.id,
                    snapshot_question_id: qid,
                    text_answer: null,
                    response_format: question.responseFormat,
                    ...payload,
                });
            }
        }
        // On FINALIZE, totals cover every snapshot question.
        // On DRAFT, merge this save with previously stored awarded marks for a running total.
        let summaryMarks = questionMarks;
        if (finalize) {
            const awardedByQ = new Map(input.questions.map((item, i) => [String(item.snapshotQuestionId), questionMarks[i]]));
            summaryMarks = questions.map((q) => awardedByQ.get(String(q.id)) ?? { awarded: 0, max: Number(q.marks) });
        }
        else if (inputIds.size < questions.length) {
            const allAnswers = await trx('assignment_answers').where({ submission_id: submission.id });
            const byAnswer = new Map(allAnswers.map((a) => [String(a.snapshot_question_id), a]));
            const awardedByQ = new Map(input.questions.map((item, i) => [String(item.snapshotQuestionId), questionMarks[i]]));
            summaryMarks = questions
                .map((q) => {
                const fromInput = awardedByQ.get(String(q.id));
                if (fromInput)
                    return fromInput;
                const prior = byAnswer.get(String(q.id));
                if (prior?.awarded_marks == null)
                    return null;
                return { awarded: Number(prior.awarded_marks), max: Number(q.marks) };
            })
                .filter((x) => x != null);
            if (!summaryMarks.length)
                summaryMarks = questionMarks;
        }
        const summary = summarizeEvaluation(summaryMarks, Number(assignment.pass_percentage ?? 40));
        await trx('assignment_submissions')
            .where({ id: submission.id })
            .update({
            obtained_marks: summary.obtainedMarks,
            total_marks: summary.totalMarks,
            percentage: summary.percentage,
            passed: summary.passed,
            overall_feedback: input.overallFeedback ?? submission.overall_feedback,
            evaluation_status: finalize
                ? releaseAfter || submission.results_released
                    ? 'RELEASED'
                    : 'EVALUATED'
                : 'IN_PROGRESS',
            evaluated_by: facultyUserId,
            evaluated_at: finalize ? trx.fn.now() : submission.evaluated_at,
            results_released: releaseAfter || submission.results_released ? true : false,
            updated_at: trx.fn.now(),
        });
    });
    return getSubmissionDetail(assignmentId, collegeId, token);
}
export async function releaseSubmissionResults(assignmentId, collegeId, token, facultyUserId) {
    await assertAssignmentRow(assignmentId, collegeId);
    const submission = await db('assignment_submissions')
        .where({
        assignment_id: assignmentId,
        college_id: collegeId,
        public_token: token,
    })
        .first();
    if (!submission)
        throw new AppError(404, 'Submission not found');
    if (submission.results_released || submission.evaluation_status === 'RELEASED') {
        throw new AppError(409, 'Result already released.', { evaluationStatus: submission.evaluation_status }, 'ASSIGNMENT_RESULT_ALREADY_RELEASED');
    }
    if (submission.evaluation_status !== 'EVALUATED') {
        throw new AppError(400, 'Finalize the evaluation before releasing the result.', { evaluationStatus: submission.evaluation_status }, 'ASSIGNMENT_EVALUATION_NOT_FINALIZED');
    }
    await db.transaction(async (trx) => {
        await trx('assignment_submissions').where({ id: submission.id }).update({
            evaluation_status: 'RELEASED',
            results_released: true,
            updated_at: trx.fn.now(),
        });
    });
    if (process.env.NODE_ENV !== 'production') {
        console.info('[assignment-release]', {
            assignmentId,
            submissionId: submission.id,
            evaluationStatus: 'RELEASED',
        });
    }
    return getSubmissionDetail(assignmentId, collegeId, token);
}
export async function releaseSolutions(assignmentId, collegeId) {
    await assertAssignmentRow(assignmentId, collegeId);
    await db('assignments').where({ id: assignmentId }).update({
        solutions_released_at: db.fn.now(),
        updated_at: db.fn.now(),
    });
    return getAssignment(assignmentId, collegeId);
}
export async function getAssignmentAudit(assignmentId, collegeId) {
    await assertAssignmentRow(assignmentId, collegeId);
    return listAssignmentAudit(assignmentId, collegeId);
}
export async function buildPrintModel(assignmentId, collegeId) {
    const assignment = await getAssignment(assignmentId, collegeId);
    return {
        documentTitle: 'ASSIGNMENT',
        title: assignment.title,
        assignmentNumber: assignment.assignmentNumber,
        description: assignment.description,
        instructions: assignment.instructions,
        courseName: assignment.courseName,
        courseCode: assignment.courseCode,
        moduleName: assignment.moduleName,
        departmentName: assignment.departmentName,
        academicYearLabel: assignment.academicYearLabel,
        semesterLabel: assignment.semesterLabel,
        startAt: assignment.startAt,
        dueAt: assignment.dueAt,
        passPercentage: assignment.passPercentage,
        totalMarks: assignment.questions.reduce((s, q) => s + Number(q.marks), 0),
        questions: assignment.questions.map((q, index) => ({
            number: index + 1,
            questionText: q.questionText,
            questionType: q.questionType,
            marks: q.marks,
            difficulty: q.difficulty,
            primaryCoCode: q.primaryCoCode,
            modelSolution: q.expectedAnswerGuidance,
            evaluationScheme: q.evaluationScheme ?? q.evaluationRubric,
        })),
    };
}
export async function lockStructureIfNeeded(assignmentId, trx = db) {
    await trx('assignments')
        .where({ id: assignmentId, structure_locked: false })
        .update({ structure_locked: true });
}
export { normalizeQuestionText };
