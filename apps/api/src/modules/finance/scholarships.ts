import type { Knex } from 'knex';
import { db } from '../../db/index.js';
import type { FinanceActor } from './types.js';
import { assertFinancePermission } from './access.js';
import { recordFinanceAudit } from './audit.js';
import { toMoney, multiplyMoney, subtractMoney } from './money.js';
import { getFinancePolicy } from './feeHeads.js';
import { recalculateDemandTotals } from './demands.js';
import { notifyScholarshipSanctioned } from './notifications.js';
import { AppError } from '../../utils/errors.js';

export async function listScholarshipSchemes(collegeId: number) {
  const rows = await db('scholarship_schemes').where({ college_id: collegeId, is_active: true }).orderBy('name');
  return rows.map((r) => ({
    id: Number(r.id),
    code: r.code,
    name: r.name,
    description: r.description,
    provider: r.provider,
  }));
}

export async function createStudentScholarship(actor: FinanceActor, body: {
  studentId: number;
  schemeId: number;
  academicYearId: number;
  expectedAmount?: number;
  sanctionedAmount?: number;
  remarks?: string;
}) {
  assertFinancePermission(actor, 'finance.scholarship.manage');
  const [id] = await db('student_scholarships').insert({
    college_id: actor.collegeId,
    student_id: body.studentId,
    scheme_id: body.schemeId,
    academic_year_id: body.academicYearId,
    expected_amount: body.expectedAmount != null ? toMoney(body.expectedAmount) : null,
    sanctioned_amount: body.sanctionedAmount != null ? toMoney(body.sanctionedAmount) : null,
    status: body.sanctionedAmount ? 'SANCTIONED' : 'APPLIED',
    remarks: body.remarks ?? null,
    approved_by: body.sanctionedAmount ? actor.facultyUserId : null,
    approved_at: body.sanctionedAmount ? db.fn.now() : null,
  });
  await recordFinanceAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'SCHOLARSHIP_CREATED',
    entityType: 'student_scholarship',
    entityId: Number(id),
    afterState: body,
  });
  return getStudentScholarship(actor, Number(id));
}

export async function sanctionScholarship(actor: FinanceActor, id: number, sanctionedAmount: number) {
  assertFinancePermission(actor, 'finance.scholarship.manage');
  const before = await db('student_scholarships').where({ id, college_id: actor.collegeId }).first();
  if (!before) throw new AppError(404, 'Scholarship not found');

  await db('student_scholarships').where({ id }).update({
    sanctioned_amount: toMoney(sanctionedAmount),
    status: 'SANCTIONED',
    approved_by: actor.facultyUserId,
    approved_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  const policy = await getFinancePolicy(actor.collegeId);
  if (policy.scholarshipTreatment === 'REDUCE_DEMAND') {
    await applyScholarshipToDemands(actor.collegeId, Number(before.student_id), sanctionedAmount);
  }

  await recordFinanceAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'SCHOLARSHIP_SANCTIONED',
    entityType: 'student_scholarship',
    entityId: id,
    beforeState: { status: before.status, sanctionedAmount: before.sanctioned_amount },
    afterState: { status: 'SANCTIONED', sanctionedAmount },
  });

  await notifyScholarshipSanctioned(Number(before.student_id), actor.collegeId, sanctionedAmount);
  return getStudentScholarship(actor, id);
}

/**
 * Applies a sanctioned scholarship amount against a student's open demands,
 * oldest-first. Exported (not just used by `sanctionScholarship`) so the
 * Phase 10 scholarship-application finance handoff can reuse this exact
 * demand-walk logic inside its own transaction, keeping the application's
 * status flip and the financial effect atomic (directive §37/§63) instead
 * of duplicating this logic.
 */
