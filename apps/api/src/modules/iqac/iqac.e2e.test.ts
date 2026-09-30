import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { db } from '../../db/index.js';
import * as svc from './service.js';
import type { IqacActor } from './types.js';

async function setup(tag = `Q${Date.now()}${Math.floor(Math.random() * 10000)}`) {
  const [collegeId] = await db('colleges').insert({ name: `IQAC College ${tag}`, code: `QC${tag}`.slice(0, 60) });
  const [otherCollegeId] = await db('colleges').insert({ name: `Other IQAC College ${tag}`, code: `OQC${tag}`.slice(0, 60) });
  const [deptId] = await db('departments').insert({ college_id: collegeId, name: 'CSE', code: `CSE${tag}`.slice(0, 60) });
  const [otherDeptId] = await db('departments').insert({ college_id: collegeId, name: 'ECE', code: `ECE${tag}`.slice(0, 60) });

  const mk = async (role: string, name: string, slug: string, departmentId: number | null = Number(deptId)) => {
    const [id] = await db('faculty_users').insert({
      college_id: collegeId, department_id: departmentId, name, email: `${slug}.${tag}@test.edu`.slice(0, 190),
      password_hash: 'x', role, is_active: true,
    });
    return Number(id);
  };

  const adminId = await mk('COLLEGE_ADMIN', 'Admin', 'admin');
  const coordId = await mk('IQAC_COORDINATOR', 'IQAC Coord', 'coord');
  const nbaId = await mk('NBA_COORDINATOR', 'NBA Coord', 'nba');
  const principalId = await mk('PRINCIPAL', 'Principal', 'principal', null);
  const hodId = await mk('HOD', 'HOD CSE', 'hod1');
  const otherHodId = await mk('HOD', 'HOD ECE', 'hod2', Number(otherDeptId));
  const facultyId = await mk('FACULTY', 'Faculty One', 'faculty');
  const [crossAdminId] = await db('faculty_users').insert({ college_id: otherCollegeId, name: 'Cross Admin', email: `cross.${tag}@test.edu`, password_hash: 'x', role: 'COLLEGE_ADMIN', is_active: true });

  const base = { collegeId: Number(collegeId), departmentId: Number(deptId) };
  const admin: IqacActor = { facultyUserId: adminId, collegeId: base.collegeId, departmentId: base.departmentId, role: 'COLLEGE_ADMIN' };
  const coordinator: IqacActor = { facultyUserId: coordId, collegeId: base.collegeId, departmentId: base.departmentId, role: 'IQAC_COORDINATOR' };
  const nba: IqacActor = { facultyUserId: nbaId, collegeId: base.collegeId, departmentId: base.departmentId, role: 'NBA_COORDINATOR' };
  const principal: IqacActor = { facultyUserId: principalId, collegeId: base.collegeId, departmentId: null, role: 'PRINCIPAL' };
  const hod: IqacActor = { facultyUserId: hodId, collegeId: base.collegeId, departmentId: base.departmentId, role: 'HOD' };
  const otherHod: IqacActor = { facultyUserId: otherHodId, collegeId: base.collegeId, departmentId: Number(otherDeptId), role: 'HOD' };
  const faculty: IqacActor = { facultyUserId: facultyId, collegeId: base.collegeId, departmentId: base.departmentId, role: 'FACULTY' };
  const cross: IqacActor = { facultyUserId: Number(crossAdminId), collegeId: Number(otherCollegeId), departmentId: null, role: 'COLLEGE_ADMIN' };

  return { admin, coordinator, nba, principal, hod, otherHod, faculty, cross, collegeId: base.collegeId, deptId: base.departmentId, otherDeptId: Number(otherDeptId), tag };
}

async function setupFramework(c: Awaited<ReturnType<typeof setup>>) {
  const framework = await svc.createFramework(c.coordinator, { name: `Framework ${c.tag}`, code: `FW${c.tag}`.slice(0, 30) });
  const draftVersion = await svc.createFrameworkVersion(c.coordinator, framework.id, { versionLabel: 'v1' });
  const version = await svc.activateFrameworkVersion(c.coordinator, draftVersion.id);
  const criterion = await svc.createCriterion(c.coordinator, version.id, { code: 'C1', title: 'Curricular Aspects' });
  return { framework, version, criterion };
}

