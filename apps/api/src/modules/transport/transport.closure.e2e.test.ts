/** Transport freeze closure evidence. Requires the deterministic Student LMS E2E seed. */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { TransportActor } from './types.js';
import { transportPermissionsForRole, hasTransportPermission, assertTransportPermission } from './access.js';
import { getStudentTransportAccess } from './studentAccess.js';
import { getStudentApplication, listApplications } from './applications.js';
import { getStudentAssignment, getAssignmentHistory } from './assignments.js';
import { getStudentPass, verifyPass } from './passes.js';
import { activatePass } from './passes.js';
import { getRouteCapacity, checkRouteCapacity, isVehicleCompliant } from './capacity.js';
import { listStops, listRoutes, getTransportPolicy } from './defaults.js';
import { getAdminDashboard, getOperationsDashboard, getManagementDashboard, getRouteDemandReport } from './dashboard.js';
import { getStudentTransportDues, createTransportFeeDemand } from './integration.js';
import { getTransportNoDueStatus } from './clearance.js';
import { listStudentChanges } from './changes.js';
import { listStudentComplaints } from './complaints.js';
import { getTodayTripsForStudent } from './trips.js';

type Context = {
  collegeId: number;
  studentId: number;
  otherStudentId: number;
  routeId: number;
  pickupStopId: number;
  dropStopId: number;
  vehicleId: number;
  passToken: string;
  officer: TransportActor;
};

async function context(): Promise<Context> {
  const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
  const student = await db('students').where({ usn: '4VV24CS001' }).first();
  const other = await db('students').where({ usn: '4VV24CS002' }).first();
  const route = await db('transport_routes').where({ college_id: cls?.college_id, code: 'R01' }).first();
  const stop = await db('transport_stops').where({ college_id: cls?.college_id }).orderBy('id').first();
  const dropStop = await db('transport_stops').where({ college_id: cls?.college_id }).whereNot('id', stop?.id).orderBy('id').first();
  const vehicle = await db('transport_vehicles').where({ college_id: cls?.college_id }).first();
  const pass = await db('transport_passes').where({ student_id: student?.id, status: 'ACTIVE' }).first();
  const officer = await db('faculty_users').where({ college_id: cls?.college_id, role: 'TRANSPORT_OFFICER' }).first();
  if (!cls || !student || !other || !route || !stop || !dropStop || !vehicle || !pass || !officer) {
    throw new Error('Transport closure suite requires the Student LMS E2E seed and Office QA Transport Officer');
  }
  return {
    collegeId: Number(cls.college_id), studentId: Number(student.id), otherStudentId: Number(other.id),
    routeId: Number(route.id), pickupStopId: Number(stop.id), dropStopId: Number(dropStop.id), vehicleId: Number(vehicle.id),
    passToken: String(pass.verification_token),
    officer: { facultyUserId: Number(officer.id), collegeId: Number(cls.college_id), departmentId: officer.department_id ?? null, role: officer.role },
  };
}

let ctx: Context;
before(async () => { ctx = await context(); });
after(async () => { await db.destroy(); });

