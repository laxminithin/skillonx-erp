/**
 * Phase 3 — Facilities & Maintenance: preventive-maintenance E2E invariants.
 * Self-contained (own college/actors/assets — same pattern as
 * assetManagement.e2e.test.ts), so it never depends on the shared E2E seed.
 *
 * Covers: plan CRUD + RBAC, idempotent generation, concurrent-generation
 * safety (no duplicate occurrence/ticket), tenant isolation, asset FK linkage
 * + warranty/AMC surfacing on the ticket, additive asset-history traceability,
 * and failure-recovery (retry a ticket for an occurrence that never got one).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { db } from '../../db/index.js';
import type { MaintActor } from './types.js';
import * as preventive from './preventive.js';
import * as tickets from './tickets.js';
import * as assets from '../assetManagement/service.js';
import type { AssetActor } from '../assetManagement/types.js';

async function setup(tag = `P${Date.now()}${Math.floor(Math.random() * 10000)}`) {
  const [collegeId] = await db('colleges').insert({ name: `Preventive College ${tag}`, code: `PC${tag}`.slice(0, 60) });
  const [otherCollegeId] = await db('colleges').insert({ name: `Other Preventive College ${tag}`, code: `OPC${tag}`.slice(0, 60) });
  const [deptId] = await db('departments').insert({ college_id: collegeId, name: 'Facilities', code: `FA${tag}`.slice(0, 60) });

  const mkFaculty = async (name: string, role: string, cId = collegeId) => {
    const [id] = await db('faculty_users').insert({ college_id: cId, department_id: role === 'FACULTY' || role === 'MAINTENANCE_MANAGER' ? deptId : null, name, email: `${name.toLowerCase().replace(/\s+/g, '.')}.${tag}@test.edu`, password_hash: 'x', role, is_active: true });
    return Number(id);
  };

  const managerId = await mkFaculty('Facilities Manager', 'MAINTENANCE_MANAGER');
  const technicianId = await mkFaculty('Maintenance Tech', 'MAINTENANCE_STAFF');
  const crossManagerId = await mkFaculty('Cross Manager', 'MAINTENANCE_MANAGER', otherCollegeId);

  const manager: MaintActor = { kind: 'FACULTY', facultyUserId: managerId, collegeId: Number(collegeId), departmentId: Number(deptId), role: 'MAINTENANCE_MANAGER', name: 'Facilities Manager' };
  const technician: MaintActor = { kind: 'FACULTY', facultyUserId: technicianId, collegeId: Number(collegeId), departmentId: null, role: 'MAINTENANCE_STAFF', name: 'Maintenance Tech' };
  const crossManager: MaintActor = { kind: 'FACULTY', facultyUserId: crossManagerId, collegeId: Number(otherCollegeId), departmentId: null, role: 'MAINTENANCE_MANAGER', name: 'Cross Manager' };

  const assetManagerActor: AssetActor = { facultyUserId: managerId, collegeId: Number(collegeId), departmentId: Number(deptId), role: 'MAINTENANCE_MANAGER' };
  const asset = await assets.registerAsset(assetManagerActor, {
    assetTag: `AC-${tag}`, name: 'Rooftop AC Unit', category: 'HVAC',
    warrantyEndDate: '2027-01-01', amcReference: `AMC-${tag}`, amcExpiryDate: '2026-12-31',
  } as never);

  return { collegeId: Number(collegeId), manager, technician, crossManager, assetId: Number(asset.id), tag };
}

describe('Campus OS Phase 3: preventive maintenance (proven gap only)', () => {
  it('creates a plan and rejects non-manager roles (RBAC)', async () => {
    const c = await setup();
    const plan = await preventive.createPlan(c.manager, { name: `Quarterly AC Service ${c.tag}`, assetId: c.assetId, frequencyUnit: 'MONTHS', frequencyValue: 3, nextDueDate: '2020-01-01' });
    assert.equal(plan.status, 'ACTIVE');
    assert.equal(plan.assetId, c.assetId);

    await assert.rejects(() => preventive.createPlan(c.technician, { name: 'Denied plan', nextDueDate: '2020-01-01' }), /permission/);
    await assert.rejects(() => preventive.listPlans(c.technician), /permission/);
  });

  it('supports asset-less plans (facility-level, no equipment reference)', async () => {
    const c = await setup();
    const plan = await preventive.createPlan(c.manager, { name: `Building B fire extinguisher check ${c.tag}`, frequencyUnit: 'MONTHS', frequencyValue: 6, nextDueDate: '2020-01-01' });
    assert.equal(plan.assetId, null);
  });

  it('generation is idempotent: a due plan generates exactly one ticket, then advances past due', async () => {
    const c = await setup();
    const plan = await preventive.createPlan(c.manager, { name: `AC service ${c.tag}`, assetId: c.assetId, frequencyUnit: 'MONTHS', frequencyValue: 1, nextDueDate: '2020-01-01' });

    const first = await preventive.generateDue(c.manager, { asOf: '2020-01-01' });
    assert.equal(first.results.find((r) => r.planId === plan.id)?.generated, true);

    const second = await preventive.generateDue(c.manager, { asOf: '2020-01-01' });
    // The plan's next_due_date already advanced past 2020-01-01, so a second call
    // with the same asOf finds nothing due for it at all — not even attempted.
    assert.equal(second.results.find((r) => r.planId === plan.id), undefined);

    const occurrences = await preventive.listOccurrences(c.manager, plan.id);
    assert.equal(occurrences.filter((o) => o.status === 'GENERATED').length, 1);
    const ticketCount = await db('service_tickets').where({ college_id: c.collegeId, source_entity_type: 'PREVENTIVE_PLAN', source_entity_id: plan.id }).count<{ n: number }[]>('* as n');
    assert.equal(Number(ticketCount[0].n), 1);

    const updatedPlan = await preventive.getPlan(c.manager, plan.id);
    assert.ok(new Date(updatedPlan.nextDueDate).getTime() > new Date('2020-01-01').getTime());
  });

  it('concurrent generation for the same due plan never double-generates', async () => {
    const c = await setup();
    const plan = await preventive.createPlan(c.manager, { name: `Concurrent plan ${c.tag}`, assetId: c.assetId, frequencyUnit: 'MONTHS', frequencyValue: 1, nextDueDate: '2020-01-01' });

    const outcomes = await Promise.allSettled([
      preventive.generateDue(c.manager, { asOf: '2020-01-01' }),
      preventive.generateDue(c.manager, { asOf: '2020-01-01' }),
      preventive.generateDue(c.manager, { asOf: '2020-01-01' }),
    ]);
    for (const o of outcomes) assert.equal(o.status, 'fulfilled');

    const ticketCount = await db('service_tickets').where({ college_id: c.collegeId, source_entity_type: 'PREVENTIVE_PLAN', source_entity_id: plan.id }).count<{ n: number }[]>('* as n');
    assert.equal(Number(ticketCount[0].n), 1, 'exactly one ticket must be generated despite concurrent calls');

    const occurrenceCount = await db('maintenance_preventive_occurrences').where({ college_id: c.collegeId, plan_id: plan.id }).count<{ n: number }[]>('* as n');
    assert.equal(Number(occurrenceCount[0].n), 1, 'exactly one occurrence row must exist despite concurrent calls');
  });

  it('tenant isolation: a plan/occurrence cannot be read or generated cross-college', async () => {
    const c = await setup();
    const plan = await preventive.createPlan(c.manager, { name: `Isolated plan ${c.tag}`, nextDueDate: '2020-01-01' });

    await assert.rejects(() => preventive.getPlan(c.crossManager, plan.id), /not found/);
    await assert.rejects(() => preventive.updatePlan(c.crossManager, plan.id, { status: 'ENDED' }), /not found/);
    await assert.rejects(() => preventive.listOccurrences(c.crossManager, plan.id), /not found/);

    const crossGenerate = await preventive.generateDue(c.crossManager, { asOf: '2020-01-01' });
    assert.equal(crossGenerate.results.length, 0, 'the other college has no due plans of its own');
  });

  it('a generated ticket carries the canonical asset FK and surfaces warranty/AMC for operator decision support', async () => {
    const c = await setup();
    const plan = await preventive.createPlan(c.manager, { name: `AMC plan ${c.tag}`, assetId: c.assetId, frequencyUnit: 'YEARS', frequencyValue: 1, nextDueDate: '2020-01-01' });
    await preventive.generateDue(c.manager, { asOf: '2020-01-01' });

    const row = await db('service_tickets').where({ college_id: c.collegeId, source_entity_type: 'PREVENTIVE_PLAN', source_entity_id: plan.id }).first();
    const ticket = await tickets.getTicket(c.manager, Number(row.id));
    assert.equal(ticket.assetId, c.assetId);
    assert.ok(ticket.asset);
    assert.equal(ticket.asset!.amcReference, `AMC-${c.tag}`);
  });

  it('maintenance activity against an asset is traceable from the asset history (additive, never a status mutation)', async () => {
    const c = await setup();
    const ticket = await tickets.createTicket(c.manager, { title: 'AC not cooling', assetId: c.assetId });
    let history = await assets.getAsset({ facultyUserId: c.manager.facultyUserId!, collegeId: c.collegeId, departmentId: null, role: 'MAINTENANCE_MANAGER' }, c.assetId);
    assert.ok(history.history.some((h: never) => (h as { action: string }).action === 'MAINTENANCE_TICKET_LINKED'));
    assert.equal(history.status, 'IN_STOCK', 'linking a ticket must never mutate asset status directly');

    await tickets.resolveTicket(c.manager, Number(ticket.id), { resolutionSummary: 'Recharged refrigerant' });
    history = await assets.getAsset({ facultyUserId: c.manager.facultyUserId!, collegeId: c.collegeId, departmentId: null, role: 'MAINTENANCE_MANAGER' }, c.assetId);
    assert.ok(history.history.some((h: never) => (h as { action: string }).action === 'MAINTENANCE_COMPLETED'));
  });

  it('failure recovery: an occurrence recorded without a ticket can be retried without creating a duplicate occurrence', async () => {
    const c = await setup();
    const plan = await preventive.createPlan(c.manager, { name: `Recovery plan ${c.tag}`, nextDueDate: '2020-01-01' });

    // Simulate the "occurrence recorded, ticket creation failed" partial failure directly.
    const [occId] = await db('maintenance_preventive_occurrences').insert({ college_id: c.collegeId, plan_id: plan.id, occurrence_date: '2020-01-01', status: 'PENDING' });

    const ticket = await preventive.retryOccurrenceTicket(c.manager, Number(occId));
    assert.ok(ticket.ticketNo);

    await assert.rejects(() => preventive.retryOccurrenceTicket(c.manager, Number(occId)), /already exists/);

    const occurrenceCount = await db('maintenance_preventive_occurrences').where({ plan_id: plan.id }).count<{ n: number }[]>('* as n');
    assert.equal(Number(occurrenceCount[0].n), 1, 'retry must reuse the existing occurrence row, never duplicate it');
  });
});
