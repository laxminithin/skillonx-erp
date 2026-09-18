import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertTransportPermission } from './access.js';
import { notifyTransportEvent } from './notifications.js';
export async function listStudentComplaints(studentId, collegeId) {
    const rows = await db('transport_complaints')
        .where({ student_id: studentId, college_id: collegeId })
        .orderBy('created_at', 'desc');
    return rows.map(serializeComplaint);
}
export async function createStudentComplaint(studentId, collegeId, input) {
    const member = await db('transport_members')
        .where({ student_id: studentId, college_id: collegeId })
        .whereIn('status', ['ACTIVE', 'CANCELLATION_PENDING'])
        .first();
    const [id] = await db('transport_complaints').insert({
        college_id: collegeId,
        transport_member_id: member?.id ?? null,
        student_id: studentId,
        route_id: input.routeId ?? null,
        trip_id: input.tripId ?? null,
        category: input.category,
        description: input.description,
        status: 'OPEN',
    });
    return { id, status: 'OPEN' };
}
export async function listComplaints(actor, status) {
    assertTransportPermission(actor, 'transport.complaint.manage');
    let q = db('transport_complaints as c')
        .leftJoin('students as s', 's.id', 'c.student_id')
        .where({ 'c.college_id': actor.collegeId })
        .select('c.*', 's.name as student_name', 's.usn');
    if (status)
        q = q.andWhere('c.status', status);
    const rows = await q.orderBy('c.created_at', 'desc');
    return rows.map((r) => ({ ...serializeComplaint(r), studentName: r.student_name, usn: r.usn }));
}
export async function resolveComplaint(actor, complaintId, resolutionNotes) {
    assertTransportPermission(actor, 'transport.complaint.manage');
    const complaint = await db('transport_complaints')
        .where({ id: complaintId, college_id: actor.collegeId })
        .first();
    if (!complaint)
        throw new AppError(404, 'Complaint not found');
    await db('transport_complaints').where({ id: complaintId }).update({
        status: 'RESOLVED',
        resolution_notes: resolutionNotes,
        resolved_at: db.fn.now(),
        assigned_to: actor.facultyUserId,
    });
    if (complaint.student_id) {
        await notifyTransportEvent({
            studentId: Number(complaint.student_id),
            collegeId: actor.collegeId,
            type: 'TRANSPORT_COMPLAINT_UPDATE',
            title: 'Transport complaint resolved',
            body: resolutionNotes,
            relatedType: 'TRANSPORT_COMPLAINT',
            relatedId: complaintId,
        });
    }
    return { id: complaintId, status: 'RESOLVED' };
}
function serializeComplaint(row) {
    return {
        id: Number(row.id),
        category: row.category,
        description: row.description,
        status: row.status,
        resolutionNotes: row.resolution_notes,
        resolvedAt: row.resolved_at,
        createdAt: row.created_at,
    };
}
export async function createIncident(actor, input) {
    if ('facultyUserId' in actor) {
        assertTransportPermission(actor, 'transport.incident.manage');
    }
    const collegeId = actor.collegeId;
    const reportedBy = 'facultyUserId' in actor ? actor.facultyUserId : actor.reportedBy;
    const [id] = await db('transport_incidents').insert({
        college_id: collegeId,
        route_id: input.routeId ?? null,
        trip_id: input.tripId ?? null,
        vehicle_id: input.vehicleId ?? null,
        student_id: input.studentId ?? null,
        reported_by: reportedBy,
        reported_by_type: 'reportedByType' in actor ? actor.reportedByType ?? 'FACULTY' : 'FACULTY',
        incident_type: input.incidentType,
        occurred_at: input.occurredAt ?? new Date(),
        severity: input.severity ?? 'MEDIUM',
        description: input.description,
        status: 'OPEN',
    });
    return { id, status: 'OPEN' };
}
export async function listIncidents(actor) {
    assertTransportPermission(actor, 'transport.incident.manage');
    const rows = await db('transport_incidents')
        .where({ college_id: actor.collegeId })
        .orderBy('occurred_at', 'desc');
    return rows.map((r) => ({
        id: Number(r.id),
        incidentType: r.incident_type,
        severity: r.severity,
        description: r.description,
        status: r.status,
        occurredAt: r.occurred_at,
    }));
}
