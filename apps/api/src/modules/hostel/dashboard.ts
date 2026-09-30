import { db } from '../../db/index.js';
import type { HostelActor } from './types.js';
import { assertHostelPermission, assertManagementReadOnly, assertWardenHostelAccess, getWardenHostelIds } from './access.js';
import { getAllocationHistory, getHostelCapacity, getStudentRoom } from './allocations.js';
import { getStudentHostelDues } from './integration.js';
import { getStudentClearance } from './clearance.js';

export async function wardenDashboard(actor: HostelActor, hostelId?: number) {
  assertHostelPermission(actor, 'hostel.view');
  if (hostelId) await assertWardenHostelAccess(actor, hostelId);
  const hostelIds = hostelId ? [hostelId] : await getWardenHostelIds(actor);
  if (hostelIds.length === 0) {
    return {
      capacity: { totalBeds: 0, usableBeds: 0, occupiedBeds: 0, reservedBeds: 0, availableBeds: 0, maintenanceBeds: 0, blockedBeds: 0, occupancyPercent: 0 },
      applicationsPending: 0,
      waitlistedStudents: 0,
      allocationPending: 0,
      residentsActive: 0,
      residentsCurrentlyOutside: 0,
      activeOutpasses: 0,
      lateReturns: 0,
      pendingLeave: 0,
      visitorsCurrentlyInside: 0,
      openComplaints: 0,
      maintenanceBeds: 0,
      pendingVacating: 0,
    };
  }

  const capacity = { totalBeds: 0, usableBeds: 0, occupiedBeds: 0, reservedBeds: 0, availableBeds: 0, maintenanceBeds: 0, blockedBeds: 0, occupancyPercent: 0 };
  const capacities = await Promise.all(hostelIds.map((id) => getHostelCapacity(actor.collegeId, id)));
  for (const c of capacities) {
    capacity.totalBeds += c.totalBeds;
    capacity.usableBeds += c.usableBeds;
    capacity.occupiedBeds += c.occupiedBeds;
    capacity.reservedBeds += c.reservedBeds;
    capacity.availableBeds += c.availableBeds;
    capacity.maintenanceBeds += c.maintenanceBeds;
    capacity.blockedBeds += c.blockedBeds;
  }
  capacity.occupancyPercent = capacity.usableBeds > 0
    ? Math.round((capacity.occupiedBeds / capacity.usableBeds) * 100)
    : 0;

  let appQ = db('hostel_applications').where({ college_id: actor.collegeId }).whereIn('status', ['SUBMITTED', 'UNDER_REVIEW']);
  let waitQ = db('hostel_waitlist_entries').where({ college_id: actor.collegeId, status: 'ACTIVE' });
  let allocPendingQ = db('hostel_applications').where({ college_id: actor.collegeId, status: 'APPROVED' });
  let residentsQ = db('hostel_residents').where({ college_id: actor.collegeId, status: 'ACTIVE' });
  let outsideQ = db('hostel_outpasses').where({ college_id: actor.collegeId, status: 'ACTIVE' });
  let overdueQ = db('hostel_outpasses').where({ college_id: actor.collegeId }).whereIn('status', ['ACTIVE', 'OVERDUE']).where('expected_return_at', '<', new Date());
  let leaveQ = db('hostel_leave_requests').where({ college_id: actor.collegeId, status: 'APPROVED' });
  let visitorsQ = db('hostel_visitor_visits').where({ college_id: actor.collegeId, status: 'CHECKED_IN' });
  let complaintsQ = db('hostel_complaints').where({ college_id: actor.collegeId }).whereIn('status', ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING']);
  let vacatingQ = db('hostel_vacating_requests').where({ college_id: actor.collegeId }).whereNotIn('status', ['COMPLETED', 'CANCELLED', 'REJECTED']);

  appQ = appQ.whereIn('preferred_hostel_id', hostelIds);
  waitQ = waitQ.whereIn('hostel_id', hostelIds);
  allocPendingQ = allocPendingQ.whereIn('preferred_hostel_id', hostelIds);
  residentsQ = residentsQ.whereIn('hostel_id', hostelIds);
  complaintsQ = complaintsQ.whereIn('hostel_id', hostelIds);
  vacatingQ = vacatingQ.whereIn('resident_id', db('hostel_residents').whereIn('hostel_id', hostelIds).select('id'));
  outsideQ = outsideQ.whereIn('resident_id', db('hostel_residents').whereIn('hostel_id', hostelIds).select('id'));
  overdueQ = overdueQ.whereIn('resident_id', db('hostel_residents').whereIn('hostel_id', hostelIds).select('id'));
  leaveQ = leaveQ.whereIn('resident_id', db('hostel_residents').whereIn('hostel_id', hostelIds).select('id'));
  visitorsQ = visitorsQ.whereIn('resident_id', db('hostel_residents').whereIn('hostel_id', hostelIds).select('id'));

  const [pendingApps, waitlisted, allocPending, activeResidents, outside, overdue, pendingLeave, visitorsInside, openComplaints, pendingVacating] = await Promise.all([
    appQ.count({ c: '*' }).first(),
    waitQ.count({ c: '*' }).first(),
    allocPendingQ.count({ c: '*' }).first(),
    residentsQ.count({ c: '*' }).first(),
    outsideQ.count({ c: '*' }).first(),
    overdueQ.count({ c: '*' }).first(),
    leaveQ.count({ c: '*' }).first(),
    visitorsQ.count({ c: '*' }).first(),
    complaintsQ.count({ c: '*' }).first(),
    vacatingQ.count({ c: '*' }).first(),
  ]);

  return {
    capacity,
    applicationsPending: Number(pendingApps?.c ?? 0),
    waitlistedStudents: Number(waitlisted?.c ?? 0),
    allocationPending: Number(allocPending?.c ?? 0),
    residentsActive: Number(activeResidents?.c ?? 0),
    residentsCurrentlyOutside: Number(outside?.c ?? 0),
    activeOutpasses: Number(outside?.c ?? 0),
    lateReturns: Number(overdue?.c ?? 0),
    pendingLeave: Number(pendingLeave?.c ?? 0),
    visitorsCurrentlyInside: Number(visitorsInside?.c ?? 0),
    openComplaints: Number(openComplaints?.c ?? 0),
    maintenanceBeds: capacity.maintenanceBeds,
    pendingVacating: Number(pendingVacating?.c ?? 0),
  };
}

export async function managementDashboard(actor: HostelActor) {
  assertManagementReadOnly(actor);
  const capacity = await getHostelCapacity(actor.collegeId);
  const hostels = await db('hostels').where({ college_id: actor.collegeId, status: 'ACTIVE' }).count({ c: '*' }).first();

  const [applications, approved, waitlisted, residents, openComplaints, pendingVacating] = await Promise.all([
    db('hostel_applications').where({ college_id: actor.collegeId }).count({ c: '*' }).first(),
    db('hostel_applications').where({ college_id: actor.collegeId, status: 'APPROVED' }).count({ c: '*' }).first(),
    db('hostel_waitlist_entries').where({ college_id: actor.collegeId, status: 'ACTIVE' }).count({ c: '*' }).first(),
    db('hostel_residents').where({ college_id: actor.collegeId, status: 'ACTIVE' }).count({ c: '*' }).first(),
    db('hostel_complaints').where({ college_id: actor.collegeId }).whereIn('status', ['OPEN', 'ASSIGNED', 'IN_PROGRESS']).count({ c: '*' }).first(),
    db('hostel_vacating_requests').where({ college_id: actor.collegeId }).whereNotIn('status', ['COMPLETED', 'CANCELLED']).count({ c: '*' }).first(),
  ]);

  return {
    totalHostels: Number(hostels?.c ?? 0),
    capacity,
    applications: Number(applications?.c ?? 0),
    approved: Number(approved?.c ?? 0),
    waitlisted: Number(waitlisted?.c ?? 0),
    residents: Number(residents?.c ?? 0),
    openComplaints: Number(openComplaints?.c ?? 0),
    pendingVacating: Number(pendingVacating?.c ?? 0),
    readOnly: true,
  };
}

export type ResidentListFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  hostelId?: number;
  blockId?: number;
  floorId?: number;
  roomId?: number;
  programme?: string;
  semester?: string;
  status?: string;
};

