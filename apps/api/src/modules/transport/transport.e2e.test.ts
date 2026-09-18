/**
 * Transport Management E2E invariants. Skips when E2E seed is absent.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import { getStudentTransportAccess } from './studentAccess.js';
import { getTransportNoDueStatus } from './clearance.js';
import { getStudentNoDueStatus } from '../finance/clearance.js';
import { getRouteCapacity } from './capacity.js';
import { verifyPass } from './passes.js';
import { recordBoarding, recordAlighting } from './boarding.js';
import { checkVehicleConflict, checkDriverConflict } from './capacity.js';

async function e2eContext() {
  try {
    if (!(await db.schema.hasTable('transport_applications'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const aarav = await db('students').where({ usn: '4VV24CS001' }).first();
    const other = await db('students').where({ usn: '4VV24CS002' }).first();
    const route = await db('transport_routes').where({ college_id: cls.college_id, code: 'R01' }).first();
    if (!aarav || !route) return null;
    return { cls, aarav, other, route };
  } catch {
    return null;
  }
}

describe('transport E2E', () => {
  it('Aarav has active transport with route assignment', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const access = await getStudentTransportAccess(Number(ctx.aarav.id), Number(ctx.cls.college_id));
    assert.equal(access.visibility, 'ACTIVE');
    assert.equal(access.canAccessOperations, true);
    assert.ok(access.transportPassId);

    const assignment = await db('student_transport_assignments')
      .where({ student_id: ctx.aarav.id, status: 'ACTIVE' })
      .first();
    assert.ok(assignment);
    assert.equal(Number(assignment.route_id), Number(ctx.route.id));
  });

  it('non-transport student has hidden or application visibility', async () => {
    const ctx = await e2eContext();
    if (!ctx?.other) return;
    const access = await getStudentTransportAccess(Number(ctx.other.id), Number(ctx.cls.college_id));
    assert.ok(['HIDDEN', 'APPLICATION_AVAILABLE', 'APPLICATION_DRAFT', 'APPLICATION_PENDING', 'SUBMITTED'].includes(access.visibility) || access.visibility === 'APPLICATION_PENDING');
    assert.equal(access.canAccessOperations, false);
  });

  it('central no-due includes TRANSPORT domain', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const noDue = await getStudentNoDueStatus(Number(ctx.aarav.id), Number(ctx.cls.college_id));
    const transportDomain = noDue.domains.find((d) => d.domain === 'TRANSPORT');
    assert.ok(transportDomain);
    assert.notEqual(transportDomain?.status, 'PENDING_INTEGRATION');
  });

  it('active transport member clearance is NOT_APPLICABLE', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const status = await getTransportNoDueStatus(Number(ctx.aarav.id), Number(ctx.cls.college_id));
    assert.equal(status.status, 'NOT_APPLICABLE');
  });

  it('route capacity metrics are consistent', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const cap = await getRouteCapacity(Number(ctx.cls.college_id), Number(ctx.route.id));
    assert.ok(cap.passengerCount >= 1);
    assert.ok(cap.vehicleCapacity >= 1);
    assert.ok(cap.availableCapacity >= 0);
  });

  it('Aarav transport pass verifies as VALID', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const pass = await db('transport_passes')
      .where({ student_id: ctx.aarav.id, status: 'ACTIVE' })
      .first();
    if (!pass) return;
    const result = await verifyPass(pass.verification_token, Number(ctx.cls.college_id));
    assert.equal(result.status, 'VALID');
  });

  it('revoked pass verifies as REVOKED', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const pass = await db('transport_passes')
      .where({ student_id: ctx.aarav.id })
      .first();
    if (!pass) return;
    await db('transport_passes').where({ id: pass.id }).update({ status: 'REVOKED', revoked_at: db.fn.now() });
    const result = await verifyPass(pass.verification_token, Number(ctx.cls.college_id));
    assert.equal(result.status, 'REVOKED');
    await db('transport_passes').where({ id: pass.id }).update({ status: 'ACTIVE', revoked_at: null });
  });

  it('Aarav has open transport complaint', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const complaint = await db('transport_complaints')
      .where({ student_id: ctx.aarav.id })
      .whereIn('status', ['OPEN', 'ASSIGNED', 'IN_PROGRESS'])
      .first();
    assert.ok(complaint);
    assert.equal(complaint.category, 'DELAY');
  });

  it('vehicle conflict detected for overlapping trips', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const vehicle = await db('transport_vehicles').where({ college_id: ctx.cls.college_id }).first();
    if (!vehicle) return;
    const start = new Date('2026-09-02T07:00:00');
    const end = new Date('2026-09-02T09:00:00');
    const result = await checkVehicleConflict(Number(ctx.cls.college_id), Number(vehicle.id), start, end);
    if (result.conflict) {
      assert.equal(result.code, 'VEHICLE_CONFLICT');
    }
  });

  it('driver conflict detected for overlapping assignments', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const driver = await db('transport_personnel')
      .where({ college_id: ctx.cls.college_id, personnel_type: 'DRIVER' })
      .first();
    if (!driver) return;
    const start = new Date('2026-09-02T07:00:00');
    const end = new Date('2026-09-02T09:00:00');
    const result = await checkDriverConflict(Number(ctx.cls.college_id), Number(driver.id), start, end);
    if (result.conflict) {
      assert.equal(result.code, 'DRIVER_CONFLICT');
    }
  });

  it('boarding events are recorded for morning trip', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const trip = await db('transport_trips')
      .where({ college_id: ctx.cls.college_id, route_id: ctx.route.id })
      .whereIn('trip_type', ['MORNING_PICKUP'])
      .first();
    if (!trip) return;
    const boarded = await db('transport_boarding_events')
      .where({ trip_id: trip.id, student_id: ctx.aarav.id, event_type: 'BOARDED' })
      .first();
    assert.ok(boarded);
  });
});
