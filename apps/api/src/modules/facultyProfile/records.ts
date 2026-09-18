import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { EmployeeScope } from './access.js';
import { canEditOwnRecords } from './access.js';
import { normalizeRef, academicYearForDate } from './calc.js';
import { parseJson } from './profile.js';
import {
  domainConfig,
  isWritableDomain,
  type FacultyProfileActor,
  type RecordCreateInput,
} from './types.js';

type Row = Record<string, unknown>;

export type RecordFilters = {
  domain?: string;
  academicYearLabel?: string;
  category?: string;
  status?: string;
  verificationStatus?: string;
  recordType?: string;
  includeArchived?: boolean;
};

export function serializeRecord(row: Row, evidenceCount = 0): Record<string, unknown> {
  return {
    id: Number(row.id),
    domain: row.domain,
    recordType: row.record_type ?? null,
    title: row.title,
    academicYearId: row.academic_year_id ? Number(row.academic_year_id) : null,
    academicYearLabel: row.academic_year_label ?? null,
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    isCurrent: !!row.is_current,
    category: row.category ?? null,
    level: row.level ?? null,
    status: row.status ?? null,
    roleLabel: row.role_label ?? null,
    uniqueRef: row.unique_ref ?? null,
    details: parseJson(row.details, {}),
    source: row.source,
    verificationStatus: row.verification_status,
    verifiedByRole: row.verified_by_role ?? null,
    verifiedAt: row.verified_at ?? null,
    verifyRemarks: row.verify_remarks ?? null,
    submittedAt: row.submitted_at ?? null,
    isArchived: !!row.is_archived,
    evidenceCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listRecords(
  actor: FacultyProfileActor,
  employee: EmployeeScope,
  filters: RecordFilters,
) {
  const q = db('faculty_records')
    .where({ college_id: actor.collegeId, employee_id: employee.id });
  if (!filters.includeArchived) q.where('is_archived', false);
  if (filters.domain) q.where('domain', filters.domain);
  if (filters.academicYearLabel) q.where('academic_year_label', filters.academicYearLabel);
  if (filters.category) q.where('category', filters.category);
  if (filters.status) q.where('status', filters.status);
  if (filters.verificationStatus) q.where('verification_status', filters.verificationStatus);
  if (filters.recordType) q.where('record_type', filters.recordType);
  const rows = (await q.orderBy([{ column: 'academic_year_label', order: 'desc' }, { column: 'id', order: 'desc' }])) as Row[];

  const ids = rows.map((r) => Number(r.id));
  const counts = ids.length
    ? await db('faculty_record_evidence')
        .whereIn('record_id', ids)
        .groupBy('record_id')
        .select('record_id')
        .count('* as n')
    : [];
  const countMap = new Map(counts.map((c: Row) => [Number(c.record_id), Number(c.n)]));
  return rows.map((r) => serializeRecord(r, countMap.get(Number(r.id)) ?? 0));
}

export async function loadRecordRow(
  actor: FacultyProfileActor,
  employee: EmployeeScope,
  recordId: number,
): Promise<Row> {
  const row = (await db('faculty_records')
    .where({ id: recordId, college_id: actor.collegeId, employee_id: employee.id })
    .first()) as Row | undefined;
  if (!row) throw new AppError(404, 'Record not found');
  return row;
}

export async function getRecord(
  actor: FacultyProfileActor,
  employee: EmployeeScope,
  recordId: number,
) {
  const row = await loadRecordRow(actor, employee, recordId);
  const evidence = (await db('faculty_record_evidence')
    .where({ college_id: actor.collegeId, record_id: recordId })
    .orderBy('id', 'desc')) as Row[];
  const history = (await db('faculty_record_verifications')
    .where({ college_id: actor.collegeId, record_id: recordId })
    .orderBy('created_at', 'asc')) as Row[];
  return {
    ...serializeRecord(row, evidence.length),
    evidence: evidence.map((e) => ({
      id: Number(e.id),
      fileName: e.file_name,
      mimeType: e.mime_type,
      fileSize: Number(e.file_size),
      checksum: e.checksum ?? null,
      evidenceCategory: e.evidence_category ?? null,
      evidenceSubcategory: e.evidence_subcategory ?? null,
      description: e.description ?? null,
      reference: e.reference ?? null,
      createdAt: e.created_at,
    })),
    verificationHistory: history.map((h) => ({
      id: Number(h.id),
      action: h.action,
      fromStatus: h.from_status ?? null,
      toStatus: h.to_status,
      actedByRole: h.acted_by_role ?? null,
      remarks: h.remarks ?? null,
      createdAt: h.created_at,
    })),
  };
}

function deriveUniqueRef(domain: string, details: Record<string, unknown> | null | undefined): string | null {
  const cfg = domainConfig(domain);
  if (!cfg?.uniqueRefField || !details) return null;
  return normalizeRef(details[cfg.uniqueRefField]);
}

function resolveAcademicYearLabel(input: RecordCreateInput): string | null {
  if (input.academicYearLabel) return input.academicYearLabel;
  // Derive from start/end date if not explicitly provided (frozen at write time).
  return academicYearForDate(input.startDate ?? input.endDate ?? null);
}

export async function createRecord(
  actor: FacultyProfileActor,
  employee: EmployeeScope,
  input: RecordCreateInput,
) {
  if (!canEditOwnRecords(actor, employee)) {
    throw new AppError(403, 'You can only maintain your own academic records');
  }
  if (!isWritableDomain(input.domain)) throw new AppError(400, 'Unknown or non-writable domain');
  const cfg = domainConfig(input.domain)!;
  if (input.recordType && !cfg.recordTypes.includes(input.recordType)) {
    throw new AppError(400, `Invalid record type for ${cfg.label}`);
  }
  if (input.startDate && input.endDate && input.endDate < input.startDate) {
    throw new AppError(400, 'End date cannot precede start date');
  }

  const uniqueRef = deriveUniqueRef(input.domain, input.details);
  if (uniqueRef) {
    const dup = await db('faculty_records')
      .where({ employee_id: employee.id, domain: input.domain, unique_ref: uniqueRef })
      .where('is_archived', false)
      .first();
    if (dup) {
      throw new AppError(409, `A ${cfg.label.replace(/s$/, '')} with this identifier already exists on your profile`);
    }
  }

  const [id] = await db('faculty_records').insert({
    college_id: actor.collegeId,
    employee_id: employee.id,
    faculty_user_id: actor.facultyUserId,
    domain: input.domain,
    record_type: input.recordType ?? null,
    title: input.title,
    academic_year_id: input.academicYearId ?? null,
    academic_year_label: resolveAcademicYearLabel(input),
    start_date: input.startDate ?? null,
    end_date: input.endDate ?? null,
    is_current: !!input.isCurrent,
    category: input.category ?? null,
    level: input.level ?? null,
    status: input.status ?? null,
    role_label: input.roleLabel ?? null,
    unique_ref: uniqueRef,
    details: input.details ? JSON.stringify(input.details) : null,
    source: 'FACULTY',
    verification_status: cfg.verifiable ? 'DRAFT' : 'NOT_REQUIRED',
    created_by_faculty_id: actor.facultyUserId,
  });
  return getRecord(actor, employee, Number(id));
}

const EDITABLE_STATUSES = new Set(['DRAFT', 'SUBMITTED', 'RETURNED', 'REJECTED', 'NOT_REQUIRED']);

export async function updateRecord(
  actor: FacultyProfileActor,
  employee: EmployeeScope,
  recordId: number,
  patch: Partial<RecordCreateInput>,
) {
  if (!canEditOwnRecords(actor, employee)) {
    throw new AppError(403, 'You can only maintain your own academic records');
  }
  const row = await loadRecordRow(actor, employee, recordId);
  if (row.is_archived) throw new AppError(409, 'Archived records cannot be edited');
  const domain = String(row.domain);
  const cfg = domainConfig(domain);

  const merged: Record<string, unknown> = parseJson(row.details, {});
  if (patch.details) Object.assign(merged, patch.details);

  const upd: Row = { updated_at: db.fn.now() };
  if (patch.recordType !== undefined) {
    if (patch.recordType && cfg && !cfg.recordTypes.includes(patch.recordType)) {
      throw new AppError(400, `Invalid record type for ${cfg.label}`);
    }
    upd.record_type = patch.recordType ?? null;
  }
  if (patch.title !== undefined) upd.title = patch.title;
  if (patch.academicYearId !== undefined) upd.academic_year_id = patch.academicYearId ?? null;
  if (patch.academicYearLabel !== undefined) upd.academic_year_label = patch.academicYearLabel ?? null;
  if (patch.startDate !== undefined) upd.start_date = patch.startDate ?? null;
  if (patch.endDate !== undefined) upd.end_date = patch.endDate ?? null;
  if (patch.isCurrent !== undefined) upd.is_current = !!patch.isCurrent;
  if (patch.category !== undefined) upd.category = patch.category ?? null;
  if (patch.level !== undefined) upd.level = patch.level ?? null;
  if (patch.status !== undefined) upd.status = patch.status ?? null;
  if (patch.roleLabel !== undefined) upd.role_label = patch.roleLabel ?? null;
  if (patch.details !== undefined) upd.details = JSON.stringify(merged);

  const startDate = (upd.start_date ?? row.start_date) as string | null;
  const endDate = (upd.end_date ?? row.end_date) as string | null;
  if (startDate && endDate && String(endDate) < String(startDate)) {
    throw new AppError(400, 'End date cannot precede start date');
  }

  // Re-derive unique_ref and re-check dedupe if the ref field changed.
  if (patch.details && cfg?.uniqueRefField) {
    const newRef = normalizeRef(merged[cfg.uniqueRefField]);
    if (newRef && newRef !== row.unique_ref) {
      const dup = await db('faculty_records')
        .where({ employee_id: employee.id, domain, unique_ref: newRef })
        .whereNot('id', recordId)
        .where('is_archived', false)
        .first();
      if (dup) throw new AppError(409, 'Another record with this identifier already exists on your profile');
    }
    upd.unique_ref = newRef;
  }

  const currentStatus = String(row.verification_status);
  // Editing a VERIFIED record invalidates verification (spec §B29 mutation rules):
  // it returns to DRAFT and the reset is recorded in history.
  let reopened = false;
  if (currentStatus === 'VERIFIED' && cfg?.verifiable) {
    upd.verification_status = 'DRAFT';
    upd.verified_by_faculty_id = null;
    upd.verified_by_role = null;
    upd.verified_at = null;
    upd.submitted_at = null;
    reopened = true;
  } else if (!EDITABLE_STATUSES.has(currentStatus) && currentStatus !== 'VERIFIED') {
    throw new AppError(409, `Records in ${currentStatus} state cannot be edited`);
  }

  await db('faculty_records').where({ id: recordId, college_id: actor.collegeId }).update(upd);
  if (reopened) {
    await db('faculty_record_verifications').insert({
      college_id: actor.collegeId,
      record_id: recordId,
      action: 'REOPEN',
      from_status: 'VERIFIED',
      to_status: 'DRAFT',
      acted_by_faculty_id: actor.facultyUserId,
      acted_by_role: actor.role,
      remarks: 'Verification invalidated by owner edit',
    });
  }
  return getRecord(actor, employee, recordId);
}

export async function archiveRecord(
  actor: FacultyProfileActor,
  employee: EmployeeScope,
  recordId: number,
) {
  if (!canEditOwnRecords(actor, employee)) {
    throw new AppError(403, 'You can only maintain your own academic records');
  }
  await loadRecordRow(actor, employee, recordId);
  await db('faculty_records')
    .where({ id: recordId, college_id: actor.collegeId })
    .update({ is_archived: true, updated_at: db.fn.now() });
  return { ok: true };
}