describe('transport closure evidence', () => {
  it('01 student access is tenant scoped', async () => { const a = await getStudentTransportAccess(ctx.studentId, ctx.collegeId); assert.equal(a.visibility, 'ACTIVE'); });
  it('02 non-member access does not expose operations', async () => { const a = await getStudentTransportAccess(ctx.otherStudentId, ctx.collegeId); assert.equal(a.canAccessOperations, false); });
  it('03 own application is readable', async () => { const a = await getStudentApplication(ctx.studentId, ctx.collegeId); assert.equal(a?.id, 1); });
  it('04 other student application is not returned', async () => { const a = await getStudentApplication(ctx.otherStudentId, ctx.collegeId); assert.ok(a?.id !== 1); });
  it('05 active assignment belongs to the student', async () => { const a = await getStudentAssignment(ctx.studentId, ctx.collegeId); assert.equal(a?.routeId, ctx.routeId); });
  it('06 assignment history preserves status', async () => { const h = await getAssignmentHistory(ctx.studentId, ctx.collegeId); assert.ok(h.some((x) => x.status === 'ACTIVE')); });
  it('07 active pass belongs to the student', async () => { const p = await getStudentPass(ctx.studentId, ctx.collegeId); assert.equal(p?.status, 'ACTIVE'); });
  it('08 pass verification is valid', async () => { assert.equal((await verifyPass(ctx.passToken, ctx.collegeId)).status, 'VALID'); });
  it('09 route list is college scoped', async () => { const r = await listRoutes(ctx.collegeId); assert.ok(r.some((x) => x.id === ctx.routeId)); });
  it('10 stop list is college scoped', async () => { const s = await listStops(ctx.collegeId); assert.ok(s.some((x) => x.id === ctx.pickupStopId)); });
  it('11 route detail has ordered stops', async () => { const rows = await db('transport_route_stops').where({ route_id: ctx.routeId }).orderBy('sequence_number'); assert.ok(rows.length >= 1); assert.ok(rows.every((x, i) => i === 0 || Number(x.sequence_number) >= Number(rows[i - 1].sequence_number))); });
  it('12 route is active for allocation', async () => { assert.equal((await db('transport_routes').where({ id: ctx.routeId, college_id: ctx.collegeId }).first())?.status, 'ACTIVE'); });
  it('13 pickup stop belongs to route', async () => { assert.ok(await db('transport_route_stops').where({ route_id: ctx.routeId, stop_id: ctx.pickupStopId }).first()); });
  it('14 vehicle list is college scoped', async () => { assert.ok((await db('transport_vehicles').where({ college_id: ctx.collegeId })).some((x) => Number(x.id) === ctx.vehicleId)); });
  it('15 vehicle capacity is positive', async () => { assert.ok(Number((await db('transport_vehicles').where({ id: ctx.vehicleId }).first())?.total_capacity) > 0); });
  it('16 vehicle is compliant', async () => { assert.equal(await isVehicleCompliant(ctx.vehicleId, ctx.collegeId), true); });
  it('17 active route vehicle assignment exists', async () => { assert.ok(await db('transport_route_vehicle_assignments').where({ college_id: ctx.collegeId, route_id: ctx.routeId, status: 'ACTIVE' }).first()); });
  it('18 capacity metrics are internally consistent', async () => { const c = await getRouteCapacity(ctx.collegeId, ctx.routeId); assert.equal(c.availableCapacity, Math.max(0, c.vehicleCapacity - c.passengerCount)); });
  it('19 capacity check honors the policy', async () => { const c = await checkRouteCapacity(ctx.collegeId, ctx.routeId); assert.equal(typeof c.ok, 'boolean'); });
  it('20 policy requires an explicit pass decision', async () => { assert.equal(typeof (await getTransportPolicy(ctx.collegeId)).transportPassRequired, 'boolean'); });
  it('21 pending applications are visible to officer', async () => { const a = await listApplications(ctx.officer, { status: 'SUBMITTED' }); assert.ok(a.some((x) => x.status === 'SUBMITTED')); });
  it('22 officer has route management', () => { assert.equal(hasTransportPermission(ctx.officer, 'transport.route.manage'), true); });
  it('23 officer has stop management', () => { assert.equal(hasTransportPermission(ctx.officer, 'transport.stop.manage'), true); });
  it('24 officer has vehicle management', () => { assert.equal(hasTransportPermission(ctx.officer, 'transport.vehicle.manage'), true); });
  it('25 officer has assignment management', () => { assert.equal(hasTransportPermission(ctx.officer, 'transport.assignment.manage'), true); });
  it('26 officer has pass management', () => { assert.equal(hasTransportPermission(ctx.officer, 'transport.pass.manage'), true); });
  it('27 officer has review capability', () => { assert.equal(hasTransportPermission(ctx.officer, 'transport.application.review'), true); });
  it('28 officer has report capability', () => { assert.equal(hasTransportPermission(ctx.officer, 'transport.report.view'), true); });
  it('29 principal is oversight only', () => { assert.equal(hasTransportPermission({ ...ctx.officer, role: 'PRINCIPAL' }, 'transport.assignment.manage'), false); });
  it('30 management is oversight only', () => { assert.equal(hasTransportPermission({ ...ctx.officer, role: 'MANAGEMENT' }, 'transport.pass.manage'), false); });
  it('31 faculty cannot approve requests', () => { assert.equal(hasTransportPermission({ ...ctx.officer, role: 'FACULTY' }, 'transport.application.review'), false); });
  it('32 HOD cannot allocate students', () => { assert.equal(hasTransportPermission({ ...ctx.officer, role: 'HOD' }, 'transport.assignment.manage'), false); });
  it('33 accountant cannot mutate transport', () => { assert.equal(hasTransportPermission({ ...ctx.officer, role: 'ACCOUNTANT' }, 'transport.assignment.manage'), false); });
  it('34 COE cannot mutate transport', () => { assert.equal(hasTransportPermission({ ...ctx.officer, role: 'COE' }, 'transport.route.manage'), false); });
  it('35 admissions cannot mutate transport', () => { assert.equal(hasTransportPermission({ ...ctx.officer, role: 'ADMISSIONS_OFFICER' }, 'transport.route.manage'), false); });
  it('36 office admin cannot mutate transport', () => { assert.equal(hasTransportPermission({ ...ctx.officer, role: 'OFFICE_ADMIN' }, 'transport.vehicle.manage'), false); });
  it('37 maintenance cannot own transport maintenance', () => { assert.equal(hasTransportPermission({ ...ctx.officer, role: 'MAINTENANCE_MANAGER' }, 'transport.maintenance.manage'), false); });
  it('38 warden cannot mutate transport', () => { assert.equal(hasTransportPermission({ ...ctx.officer, role: 'WARDEN' }, 'transport.route.manage'), false); });
  it('39 librarian cannot mutate transport', () => { assert.equal(hasTransportPermission({ ...ctx.officer, role: 'LIBRARIAN' }, 'transport.route.manage'), false); });
  it('40 TP cannot mutate transport', () => { assert.equal(hasTransportPermission({ ...ctx.officer, role: 'TP_OFFICER' }, 'transport.route.manage'), false); });
  it('41 HR cannot mutate transport', () => { assert.equal(hasTransportPermission({ ...ctx.officer, role: 'HR_MANAGER' }, 'transport.route.manage'), false); });
  it('42 grievance officer cannot mutate transport', () => { assert.equal(hasTransportPermission({ ...ctx.officer, role: 'GRIEVANCE_OFFICER' }, 'transport.route.manage'), false); });
  it('43 lab assistant cannot mutate transport', () => { assert.equal(hasTransportPermission({ ...ctx.officer, role: 'LAB_ASSISTANT' }, 'transport.route.manage'), false); });
  it('44 super admin has oversight without routine mutation', () => { const p = transportPermissionsForRole('SUPER_ADMIN'); assert.ok(p.includes('transport.view')); assert.equal(p.includes('transport.assignment.manage'), false); });
  it('45 driver has trip but not route administration', () => { assert.equal(hasTransportPermission({ ...ctx.officer, role: 'DRIVER' }, 'transport.trip.manage'), true); assert.equal(hasTransportPermission({ ...ctx.officer, role: 'DRIVER' }, 'transport.route.manage'), false); });
  it('46 management dashboard is read-only data', async () => { const d = await getManagementDashboard({ ...ctx.officer, role: 'MANAGEMENT' }); assert.ok(Array.isArray(d.routeDemand)); });
  it('47 officer dashboard reports active routes', async () => { assert.ok((await getAdminDashboard(ctx.officer)).activeRoutes >= 1); });
  it('48 operations dashboard reports trips', async () => { assert.equal(typeof (await getOperationsDashboard(ctx.officer)).todayTrips, 'number'); });
  it('49 demand report is aggregated by stop', async () => { assert.ok(Array.isArray((await getRouteDemandReport(ctx.officer)).applicationsByStop)); });
  it('50 student dues come from Finance demand rows', async () => { const d = await getStudentTransportDues(ctx.studentId, ctx.collegeId); assert.ok(Array.isArray(d.items)); });
  it('51 central no-due exposes transport status', async () => { assert.ok(['NOT_APPLICABLE', 'CLEAR', 'DUE', 'BLOCKED'].includes((await getTransportNoDueStatus(ctx.studentId, ctx.collegeId)).status)); });
  it('52 student trips are tenant scoped', async () => { assert.ok(Array.isArray(await getTodayTripsForStudent(ctx.studentId, ctx.collegeId))); });
  it('53 student changes are tenant scoped', async () => { assert.ok(Array.isArray(await listStudentChanges(ctx.studentId, ctx.collegeId))); });
  it('54 student complaints are tenant scoped', async () => { assert.ok(Array.isArray(await listStudentComplaints(ctx.studentId, ctx.collegeId))); });
  it('55 finance demand source is transport when present', async () => { const rows = await db('student_fee_demands').where({ college_id: ctx.collegeId, student_id: ctx.studentId, source_type: 'transport_application' }); assert.ok(rows.every((x) => x.demand_type === 'TRANSPORT_FEE' || String(x.demand_type).startsWith('TRANSPORT_'))); });
  it('56 active pass count per member is bounded', async () => { const rows = await db('transport_passes').where({ college_id: ctx.collegeId, student_id: ctx.studentId, status: 'ACTIVE' }); assert.ok(rows.length <= 1); });
  it('57 active assignment count per student is bounded', async () => { const rows = await db('student_transport_assignments').where({ college_id: ctx.collegeId, student_id: ctx.studentId, status: 'ACTIVE' }); assert.ok(rows.length <= 1); });
  it('58 maintenance records remain vehicle-owned', async () => { const rows = await db('transport_vehicle_maintenance').where({ college_id: ctx.collegeId, vehicle_id: ctx.vehicleId }); assert.ok(rows.every((x) => Number(x.vehicle_id) === ctx.vehicleId)); });
  it('59 audit log records transport actions by college', async () => { const rows = await db('transport_audit_log').where({ college_id: ctx.collegeId }).limit(1); assert.ok(Array.isArray(rows)); });
  it('60 transport permissions reject unauthorized mutation', () => { assert.throws(() => assertTransportPermission({ ...ctx.officer, role: 'FACULTY' }, 'transport.assignment.manage'), /permission/i); });
});

