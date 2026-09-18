import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertExamPermission, assertExamSubjectCollege } from './access.js';
import { recordExamAudit } from './audit.js';
export const roomAllocationSchema = z.object({
    roomId: z.number().int().positive(),
    capacity: z.number().int().positive(),
});
function serializeRoomAllocation(row, room) {
    return {
        id: Number(row.id),
        examSubjectId: Number(row.exam_subject_id),
        roomId: Number(row.room_id),
        roomName: room?.name ?? null,
        roomCode: room?.code ?? null,
        capacity: Number(row.capacity),
        assignedCount: Number(row.assigned_count),
    };
}
export async function allocateRooms(actor, examSubjectId, allocations) {
    assertExamPermission(actor, 'exam.rooms');
    const subject = await assertExamSubjectCollege(examSubjectId, actor.collegeId);
    if (subject.seats_locked)
        throw new AppError(400, 'Seats are locked; cannot change room allocation');
    const eligibleCount = await db('exam_eligibility')
        .where({ exam_subject_id: examSubjectId })
        .whereIn('status', ['ELIGIBLE', 'CONDONED'])
        .count({ c: '*' })
        .first();
    const needed = Number(eligibleCount?.c ?? 0);
    const totalCapacity = allocations.reduce((s, a) => s + a.capacity, 0);
    if (totalCapacity < needed) {
        throw new AppError(400, `Total room capacity (${totalCapacity}) is less than eligible students (${needed})`);
    }
    await db('exam_room_allocations').where({ exam_subject_id: examSubjectId }).delete();
    const created = [];
    for (const alloc of allocations) {
        const room = await db('rooms').where({ id: alloc.roomId, college_id: actor.collegeId }).first();
        if (!room)
            throw new AppError(404, `Room ${alloc.roomId} not found`);
        const examCap = room.exam_seating_capacity ?? room.capacity;
        if (examCap && alloc.capacity > examCap) {
            throw new AppError(400, `Room ${room.code} exam capacity is ${examCap}`);
        }
        const [id] = await db('exam_room_allocations').insert({
            college_id: actor.collegeId,
            exam_subject_id: examSubjectId,
            room_id: alloc.roomId,
            capacity: alloc.capacity,
            assigned_count: 0,
        });
        const row = await db('exam_room_allocations').where({ id }).first();
        created.push(serializeRoomAllocation(row, room));
    }
    await recordExamAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'ROOMS_ALLOCATED',
        entityType: 'examination_subject',
        entityId: examSubjectId,
        afterState: created,
    });
    return created;
}
export async function listRoomAllocations(actor, examSubjectId) {
    await assertExamSubjectCollege(examSubjectId, actor.collegeId);
    const rows = await db('exam_room_allocations as a')
        .join('rooms as r', 'r.id', 'a.room_id')
        .where('a.exam_subject_id', examSubjectId)
        .select('a.*', 'r.name as room_name', 'r.code as room_code');
    return rows.map((r) => serializeRoomAllocation(r, { name: r.room_name, code: r.room_code }));
}
export async function generateSeats(actor, examSubjectId) {
    assertExamPermission(actor, 'exam.rooms');
    const subject = await assertExamSubjectCollege(examSubjectId, actor.collegeId);
    if (subject.seats_locked)
        throw new AppError(400, 'Seats are locked');
    const allocations = await db('exam_room_allocations')
        .where({ exam_subject_id: examSubjectId })
        .orderBy('id');
    if (!allocations.length)
        throw new AppError(400, 'Allocate rooms before generating seats');
    const eligible = await db('exam_eligibility as e')
        .join('students as s', 's.id', 'e.student_id')
        .where({ 'e.exam_subject_id': examSubjectId })
        .whereIn('e.status', ['ELIGIBLE', 'CONDONED'])
        .select('e.student_id', 's.usn')
        .orderBy('s.usn');
    await db.transaction(async (trx) => {
        await trx('exam_student_seats').where({ exam_subject_id: examSubjectId }).delete();
        let allocIdx = 0;
        let seatInRoom = 0;
        let roomCount = 0;
        for (const student of eligible) {
            while (allocIdx < allocations.length && roomCount >= Number(allocations[allocIdx].capacity)) {
                await trx('exam_room_allocations')
                    .where({ id: allocations[allocIdx].id })
                    .update({ assigned_count: roomCount });
                allocIdx += 1;
                roomCount = 0;
                seatInRoom = 0;
            }
            if (allocIdx >= allocations.length)
                break;
            const alloc = allocations[allocIdx];
            seatInRoom += 1;
            roomCount += 1;
            await trx('exam_student_seats').insert({
                college_id: actor.collegeId,
                exam_subject_id: examSubjectId,
                student_id: student.student_id,
                room_id: alloc.room_id,
                room_allocation_id: alloc.id,
                seat_number: String(seatInRoom).padStart(2, '0'),
                register_number: student.usn,
            });
        }
        for (let i = allocIdx; i < allocations.length; i++) {
            const count = i === allocIdx ? roomCount : 0;
            await trx('exam_room_allocations').where({ id: allocations[i].id }).update({ assigned_count: count });
        }
    });
    await recordExamAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'SEATS_GENERATED',
        entityType: 'examination_subject',
        entityId: examSubjectId,
        afterState: { count: eligible.length },
    });
    return listSeats(actor, examSubjectId);
}
export async function lockSeats(actor, examSubjectId) {
    assertExamPermission(actor, 'exam.rooms');
    await assertExamSubjectCollege(examSubjectId, actor.collegeId);
    await db('examination_subjects').where({ id: examSubjectId }).update({ seats_locked: true });
    await recordExamAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'SEATS_LOCKED',
        entityType: 'examination_subject',
        entityId: examSubjectId,
    });
    return { locked: true };
}
function serializeSeat(row, student, room) {
    return {
        id: Number(row.id),
        examSubjectId: Number(row.exam_subject_id),
        studentId: Number(row.student_id),
        studentName: student?.name ?? null,
        usn: student?.usn ?? row.register_number,
        roomId: Number(row.room_id),
        roomName: room?.name ?? null,
        roomCode: room?.code ?? null,
        seatNumber: row.seat_number,
    };
}
export async function listSeats(actor, examSubjectId) {
    await assertExamSubjectCollege(examSubjectId, actor.collegeId);
    const rows = await db('exam_student_seats as s')
        .join('students as st', 'st.id', 's.student_id')
        .join('rooms as r', 'r.id', 's.room_id')
        .where('s.exam_subject_id', examSubjectId)
        .select('s.*', 'st.name as student_name', 'st.usn', 'r.name as room_name', 'r.code as room_code')
        .orderBy('r.code')
        .orderBy('s.seat_number');
    return rows.map((r) => serializeSeat(r, { name: r.student_name, usn: r.usn }, { name: r.room_name, code: r.room_code }));
}
export async function seatingPlan(actor, examSubjectId, view = 'room') {
    const seats = await listSeats(actor, examSubjectId);
    if (view === 'room') {
        const byRoom = new Map();
        for (const seat of seats) {
            const key = seat.roomCode ?? String(seat.roomId);
            if (!byRoom.has(key))
                byRoom.set(key, []);
            byRoom.get(key).push(seat);
        }
        return { view, rooms: [...byRoom.entries()].map(([room, items]) => ({ room, seats: items })) };
    }
    return { view, seats };
}