describe('Campus OS Phase 7: IQAC & Accreditation', () => {
  it('framework/version/criterion registry: create, version, activate, and criterion hierarchy', async () => {
    const c = await setup();
    const { version, criterion } = await setupFramework(c);
    assert.equal(version.status, 'ACTIVE');
    const ki = await svc.createCriterion(c.coordinator, version.id, { parentId: criterion.id, level: 'KEY_INDICATOR', code: 'C1.1', title: 'Curriculum design' });
    assert.equal(ki.parent_id, criterion.id);

    const version2 = await svc.createFrameworkVersion(c.coordinator, (await db('iqac_frameworks').where({ id: version.framework_id }).first()).id, { versionLabel: 'v2' });
    await svc.activateFrameworkVersion(c.coordinator, version2.id);
    const retiredV1 = await db('iqac_framework_versions').where({ id: version.id }).first();
    assert.equal(retiredV1.status, 'RETIRED');
  });

  it('RBAC: FACULTY cannot manage frameworks or metrics; HOD is not granted cycle.approve', async () => {
    const c = await setup();
    await assert.rejects(() => svc.createFramework(c.faculty, { name: 'X', code: `X${c.tag}`.slice(0, 20) }), /permission/i);
    await assert.rejects(() => svc.createMetric(c.faculty, { code: `MF${c.tag}`.slice(0, 40), name: 'M', sourceType: 'MANUAL' }), /permission/i);
    const hodMetric = await svc.createMetric(c.hod, { code: `MH${c.tag}`.slice(0, 40), name: 'HOD-owned metric', sourceType: 'MANUAL', ownerDepartmentId: c.deptId });
    assert.ok(hodMetric.id, 'HOD may manage MANUAL metrics scoped to their own department');
    await assert.rejects(() => svc.setManualMetricValue(c.otherHod, hodMetric.id, { periodLabel: '2025-26', value: 1 }), /cannot enter values/i, 'a different department HOD cannot enter values for a metric they do not own');
    // IQAC_COORDINATOR deliberately lacks cycle.approve (two-party control).
    const { version } = await setupFramework(c);
    const cycle = await svc.createCycle(c.coordinator, { frameworkVersionId: version.id, name: 'Cycle 1', academicYear: '2025-26' });
    await svc.advanceCycle(c.coordinator, cycle.id, 'DATA_COLLECTION');
    await svc.advanceCycle(c.coordinator, cycle.id, 'REVIEW');
    await assert.rejects(() => svc.advanceCycle(c.coordinator, cycle.id, 'APPROVED'), /permission/i);
    const approved = await svc.advanceCycle(c.principal, cycle.id, 'APPROVED');
    assert.equal(approved.status, 'APPROVED');
  });

  it('tenant isolation: cross-college actor gets 404 on reads and mutations, not a leak', async () => {
    const c = await setup();
    const { version } = await setupFramework(c);
    await assert.rejects(() => svc.listFrameworkVersions(c.cross, version.framework_id), /not found/i);
    await assert.rejects(() => svc.createCriterion(c.cross, version.id, { code: 'X', title: 'X' }), /not found/i);
    const cycle = await svc.createCycle(c.coordinator, { frameworkVersionId: version.id, name: 'Cycle T', academicYear: '2025-26' });
    await assert.rejects(() => svc.getCycle(c.cross, cycle.id), /not found/i);
  });

  it('missing-data semantics: SYSTEM_DERIVED metric with no registered connector recomputes to NOT_CONFIGURED, never 0', async () => {
    const c = await setup();
    const metric = await svc.createMetric(c.coordinator, { code: `SD${c.tag}`.slice(0, 40), name: 'Placement %', sourceType: 'SYSTEM_DERIVED', sourceModule: 'placement' });
    const value = await svc.recomputeSystemMetric(c.coordinator, metric.id, '2025-26');
    assert.equal(value.value_status, 'NOT_CONFIGURED');
    assert.equal(value.value, null);
  });

  it('manual metric entry and override preserve prior value/status and require a reason', async () => {
    const c = await setup();
    const metric = await svc.createMetric(c.coordinator, { code: `MN${c.tag}`.slice(0, 40), name: 'Faculty Satisfaction', sourceType: 'MANUAL' });
    const v1 = await svc.setManualMetricValue(c.coordinator, metric.id, { periodLabel: '2025-26', value: 4.2 });
    assert.equal(v1.value_status, 'OK');
    const overridden = await svc.overrideMetricValue(c.coordinator, metric.id, '2025-26', { value: 4.5, valueStatus: 'OK', reason: 'Corrected data-entry typo' });
    assert.equal(Number(overridden.previous_value), 4.2);
    assert.equal(overridden.is_override, 1);
    await assert.rejects(() => svc.overrideMetricValue(c.coordinator, metric.id, '2099-27', { value: 1, valueStatus: 'OK', reason: 'no row yet' }), /No metric value/i);
  });

  it('accreditation cycle: full lifecycle to CLOSED, and a double-freeze is rejected (concurrency-safe)', async () => {
    const c = await setup();
    const { version } = await setupFramework(c);
    const cycle = await svc.createCycle(c.coordinator, { frameworkVersionId: version.id, name: 'Cycle F', academicYear: '2025-26' });
    await svc.advanceCycle(c.coordinator, cycle.id, 'DATA_COLLECTION');
    await svc.advanceCycle(c.coordinator, cycle.id, 'REVIEW');
    await svc.advanceCycle(c.principal, cycle.id, 'APPROVED');

    const [first, second] = await Promise.allSettled([
      svc.freezeCycle(c.coordinator, cycle.id, {}),
      svc.freezeCycle(c.coordinator, cycle.id, {}),
    ]);
    const outcomes = [first, second];
    const fulfilled = outcomes.filter((o) => o.status === 'fulfilled');
    const rejected = outcomes.filter((o) => o.status === 'rejected');
    assert.equal(fulfilled.length, 1, 'exactly one concurrent freeze call should succeed');
    assert.equal(rejected.length, 1, 'the other concurrent freeze call should be rejected, not silently double-applied');
    const snapshots = await svc.listSnapshots(c.coordinator, cycle.id);
    assert.equal(snapshots.length, 1, 'no duplicate snapshot was created');

    const submitted = await svc.submitCycle(c.coordinator, cycle.id, { submissionReference: `SUB-${c.tag}` });
    assert.equal(submitted.status, 'SUBMITTED');
    // Idempotent retry with the same reference is a safe no-op, not an error.
    const resubmitted = await svc.submitCycle(c.coordinator, cycle.id, { submissionReference: `SUB-${c.tag}` });
    assert.equal(resubmitted.status, 'SUBMITTED');

    const closed = await svc.closeCycle(c.coordinator, cycle.id);
    assert.equal(closed.status, 'CLOSED');
    // Idempotent close retry.
    const closedAgain = await svc.closeCycle(c.coordinator, cycle.id);
    assert.equal(closedAgain.status, 'CLOSED');
    await assert.rejects(() => svc.advanceCycle(c.coordinator, cycle.id, 'DATA_COLLECTION'), /cannot be advanced/i);
  });

  it('snapshot revision after freeze is append-only and requires a reason; original snapshot is preserved', async () => {
    const c = await setup();
    const { version } = await setupFramework(c);
    const cycle = await svc.createCycle(c.coordinator, { frameworkVersionId: version.id, name: 'Cycle R', academicYear: '2025-26' });
    await svc.advanceCycle(c.coordinator, cycle.id, 'DATA_COLLECTION');
    await svc.advanceCycle(c.coordinator, cycle.id, 'REVIEW');
    await svc.advanceCycle(c.principal, cycle.id, 'APPROVED');
    await svc.freezeCycle(c.coordinator, cycle.id, {});
    const revision2 = await svc.reviseCycleSnapshot(c.coordinator, cycle.id, { reason: 'Corrected a metric after DVV query' });
    assert.equal(revision2.revision, 2);
    const all = await svc.listSnapshots(c.coordinator, cycle.id);
    assert.equal(all.length, 2);
    const rev1 = all.find((s: any) => s.revision === 1);
    assert.equal(rev1.reason, null, 'original freeze snapshot is untouched');
  });

  it('evidence verification: self-verification is blocked even for a coordinator', async () => {
    const c = await setup();
    const evidence = await svc.submitEvidence(c.coordinator, { provenance: 'EXTERNAL_REFERENCE', externalReference: 'https://example.edu/naac/evidence-1' });
    await assert.rejects(() => svc.verifyEvidence(c.coordinator, evidence.id, { status: 'VERIFIED' }), /self-verification/i);
    const verified = await svc.verifyEvidence(c.principal, evidence.id, { status: 'VERIFIED' });
    assert.equal(verified.verification_status, 'VERIFIED');
  });

  it('continuous improvement: action plan is forward-only, terminal states are protected, and reopening a closed plan requires a reason', async () => {
    const c = await setup();
    const plan = await svc.createActionPlan(c.coordinator, {
      sourceType: 'NAAC_OBSERVATION', finding: 'Low industry MoU activity', action: 'Sign 3 new MoUs', targetDate: '2026-03-01',
    });
    assert.equal(plan.status, 'PLANNED');
    await assert.rejects(() => svc.closeActionPlan(c.coordinator, plan.id, {}), /must be COMPLETED/i);
    await svc.updateActionPlan(c.coordinator, plan.id, { status: 'IN_PROGRESS' });
    await svc.updateActionPlan(c.coordinator, plan.id, { status: 'COMPLETED' });
    const closed = await svc.closeActionPlan(c.coordinator, plan.id, { reviewRemarks: 'Verified 3 MoUs signed' });
    assert.equal(closed.status, 'CLOSED');
    await assert.rejects(() => svc.updateActionPlan(c.coordinator, plan.id, { status: 'IN_PROGRESS' }), /cannot be updated/i);
    assert.throws(() => svc.actionPlanReopenSchema.parse({}), /reason/i, 'reason is mandatory at the validation layer');
    const reopened = await svc.reopenActionPlan(c.coordinator, plan.id, { reason: 'Two MoUs were retracted post-closure' });
    assert.equal(reopened.status, 'IN_PROGRESS');
    assert.equal(reopened.reopen_count, 1);
  });

  it('academic audit -> finding -> action plan feeds the SAME continuous-improvement engine (no separate audit_tasks table)', async () => {
    const c = await setup();
    const audit = await svc.createAudit(c.coordinator, {
      name: 'Dept Academic Audit', academicYear: '2025-26', departmentId: c.deptId,
      checklist: [{ code: 'A1', text: 'Syllabus coverage on schedule' }],
    });
    const finding = await svc.addFinding(c.coordinator, audit.id, { checklistItemCode: 'A1', finding: 'Syllabus coverage behind by 2 weeks', severity: 'MEDIUM' });
    const plan = await svc.raiseActionPlanFromFinding(c.coordinator, finding.id, {
      sourceType: 'ACADEMIC_AUDIT', finding: 'Syllabus coverage behind', action: 'Add 2 compensatory classes', departmentId: c.deptId,
    });
    assert.equal(plan.source_type, 'ACADEMIC_AUDIT');
    const refreshedFinding = await db('iqac_audit_findings').where({ id: finding.id }).first();
    assert.equal(refreshedFinding.status, 'ACTION_PLANNED');
    assert.equal(refreshedFinding.action_plan_id, plan.id);
  });

  it('committee governance: members, meeting, and minutes reuse documentEngine by id (no binary storage here)', async () => {
    const c = await setup();
    const committee = await svc.createCommittee(c.coordinator, { name: 'IQAC Committee', committeeType: 'IQAC' });
    await svc.addCommitteeMember(c.coordinator, committee.id, { userId: c.principal.facultyUserId, roleInCommittee: 'CHAIRPERSON' });
    await svc.addCommitteeMember(c.coordinator, committee.id, { externalName: 'Dr. External Expert', externalDesignation: 'Industry Representative', roleInCommittee: 'EXTERNAL_MEMBER' });
    const members = await svc.listCommitteeMembers(c.coordinator, committee.id);
    assert.equal(members.length, 2);
    const meeting = await svc.scheduleMeeting(c.coordinator, committee.id, { meetingDate: '2026-02-10', agenda: 'Review Q3 metrics' });
    const held = await svc.recordMeetingMinutes(c.coordinator, meeting.id, { minutes: 'Discussed metrics; approved 2 action plans.', minutesDocumentId: 999 });
    assert.equal(held.status, 'HELD');
    assert.equal(held.minutes_document_id, 999);
  });

  it('compliance calendar: overdue is derived at read-time, never silently mutates stored status', async () => {
    const c = await setup();
    const item = await svc.createComplianceItem(c.coordinator, { requirement: 'AICTE EOA submission', authority: 'AICTE', dueDate: '2020-01-01' });
    const list = await svc.listComplianceItems(c.coordinator);
    const found = list.find((i: any) => i.id === item.id);
    assert.equal(found.status, 'PENDING', 'stored status is untouched');
    assert.equal(found.isOverdue, true, 'overdue is a derived display flag');
  });

  it('dashboard aggregates via COUNT queries, scoped to the actor college', async () => {
    const c = await setup();
    const other = await setup();
    await svc.createComplianceItem(c.coordinator, { requirement: 'Item A', authority: 'UGC', dueDate: '2020-01-01' });
    await svc.createComplianceItem(other.coordinator, { requirement: 'Item B', authority: 'UGC', dueDate: '2020-01-01' });
    const dashboard = await svc.getDashboard(c.coordinator);
    assert.equal(dashboard.complianceDeadlinesOverdue, 1, 'only this college\'s overdue item is counted');
  });
});
