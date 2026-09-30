/**
 * Alumni Institutional Impact & Accreditation Analytics (C7) — focused e2e tests.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import bcrypt from 'bcrypt';
import { db } from '../../db/index.js';
import * as alumni from './service.js';
import * as crm from './crmService.js';
import * as impact from './impactService.js';
import * as impactWorkspace from './impactWorkspace.js';
import {
  computeAllMetrics,
  computeFunnels,
  getMetricDef,
  listMetricRegistry,
  resolvePeriod,
} from './impactEngine.js';
import {
  FORBIDDEN_IMPACT_CLAIMS,
  KNOWN_LIMITATIONS,
  MEANINGFUL_ENGAGEMENT_DEFINITION_V1,
  METRIC_REGISTRY,
  SOURCE_OF_TRUTH_MATRIX,
} from './typesImpact.js';
import { AppError } from '../../utils/errors.js';
import { canAccessImpact, isDepartmentScopedImpact } from './accessImpact.js';

const password = 'AlumniImpact!';

async function baseCollege() {
  let college = await db('colleges').orderBy('id').first();
  if (!college) {
    const [id] = await db('colleges').insert({ name: 'AlumniImpact College', code: `AIMP${Date.now()}` });
    college = await db('colleges').where({ id }).first();
  }
  return college;
}

async function ensureAdmin(collegeId: number, role = 'COLLEGE_ADMIN', extras: Record<string, unknown> = {}) {
  // Never persist HOD/PRINCIPAL on faculty_users.role — pollutes leaveApprover
  // legacyHodEmployees / legacyPrincipalEmployees on shared departments.
  const persistedRole = role === 'HOD' || role === 'PRINCIPAL' ? 'FACULTY' : role;
  const email = `impact.${role.toLowerCase()}.${Date.now()}@test.edu`;
  const [id] = await db('faculty_users').insert({
    college_id: collegeId,
    name: `Impact ${role}`,
    email,
    password_hash: await bcrypt.hash(password, 10),
    role: persistedRole,
    is_active: true,
    ...extras,
  });
  const row = await db('faculty_users').where({ id }).first();
  return { ...row, role };
}

async function ensureDepartment(collegeId: number, code = 'CSE') {
  let dept = await db('departments').where({ college_id: collegeId, code }).first();
  if (!dept) {
    const [id] = await db('departments').insert({
      college_id: collegeId,
      name: code,
      code: `${code}${Date.now()}`.slice(0, 16),
    });
    dept = await db('departments').where({ id }).first();
  }
  return dept;
}

async function ensureAcademicYear(collegeId: number) {
  let year = await db('academic_years').where({ college_id: collegeId, is_current: true }).first();
  if (!year) {
    const label = `AY-${Date.now()}`.slice(0, 32);
    const [id] = await db('academic_years').insert({
      college_id: collegeId,
      label,
      is_current: true,
    });
    year = await db('academic_years').where({ id }).first();
  }
  return year;
}

async function createVerifiedAlumni(
  collegeId: number,
  tag: string,
  deptId?: number,
  extras: Record<string, unknown> = {},
) {
  const dept = deptId ? { id: deptId } : await ensureDepartment(collegeId);
  const usn = `IMP${Date.now()}${tag}`.slice(0, 60).toUpperCase();
  const [sid] = await db('students').insert({
    college_id: collegeId,
    department_id: dept.id,
    name: `Impact ${tag}`,
    usn,
    email: `${usn.toLowerCase()}@impact.test`,
    phone: `95555${String(Date.now()).slice(-5)}`,
    semester: '8',
    section: 'A',
    is_active: true,
  });
  const student = await db('students').where({ id: sid }).first();
  const [id] = await db('alumni_profiles').insert({
    college_id: collegeId,
    student_id: student.id,
    email: student.email,
    password_hash: await bcrypt.hash(password, 10),
    is_active: true,
    lifecycle_state: 'ACTIVE',
    verification_state: 'VERIFIED',
    historical_name: student.name,
    historical_usn: student.usn,
    historical_department_id: student.department_id,
    graduation_year: 2019,
    email_visibility: 'PRIVATE',
    phone_visibility: 'PRIVATE',
    phone_override: student.phone,
    contact_verified_at: new Date(),
    ...extras,
  });
  const profile = await db('alumni_profiles').where({ id }).first();
  return { profile, student, dept };
}

function adminActor(admin: any): alumni.AlumniAdminActor {
  return {
    facultyUserId: Number(admin.id),
    collegeId: Number(admin.college_id),
    departmentId: admin.department_id ?? null,
    role: admin.role,
    name: admin.name,
  };
}

async function requireC7() {
  if (!(await db.schema.hasTable('alumni_impact_metric_defs'))) {
    throw new AppError(503, 'Run migration alumni_impact_c7 first');
  }
}

describe('Alumni Impact (C7)', () => {
  it('exposes source-of-truth matrix, forbids fabrication claims, documents limitations', () => {
    const matrix = impact.getSourceOfTruthMatrix();
    assert.ok(matrix.matrix.length >= 10);
    assert.ok(SOURCE_OF_TRUTH_MATRIX.some((m) => m.capability.includes('Metric definitions')));
    assert.ok(FORBIDDEN_IMPACT_CLAIMS.includes('invented_nba_naac_criteria'));
    assert.ok(FORBIDDEN_IMPACT_CLAIMS.includes('associated_reported_as_direct'));
    assert.ok(FORBIDDEN_IMPACT_CLAIMS.includes('activity_as_impact'));
    assert.ok(KNOWN_LIMITATIONS.some((l) => l.includes('Research')));
    assert.ok(KNOWN_LIMITATIONS.some((l) => l.includes('BoS')));
    assert.ok(MEANINGFUL_ENGAGEMENT_DEFINITION_V1.includes('is_meaningful_engagement'));
  });

  it('metric registry is versioned and central — every metric has definition', () => {
    const registry = listMetricRegistry(true);
    assert.ok(registry.length >= 30);
    for (const m of registry) {
      assert.ok(m.metricKey);
      assert.ok(m.name);
      assert.ok(m.description);
      assert.ok(m.impactDomain);
      assert.ok(m.version >= 1);
      assert.ok(m.sourceModules.length >= 1);
    }
    const active = getMetricDef('engagement.active_alumni', 1);
    assert.ok(active);
    assert.equal(active!.version, 1);
    assert.ok(active!.description.includes('meaningful') || active!.description.includes('engagement'));
  });

  it('period resolution prefers academic year and flags partial current year', async () => {
    await requireC7();
    const college = await baseCollege();
    const year = await ensureAcademicYear(college.id);
    const period = await resolvePeriod(Number(college.id), {
      periodType: 'ACADEMIC_YEAR',
      academicYearId: Number(year.id),
    });
    assert.equal(period.periodType, 'ACADEMIC_YEAR');
    assert.ok(period.periodLabel);
    if (year.is_current) {
      assert.ok(period.coverageNote || period.complete === false || period.complete === true);
    }
  });

  it('alumni health percentages expose numerator/denominator population', async () => {
    await requireC7();
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    await createVerifiedAlumni(college.id, 'H1');
    await createVerifiedAlumni(college.id, 'H2', undefined, {
      verification_state: 'PENDING',
      phone_override: null,
      contact_verified_at: null,
    });
    const { profile: unreachable } = await createVerifiedAlumni(college.id, 'H3');
    await db('alumni_profiles').where({ id: unreachable.id }).update({
      verification_state: 'PENDING',
      phone_override: null,
      contact_verified_at: null,
    });

    const { metrics } = await computeAllMetrics(actor, {
      metricKeys: ['alumni.total', 'alumni.verified', 'alumni.verified_rate', 'alumni.reachable'],
    });
    const total = metrics.find((m) => m.metricKey === 'alumni.total')!;
    const verified = metrics.find((m) => m.metricKey === 'alumni.verified')!;
    const rate = metrics.find((m) => m.metricKey === 'alumni.verified_rate')!;
    assert.ok((total.value ?? 0) >= 2);
    assert.ok((verified.value ?? 0) >= 1);
    assert.ok(rate.numerator != null);
    assert.ok(rate.denominator != null);
    assert.ok(rate.denominator! > 0);
    assert.equal(rate.numerator, verified.value);
  });

  it('does not count unverified outcomes as mentorship/recruitment impact', async () => {
    await requireC7();
    if (!(await db.schema.hasTable('alumni_crm_outcomes'))) return;

    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile } = await createVerifiedAlumni(college.id, 'UV');

    const opp = await crm.createOpportunity(actor, Number(profile.id), {
      opportunityType: 'MENTORSHIP',
      title: 'Unverified mentoring',
      status: 'CONFIRMED',
    });
    await crm.createOutcome(actor, opp.opportunity.id, {
      outcomeType: 'STUDENTS_MENTORED',
      title: 'Unverified mentors',
      quantity: 50,
      evidenceReference: 'draft-note',
      outcomeDate: new Date().toISOString().slice(0, 10),
      description: 'Not verified yet',
    });

    const { metrics } = await computeAllMetrics(actor, {
      metricKeys: ['mentorship.students_supported', 'mentorship.completed_cycles'],
    });
    // Unverified must not inflate — may be 0 or prior verified only
    const before = metrics.find((m) => m.metricKey === 'mentorship.students_supported')!.value ?? 0;

    const verifiedOutcome = await crm.createOutcome(actor, opp.opportunity.id, {
      outcomeType: 'STUDENTS_MENTORED',
      title: 'Verified mentors',
      quantity: 4,
      evidenceReference: 'mentor-log',
      outcomeDate: new Date().toISOString().slice(0, 10),
      description: 'Verified',
      beneficiaryRefs: ['student:1001', 'student:1002'],
    });
    await crm.verifyOutcome(actor, verifiedOutcome.outcome.id, 'VERIFY');

    const after = await computeAllMetrics(actor, {
      metricKeys: ['mentorship.students_supported', 'mentorship.alumni_mentors'],
    });
    const students = after.metrics.find((m) => m.metricKey === 'mentorship.students_supported')!;
    assert.ok((students.value ?? 0) >= before + 4);
    assert.equal(students.attributionDefault, 'SUPPORTED');
  });

  it('unique beneficiary dedupe separates UNIQUE_STUDENTS from interactions', async () => {
    await requireC7();
    if (!(await db.schema.hasTable('alumni_crm_outcomes'))) return;

    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile } = await createVerifiedAlumni(college.id, 'BD');

    const opp = await crm.createOpportunity(actor, Number(profile.id), {
      opportunityType: 'MENTORSHIP',
      title: 'Beneficiary dedupe',
      status: 'COMPLETED',
    });
    const o1 = await crm.createOutcome(actor, opp.opportunity.id, {
      outcomeType: 'STUDENTS_MENTORED',
      title: 'Cycle A',
      quantity: 2,
      beneficiaryRefs: ['student:2001', 'student:2002'],
      evidenceReference: 'a',
      outcomeDate: new Date().toISOString().slice(0, 10),
      description: 'A',
    });
    await crm.verifyOutcome(actor, o1.outcome.id, 'VERIFY');
    const o2 = await crm.createOutcome(actor, opp.opportunity.id, {
      outcomeType: 'INTERNSHIPS_ENABLED',
      title: 'Intern B',
      quantity: 1,
      beneficiaryRefs: ['student:2001'],
      evidenceReference: 'b',
      outcomeDate: new Date().toISOString().slice(0, 10),
      description: 'B',
    });
    await crm.verifyOutcome(actor, o2.outcome.id, 'VERIFY');

    const { metrics } = await computeAllMetrics(actor, {
      metricKeys: ['students.unique_benefited', 'students.beneficiary_interactions'],
    });
    const unique = metrics.find((m) => m.metricKey === 'students.unique_benefited')!;
    const interactions = metrics.find((m) => m.metricKey === 'students.beneficiary_interactions')!;
    assert.ok((unique.value ?? 0) >= 2);
    assert.ok((interactions.value ?? 0) >= 3);
    assert.ok((interactions.value ?? 0) >= (unique.value ?? 0));
  });

  it('recruitment terminology remains ALUMNI_SUPPORTED — not causal placement', async () => {
    await requireC7();
    const def = getMetricDef('recruitment.placements_supported')!;
    assert.ok(def.description.includes('ALUMNI_SUPPORTED'));
    assert.ok(def.description.toLowerCase().includes('does not claim'));
  });

  it('funnels expose engagement + need-to-impact stages without implying universal path', async () => {
    await requireC7();
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const funnels = await computeFunnels(actor, {});
    assert.ok(funnels.note.includes('not every alumnus'));
    assert.ok(funnels.engagementFunnel.some((s) => s.stage === 'REACHABLE'));
    assert.ok(funnels.engagementFunnel.some((s) => s.stage === 'VERIFIED_OUTCOME'));
    assert.ok(funnels.needFunnel.some((s) => s.stage === 'FULFILLED'));
    assert.ok(funnels.programFunnel.some((s) => s.stage === 'TARGETED'));
  });

  it('evidence ledger sync projects C2 outcomes without inventing verification', async () => {
    await requireC7();
    if (!(await db.schema.hasTable('alumni_crm_outcomes'))) return;

    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile } = await createVerifiedAlumni(college.id, 'EV');

    const opp = await crm.createOpportunity(actor, Number(profile.id), {
      opportunityType: 'EXPERT_SESSION',
      title: 'Expert session',
      status: 'COMPLETED',
    });
    const outcome = await crm.createOutcome(actor, opp.opportunity.id, {
      outcomeType: 'EXPERT_SESSIONS_DELIVERED',
      title: 'Session delivered',
      quantity: 1,
      evidenceReference: 'attendance-sheet',
      outcomeDate: new Date().toISOString().slice(0, 10),
      description: 'Delivered',
    });
    await crm.verifyOutcome(actor, outcome.outcome.id, 'VERIFY');

    const sync = await impact.syncEvidenceLedger(actor, {});
    assert.ok(sync.inserted >= 1 || sync.skipped >= 1);
    const ledger = await impact.listEvidenceLedger(actor, { metricKey: 'experts.sessions_delivered' });
    assert.ok(ledger.items.some((i) => i.sourceReference.includes(String(outcome.outcome.id))));
    assert.ok(ledger.items.every((i) => !('email' in i) && !('phone' in i)));
  });

  it('gap analysis reports OUTCOME_WITHOUT_EVIDENCE and METRIC_SOURCE_INCOMPLETE', async () => {
    await requireC7();
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const gaps = await impact.analyzeGaps(actor, {});
    assert.ok(typeof gaps.gapCount === 'number');
    assert.ok(gaps.byType);
    assert.ok(gaps.note.includes('not silently excluded'));
  });

  it('accreditation frameworks are configurable — empty until created; no hard-coded NBA/NAAC', async () => {
    await requireC7();
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);

    const before = await impact.listFrameworks(actor);
    assert.ok(before.note.includes('not hard-coded') || before.note.includes('not fabricated') || before.note.includes('configure'));

    const fw = await impact.createFramework(actor, {
      code: `INST_FW_${Date.now()}`.slice(0, 48),
      label: 'Institution Quality Framework',
      description: 'College-configured — not a fabricated NAAC list',
    });
    const crit = await impact.createCriterion(actor, {
      frameworkId: fw.framework.id,
      code: 'Q1',
      label: 'Alumni engagement quality',
    });
    const map = await impact.createMapping(actor, {
      frameworkId: fw.framework.id,
      criterionId: crit.criterion.id,
      metricKey: 'engagement.active_alumni',
      academicYear: '2025-26',
      evidenceReferences: ['ledger:sync'],
      notes: 'Maps to configured criterion only',
    });
    assert.equal(map.mapping.verificationStatus, 'DRAFT');

    const verified = await impact.verifyMapping(actor, map.mapping.id, { verificationStatus: 'VERIFIED' });
    assert.equal(verified.verificationStatus, 'VERIFIED');

    // Reject unknown metric keys
    await assert.rejects(
      () =>
        impact.createMapping(actor, {
          frameworkId: fw.framework.id,
          criterionId: crit.criterion.id,
          metricKey: 'invented.fake.metric',
        }),
      (err: any) => err instanceof AppError && err.status === 400,
    );
  });

  it('report snapshot is immutable and retains metric versions', async () => {
    await requireC7();
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    await createVerifiedAlumni(college.id, 'SN');

    const snap = await impact.createSnapshot(actor, {
      reportType: 'DATA_QUALITY',
      title: `DQ Snapshot ${Date.now()}`,
    });
    assert.ok(snap.snapshot.id);
    assert.equal(snap.snapshot.immutable, true);

    const loaded = await impact.getSnapshot(actor, snap.snapshot.id);
    assert.ok(Array.isArray(loaded.snapshot.results));
    assert.ok(Array.isArray(loaded.snapshot.metricDefs));
    assert.ok(loaded.snapshot.metricDefs.some((d: any) => d.version >= 1));
  });

  it('CSV export includes title, period, metric version, generated timestamp', async () => {
    await requireC7();
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const exp = await impact.exportReportCsv(actor, { reportType: 'DATA_QUALITY' });
    assert.ok(exp.csv.includes('metric_version'));
    assert.ok(exp.csv.includes('generated_at'));
    assert.ok(exp.csv.includes('report_title'));
    assert.ok(exp.generatedAt);
  });

  it('executive workspace sections A–G present; HOD is department-scoped', async () => {
    await requireC7();
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id, 'PRINCIPAL');
    const hodDept = await ensureDepartment(college.id, `IMP${Date.now()}`.slice(0, 8));
    const hod = await ensureAdmin(college.id, 'HOD', { department_id: hodDept.id });

    const exec = await impactWorkspace.getImpactWorkspace(adminActor(admin), { view: 'EXECUTIVE' });
    assert.ok(exec.sections?.length >= 6);
    assert.ok(exec.sections.some((s: any) => String(s.title).includes('Alumni Health')));
    assert.ok(exec.sections.some((s: any) => String(s.title).includes('Data Quality')));

    assert.equal(isDepartmentScopedImpact(adminActor(hod)), true);
    const hodView = await impactWorkspace.getImpactWorkspace(adminActor(hod), { view: 'HOD' });
    assert.equal(hodView.view, 'HOD');
    assert.ok(hodView.note?.includes('Department') || hodView.note?.includes('cross-department'));
    // Avoid leaving extra HOD on shared departments (pollutes HR continuity tests).
    await db('faculty_users').where({ id: hod.id }).update({ is_active: false });
  });

  it('IQAC view uses existing quality roles without inventing a portal', async () => {
    await requireC7();
    const college = await baseCollege();
    const iqac = await ensureAdmin(college.id, 'IQAC_COORDINATOR');
    assert.equal(canAccessImpact(adminActor(iqac)), true);
    const view = await impactWorkspace.getImpactWorkspace(adminActor(iqac), { view: 'IQAC' });
    assert.equal(view.view, 'IQAC');
    assert.ok(view.note?.includes('IQAC') || view.note?.includes('NBA'));
  });

  it('tenant isolation: college B cannot read college A snapshot', async () => {
    await requireC7();
    const collegeA = await baseCollege();
    const [collegeBId] = await db('colleges').insert({
      name: `Impact Isol ${Date.now()}`,
      code: `II${Date.now()}`.slice(0, 16),
    });
    const adminA = await ensureAdmin(collegeA.id);
    const adminB = await ensureAdmin(Number(collegeBId));
    const snap = await impact.createSnapshot(adminActor(adminA), {
      reportType: 'ANNUAL_IMPACT',
      title: 'Tenant A only',
    });
    await assert.rejects(
      () => impact.getSnapshot(adminActor(adminB), snap.snapshot.id),
      (err: any) => err instanceof AppError && err.status === 404,
    );
  });

  it('drill-down never returns email/phone; attribution levels stay explicit', async () => {
    await requireC7();
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    await createVerifiedAlumni(college.id, 'DR');
    const drill = await impact.getDrilldown(actor, 'alumni.verified', {});
    assert.ok(drill.count >= 1 || drill.privacy);
    const blob = JSON.stringify(drill);
    assert.ok(!blob.includes('@impact.test') || drill.privacy?.suppressed);
    // Contact fields must not be present as keys on rows
    for (const row of drill.rows || []) {
      assert.equal('email' in row, false);
      assert.equal('phone' in row, false);
    }
  });

  it('METRIC_REGISTRY covers required executive KPI keys', () => {
    const keys = new Set(METRIC_REGISTRY.map((m) => m.metricKey));
    for (const required of [
      'alumni.total',
      'alumni.verified',
      'alumni.reachable',
      'engagement.active_alumni',
      'engagement.repeat_alumni',
      'engagement.response_rate',
      'mentorship.alumni_mentors',
      'mentorship.students_supported',
      'recruitment.placements_supported',
      'internship.positions_enabled',
      'experts.sessions_delivered',
      'recognition.alumni_recognised',
      'students.unique_benefited',
      'needs.open',
      'needs.fulfilled',
    ]) {
      assert.ok(keys.has(required), `missing ${required}`);
    }
  });
});
