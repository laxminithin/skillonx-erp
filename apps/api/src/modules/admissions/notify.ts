import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { notifyEmployee } from '../hr/notifications.js';
import type { AdmissionActor } from './types.js';

/**
 * Admissions notifications.
 *
 * Reuses the platform's established per-audience notification architecture — it
 * does NOT introduce a parallel notification framework:
 *   - Applicants (external, pre-student) → admission_applicant_notifications,
 *     the admissions analogue of hr_candidate_notifications.
 *   - Staff (faculty) → employee_notifications via the shared notifyFaculty
 *     helper (same table used by Lab / Maintenance).
 *   - Converted students → student_notifications via notifyStudent.
 *
 * Finance remains canonical for financial receipt / transaction notifications.
 * Admissions only emits admissions-domain events (payment required, admission
 * gate satisfied, admission confirmed); it never duplicates Finance receipts.
 *
 * All emitters are best-effort: a notification failure must never break an
 * admissions mutation. Dedupe is enforced both in-code and by a DB unique
 * constraint on (applicant_id, dedupe_key).
 */

const ROLES_ADMISSIONS_REVIEW = ['ADMISSIONS_MANAGER', 'ADMISSIONS_OFFICER', 'COLLEGE_ADMIN'];

export async function notifyApplicant(input: {
  collegeId: number;
  applicantId: number;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  relatedType?: string | null;
  relatedId?: number | null;
  dedupeKey?: string | null;
}): Promise<void> {
  try {
    if (!(await db.schema.hasTable('admission_applicant_notifications'))) return;
    if (input.dedupeKey) {
      const existing = await db('admission_applicant_notifications')
        .where({ applicant_id: input.applicantId, dedupe_key: input.dedupeKey })
        .first();
      if (existing) return;
    }
    await db('admission_applicant_notifications').insert({
      college_id: input.collegeId,
      applicant_id: input.applicantId,
      type: input.type,
      title: input.title.slice(0, 255),
      body: input.body ?? null,
      link: input.link ?? null,
      related_type: input.relatedType ?? null,
      related_id: input.relatedId ?? null,
      dedupe_key: input.dedupeKey ?? null,
    });
  } catch {
    /* dedupe race / best-effort — never block the admissions mutation */
  }
}

/** Notify the admissions review team (faculty) via the shared staff channel. */
export async function notifyAdmissionsStaff(
  collegeId: number,
  payload: {
    type: string;
    title: string;
    body?: string | null;
    link?: string | null;
    relatedType?: string | null;
    relatedId?: number | null;
    dedupeSuffix?: string | null;
  },
): Promise<void> {
  try {
    // Resolve admissions review faculty to their canonical employee records and
    // deliver via the shared employee notification channel (employee_notifications
    // is keyed by employee_id). Faculty without an employee record are skipped.
    const staff = await db('faculty_users as f')
      .join('employees as e', 'e.faculty_user_id', 'f.id')
      .where({ 'f.college_id': collegeId, 'f.is_active': true })
      .whereIn('f.role', ROLES_ADMISSIONS_REVIEW)
      .where('e.college_id', collegeId)
      .distinct('e.id as employee_id');
    for (const s of staff) {
      await notifyEmployee({
        employeeId: Number(s.employee_id),
        collegeId,
        type: payload.type,
        title: payload.title,
        body: payload.body ?? null,
        link: payload.link ?? null,
        relatedType: payload.relatedType ?? null,
        relatedId: payload.relatedId ?? null,
        dedupeKey: payload.dedupeSuffix ? `${payload.type}:${payload.dedupeSuffix}` : null,
      });
    }
  } catch {
    /* best-effort */
  }
}

/** Applicant-portal reader — strictly scoped to the acting applicant + tenant. */
export async function listApplicantNotifications(actor: AdmissionActor) {
  if (actor.kind !== 'APPLICANT' || !actor.applicantId) {
    throw new AppError(403, 'Applicant access required');
  }
  if (!(await db.schema.hasTable('admission_applicant_notifications'))) return [];
  const rows = await db('admission_applicant_notifications')
    .where({ college_id: actor.collegeId, applicant_id: actor.applicantId })
    .orderBy('created_at', 'desc')
    .select('id', 'type', 'title', 'body', 'link', 'related_type', 'related_id', 'read_at', 'created_at');
  return rows.map((r) => ({
    id: Number(r.id),
    type: String(r.type),
    title: String(r.title),
    body: r.body ?? null,
    link: r.link ?? null,
    relatedType: r.related_type ?? null,
    relatedId: r.related_id != null ? Number(r.related_id) : null,
    readAt: r.read_at ?? null,
    createdAt: r.created_at,
  }));
}
