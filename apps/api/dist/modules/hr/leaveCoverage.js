import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertHrPermission, requireEmployeeForActor, resolveEmployeeForActor, } from './access.js';
import { recordHrAudit } from './audit.js';
import { notifyEmployee } from './notifications.js';
import { applyCoverageOverrides, cancelLeaveAcademicOverride, getSlotTimes, notifyCoverageStudents, validateFacultyOnLeave, validateSlotAvailability, } from './academicContinuity.js';
import { asISODate } from '../timetable/time.js';
import { addDays, weekdayOf } from '../lessonPlans/dates.js';
export const RESOLVED_COVERAGE_STATUSES = new Set(['ACCEPTED', 'VERIFIED', 'COMPLETED']);
export async function getLeaveCoverageSummary(leaveRequestId) {
    const req = await db('hr_leave_requests').where({ id: leaveRequestId }).first();
    const coverages = await db('hr_leave_academic_coverage').where({ leave_request_id: leaveRequestId });
    const totalAffected = coverages.length;
    if (!totalAffected) {
        return {
            totalAffected: 0,
            resolved: 0,
            unresolved: 0,
            acceptedSubstitutions: 0,
            swaps: 0,
            rescheduled: 0,
            hodArrangement: 0,
            cancelled: 0,
            teamTeaching: 0,
            status: 'NOT_REQUIRED',
            unresolvedCoverageIds: [],
        };
    }
    const resolvedRows = coverages.filter((c) => RESOLVED_COVERAGE_STATUSES.has(String(c.status)));
    const unresolvedRows = coverages.filter((c) => !RESOLVED_COVERAGE_STATUSES.has(String(c.status)));
    let status = 'PENDING';
    if (resolvedRows.length === totalAffected)
        status = 'COMPLETE';
    else if (resolvedRows.length > 0)
        status = 'PARTIAL';
    else if (req?.is_emergency)
        status = 'EMERGENCY_UNRESOLVED';
    if (String(req?.status) === 'CANCELLED')
        status = 'CANCELLED';
    return {
        totalAffected,
        resolved: resolvedRows.length,
        unresolved: unresolvedRows.length,
        acceptedSubstitutions: coverages.filter((c) => c.coverage_type === 'SUBSTITUTE_FACULTY').length,
        swaps: coverages.filter((c) => c.coverage_type === 'CLASS_SWAP').length,
        rescheduled: coverages.filter((c) => c.coverage_type === 'RESCHEDULE').length,
        hodArrangement: coverages.filter((c) => c.coverage_type === 'HOD_ARRANGEMENT' || c.hod_action_required).length,
        cancelled: coverages.filter((c) => c.coverage_type === 'CANCELLED_WITH_AUTHORIZATION').length,
        teamTeaching: coverages.filter((c) => ['TEAM_TEACHING', 'ALREADY_COVERED'].includes(String(c.coverage_type))).length,
        status,
        unresolvedCoverageIds: unresolvedRows.map((c) => Number(c.id)),
    };
}
export async function syncLeaveCoverageStatus(leaveRequestId) {
    const summary = await getLeaveCoverageSummary(leaveRequestId);
    const req = await db('hr_leave_requests').where({ id: leaveRequestId }).first();
    if (!req)
        return summary;
    let academicStatus = summary.status;
    if (summary.status === 'EMERGENCY_UNRESOLVED' && summary.resolved > 0)
        academicStatus = 'PARTIAL';
    if (summary.status === 'COMPLETE')
        academicStatus = 'COMPLETE';
    if (summary.status === 'PARTIAL')
        academicStatus = 'INCOMPLETE';
    await db('hr_leave_requests').where({ id: leaveRequestId }).update({
        academic_coverage_status: academicStatus === 'NOT_REQUIRED' ? null : academicStatus,
    });
    return summary;
}
async function assertCoverageOwner(actor, coverageId) {
    const emp = await requireEmployeeForActor(actor);
    const coverage = await db('hr_leave_academic_coverage').where({ id: coverageId, college_id: actor.collegeId }).first();
    if (!coverage)
        throw new AppError(404, 'Coverage record not found');
    if (Number(coverage.original_faculty_employee_id) !== Number(emp.id)) {
        throw new AppError(403, 'Only the requesting lecturer can arrange coverage for this session');
    }
    return { emp, coverage };
}
export async function getCoverageForLeaveRequest(actor, leaveRequestId) {
    const emp = await requireEmployeeForActor(actor);
    const req = await db('hr_leave_requests').where({ id: leaveRequestId, employee_id: emp.id }).first();
    if (!req)
        throw new AppError(404, 'Leave request not found');
    let coverages = await serializeCoverages(leaveRequestId);
    if (emp.faculty_user_id) {
        const { facultyTimetable } = await import('../timetable/service.js');
        const schedule = await facultyTimetable({ collegeId: actor.collegeId, facultyUserId: Number(emp.faculty_user_id), role: actor.role }, asISODate(req.from_date), asISODate(req.to_date));
        const topicMap = new Map(schedule.occurrences
            .filter((o) => o.plannedTopic)
            .map((o) => [`${o.slotId}:${o.date}`, o.plannedTopic.topicName]));
        coverages = coverages.map((c) => ({
            ...c,
            plannedTopic: c.timetableSlotId ? topicMap.get(`${c.timetableSlotId}:${c.affectedDate}`) ?? null : null,
        }));
    }
    const summary = await getLeaveCoverageSummary(leaveRequestId);
    return { leaveRequestId, coverages, summary };
}
async function serializeCoverages(leaveRequestId) {
    const rows = await db('hr_leave_academic_coverage as c')
        .leftJoin('employees as sub', 'sub.id', 'c.substitute_employee_id')
        .leftJoin('timetable_slots as ts', 'ts.id', 'c.timetable_slot_id')
        .leftJoin('courses as co', 'co.id', 'ts.course_id')
        .leftJoin('academic_classes as ac', 'ac.id', 'ts.academic_class_id')
        .leftJoin('rooms as rm', 'rm.id', 'ts.room_id')
        .leftJoin('class_sections as cs', 'cs.id', 'ac.class_section_id')
        .where({ 'c.leave_request_id': leaveRequestId })
        .select('c.*', 'sub.display_name as substitute_name', 'co.name as subject_name', 'co.code as subject_code', 'ac.name as class_name', 'ac.code as class_code', 'cs.label as section_name', 'ts.start_time', 'ts.end_time', 'ts.start_period_number', 'rm.name as room_name');
    return rows.map((c) => ({
        id: Number(c.id),
        affectedDate: asISODate(c.affected_date),
        coverageType: c.coverage_type,
        status: c.status,
        priority: c.priority,
        hodActionRequired: !!c.hod_action_required,
        substituteName: c.substitute_name,
        substituteEmployeeId: c.substitute_employee_id ? Number(c.substitute_employee_id) : null,
        subjectName: c.subject_name,
        subjectCode: c.subject_code,
        className: c.class_name,
        classCode: c.class_code,
        sectionName: c.section_name,
        roomName: c.room_name,
        periodNumber: c.start_period_number,
        startTime: c.start_time,
        endTime: c.end_time,
        makeupDate: c.makeup_date ? asISODate(c.makeup_date) : null,
        makeupStartTime: c.makeup_start_time ? String(c.makeup_start_time).slice(0, 5) : null,
        makeupEndTime: c.makeup_end_time ? String(c.makeup_end_time).slice(0, 5) : null,
        swapId: c.swap_id ? Number(c.swap_id) : null,
        timetableSlotId: c.timetable_slot_id ? Number(c.timetable_slot_id) : null,
        plannedTopic: null,
    }));
}
export async function proposeClassSwap(actor, input) {
    const { emp, coverage } = await assertCoverageOwner(actor, input.coverageId);
    if (!coverage.timetable_slot_id)
        throw new AppError(400, 'Coverage has no timetable slot', { code: 'INVALID_SWAP' });
    const swapEmp = await db('employees').where({ id: input.swapEmployeeId, college_id: actor.collegeId }).first();
    if (!swapEmp?.faculty_user_id)
        throw new AppError(400, 'Swap partner must be teaching faculty');
    const source = await getSlotTimes(Number(coverage.timetable_slot_id));
    const target = await getSlotTimes(input.targetTimetableSlotId, input.targetDate);
    const requestFacultyId = Number(coverage.original_faculty_id);
    const swapFacultyId = Number(swapEmp.faculty_user_id);
    const affectedDate = asISODate(coverage.affected_date);
    const sourceCheck = await validateSlotAvailability({
        collegeId: actor.collegeId,
        academicClassId: source.academicClassId,
        facultyIds: [swapFacultyId],
        roomId: source.roomId,
        date: affectedDate,
        startTime: source.startTime,
        endTime: source.endTime,
        excludeSlotId: Number(coverage.timetable_slot_id),
    });
    if (!sourceCheck.available) {
        throw new AppError(400, sourceCheck.message || 'Swap unavailable', { code: sourceCheck.code || 'INVALID_SWAP' });
    }
    const targetCheck = await validateSlotAvailability({
        collegeId: actor.collegeId,
        academicClassId: target.academicClassId,
        facultyIds: [requestFacultyId],
        roomId: target.roomId,
        date: input.targetDate,
        startTime: target.startTime,
        endTime: target.endTime,
        excludeSlotId: input.targetTimetableSlotId,
    });
    if (!targetCheck.available) {
        throw new AppError(400, targetCheck.message || 'Swap unavailable', { code: targetCheck.code || 'INVALID_SWAP' });
    }
    if (await validateFacultyOnLeave(input.swapEmployeeId, affectedDate)) {
        throw new AppError(400, 'Swap partner is on leave', { code: 'EMPLOYEE_ON_LEAVE' });
    }
    if (await validateFacultyOnLeave(Number(emp.id), input.targetDate)) {
        throw new AppError(400, 'You are on leave on the swap target date', { code: 'EMPLOYEE_ON_LEAVE' });
    }
    const result = await db.transaction(async (trx) => {
        const [swapId] = await trx('hr_leave_class_swaps').insert({
            college_id: actor.collegeId,
            leave_request_id: coverage.leave_request_id,
            coverage_id: input.coverageId,
            requesting_employee_id: emp.id,
            swap_employee_id: input.swapEmployeeId,
            source_timetable_slot_id: coverage.timetable_slot_id,
            source_date: coverage.affected_date,
            target_timetable_slot_id: input.targetTimetableSlotId,
            target_date: input.targetDate,
            status: 'PENDING_ACCEPTANCE',
            requested_at: trx.fn.now(),
        });
        await trx('hr_leave_academic_coverage').where({ id: input.coverageId }).update({
            coverage_type: 'CLASS_SWAP',
            swap_id: swapId,
            swap_timetable_slot_id: input.targetTimetableSlotId,
            status: 'REQUESTED',
            requested_at: trx.fn.now(),
        });
        const [reqId] = await trx('hr_leave_coverage_requests').insert({
            coverage_id: input.coverageId,
            requested_to_employee_id: input.swapEmployeeId,
            requested_by_employee_id: emp.id,
            status: 'PENDING',
            request_type: 'CLASS_SWAP',
            swap_id: swapId,
            message: input.message ?? null,
        });
        return { swapId: Number(swapId), coverageRequestId: Number(reqId) };
    });
    const targetSlot = await db('timetable_slots as ts')
        .join('courses as co', 'co.id', 'ts.course_id')
        .join('academic_classes as ac', 'ac.id', 'ts.academic_class_id')
        .where('ts.id', input.targetTimetableSlotId)
        .select('co.name as subject_name', 'ac.name as class_name', 'ts.start_time', 'ts.end_time')
        .first();
    await notifyEmployee({
        employeeId: input.swapEmployeeId,
        collegeId: actor.collegeId,
        type: 'CLASS_SWAP_REQUEST',
        title: 'Class swap request',
        body: input.message ??
            `Swap: cover ${source.slot.course_id ? 'your class' : 'a class'} on ${coverage.affected_date} in exchange for ${targetSlot?.subject_name} (${targetSlot?.class_name}) on ${input.targetDate}.`,
        relatedType: 'hr_leave_class_swaps',
        relatedId: result.swapId,
        dedupeKey: `swap-req-${result.swapId}`,
    });
    await recordHrAudit({
        actor,
        action: 'SWAP_PROPOSED',
        entityType: 'hr_leave_class_swaps',
        entityId: result.swapId,
        after: input,
    });
    return result;
}
export async function respondToSwapRequest(actor, coverageRequestId, accept) {
    const emp = await requireEmployeeForActor(actor);
    const req = await db('hr_leave_coverage_requests').where({ id: coverageRequestId }).first();
    if (!req)
        throw new AppError(404, 'Coverage request not found');
    if (String(req.request_type) !== 'CLASS_SWAP') {
        throw new AppError(400, 'Not a class swap request');
    }
    if (Number(req.requested_to_employee_id) !== Number(emp.id)) {
        throw new AppError(403, 'This swap request is not addressed to you');
    }
    if (req.status !== 'PENDING')
        throw new AppError(400, 'Swap request already responded');
    const swap = req.swap_id ? await db('hr_leave_class_swaps').where({ id: req.swap_id }).first() : null;
    if (!swap)
        throw new AppError(404, 'Swap record not found');
    const newStatus = accept ? 'ACCEPTED' : 'DECLINED';
    await db.transaction(async (trx) => {
        const locked = await trx('hr_leave_coverage_requests').where({ id: coverageRequestId }).forUpdate().first();
        if (!locked)
            throw new AppError(404, 'Coverage request not found');
        if (Number(locked.requested_to_employee_id) !== Number(emp.id)) {
            throw new AppError(403, 'This swap request is not addressed to you');
        }
        if (locked.status !== 'PENDING')
            throw new AppError(400, 'Swap request already responded');
        const swapRow = locked.swap_id ? await trx('hr_leave_class_swaps').where({ id: locked.swap_id }).first() : null;
        if (!swapRow)
            throw new AppError(404, 'Swap record not found');
        await trx('hr_leave_coverage_requests').where({ id: coverageRequestId }).update({
            status: newStatus,
            responded_at: trx.fn.now(),
        });
        await trx('hr_leave_class_swaps').where({ id: swapRow.id }).update({
            status: accept ? 'ACCEPTED' : 'DECLINED',
            accepted_at: accept ? trx.fn.now() : null,
        });
        await trx('hr_leave_academic_coverage').where({ id: locked.coverage_id }).update({
            status: accept ? 'ACCEPTED' : 'UNRESOLVED',
            accepted_at: accept ? trx.fn.now() : null,
            coverage_type: accept ? 'CLASS_SWAP' : null,
            swap_id: accept ? swapRow.id : null,
        });
        const cov = await trx('hr_leave_academic_coverage').where({ id: locked.coverage_id }).first();
        await trx('hr_leave_actions').insert({
            leave_request_id: cov?.leave_request_id,
            action: accept ? 'SWAP_ACCEPTED' : 'SWAP_DECLINED',
            actor_employee_id: emp.id,
            actor_faculty_id: actor.facultyUserId,
        });
    });
    await recordHrAudit({
        actor,
        action: accept ? 'SWAP_ACCEPTED' : 'SWAP_DECLINED',
        entityType: 'hr_leave_coverage_requests',
        entityId: coverageRequestId,
    });
    await syncLeaveCoverageStatus(Number((await db('hr_leave_academic_coverage').where({ id: req.coverage_id }).first())?.leave_request_id));
    return { coverageRequestId, status: newStatus };
}
export async function checkRescheduleAvailability(actor, input) {
    const { coverage } = await assertCoverageOwner(actor, input.coverageId);
    if (!coverage.timetable_slot_id)
        throw new AppError(400, 'Coverage has no timetable slot');
    const source = await getSlotTimes(Number(coverage.timetable_slot_id));
    const facultyUserId = input.facultyId ?? Number(coverage.original_faculty_id);
    return validateSlotAvailability({
        collegeId: actor.collegeId,
        academicClassId: source.academicClassId,
        facultyIds: [facultyUserId],
        roomId: input.roomId ?? source.roomId,
        date: input.makeupDate,
        startTime: input.startTime,
        endTime: input.endTime,
        excludeSlotId: Number(coverage.timetable_slot_id),
    });
}
export async function managerReschedule(actor, coverageId, input) {
    assertHrPermission(actor, 'academic.leave.coverage.manage');
    const coverage = await db('hr_leave_academic_coverage').where({ id: coverageId, college_id: actor.collegeId }).first();
    if (!coverage)
        throw new AppError(404, 'Coverage not found');
    if (!coverage.timetable_slot_id)
        throw new AppError(400, 'Coverage has no timetable slot');
    const source = await getSlotTimes(Number(coverage.timetable_slot_id));
    const check = await validateSlotAvailability({
        collegeId: actor.collegeId,
        academicClassId: source.academicClassId,
        facultyIds: [Number(coverage.original_faculty_id)],
        roomId: input.roomId ?? source.roomId,
        date: input.makeupDate,
        startTime: input.startTime,
        endTime: input.endTime,
        excludeSlotId: Number(coverage.timetable_slot_id),
    });
    if (!check.available) {
        throw new AppError(400, check.message || 'Slot unavailable', { code: check.code });
    }
    await db('hr_leave_academic_coverage').where({ id: coverageId }).update({
        coverage_type: 'RESCHEDULE',
        makeup_date: input.makeupDate,
        makeup_start_time: input.startTime,
        makeup_end_time: input.endTime,
        makeup_room_id: input.roomId ?? null,
        makeup_kind: input.makeupKind ?? 'RESCHEDULE',
        status: 'VERIFIED',
        hod_action_required: false,
        verified_at: db.fn.now(),
        verified_by: actor.facultyUserId,
    });
    await syncLeaveCoverageStatus(Number(coverage.leave_request_id));
    return { coverageId, status: 'VERIFIED' };
}
export async function proposeReschedule(actor, input) {
    const { coverage } = await assertCoverageOwner(actor, input.coverageId);
    const check = await checkRescheduleAvailability(actor, input);
    if (!check.available) {
        throw new AppError(400, check.message || 'Slot unavailable', { code: check.code || 'FACULTY_CONFLICT' });
    }
    await db('hr_leave_academic_coverage').where({ id: input.coverageId }).update({
        coverage_type: 'RESCHEDULE',
        makeup_date: input.makeupDate,
        makeup_start_time: input.startTime,
        makeup_end_time: input.endTime,
        makeup_room_id: input.roomId ?? null,
        makeup_kind: input.makeupKind ?? 'RESCHEDULE',
        status: 'ACCEPTED',
        accepted_at: db.fn.now(),
    });
    await syncLeaveCoverageStatus(Number(coverage.leave_request_id));
    await recordHrAudit({ actor, action: 'RESCHEDULE_PROPOSED', entityType: 'hr_leave_academic_coverage', entityId: input.coverageId, after: input });
    return { coverageId: input.coverageId, status: 'ACCEPTED', available: true };
}
export async function requestHodArrangement(actor, coverageId, reason) {
    const { emp, coverage } = await assertCoverageOwner(actor, coverageId);
    await db('hr_leave_academic_coverage').where({ id: coverageId }).update({
        coverage_type: 'HOD_ARRANGEMENT',
        hod_action_required: true,
        status: 'UNRESOLVED',
        reason: reason ?? null,
        priority: coverage.priority ?? 'HIGH',
    });
    const managers = await db('employees as e')
        .join('faculty_users as f', 'f.id', 'e.faculty_user_id')
        .where({ 'e.college_id': actor.collegeId })
        .whereIn('f.role', ['HOD', 'PRINCIPAL', 'COLLEGE_ADMIN'])
        .select('e.id')
        .limit(5);
    const managerIds = new Set(managers.map((m) => Number(m.id)));
    try {
        const { listActiveHodEmployees } = await import('../academicLeadership/assignments.js');
        const empDept = emp.department_id != null ? Number(emp.department_id) : actor.departmentId;
        if (empDept) {
            const assigned = await listActiveHodEmployees(actor.collegeId, empDept, String(coverage.affected_date).slice(0, 10));
            for (const id of assigned)
                managerIds.add(id);
        }
    }
    catch {
        /* leadership table optional */
    }
    for (const managerId of managerIds) {
        await notifyEmployee({
            employeeId: managerId,
            collegeId: actor.collegeId,
            type: 'HOD_COVERAGE_REQUIRED',
            title: 'Academic coverage needs arrangement',
            body: `${emp.display_name || 'A lecturer'} requested HOD arrangement for ${coverage.affected_date}.`,
            relatedType: 'hr_leave_academic_coverage',
            relatedId: coverageId,
            dedupeKey: `hod-cov-${coverageId}-${managerId}`,
        });
    }
    await syncLeaveCoverageStatus(Number(coverage.leave_request_id));
    await recordHrAudit({ actor, action: 'HOD_ARRANGEMENT_REQUESTED', entityType: 'hr_leave_academic_coverage', entityId: coverageId });
    return { coverageId, status: 'HOD_ACTION_REQUIRED' };
}
export async function managerVerifyCoverage(actor, coverageId, notes) {
    assertHrPermission(actor, 'academic.leave.coverage.manage');
    const coverage = await db('hr_leave_academic_coverage').where({ id: coverageId, college_id: actor.collegeId }).first();
    if (!coverage)
        throw new AppError(404, 'Coverage not found');
    if (coverage.status === 'VERIFIED' || coverage.status === 'COMPLETED') {
        return { coverageId, status: String(coverage.status) };
    }
    if (!RESOLVED_COVERAGE_STATUSES.has(String(coverage.status)) && coverage.status !== 'REQUESTED') {
        throw new AppError(400, 'Coverage is not ready for verification');
    }
    const emp = await resolveEmployeeForActor(actor);
    await db('hr_leave_academic_coverage').where({ id: coverageId }).update({
        status: 'VERIFIED',
        verified_at: db.fn.now(),
        verified_by: actor.facultyUserId,
        verified_by_employee_id: emp?.id ?? null,
    });
    if (coverage.swap_id) {
        await db('hr_leave_class_swaps').where({ id: coverage.swap_id }).update({
            status: 'VERIFIED',
            verified_at: db.fn.now(),
            verified_by: actor.facultyUserId,
        });
    }
    await syncLeaveCoverageStatus(Number(coverage.leave_request_id));
    await recordHrAudit({ actor, action: 'COVERAGE_VERIFIED', entityType: 'hr_leave_academic_coverage', entityId: coverageId, after: { notes } });
    return { coverageId, status: 'VERIFIED' };
}
export async function managerAssignSubstitute(actor, coverageId, substituteEmployeeId, options) {
    assertHrPermission(actor, 'academic.leave.coverage.manage');
    const coverage = await db('hr_leave_academic_coverage').where({ id: coverageId, college_id: actor.collegeId }).first();
    if (!coverage)
        throw new AppError(404, 'Coverage not found');
    const policy = await db('college_hrms_policies').where({ college_id: actor.collegeId }).first();
    const requiresConsent = policy?.substitute_consent_required !== false && !options?.skipConsent;
    if (options?.skipConsent && !options?.reason) {
        throw new AppError(400, 'Reason required for direct HOD substitute assignment');
    }
    const subEmp = await db('employees').where({ id: substituteEmployeeId, college_id: actor.collegeId }).first();
    if (!subEmp?.faculty_user_id)
        throw new AppError(400, 'Substitute must be teaching faculty');
    const slot = coverage.timetable_slot_id
        ? await db('timetable_slots').where({ id: coverage.timetable_slot_id }).first()
        : null;
    if (slot) {
        const source = await getSlotTimes(Number(coverage.timetable_slot_id));
        const check = await validateSlotAvailability({
            collegeId: actor.collegeId,
            academicClassId: source.academicClassId,
            facultyIds: [Number(subEmp.faculty_user_id)],
            roomId: source.roomId,
            date: asISODate(coverage.affected_date),
            startTime: source.startTime,
            endTime: source.endTime,
            excludeSlotId: Number(coverage.timetable_slot_id),
        });
        if (!check.available) {
            throw new AppError(400, check.message || 'Substitute unavailable', { code: check.code });
        }
    }
    const status = requiresConsent ? 'REQUESTED' : 'ACCEPTED';
    await db('hr_leave_academic_coverage').where({ id: coverageId }).update({
        coverage_type: 'SUBSTITUTE_FACULTY',
        substitute_employee_id: substituteEmployeeId,
        substitute_faculty_id: subEmp.faculty_user_id,
        status,
        hod_action_required: false,
        reason: options?.reason ?? coverage.reason,
        requested_at: db.fn.now(),
        accepted_at: requiresConsent ? null : db.fn.now(),
    });
    if (requiresConsent) {
        const emp = await resolveEmployeeForActor(actor);
        await db('hr_leave_coverage_requests').insert({
            coverage_id: coverageId,
            requested_to_employee_id: substituteEmployeeId,
            requested_by_employee_id: emp?.id ?? coverage.original_faculty_employee_id,
            status: 'PENDING',
            request_type: 'SUBSTITUTE',
            message: options?.reason ?? 'HOD assigned substitute coverage',
        });
        await notifyEmployee({
            employeeId: substituteEmployeeId,
            collegeId: actor.collegeId,
            type: 'LEAVE_COVERAGE_REQUEST',
            title: 'HOD assigned class coverage',
            body: options?.reason ?? 'You have been nominated to cover a class.',
            relatedType: 'hr_leave_academic_coverage',
            relatedId: coverageId,
            dedupeKey: `hod-sub-${coverageId}-${substituteEmployeeId}`,
        });
    }
    await syncLeaveCoverageStatus(Number(coverage.leave_request_id));
    await recordHrAudit({ actor, action: 'HOD_SUBSTITUTE_ASSIGNED', entityType: 'hr_leave_academic_coverage', entityId: coverageId, after: { substituteEmployeeId } });
    return { coverageId, status };
}
export async function managerAuthorizedCancel(actor, coverageId, reason) {
    assertHrPermission(actor, 'academic.leave.coverage.manage');
    if (!reason?.trim())
        throw new AppError(400, 'Reason is required for authorized cancellation');
    const coverage = await db('hr_leave_academic_coverage').where({ id: coverageId, college_id: actor.collegeId }).first();
    if (!coverage)
        throw new AppError(404, 'Coverage not found');
    await db('hr_leave_academic_coverage').where({ id: coverageId }).update({
        coverage_type: 'CANCELLED_WITH_AUTHORIZATION',
        status: 'VERIFIED',
        reason,
        verified_at: db.fn.now(),
        verified_by: actor.facultyUserId,
    });
    await syncLeaveCoverageStatus(Number(coverage.leave_request_id));
    await recordHrAudit({ actor, action: 'AUTHORIZED_CANCELLATION', entityType: 'hr_leave_academic_coverage', entityId: coverageId, after: { reason } });
    return { coverageId, status: 'VERIFIED' };
}
export async function managerMarkTeamTeaching(actor, coverageId, notes) {
    assertHrPermission(actor, 'academic.leave.coverage.manage');
    const coverage = await db('hr_leave_academic_coverage').where({ id: coverageId, college_id: actor.collegeId }).first();
    if (!coverage)
        throw new AppError(404, 'Coverage not found');
    await db('hr_leave_academic_coverage').where({ id: coverageId }).update({
        coverage_type: 'ALREADY_COVERED',
        status: 'VERIFIED',
        reason: notes ?? 'Team teaching / already covered',
        verified_at: db.fn.now(),
        verified_by: actor.facultyUserId,
    });
    await syncLeaveCoverageStatus(Number(coverage.leave_request_id));
    return { coverageId, status: 'VERIFIED' };
}
export async function listManagerCoverage(actor, filter) {
    assertHrPermission(actor, 'academic.leave.coverage.manage');
    const today = new Date().toISOString().slice(0, 10);
    let q = db('hr_leave_academic_coverage as c')
        .join('hr_leave_requests as lr', 'lr.id', 'c.leave_request_id')
        .join('employees as e', 'e.id', 'lr.employee_id')
        .leftJoin('timetable_slots as ts', 'ts.id', 'c.timetable_slot_id')
        .leftJoin('courses as co', 'co.id', 'ts.course_id')
        .leftJoin('academic_classes as ac', 'ac.id', 'ts.academic_class_id')
        .leftJoin('employees as sub', 'sub.id', 'c.substitute_employee_id')
        .where({ 'c.college_id': actor.collegeId });
    if (filter === 'today')
        q = q.andWhere('c.affected_date', today);
    else if (filter === 'upcoming')
        q = q.andWhere('c.affected_date', '>', today);
    else if (filter === 'resolved')
        q = q.whereIn('c.status', ['VERIFIED', 'COMPLETED']);
    else if (filter === 'attention' || !filter) {
        q = q.andWhere((b) => {
            b.whereIn('c.status', ['UNRESOLVED', 'REQUESTED']).orWhere('c.hod_action_required', true);
        });
    }
    const rows = await q
        .select('c.*', 'e.display_name as employee_name', 'lr.is_emergency', 'lr.request_number', 'co.name as subject_name', 'ac.name as class_name', 'ts.start_time', 'ts.end_time', 'sub.display_name as substitute_name')
        .orderBy('c.priority', 'desc')
        .orderBy('c.affected_date');
    return rows.map((r) => ({
        id: Number(r.id),
        leaveRequestId: Number(r.leave_request_id),
        requestNumber: r.request_number,
        employeeName: r.employee_name,
        isEmergency: !!r.is_emergency,
        affectedDate: r.affected_date,
        coverageType: r.coverage_type,
        status: r.status,
        priority: r.priority ?? (r.is_emergency ? 'CRITICAL' : 'NORMAL'),
        subjectName: r.subject_name,
        className: r.class_name,
        startTime: r.start_time,
        endTime: r.end_time,
        substituteName: r.substitute_name,
        hodActionRequired: !!r.hod_action_required,
    }));
}
export async function finalizeLeaveCoverageNotifications(leaveRequestId, collegeId) {
    const coverages = await db('hr_leave_academic_coverage').where({ leave_request_id: leaveRequestId });
    for (const cov of coverages) {
        if (!cov.timetable_override_id && cov.status !== 'VERIFIED')
            continue;
        const slot = cov.timetable_slot_id
            ? await db('timetable_slots').where({ id: cov.timetable_slot_id }).first()
            : null;
        const type = String(cov.coverage_type);
        if (type === 'SUBSTITUTE_FACULTY' && cov.substitute_employee_id) {
            const sub = await db('employees').where({ id: cov.substitute_employee_id }).first();
            await notifyCoverageStudents(collegeId, cov, slot, 'SUBSTITUTION', { substituteName: sub?.display_name || 'Substitute faculty' });
        }
        else if (type === 'RESCHEDULE' && cov.makeup_date) {
            await notifyCoverageStudents(collegeId, cov, slot, 'RESCHEDULE', {
                newDate: asISODate(cov.makeup_date),
                newTime: cov.makeup_start_time ? String(cov.makeup_start_time).slice(0, 5) : undefined,
            });
        }
        else if (type === 'CANCELLED_WITH_AUTHORIZATION') {
            await notifyCoverageStudents(collegeId, cov, slot, 'CANCELLATION');
        }
    }
}
export async function reverseLeaveCoverageOnCancel(leaveRequestId, actor) {
    const collegeId = actor.collegeId;
    const cancelledBy = actor.facultyUserId;
    const coverages = await db('hr_leave_academic_coverage').where({ leave_request_id: leaveRequestId });
    for (const cov of coverages) {
        if (cov.timetable_override_id) {
            const coverageType = String(cov.coverage_type || '');
            const reversed = await db.transaction(async (trx) => cancelLeaveAcademicOverride(trx, Number(cov.timetable_override_id), cancelledBy));
            if (reversed && cov.substitute_employee_id) {
                await notifyEmployee({
                    employeeId: Number(cov.substitute_employee_id),
                    collegeId,
                    type: 'COVERAGE_CANCELLED',
                    title: 'Coverage cancelled',
                    body: `Leave was cancelled — your substitution on ${asISODate(cov.affected_date)} is no longer required.`,
                    relatedType: 'hr_leave_academic_coverage',
                    relatedId: Number(cov.id),
                    dedupeKey: `cov-cancel-${cov.id}`,
                });
            }
            if (reversed && ['SUBSTITUTE_FACULTY', 'RESCHEDULE', 'CLASS_SWAP'].includes(coverageType)) {
                const slot = cov.timetable_slot_id
                    ? await db('timetable_slots').where({ id: cov.timetable_slot_id }).first()
                    : null;
                await notifyCoverageStudents(collegeId, cov, slot, 'RESTORE');
            }
        }
        if (cov.secondary_override_id) {
            await db.transaction(async (trx) => cancelLeaveAcademicOverride(trx, Number(cov.secondary_override_id), cancelledBy));
        }
        await db('hr_leave_academic_coverage').where({ id: cov.id }).update({ status: 'CANCELLED' });
    }
    await recordHrAudit({
        actor,
        action: 'LEAVE_COVERAGE_REVERSED',
        entityType: 'hr_leave_requests',
        entityId: leaveRequestId,
    });
}
export async function listEligibleSubstitutes(actor, coverageId, search, opts) {
    let coverage;
    if (opts?.managerMode) {
        assertHrPermission(actor, 'academic.leave.coverage.manage');
        coverage = (await db('hr_leave_academic_coverage').where({ id: coverageId, college_id: actor.collegeId }).first());
        if (!coverage)
            throw new AppError(404, 'Coverage not found');
    }
    else {
        ({ coverage } = await assertCoverageOwner(actor, coverageId));
    }
    if (!coverage.timetable_slot_id)
        return [];
    const source = await getSlotTimes(Number(coverage.timetable_slot_id));
    const affectedDate = asISODate(coverage.affected_date);
    let q = db('employees as e')
        .join('faculty_users as f', 'f.id', 'e.faculty_user_id')
        .leftJoin('departments as d', 'd.id', 'e.department_id')
        .leftJoin('hr_designations as des', 'des.id', 'e.designation_id')
        .where({ 'e.college_id': actor.collegeId })
        .whereNot('e.id', Number(coverage.original_faculty_employee_id))
        .where('f.is_active', 1);
    if (search?.trim()) {
        const term = `%${search.trim()}%`;
        q = q.andWhere((b) => {
            b.whereILike('e.display_name', term).orWhereILike('e.employee_number', term);
        });
    }
    const faculty = await q
        .select('e.id', 'e.display_name', 'e.employee_number', 'e.faculty_user_id', 'd.name as department_name', 'des.name as designation_name')
        .orderBy('e.display_name')
        .limit(40);
    const results = [];
    for (const row of faculty) {
        const facultyUserId = Number(row.faculty_user_id);
        const onLeave = await validateFacultyOnLeave(Number(row.id), affectedDate);
        if (onLeave) {
            results.push({
                employeeId: Number(row.id),
                displayName: row.display_name,
                employeeNumber: row.employee_number,
                designationName: row.designation_name,
                departmentName: row.department_name,
                available: false,
                unavailableReason: 'On approved leave',
                code: 'EMPLOYEE_ON_LEAVE',
            });
            continue;
        }
        const check = await validateSlotAvailability({
            collegeId: actor.collegeId,
            academicClassId: source.academicClassId,
            facultyIds: [facultyUserId],
            roomId: source.roomId,
            date: affectedDate,
            startTime: source.startTime,
            endTime: source.endTime,
            excludeSlotId: Number(coverage.timetable_slot_id),
        });
        results.push({
            employeeId: Number(row.id),
            displayName: row.display_name,
            employeeNumber: row.employee_number,
            designationName: row.designation_name,
            departmentName: row.department_name,
            available: check.available,
            unavailableReason: check.available ? null : check.message,
            code: check.code ?? null,
        });
    }
    results.sort((a, b) => Number(b.available) - Number(a.available));
    return results;
}
function datesForWeekday(fromIso, toIso, dayOfWeek) {
    const out = [];
    let cur = fromIso;
    while (cur <= toIso) {
        if (weekdayOf(cur) === dayOfWeek)
            out.push(cur);
        cur = addDays(cur, 1);
    }
    return out;
}
export async function listSwapCompatibleSessions(actor, coverageId, swapEmployeeId) {
    const { emp, coverage } = await assertCoverageOwner(actor, coverageId);
    if (!coverage.timetable_slot_id)
        return { source: null, sessions: [] };
    const swapEmp = await db('employees').where({ id: swapEmployeeId, college_id: actor.collegeId }).first();
    if (!swapEmp?.faculty_user_id)
        throw new AppError(400, 'Swap partner must be teaching faculty');
    const source = await getSlotTimes(Number(coverage.timetable_slot_id));
    const affectedDate = asISODate(coverage.affected_date);
    const leaveReq = await db('hr_leave_requests').where({ id: coverage.leave_request_id }).first();
    const fromDate = asISODate(leaveReq?.from_date ?? coverage.affected_date);
    const toDate = asISODate(leaveReq?.to_date ?? coverage.affected_date);
    const requestFacultyId = Number(coverage.original_faculty_id);
    const sourceSlot = await db('timetable_slots as ts')
        .join('courses as co', 'co.id', 'ts.course_id')
        .join('academic_classes as ac', 'ac.id', 'ts.academic_class_id')
        .where('ts.id', coverage.timetable_slot_id)
        .select('co.name as subject_name', 'co.code as subject_code', 'ac.name as class_name', 'ts.start_time', 'ts.end_time', 'ts.start_period_number')
        .first();
    const partnerSlots = await db('timetable_slot_faculty as sf')
        .join('timetable_slots as ts', 'ts.id', 'sf.slot_id')
        .join('courses as co', 'co.id', 'ts.course_id')
        .join('academic_classes as ac', 'ac.id', 'ts.academic_class_id')
        .where({ 'sf.faculty_id': swapEmp.faculty_user_id, 'ts.college_id': actor.collegeId, 'ts.status': 'ACTIVE' })
        .whereNot('ts.id', coverage.timetable_slot_id)
        .select('ts.*', 'co.name as subject_name', 'co.code as subject_code', 'ac.name as class_name');
    const sessions = [];
    for (const slot of partnerSlots) {
        const dates = datesForWeekday(fromDate, toDate, Number(slot.day_of_week));
        for (const targetDate of dates) {
            if (targetDate === affectedDate)
                continue;
            const targetTimes = await getSlotTimes(Number(slot.id), targetDate);
            const sourceCheck = await validateSlotAvailability({
                collegeId: actor.collegeId,
                academicClassId: source.academicClassId,
                facultyIds: [Number(swapEmp.faculty_user_id)],
                roomId: source.roomId,
                date: affectedDate,
                startTime: source.startTime,
                endTime: source.endTime,
                excludeSlotId: Number(coverage.timetable_slot_id),
            });
            const targetCheck = await validateSlotAvailability({
                collegeId: actor.collegeId,
                academicClassId: targetTimes.academicClassId,
                facultyIds: [requestFacultyId],
                roomId: targetTimes.roomId,
                date: targetDate,
                startTime: targetTimes.startTime,
                endTime: targetTimes.endTime,
                excludeSlotId: Number(slot.id),
            });
            const available = sourceCheck.available && targetCheck.available;
            sessions.push({
                targetTimetableSlotId: Number(slot.id),
                targetDate,
                subjectName: slot.subject_name,
                subjectCode: slot.subject_code,
                className: slot.class_name,
                startTime: String(slot.start_time).slice(0, 5),
                endTime: String(slot.end_time).slice(0, 5),
                periodNumber: slot.start_period_number,
                available,
                conflictCode: !sourceCheck.available ? sourceCheck.code : !targetCheck.available ? targetCheck.code : null,
                conflictMessage: !sourceCheck.available ? sourceCheck.message : !targetCheck.available ? targetCheck.message : null,
            });
        }
    }
    sessions.sort((a, b) => Number(b.available) - Number(a.available));
    return {
        source: {
            subjectName: sourceSlot?.subject_name,
            subjectCode: sourceSlot?.subject_code,
            className: sourceSlot?.class_name,
            date: affectedDate,
            startTime: source.startTime,
            endTime: source.endTime,
            periodNumber: sourceSlot?.start_period_number,
        },
        swapEmployeeId,
        sessions,
    };
}
export async function getManagerCoverageDetail(actor, coverageId) {
    assertHrPermission(actor, 'academic.leave.coverage.manage');
    const row = await db('hr_leave_academic_coverage as c')
        .join('hr_leave_requests as lr', 'lr.id', 'c.leave_request_id')
        .join('employees as e', 'e.id', 'lr.employee_id')
        .leftJoin('timetable_slots as ts', 'ts.id', 'c.timetable_slot_id')
        .leftJoin('courses as co', 'co.id', 'ts.course_id')
        .leftJoin('academic_classes as ac', 'ac.id', 'ts.academic_class_id')
        .leftJoin('rooms as rm', 'rm.id', 'ts.room_id')
        .leftJoin('employees as sub', 'sub.id', 'c.substitute_employee_id')
        .where({ 'c.id': coverageId, 'c.college_id': actor.collegeId })
        .select('c.*', 'e.display_name as employee_name', 'lr.is_emergency', 'lr.reason as leave_reason', 'lr.request_number', 'co.name as subject_name', 'co.code as subject_code', 'ac.name as class_name', 'ts.start_time', 'ts.end_time', 'ts.start_period_number', 'rm.name as room_name', 'sub.display_name as substitute_name')
        .first();
    if (!row)
        throw new AppError(404, 'Coverage not found');
    return {
        id: Number(row.id),
        leaveRequestId: Number(row.leave_request_id),
        requestNumber: row.request_number,
        employeeName: row.employee_name,
        isEmergency: !!row.is_emergency,
        leaveReason: row.leave_reason,
        affectedDate: asISODate(row.affected_date),
        coverageType: row.coverage_type,
        status: row.status,
        priority: row.priority ?? 'NORMAL',
        hodActionRequired: !!row.hod_action_required,
        subjectName: row.subject_name,
        subjectCode: row.subject_code,
        className: row.class_name,
        roomName: row.room_name,
        periodNumber: row.start_period_number,
        startTime: row.start_time,
        endTime: row.end_time,
        substituteName: row.substitute_name,
        substituteEmployeeId: row.substitute_employee_id ? Number(row.substitute_employee_id) : null,
        reason: row.reason,
        makeupDate: row.makeup_date ? asISODate(row.makeup_date) : null,
        makeupStartTime: row.makeup_start_time ? String(row.makeup_start_time).slice(0, 5) : null,
        makeupEndTime: row.makeup_end_time ? String(row.makeup_end_time).slice(0, 5) : null,
    };
}
export { applyCoverageOverrides };
