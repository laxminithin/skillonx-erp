import { randomBytes } from 'node:crypto';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { recordLibraryAudit } from './audit.js';
export function serializeMember(row, extras) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        memberType: row.member_type,
        studentId: row.student_id != null ? Number(row.student_id) : null,
        facultyId: row.faculty_id != null ? Number(row.faculty_id) : null,
        membershipNumber: row.membership_number,
        cardToken: row.card_token,
        status: row.status,
        joinedAt: row.joined_at,
        expiresAt: row.expires_at,
        ...extras,
    };
}
async function nextMembershipNumber(collegeId) {
    const count = await db('library_members').where({ college_id: collegeId }).count({ c: '*' }).first();
    const seq = Number(count?.c ?? 0) + 1;
    return `LIB-MEM-${String(seq).padStart(6, '0')}`;
}
export async function getOrCreateStudentMember(studentId, collegeId) {
    const existing = await db('library_members')
        .where({ college_id: collegeId, student_id: studentId })
        .first();
    if (existing)
        return serializeMember(existing);
    const student = await db('students').where({ id: studentId, college_id: collegeId }).first();
    if (!student)
        throw new AppError(404, 'Student not found');
    const membershipNumber = student.usn ?? (await nextMembershipNumber(collegeId));
    const cardToken = randomBytes(16).toString('hex');
    const [id] = await db('library_members').insert({
        college_id: collegeId,
        member_type: 'STUDENT',
        student_id: studentId,
        faculty_id: null,
        membership_number: membershipNumber,
        card_token: cardToken,
        status: 'ACTIVE',
        joined_at: new Date(),
    });
    const row = await db('library_members').where({ id }).first();
    return serializeMember(row);
}
export async function getOrCreateFacultyMember(facultyId, collegeId) {
    const existing = await db('library_members')
        .where({ college_id: collegeId, faculty_id: facultyId })
        .first();
    if (existing)
        return serializeMember(existing);
    const faculty = await db('faculty_users').where({ id: facultyId, college_id: collegeId }).first();
    if (!faculty)
        throw new AppError(404, 'Faculty not found');
    const membershipNumber = faculty.employee_id ?? (await nextMembershipNumber(collegeId));
    const cardToken = randomBytes(16).toString('hex');
    const [id] = await db('library_members').insert({
        college_id: collegeId,
        member_type: 'FACULTY',
        student_id: null,
        faculty_id: facultyId,
        membership_number: membershipNumber,
        card_token: cardToken,
        status: 'ACTIVE',
        joined_at: new Date(),
    });
    const row = await db('library_members').where({ id }).first();
    return serializeMember(row);
}
export async function findMemberByQuery(collegeId, query) {
    const q = query.trim();
    if (!q)
        throw new AppError(400, 'Search query required');
    const member = await db('library_members as m')
        .leftJoin('students as s', 's.id', 'm.student_id')
        .leftJoin('faculty_users as f', 'f.id', 'm.faculty_id')
        .where('m.college_id', collegeId)
        .where((builder) => {
        builder
            .where('m.membership_number', q)
            .orWhere('m.card_token', q)
            .orWhere('s.usn', q)
            .orWhere('f.employee_id', q);
    })
        .select('m.*')
        .first();
    if (!member) {
        // Auto-enroll student by USN if not yet a member
        const student = await db('students').where({ college_id: collegeId, usn: q }).first();
        if (student)
            return getOrCreateStudentMember(Number(student.id), collegeId);
        throw new AppError(404, 'Member not found');
    }
    return loadMemberSummary(Number(member.id), collegeId);
}
export async function loadMemberSummary(memberId, collegeId) {
    const row = await db('library_members').where({ id: memberId, college_id: collegeId }).first();
    if (!row)
        throw new AppError(404, 'Member not found');
    let name = '';
    let identifier = '';
    let program = null;
    if (row.student_id) {
        const student = await db('students as s')
            .leftJoin('programs as p', 'p.id', 's.program_id')
            .where('s.id', row.student_id)
            .select('s.name', 's.usn', 'p.name as program_name')
            .first();
        name = student?.name ?? '';
        identifier = student?.usn ?? '';
        program = student?.program_name ?? null;
    }
    else if (row.faculty_id) {
        const faculty = await db('faculty_users').where({ id: row.faculty_id }).first();
        name = faculty?.name ?? '';
        identifier = faculty?.employee_id ?? faculty?.email ?? '';
    }
    const activeLoans = await db('library_loans')
        .where({ member_id: memberId, college_id: collegeId })
        .whereIn('status', ['ACTIVE', 'OVERDUE'])
        .count({ c: '*' })
        .first();
    const overdueLoans = await db('library_loans')
        .where({ member_id: memberId, college_id: collegeId, status: 'OVERDUE' })
        .count({ c: '*' })
        .first();
    const reservations = await db('library_reservations')
        .where({ member_id: memberId, college_id: collegeId })
        .whereIn('status', ['ACTIVE', 'READY'])
        .count({ c: '*' })
        .first();
    const fines = await db('library_fines')
        .where({ member_id: memberId, college_id: collegeId })
        .whereIn('status', ['DUE', 'PARTIALLY_PAID'])
        .select(db.raw('COALESCE(SUM(outstanding_amount), 0) as total'))
        .first();
    return {
        ...serializeMember(row, { name, identifier, program }),
        activeLoanCount: Number(activeLoans?.c ?? 0),
        overdueLoanCount: Number(overdueLoans?.c ?? 0),
        reservationCount: Number(reservations?.c ?? 0),
        outstandingFines: Number(fines?.total ?? 0).toFixed(2),
    };
}
export async function listMembers(actor, opts) {
    let query = db('library_members as m')
        .leftJoin('students as s', 's.id', 'm.student_id')
        .leftJoin('faculty_users as f', 'f.id', 'm.faculty_id')
        .where('m.college_id', actor.collegeId)
        .select('m.*', db.raw('COALESCE(s.name, f.name) as display_name'), db.raw('COALESCE(s.usn, f.employee_id) as display_id'))
        .orderBy('m.id', 'desc');
    if (opts.memberType)
        query = query.where('m.member_type', opts.memberType);
    if (opts.status)
        query = query.where('m.status', opts.status);
    if (opts.q) {
        const q = `%${opts.q}%`;
        query = query.where((b) => {
            b.where('m.membership_number', 'like', q)
                .orWhere('s.usn', 'like', q)
                .orWhere('s.name', 'like', q)
                .orWhere('f.name', 'like', q)
                .orWhere('f.employee_id', 'like', q);
        });
    }
    const limit = opts.limit ?? 50;
    const offset = opts.offset ?? 0;
    const rows = await query.limit(limit).offset(offset);
    return rows.map((r) => serializeMember(r, { name: r.display_name, identifier: r.display_id }));
}
export async function updateMemberStatus(actor, memberId, status, reason) {
    const row = await db('library_members').where({ id: memberId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Member not found');
    await db('library_members').where({ id: memberId }).update({ status });
    await recordLibraryAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'MEMBERSHIP_STATUS_CHANGE',
        entityType: 'library_member',
        entityId: memberId,
        beforeState: { status: row.status },
        afterState: { status },
        reason,
    });
    return serializeMember({ ...row, status });
}
export async function getStudentCard(studentId, collegeId) {
    const member = await getOrCreateStudentMember(studentId, collegeId);
    const student = await db('students as s')
        .leftJoin('programs as p', 'p.id', 's.program_id')
        .where('s.id', studentId)
        .select('s.name', 's.usn', 'p.name as program_name')
        .first();
    return {
        ...member,
        name: student?.name ?? '',
        usn: student?.usn ?? '',
        program: student?.program_name ?? null,
        qrPayload: member.cardToken,
    };
}
