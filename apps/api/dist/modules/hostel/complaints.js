import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertActiveResident, assertHostelPermission, assertWardenHostelAccess } from './access.js';
import { notifyHostelEvent } from './notifications.js';
export async function listStudentComplaints(studentId, collegeId) {
    const rows = await db('hostel_complaints')
        .where({ student_id: studentId, college_id: collegeId })
        .orderBy('created_at', 'desc')
        .limit(50);
    return rows.map(serializeComplaint);
}
function serializeComplaint(row) {
    return {
        id: Number(row.id),
        category: row.category,
        description: row.description,
        priority: row.priority,
        status: row.status,
        resolutionNotes: row.resolution_notes,
        resolvedAt: row.resolved_at,
        createdAt: row.created_at,
    };
}
export async function createComplaint(studentId, collegeId, input) {
    const resident = await assertActiveResident(studentId, collegeId);
    const [id] = await db('hostel_complaints').insert({
        college_id: collegeId,
        resident_id: resident.id,
        student_id: studentId,
        hostel_id: resident.hostel_id,
        room_id: input.roomId ?? null,
        category: input.category,
        description: input.description,
        status: 'OPEN',
    });
    return serializeComplaint((await db('hostel_complaints').where({ id }).first()));
}
export async function getComplaint(studentId, collegeId, complaintId) {
    const row = await db('hostel_complaints')
        .where({ id: complaintId, student_id: studentId, college_id: collegeId })
        .first();
    if (!row)
        throw new AppError(404, 'Complaint not found');
    return serializeComplaint(row);
}
export async function listHostelComplaints(actor, hostelId, status) {
    assertHostelPermission(actor, 'hostel.complaint.manage');
    let q = db('hostel_complaints as c')
        .join('students as s', 's.id', 'c.student_id')
        .where({ 'c.college_id': actor.collegeId });
    if (hostelId) {
        await assertWardenHostelAccess(actor, hostelId);
        q = q.andWhere('c.hostel_id', hostelId);
    }
    if (status)
        q = q.andWhere('c.status', status);
    const rows = await q
        .select('c.*', 's.usn', 's.name as student_name')
        .orderBy('c.created_at', 'desc')
        .limit(100);
    return rows.map((r) => ({ ...serializeComplaint(r), usn: r.usn, studentName: r.student_name }));
}
export async function updateComplaintStatus(actor, complaintId, status, resolutionNotes) {
    assertHostelPermission(actor, 'hostel.complaint.manage');
    const complaint = await db('hostel_complaints').where({ id: complaintId, college_id: actor.collegeId }).first();
    if (!complaint)
        throw new AppError(404, 'Complaint not found');
    await assertWardenHostelAccess(actor, Number(complaint.hostel_id));
    await db('hostel_complaints').where({ id: complaintId }).update({
        status,
        resolution_notes: resolutionNotes ?? complaint.resolution_notes,
        resolved_at: ['RESOLVED', 'CLOSED'].includes(status) ? db.fn.now() : complaint.resolved_at,
        assigned_to: complaint.assigned_to ?? actor.facultyUserId,
    });
    if (complaint.student_id) {
        await notifyHostelEvent({
            studentId: Number(complaint.student_id),
            collegeId: actor.collegeId,
            type: 'HOSTEL_COMPLAINT_UPDATE',
            title: 'Complaint status updated',
            body: `Your complaint status is now: ${status}`,
            link: `/lms/hostel/complaints/${complaintId}`,
            relatedType: 'HOSTEL_COMPLAINT',
            relatedId: complaintId,
        });
    }
    return { id: complaintId, status };
}
