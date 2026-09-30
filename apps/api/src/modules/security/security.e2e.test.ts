import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { db } from '../../db/index.js';
import * as procurement from '../procurement/service.js';
import * as svc from './service.js';
import type { SecurityActor } from './types.js';

// MySQL DATETIME columns are timezone-naive: mysql2 reads them back as a JS
// Date in the process's local timezone. Formatting with local components
// (rather than `toISOString()`, which is UTC) keeps round-tripping
// consistent regardless of the machine's timezone offset.
function mysqlDatetime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function setup(tag = `S${Date.now()}${Math.floor(Math.random() * 10000)}`) {
  const [collegeId] = await db('colleges').insert({ name: `Security College ${tag}`, code: `SC${tag}`.slice(0, 60) });
  const [otherCollegeId] = await db('colleges').insert({ name: `Other Security College ${tag}`, code: `OSC${tag}`.slice(0, 60) });
  const [deptId] = await db('departments').insert({ college_id: collegeId, name: 'Campus Ops', code: `CO${tag}`.slice(0, 60) });

  const [adminId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'College Admin', email: `sec.admin.${tag}@test.edu`, password_hash: 'x', role: 'COLLEGE_ADMIN', is_active: true });
  const [managerId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Security Manager', email: `sec.mgr.${tag}@test.edu`, password_hash: 'x', role: 'SECURITY_MANAGER', is_active: true });
  const [guardId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Security Guard', email: `sec.guard.${tag}@test.edu`, password_hash: 'x', role: 'SECURITY_GUARD', is_active: true });
  const [facultyId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Unrelated Faculty', email: `sec.fac.${tag}@test.edu`, password_hash: 'x', role: 'FACULTY', is_active: true });
  const [hostFacultyId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Host Faculty', email: `sec.host.${tag}@test.edu`, password_hash: 'x', role: 'FACULTY', is_active: true });
  const [inactiveHostId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Inactive Host', email: `sec.inactive.${tag}@test.edu`, password_hash: 'x', role: 'FACULTY', is_active: false });
  const [crossAdminId] = await db('faculty_users').insert({ college_id: otherCollegeId, name: 'Cross Admin', email: `sec.cross.${tag}@test.edu`, password_hash: 'x', role: 'COLLEGE_ADMIN', is_active: true });
  const [studentId] = await db('students').insert({ college_id: collegeId, name: 'Host Student', usn: `USN${tag}`.slice(0, 60), email: `sec.stud.${tag}@test.edu` });

  const admin: SecurityActor = { facultyUserId: Number(adminId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'COLLEGE_ADMIN' };
  const manager: SecurityActor = { facultyUserId: Number(managerId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'SECURITY_MANAGER' };
  const guard: SecurityActor = { facultyUserId: Number(guardId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'SECURITY_GUARD' };
  const faculty: SecurityActor = { facultyUserId: Number(facultyId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'FACULTY' };
  const cross: SecurityActor = { facultyUserId: Number(crossAdminId), collegeId: Number(otherCollegeId), departmentId: null, role: 'COLLEGE_ADMIN' };

  const vendor = await procurement.createVendor(admin as any, { vendorCode: `SVEN${tag}`.slice(0, 60), name: `Security Vendor ${tag}`, categories: ['CONTRACTOR'] });

  return {
    admin, manager, guard, faculty, cross,
    hostFacultyId: Number(hostFacultyId),
    inactiveHostId: Number(inactiveHostId),
    studentId: Number(studentId),
    vendorId: Number(vendor.vendors[0].id),
    tag,
  };
}

describe('Campus OS Phase 4: Security, Gate & Visitor Management', () => {
  it('runs the full visit lifecycle: request -> approve -> check-in -> check-out', async () => {
    const c = await setup();
    const gate = await svc.createGate(c.manager, { name: `Main Gate ${c.tag}`, gateType: 'MAIN' });

    const requested = await svc.requestVisit(c.guard, {
      visitorName: `Alice ${c.tag}`, phone: '9999999999', hostFacultyId: c.hostFacultyId, gateId: Number(gate.id),
    });
    assert.equal(requested.status, 'REQUESTED');
    assert.equal(requested.events.length, 1);
    assert.equal(requested.events[0].eventType, 'REQUESTED');

    const approved = await svc.decideVisit(c.manager, Number(requested.id), { action: 'APPROVE' });
    assert.equal(approved.status, 'APPROVED');

    const checkedIn = await svc.checkInVisit(c.guard, Number(requested.id), { gateId: Number(gate.id) });
    assert.equal(checkedIn.status, 'CHECKED_IN');
    assert.ok(checkedIn.entryAt);

    const checkedOut = await svc.checkOutVisit(c.guard, Number(requested.id), {});
    assert.equal(checkedOut.status, 'CHECKED_OUT');
    assert.ok(checkedOut.exitAt);

    const eventTypes = checkedOut.events.map((e: any) => e.eventType).reverse();
    assert.deepEqual(eventTypes, ['REQUESTED', 'APPROVED', 'CHECKED_IN', 'CHECKED_OUT']);
  });

  it('rejects illegal transitions (cannot check in a rejected/cancelled/checked-out visit)', async () => {
    const c = await setup();
    const rejected = await svc.requestVisit(c.guard, { visitorName: `Bob ${c.tag}`, hostFacultyId: c.hostFacultyId });
    await svc.decideVisit(c.manager, Number(rejected.id), { action: 'REJECT', reason: 'Not expected' });
    await assert.rejects(() => svc.checkInVisit(c.guard, Number(rejected.id), {}), /terminal state|permission/);

    const cancelled = await svc.requestVisit(c.guard, { visitorName: `Carl ${c.tag}`, hostFacultyId: c.hostFacultyId });
    await svc.cancelVisit(c.guard, Number(cancelled.id), {});
    await assert.rejects(() => svc.checkInVisit(c.guard, Number(cancelled.id), {}), /terminal state/);

    // A completed (checked-out) visit is terminal — it cannot be checked in again.
    const v = await svc.requestVisit(c.guard, { visitorName: `Dee ${c.tag}`, hostFacultyId: c.hostFacultyId });
    await svc.decideVisit(c.manager, Number(v.id), { action: 'APPROVE' });
    await svc.checkInVisit(c.guard, Number(v.id), {});
    await svc.checkOutVisit(c.guard, Number(v.id), {});
    await assert.rejects(() => svc.checkInVisit(c.guard, Number(v.id), {}), /terminal state/);
  });

  it('an expired visit cannot be approved or checked in again', async () => {
    const c = await setup();
    const future = mysqlDatetime(new Date(Date.now() + 5 * 60_000));
    const requested = await svc.requestVisit(c.guard, { visitorName: `Expired ${c.tag}`, hostFacultyId: c.hostFacultyId, validUntil: future });
    const approved = await svc.decideVisit(c.manager, Number(requested.id), { action: 'APPROVE' });
    assert.equal(approved.status, 'APPROVED');

    // Push the clock forward implicitly by rewriting valid_until into the past directly
    // (simulating time elapsing after approval) and confirm check-in is then blocked.
    await db('security_visits').where({ id: Number(requested.id) }).update({ valid_until: mysqlDatetime(new Date(Date.now() - 60_000)) });
    await assert.rejects(() => svc.checkInVisit(c.guard, Number(requested.id), {}), /EXPIRED|terminal state/);
    const final = await svc.getVisit(c.manager, Number(requested.id));
    assert.equal(final.status, 'EXPIRED');
    await assert.rejects(() => svc.checkInVisit(c.guard, Number(requested.id), {}), /terminal state/);
  });

  it('two simultaneous check-in requests for the same visit: only one succeeds', async () => {
    const c = await setup();
    const requested = await svc.requestVisit(c.guard, { visitorName: `Race ${c.tag}`, hostFacultyId: c.hostFacultyId });
    await svc.decideVisit(c.manager, Number(requested.id), { action: 'APPROVE' });

    const results = await Promise.allSettled([
      svc.checkInVisit(c.guard, Number(requested.id), {}),
      svc.checkInVisit(c.guard, Number(requested.id), {}),
    ]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);

    const final = await svc.getVisit(c.manager, Number(requested.id));
    assert.equal(final.status, 'CHECKED_IN');
    assert.equal(final.events.filter((e: any) => e.eventType === 'CHECKED_IN').length, 1);
  });

  it('checkout is idempotent under concurrency: only one succeeds, no duplicate history', async () => {
    const c = await setup();
    const requested = await svc.requestVisit(c.guard, { visitorName: `RaceOut ${c.tag}`, hostFacultyId: c.hostFacultyId });
    await svc.decideVisit(c.manager, Number(requested.id), { action: 'APPROVE' });
    await svc.checkInVisit(c.guard, Number(requested.id), {});

    const results = await Promise.allSettled([
      svc.checkOutVisit(c.guard, Number(requested.id), {}),
      svc.checkOutVisit(c.guard, Number(requested.id), {}),
    ]);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    assert.equal(results.filter((r) => r.status === 'rejected').length, 1);

    const final = await svc.getVisit(c.manager, Number(requested.id));
    assert.equal(final.status, 'CHECKED_OUT');
    assert.equal(final.events.filter((e: any) => e.eventType === 'CHECKED_OUT').length, 1);
  });

  it('enforces tenant isolation / IDOR: cross-college access returns not found', async () => {
    const c = await setup();
    const gate = await svc.createGate(c.manager, { name: `Cross Gate ${c.tag}` });
    const visit = await svc.requestVisit(c.guard, { visitorName: `Iso ${c.tag}`, hostFacultyId: c.hostFacultyId });

    await assert.rejects(() => svc.getGate(c.cross, Number(gate.id)), /not found/);
    await assert.rejects(() => svc.getVisit(c.cross, Number(visit.id)), /not found/);
    await assert.rejects(() => svc.decideVisit(c.cross, Number(visit.id), { action: 'APPROVE' }), /not found/);
    await assert.rejects(() => svc.checkInVisit(c.cross, Number(visit.id), {}), /not found/);
  });

  it('enforces RBAC: SECURITY_GUARD cannot approve; unrelated FACULTY role is denied entirely', async () => {
    const c = await setup();
    const visit = await svc.requestVisit(c.guard, { visitorName: `Rbac ${c.tag}`, hostFacultyId: c.hostFacultyId });

    await assert.rejects(() => svc.decideVisit(c.guard, Number(visit.id), { action: 'APPROVE' }), /permission/);
    await assert.rejects(() => svc.requestVisit(c.faculty, { visitorName: `Denied ${c.tag}`, hostFacultyId: c.hostFacultyId }), /permission/);
    await assert.rejects(() => svc.getIncident(c.faculty, 1), /permission/);
    await assert.rejects(() => svc.createGate(c.guard, { name: `Guard Gate ${c.tag}` }), /permission/);

    const approved = await svc.decideVisit(c.manager, Number(visit.id), { action: 'APPROVE' });
    assert.equal(approved.status, 'APPROVED');
    const checkedIn = await svc.checkInVisit(c.guard, Number(visit.id), {});
    assert.equal(checkedIn.status, 'CHECKED_IN');
  });

  it('validates the host server-side: unknown or inactive host is rejected, never trusting client input', async () => {
    const c = await setup();
    await assert.rejects(
      () => svc.requestVisit(c.guard, { visitorName: `BadHost ${c.tag}`, hostFacultyId: 999999 }),
      /does not resolve/,
    );
    await assert.rejects(
      () => svc.requestVisit(c.guard, { visitorName: `InactiveHost ${c.tag}`, hostFacultyId: c.inactiveHostId }),
      /not active/,
    );
    const studentHosted = await svc.requestVisit(c.guard, { visitorName: `StudentHost ${c.tag}`, hostType: 'STUDENT', hostStudentId: c.studentId });
    assert.equal(studentHosted.hostStudentId, c.studentId);
  });

  it('vendor/contractor visits reference the canonical procurement vendor master', async () => {
    const c = await setup();
    const visit = await svc.requestVisit(c.guard, {
      visitorName: `Vendor Rep ${c.tag}`, hostFacultyId: c.hostFacultyId,
      visitType: 'CONTRACTOR', vendorId: c.vendorId,
    });
    assert.equal(visit.visitType, 'CONTRACTOR');
    assert.equal(visit.vendorName, `Security Vendor ${c.tag}`);

    await assert.rejects(
      () => svc.requestVisit(c.guard, { visitorName: `Bad Vendor ${c.tag}`, hostFacultyId: c.hostFacultyId, visitType: 'VENDOR', vendorId: 999999 }),
      /Vendor not found/,
    );
    await assert.rejects(
      () => svc.requestVisit(c.guard, { visitorName: `No Vendor Id ${c.tag}`, hostFacultyId: c.hostFacultyId, visitType: 'VENDOR' }),
      /vendorId is required/,
    );
  });

  it('logs and manages security incidents, privacy-scoped from unrelated roles', async () => {
    const c = await setup();
    const gate = await svc.createGate(c.manager, { name: `Incident Gate ${c.tag}` });
    const incident = await svc.reportIncident(c.guard, {
      category: 'UNAUTHORIZED_ENTRY', gateId: Number(gate.id), description: 'Attempted tailgating at the gate', severity: 'HIGH',
    });
    assert.equal(incident.status, 'OPEN');

    const investigating = await svc.updateIncidentStatus(c.manager, Number(incident.id), { status: 'INVESTIGATING' });
    assert.equal(investigating.status, 'INVESTIGATING');
    const resolved = await svc.updateIncidentStatus(c.manager, Number(incident.id), { status: 'RESOLVED', resolutionNotes: 'Verified false alarm' });
    assert.equal(resolved.status, 'RESOLVED');
    const closed = await svc.updateIncidentStatus(c.manager, Number(incident.id), { status: 'CLOSED' });
    assert.equal(closed.status, 'CLOSED');
    await assert.rejects(() => svc.updateIncidentStatus(c.manager, Number(incident.id), { status: 'OPEN' }), /terminal state/);

    await assert.rejects(() => svc.getIncident(c.faculty, Number(incident.id)), /permission/);
    await assert.rejects(() => svc.getIncident(c.cross, Number(incident.id)), /permission|not found/);
  });
});
