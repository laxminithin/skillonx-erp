import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertActiveResident, assertHostelPermission, assertWardenHostelAccess } from './access.js';
function maskIdReference(ref) {
    if (!ref || ref.length <= 4)
        return ref ?? null;
    return `${'*'.repeat(ref.length - 4)}${ref.slice(-4)}`;
}
export async function listStudentVisitors(studentId, collegeId) {
    const resident = await assertActiveResident(studentId, collegeId);
    const rows = await db('hostel_visitor_visits as v')
        .join('hostel_visitors as vis', 'vis.id', 'v.visitor_id')
        .where({ 'v.resident_id': resident.id, 'v.college_id': collegeId })
        .select('v.*', 'vis.name as visitor_name', 'vis.relationship')
        .orderBy('v.created_at', 'desc')
        .limit(50);
    return rows.map((r) => ({
        id: Number(r.id),
        visitorName: r.visitor_name,
        relationship: r.relationship,
        purpose: r.purpose,
        status: r.status,
        entryAt: r.entry_at,
        expectedExitAt: r.expected_exit_at,
        actualExitAt: r.actual_exit_at,
    }));
}
export async function requestVisitor(studentId, collegeId, input) {
    const resident = await assertActiveResident(studentId, collegeId);
    const [visitorId] = await db('hostel_visitors').insert({
        college_id: collegeId,
        name: input.name,
        phone: input.phone ?? null,
        relationship: input.relationship ?? null,
    });
    const [visitId] = await db('hostel_visitor_visits').insert({
        college_id: collegeId,
        visitor_id: visitorId,
        resident_id: resident.id,
        student_id: studentId,
        purpose: input.purpose ?? null,
        expected_exit_at: input.expectedExitAt ?? null,
        status: 'REQUESTED',
    });
    return { id: visitId, visitorId, status: 'REQUESTED' };
}
export async function approveVisitor(actor, visitId, action) {
    assertHostelPermission(actor, 'hostel.visitor.manage');
    const visit = await db('hostel_visitor_visits').where({ id: visitId, college_id: actor.collegeId }).first();
    if (!visit || visit.status !== 'REQUESTED')
        throw new AppError(400, 'Visit not pending approval');
    const resident = await db('hostel_residents').where({ id: visit.resident_id }).first();
    if (resident)
        await assertWardenHostelAccess(actor, Number(resident.hostel_id));
    await db('hostel_visitor_visits').where({ id: visitId }).update({
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        approved_by: actor.facultyUserId,
    });
    return { id: visitId, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' };
}
export async function checkInVisitor(actor, visitId) {
    assertHostelPermission(actor, 'hostel.gate.manage');
    const visit = await db('hostel_visitor_visits').where({ id: visitId, college_id: actor.collegeId }).first();
    if (!visit || visit.status !== 'APPROVED')
        throw new AppError(400, 'Visit must be approved before check-in');
    await db('hostel_visitor_visits').where({ id: visitId }).update({
        status: 'CHECKED_IN',
        entry_at: db.fn.now(),
    });
    return { id: visitId, status: 'CHECKED_IN' };
}
export async function checkOutVisitor(actor, visitId) {
    assertHostelPermission(actor, 'hostel.gate.manage');
    const visit = await db('hostel_visitor_visits').where({ id: visitId, college_id: actor.collegeId }).first();
    if (!visit)
        throw new AppError(404, 'Visit not found');
    await db('hostel_visitor_visits').where({ id: visitId }).update({
        status: 'CHECKED_OUT',
        actual_exit_at: db.fn.now(),
    });
    return { id: visitId, status: 'CHECKED_OUT' };
}
export async function listActiveVisitors(actor, hostelId) {
    assertHostelPermission(actor, 'hostel.gate.manage');
    let q = db('hostel_visitor_visits as v')
        .join('hostel_visitors as vis', 'vis.id', 'v.visitor_id')
        .join('hostel_residents as r', 'r.id', 'v.resident_id')
        .join('students as s', 's.id', 'v.student_id')
        .where({ 'v.college_id': actor.collegeId, 'v.status': 'CHECKED_IN' })
        .select('v.*', 'vis.name as visitor_name', 'vis.phone', 's.usn', 's.name as resident_name');
    if (hostelId)
        q = q.andWhere('r.hostel_id', hostelId);
    const rows = await q.orderBy('v.entry_at', 'asc');
    return rows.map((r) => ({
        id: Number(r.id),
        visitorName: r.visitor_name,
        residentName: r.resident_name,
        usn: r.usn,
        entryAt: r.entry_at,
        expectedExitAt: r.expected_exit_at,
    }));
}
export async function getVisitorDetail(actor, visitId) {
    assertHostelPermission(actor, 'hostel.visitor.manage');
    const row = await db('hostel_visitor_visits as v')
        .join('hostel_visitors as vis', 'vis.id', 'v.visitor_id')
        .where({ 'v.id': visitId, 'v.college_id': actor.collegeId })
        .select('v.*', 'vis.name', 'vis.phone', 'vis.relationship', 'vis.id_type', 'vis.id_reference_masked')
        .first();
    if (!row)
        throw new AppError(404, 'Visit not found');
    return {
        id: Number(row.id),
        name: row.name,
        phone: row.phone,
        relationship: row.relationship,
        idType: row.id_type,
        idReferenceMasked: maskIdReference(row.id_reference_masked),
        purpose: row.purpose,
        status: row.status,
        entryAt: row.entry_at,
        expectedExitAt: row.expected_exit_at,
        actualExitAt: row.actual_exit_at,
    };
}
