import { randomBytes } from 'node:crypto';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { recordServicesAudit } from './audit.js';
import { ensureCollegeServicesDefaults, getRequestType, getWorkflowForType } from './defaults.js';
import { notifyStudent } from '../academicClasses/studentNotifications.js';
import type { FacultyRequesterActor, ServicesActor, StudentActor } from './types.js';

type Row = Record<string, unknown>;

function parseJson<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw === 'object') return raw as T;
  try {
    return JSON.parse(String(raw)) as T;
  } catch {
    return fallback;
  }
}

function serializeRequest(row: Row, typeRow?: Row | null) {
  return {
    id: Number(row.id),
    requestNumber: row.request_number as string | null,
    requestTypeCode: typeRow?.code ?? null,
    requestTypeLabel: typeRow?.label ?? null,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    currentStage: row.current_stage,
    currentStepOrder: row.current_step_order != null ? Number(row.current_step_order) : null,
    formData: parseJson(row.form_data, {}),
    submittedAt: row.submitted_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function nextRequestNumber(collegeId: number): Promise<string> {
  return db.transaction(async (trx) => {
    const prefix = await trx('colleges').where({ id: collegeId }).select('code').first().then((row) => row?.code ?? 'SX');
    const year = new Date().getFullYear();
    const lockKey = `student-service-request:${collegeId}:${year}`;
    await trx.raw('select get_lock(?, 10)', [lockKey]);
    try {
      await trx('student_service_number_sequences').insert({ college_id: collegeId, year, last_number: 0 }).onConflict(['college_id', 'year']).ignore();
      await trx('student_service_number_sequences').where({ college_id: collegeId, year }).increment('last_number', 1);
      const sequence = await trx('student_service_number_sequences').where({ college_id: collegeId, year }).first();
      const next = Number(sequence.last_number);
      return `${prefix}/REQ/${year}/${String(next).padStart(6, '0')}`;
    } finally {
      await trx.raw('select release_lock(?)', [lockKey]).catch(() => undefined);
    }
  });
}

export async function studentServicesHome(studentId: number, collegeId: number) {
  await ensureCollegeServicesDefaults(collegeId);
  const types = await db('student_service_request_types')
    .where({ college_id: collegeId, is_active: true })
    .orderBy('sort_order');
  const pending = await db('student_service_requests')
    .where({ student_id: studentId, college_id: collegeId })
    .whereNotIn('status', ['COMPLETED', 'CANCELLED', 'DRAFT'])
    .count({ c: '*' })
    .first();
  const certificates = await db('student_service_documents')
    .where({ student_id: studentId, college_id: collegeId, status: 'VALID' })
    .count({ c: '*' })
    .first();
  const grievances = await db('student_grievances')
    .where({ student_id: studentId, college_id: collegeId })
    .whereNotIn('status', ['CLOSED', 'RESOLVED'])
    .count({ c: '*' })
    .first();
  const mentor = await db('mentor_assignments as ma')
    .join('faculty_users as f', 'f.id', 'ma.mentor_faculty_id')
    .leftJoin('departments as d', 'd.id', 'f.department_id')
    .where({ 'ma.student_id': studentId, 'ma.college_id': collegeId, 'ma.status': 'ACTIVE', 'ma.is_primary': true })
    .select('f.name as mentor_name', 'd.name as department_name')
    .first();
  const alerts = await db('student_academic_alerts')
    .where({ student_id: studentId, college_id: collegeId, status: 'ACTIVE', visible_to_student: true })
    .count({ c: '*' })
    .first();

  return {
    requestTypes: types.map((t) => ({
      code: t.code,
      label: t.label,
      category: t.category,
      description: t.description,
      instructions: t.instructions,
      estimatedProcess: t.estimated_process,
      generatesCertificate: !!t.generates_certificate,
      formSchema: parseJson(t.form_schema, []),
    })),
    counts: {
      pendingRequests: Number(pending?.c ?? 0),
      certificates: Number(certificates?.c ?? 0),
      openGrievances: Number(grievances?.c ?? 0),
      alerts: Number(alerts?.c ?? 0),
    },
    mentor: mentor ? { name: mentor.mentor_name, department: mentor.department_name } : null,
  };
}

export async function listStudentRequests(studentId: number, collegeId: number, status?: string) {
  let q = db('student_service_requests as r')
    .join('student_service_request_types as t', 't.id', 'r.request_type_id')
    .where({ 'r.student_id': studentId, 'r.college_id': collegeId })
    .whereNot('r.status', 'DRAFT')
    .select('r.*', 't.code as type_code', 't.label as type_label')
    .orderBy('r.updated_at', 'desc');
  if (status) q = q.where('r.status', status);
  const rows = await q;
  return rows.map((r) => serializeRequest(r, { code: r.type_code, label: r.type_label }));
}

export async function listDraftRequests(studentId: number, collegeId: number) {
  const rows = await db('student_service_requests as r')
    .join('student_service_request_types as t', 't.id', 'r.request_type_id')
    .where({ 'r.student_id': studentId, 'r.college_id': collegeId, 'r.status': 'DRAFT' })
    .select('r.*', 't.code as type_code', 't.label as type_label')
    .orderBy('r.updated_at', 'desc');
  return rows.map((r) => serializeRequest(r, { code: r.type_code, label: r.type_label }));
}

export async function createRequest(
  actor: StudentActor,
  input: { requestTypeCode: string; title: string; description?: string | null; formData?: Record<string, unknown> | null; priority?: string },
) {
  await ensureCollegeServicesDefaults(actor.collegeId);
  const typeRow = await getRequestType(actor.collegeId, input.requestTypeCode);
  if (!typeRow) throw new AppError(404, 'Request type not found');

  const wfData = await getWorkflowForType(actor.collegeId, Number(typeRow.id));
  const [id] = await db('student_service_requests').insert({
    college_id: actor.collegeId,
    student_id: actor.studentId,
    request_type_id: typeRow.id,
    workflow_id: wfData?.workflow.id ?? null,
    title: input.title,
    description: input.description ?? null,
    status: 'DRAFT',
    priority: input.priority ?? 'NORMAL',
    form_data: input.formData ? JSON.stringify(input.formData) : null,
  });

  await recordServicesAudit({
    collegeId: actor.collegeId,
    actorId: actor.studentId,
    actorType: 'STUDENT',
    action: 'REQUEST_CREATED',
    entityType: 'student_service_request',
    entityId: id,
    afterState: { requestTypeCode: input.requestTypeCode, status: 'DRAFT' },
  });

  return getStudentRequest(actor, Number(id));
}

/** Faculty-owned Office request path; never impersonates a student. */
export async function createFacultyRequest(
  actor: FacultyRequesterActor,
  input: { requestTypeCode: string; title: string; description?: string | null; formData?: Record<string, unknown> | null; priority?: string },
) {
  await ensureCollegeServicesDefaults(actor.collegeId);
  const typeRow = await getRequestType(actor.collegeId, input.requestTypeCode);
  if (!typeRow) throw new AppError(404, 'Request type not found');
  const wfData = await getWorkflowForType(actor.collegeId, Number(typeRow.id));
  const [id] = await db('student_service_requests').insert({
    college_id: actor.collegeId, student_id: null, requester_type: 'FACULTY', requester_faculty_id: actor.facultyUserId,
    request_type_id: typeRow.id, workflow_id: wfData?.workflow.id ?? null, title: input.title,
    description: input.description ?? null, status: 'DRAFT', priority: input.priority ?? 'NORMAL',
    form_data: input.formData ? JSON.stringify(input.formData) : null,
  });
  await recordServicesAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, actorType: 'FACULTY', action: 'REQUEST_CREATED', entityType: 'student_service_request', entityId: id, afterState: { requesterType: 'FACULTY', status: 'DRAFT' } });
  return getFacultyRequest(actor, Number(id));
}

