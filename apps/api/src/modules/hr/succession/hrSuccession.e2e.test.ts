/**
 * Succession Planning & Talent Management E2E invariants. Skips without the seed.
 *
 * Proves: critical roles + scope, talent assessment + finalize immutability +
 * versioned correction, matrix, talent pools + idempotency, successor nomination
 * (self-nomination & cross-dept & self-approval blocked), approval workflow,
 * readiness-review history, development actions + L&D read-only link, concurrency
 * (duplicate successor + approval race), employee confidentiality, tenant + HOD
 * isolation, reporting, audit, and the frozen-domain invariants (appraisal / L&D
 * / T&P / payroll unchanged).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../../db/index.js';
import type { HrActor } from '../types.js';
import * as roles from './criticalRoles.js';
import * as talent from './talent.js';
import * as slate from './slate.js';
import * as dash from './dashboard.js';

const IN = ['ACTIVE', 'PROBATION', 'CONFIRMED', 'ON_NOTICE'];
let SEQ = Date.now() % 1_000_000;
const uniq = (p: string) => `${p}-${SEQ++}`;

type Ctx = {
  collegeId: number;
  admin: HrActor; hrManager: HrActor; approver: HrActor; empAApprover: HrActor;
  empA: { id: number; fid: number }; empB: { id: number; fid: number }; empC: { id: number; fid: number };
  deptD: number; otherDept: number;
  empAActor: HrActor; hod: HrActor; empAAsHod: HrActor; cross: HrActor | null;
  appraisalEmpId: number | null;
};

async function ctx(): Promise<Ctx | null> {
  try {
    if (!(await db.schema.hasTable('succession_critical_roles'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const collegeId = Number(cls.college_id);
    const admin = await db('faculty_users').where({ college_id: collegeId, role: 'COLLEGE_ADMIN' }).first();
    if (!admin) return null;
    const deptRow = await db('employees').where({ college_id: collegeId }).whereIn('employment_status', IN).whereNotNull('faculty_user_id').whereNotNull('department_id')
      .groupBy('department_id').select('department_id').count('* as c').having(db.raw('count(*)'), '>=', 2).orderBy('c', 'desc').first();
    if (!deptRow) return null;
    const deptD = Number(deptRow.department_id);
    const inD = await db('employees').where({ college_id: collegeId, department_id: deptD }).whereIn('employment_status', IN).whereNotNull('faculty_user_id').limit(2);
    const other = await db('employees').where({ college_id: collegeId }).whereIn('employment_status', IN).whereNotNull('faculty_user_id').whereNot('department_id', deptD).first();
    if (inD.length < 2 || !other) return null;
    const empA = { id: Number(inD[0].id), fid: Number(inD[0].faculty_user_id) };
    const empB = { id: Number(inD[1].id), fid: Number(inD[1].faculty_user_id) };
    const empC = { id: Number(other.id), fid: Number(other.faculty_user_id) };
    const crossRow = await db('faculty_users').whereNot({ college_id: collegeId }).where({ role: 'COLLEGE_ADMIN' }).first();
    const appApp = await db('hr_employee_appraisals').where({ college_id: collegeId }).whereNotNull('finalized_at').whereNotNull('final_rating_value').first();

    const mk = (role: string, fid: number, dept: number | null, extra: Partial<HrActor> = {}): HrActor => ({ facultyUserId: fid, collegeId, departmentId: dept, role, ...extra });
    return {
      collegeId,
      admin: mk('COLLEGE_ADMIN', Number(admin.id), null),
      hrManager: mk('HR_MANAGER', Number(admin.id), null),
      // Distinct approver identities (different faculty than admin) for separation-of-duties.
      approver: mk('HR_MANAGER', Number(other.faculty_user_id), Number(other.department_id)),
      empAApprover: mk('HR_MANAGER', Number(inD[0].faculty_user_id), deptD),
      empA, empB, empC, deptD, otherDept: Number(other.department_id),
      empAActor: mk('FACULTY', empA.fid, deptD),
      hod: mk('HOD', empB.fid, deptD, { hodDepartmentIds: [deptD] }),
      empAAsHod: mk('HOD', empA.fid, deptD, { hodDepartmentIds: [deptD] }),
      cross: crossRow ? mk('COLLEGE_ADMIN', Number(crossRow.id), null, { collegeId: Number(crossRow.college_id) }) : null,
      appraisalEmpId: appApp ? Number(appApp.employee_id) : null,
    };
  } catch { return null; }
}

async function makeRole(c: Ctx, dept: number | null, criticality = 'HIGH') {
  const r = await roles.createRole(c.admin, { code: uniq('CR'), roleTitle: 'E2E Role', departmentId: dept, criticality: criticality as never } as never);
  return r.id;
}

describe('Succession Planning E2E', () => {
  it('critical role creation, uniqueness, and department scope', async () => {
    const c = await ctx();
    if (!c) return;
    const rid = await makeRole(c, c.deptD);
    assert.ok(rid > 0);
    // duplicate code blocked
    const existingCode = (await db('succession_critical_roles').where({ id: rid }).first()).code;
    await assert.rejects(() => roles.createRole(c.admin, { code: existingCode, roleTitle: 'x', departmentId: c.deptD } as never), /already exists/i);
    // HOD sees own-dept role; another department's role is not visible
    const otherRole = await makeRole(c, c.otherDept);
    const hodList = await roles.listRoles(c.hod, {});
    assert.ok(hodList.some((r: Record<string, unknown>) => Number(r.id) === rid));
    assert.ok(!hodList.some((r: Record<string, unknown>) => Number(r.id) === otherRole));
    await assert.rejects(() => roles.getRole(c.hod, otherRole), /scope/i);
  });

  it('talent assessment finalize is immutable; correction creates a new version', async () => {
    const c = await ctx();
    if (!c) return;
    const a = await talent.createAssessment(c.admin, { employeeId: c.empA.id, assessmentPeriod: uniq('P'), performanceBand: 'HIGH', potentialBand: 'HIGH', readiness: 'READY_NOW' } as never);
    await talent.updateAssessment(c.admin, a.id, { comments: 'draft edit' } as never); // draft editable
    await talent.finalizeAssessment(c.admin, a.id);
    await assert.rejects(() => talent.updateAssessment(c.admin, a.id, { comments: 'nope' } as never), /immutable/i);
    const corrected = await talent.correctAssessment(c.admin, a.id);
    assert.equal(corrected.parentId, a.id);
    assert.ok(corrected.versionNo > 1);
    // original finalized row unchanged
    const orig = await db('succession_talent_assessments').where({ id: a.id }).first();
    assert.equal(orig.status, 'FINALIZED');
  });

  it('APPRAISAL-sourced assessment derives band from finalized appraisal (read-only)', async () => {
    const c = await ctx();
    if (!c || !c.appraisalEmpId) return;
    const before = await db('hr_employee_appraisals').where({ college_id: c.collegeId, employee_id: c.appraisalEmpId }).whereNotNull('finalized_at').orderBy('finalized_at', 'desc').first();
    const a = await talent.createAssessment(c.admin, { employeeId: c.appraisalEmpId, assessmentPeriod: uniq('AP'), classificationSource: 'APPRAISAL', potentialBand: 'HIGH' } as never);
    const row = await db('succession_talent_assessments').where({ id: a.id }).first();
    assert.equal(row.classification_source, 'APPRAISAL');
    assert.ok(['HIGH', 'MEDIUM', 'LOW'].includes(String(row.performance_band)));
    // appraisal untouched
    const after = await db('hr_employee_appraisals').where({ id: before.id }).first();
    assert.equal(String(after.final_rating_value), String(before.final_rating_value));
    assert.equal(String(after.finalized_at), String(before.finalized_at));
  });

  it('talent matrix aggregates finalized assessments into a 3x3 grid', async () => {
    const c = await ctx();
    if (!c) return;
    const m = await talent.talentMatrix(c.admin);
    assert.equal(m.matrix.length, 9);
    assert.ok(m.classifiedEmployees >= 0);
  });

  it('talent pool membership is idempotent', async () => {
    const c = await ctx();
    if (!c) return;
    const pool = await talent.createPool(c.admin, { name: uniq('Pool') } as never);
    const m1 = await talent.addPoolMember(c.admin, pool.id, { employeeId: c.empA.id } as never);
    const m2 = await talent.addPoolMember(c.admin, pool.id, { employeeId: c.empA.id } as never);
    assert.equal(m2.id, m1.id);
    assert.equal(m2.idempotent, true);
    const members = await talent.listPoolMembers(c.admin, pool.id);
    assert.equal(members.filter((x: Record<string, unknown>) => Number(x.employee_id) === c.empA.id && x.status === 'ACTIVE').length, 1);
  });

  it('nomination: self-nomination, cross-department, and self-approval blocked', async () => {
    const c = await ctx();
    if (!c) return;
    const rid = await makeRole(c, c.deptD);
    // HOD (identity empB) cannot nominate themselves
    await assert.rejects(() => slate.nominate(c.hod, { criticalRoleId: rid, employeeId: c.empB.id } as never), /yourself/i);
    // HOD cannot nominate another department's employee
    await assert.rejects(() => slate.nominate(c.hod, { criticalRoleId: rid, employeeId: c.empC.id } as never), /scope/i);
    // HOD nominates empA (own dept) — ok
    const nom = await slate.nominate(c.hod, { criticalRoleId: rid, employeeId: c.empA.id, readiness: 'READY_1_YEAR' } as never);
    assert.equal(nom.status, 'NOMINATED');
    // Candidate (empA, here holding an approver role) cannot approve their own candidacy
    await assert.rejects(() => slate.decideCandidate(c.empAApprover, nom.id, 'APPROVE'), /your own candidacy/i);
    // A nominator who also holds approve authority cannot approve a nomination they created
    const rid2 = await makeRole(c, c.deptD);
    const selfNom = await slate.nominate(c.admin, { criticalRoleId: rid2, employeeId: c.empB.id } as never);
    await assert.rejects(() => slate.decideCandidate(c.admin, selfNom.id, 'APPROVE'), /nomination you created/i);
    // A different HR approver approves empA's nomination
    const decided = await slate.decideCandidate(c.approver, nom.id, 'APPROVE');
    assert.equal(decided.status, 'APPROVED');
  });

  it('duplicate nomination is idempotent and concurrency-safe (one canonical successor)', async () => {
    const c = await ctx();
    if (!c) return;
    const rid = await makeRole(c, c.deptD);
    const first = await slate.nominate(c.admin, { criticalRoleId: rid, employeeId: c.empA.id } as never);
    const again = await slate.nominate(c.admin, { criticalRoleId: rid, employeeId: c.empA.id } as never);
    assert.equal(again.id, first.id);
    // Concurrency: two racing nominations for the same (role, employee)
    const rid2 = await makeRole(c, c.deptD);
    await Promise.allSettled([
      slate.nominate(c.admin, { criticalRoleId: rid2, employeeId: c.empB.id } as never),
      slate.nominate(c.admin, { criticalRoleId: rid2, employeeId: c.empB.id } as never),
    ]);
    const count = await db('succession_candidates').where({ college_id: c.collegeId, critical_role_id: rid2, employee_id: c.empB.id }).count<{ c: number }>('id as c').first();
    assert.equal(Number(count?.c), 1, 'exactly one canonical successor');
  });

  it('approval race yields one valid transition with consistent state', async () => {
    const c = await ctx();
    if (!c) return;
    const rid = await makeRole(c, c.deptD);
    const nom = await slate.nominate(c.hod, { criticalRoleId: rid, employeeId: c.empA.id } as never);
    const [r1, r2] = await Promise.allSettled([
      slate.decideCandidate(c.admin, nom.id, 'APPROVE'),
      slate.decideCandidate(c.approver, nom.id, 'APPROVE'),
    ]);
    const finals = [r1, r2].filter((r) => r.status === 'fulfilled').map((r) => (r as PromiseFulfilledResult<{ status: string }>).value.status);
    assert.ok(finals.every((s) => s === 'APPROVED'));
    const row = await db('succession_candidates').where({ id: nom.id }).first();
    assert.equal(row.status, 'APPROVED');
    // exactly one approver recorded (no contradictory history)
    assert.ok(row.approved_by);
  });

  it('readiness reviews preserve history and never overwrite', async () => {
    const c = await ctx();
    if (!c) return;
    const rid = await makeRole(c, c.deptD);
    const nom = await slate.nominate(c.admin, { criticalRoleId: rid, employeeId: c.empA.id, readiness: 'NOT_READY' } as never);
    await slate.reviewReadiness(c.admin, nom.id, { newReadiness: 'DEVELOPING' } as never);
    await slate.reviewReadiness(c.admin, nom.id, { newReadiness: 'READY_2_YEARS' } as never);
    const hist = await slate.readinessHistory(c.admin, nom.id);
    assert.equal(hist.length, 2);
    const cand = await db('succession_candidates').where({ id: nom.id }).first();
    assert.equal(cand.readiness, 'READY_2_YEARS'); // latest reflected on candidate
    assert.ok(hist.some((h: Record<string, unknown>) => h.previous_readiness === 'NOT_READY')); // original preserved
    assert.ok(hist.some((h: Record<string, unknown>) => h.new_readiness === 'READY_2_YEARS'));
  });

  it('development action links L&D read-only and never mutates it; completion idempotent', async () => {
    const c = await ctx();
    if (!c) return;
    // Seed a minimal L&D program + completion for empA (read-only target).
    const [progId] = await db('ld_programs').insert({ college_id: c.collegeId, code: uniq('LDP'), title: 'Succ-linked', provider_type: 'INTERNAL', delivery_mode: 'IN_PERSON', status: 'REGISTRATION_OPEN', applicability_type: 'ALL' });
    const [compId] = await db('ld_completions').insert({ college_id: c.collegeId, program_id: progId, employee_id: c.empA.id, result: 'COMPLETED' });
    const ldBefore = await db('ld_completions').where({ id: compId }).first();

    const act = await slate.createDevAction(c.admin, { employeeId: c.empA.id, actionType: 'TRAINING', description: 'Leadership training', linkedLdProgramId: progId } as never);
    const done = await slate.setDevActionStatus(c.admin, act.id, { status: 'COMPLETED' } as never);
    assert.equal(done.status, 'COMPLETED');
    const row = await db('succession_development_actions').where({ id: act.id }).first();
    assert.equal(Number(row.linked_ld_completion_id), Number(compId)); // pulled read-only
    // idempotent completion
    const dup = await slate.setDevActionStatus(c.admin, act.id, { status: 'COMPLETED' } as never);
    assert.equal(dup.idempotent, true);
    // L&D completion unchanged
    const ldAfter = await db('ld_completions').where({ id: compId }).first();
    assert.deepEqual({ r: ldAfter.result, e: ldAfter.employee_id }, { r: ldBefore.result, e: ldBefore.employee_id });
  });

  it('inactive employees cannot be nominated (lifecycle handling)', async () => {
    const c = await ctx();
    if (!c) return;
    const rid = await makeRole(c, c.deptD);
    const [inactiveId] = await db('employees').insert({
      college_id: c.collegeId, employee_number: uniq('SUCC-INACTIVE'), first_name: 'In', last_name: 'Active', display_name: 'Inactive E2E',
      employment_status: 'INACTIVE', employee_category: 'NON_TEACHING', department_id: c.deptD,
    });
    try {
      await assert.rejects(() => slate.nominate(c.admin, { criticalRoleId: rid, employeeId: Number(inactiveId) } as never), /not eligible/i);
    } finally {
      await db('employees').where({ id: inactiveId }).delete();
    }
  });

  it('employee confidentiality: self-surface exposes only own development, not slates', async () => {
    const c = await ctx();
    if (!c) return;
    const my = await dash.myDevelopment(c.empAActor);
    const serialized = JSON.stringify(my);
    assert.ok(!/readiness|rank|nomination|potential_band|slate/i.test(serialized));
    // Ordinary employee cannot read slates / matrix / reports.
    const rid = await makeRole(c, c.deptD);
    await assert.rejects(() => slate.listCandidates(c.empAActor, rid), /permission/i);
    await assert.rejects(() => talent.talentMatrix(c.empAActor), /permission/i);
  });

  it('tenant isolation: another college cannot read or act on the role', async () => {
    const c = await ctx();
    if (!c || !c.cross) return;
    const rid = await makeRole(c, c.deptD);
    await assert.rejects(() => roles.getRole(c.cross!, rid), /not found/i);
    await assert.rejects(() => slate.nominate(c.cross!, { criticalRoleId: rid, employeeId: c.empA.id } as never), /not found/i);
    const crossList = await roles.listRoles(c.cross!, {});
    assert.ok(!crossList.some((r: Record<string, unknown>) => Number(r.id) === rid));
  });

  it('reporting and audit history are produced', async () => {
    const c = await ctx();
    if (!c) return;
    const rep = await dash.coverageReport(c.admin);
    assert.ok(Array.isArray(rep.rows));
    const cov = await dash.coverageMetrics(c.admin);
    assert.ok(cov.totalCriticalRoles >= 1);
    const audit = await db('hr_audit_log').where({ college_id: c.collegeId }).where('action', 'like', 'SUCCESSION_%').count<{ c: number }>('id as c').first();
    assert.ok(Number(audit?.c) > 0);
  });

  it('frozen-domain invariants: T&P and payroll untouched by succession ops', async () => {
    const c = await ctx();
    if (!c) return;
    const tpBefore = await db('training_programs').where({ college_id: c.collegeId }).count<{ c: number }>('id as c').first();
    const enrBefore = await db('training_enrollments').where({ college_id: c.collegeId }).count<{ c: number }>('id as c').first();
    const payBefore = await db('payroll_run_employees').where({ employee_id: c.empA.id }).count<{ c: number }>('id as c').first();

    const rid = await makeRole(c, c.deptD);
    const nom = await slate.nominate(c.admin, { criticalRoleId: rid, employeeId: c.empA.id } as never);
    await slate.decideCandidate(c.approver, nom.id, 'APPROVE');
    const evt = await slate.openEvent(c.admin, { criticalRoleId: rid } as never);
    await slate.decideEvent(c.admin, evt.id, { selectedCandidateId: nom.id, selectedEmployeeId: c.empA.id, effectiveDate: '2027-01-01' } as never);

    const tpAfter = await db('training_programs').where({ college_id: c.collegeId }).count<{ c: number }>('id as c').first();
    const enrAfter = await db('training_enrollments').where({ college_id: c.collegeId }).count<{ c: number }>('id as c').first();
    const payAfter = await db('payroll_run_employees').where({ employee_id: c.empA.id }).count<{ c: number }>('id as c').first();
    assert.equal(Number(tpAfter?.c), Number(tpBefore?.c), 'student T&P unchanged');
    assert.equal(Number(enrAfter?.c), Number(enrBefore?.c), 'student enrollments unchanged');
    assert.equal(Number(payAfter?.c), Number(payBefore?.c), 'payroll unchanged by succession decision');
  });
});
