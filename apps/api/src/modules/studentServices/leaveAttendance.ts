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

function parseFormData(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

function toDateOnly(v: unknown): string | null {
  if (!v) return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/**
 * Resolve the [from, to] leave window from a request's form_data. Supports the
 * day-range leave type (fromDate/toDate) and the single-day permission type
 * (onDate). Returns null when no usable dates are present.
 */
export function resolveLeaveWindow(formData: Record<string, unknown>): { from: string; to: string } | null {
  const from = toDateOnly(formData.fromDate) ?? toDateOnly(formData.onDate);
  const to = toDateOnly(formData.toDate) ?? toDateOnly(formData.onDate) ?? from;
  if (!from || !to) return null;
  return from <= to ? { from, to } : { from: to, to: from };
}

export type LeaveReconciliation = {
  applied: boolean;
  window: { from: string; to: string } | null;
  reclassified: number;
};

/**
 * Reconcile attendance for a fully-approved leave/permission request.
 * Caller must have already verified the request belongs to `collegeId` and is
 * approved/completed. Safe to call more than once.
 */
export async function applyApprovedLeaveToAttendance(
  collegeId: number,
  requestId: number,
  actorFacultyId: number | null,
): Promise<LeaveReconciliation> {
  const request = await db('student_service_requests')
    .where({ id: requestId, college_id: collegeId })
    .first();
  if (!request) return { applied: false, window: null, reclassified: 0 };

  const window = resolveLeaveWindow(parseFormData(request.form_data));
  if (!window) return { applied: false, window: null, reclassified: 0 };

  const studentId = Number(request.student_id);
  const marker = `${LEAVE_MARKER_PREFIX} #${request.request_number ?? requestId}`;

  // Candidate records: this student's ABSENT marks on sessions dated within the
  // leave window. Reclassify to EXCUSED (idempotent — EXCUSED rows are excluded).
  const candidates = await db('attendance_records as ar')
    .join('attendance_sessions as s', 's.id', 'ar.attendance_session_id')
    .where('ar.college_id', collegeId)
    .where('ar.student_id', studentId)
    .where('ar.status', 'ABSENT')
    .whereBetween('s.session_date', [window.from, window.to])
    .select('ar.id as record_id', 'ar.attendance_session_id', 'ar.status as from_status');

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
    afterState: { window, reclassified, marker },
  });

  return { applied: true, window, reclassified };
}

const LEAVE_CATEGORIES = new Set(['LEAVE', 'PERMISSION']);
const LEAVE_CODES = new Set(['STUDENT_LEAVE_REQUEST', 'STUDENT_PERMISSION_REQUEST']);

/** Whether a request type should trigger attendance reconciliation on approval. */
export function isLeaveType(typeRow: { code?: unknown; category?: unknown } | null | undefined): boolean {
  if (!typeRow) return false;
  return (
    LEAVE_CATEGORIES.has(String(typeRow.category ?? '')) || LEAVE_CODES.has(String(typeRow.code ?? ''))
  );
}
