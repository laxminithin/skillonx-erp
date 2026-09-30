import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { db } from '../../db/index.js';
import * as wf from './service.js';
import type { WorkflowActor } from './types.js';

async function setup(tag = `W${Date.now()}${Math.floor(Math.random() * 10000)}`) {
  const [collegeId] = await db('colleges').insert({ name: `Workflow College ${tag}`, code: `WC${tag}`.slice(0, 60) });
  const [otherCollegeId] = await db('colleges').insert({ name: `Other Workflow College ${tag}`, code: `OW${tag}`.slice(0, 60) });
  const [deptId] = await db('departments').insert({ college_id: collegeId, name: 'Ops', code: `OP${tag}`.slice(0, 60) });
  const [adminId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Workflow Admin', email: `wf.admin.${tag}@test.edu`, password_hash: 'x', role: 'COLLEGE_ADMIN', is_active: true });
  const [hodId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Workflow HOD', email: `wf.hod.${tag}@test.edu`, password_hash: 'x', role: 'HOD', is_active: true });
  const [principalId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Workflow Principal', email: `wf.principal.${tag}@test.edu`, password_hash: 'x', role: 'PRINCIPAL', is_active: true });
  const [facultyId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Workflow Faculty', email: `wf.faculty.${tag}@test.edu`, password_hash: 'x', role: 'FACULTY', is_active: true });
  const [crossAdminId] = await db('faculty_users').insert({ college_id: otherCollegeId, name: 'Cross Admin', email: `wf.cross.${tag}@test.edu`, password_hash: 'x', role: 'COLLEGE_ADMIN', is_active: true });

  const admin: WorkflowActor = { facultyUserId: Number(adminId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'COLLEGE_ADMIN' };
  const hod: WorkflowActor = { facultyUserId: Number(hodId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'HOD' };
  const principal: WorkflowActor = { facultyUserId: Number(principalId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'PRINCIPAL' };
  const faculty: WorkflowActor = { facultyUserId: Number(facultyId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'FACULTY' };
  const cross: WorkflowActor = { facultyUserId: Number(crossAdminId), collegeId: Number(otherCollegeId), departmentId: null, role: 'COLLEGE_ADMIN' };

  return { admin, hod, principal, faculty, cross, tag };
}

function twoLevelDefinitionInput(code: string) {
  return {
    code,
    name: 'Two-level approval (test fixture)',
    entityType: 'TEST_ENTITY',
    steps: [
      { stepKey: 'SUBMITTED', name: 'Submitted', allowedRoles: ['HOD', 'COLLEGE_ADMIN'], isInitial: true },
      { stepKey: 'HOD_APPROVED', name: 'HOD approved', allowedRoles: ['PRINCIPAL', 'COLLEGE_ADMIN'] },
      { stepKey: 'COMPLETED', name: 'Completed', allowedRoles: [], isTerminal: true, terminalStatus: 'APPROVED' as const },
      { stepKey: 'REJECTED', name: 'Rejected', allowedRoles: [], isTerminal: true, terminalStatus: 'REJECTED' as const },
      { stepKey: 'CANCELLED', name: 'Cancelled', allowedRoles: [], isTerminal: true, terminalStatus: 'CANCELLED' as const },
    ],
    transitions: [
      { fromStepKey: 'SUBMITTED', action: 'APPROVE' as const, toStepKey: 'HOD_APPROVED' },
      { fromStepKey: 'SUBMITTED', action: 'REJECT' as const, toStepKey: 'REJECTED' },
      { fromStepKey: 'SUBMITTED', action: 'CANCEL' as const, toStepKey: 'CANCELLED' },
      { fromStepKey: 'HOD_APPROVED', action: 'APPROVE' as const, toStepKey: 'COMPLETED' },
      { fromStepKey: 'HOD_APPROVED', action: 'REJECT' as const, toStepKey: 'REJECTED' },
      { fromStepKey: 'HOD_APPROVED', action: 'RETURN' as const, toStepKey: 'SUBMITTED' },
    ],
  };
}

describe('Campus OS Phase 0: shared Workflow / Approval engine', () => {
  it('definitions version automatically and require exactly one initial step', async () => {
    const c = await setup();
    const v1 = await wf.createDefinition(c.admin, twoLevelDefinitionInput(`WF-${c.tag}`));
    assert.equal(v1.version, 1);
    const v2 = await wf.createDefinition(c.admin, twoLevelDefinitionInput(`WF-${c.tag}`));
    assert.equal(v2.version, 2);
    const bad = { ...twoLevelDefinitionInput(`WFBAD-${c.tag}`), steps: twoLevelDefinitionInput(`WFBAD-${c.tag}`).steps.map((s) => ({ ...s, isInitial: false })) };
    await assert.rejects(() => wf.createDefinition(c.admin, bad), /exactly one initial step/);
    await assert.rejects(() => wf.createDefinition(c.faculty, twoLevelDefinitionInput(`WFX-${c.tag}`)), /permission/);
  });

  it('an instance cannot start against an unpublished definition, and starts at the initial step once published', async () => {
    const c = await setup();
    const def = await wf.createDefinition(c.admin, twoLevelDefinitionInput(`WFPUB-${c.tag}`));
    await assert.rejects(() => wf.startInstance(c.hod, { definitionCode: `WFPUB-${c.tag}`, entityType: 'TEST_ENTITY', entityId: 1 }), /No active workflow definition/);
    await wf.publishDefinition(c.admin, Number(def.id));
    const instance = await wf.startInstance(c.hod, { definitionCode: `WFPUB-${c.tag}`, entityType: 'TEST_ENTITY', entityId: 1 });
    assert.equal(instance.status, 'IN_PROGRESS');
    assert.equal(instance.history.length, 1);
    assert.equal(instance.history[0].action, 'SUBMIT');
  });

  it('authorized transitions progress the instance to a terminal APPROVED state', async () => {
    const c = await setup();
    const def = await wf.createDefinition(c.admin, twoLevelDefinitionInput(`WFOK-${c.tag}`));
    await wf.publishDefinition(c.admin, Number(def.id));
    const instance = await wf.startInstance(c.hod, { definitionCode: `WFOK-${c.tag}`, entityType: 'TEST_ENTITY', entityId: 2 });

    const afterHod = await wf.performAction(c.hod, Number(instance.id), { action: 'APPROVE', remarks: 'Looks good' });
    assert.equal(afterHod.status, 'IN_PROGRESS');

    const afterPrincipal = await wf.performAction(c.principal, Number(instance.id), { action: 'APPROVE' });
    assert.equal(afterPrincipal.status, 'APPROVED');
    assert.equal(afterPrincipal.history.length, 3);
    assert.deepEqual(afterPrincipal.history.map((h: any) => h.action), ['SUBMIT', 'APPROVE', 'APPROVE']);
  });

  it('rejects an unauthorized role acting on a step (role not in allowedRoles)', async () => {
    const c = await setup();
    const def = await wf.createDefinition(c.admin, twoLevelDefinitionInput(`WFDENY-${c.tag}`));
    await wf.publishDefinition(c.admin, Number(def.id));
    const instance = await wf.startInstance(c.hod, { definitionCode: `WFDENY-${c.tag}`, entityType: 'TEST_ENTITY', entityId: 3 });
    await assert.rejects(() => wf.performAction(c.faculty, Number(instance.id), { action: 'APPROVE' }), /cannot act on this workflow step/);
  });

  it('rejects an invalid action for the current step', async () => {
    const c = await setup();
    const def = await wf.createDefinition(c.admin, twoLevelDefinitionInput(`WFINV-${c.tag}`));
    await wf.publishDefinition(c.admin, Number(def.id));
    const instance = await wf.startInstance(c.hod, { definitionCode: `WFINV-${c.tag}`, entityType: 'TEST_ENTITY', entityId: 4 });
    // RETURN has no transition from SUBMITTED in this fixture.
    await assert.rejects(() => wf.performAction(c.hod, Number(instance.id), { action: 'RETURN' }), /Invalid transition/);
  });

  it('RETURN sends the instance back a step without leaving IN_PROGRESS', async () => {
    const c = await setup();
    const def = await wf.createDefinition(c.admin, twoLevelDefinitionInput(`WFRET-${c.tag}`));
    await wf.publishDefinition(c.admin, Number(def.id));
    const instance = await wf.startInstance(c.hod, { definitionCode: `WFRET-${c.tag}`, entityType: 'TEST_ENTITY', entityId: 5 });
    await wf.performAction(c.hod, Number(instance.id), { action: 'APPROVE' });
    const returned = await wf.performAction(c.principal, Number(instance.id), { action: 'RETURN', remarks: 'Needs more detail' });
    assert.equal(returned.status, 'IN_PROGRESS');
    // Back at SUBMITTED: HOD can act again.
    const reApproved = await wf.performAction(c.hod, Number(instance.id), { action: 'APPROVE' });
    assert.equal(reApproved.status, 'IN_PROGRESS');
  });

  it('terminal-state protection: no action is accepted once a terminal state is reached', async () => {
    const c = await setup();
    const def = await wf.createDefinition(c.admin, twoLevelDefinitionInput(`WFTERM-${c.tag}`));
    await wf.publishDefinition(c.admin, Number(def.id));
    const instance = await wf.startInstance(c.hod, { definitionCode: `WFTERM-${c.tag}`, entityType: 'TEST_ENTITY', entityId: 6 });
    await wf.performAction(c.hod, Number(instance.id), { action: 'REJECT' });
    await assert.rejects(() => wf.performAction(c.principal, Number(instance.id), { action: 'APPROVE' }), /already reached a terminal state/);
  });

  it('double approval / stale-state transition is blocked under concurrency via row-locked instance', async () => {
    const c = await setup();
    const def = await wf.createDefinition(c.admin, twoLevelDefinitionInput(`WFCONC-${c.tag}`));
    await wf.publishDefinition(c.admin, Number(def.id));
    const instance = await wf.startInstance(c.hod, { definitionCode: `WFCONC-${c.tag}`, entityType: 'TEST_ENTITY', entityId: 7 });

    // Two concurrent HOD approvals: only the first can legitimately move SUBMITTED -> HOD_APPROVED;
    // by the time the second acquires the lock, the step has moved and HOD is no longer an allowed actor there.
    const calls = await Promise.allSettled([
      wf.performAction(c.hod, Number(instance.id), { action: 'APPROVE' }),
      wf.performAction(c.hod, Number(instance.id), { action: 'APPROVE' }),
    ]);
    assert.equal(calls.filter((r) => r.status === 'fulfilled').length, 1);
    const final = await wf.getInstance(c.admin, Number(instance.id));
    assert.equal(final.history.filter((h: any) => h.action === 'APPROVE').length, 1);

    // Two concurrent principal approvals from HOD_APPROVED: only the first reaches the terminal state.
    const finalCalls = await Promise.allSettled([
      wf.performAction(c.principal, Number(instance.id), { action: 'APPROVE' }),
      wf.performAction(c.principal, Number(instance.id), { action: 'APPROVE' }),
    ]);
    assert.equal(finalCalls.filter((r) => r.status === 'fulfilled').length, 1);
    const settled = await wf.getInstance(c.admin, Number(instance.id));
    assert.equal(settled.status, 'APPROVED');
  });

  it('tenant isolation: cross-college actor cannot view or act on definitions/instances', async () => {
    const c = await setup();
    const def = await wf.createDefinition(c.admin, twoLevelDefinitionInput(`WFTENANT-${c.tag}`));
    await wf.publishDefinition(c.admin, Number(def.id));
    const instance = await wf.startInstance(c.hod, { definitionCode: `WFTENANT-${c.tag}`, entityType: 'TEST_ENTITY', entityId: 8 });

    await assert.rejects(() => wf.getDefinition(c.cross, Number(def.id)), /not found/);
    await assert.rejects(() => wf.getInstance(c.cross, Number(instance.id)), /not found/);
    await assert.rejects(() => wf.performAction(c.cross, Number(instance.id), { action: 'APPROVE' }), /not found/);
  });
});
