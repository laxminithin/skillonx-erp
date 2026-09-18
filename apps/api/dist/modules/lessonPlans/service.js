import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { CALENDAR_EXCEPTION_TYPES } from '../../types/lessonPlan.js';
import { compareISODate, sqlDate, todayISO, weekdayOf } from './dates.js';
import { listLessonAudit, recordLessonAudit } from './audit.js';
import { computePlanProgress } from './progress.js';
import { enumeratePeriods, isValidTeachingDate, periodsFromDate, scheduleEntries, validateSlot, } from './scheduler.js';
export const teachingSlotSchema = z.object({
    weekday: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    hours: z.number().positive().max(8).default(1),
});
export const createPlanSchema = z.object({
    courseId: z.number().int().positive(),
    academicYearId: z.number().int().positive(),
    semesterId: z.number().int().positive().optional().nullable(),
    departmentId: z.number().int().positive().optional().nullable(),
    programId: z.number().int().positive().optional().nullable(),
    classSectionId: z.number().int().positive().optional().nullable(),
    calendarId: z.number().int().positive().optional().nullable(),
    includeSupplementary: z.boolean().optional().default(false),
    continueWithShortfall: z.boolean().optional().default(false),
    teachingSlots: z.array(teachingSlotSchema).min(1),
});
export const rescheduleSchema = z.object({
    actualDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reason: z.string().max(512).optional().nullable(),
    mode: z.enum(['THIS_ONLY', 'SHIFT_SUBSEQUENT']),
});
export const completeSchema = z.object({
    actualDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    actualHours: z.number().positive().max(8).optional(),
    remarks: z.string().max(2000).optional().nullable(),
});
export const editEntrySchema = z.object({
    topicName: z.string().min(1).max(512).optional(),
    subtopicName: z.string().max(4000).optional().nullable(),
    plannedHours: z.number().positive().max(8).optional(),
    remarks: z.string().max(2000).optional().nullable(),
    teachingMethod: z.string().max(128).optional().nullable(),
});
export const addEntrySchema = z.object({
    moduleId: z.number().int().positive().optional().nullable(),
    topicName: z.string().min(1).max(512),
    subtopicName: z.string().max(4000).optional().nullable(),
    hours: z.number().positive().max(8).default(1),
    afterEntryId: z.number().int().positive().optional().nullable(),
    isSupplementary: z.boolean().optional().default(true),
});
export const splitSchema = z.object({
    parts: z
        .array(z.object({
        topicName: z.string().min(1).max(512),
        subtopicName: z.string().max(4000).optional().nullable(),
        hours: z.number().positive().max(8),
    }))
        .min(2)
        .max(8),
});
export const calendarSchema = z.object({
    academicYearId: z.number().int().positive(),
    semesterId: z.number().int().positive().optional().nullable(),
    name: z.string().min(1).max(255),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    workingWeekdays: z.string().max(32).optional(),
    isDefault: z.boolean().optional(),
});
export const exceptionSchema = z.object({
    exceptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    exceptionType: z.enum(CALENDAR_EXCEPTION_TYPES),
    label: z.string().max(255).optional().nullable(),
});
function num(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}
async function loadSlots(planId) {
    const rows = await db('lesson_plan_teaching_slots').where({ plan_id: planId }).orderBy('sort_order');
    return rows.map((r) => ({
        weekday: Number(r.weekday),
        startTime: String(r.start_time).slice(0, 5),
        endTime: String(r.end_time).slice(0, 5),
        hours: num(r.hours, 1),
    }));
}
async function loadCalendar(calendarId, collegeId, yearId, semesterId) {
    let calendar = calendarId
        ? await db('academic_calendars').where({ id: calendarId, college_id: collegeId }).first()
        : null;
    if (!calendar && yearId) {
        calendar = await db('academic_calendars')
            .where({ college_id: collegeId, academic_year_id: yearId })
            .modify((q) => {
            if (semesterId)
                q.andWhere((inner) => inner.where({ semester_id: semesterId }).orWhereNull('semester_id'));
        })
            .orderBy('is_default', 'desc')
            .first();
    }
    if (!calendar) {
        calendar = await db('academic_calendars')
            .where({ college_id: collegeId, is_default: true })
            .orderBy('id', 'desc')
            .first();
    }
    if (!calendar) {
        const year = yearId
            ? await db('academic_years').where({ id: yearId, college_id: collegeId }).first()
            : await db('academic_years').where({ college_id: collegeId, is_current: true }).first();
        if (!year)
            throw new AppError(400, 'Set an academic year and calendar before generating a lesson plan.');
        const [id] = await db('academic_calendars').insert({
            college_id: collegeId,
            academic_year_id: year.id,
            semester_id: semesterId ?? null,
            name: `Default calendar ${year.label}`,
            start_date: '2026-08-17',
            end_date: '2026-12-18',
            working_weekdays: '1,2,3,4,5,6',
            is_default: true,
        });
        calendar = await db('academic_calendars').where({ id }).first();
    }
    if (!calendar)
        throw new AppError(400, 'Set an academic calendar before generating a lesson plan.');
    const exceptions = await db('academic_calendar_exceptions')
        .where({ calendar_id: calendar.id })
        .select('exception_date', 'exception_type', 'label');
    return {
        id: Number(calendar.id),
        name: String(calendar.name),
        startDate: sqlDate(calendar.start_date),
        endDate: sqlDate(calendar.end_date),
        blockedDates: exceptions.map((e) => sqlDate(e.exception_date)),
        exceptions: exceptions.map((e) => ({
            date: sqlDate(e.exception_date),
            type: String(e.exception_type),
            label: e.label,
        })),
    };
}
async function periodsForPlan(plan, slots) {
    const calendar = await loadCalendar(plan.calendar_id ? Number(plan.calendar_id) : null, Number(plan.college_id), plan.academic_year_id ? Number(plan.academic_year_id) : null, plan.semester_id ? Number(plan.semester_id) : null);
    const teachingSlots = slots ?? (await loadSlots(Number(plan.id)));
    return enumeratePeriods({
        startDate: calendar.startDate,
        endDate: calendar.endDate,
        slots: teachingSlots,
        blockedDates: calendar.blockedDates,
    });
}
function holidayConflicts(entries, blocked) {
    return entries.filter((e) => e.actualDate &&
        blocked.has(e.actualDate) &&
        e.status !== 'COMPLETED' &&
        e.status !== 'SKIPPED').length;
}
function mapEntry(row) {
    const plannedDate = sqlDate(row.planned_date);
    const actualDate = sqlDate(row.actual_date);
    const plannedHours = num(row.planned_hours, 1);
    const actualHours = row.actual_hours == null ? plannedHours : num(row.actual_hours);
    const dateChanged = Boolean(plannedDate && actualDate && plannedDate !== actualDate);
    const hoursChanged = actualHours !== plannedHours;
    return {
        id: Number(row.id),
        serialNo: Number(row.serial_no),
        moduleId: row.module_id == null ? null : Number(row.module_id),
        moduleLabel: row.module_label == null ? null : String(row.module_label),
        moduleName: row.module_name == null ? null : String(row.module_name),
        topicId: row.topic_id == null ? null : Number(row.topic_id),
        topicName: String(row.topic_name),
        subtopicId: row.subtopic_id == null ? null : Number(row.subtopic_id),
        subtopicName: row.subtopic_name ?? null,
        plannedDate,
        actualDate,
        displayDate: dateChanged ? `${plannedDate} → ${actualDate}` : actualDate,
        dateChanged,
        plannedHours,
        actualHours,
        hoursChanged,
        status: dateChanged && row.status === 'PLANNED' ? 'RESCHEDULED' : String(row.status),
        remarks: row.remarks == null ? null : String(row.remarks),
        teachingMethod: row.teaching_method == null ? null : String(row.teaching_method),
        rescheduleReason: row.reschedule_reason == null ? null : String(row.reschedule_reason),
        isSupplementary: !!row.is_supplementary,
        isFacultyAdded: !!row.is_faculty_added,
        sortOrder: Number(row.sort_order),
        completedAt: row.completed_at ?? null,
    };
}
async function loadPlanRow(planId, collegeId) {
    const plan = await db('faculty_lesson_plans as p')
        .leftJoin('courses as c', 'c.id', 'p.course_id')
        .leftJoin('departments as d', 'd.id', 'p.department_id')
        .leftJoin('programs as pr', 'pr.id', 'p.program_id')
        .leftJoin('academic_years as y', 'y.id', 'p.academic_year_id')
        .leftJoin('semesters as s', 's.id', 'p.semester_id')
        .leftJoin('class_sections as cs', 'cs.id', 'p.class_section_id')
        .leftJoin('faculty_users as f', 'f.id', 'p.created_by')
        .leftJoin('colleges as col', 'col.id', 'p.college_id')
        .where({ 'p.id': planId, 'p.college_id': collegeId })
        .select('p.*', 'c.name as course_name', 'c.code as course_code', 'd.name as department_name', 'pr.name as program_name', 'y.label as academic_year_label', 's.label as semester_label', 'cs.label as section_label', 'f.name as faculty_name', 'col.name as college_name', 'col.logo_url as college_logo_url')
        .first();
    if (!plan)
        throw new AppError(404, 'Lesson plan not found');
    return plan;
}
async function entriesFor(planId) {
    const rows = await db('lesson_plan_entries').where({ plan_id: planId }).orderBy('sort_order').orderBy('serial_no');
    return rows.map(mapEntry);
}
async function renumber(planId, trx = db) {
    const rows = await trx('lesson_plan_entries').where({ plan_id: planId }).orderBy('sort_order').orderBy('id');
    let n = 1;
    for (const row of rows) {
        await trx('lesson_plan_entries').where({ id: row.id }).update({ serial_no: n, sort_order: n });
        n += 1;
    }
}
function assertMutable(entry, action) {
    if (entry.status === 'COMPLETED') {
        throw new AppError(400, `Completed lessons cannot be ${action} silently. Correct the history explicitly.`, undefined, 'HISTORY_PROTECTED');
    }
}
export async function catalog(collegeId) {
    const courses = await db('courses as c')
        .leftJoin('subject_modules as m', function join() {
        this.on('m.course_id', '=', 'c.id').andOn('m.college_id', '=', 'c.college_id');
    })
        .leftJoin('lesson_topics as t', 't.module_id', 'm.id')
        .leftJoin('lesson_subtopics as s', 's.topic_id', 't.id')
        .where('c.college_id', collegeId)
        .groupBy('c.id', 'c.name', 'c.code')
        .select('c.id as courseId', 'c.name as courseName', 'c.code as courseCode', db.raw('count(distinct m.id) as moduleCount'), db.raw('count(distinct t.id) as topicCount'), db.raw('count(distinct s.id) as subtopicCount'), db.raw('coalesce(sum(s.suggested_hours), 0) as hours'));
    return {
        subjects: courses
            .map((c) => ({
            courseId: Number(c.courseId),
            courseName: String(c.courseName),
            courseCode: String(c.courseCode),
            moduleCount: num(c.moduleCount),
            topicCount: num(c.topicCount),
            subtopicCount: num(c.subtopicCount),
            hours: num(c.hours),
        }))
            .filter((c) => c.subtopicCount > 0),
    };
}
export async function catalogSubject(collegeId, courseId) {
    const course = await db('courses').where({ id: courseId, college_id: collegeId }).first();
    if (!course)
        throw new AppError(404, 'Subject not found');
    const modules = await db('subject_modules').where({ college_id: collegeId, course_id: courseId }).orderBy('sort_order');
    const topics = await db('lesson_topics').where({ college_id: collegeId, course_id: courseId }).orderBy('sort_order');
    const subtopics = await db('lesson_subtopics')
        .where({ college_id: collegeId })
        .whereIn('topic_id', topics.map((t) => t.id))
        .orderBy('sort_order');
    const byTopic = new Map();
    for (const s of subtopics) {
        const list = byTopic.get(Number(s.topic_id)) ?? [];
        list.push(s);
        byTopic.set(Number(s.topic_id), list);
    }
    const topicsByModule = new Map();
    for (const t of topics) {
        const list = topicsByModule.get(Number(t.module_id)) ?? [];
        list.push(t);
        topicsByModule.set(Number(t.module_id), list);
    }
    return {
        course: { id: course.id, name: course.name, code: course.code },
        moduleCount: modules.length,
        topicCount: topics.length,
        subtopicCount: subtopics.length,
        hours: subtopics.reduce((sum, s) => sum + num(s.suggested_hours), 0),
        modules: modules.map((m) => {
            const moduleTopics = topicsByModule.get(Number(m.id)) ?? [];
            const moduleSubs = moduleTopics.flatMap((t) => byTopic.get(Number(t.id)) ?? []);
            return {
                id: Number(m.id),
                name: String(m.name),
                unitKind: m.unit_kind ?? (String(m.name).toLowerCase().startsWith('unit') ? 'UNIT' : 'MODULE'),
                sortOrder: Number(m.sort_order),
                topicCount: moduleTopics.length,
                subtopicCount: moduleSubs.length,
                hours: moduleSubs.reduce((sum, s) => sum + num(s.suggested_hours), 0),
                topics: moduleTopics.map((t) => ({
                    id: Number(t.id),
                    name: String(t.name),
                    sortOrder: Number(t.sort_order),
                    subtopics: (byTopic.get(Number(t.id)) ?? []).map((s) => ({
                        id: Number(s.id),
                        name: String(s.name),
                        hours: num(s.suggested_hours, 1),
                        hoursSource: s.hours_source,
                        classification: s.classification,
                        sourceReference: s.source_reference,
                    })),
                })),
            };
        }),
    };
}
export async function listPlans(collegeId, opts = {}) {
    const q = db('faculty_lesson_plans as p')
        .leftJoin('courses as c', 'c.id', 'p.course_id')
        .leftJoin('class_sections as cs', 'cs.id', 'p.class_section_id')
        .leftJoin('academic_years as y', 'y.id', 'p.academic_year_id')
        .leftJoin('semesters as s', 's.id', 'p.semester_id')
        .leftJoin('faculty_users as f', 'f.id', 'p.created_by')
        .leftJoin('departments as d', 'd.id', 'p.department_id')
        .where('p.college_id', collegeId)
        .select('p.id', 'p.title', 'p.status', 'p.required_hours', 'p.available_hours', 'p.shortfall_hours', 'p.updated_at as updatedAt', 'p.created_by as createdBy', 'c.name as courseName', 'c.code as courseCode', 'cs.label as sectionLabel', 'y.label as academicYearLabel', 's.label as semesterLabel', 'f.name as facultyName', 'd.name as departmentName')
        .orderBy('p.updated_at', 'desc');
    if (opts.createdBy)
        q.andWhere('p.created_by', opts.createdBy);
    if (opts.facultyId)
        q.andWhere('p.created_by', opts.facultyId);
    if (opts.status)
        q.andWhere('p.status', opts.status);
    if (opts.courseId)
        q.andWhere('p.course_id', opts.courseId);
    if (opts.departmentId)
        q.andWhere('p.department_id', opts.departmentId);
    if (opts.semesterId)
        q.andWhere('p.semester_id', opts.semesterId);
    if (opts.sectionId)
        q.andWhere('p.class_section_id', opts.sectionId);
    const plans = await q;
    const ids = plans.map((p) => p.id);
    const entryRows = ids.length
        ? await db('lesson_plan_entries').whereIn('plan_id', ids).select('plan_id', 'status', 'planned_hours', 'actual_hours', 'planned_date', 'actual_date', 'module_id', 'module_label', 'module_name')
        : [];
    const byPlan = new Map();
    for (const row of entryRows) {
        const list = byPlan.get(Number(row.plan_id)) ?? [];
        list.push(row);
        byPlan.set(Number(row.plan_id), list);
    }
    const today = todayISO();
    return plans.map((p) => {
        const entries = (byPlan.get(Number(p.id)) ?? []).map((e) => ({
            status: String(e.status),
            plannedDate: sqlDate(e.planned_date),
            actualDate: sqlDate(e.actual_date),
            plannedHours: num(e.planned_hours, 1),
            actualHours: e.actual_hours == null ? null : num(e.actual_hours),
            moduleId: e.module_id == null ? null : Number(e.module_id),
            moduleLabel: e.module_label,
            moduleName: e.module_name,
        }));
        const progress = computePlanProgress(entries, today);
        return {
            id: Number(p.id),
            title: p.title,
            status: p.status,
            courseName: p.courseName,
            courseCode: p.courseCode,
            sectionLabel: p.sectionLabel,
            academicYearLabel: p.academicYearLabel,
            semesterLabel: p.semesterLabel,
            facultyName: p.facultyName,
            departmentName: p.departmentName,
            requiredHours: num(p.required_hours),
            availableHours: num(p.available_hours),
            shortfallHours: num(p.shortfall_hours),
            updatedAt: p.updatedAt,
            createdBy: Number(p.createdBy),
            progress,
        };
    });
}
export async function todayLessons(collegeId, facultyId, today = todayISO()) {
    const rows = await db('lesson_plan_entries as e')
        .join('faculty_lesson_plans as p', 'p.id', 'e.plan_id')
        .leftJoin('courses as c', 'c.id', 'p.course_id')
        .leftJoin('class_sections as cs', 'cs.id', 'p.class_section_id')
        .leftJoin('lesson_plan_teaching_slots as sl', function join() {
        this.on('sl.plan_id', '=', 'p.id');
    })
        .where({ 'p.college_id': collegeId, 'p.created_by': facultyId })
        .whereIn('p.status', ['DRAFT', 'ACTIVE'])
        .where('e.actual_date', today)
        .whereNotIn('e.status', ['COMPLETED', 'SKIPPED'])
        .select('e.id as entryId', 'e.plan_id as planId', 'e.topic_name as topicName', 'e.subtopic_name as subtopicName', 'e.module_label as moduleLabel', 'e.module_name as moduleName', 'e.planned_hours as plannedHours', 'e.actual_date as actualDate', 'c.name as courseName', 'cs.label as sectionLabel')
        .groupBy('e.id', 'e.plan_id', 'e.topic_name', 'e.subtopic_name', 'e.module_label', 'e.module_name', 'e.planned_hours', 'e.actual_date', 'c.name', 'cs.label');
    const slots = await db('lesson_plan_teaching_slots as sl')
        .join('faculty_lesson_plans as p', 'p.id', 'sl.plan_id')
        .where({ 'p.college_id': collegeId, 'p.created_by': facultyId });
    const weekday = weekdayOf(today);
    return rows.map((r) => {
        const planSlots = slots
            .filter((s) => Number(s.plan_id) === Number(r.planId) && Number(s.weekday) === weekday)
            .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
        const slot = planSlots[0];
        return {
            entryId: Number(r.entryId),
            planId: Number(r.planId),
            courseName: r.courseName,
            sectionLabel: r.sectionLabel,
            moduleLabel: r.moduleLabel,
            moduleName: r.moduleName,
            topicName: r.topicName,
            subtopicName: r.subtopicName,
            hours: num(r.plannedHours, 1),
            actualDate: sqlDate(r.actualDate),
            startTime: slot ? String(slot.start_time).slice(0, 5) : null,
            endTime: slot ? String(slot.end_time).slice(0, 5) : null,
        };
    });
}
export async function getPlan(planId, collegeId) {
    const plan = await loadPlanRow(planId, collegeId);
    const entries = await entriesFor(planId);
    const slots = await loadSlots(planId);
    const calendar = await loadCalendar(plan.calendar_id ? Number(plan.calendar_id) : null, collegeId, plan.academic_year_id ? Number(plan.academic_year_id) : null, plan.semester_id ? Number(plan.semester_id) : null).catch(() => null);
    const blocked = new Set(calendar?.blockedDates ?? []);
    const progress = computePlanProgress(entries, todayISO());
    const audit = await listLessonAudit(planId, collegeId);
    return {
        plan: {
            id: Number(plan.id),
            title: plan.title,
            status: plan.status,
            courseId: Number(plan.course_id),
            courseName: plan.course_name,
            courseCode: plan.course_code,
            departmentName: plan.department_name,
            programName: plan.program_name,
            academicYearLabel: plan.academic_year_label,
            semesterLabel: plan.semester_label,
            sectionLabel: plan.section_label,
            facultyName: plan.faculty_name,
            collegeName: plan.college_name,
            collegeLogoUrl: plan.college_logo_url ?? null,
            includeSupplementary: !!plan.include_supplementary,
            continuedWithShortfall: !!plan.continued_with_shortfall,
            requiredHours: num(plan.required_hours),
            availableHours: num(plan.available_hours),
            shortfallHours: num(plan.shortfall_hours),
            generatedAt: plan.generated_at,
            updatedAt: plan.updated_at,
            holidayConflicts: holidayConflicts(entries, blocked),
        },
        slots,
        calendar,
        progress,
        entries,
        audit,
    };
}
async function masterRows(collegeId, courseId, includeSupplementary) {
    const q = db('lesson_subtopics as s')
        .join('lesson_topics as t', 't.id', 's.topic_id')
        .join('subject_modules as m', 'm.id', 't.module_id')
        .where({ 't.college_id': collegeId, 't.course_id': courseId })
        .orderBy('m.sort_order')
        .orderBy('t.sort_order')
        .orderBy('s.sort_order')
        .orderBy('s.original_order')
        .select('s.id as subtopicId', 's.name as subtopicName', 's.suggested_hours as hours', 's.classification', 't.id as topicId', 't.name as topicName', 'm.id as moduleId', 'm.name as moduleName', 'm.unit_kind as unitKind', 'm.sort_order as moduleOrder');
    if (!includeSupplementary)
        q.andWhere('s.classification', 'CORE');
    return q;
}
export async function previewGenerate(collegeId, body) {
    for (const slot of body.teachingSlots) {
        const err = validateSlot(slot);
        if (err)
            throw new AppError(400, err);
    }
    const content = await catalogSubject(collegeId, body.courseId);
    if (!content.subtopicCount)
        throw new AppError(400, 'No imported lesson-plan content exists for this subject.');
    const calendar = await loadCalendar(body.calendarId ?? null, collegeId, body.academicYearId, body.semesterId);
    const periods = enumeratePeriods({
        startDate: calendar.startDate,
        endDate: calendar.endDate,
        slots: body.teachingSlots,
        blockedDates: calendar.blockedDates,
    });
    const rows = await masterRows(collegeId, body.courseId, body.includeSupplementary);
    const result = scheduleEntries(rows.map((r, i) => ({ key: String(i), hours: num(r.hours, 1) })), periods, { allowShortfall: body.continueWithShortfall });
    return {
        content,
        calendar,
        requiredHours: rows.reduce((sum, r) => sum + num(r.hours, 1), 0),
        availableHours: periods.reduce((sum, p) => sum + p.hours, 0),
        result,
    };
}
export async function createAndGenerate(collegeId, facultyId, body) {
    const preview = await previewGenerate(collegeId, body);
    if (!preview.result.ok) {
        throw new AppError(409, 'Available teaching periods are not enough for this lesson plan.', {
            requiredHours: preview.result.requiredHours,
            availableHours: preview.result.availableHours,
            shortfallHours: preview.result.shortfallHours,
        }, 'SCHEDULE_SHORTFALL');
    }
    const generated = preview.result;
    const course = await db('courses').where({ id: body.courseId, college_id: collegeId }).first();
    if (!course)
        throw new AppError(404, 'Subject not found');
    const year = await db('academic_years').where({ id: body.academicYearId, college_id: collegeId }).first();
    const section = body.classSectionId
        ? await db('class_sections').where({ id: body.classSectionId, college_id: collegeId }).first()
        : null;
    const title = [course.name, section ? `Section ${section.label}` : null, year?.label].filter(Boolean).join(' · ');
    const rows = await masterRows(collegeId, body.courseId, body.includeSupplementary);
    return db.transaction(async (trx) => {
        const [planId] = await trx('faculty_lesson_plans').insert({
            college_id: collegeId,
            created_by: facultyId,
            course_id: body.courseId,
            academic_year_id: body.academicYearId,
            semester_id: body.semesterId ?? null,
            department_id: body.departmentId ?? null,
            program_id: body.programId ?? null,
            class_section_id: body.classSectionId ?? null,
            calendar_id: preview.calendar.id,
            title,
            status: 'ACTIVE',
            include_supplementary: body.includeSupplementary,
            continued_with_shortfall: Boolean(body.continueWithShortfall && generated.shortfallHours > 0),
            required_hours: generated.requiredHours,
            available_hours: generated.availableHours,
            shortfall_hours: generated.shortfallHours,
            generated_at: trx.fn.now(),
            activated_at: trx.fn.now(),
        });
        for (const [i, slot] of body.teachingSlots.entries()) {
            await trx('lesson_plan_teaching_slots').insert({
                plan_id: planId,
                weekday: slot.weekday,
                start_time: slot.startTime,
                end_time: slot.endTime,
                hours: slot.hours,
                sort_order: i,
            });
        }
        const scheduled = generated.scheduled;
        const payload = rows.map((row, i) => {
            const date = scheduled[i]?.plannedDate ?? null;
            const unitKind = String(row.unitKind || 'MODULE');
            const moduleOrder = Number(row.moduleOrder);
            return {
                plan_id: planId,
                serial_no: i + 1,
                module_id: Number(row.moduleId),
                module_label: `${unitKind === 'UNIT' ? 'Unit' : 'Module'} ${moduleOrder}`,
                module_name: String(row.moduleName).replace(/^(Module|Unit)\s+\d+\s+[—-]\s+/i, ''),
                topic_id: Number(row.topicId),
                topic_name: String(row.topicName),
                subtopic_id: Number(row.subtopicId),
                subtopic_name: String(row.subtopicName),
                planned_date: date,
                actual_date: date,
                planned_hours: num(row.hours, 1),
                actual_hours: num(row.hours, 1),
                status: 'PLANNED',
                is_supplementary: String(row.classification) === 'SUPPLEMENTARY',
                is_faculty_added: false,
                sort_order: i + 1,
            };
        });
        if (payload.length) {
            for (let i = 0; i < payload.length; i += 100) {
                await trx('lesson_plan_entries').insert(payload.slice(i, i + 100));
            }
        }
        return { id: Number(planId), scheduled, entryCount: payload.length };
    }).then(async (created) => {
        await recordLessonAudit({
            collegeId,
            planId: created.id,
            actorId: facultyId,
            action: 'CREATED',
            metadata: { title, entries: created.entryCount },
        });
        await recordLessonAudit({
            collegeId,
            planId: created.id,
            actorId: facultyId,
            action: 'GENERATED',
            metadata: {
                requiredHours: generated.requiredHours,
                availableHours: generated.availableHours,
                firstDate: created.scheduled[0]?.plannedDate,
                lastDate: created.scheduled.at(-1)?.plannedDate,
            },
        });
        return { id: created.id };
    });
}
export async function completeEntry(planId, entryId, collegeId, actorId, body) {
    const entry = await db('lesson_plan_entries').where({ id: entryId, plan_id: planId }).first();
    if (!entry)
        throw new AppError(404, 'Lesson entry not found');
    const actualDate = body.actualDate ?? sqlDate(entry.actual_date);
    const actualHours = body.actualHours ?? num(entry.actual_hours ?? entry.planned_hours, 1);
    await db('lesson_plan_entries').where({ id: entryId }).update({
        status: 'COMPLETED',
        actual_date: actualDate,
        actual_hours: actualHours,
        remarks: body.remarks ?? entry.remarks,
        completed_at: db.fn.now(),
        completed_by: actorId,
    });
    await recordLessonAudit({
        collegeId,
        planId,
        actorId,
        action: 'LESSON_COMPLETED',
        metadata: { entryId, actualDate, actualHours },
    });
    return getPlan(planId, collegeId);
}
export async function rescheduleEntry(planId, entryId, collegeId, actorId, body) {
    const plan = await db('faculty_lesson_plans').where({ id: planId, college_id: collegeId }).first();
    if (!plan)
        throw new AppError(404, 'Lesson plan not found');
    const periods = await periodsForPlan(plan);
    if (!isValidTeachingDate(body.actualDate, periods)) {
        throw new AppError(400, 'That date is not a valid teaching day for this plan.');
    }
    const entries = await db('lesson_plan_entries').where({ plan_id: planId }).orderBy('sort_order');
    const current = entries.find((e) => Number(e.id) === entryId);
    if (!current)
        throw new AppError(404, 'Lesson entry not found');
    assertMutable({ status: String(current.status) }, 'rescheduled');
    if (body.mode === 'THIS_ONLY') {
        const planned = sqlDate(current.planned_date);
        await db('lesson_plan_entries').where({ id: entryId }).update({
            actual_date: body.actualDate,
            status: planned && planned !== body.actualDate ? 'RESCHEDULED' : 'PLANNED',
            reschedule_reason: body.reason ?? null,
        });
        await recordLessonAudit({
            collegeId,
            planId,
            actorId,
            action: 'RESCHEDULED',
            metadata: { entryId, from: sqlDate(current.actual_date), to: body.actualDate, mode: body.mode },
        });
        return getPlan(planId, collegeId);
    }
    const startIndex = entries.findIndex((e) => Number(e.id) === entryId);
    const movable = entries
        .slice(startIndex)
        .filter((e) => String(e.status) !== 'COMPLETED' && String(e.status) !== 'SKIPPED');
    const futurePeriods = periodsFromDate(periods, body.actualDate, { includeFromDate: true });
    const result = scheduleEntries(movable.map((e) => ({ key: String(e.id), hours: num(e.planned_hours, 1) })), futurePeriods, { allowShortfall: true });
    if (!result.ok)
        throw new AppError(409, 'Not enough remaining teaching days to shift the schedule.', result, 'SCHEDULE_SHORTFALL');
    await db.transaction(async (trx) => {
        for (const item of result.scheduled) {
            const row = movable.find((e) => String(e.id) === item.key);
            if (!row)
                continue;
            const planned = sqlDate(row.planned_date);
            await trx('lesson_plan_entries').where({ id: row.id }).update({
                actual_date: item.actualDate,
                status: planned && planned !== item.actualDate ? 'RESCHEDULED' : String(row.status) === 'COMPLETED' ? 'COMPLETED' : 'PLANNED',
                reschedule_reason: Number(row.id) === entryId ? body.reason ?? row.reschedule_reason : row.reschedule_reason,
            });
        }
    });
    await recordLessonAudit({
        collegeId,
        planId,
        actorId,
        action: 'FUTURE_SCHEDULE_SHIFTED',
        metadata: { fromEntryId: entryId, to: body.actualDate, shifted: result.scheduled.length },
    });
    return getPlan(planId, collegeId);
}
export async function skipEntry(planId, entryId, collegeId, actorId, remarks) {
    const entry = await db('lesson_plan_entries').where({ id: entryId, plan_id: planId }).first();
    if (!entry)
        throw new AppError(404, 'Lesson entry not found');
    assertMutable({ status: String(entry.status) }, 'skipped');
    await db('lesson_plan_entries').where({ id: entryId }).update({
        status: 'SKIPPED',
        remarks: remarks ?? entry.remarks,
    });
    await recordLessonAudit({ collegeId, planId, actorId, action: 'LESSON_SKIPPED', metadata: { entryId } });
    return getPlan(planId, collegeId);
}
export async function editEntry(planId, entryId, collegeId, actorId, body) {
    const entry = await db('lesson_plan_entries').where({ id: entryId, plan_id: planId }).first();
    if (!entry)
        throw new AppError(404, 'Lesson entry not found');
    if (entry.status === 'COMPLETED') {
        await db('lesson_plan_entries').where({ id: entryId }).update({
            remarks: body.remarks ?? entry.remarks,
            actual_hours: body.plannedHours ?? entry.actual_hours,
        });
        await recordLessonAudit({
            collegeId,
            planId,
            actorId,
            action: 'COMPLETED_ENTRY_CORRECTED',
            metadata: { entryId },
        });
        return getPlan(planId, collegeId);
    }
    await db('lesson_plan_entries').where({ id: entryId }).update({
        topic_name: body.topicName ?? entry.topic_name,
        subtopic_name: body.subtopicName === undefined ? entry.subtopic_name : body.subtopicName,
        planned_hours: body.plannedHours ?? entry.planned_hours,
        actual_hours: body.plannedHours ?? entry.actual_hours,
        remarks: body.remarks ?? entry.remarks,
        teaching_method: body.teachingMethod ?? entry.teaching_method,
    });
    await recordLessonAudit({ collegeId, planId, actorId, action: 'TOPIC_EDITED', metadata: { entryId } });
    if (body.plannedHours && body.plannedHours !== num(entry.planned_hours)) {
        return rescheduleEntry(planId, entryId, collegeId, actorId, {
            actualDate: sqlDate(entry.actual_date),
            mode: 'SHIFT_SUBSEQUENT',
        });
    }
    return getPlan(planId, collegeId);
}
export async function addEntry(planId, collegeId, actorId, body) {
    const plan = await db('faculty_lesson_plans').where({ id: planId, college_id: collegeId }).first();
    if (!plan)
        throw new AppError(404, 'Lesson plan not found');
    const entries = await db('lesson_plan_entries').where({ plan_id: planId }).orderBy('sort_order');
    const after = body.afterEntryId ? entries.find((e) => Number(e.id) === body.afterEntryId) : entries.at(-1);
    const sort = after ? Number(after.sort_order) + 1 : entries.length + 1;
    let module = after;
    if (body.moduleId) {
        const m = await db('subject_modules').where({ id: body.moduleId, college_id: collegeId }).first();
        if (m) {
            module = {
                ...after,
                module_id: m.id,
                module_name: m.name,
                module_label: `${m.unit_kind === 'UNIT' ? 'Unit' : 'Module'} ${m.sort_order}`,
            };
        }
    }
    await db.transaction(async (trx) => {
        await trx('lesson_plan_entries').where({ plan_id: planId }).andWhere('sort_order', '>=', sort).increment('sort_order', 1);
        await trx('lesson_plan_entries').insert({
            plan_id: planId,
            serial_no: sort,
            module_id: module?.module_id ?? null,
            module_label: module?.module_label ?? null,
            module_name: module?.module_name ?? null,
            topic_name: body.topicName,
            subtopic_name: body.subtopicName ?? null,
            planned_hours: body.hours,
            actual_hours: body.hours,
            status: 'PLANNED',
            is_supplementary: body.isSupplementary,
            is_faculty_added: true,
            sort_order: sort,
        });
        await renumber(planId, trx);
    });
    const inserted = await db('lesson_plan_entries').where({ plan_id: planId, sort_order: sort }).first();
    await recordLessonAudit({ collegeId, planId, actorId, action: 'TOPIC_ADDED', metadata: { topic: body.topicName } });
    if (inserted?.id && sqlDate(after?.actual_date)) {
        return rescheduleEntry(planId, Number(inserted.id), collegeId, actorId, {
            actualDate: sqlDate(after?.actual_date),
            mode: 'SHIFT_SUBSEQUENT',
        });
    }
    return getPlan(planId, collegeId);
}
export async function splitEntry(planId, entryId, collegeId, actorId, body) {
    const entry = await db('lesson_plan_entries').where({ id: entryId, plan_id: planId }).first();
    if (!entry)
        throw new AppError(404, 'Lesson entry not found');
    assertMutable({ status: String(entry.status) }, 'split');
    const sum = body.parts.reduce((s, p) => s + p.hours, 0);
    if (Math.abs(sum - num(entry.planned_hours, 1)) > 0.05) {
        throw new AppError(400, 'Split hours must add up to the original planned hours.');
    }
    await db.transaction(async (trx) => {
        const first = body.parts[0];
        await trx('lesson_plan_entries').where({ id: entryId }).update({
            topic_name: first.topicName,
            subtopic_name: first.subtopicName ?? entry.subtopic_name,
            planned_hours: first.hours,
            actual_hours: first.hours,
        });
        let sort = Number(entry.sort_order);
        for (const part of body.parts.slice(1)) {
            sort += 1;
            await trx('lesson_plan_entries').where({ plan_id: planId }).andWhere('sort_order', '>=', sort).increment('sort_order', 1);
            await trx('lesson_plan_entries').insert({
                plan_id: planId,
                serial_no: sort,
                module_id: entry.module_id,
                module_label: entry.module_label,
                module_name: entry.module_name,
                topic_name: part.topicName,
                subtopic_name: part.subtopicName ?? null,
                planned_date: entry.planned_date,
                actual_date: entry.actual_date,
                planned_hours: part.hours,
                actual_hours: part.hours,
                status: 'PLANNED',
                is_supplementary: entry.is_supplementary,
                is_faculty_added: true,
                split_from_entry_id: entryId,
                sort_order: sort,
            });
        }
        await renumber(planId, trx);
    });
    await recordLessonAudit({ collegeId, planId, actorId, action: 'TOPIC_SPLIT', metadata: { entryId, parts: body.parts.length } });
    return rescheduleEntry(planId, entryId, collegeId, actorId, {
        actualDate: sqlDate(entry.actual_date),
        mode: 'SHIFT_SUBSEQUENT',
    });
}
export async function mergeEntries(planId, entryId, otherId, collegeId, actorId) {
    const a = await db('lesson_plan_entries').where({ id: entryId, plan_id: planId }).first();
    const b = await db('lesson_plan_entries').where({ id: otherId, plan_id: planId }).first();
    if (!a || !b)
        throw new AppError(404, 'Lesson entry not found');
    assertMutable({ status: String(a.status) }, 'merged');
    assertMutable({ status: String(b.status) }, 'merged');
    const [first, second] = Number(a.sort_order) <= Number(b.sort_order) ? [a, b] : [b, a];
    if (Math.abs(Number(first.sort_order) - Number(second.sort_order)) !== 1) {
        throw new AppError(400, 'Only adjacent entries can be merged.');
    }
    await db.transaction(async (trx) => {
        await trx('lesson_plan_entries').where({ id: first.id }).update({
            topic_name: first.topic_name === second.topic_name ? first.topic_name : `${first.topic_name} / ${second.topic_name}`,
            subtopic_name: [first.subtopic_name, second.subtopic_name].filter(Boolean).join(' & '),
            planned_hours: num(first.planned_hours) + num(second.planned_hours),
            actual_hours: num(first.actual_hours ?? first.planned_hours) + num(second.actual_hours ?? second.planned_hours),
        });
        await trx('lesson_plan_entries').where({ id: second.id }).del();
        await renumber(planId, trx);
    });
    await recordLessonAudit({ collegeId, planId, actorId, action: 'TOPIC_MERGED', metadata: { kept: first.id, removed: second.id } });
    return rescheduleEntry(planId, Number(first.id), collegeId, actorId, {
        actualDate: sqlDate(first.actual_date),
        mode: 'SHIFT_SUBSEQUENT',
    });
}
export async function moveEntry(planId, entryId, collegeId, actorId, direction) {
    const entries = await db('lesson_plan_entries').where({ plan_id: planId }).orderBy('sort_order');
    const index = entries.findIndex((e) => Number(e.id) === entryId);
    if (index < 0)
        throw new AppError(404, 'Lesson entry not found');
    const current = entries[index];
    assertMutable({ status: String(current.status) }, 'reordered');
    const swapWith = direction === 'up' ? entries[index - 1] : entries[index + 1];
    if (!swapWith)
        return getPlan(planId, collegeId);
    if (String(swapWith.status) === 'COMPLETED') {
        throw new AppError(400, 'Completed history cannot be reordered.');
    }
    await db.transaction(async (trx) => {
        await trx('lesson_plan_entries').where({ id: current.id }).update({ sort_order: Number(swapWith.sort_order) });
        await trx('lesson_plan_entries').where({ id: swapWith.id }).update({ sort_order: Number(current.sort_order) });
        await renumber(planId, trx);
    });
    await recordLessonAudit({ collegeId, planId, actorId, action: 'TOPIC_REORDERED', metadata: { entryId, direction } });
    const updated = await db('lesson_plan_entries').where({ id: entryId }).first();
    return rescheduleEntry(planId, entryId, collegeId, actorId, {
        actualDate: sqlDate(updated?.actual_date),
        mode: 'SHIFT_SUBSEQUENT',
    });
}
export async function archivePlan(planId, collegeId, actorId) {
    await db('faculty_lesson_plans').where({ id: planId, college_id: collegeId }).update({
        status: 'ARCHIVED',
        archived_at: db.fn.now(),
    });
    await recordLessonAudit({ collegeId, planId, actorId, action: 'ARCHIVED' });
    return getPlan(planId, collegeId);
}
export async function deletePlan(planId, collegeId, actorId) {
    const plan = await db('faculty_lesson_plans').where({ id: planId, college_id: collegeId }).first();
    if (!plan)
        throw new AppError(404, 'Lesson plan not found');
    await recordLessonAudit({ collegeId, planId, actorId, action: 'DELETED', metadata: { title: plan.title } });
    await db('faculty_lesson_plans').where({ id: planId, college_id: collegeId }).del();
    return { ok: true };
}
export async function listCalendars(collegeId) {
    const calendars = await db('academic_calendars as c')
        .leftJoin('academic_years as y', 'y.id', 'c.academic_year_id')
        .leftJoin('semesters as s', 's.id', 'c.semester_id')
        .where('c.college_id', collegeId)
        .select('c.*', 'y.label as academic_year_label', 's.label as semester_label')
        .orderBy('c.start_date', 'desc');
    const ids = calendars.map((c) => c.id);
    const exceptions = ids.length
        ? await db('academic_calendar_exceptions').whereIn('calendar_id', ids)
        : [];
    return calendars.map((c) => ({
        id: Number(c.id),
        name: c.name,
        academicYearId: Number(c.academic_year_id),
        academicYearLabel: c.academic_year_label,
        semesterId: c.semester_id ? Number(c.semester_id) : null,
        semesterLabel: c.semester_label,
        startDate: sqlDate(c.start_date),
        endDate: sqlDate(c.end_date),
        workingWeekdays: c.working_weekdays,
        isDefault: !!c.is_default,
        exceptions: exceptions
            .filter((e) => Number(e.calendar_id) === Number(c.id))
            .map((e) => ({
            id: Number(e.id),
            date: sqlDate(e.exception_date),
            type: e.exception_type,
            label: e.label,
        })),
    }));
}
export async function createCalendar(collegeId, body) {
    if (compareISODate(body.startDate, body.endDate) > 0)
        throw new AppError(400, 'Semester end must be after start.');
    const [id] = await db('academic_calendars').insert({
        college_id: collegeId,
        academic_year_id: body.academicYearId,
        semester_id: body.semesterId ?? null,
        name: body.name,
        start_date: body.startDate,
        end_date: body.endDate,
        working_weekdays: body.workingWeekdays ?? '1,2,3,4,5,6',
        is_default: Boolean(body.isDefault),
    });
    return { id: Number(id) };
}
export async function updateCalendar(collegeId, calendarId, body) {
    const calendar = await db('academic_calendars').where({ id: calendarId, college_id: collegeId }).first();
    if (!calendar)
        throw new AppError(404, 'Calendar not found');
    await db('academic_calendars')
        .where({ id: calendarId })
        .update({
        name: body.name ?? calendar.name,
        start_date: body.startDate ?? calendar.start_date,
        end_date: body.endDate ?? calendar.end_date,
        working_weekdays: body.workingWeekdays ?? calendar.working_weekdays,
        is_default: body.isDefault ?? calendar.is_default,
        semester_id: body.semesterId === undefined ? calendar.semester_id : body.semesterId,
    });
    return { id: calendarId };
}
export async function addException(collegeId, calendarId, body) {
    const calendar = await db('academic_calendars').where({ id: calendarId, college_id: collegeId }).first();
    if (!calendar)
        throw new AppError(404, 'Calendar not found');
    const [id] = await db('academic_calendar_exceptions').insert({
        calendar_id: calendarId,
        exception_date: body.exceptionDate,
        exception_type: body.exceptionType,
        label: body.label ?? null,
    });
    const affected = await db('lesson_plan_entries as e')
        .join('faculty_lesson_plans as p', 'p.id', 'e.plan_id')
        .where({ 'p.calendar_id': calendarId, 'e.actual_date': body.exceptionDate })
        .whereNotIn('e.status', ['COMPLETED', 'SKIPPED'])
        .select('p.id as planId');
    const planIds = [...new Set(affected.map((r) => Number(r.planId)))];
    for (const planId of planIds) {
        await recordLessonAudit({
            collegeId,
            planId,
            action: 'HOLIDAY_CONFLICT_FLAGGED',
            metadata: { date: body.exceptionDate, type: body.exceptionType },
        });
    }
    return { id: Number(id), affectedPlans: planIds.length };
}
export async function deleteException(collegeId, calendarId, exceptionId) {
    const calendar = await db('academic_calendars').where({ id: calendarId, college_id: collegeId }).first();
    if (!calendar)
        throw new AppError(404, 'Calendar not found');
    await db('academic_calendar_exceptions').where({ id: exceptionId, calendar_id: calendarId }).del();
    return { ok: true };
}
export async function updateMasterSubtopic(collegeId, subtopicId, body) {
    const row = await db('lesson_subtopics').where({ id: subtopicId, college_id: collegeId }).first();
    if (!row)
        throw new AppError(404, 'Subtopic not found');
    await db('lesson_subtopics')
        .where({ id: subtopicId })
        .update({
        name: body.name ?? row.name,
        suggested_hours: body.suggestedHours ?? row.suggested_hours,
        notes: body.notes === undefined ? row.notes : body.notes,
        classification: body.classification ?? row.classification,
    });
    return { id: subtopicId };
}
export async function audit(action, collegeId, planId, actorId, metadata) {
    await recordLessonAudit({ collegeId, planId, actorId, action, metadata });
}
