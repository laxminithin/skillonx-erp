import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertHrPermission, assertManagerScope, requireEmployeeForActor } from './access.js';
import { recordHrAudit } from './audit.js';
import { notifyEmployee } from './notifications.js';
import { calculateEmployeeDay, upsertDailyRecord, isMonthLocked } from './attendanceEngine.js';
const REGULARIZATION_REASONS = [
    'MISSED_PUNCH',
    'DEVICE_FAILURE',
    'OFFICIAL_WORK',
    'WRONG_SHIFT',
    'APPROVED_LATE_ARRIVAL',
    'APPROVED_EARLY_DEPARTURE',
    'OTHER',
];
function serializeRegularization(row) {
    return {
        id: Number(row.id),
        employeeId: Number(row.employee_id),
        attendanceDate: row.attendance_date,
        previousStatus: row.previous_status,
        newStatus: row.new_status,
        reason: row.reason,
        regularizationReason: row.regularization_reason,
        requestedInAt: row.requested_in_at,
        requestedOutAt: row.requested_out_at,
        status: row.status,
        decisionRemarks: row.decision_remarks,
        requestedBy: row.requested_by ? Number(row.requested_by) : null,
        approvedBy: row.approved_by ? Number(row.approved_by) : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        employeeName: row.employee_name,
        employeeNumber: row.employee_number,
    };
}
export async function submitRegularization(actor, input) {
    const emp = await requireEmployeeForActor(actor);
    const [y, m] = input.attendanceDate.split('-').map(Number);
    if (await isMonthLocked(actor.collegeId, y, m)) {
        throw new AppError(400, 'Attendance month is locked; cannot submit regularization');
    }
    const existing = await db('employee_attendance_records')
        .where({ employee_id: emp.id, attendance_date: input.attendanceDate })
        .first();
    const pending = await db('employee_attendance_adjustments')
        .where({ employee_id: emp.id, attendance_date: input.attendanceDate, status: 'PENDING' })
        .first();
    if (pending)
        throw new AppError(400, 'A pending regularization already exists for this date');
    const newStatus = input.newStatus ?? 'PRESENT';
    const [id] = await db('employee_attendance_adjustments').insert({
        college_id: actor.collegeId,
        employee_id: emp.id,
        attendance_date: input.attendanceDate,
        previous_status: existing?.attendance_status ?? null,
        new_status: newStatus,
        reason: input.reason,
        regularization_reason: input.regularizationReason,
        requested_in_at: input.requestedInAt ?? null,
        requested_out_at: input.requestedOutAt ?? null,
        status: 'PENDING',
        requested_by: actor.facultyUserId,
        attendance_record_id: existing?.id ?? null,
    });
    const manager = await db('employees').where({ id: emp.reporting_manager_employee_id }).first();
    if (manager?.faculty_user_id) {
        await notifyEmployee({
            collegeId: actor.collegeId,
            employeeId: Number(manager.id),
            type: 'REGULARIZATION_SUBMITTED',
            title: 'Regularization pending approval',
            body: `${emp.display_name} submitted attendance regularization for ${input.attendanceDate}`,
            dedupeKey: `REG_SUBMIT:${id}`,
            relatedType: 'employee_attendance_adjustments',
            relatedId: id,
        });
    }
    await recordHrAudit({ actor, action: 'REGULARIZATION_SUBMITTED', entityType: 'employee_attendance_adjustments', entityId: id });
    const row = await db('employee_attendance_adjustments').where({ id }).first();
    return serializeRegularization(row);
}
export async function listMyRegularizations(actor) {
    const emp = await requireEmployeeForActor(actor);
    const rows = await db('employee_attendance_adjustments')
        .where({ employee_id: emp.id })
        .orderBy('created_at', 'desc')
        .limit(50);
    return rows.map(serializeRegularization);
}
export async function listPendingRegularizations(actor) {
    assertHrPermission(actor, 'hr.attendance.view');
    const self = await requireEmployeeForActor(actor).catch(() => null);
    let q = db('employee_attendance_adjustments as a')
        .join('employees as e', 'e.id', 'a.employee_id')
        .where({ 'a.college_id': actor.collegeId, 'a.status': 'PENDING' })
        .select('a.*', 'e.display_name as employee_name', 'e.employee_number');
    if (self && !['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'].includes(actor.role)) {
        q = q.andWhere('e.reporting_manager_employee_id', self.id);
    }
    const rows = await q.orderBy('a.created_at', 'desc');
    return rows.map(serializeRegularization);
}
export async function approveRegularization(actor, adjustmentId, remarks) {
    assertHrPermission(actor, 'hr.attendance.view');
    const adj = await db('employee_attendance_adjustments')
        .where({ id: adjustmentId, college_id: actor.collegeId })
        .first();
    if (!adj)
        throw new AppError(404, 'Regularization not found');
    if (adj.status !== 'PENDING')
        throw new AppError(400, 'Regularization is not pending');
    await assertManagerScope(actor, Number(adj.employee_id));
    await db.transaction(async (trx) => {
        const locked = await trx('employee_attendance_adjustments').where({ id: adjustmentId }).forUpdate().first();
        if (!locked || locked.status !== 'PENDING')
            return;
        await trx('employee_attendance_adjustments').where({ id: adjustmentId }).update({
            status: 'APPROVED',
            approved_by: actor.facultyUserId,
            decision_remarks: remarks ?? null,
            updated_at: trx.fn.now(),
        });
    });
    const result = await calculateEmployeeDay(Number(adj.employee_id), String(adj.attendance_date));
    await upsertDailyRecord(Number(adj.employee_id), String(adj.attendance_date), result);
    const updatedAdj = await db('employee_attendance_adjustments').where({ id: adjustmentId }).first();
    if (updatedAdj) {
        await db('employee_attendance_records')
            .where({ employee_id: adj.employee_id, attendance_date: adj.attendance_date })
            .update({ approved_adjustment_id: adjustmentId });
    }
    await notifyEmployee({
        collegeId: actor.collegeId,
        employeeId: Number(adj.employee_id),
        type: 'REGULARIZATION_APPROVED',
        title: 'Regularization approved',
        body: `Your attendance regularization for ${adj.attendance_date} was approved`,
        dedupeKey: `REG_APPROVED:${adjustmentId}`,
        relatedType: 'employee_attendance_adjustments',
        relatedId: adjustmentId,
    });
    await recordHrAudit({ actor, action: 'REGULARIZATION_APPROVED', entityType: 'employee_attendance_adjustments', entityId: adjustmentId, reason: remarks });
    return serializeRegularization(updatedAdj ?? adj);
}
export async function rejectRegularization(actor, adjustmentId, remarks) {
    assertHrPermission(actor, 'hr.attendance.view');
    const adj = await db('employee_attendance_adjustments')
        .where({ id: adjustmentId, college_id: actor.collegeId })
        .first();
    if (!adj)
        throw new AppError(404, 'Regularization not found');
    if (adj.status !== 'PENDING')
        throw new AppError(400, 'Regularization is not pending');
    await assertManagerScope(actor, Number(adj.employee_id));
    await db.transaction(async (trx) => {
        const locked = await trx('employee_attendance_adjustments').where({ id: adjustmentId }).forUpdate().first();
        if (!locked || locked.status !== 'PENDING')
            return;
        await trx('employee_attendance_adjustments').where({ id: adjustmentId }).update({
            status: 'REJECTED',
            rejected_by: actor.facultyUserId,
            rejected_at: trx.fn.now(),
            decision_remarks: remarks ?? null,
        });
    });
    await notifyEmployee({
        collegeId: actor.collegeId,
        employeeId: Number(adj.employee_id),
        type: 'REGULARIZATION_REJECTED',
        title: 'Regularization rejected',
        body: `Your attendance regularization for ${adj.attendance_date} was rejected`,
        dedupeKey: `REG_REJECTED:${adjustmentId}`,
        relatedType: 'employee_attendance_adjustments',
        relatedId: adjustmentId,
    });
    await recordHrAudit({ actor, action: 'REGULARIZATION_REJECTED', entityType: 'employee_attendance_adjustments', entityId: adjustmentId, reason: remarks });
    const updated = await db('employee_attendance_adjustments').where({ id: adjustmentId }).first();
    return serializeRegularization(updated);
}
export { REGULARIZATION_REASONS };
