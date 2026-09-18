import { db } from '../../db/index.js';
import { getSurveyAvailabilityStatus } from '../../utils/surveyStatus.js';
import { computePlanProgress } from '../lessonPlans/progress.js';
import { todayISO, addDays } from '../lessonPlans/dates.js';
import { assertFacultyIsolation, countReadyPlans, facultyScopeFilter, mapMappingStatus, pendingEvaluationTotal, resolveAcademicContext, sortAttentionItems, sortUpcomingItems, } from './helpers.js';
async function resolveCourseUniverse(actor) {
    const { createdBy } = facultyScopeFilter(actor.role, actor.facultyUserId);
    const collegeId = actor.collegeId;
    const ids = new Set();
    const assignmentRows = (await db('faculty_subject_assignments')
        .where({ college_id: collegeId, status: 'ACTIVE' })
        .modify((q) => {
        if (createdBy != null)
            q.andWhere({ faculty_id: createdBy });
    })
        .select('course_id', 'academic_year_id', 'program_id', 'semester_id', 'faculty_id'));
    for (const row of assignmentRows) {
        ids.add(Number(row.course_id));
    }
    const tables = [
        { table: 'faculty_lesson_plans' },
        { table: 'quizzes', softDelete: true },
        { table: 'assignments', softDelete: true },
        { table: 'surveys', softDelete: true },
        { table: 'faculty_gap_analyses' },
        { table: 'faculty_cbs_plans' },
        { table: 'faculty_co_evaluations' },
        { table: 'attainment_runs' },
    ];
    for (const { table, softDelete } of tables) {
        try {
            const rows = (await db(table)
                .where({ college_id: collegeId })
                .modify((q) => {
                if (createdBy != null)
                    q.andWhere({ created_by: createdBy });
                if (softDelete)
                    q.whereNull('deleted_at');
            })
                .whereNotNull('course_id')
                .select('course_id', 'created_by'));
            for (const row of rows) {
                if (createdBy != null) {
                    assertFacultyIsolation(createdBy, [Number(row.created_by)]);
                }
                ids.add(Number(row.course_id));
            }
        }
        catch {
            /* table may not exist yet in partial envs */
        }
    }
    try {
        const mappingRows = (await db('copo_mapping_versions')
            .where({ college_id: collegeId, is_current: true })
            .whereNotNull('source_mapping_version_id')
            .modify((q) => {
            if (createdBy != null)
                q.andWhere({ created_by: createdBy });
        })
            .select('course_id', 'created_by'));
        for (const row of mappingRows)
            ids.add(Number(row.course_id));
    }
    catch {
        /* ignore */
    }
    return { courseIds: [...ids], assignmentRows };
}
function applyOwner(q, createdBy, column = 'created_by') {
    if (createdBy != null)
        q.andWhere(column, createdBy);
    return q;
}
function asDate(value) {
    if (value instanceof Date)
        return value;
    return new Date(String(value ?? ''));
}
export async function buildLecturerDashboard(actor) {
    const { createdBy } = facultyScopeFilter(actor.role, actor.facultyUserId);
    const collegeId = actor.collegeId;
    const today = todayISO();
    const horizon = addDays(today, 14);
    const now = new Date();
    const { courseIds, assignmentRows } = await resolveCourseUniverse(actor);
    const courses = (courseIds.length === 0
        ? []
        : await db('courses as c')
            .leftJoin('departments as d', 'd.id', 'c.department_id')
            .leftJoin('semesters as s', 's.id', 'c.semester_id')
            .where('c.college_id', collegeId)
            .whereIn('c.id', courseIds)
            .select('c.id', 'c.code', 'c.name', 'c.semester_id', 'd.name as department_name', 's.label as semester_label', 's.number as semester_number'));
    const assignmentByCourse = new Map();
    for (const row of assignmentRows) {
        assignmentByCourse.set(Number(row.course_id), row);
    }
    // Enrich context from faculty_subject_assignments
    const ayIds = [
        ...new Set(assignmentRows
            .map((r) => r.academic_year_id)
            .filter((v) => v != null)
            .map(Number)),
    ];
    const programIds = [
        ...new Set(assignmentRows
            .map((r) => r.program_id)
            .filter((v) => v != null)
            .map(Number)),
    ];
    const semesterIds = [
        ...new Set(assignmentRows
            .map((r) => r.semester_id)
            .filter((v) => v != null)
            .map(Number)),
    ];
    const academicYears = (ayIds.length
        ? await db('academic_years').whereIn('id', ayIds).select('id', 'label')
        : []);
    const programs = (programIds.length
        ? await db('programs').whereIn('id', programIds).select('id', 'name', 'code')
        : []);
    const semesters = (semesterIds.length
        ? await db('semesters').whereIn('id', semesterIds).select('id', 'label', 'number')
        : []);
    const ayMap = new Map(academicYears.map((r) => [Number(r.id), String(r.label)]));
    const programMap = new Map(programs.map((r) => [Number(r.id), { name: String(r.name), code: r.code ? String(r.code) : null }]));
    const semMap = new Map(semesters.map((r) => [
        Number(r.id),
        { label: String(r.label), number: r.number != null ? Number(r.number) : null },
    ]));
    const contextRows = assignmentRows.map((r) => {
        const ayId = r.academic_year_id != null ? Number(r.academic_year_id) : null;
        const programId = r.program_id != null ? Number(r.program_id) : null;
        const semesterId = r.semester_id != null ? Number(r.semester_id) : null;
        return {
            academicYearId: ayId,
            academicYearLabel: ayId ? ayMap.get(ayId) ?? null : null,
            programId,
            programName: programId ? programMap.get(programId)?.name ?? null : null,
            semesterId,
            semesterLabel: semesterId ? semMap.get(semesterId)?.label ?? null : null,
        };
    });
    const context = {
        ...resolveAcademicContext(contextRows),
        courseCount: courses.length,
    };
    // ——— Parallel module loads (faculty-scoped) ———
    const moduleLoads = await Promise.all([
        db('faculty_lesson_plans as p')
            .where({ 'p.college_id': collegeId })
            .modify((q) => applyOwner(q, createdBy, 'p.created_by'))
            .whereNot('p.status', 'ARCHIVED')
            .select('p.id', 'p.course_id', 'p.status', 'p.created_by'),
        courseIds.length
            ? db('lesson_plan_entries as e')
                .join('faculty_lesson_plans as p', 'p.id', 'e.plan_id')
                .where({ 'p.college_id': collegeId })
                .modify((q) => applyOwner(q, createdBy, 'p.created_by'))
                .select('e.plan_id', 'e.status', 'e.planned_date', 'e.actual_date', 'e.planned_hours', 'e.actual_hours', 'e.module_id', 'e.module_label', 'e.module_name', 'p.course_id')
            : Promise.resolve([]),
        db('quizzes')
            .where({ college_id: collegeId })
            .whereNull('deleted_at')
            .modify((q) => applyOwner(q, createdBy))
            .select('*'),
        db('assignments')
            .where({ college_id: collegeId })
            .whereNull('deleted_at')
            .modify((q) => applyOwner(q, createdBy))
            .select('*'),
        db('surveys')
            .where({ college_id: collegeId })
            .whereNull('deleted_at')
            .modify((q) => applyOwner(q, createdBy))
            .select('*'),
        db('copo_mapping_versions as v')
            .where({ 'v.college_id': collegeId, 'v.is_current': true })
            .whereNotNull('v.source_mapping_version_id')
            .modify((q) => applyOwner(q, createdBy, 'v.created_by'))
            .whereNot('v.status', 'ARCHIVED')
            .select('v.id', 'v.course_id', 'v.status', 'v.created_by'),
        db('faculty_gap_analyses')
            .where({ college_id: collegeId })
            .modify((q) => applyOwner(q, createdBy))
            .whereNot('status', 'ARCHIVED')
            .select('id', 'course_id', 'status', 'created_by'),
        db('faculty_gap_analysis_items as i')
            .join('faculty_gap_analyses as a', 'a.id', 'i.analysis_id')
            .where({ 'a.college_id': collegeId })
            .modify((q) => applyOwner(q, createdBy, 'a.created_by'))
            .whereNot('a.status', 'ARCHIVED')
            .select('i.analysis_id', 'i.item_status', 'i.applicability', 'a.course_id'),
        db('faculty_cbs_plans')
            .where({ college_id: collegeId })
            .modify((q) => applyOwner(q, createdBy))
            .whereNot('status', 'ARCHIVED')
            .select('id', 'course_id', 'status', 'created_by'),
        db('faculty_cbs_plan_items as i')
            .join('faculty_cbs_plans as p', 'p.id', 'i.plan_id')
            .where({ 'p.college_id': collegeId })
            .modify((q) => applyOwner(q, createdBy, 'p.created_by'))
            .whereNot('p.status', 'ARCHIVED')
            .select('i.plan_id', 'i.status', 'i.planned_date', 'i.title', 'p.course_id'),
        db('faculty_co_evaluations')
            .where({ college_id: collegeId })
            .modify((q) => applyOwner(q, createdBy))
            .whereNot('status', 'ARCHIVED')
            .select('id', 'course_id', 'status', 'created_by'),
        db('assignment_submissions as s')
            .join('assignments as a', 'a.id', 's.assignment_id')
            .where({ 'a.college_id': collegeId })
            .whereNull('a.deleted_at')
            .modify((q) => applyOwner(q, createdBy, 'a.created_by'))
            .whereIn('s.status', ['SUBMITTED', 'LATE_SUBMITTED'])
            .whereIn('s.evaluation_status', ['PENDING', 'IN_PROGRESS'])
            .count({ c: '*' })
            .first(),
        db('quiz_attempts as qa')
            .join('quizzes as q', 'q.id', 'qa.quiz_id')
            .where({ 'q.college_id': collegeId })
            .whereNull('q.deleted_at')
            .modify((q) => applyOwner(q, createdBy, 'q.created_by'))
            .where('qa.needs_manual_grading', true)
            .whereIn('qa.status', ['SUBMITTED', 'EXPIRED_SUBMITTED'])
            .count({ c: '*' })
            .first()
            .catch(() => ({ c: 0 })),
        db('quiz_attempts as qa')
            .join('quizzes as q', 'q.id', 'qa.quiz_id')
            .where({ 'q.college_id': collegeId })
            .whereNull('q.deleted_at')
            .modify((q) => applyOwner(q, createdBy, 'q.created_by'))
            .whereIn('qa.status', ['SUBMITTED', 'EXPIRED_SUBMITTED'])
            .count({ c: '*' })
            .first()
            .catch(() => ({ c: 0 })),
        db('assignment_submissions as s')
            .join('assignments as a', 'a.id', 's.assignment_id')
            .where({ 'a.college_id': collegeId })
            .whereNull('a.deleted_at')
            .modify((q) => applyOwner(q, createdBy, 'a.created_by'))
            .whereIn('s.status', ['SUBMITTED', 'LATE_SUBMITTED'])
            .count({ c: '*' })
            .first(),
        db('survey_submissions as ss')
            .join('surveys as s', 's.id', 'ss.survey_id')
            .where({ 's.college_id': collegeId })
            .whereNull('s.deleted_at')
            .modify((q) => applyOwner(q, createdBy, 's.created_by'))
            .where({ 'ss.status': 'COMPLETED' })
            .count({ c: '*' })
            .first(),
    ]);
    const lessonPlans = moduleLoads[0];
    const lessonEntries = moduleLoads[1];
    const quizzes = moduleLoads[2];
    const assignments = moduleLoads[3];
    const surveys = moduleLoads[4];
    const mappings = moduleLoads[5];
    const gapAnalyses = moduleLoads[6];
    const gapItems = moduleLoads[7];
    const cbsPlans = moduleLoads[8];
    const cbsItems = moduleLoads[9];
    const coEvals = moduleLoads[10];
    const pendingAssignmentSubs = moduleLoads[11];
    const quizManualCount = moduleLoads[12];
    const quizAttemptCount = moduleLoads[13];
    const assignmentSubmissionCount = moduleLoads[14];
    const surveyResponseCount = moduleLoads[15];
    if (createdBy != null) {
        const owners = [
            ...lessonPlans.map((r) => Number(r.created_by)),
            ...quizzes.map((r) => Number(r.created_by)),
            ...assignments.map((r) => Number(r.created_by)),
            ...surveys.map((r) => Number(r.created_by)),
            ...mappings.map((r) => Number(r.created_by)),
            ...gapAnalyses.map((r) => Number(r.created_by)),
            ...cbsPlans.map((r) => Number(r.created_by)),
            ...coEvals.map((r) => Number(r.created_by)),
        ];
        assertFacultyIsolation(createdBy, owners);
    }
    const quizEffective = quizzes.map((q) => ({
        ...q,
        effective: getSurveyAvailabilityStatus({
            status: String(q.status ?? ''),
            startAt: q.start_at ?? null,
            endAt: q.end_at ?? null,
            closedAt: q.closed_at ?? null,
            archivedAt: q.archived_at ?? null,
        }),
    }));
    const assignmentEffective = assignments.map((a) => ({
        ...a,
        effective: getSurveyAvailabilityStatus({
            status: String(a.status ?? ''),
            startAt: a.start_at ?? null,
            endAt: a.due_at ?? null,
            closedAt: a.closed_at ?? null,
            archivedAt: a.archived_at ?? null,
        }),
    }));
    const surveyEffective = surveys.map((s) => ({
        ...s,
        effective: getSurveyAvailabilityStatus({
            status: String(s.status ?? ''),
            startAt: s.start_at ?? null,
            endAt: s.end_at ?? null,
            closedAt: s.closed_at ?? null,
            archivedAt: s.archived_at ?? null,
        }),
    }));
    const activeQuizzes = quizEffective.filter((q) => q.effective === 'ACTIVE').length;
    const completedQuizzes = quizEffective.filter((q) => ['ENDED', 'CLOSED', 'ARCHIVED'].includes(q.effective)).length;
    const activeAssignments = assignmentEffective.filter((a) => a.effective === 'ACTIVE').length;
    const activeSurveys = surveyEffective.filter((s) => s.effective === 'ACTIVE').length;
    const assignmentPending = Number(pendingAssignmentSubs?.c ?? 0);
    const quizManual = Number(quizManualCount?.c ?? 0);
    const openGapItems = gapItems.filter((i) => {
        if (i.applicability && String(i.applicability).toUpperCase() === 'NOT_APPLICABLE')
            return false;
        return ['OPEN', 'ACTION_PLANNED', 'IN_PROGRESS'].includes(String(i.item_status).toUpperCase());
    });
    const openGaps = openGapItems.length;
    const coEvalDrafts = coEvals.filter((e) => String(e.status) === 'DRAFT').length;
    const pendingEvaluations = pendingEvaluationTotal({
        assignmentPending,
        quizManual,
        coEvalDrafts,
        openGaps,
    });
    // Per-course module maps
    const planByCourse = new Map();
    for (const p of lessonPlans) {
        const cid = Number(p.course_id);
        if (!planByCourse.has(cid))
            planByCourse.set(cid, p);
    }
    const entriesByPlan = new Map();
    for (const e of lessonEntries) {
        const pid = Number(e.plan_id);
        if (!entriesByPlan.has(pid))
            entriesByPlan.set(pid, []);
        entriesByPlan.get(pid).push(e);
    }
    const mappingByCourse = new Map();
    for (const m of mappings) {
        const cid = Number(m.course_id);
        if (!mappingByCourse.has(cid))
            mappingByCourse.set(cid, m);
    }
    const gapByCourse = new Map();
    for (const g of gapAnalyses) {
        const cid = Number(g.course_id);
        if (!gapByCourse.has(cid))
            gapByCourse.set(cid, g);
    }
    const openGapsByCourse = new Map();
    for (const i of openGapItems) {
        const cid = Number(i.course_id);
        openGapsByCourse.set(cid, (openGapsByCourse.get(cid) ?? 0) + 1);
    }
    const cbsByCourse = new Map();
    for (const p of cbsPlans) {
        const cid = Number(p.course_id);
        if (!cbsByCourse.has(cid))
            cbsByCourse.set(cid, p);
    }
    const coEvalByCourse = new Map();
    for (const e of coEvals) {
        const cid = Number(e.course_id);
        if (!coEvalByCourse.has(cid))
            coEvalByCourse.set(cid, e);
    }
    // Pending evaluations per course (assignment)
    const pendingByCourseRows = await db('assignment_submissions as s')
        .join('assignments as a', 'a.id', 's.assignment_id')
        .where({ 'a.college_id': collegeId })
        .whereNull('a.deleted_at')
        .modify((q) => applyOwner(q, createdBy, 'a.created_by'))
        .whereIn('s.status', ['SUBMITTED', 'LATE_SUBMITTED'])
        .whereIn('s.evaluation_status', ['PENDING', 'IN_PROGRESS'])
        .whereNotNull('a.course_id')
        .groupBy('a.course_id')
        .select('a.course_id')
        .count({ c: '*' });
    const pendingEvalByCourse = new Map();
    for (const row of pendingByCourseRows) {
        pendingEvalByCourse.set(Number(row.course_id), Number(row.c ?? 0));
    }
    const courseCards = courses.map((c) => {
        const courseId = Number(c.id);
        const asg = assignmentByCourse.get(courseId);
        const ayId = asg?.academic_year_id != null ? Number(asg.academic_year_id) : null;
        const programId = asg?.program_id != null ? Number(asg.program_id) : null;
        const semesterId = asg?.semester_id != null
            ? Number(asg.semester_id)
            : c.semester_id != null
                ? Number(c.semester_id)
                : null;
        const plan = planByCourse.get(courseId);
        let lessonPlan = { status: null };
        if (plan) {
            const entries = (entriesByPlan.get(Number(plan.id)) || []).map((e) => ({
                status: String(e.status),
                plannedDate: e.planned_date ? String(e.planned_date).slice(0, 10) : null,
                actualDate: e.actual_date ? String(e.actual_date).slice(0, 10) : null,
                plannedHours: Number(e.planned_hours) || 0,
                actualHours: e.actual_hours != null ? Number(e.actual_hours) : null,
                moduleId: e.module_id != null ? Number(e.module_id) : null,
                moduleLabel: e.module_label != null ? String(e.module_label) : null,
                moduleName: e.module_name != null ? String(e.module_name) : null,
            }));
            const progress = computePlanProgress(entries, today);
            lessonPlan = {
                status: String(plan.status),
                planId: Number(plan.id),
                completedUnits: progress.completedUnits,
                totalUnits: progress.totalUnits,
                progressPercent: progress.percent,
                statusLabel: progress.statusLabel,
            };
        }
        const mapping = mappingByCourse.get(courseId);
        const gap = gapByCourse.get(courseId);
        const cbs = cbsByCourse.get(courseId);
        const coEval = coEvalByCourse.get(courseId);
        const qActive = quizEffective.filter((q) => Number(q.course_id) === courseId && q.effective === 'ACTIVE').length;
        const aActive = assignmentEffective.filter((a) => Number(a.course_id) === courseId && a.effective === 'ACTIVE').length;
        const sActive = surveyEffective.filter((s) => Number(s.course_id) === courseId && s.effective === 'ACTIVE').length;
        const programMeta = programId ? programMap.get(programId) : null;
        const semMeta = semesterId ? semMap.get(semesterId) : null;
        return {
            courseId,
            code: String(c.code),
            name: String(c.name),
            programName: programMeta?.name ?? null,
            programCode: programMeta?.code ?? null,
            semesterLabel: semMeta?.label ??
                (c.semester_label ? String(c.semester_label) : null) ??
                (c.semester_number != null ? `Semester ${c.semester_number}` : null),
            academicYearLabel: ayId ? ayMap.get(ayId) ?? null : null,
            departmentName: c.department_name ? String(c.department_name) : null,
            source: asg ? 'ASSIGNMENT' : 'INFERRED',
            modules: {
                lessonPlan,
                quizzes: { active: qActive },
                assignments: {
                    active: aActive,
                    pendingEvaluation: pendingEvalByCourse.get(courseId) ?? 0,
                },
                surveys: { active: sActive },
                academicMapping: {
                    status: mapping ? mapMappingStatus(String(mapping.status)) : 'MISSING',
                    mappingId: mapping ? Number(mapping.id) : undefined,
                },
                gapAnalysis: {
                    status: gap ? String(gap.status) : null,
                    openGaps: openGapsByCourse.get(courseId) ?? 0,
                    analysisId: gap ? Number(gap.id) : undefined,
                },
                beyondSyllabus: {
                    status: cbs ? String(cbs.status) : null,
                    planId: cbs ? Number(cbs.id) : undefined,
                },
                coEvaluation: {
                    status: coEval ? String(coEval.status) : null,
                    evaluationId: coEval ? Number(coEval.id) : undefined,
                },
                attainment: { status: null, runId: undefined, red: 0 },
            },
        };
    });
    try {
        if (await db.schema.hasTable('attainment_runs')) {
            const runs = (await db('attainment_runs')
                .where({ college_id: collegeId, status: 'COMMITTED' })
                .modify((q) => applyOwner(q, createdBy))
                .orderBy('calculated_at', 'desc')
                .select('id', 'course_id', 'status'));
            const byCourse = new Map();
            for (const run of runs) {
                const cid = Number(run.course_id);
                if (!byCourse.has(cid))
                    byCourse.set(cid, run);
            }
            const ids = [...byCourse.values()].map((r) => Number(r.id));
            const results = ids.length ? await db('co_attainment_results').whereIn('run_id', ids).select('run_id', 'status') : [];
            for (const card of courseCards) {
                const run = byCourse.get(card.courseId);
                if (!run)
                    continue;
                const red = results.filter((r) => Number(r.run_id) === Number(run.id) && r.status === 'RED').length;
                card.modules.attainment = { status: red > 0 ? 'RED' : 'COMMITTED', runId: Number(run.id), red };
            }
        }
    }
    catch {
        /* attainment tables may not exist yet */
    }
    // Attention items
    const attention = [];
    if (assignmentPending > 0) {
        attention.push({
            kind: 'ASSIGNMENT_EVALUATION',
            severity: 'high',
            title: `${assignmentPending} assignment submission${assignmentPending === 1 ? '' : 's'} awaiting evaluation`,
            count: assignmentPending,
            href: '/assignments',
        });
    }
    if (quizManual > 0) {
        attention.push({
            kind: 'QUIZ_MANUAL_GRADING',
            severity: 'high',
            title: `${quizManual} quiz attempt${quizManual === 1 ? '' : 's'} need manual review`,
            count: quizManual,
            href: '/quizzes',
        });
    }
    for (const e of coEvals.filter((x) => String(x.status) === 'DRAFT')) {
        const course = courseCards.find((c) => c.courseId === Number(e.course_id));
        attention.push({
            kind: 'CO_EVALUATION_DRAFT',
            severity: 'medium',
            title: `CO Evaluation${course ? ` · ${course.code}` : ''} is still Draft`,
            courseId: course?.courseId,
            courseCode: course?.code,
            href: `/co-evaluation/${e.id}`,
        });
    }
    if (openGaps > 0) {
        attention.push({
            kind: 'GAP_OPEN',
            severity: 'medium',
            title: `${openGaps} Gap Analysis item${openGaps === 1 ? '' : 's'} remain open`,
            count: openGaps,
            href: '/gap-analysis',
        });
    }
    for (const card of courseCards) {
        const lp = card.modules.lessonPlan;
        if (lp.statusLabel && /behind/i.test(lp.statusLabel) && lp.planId) {
            attention.push({
                kind: 'LESSON_BEHIND',
                severity: 'medium',
                title: `Lesson Plan · ${card.code} is behind schedule`,
                courseId: card.courseId,
                courseCode: card.code,
                href: `/lesson-plans/${lp.planId}`,
            });
        }
        if (card.modules.academicMapping.status === 'DRAFT' && card.modules.academicMapping.mappingId) {
            attention.push({
                kind: 'MAPPING_DRAFT',
                severity: 'low',
                title: `Academic Mapping · ${card.code} is still Draft`,
                courseId: card.courseId,
                courseCode: card.code,
                href: `/copo/mappings/${card.modules.academicMapping.mappingId}`,
            });
        }
    }
    // Upcoming
    const upcoming = [];
    for (const q of quizEffective) {
        if (q.effective === 'SCHEDULED' && q.start_at) {
            const at = asDate(q.start_at);
            if (at >= now && at <= asDate(horizon)) {
                const course = courseCards.find((c) => c.courseId === Number(q.course_id));
                upcoming.push({
                    at: at.toISOString(),
                    kind: 'QUIZ',
                    title: `Quiz · ${q.title}`,
                    courseId: course?.courseId,
                    courseCode: course?.code,
                    href: `/quizzes/${q.id}`,
                });
            }
        }
        if (q.effective === 'ACTIVE' && q.end_at) {
            const at = asDate(q.end_at);
            if (at >= now && String(q.end_at).slice(0, 10) <= horizon) {
                const course = courseCards.find((c) => c.courseId === Number(q.course_id));
                upcoming.push({
                    at: at.toISOString(),
                    kind: 'QUIZ',
                    title: `Quiz closes · ${q.title}`,
                    courseId: course?.courseId,
                    courseCode: course?.code,
                    href: `/quizzes/${q.id}`,
                });
            }
        }
    }
    for (const a of assignmentEffective) {
        const due = a.due_at;
        if (due && ['ACTIVE', 'SCHEDULED'].includes(a.effective)) {
            const at = asDate(due);
            if (String(due).slice(0, 10) >= today && String(due).slice(0, 10) <= horizon) {
                const course = courseCards.find((c) => c.courseId === Number(a.course_id));
                upcoming.push({
                    at: at.toISOString(),
                    kind: 'ASSIGNMENT_DUE',
                    title: `Assignment due · ${a.title}`,
                    courseId: course?.courseId,
                    courseCode: course?.code,
                    href: `/assignments/${a.id}`,
                });
            }
        }
    }
    for (const s of surveyEffective) {
        if (s.effective === 'ACTIVE' && s.end_at) {
            const day = String(s.end_at).slice(0, 10);
            if (day >= today && day <= horizon) {
                const course = courseCards.find((c) => c.courseId === Number(s.course_id));
                upcoming.push({
                    at: asDate(s.end_at).toISOString(),
                    kind: 'SURVEY_END',
                    title: `Survey closes · ${s.title}`,
                    courseId: course?.courseId,
                    courseCode: course?.code,
                    href: `/surveys/${s.id}`,
                });
            }
        }
    }
    for (const item of cbsItems) {
        if (!item.planned_date)
            continue;
        const day = String(item.planned_date).slice(0, 10);
        if (day < today || day > horizon)
            continue;
        if (['CANCELLED', 'COMPLETED', 'ASSESSED'].includes(String(item.status).toUpperCase()))
            continue;
        const course = courseCards.find((c) => c.courseId === Number(item.course_id));
        upcoming.push({
            at: `${day}T09:00:00.000Z`,
            kind: 'CBS_SESSION',
            title: `Beyond Syllabus · ${item.title || 'Planned session'}`,
            courseId: course?.courseId,
            courseCode: course?.code,
            href: `/beyond-syllabus/${item.plan_id}`,
        });
    }
    for (const e of lessonEntries) {
        if (!e.planned_date)
            continue;
        const day = String(e.planned_date).slice(0, 10);
        if (day < today || day > horizon)
            continue;
        if (['COMPLETED', 'SKIPPED'].includes(String(e.status).toUpperCase()))
            continue;
        const course = courseCards.find((c) => c.courseId === Number(e.course_id));
        upcoming.push({
            at: `${day}T09:00:00.000Z`,
            kind: 'LESSON_ENTRY',
            title: `Lesson · ${e.module_label || e.module_name || 'Teaching session'}`,
            courseId: course?.courseId,
            courseCode: course?.code,
            href: `/lesson-plans/${e.plan_id}`,
        });
    }
    // Academic planning overview
    const lessonPlansCreated = new Set(lessonPlans.map((p) => Number(p.course_id))).size;
    const mappingsFinalized = courseCards.filter((c) => c.modules.academicMapping.status === 'FINALIZED').length;
    const mappingsDraft = courseCards.filter((c) => c.modules.academicMapping.status === 'DRAFT').length;
    const mappingsMissing = courseCards.filter((c) => c.modules.academicMapping.status === 'MISSING').length;
    const gapInProgress = gapAnalyses.filter((g) => ['DRAFT', 'IN_PROGRESS'].includes(String(g.status))).length;
    const gapCompleted = gapAnalyses.filter((g) => String(g.status) === 'COMPLETED').length;
    const cbsInProgress = cbsPlans.filter((p) => ['DRAFT', 'IN_PROGRESS'].includes(String(p.status))).length;
    const cbsCompleted = cbsPlans.filter((p) => String(p.status) === 'COMPLETED').length;
    const coEvalFinalized = coEvals.filter((e) => String(e.status) === 'FINALIZED').length;
    const plansReady = countReadyPlans({
        courseCount: courses.length,
        lessonPlansCreated,
        mappingsFinalized,
        gapCompleted,
        cbsCompleted,
        coEvalFinalized,
    });
    // Recent activity — compact, from owned artifacts (no full audit dump)
    const recentActivity = [];
    const recentSurveys = surveyEffective
        .slice()
        .sort((a, b) => asDate(b.created_at).getTime() - asDate(a.created_at).getTime())
        .slice(0, 3);
    for (const s of recentSurveys) {
        recentActivity.push({
            at: asDate(s.created_at).toISOString(),
            kind: 'SURVEY',
            summary: `Survey · ${s.title}`,
            href: `/surveys/${s.id}`,
        });
    }
    const recentQuizzes = quizEffective
        .filter((q) => q.published_at || q.status !== 'DRAFT')
        .slice()
        .sort((a, b) => asDate(b.published_at || b.created_at).getTime() -
        asDate(a.published_at || a.created_at).getTime())
        .slice(0, 3);
    for (const q of recentQuizzes) {
        recentActivity.push({
            at: asDate(q.published_at || q.created_at).toISOString(),
            kind: 'QUIZ',
            summary: `Quiz published · ${q.title}`,
            href: `/quizzes/${q.id}`,
        });
    }
    for (const e of coEvals.filter((x) => String(x.status) === 'FINALIZED').slice(0, 3)) {
        const course = courseCards.find((c) => c.courseId === Number(e.course_id));
        recentActivity.push({
            at: new Date().toISOString(),
            kind: 'CO_EVALUATION',
            summary: `CO Evaluation finalized${course ? ` · ${course.code}` : ''}`,
            href: `/co-evaluation/${e.id}`,
        });
    }
    for (const g of gapAnalyses.filter((x) => String(x.status) === 'COMPLETED').slice(0, 2)) {
        const course = courseCards.find((c) => c.courseId === Number(g.course_id));
        recentActivity.push({
            at: new Date().toISOString(),
            kind: 'GAP',
            summary: `Gap Analysis completed${course ? ` · ${course.code}` : ''}`,
            href: `/gap-analysis/${g.id}`,
        });
    }
    recentActivity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    let nextClass = null;
    try {
        const { facultyTimetable } = await import('../timetable/service.js');
        const tt = await facultyTimetable({
            facultyUserId: actor.facultyUserId,
            collegeId: actor.collegeId,
            role: actor.role,
        });
        nextClass = tt.nextClass ?? null;
    }
    catch {
        nextClass = null;
    }
    return {
        context,
        metrics: {
            myCourses: courses.length,
            activeAssessments: activeQuizzes + activeAssignments + activeSurveys,
            pendingEvaluations,
            academicPlans: plansReady,
        },
        courses: courseCards,
        attentionItems: sortAttentionItems(attention).slice(0, 10),
        upcoming: sortUpcomingItems(upcoming, 8),
        assessments: {
            quizzes: { active: activeQuizzes, completed: completedQuizzes },
            assignments: { active: activeAssignments, pendingEvaluation: assignmentPending },
            surveys: {
                active: activeSurveys,
                responses: Number(surveyResponseCount?.c ?? 0),
            },
        },
        academicPlanning: {
            lessonPlans: { created: lessonPlansCreated, expected: Math.max(courses.length, lessonPlansCreated) },
            academicMapping: {
                finalized: mappingsFinalized,
                draft: mappingsDraft,
                missing: mappingsMissing,
            },
            gapAnalysis: { inProgress: gapInProgress, completed: gapCompleted },
            beyondSyllabus: { inProgress: cbsInProgress, completed: cbsCompleted },
            coEvaluation: { draft: coEvalDrafts, finalized: coEvalFinalized },
            attainment: {
                committed: courseCards.filter((c) => c.modules.attainment.runId).length,
                redCos: courseCards.reduce((s, c) => s + (c.modules.attainment.red || 0), 0),
            },
        },
        engagement: {
            quizAttempts: Number(quizAttemptCount?.c ?? 0),
            assignmentSubmissions: Number(assignmentSubmissionCount?.c ?? 0),
            surveyResponses: Number(surveyResponseCount?.c ?? 0),
        },
        recentActivity: recentActivity.slice(0, 8),
        nextClass,
    };
}
