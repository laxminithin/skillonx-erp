import { db } from '../../db/index.js';
import { recordServicesAudit } from './audit.js';
/**
 * Attendance integration for approved student leave/permission requests.
 *
 * Design (spec §2 — "avoid duplicate attendance or leave records"):
 *   We do NOT create a parallel leave table or insert new attendance rows.
 *   The authoritative record of the leave is the service request itself
 *   (dates live in its form_data). On approval we reconcile the student's
 *   EXISTING attendance marks in the leave window: any ABSENT mark is
 *   reclassified to EXCUSED and annotated with the request number, and the
 *   change is written to attendance_record_audits. PRESENT / LATE / already
 *   EXCUSED marks are never touched. The operation is idempotent — re-running
 *   it (or approving a re-opened request) reclassifies nothing already handled
 *   and inserts no duplicates, because it only ever transitions ABSENT→EXCUSED
 *   and marks each record with the originating request.
 */
const LEAVE_MARKER_PREFIX = 'Approved leave';
function parseFormData(raw) {
    if (!raw)
        return {};
    if (typeof raw === 'object')
        return raw;
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        }
        catch {
            return {};
        }
    }
    return {};
}
function toDateOnly(v) {
    if (!v)
        return null;
    const d = new Date(String(v));
    if (Number.isNaN(d.getTime()))
        return null;
    return d.toISOString().slice(0, 10);
}
/**
 * Resolve the [from, to] leave window from a request's form_data. Supports the
 * day-range leave type (fromDate/toDate) and the single-day permission type
 * (onDate). Returns null when no usable dates are present.
 */
export function resolveLeaveWindow(formData) {
    const from = toDateOnly(formData.fromDate) ?? toDateOnly(formData.onDate);
    const to = toDateOnly(formData.toDate) ?? toDateOnly(formData.onDate) ?? from;
    if (!from || !to)
        return null;
    return from <= to ? { from, to } : { from: to, to: from };
}
function toPeriod(v) {
    if (v == null || v === '')
        return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
}
function toClock(v) {
    if (typeof v !== 'string')
        return null;
    const trimmed = v.trim();
    return /^\d{1,2}:\d{2}/.test(trimmed) ? trimmed.slice(0, 5) : null;
}
/**
 * Reconcile attendance for a fully-approved leave/permission request.
 * Caller must have already verified the request belongs to `collegeId` and is
 * approved/completed. Safe to call more than once.
 */
export async function applyApprovedLeaveToAttendance(collegeId, requestId, actorFacultyId) {
    const request = await db('student_service_requests')
        .where({ id: requestId, college_id: collegeId })
        .first();
    if (!request)
        return { applied: false, window: null, reclassified: 0 };
    const window = resolveLeaveWindow(parseFormData(request.form_data));
    if (!window)
        return { applied: false, window: null, reclassified: 0 };
    const studentId = Number(request.student_id);
    const marker = `${LEAVE_MARKER_PREFIX} #${request.request_number ?? requestId}`;
    const formData = parseFormData(request.form_data);
    const fromPeriod = toPeriod(formData.fromPeriod);
    const toPeriodNo = toPeriod(formData.toPeriod) ?? fromPeriod;
    const fromTime = toClock(formData.fromTime);
    const toTime = toClock(formData.toTime);
    // Candidate records: this student's ABSENT marks on sessions dated within the
    // approved window. For short permission, optional period/time fields narrow
    // the eligible sessions; we never create synthetic attendance rows.
    let candidateQuery = db('attendance_records as ar')
        .join('attendance_sessions as s', 's.id', 'ar.attendance_session_id')
        .where('ar.college_id', collegeId)
        .where('ar.student_id', studentId)
        .where('ar.status', 'ABSENT')
        .whereBetween('s.session_date', [window.from, window.to]);
    if (fromPeriod != null && toPeriodNo != null) {
        const low = Math.min(fromPeriod, toPeriodNo);
        const high = Math.max(fromPeriod, toPeriodNo);
        candidateQuery = candidateQuery.whereBetween('s.period_number', [low, high]);
    }
    else if (fromTime && toTime) {
        candidateQuery = candidateQuery.where((q) => {
            q.whereBetween('s.start_time', [fromTime, toTime])
                .orWhereBetween('s.end_time', [fromTime, toTime])
                .orWhere((inner) => inner.where('s.start_time', '<=', fromTime).andWhere('s.end_time', '>=', toTime));
        });
    }
    const candidates = await candidateQuery.select('ar.id as record_id', 'ar.attendance_session_id', 'ar.status as from_status');
    let reclassified = 0;
    for (const c of candidates) {
        await db.transaction(async (trx) => {
            await trx('attendance_records')
                .where({ id: Number(c.record_id) })
                .update({ status: 'EXCUSED', remarks: marker, updated_at: trx.fn.now() });
            await trx('attendance_record_audits').insert({
                attendance_record_id: Number(c.record_id),
                attendance_session_id: Number(c.attendance_session_id),
                student_id: studentId,
                from_status: String(c.from_status),
                to_status: 'EXCUSED',
                reason: marker,
                changed_by: actorFacultyId,
            });
        });
        reclassified++;
    }
    await recordServicesAudit({
        collegeId,
        actorId: actorFacultyId,
        actorType: 'FACULTY',
        action: 'LEAVE_ATTENDANCE_RECONCILED',
        entityType: 'student_service_request',
        entityId: requestId,
        afterState: { window, fromPeriod, toPeriod: toPeriodNo, fromTime, toTime, reclassified, marker },
    });
    return { applied: true, window, reclassified };
}
const LEAVE_CATEGORIES = new Set(['LEAVE', 'PERMISSION']);
const LEAVE_CODES = new Set(['STUDENT_LEAVE_REQUEST', 'STUDENT_PERMISSION_REQUEST']);
/** Whether a request type should trigger attendance reconciliation on approval. */
export function isLeaveType(typeRow) {
    if (!typeRow)
        return false;
    return (LEAVE_CATEGORIES.has(String(typeRow.category ?? '')) || LEAVE_CODES.has(String(typeRow.code ?? '')));
}
