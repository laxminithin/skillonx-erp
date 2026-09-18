import { db } from '../../db/index.js';
import { syncAllFinesForStudent } from './fines.js';
export async function getLibraryNoDueStatus(studentId, collegeId) {
    if (!(await db.schema.hasTable('library_members'))) {
        return { status: 'NOT_APPLICABLE', reasons: [] };
    }
    await syncAllFinesForStudent(studentId, collegeId);
    const member = await db('library_members').where({ student_id: studentId, college_id: collegeId }).first();
    if (!member)
        return { status: 'NOT_APPLICABLE', reasons: ['NOT_A_MEMBER'] };
    if (member.status !== 'ACTIVE') {
        return { status: 'BLOCKED', reasons: [] };
    }
    const reasons = [];
    const activeLoans = await db('library_loans')
        .where({ member_id: member.id, college_id: collegeId })
        .whereIn('status', ['ACTIVE', 'OVERDUE'])
        .count({ c: '*' })
        .first();
    if (Number(activeLoans?.c ?? 0) > 0) {
        const overdue = await db('library_loans')
            .where({ member_id: member.id, college_id: collegeId, status: 'OVERDUE' })
            .count({ c: '*' })
            .first();
        if (Number(overdue?.c ?? 0) > 0)
            reasons.push('OVERDUE_LOAN');
        else
            reasons.push('ACTIVE_LOAN');
    }
    const lost = await db('library_loans')
        .where({ member_id: member.id, college_id: collegeId, status: 'LOST' })
        .count({ c: '*' })
        .first();
    if (Number(lost?.c ?? 0) > 0)
        reasons.push('LOST_BOOK');
    const fines = await db('library_fines')
        .where({ member_id: member.id, college_id: collegeId })
        .whereIn('status', ['DUE', 'PARTIALLY_PAID'])
        .count({ c: '*' })
        .first();
    if (Number(fines?.c ?? 0) > 0)
        reasons.push('UNPAID_FINE');
    if (reasons.length === 0)
        return { status: 'CLEAR', reasons: [] };
    return { status: 'DUE', reasons };
}
export async function getLibraryMemberStatus(userId, collegeId, userType) {
    const query = userType === 'STUDENT'
        ? { student_id: userId, college_id: collegeId }
        : { faculty_id: userId, college_id: collegeId };
    const member = await db('library_members').where(query).first();
    if (!member)
        return { isMember: false, status: null, membershipNumber: null };
    return {
        isMember: true,
        status: member.status,
        membershipNumber: member.membership_number,
        memberId: Number(member.id),
    };
}
export async function getLibraryOutstanding(studentId, collegeId) {
    const member = await db('library_members').where({ student_id: studentId, college_id: collegeId }).first();
    if (!member)
        return '0.00';
    const row = await db('library_fines')
        .where({ member_id: member.id, college_id: collegeId })
        .whereIn('status', ['DUE', 'PARTIALLY_PAID'])
        .select(db.raw('COALESCE(SUM(outstanding_amount), 0) as total'))
        .first();
    return Number(row?.total ?? 0).toFixed(2);
}