export async function getFacultyRequest(actor: FacultyRequesterActor, requestId: number) {
  const row = await db('student_service_requests').where({ id: requestId, college_id: actor.collegeId, requester_type: 'FACULTY', requester_faculty_id: actor.facultyUserId }).first();
  if (!row) throw new AppError(404, 'Request not found');
  const typeRow = await db('student_service_request_types').where({ id: row.request_type_id }).first();
  return serializeRequest(row, typeRow);
}

export async function submitFacultyRequest(actor: FacultyRequesterActor, requestId: number) {
  const row = await db('student_service_requests').where({ id: requestId, college_id: actor.collegeId, requester_type: 'FACULTY', requester_faculty_id: actor.facultyUserId }).first();
  if (!row) throw new AppError(404, 'Request not found');
  if (row.status !== 'DRAFT') throw new AppError(400, 'Only draft requests can be submitted');
  const typeRow = await db('student_service_request_types').where({ id: row.request_type_id }).first();
  if (!typeRow) throw new AppError(404, 'Request type not found');
  const requestNumber = await nextRequestNumber(actor.collegeId);
  await db('student_service_requests').where({ id: requestId }).update({ request_number: requestNumber, status: 'UNDER_REVIEW', current_stage: 'Office Review', submitted_at: db.fn.now(), updated_at: db.fn.now() });
  await recordServicesAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, actorType: 'FACULTY', action: 'REQUEST_SUBMITTED', entityType: 'student_service_request', entityId: requestId, afterState: { requestNumber, status: 'UNDER_REVIEW' } });
  return getFacultyRequest(actor, requestId);
}