export async function applyScholarshipToDemands(
  collegeId: number,
  studentId: number,
  amount: number,
  existingTrx?: Knex.Transaction,
) {
  let remaining = toMoney(amount);
  const demands = await (existingTrx ?? db)('student_fee_demands')
    .where({ student_id: studentId, college_id: collegeId })
    .whereIn('status', ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'])
    .orderBy('issue_date', 'asc');

  const run = async (trx: Knex.Transaction) => {
    for (const demand of demands) {
      if (Number(remaining) <= 0) break;
      const apply = Number(remaining) > Number(demand.outstanding_amount)
        ? toMoney(demand.outstanding_amount)
        : remaining;

      await trx('student_fee_demands').where({ id: demand.id }).update({
        scholarship_amount: toMoney(Number(demand.scholarship_amount) + Number(apply)),
        updated_at: trx.fn.now(),
      });

      const items = await trx('student_fee_demand_items').where({ demand_id: demand.id });
      for (const item of items) {
        if (Number(apply) <= 0) break;
        const itemApply = Number(apply) > Number(item.outstanding_amount) ? item.outstanding_amount : apply;
        await trx('student_fee_demand_items').where({ id: item.id }).update({
          scholarship_amount: toMoney(Number(item.scholarship_amount) + Number(itemApply)),
          net_amount: subtractMoney(item.gross_amount, Number(item.scholarship_amount) + Number(itemApply)),
          outstanding_amount: subtractMoney(
            subtractMoney(item.gross_amount, Number(item.scholarship_amount) + Number(itemApply)),
            item.paid_amount,
          ),
          updated_at: trx.fn.now(),
        });
      }

      await recalculateDemandTotals(trx, Number(demand.id));
      remaining = subtractMoney(remaining, apply);
    }
  };

  if (existingTrx) {
    await run(existingTrx);
  } else {
    await db.transaction(run);
  }
}

export async function getStudentScholarship(actor: FinanceActor, id: number) {
  const row = await db('student_scholarships as ss')
    .join('scholarship_schemes as sc', 'sc.id', 'ss.scheme_id')
    .join('students as s', 's.id', 'ss.student_id')
    .where('ss.id', id)
    .andWhere('ss.college_id', actor.collegeId)
    .select('ss.*', 'sc.name as scheme_name', 'sc.code as scheme_code', 's.name as student_name', 's.usn')
    .first();
  if (!row) throw new AppError(404, 'Scholarship not found');
  return serializeScholarship(row);
}

export async function listStudentScholarships(studentId: number, collegeId: number) {
  const rows = await db('student_scholarships as ss')
    .join('scholarship_schemes as sc', 'sc.id', 'ss.scheme_id')
    .where({ 'ss.student_id': studentId, 'ss.college_id': collegeId })
    .select('ss.*', 'sc.name as scheme_name', 'sc.code as scheme_code')
    .orderBy('ss.created_at', 'desc');
  return rows.map(serializeScholarship);
}

export async function listScholarships(actor: FinanceActor, filters?: { status?: string }) {
  assertFinancePermission(actor, 'finance.view');
  let q = db('student_scholarships as ss')
    .join('scholarship_schemes as sc', 'sc.id', 'ss.scheme_id')
    .join('students as s', 's.id', 'ss.student_id')
    .where('ss.college_id', actor.collegeId)
    .select('ss.*', 'sc.name as scheme_name', 's.name as student_name', 's.usn');
  if (filters?.status) q = q.andWhere('ss.status', filters.status);
  const rows = await q.orderBy('ss.created_at', 'desc').limit(200);
  return rows.map(serializeScholarship);
}

function serializeScholarship(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    studentId: Number(row.student_id),
    studentName: row.student_name ?? null,
    usn: row.usn ?? null,
    schemeId: Number(row.scheme_id),
    schemeName: row.scheme_name,
    schemeCode: row.scheme_code,
    academicYearId: Number(row.academic_year_id),
    expectedAmount: row.expected_amount != null ? toMoney(row.expected_amount) : null,
    sanctionedAmount: row.sanctioned_amount != null ? toMoney(row.sanctioned_amount) : null,
    receivedAmount: toMoney(row.received_amount),
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function createConcession(actor: FinanceActor, body: {
  studentId: number;
  demandId?: number;
  feeHeadId?: number;
  concessionType: string;
  amount?: number;
  percentage?: number;
  reason: string;
}) {
  assertFinancePermission(actor, 'finance.concession.approve');
  if (!body.amount && !body.percentage) throw new AppError(400, 'Amount or percentage required');

  const [id] = await db('student_fee_concessions').insert({
    college_id: actor.collegeId,
    student_id: body.studentId,
    demand_id: body.demandId ?? null,
    fee_head_id: body.feeHeadId ?? null,
    concession_type: body.concessionType,
    amount: body.amount != null ? toMoney(body.amount) : null,
    percentage: body.percentage ?? null,
    reason: body.reason,
    status: 'APPROVED',
    approved_by: actor.facultyUserId,
    approved_at: db.fn.now(),
    created_by: actor.facultyUserId,
  });

  if (body.demandId) {
    await applyConcessionToDemand(body.demandId, body.amount, body.percentage, body.feeHeadId);
  }

  await recordFinanceAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'CONCESSION_APPROVED',
    entityType: 'student_fee_concession',
    entityId: Number(id),
    afterState: body,
    reason: body.reason,
  });

  return { id: Number(id), status: 'APPROVED' };
}

async function applyConcessionToDemand(
  demandId: number,
  amount?: number,
  percentage?: number,
  feeHeadId?: number,
) {
  await db.transaction(async (trx) => {
    let itemsQuery = trx('student_fee_demand_items').where({ demand_id: demandId });
    if (feeHeadId) itemsQuery = itemsQuery.andWhere('fee_head_id', feeHeadId);
    const items = await itemsQuery;

    for (const item of items) {
      let concessionAmt = amount ? toMoney(amount) : multiplyMoney(item.gross_amount, percentage!);
      await trx('student_fee_demand_items').where({ id: item.id }).update({
        discount_amount: toMoney(Number(item.discount_amount) + Number(concessionAmt)),
        net_amount: subtractMoney(item.gross_amount, Number(item.discount_amount) + Number(concessionAmt)),
        outstanding_amount: subtractMoney(
          subtractMoney(item.gross_amount, Number(item.discount_amount) + Number(concessionAmt)),
          item.paid_amount,
        ),
        updated_at: trx.fn.now(),
      });
    }
    await recalculateDemandTotals(trx, demandId);
  });
}

