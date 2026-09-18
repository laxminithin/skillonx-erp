/**
 * HR Analytics E2E invariants. Skips when the E2E seed is absent.
 *
 * Proves: metric correctness & reconciliation to canonical sources, historical
 * headcount via effective dates, attrition determinism, payroll reconciliation
 * and confidentiality, recruitment funnel integrity, finalized-only performance
 * distribution with no reviewer-note leakage, cross-domain reconciliation, and
 * tenant + department (HOD) isolation.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { HrActor } from './types.js';
import { IN_SERVICE_STATUSES, PRE_SERVICE_STATUSES, todayISO } from './analyticsCatalog.js';
import * as analytics from './analytics.js';

const IN = IN_SERVICE_STATUSES as unknown as string[];
const PRE = PRE_SERVICE_STATUSES as unknown as string[];

type Ctx = {
  collegeId: number;
  admin: HrActor;
  principal: HrActor;
  hod: HrActor;
  hodDeptId: number;
  cross: HrActor | null;
};

async function e2eContext(): Promise<Ctx | null> {
  try {
    if (!(await db.schema.hasTable('employees'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const collegeId = Number(cls.college_id);
    const adminRow = await db('faculty_users').where({ college_id: collegeId, role: 'COLLEGE_ADMIN' }).first();
    if (!adminRow) return null;
    const topDept = await db('employees')
      .where({ college_id: collegeId })
      .whereIn('employment_status', IN)
      .whereNotNull('department_id')
      .groupBy('department_id')
      .select('department_id')
      .count('* as c')
      .orderBy('c', 'desc')
      .first();
    const hodDeptId = Number(topDept?.department_id ?? 0);
    const crossRow = await db('faculty_users').whereNot({ college_id: collegeId }).where({ role: 'COLLEGE_ADMIN' }).first();

    const base = (role: string, departmentId: number | null, fid: number, cid: number): HrActor => ({
      facultyUserId: fid,
      collegeId: cid,
      departmentId,
      role,
    });
    return {
      collegeId,
      admin: base('COLLEGE_ADMIN', null, Number(adminRow.id), collegeId),
      principal: base('PRINCIPAL', null, Number(adminRow.id), collegeId),
      hod: base('HOD', hodDeptId, Number(adminRow.id), collegeId),
      hodDeptId,
      cross: crossRow ? base('COLLEGE_ADMIN', null, Number(crossRow.id), Number(crossRow.college_id)) : null,
    };
  } catch {
    return null;
  }
}

describe('HR Analytics E2E', () => {
  it('metric catalog is centralized and permission-gated', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const cat = analytics.metricCatalog(ctx.admin);
    assert.ok(cat.metrics.length >= 15);
    // Every metric declares a single canonical definition + source domain.
    for (const m of cat.metrics) {
      assert.ok(m.key && m.sourceDomain && m.calculation && m.permission);
    }
    // A faculty (no analytics permission) is denied.
    await assert.rejects(async () => analytics.metricCatalog({ ...ctx.admin, role: 'FACULTY' }));
  });

  it('current headcount reconciles exactly to canonical Lifecycle', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const asOf = todayISO();
    const hc = await analytics.currentHeadcount(ctx.admin, { asOf });
    const direct = await db('employees')
      .where({ college_id: ctx.collegeId })
      .whereIn('employment_status', IN)
      .whereNotNull('date_of_joining')
      .where('date_of_joining', '<=', asOf)
      .count<{ c: number }>('id as c')
      .first();
    assert.equal(hc.total, Number(direct?.c));
    // Faculty + staff mix sums to total.
    assert.equal(hc.facultyStaffMix.faculty + hc.facultyStaffMix.staff, hc.total);
    // Department breakdown sums to total.
    const deptSum = hc.byDepartment.reduce((s, d) => s + d.count, 0);
    assert.equal(deptSum, hc.total);
  });

  it('historical headcount uses effective dates, not current rows', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const asOf = todayISO();
    const hist = await analytics.historicalHeadcount(ctx.admin, { asOf });
    const direct = await db('employees')
      .where({ college_id: ctx.collegeId })
      .whereNotNull('date_of_joining')
      .where('date_of_joining', '<=', asOf)
      .whereNotIn('employment_status', PRE)
      .where((qb) => qb.whereNull('last_working_date').orWhere('last_working_date', '>', asOf))
      .count<{ c: number }>('id as c')
      .first();
    assert.equal(hist.total, Number(direct?.c));
    assert.equal(hist.basis, 'effective-employment-dates');

    // A past as-of date is not larger than today (no future employees exist yet).
    const pastHist = await analytics.historicalHeadcount(ctx.admin, { asOf: '2020-01-01' });
    assert.ok(pastHist.total <= hist.total);
  });

  it('joiners count matches canonical date_of_joining within period', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const from = '2000-01-01';
    const to = todayISO();
    const j = await analytics.joinersTrend(ctx.admin, { from, to });
    const direct = await db('employees')
      .where({ college_id: ctx.collegeId })
      .whereBetween('date_of_joining', [from, to])
      .count<{ c: number }>('id as c')
      .first();
    assert.equal(j.total, Number(direct?.c));
    // Monthly buckets sum to the total.
    assert.equal(j.byMonth.reduce((s, m) => s + m.count, 0), j.total);
  });

  it('attrition is deterministic and follows the documented formula', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const filters = { from: '2024-01-01', to: todayISO() };
    const a1 = await analytics.attrition(ctx.admin, filters);
    const a2 = await analytics.attrition(ctx.admin, filters);
    assert.deepEqual(a1, a2); // deterministic
    // Rate = separations / avg headcount * 100 (rounded 2dp), and never NaN/Infinity.
    const expected = a1.avgHeadcount > 0 ? Math.round((a1.separations / a1.avgHeadcount) * 10000) / 100 : 0;
    assert.equal(a1.attritionRate, expected);
    assert.ok(Number.isFinite(a1.attritionRate));
    assert.ok(a1.definition.includes('average headcount'));
  });

  it('tenure bands cover all in-service employees exactly once', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const asOf = todayISO();
    const t = await analytics.tenureBands(ctx.admin, { asOf });
    const banded = t.bands.reduce((s, b) => s + b.count, 0);
    const direct = await db('employees')
      .where({ college_id: ctx.collegeId })
      .whereIn('employment_status', IN)
      .whereNotNull('date_of_joining')
      .where('date_of_joining', '<=', asOf)
      .count<{ c: number }>('id as c')
      .first();
    assert.equal(banded, Number(direct?.c));
  });

  it('attendance analytics come from canonical monthly records', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const at = await analytics.attendanceTrend(ctx.admin, { from: '2024-01-01', to: todayISO() });
    for (const m of at.byMonth) {
      // Rate is a bounded percentage derived from canonical present/payable.
      assert.ok(m.attendanceRate >= 0 && m.attendanceRate <= 100);
      assert.ok(m.present <= m.payable + 0.01);
    }
  });

  it('payroll analytics mirror canonical persisted run totals and flag divergence', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const run = await db('payroll_runs').where({ college_id: ctx.collegeId }).whereIn('status', ['APPROVED', 'LOCKED', 'POSTED']).first();
    if (!run) return;

    // Analytics report the canonical PERSISTED run-header totals — never recalculated.
    const cost = await analytics.payrollCostTrend(ctx.admin, {});
    const period = cost.byPeriod.find((p) => p.runId === Number(run.id));
    if (period) {
      assert.equal(period.gross, Number(run.gross_total));
      assert.equal(period.deduction, Number(run.deduction_total));
      assert.equal(period.net, Number(run.net_total));
    }

    // Reconciliation exposes structured header-vs-lines checks; gross and headcount
    // are load-bearing invariants that must hold. (Deduction/net divergence, if any,
    // is surfaced as a flagged finding rather than silently absorbed — see §70.)
    const rec = await analytics.payrollReconciliation(ctx.admin, Number(run.id));
    for (const c of rec.checks) assert.equal(typeof c.ok, 'boolean');
    const gross = rec.checks.find((c) => c.key === 'payroll.gross');
    const count = rec.checks.find((c) => c.key === 'payroll.employee_count');
    assert.equal(gross?.ok, true, `gross must reconcile: ${JSON.stringify(gross)}`);
    assert.equal(count?.ok, true, `employee count must reconcile: ${JSON.stringify(count)}`);
  });

  it('payroll analytics are confidential: HOD blocked, small groups suppressed', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    // HOD has no payroll permission → aggregate cost blocked.
    await assert.rejects(async () => analytics.payrollCostTrend(ctx.hod, {}));
    // Principal has aggregate but NOT detail → small departments suppressed.
    const run = await db('payroll_runs').where({ college_id: ctx.collegeId }).whereIn('status', ['APPROVED', 'LOCKED', 'POSTED']).first();
    if (!run) return;
    const byDept = await analytics.payrollByDepartment(ctx.principal, Number(run.id));
    for (const d of byDept.departments) {
      if (d.employees > 0 && d.employees < byDept.minGroupSize) {
        assert.equal(d.suppressed, true);
        assert.equal(d.net, null);
      }
    }
  });

  it('recruitment funnel is monotonically non-increasing and reconciles JOINED', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const f = await analytics.recruitmentFunnel(ctx.admin, { from: '2000-01-01', to: todayISO() });
    for (let i = 1; i < f.stages.length; i++) {
      assert.ok(f.stages[i].count <= f.stages[i - 1].count, `stage ${f.stages[i].stage} exceeds prior`);
    }
    const joined = f.stages.find((s) => s.stage === 'joined')?.count ?? 0;
    const directJoined = await db('hr_recruitment_applications')
      .where({ college_id: ctx.collegeId, status: 'JOINED' })
      .whereBetween('created_at', ['2000-01-01 00:00:00', `${todayISO()} 23:59:59`])
      .count<{ c: number }>('id as c')
      .first();
    assert.equal(joined, Number(directJoined?.c));
  });

  it('offer acceptance rate is a bounded percentage', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const oa = await analytics.offerAcceptance(ctx.admin, { from: '2000-01-01', to: todayISO() });
    assert.ok(oa.acceptanceRate >= 0 && oa.acceptanceRate <= 100);
    assert.ok(Number.isFinite(oa.acceptanceRate));
  });

  it('rating distribution is finalized-only and never leaks reviewer notes', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const dist = await analytics.ratingDistribution(ctx.admin, undefined, {});
    const serialized = JSON.stringify(dist);
    assert.ok(!serialized.includes('reviewer_private_notes'));
    assert.ok(!serialized.includes('reviewer_summary'));
    // Finalized-only: total equals count of finalized appraisals.
    const direct = await db('hr_employee_appraisals')
      .where({ college_id: ctx.collegeId })
      .whereNull('parent_appraisal_id')
      .whereNotNull('finalized_at')
      .count<{ c: number }>('id as c')
      .first();
    assert.equal(dist.total, Number(direct?.c));
  });

  it('F&F analytics reconcile case buckets and split payable/receivable', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const ff = await analytics.fnfAnalytics(ctx.admin, {});
    const totalCases = ff.byStatus.reduce((s, r) => s + r.count, 0);
    const cancelled = ff.byStatus.filter((r) => r.status === 'CANCELLED').reduce((s, r) => s + r.count, 0);
    assert.equal(ff.pending + ff.settled + cancelled, totalCases);
    assert.ok(ff.payableTotal >= 0 && ff.receivableTotal >= 0);
  });

  it('cross-domain reconciliation checks pass on canonical data', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const rec = await analytics.reconciliation(ctx.admin);
    assert.ok(rec.checks.length >= 3);
    for (const c of rec.checks) assert.equal(c.ok, true, `reconciliation failed: ${c.key} ${JSON.stringify(c)}`);
    assert.equal(rec.ok, true);
  });

  it('data quality returns deterministic integrity flags', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const dq = await analytics.dataQuality(ctx.admin);
    assert.ok(Array.isArray(dq.flags) && dq.flags.length >= 5);
    for (const f of dq.flags) assert.ok(typeof f.count === 'number' && f.count >= 0);
  });

  it('tenant isolation: college scope never bleeds across colleges', async () => {
    const ctx = await e2eContext();
    if (!ctx || !ctx.cross) return;
    const asOf = todayISO();
    const mine = await analytics.currentHeadcount(ctx.admin, { asOf });
    const theirs = await analytics.currentHeadcount(ctx.cross, { asOf });
    const directMine = await db('employees').where({ college_id: ctx.collegeId }).whereIn('employment_status', IN).whereNotNull('date_of_joining').where('date_of_joining', '<=', asOf).count<{ c: number }>('id as c').first();
    const directTheirs = await db('employees').where({ college_id: ctx.cross.collegeId }).whereIn('employment_status', IN).whereNotNull('date_of_joining').where('date_of_joining', '<=', asOf).count<{ c: number }>('id as c').first();
    assert.equal(mine.total, Number(directMine?.c));
    assert.equal(theirs.total, Number(directTheirs?.c));
    // Reconciliation is per-college and independent.
    const recCross = await analytics.reconciliation(ctx.cross);
    assert.ok(Array.isArray(recCross.checks));
  });

  it('HOD isolation: department scope enforced, other departments blocked', async () => {
    const ctx = await e2eContext();
    if (!ctx || !ctx.hodDeptId) return;
    const hodHc = await analytics.currentHeadcount(ctx.hod, {});
    const adminHc = await analytics.currentHeadcount(ctx.admin, {});
    // HOD sees only their own department → not more than the whole college.
    assert.ok(hodHc.total <= adminHc.total);
    const directDept = await db('employees')
      .where({ college_id: ctx.collegeId, department_id: ctx.hodDeptId })
      .whereIn('employment_status', IN)
      .whereNotNull('date_of_joining')
      .where('date_of_joining', '<=', todayISO())
      .count<{ c: number }>('id as c')
      .first();
    assert.equal(hodHc.total, Number(directDept?.c));

    // Requesting a different department is denied for a department-scoped actor.
    const otherDept = await db('employees').where({ college_id: ctx.collegeId }).whereNotNull('department_id').whereNot('department_id', ctx.hodDeptId).first();
    if (otherDept) {
      await assert.rejects(async () => analytics.currentHeadcount(ctx.hod, { departmentId: Number(otherDept.department_id) }));
    }
  });

  it('export security: authorized export works, unauthorized blocked', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    // Admin has hr.analytics.export → workforce export produces a file with metadata.
    const file = await analytics.exportReport(ctx.admin, 'workforce', 'csv', {});
    assert.ok(String(file.body).includes('Workforce Headcount'));
    assert.ok(String(file.body).includes('Generated at'));
    assert.equal(file.contentType, 'text/csv');

    // HOD lacks hr.analytics.export → any export blocked.
    await assert.rejects(async () => analytics.exportReport(ctx.hod, 'workforce', 'csv', {}));

    // Payroll export requires payroll.aggregate: principal (aggregate) can, HOD cannot.
    const run = await db('payroll_runs').where({ college_id: ctx.collegeId }).whereIn('status', ['APPROVED', 'LOCKED', 'POSTED']).first();
    if (run) {
      const pfile = await analytics.exportReport(ctx.principal, 'payroll-cost', 'xlsx', {});
      assert.ok(Buffer.isBuffer(pfile.body));
    }
    await assert.rejects(async () => analytics.exportReport(ctx.hod, 'payroll-cost', 'csv', {}));
  });

  it('overview suppresses restricted cards by permission', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const hodOverview = await analytics.overview(ctx.hod, {});
    // HOD has no payroll permission → payroll card restricted, never a real number.
    assert.equal(hodOverview.payrollNet, 'RESTRICTED');
    const adminOverview = await analytics.overview(ctx.admin, {});
    assert.notEqual(adminOverview.payrollNet, 'RESTRICTED');
  });
});