export async function updateDraftRequest(
  actor: StudentActor,
  requestId: number,
  input: { title?: string; description?: string | null; formData?: Record<string, unknown> | null },
) {
  const row = await assertStudentRequest(actor, requestId);
  if (row.status !== 'DRAFT') throw new AppError(400, 'Only draft requests can be edited');
  const updates: Row = { updated_at: db.fn.now() };
  if (input.title) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.formData !== undefined) updates.form_data = input.formData ? JSON.stringify(input.formData) : null;
  await db('student_service_requests').where({ id: requestId }).update(updates);
  return getStudentRequest(actor, requestId);
}

export async function submitRequest(actor: StudentActor, requestId: number) {
  const row = await assertStudentRequest(actor, requestId);
  if (row.status !== 'DRAFT') throw new AppError(400, 'Only draft requests can be submitted');

  const typeRow = await db('student_service_request_types').where({ id: row.request_type_id }).first();
  if (!typeRow) throw new AppError(404, 'Request type not found');

  const requestNumber = await nextRequestNumber(actor.collegeId);
  const wfData = await getWorkflowForType(actor.collegeId, Number(typeRow.id));

  let status: string;
  let currentStage: string | null = null;
  let currentStepOrder: number | null = null;

  if (typeRow.auto_approve && !typeRow.requires_approval) {
    status = 'APPROVED';
    currentStage = 'Auto Approved';
  } else if (!wfData || wfData.steps.length === 0) {
    status = typeRow.auto_approve ? 'APPROVED' : 'SUBMITTED';
    currentStage = typeRow.auto_approve ? 'Auto Approved' : 'Pending Review';
  } else {
    status = 'UNDER_REVIEW';
    const firstStep = wfData.steps[0]!;
    currentStage = firstStep.label;
    currentStepOrder = Number(firstStep.step_order);

    for (const step of wfData.steps) {
      await db('student_request_actions').insert({
        request_id: requestId,
        step_order: step.step_order,
        step_key: step.step_key,
        step_label: step.label,
        actor_role: step.actor_role,
        status: Number(step.step_order) === 1 ? 'IN_PROGRESS' : 'PENDING',
      });
    }
  }

  await db('student_service_requests').where({ id: requestId }).update({
    request_number: requestNumber,
    status,
    current_stage: currentStage,
    current_step_order: currentStepOrder,
    submitted_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  await recordServicesAudit({
    collegeId: actor.collegeId,
    actorId: actor.studentId,
    actorType: 'STUDENT',
    action: 'REQUEST_SUBMITTED',
    entityType: 'student_service_request',
    entityId: requestId,
    afterState: { requestNumber, status },
  });

  await notifyStudent({
    studentId: actor.studentId,
    collegeId: actor.collegeId,
    type: 'REQUEST_SUBMITTED',
    title: 'Request submitted',
    body: `Your request ${requestNumber} has been submitted.`,
    link: `/lms/services/requests/${requestId}`,
    relatedType: 'service_request',
    relatedId: requestId,
  });

  // Finance integration — generate fee demand if request type requires payment
  if (await db.schema.hasColumn('student_service_request_types', 'fee_required')) {
    try {
      const { createServiceRequestFeeDemand } = await import('../finance/integration.js');
      const demand = await createServiceRequestFeeDemand(
        actor.collegeId,
        actor.studentId,
        String(typeRow.code),
        requestId,
      );
      if (demand && typeRow.fee_required) {
        await db('student_service_requests').where({ id: requestId }).update({
          current_stage: 'Awaiting Fee Payment',
          updated_at: db.fn.now(),
        });
      }
    } catch {
      /* finance optional during migration */
    }
  }

  if (status === 'APPROVED' && typeRow.generates_certificate) {
    const { generateCertificateForRequest } = await import('./certificates.js');
    await generateCertificateForRequest(actor.collegeId, requestId, null);
  }

  return getStudentRequest(actor, requestId);
}

export async function cancelRequest(actor: StudentActor, requestId: number) {
  const row = await assertStudentRequest(actor, requestId);
  if (['COMPLETED', 'CANCELLED'].includes(String(row.status))) {
    throw new AppError(400, 'Request cannot be cancelled');
  }
  await db('student_service_requests').where({ id: requestId }).update({
    status: 'CANCELLED',
    cancelled_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  await recordServicesAudit({
    collegeId: actor.collegeId,
    actorId: actor.studentId,
    actorType: 'STUDENT',
    action: 'REQUEST_CANCELLED',
    entityType: 'student_service_request',
    entityId: requestId,
  });
  return getStudentRequest(actor, requestId);
}

export async function respondToRequest(actor: StudentActor, requestId: number, body: string) {
  const row = await assertStudentRequest(actor, requestId);
  if (row.status !== 'ACTION_REQUIRED') {
    throw new AppError(400, 'This request does not require your action');
  }
  await db('student_request_comments').insert({
    request_id: requestId,
    author_student_id: actor.studentId,
    body,
    is_internal: false,
  });
  await db('student_service_requests').where({ id: requestId }).update({
    status: 'UNDER_REVIEW',
    updated_at: db.fn.now(),
  });
  const pendingAction = await db('student_request_actions')
    .where({ request_id: requestId, status: 'ACTION_REQUIRED' })
    .orderBy('step_order', 'desc')
    .first();
  if (pendingAction) {
    await db('student_request_actions').where({ id: pendingAction.id }).update({ status: 'IN_PROGRESS' });
  }
  return getStudentRequest(actor, requestId);
}

async function assertStudentRequest(actor: StudentActor, requestId: number) {
  const row = await db('student_service_requests')
    .where({ id: requestId, student_id: actor.studentId, college_id: actor.collegeId })
    .first();
  if (!row) throw new AppError(404, 'Request not found');
  return row;
}

export async function getStudentRequest(actor: StudentActor, requestId: number) {
  const row = await assertStudentRequest(actor, requestId);
  const typeRow = await db('student_service_request_types').where({ id: row.request_type_id }).first();
  const actions = await db('student_request_actions')
    .where({ request_id: requestId })
    .where('is_internal', false)
    .orderBy('step_order');
  const comments = await db('student_request_comments as c')
    .leftJoin('faculty_users as f', 'f.id', 'c.author_faculty_id')
    .leftJoin('students as s', 's.id', 'c.author_student_id')
    .where({ 'c.request_id': requestId, 'c.is_internal': false })
    .select('c.*', 'f.name as faculty_name', 's.name as student_name')
    .orderBy('c.created_at');
  const attachments = await db('student_service_attachments')
    .where({ request_id: requestId })
    .whereIn('visibility', ['STUDENT', 'ALL'])
    .orderBy('created_at');
  const document = await db('student_service_documents')
    .where({ request_id: requestId, status: 'VALID' })
    .orderBy('id', 'desc')
    .first();

  return {
    ...serializeRequest(row, typeRow),
    type: typeRow
      ? {
          code: typeRow.code,
          label: typeRow.label,
          generatesCertificate: !!typeRow.generates_certificate,
          formSchema: parseJson(typeRow.form_schema, []),
        }
      : null,
    timeline: actions.map((a) => ({
      stepOrder: Number(a.step_order),
      stepKey: a.step_key,
      label: a.step_label,
      status: a.status,
      remarks: a.remarks,
      actedAt: a.acted_at,
    })),
    comments: comments.map((c) => ({
      id: Number(c.id),
      body: c.body,
      authorName: c.faculty_name ?? c.student_name ?? 'Unknown',
      isStudent: !!c.author_student_id,
      createdAt: c.created_at,
    })),
    attachments: attachments.map((a) => ({
      id: Number(a.id),
      fileName: a.file_name,
      mimeType: a.mime_type,
      fileSize: Number(a.file_size),
      createdAt: a.created_at,
    })),
    document: document
      ? {
          id: Number(document.id),
          certificateNumber: document.certificate_number,
          verificationCode: document.verification_code,
          documentType: document.document_type,
          issuedAt: document.issued_at,
        }
      : null,
  };
}

export async function staffListRequests(
  actor: ServicesActor,
  filters: { status?: string; requestType?: string; departmentId?: number; page?: number; limit?: number },
) {
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 25, 100);
  const offset = (page - 1) * limit;

  let q = db('student_service_requests as r')
    .join('student_service_request_types as t', 't.id', 'r.request_type_id')
    .leftJoin('students as s', 's.id', 'r.student_id')
    .leftJoin('faculty_users as rf', 'rf.id', 'r.requester_faculty_id')
    .leftJoin('departments as d', 'd.id', 's.department_id')
    .where({ 'r.college_id': actor.collegeId })
    .whereNot('r.status', 'DRAFT');

  if (filters.status) q = q.where('r.status', filters.status);
  if (filters.requestType) q = q.where('t.code', filters.requestType);
  if (filters.departmentId) q = q.where('s.department_id', filters.departmentId);

  const countRow = await q.clone().count({ c: '*' }).first();
  const rows = await q
    .select('r.*', 't.code as type_code', 't.label as type_label', 's.name as student_name', 's.usn', 'rf.name as requester_faculty_name', 'd.name as department_name')
    .orderBy('r.updated_at', 'desc')
    .limit(limit)
    .offset(offset);

  return {
    requests: rows.map((r) => ({
      ...serializeRequest(r, { code: r.type_code, label: r.type_label }),
      studentName: r.student_name,
      usn: r.usn,
      departmentName: r.department_name,
    })),
    pagination: { page, limit, total: Number(countRow?.c ?? 0) },
  };
}

export async function staffGetRequest(actor: ServicesActor, requestId: number) {
  const row = await db('student_service_requests')
    .where({ id: requestId, college_id: actor.collegeId })
    .first();
  if (!row) throw new AppError(404, 'Request not found');

  const typeRow = await db('student_service_request_types').where({ id: row.request_type_id }).first();
  const student = await db('students as s')
    .leftJoin('departments as d', 'd.id', 's.department_id')
    .leftJoin('programs as p', 'p.id', 's.program_id')
    .leftJoin('semesters as sem', 'sem.id', 's.semester_id')
    .where('s.id', row.student_id)
    .select('s.*', 'd.name as department_name', 'p.name as program_name', 'sem.label as semester_label')
    .first();

  const actions = await db('student_request_actions as a')
    .leftJoin('faculty_users as f', 'f.id', 'a.acted_by_faculty_id')
    .where({ 'a.request_id': requestId })
    .select('a.*', 'f.name as acted_by_name')
    .orderBy('a.step_order');
  const comments = await db('student_request_comments as c')
    .leftJoin('faculty_users as f', 'f.id', 'c.author_faculty_id')
    .leftJoin('students as s', 's.id', 'c.author_student_id')
    .where({ 'c.request_id': requestId })
    .select('c.*', 'f.name as faculty_name', 's.name as student_name')
    .orderBy('c.created_at');

  return {
    ...serializeRequest(row, typeRow),
    student: student
      ? {
          id: Number(student.id),
          name: student.name,
          usn: student.usn,
          email: student.email,
          departmentName: student.department_name,
          programName: student.program_name,
          semesterLabel: student.semester_label,
        }
      : null,
    type: typeRow
      ? { code: typeRow.code, label: typeRow.label, generatesCertificate: !!typeRow.generates_certificate }
      : null,
    timeline: actions.map((a) => ({
      stepOrder: Number(a.step_order),
      stepKey: a.step_key,
      label: a.step_label,
      actorRole: a.actor_role,
      status: a.status,
      remarks: a.is_internal ? undefined : a.remarks,
      internalRemarks: a.is_internal ? a.remarks : undefined,
      actedByName: a.acted_by_name,
      actedAt: a.acted_at,
    })),
    comments: comments.map((c) => ({
      id: Number(c.id),
      body: c.body,
      authorName: c.faculty_name ?? c.student_name ?? 'Unknown',
      isInternal: !!c.is_internal,
      createdAt: c.created_at,
    })),
  };
}

export async function staffActionOnRequest(
  actor: ServicesActor,
  requestId: number,
  input: { action: string; remarks?: string | null; internalRemarks?: string | null },
) {
  const row = await db('student_service_requests')
    .where({ id: requestId, college_id: actor.collegeId })
    .first();
  if (!row) throw new AppError(404, 'Request not found');
  if (['COMPLETED', 'CANCELLED', 'DRAFT'].includes(String(row.status))) {
    throw new AppError(400, 'Request is not actionable');
  }
  assertRequestTransition(String(row.status), input.action);

  const typeRow = await db('student_service_request_types').where({ id: row.request_type_id }).first();
  const currentAction = await db('student_request_actions')
    .where({ request_id: requestId, status: 'IN_PROGRESS' })
    .orderBy('step_order')
    .first();

  if (currentAction) {
    const { canActAsRole } = await import('./permissions.js');
    const canAct = await canActAsRole(actor, String(currentAction.actor_role), Number(row.student_id));
    if (!canAct) throw new AppError(403, 'You are not authorized for this workflow step');
  }

  const beforeStatus = row.status;

  if (input.action === 'REJECT') {
    await db('student_service_requests').where({ id: requestId }).update({
      status: 'REJECTED',
      current_stage: 'Rejected',
      updated_at: db.fn.now(),
    });
    if (currentAction) {
      await db('student_request_actions').where({ id: currentAction.id }).update({
        status: 'REJECTED',
        acted_by_faculty_id: actor.facultyUserId,
        remarks: input.remarks ?? input.internalRemarks ?? null,
        is_internal: !!input.internalRemarks && !input.remarks,
        acted_at: db.fn.now(),
      });
    }
    await notifyStudent({
      studentId: Number(row.student_id),
      collegeId: actor.collegeId,
      type: 'REQUEST_REJECTED',
      title: 'Request rejected',
      body: input.remarks ?? 'Your request has been rejected.',
      link: `/lms/services/requests/${requestId}`,
      relatedType: 'service_request',
      relatedId: requestId,
    });
  } else if (input.action === 'REQUEST_ACTION') {
    await db('student_service_requests').where({ id: requestId }).update({
      status: 'ACTION_REQUIRED',
      current_stage: 'Action Required',
      updated_at: db.fn.now(),
    });
    if (currentAction) {
      await db('student_request_actions').where({ id: currentAction.id }).update({
        status: 'ACTION_REQUIRED',
        acted_by_faculty_id: actor.facultyUserId,
        remarks: input.remarks ?? null,
        acted_at: db.fn.now(),
      });
    }
    if (input.remarks) {
      await db('student_request_comments').insert({
        request_id: requestId,
        author_faculty_id: actor.facultyUserId,
        body: input.remarks,
        is_internal: false,
      });
    }
    await notifyStudent({
      studentId: Number(row.student_id),
      collegeId: actor.collegeId,
      type: 'REQUEST_ACTION_REQUIRED',
      title: 'Action required on your request',
      body: input.remarks ?? 'Please review and respond to your request.',
      link: `/lms/services/requests/${requestId}`,
      relatedType: 'service_request',
      relatedId: requestId,
    });
  } else if (input.action === 'APPROVE' || input.action === 'PROCESS') {
    if (currentAction) {
      await db('student_request_actions').where({ id: currentAction.id }).update({
        status: 'COMPLETED',
        acted_by_faculty_id: actor.facultyUserId,
        remarks: input.remarks ?? input.internalRemarks ?? null,
        is_internal: !!input.internalRemarks && !input.remarks,
        acted_at: db.fn.now(),
      });
    }

    const nextAction = await db('student_request_actions')
      .where({ request_id: requestId, status: 'PENDING' })
      .orderBy('step_order')
      .first();

    if (nextAction) {
      await db('student_request_actions').where({ id: nextAction.id }).update({ status: 'IN_PROGRESS' });
      await db('student_service_requests').where({ id: requestId }).update({
        status: 'UNDER_REVIEW',
        current_stage: nextAction.step_label,
        current_step_order: nextAction.step_order,
        updated_at: db.fn.now(),
      });
    } else if (typeRow?.generates_certificate) {
      await db('student_service_requests').where({ id: requestId }).update({
        status: 'APPROVED',
        current_stage: 'Approved — Pending Generation',
        updated_at: db.fn.now(),
      });
      if (input.action === 'PROCESS' || typeRow.auto_approve) {
        const { generateCertificateForRequest } = await import('./certificates.js');
        await generateCertificateForRequest(actor.collegeId, requestId, actor.facultyUserId);
      }
    } else {
      await db('student_service_requests').where({ id: requestId }).update({
        status: 'COMPLETED',
        current_stage: 'Completed',
        completed_at: db.fn.now(),
        updated_at: db.fn.now(),
      });
      if (typeRow?.code === 'PROFILE_CORRECTION' || typeRow?.code === 'USN_CORRECTION') {
        const { applyProfileCorrection } = await import('./profileCorrection.js');
        await applyProfileCorrection(actor, requestId);
      }
      // Integrate approved leave/permission with Attendance (idempotent; no duplicate records).
      const { isLeaveType, applyApprovedLeaveToAttendance } = await import('./leaveAttendance.js');
      if (isLeaveType(typeRow)) {
        await applyApprovedLeaveToAttendance(actor.collegeId, requestId, actor.facultyUserId);
      }
    }
  } else if (input.action === 'COMPLETE') {
    const { generateCertificateForRequest } = await import('./certificates.js');
    if (typeRow?.generates_certificate) {
      await generateCertificateForRequest(actor.collegeId, requestId, actor.facultyUserId);
    } else {
      await db('student_service_requests').where({ id: requestId }).update({
        status: 'COMPLETED',
        current_stage: 'Completed',
        completed_at: db.fn.now(),
        updated_at: db.fn.now(),
      });
    }
  }

  await recordServicesAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    actorType: 'FACULTY',
    actorName: actor.name,
    action: `REQUEST_${input.action}`,
    entityType: 'student_service_request',
    entityId: requestId,
    beforeState: { status: beforeStatus },
    reason: input.remarks ?? input.internalRemarks ?? null,
  });

  return staffGetRequest(actor, requestId);
}

const ACTIONABLE_TRANSITIONS: Record<string, string[]> = {
  REJECT: ['SUBMITTED', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'APPROVED', 'READY'],
  REQUEST_ACTION: ['SUBMITTED', 'UNDER_REVIEW'],
  APPROVE: ['SUBMITTED', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'APPROVED'],
  PROCESS: ['APPROVED', 'READY'],
  COMPLETE: ['READY'],
};

export function assertRequestTransition(status: string, action: string) {
  if (!ACTIONABLE_TRANSITIONS[action]?.includes(status)) throw new AppError(400, `Request transition not authorized: ${status} -> ${action}`);
}

export async function assignRequest(actor: ServicesActor, requestId: number, assigneeFacultyId: number, reason?: string | null) {
  if (!['OFFICE_ADMIN', 'OFFICE_SUPERINTENDENT'].includes(actor.role)) throw new AppError(403, 'Only Office staff can assign requests');
  const request = await db('student_service_requests').where({ id: requestId, college_id: actor.collegeId }).first();
  if (!request) throw new AppError(404, 'Request not found');
  const assignee = await db('faculty_users').where({ id: assigneeFacultyId, college_id: actor.collegeId }).whereIn('role', ['OFFICE_ADMIN', 'OFFICE_SUPERINTENDENT']).first();
  if (!assignee) throw new AppError(403, 'Assignee is not an authorized Office user');
  await db.transaction(async (trx) => {
    await trx('student_service_requests').where({ id: requestId }).update({ assigned_to_faculty_id: assigneeFacultyId, assigned_at: trx.fn.now(), updated_at: trx.fn.now() });
    await trx('student_service_request_assignments').insert({ college_id: actor.collegeId, request_id: requestId, from_faculty_id: request.assigned_to_faculty_id ?? null, to_faculty_id: assigneeFacultyId, actor_faculty_id: actor.facultyUserId, reason: reason ?? null });
  });
  return staffGetRequest(actor, requestId);
}

// ── Lecturer / mentor / coordinator inbox (relationship-scoped) ──────────────
//
// The office `staffListRequests` above is college-wide and gated only by the
// `student_services.view` permission. A lecturer must NEVER see the whole
// college's requests through it, so the Lecturer Portal uses this separate
// projection: it returns only the requests of students the acting faculty
// mentors or class-coordinates, and only those that route to a MENTOR /
// CLASS_COORDINATOR workflow step ("requests routed to them"). Tenant + scope
// isolation is enforced by construction (student-id set) rather than trusting
// the role.

type MentorInboxTab = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'HISTORY';

async function mentorScopedStudentIds(actor: ServicesActor): Promise<number[]> {
  const [mentee, coordinated] = await Promise.all([
    db('mentor_assignments')
      .where({ mentor_faculty_id: actor.facultyUserId, college_id: actor.collegeId, status: 'ACTIVE' })
      .pluck('student_id'),
    db('academic_class_enrollments as e')
      .join('academic_classes as c', 'c.id', 'e.academic_class_id')
      .join('academic_class_coordinators as cc', 'cc.academic_class_id', 'c.id')
      .where({
        'cc.faculty_id': actor.facultyUserId,
        'cc.role': 'COORDINATOR',
        'c.college_id': actor.collegeId,
        'e.status': 'APPROVED',
      })
      .pluck('e.student_id'),
  ]);
  return [...new Set([...mentee, ...coordinated].map(Number))];
}

function bucketFor(status: string, hasPendingOwnStep: boolean): MentorInboxTab {
  if (status === 'REJECTED') return 'REJECTED';
  if (status === 'ACTION_REQUIRED') return 'RETURNED';
  if (status === 'APPROVED' || status === 'COMPLETED') return 'APPROVED';
  if (hasPendingOwnStep) return 'PENDING';
  return 'HISTORY';
}

export async function mentorInboxRequests(actor: ServicesActor, tab?: string) {
  const ids = await mentorScopedStudentIds(actor);
  const empty = { requests: [] as unknown[], counts: { PENDING: 0, APPROVED: 0, REJECTED: 0, RETURNED: 0, TOTAL: 0 } };
  if (!ids.length) return empty;

  const rows = await db('student_service_requests as r')
    .join('student_service_request_types as t', 't.id', 'r.request_type_id')
    .join('students as s', 's.id', 'r.student_id')
    .leftJoin('departments as d', 'd.id', 's.department_id')
    .leftJoin('class_sections as cs', 'cs.id', 's.class_section_id')
    .leftJoin('semesters as sem', 'sem.id', 's.semester_id')
    .whereIn('r.student_id', ids)
    .whereNot('r.status', 'DRAFT')
    .whereExists(function () {
      this.select('*')
        .from('student_request_actions as a')
        .whereRaw('a.request_id = r.id')
        .whereIn('a.actor_role', ['MENTOR', 'CLASS_COORDINATOR']);
    })
    .select(
      'r.*',
      't.code as type_code',
      't.label as type_label',
      't.category as type_category',
      's.name as student_name',
      's.usn',
      'd.name as department_name',
      'cs.label as section_label',
      'sem.label as semester_label',
    )
    .orderBy('r.updated_at', 'desc');

  // A request is "pending on me" when an IN_PROGRESS action for one of my
  // scoped roles exists on it.
  const requestIds = rows.map((r) => Number(r.id));
  const pendingOwn = new Set<number>();
  if (requestIds.length) {
    const inProg = await db('student_request_actions')
      .whereIn('request_id', requestIds)
      .where('status', 'IN_PROGRESS')
      .whereIn('actor_role', ['MENTOR', 'CLASS_COORDINATOR'])
      .select('request_id');
    for (const a of inProg) pendingOwn.add(Number(a.request_id));
  }

  const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0, RETURNED: 0, TOTAL: rows.length };
  const enriched = rows.map((r) => {
    const bucket = bucketFor(String(r.status), pendingOwn.has(Number(r.id)));
    if (bucket === 'PENDING') counts.PENDING++;
    else if (bucket === 'APPROVED') counts.APPROVED++;
    else if (bucket === 'REJECTED') counts.REJECTED++;
    else if (bucket === 'RETURNED') counts.RETURNED++;
    return {
      ...serializeRequest(r, { code: r.type_code, label: r.type_label }),
      category: r.type_category,
      studentName: r.student_name,
      usn: r.usn,
      departmentName: r.department_name,
      section: r.section_label,
      semester: r.semester_label,
      bucket,
    };
  });

  const wanted = (tab ?? '').toUpperCase();
  const requests =
    wanted && wanted !== 'HISTORY'
      ? enriched.filter((r) => r.bucket === wanted)
      : enriched;

  return { requests, counts };
}

