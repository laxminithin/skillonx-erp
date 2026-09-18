import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { HrActor } from './types.js';
import { assertHrPermission, hasHrPermission, resolveEmployeeForActor } from './access.js';
import { recordHrAudit } from './audit.js';
import { notifyEmployee } from './notifications.js';
import { asISODate } from '../timetable/time.js';
import { toMoney } from './payrollMoney.js';
import { parseJson } from './fnfSources.js';
import { presentCase } from './fnf.js';

type Row = Record<string, unknown>;

const RELEASE_OK = ['APPROVED', 'FINANCE_POSTED', 'SETTLED', 'CLOSED'];

async function loadOwned(actor: HrActor, settlementId: number) {
  const row = await db('hr_final_settlements as s')
    .join('employees as e', 'e.id', 's.employee_id')
    .leftJoin('departments as d', 'd.id', 'e.department_id')
    .leftJoin('hr_designations as des', 'des.id', 'e.designation_id')
    .where({ 's.id': settlementId })
    .select(
      's.*',
      'e.display_name',
      'e.employee_number',
      'e.date_of_joining',
      'e.department_id',
      'd.name as department_name',
      'des.name as designation_name',
    )
    .first();
  if (!row) throw new AppError(404, 'Settlement not found');
  if (Number(row.college_id) !== actor.collegeId) throw new AppError(404, 'Settlement not found');
  return row;
}

export async function generateDocuments(actor: HrActor, settlementId: number) {
  assertHrPermission(actor, 'hr.fnf.document.release');
  const row = await loadOwned(actor, settlementId);
  if (!RELEASE_OK.includes(String(row.status))) {
    throw new AppError(400, 'Documents can be released only after approval');
  }
  const snapshot = parseJson<Record<string, unknown>>(row.input_snapshot, {});
  const empSnap = (snapshot.employee ?? {}) as Record<string, unknown>;
  const joining = asISODate(empSnap.dateOfJoining ?? row.date_of_joining);
  const lwd = asISODate(empSnap.lastWorkingDate ?? row.last_working_date);
  const designation = String(row.designation_name ?? empSnap.designationName ?? '');
  const department = String(row.department_name ?? empSnap.departmentName ?? '');
  const name = String(row.display_name);
  const number = String(row.employee_number);

  const statementFields = {
    employeeName: name,
    employeeNumber: number,
    department,
    designation,
    joiningDate: joining,
    lastWorkingDate: lwd,
    separationType: row.separation_type,
    grossPayable: toMoney(row.gross_payable),
    totalRecoveries: toMoney(row.total_recoveries),
    netAmount: toMoney(row.net_amount),
    direction: row.settlement_direction,
    caseNumber: row.case_number,
    settlementDate: asISODate(row.approved_at ?? new Date()),
    status: row.status,
  };
  const statementBody = [
    `FULL & FINAL SETTLEMENT STATEMENT`,
    `Case: ${row.case_number}`,
    `Employee: ${name} (${number})`,
    `Department: ${department}`,
    `Designation: ${designation}`,
    `Employment: ${joining} to ${lwd}`,
    `Separation: ${row.separation_type}`,
    `Gross payable: ${statementFields.grossPayable}`,
    `Total recoveries: ${statementFields.totalRecoveries}`,
    `Net settlement: ${statementFields.netAmount} (${row.settlement_direction})`,
    `Status: ${row.status}`,
  ].join('\n');

  const relievingFields = {
    employeeName: name,
    employeeNumber: number,
    designation,
    department,
    joiningDate: joining,
    lastWorkingDate: lwd,
    separationType: row.separation_type,
  };
  const relievingBody = [
    `RELIEVING LETTER`,
    `This is to certify that ${name} (${number}), ${designation}, ${department},`,
    `has been relieved from services with effect from ${lwd}.`,
    `Date of joining: ${joining}. Separation type: ${row.separation_type}.`,
  ].join('\n');

  const experienceFields = {
    employeeName: name,
    employeeNumber: number,
    designation,
    department,
    joiningDate: joining,
    lastWorkingDate: lwd,
  };
  const experienceBody = [
    `EXPERIENCE / SERVICE CERTIFICATE`,
    `This is to certify that ${name} (${number}) worked as ${designation}`,
    `in the Department of ${department} from ${joining} to ${lwd}.`,
  ].join('\n');

  const specs = [
    { docType: 'STATEMENT', fields: statementFields, body: statementBody },
    { docType: 'RELIEVING_LETTER', fields: relievingFields, body: relievingBody },
    { docType: 'EXPERIENCE_CERTIFICATE', fields: experienceFields, body: experienceBody },
  ];

  for (const spec of specs) {
    const existing = await db('hr_fnf_documents')
      .where({ settlement_id: settlementId, doc_type: spec.docType, release_status: 'RELEASED' })
      .first();
    if (existing) continue;
    await db('hr_fnf_documents').insert({
      settlement_id: settlementId,
      college_id: actor.collegeId,
      employee_id: Number(row.employee_id),
      doc_type: spec.docType,
      doc_version: Number(row.calculation_version ?? 1),
      field_snapshot: JSON.stringify(spec.fields),
      body_text: spec.body,
      release_status: 'RELEASED',
      released_at: db.fn.now(),
      released_by: actor.facultyUserId,
    });
  }

  await recordHrAudit({
    actor,
    action: 'FNF_DOCUMENTS_RELEASED',
    entityType: 'hr_fnf_documents',
    entityId: settlementId,
  });
  await notifyEmployee({
    employeeId: Number(row.employee_id),
    collegeId: actor.collegeId,
    type: 'FNF_DOCUMENTS_RELEASED',
    title: 'Exit documents released',
    relatedType: 'hr_final_settlements',
    relatedId: settlementId,
    dedupeKey: `fnf-docs-${settlementId}`,
  });
  return presentCase(actor, settlementId);
}

export async function getDocument(actor: HrActor, settlementId: number, docType: string) {
  const row = await loadOwned(actor, settlementId);
  const self = await resolveEmployeeForActor(actor);
  const isOwner = self && Number(self.id) === Number(row.employee_id);
  if (!isOwner) {
    if (!hasHrPermission(actor, 'hr.fnf.view')) throw new AppError(404, 'Document not found');
  }
  if (isOwner && !hasHrPermission(actor, 'hr.fnf.view')) {
    const doc = await db('hr_fnf_documents')
      .where({ settlement_id: settlementId, doc_type: docType, release_status: 'RELEASED' })
      .orderBy('doc_version', 'desc')
      .first();
    if (!doc) throw new AppError(404, 'Document not found');
    return presentDoc(doc);
  }
  const doc = await db('hr_fnf_documents')
    .where({ settlement_id: settlementId, doc_type: docType, college_id: actor.collegeId })
    .orderBy('doc_version', 'desc')
    .first();
  if (!doc) throw new AppError(404, 'Document not found');
  if (!isOwner && String(doc.release_status) !== 'RELEASED' && !hasHrPermission(actor, 'hr.fnf.document.release')) {
    throw new AppError(404, 'Document not found');
  }
  if (isOwner && String(doc.release_status) !== 'RELEASED') throw new AppError(404, 'Document not found');
  return presentDoc(doc);
}

function presentDoc(doc: Row) {
  return {
    id: Number(doc.id),
    docType: doc.doc_type,
    releaseStatus: doc.release_status,
    releasedAt: doc.released_at,
    fields: parseJson(doc.field_snapshot, {}),
    body: doc.body_text,
  };
}
