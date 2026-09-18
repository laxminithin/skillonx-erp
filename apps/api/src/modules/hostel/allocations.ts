import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { HostelActor } from './types.js';
import { assertHostelPermission, assertStudentCollege, assertWardenHostelAccess } from './access.js';
import { recordHostelAudit } from './audit.js';
import { nextResidentNumber } from './numbers.js';
import { canAllocateAfterPayment } from './integration.js';
import { notifyHostelEvent } from './notifications.js';

export async function allocateBed(
  actor: HostelActor,
  input: { applicationId?: number; residentId?: number; studentId: number; bedId: number; reason?: string },
) {
  assertHostelPermission(actor, 'hostel.allocation.manage');

  return db.transaction(async (trx) => {
    const bed = await trx('hostel_beds').where({ id: input.bedId }).forUpdate().first();
    if (!bed) throw new AppError(404, 'Bed not found');
    if (Number(bed.college_id) !== actor.collegeId) throw new AppError(404, 'Bed not found');
    if (!['AVAILABLE', 'RESERVED'].includes(String(bed.status))) {
      throw new AppError(409, 'Bed is not available for allocation');
    }

    await assertWardenHostelAccess(actor, Number(bed.hostel_id));
    await assertStudentCollege(input.studentId, actor.collegeId);

    const room = await trx('hostel_rooms').where({ id: bed.room_id }).forUpdate().first();
    if (!room || Number(room.college_id) !== actor.collegeId || Number(room.hostel_id) !== Number(bed.hostel_id)) {
      throw new AppError(404, 'Room not found');
    }
    if (!['AVAILABLE', 'ACTIVE'].includes(String(room.status))) {
      throw new AppError(409, 'Room is not active for allocation');
    }

    const conflictingBed = await trx('hostel_bed_allocations')
      .where({ bed_id: input.bedId, status: 'ACTIVE' })
      .first();
    if (conflictingBed) throw new AppError(409, 'Bed already has an active allocation');

    const conflictingStudent = await trx('hostel_bed_allocations')
      .where({ student_id: input.studentId, status: 'ACTIVE' })
      .first();
    if (conflictingStudent) throw new AppError(409, 'Student already has an active bed allocation');

    const activeRoomAllocations = await trx('hostel_bed_allocations')
      .where({ room_id: bed.room_id, status: 'ACTIVE' })
      .count({ c: '*' })
      .first();
    if (Number(activeRoomAllocations?.c ?? 0) >= Number(room.capacity)) {
      throw new AppError(409, 'Room capacity is full');
    }

    const paymentOk = await canAllocateAfterPayment(input.studentId, actor.collegeId);
    if (!paymentOk) throw new AppError(400, 'Hostel fee payment required before allocation');

    let resident;
    if (input.residentId) {
      resident = await trx('hostel_residents').where({ id: input.residentId }).forUpdate().first();
    } else if (input.applicationId) {
      const app = await trx('hostel_applications').where({ id: input.applicationId }).first();
      if (!app || app.status !== 'APPROVED') throw new AppError(400, 'Application must be approved');
      if (Number(app.college_id) !== actor.collegeId || Number(app.student_id) !== input.studentId) {
        throw new AppError(404, 'Application not found');
      }
      resident = await trx('hostel_residents')
        .where({ application_id: input.applicationId, student_id: input.studentId })
        .first();
      if (!resident) {
        const resNumber = await nextResidentNumber(trx, actor.collegeId);
        const [resId] = await trx('hostel_residents').insert({
          college_id: actor.collegeId,
          student_id: input.studentId,
          academic_year_id: app.academic_year_id,
          hostel_id: bed.hostel_id,
          application_id: input.applicationId,
          resident_number: resNumber,
          status: 'ACTIVE',
          admitted_at: trx.fn.now(),
        });
        resident = await trx('hostel_residents').where({ id: resId }).first();
      }
    } else {
      throw new AppError(400, 'Application or resident ID required');
    }
    if (Number(resident!.college_id) !== actor.collegeId || Number(resident!.student_id) !== input.studentId) {
      throw new AppError(404, 'Resident not found');
    }

    const [allocId] = await trx('hostel_bed_allocations').insert({
      college_id: actor.collegeId,
      resident_id: resident!.id,
      student_id: input.studentId,
      hostel_id: bed.hostel_id,
      room_id: bed.room_id,
      bed_id: input.bedId,
      allocation_type: 'INITIAL',
      start_at: trx.fn.now(),
      status: 'ACTIVE',
      allocated_by: actor.facultyUserId,
      reason: input.reason ?? null,
    });

    await trx('hostel_beds').where({ id: input.bedId }).update({ status: 'OCCUPIED' });
    await trx('hostel_residents').where({ id: resident!.id }).update({ status: 'ACTIVE', hostel_id: bed.hostel_id });

    if (input.applicationId) {
      await trx('hostel_applications').where({ id: input.applicationId }).update({ status: 'ALLOCATED' });
      await trx('hostel_waitlist_entries').where({ application_id: input.applicationId }).update({ status: 'ALLOCATED' });
    }

    await recordHostelAudit({
      collegeId: actor.collegeId,
      actorId: actor.facultyUserId,
      action: 'BED_ALLOCATED',
      entityType: 'HOSTEL_BED_ALLOCATION',
      entityId: allocId,
      afterState: { bedId: input.bedId, studentId: input.studentId, roomId: room?.room_number },
    });

    await notifyHostelEvent({
      studentId: input.studentId,
      collegeId: actor.collegeId,
      type: 'HOSTEL_BED_ALLOCATED',
      title: 'Room allocated',
      body: `You have been allocated bed ${bed.bed_code} in room ${room?.room_number}.`,
      link: '/lms/hostel/room',
      relatedType: 'HOSTEL_ALLOCATION',
      relatedId: allocId,
    });

    return {
      allocationId: allocId,
      residentId: Number(resident!.id),
      bedId: input.bedId,
      bedCode: bed.bed_code,
      roomNumber: room?.room_number,
      status: 'ACTIVE',
    };
  });
}

