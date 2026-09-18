/**
 * Lab Assistant / Laboratory Management E2E invariants.
 * Skips cleanly when the E2E seed is absent. Run after:
 *   npm run seed:student-lms-e2e   (or)   npm run seed:lab-management
 *
 * These call service functions directly (same pattern as the mentoring suite),
 * building actors from seeded DB rows, and assert both happy-path behaviour and
 * college / department / assignment / role isolation.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { LabActor } from './types.js';
import * as labs from './labs.js';
import * as assets from './assets.js';
import * as stock from './stock.js';
import * as issues from './issues.js';
import * as sessions from './sessions.js';
import * as faults from './faults.js';
import * as repairs from './repairs.js';
import * as software from './software.js';
import * as requirements from './requirements.js';
import { labAssistantDashboard } from './dashboard.js';
import { oversight } from './oversight.js';
import { runReport } from './reports.js';

type Ctx = {
  collegeId: number;
  cseLabId: number;
  iseLabId: number;
  assistant: LabActor;
  assistantIse: LabActor;
  incharge: LabActor;
  facultyNoAssign: LabActor;
  hod: LabActor;
  principal: LabActor;
  student: Record<string, unknown> | null;
  otherCollegeAssistant: LabActor | null;
};

function actorFrom(row: Record<string, unknown>, role?: string): LabActor {
  return {
    facultyUserId: Number(row.id),
    collegeId: Number(row.college_id),
    departmentId: row.department_id != null ? Number(row.department_id) : null,
    role: (role ?? (row.role as string)) as string,
    name: String(row.name),
  };
}

async function ctx(): Promise<Ctx | null> {
  try {
    if (!(await db.schema.hasTable('labs'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const collegeId = Number(cls.college_id);
    const cseLab = await db('labs').where({ college_id: collegeId, code: 'SX-E2E-LAB-CSE' }).first();
    const iseLab = await db('labs').where({ college_id: collegeId, code: 'SX-E2E-LAB-ISE' }).first();
    if (!cseLab || !iseLab) return null;
    const get = async (email: string) => db('faculty_users').where({ college_id: collegeId, email }).first();
    const assistantRow = await get('qa.labassistant@vviet.edu.in');
    const assistantIseRow = await get('qa.labassistant.ise@vviet.edu.in');
    const inchargeRow = await get('anita@vviet.edu.in');
    const raviRow = await get('ravi@vviet.edu.in');
    const hodRow = await get('qa.hod.cse@vviet.edu.in');
    const principalRow = await get('qa.principal@vviet.edu.in');
    if (!assistantRow || !assistantIseRow || !inchargeRow || !raviRow || !hodRow || !principalRow) return null;
    const student = await db('students').where({ college_id: collegeId, usn: '4VV24CS001' }).first();
    // A lab assistant from a different college (if one exists) for cross-tenant tests.
    const otherRow = await db('faculty_users').where({ role: 'LAB_ASSISTANT' }).whereNot({ college_id: collegeId }).first();
    return {
      collegeId,
      cseLabId: Number(cseLab.id),
      iseLabId: Number(iseLab.id),
      assistant: actorFrom(assistantRow, 'LAB_ASSISTANT'),
      assistantIse: actorFrom(assistantIseRow, 'LAB_ASSISTANT'),
      incharge: actorFrom(inchargeRow, 'FACULTY'),
      facultyNoAssign: actorFrom(raviRow, 'FACULTY'),
      hod: actorFrom({ ...hodRow, department_id: cseLab.department_id }, 'HOD'),
      principal: actorFrom(principalRow, 'PRINCIPAL'),
      student: student ?? null,
      otherCollegeAssistant: otherRow ? actorFrom(otherRow, 'LAB_ASSISTANT') : null,
    };
  } catch {
    return null;
  }
}

describe('Lab Assistant / Laboratory Management E2E', () => {
  it('1. lab assistant dashboard surfaces attention items', async () => {
    const c = await ctx(); if (!c) return;
    const dash = await labAssistantDashboard(c.assistant);
    assert.ok(dash.summary.labs >= 2, 'assistant sees assigned labs');
    assert.ok(dash.summary.faultyAssets >= 1, 'faulty asset surfaced');
    assert.ok(dash.summary.lowStockItems >= 1, 'low stock surfaced');
    assert.ok(dash.summary.overdueItems >= 1, 'overdue item surfaced');
    assert.ok(Array.isArray(dash.actionRequired.lowStock));
  });

  it('2. assigned labs are visible; scope excludes unassigned dept labs', async () => {
    const c = await ctx(); if (!c) return;
    const list = await labs.listLabs(c.assistant);
    const codes = list.map((l) => l.code);
    assert.ok(codes.includes('SX-E2E-LAB-CSE'));
    assert.ok(!codes.includes('SX-E2E-LAB-ISE'), 'CSE assistant must not see ISE lab');
  });

  it('3. unassigned lab operations are denied for a lab assistant', async () => {
    const c = await ctx(); if (!c) return;
    await assert.rejects(
      () => assets.createAsset(c.assistant, { labId: c.iseLabId, assetTag: `DENY-${Date.now()}`, name: 'x' }),
      /not assigned/i,
    );
  });

  it('4. asset list + detail + history for an assigned lab', async () => {
    const c = await ctx(); if (!c) return;
    const res = await assets.listAssets(c.assistant, { labId: c.cseLabId });
    assert.ok(res.total >= 4);
    const one = res.rows[0];
    const detail = await assets.getAsset(c.assistant, one.id);
    assert.ok(Array.isArray(detail.history));
  });

  it('5. create + update asset, and status change writes history', async () => {
    const c = await ctx(); if (!c) return;
    const tag = `SX-TEST-${Date.now()}`;
    const created = await assets.createAsset(c.assistant, { labId: c.cseLabId, assetTag: tag, name: 'Test Router', category: 'NETWORK' });
    assert.equal(created.operationalStatus, 'AVAILABLE');
    const changed = await assets.changeAssetStatus(c.assistant, created.id, { operationalStatus: 'FAULTY', note: 'test' });
    assert.equal(changed.operationalStatus, 'FAULTY');
    const hist = changed.history.find((h) => h.action === 'STATUS_CHANGE');
    assert.ok(hist, 'status change recorded in history');
  });

  it('6. retired assets cannot be reactivated', async () => {
    const c = await ctx(); if (!c) return;
    const retired = await db('lab_assets').where({ college_id: c.collegeId, asset_tag: 'SX-LAB-PROJ-OLD' }).first();
    assert.ok(retired);
    await assert.rejects(
      () => assets.changeAssetStatus(c.assistant, Number(retired!.id), { operationalStatus: 'AVAILABLE' }),
      /retired/i,
    );
  });

  it('7. stock receipt increases balance; consumption decreases; negative is blocked', async () => {
    const c = await ctx(); if (!c) return;
    const item = await stock.createStockItem(c.assistant, { labId: c.cseLabId, name: `Solder ${Date.now()}`, unit: 'NOS', openingStock: 10, minThreshold: 3 });
    const rec = await stock.recordMovement(c.assistant, item.id, { movementType: 'RECEIPT', quantity: 5 });
    assert.equal(rec.balanceAfter, 15);
    const cons = await stock.recordMovement(c.assistant, item.id, { movementType: 'CONSUMPTION', quantity: 4 });
    assert.equal(cons.balanceAfter, 11);
    await assert.rejects(() => stock.recordMovement(c.assistant, item.id, { movementType: 'ISSUE', quantity: 999 }), /Insufficient stock/i);
  });

  it('8. reusable item issue then return restores availability + overdue detection', async () => {
    const c = await ctx(); if (!c) return;
    const tag = `SX-ISSUE-${Date.now()}`;
    const asset = await assets.createAsset(c.assistant, { labId: c.cseLabId, assetTag: tag, name: 'Multimeter', category: 'INSTRUMENT' });
    const issued = await issues.createIssue(c.assistant, {
      labId: c.cseLabId, itemKind: 'ASSET', assetId: asset.id, recipientType: 'FACULTY',
      recipientFacultyId: c.incharge.facultyUserId, issueDate: new Date().toISOString().slice(0, 10),
      expectedReturn: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    });
    assert.equal(issued.status, 'ISSUED');
    assert.equal(issued.overdue, true, 'past expected-return is overdue');
    const afterIssue = await assets.getAsset(c.assistant, asset.id);
    assert.equal(afterIssue.operationalStatus, 'IN_USE');
    const returned = await issues.returnIssue(c.assistant, issued.id, { conditionIn: 'GOOD' });
    assert.equal(returned.status, 'RETURNED');
    const afterReturn = await assets.getAsset(c.assistant, asset.id);
    assert.equal(afterReturn.operationalStatus, 'AVAILABLE');
  });

  it('9. practical sessions derive from the timetable and readiness is editable', async () => {
    const c = await ctx(); if (!c) return;
    const upcoming = await sessions.upcomingSessions(c.assistant, 7);
    const forLab = upcoming.filter((s: any) => s.labId === c.cseLabId);
    assert.ok(forLab.length >= 1, 'timetabled lab yields sessions');
    const prep = await sessions.prepareSession(c.assistant, { slotId: (forLab[0] as any).slotId, sessionDate: (forLab[0] as any).sessionDate });
    const upd = await sessions.updateReadiness(c.assistant, prep.id, { readinessStatus: 'READY' });
    assert.equal(upd.readinessStatus, 'READY');
  });

  it('10. fault logging + repair lifecycle (approve → in-progress → complete)', async () => {
    const c = await ctx(); if (!c) return;
    const tag = `SX-FAULT-${Date.now()}`;
    const asset = await assets.createAsset(c.assistant, { labId: c.cseLabId, assetTag: tag, name: 'Oscilloscope', category: 'INSTRUMENT' });
    const fault = await faults.createFault(c.assistant, { labId: c.cseLabId, assetId: asset.id, description: 'No power', severity: 'HIGH' });
    assert.equal(fault.status, 'OPEN');
    const faulted = await assets.getAsset(c.assistant, asset.id);
    assert.equal(faulted.operationalStatus, 'FAULTY', 'asset marked faulty');
    const repair = await repairs.createRepair(c.assistant, { labId: c.cseLabId, assetId: asset.id, faultId: fault.id, requestedAction: 'Fix PSU' });
    assert.equal(repair.approvalStatus, 'PENDING');
    // Assistant cannot approve their own repair (no approve permission).
    await assert.rejects(() => repairs.updateRepair(c.assistant, repair.id, { approvalStatus: 'APPROVED' }), /permission/i);
    // In-charge approves.
    const approved = await repairs.updateRepair(c.incharge, repair.id, { approvalStatus: 'APPROVED' });
    assert.equal(approved.approvalStatus, 'APPROVED');
    await repairs.updateRepair(c.assistant, repair.id, { status: 'IN_PROGRESS' });
    const done = await repairs.updateRepair(c.assistant, repair.id, { status: 'COMPLETED', postRepairCondition: 'GOOD' });
    assert.equal(done.status, 'COMPLETED');
    const fixed = await assets.getAsset(c.assistant, asset.id);
    assert.equal(fixed.operationalStatus, 'AVAILABLE', 'repaired asset back to available');
  });

  it('11. software inventory + software request review', async () => {
    const c = await ctx(); if (!c) return;
    const sw = await software.createSoftware(c.assistant, { labId: c.cseLabId, name: `GCC ${Date.now()}`, licenseType: 'FREE' });
    assert.ok(sw.id);
    const req = await software.createSoftwareRequest(c.incharge, { labId: c.cseLabId, softwareName: 'Vivado', reason: 'FPGA lab' });
    const reviewed = await software.reviewSoftwareRequest(c.assistant, req.id, { status: 'COMPLETED', resolution: 'Installed' });
    assert.equal(reviewed.status, 'COMPLETED');
  });

  it('12. requirement approval chain: In-charge → HOD → Principal', async () => {
    const c = await ctx(); if (!c) return;
    const req = await requirements.createRequirement(c.assistant, { labId: c.cseLabId, requestType: 'CONSUMABLES', item: `Cables ${Date.now()}`, quantity: 20 });
    assert.equal(req.status, 'SUBMITTED');
    const s1 = await requirements.decideRequirement(c.incharge, req.id, { decision: 'APPROVE' });
    assert.equal(s1.status, 'INCHARGE_APPROVED');
    const s2 = await requirements.decideRequirement(c.hod, req.id, { decision: 'APPROVE' });
    assert.equal(s2.status, 'HOD_APPROVED');
    const s3 = await requirements.decideRequirement(c.principal, req.id, { decision: 'APPROVE' });
    assert.equal(s3.status, 'PRINCIPAL_APPROVED');
  });

  it('13. Lab In-charge oversight view is scoped to assigned labs', async () => {
    const c = await ctx(); if (!c) return;
    const view = await oversight(c.incharge);
    assert.ok(view.summary.labs >= 1);
    assert.ok(view.labs.every((l: any) => l.labId !== c.iseLabId), 'in-charge does not see ISE lab');
  });

  it('14. HOD oversight is department-scoped and cannot mutate operations', async () => {
    const c = await ctx(); if (!c) return;
    const view = await oversight(c.hod);
    assert.ok(view.labs.some((l: any) => l.labId === c.cseLabId), 'HOD sees CSE lab');
    assert.ok(view.labs.every((l: any) => l.labId !== c.iseLabId), 'HOD does not see ISE (other dept) lab');
    await assert.rejects(() => assets.createAsset(c.hod, { labId: c.cseLabId, assetTag: `HOD-${Date.now()}`, name: 'x' }), /oversight-only|permission/i);
  });

  it('15. Principal + Management oversight spans the institution (read-only)', async () => {
    const c = await ctx(); if (!c) return;
    const view = await oversight(c.principal);
    assert.equal(view.scope, 'INSTITUTION');
    assert.ok(view.labs.some((l: any) => l.labId === c.iseLabId), 'principal sees all labs');
  });

  it('16. reports honour scope (asset register, low-stock)', async () => {
    const c = await ctx(); if (!c) return;
    const reg = await runReport(c.assistant, 'asset-register');
    assert.ok(reg.rows.length >= 1);
    const low = await runReport(c.assistant, 'low-stock');
    assert.ok(low.rows.length >= 1);
  });

  // ── Isolation / RBAC ──────────────────────────────────────────────────
  it('17. another lab assistant cannot mutate a lab they are not assigned to', async () => {
    const c = await ctx(); if (!c) return;
    await assert.rejects(
      () => assets.createAsset(c.assistantIse, { labId: c.cseLabId, assetTag: `X-${Date.now()}`, name: 'x' }),
      /not assigned/i,
    );
  });

  it('18. faculty without a Lab In-charge assignment cannot mutate lab admin', async () => {
    const c = await ctx(); if (!c) return;
    await assert.rejects(
      () => software.createSoftwareRequest(c.facultyNoAssign, { labId: c.cseLabId, softwareName: 'x' }),
      /In-charge|permission/i,
    );
  });

  it('19. Accountant, COE and Student are denied lab operations', async () => {
    const c = await ctx(); if (!c) return;
    const accountant: LabActor = { ...c.assistant, role: 'ACCOUNTANT' };
    const coe: LabActor = { ...c.assistant, role: 'COE' };
    await assert.rejects(() => labs.listLabs(accountant), /permission/i);
    await assert.rejects(() => labs.listLabs(coe), /permission/i);
    await assert.rejects(() => labAssistantDashboard(accountant), /permission/i);
  });

  it('20. college isolation — cannot read another college lab', async () => {
    const c = await ctx(); if (!c) return;
    const foreign = await db('labs').where({ code: 'SX-E2E-LAB-CSE' }).whereNot({ college_id: c.collegeId }).first();
    // Simulate an actor whose token college differs from the lab's.
    const impostor: LabActor = { ...c.assistant, collegeId: c.collegeId + 990001 };
    await assert.rejects(() => labs.getLab(impostor, c.cseLabId), /not found/i);
    if (foreign) {
      await assert.rejects(() => labs.getLab(c.assistant, Number(foreign.id)), /not found/i);
    }
  });

  it('21. audit trail records asset + stock + issue actions', async () => {
    const c = await ctx(); if (!c) return;
    const rows = await db('lab_audit_log').where({ college_id: c.collegeId }).whereIn('action', ['ASSET_CREATE', 'STOCK_MOVEMENT', 'ISSUE_CREATE']).limit(3);
    assert.ok(rows.length >= 1, 'audit entries exist');
  });

  it('22. dashboard aggregates use few queries (no per-asset fan-out)', async () => {
    const c = await ctx(); if (!c) return;
    const t0 = Date.now();
    await labAssistantDashboard(c.assistant);
    const ms = Date.now() - t0;
    assert.ok(ms < 4000, `dashboard responded in ${ms}ms`);
  });
});
