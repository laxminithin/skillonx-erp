import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertPlacementPermission, assertTrainerProgramAccess, getTrainerProgramIds, hasPlacementPermission, assertCoordinatorStudentAccess, isCollegeTpOperator } from './access.js';
import { recordPlacementAudit } from './audit.js';
import { notifyPlacementEvent } from './notifications.js';
export async function listTrainingPrograms(actor) {
    assertPlacementPermission(actor, 'placement.view');
    const trainerIds = await getTrainerProgramIds(actor);
    const fullAccess = hasPlacementPermission(actor, 'placement.training.manage');
    let q = db('training_programs').where({ college_id: actor.collegeId });
    if (!fullAccess) {
        if (!trainerIds.length)
            return [];
        q = q.whereIn('id', trainerIds);
    }
    return q.orderBy('start_date', 'desc');
}
export async function createTrainingProgram(actor, body) {
    assertPlacementPermission(actor, 'placement.training.manage');
    const [id] = await db('training_programs').insert({
        college_id: actor.collegeId,
        opportunity_id: body.opportunityId ?? null,
        title: body.title,
        provider: body.provider ?? null,
        category: body.category ?? 'APTITUDE',
        description: body.description ?? null,
        start_date: body.startDate ?? null,
        end_date: body.endDate ?? null,
        hours: body.hours ?? null,
        mode: body.mode ?? 'OFFLINE',
        capacity: body.capacity ?? null,
        status: 'ACTIVE',
        created_by: actor.facultyUserId,
    });
    await recordPlacementAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'TRAINING_PROGRAM_CREATED',
        entityType: 'training_program',
        entityId: Number(id),
        afterState: body,
    });
    return db('training_programs').where({ id }).first();
}
export async function enrollStudents(actor, programId, studentIds) {
    assertPlacementPermission(actor, 'placement.training.manage');
    await assertTrainerProgramAccess(actor, programId);
    const program = await db('training_programs').where({ id: programId, college_id: actor.collegeId }).first();
    if (!program)
        throw new AppError(404, 'Training program not found');
    let enrolled = 0;
    for (const studentId of studentIds) {
        if (!isCollegeTpOperator(actor)) {
            await assertCoordinatorStudentAccess(actor, studentId);
        }
        try {
            enrolled += await insertEnrollment(actor.collegeId, studentId, program);
        }
        catch (err) {
            if (err.code === 'DUPLICATE_REGISTRATION')
                continue;
            throw err;
        }
    }
    return { enrolled };
}
async function insertEnrollment(collegeId, studentId, program) {
    const programId = Number(program.id);
    return db.transaction(async (trx) => {
        const locked = await trx('training_programs').where({ id: programId }).forUpdate().first();
        if (!locked)
            throw new AppError(404, 'Training program not found');
        const existing = await trx('training_enrollments')
            .where({ student_id: studentId, training_program_id: programId })
            .first();
        if (existing)
            throw new AppError(409, 'Already registered for this training program', undefined, 'DUPLICATE_REGISTRATION');
        const countRow = await trx('training_enrollments').where({ training_program_id: programId }).count({ c: '*' }).first();
        const capacity = locked.capacity != null ? Number(locked.capacity) : null;
        if (capacity != null && Number(countRow?.c ?? 0) >= capacity) {
            throw new AppError(409, 'Training program is at capacity', undefined, 'CAPACITY_EXCEEDED');
        }
        await trx('training_enrollments').insert({
            college_id: collegeId,
            student_id: studentId,
            training_program_id: programId,
            status: 'ENROLLED',
            completion_status: 'IN_PROGRESS',
            enrolled_at: trx.fn.now(),
        });
        return 1;
    });
}
export async function registerStudentForTraining(studentId, collegeId, programId) {
    const program = await db('training_programs').where({ id: programId, college_id: collegeId }).first();
    if (!program)
        throw new AppError(404, 'Training program not found');
    if (!['ACTIVE', 'OPEN', 'PUBLISHED'].includes(String(program.status))) {
        throw new AppError(400, 'Training program is not open for registration');
    }
    await insertEnrollment(collegeId, studentId, program);
    await notifyPlacementEvent({
        studentId,
        collegeId,
        type: 'TRAINING_REGISTERED',
        title: 'Training registration confirmed',
        body: String(program.title),
        link: '/lms/placements/training',
        relatedType: 'training_program',
        relatedId: programId,
    });
    return db('training_enrollments').where({ student_id: studentId, training_program_id: programId }).first();
}
export async function listOpenTrainingPrograms(collegeId) {
    return db('training_programs')
        .where({ college_id: collegeId })
        .whereIn('status', ['ACTIVE', 'OPEN', 'PUBLISHED'])
        .orderBy('start_date', 'desc');
}
export async function listStudentTraining(studentId, collegeId) {
    const rows = await db('training_enrollments as e')
        .join('training_programs as p', 'p.id', 'e.training_program_id')
        .where({ 'e.student_id': studentId, 'e.college_id': collegeId })
        .select('e.*', 'p.title', 'p.category', 'p.start_date', 'p.end_date', 'p.mode');
    return rows.map((r) => ({
        id: Number(r.id),
        programId: Number(r.training_program_id),
        title: r.title,
        category: r.category,
        status: r.status,
        completionStatus: r.completion_status,
        startDate: r.start_date,
        endDate: r.end_date,
        mode: r.mode,
    }));
}
export async function createTrainingSession(actor, programId, body) {
    assertPlacementPermission(actor, 'placement.training.manage');
    await assertTrainerProgramAccess(actor, programId);
    const [id] = await db('training_sessions').insert({
        college_id: actor.collegeId,
        training_program_id: programId,
        title: body.title,
        scheduled_at: body.scheduledAt ?? null,
        venue: body.venue ?? null,
        online_link: body.onlineLink ?? null,
        duration_minutes: body.durationMinutes ?? null,
    });
    return db('training_sessions').where({ id }).first();
}
export async function markTrainingAttendance(actor, sessionId, records) {
    assertPlacementPermission(actor, 'placement.training.manage');
    const session = await db('training_sessions').where({ id: sessionId, college_id: actor.collegeId }).first();
    if (!session)
        throw new Error('Session not found');
    await assertTrainerProgramAccess(actor, Number(session.training_program_id));
    for (const rec of records) {
        const existing = await db('training_attendance_records')
            .where({ session_id: sessionId, student_id: rec.studentId })
            .first();
        if (existing) {
            await db('training_attendance_records').where({ id: existing.id }).update({
                status: rec.status,
                updated_at: db.fn.now(),
            });
        }
        else {
            await db('training_attendance_records').insert({
                college_id: actor.collegeId,
                session_id: sessionId,
                student_id: rec.studentId,
                status: rec.status,
            });
        }
    }
    return { updated: records.length };
}
export async function recordTrainingAssessment(actor, programId, body) {
    assertPlacementPermission(actor, 'placement.training.manage');
    await assertTrainerProgramAccess(actor, programId);
    const [id] = await db('training_assessments').insert({
        college_id: actor.collegeId,
        training_program_id: programId,
        student_id: body.studentId,
        assessment_type: body.assessmentType,
        score: body.score ?? null,
        max_score: body.maxScore ?? null,
        feedback: body.feedback ?? null,
    });
    return db('training_assessments').where({ id }).first();
}
export async function getTrainerDashboard(actor) {
    const fullAccess = hasPlacementPermission(actor, 'placement.training.manage');
    const programIds = await getTrainerProgramIds(actor);
    if (!fullAccess && !programIds.length) {
        return { programs: [], enrollments: 0, sessions: 0 };
    }
    let q = db('training_programs').where({ college_id: actor.collegeId, status: 'ACTIVE' });
    if (!fullAccess)
        q = q.whereIn('id', programIds);
    const programs = await q;
    const enrollments = await db('training_enrollments')
        .whereIn('training_program_id', programs.map((p) => p.id))
        .count({ c: '*' })
        .first();
    const sessions = await db('training_sessions')
        .whereIn('training_program_id', programs.map((p) => p.id))
        .count({ c: '*' })
        .first();
    return {
        programs: programs.map((p) => ({ id: Number(p.id), title: p.title, category: p.category })),
        enrollments: Number(enrollments?.c ?? 0),
        sessions: Number(sessions?.c ?? 0),
    };
}
