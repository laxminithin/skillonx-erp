import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { canEditOwnRecords, canVerify } from './access.js';
import { getRecord, loadRecordRow } from './records.js';
import { domainConfig } from './types.js';
async function recordHistory(collegeId, recordId, action, fromStatus, toStatus, actor, remarks) {
    await db('faculty_record_verifications').insert({
        college_id: collegeId,
        record_id: recordId,
        action,
        from_status: fromStatus,
        to_status: toStatus,
        acted_by_faculty_id: actor.facultyUserId,
        acted_by_role: actor.role,
        remarks: remarks ?? null,
    });
}
/** Owner submits a record for verification. */
export async function submitRecord(actor, employee, recordId) {
    if (!canEditOwnRecords(actor, employee))
        throw new AppError(403, 'Only the owner can submit records');
    const row = await loadRecordRow(actor, employee, recordId);
    const cfg = domainConfig(String(row.domain));
    if (!cfg?.verifiable)
        throw new AppError(400, 'This record type does not require verification');
    const from = String(row.verification_status);
    if (!['DRAFT', 'RETURNED', 'REJECTED'].includes(from)) {
        throw new AppError(409, `Cannot submit a record in ${from} state`);
    }
    await db('faculty_records').where({ id: recordId, college_id: actor.collegeId }).update({
        verification_status: 'SUBMITTED',
        submitted_at: db.fn.now(),
        updated_at: db.fn.now(),
    });
    await recordHistory(actor.collegeId, recordId, 'SUBMIT', from, 'SUBMITTED', actor);
    return getRecord(actor, employee, recordId);
}
/**
 * A verifier (never the owner) verifies / returns / rejects a submitted record.
 * Faculty can NEVER self-verify (enforced in canVerify).
 */
export async function actOnVerification(actor, employee, recordId, action, remarks) {
    if (!canVerify(actor, employee)) {
        throw new AppError(403, 'You are not authorized to verify this faculty’s records');
    }
    const row = await loadRecordRow(actor, employee, recordId);
    const cfg = domainConfig(String(row.domain));
    if (!cfg?.verifiable)
        throw new AppError(400, 'This record type does not require verification');
    const from = String(row.verification_status);
    if (from !== 'SUBMITTED') {
        throw new AppError(409, `Only submitted records can be acted on (current: ${from})`);
    }
    const toStatus = action === 'VERIFY' ? 'VERIFIED' : action === 'RETURN' ? 'RETURNED' : 'REJECTED';
    const patch = {
        verification_status: toStatus,
        verify_remarks: remarks ?? null,
        updated_at: db.fn.now(),
    };
    if (action === 'VERIFY') {
        patch.verified_by_faculty_id = actor.facultyUserId;
        patch.verified_by_role = actor.role;
        patch.verified_at = db.fn.now();
    }
    else {
        patch.verified_by_faculty_id = null;
        patch.verified_by_role = null;
        patch.verified_at = null;
    }
    await db('faculty_records').where({ id: recordId, college_id: actor.collegeId }).update(patch);
    await recordHistory(actor.collegeId, recordId, action, from, toStatus, actor, remarks);
    return getRecord(actor, employee, recordId);
}
/**
 * Verification inbox for a verifier: submitted records across the faculty they
 * are authorized to verify (HOD -> own department; institution roles -> college).
 */
export async function verificationInbox(actor, filters = {}) {
    const q = db('faculty_records as r')
        .join('employees as e', 'e.id', 'r.employee_id')
        .leftJoin('departments as d', 'd.id', 'e.department_id')
        .where('r.college_id', actor.collegeId)
        .where('r.is_archived', false)
        .where('r.verification_status', filters.verificationStatus ?? 'SUBMITTED');
    const isInstitution = ['PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN', 'IQAC_COORDINATOR', 'NBA_COORDINATOR', 'COLLEGE_ADMIN']
        .includes(actor.role);
    if (actor.role === 'HOD') {
        if (actor.departmentId == null)
            return [];
        q.where('e.department_id', actor.departmentId);
    }
    else if (!isInstitution) {
        return []; // faculty / others have no inbox
    }
    else if (filters.departmentId) {
        q.where('e.department_id', filters.departmentId);
    }
    const rows = await q
        .select('r.id', 'r.domain', 'r.record_type', 'r.title', 'r.academic_year_label', 'r.status', 'r.verification_status', 'r.submitted_at', 'r.employee_id', 'e.display_name as faculty_name', 'e.employee_number', 'd.name as department_name')
        .orderBy('r.submitted_at', 'asc');
    return rows.map((r) => ({
        id: Number(r.id),
        employeeId: Number(r.employee_id),
        facultyName: r.faculty_name,
        employeeNumber: r.employee_number,
        department: r.department_name ?? null,
        domain: r.domain,
        recordType: r.record_type ?? null,
        title: r.title,
        academicYearLabel: r.academic_year_label ?? null,
        status: r.status ?? null,
        verificationStatus: r.verification_status,
        submittedAt: r.submitted_at,
    }));
}