export async function listConcessions(actor: FinanceActor, filters?: { studentId?: number; status?: string }) {
  assertFinancePermission(actor, 'finance.view');
  let q = db('student_fee_concessions as c')
    .join('students as s', 's.id', 'c.student_id')
    .where('c.college_id', actor.collegeId)
    .select('c.*', 's.name as student_name', 's.usn');
  if (filters?.studentId) q = q.andWhere('c.student_id', filters.studentId);
  if (filters?.status) q = q.andWhere('c.status', filters.status);
  const rows = await q
    .orderBy('c.created_at', 'desc')
    .limit(200);
  return rows.map((r) => ({
    id: Number(r.id),
    studentId: Number(r.student_id),
    studentName: r.student_name,
    usn: r.usn,
    concessionType: r.concession_type,
    amount: r.amount != null ? toMoney(r.amount) : null,
    percentage: r.percentage != null ? Number(r.percentage) : null,
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function createRefund(actor: FinanceActor, body: {
  studentId: number;
  paymentId?: number;
  amount: number;
  reasonCode: string;
  reason?: string;
}) {
  assertFinancePermission(actor, 'finance.refund.approve');
  const [id] = await db('student_refunds').insert({
    college_id: actor.collegeId,
    student_id: body.studentId,
    payment_id: body.paymentId ?? null,
    amount: toMoney(body.amount),
    reason_code: body.reasonCode,
    reason: body.reason ?? null,
    status: 'REQUESTED',
  });
  await recordFinanceAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'REFUND_REQUESTED',
    entityType: 'student_refund',
    entityId: Number(id),
    afterState: body,
  });
  return { id: Number(id), status: 'REQUESTED' };
}

export async function approveRefund(actor: FinanceActor, id: number) {
  assertFinancePermission(actor, 'finance.refund.approve');
  await db('student_refunds').where({ id, college_id: actor.collegeId }).update({
    status: 'APPROVED',
    approved_by: actor.facultyUserId,
    approved_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  await recordFinanceAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'REFUND_APPROVED',
    entityType: 'student_refund',
    entityId: id,
  });
  return { id, status: 'APPROVED' };
}

export async function processRefund(actor: FinanceActor, id: number, paymentReference?: string) {
  assertFinancePermission(actor, 'finance.refund.approve');
  const refund = await db('student_refunds').where({ id, college_id: actor.collegeId }).first();
  if (!refund) throw new AppError(404, 'Refund not found');
  if (refund.status !== 'APPROVED') throw new AppError(400, 'Refund must be approved first');

  await db('student_refunds').where({ id }).update({
    status: 'PAID',
    payment_reference: paymentReference ?? null,
    processed_by: actor.facultyUserId,
    processed_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  if (refund.payment_id) {
    await db('student_payments').where({ id: refund.payment_id }).update({
      status: 'REFUNDED',
      updated_at: db.fn.now(),
    });
  }

  await recordFinanceAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'REFUND_PROCESSED',
    entityType: 'student_refund',
    entityId: id,
    afterState: { paymentReference },
  });

  const { notifyRefundProcessed } = await import('./notifications.js');
  await notifyRefundProcessed(Number(refund.student_id), actor.collegeId, refund.amount);

  return { id, status: 'PAID' };
}

export async function listRefunds(actor: FinanceActor, filters?: { status?: string }) {
  assertFinancePermission(actor, 'finance.view');
  let q = db('student_refunds as r')
    .join('students as s', 's.id', 'r.student_id')
    .where('r.college_id', actor.collegeId)
    .select('r.*', 's.name as student_name', 's.usn');
  if (filters?.status) q = q.andWhere('r.status', filters.status);
  const rows = await q.orderBy('r.created_at', 'desc').limit(200);
  return rows.map((r) => ({
    id: Number(r.id),
    studentId: Number(r.student_id),
    studentName: r.student_name,
    usn: r.usn,
    amount: toMoney(r.amount),
    reasonCode: r.reason_code,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function listStudentRefunds(studentId: number, collegeId: number) {
  const rows = await db('student_refunds')
    .where({ student_id: studentId, college_id: collegeId })
    .orderBy('created_at', 'desc');
  return rows.map((r) => ({
    id: Number(r.id),
    amount: toMoney(r.amount),
    reasonCode: r.reason_code,
    status: r.status,
    createdAt: r.created_at,
  }));
}
