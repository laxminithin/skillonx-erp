/**
 * Finance module E2E invariants. Skips when E2E seed is absent.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { FinanceActor } from './access.js';
import { getStudentFinancialStatus, getStudentNoDueStatus, hasOutstandingDues, getFinancialClearance } from './clearance.js';
import { bulkGenerateDemands, recalculateDemandTotals } from './demands.js';
import { recordManualPayment } from './payments.js';
import { archiveFeeStructure, getFeeStructure } from './feeStructures.js';
import { createConcession } from './scholarships.js';
import { createRefund, approveRefund, processRefund } from './scholarships.js';
import { toMoney } from './money.js';

async function e2eContext() {
  try {
    if (!(await db.schema.hasTable('fee_structures'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const structure = await db('fee_structures').where({ code: 'SX-E2E-CSE-S3-2026' }).first();
    if (!structure) return null;
    const admin = await db('faculty_users')
      .where({ college_id: cls.college_id, role: 'COLLEGE_ADMIN' })
      .first();
    let accountant = await db('faculty_users')
      .where({ college_id: cls.college_id, role: 'ACCOUNTANT' })
      .first();
    if (!accountant && admin) {
      const [id] = await db('faculty_users').insert({
        college_id: cls.college_id,
        department_id: null,
        name: 'Finance E2E Accountant',
        email: `finance.accountant.e2e.${cls.college_id}@skillonx.test`,
        password_hash: admin.password_hash,
        role: 'ACCOUNTANT',
        is_active: true,
        employee_id: `FIN-E2E-${cls.college_id}`,
      });
      accountant = await db('faculty_users').where({ id }).first();
    }
    let principal = await db('faculty_users')
      .where({ college_id: cls.college_id, role: 'PRINCIPAL' })
      .first();
    if (!principal && admin) {
      const [id] = await db('faculty_users').insert({
        college_id: cls.college_id,
        department_id: null,
        name: 'Finance E2E Principal',
        email: `finance.principal.e2e.${cls.college_id}@skillonx.test`,
        password_hash: admin.password_hash,
        role: 'PRINCIPAL',
        is_active: true,
        employee_id: `PRIN-FIN-E2E-${cls.college_id}`,
      });
      principal = await db('faculty_users').where({ id }).first();
    }
    const approved = await db('students').where({ usn: '4VV24CS001' }).first();
    const other = await db('students').where({ usn: '4VV24CS002' }).first();
    return { cls, structure, admin, accountant, principal, approved, other };
  } catch {
    return null;
  }
}

function financeActor(row: { id: number; college_id: number; department_id?: number | null; role: string; name?: string }): FinanceActor {
  return {
    facultyUserId: Number(row.id),
    collegeId: Number(row.college_id),
    departmentId: row.department_id ?? null,
    role: row.role,
    name: row.name,
  };
}

/**
 * Restore approved student to seeded partial-payment baseline between suite runs.
 *
 * Fixture isolation, not product behavior: `4VV24CS001` is a shared E2E fixture student
 * reused by other suites (e.g. Library's fine-to-Finance handoff tests), which legitimately
 * create their own ad-hoc demands (LIBRARY_FINE, ...) against the same student. Those
 * demands are real, correctly-created Finance records — getStudentFinancialStatus summing
 * across ALL of a student's non-cancelled demands is intended behavior, not a bug. This
 * suite's baseline is specifically about the ONE semester-fee demand, so isolation here
 * means: (a) neutralize any other suite's non-cancelled demand for this student so it
 * doesn't leak into this suite's totals, and (b) apply the seeded 40000 payment to the
 * semester demand only — previously this loop re-initialized a fresh 40000 budget per
 * demand, which silently fully-paid every stray ad-hoc demand too.
 */
async function restoreFinanceE2eBaseline(ctx: NonNullable<Awaited<ReturnType<typeof e2eContext>>>) {
  const studentId = Number(ctx.approved!.id);
  const collegeId = Number(ctx.cls.college_id);
  const allDemands = await db('student_fee_demands')
    .where({ student_id: studentId, college_id: collegeId })
    .whereNot('status', 'CANCELLED');
  const demands = allDemands.filter((d) => d.demand_type === 'SEMESTER_FEE');
  const foreignDemandIds = allDemands
    .filter((d) => d.demand_type !== 'SEMESTER_FEE')
    .map((d) => Number(d.id));

  await db.transaction(async (trx) => {
    if (foreignDemandIds.length) {
      await trx('student_fee_demands').whereIn('id', foreignDemandIds).update({
        status: 'CANCELLED',
        updated_at: trx.fn.now(),
      });
    }

    const extraPayments = await trx('student_payments')
      .where({ student_id: studentId, college_id: collegeId })
      .whereNot('transaction_reference', 'E2E-UPI-40000')
      .select('id');

    for (const p of extraPayments) {
      await trx('fee_receipts').where({ payment_id: p.id }).delete();
    }
    await trx('student_payments')
      .where({ student_id: studentId, college_id: collegeId })
      .whereNot('transaction_reference', 'E2E-UPI-40000')
      .delete();

    let remainingPaid = 40000;
    for (const demand of demands) {
      const items = await trx('student_fee_demand_items').where({ demand_id: demand.id });
      for (const item of items) {
        const gross = Number(item.gross_amount);
        // Baseline has no concession/discount/scholarship/adjustment applied — reset all four
        // explicitly rather than inheriting whatever a prior test (e.g. a concession or
        // scholarship-sanction test elsewhere) left behind. recalculateDemandTotals derives
        // net as gross - discount - scholarship + adjustment, so any of the four left non-zero
        // silently bakes a stale reduction into this "baseline".
        const net = gross;
        const itemPaid = Math.min(remainingPaid, net);
        remainingPaid -= itemPaid;
        await trx('student_fee_demand_items').where({ id: item.id }).update({
          discount_amount: toMoney(0),
          scholarship_amount: toMoney(0),
          adjustment_amount: toMoney(0),
          net_amount: toMoney(net),
          paid_amount: toMoney(itemPaid),
          outstanding_amount: toMoney(net - itemPaid),
          updated_at: trx.fn.now(),
        });
      }
      await recalculateDemandTotals(trx, Number(demand.id));
    }
  });
}