export async function transferBed(
  actor: HostelActor,
  residentId: number,
  newBedId: number,
  transferType: string,
  reason?: string,
) {
  assertHostelPermission(actor, 'hostel.transfer.manage');

  return db.transaction(async (trx) => {
    const resident = await trx('hostel_residents').where({ id: residentId }).forUpdate().first();
    if (!resident || Number(resident.college_id) !== actor.collegeId) throw new AppError(404, 'Resident not found');
    await assertWardenHostelAccess(actor, Number(resident.hostel_id));

    const oldAlloc = await trx('hostel_bed_allocations')
      .where({ resident_id: residentId, status: 'ACTIVE' })
      .forUpdate()
      .first();
    if (!oldAlloc) throw new AppError(400, 'No active allocation to transfer');

    const newBed = await trx('hostel_beds').where({ id: newBedId }).forUpdate().first();
    if (!newBed || Number(newBed.college_id) !== actor.collegeId || !['AVAILABLE', 'RESERVED'].includes(String(newBed.status))) {
      throw new AppError(409, 'Target bed not available');
    }
    await assertWardenHostelAccess(actor, Number(newBed.hostel_id));

    const newRoom = await trx('hostel_rooms').where({ id: newBed.room_id }).forUpdate().first();
    if (!newRoom || !['AVAILABLE', 'ACTIVE'].includes(String(newRoom.status))) {
      throw new AppError(409, 'Target room is not active');
    }

    const conflict = await trx('hostel_bed_allocations').where({ bed_id: newBedId, status: 'ACTIVE' }).first();
    if (conflict) throw new AppError(409, 'Target bed already occupied');
    const activeTargetRoomAllocations = await trx('hostel_bed_allocations')
      .where({ room_id: newBed.room_id, status: 'ACTIVE' })
      .count({ c: '*' })
      .first();
    if (Number(activeTargetRoomAllocations?.c ?? 0) >= Number(newRoom.capacity)) {
      throw new AppError(409, 'Target room capacity is full');
    }

    await trx('hostel_bed_allocations').where({ id: oldAlloc.id }).update({
      status: 'TRANSFERRED',
      end_at: trx.fn.now(),
    });
    await trx('hostel_beds').where({ id: oldAlloc.bed_id }).update({ status: 'AVAILABLE' });

    const [newAllocId] = await trx('hostel_bed_allocations').insert({
      college_id: actor.collegeId,
      resident_id: residentId,
      student_id: resident.student_id,
      hostel_id: newBed.hostel_id,
      room_id: newBed.room_id,
      bed_id: newBedId,
      allocation_type: transferType,
      start_at: trx.fn.now(),
      status: 'ACTIVE',
      allocated_by: actor.facultyUserId,
      reason: reason ?? null,
    });
    await trx('hostel_beds').where({ id: newBedId }).update({ status: 'OCCUPIED' });

    await recordHostelAudit({
      collegeId: actor.collegeId,
      actorId: actor.facultyUserId,
      action: 'BED_TRANSFERRED',
      entityType: 'HOSTEL_BED_ALLOCATION',
      entityId: newAllocId,
      beforeState: { bedId: oldAlloc.bed_id },
      afterState: { bedId: newBedId },
      reason,
    });

    return { allocationId: newAllocId, oldAllocationId: Number(oldAlloc.id), status: 'ACTIVE' };
  });
}