/** Detail getter guarded by mentor/coordinator relationship (not office-wide view). */
export async function mentorGetRequest(actor: ServicesActor, requestId: number) {
  const row = await db('student_service_requests')
    .where({ id: requestId, college_id: actor.collegeId })
    .first();
  if (!row) throw new AppError(404, 'Request not found');
  const ids = await mentorScopedStudentIds(actor);
  if (!ids.includes(Number(row.student_id))) {
    throw new AppError(403, 'This request is not for one of your students');
  }
  return staffGetRequest(actor, requestId);
}

/** Action guarded by relationship, then delegated to the shared workflow engine. */
export async function mentorActionOnRequest(
  actor: ServicesActor,
  requestId: number,
  input: { action: string; remarks?: string | null; internalRemarks?: string | null },
) {
  const row = await db('student_service_requests')
    .where({ id: requestId, college_id: actor.collegeId })
    .first();
  if (!row) throw new AppError(404, 'Request not found');
  const ids = await mentorScopedStudentIds(actor);
  if (!ids.includes(Number(row.student_id))) {
    throw new AppError(403, 'This request is not for one of your students');
  }
  // staffActionOnRequest re-checks canActAsRole for the specific in-progress step
  // (mentor-of / coordinator-of), so the acting faculty must hold the exact
  // relationship the current step requires — not merely mentor SOME of the cohort.
  return staffActionOnRequest(actor, requestId, input);
}

