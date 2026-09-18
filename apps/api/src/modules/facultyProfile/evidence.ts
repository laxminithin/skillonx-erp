import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { EmployeeScope } from './access.js';
import { canEditOwnRecords, canViewProfile } from './access.js';
import { loadRecordRow } from './records.js';
import { ALLOWED_EVIDENCE_MIME, type FacultyProfileActor } from './types.js';
import { z } from 'zod';
import type { evidenceMetaSchema } from './types.js';

type Row = Record<string, unknown>;

export function evidenceRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../uploads/faculty-profile');
}

/** Attach an evidence document to a record (owner only). */
export async function attachEvidence(
  actor: FacultyProfileActor,
  employee: EmployeeScope,
  recordId: number,
  input: z.infer<typeof evidenceMetaSchema>,
) {
  if (!canEditOwnRecords(actor, employee)) {
    throw new AppError(403, 'You can only attach evidence to your own records');
  }
  await loadRecordRow(actor, employee, recordId); // 404 if not this employee's record

  if (!ALLOWED_EVIDENCE_MIME.has(input.mimeType)) {
    throw new AppError(400, 'Unsupported evidence file type');
  }
  let buffer: Buffer;
  try {
    buffer = Buffer.from(input.contentBase64, 'base64');
  } catch {
    throw new AppError(400, 'Invalid file content');
  }
  if (buffer.length === 0) throw new AppError(400, 'Empty file');
  if (buffer.length > 25 * 1024 * 1024) throw new AppError(400, 'File exceeds 25MB limit');

  const checksum = createHash('sha256').update(buffer).digest('hex');
  // Storage key is tenant/record scoped and opaque (never a public path).
  const storageKey = path.join(String(actor.collegeId), String(recordId), `${randomUUID()}`);
  const full = path.resolve(evidenceRoot(), storageKey);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buffer);

  const [id] = await db('faculty_record_evidence').insert({
    college_id: actor.collegeId,
    record_id: recordId,
    employee_id: employee.id,
    file_name: input.fileName,
    mime_type: input.mimeType,
    file_size: buffer.length,
    storage_key: storageKey,
    checksum,
    evidence_category: input.evidenceCategory ?? null,
    evidence_subcategory: input.evidenceSubcategory ?? null,
    description: input.description ?? null,
    reference: input.reference ?? null,
    uploaded_by_faculty_id: actor.facultyUserId,
  });
  const row = await db('faculty_record_evidence').where({ id }).first();
  return serializeEvidence(row);
}

function serializeEvidence(row: Row) {
  return {
    id: Number(row.id),
    recordId: Number(row.record_id),
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSize: Number(row.file_size),
    checksum: row.checksum ?? null,
    evidenceCategory: row.evidence_category ?? null,
    evidenceSubcategory: row.evidence_subcategory ?? null,
    description: row.description ?? null,
    reference: row.reference ?? null,
    createdAt: row.created_at,
  };
}

/**
 * Authorize + read an evidence file by id. Enforces tenant + profile-view
 * authorization (owner / HOD-dept / institution roles). Guards path traversal
 * and never returns storage paths.
 */
export async function readEvidence(actor: FacultyProfileActor, evidenceId: number) {
  const ev = (await db('faculty_record_evidence as ev')
    .join('employees as e', 'e.id', 'ev.employee_id')
    .where({ 'ev.id': evidenceId, 'ev.college_id': actor.collegeId })
    .select('ev.*', 'e.faculty_user_id as owner_faculty_user_id', 'e.department_id as owner_department_id', 'e.college_id as owner_college_id')
    .first()) as Row | undefined;
  if (!ev) throw new AppError(404, 'Evidence not found');

  const employee: EmployeeScope = {
    id: Number(ev.employee_id),
    collegeId: Number(ev.owner_college_id),
    facultyUserId: ev.owner_faculty_user_id ? Number(ev.owner_faculty_user_id) : null,
    departmentId: ev.owner_department_id ? Number(ev.owner_department_id) : null,
    employmentStatus: 'ACTIVE',
  };
  if (!canViewProfile(actor, employee)) throw new AppError(403, 'Evidence access denied');

  const root = evidenceRoot();
  const full = path.resolve(root, String(ev.storage_key));
  if (full !== root && !full.startsWith(`${root}${path.sep}`)) throw new AppError(404, 'Evidence not found');
  try {
    const body = await readFile(full);
    return { evidence: ev, body };
  } catch {
    throw new AppError(404, 'Evidence file not found');
  }
}

export async function deleteEvidence(
  actor: FacultyProfileActor,
  employee: EmployeeScope,
  evidenceId: number,
) {
  if (!canEditOwnRecords(actor, employee)) throw new AppError(403, 'Not permitted');
  const ev = await db('faculty_record_evidence')
    .where({ id: evidenceId, college_id: actor.collegeId, employee_id: employee.id })
    .first();
  if (!ev) throw new AppError(404, 'Evidence not found');
  await db('faculty_record_evidence').where({ id: evidenceId }).del();
  return { ok: true };
}
