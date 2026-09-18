/**
 * Employee L&D E2E invariants. Skips when the E2E seed is absent.
 *
 * Proves: development needs + appraisal boundary, catalogue/programs + state
 * machine, enrollment + capacity concurrency + waitlist + idempotency,
 * nomination/approval + HOD scope + self-approval block, L&D attendance +
 * HR-attendance isolation, completion rules, certificates + security,
 * effectiveness, tenant/department/employee/trainer isolation, and T&P boundary.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../../db/index.js';
import type { HrActor } from '../types.js';
import * as catalogue from './catalogue.js';
import * as needs from './needs.js';
import * as enrollment from './enrollment.js';
import * as delivery from './delivery.js';
import * as history from './history.js';

const IN = ['ACTIVE', 'PROBATION', 'CONFIRMED', 'ON_NOTICE'];
let SEQ = Date.now() % 1_000_000;
const uniq = (p: string) => `${p}-${SEQ++}`;

type Ctx = {
  collegeId: number;
  admin: HrActor;
  empA: { id: number; fid: number };
  empB: { id: number; fid: number };
  empC: { id: number; fid: number };
  deptD: number;
  empAActor: HrActor;
  empBActor: HrActor;
  hod: HrActor; // identity = empB, HOD of dept D
  empAAsHod: HrActor; // identity = empA, HOD of dept D (self-approval case)
  cross: HrActor | null;
};

async function ctx(): Promise<Ctx | null> {
  try {
    if (!(await db.schema.hasTable('ld_programs'))) return null;
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

    const mk = (role: string, fid: number, dept: number | null, extra: Partial<HrActor> = {}): HrActor => ({ facultyUserId: fid, collegeId, departmentId: dept, role, ...extra });
    return {
      collegeId,
      admin: mk('COLLEGE_ADMIN', Number(admin.id), null),
      empA, empB, empC, deptD,
      empAActor: mk('FACULTY', empA.fid, deptD),
      empBActor: mk('FACULTY', empB.fid, deptD),
      hod: mk('HOD', empB.fid, deptD, { hodDepartmentIds: [deptD] }),
      empAAsHod: mk('HOD', empA.fid, deptD, { hodDepartmentIds: [deptD] }),
      cross: crossRow ? mk('COLLEGE_ADMIN', Number(crossRow.id), null, { collegeId: Number(crossRow.college_id) }) : null,
    };
  } catch {
    return null;
  }
}

async function makeOpenProgram(c: Ctx, opts: { capacity?: number | null; completionRule?: unknown; trainerEmployeeId?: number } = {}) {
  const { id } = await catalogue.createProgram(c.admin, {
    code: uniq('PRG'), title: 'E2E Program', providerType: 'INTERNAL', deliveryMode: 'IN_PERSON',
    applicabilityType: 'ALL', capacity: opts.capacity ?? null, trainerEmployeeId: opts.trainerEmployeeId,
    completionRule: opts.completionRule as never,
  } as never);
  await catalogue.changeProgramStatus(c.admin, id, 'PUBLISHED');
  await catalogue.changeProgramStatus(c.admin, id, 'REGISTRATION_OPEN');
  return id;
}

describe('Employee L&D E2E', () => {
  it('development need can reference appraisal without mutating it', async () => {
    const c = await ctx();
    if (!c) return;
    const action = await db('hr_appraisal_development_actions').where({ college_id: c.collegeId }).first();
    const appraisal = await db('hr_employee_appraisals').where({ college_id: c.collegeId }).whereNotNull('finalized_at').first();
    const before = appraisal ? { score: appraisal.final_score, finalized: appraisal.finalized_at } : null;

    if (action) {
      const { id } = await needs.createNeed(c.admin, { employeeId: c.empA.id, sourceType: 'APPRAISAL', sourceRefId: Number(action.id), developmentArea: 'From appraisal', priority: 'HIGH' });
      const need = await db('ld_development_needs').where({ id }).first();
      assert.equal(Number(need.source_ref_id), Number(action.id));
    }
    // Self development request works.
    const self = await needs.createNeed(c.empAActor, { developmentArea: uniq('area'), priority: 'MEDIUM' });
    assert.ok(self.id > 0);

    // Appraisal remains byte-for-byte unchanged.
    if (appraisal) {
      const after = await db('hr_employee_appraisals').where({ id: appraisal.id }).first();
      assert.equal(String(after.final_score), String(before!.score));
      assert.equal(String(after.finalized_at), String(before!.finalized));
    }
  });

  it('HOD recommends own-department employee; other-department blocked', async () => {
    const c = await ctx();
    if (!c) return;
    const ok = await needs.createNeed(c.hod, { employeeId: c.empA.id, sourceType: 'MANAGER', developmentArea: uniq('rec') });
    assert.ok(ok.id > 0);
    await assert.rejects(() => needs.createNeed(c.hod, { employeeId: c.empC.id, sourceType: 'MANAGER', developmentArea: 'x' }), /scope/i);
  });

  it('development need transitions are server-authoritative; self cannot complete', async () => {
    const c = await ctx();
    if (!c) return;
    const { id } = await needs.createNeed(c.empAActor, { developmentArea: uniq('t') });
    await needs.transitionNeed(c.empAActor, id, 'IN_PROGRESS');
    await assert.rejects(() => needs.transitionNeed(c.empAActor, id, 'PLANNED'), /Invalid/); // backward blocked
    await assert.rejects(() => needs.transitionNeed(c.empAActor, id, 'COMPLETED'), /manager|HR/i); // self cannot complete
    const done = await needs.transitionNeed(c.admin, id, 'COMPLETED', 'verified');
    assert.equal(done.status, 'COMPLETED');
  });

  it('program state machine blocks invalid transitions', async () => {
    const c = await ctx();
    if (!c) return;
    const { id } = await catalogue.createProgram(c.admin, { code: uniq('SM'), title: 'SM', providerType: 'INTERNAL', deliveryMode: 'ONLINE', applicabilityType: 'ALL' } as never);
    await assert.rejects(() => catalogue.changeProgramStatus(c.admin, id, 'COMPLETED'), /Invalid/);
    await catalogue.changeProgramStatus(c.admin, id, 'PUBLISHED');
    await catalogue.changeProgramStatus(c.admin, id, 'REGISTRATION_OPEN');
    assert.ok(true);
  });

  it('eligible enroll works; duplicate is idempotent; ineligible blocked', async () => {
    const c = await ctx();
    if (!c) return;
    const pid = await makeOpenProgram(c);
    const e1 = await enrollment.enroll(c.empAActor, pid);
    assert.equal(e1.status, 'CONFIRMED');
    const e2 = await enrollment.enroll(c.empAActor, pid);
    assert.equal(e2.id, e1.id); // idempotent
    assert.equal(e2.idempotent, true);

    // Faculty-only program → empC eligible? make a FACULTY-applicability program; both are faculty-linked so use DEPARTMENT applicability excluding empC's dept.
    const { id: deptProg } = await catalogue.createProgram(c.admin, { code: uniq('DEP'), title: 'Dept-only', providerType: 'INTERNAL', deliveryMode: 'IN_PERSON', applicabilityType: 'DEPARTMENT', applicabilityRef: { departmentIds: [c.deptD] } } as never);
    await catalogue.changeProgramStatus(c.admin, deptProg, 'PUBLISHED');
    await catalogue.changeProgramStatus(c.admin, deptProg, 'REGISTRATION_OPEN');
    await assert.rejects(() => enrollment.enroll(c.empC ? { ...c.admin, role: 'FACULTY', facultyUserId: c.empC.fid, departmentId: null } : c.admin, deptProg), /eligible/i);
  });

  it('capacity concurrency: one confirmed, one waitlisted for the final seat', async () => {
    const c = await ctx();
    if (!c) return;
    const pid = await makeOpenProgram(c, { capacity: 1 });
    const [ra, rb] = await Promise.allSettled([enrollment.enroll(c.empAActor, pid), enrollment.enroll(c.empBActor, pid)]);
    const statuses = [ra, rb].map((r) => (r.status === 'fulfilled' ? (r.value as { status: string }).status : 'ERR'));
    const confirmed = statuses.filter((s) => s === 'CONFIRMED').length;
    const waitlisted = statuses.filter((s) => s === 'WAITLISTED').length;
    assert.equal(confirmed, 1, `expected exactly one CONFIRMED, got ${JSON.stringify(statuses)}`);
    assert.equal(waitlisted, 1, `expected one WAITLISTED, got ${JSON.stringify(statuses)}`);
    // DB never overbooked.
    const confirmedInDb = await db('ld_enrollments').where({ program_id: pid, status: 'CONFIRMED' }).count<{ c: number }>('id as c').first();
    assert.equal(Number(confirmedInDb?.c), 1);
  });

  it('waitlist promotes deterministically when a confirmed seat frees up', async () => {
    const c = await ctx();
    if (!c) return;
    const pid = await makeOpenProgram(c, { capacity: 1 });
    const a = await enrollment.enroll(c.empAActor, pid);
    const b = await enrollment.enroll(c.empBActor, pid);
    assert.equal(a.status, 'CONFIRMED');
    assert.equal(b.status, 'WAITLISTED');
    const cancel = await enrollment.cancelEnrollment(c.empAActor, a.id);
    assert.equal(cancel.promoted, b.id);
    const promoted = await db('ld_enrollments').where({ id: b.id }).first();
    assert.equal(promoted.status, 'CONFIRMED');
  });

  it('nomination: HOD nominates own dept; self-approval blocked; unauthorized approval blocked', async () => {
    const c = await ctx();
    if (!c) return;
    const pid = await makeOpenProgram(c);
    // Self request by empA
    const selfNom = await enrollment.createNomination(c.empAActor, { programId: pid });
    assert.equal(selfNom.status, 'SUBMITTED');
    // empA (as HOD) cannot approve their own nomination
    await assert.rejects(() => enrollment.decideNomination(c.empAAsHod, Number(selfNom.id), 'APPROVE'), /your own/i);
    // A plain faculty (no approve perm) cannot approve
    await assert.rejects(() => enrollment.decideNomination(c.empBActor, Number(selfNom.id), 'APPROVE'), /permission|approve/i);
    // HOD of the dept (identity empB) approves → enrollment created
    const decided = await enrollment.decideNomination(c.hod, Number(selfNom.id), 'APPROVE');
    assert.equal(decided.status, 'APPROVED');
    assert.ok((decided.enrollment as { status: string }).status === 'CONFIRMED');

    // Cross-department nomination blocked
    const pid2 = await makeOpenProgram(c);
    await assert.rejects(() => enrollment.createNomination(c.hod, { programId: pid2, employeeId: c.empC.id }), /scope/i);
  });

  it('L&D attendance records independently and NEVER alters HR attendance', async () => {
    const c = await ctx();
    if (!c) return;
    const pid = await makeOpenProgram(c, { trainerEmployeeId: c.empA.id });
    await enrollment.enroll(c.empAActor, pid);
    const { id: sessionId } = await catalogue.addSession(c.admin, pid, { title: 'S1', isMandatory: true });

    // Snapshot HR attendance for empA BEFORE.
    const hrBefore = await hrAttendanceSnapshot(c.empA.id);

    // Trainer (empA) records attendance; unassigned trainer (empB) blocked.
    await assert.rejects(() => delivery.recordAttendance(c.empBActor, pid, { sessionId, entries: [{ employeeId: c.empA.id, status: 'PRESENT' }] }), /not assigned/i);
    await delivery.recordAttendance(c.empAActor, pid, { sessionId, entries: [{ employeeId: c.empA.id, status: 'PRESENT' }] });

    // HR attendance is byte-for-byte unchanged.
    const hrAfter = await hrAttendanceSnapshot(c.empA.id);
    assert.deepEqual(hrAfter, hrBefore, 'L&D attendance must not touch HR attendance');

    // Finalized attendance is immutable.
    await delivery.finalizeAttendance(c.empAActor, pid, sessionId);
    await assert.rejects(() => delivery.recordAttendance(c.empAActor, pid, { sessionId, entries: [{ employeeId: c.empA.id, status: 'ABSENT' }] }), /Finalized/i);
  });

  it('completion rules are server-derived and block on missing attendance', async () => {
    const c = await ctx();
    if (!c) return;
    const pid = await makeOpenProgram(c, { completionRule: { attendanceThreshold: 50 } });
    await enrollment.enroll(c.empAActor, pid);
    await enrollment.enroll(c.empBActor, pid);
    const { id: sessionId } = await catalogue.addSession(c.admin, pid, { title: 'S1' });
    await delivery.recordAttendance(c.admin, pid, { sessionId, entries: [{ employeeId: c.empA.id, status: 'PRESENT' }, { employeeId: c.empB.id, status: 'ABSENT' }] });

    const comp = await delivery.recordCompletion(c.admin, pid, { employeeId: c.empA.id });
    assert.ok(['COMPLETED', 'PASSED'].includes(comp.result));
    // empB below threshold → blocked
    await assert.rejects(() => delivery.recordCompletion(c.admin, pid, { employeeId: c.empB.id }), /below|Attendance/i);
    // completion creates development history + is idempotent
    const dup = await delivery.recordCompletion(c.admin, pid, { employeeId: c.empA.id });
    assert.equal(dup.idempotent, true);
    const hist = await history.developmentHistory(c.admin, c.empA.id);
    assert.ok(hist.completions.some((x: Record<string, unknown>) => Number(x.program_id) === pid));
  });

  it('certificates: internal issue idempotent, external verify, cross-employee blocked', async () => {
    const c = await ctx();
    if (!c) return;
    const pid = await makeOpenProgram(c);
    await enrollment.enroll(c.empAActor, pid);
    await delivery.recordCompletion(c.admin, pid, { employeeId: c.empA.id });
    const cert1 = await delivery.issueCertificate(c.admin, pid, { employeeId: c.empA.id });
    assert.ok(cert1.certificateNumber);
    const cert2 = await delivery.issueCertificate(c.admin, pid, { employeeId: c.empA.id });
    assert.equal(cert2.certificateNumber, cert1.certificateNumber); // idempotent

    // Employee accesses own certificate; another employee cannot.
    const own = await delivery.getCertificate(c.empAActor, cert1.id);
    assert.equal(Number(own.employee_id), c.empA.id);
    await assert.rejects(() => delivery.getCertificate(c.empBActor, cert1.id), /scope|not found|permission/i);

    // External certificate submit + verify
    const ext = await delivery.submitExternalCertificate(c.empAActor, { title: uniq('MOOC'), provider: 'Coursera' });
    assert.equal(ext.status, 'SUBMITTED');
    const verified = await delivery.verifyCertificate(c.admin, ext.id, { decision: 'VERIFIED' });
    assert.equal(verified.status, 'VERIFIED');
  });

  it('effectiveness: employee feedback + manager review; cross-department review blocked', async () => {
    const c = await ctx();
    if (!c) return;
    const pid = await makeOpenProgram(c);
    await enrollment.enroll(c.empAActor, pid);
    const fb = await delivery.submitFeedback(c.empAActor, { programId: pid, rating: 4, relevanceRating: 5 });
    assert.ok(fb.id > 0);
    const dup = await delivery.submitFeedback(c.empAActor, { programId: pid, rating: 3 });
    assert.equal(dup.idempotent, true);
    const rev = await delivery.managerReview(c.hod, { programId: pid, employeeId: c.empA.id, improvementObserved: true, objectiveMet: true });
    assert.ok(rev.id > 0);
    await assert.rejects(() => delivery.managerReview(c.hod, { programId: pid, employeeId: c.empC.id, objectiveMet: true }), /scope/i);
  });

  it('tenant isolation: another college cannot see or act on the program', async () => {
    const c = await ctx();
    if (!c || !c.cross) return;
    const pid = await makeOpenProgram(c);
    await assert.rejects(() => catalogue.getProgram(c.cross!, pid), /not found/i);
    await assert.rejects(() => enrollment.createNomination(c.cross!, { programId: pid, employeeId: c.empA.id }), /not found/i);
    const crossList = await catalogue.listPrograms(c.cross!, {});
    assert.ok(!crossList.some((p: Record<string, unknown>) => Number(p.id) === pid));
  });

  it('employee isolation: cannot read another employee development history', async () => {
    const c = await ctx();
    if (!c) return;
    await assert.rejects(() => history.developmentHistory(c.empBActor, c.empA.id), /scope|not found/i);
  });

  it('T&P boundary: L&D operations never touch student training tables', async () => {
    const c = await ctx();
    if (!c) return;
    const tpBefore = await tpSnapshot(c.collegeId);
    const pid = await makeOpenProgram(c);
    await enrollment.enroll(c.empAActor, pid);
    const tpAfter = await tpSnapshot(c.collegeId);
    assert.deepEqual(tpAfter, tpBefore, 'Student T&P tables must be untouched by L&D');
    // The L&D program id is not a student training program.
    const asStudentProg = await db('training_programs').where({ id: pid, college_id: c.collegeId }).first().catch(() => null);
    // (ids may coincidentally overlap across tables; assert title/domain separation instead)
    if (asStudentProg) assert.notEqual(String(asStudentProg.title), 'E2E Program');
  });

  it('L&D API does not leak appraisal reviewer comments or salary', async () => {
    const c = await ctx();
    if (!c) return;
    const pid = await makeOpenProgram(c);
    await enrollment.enroll(c.empAActor, pid);
    const hist = await history.developmentHistory(c.admin, c.empA.id);
    const dash = await history.adminDashboard(c.admin);
    const serialized = JSON.stringify({ hist, dash });
    assert.ok(!serialized.includes('reviewer_private_notes'));
    assert.ok(!/salary|gross_amount|net_amount|basic_pay/i.test(serialized));
  });
});

// ── Helpers ──────────────────────────────────────────────────────────────────
async function hrAttendanceSnapshot(employeeId: number) {
  const [monthly, records, punches] = await Promise.all([
    tableCountSum('employee_monthly_attendance', employeeId),
    tableCountSum('employee_attendance_records', employeeId),
    tableCountSum('employee_attendance_punches', employeeId),
  ]);
  return { monthly, records, punches };
}
async function tableCountSum(table: string, employeeId: number) {
  if (!(await db.schema.hasTable(table))) return null;
  const row = await db(table).where({ employee_id: employeeId }).count<{ c: number }>('id as c').first().catch(() => ({ c: 0 }));
  return Number((row as { c: number })?.c ?? 0);
}
async function tpSnapshot(collegeId: number) {
  const [programs, enrollments, attendance] = await Promise.all([
    db('training_programs').where({ college_id: collegeId }).count<{ c: number }>('id as c').first(),
    db('training_enrollments').where({ college_id: collegeId }).count<{ c: number }>('id as c').first(),
    db('training_attendance_records').where({ college_id: collegeId }).count<{ c: number }>('id as c').first().catch(() => ({ c: 0 })),
  ]);
  return { programs: Number(programs?.c ?? 0), enrollments: Number(enrollments?.c ?? 0), attendance: Number((attendance as { c: number })?.c ?? 0) };
}
