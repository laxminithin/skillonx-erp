import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertHostelPermission } from './access.js';
import { recordHostelAudit } from './audit.js';
import { verifyOutpassToken } from './outpasses.js';
import { getHostelPolicy } from './defaults.js';
export async function searchResident(collegeId, query) {
    const rows = await db('hostel_residents as r')
        .join('students as s', 's.id', 'r.student_id')
        .leftJoin('hostel_bed_allocations as a', function join() {
        this.on('a.resident_id', '=', 'r.id').andOn('a.status', '=', db.raw('?', ['ACTIVE']));
    })
        .leftJoin('hostel_rooms as rm', 'rm.id', 'a.room_id')
        .leftJoin('hostel_beds as b', 'b.id', 'a.bed_id')
        .leftJoin('hostels as h', 'h.id', 'r.hostel_id')
        .where({ 'r.college_id': collegeId })
        .whereIn('r.status', ['ACTIVE', 'TEMPORARILY_AWAY', 'VACATING'])
        .andWhere(function where() {
        this.where('s.usn', 'like', `%${query}%`).orWhere('s.name', 'like', `%${query}%`);
    })
        .select('r.*', 's.usn', 's.name as student_name', 'rm.room_number', 'b.bed_code', 'h.name as hostel_name')
        .limit(20);
    return rows.map((r) => ({
        residentId: Number(r.id),
        studentId: Number(r.student_id),
        usn: r.usn,
        studentName: r.student_name,
        hostelName: r.hostel_name,
        roomNumber: r.room_number,
        bedCode: r.bed_code,
        status: r.status,
    }));
}
export async function recordGateExit(actor, input) {
    assertHostelPermission(actor, 'hostel.gate.manage');
    const resident = await db('hostel_residents').where({ id: input.residentId, college_id: actor.collegeId }).first();
    if (!resident)
        throw new AppError(404, 'Resident not found');
    if (input.outpassId) {
        const outpass = await db('hostel_outpasses').where({ id: input.outpassId, resident_id: input.residentId }).first();
        if (!outpass || !['APPROVED', 'ACTIVE'].includes(outpass.status)) {
            throw new AppError(403, 'Valid approved outpass required for exit');
        }
        await db('hostel_outpasses').where({ id: input.outpassId }).update({
            status: 'ACTIVE',
            actual_exit_at: db.fn.now(),
        });
    }
    else if (input.source !== 'EMERGENCY') {
        throw new AppError(403, 'Outpass or emergency override required for exit');
    }
    await db('hostel_gate_movements').insert({
        college_id: actor.collegeId,
        resident_id: input.residentId,
        outpass_id: input.outpassId ?? null,
        leave_id: input.leaveId ?? null,
        movement_type: 'EXIT',
        gate: input.gate ?? null,
        recorded_by: actor.facultyUserId,
        source: input.source ?? (input.outpassId ? 'OUTPASS' : 'MANUAL'),
        remarks: input.remarks ?? null,
    });
    return { residentId: input.residentId, movementType: 'EXIT', recorded: true };
}
export async function recordGateEntry(actor, input) {
    assertHostelPermission(actor, 'hostel.gate.manage');
    const resident = await db('hostel_residents').where({ id: input.residentId, college_id: actor.collegeId }).first();
    if (!resident)
        throw new AppError(404, 'Resident not found');
    if (input.outpassId) {
        const outpass = await db('hostel_outpasses').where({ id: input.outpassId }).first();
        if (outpass && outpass.status === 'ACTIVE') {
            const returnAt = new Date();
            const expected = new Date(outpass.expected_return_at);
            const lateMinutes = Math.max(0, Math.floor((returnAt.getTime() - expected.getTime()) / 60000));
            await db('hostel_outpasses').where({ id: input.outpassId }).update({
                status: lateMinutes > 0 ? 'RETURNED' : 'RETURNED',
                actual_return_at: returnAt,
                late_return_minutes: lateMinutes,
            });
            if (lateMinutes > 0) {
                const policy = await getHostelPolicy(actor.collegeId);
                if (policy.lateEntryPolicy === 'INCIDENT') {
                    await db('hostel_incidents').insert({
                        college_id: actor.collegeId,
                        hostel_id: resident.hostel_id,
                        resident_id: input.residentId,
                        incident_type: 'LATE_RETURN',
                        occurred_at: returnAt,
                        severity: 'LOW',
                        description: `Late return by ${lateMinutes} minutes on outpass ${outpass.outpass_number}`,
                        status: 'OPEN',
                        reported_by: actor.facultyUserId,
                    });
                }
            }
        }
    }
    if (input.leaveId) {
        await db('hostel_leave_requests').where({ id: input.leaveId }).update({
            status: 'RETURNED',
            actual_return_at: db.fn.now(),
        });
    }
    await db('hostel_gate_movements').insert({
        college_id: actor.collegeId,
        resident_id: input.residentId,
        outpass_id: input.outpassId ?? null,
        leave_id: input.leaveId ?? null,
        movement_type: 'ENTRY',
        gate: input.gate ?? null,
        recorded_by: actor.facultyUserId,
        source: input.outpassId ? 'OUTPASS' : input.leaveId ? 'LEAVE' : 'MANUAL',
        remarks: input.remarks ?? null,
    });
    return { residentId: input.residentId, movementType: 'ENTRY', recorded: true };
}
export async function emergencyOverride(actor, residentId, movementType, reason, gate) {
    assertHostelPermission(actor, 'hostel.gate.manage');
    if (!reason?.trim())
        throw new AppError(400, 'Reason required for emergency override');
    await db('hostel_gate_movements').insert({
        college_id: actor.collegeId,
        resident_id: residentId,
        movement_type: movementType,
        gate: gate ?? null,
        recorded_by: actor.facultyUserId,
        source: 'EMERGENCY',
        remarks: reason,
    });
    await recordHostelAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'GATE_EMERGENCY_OVERRIDE',
        entityType: 'HOSTEL_RESIDENT',
        entityId: residentId,
        reason,
        afterState: { movementType },
    });
    return { residentId, movementType, source: 'EMERGENCY' };
}
export async function listResidentsOutside(actor, hostelId) {
    assertHostelPermission(actor, 'hostel.gate.manage');
    let q = db('hostel_outpasses as o')
        .join('students as s', 's.id', 'o.student_id')
        .join('hostel_residents as r', 'r.id', 'o.resident_id')
        .where({ 'o.college_id': actor.collegeId, 'o.status': 'ACTIVE' })
        .select('o.*', 's.usn', 's.name as student_name', 'r.hostel_id');
    if (hostelId)
        q = q.andWhere('r.hostel_id', hostelId);
    const rows = await q.orderBy('o.expected_return_at', 'asc');
    return rows.map((r) => ({
        outpassId: Number(r.id),
        residentId: Number(r.resident_id),
        usn: r.usn,
        studentName: r.student_name,
        outpassNumber: r.outpass_number,
        expectedReturnAt: r.expected_return_at,
        actualExitAt: r.actual_exit_at,
    }));
}
export async function listOverdueReturns(actor, hostelId) {
    assertHostelPermission(actor, 'hostel.gate.manage');
    const now = new Date();
    let q = db('hostel_outpasses as o')
        .join('students as s', 's.id', 'o.student_id')
        .join('hostel_residents as r', 'r.id', 'o.resident_id')
        .where({ 'o.college_id': actor.collegeId })
        .whereIn('o.status', ['ACTIVE', 'OVERDUE'])
        .where('o.expected_return_at', '<', now)
        .select('o.*', 's.usn', 's.name as student_name');
    if (hostelId)
        q = q.andWhere('r.hostel_id', hostelId);
    const rows = await q.orderBy('o.expected_return_at', 'asc');
    return rows.map((r) => ({
        outpassId: Number(r.id),
        residentId: Number(r.resident_id),
        usn: r.usn,
        studentName: r.student_name,
        outpassNumber: r.outpass_number,
        expectedReturnAt: r.expected_return_at,
        minutesOverdue: Math.floor((now.getTime() - new Date(r.expected_return_at).getTime()) / 60000),
    }));
}
export async function verifyOutpassByToken(actor, token) {
    assertHostelPermission(actor, 'hostel.gate.manage');
    return verifyOutpassToken(actor.collegeId, token);
}