export async function getStudentRoom(studentId: number, collegeId: number) {
  const alloc = await db('hostel_bed_allocations as a')
    .join('hostel_beds as b', 'b.id', 'a.bed_id')
    .join('hostel_rooms as r', 'r.id', 'a.room_id')
    .join('hostel_blocks as bl', 'bl.id', 'r.block_id')
    .join('hostel_floors as f', 'f.id', 'r.floor_id')
    .join('hostels as h', 'h.id', 'a.hostel_id')
    .join('hostel_residents as res', 'res.id', 'a.resident_id')
    .where({ 'a.student_id': studentId, 'a.college_id': collegeId, 'a.status': 'ACTIVE' })
    .select(
      'a.*', 'b.bed_code', 'r.room_number', 'r.room_type',
      'bl.code as block_code', 'bl.name as block_name',
      'f.floor_number', 'h.name as hostel_name', 'h.code as hostel_code',
      'res.resident_number', 'res.admitted_at', 'res.status as resident_status',
    )
    .first();

  if (!alloc) return null;

  const roommates = await db('hostel_bed_allocations as a')
    .join('students as s', 's.id', 'a.student_id')
    .join('hostel_beds as b', 'b.id', 'a.bed_id')
    .where({ 'a.room_id': alloc.room_id, 'a.status': 'ACTIVE' })
    .whereNot('a.student_id', studentId)
    .select('s.name', 's.usn', 'b.bed_code');

  return {
    hostelName: alloc.hostel_name,
    hostelCode: alloc.hostel_code,
    blockCode: alloc.block_code,
    blockName: alloc.block_name,
    floorNumber: alloc.floor_number,
    roomNumber: alloc.room_number,
    roomType: alloc.room_type,
    bedCode: alloc.bed_code,
    residentNumber: alloc.resident_number,
    admittedAt: alloc.admitted_at,
    residentStatus: alloc.resident_status,
    allocationId: Number(alloc.id),
    roommates: roommates.map((r) => ({ name: r.name, usn: r.usn, bedCode: r.bed_code })),
  };
}

export async function getAllocationHistory(studentId: number, collegeId: number) {
  const rows = await db('hostel_bed_allocations as a')
    .join('hostel_beds as b', 'b.id', 'a.bed_id')
    .join('hostel_rooms as r', 'r.id', 'a.room_id')
    .join('hostels as h', 'h.id', 'a.hostel_id')
    .where({ 'a.student_id': studentId, 'a.college_id': collegeId })
    .select('a.*', 'b.bed_code', 'r.room_number', 'h.name as hostel_name')
    .orderBy('a.start_at', 'desc');

  return rows.map((r) => ({
    id: Number(r.id),
    hostelName: r.hostel_name,
    roomNumber: r.room_number,
    bedCode: r.bed_code,
    allocationType: r.allocation_type,
    startAt: r.start_at,
    endAt: r.end_at,
    status: r.status,
  }));
}

export async function getRoomOccupancy(actor: HostelActor, hostelId: number) {
  assertHostelPermission(actor, 'hostel.view');
  await assertWardenHostelAccess(actor, hostelId);

  const blocks = await db('hostel_blocks').where({ hostel_id: hostelId, status: 'ACTIVE' });
  const result = [];

  for (const block of blocks) {
    const floors = await db('hostel_floors').where({ block_id: block.id, status: 'ACTIVE' }).orderBy('floor_number');
    const floorData = [];
    for (const floor of floors) {
      const rooms = await db('hostel_rooms').where({ floor_id: floor.id }).orderBy('room_number');
      const roomData = [];
      for (const room of rooms) {
        const beds = await db('hostel_beds as b')
          .leftJoin('hostel_bed_allocations as a', function join() {
            this.on('a.bed_id', '=', 'b.id').andOn('a.status', '=', db.raw('?', ['ACTIVE']));
          })
          .leftJoin('students as s', 's.id', 'a.student_id')
          .where({ 'b.room_id': room.id })
          .select('b.id', 'b.bed_code', 'b.status', 's.name as student_name', 's.usn');
        roomData.push({
          id: Number(room.id),
          roomNumber: room.room_number,
          roomType: room.room_type,
          status: room.status,
          beds: beds.map((b) => ({
            id: Number(b.id),
            bedCode: b.bed_code,
            status: b.status,
            studentName: b.student_name ?? null,
            usn: b.usn ?? null,
          })),
        });
      }
      floorData.push({ id: Number(floor.id), floorNumber: floor.floor_number, rooms: roomData });
    }
    result.push({ id: Number(block.id), code: block.code, name: block.name, floors: floorData });
  }
  return result;
}

export async function getHostelCapacity(collegeId: number, hostelId?: number) {
  let bedQ = db('hostel_beds').where({ college_id: collegeId });
  if (hostelId) bedQ = bedQ.andWhere('hostel_id', hostelId);

  const beds = await bedQ.select('status');
  const total = beds.length;
  const usable = beds.filter((b) => !['BLOCKED', 'INACTIVE', 'MAINTENANCE'].includes(b.status)).length;
  const occupied = beds.filter((b) => b.status === 'OCCUPIED').length;
  const reserved = beds.filter((b) => b.status === 'RESERVED').length;
  const available = beds.filter((b) => b.status === 'AVAILABLE').length;
  const maintenance = beds.filter((b) => b.status === 'MAINTENANCE').length;
  const blocked = beds.filter((b) => b.status === 'BLOCKED').length;

  return {
    totalBeds: total,
    usableBeds: usable,
    occupiedBeds: occupied,
    reservedBeds: reserved,
    availableBeds: available,
    maintenanceBeds: maintenance,
    blockedBeds: blocked,
    occupancyPercent: usable > 0 ? Math.round((occupied / usable) * 100) : 0,
  };
}
