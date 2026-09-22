import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { ExamActor } from './access.js';
import { assertExamPermission } from './access.js';
import { recordExamAudit } from './audit.js';

/**
 * Examination remuneration producer.
 * Examination owns: duty, beneficiary, quantity, rate/rule, calculation, COE approval.
 * Finance owns: the payable/posting (see finance/examRemunerationPosting.ts).
 * The amount is computed and frozen server-side; the browser never sets the payable (§6).
 */

export const remunerationSchema = z.object({
  sourceType: z.enum(['INVIGILATION', 'VALUATION', 'EXAMINER']),
  sourceReferenceId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  rate: z.number().nonnegative(),
  description: z.string().max(255).optional(),
});

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function createRemuneration(actor: ExamActor, body: z.infer<typeof remunerationSchema>) {
  assertExamPermission(actor, 'exam.finance');
  const employee = await db('employees').where({ id: body.employeeId, college_id: actor.collegeId }).first();
  if (!employee) throw new AppError(404, 'Beneficiary employee not found');
  // server-computed amount — the authoritative obligation value
  const amount = round2(body.quantity * body.rate);
  const existing = await db('exam_remuneration_items')
    .where({ college_id: actor.collegeId, source_type: body.sourceType, source_reference_id: body.sourceReferenceId })
    .first();
  if (existing) throw new AppError(409, 'A remuneration obligation already exists for this duty');
  let id: number;
  try {
    [id] = await db('exam_remuneration_items').insert({
      college_id: actor.collegeId,
      source_type: body.sourceType,
      source_reference_id: body.sourceReferenceId,
      employee_id: body.employeeId,
      quantity: body.quantity,
      rate: body.rate,
      amount,
      description: body.description ?? null,
      status: 'CALCULATED',
    });
  } catch (err) {
    if ((err as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'A remuneration obligation already exists for this duty');
    }
    throw err;
  }
  await recordExamAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'REMUNERATION_CALCULATED',
    entityType: 'exam_remuneration_item',
    entityId: Number(id),
    afterState: { ...body, amount },
  });
  return { id: Number(id), status: 'CALCULATED', amount };
}

export async function approveRemuneration(actor: ExamActor, id: number) {
  assertExamPermission(actor, 'exam.finance');
  const row = await db('exam_remuneration_items').where({ id, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Remuneration obligation not found');
  if (row.status !== 'CALCULATED') throw new AppError(409, `Only a calculated remuneration can be approved (current: ${row.status})`);
  await db('exam_remuneration_items').where({ id }).update({
    status: 'APPROVED',
    approved_by: actor.facultyUserId,
    approved_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  await recordExamAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'REMUNERATION_APPROVED',
    entityType: 'exam_remuneration_item',
    entityId: id,
    beforeState: { status: row.status },
    afterState: { status: 'APPROVED', amount: Number(row.amount) },
  });
  return { id, status: 'APPROVED', amount: Number(row.amount) };
}

export async function listRemuneration(actor: ExamActor, status?: string) {
  assertExamPermission(actor, 'exam.finance');
  let q = db('exam_remuneration_items as r')
    .join('employees as e', 'e.id', 'r.employee_id')
    .leftJoin('finance_exam_remuneration_postings as p', 'p.id', 'r.finance_posting_id')
    .where('r.college_id', actor.collegeId);
  if (status) q = q.andWhere('r.status', status);
  const rows = await q
    .select('r.*', 'e.display_name as beneficiary_name', 'e.employee_number', 'p.status as finance_status', 'p.posting_number')
    .orderBy('r.created_at', 'desc');
  return rows.map((r) => ({
    id: Number(r.id),
    sourceType: r.source_type,
    sourceReferenceId: Number(r.source_reference_id),
    beneficiaryName: r.beneficiary_name,
    employeeNumber: r.employee_number,
    quantity: Number(r.quantity),
    rate: Number(r.rate),
    amount: Number(r.amount),
    currency: r.currency,
    status: r.status,
    // Finance-authoritative payment/accounting state — COE never sets this
    financeStatus: r.finance_status ?? null,
    postingNumber: r.posting_number ?? null,
    approvedAt: r.approved_at,
  }));
}
