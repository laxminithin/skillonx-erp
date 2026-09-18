/**
 * Employee L&D — providers, catalogue courses, programs and sessions.
 */
import { db } from '../../../db/index.js';
import { AppError } from '../../../utils/errors.js';
import { recordHrAudit } from '../audit.js';
import { assertHrPermission, programInCollege, selfEmployee, isApplicable, parseJson } from './access.js';
import { PROGRAM_TRANSITIONS, canTransition } from './types.js';
// ── Providers ────────────────────────────────────────────────────────────────
export async function listProviders(actor) {
    assertHrPermission(actor, 'hr.ld.view');
    return db('ld_providers').where({ college_id: actor.collegeId }).orderBy('name');
}
export async function createProvider(actor, input) {
    assertHrPermission(actor, 'hr.ld.manage');
    const [id] = await db('ld_providers').insert({
        college_id: actor.collegeId,
        name: input.name,
        type: input.type,
        contact: input.contact ?? null,
        website: input.website ?? null,
    });
    await recordHrAudit({ actor, action: 'LD_PROVIDER_CREATED', entityType: 'ld_providers', entityId: id });
    return { id };
}
// ── Catalogue courses ────────────────────────────────────────────────────────
export async function listCourses(actor, filters = {}) {
    assertHrPermission(actor, 'hr.ld.self');
    let q = db('ld_courses').where({ college_id: actor.collegeId });
    if (filters.category)
        q = q.where('category', filters.category);
    if (filters.status)
        q = q.where('status', filters.status);
    else
        q = q.where('status', 'ACTIVE');
    return q.orderBy('title');
}
export async function createCourse(actor, input) {
    assertHrPermission(actor, 'hr.ld.manage');
    const dup = await db('ld_courses').where({ college_id: actor.collegeId, code: input.code }).first();
    if (dup)
        throw new AppError(409, 'A catalogue course with this code already exists');
    const [id] = await db('ld_courses').insert({
        college_id: actor.collegeId,
        code: input.code,
        title: input.title,
        description: input.description ?? null,
        category: input.category,
        provider_type: input.providerType,
        default_delivery_mode: input.defaultDeliveryMode,
        duration_hours: input.durationHours ?? null,
        learning_objectives: input.learningObjectives ?? null,
        target_audience: input.targetAudience ?? null,
        skill_tags: input.skillTags ? JSON.stringify(input.skillTags) : null,
        validity_months: input.validityMonths ?? null,
        is_mandatory_default: input.isMandatoryDefault ?? false,
        created_by: actor.facultyUserId,
    });
    await recordHrAudit({ actor, action: 'LD_COURSE_CREATED', entityType: 'ld_courses', entityId: id });
    return { id };
}
export async function updateCourse(actor, courseId, input) {
    assertHrPermission(actor, 'hr.ld.manage');
    const course = await db('ld_courses').where({ id: courseId, college_id: actor.collegeId }).first();
    if (!course)
        throw new AppError(404, 'Course not found');
    const patch = {};
    if (input.title !== undefined)
        patch.title = input.title;
    if (input.description !== undefined)
        patch.description = input.description;
    if (input.category !== undefined)
        patch.category = input.category;
    if (input.durationHours !== undefined)
        patch.duration_hours = input.durationHours;
    if (input.learningObjectives !== undefined)
        patch.learning_objectives = input.learningObjectives;
    if (input.skillTags !== undefined)
        patch.skill_tags = input.skillTags ? JSON.stringify(input.skillTags) : null;
    if (input.validityMonths !== undefined)
        patch.validity_months = input.validityMonths;
    if (input.isMandatoryDefault !== undefined)
        patch.is_mandatory_default = input.isMandatoryDefault;
    if (Object.keys(patch).length) {
        patch.updated_at = db.fn.now();
        await db('ld_courses').where({ id: courseId }).update(patch);
    }
    await recordHrAudit({ actor, action: 'LD_COURSE_UPDATED', entityType: 'ld_courses', entityId: courseId });
    return { id: courseId };
}
export async function archiveCourse(actor, courseId) {
    assertHrPermission(actor, 'hr.ld.manage');
    const course = await db('ld_courses').where({ id: courseId, college_id: actor.collegeId }).first();
    if (!course)
        throw new AppError(404, 'Course not found');
    await db('ld_courses').where({ id: courseId }).update({ status: 'ARCHIVED', updated_at: db.fn.now() });
    return { id: courseId, status: 'ARCHIVED' };
}
// ── Programs ─────────────────────────────────────────────────────────────────
function serializeProgram(input) {
    return {
        course_id: input.courseId ?? null,
        provider_id: input.providerId ?? null,
        code: input.code,
        title: input.title,
        provider_type: input.providerType,
        trainer_employee_id: input.trainerEmployeeId ?? null,
        external_trainer_name: input.externalTrainerName ?? null,
        delivery_mode: input.deliveryMode,
        start_date: input.startDate ?? null,
        end_date: input.endDate ?? null,
        venue: input.venue ?? null,
        link: input.link ?? null,
        duration_hours: input.durationHours ?? null,
        capacity: input.capacity ?? null,
        registration_opens_at: input.registrationOpensAt ?? null,
        registration_closes_at: input.registrationClosesAt ?? null,
        applicability_type: input.applicabilityType,
        applicability_ref: input.applicabilityRef ? JSON.stringify(input.applicabilityRef) : null,
        is_mandatory: input.isMandatory ?? false,
        mandatory_due_date: input.mandatoryDueDate ?? null,
        cost_json: input.cost ? JSON.stringify(input.cost) : null,
        completion_rule: input.completionRule ? JSON.stringify(input.completionRule) : null,
    };
}
export async function createProgram(actor, input) {
    assertHrPermission(actor, 'hr.ld.manage');
    const dup = await db('ld_programs').where({ college_id: actor.collegeId, code: input.code }).first();
    if (dup)
        throw new AppError(409, 'A program with this code already exists');
    if (input.trainerEmployeeId) {
        const trainer = await db('employees').where({ id: input.trainerEmployeeId, college_id: actor.collegeId }).first();
        if (!trainer)
            throw new AppError(400, 'Trainer must be an employee of this college');
    }
    const [id] = await db('ld_programs').insert({
        college_id: actor.collegeId,
        ...serializeProgram(input),
        status: 'DRAFT',
        created_by: actor.facultyUserId,
    });
    await recordHrAudit({ actor, action: 'LD_PROGRAM_CREATED', entityType: 'ld_programs', entityId: id });
    return { id };
}
export async function updateProgram(actor, programId, input) {
    assertHrPermission(actor, 'hr.ld.manage');
    const program = await programInCollege(actor, programId);
    if (['COMPLETED', 'CLOSED', 'CANCELLED'].includes(String(program.status))) {
        throw new AppError(409, `Cannot edit a ${program.status} program`);
    }
    const full = { ...programToInput(program), ...input };
    await db('ld_programs').where({ id: programId }).update({ ...serializeProgram(full), updated_at: db.fn.now() });
    await recordHrAudit({ actor, action: 'LD_PROGRAM_UPDATED', entityType: 'ld_programs', entityId: programId });
    return { id: programId };
}
function programToInput(p) {
    return {
        courseId: p.course_id ?? null,
        providerId: p.provider_id ?? null,
        code: String(p.code),
        title: String(p.title),
        providerType: p.provider_type,
        trainerEmployeeId: p.trainer_employee_id ?? null,
        externalTrainerName: p.external_trainer_name ?? null,
        deliveryMode: p.delivery_mode,
        startDate: p.start_date ?? null,
        endDate: p.end_date ?? null,
        venue: p.venue ?? null,
        link: p.link ?? null,
        durationHours: p.duration_hours ?? null,
        capacity: p.capacity ?? null,
        registrationOpensAt: p.registration_opens_at ?? null,
        registrationClosesAt: p.registration_closes_at ?? null,
        applicabilityType: p.applicability_type,
        applicabilityRef: parseJson(p.applicability_ref),
        isMandatory: Boolean(p.is_mandatory),
        mandatoryDueDate: p.mandatory_due_date ?? null,
        cost: parseJson(p.cost_json),
        completionRule: parseJson(p.completion_rule),
    };
}
export async function changeProgramStatus(actor, programId, status, reason) {
    assertHrPermission(actor, 'hr.ld.manage');
    const program = await programInCollege(actor, programId);
    const from = String(program.status);
    if (from === status)
        return { id: programId, status };
    if (!canTransition(PROGRAM_TRANSITIONS, from, status)) {
        throw new AppError(409, `Invalid program transition ${from} → ${status}`);
    }
    await db('ld_programs').where({ id: programId }).update({ status, updated_at: db.fn.now() });
    await recordHrAudit({ actor, action: `LD_PROGRAM_${status}`, entityType: 'ld_programs', entityId: programId, before: { status: from }, after: { status }, reason });
    return { id: programId, status };
}
export async function listPrograms(actor, filters = {}) {
    assertHrPermission(actor, 'hr.ld.view');
    let q = db('ld_programs as p')
        .leftJoin('ld_courses as c', 'c.id', 'p.course_id')
        .where('p.college_id', actor.collegeId);
    if (filters.status)
        q = q.where('p.status', filters.status);
    if (filters.category)
        q = q.where('c.category', filters.category);
    return q.orderBy('p.start_date', 'desc').select('p.*', 'c.category as course_category');
}
export async function getProgram(actor, programId) {
    assertHrPermission(actor, 'hr.ld.self');
    const program = await programInCollege(actor, programId);
    const sessions = await db('ld_program_sessions').where({ program_id: programId }).orderBy('session_date');
    const [confirmed, waitlisted] = await Promise.all([
        db('ld_enrollments').where({ program_id: programId, status: 'CONFIRMED' }).count('id as c').first(),
        db('ld_enrollments').where({ program_id: programId, status: 'WAITLISTED' }).count('id as c').first(),
    ]);
    return {
        program,
        sessions,
        seats: {
            capacity: program.capacity,
            confirmed: Number(confirmed?.c ?? 0),
            waitlisted: Number(waitlisted?.c ?? 0),
            remaining: program.capacity == null ? null : Math.max(0, Number(program.capacity) - Number(confirmed?.c ?? 0)),
        },
    };
}
// ── Sessions ─────────────────────────────────────────────────────────────────
export async function addSession(actor, programId, input) {
    assertHrPermission(actor, 'hr.ld.manage');
    const program = await programInCollege(actor, programId);
    if (input.trainerEmployeeId) {
        const trainer = await db('employees').where({ id: input.trainerEmployeeId, college_id: actor.collegeId }).first();
        if (!trainer)
            throw new AppError(400, 'Session trainer must be an employee of this college');
    }
    const [id] = await db('ld_program_sessions').insert({
        college_id: actor.collegeId,
        program_id: program.id,
        title: input.title,
        session_date: input.sessionDate ?? null,
        start_time: input.startTime ?? null,
        end_time: input.endTime ?? null,
        trainer_employee_id: input.trainerEmployeeId ?? null,
        external_trainer_name: input.externalTrainerName ?? null,
        venue: input.venue ?? null,
        link: input.link ?? null,
        is_mandatory: input.isMandatory ?? true,
    });
    await recordHrAudit({ actor, action: 'LD_SESSION_ADDED', entityType: 'ld_program_sessions', entityId: id });
    return { id };
}
/** Employee-facing catalogue browse: applicable programs open for registration. */
export async function browseCatalogue(actor) {
    assertHrPermission(actor, 'hr.ld.self');
    const self = await selfEmployee(actor);
    const programs = await db('ld_programs')
        .where({ college_id: actor.collegeId })
        .whereIn('status', ['PUBLISHED', 'REGISTRATION_OPEN'])
        .orderBy('start_date', 'desc');
    const eligible = self ? programs.filter((p) => isApplicable(p, self)) : [];
    return { programs: eligible.map((p) => ({ ...p, registrationOpen: p.status === 'REGISTRATION_OPEN' })) };
}
