import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { resolveDerivedOutcomes, snapshotDerivedOutcomes } from '../questions/coMapping.js';
import { nearlyEqual, numOrNull } from '../coEvaluation/types.js';
import { canManageAllInternalPapers } from './access.js';
import { recordQpAudit } from './audit.js';
import { coverageFromItems, sourceSummaryFromItems, defaultSlotsForMarks, eligiblePool, inSelectedScope, isBlockedForFinalize, orPairBalance, replacementCandidates, replacementModuleMismatchMessage, selectForBlueprint, slotMatchesModule, validateBlueprint, } from './generator.js';
import { fingerprintQuestion } from './repeatAnalysis.js';
import { INTERNAL_EXAM_TYPES, INTERNAL_PAPER_STATUSES, WORKFLOW_STEPS } from './types.js';
import { evaluatePaperQuality } from '../attainment/qualityGate.js';
import { schemeComponentsValid } from '../attainment/marksValidation.js';
import { rbtFromBloom } from './rbt.js';
import { examTypeLabel } from './pattern.js';
import { loadPortions } from './scope.js';
import { mapSubject } from '../copo/helpers.js';
import { COURSE_TYPE_LABELS } from '../copo/types.js';
import { ensureStandardPattern, listPaperPatterns, recommendBlueprint, } from './internalCreation.js';
import { validateInternalPaper } from './validation.js';
import { classifyMasterSource, customQuestionForbiddenError, formatQuestionSourceLabel, isReadyForInternalPaper, MASTER_QUESTION_SOURCE_TYPE, nonPyqSourceForbiddenError, textbookCitation, } from './sourcePolicy.js';
export const createInternalSchema = z.object({
    courseId: z.number().int().positive(),
    academicYearId: z.number().int().positive(),
    programId: z.number().int().positive().nullable().optional(),
    semesterId: z.number().int().positive().nullable().optional(),
    schemeId: z.number().int().positive().nullable().optional(),
    classSectionId: z.number().int().positive().nullable().optional(),
    examType: z.enum(INTERNAL_EXAM_TYPES).default('IA-1'),
    examDate: z.string().optional().nullable(),
    title: z.string().max(255).optional().nullable(),
    maxMarks: z.number().positive().optional(),
    durationMinutes: z.number().int().positive().optional().nullable(),
    instructions: z.string().max(4000).optional().nullable(),
    allowPreviousYearRepeats: z.boolean().optional(),
    recentYearExclusion: z.number().int().min(0).max(10).optional(),
    sourceMix: z
        .object({
        previousYear: z.boolean().optional(),
        questionBank: z.boolean().optional(),
        quizBank: z.boolean().optional(),
    })
        .optional(),
    previousYearWeight: z.number().min(0).max(100).optional(),
    coTargets: z.array(z.object({ coCode: z.string(), marks: z.number().min(0) })).optional(),
    changeJustification: z.string().max(4000).optional().nullable(),
    mode: z.enum(['BUILD_FROM_PYQ_BANK', 'GENERATE', 'MANUAL', 'HYBRID']).optional().default('BUILD_FROM_PYQ_BANK'),
    seedPreviousYearQuestionId: z.number().int().positive().optional().nullable(),
    selectedModuleIds: z.array(z.number().int().positive()).optional(),
    selectedTopicIds: z.array(z.number().int().positive()).optional().nullable(),
    patternCode: z.string().max(64).optional(),
    includeOr: z.boolean().optional(),
    splits: z.record(z.array(z.number().positive())).optional(),
    workflowStep: z.enum(WORKFLOW_STEPS).optional(),
    coverageWarningAcknowledged: z.boolean().optional(),
});
export const patchInternalSchema = z.object({
    examDate: z.string().optional().nullable(),
    title: z.string().max(255).optional().nullable(),
    instructions: z.string().max(4000).optional().nullable(),
    durationMinutes: z.number().int().positive().optional().nullable(),
    selectedModuleIds: z.array(z.number().int().positive()).optional(),
    selectedTopicIds: z.array(z.number().int().positive()).optional().nullable(),
    patternCode: z.string().max(64).optional(),
    includeOr: z.boolean().optional(),
    splits: z.record(z.array(z.number().positive())).optional(),
    workflowStep: z.enum(WORKFLOW_STEPS).optional(),
    coverageWarningAcknowledged: z.boolean().optional(),
    buildMode: z.enum(['BUILD_FROM_PYQ_BANK', 'GENERATE', 'MANUAL', 'HYBRID']).optional(),
    coTargets: z.array(z.object({ coCode: z.string(), marks: z.number().min(0) })).optional(),
    moduleTargets: z
        .array(z.object({
        moduleId: z.number().int().nullable(),
        moduleName: z.string(),
        marks: z.number().min(0),
        coCode: z.string().optional().nullable(),
    }))
        .optional(),
});
export const generateInternalSchema = z.object({
    mode: z.enum(['GENERATE', 'MANUAL', 'HYBRID']).optional(),
    includeOr: z.boolean().optional(),
});
export const replaceItemSchema = z.object({
    kind: z.enum(['PREVIOUS_YEAR', 'QUESTION_BANK', 'QUIZ_BANK']).optional(),
    id: z.number().int().positive().optional(),
});
export const customQuestionSchema = z.object({
    questionText: z.string().min(8),
    marks: z.number().positive(),
    moduleId: z.number().int().positive().optional().nullable(),
    moduleName: z.string().optional().nullable(),
    primaryCo: z.string().min(2),
    difficulty: z.string().optional().nullable(),
    bloomLevel: z.string().optional().nullable(),
    section: z.string().optional().nullable(),
    questionNumber: z.number().int().positive().optional(),
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
async function actorName(id) {
    const row = await db('faculty_users').where({ id }).first('name');
    return row?.name ? String(row.name) : null;
}
function matchIaComponent(examType, displayName, code) {
    const hay = `${displayName} ${code}`.toUpperCase();
    if (examType === 'IA-1')
        return /IA\s*-?\s*1|INTERNAL\s*ASSESSMENT\s*1|CIE\s*1/.test(hay);
    if (examType === 'IA-2')
        return /IA\s*-?\s*2|INTERNAL\s*ASSESSMENT\s*2|CIE\s*2/.test(hay);
    if (examType === 'IA-3')
        return /IA\s*-?\s*3|INTERNAL\s*ASSESSMENT\s*3|CIE\s*3/.test(hay);
    if (examType === 'CIE')
        return /\bCIE\b/.test(hay) && !/IA/.test(hay);
    if (examType === 'MAKEUP')
        return /MAKEUP|MAKE-UP/.test(hay);
    return /IA|INTERNAL/.test(hay);
}
export async function previewInternalContext(actor, input) {
    const course = await db('courses').where({ id: input.courseId, college_id: actor.collegeId }).first();
    if (!course)
        throw new AppError(404, 'Subject not found');
    const structure = await db('course_assessment_structures')
        .where({ college_id: actor.collegeId })
        .andWhere((b) => {
        b.where('course_id', input.courseId).orWhere('course_code', String(course.code).replace(/\s+/g, '').toUpperCase());
    })
        .first();
    const components = structure
        ? await db('course_assessment_components').where({ structure_id: structure.id }).orderBy('display_order')
        : await db('course_assessment_components')
            .where({ college_id: actor.collegeId, course_code: String(course.code).replace(/\s+/g, '').toUpperCase() })
            .orderBy('display_order');
    const iaComp = components.find((c) => matchIaComponent(input.examType, String(c.component_name), String(c.component_id)));
    const pattern = await ensureStandardPattern(actor.collegeId);
    const maxMarks = input.maxMarks ?? pattern.requiredAnswerMarks ?? 50;
    const evaluation = await db('faculty_co_evaluations')
        .where({ college_id: actor.collegeId, course_id: input.courseId, created_by: actor.facultyUserId })
        .orderByRaw("case when status = 'FINALIZED' then 0 else 1 end")
        .orderBy('updated_at', 'desc')
        .first();
    let coTargets = [];
    let modified = false;
    if (evaluation) {
        const cells = await db('faculty_co_evaluation_cells').where({ evaluation_id: evaluation.id });
        const comps = await db('faculty_co_evaluation_components').where({ evaluation_id: evaluation.id });
        const match = comps.find((c) => matchIaComponent(input.examType, String(c.display_name), String(c.assessment_component_id)));
        if (match) {
            const byCo = new Map();
            for (const cell of cells.filter((c) => String(c.assessment_component_id) === String(match.assessment_component_id))) {
                byCo.set(String(cell.co_code).toUpperCase(), Number(cell.current_value || 0));
            }
            const cos = await db('faculty_co_evaluation_cos').where({ evaluation_id: evaluation.id }).orderBy('display_order');
            coTargets = cos
                .map((co) => ({
                coCode: String(co.co_code).toUpperCase(),
                marks: byCo.get(String(co.co_code).toUpperCase()) || 0,
                statement: co.co_statement,
            }))
                .filter((c) => c.marks > 0);
        }
    }
    if (input.coTargets?.length) {
        const same = input.coTargets.length === coTargets.length &&
            input.coTargets.every((t) => nearlyEqual(t.marks, coTargets.find((c) => c.coCode === t.coCode)?.marks || 0));
        if (!same)
            modified = true;
        coTargets = input.coTargets.map((t) => ({
            coCode: t.coCode.toUpperCase(),
            marks: t.marks,
            statement: coTargets.find((c) => c.coCode === t.coCode.toUpperCase())?.statement,
        }));
    }
    if (!coTargets.length) {
        const outcomes = await db('course_outcomes')
            .where({ college_id: actor.collegeId, course_id: input.courseId, is_current: true })
            .orderBy('co_code');
        const share = outcomes.length ? Math.floor(maxMarks / outcomes.length) : maxMarks;
        coTargets = outcomes.map((o, i) => ({
            coCode: String(o.co_code).toUpperCase(),
            marks: i === outcomes.length - 1 ? maxMarks - share * (outcomes.length - 1) : share,
            statement: o.statement,
        }));
    }
    const faculty = await db('faculty_users').where({ id: actor.facultyUserId }).first();
    const year = input.academicYearId
        ? await db('academic_years').where({ id: input.academicYearId, college_id: actor.collegeId }).first()
        : null;
    const program = input.programId
        ? await db('programs').where({ id: input.programId, college_id: actor.collegeId }).first()
        : null;
    const semester = input.semesterId
        ? await db('semesters').where({ id: input.semesterId, college_id: actor.collegeId }).first()
        : null;
    const dept = course.department_id
        ? await db('departments').where({ id: course.department_id }).first()
        : faculty?.department_id
            ? await db('departments').where({ id: faculty.department_id }).first()
            : null;
    const scheme = course.scheme_id ? await db('academic_schemes').where({ id: course.scheme_id }).first() : null;
    const outcomes = await db('course_outcomes')
        .where({ college_id: actor.collegeId, course_id: input.courseId, is_current: true })
        .orderBy('co_number');
    const portions = await loadPortions({
        collegeId: actor.collegeId,
        courseId: input.courseId,
        facultyUserId: actor.facultyUserId,
        academicYearId: input.academicYearId,
        selectedModuleIds: input.selectedModuleIds,
        selectedTopicIds: input.selectedTopicIds,
    });
    const sourceMix = {
        previousYear: true,
        questionBank: false,
        quizBank: false,
    };
    let blueprint;
    if (portions.modules.some((m) => m.selected)) {
        blueprint = recommendBlueprint({
            examType: input.examType,
            pattern,
            modules: portions.modules,
            // Internal papers are OR-paired by default: every slot is Q(A) OR Q(B)
            // and the student answers one alternative (OR-pair spec, Final Rule).
            includeOr: input.includeOr ?? true,
            splits: input.splits,
            sourceMix,
            previousYearWeight: input.previousYearWeight ?? 40,
            allowPreviousYearRepeats: input.allowPreviousYearRepeats ?? false,
            recentYearExclusion: input.recentYearExclusion ?? 1,
        }).blueprint;
        blueprint.coEvaluationId = evaluation ? Number(evaluation.id) : null;
        blueprint.modifiedFromCoEvaluation = modified;
        blueprint.changeJustification = input.changeJustification ?? null;
        if (input.coTargets?.length)
            blueprint.coTargets = input.coTargets.map((t) => ({ coCode: t.coCode.toUpperCase(), marks: t.marks }));
    }
    else {
        const slots = defaultSlotsForMarks(maxMarks, coTargets);
        blueprint = {
            examType: input.examType,
            maxMarks,
            requiredAnswerMarks: maxMarks,
            durationMinutes: input.durationMinutes ?? pattern.durationMinutes ?? (maxMarks >= 50 ? 90 : 60),
            modules: [],
            coTargets: coTargets.map((c) => ({ coCode: c.coCode, marks: c.marks })),
            patternCode: pattern.code,
            patternLabel: `${pattern.sections.map((s) => s.requiredMarks).join(' + ')} = ${pattern.requiredAnswerMarks}`,
            slots,
            allowOrChoices: false,
            sourceMix,
            previousYearWeight: input.previousYearWeight ?? 40,
            allowPreviousYearRepeats: input.allowPreviousYearRepeats ?? false,
            recentYearExclusion: input.recentYearExclusion ?? 1,
            modifiedFromCoEvaluation: modified,
            changeJustification: input.changeJustification ?? null,
            coEvaluationId: evaluation ? Number(evaluation.id) : null,
            workflowVersion: 2,
        };
    }
    const examOptions = (components.length
        ? components
            .filter((c) => /IA|INTERNAL|CIE/i.test(`${c.component_name} ${c.component_id}`))
            .map((c) => {
            const name = String(c.component_name);
            const code = /3/.test(`${name} ${c.component_id}`)
                ? 'IA-3'
                : /2/.test(`${name} ${c.component_id}`)
                    ? 'IA-2'
                    : /1/.test(`${name} ${c.component_id}`)
                        ? 'IA-1'
                        : 'CIE';
            return { value: code, label: name, maxMarks: numOrNull(c.max_marks) };
        })
        : [
            { value: 'IA-1', label: examTypeLabel('IA-1'), maxMarks: 50 },
            { value: 'IA-2', label: examTypeLabel('IA-2'), maxMarks: 50 },
            { value: 'IA-3', label: examTypeLabel('IA-3'), maxMarks: 50 },
        ]).filter((opt, i, arr) => arr.findIndex((x) => x.value === opt.value) === i);
    if (!examOptions.some((o) => o.value === 'IA-1'))
        examOptions.unshift({ value: 'IA-1', label: examTypeLabel('IA-1'), maxMarks: 50 });
    if (!examOptions.some((o) => o.value === 'IA-2'))
        examOptions.push({ value: 'IA-2', label: examTypeLabel('IA-2'), maxMarks: 50 });
    if (!examOptions.some((o) => o.value === 'IA-3'))
        examOptions.push({ value: 'IA-3', label: examTypeLabel('IA-3'), maxMarks: 50 });
    const pool = await loadPool(actor.collegeId, input.courseId, blueprint);
    const eligible = eligiblePool(pool, blueprint);
    const mappedCourse = mapSubject({
        ...course,
        department_name: dept?.name,
        scheme_name: scheme?.name,
        scheme_code: scheme?.code,
        semester_label: semester?.label,
    });
    return {
        course: {
            id: Number(course.id),
            name: String(course.name),
            code: String(course.code),
            subjectCode: String(course.code),
            scheme: scheme?.name ?? mappedCourse.schemeName,
            schemeCode: scheme?.code ?? mappedCourse.schemeCode,
            courseType: course.course_type,
            courseTypeLabel: course.course_type ? COURSE_TYPE_LABELS[course.course_type] || course.course_type : null,
            faculty: faculty?.name ?? null,
            department: dept?.name ?? mappedCourse.departmentName,
            departmentId: dept ? Number(dept.id) : mappedCourse.departmentId,
            semesterLabel: semester?.label ?? mappedCourse.semesterLabel,
            academicYearLabel: year?.label ?? null,
            programName: program?.name ?? null,
            credits: mappedCourse.credits,
        },
        subject: mappedCourse,
        assessmentStructure: structure
            ? {
                cieMaxMarks: numOrNull(structure.cie_max_marks),
                seeMaxMarks: numOrNull(structure.see_max_marks),
                numberOfIa: structure.number_of_ia ? Number(structure.number_of_ia) : null,
                questionPaperPattern: structure.question_paper_pattern,
            }
            : null,
        iaComponent: iaComp
            ? { name: iaComp.component_name, maxMarks: numOrNull(iaComp.max_marks) }
            : null,
        examOptions,
        cos: outcomes.map((o) => ({
            id: Number(o.id),
            code: String(o.co_code).toUpperCase(),
            statement: o.statement,
            bloomsLevel: o.blooms_level ?? null,
        })),
        portions,
        pattern,
        patterns: await listPaperPatterns(actor.collegeId),
        eligibleQuestionCount: blueprint.selectedModuleIds?.length ? eligible.length : null,
        coEvaluationId: evaluation ? Number(evaluation.id) : null,
        coEvaluationStatus: evaluation?.status ?? null,
        blueprint,
        modifiedFromCoEvaluation: modified,
    };
}
async function loadPool(collegeId, courseId, blueprint) {
    const pool = [];
    const hasReadiness = await db.schema.hasColumn('previous_year_questions', 'readiness_status');
    const hasSourceType = await db.schema.hasColumn('previous_year_questions', 'source_type');
    const hasOrPair = await db.schema.hasColumn('previous_year_questions', 'or_pair_id');
    const hasSourceVerified = await db.schema.hasColumn('previous_year_questions', 'source_verified');
    const hasCanonical = await db.schema.hasColumn('previous_year_questions', 'canonical_question_id');
    const selectCols = [
        'q.id',
        'q.question_text',
        'q.max_marks',
        'q.module_or_unit',
        'q.module_id',
        'q.primary_co_code',
        'q.difficulty',
        'q.bloom_level',
        'q.fingerprint',
        'q.is_or_choice',
        'q.or_group_id',
        'q.verification_status',
        'q.co_mapping_blocked',
        'p.paper_id',
        'p.exam_year',
        'p.exam_type',
        'p.exam_month',
        'p.academic_year',
        'p.exam_date',
        'p.university',
        'p.source_file',
    ];
    if (hasReadiness)
        selectCols.push('q.readiness_status', 'q.solution_status', 'q.scheme_status', 'q.textbook_id', 'q.rbt_level', 'q.printed_rbt', 'q.original_question_text', 'q.display_question_text');
    if (hasSourceType)
        selectCols.push('q.source_type');
    if (hasOrPair)
        selectCols.push('q.or_pair_id', 'q.or_alternative');
    if (hasSourceVerified)
        selectCols.push('q.source_verified');
    if (hasCanonical)
        selectCols.push('q.canonical_question_id');
    if (await db.schema.hasColumn('previous_year_questions', 'topic_id'))
        selectCols.push('q.topic_id', 'q.topic_name');
    let query = db('previous_year_questions as q')
        .join('previous_year_papers as p', 'p.id', 'q.paper_id')
        .where({ 'q.college_id': collegeId, 'p.course_id': courseId, 'q.is_active': true })
        .whereNull('q.parent_id');
    const moduleIds = blueprint.selectedModuleIds || [];
    if (moduleIds.length) {
        query = query.andWhere((b) => {
            b.whereIn('q.module_id', moduleIds);
            for (const name of blueprint.modules || []) {
                const n = String(name).match(/(\d+)/)?.[1];
                if (n)
                    b.orWhere('q.module_or_unit', 'like', `%Module ${n}%`);
            }
        });
    }
    const rows = await query.select(...selectCols);
    const ids = rows.map((r) => Number(r.id));
    const children = ids.length
        ? await db('previous_year_questions').whereIn('parent_id', ids).where({ is_active: true })
        : [];
    const childIds = children.map((c) => Number(c.id));
    const allIds = [...ids, ...childIds];
    const solutions = allIds.length && (await db.schema.hasTable('qp_master_solutions'))
        ? await db('qp_master_solutions').whereIn('question_row_id', allIds)
        : [];
    const schemes = allIds.length && (await db.schema.hasTable('qp_master_scheme_components'))
        ? await db('qp_master_scheme_components').whereIn('question_row_id', allIds).orderBy('sort_order')
        : [];
    const solByQ = new Map(solutions.map((s) => [Number(s.question_row_id), s]));
    const schemeByQ = new Map();
    for (const s of schemes) {
        const list = schemeByQ.get(Number(s.question_row_id)) ?? [];
        list.push({ code: String(s.code), label: String(s.label), maxMarks: Number(s.max_marks) });
        schemeByQ.set(Number(s.question_row_id), list);
    }
    const occByFp = new Map();
    for (const r of rows) {
        const fp = String(r.fingerprint || fingerprintQuestion(String(r.question_text)));
        const list = occByFp.get(fp) ?? [];
        list.push({ year: r.exam_year ? Number(r.exam_year) : null, exam: r.exam_type ? String(r.exam_type) : null });
        occByFp.set(fp, list);
    }
    // Recent Internal Paper usage — soft ranking signal, not a hard block.
    const usageByFp = new Map();
    if (ids.length && (await db.schema.hasTable('internal_question_paper_items'))) {
        const fps = rows.map((r) => String(r.fingerprint || fingerprintQuestion(String(r.question_text))));
        const usageRows = await db('internal_question_paper_items as i')
            .join('internal_question_papers as p', 'p.id', 'i.paper_id')
            .where({ 'p.college_id': collegeId, 'p.course_id': courseId })
            .whereIn('i.fingerprint', fps)
            .whereNotNull('i.fingerprint')
            .select('i.fingerprint', 'p.updated_at', 'p.created_at');
        for (const u of usageRows) {
            const fp = String(u.fingerprint);
            const prev = usageByFp.get(fp) || { count: 0, lastUsed: null };
            prev.count += 1;
            const when = String(u.updated_at || u.created_at || '');
            if (!prev.lastUsed || when > prev.lastUsed)
                prev.lastUsed = when;
            usageByFp.set(fp, prev);
        }
    }
    for (const r of rows) {
        if (r.max_marks == null)
            continue;
        const rawSourceType = String(r.source_type || MASTER_QUESTION_SOURCE_TYPE).toUpperCase();
        // Master bank holds PYQ-derived questions plus genuine module-bank records; both
        // load. Non-master source_types (legacy/foreign) are skipped here.
        if (rawSourceType !== MASTER_QUESTION_SOURCE_TYPE && rawSourceType !== 'MODULE_QUESTION_BANK')
            continue;
        // Unverified / superseded extraction must never enter automatic selection.
        if (hasSourceVerified && r.source_verified === false)
            continue;
        const masterSource = classifyMasterSource({
            sourceType: r.source_type,
            examType: r.exam_type,
            university: r.university,
        });
        if (masterSource === 'OTHER_SOURCE')
            continue;
        const fp = String(r.fingerprint || fingerprintQuestion(String(r.question_text)));
        const kids = children.filter((c) => Number(c.parent_id) === Number(r.id));
        let sol = solByQ.get(Number(r.id));
        let scheme = schemeByQ.get(Number(r.id)) ?? [];
        // SEE solutions stay textbook-backed; Module Question Bank uses its approved stored solution.
        const acceptBankSolution = masterSource === 'MODULE_QUESTION_BANK';
        let modelSolution = sol && (acceptBankSolution || sol.textbook_grounded) ? String(sol.model_solution || '') : '';
        if (kids.length) {
            const kidSchemes = kids.flatMap((k) => schemeByQ.get(Number(k.id)) ?? []);
            if (kidSchemes.length)
                scheme = kidSchemes;
            const parts = kids.map((k) => {
                const ks = solByQ.get(Number(k.id));
                const body = ks && (acceptBankSolution || ks.textbook_grounded) ? String(ks.model_solution || '').trim() : '';
                return body ? `(${k.sub_letter || ''}) ${body}` : '';
            }).filter(Boolean);
            if (parts.length)
                modelSolution = parts.join('\n\n');
            sol = sol || kids.map((k) => solByQ.get(Number(k.id))).find(Boolean);
        }
        const apps = occByFp.get(fp) || [];
        const readiness = String(r.readiness_status || '');
        const ready = isReadyForInternalPaper(readiness);
        const hasSolution = Boolean(modelSolution.trim());
        const hasScheme = scheme.length > 0;
        const usage = usageByFp.get(fp);
        pool.push({
            id: `PY-${r.id}`,
            source: 'PREVIOUS_YEAR',
            // Preserve genuine Module Question Bank provenance — do not relabel as PYQ.
            sourceType: rawSourceType === 'MODULE_QUESTION_BANK' ? 'MODULE_QUESTION_BANK' : MASTER_QUESTION_SOURCE_TYPE,
            sourceQuestionId: Number(r.id),
            sourcePaperId: String(r.paper_id),
            questionText: String(r.display_question_text || r.question_text),
            originalQuestionText: r.original_question_text ? String(r.original_question_text) : String(r.question_text),
            marks: Number(r.max_marks),
            moduleName: r.module_or_unit,
            moduleId: r.module_id ? Number(r.module_id) : null,
            topicId: r.topic_id ? Number(r.topic_id) : null,
            topicName: r.topic_name,
            coCode: r.primary_co_code,
            difficulty: r.difficulty,
            bloomLevel: r.bloom_level,
            rbtLevel: r.rbt_level || r.printed_rbt || rbtFromBloom(r.bloom_level),
            fingerprint: fp,
            examYear: r.exam_year ? Number(r.exam_year) : null,
            examType: r.exam_type,
            examMonth: r.exam_month,
            academicYear: r.academic_year,
            appearanceCount: apps.length || 1,
            lastAppeared: r.exam_date,
            yearsAppeared: [...new Set(apps.map((a) => a.year).filter((y) => Boolean(y)))],
            examsAppeared: [...new Set(apps.map((a) => a.exam).filter((e) => Boolean(e)))],
            isOrChoice: Boolean(r.is_or_choice),
            orGroupId: r.or_pair_id || r.or_group_id,
            orPairId: r.or_pair_id || r.or_group_id,
            orAlternative: r.or_alternative === 'B' ? 'B' : r.or_alternative === 'A' ? 'A' : null,
            masterSource,
            eligible: ready && hasSolution && hasScheme,
            verificationStatus: r.verification_status,
            reviewStatus: readiness,
            readinessStatus: readiness,
            sourceVerified: hasSourceVerified ? r.source_verified !== false : true,
            coMappingBlocked: Boolean(r.co_mapping_blocked),
            hasScheme,
            hasSolution,
            needsReview: !ready,
            textbookId: r.textbook_id ? Number(r.textbook_id) : null,
            textbookCitation: textbookCitation({
                title: sol?.textbook_title,
                chapter: sol?.chapter,
                section: sol?.section,
            }),
            modelSolution: modelSolution || (sol?.model_solution ? String(sol.model_solution) : null),
            scheme,
            canonicalQuestionId: r.canonical_question_id != null ? r.canonical_question_id : null,
            lastInternalUsage: usage?.lastUsed ?? null,
            internalUsageCount: usage?.count ?? 0,
            provenance: {
                sourceType: rawSourceType === 'MODULE_QUESTION_BANK' ? 'MODULE_QUESTION_BANK' : MASTER_QUESTION_SOURCE_TYPE,
                sourcePaperId: r.paper_id,
                sourceFile: r.source_file,
                university: r.university,
                examType: r.exam_type,
                examYear: r.exam_year,
                examMonth: r.exam_month,
                academicYear: r.academic_year,
                textbookTitle: sol?.textbook_title,
                textbookChapter: sol?.chapter,
                textbookSection: sol?.section,
            },
        });
    }
    return pool;
}
async function persistItems(paperId, items) {
    const hasTopic = await db.schema.hasColumn('internal_question_paper_items', 'topic_id');
    const hasSchemeTable = await db.schema.hasTable('internal_qp_scheme_components');
    await db('internal_question_paper_items').where({ paper_id: paperId }).del();
    for (const [i, item] of items.entries()) {
        const scheme = item._scheme || null;
        const meta = item._meta || {};
        const { _scheme, _meta, ...rest } = item;
        const row = { ...rest, paper_id: paperId, sort_order: i + 1 };
        if (!(await db.schema.hasColumn('internal_question_paper_items', 'provenance_json'))) {
            delete row.provenance_json;
            delete row.textbook_id;
            delete row.textbook_citation;
            delete row.source_type;
            delete row.readiness_status_snapshot;
        }
        if (hasTopic) {
            Object.assign(row, {
                topic_id: meta.topic_id ?? row.topic_id ?? null,
                topic_name: meta.topic_name ?? null,
                rbt_level: meta.rbt_level ?? null,
                or_alternative: meta.or_alternative ?? null,
                verification_status: meta.verification_status ?? null,
                needs_faculty_verification: Boolean(meta.needs_faculty_verification),
                co_mapping_blocked: Boolean(meta.co_mapping_blocked),
            });
        }
        const [id] = await db('internal_question_paper_items').insert(row);
        if (hasSchemeTable && scheme?.length) {
            await db('internal_qp_scheme_components').insert(scheme.map((c, idx) => ({
                item_id: id,
                code: c.code,
                label: c.label,
                max_marks: c.maxMarks,
                sort_order: idx,
            })));
        }
    }
}
async function insertMappedItem(paperId, item) {
    const hasTopic = await db.schema.hasColumn('internal_question_paper_items', 'topic_id');
    const hasSchemeTable = await db.schema.hasTable('internal_qp_scheme_components');
    const scheme = item._scheme || null;
    const meta = item._meta || {};
    const { _scheme, _meta, ...rest } = item;
    const row = { ...rest, paper_id: paperId };
    if (!(await db.schema.hasColumn('internal_question_paper_items', 'provenance_json'))) {
        delete row.provenance_json;
        delete row.textbook_id;
        delete row.textbook_citation;
        delete row.source_type;
        delete row.readiness_status_snapshot;
    }
    if (hasTopic) {
        Object.assign(row, {
            topic_id: meta.topic_id ?? null,
            topic_name: meta.topic_name ?? null,
            rbt_level: meta.rbt_level ?? null,
            or_alternative: meta.or_alternative ?? null,
            verification_status: meta.verification_status ?? null,
            needs_faculty_verification: Boolean(meta.needs_faculty_verification),
            co_mapping_blocked: Boolean(meta.co_mapping_blocked),
        });
    }
    const [id] = await db('internal_question_paper_items').insert(row);
    if (hasSchemeTable && scheme?.length) {
        await db('internal_qp_scheme_components').insert(scheme.map((c, idx) => ({
            item_id: id,
            code: c.code,
            label: c.label,
            max_marks: c.maxMarks,
            sort_order: idx,
        })));
    }
    return id;
}
export async function createInternalPaper(actor, input) {
    const preview = await previewInternalContext(actor, input);
    const course = preview.course;
    const year = await db('academic_years').where({ id: input.academicYearId, college_id: actor.collegeId }).first();
    const program = input.programId
        ? await db('programs').where({ id: input.programId, college_id: actor.collegeId }).first()
        : null;
    const semester = input.semesterId
        ? await db('semesters').where({ id: input.semesterId, college_id: actor.collegeId }).first()
        : null;
    const faculty = await db('faculty_users').where({ id: actor.facultyUserId }).first();
    const pattern = await ensureStandardPattern(actor.collegeId);
    const hasFlow = await db.schema.hasColumn('internal_question_papers', 'creation_flow_version');
    const insert = {
        college_id: actor.collegeId,
        created_by: actor.facultyUserId,
        department_id: actor.departmentId ?? faculty?.department_id ?? null,
        course_id: input.courseId,
        academic_year_id: input.academicYearId,
        program_id: input.programId ?? null,
        semester_id: input.semesterId ?? null,
        scheme_id: input.schemeId ?? preview.subject?.schemeId ?? null,
        class_section_id: input.classSectionId ?? null,
        subject_name: course.name,
        course_code: course.code,
        scheme_label: course.scheme,
        program_name: program?.name ?? course.programName ?? null,
        semester_label: semester?.label ?? course.semesterLabel ?? null,
        academic_year_label: year?.label ?? course.academicYearLabel ?? null,
        exam_type: input.examType,
        title: input.title || `${examTypeLabel(input.examType)} — ${course.name}`,
        exam_date: input.examDate || null,
        max_marks: preview.blueprint.maxMarks,
        duration_minutes: preview.blueprint.durationMinutes,
        instructions: input.instructions ||
            'Answer one full question from each OR pair (e.g. Q1(A) OR Q1(B)). Figures to the right indicate full marks. Missing data, if any, may be suitably assumed.',
        status: 'DRAFT',
        co_evaluation_id: preview.coEvaluationId,
        modified_from_co_eval: preview.modifiedFromCoEvaluation,
        change_justification: input.changeJustification ?? null,
        blueprint_json: JSON.stringify(preview.blueprint),
    };
    if (hasFlow) {
        insert.creation_flow_version = 2;
        insert.workflow_step = input.workflowStep || 'SETUP';
        insert.pattern_template_id = pattern.id ?? null;
        insert.pattern_code = pattern.code;
        insert.required_answer_marks = preview.blueprint.requiredAnswerMarks ?? preview.blueprint.maxMarks;
        insert.printed_marks = preview.blueprint.printedMarks ?? preview.blueprint.maxMarks;
        insert.selected_scope_json = JSON.stringify({
            moduleIds: input.selectedModuleIds || [],
            topicIds: input.selectedTopicIds || null,
        });
        insert.coverage_warning_acknowledged = Boolean(input.coverageWarningAcknowledged);
        insert.build_mode = input.mode || 'MANUAL';
        insert.course_type = course.courseType ?? null;
        insert.faculty_name_snapshot = faculty?.name ?? null;
        insert.autosaved_at = db.fn.now();
    }
    const [id] = await db('internal_question_papers').insert(insert);
    await recordQpAudit({
        collegeId: actor.collegeId,
        paperId: Number(id),
        actorId: actor.facultyUserId,
        actorName: await actorName(actor.facultyUserId),
        action: 'CREATE',
        metadata: { examType: input.examType, mode: input.mode },
    });
    if (input.seedPreviousYearQuestionId) {
        await addExistingQuestion(actor, Number(id), {
            kind: 'PREVIOUS_YEAR',
            id: input.seedPreviousYearQuestionId,
        });
    }
    if (input.selectedModuleIds?.length) {
        await persistScopeRows(Number(id), preview.portions.modules);
    }
    if (input.mode === 'GENERATE') {
        await generateInternalPaper(actor, Number(id), preview.blueprint);
    }
    return getInternalPaper(Number(id), actor.collegeId);
}
async function persistScopeRows(paperId, modules) {
    if (!(await db.schema.hasTable('internal_paper_scope_modules')))
        return;
    await db('internal_paper_scope_modules').where({ paper_id: paperId }).del();
    await db('internal_paper_scope_topics').where({ paper_id: paperId }).del();
    for (const [i, m] of modules.entries()) {
        if (!m.selected)
            continue;
        await db('internal_paper_scope_modules').insert({
            paper_id: paperId,
            module_id: m.id,
            module_name: m.name,
            selected: true,
            coverage_percent: m.coveragePercent,
            teaching_hours: m.hours,
            primary_co_code: m.coCode,
            sort_order: i,
        });
        for (const [j, t] of m.topics.entries()) {
            await db('internal_paper_scope_topics').insert({
                paper_id: paperId,
                module_id: m.id,
                topic_id: t.id,
                topic_name: t.name,
                selected: t.selected,
                sort_order: j,
            });
        }
    }
}
export async function patchInternalPaper(actor, paperId, input) {
    const header = await db('internal_question_papers').where({ id: paperId, college_id: actor.collegeId }).first();
    if (!header)
        throw new AppError(404, 'Internal question paper not found');
    if (header.status !== 'DRAFT')
        throw new AppError(409, 'Only draft papers can be updated');
    const blueprint = parseJson(header.blueprint_json, null);
    const pattern = await ensureStandardPattern(actor.collegeId);
    let nextBlueprint = blueprint;
    let portions = null;
    if (input.selectedModuleIds || input.selectedTopicIds !== undefined || input.includeOr !== undefined || input.splits || input.patternCode || input.moduleTargets || input.coTargets) {
        portions = await loadPortions({
            collegeId: actor.collegeId,
            courseId: Number(header.course_id),
            facultyUserId: actor.facultyUserId,
            academicYearId: header.academic_year_id,
            selectedModuleIds: input.selectedModuleIds ?? parseJson(header.selected_scope_json, {}).moduleIds,
            selectedTopicIds: input.selectedTopicIds === undefined
                ? parseJson(header.selected_scope_json, {}).topicIds
                : input.selectedTopicIds,
        });
        if (input.selectedModuleIds) {
            for (const m of portions.modules)
                m.selected = input.selectedModuleIds.includes(m.id);
            if (input.selectedTopicIds == null) {
                for (const m of portions.modules) {
                    if (m.selected)
                        for (const t of m.topics)
                            t.selected = true;
                }
            }
            else {
                const set = new Set(input.selectedTopicIds);
                for (const m of portions.modules) {
                    for (const t of m.topics)
                        t.selected = m.selected && set.has(t.id);
                }
            }
        }
        const rec = recommendBlueprint({
            examType: header.exam_type,
            pattern,
            modules: portions.modules,
            includeOr: input.includeOr ?? (blueprint?.allowOrChoices ?? true),
            splits: input.splits,
            sourceMix: blueprint?.sourceMix || { previousYear: true, questionBank: true, quizBank: false },
            previousYearWeight: blueprint?.previousYearWeight,
            allowPreviousYearRepeats: blueprint?.allowPreviousYearRepeats,
            recentYearExclusion: blueprint?.recentYearExclusion,
        });
        nextBlueprint = rec.blueprint;
        if (input.coTargets)
            nextBlueprint.coTargets = input.coTargets.map((t) => ({ coCode: t.coCode.toUpperCase(), marks: t.marks }));
        if (input.moduleTargets)
            nextBlueprint.moduleTargets = input.moduleTargets;
        nextBlueprint.changeJustification = blueprint?.changeJustification ?? null;
        nextBlueprint.coEvaluationId = blueprint?.coEvaluationId ?? null;
        nextBlueprint.modifiedFromCoEvaluation = Boolean(blueprint?.modifiedFromCoEvaluation);
    }
    const patch = { updated_at: db.fn.now() };
    if (await db.schema.hasColumn('internal_question_papers', 'autosaved_at'))
        patch.autosaved_at = db.fn.now();
    if (input.examDate !== undefined)
        patch.exam_date = input.examDate;
    if (input.title !== undefined)
        patch.title = input.title;
    if (input.instructions !== undefined)
        patch.instructions = input.instructions;
    if (input.durationMinutes !== undefined)
        patch.duration_minutes = input.durationMinutes;
    if (input.workflowStep && (await db.schema.hasColumn('internal_question_papers', 'workflow_step'))) {
        patch.workflow_step = input.workflowStep;
    }
    if (input.buildMode && (await db.schema.hasColumn('internal_question_papers', 'build_mode'))) {
        patch.build_mode = input.buildMode;
    }
    if (input.coverageWarningAcknowledged != null && (await db.schema.hasColumn('internal_question_papers', 'coverage_warning_acknowledged'))) {
        patch.coverage_warning_acknowledged = input.coverageWarningAcknowledged;
    }
    if (nextBlueprint) {
        patch.blueprint_json = JSON.stringify(nextBlueprint);
        if (await db.schema.hasColumn('internal_question_papers', 'required_answer_marks')) {
            patch.required_answer_marks = nextBlueprint.requiredAnswerMarks ?? nextBlueprint.maxMarks;
            patch.printed_marks = nextBlueprint.printedMarks ?? nextBlueprint.maxMarks;
            patch.pattern_code = nextBlueprint.patternCode ?? pattern.code;
            patch.selected_scope_json = JSON.stringify({
                moduleIds: nextBlueprint.selectedModuleIds || [],
                topicIds: nextBlueprint.selectedTopicIds ?? null,
            });
        }
    }
    await db('internal_question_papers').where({ id: paperId }).update(patch);
    if (portions)
        await persistScopeRows(paperId, portions.modules);
    await recordQpAudit({
        collegeId: actor.collegeId,
        paperId,
        actorId: actor.facultyUserId,
        actorName: await actorName(actor.facultyUserId),
        action: 'AUTOSAVE',
        metadata: { step: input.workflowStep },
    });
    return getInternalPaper(paperId, actor.collegeId);
}
export async function listEligibleQuestions(actor, paperId) {
    const header = await db('internal_question_papers').where({ id: paperId, college_id: actor.collegeId }).first();
    if (!header)
        throw new AppError(404, 'Internal question paper not found');
    const blueprint = parseJson(header.blueprint_json, null);
    if (!blueprint)
        throw new AppError(400, 'Blueprint missing');
    const pool = await loadPool(actor.collegeId, Number(header.course_id), blueprint);
    const usable = eligiblePool(pool, blueprint);
    const inScope = pool.filter((q) => inSelectedScope(q, blueprint));
    const review = inScope.filter((q) => !usable.some((u) => u.id === q.id));
    return {
        count: usable.length,
        reviewCount: review.length,
        questions: usable.slice(0, 80).map(publicPoolQuestion),
        needsReview: review.slice(0, 40).map(publicPoolQuestion),
    };
}
function publicPoolQuestion(q) {
    return {
        id: q.sourceQuestionId,
        kind: q.source,
        sourceType: q.sourceType || MASTER_QUESTION_SOURCE_TYPE,
        sourceKind: q.masterSource || classifyMasterSource({ sourceType: q.sourceType, examType: q.examType }),
        questionText: q.questionText,
        marks: q.marks,
        moduleName: q.moduleName,
        moduleId: q.moduleId,
        coCode: q.coCode,
        rbtLevel: q.rbtLevel || rbtFromBloom(q.bloomLevel),
        difficulty: q.difficulty,
        hasScheme: Boolean(q.hasScheme),
        hasSolution: Boolean(q.hasSolution),
        verificationStatus: q.readinessStatus || q.verificationStatus,
        appearanceCount: q.appearanceCount,
        examYear: q.examYear,
        examType: q.examType,
        examMonth: q.examMonth,
        yearsAppeared: q.yearsAppeared || [],
        examsAppeared: q.examsAppeared || [],
        timesPreviouslyUsed: q.internalUsageCount ?? q.appearanceCount,
        textbookCitation: q.textbookCitation,
        sourceBadge: q.masterSource === 'MODULE_QUESTION_BANK'
            ? 'Module Question Bank'
            : `VTU SEE ${q.examYear || q.academicYear || ''}`.trim(),
    };
}
export async function listItemReplacements(actor, paperId, itemId) {
    const header = await db('internal_question_papers').where({ id: paperId, college_id: actor.collegeId }).first();
    if (!header)
        throw new AppError(404, 'Internal question paper not found');
    const item = await db('internal_question_paper_items').where({ id: itemId, paper_id: paperId }).first();
    if (!item)
        throw new AppError(404, 'Question not found');
    const blueprint = parseJson(header.blueprint_json, null);
    if (!blueprint)
        throw new AppError(400, 'Blueprint missing');
    const pool = await loadPool(actor.collegeId, Number(header.course_id), blueprint);
    const allItems = await db('internal_question_paper_items').where({ paper_id: paperId });
    const selected = allItems.map((it) => ({
        slot: {
            key: String(it.item_key),
            section: String(it.section || 'MAIN'),
            questionNumber: Number(it.question_number),
            subLetter: it.sub_letter,
            marks: Number(it.max_marks),
            coCode: it.primary_co_code,
            moduleId: it.module_id ? Number(it.module_id) : null,
            moduleName: it.module_or_unit,
        },
        question: { id: String(it.id), fingerprint: String(it.fingerprint || it.id) },
    }));
    const current = selected.find((s) => Number(s.question.id) === itemId) || selected[0];
    const candidates = replacementCandidates(pool, blueprint, current, selected);
    return { alternatives: candidates.slice(0, 20).map(publicPoolQuestion) };
}
export async function generateSchemesAndSolutions(actor, paperId) {
    const header = await db('internal_question_papers').where({ id: paperId, college_id: actor.collegeId }).first();
    if (!header)
        throw new AppError(404, 'Internal question paper not found');
    if (header.status !== 'DRAFT')
        throw new AppError(409, 'Only draft papers can be updated');
    if (!(await db.schema.hasTable('internal_qp_scheme_components'))) {
        throw new AppError(503, 'Scheme storage is not migrated yet');
    }
    const items = await db('internal_question_paper_items').where({ paper_id: paperId }).orderBy('sort_order');
    const hasMasterScheme = await db.schema.hasTable('qp_master_scheme_components');
    const hasMasterSol = await db.schema.hasTable('qp_master_solutions');
    const hasCitation = await db.schema.hasColumn('internal_question_paper_items', 'textbook_citation');
    for (const item of items) {
        const sourceId = item.source_py_question_id ? Number(item.source_py_question_id) : null;
        const existing = await db('internal_qp_scheme_components').where({ item_id: item.id });
        if (!existing.length && sourceId && hasMasterScheme) {
            const components = await db('qp_master_scheme_components').where({ question_row_id: sourceId }).orderBy('sort_order');
            if (components.length) {
                await db('internal_qp_scheme_components').insert(components.map((c, i) => ({
                    item_id: item.id,
                    code: c.code,
                    label: c.label,
                    max_marks: c.max_marks,
                    sort_order: i,
                })));
            }
        }
        const updates = {};
        if (!String(item.model_answer || '').trim()) {
            if (sourceId && hasMasterSol) {
                const sol = await db('qp_master_solutions').where({ question_row_id: sourceId }).first();
                if (sol?.textbook_grounded && String(sol.model_solution || '').trim()) {
                    updates.model_answer = sol.model_solution;
                    updates.expected_key_points = sol.expected_key_points;
                    updates.model_answer_status = 'TEXTBOOK_GROUNDED';
                    if (hasCitation) {
                        updates.textbook_citation = textbookCitation({
                            title: sol.textbook_title,
                            chapter: sol.chapter,
                            section: sol.section,
                        });
                    }
                }
                else {
                    updates.model_answer_status = 'TEXTBOOK_SOURCE_REQUIRED';
                }
            }
            else {
                updates.model_answer_status = 'TEXTBOOK_SOURCE_REQUIRED';
            }
        }
        if (Object.keys(updates).length) {
            await db('internal_question_paper_items').where({ id: item.id }).update(updates);
        }
    }
    if (await db.schema.hasColumn('internal_question_papers', 'workflow_step')) {
        await db('internal_question_papers').where({ id: paperId }).update({ workflow_step: 'SCHEME', autosaved_at: db.fn.now(), updated_at: db.fn.now() });
    }
    await recordQpAudit({
        collegeId: actor.collegeId,
        paperId,
        actorId: actor.facultyUserId,
        actorName: await actorName(actor.facultyUserId),
        action: 'GENERATE_SCHEME',
    });
    return getInternalPaper(paperId, actor.collegeId);
}
async function itemFromPool(paperId, collegeId, courseId, poolQ, slot, idx) {
    if (!isReadyForInternalPaper(poolQ.readinessStatus || poolQ.reviewStatus) || poolQ.source !== 'PREVIOUS_YEAR') {
        throw nonPyqSourceForbiddenError(poolQ.sourceType || poolQ.source);
    }
    const derived = poolQ.coCode
        ? snapshotDerivedOutcomes(await resolveDerivedOutcomes({ collegeId, courseId, primaryCoCode: poolQ.coCode }))
        : null;
    const rbt = rbtFromBloom(poolQ.rbtLevel || poolQ.bloomLevel);
    const blocked = isBlockedForFinalize(poolQ);
    const masterSource = poolQ.masterSource ||
        classifyMasterSource({
            sourceType: poolQ.sourceType,
            examType: poolQ.examType,
            university: poolQ.provenance?.university ?? null,
        });
    if (masterSource === 'OTHER_SOURCE') {
        throw nonPyqSourceForbiddenError(poolQ.examType || poolQ.sourceType || poolQ.source);
    }
    const isFallback = masterSource === 'MODULE_QUESTION_BANK';
    const provenance = {
        ...(poolQ.provenance || {}),
        masterSource,
        questionSource: isFallback
            ? 'Module Question Bank'
            : formatQuestionSourceLabel({
                examType: poolQ.examType,
                examYear: poolQ.examYear,
                examMonth: poolQ.examMonth,
                academicYear: poolQ.academicYear,
            }),
        sourceBadge: isFallback
            ? 'Module Question Bank'
            : `VTU SEE ${poolQ.examYear || poolQ.academicYear || ''}`.trim(),
        fallbackReason: isFallback
            ? 'Insufficient compatible SEE coverage; used Module Question Bank fallback.'
            : null,
        marksSource: isFallback ? 'Module Question Bank' : 'Printed in PYQ',
        co: poolQ.coCode,
        poPso: derived ? `Derived from approved CO mapping` : null,
        solutionSource: isFallback
            ? poolQ.textbookCitation || 'Approved Module Question Bank solution'
            : poolQ.textbookCitation,
        schemeSource: isFallback
            ? 'Approved Module Question Bank scheme'
            : 'Derived from approved textbook-backed solution',
    };
    return {
        item_key: slot.key || `Q${slot.questionNumber}`,
        section: slot.section,
        question_number: slot.questionNumber,
        sub_letter: slot.subLetter,
        question_text: poolQ.questionText,
        question_type: 'DESCRIPTIVE',
        max_marks: slot.marks,
        module_or_unit: slot.moduleName || poolQ.moduleName,
        module_id: slot.moduleId || poolQ.moduleId,
        primary_co_code: slot.coCode || poolQ.coCode,
        difficulty: poolQ.difficulty,
        bloom_level: poolQ.bloomLevel || rbt,
        is_or_choice: Boolean(slot.isOrChoice),
        or_group_id: slot.orGroupId,
        // Normalized Internal-Paper source (VTU_SEE_PYQ | MODULE_QUESTION_BANK).
        source_kind: masterSource,
        source_type: isFallback ? 'MODULE_QUESTION_BANK' : MASTER_QUESTION_SOURCE_TYPE,
        source_py_question_id: poolQ.sourceQuestionId,
        source_bank_question_id: null,
        source_quiz_question_id: null,
        source_paper_id: poolQ.sourcePaperId,
        fingerprint: poolQ.fingerprint,
        derived_outcomes_snapshot: derived ? JSON.stringify(derived) : null,
        model_answer: poolQ.modelSolution,
        model_answer_status: poolQ.hasSolution
            ? isFallback
                ? 'APPROVED_BANK'
                : 'TEXTBOOK_GROUNDED'
            : 'TEXTBOOK_SOURCE_REQUIRED',
        textbook_id: poolQ.textbookId ?? null,
        textbook_citation: poolQ.textbookCitation,
        readiness_status_snapshot: poolQ.readinessStatus,
        provenance_json: JSON.stringify(provenance),
        sort_order: idx,
        _scheme: poolQ.scheme?.length ? poolQ.scheme : null,
        _meta: {
            topic_id: slot.topicId || poolQ.topicId || null,
            topic_name: slot.topicName || poolQ.topicName || null,
            rbt_level: rbt,
            or_alternative: slot.orAlternative || null,
            verification_status: poolQ.readinessStatus || poolQ.verificationStatus || poolQ.reviewStatus || null,
            needs_faculty_verification: blocked,
            co_mapping_blocked: Boolean(poolQ.coMappingBlocked),
        },
    };
}
export async function generateInternalPaper(actor, paperId, blueprintOverride, opts) {
    const header = await db('internal_question_papers').where({ id: paperId, college_id: actor.collegeId }).first();
    if (!header)
        throw new AppError(404, 'Internal question paper not found');
    if (header.status !== 'DRAFT')
        throw new AppError(409, 'Only draft papers can be generated');
    let blueprint = blueprintOverride || parseJson(header.blueprint_json, null);
    if (!blueprint)
        throw new AppError(400, 'Blueprint missing');
    if (!blueprint.selectedModuleIds?.length && (blueprint.workflowVersion === 2 || Number(header.creation_flow_version) === 2)) {
        const moduleCount = await db('subject_modules').where({ course_id: header.course_id }).count({ c: '*' }).first();
        if (Number(moduleCount?.c || 0) > 0) {
            throw new AppError(400, 'Select syllabus portions before generating questions');
        }
    }
    if (opts?.includeOr != null && opts.includeOr !== blueprint.allowOrChoices) {
        const portions = await loadPortions({
            collegeId: actor.collegeId,
            courseId: Number(header.course_id),
            facultyUserId: actor.facultyUserId,
            academicYearId: header.academic_year_id,
            selectedModuleIds: blueprint.selectedModuleIds,
            selectedTopicIds: blueprint.selectedTopicIds,
        });
        const pattern = await ensureStandardPattern(actor.collegeId);
        blueprint = recommendBlueprint({
            examType: header.exam_type,
            pattern,
            modules: portions.modules,
            includeOr: opts.includeOr,
            sourceMix: blueprint.sourceMix,
            previousYearWeight: blueprint.previousYearWeight,
            allowPreviousYearRepeats: blueprint.allowPreviousYearRepeats,
            recentYearExclusion: blueprint.recentYearExclusion,
        }).blueprint;
    }
    const pool = await loadPool(actor.collegeId, Number(header.course_id), blueprint);
    const existing = await db('internal_question_paper_items').where({ paper_id: paperId }).orderBy('sort_order');
    const remainingSlots = blueprint.slots.filter((slot) => !existing.some((row) => Number(row.question_number) === slot.questionNumber &&
        String(row.sub_letter || '') === String(slot.subLetter || '')));
    const fillRemaining = existing.length > 0 && remainingSlots.length > 0;
    const selected = selectForBlueprint(pool, blueprint, Math.random, fillRemaining
        ? {
            usedFingerprints: existing.map((row) => String(row.fingerprint || '')).filter(Boolean),
            slots: remainingSlots,
            requireFullTotal: false,
        }
        : undefined);
    const items = [];
    if (fillRemaining) {
        for (const row of existing) {
            const { id: _id, created_at: _c, updated_at: _u, ...rest } = row;
            items.push(rest);
        }
    }
    const start = items.length;
    for (const [i, sel] of selected.entries()) {
        items.push(await itemFromPool(paperId, actor.collegeId, Number(header.course_id), sel.question, sel.slot, start + i + 1));
    }
    await persistItems(paperId, items);
    const patch = {
        blueprint_json: JSON.stringify(blueprint),
        updated_at: db.fn.now(),
    };
    if (await db.schema.hasColumn('internal_question_papers', 'workflow_step')) {
        patch.workflow_step = 'QUESTIONS';
        patch.build_mode = opts?.mode || header.build_mode || 'HYBRID';
        patch.printed_marks = items.reduce((n, it) => n + Number(it.max_marks || 0), 0);
        patch.autosaved_at = db.fn.now();
    }
    await db('internal_question_papers').where({ id: paperId }).update(patch);
    await recordQpAudit({
        collegeId: actor.collegeId,
        paperId,
        actorId: actor.facultyUserId,
        actorName: await actorName(actor.facultyUserId),
        action: 'GENERATE',
    });
    return getInternalPaper(paperId, actor.collegeId);
}
export async function addCustomQuestion(_actor, _paperId, _input) {
    throw customQuestionForbiddenError();
}
export async function addExistingQuestion(actor, paperId, source) {
    if (source.kind !== 'PREVIOUS_YEAR')
        throw nonPyqSourceForbiddenError(source.kind);
    const header = await db('internal_question_papers').where({ id: paperId, college_id: actor.collegeId }).first();
    if (!header)
        throw new AppError(404, 'Internal question paper not found');
    if (header.status !== 'DRAFT')
        throw new AppError(409, 'Only draft papers can be edited');
    const blueprint = parseJson(header.blueprint_json, null);
    const pool = await loadPool(actor.collegeId, Number(header.course_id), blueprint || {
        examType: header.exam_type,
        maxMarks: Number(header.max_marks),
        durationMinutes: header.duration_minutes,
        modules: [],
        coTargets: [],
        patternLabel: '',
        slots: [],
        allowOrChoices: false,
        sourceMix: { previousYear: true, questionBank: false, quizBank: false },
        previousYearWeight: 50,
        allowPreviousYearRepeats: true,
        recentYearExclusion: 0,
        modifiedFromCoEvaluation: false,
    });
    const found = pool.find((p) => p.source === source.kind && p.sourceQuestionId === source.id);
    if (!found)
        throw new AppError(404, 'Question not found in eligible pool');
    if (blueprint && !inSelectedScope(found, blueprint)) {
        throw new AppError(422, 'That question is outside the selected IA syllabus');
    }
    if (isBlockedForFinalize(found)) {
        throw new AppError(422, 'CO_MAPPING_BLOCKED and NEEDS_REVIEW questions cannot be added to a paper without verification');
    }
    const existing = await db('internal_question_paper_items').where({ paper_id: paperId });
    if (existing.some((e) => e.fingerprint === found.fingerprint)) {
        throw new AppError(409, 'That question is already on this paper');
    }
    const nextNum = existing.length + 1;
    const mapped = await itemFromPool(paperId, actor.collegeId, Number(header.course_id), found, {
        key: `Q${nextNum}`,
        section: 'MAIN',
        questionNumber: nextNum,
        subLetter: null,
        marks: found.marks,
        coCode: found.coCode,
    }, nextNum);
    await insertMappedItem(paperId, mapped);
    return getInternalPaper(paperId, actor.collegeId);
}
export async function replaceItem(actor, paperId, itemId, pick) {
    const header = await db('internal_question_papers').where({ id: paperId, college_id: actor.collegeId }).first();
    if (!header)
        throw new AppError(404, 'Internal question paper not found');
    if (header.status !== 'DRAFT')
        throw new AppError(409, 'Only draft papers can be edited');
    const item = await db('internal_question_paper_items').where({ id: itemId, paper_id: paperId }).first();
    if (!item)
        throw new AppError(404, 'Question not found');
    const blueprint = parseJson(header.blueprint_json, null);
    if (!blueprint)
        throw new AppError(400, 'Blueprint missing');
    const pool = await loadPool(actor.collegeId, Number(header.course_id), blueprint);
    const allItems = await db('internal_question_paper_items').where({ paper_id: paperId });
    const selected = allItems.map((it) => ({
        slot: {
            key: String(it.item_key),
            section: String(it.section || 'MAIN'),
            questionNumber: Number(it.question_number),
            subLetter: it.sub_letter,
            marks: Number(it.max_marks),
            coCode: it.primary_co_code,
            // Constrain replacement to the same module as the item being replaced so an
            // OR alternative can only be swapped for another same-module PYQ (OR spec §18).
            moduleId: it.module_id ? Number(it.module_id) : null,
            moduleName: it.module_or_unit ?? null,
        },
        question: {
            id: String(it.id),
            fingerprint: String(it.fingerprint || it.id),
        },
    }));
    const current = selected.find((s) => Number(s.question.id) === itemId) || {
        slot: {
            key: String(item.item_key),
            section: String(item.section || 'MAIN'),
            questionNumber: Number(item.question_number),
            subLetter: item.sub_letter,
            marks: Number(item.max_marks),
            coCode: item.primary_co_code,
            moduleId: item.module_id ? Number(item.module_id) : null,
            moduleName: item.module_or_unit ?? null,
        },
        question: { id: String(item.id), fingerprint: String(item.fingerprint) },
    };
    const candidates = replacementCandidates(pool, blueprint, current, selected);
    const chosen = pick?.id && pick.kind
        ? pool.find((p) => p.source === pick.kind && p.sourceQuestionId === pick.id)
        : candidates[0];
    if (chosen && !slotMatchesModule(chosen, current.slot)) {
        throw new AppError(422, replacementModuleMismatchMessage(current.slot.moduleName, chosen.moduleName), {
            slotModule: current.slot.moduleName,
            slotModuleId: current.slot.moduleId,
            questionModule: chosen.moduleName,
            questionModuleId: chosen.moduleId,
        }, 'REPLACEMENT_MODULE_MISMATCH');
    }
    if (chosen && blueprint && !inSelectedScope(chosen, blueprint)) {
        throw new AppError(422, 'Replacement must remain within the selected syllabus and blueprint');
    }
    const pickQ = chosen;
    if (!pickQ)
        throw new AppError(422, 'No replacement question matches marks/CO/module constraints');
    const mapped = await itemFromPool(paperId, actor.collegeId, Number(header.course_id), pickQ, current.slot, Number(item.sort_order || 1));
    const { _scheme, _meta, ...mappedRow } = mapped;
    const update = {
        ...mappedRow,
        item_key: item.item_key,
        sort_order: item.sort_order,
        updated_at: db.fn.now(),
    };
    if (await db.schema.hasColumn('internal_question_paper_items', 'topic_id') && _meta) {
        const meta = _meta;
        Object.assign(update, {
            topic_id: meta.topic_id ?? null,
            topic_name: meta.topic_name ?? null,
            rbt_level: meta.rbt_level ?? null,
            or_alternative: meta.or_alternative ?? item.or_alternative ?? null,
            verification_status: meta.verification_status ?? null,
            needs_faculty_verification: Boolean(meta.needs_faculty_verification),
            co_mapping_blocked: Boolean(meta.co_mapping_blocked),
        });
    }
    await db('internal_question_paper_items').where({ id: itemId }).update(update);
    if (await db.schema.hasTable('internal_qp_scheme_components')) {
        await db('internal_qp_scheme_components').where({ item_id: itemId }).del();
        const scheme = _scheme;
        if (scheme?.length) {
            await db('internal_qp_scheme_components').insert(scheme.map((c, i) => ({
                item_id: itemId,
                code: c.code,
                label: c.label,
                max_marks: c.maxMarks,
                sort_order: i,
            })));
        }
    }
    await recordQpAudit({
        collegeId: actor.collegeId,
        paperId,
        itemId,
        actorId: actor.facultyUserId,
        actorName: await actorName(actor.facultyUserId),
        action: 'REPLACE',
    });
    return getInternalPaper(paperId, actor.collegeId);
}
export async function removeItem(actor, paperId, itemId) {
    const header = await db('internal_question_papers').where({ id: paperId, college_id: actor.collegeId }).first();
    if (!header)
        throw new AppError(404, 'Internal question paper not found');
    if (header.status !== 'DRAFT')
        throw new AppError(409, 'Only draft papers can be edited');
    await db('internal_question_paper_items').where({ id: itemId, paper_id: paperId }).del();
    return getInternalPaper(paperId, actor.collegeId);
}
export async function listInternalPapers(actor, filters = {}) {
    let q = db('internal_question_papers as p')
        .leftJoin('faculty_users as f', 'f.id', 'p.created_by')
        .where('p.college_id', actor.collegeId)
        .select('p.*', 'f.name as facultyName')
        .orderBy('p.updated_at', 'desc');
    if (!canManageAllInternalPapers(actor.role) && actor.role === 'FACULTY') {
        q = q.andWhere('p.created_by', actor.facultyUserId);
    }
    if (filters.courseId)
        q = q.andWhere('p.course_id', filters.courseId);
    if (filters.status)
        q = q.andWhere('p.status', filters.status);
    if (filters.examType)
        q = q.andWhere('p.exam_type', filters.examType);
    const rows = await q;
    return {
        papers: rows.map((r) => ({
            id: Number(r.id),
            title: r.title,
            subjectName: r.subject_name,
            courseCode: r.course_code,
            examType: r.exam_type,
            status: r.status,
            maxMarks: Number(r.max_marks),
            durationMinutes: r.duration_minutes,
            academicYearLabel: r.academic_year_label,
            facultyName: r.facultyName,
            updatedAt: r.updated_at,
            modifiedFromCoEval: Boolean(r.modified_from_co_eval),
            workflowStep: r.workflow_step || null,
            creationFlowVersion: r.creation_flow_version ? Number(r.creation_flow_version) : 1,
            examDate: r.exam_date,
        })),
    };
}
export async function getInternalPaper(paperId, collegeId) {
    const header = await db('internal_question_papers as p')
        .leftJoin('faculty_users as f', 'f.id', 'p.created_by')
        .leftJoin('colleges as c', 'c.id', 'p.college_id')
        .leftJoin('departments as d', 'd.id', 'p.department_id')
        .where({ 'p.id': paperId, 'p.college_id': collegeId })
        .select('p.*', 'f.name as facultyName', 'c.name as collegeName', 'c.logo_url as logoUrl', 'd.name as departmentName')
        .first();
    if (!header)
        throw new AppError(404, 'Internal question paper not found');
    if (header.status === 'FINALIZED' && header.snapshot_json) {
        const snap = parseJson(header.snapshot_json, null);
        if (snap?.paper && Array.isArray(snap.items)) {
            const snapItems = snap.items;
            return {
                paper: { ...snap.paper, status: 'FINALIZED', id: Number(header.id) },
                blueprint: snap.blueprint || null,
                items: snapItems,
                validation: snap.validation || { ok: true, errors: [] },
                coverage: snap.coverage,
                quality: snap.quality || evaluatePaperQuality({
                    maxMarks: Number(snap.paper.maxMarks || header.max_marks),
                    courseCoCodes: [],
                    items: snapItems.map((it) => ({
                        questionKey: String(it.itemKey || it.id),
                        questionText: String(it.questionText || ''),
                        maxMarks: Number(it.maxMarks || 0),
                        primaryCo: it.primaryCo || null,
                        fingerprint: it.fingerprint || null,
                        bloomLevel: it.bloomLevel || null,
                        difficulty: it.difficulty || null,
                        module: it.moduleOrUnit || null,
                        modelAnswer: it.modelAnswer || null,
                        scheme: it.scheme || null,
                    })),
                }),
            };
        }
    }
    const items = await db('internal_question_paper_items').where({ paper_id: paperId }).orderBy('sort_order');
    const hasSchemeTable = await db.schema.hasTable('internal_qp_scheme_components');
    const schemeRows = hasSchemeTable && items.length
        ? await db('internal_qp_scheme_components').whereIn('item_id', items.map((it) => it.id))
        : [];
    const schemeByItem = new Map();
    for (const row of schemeRows) {
        const list = schemeByItem.get(Number(row.item_id)) ?? [];
        list.push({ code: String(row.code), label: String(row.label), maxMarks: Number(row.max_marks) });
        schemeByItem.set(Number(row.item_id), list);
    }
    const blueprint = parseJson(header.blueprint_json, null);
    const mappedItems = items.map((it) => ({
        id: Number(it.id),
        itemKey: it.item_key,
        section: it.section,
        questionNumber: Number(it.question_number),
        subLetter: it.sub_letter,
        questionText: it.question_text,
        questionType: it.question_type,
        maxMarks: Number(it.max_marks),
        moduleOrUnit: it.module_or_unit,
        moduleId: it.module_id ? Number(it.module_id) : null,
        primaryCo: it.primary_co_code,
        secondaryCo: it.secondary_co_code ?? null,
        topic: it.topic ?? it.topic_name ?? null,
        topicId: it.topic_id ? Number(it.topic_id) : null,
        difficulty: it.difficulty,
        bloomLevel: it.bloom_level,
        rbtLevel: it.rbt_level || rbtFromBloom(it.bloom_level),
        isOrChoice: Boolean(it.is_or_choice),
        orGroupId: it.or_group_id,
        orAlternative: it.or_alternative ?? null,
        sourceKind: it.source_kind,
        sourceType: it.source_type || (it.source_kind === 'PREVIOUS_YEAR' ? MASTER_QUESTION_SOURCE_TYPE : it.source_kind),
        sourcePaperId: it.source_paper_id,
        fingerprint: it.fingerprint,
        derivedOutcomes: parseJson(it.derived_outcomes_snapshot, null),
        modelAnswer: it.model_answer,
        modelAnswerStatus: it.model_answer_status,
        expectedKeyPoints: it.expected_key_points ?? null,
        scheme: schemeByItem.get(Number(it.id)) ?? [],
        verificationStatus: it.verification_status ?? null,
        needsFacultyVerification: Boolean(it.needs_faculty_verification),
        coMappingBlocked: Boolean(it.co_mapping_blocked),
        textbookId: it.textbook_id ? Number(it.textbook_id) : null,
        textbookCitation: it.textbook_citation ?? null,
        provenance: parseJson(it.provenance_json, null),
    }));
    const validation = validateBlueprint(blueprint || {
        examType: header.exam_type,
        maxMarks: Number(header.max_marks),
        durationMinutes: header.duration_minutes,
        modules: [],
        coTargets: [],
        patternLabel: '',
        slots: mappedItems.map((it) => ({
            key: it.itemKey,
            section: it.section || 'MAIN',
            questionNumber: it.questionNumber,
            subLetter: it.subLetter,
            marks: it.maxMarks,
            coCode: it.primaryCo,
        })),
        allowOrChoices: false,
        sourceMix: { previousYear: true, questionBank: true, quizBank: false },
        previousYearWeight: 50,
        allowPreviousYearRepeats: true,
        recentYearExclusion: 0,
        modifiedFromCoEvaluation: false,
    }, mappedItems.map((it) => ({
        marks: it.maxMarks,
        fingerprint: String(it.fingerprint || it.id),
        coCode: it.primaryCo,
        orGroupId: it.orGroupId,
        orAlternative: it.orAlternative,
        moduleId: it.moduleId,
        moduleName: it.moduleOrUnit,
        topicId: it.topicId,
        label: `Q${it.questionNumber}${it.subLetter ? `(${it.subLetter})` : ''}`,
    })));
    const paperValidation = validateInternalPaper({
        maxMarks: Number(header.max_marks),
        requiredAnswerMarks: header.required_answer_marks != null ? Number(header.required_answer_marks) : blueprint?.requiredAnswerMarks ?? Number(header.max_marks),
        patternMarks: blueprint?.workflowVersion === 2 ? [20, 20, 10] : undefined,
        blueprint,
        items: mappedItems,
    });
    const coverage = coverageFromItems(mappedItems.map((it) => ({
        marks: it.maxMarks,
        coCode: it.primaryCo,
        source: it.sourceKind,
        moduleName: it.moduleOrUnit,
        rbtLevel: it.rbtLevel,
        bloomLevel: it.bloomLevel,
        orAlternative: it.orAlternative,
    })));
    const courseCos = await db('course_outcomes')
        .where({ college_id: collegeId, course_id: header.course_id, is_current: true })
        .select('co_code');
    const quality = evaluatePaperQuality({
        maxMarks: Number(header.max_marks),
        requiredAnswerMarks: header.required_answer_marks != null ? Number(header.required_answer_marks) : Number(header.max_marks),
        courseCoCodes: Number(header.creation_flow_version) === 2
            ? (blueprint?.coTargets || []).map((c) => c.coCode)
            : courseCos.map((c) => String(c.co_code)),
        courseModules: blueprint?.modules,
        items: mappedItems.map((it) => ({
            questionKey: String(it.itemKey),
            questionText: String(it.questionText),
            maxMarks: it.maxMarks,
            primaryCo: it.primaryCo,
            fingerprint: it.fingerprint,
            bloomLevel: it.bloomLevel,
            difficulty: it.difficulty,
            module: it.moduleOrUnit,
            modelAnswer: it.modelAnswer,
            scheme: it.scheme,
            orAlternative: it.orAlternative,
        })),
    });
    const orGroups = new Map();
    for (const it of mappedItems) {
        if (!it.orGroupId)
            continue;
        const list = orGroups.get(String(it.orGroupId)) ?? [];
        list.push(it);
        orGroups.set(String(it.orGroupId), list);
    }
    const orBalance = [...orGroups.entries()].map(([groupId, group]) => {
        const a = group.filter((i) => i.orAlternative !== 'B');
        const b = group.filter((i) => i.orAlternative === 'B');
        return {
            groupId,
            ...orPairBalance({ marks: a.reduce((n, i) => n + i.maxMarks, 0), coCode: a[0]?.primaryCo, difficulty: a[0]?.difficulty, rbtLevel: a[0]?.rbtLevel, bloomLevel: a[0]?.bloomLevel, moduleId: a[0]?.moduleId }, { marks: b.reduce((n, i) => n + i.maxMarks, 0), coCode: b[0]?.primaryCo, difficulty: b[0]?.difficulty, rbtLevel: b[0]?.rbtLevel, bloomLevel: b[0]?.bloomLevel, moduleId: b[0]?.moduleId }),
        };
    });
    return {
        paper: {
            id: Number(header.id),
            title: header.title,
            subjectName: header.subject_name,
            courseCode: header.course_code,
            courseId: Number(header.course_id),
            examType: header.exam_type,
            examTypeLabel: examTypeLabel(String(header.exam_type)),
            status: header.status,
            maxMarks: Number(header.max_marks),
            requiredAnswerMarks: header.required_answer_marks != null ? Number(header.required_answer_marks) : Number(header.max_marks),
            printedMarks: mappedItems.reduce((n, i) => n + i.maxMarks, 0),
            durationMinutes: header.duration_minutes,
            examDate: header.exam_date,
            instructions: header.instructions,
            academicYearId: header.academic_year_id ? Number(header.academic_year_id) : null,
            academicYearLabel: header.academic_year_label,
            programId: header.program_id ? Number(header.program_id) : null,
            programName: header.program_name,
            semesterId: header.semester_id ? Number(header.semester_id) : null,
            semesterLabel: header.semester_label,
            facultyName: header.faculty_name_snapshot || header.facultyName,
            collegeName: header.collegeName,
            logoUrl: header.logoUrl,
            departmentName: header.departmentName,
            courseType: header.course_type ?? null,
            schemeLabel: header.scheme_label,
            modifiedFromCoEval: Boolean(header.modified_from_co_eval),
            changeJustification: header.change_justification,
            coEvaluationId: header.co_evaluation_id,
            createdBy: Number(header.created_by),
            qualityScore: quality.score,
            qualityScoreVersion: quality.version,
            workflowStep: header.workflow_step || 'SETUP',
            creationFlowVersion: header.creation_flow_version ? Number(header.creation_flow_version) : 1,
            buildMode: header.build_mode || null,
            patternCode: header.pattern_code || blueprint?.patternCode || null,
            coverageWarningAcknowledged: Boolean(header.coverage_warning_acknowledged),
            legacy: Number(header.creation_flow_version || 1) < 2,
        },
        blueprint,
        items: mappedItems,
        validation: {
            ok: paperValidation.canFinalize,
            errors: paperValidation.issues.filter((i) => i.severity === 'CRITICAL').map((i) => i.message),
        },
        paperValidation,
        coverage,
        quality,
        orBalance,
        sourceSummary: sourceSummaryFromItems(mappedItems.map((it) => ({
            questionNumber: it.questionNumber,
            orAlternative: it.orAlternative,
            orGroupId: it.orGroupId,
            sourceKind: it.sourceKind,
            moduleName: it.moduleOrUnit,
        }))),
        draftSavedAt: header.autosaved_at ? String(header.autosaved_at) : null,
        academicProvenance: mappedItems.map((it) => {
            const p = (it.provenance || {});
            const derived = it.derivedOutcomes;
            return {
                questionLabel: `Q${it.questionNumber}${it.subLetter ? `(${it.subLetter})` : ''}`,
                questionSource: String(p.questionSource || formatQuestionSourceLabel({ examType: String(p.examType || ''), examYear: p.examYear ? Number(p.examYear) : null })),
                marksSource: String(p.marksSource || 'Printed in PYQ'),
                co: it.primaryCo,
                poPso: derived
                    ? `Derived from approved CO mapping (${[...(derived.pos || []).map((x) => x.code), ...(derived.psos || []).map((x) => x.code)].join(', ') || '—'})`
                    : String(p.poPso || 'Derived from approved CO mapping'),
                solutionSource: it.textbookCitation || String(p.solutionSource || '') || null,
                schemeSource: String(p.schemeSource || 'Derived from approved textbook-backed solution'),
                pyqPaperId: it.sourcePaperId,
                textbookCitation: it.textbookCitation,
            };
        }),
    };
}
export async function finalizeInternalPaper(actor, paperId) {
    const detail = await getInternalPaper(paperId, actor.collegeId);
    if (detail.paper.status !== 'DRAFT')
        throw new AppError(409, 'Paper is already finalized');
    const blocking = detail.paperValidation?.issues.filter((i) => i.severity === 'CRITICAL') ||
        (!detail.validation.ok ? detail.validation.errors.map((message) => ({ message })) : []);
    if (blocking.length) {
        throw new AppError(422, blocking[0] && 'message' in blocking[0] ? String(blocking[0].message) : 'Cannot finalize until validation passes', {
            errors: detail.validation.errors,
            issues: detail.paperValidation?.issues,
        });
    }
    if (!detail.quality.okToPublish) {
        const first = detail.quality.criticalFailures[0];
        throw new AppError(422, first?.detail || 'Cannot finalize until academic quality checks pass', {
            criticalFailures: detail.quality.criticalFailures,
        });
    }
    const snapshot = {
        paper: detail.paper,
        blueprint: detail.blueprint,
        items: detail.items,
        coverage: detail.coverage,
        validation: detail.validation,
        paperValidation: detail.paperValidation,
        quality: detail.quality,
        orBalance: detail.orBalance,
        finalizedAt: new Date().toISOString(),
    };
    const patch = {
        status: 'FINALIZED',
        snapshot_json: JSON.stringify(snapshot),
        finalized_at: db.fn.now(),
        finalized_by: actor.facultyUserId,
        updated_at: db.fn.now(),
    };
    if (await db.schema.hasColumn('internal_question_papers', 'quality_snapshot')) {
        patch.quality_snapshot = JSON.stringify(detail.quality);
        patch.quality_score = detail.quality.score;
        patch.quality_score_version = detail.quality.version;
        patch.scheme_frozen_at = db.fn.now();
    }
    if (await db.schema.hasColumn('internal_question_papers', 'workflow_step')) {
        patch.workflow_step = 'REVIEW';
    }
    await db('internal_question_papers').where({ id: paperId }).update(patch);
    await recordQpAudit({
        collegeId: actor.collegeId,
        paperId,
        actorId: actor.facultyUserId,
        actorName: await actorName(actor.facultyUserId),
        action: 'FINALIZE',
    });
    return getInternalPaper(paperId, actor.collegeId);
}
export const itemSchemeSchema = z.object({
    modelAnswer: z.string().max(20000).optional().nullable(),
    expectedKeyPoints: z.string().max(4000).optional().nullable(),
    components: z
        .array(z.object({
        code: z.string().min(1).max(64),
        label: z.string().min(1).max(255),
        maxMarks: z.number().positive(),
    }))
        .min(1),
});
export async function setItemScheme(actor, paperId, itemId, input) {
    const header = await db('internal_question_papers').where({ id: paperId, college_id: actor.collegeId }).first();
    if (!header)
        throw new AppError(404, 'Internal question paper not found');
    if (header.status !== 'DRAFT')
        throw new AppError(409, 'Finalized papers cannot change scheme or solution');
    const item = await db('internal_question_paper_items').where({ id: itemId, paper_id: paperId }).first();
    if (!item)
        throw new AppError(404, 'Question not found');
    const check = schemeComponentsValid(Number(item.max_marks), input.components);
    if (!check.ok)
        throw new AppError(422, check.message || 'Scheme total must equal question marks');
    if (!(await db.schema.hasTable('internal_qp_scheme_components'))) {
        throw new AppError(503, 'Scheme storage is not migrated yet');
    }
    await db('internal_qp_scheme_components').where({ item_id: itemId }).del();
    await db('internal_qp_scheme_components').insert(input.components.map((c, i) => ({
        item_id: itemId,
        code: c.code,
        label: c.label,
        max_marks: c.maxMarks,
        sort_order: i,
    })));
    const patch = { model_answer: input.modelAnswer ?? item.model_answer, model_answer_status: input.modelAnswer ? 'COMPLETE' : item.model_answer_status };
    if (await db.schema.hasColumn('internal_question_paper_items', 'expected_key_points')) {
        patch.expected_key_points = input.expectedKeyPoints ?? null;
    }
    await db('internal_question_paper_items').where({ id: itemId }).update(patch);
    return getInternalPaper(paperId, actor.collegeId);
}
export async function listPatterns(collegeId) {
    return listPaperPatterns(collegeId);
}
export { INTERNAL_PAPER_STATUSES };
