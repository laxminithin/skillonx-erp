import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { hasOfficeCapability } from '../office/access.js';
import { canViewGrievance } from './grievances.js';
function storageRoot() {
    return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../uploads/student-services');
}
export async function authorizeRequestAttachment(actor, attachmentId) {
    const attachment = await db('student_service_attachments as a')
        .join('student_service_requests as r', 'r.id', 'a.request_id')
        .where({ 'a.id': attachmentId, 'a.college_id': actor.collegeId, 'r.college_id': actor.collegeId })
        .select('a.*', 'r.student_id', 'r.requester_type', 'r.requester_faculty_id')
        .first();
    if (!attachment)
        throw new AppError(404, 'Attachment not found');
    const officeAllowed = hasOfficeCapability(actor.role, 'request.view');
    const ownerAllowed = (actor.role === 'STUDENT' && Number(attachment.student_id) === Number(actor.studentId))
        || (actor.role === 'FACULTY' && attachment.requester_type === 'FACULTY' && Number(attachment.requester_faculty_id) === Number(actor.facultyUserId));
    if (!officeAllowed && !ownerAllowed)
        throw new AppError(403, 'Attachment access denied');
    return attachment;
}
export async function readRequestAttachment(actor, attachmentId) {
    const attachment = await authorizeRequestAttachment(actor, attachmentId);
    const root = storageRoot();
    const full = path.resolve(root, String(attachment.storage_key));
    if (full !== root && !full.startsWith(`${root}${path.sep}`))
        throw new AppError(404, 'Attachment not found');
    try {
        return { attachment, body: await readFile(full) };
    }
    catch {
        throw new AppError(404, 'Attachment file not found');
    }
}
export async function authorizeGrievanceAttachment(actor, attachmentId) {
    const attachment = await db('student_grievance_attachments as a')
        .join('student_grievances as g', 'g.id', 'a.grievance_id')
        .where({ 'a.id': attachmentId, 'a.college_id': actor.collegeId, 'g.college_id': actor.collegeId })
        .select('a.*', 'g.student_id', 'g.category', 'g.case_type', 'g.confidentiality', 'g.assigned_to_faculty_id')
        .first();
    if (!attachment)
        throw new AppError(404, 'Attachment not found');
    const ownerAllowed = actor.role === 'STUDENT' && Number(attachment.student_id) === Number(actor.studentId);
    if (!ownerAllowed) {
        if (!actor.facultyUserId)
            throw new AppError(403, 'Attachment access denied');
        const allowed = await canViewGrievance({
            role: actor.role,
            collegeId: actor.collegeId,
            facultyUserId: actor.facultyUserId,
            departmentId: actor.departmentId,
        }, attachment, true);
        if (!allowed)
            throw new AppError(403, 'Attachment access denied');
    }
    return attachment;
}
export async function readGrievanceAttachment(actor, attachmentId) {
    const attachment = await authorizeGrievanceAttachment(actor, attachmentId);
    const root = storageRoot();
    const full = path.resolve(root, 'grievances', String(attachment.storage_key));
    const grievanceRoot = path.resolve(root, 'grievances');
    if (full !== grievanceRoot && !full.startsWith(`${grievanceRoot}${path.sep}`))
        throw new AppError(404, 'Attachment not found');
    try {
        return { attachment, body: await readFile(full) };
    }
    catch {
        throw new AppError(404, 'Attachment file not found');
    }
}