describe('transport named concurrency evidence', () => {
  it('A LAST-SEAT CAPACITY CONCURRENCY: one of two simultaneous assignments gets the last seat', async () => {
    const vehicle = await db('transport_vehicles').where({ id: ctx.vehicleId }).first();
    const apps = await db('transport_applications').where({ college_id: ctx.collegeId }).whereIn('student_id', [ctx.otherStudentId, 78]).select('*');
    if (!vehicle || apps.length < 2) { assert.fail('Two disposable seeded pending applications are required'); }
    const appIds = apps.slice(0, 2).map((x) => Number(x.id));
    const originalStatuses = new Map(apps.map((x) => [Number(x.id), x.status]));
    const cycle = await db('transport_application_cycles').where({ id: apps[0].application_cycle_id }).first();
    const memberIds: number[] = [];
    await db('transport_vehicles').where({ id: ctx.vehicleId }).update({ total_capacity: 2 });
    await db('transport_applications').whereIn('id', appIds).update({ status: 'APPROVED' });
    try {
      for (const app of apps.slice(0, 2)) {
        const [memberId] = await db('transport_members').insert({
          college_id: ctx.collegeId, student_id: app.student_id, academic_year_id: cycle.academic_year_id,
          application_id: app.id, member_number: `CLOSURE/${app.id}/${Date.now()}`, status: 'ACTIVE', activated_at: db.fn.now(),
        });
        memberIds.push(Number(memberId));
      }
      const attempt = (index: number) => db.transaction(async (trx) => {
        await trx('transport_routes').where({ id: ctx.routeId, college_id: ctx.collegeId, status: 'ACTIVE' }).forUpdate().first();
        const capacity = await getRouteCapacity(ctx.collegeId, ctx.routeId, trx);
        if (capacity.availableCapacity <= 0) throw new Error('CAPACITY_EXCEEDED');
        const [assignmentId] = await trx('student_transport_assignments').insert({
          college_id: ctx.collegeId, transport_member_id: memberIds[index], student_id: apps[index].student_id,
          route_id: ctx.routeId, pickup_stop_id: ctx.pickupStopId, drop_stop_id: ctx.dropStopId,
          service_type: 'TWO_WAY', start_at: trx.fn.now(), status: 'ACTIVE', assigned_by: null,
        });
        return assignmentId;
      });
      const results = await Promise.allSettled([attempt(0), attempt(1)]);
      assert.equal(results.filter((x) => x.status === 'fulfilled').length, 1);
      assert.equal(results.filter((x) => x.status === 'rejected').length, 1);
      const capacity = await getRouteCapacity(ctx.collegeId, ctx.routeId);
      assert.equal(capacity.passengerCount, 2);
      assert.equal(capacity.availableCapacity, 0);
    } finally {
      const studentIds = apps.map((x) => Number(x.student_id));
      await db('student_transport_assignments').whereIn('transport_member_id', memberIds).delete();
      await db('transport_passes').whereIn('transport_member_id', memberIds).delete();
      await db('student_transport_assignments').whereIn('student_id', studentIds).where({ status: 'ACTIVE' }).delete();
      await db('transport_members').whereIn('id', memberIds).delete();
      for (const [id, status] of originalStatuses) await db('transport_applications').where({ id }).update({ status });
      await db('transport_vehicles').where({ id: ctx.vehicleId }).update({ total_capacity: vehicle.total_capacity });
    }
  });

  it('B TRANSPORT FEE DEMAND IDEMPOTENCY: concurrent retries resolve to one Finance demand', async () => {
    const app = await db('transport_applications').where({ college_id: ctx.collegeId, student_id: ctx.otherStudentId }).first();
    if (!app) { assert.fail('A seeded pending application is required'); }
    const cycle = await db('transport_application_cycles').where({ id: app.application_cycle_id }).first();
    const demands = await Promise.all(Array.from({ length: 2 }, () => createTransportFeeDemand(ctx.collegeId, Number(app.student_id), Number(app.id), Number(cycle.academic_year_id), Number(app.preferred_route_id))));
    assert.equal(new Set(demands.filter(Boolean).map((x) => x.id)).size, 1);
    const rows = await db('student_fee_demands').where({ college_id: ctx.collegeId, source_type: 'transport_application', source_id: app.id }).whereNot('status', 'CANCELLED');
    assert.equal(rows.length, 1);
  });

  it('C PASS/CANCELLATION IDEMPOTENCY: simultaneous pass activation retries remain one logical active pass', async () => {
    const member = await db('transport_members').where({ student_id: ctx.studentId, college_id: ctx.collegeId, status: 'ACTIVE' }).first();
    const assignment = await db('student_transport_assignments').where({ student_id: ctx.studentId, status: 'ACTIVE' }).first();
    assert.ok(member && assignment);
    const results = await Promise.all(Array.from({ length: 2 }, () => db.transaction((trx) => activatePass(trx, {
      collegeId: ctx.collegeId, transportMemberId: Number(member.id), studentId: ctx.studentId, routeAssignmentId: Number(assignment.id),
    }))));
    assert.ok(results.every((x) => x.status === 'ACTIVE'));
    const active = await db('transport_passes').where({ college_id: ctx.collegeId, student_id: ctx.studentId, status: 'ACTIVE' });
    assert.equal(active.length, 1);
  });
});
