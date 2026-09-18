import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { recordServicesAudit } from './audit.js';
import { notifyStudent } from '../academicClasses/studentNotifications.js';
import type { ServicesActor, StudentActor } from './types.js';

type Row = Record<string, any>;

const STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'TRIAGED',
  'ASSIGNED',
  'UNDER_REVIEW',
  'PENDING_INFORMATION',
  'REFERRED',
  'ACTION_IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
  'REJECTED',
  'WITHDRAWN',
] as const;
type CaseStatus = (typeof STATUSES)[number];

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED', 'WITHDRAWN'],
  SUBMITTED: ['TRIAGED', 'ASSIGNED', 'UNDER_REVIEW', 'PENDING_INFORMATION', 'REFERRED', 'REJECTED', 'WITHDRAWN'],
  TRIAGED: ['ASSIGNED', 'UNDER_REVIEW', 'REFERRED', 'PENDING_INFORMATION', 'REJECTED'],
  ASSIGNED: ['UNDER_REVIEW', 'PENDING_INFORMATION', 'REFERRED', 'ACTION_IN_PROGRESS', 'RESOLVED', 'REJECTED'],
  UNDER_REVIEW: ['PENDING_INFORMATION', 'REFERRED', 'ACTION_IN_PROGRESS', 'RESOLVED', 'REJECTED'],
  PENDING_INFORMATION: ['UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'WITHDRAWN'],
  REFERRED: ['ACTION_IN_PROGRESS', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'],
  ACTION_IN_PROGRESS: ['UNDER_REVIEW', 'RESOLVED', 'REJECTED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['TRIAGED', 'ASSIGNED', 'UNDER_REVIEW', 'PENDING_INFORMATION', 'REFERRED', 'RESOLVED'],
  REJECTED: ['REOPENED'],
  WITHDRAWN: ['REOPENED'],
};

const STUDENT_VISIBLE_STATUSES = new Set(['SUBMITTED', 'PENDING_INFORMATION', 'REFERRED', 'ACTION_IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED', 'REJECTED', 'WITHDRAWN']);
const RESTRICTED_CATEGORIES = new Set(['ANTI_RAGGING', 'HARASSMENT', 'SAFETY_CONCERN', 'STUDENT_WELFARE']);
const ROUTING: Record<string, { role: string; module?: string; confidentiality?: string }> = {
  GENERAL_GRIEVANCE: { role: 'GRIEVANCE_OFFICER' },
  ACADEMIC: { role: 'HOD', module: 'ACADEMIC' },
  ADMINISTRATIVE: { role: 'GRIEVANCE_OFFICER', module: 'OFFICE' },
  EXAMINATION: { role: 'GRIEVANCE_OFFICER', module: 'COE' },
  FINANCE: { role: 'GRIEVANCE_OFFICER', module: 'FINANCE' },
  HOSTEL: { role: 'GRIEVANCE_OFFICER', module: 'HOSTEL' },
  TRANSPORT: { role: 'GRIEVANCE_OFFICER', module: 'TRANSPORT' },
  LIBRARY: { role: 'GRIEVANCE_OFFICER', module: 'LIBRARY' },
  LAB: { role: 'GRIEVANCE_OFFICER', module: 'LAB' },
  FACILITIES: { role: 'GRIEVANCE_OFFICER', module: 'MAINTENANCE' },
  PLACEMENT: { role: 'GRIEVANCE_OFFICER', module: 'PLACEMENT' },
  STUDENT_WELFARE: { role: 'STUDENT_WELFARE_OFFICER', confidentiality: 'CONFIDENTIAL' },
  MENTORING_REFERRAL: { role: 'STUDENT_WELFARE_OFFICER', module: 'MENTORING', confidentiality: 'CONFIDENTIAL' },
  DISCIPLINE_RELATED: { role: 'GRIEVANCE_OFFICER', confidentiality: 'CONFIDENTIAL' },
  SAFETY_CONCERN: { role: 'STUDENT_WELFARE_OFFICER', confidentiality: 'RESTRICTED' },
  ANTI_RAGGING: { role: 'GRIEVANCE_OFFICER', confidentiality: 'RESTRICTED' },
  HARASSMENT: { role: 'GRIEVANCE_OFFICER', confidentiality: 'RESTRICTED' },
  OTHER: { role: 'GRIEVANCE_OFFICER' },
};

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  ATTENDANCE: 'ACADEMIC',
  FACULTY: 'ACADEMIC',
  FACILITIES: 'FACILITIES',
  HARASSMENT: 'HARASSMENT',
};

function normalizeCategory(category: string) {
  const c = String(category || 'GENERAL_GRIEVANCE').trim().toUpperCase();
  return LEGACY_CATEGORY_MAP[c] ?? c;
}

function normalizeConfidentiality(input: string | undefined | null, category: string) {
  const raw = String(input || '').toUpperCase();
  const mapped = raw === 'STANDARD' ? 'NORMAL' : raw === 'SENSITIVE' ? 'RESTRICTED' : raw;
  const route = ROUTING[category];
  if (route?.confidentiality === 'RESTRICTED') return 'RESTRICTED';
  if (mapped === 'RESTRICTED') return 'RESTRICTED';
  if (route?.confidentiality === 'CONFIDENTIAL') return 'CONFIDENTIAL';
  if (mapped === 'CONFIDENTIAL') return 'CONFIDENTIAL';
  return 'NORMAL';
}

function academicYearLabel(date = new Date()) {
  const year = date.getFullYear();
  const start = date.getMonth() >= 3 ? year : year - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
}

function addHours(date: Date, hours?: number | null) {
  return hours ? new Date(date.getTime() + hours * 3600000) : null;
}

async function tableExists(table: string) {
  return db.schema.hasTable(table);
}

async function insertIfTable(table: string, row: Record<string, unknown>) {
  if (await tableExists(table)) await db(table).insert(row);
}

async function nextGrievanceNumber(collegeId: number): Promise<string> {
  const year = academicYearLabel();
  const college = await db('colleges').where({ id: collegeId }).select('code').first();
  const prefix = college?.code ? String(college.code).replace(/[^A-Z0-9]/gi, '').toUpperCase() : 'SX';

  return db.transaction(async (trx) => {
    await trx.raw(
      'insert into student_grievance_sequences (college_id, series, academic_year, last_number, created_at, updated_at) values (?, ?, ?, 0, now(), now()) on duplicate key update updated_at = updated_at',
      [collegeId, 'GRV', year],
    );
    const row = await trx('student_grievance_sequences')
      .where({ college_id: collegeId, series: 'GRV', academic_year: year })
      .forUpdate()
      .first();
    const next = Number(row?.last_number ?? 0) + 1;
    await trx('student_grievance_sequences').where({ id: row.id }).update({ last_number: next, updated_at: trx.fn.now() });
    return `${prefix}/GRV/${year}/${String(next).padStart(6, '0')}`;
  });
}

async function categoryPolicy(collegeId: number, category: string) {
  if (await tableExists('student_grievance_categories')) {
    const row = await db('student_grievance_categories').where({ college_id: collegeId, code: category, is_active: true }).first();
    if (row) return row;
  }
  const old = await db('college_grievance_policies').where({ college_id: collegeId, category }).first().catch(() => null);
  return {
    code: category,
    case_type: category,
    default_confidentiality: ROUTING[category]?.confidentiality ?? (RESTRICTED_CATEGORIES.has(category) ? 'RESTRICTED' : 'NORMAL'),
    default_priority: category === 'SAFETY_CONCERN' || category === 'ANTI_RAGGING' ? 'HIGH' : 'NORMAL',
    response_sla_hours: old?.response_sla_hours ?? 24,
    resolution_sla_hours: old?.resolution_sla_hours ?? (RESTRICTED_CATEGORIES.has(category) ? 72 : 120),
    routing_role: ROUTING[category]?.role ?? 'GRIEVANCE_OFFICER',
    routing_module: ROUTING[category]?.module ?? null,
    allow_appeal: true,
  };
}

function canOperateGrievance(actor: ServicesActor) {
  return ['GRIEVANCE_OFFICER', 'STUDENT_WELFARE_OFFICER', 'PRINCIPAL', 'COLLEGE_ADMIN'].includes(actor.role);
}

function canConfigureGrievance(actor: ServicesActor) {
  return ['SUPER_ADMIN', 'COLLEGE_ADMIN'].includes(actor.role);
}

function isManagement(actor: ServicesActor) {
  return actor.role === 'MANAGEMENT' || actor.role === 'EXECUTIVE' || actor.role === 'PRINCIPAL_MANAGEMENT';
}

async function studentDepartmentId(studentId: number) {
  const s = await db('students').where({ id: studentId }).select('department_id').first();
  return s?.department_id != null ? Number(s.department_id) : null;
}

export async function canViewGrievance(actor: ServicesActor, grievance: Row, raw = false): Promise<boolean> {
  if (Number(grievance.college_id) !== actor.collegeId) return false;
  const confidentiality = String(grievance.confidentiality || 'NORMAL');
  const category = String(grievance.category || grievance.case_type || '');

  if (isManagement(actor)) return false;
  if (canConfigureGrievance(actor) && actor.role === 'SUPER_ADMIN') return false;
  if (Number(grievance.assigned_to_faculty_id) === actor.facultyUserId) return confidentiality !== 'RESTRICTED' || canOperateGrievance(actor);
  if (actor.role === 'GRIEVANCE_OFFICER') return category !== 'STUDENT_WELFARE' || confidentiality !== 'RESTRICTED';
  if (actor.role === 'STUDENT_WELFARE_OFFICER') return category === 'STUDENT_WELFARE' || category === 'MENTORING_REFERRAL' || confidentiality === 'RESTRICTED';
  if (actor.role === 'PRINCIPAL') return raw ? confidentiality !== 'RESTRICTED' : true;
  if (actor.role === 'COLLEGE_ADMIN') return raw ? confidentiality === 'NORMAL' : confidentiality !== 'RESTRICTED';
  if (actor.role === 'HOD') {
    if (confidentiality === 'RESTRICTED') return false;
    const deptId = grievance.department_id != null ? Number(grievance.department_id) : await studentDepartmentId(Number(grievance.student_id));
    return deptId != null && actor.departmentId != null && Number(actor.departmentId) === deptId && ['ACADEMIC', 'GENERAL_GRIEVANCE'].includes(category);
  }
  return false;
}

function studentCanSee(row: Row, actor: StudentActor) {
  return Number(row.college_id) === actor.collegeId && Number(row.student_id) === actor.studentId;
}

function safeSubject(row: Row, rawAllowed: boolean) {
  if (!rawAllowed && row.confidentiality === 'RESTRICTED') return 'Restricted case';
  return row.subject;
}

function serializeGrievance(row: Row, opts: { viewer: 'student' | 'staff' | 'management'; rawAllowed?: boolean } = { viewer: 'student' }) {
  const rawAllowed = opts.viewer === 'student' || opts.rawAllowed === true;
  const hideIdentity = Boolean(row.is_anonymous) && opts.viewer !== 'student' && !rawAllowed;
  return {
    id: Number(row.id),
    grievanceNumber: row.grievance_number,
    caseNumber: row.grievance_number,
    category: row.category,
    caseType: row.case_type ?? row.category,
    subject: safeSubject(row, rawAllowed),
    description: rawAllowed ? row.description : undefined,
    priority: row.official_priority ?? row.priority,
    studentIndicatedPriority: row.priority,
    severity: row.severity ?? 'NORMAL',
    confidentiality: row.confidentiality,
    status: row.status,
    requesterVisibleStatus: row.requester_visible_status ?? row.status,
    assignedToFacultyId: row.assigned_to_faculty_id != null ? Number(row.assigned_to_faculty_id) : null,
    assignedRole: row.assigned_role ?? null,
    sourceModule: row.source_module ?? null,
    sourceEntityType: row.source_entity_type ?? null,
    sourceEntityId: row.source_entity_id ?? null,
    linkedReference: row.linked_reference ?? null,
    submittedAt: row.submitted_at,
    acknowledgedAt: row.acknowledged_at,
    firstResponseAt: row.first_response_at,
    dueAt: row.due_at,
    resolvedAt: row.resolved_at,
    resolutionSummary: row.resolution_public_summary ?? row.resolution_summary,
    studentAcknowledged: !!row.student_acknowledged,
    responseSlaHours: row.response_sla_hours,
    resolutionSlaHours: row.resolution_sla_hours,
    reopenCount: Number(row.reopen_count ?? 0),
    appealCount: Number(row.appeal_count ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    studentName: hideIdentity ? 'Anonymous Reporter' : row.student_name,
    usn: hideIdentity ? null : row.usn,
    departmentId: row.department_id != null ? Number(row.department_id) : null,
  };
}

async function listCaseAttachments(grievanceId: number, rawAllowed: boolean) {
  if (!(await tableExists('student_grievance_attachments'))) return [];
  const rows = await db('student_grievance_attachments')
    .where({ grievance_id: grievanceId })
    .orderBy('created_at');
  return rows
    .filter((r) => rawAllowed || r.visibility !== 'RESTRICTED')
    .map((r) => ({
      id: Number(r.id),
      fileName: r.file_name,
      mimeType: r.mime_type,
      fileSize: Number(r.file_size ?? 0),
      visibility: r.visibility,
      createdAt: r.created_at,
    }));
}

async function recordCaseEvent(input: {
  grievanceId: number;
  eventType: string;
  from?: string | null;
  to?: string | null;
  actor?: ServicesActor | StudentActor;
  requesterVisible?: boolean;
  publicMessage?: string | null;
  internalMessage?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const isStudent = input.actor && 'studentId' in input.actor;
  await insertIfTable('student_grievance_events', {
    grievance_id: input.grievanceId,
    event_type: input.eventType,
    from_value: input.from ?? null,
    to_value: input.to ?? null,
    actor_faculty_id: !isStudent && input.actor ? (input.actor as ServicesActor).facultyUserId : null,
    actor_student_id: isStudent ? (input.actor as StudentActor).studentId : null,
    requester_visible: input.requesterVisible ?? false,
    public_message: input.publicMessage ?? null,
    internal_message: input.internalMessage ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });
}

async function auditCase(actor: ServicesActor | StudentActor, action: string, grievanceId: number, afterState?: Record<string, unknown>, reason?: string | null) {
  const isStudent = 'studentId' in actor;
  await recordServicesAudit({
    collegeId: actor.collegeId,
    actorId: isStudent ? actor.studentId : actor.facultyUserId,
    actorType: isStudent ? 'STUDENT' : 'FACULTY',
    action,
    entityType: 'student_grievance',
    entityId: grievanceId,
    afterState,
    reason,
  });
}

async function transitionCase(
  actor: ServicesActor | StudentActor,
  grievanceId: number,
  nextStatus: CaseStatus,
  opts: { publicMessage?: string | null; internalMessage?: string | null; skipValidation?: boolean; patch?: Record<string, unknown> } = {},
) {
  const row = await db('student_grievances').where({ id: grievanceId, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Case not found');
  const current = String(row.status) as CaseStatus;
  if (!opts.skipValidation && !(VALID_TRANSITIONS[current] ?? []).includes(nextStatus)) {
    throw new AppError(409, `Invalid case transition ${current} → ${nextStatus}`);
  }
  const requesterVisibleStatus = STUDENT_VISIBLE_STATUSES.has(nextStatus) ? nextStatus : row.requester_visible_status ?? nextStatus;
  await db('student_grievances').where({ id: grievanceId }).update({
    ...(opts.patch ?? {}),
    status: nextStatus,
    requester_visible_status: requesterVisibleStatus,
    updated_at: db.fn.now(),
  });
  await recordCaseEvent({
    grievanceId,
    eventType: 'STATUS_CHANGED',
    from: current,
    to: nextStatus,
    actor,
    requesterVisible: STUDENT_VISIBLE_STATUSES.has(nextStatus),
    publicMessage: opts.publicMessage ?? `Case status updated to ${nextStatus}.`,
    internalMessage: opts.internalMessage ?? null,
  });
  await auditCase(actor, 'GRIEVANCE_STATUS_CHANGED', grievanceId, { from: current, to: nextStatus });
}

async function fetchStudentCase(actor: StudentActor, grievanceId: number) {
  const row = await db('student_grievances')
    .where({ id: grievanceId, student_id: actor.studentId, college_id: actor.collegeId })
    .first();
  if (!row) throw new AppError(404, 'Case not found');
  return row;
}

export async function listCategories(collegeId: number) {
  if (await tableExists('student_grievance_categories')) {
    const rows = await db('student_grievance_categories').where({ college_id: collegeId, is_active: true }).orderBy('sort_order');
    if (rows.length) {
      return rows.map((r) => ({
        code: r.code,
        label: r.label,
        caseType: r.case_type,
        defaultConfidentiality: r.default_confidentiality,
        defaultPriority: r.default_priority,
        responseSlaHours: r.response_sla_hours,
        resolutionSlaHours: r.resolution_sla_hours,
        routingModule: r.routing_module,
        allowAppeal: !!r.allow_appeal,
      }));
    }
  }
  return Object.keys(ROUTING).map((code) => ({
    code,
    label: code.split('_').map((p) => p[0] + p.slice(1).toLowerCase()).join(' '),
    caseType: code,
    defaultConfidentiality: ROUTING[code]?.confidentiality ?? 'NORMAL',
    defaultPriority: ['SAFETY_CONCERN', 'ANTI_RAGGING'].includes(code) ? 'HIGH' : 'NORMAL',
    responseSlaHours: 24,
    resolutionSlaHours: RESTRICTED_CATEGORIES.has(code) ? 72 : 120,
    routingModule: ROUTING[code]?.module ?? null,
    allowAppeal: true,
  }));
}

export async function createGrievance(
  actor: StudentActor,
  input: {
    category: string;
    subject: string;
    description: string;
    priority?: string;
    confidentiality?: string;
    sourceModule?: string | null;
    sourceEntityType?: string | null;
    sourceEntityId?: string | number | null;
    studentUrgencyReason?: string | null;
    anonymous?: boolean;
  },
) {
  if (input.anonymous) {
    throw new AppError(400, 'Anonymous reporting is not enabled until reporter identity separation is fully configured');
  }
  const category = normalizeCategory(input.category);
  const policy = await categoryPolicy(actor.collegeId, category);
  const confidentiality = normalizeConfidentiality(input.confidentiality ?? policy.default_confidentiality, category);
  const route = ROUTING[category] ?? { role: policy.routing_role ?? 'GRIEVANCE_OFFICER' };
  const studentPriority = String(input.priority || 'NORMAL').toUpperCase();
  const officialPriority = ['SAFETY_CONCERN', 'ANTI_RAGGING'].includes(category) ? 'HIGH' : String(policy.default_priority || 'NORMAL').toUpperCase();
  const now = new Date();
  const grievanceNumber = await nextGrievanceNumber(actor.collegeId);
  const dueAt = addHours(now, Number(policy.resolution_sla_hours ?? 120));

  const [id] = await db('student_grievances').insert({
    college_id: actor.collegeId,
    student_id: actor.studentId,
    grievance_number: grievanceNumber,
    category,
    case_type: policy.case_type ?? category,
    subject: input.subject,
    description: input.description,
    priority: studentPriority,
    official_priority: officialPriority,
    student_urgency_reason: input.studentUrgencyReason ?? null,
    severity: ['HIGH', 'URGENT'].includes(officialPriority) ? 'HIGH' : 'NORMAL',
    confidentiality,
    is_anonymous: false,
    status: 'SUBMITTED',
    requester_visible_status: 'SUBMITTED',
    assigned_role: route.role,
    source_module: input.sourceModule ?? route.module ?? null,
    source_entity_type: input.sourceEntityType ?? null,
    source_entity_id: input.sourceEntityId != null ? String(input.sourceEntityId) : null,
    response_sla_hours: policy.response_sla_hours ?? 24,
    resolution_sla_hours: policy.resolution_sla_hours ?? 120,
    due_at: dueAt,
    submitted_at: db.fn.now(),
  });

  await recordCaseEvent({
    grievanceId: Number(id),
    eventType: 'SUBMITTED',
    actor,
    requesterVisible: true,
    publicMessage: `Case ${grievanceNumber} was submitted.`,
    metadata: { category, confidentiality, officialPriority, assignedRole: route.role },
  });
  await auditCase(actor, 'GRIEVANCE_SUBMITTED', Number(id), { grievanceNumber, category, confidentiality });

  await notifyStudent({
    studentId: actor.studentId,
    collegeId: actor.collegeId,
    type: 'GRIEVANCE_SUBMITTED',
    title: 'Case submitted',
    body: `Your case ${grievanceNumber} has been submitted.`,
    link: `/lms/services/grievances/${id}`,
    relatedType: 'grievance',
    relatedId: Number(id),
  });

  return getStudentGrievance(actor, Number(id));
}

export async function createDraft(actor: StudentActor, input: { category: string; subject: string; description?: string }) {
  const category = normalizeCategory(input.category);
  const [id] = await db('student_grievances').insert({
    college_id: actor.collegeId,
    student_id: actor.studentId,
    category,
    case_type: category,
    subject: input.subject,
    description: input.description ?? '',
    status: 'DRAFT',
    requester_visible_status: 'DRAFT',
    confidentiality: normalizeConfidentiality(null, category),
  });
  await recordCaseEvent({ grievanceId: Number(id), eventType: 'DRAFT_CREATED', actor, requesterVisible: true });
  return getStudentGrievance(actor, Number(id));
}

export async function listStudentGrievances(studentId: number, collegeId: number) {
  const rows = await db('student_grievances')
    .where({ student_id: studentId, college_id: collegeId })
    .orderBy('updated_at', 'desc');
  return rows.map((r) => serializeGrievance(r, { viewer: 'student' }));
}

export async function getStudentGrievance(actor: StudentActor, grievanceId: number) {
  const row = await fetchStudentCase(actor, grievanceId);
  const events = await db('student_grievance_events').where({ grievance_id: grievanceId, requester_visible: true }).orderBy('created_at').catch(() => []);
  const messages = await db('student_grievance_messages').where({ grievance_id: grievanceId }).orderBy('created_at').catch(() => []);
  const appeals = await db('student_grievance_appeals').where({ grievance_id: grievanceId }).orderBy('created_at').catch(() => []);
  const attachments = await listCaseAttachments(grievanceId, true);
  return {
    ...serializeGrievance(row, { viewer: 'student' }),
    timeline: events.map((e) => ({
      type: e.event_type,
      from: e.from_value,
      to: e.to_value,
      message: e.public_message,
      createdAt: e.created_at,
    })),
    messages: messages.map((m) => ({
      id: Number(m.id),
      author: m.author_student_id ? 'STUDENT' : 'STAFF',
      body: m.body,
      createdAt: m.created_at,
    })),
    attachments,
    appeals: appeals.map((a) => ({ id: Number(a.id), reason: a.reason, status: a.status, createdAt: a.created_at })),
    expectedResponseBy: row.response_sla_hours && row.submitted_at ? addHours(new Date(String(row.submitted_at)), Number(row.response_sla_hours))?.toISOString() : null,
    dueAt: row.due_at,
  };
}

export async function acknowledgeGrievance(actor: StudentActor, grievanceId: number) {
  const row = await fetchStudentCase(actor, grievanceId);
  if (row.status !== 'RESOLVED') throw new AppError(400, 'Case is not resolved yet');
  await transitionCase(actor, grievanceId, 'CLOSED', {
    publicMessage: 'You accepted the resolution and the case was closed.',
    patch: { student_acknowledged: true, acknowledged_at: db.fn.now(), resolution_feedback: 'ACCEPTED' },
  });
  return getStudentGrievance(actor, grievanceId);
}

export async function studentRespond(actor: StudentActor, grievanceId: number, body: string) {
  const row = await fetchStudentCase(actor, grievanceId);
  await insertIfTable('student_grievance_messages', {
    grievance_id: grievanceId,
    author_student_id: actor.studentId,
    body,
  });
  if (row.status === 'PENDING_INFORMATION') {
    await transitionCase(actor, grievanceId, 'UNDER_REVIEW', { publicMessage: 'Your response was received.' });
  } else {
    await recordCaseEvent({ grievanceId, eventType: 'REQUESTER_RESPONDED', actor, requesterVisible: true, publicMessage: 'Your response was received.' });
  }
  await auditCase(actor, 'GRIEVANCE_REQUESTER_RESPONDED', grievanceId);
  return getStudentGrievance(actor, grievanceId);
}

export async function studentFeedback(actor: StudentActor, grievanceId: number, input: { feedback: 'ACCEPTED' | 'UNRESOLVED'; reason?: string | null }) {
  const row = await fetchStudentCase(actor, grievanceId);
  if (row.status !== 'RESOLVED') throw new AppError(400, 'Feedback can be recorded only after resolution');
  await db('student_grievances').where({ id: grievanceId }).update({
    resolution_feedback: input.feedback,
    resolution_feedback_reason: input.reason ?? null,
    student_acknowledged: input.feedback === 'ACCEPTED',
    acknowledged_at: input.feedback === 'ACCEPTED' ? db.fn.now() : null,
    updated_at: db.fn.now(),
  });
  await recordCaseEvent({ grievanceId, eventType: 'REQUESTER_FEEDBACK', actor, requesterVisible: true, publicMessage: input.feedback === 'ACCEPTED' ? 'Resolution accepted.' : 'Resolution marked unresolved.' });
  return getStudentGrievance(actor, grievanceId);
}

export async function appealCase(actor: StudentActor | ServicesActor, grievanceId: number, reason: string) {
  const isStudent = 'studentId' in actor;
  const row = isStudent ? await fetchStudentCase(actor, grievanceId) : await db('student_grievances').where({ id: grievanceId, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Case not found');
  if (!isStudent && !(await canViewGrievance(actor, row, true))) throw new AppError(403, 'Access denied');
  if (!['RESOLVED', 'CLOSED', 'REJECTED'].includes(row.status)) throw new AppError(400, 'Appeal is available after a decision or resolution');
  await insertIfTable('student_grievance_appeals', {
    grievance_id: grievanceId,
    filed_by_student_id: isStudent ? actor.studentId : null,
    filed_by_faculty_id: isStudent ? null : actor.facultyUserId,
    reason,
    routed_to_role: 'PRINCIPAL',
  });
  await db('student_grievances').where({ id: grievanceId }).increment('appeal_count', 1).update({ updated_at: db.fn.now() });
  await transitionCase(actor, grievanceId, 'REOPENED', { publicMessage: 'Appeal submitted and case reopened for review.', skipValidation: row.status === 'REJECTED' });
  return isStudent ? getStudentGrievance(actor, grievanceId) : staffGetGrievance(actor, grievanceId);
}

export async function staffListGrievances(actor: ServicesActor, filters: { status?: string; category?: string; queue?: string; search?: string }) {
  if (isManagement(actor)) return [];
  let q = db('student_grievances as g')
    .join('students as s', 's.id', 'g.student_id')
    .where({ 'g.college_id': actor.collegeId });
  if (filters.status) q = q.where('g.status', filters.status);
  if (filters.category) q = q.where('g.category', normalizeCategory(filters.category));
  if (filters.queue === 'assigned') q = q.where('g.assigned_to_faculty_id', actor.facultyUserId);
  if (filters.search) q = q.where((b) => b.where('g.grievance_number', 'like', `%${filters.search}%`).orWhere('g.subject', 'like', `%${filters.search}%`));
  const rows = await q.select('g.*', 's.name as student_name', 's.usn', 's.department_id').orderBy('g.updated_at', 'desc').limit(300);
  const out = [];
  for (const row of rows) {
    const rawAllowed = await canViewGrievance(actor, row, true);
    if (rawAllowed || (await canViewGrievance(actor, row, false))) {
      out.push(serializeGrievance(row, { viewer: 'staff', rawAllowed }));
    }
  }
  return out;
}

export async function staffGetGrievance(actor: ServicesActor, grievanceId: number) {
  const row = await db('student_grievances as g')
    .join('students as s', 's.id', 'g.student_id')
    .where({ 'g.id': grievanceId, 'g.college_id': actor.collegeId })
    .select('g.*', 's.name as student_name', 's.usn', 's.department_id')
    .first();
  if (!row) throw new AppError(404, 'Case not found');
  const rawAllowed = await canViewGrievance(actor, row, true);
  if (!rawAllowed && !(await canViewGrievance(actor, row, false))) throw new AppError(403, 'Access denied');
  await recordCaseEvent({ grievanceId, eventType: 'ACCESSED', actor, requesterVisible: false, metadata: { confidentiality: row.confidentiality } });

  const [events, notes, messages, assignments, referrals, appeals, attachments] = await Promise.all([
    db('student_grievance_events').where({ grievance_id: grievanceId }).orderBy('created_at').catch(() => []),
    rawAllowed ? db('student_grievance_notes').where({ grievance_id: grievanceId }).orderBy('created_at').catch(() => []) : Promise.resolve([]),
    db('student_grievance_messages').where({ grievance_id: grievanceId }).orderBy('created_at').catch(() => []),
    db('student_grievance_assignments').where({ grievance_id: grievanceId }).orderBy('created_at').catch(() => []),
    db('student_grievance_referrals').where({ grievance_id: grievanceId }).orderBy('created_at').catch(() => []),
    db('student_grievance_appeals').where({ grievance_id: grievanceId }).orderBy('created_at').catch(() => []),
    listCaseAttachments(grievanceId, rawAllowed),
  ]);
  return {
    ...serializeGrievance(row, { viewer: 'staff', rawAllowed }),
    timeline: events.map((e) => ({ type: e.event_type, from: e.from_value, to: e.to_value, publicMessage: e.public_message, internalMessage: rawAllowed ? e.internal_message : null, createdAt: e.created_at })),
    internalNotes: notes.map((n) => ({ id: Number(n.id), visibility: n.visibility, body: n.body, createdAt: n.created_at })),
    messages: messages.map((m) => ({ id: Number(m.id), author: m.author_student_id ? 'STUDENT' : 'STAFF', body: m.body, createdAt: m.created_at })),
    attachments,
    assignments: assignments.map((a) => ({ previousFacultyId: a.previous_faculty_id, newFacultyId: a.new_faculty_id, previousRole: a.previous_role, newRole: a.new_role, reason: a.reason, createdAt: a.created_at })),
    referrals: referrals.map((r) => ({ id: Number(r.id), targetModule: r.target_module, safeReference: r.safe_reference, status: r.status, safeSummary: r.safe_summary, createdAt: r.created_at })),
    appeals: appeals.map((a) => ({ id: Number(a.id), reason: a.reason, status: a.status, routedToRole: a.routed_to_role, createdAt: a.created_at })),
  };
}

export async function triageGrievance(actor: ServicesActor, grievanceId: number, input: { category?: string; priority?: string; confidentiality?: string; severity?: string; reason?: string | null }) {
  const row = await db('student_grievances').where({ id: grievanceId, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Case not found');
  if (!canOperateGrievance(actor) && actor.role !== 'HOD') throw new AppError(403, 'Access denied');
  if (!(await canViewGrievance(actor, row, true))) throw new AppError(403, 'Access denied');
  const category = input.category ? normalizeCategory(input.category) : row.category;
  const confidentiality = input.confidentiality ? normalizeConfidentiality(input.confidentiality, category) : row.confidentiality;
  const route = ROUTING[category] ?? { role: row.assigned_role ?? 'GRIEVANCE_OFFICER' };
  await transitionCase(actor, grievanceId, 'TRIAGED', {
    publicMessage: 'Your case has been reviewed for routing.',
    internalMessage: input.reason ?? null,
    skipValidation: row.status === 'TRIAGED',
    patch: {
      category,
      case_type: category,
      official_priority: input.priority ?? row.official_priority,
      severity: input.severity ?? row.severity,
      confidentiality,
      assigned_role: route.role,
      source_module: row.source_module ?? route.module ?? null,
      first_response_at: row.first_response_at ?? db.fn.now(),
    },
  });
  return staffGetGrievance(actor, grievanceId);
}

export async function assignGrievance(actor: ServicesActor, grievanceId: number, facultyId: number, remarks?: string | null) {
  const row = await db('student_grievances').where({ id: grievanceId, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Case not found');
  if (!(await canViewGrievance(actor, row, true))) throw new AppError(403, 'Access denied');
  await db.transaction(async (trx) => {
    const locked = await trx('student_grievances').where({ id: grievanceId, college_id: actor.collegeId }).forUpdate().first();
    await trx('student_grievance_assignments').insert({
      grievance_id: grievanceId,
      previous_faculty_id: locked.assigned_to_faculty_id ?? null,
      new_faculty_id: facultyId,
      previous_role: locked.assigned_role ?? null,
      new_role: locked.assigned_role ?? null,
      actor_faculty_id: actor.facultyUserId,
      reason: remarks ?? null,
    }).catch(() => undefined);
    await trx('student_grievances').where({ id: grievanceId }).update({
      assigned_to_faculty_id: facultyId,
      status: 'ASSIGNED',
      requester_visible_status: 'ASSIGNED',
      first_response_at: locked.first_response_at ?? trx.fn.now(),
      updated_at: trx.fn.now(),
    });
  });
  await recordCaseEvent({ grievanceId, eventType: 'ASSIGNED', actor, requesterVisible: true, publicMessage: 'Your case has been assigned for review.', internalMessage: remarks ?? null });
  await auditCase(actor, 'GRIEVANCE_ASSIGNED', grievanceId, { assignedTo: facultyId }, remarks);
  await notifyStudent({
    studentId: Number(row.student_id),
    collegeId: actor.collegeId,
    type: 'GRIEVANCE_ASSIGNED',
    title: 'Case assigned',
    body: `Your case ${row.grievance_number} has been updated.`,
    link: `/lms/services/grievances/${grievanceId}`,
    relatedType: 'grievance',
    relatedId: grievanceId,
  });
  return staffGetGrievance(actor, grievanceId);
}

export async function requestClarification(actor: ServicesActor, grievanceId: number, body: string) {
  const row = await db('student_grievances').where({ id: grievanceId, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Case not found');
  if (!(await canViewGrievance(actor, row, true))) throw new AppError(403, 'Access denied');
  await insertIfTable('student_grievance_messages', { grievance_id: grievanceId, author_faculty_id: actor.facultyUserId, body, message_type: 'CLARIFICATION_REQUEST' });
  await transitionCase(actor, grievanceId, 'PENDING_INFORMATION', { publicMessage: 'More information has been requested.' });
  await notifyStudent({
    studentId: Number(row.student_id),
    collegeId: actor.collegeId,
    type: 'GRIEVANCE_CLARIFICATION',
    title: 'Case needs your response',
    body: `Your case ${row.grievance_number} needs your response.`,
    link: `/lms/services/grievances/${grievanceId}`,
    relatedType: 'grievance',
    relatedId: grievanceId,
  });
  return staffGetGrievance(actor, grievanceId);
}

export async function addInternalNote(actor: ServicesActor, grievanceId: number, body: string, visibility: 'TEAM' | 'RESTRICTED' = 'TEAM') {
  const row = await db('student_grievances').where({ id: grievanceId, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Case not found');
  if (!(await canViewGrievance(actor, row, true))) throw new AppError(403, 'Access denied');
  if (visibility === 'RESTRICTED' && row.confidentiality !== 'RESTRICTED') visibility = 'TEAM';
  await insertIfTable('student_grievance_notes', { grievance_id: grievanceId, author_faculty_id: actor.facultyUserId, visibility, body });
  await recordCaseEvent({ grievanceId, eventType: 'INTERNAL_NOTE_ADDED', actor, requesterVisible: false, internalMessage: visibility });
  await auditCase(actor, 'GRIEVANCE_INTERNAL_NOTE_ADDED', grievanceId, { visibility });
  return staffGetGrievance(actor, grievanceId);
}

export async function createReferral(actor: ServicesActor, grievanceId: number, input: { targetModule: string; targetEntityType?: string | null; targetEntityId?: string | number | null; safeReference?: string | null; safeSummary?: string | null }) {
  const row = await db('student_grievances').where({ id: grievanceId, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Case not found');
  if (!(await canViewGrievance(actor, row, true))) throw new AppError(403, 'Access denied');
  await insertIfTable('student_grievance_referrals', {
    grievance_id: grievanceId,
    target_module: input.targetModule,
    target_entity_type: input.targetEntityType ?? null,
    target_entity_id: input.targetEntityId != null ? String(input.targetEntityId) : null,
    safe_reference: input.safeReference ?? null,
    safe_summary: input.safeSummary ?? null,
    created_by_faculty_id: actor.facultyUserId,
  });
  await transitionCase(actor, grievanceId, 'REFERRED', {
    publicMessage: 'Your case has been routed to the responsible unit for action.',
    patch: {
      source_module: input.targetModule,
      source_entity_type: input.targetEntityType ?? row.source_entity_type,
      source_entity_id: input.targetEntityId != null ? String(input.targetEntityId) : row.source_entity_id,
      linked_reference: input.safeReference ?? row.linked_reference,
    },
  });
  return staffGetGrievance(actor, grievanceId);
}

export async function resolveGrievance(actor: ServicesActor, grievanceId: number, resolutionSummary: string, remarks?: string | null) {
  const row = await db('student_grievances').where({ id: grievanceId, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Case not found');
  if (!(await canViewGrievance(actor, row, true))) throw new AppError(403, 'Access denied');

  await db.transaction(async (trx) => {
    const locked = await trx('student_grievances').where({ id: grievanceId, college_id: actor.collegeId }).forUpdate().first();
    if (locked.status === 'RESOLVED' || locked.status === 'CLOSED') return;
    await trx('student_grievance_resolutions').insert({
      grievance_id: grievanceId,
      internal_summary: remarks ?? null,
      public_summary: resolutionSummary,
      responsible_authority: actor.role,
      resolved_by_faculty_id: actor.facultyUserId,
    }).catch(async () => undefined);
    await trx('student_grievances').where({ id: grievanceId }).update({
      status: 'RESOLVED',
      requester_visible_status: 'RESOLVED',
      resolution_summary: remarks ?? resolutionSummary,
      resolution_public_summary: resolutionSummary,
      resolved_by_faculty_id: actor.facultyUserId,
      resolved_at: trx.fn.now(),
      updated_at: trx.fn.now(),
    });
  });
  await recordCaseEvent({ grievanceId, eventType: 'RESOLVED', actor, requesterVisible: true, publicMessage: 'A resolution has been posted.', internalMessage: remarks ?? null });
  await auditCase(actor, 'GRIEVANCE_RESOLVED', grievanceId, undefined, remarks);
  await notifyStudent({
    studentId: Number(row.student_id),
    collegeId: actor.collegeId,
    type: 'GRIEVANCE_RESOLVED',
    title: 'Case resolved',
    body: `Your case ${row.grievance_number} has been updated.`,
    link: `/lms/services/grievances/${grievanceId}`,
    relatedType: 'grievance',
    relatedId: grievanceId,
  });
  return staffGetGrievance(actor, grievanceId);
}

export async function reopenCase(actor: ServicesActor | StudentActor, grievanceId: number, reason: string) {
  const isStudent = 'studentId' in actor;
  const row = isStudent ? await fetchStudentCase(actor, grievanceId) : await db('student_grievances').where({ id: grievanceId, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Case not found');
  if (!isStudent && !(await canViewGrievance(actor, row, true))) throw new AppError(403, 'Access denied');
  if (!['RESOLVED', 'CLOSED', 'REJECTED', 'WITHDRAWN'].includes(row.status)) throw new AppError(400, 'Only decided cases can be reopened');
  await db('student_grievances').where({ id: grievanceId }).increment('reopen_count', 1).update({ resolution_feedback: 'UNRESOLVED', resolution_feedback_reason: reason, updated_at: db.fn.now() });
  await transitionCase(actor, grievanceId, 'REOPENED', { publicMessage: 'Case reopened for review.', internalMessage: reason, skipValidation: row.status === 'WITHDRAWN' });
  return isStudent ? getStudentGrievance(actor, grievanceId) : staffGetGrievance(actor, grievanceId);
}

export async function escalateGrievance(actor: ServicesActor, grievanceId: number, toRole: string, reason?: string | null, isAutomatic = false) {
  const row = await db('student_grievances').where({ id: grievanceId, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Case not found');
  if (!(await canViewGrievance(actor, row, true))) throw new AppError(403, 'Access denied');
  await db('student_grievance_escalations').insert({
    grievance_id: grievanceId,
    from_role: actor.role,
    to_role: toRole,
    reason: reason ?? null,
    is_automatic: isAutomatic,
  }).catch(() => undefined);
  await recordCaseEvent({ grievanceId, eventType: 'ESCALATED', actor, requesterVisible: false, internalMessage: reason ?? null, metadata: { toRole, isAutomatic } });
  await db('student_grievances').where({ id: grievanceId }).update({ assigned_role: toRole, updated_at: db.fn.now() });
  await auditCase(actor, 'GRIEVANCE_ESCALATED', grievanceId, { toRole }, reason);
  return staffGetGrievance(actor, grievanceId);
}

export async function managementAnalytics(actor: ServicesActor) {
  if (!isManagement(actor) && actor.role !== 'PRINCIPAL') throw new AppError(403, 'Access denied');
  const rows = await db('student_grievances')
    .where({ college_id: actor.collegeId })
    .select('category', 'status', 'official_priority', 'confidentiality', 'due_at', 'resolved_at', 'created_at');
  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let overdue = 0;
  let restricted = 0;
  for (const r of rows) {
    byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    if (r.confidentiality === 'RESTRICTED') restricted += 1;
    if (r.due_at && !['RESOLVED', 'CLOSED', 'REJECTED', 'WITHDRAWN'].includes(r.status) && new Date(r.due_at).getTime() < Date.now()) overdue += 1;
  }
  return {
    total: rows.length,
    open: rows.filter((r) => !['RESOLVED', 'CLOSED', 'REJECTED', 'WITHDRAWN'].includes(r.status)).length,
    resolved: rows.filter((r) => ['RESOLVED', 'CLOSED'].includes(r.status)).length,
    overdue,
    restrictedCount: restricted,
    byCategory,
    byStatus,
    deidentified: true,
  };
}

export async function dashboard(actor: ServicesActor) {
  if (isManagement(actor)) return managementAnalytics(actor);
  const cases = await staffListGrievances(actor, {});
  return {
    actionRequired: {
      newCases: cases.filter((c) => c.status === 'SUBMITTED').length,
      untriaged: cases.filter((c) => c.status === 'SUBMITTED').length,
      unassigned: cases.filter((c) => !c.assignedToFacultyId).length,
      urgent: cases.filter((c) => ['HIGH', 'URGENT'].includes(String(c.priority))).length,
      awaitingStudent: cases.filter((c) => c.status === 'PENDING_INFORMATION').length,
      appeals: cases.filter((c) => c.appealCount > 0).length,
    },
    health: {
      open: cases.filter((c) => !['RESOLVED', 'CLOSED', 'REJECTED', 'WITHDRAWN'].includes(String(c.status))).length,
      resolved: cases.filter((c) => ['RESOLVED', 'CLOSED'].includes(String(c.status))).length,
      restricted: cases.filter((c) => c.confidentiality === 'RESTRICTED').length,
      reopened: cases.filter((c) => c.reopenCount > 0).length,
    },
  };
}
