import { db } from '../../db/index.js';
import type { Knex } from 'knex';
import { AppError } from '../../utils/errors.js';
import type { FinanceActor } from './types.js';
import { assertFinancePermission } from './access.js';
import { recordFinanceAudit } from './audit.js';
import { toMoney } from './money.js';

export async function nextSequenceNumber(
  trx: Knex.Transaction,
  collegeId: number,
  seriesCode: string,
  year: number,
): Promise<number> {
  let seq = await trx('fee_receipt_number_sequences')
    .where({ college_id: collegeId, series_code: seriesCode, year })
    .forUpdate()
    .first();
  if (!seq) {
    const [id] = await trx('fee_receipt_number_sequences').insert({
      college_id: collegeId,
      series_code: seriesCode,
      year,
      last_number: 1,
    });
    seq = { id, last_number: 1 };
  } else {
    await trx('fee_receipt_number_sequences')
      .where({ id: seq.id })
      .update({ last_number: Number(seq.last_number) + 1, updated_at: trx.fn.now() });
    seq.last_number = Number(seq.last_number) + 1;
  }
  return Number(seq.last_number);
}

export async function nextDocumentNumber(
  trx: Knex.Transaction,
  collegeId: number,
  seriesCode: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const num = await nextSequenceNumber(trx, collegeId, seriesCode, year);
  const college = await trx('colleges').where({ id: collegeId }).select('code').first();
  const prefix = college?.code ?? 'SX';
  return `${prefix}/${seriesCode}/${year}/${String(num).padStart(6, '0')}`;
}

export async function getFinancePolicy(collegeId: number) {
  const policy = await db('college_finance_policies').where({ college_id: collegeId }).first();
  if (!policy) {
    return {
      currency: 'INR',
      scholarshipTreatment: 'REDUCE_DEMAND' as const,
      examFeePaidRequired: false,
      financialClearanceMode: 'BLOCK' as const,
      receiptSeries: 'RCPT',
      demandSeries: 'DEM',
      paymentSeries: 'PAY',
    };
  }
  return {
    currency: policy.currency,
    scholarshipTreatment: policy.scholarship_treatment,
    examFeePaidRequired: !!policy.exam_fee_paid_required,
    financialClearanceMode: policy.financial_clearance_mode,
    receiptSeries: policy.receipt_series,
    demandSeries: policy.demand_series,
    paymentSeries: policy.payment_series,
    defaultGatewayProvider: policy.default_gateway_provider,
  };
}

export async function listFeeHeads(collegeId: number, activeOnly = true) {
  let q = db('fee_heads').where({ college_id: collegeId });
  if (activeOnly) q = q.andWhere('is_active', true);
  const rows = await q.orderBy('code');
  return rows.map(serializeFeeHead);
}

export function serializeFeeHead(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    code: row.code,
    name: row.name,
    category: row.category,
    description: row.description,
    isRefundable: !!row.is_refundable,
    isOptional: !!row.is_optional,
    isActive: !!row.is_active,
  };
}

export async function createFeeHead(actor: FinanceActor, body: {
  code: string;
  name: string;
  category?: string;
  description?: string;
  isRefundable?: boolean;
  isOptional?: boolean;
}) {
  assertFinancePermission(actor, 'finance.fee_structure.manage');
  const existing = await db('fee_heads').where({ college_id: actor.collegeId, code: body.code }).first();
  if (existing) throw new Error('Fee head code already exists');
  const [id] = await db('fee_heads').insert({
    college_id: actor.collegeId,
    code: body.code.toUpperCase(),
    name: body.name,
    category: body.category ?? 'GENERAL',
    description: body.description ?? null,
    is_refundable: body.isRefundable ?? false,
    is_optional: body.isOptional ?? false,
    is_active: true,
  });
  await recordFinanceAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'FEE_HEAD_CREATED',
    entityType: 'fee_head',
    entityId: Number(id),
    afterState: body,
  });
  const row = await db('fee_heads').where({ id }).first();
  return serializeFeeHead(row!);
}

export async function updateFeeHead(actor: FinanceActor, id: number, body: Partial<{
  name: string;
  category: string;
  description: string;
  isRefundable: boolean;
  isOptional: boolean;
  isActive: boolean;
}>) {
  assertFinancePermission(actor, 'finance.fee_structure.manage');
  const before = await db('fee_heads').where({ id, college_id: actor.collegeId }).first();
  if (!before) throw new AppError(404, 'Fee head not found');
  await db('fee_heads').where({ id, college_id: actor.collegeId }).update({
    name: body.name ?? before.name,
    category: body.category ?? before.category,
    description: body.description !== undefined ? body.description : before.description,
    is_refundable: body.isRefundable ?? before.is_refundable,
    is_optional: body.isOptional ?? before.is_optional,
    is_active: body.isActive ?? before.is_active,
    updated_at: db.fn.now(),
  });
  const after = await db('fee_heads').where({ id, college_id: actor.collegeId }).first();
  await recordFinanceAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'FEE_HEAD_UPDATED',
    entityType: 'fee_head',
    entityId: id,
    beforeState: before,
    afterState: after,
  });
  return serializeFeeHead(after!);
}

export async function getFeeHeadByCode(collegeId: number, code: string) {
  return db('fee_heads').where({ college_id: collegeId, code: code.toUpperCase(), is_active: true }).first();
}

export { toMoney };
