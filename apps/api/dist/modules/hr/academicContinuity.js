import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { findConflicts } from '../timetable/service.js';
import { weekdayInTimezone, asISODate } from '../timetable/time.js';
import { notifyApprovedClass } from '../academicClasses/studentNotifications.js';
import { formatDisplayDate } from '../lessonPlans/dates.js';
let cachedHasOverrideSource = null;
async function hasOverrideSourceColumns() {
    if (cachedHasOverrideSource != null)
        return cachedHasOverrideSource;
    cachedHasOverrideSource =
        (await db.schema.hasTable('timetable_overrides')) &&
            (await db.schema.hasColumn('timetable_overrides', 'source_type'));
    return cachedHasOverrideSource;
}
export async function validateSlotAvailability(probe) {
    const dayOfWeek = weekdayInTimezone(probe.date);
    const hits = await findConflicts(probe.collegeId, {
        excludeSlotId: probe.excludeSlotId ?? null,
        academicClassId: probe.academicClassId,
        facultyIds: probe.facultyIds,
        roomId: probe.roomId ?? null,
        dayOfWeek,
        startTime: probe.startTime,
        endTime: probe.endTime,
        effectiveFrom: probe.date,
        effectiveTo: probe.date,
        date: probe.date,
    });
    if (hits.some((h) => h.kind === 'FACULTY')) {
        return { available: false, code: 'FACULTY_CONFLICT', message: hits.find((h) => h.kind === 'FACULTY').message };
    }
    if (hits.some((h) => h.kind === 'CLASS')) {
        return { available: false, code: 'CLASS_CONFLICT', message: hits.find((h) => h.kind === 'CLASS').message };
    }
    if (hits.some((h) => h.kind === 'ROOM')) {
        return { available: false, code: 'ROOM_CONFLICT', message: hits.find((h) => h.kind === 'ROOM').message };
    }
    return { available: true };
}
export async function validateFacultyOnLeave(employeeId, date) {
    const onLeave = await db('hr_leave_requests')
        .where({ employee_id: employeeId, status: 'APPROVED' })
        .andWhere('from_date', '<=', date)
        .andWhere('to_date', '>=', date)
        .first();
    return Boolean(onLeave);
}
async function loadSlot(slotId) {
    const slot = await db('timetable_slots').where({ id: slotId }).first();
    if (!slot)
        throw new AppError(404, 'Timetable slot not found');
    return slot;
}
export async function createLeaveSubstitutionOverride(trx, input) {
    const slot = await trx('timetable_slots').where({ id: input.coverage.timetable_slot_id }).first();
    if (!slot)
        return null;
    const insert = {
        college_id: input.collegeId,
        timetable_slot_id: input.coverage.timetable_slot_id,
        academic_class_id: slot.academic_class_id,
        class_subject_id: slot.class_subject_id,
        course_id: slot.course_id,
        override_date: input.coverage.affected_date,
        kind: 'SUBSTITUTION',
        original_faculty_id: input.coverage.original_faculty_id,
        faculty_id: input.coverage.original_faculty_id,
        substitute_faculty_id: input.coverage.substitute_faculty_id,
        reason: 'Approved leave — substitute coverage',
        status: 'ACTIVE',
        created_by: input.createdBy,
    };
    if (await hasOverrideSourceColumns()) {
        insert.source_type = 'HR_LEAVE';
        insert.source_id = input.leaveRequestId;
    }
    const [overrideId] = await trx('timetable_overrides').insert(insert);
    return Number(overrideId);
}
export async function createLeaveMakeupOverride(trx, input) {
    const slot = input.coverage.timetable_slot_id
        ? await trx('timetable_slots').where({ id: input.coverage.timetable_slot_id }).first()
        : null;
    const kind = String(input.coverage.makeup_kind || 'MAKEUP');
    const insert = {
        college_id: input.collegeId,
        timetable_slot_id: input.coverage.timetable_slot_id ?? null,
        academic_class_id: slot?.academic_class_id,
        class_subject_id: slot?.class_subject_id,
        course_id: slot?.course_id,
        override_date: input.coverage.makeup_date,
        kind: kind === 'RESCHEDULE' ? 'MAKEUP' : kind,
        original_faculty_id: input.coverage.original_faculty_id,
        faculty_id: input.coverage.substitute_faculty_id ?? input.coverage.original_faculty_id,
        substitute_faculty_id: null,
        room_id: input.coverage.makeup_room_id ?? slot?.room_id ?? null,
        start_time: input.coverage.makeup_start_time ?? slot?.start_time,
        end_time: input.coverage.makeup_end_time ?? slot?.end_time,
        reason: 'Approved leave — rescheduled/makeup session',
        status: 'ACTIVE',
        created_by: input.createdBy,
    };
    if (await hasOverrideSourceColumns()) {
        insert.source_type = 'HR_LEAVE';
        insert.source_id = input.leaveRequestId;
    }
    const [overrideId] = await trx('timetable_overrides').insert(insert);
    return Number(overrideId);
}
export async function createLeaveSwapOverrides(trx, input) {
    const sourceSlot = await trx('timetable_slots').where({ id: input.swap.source_timetable_slot_id }).first();
    const targetSlot = await trx('timetable_slots').where({ id: input.swap.target_timetable_slot_id }).first();
    if (!sourceSlot || !targetSlot)
        throw new AppError(400, 'Invalid swap slots', { code: 'INVALID_SWAP' });
    const swapEmp = await trx('employees').where({ id: input.swap.swap_employee_id }).first();
    const requestEmp = await trx('employees').where({ id: input.swap.requesting_employee_id }).first();
    if (!swapEmp?.faculty_user_id || !requestEmp?.faculty_user_id) {
        throw new AppError(400, 'Swap participants must be teaching faculty', { code: 'INVALID_SWAP' });
    }
    const base = {
        college_id: input.collegeId,
        status: 'ACTIVE',
        created_by: input.createdBy,
        reason: 'Approved leave — class swap',
    };
    const sourceType = (await hasOverrideSourceColumns()) ? 'HR_LEAVE' : undefined;
    const [sourceOverrideId] = await trx('timetable_overrides').insert({
        ...base,
        timetable_slot_id: sourceSlot.id,
        academic_class_id: sourceSlot.academic_class_id,
        class_subject_id: sourceSlot.class_subject_id,
        course_id: sourceSlot.course_id,
        override_date: input.swap.source_date,
        kind: 'SUBSTITUTION',
        original_faculty_id: input.coverage.original_faculty_id,
        faculty_id: input.coverage.original_faculty_id,
        substitute_faculty_id: Number(swapEmp.faculty_user_id),
        ...(sourceType ? { source_type: sourceType, source_id: input.leaveRequestId } : {}),
    });
    const [targetOverrideId] = await trx('timetable_overrides').insert({
        ...base,
        timetable_slot_id: targetSlot.id,
        academic_class_id: targetSlot.academic_class_id,
        class_subject_id: targetSlot.class_subject_id,
        course_id: targetSlot.course_id,
        override_date: input.swap.target_date,
        kind: 'SUBSTITUTION',
        original_faculty_id: Number(swapEmp.faculty_user_id),
        faculty_id: Number(swapEmp.faculty_user_id),
        substitute_faculty_id: Number(requestEmp.faculty_user_id),
        ...(sourceType ? { source_type: sourceType, source_id: input.leaveRequestId } : {}),
    });
    return { sourceOverrideId: Number(sourceOverrideId), targetOverrideId: Number(targetOverrideId) };
}
export async function createAuthorizedCancellationOverride(trx, input) {
    const slot = await trx('timetable_slots').where({ id: input.coverage.timetable_slot_id }).first();
    if (!slot)
        return null;
    const insert = {
        college_id: input.collegeId,
        timetable_slot_id: slot.id,
        academic_class_id: slot.academic_class_id,
        class_subject_id: slot.class_subject_id,
        course_id: slot.course_id,
        override_date: input.coverage.affected_date,
        kind: 'CANCELLED',
        original_faculty_id: input.coverage.original_faculty_id,
        faculty_id: input.coverage.original_faculty_id,
        reason: input.reason,
        status: 'ACTIVE',
        created_by: input.createdBy,
        cancelled_by: input.createdBy,
        cancelled_at: trx.fn.now(),
    };
    if (await hasOverrideSourceColumns()) {
        insert.source_type = 'HR_LEAVE';
        insert.source_id = input.leaveRequestId;
    }
    const [overrideId] = await trx('timetable_overrides').insert(insert);
    return Number(overrideId);
}
export async function cancelLeaveAcademicOverride(trx, overrideId, cancelledBy) {
    const session = await trx('attendance_sessions')
        .where({ timetable_override_id: overrideId })
        .whereIn('status', ['COMPLETED', 'FINALIZED'])
        .first();
    if (session)
        return false;
    await trx('timetable_overrides').where({ id: overrideId }).update({
        status: 'CANCELLED',
        cancelled_at: trx.fn.now(),
        cancelled_by: cancelledBy,
    });
    return true;
}
export async function applyCoverageOverrides(trx, input) {
    const coverages = await trx('hr_leave_academic_coverage').where({ leave_request_id: input.leaveRequestId });
    const applied = [];
    for (const cov of coverages) {
        if (cov.timetable_override_id)
            continue;
        const type = String(cov.coverage_type || '');
        let overrideId = null;
        let secondaryOverrideId = null;
        if (type === 'SUBSTITUTE_FACULTY' && cov.substitute_faculty_id && cov.timetable_slot_id) {
            overrideId = await createLeaveSubstitutionOverride(trx, {
                collegeId: input.collegeId,
                coverage: cov,
                leaveRequestId: input.leaveRequestId,
                createdBy: input.createdBy,
            });
        }
        else if (type === 'CLASS_SWAP' && cov.swap_id) {
            const swap = await trx('hr_leave_class_swaps').where({ id: cov.swap_id }).first();
            if (swap && ['ACCEPTED', 'VERIFIED'].includes(String(swap.status))) {
                const ids = await createLeaveSwapOverrides(trx, {
                    collegeId: input.collegeId,
                    swap,
                    coverage: cov,
                    leaveRequestId: input.leaveRequestId,
                    createdBy: input.createdBy,
                });
                overrideId = ids.sourceOverrideId;
                secondaryOverrideId = ids.targetOverrideId;
                await trx('hr_leave_class_swaps').where({ id: swap.id }).update({ status: 'APPLIED' });
            }
        }
        else if ((type === 'RESCHEDULE' || type === 'MAKEUP') && cov.makeup_date) {
            overrideId = await createLeaveMakeupOverride(trx, {
                collegeId: input.collegeId,
                coverage: cov,
                leaveRequestId: input.leaveRequestId,
                createdBy: input.createdBy,
            });
        }
        else if (type === 'CANCELLED_WITH_AUTHORIZATION') {
            overrideId = await createAuthorizedCancellationOverride(trx, {
                collegeId: input.collegeId,
                coverage: cov,
                leaveRequestId: input.leaveRequestId,
                createdBy: input.createdBy,
                reason: String(cov.reason || 'Authorized cancellation'),
            });
        }
        else if ((type === 'TEAM_TEACHING' || type === 'ALREADY_COVERED') && cov.status === 'VERIFIED') {
            // No override required — existing assignment covers session
            await trx('hr_leave_academic_coverage').where({ id: cov.id }).update({ status: 'COMPLETED' });
            continue;
        }
        if (overrideId) {
            await trx('hr_leave_academic_coverage').where({ id: cov.id }).update({
                timetable_override_id: overrideId,
                secondary_override_id: secondaryOverrideId,
                status: 'VERIFIED',
                verified_at: trx.fn.now(),
                verified_by: input.createdBy,
            });
            applied.push(overrideId);
            if (secondaryOverrideId)
                applied.push(secondaryOverrideId);
        }
    }
    return applied;
}
export async function notifyCoverageStudents(collegeId, coverage, slot, type, extras) {
    if (!slot)
        return;
    const course = slot.course_id ? await db('courses').where({ id: slot.course_id }).first() : null;
    const courseName = course?.name || 'Class';
    const classId = Number(slot.academic_class_id);
    const courseId = slot.course_id ? Number(slot.course_id) : null;
    const coverageId = Number(coverage.id);
    const affectedLabel = formatDisplayDate(asISODate(coverage.affected_date));
    const startLabel = coverage.makeup_start_time
        ? String(coverage.makeup_start_time).slice(0, 5)
        : slot.start_time
            ? String(slot.start_time).slice(0, 5)
            : '';
    const timeSuffix = startLabel ? ` at ${startLabel}` : '';
    if (type === 'SUBSTITUTION' && extras?.substituteName) {
        await notifyApprovedClass({
            collegeId,
            classId,
            courseId,
            type: 'FACULTY_SUBSTITUTION',
            title: `${courseName} on ${affectedLabel}`,
            body: `${courseName} on ${affectedLabel}${timeSuffix} will be handled by ${extras.substituteName}.`,
            link: '/lms/timetable',
            relatedType: 'HR_LEAVE_COVERAGE',
            relatedId: coverageId,
            dedupeKeyPrefix: `HR_COVERAGE:${coverageId}:SUBSTITUTE`,
        });
    }
    else if (type === 'RESCHEDULE' && extras?.newDate) {
        const newDateLabel = formatDisplayDate(asISODate(extras.newDate));
        const newTime = extras.newTime ? ` at ${extras.newTime}` : '';
        await notifyApprovedClass({
            collegeId,
            classId,
            courseId,
            type: 'CLASS_RESCHEDULED',
            title: `${courseName} rescheduled`,
            body: `${courseName} scheduled for ${affectedLabel}${timeSuffix} has been moved to ${newDateLabel}${newTime}.`,
            link: '/lms/timetable',
            relatedType: 'HR_LEAVE_COVERAGE',
            relatedId: coverageId,
            dedupeKeyPrefix: `HR_COVERAGE:${coverageId}:RESCHEDULE`,
        });
    }
    else if (type === 'CANCELLATION') {
        await notifyApprovedClass({
            collegeId,
            classId,
            courseId,
            type: 'CLASS_CANCELLED',
            title: `${courseName} cancelled on ${affectedLabel}`,
            body: `${courseName} scheduled for ${affectedLabel}${timeSuffix} has been cancelled.`,
            link: '/lms/timetable',
            relatedType: 'HR_LEAVE_COVERAGE',
            relatedId: coverageId,
            dedupeKeyPrefix: `HR_COVERAGE:${coverageId}:CANCEL`,
        });
    }
    else if (type === 'RESTORE') {
        await notifyApprovedClass({
            collegeId,
            classId,
            courseId,
            type: 'CLASS_RESTORED',
            title: `${courseName} restored`,
            body: `${courseName} on ${affectedLabel}${timeSuffix} will follow the original schedule.`,
            link: '/lms/timetable',
            relatedType: 'HR_LEAVE_COVERAGE',
            relatedId: coverageId,
            dedupeKeyPrefix: `HR_COVERAGE:${coverageId}:RESTORE`,
        });
    }
}
export async function getSlotTimes(slotId, date) {
    const slot = await loadSlot(slotId);
    return {
        slot,
        academicClassId: Number(slot.academic_class_id),
        startTime: String(slot.start_time).slice(0, 5),
        endTime: String(slot.end_time).slice(0, 5),
        roomId: slot.room_id ? Number(slot.room_id) : null,
        courseId: slot.course_id ? Number(slot.course_id) : null,
    };
}
