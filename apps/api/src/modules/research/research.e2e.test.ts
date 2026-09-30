import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { db } from '../../db/index.js';
import * as svc from './service.js';
import type { ResearchActor } from './types.js';

async function setup(tag = `R${Date.now()}${Math.floor(Math.random() * 10000)}`) {
  const [collegeId] = await db('colleges').insert({ name: `Research College ${tag}`, code: `RC${tag}`.slice(0, 60) });
  const [otherCollegeId] = await db('colleges').insert({ name: `Other Research College ${tag}`, code: `ORC${tag}`.slice(0, 60) });
  const [deptId] = await db('departments').insert({ college_id: collegeId, name: 'CSE', code: `CSE${tag}`.slice(0, 60) });
  const [otherDeptId] = await db('departments').insert({ college_id: collegeId, name: 'ECE', code: `ECE${tag}`.slice(0, 60) });

  const [adminId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'College Admin', email: `res.admin.${tag}@test.edu`, password_hash: 'x', role: 'COLLEGE_ADMIN', is_active: true });
  const [coordId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Coordinator', email: `res.coord.${tag}@test.edu`, password_hash: 'x', role: 'RESEARCH_COORDINATOR', is_active: true });
  const [hodId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'HOD CSE', email: `res.hod.${tag}@test.edu`, password_hash: 'x', role: 'HOD', is_active: true });
  const [otherHodId] = await db('faculty_users').insert({ college_id: collegeId, department_id: otherDeptId, name: 'HOD ECE', email: `res.hod2.${tag}@test.edu`, password_hash: 'x', role: 'HOD', is_active: true });
  const [piId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'PI Faculty', email: `res.pi.${tag}@test.edu`, password_hash: 'x', role: 'FACULTY', is_active: true });
  const [coPiId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'CoPI Faculty', email: `res.copi.${tag}@test.edu`, password_hash: 'x', role: 'FACULTY', is_active: true });
  const [unrelatedFacultyId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Unrelated Faculty', email: `res.unrel.${tag}@test.edu`, password_hash: 'x', role: 'FACULTY', is_active: true });
  const [crossAdminId] = await db('faculty_users').insert({ college_id: otherCollegeId, name: 'Cross Admin', email: `res.cross.${tag}@test.edu`, password_hash: 'x', role: 'COLLEGE_ADMIN', is_active: true });

  const admin: ResearchActor = { facultyUserId: Number(adminId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'COLLEGE_ADMIN' };
  const coordinator: ResearchActor = { facultyUserId: Number(coordId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'RESEARCH_COORDINATOR' };
  const hod: ResearchActor = { facultyUserId: Number(hodId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'HOD' };
  const otherHod: ResearchActor = { facultyUserId: Number(otherHodId), collegeId: Number(collegeId), departmentId: Number(otherDeptId), role: 'HOD' };
  const pi: ResearchActor = { facultyUserId: Number(piId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'FACULTY' };
  const coPi: ResearchActor = { facultyUserId: Number(coPiId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'FACULTY' };
  const unrelatedFaculty: ResearchActor = { facultyUserId: Number(unrelatedFacultyId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'FACULTY' };
  const cross: ResearchActor = { facultyUserId: Number(crossAdminId), collegeId: Number(otherCollegeId), departmentId: null, role: 'COLLEGE_ADMIN' };

  return { admin, coordinator, hod, otherHod, pi, coPi, unrelatedFaculty, cross, collegeId: Number(collegeId), deptId: Number(deptId), otherDeptId: Number(otherDeptId), tag };
}

async function createAndApproveProposal(c: Awaited<ReturnType<typeof setup>>, titleSuffix: string) {
  const proposal = await svc.createProposal(c.pi, {
    title: `Grant Proposal ${titleSuffix}`,
    projectType: 'SPONSORED_RESEARCH',
    departmentId: c.deptId,
    requestedAmount: 500000,
    durationMonths: 24,
    team: [
      { facultyId: c.pi.facultyUserId, roleInProject: 'PI' },
      { facultyId: c.coPi.facultyUserId, roleInProject: 'CO_PI' },
    ],
  });
  await svc.submitProposalForReview(c.pi, proposal.id);
  await svc.reviewProposal(c.hod, proposal.id, { action: 'APPROVE' });
  const approved = await svc.reviewProposal(c.coordinator, proposal.id, { action: 'APPROVE' });
  assert.equal(approved.status, 'APPROVED_INTERNALLY');
  return approved;
}

describe('Campus OS Phase 6: Research grants administration', () => {
  it('runs the full lifecycle: create -> submit -> HOD approve -> Coordinator approve -> award -> convert -> utilization -> close', async () => {
    const c = await setup();
    const approved = await createAndApproveProposal(c, c.tag);

    const awarded = await svc.recordAward(c.coordinator, approved.id, {
      sanctionedAmount: 450000, sanctionReference: `SR-${c.tag}`, sanctionDate: '2026-01-15',
    });
    assert.equal(awarded.status, 'AWARDED');

    const project = await svc.convertToProject(c.coordinator, approved.id);
    assert.equal(project.status, 'ACTIVE');
    assert.ok(project.projectCode);
    assert.equal(project.team.length, 2);

    const withUtilization = await svc.addUtilizationEntry(c.pi, project.id, { amount: 10000, description: 'Equipment', recordedAt: '2026-02-01' });
    assert.equal(withUtilization.amountUtilized, 10000);

    const closed = await svc.closeProject(c.coordinator, project.id, { reason: 'Completed' });
    assert.equal(closed.status, 'CLOSED');
  });

  it('rejects illegal transitions: cannot award a DRAFT/REJECTED proposal; cannot convert before AWARDED; a CANCELLED project cannot be closed', async () => {
    const c = await setup();
    const draft = await svc.createProposal(c.pi, {
      title: `Draft ${c.tag}`, projectType: 'INTERNAL_RESEARCH', departmentId: c.deptId,
      team: [{ facultyId: c.pi.facultyUserId, roleInProject: 'PI' }],
    });
    await assert.rejects(() => svc.recordAward(c.coordinator, draft.id, { sanctionedAmount: 1000, sanctionReference: 'X', sanctionDate: '2026-01-01' }), /Cannot award/);
    await assert.rejects(() => svc.convertToProject(c.coordinator, draft.id), /Cannot convert/);

    await svc.submitProposalForReview(c.pi, draft.id);
    const rejected = await svc.reviewProposal(c.hod, draft.id, { action: 'REJECT', remarks: 'Not feasible' });
    assert.equal(rejected.status, 'REJECTED_INTERNALLY');
    await assert.rejects(() => svc.recordAward(c.coordinator, draft.id, { sanctionedAmount: 1000, sanctionReference: 'X', sanctionDate: '2026-01-01' }), /Cannot award/);

    const approved = await createAndApproveProposal(c, `${c.tag}-cancel`);
    await svc.recordAward(c.coordinator, approved.id, { sanctionedAmount: 20000, sanctionReference: `SRX-${c.tag}`, sanctionDate: '2026-01-01' });
    const project = await svc.convertToProject(c.coordinator, approved.id);
    await db('research_projects').where({ id: project.id }).update({ status: 'CANCELLED' });
    await assert.rejects(() => svc.closeProject(c.coordinator, project.id, {}), /Cannot close/);
  });

  it('prevents self-approval: a PI/Co-PI/team member cannot review a proposal they are on even if they hold HOD/RESEARCH_COORDINATOR role', async () => {
    const c = await setup();
    // PI is also promoted to HOD of the same department for this scenario.
    await db('faculty_users').where({ id: c.pi.facultyUserId }).update({ role: 'HOD' });
    const piAsHod: ResearchActor = { ...c.pi, role: 'HOD' };

    const proposal = await svc.createProposal(c.pi, {
      title: `SelfApprove ${c.tag}`, projectType: 'SPONSORED_RESEARCH', departmentId: c.deptId,
      team: [{ facultyId: c.pi.facultyUserId, roleInProject: 'PI' }, { facultyId: c.coPi.facultyUserId, roleInProject: 'CO_PI' }],
    });
    await svc.submitProposalForReview(c.pi, proposal.id);
    await assert.rejects(() => svc.reviewProposal(piAsHod, proposal.id, { action: 'APPROVE' }), /self-approval/);

    // A Co-PI promoted to RESEARCH_COORDINATOR also cannot review this proposal.
    await db('faculty_users').where({ id: c.coPi.facultyUserId }).update({ role: 'RESEARCH_COORDINATOR' });
    const coPiAsCoordinator: ResearchActor = { ...c.coPi, role: 'RESEARCH_COORDINATOR' };
    await svc.reviewProposal(c.hod, proposal.id, { action: 'APPROVE' });
    await assert.rejects(() => svc.reviewProposal(coPiAsCoordinator, proposal.id, { action: 'APPROVE' }), /self-approval/);
    // The real coordinator (uninvolved) can still approve.
    const approved = await svc.reviewProposal(c.coordinator, proposal.id, { action: 'APPROVE' });
    assert.equal(approved.status, 'APPROVED_INTERNALLY');
  });

  it('generates distinct project codes under concurrent conversions for different proposals', async () => {
    const c = await setup();
    const approvedProposals = await Promise.all([
      createAndApproveProposal(c, `${c.tag}-A`),
      createAndApproveProposal(c, `${c.tag}-B`),
      createAndApproveProposal(c, `${c.tag}-C`),
    ]);
    for (const p of approvedProposals) {
      await svc.recordAward(c.coordinator, p.id, { sanctionedAmount: 10000, sanctionReference: `CC-${p.id}`, sanctionDate: '2026-01-01' });
    }
    const projects = await Promise.all(approvedProposals.map((p) => svc.convertToProject(c.coordinator, p.id)));
    const codes = projects.map((p) => p.projectCode);
    assert.equal(new Set(codes).size, codes.length, 'project codes must all be distinct');
  });

  it('convertToProject is idempotent and concurrency-safe for the same proposal: exactly one project row results', async () => {
    const c = await setup();
    const approved = await createAndApproveProposal(c, `${c.tag}-idem`);
    await svc.recordAward(c.coordinator, approved.id, { sanctionedAmount: 5000, sanctionReference: `ID-${c.tag}`, sanctionDate: '2026-01-01' });

    const results = await Promise.all([
      svc.convertToProject(c.coordinator, approved.id),
      svc.convertToProject(c.coordinator, approved.id),
      svc.convertToProject(c.coordinator, approved.id),
    ]);
    const ids = new Set(results.map((r) => r.id));
    assert.equal(ids.size, 1, 'all concurrent conversions must resolve to the same project');

    const rows = await db('research_projects').where({ proposal_id: approved.id });
    assert.equal(rows.length, 1);
  });

  it('closeProject is idempotent under concurrency: both calls succeed with the same end state', async () => {
    const c = await setup();
    const approved = await createAndApproveProposal(c, `${c.tag}-close`);
    await svc.recordAward(c.coordinator, approved.id, { sanctionedAmount: 5000, sanctionReference: `CL-${c.tag}`, sanctionDate: '2026-01-01' });
    const project = await svc.convertToProject(c.coordinator, approved.id);

    const results = await Promise.allSettled([
      svc.closeProject(c.coordinator, project.id, {}),
      svc.closeProject(c.coordinator, project.id, {}),
    ]);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 2, 'both concurrent closes should succeed (idempotent)');
    const final = await svc.getProject(c.coordinator, project.id);
    assert.equal(final.status, 'CLOSED');
  });

  it('enforces tenant isolation / IDOR: cross-college access returns not found for reads and mutations', async () => {
    const c = await setup();
    const agency = await svc.createFundingAgency(c.admin, { name: `Agency ${c.tag}` });
    const proposal = await svc.createProposal(c.pi, {
      title: `Iso ${c.tag}`, projectType: 'SPONSORED_RESEARCH', departmentId: c.deptId,
      team: [{ facultyId: c.pi.facultyUserId, roleInProject: 'PI' }],
    });

    await assert.rejects(() => svc.getProposal(c.cross, proposal.id), /not found/);
    await assert.rejects(() => svc.submitProposalForReview(c.cross, proposal.id), /not found|Only the PI/);
    await assert.rejects(() => svc.recordAward(c.cross, proposal.id, { sanctionedAmount: 1, sanctionReference: 'x', sanctionDate: '2026-01-01' }), /not found/);
    await assert.rejects(() => svc.convertToProject(c.cross, proposal.id), /not found/);

    const crossFundingAgencies = await svc.listFundingAgencies(c.cross);
    assert.ok(!crossFundingAgencies.some((a: any) => a.id === agency.id));
  });

  it('enforces RBAC: FACULTY cannot review/award/close/manage funding agencies; HOD is department-scoped', async () => {
    const c = await setup();
    const proposal = await svc.createProposal(c.pi, {
      title: `Rbac ${c.tag}`, projectType: 'SPONSORED_RESEARCH', departmentId: c.deptId,
      team: [{ facultyId: c.pi.facultyUserId, roleInProject: 'PI' }],
    });
    await svc.submitProposalForReview(c.pi, proposal.id);

    await assert.rejects(() => svc.reviewProposal(c.unrelatedFaculty, proposal.id, { action: 'APPROVE' }), /permission/);
    await assert.rejects(() => svc.recordAward(c.unrelatedFaculty, proposal.id, { sanctionedAmount: 1, sanctionReference: 'x', sanctionDate: '2026-01-01' }), /permission/);
    await assert.rejects(() => svc.createFundingAgency(c.unrelatedFaculty, { name: 'Nope' }), /permission/);

    // HOD of a different department cannot review this department's proposal.
    await assert.rejects(() => svc.reviewProposal(c.otherHod, proposal.id, { action: 'APPROVE' }), /not the HOD|permission/);

    const approved = await svc.reviewProposal(c.hod, proposal.id, { action: 'APPROVE' });
    assert.equal(approved.status, 'UNDER_REVIEW');
    await assert.rejects(() => svc.closeProject(c.unrelatedFaculty, 1, {}), /permission/);
  });

  it('rejects awarding an already-AWARDED proposal a second time (not silently accepted)', async () => {
    const c = await setup();
    const approved = await createAndApproveProposal(c, `${c.tag}-dblaward`);
    const awarded = await svc.recordAward(c.coordinator, approved.id, { sanctionedAmount: 30000, sanctionReference: `DA-${c.tag}`, sanctionDate: '2026-01-01' });
    assert.equal(awarded.status, 'AWARDED');
    await assert.rejects(
      () => svc.recordAward(c.coordinator, approved.id, { sanctionedAmount: 99999, sanctionReference: 'DIFFERENT', sanctionDate: '2026-02-01' }),
      /Cannot award/,
    );
  });

  it('handles a department-less proposal by routing straight to Coordinator review', async () => {
    const c = await setup();
    const proposal = await svc.createProposal(c.pi, {
      title: `NoDept ${c.tag}`, projectType: 'COLLABORATIVE_RESEARCH',
      team: [{ facultyId: c.pi.facultyUserId, roleInProject: 'PI' }],
    });
    const submitted = await svc.submitProposalForReview(c.pi, proposal.id);
    assert.equal(submitted.status, 'UNDER_REVIEW');
    const approved = await svc.reviewProposal(c.coordinator, proposal.id, { action: 'APPROVE' });
    assert.equal(approved.status, 'APPROVED_INTERNALLY');
  });
});