export async function assignmentHistory(actor: ServicesActor, requestId: number) {
  if (!['OFFICE_ADMIN', 'OFFICE_SUPERINTENDENT'].includes(actor.role)) throw new AppError(403, 'Assignment history is restricted to Office staff');
  return db('student_service_request_assignments as a').leftJoin('faculty_users as f', 'f.id', 'a.to_faculty_id').where({ 'a.college_id': actor.collegeId, 'a.request_id': requestId }).select('a.*', 'f.name as to_assignee_name').orderBy('a.created_at');
}

export async function staffPendingActions(actor: ServicesActor) {
  const actions = await db('student_request_actions as a')
    .join('student_service_requests as r', 'r.id', 'a.request_id')
    .join('student_service_request_types as t', 't.id', 'r.request_type_id')
    .join('students as s', 's.id', 'r.student_id')
    .where({ 'r.college_id': actor.collegeId, 'a.status': 'IN_PROGRESS' })
    .whereNotIn('r.status', ['COMPLETED', 'CANCELLED', 'DRAFT', 'REJECTED'])
    .select('a.*', 'r.id as request_id', 'r.request_number', 'r.title', 't.label as type_label', 's.name as student_name', 's.usn', 'r.student_id')
    .orderBy('r.updated_at', 'desc');

  const filtered = [];
  const { canActAsRole } = await import('./permissions.js');
  for (const a of actions) {
    if (await canActAsRole(actor, String(a.actor_role), Number(a.student_id))) {
      filtered.push({
        requestId: Number(a.request_id),
        requestNumber: a.request_number,
        title: a.title,
        typeLabel: a.type_label,
        studentName: a.student_name,
        usn: a.usn,
        stepLabel: a.step_label,
        actorRole: a.actor_role,
      });
    }
  }

  const grievanceCount = await db('student_grievances')
    .where({ college_id: actor.collegeId, assigned_to_faculty_id: actor.facultyUserId })
    .whereIn('status', ['ASSIGNED', 'UNDER_REVIEW', 'ACTION_REQUIRED'])
    .count({ c: '*' })
    .first();

  const meetingCount = await db('mentor_meetings')
    .where({ college_id: actor.collegeId, mentor_faculty_id: actor.facultyUserId, status: 'REQUESTED' })
    .count({ c: '*' })
    .first();

  return {
    approvals: filtered,
    grievanceCount: Number(grievanceCount?.c ?? 0),
    meetingRequestCount: Number(meetingCount?.c ?? 0),
    total: filtered.length + Number(grievanceCount?.c ?? 0) + Number(meetingCount?.c ?? 0),
  };
}

export function generateVerificationCode(): string {
  return randomBytes(16).toString('hex');
}