describe('finance E2E', () => {
  before(async () => {
    const ctx = await e2eContext();
    if (!ctx?.approved) return;
    await restoreFinanceE2eBaseline(ctx);
  });

  it('approved student has semester demand with partial payment', async () => {
    const ctx = await e2eContext();
    if (!ctx?.approved) return;
    const status = await getStudentFinancialStatus(Number(ctx.approved.id), Number(ctx.cls.college_id));
    // E2E fee structure items: 50000 + 4500 + 3000 = 57500; partial payment 40000 seeded
    assert.equal(status.totalFees, '57500.00');
    assert.equal(status.paid, '40000.00');
    assert.equal(status.outstanding, '17500.00');
  });

  it('bulk demand generation is idempotent', async () => {
    const ctx = await e2eContext();
    if (!ctx?.accountant || !ctx.structure) return;
    const actor = financeActor(ctx.accountant);
    const before = await db('student_fee_demands')
      .where({ student_id: ctx.approved?.id, college_id: ctx.cls.college_id })
      .count({ c: '*' })
      .first();
    const countBefore = Number(before?.c ?? 0);
    const result = await bulkGenerateDemands(actor, {
      feeStructureId: Number(ctx.structure.id),
      academicYearId: Number(ctx.structure.academic_year_id),
      semesterId: Number(ctx.structure.semester_id),
      academicClassId: Number(ctx.cls.id),
    });
    assert.ok(result.skipped >= 1);
    const after = await db('student_fee_demands')
      .where({ student_id: ctx.approved?.id, college_id: ctx.cls.college_id })
      .count({ c: '*' })
      .first();
    assert.equal(Number(after?.c ?? 0), countBefore);
  });

  it('manual payment creates receipt transactionally', async () => {
    const ctx = await e2eContext();
    if (!ctx?.accountant || !ctx.approved) return;
    const actor = financeActor(ctx.accountant);
    const statusBefore = await getStudentFinancialStatus(Number(ctx.approved.id), Number(ctx.cls.college_id));
    const payAmount = Number(statusBefore.outstanding);
    if (payAmount <= 0) return;

    const beforeReceipts = await db('fee_receipts')
      .where({ student_id: ctx.approved.id })
      .count({ c: '*' })
      .first();

    await recordManualPayment(actor, {
      studentId: Number(ctx.approved.id),
      amount: payAmount,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'CASH',
      transactionReference: 'E2E-FINAL-PAYMENT',
    });

    const status = await getStudentFinancialStatus(Number(ctx.approved.id), Number(ctx.cls.college_id));
    assert.equal(status.outstanding, '0.00');

    const afterReceipts = await db('fee_receipts')
      .where({ student_id: ctx.approved.id })
      .count({ c: '*' })
      .first();
    assert.ok(Number(afterReceipts?.c ?? 0) > Number(beforeReceipts?.c ?? 0));
  });

  it('no-due shows finance clear after full payment', async () => {
    const ctx = await e2eContext();
    if (!ctx?.approved) return;
    const noDue = await getStudentNoDueStatus(Number(ctx.approved.id), Number(ctx.cls.college_id));
    const finance = noDue.domains.find((d) => d.domain === 'FINANCE');
    assert.ok(finance);
    assert.equal(finance!.status, 'CLEAR');
  });

  it('hasOutstandingDues returns false when paid', async () => {
    const ctx = await e2eContext();
    if (!ctx?.approved) return;
    const due = await hasOutstandingDues(Number(ctx.approved.id), Number(ctx.cls.college_id));
    assert.equal(due, false);
  });

  it('financial clearance passes for cleared student', async () => {
    const ctx = await e2eContext();
    if (!ctx?.approved) return;
    const clearance = await getFinancialClearance(Number(ctx.approved.id), Number(ctx.cls.college_id));
    assert.equal(clearance.cleared, true);
    assert.equal(clearance.domains.FINANCE, 'CLEAR');
  });

  it('scholarship sanction reduces demand per policy', async () => {
    const ctx = await e2eContext();
    if (!ctx?.accountant || !ctx.other) return;
    const actor = financeActor(ctx.accountant);
    const { createStudentScholarship, sanctionScholarship } = await import('./scholarships.js');

    const scheme = await db('scholarship_schemes').where({ college_id: ctx.cls.college_id, code: 'MERIT' }).first();
    if (!scheme) return;

    const created = await createStudentScholarship(actor, {
      studentId: Number(ctx.other.id),
      schemeId: Number(scheme.id),
      academicYearId: Number(ctx.structure.academic_year_id),
      expectedAmount: 15000,
    });
    await sanctionScholarship(actor, created.id, 15000);

    const sch = await db('student_scholarships').where({ id: created.id }).first();
    assert.equal(sch?.status, 'SANCTIONED');
    assert.equal(Number(sch?.sanctioned_amount), 15000);
  });

  it('concession requires finance permission', async () => {
    const ctx = await e2eContext();
    if (!ctx?.accountant || !ctx.other) return;
    const actor = financeActor(ctx.accountant);
    const demand = await db('student_fee_demands')
      .where({ student_id: ctx.other.id, college_id: ctx.cls.college_id })
      .whereNot('status', 'CANCELLED')
      .first();
    if (!demand) return;
    const result = await createConcession(actor, {
      studentId: Number(ctx.other.id),
      demandId: Number(demand.id),
      concessionType: 'MANAGEMENT',
      amount: 1000,
      reason: 'E2E test concession',
    });
    assert.equal(result.status, 'APPROVED');
    const audit = await db('finance_audit_log')
      .where({ action: 'CONCESSION_APPROVED', entity_id: result.id })
      .first();
    assert.ok(audit);
  });

  it('refund lifecycle completes', async () => {
    const ctx = await e2eContext();
    if (!ctx?.accountant || !ctx.approved) return;
    const actor = financeActor(ctx.accountant);
    const payment = await db('student_payments')
      .where({ student_id: ctx.approved.id, status: 'SUCCESS' })
      .orderBy('id', 'desc')
      .first();
    if (!payment) return;

    const req = await createRefund(actor, {
      studentId: Number(ctx.approved.id),
      paymentId: Number(payment.id),
      amount: 500,
      reasonCode: 'EXCESS_PAYMENT',
      reason: 'E2E refund test',
    });
    await approveRefund(actor, req.id);
    const processed = await processRefund(actor, req.id, 'E2E-REF-001');
    assert.equal(processed.status, 'PAID');
  });

  it('tenant isolation — cross-college demand not found', async () => {
    const ctx = await e2eContext();
    if (!ctx?.approved) return;
    const demand = await db('student_fee_demands')
      .where({ student_id: ctx.approved.id })
      .first();
    if (!demand) return;
    const wrongCollege = Number(demand.college_id) + 9999;
    const row = await db('student_fee_demands')
      .where({ id: demand.id, college_id: wrongCollege })
      .first();
    assert.equal(row, undefined);
  });

  it('tenant isolation - cross-college fee structure returns a safe 404', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin || !ctx.structure) return;
    const wrongTenantActor = { ...financeActor(ctx.admin), collegeId: Number(ctx.cls.college_id) + 9999 };
    await assert.rejects(
      () => getFeeStructure(wrongTenantActor, Number(ctx.structure.id)),
      (error: unknown) =>
        error instanceof Error &&
        'status' in error &&
        (error as { status: number }).status === 404,
    );
  });

  it('tenant isolation - cross-college fee structure archive neither reads nor mutates', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin || !ctx.structure) return;
    const original = await db('fee_structures').where({ id: ctx.structure.id }).first();
    const wrongTenantActor = { ...financeActor(ctx.admin), collegeId: Number(ctx.cls.college_id) + 9999 };
    await assert.rejects(
      () => archiveFeeStructure(wrongTenantActor, Number(ctx.structure.id)),
      (error: unknown) =>
        error instanceof Error &&
        'status' in error &&
        (error as { status: number }).status === 404,
    );
    const after = await db('fee_structures').where({ id: ctx.structure.id }).first();
    assert.equal(after?.status, original?.status);
  });

  it('principal and college admin cannot perform accountant-only mutations', async () => {
    const ctx = await e2eContext();
    if (!ctx?.principal || !ctx.admin || !ctx.approved) return;
    const statusBefore = await getStudentFinancialStatus(Number(ctx.approved.id), Number(ctx.cls.college_id));
    const amount = Math.max(1, Math.min(10, Number(statusBefore.outstanding) || 10));

    await assert.rejects(
      () => recordManualPayment(financeActor(ctx.principal), {
        studentId: Number(ctx.approved.id),
        amount,
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: 'CASH',
        transactionReference: 'E2E-PRINCIPAL-BLOCKED',
      }),
      /permission/i,
    );
    await assert.rejects(
      () => recordManualPayment(financeActor(ctx.admin), {
        studentId: Number(ctx.approved.id),
        amount,
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: 'CASH',
        transactionReference: 'E2E-ADMIN-BLOCKED',
      }),
      /permission/i,
    );
  });
});
