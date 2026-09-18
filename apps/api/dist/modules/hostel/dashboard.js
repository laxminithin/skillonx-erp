import { db } from '../../db/index.js';
import { assertHostelPermission, assertManagementReadOnly, assertWardenHostelAccess, getWardenHostelIds } from './access.js';
import { getHostelCapacity } from './allocations.js';
export async function wardenDashboard(actor, hostelId) {
    assertHostelPermission(actor, 'hostel.view');
    if (hostelId)
        await assertWardenHostelAccess(actor, hostelId);
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
    let capacity = { totalBeds: 0, usableBeds: 0, occupiedBeds: 0, reservedBeds: 0, availableBeds: 0, maintenanceBeds: 0, blockedBeds: 0, occupancyPercent: 0 };
    for (const id of hostelIds) {
        const c = await getHostelCapacity(actor.collegeId, id);
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
export async function managementDashboard(actor) {
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
export async function listResidents(actor, hostelId) {
    assertHostelPermission(actor, 'hostel.resident.manage');
    if (hostelId)
        await assertWardenHostelAccess(actor, hostelId);
    const hostelIds = hostelId ? [hostelId] : await getWardenHostelIds(actor);
    if (hostelIds.length === 0)
        return [];
    let q = db('hostel_residents as r')
        .join('students as s', 's.id', 'r.student_id')
        .join('hostels as h', 'h.id', 'r.hostel_id')
        .leftJoin('hostel_bed_allocations as a', function join() {
        this.on('a.resident_id', '=', 'r.id').andOn('a.status', '=', db.raw('?', ['ACTIVE']));
    })
        .leftJoin('hostel_rooms as rm', 'rm.id', 'a.room_id')
        .leftJoin('hostel_beds as b', 'b.id', 'a.bed_id')
        .where({ 'r.college_id': actor.collegeId })
        .whereIn('r.status', ['ACTIVE', 'TEMPORARILY_AWAY', 'VACATING']);
    q = q.whereIn('r.hostel_id', hostelIds);
    const rows = await q
        .select('r.*', 's.usn', 's.name as student_name', 'h.name as hostel_name', 'rm.room_number', 'b.bed_code')
        .orderBy('s.usn')
        .limit(200);
    return rows.map((r) => ({
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
    }));
}
export async function listWaitlist(actor, hostelId) {
    assertHostelPermission(actor, 'hostel.application.review');
    if (hostelId)
        await assertWardenHostelAccess(actor, hostelId);
    const hostelIds = hostelId ? [hostelId] : await getWardenHostelIds(actor);
    if (hostelIds.length === 0)
        return [];
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
