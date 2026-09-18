import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { recordServicesAudit } from './audit.js';
import type { ServicesActor } from './types.js';

const SAFE_FIELDS: Record<string, string> = {
  NAME: 'name',
  EMAIL: 'email',
  PHONE: 'phone',
  SECTION: 'class_section_id',
};

const RESTRICTED_FIELDS = ['USN', 'PROGRAM', 'BRANCH', 'SEMESTER', 'SCHEME', 'ACADEMIC_YEAR'];

export async function applyProfileCorrection(actor: ServicesActor, requestId: number) {
  const request = await db('student_service_requests').where({ id: requestId, college_id: actor.collegeId }).first();
  if (!request) throw new AppError(404, 'Request not found');

  const typeRow = await db('student_service_request_types').where({ id: request.request_type_id }).first();
  if (!typeRow || !['PROFILE_CORRECTION', 'USN_CORRECTION'].includes(String(typeRow.code))) {
    return;
  }

  let formData: Record<string, unknown> = {};
  try {
    formData = typeof request.form_data === 'string' ? JSON.parse(request.form_data) : (request.form_data ?? {});
  } catch {
    formData = {};
  }

  const field = String(formData.field ?? (typeRow.code === 'USN_CORRECTION' ? 'USN' : ''));
  const requestedValue = String(formData.requestedValue ?? '');

  if (RESTRICTED_FIELDS.includes(field) && field !== 'USN') {
    const hasEnrollments = await db('academic_class_enrollments')
      .where({ student_id: request.student_id, status: 'APPROVED' })
      .first();
    const hasResults = await db('semester_results')
      .where({ student_id: request.student_id })
      .first();
    if (hasEnrollments || hasResults) {
      throw new AppError(
        400,
        `Changing ${field} requires administrative migration due to existing academic records`,
      );
    }
  }

  const student = await db('students').where({ id: request.student_id }).first();
  if (!student) throw new AppError(404, 'Student not found');

  const before = { ...student };
  const updates: Record<string, unknown> = { updated_at: db.fn.now() };

  if (field === 'USN') {
    const existing = await db('students')
      .where({ college_id: actor.collegeId, usn: requestedValue })
      .whereNot({ id: request.student_id })
      .first();
    if (existing) throw new AppError(400, 'USN already in use');
    updates.usn = requestedValue;
  } else if (field === 'NAME') {
    updates.name = requestedValue;
  } else if (field === 'EMAIL') {
    updates.email = requestedValue;
  } else if (field === 'PHONE') {
    updates.phone = requestedValue;
  } else if (field === 'SECTION') {
    updates.class_section_id = Number(requestedValue);
  } else if (SAFE_FIELDS[field]) {
    updates[SAFE_FIELDS[field]!] = requestedValue;
  } else {
    throw new AppError(400, `Field ${field} cannot be updated through this workflow`);
  }

  await db('students').where({ id: request.student_id }).update(updates);

  if (await db.schema.hasTable('student_profile_corrections')) {
    await db('student_profile_corrections').insert({
      college_id: actor.collegeId,
      student_id: request.student_id,
      field,
      current_value: String(formData.currentValue ?? before[field.toLowerCase()] ?? ''),
      requested_value: requestedValue,
      reason: String(formData.reason ?? 'Applied via service request'),
      status: 'APPROVED',
      reviewed_by: actor.facultyUserId,
      reviewed_at: db.fn.now(),
    });
  }

  await db('student_service_requests').where({ id: requestId }).update({
    status: 'COMPLETED',
    current_stage: 'Correction Applied',
    completed_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  await recordServicesAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    actorType: 'FACULTY',
    action: 'PROFILE_CORRECTION_APPLIED',
    entityType: 'student',
    entityId: Number(request.student_id),
    beforeState: { [field]: before[field.toLowerCase()] ?? before.usn },
    afterState: { [field]: requestedValue },
    reason: String(formData.reason ?? ''),
  });
}

export async function rejectProfileCorrection(actor: ServicesActor, requestId: number, reason: string) {
  const request = await db('student_service_requests').where({ id: requestId, college_id: actor.collegeId }).first();
  if (!request) throw new AppError(404, 'Request not found');

  await recordServicesAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    actorType: 'FACULTY',
    action: 'PROFILE_CORRECTION_REJECTED',
    entityType: 'student_service_request',
    entityId: requestId,
    reason,
  });
}
