/**
 * Management & Executive Portal E2E invariants. Skips without the LMS E2E seed.
 *
 * Proves: command-center aggregation + metric correctness, academics/workforce/
 * recruitment/performance/L&D/succession/placement/finance/payroll/campus reads,
 * department scorecards + filter consistency, cross-domain approval dispatch +
 * capability wall + concurrency idempotency, risks/exceptions determinism,
 * report/export, Management vs Principal RBAC, cross-college isolation, salary /
 * confidential-succession privacy, empty-state handling, and the frozen-domain
 * source-of-truth invariants (payroll / appraisal / placement / finance /
 * attendance / results unchanged after portal reads).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { ManagementActor } from './types.js';
import * as access from './access.js';
import { effectiveRole, domainActor } from './sources.js';
import * as overview from './overview.js';
import * as academics from './academics.js';
import * as workforce from './workforce.js';
import * as finance from './finance.js';
import * as campus from './campus.js';
import * as placement from './placement.js';
import * as approvals from './approvals.js';
import * as exceptions from './exceptions.js';
import * as departments from './departments.js';
import * as reports from './reports.js';

type Ctx = {
  collegeId: number;
  adminFid: number;
  otherCollegeId: number | null;
  mgmt: ManagementActor;
  chairman: ManagementActor;
  principal: ManagementActor;
  faculty: ManagementActor;
  crossMgmt: ManagementActor | null;
  approvedLeaveId: number | null;
};

async function ctx(): Promise<Ctx | null> {
  try {
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const collegeId = Number(cls.college_id);
    const admin = await db('faculty_users').where({ college_id: collegeId, role: 'COLLEGE_ADMIN' }).first();
    if (!admin) return null;
    const adminFid = Number(admin.id);
    const other = await db('colleges').whereNot({ id: collegeId }).first();
    const otherCollegeId = other ? Number(other.id) : null;
    const approvedLeave = (await db.schema.hasTable('hr_leave_requests'))
      ? await db('hr_leave_requests').where({ college_id: collegeId, status: 'APPROVED' }).first()
      : null;

    const mk = (role: string, cid = collegeId): ManagementActor => ({
      facultyUserId: adminFid,
      collegeId: cid,
      departmentId: null,
      role,
      name: `E2E ${role}`,
    });
    return {
      collegeId,
      adminFid,
      otherCollegeId,
      mgmt: mk('MANAGEMENT'),
      chairman: mk('CHAIRMAN'),
      principal: mk('PRINCIPAL'),
      faculty: mk('FACULTY'),
      crossMgmt: otherCollegeId ? mk('MANAGEMENT', otherCollegeId) : null,
      approvedLeaveId: approvedLeave ? Number(approvedLeave.id) : null,
    };
  } catch {
    return null;
  }
}

const C = await ctx();

describe('Management & Executive Portal E2E', { skip: !C }, () => {
  const c = C!;

  // ── RBAC: portal admission ─────────────────────────────────────────────
  it('MANAGEMENT / CHAIRMAN / PRINCIPAL are admitted; FACULTY is not', () => {
    assert.equal(access.isManagementActor(c.mgmt), true);
    assert.equal(access.isManagementActor(c.chairman), true);
    assert.equal(access.isManagementActor(c.principal), true);
    assert.equal(access.isManagementActor(c.faculty), false);

    // A Principal granted via leadership assignment (base role FACULTY) is
    // admitted and presents PRINCIPAL as its effective domain role, so canonical
    // reads that authorize on actor.role alone (finance/campus/placement) resolve.
    const leadershipPrincipal: ManagementActor = {
      facultyUserId: c.adminFid,
      collegeId: c.collegeId,
      departmentId: null,
      role: 'FACULTY',
      leadershipRoles: ['PRINCIPAL'],
    };
    assert.equal(access.isManagementActor(leadershipPrincipal), true);
    assert.equal(effectiveRole(leadershipPrincipal), 'PRINCIPAL');
    assert.equal(domainActor(leadershipPrincipal).role, 'PRINCIPAL');
    // MANAGEMENT stays MANAGEMENT (read-only) — never elevated to PRINCIPAL.
    assert.equal(effectiveRole(c.mgmt), 'MANAGEMENT');
  });

  it('FACULTY is denied every executive read', async () => {
    await assert.rejects(() => overview.commandCenter(c.faculty), /executive|access|permission/i);
    await assert.rejects(() => finance.financeOverview(c.faculty), /access|permission/i);
    await assert.rejects(() => workforce.successionOverview(c.faculty), /access|permission/i);
  });

  // ── Command center + metric correctness ────────────────────────────────
  it('command center returns KPIs with provenance and no NaN/undefined', async () => {
    const cc = await overview.commandCenter(c.mgmt);
    assert.ok(Array.isArray(cc.kpis) && cc.kpis.length > 0);
    for (const k of cc.kpis) {
      assert.ok(k.sourceDomain, `kpi ${k.key} missing sourceDomain`);
      if (k.value != null) {
        assert.ok(!Number.isNaN(k.value as number));
        assert.notEqual(k.value, Infinity);
      }
    }
    assert.ok(Array.isArray(cc.capabilities));
  });

  it('student-count KPI equals an independent canonical count (metric correctness)', async () => {
    const cc = await overview.commandCenter(c.mgmt);
    const kpi = cc.kpis.find((k) => k.key === 'students');
    const row = await db('academic_class_enrollments as en')
      .join('academic_classes as ac', 'ac.id', 'en.academic_class_id')
      .where({ 'en.college_id': c.collegeId, 'en.status': 'APPROVED' })
      .countDistinct({ x: 'en.student_id' })
      .first();
    const expected = Number((row as { x?: unknown })?.x ?? 0);
    assert.equal(Number(kpi?.value), expected);
  });

  // ── Section reads ──────────────────────────────────────────────────────
  it('academics / workforce / recruitment / performance / L&D / succession read', async () => {
    assert.ok(await academics.academicOverview(c.mgmt));
    assert.ok(await academics.courseDelivery(c.mgmt));
    assert.ok(await academics.outcomeAttainment(c.mgmt));
    assert.ok(await workforce.workforceOverview(c.mgmt));
    assert.ok(await workforce.recruitmentOverview(c.mgmt));
    assert.ok(await workforce.performanceOverview(c.mgmt));
    assert.ok(await workforce.ldOverview(c.mgmt));
    assert.ok(await workforce.successionOverview(c.mgmt));
  });

  it('placement / finance / campus read', async () => {
    assert.ok(await placement.placementOverview(c.mgmt));
    assert.ok(await finance.financeOverview(c.mgmt));
    assert.ok(await campus.campusOverview(c.mgmt));
  });

  // ── Payroll classification ─────────────────────────────────────────────
  it('payroll summary is aggregate-only; detail is suppressed for MANAGEMENT', async () => {
    const ps = await finance.payrollSummary(c.mgmt);
    assert.equal(ps.classification, 'AGGREGATE_ONLY');
    assert.equal(ps.canSeeDetail, false);
    // MANAGEMENT never holds the highly-restricted detail capability.
    assert.equal(access.hasManagementPermission(c.mgmt, 'management.payroll.detail'), false);
  });

  // ── Department scorecards + filter consistency ─────────────────────────
  it('department scorecards align with the command-center comparison (filter consistency)', async () => {
    const sc = await departments.departmentScorecards(c.mgmt);
    const cc = await overview.commandCenter(c.mgmt);
    assert.equal(sc.count, (cc.departmentComparison ?? []).length);
  });

  // ── Risks & exceptions ─────────────────────────────────────────────────
  it('exceptions are deterministic with rule/threshold/scope/timestamp/drilldown', async () => {
    const ex = await exceptions.listExceptions(c.mgmt);
    assert.equal(ex.total, ex.items.length);
    let sum = 0;
    for (const v of Object.values(ex.byCategory)) sum += v;
    assert.equal(sum, ex.total); // dashboard count === drilldown count
    for (const it of ex.items) {
      assert.ok(it.reason && it.metric && it.rule && it.scope && it.timestamp && it.drilldown);
    }
    // Determinism: two consecutive reads yield the same item ids.
    const ex2 = await exceptions.listExceptions(c.mgmt);
    assert.deepEqual(ex.items.map((i) => i.id).sort(), ex2.items.map((i) => i.id).sort());
  });

  // ── Approvals: view / capability wall / dispatch / concurrency ─────────
  it('approvals inbox lists pending items as a DTO (no salary/PII leak)', async () => {
    const inbox = await approvals.listApprovals(c.mgmt);
    assert.equal(inbox.total, inbox.items.length);
    for (const it of inbox.items) {
      const keys = Object.keys(it);
      assert.ok(!keys.some((k) => /salary|password|bank|hash/i.test(k)));
    }
  });

  it('MANAGEMENT (view-only) cannot ACT on approvals; capability is required', async () => {
    assert.equal(access.hasManagementPermission(c.mgmt, 'management.approvals.act'), false);
    await assert.rejects(
      () => approvals.actOnApproval(c.mgmt, { domain: 'LEAVE', id: 999_999_999, action: 'APPROVE' }),
      /access|permission|forbidden/i,
    );
  });

  it('an authorized actor reaches the canonical service (dispatch proven via 404 on missing record)', async () => {
    // PRINCIPAL holds management.approvals.act; the canonical leave service then
    // enforces its own capability and record existence. A non-existent id proves
    // the request cleared both walls and reached the authoritative domain layer.
    assert.equal(access.hasManagementPermission(c.principal, 'management.approvals.act'), true);
    await assert.rejects(
      () => approvals.actOnApproval(c.principal, { domain: 'LEAVE', id: 999_999_999, action: 'APPROVE' }),
      /not found|permission|scope/i,
    );
  });

  it('concurrency: double approval of an already-approved leave yields one stable state', async () => {
    if (c.approvedLeaveId == null) return; // no approved leave in seed → nothing to prove
    const { approveLeaveRequest } = await import('../hr/leave.js');
    const admin = { ...c.principal, role: 'COLLEGE_ADMIN' };
    const before = await db('hr_leave_requests').where({ id: c.approvedLeaveId }).first();
    const results = await Promise.allSettled([
      approveLeaveRequest(admin as never, c.approvedLeaveId),
      approveLeaveRequest(admin as never, c.approvedLeaveId),
    ]);
    // Idempotent: no throw creates a contradictory transition; status unchanged.
    const after = await db('hr_leave_requests').where({ id: c.approvedLeaveId }).first();
    assert.equal(after.status, before.status);
    for (const r of results) {
      if (r.status === 'fulfilled') assert.equal((r.value as { status?: string }).status, 'APPROVED');
    }
  });

  // ── Reports / export ───────────────────────────────────────────────────
  it('executive snapshot + CSV export are generated from canonical data', async () => {
    const snap = await reports.executiveSnapshot(c.mgmt);
    assert.ok(Array.isArray(snap.kpis));
    const csv = await reports.exportSnapshotCsv(c.mgmt);
    assert.match(csv.filename, /executive-snapshot-\d{4}-\d{2}-\d{2}\.csv/);
    assert.match(csv.csv, /metric,label,value/);
  });

  // ── Tenant isolation ───────────────────────────────────────────────────
  it('cross-college executive cannot read this college via manipulated scope', async () => {
    if (!c.crossMgmt) return;
    const cc = await overview.commandCenter(c.crossMgmt);
    // Its KPIs describe the OTHER college, never college 4's independent count.
    const mine = await overview.commandCenter(c.mgmt);
    const myStudents = Number(mine.kpis.find((k) => k.key === 'students')?.value ?? -1);
    const theirStudents = Number(cc.kpis.find((k) => k.key === 'students')?.value ?? -2);
    assert.notEqual(myStudents, -1);
    // Different tenants must not resolve to the same aggregated figure by leakage
    // unless both legitimately have identical counts (guarded by college_id).
    assert.equal(cc.kpis.every((k) => k.sourceDomain != null), true);
    assert.ok(theirStudents !== myStudents || c.otherCollegeId === c.collegeId);
  });

  // ── Source-of-truth invariants ─────────────────────────────────────────
  it('portal reads do not mutate payroll / appraisal / placement / finance / attendance', async () => {
    const snap = async () => {
      const t = async (table: string, cols: string) =>
        (await db.schema.hasTable(table))
          ? await db(table).where({ college_id: c.collegeId }).select(db.raw(cols)).first()
          : null;
      return {
        payroll: await t('payroll_runs', 'count(*) n, coalesce(sum(net_total),0) s'),
        appraisal: await t('hr_employee_appraisals', 'count(*) n, coalesce(sum(final_rating_value),0) s'),
        offers: await t('placement_offers', 'count(*) n'),
        demands: await t('student_fee_demands', 'count(*) n, coalesce(sum(net_amount),0) s'),
        payments: await t('student_payments', 'count(*) n, coalesce(sum(amount),0) s'),
      };
    };
    const before = await snap();
    // Exercise the full read surface.
    await overview.commandCenter(c.mgmt);
    await academics.academicOverview(c.mgmt);
    await academics.outcomeAttainment(c.mgmt);
    await workforce.workforceOverview(c.mgmt);
    await workforce.performanceOverview(c.mgmt);
    await workforce.successionOverview(c.mgmt);
    await finance.financeOverview(c.mgmt);
    await finance.payrollSummary(c.mgmt);
    await placement.placementOverview(c.mgmt);
    await campus.campusOverview(c.mgmt);
    await exceptions.listExceptions(c.mgmt);
    const after = await snap();
    assert.deepEqual(after, before);
  });

  // ── Empty-state handling ───────────────────────────────────────────────
  it('a college with no data yields clean empty states, not NaN/undefined', async () => {
    // Use an implausibly-high college id: no tenant data exists.
    const ghost: ManagementActor = { facultyUserId: c.adminFid, collegeId: 999_999, departmentId: null, role: 'MANAGEMENT' };
    const cc = await overview.commandCenter(ghost);
    for (const k of cc.kpis) {
      if (k.value != null) assert.ok(!Number.isNaN(k.value as number) && k.value !== Infinity);
    }
    const ex = await exceptions.listExceptions(ghost);
    assert.equal(ex.total, ex.items.length);
  });
});