export async function listResidents(actor: HostelActor, filters: ResidentListFilters = {}) {
  assertHostelPermission(actor, 'hostel.resident.manage');
  const page = Math.max(1, Math.trunc(filters.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.trunc(filters.pageSize ?? 25)));
  if (filters.hostelId) await assertWardenHostelAccess(actor, filters.hostelId);
  const hostelIds = filters.hostelId ? [filters.hostelId] : await getWardenHostelIds(actor);
  if (hostelIds.length === 0) return { residents: [], pagination: { page, pageSize, total: 0, totalPages: 0 } };
  let q = db('hostel_residents as r')
    .join('students as s', 's.id', 'r.student_id')
    .join('hostels as h', 'h.id', 'r.hostel_id')
    .leftJoin('programs as p', 'p.id', 's.program_id')
    .leftJoin('semesters as sem', 'sem.id', 's.semester_id')
    .leftJoin('hostel_bed_allocations as a', function join() {
      this.on('a.resident_id', '=', 'r.id').andOn('a.status', '=', db.raw('?', ['ACTIVE']));
    })
    .leftJoin('hostel_rooms as rm', 'rm.id', 'a.room_id')
    .leftJoin('hostel_blocks as bl', 'bl.id', 'rm.block_id')
    .leftJoin('hostel_floors as fl', 'fl.id', 'rm.floor_id')
    .leftJoin('hostel_beds as b', 'b.id', 'a.bed_id')
    .where({ 'r.college_id': actor.collegeId })
    .whereIn('r.status', ['ACTIVE', 'TEMPORARILY_AWAY', 'VACATING']);

  q = q.whereIn('r.hostel_id', hostelIds);
  if (filters.status) q = q.where('r.status', filters.status);
  if (filters.blockId) q = q.where('rm.block_id', filters.blockId);
  if (filters.floorId) q = q.where('rm.floor_id', filters.floorId);
  if (filters.roomId) q = q.where('rm.id', filters.roomId);
  if (filters.programme) {
    const programme = `%${filters.programme.trim()}%`;
    q = q.where((builder) => builder.where('p.name', 'like', programme).orWhere('p.code', 'like', programme));
  }
  if (filters.semester) {
    q = q.where((builder) => builder.where('sem.label', filters.semester).orWhere('s.semester', filters.semester));
  }
  if (filters.search?.trim()) {
    const search = `%${filters.search.trim()}%`;
    q = q.where((builder) => builder
      .where('s.name', 'like', search)
      .orWhere('s.usn', 'like', search)
      .orWhere('r.resident_number', 'like', search)
      .orWhere('rm.room_number', 'like', search)
      .orWhere('b.bed_code', 'like', search));
  }

  const count = await q.clone().clearSelect().clearOrder().countDistinct<{ total: number }[]>('r.id as total');
  const total = Number(count[0]?.total ?? 0);
  const rows = await q
    .select('r.*', 's.usn', 's.name as student_name', 'h.name as hostel_name', 'rm.room_number', 'b.bed_code', 'bl.id as block_id', 'bl.code as block_code', 'fl.id as floor_id', 'fl.floor_number', 'p.name as program_name', 'sem.label as semester_name')
    .orderBy('s.usn')
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const residents = rows.map((r) => ({
    id: Number(r.id),
    studentId: Number(r.student_id),
    usn: r.usn,
    studentName: r.student_name,
    hostelName: r.hostel_name,
    residentNumber: r.resident_number,
    status: r.status,
    roomNumber: r.room_number,
    bedCode: r.bed_code,
    admittedAt: r.admitted_at,
    blockId: r.block_id == null ? null : Number(r.block_id),
    blockCode: r.block_code,
    floorId: r.floor_id == null ? null : Number(r.floor_id),
    floorNumber: r.floor_number,
    programName: r.program_name,
    semesterName: r.semester_name,
  }));
  return { residents, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

export async function wardenReportSummary(actor: HostelActor, hostelId?: number) {
  assertHostelPermission(actor, 'hostel.report.view');
  const dashboard = await wardenDashboard(actor, hostelId);
  const residents = await listResidents(actor, { hostelId, pageSize: 100 });
  return {
    generatedAt: new Date().toISOString(),
    hostelId: hostelId ?? null,
    residents: { active: dashboard.residentsActive, rows: residents.pagination.total },
    occupancy: dashboard.capacity,
    applications: { pending: dashboard.applicationsPending, allocationPending: dashboard.allocationPending },
    waitlist: dashboard.waitlistedStudents,
    movement: { outside: dashboard.residentsCurrentlyOutside, overdue: dashboard.lateReturns, pendingLeave: dashboard.pendingLeave },
    complaints: { open: dashboard.openComplaints },
    clearance: { pendingVacating: dashboard.pendingVacating },
    limitations: ['Hostel attendance is not implemented in the authoritative Hostel engine.'],
  };
}

export async function getResidentProfile(actor: HostelActor, residentId: number) {
  assertHostelPermission(actor, 'hostel.resident.manage');
  const row = await db('hostel_residents as r')
    .join('students as s', 's.id', 'r.student_id')
    .join('hostels as h', 'h.id', 'r.hostel_id')
    .leftJoin('programs as p', 'p.id', 's.program_id')
    .leftJoin('semesters as sem', 'sem.id', 's.semester_id')
    .leftJoin('hostel_applications as app', 'app.id', 'r.application_id')
    .where({ 'r.id': residentId, 'r.college_id': actor.collegeId })
    .select(
      'r.*',
      's.usn',
      's.name as student_name',
      's.email',
      's.phone',
      's.semester',
      'app.local_guardian_name',
      'app.local_guardian_phone',
      'app.emergency_contact_name',
      'app.emergency_contact_phone',
      'p.name as program_name',
      'sem.label as semester_name',
      'h.name as hostel_name',
    )
    .first();

  if (!row) return null;
  await assertWardenHostelAccess(actor, Number(row.hostel_id));

  const [room, history, dues, clearance, complaints, movements] = await Promise.all([
    getStudentRoom(Number(row.student_id), actor.collegeId),
    getAllocationHistory(Number(row.student_id), actor.collegeId),
    getStudentHostelDues(Number(row.student_id), actor.collegeId),
    getStudentClearance(Number(row.student_id), actor.collegeId),
    db('hostel_complaints')
      .where({ college_id: actor.collegeId, resident_id: residentId })
      .select('id', 'category', 'priority', 'status', 'created_at', 'resolved_at')
      .orderBy('created_at', 'desc')
      .limit(10),
    db('hostel_gate_movements')
      .where({ college_id: actor.collegeId, resident_id: residentId })
      .select('id', 'movement_type', 'source', 'gate', 'created_at', 'remarks')
      .orderBy('created_at', 'desc')
      .limit(10),
  ]);

  const activeOutpass = await db('hostel_outpasses')
    .where({ college_id: actor.collegeId, resident_id: residentId })
    .whereIn('status', ['APPROVED', 'ACTIVE', 'OVERDUE'])
    .orderBy('expected_return_at', 'asc')
    .first();

  return {
    resident: {
      id: Number(row.id),
      studentId: Number(row.student_id),
      residentNumber: row.resident_number,
      status: row.status,
      admittedAt: row.admitted_at,
      hostelName: row.hostel_name,
    },
    student: {
      usn: row.usn,
      name: row.student_name,
      email: row.email,
      phone: row.phone,
      guardianName: row.local_guardian_name,
      guardianPhone: row.local_guardian_phone,
      emergencyContactName: row.emergency_contact_name,
      emergencyContactPhone: row.emergency_contact_phone,
      programName: row.program_name,
      semesterName: row.semester_name ?? row.semester,
    },
    room,
    movement: {
      currentPresence: activeOutpass?.status === 'ACTIVE' || activeOutpass?.status === 'OVERDUE' ? 'OUTSIDE' : 'IN_HOSTEL',
      expectedReturnAt: activeOutpass?.expected_return_at ?? null,
      activeOutpass: activeOutpass ? {
        id: Number(activeOutpass.id),
        outpassNumber: activeOutpass.outpass_number,
        status: activeOutpass.status,
        purpose: activeOutpass.purpose,
        expectedReturnAt: activeOutpass.expected_return_at,
      } : null,
      recent: movements.map((m) => ({
        id: Number(m.id),
        movementType: m.movement_type,
        source: m.source,
        gate: m.gate,
        at: m.created_at,
        remarks: m.remarks,
      })),
    },
    finance: dues,
    clearance,
    complaints: complaints.map((c) => ({
      id: Number(c.id),
      category: c.category,
      priority: c.priority,
      status: c.status,
      createdAt: c.created_at,
      resolvedAt: c.resolved_at,
    })),
    history,
  };
}

export async function listWaitlist(actor: HostelActor, hostelId?: number) {
  assertHostelPermission(actor, 'hostel.application.review');
  if (hostelId) await assertWardenHostelAccess(actor, hostelId);
  const hostelIds = hostelId ? [hostelId] : await getWardenHostelIds(actor);
  if (hostelIds.length === 0) return [];
  let q = db('hostel_waitlist_entries as w')
    .join('hostel_applications as a', 'a.id', 'w.application_id')
    .join('students as s', 's.id', 'a.student_id')
    .where({ 'w.college_id': actor.collegeId, 'w.status': 'ACTIVE' });

  q = q.whereIn('w.hostel_id', hostelIds);

  const rows = await q
    .select('w.*', 'a.application_number', 's.usn', 's.name as student_name', 'a.preferred_room_type')
    .orderBy('w.position', 'asc');

  return rows.map((r) => ({
    id: Number(r.id),
    applicationId: Number(r.application_id),
    applicationNumber: r.application_number,
    usn: r.usn,
    studentName: r.student_name,
    roomTypePreference: r.room_type_preference ?? r.preferred_room_type,
    position: r.position,
    priority: r.priority,
    status: r.status,
  }));
}
