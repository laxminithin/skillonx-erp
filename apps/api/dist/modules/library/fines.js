import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { toMoney } from '../finance/money.js';
import { recordLibraryAudit } from './audit.js';
import { resolvePolicyForMember } from './policies.js';
import { createLibraryFineDemand } from './integration.js';
import { collegeTimezone, todayInTimezone } from '../timetable/time.js';
function serializeFine(row) {
    return {
        id: Number(row.id),
        memberId: Number(row.member_id),
        loanId: row.loan_id != null ? Number(row.loan_id) : null,
        fineType: row.fine_type,
        amount: toMoney(row.amount),
        waivedAmount: toMoney(row.waived_amount),
        paidAmount: toMoney(row.paid_amount),
        outstandingAmount: toMoney(row.outstanding_amount),
        status: row.status,
        remarks: row.remarks,
        financeDemandId: row.finance_demand_id != null ? Number(row.finance_demand_id) : null,
    };
}
export async function generateOverdueFine(loanId, collegeId, trx) {
    const conn = trx ?? db;
    const loan = await conn('library_loans').where({ id: loanId, college_id: collegeId }).first();
    if (!loan)
        return null;
    const existing = await conn('library_fines')
        .where({ loan_id: loanId, fine_type: 'OVERDUE', college_id: collegeId })
        .whereNotIn('status', ['CANCELLED', 'WAIVED'])
        .first();
    if (existing)
        return serializeFine(existing);
    const policy = await resolvePolicyForMember(Number(loan.member_id), collegeId);
    if (policy.finePerDay <= 0)
        return null;
    const college = await conn('colleges').where({ id: collegeId }).select('timezone').first();
    const tz = collegeTimezone(college?.timezone);
    const today = todayInTimezone(tz);
    const dueDate = new Date(loan.due_at).toISOString().slice(0, 10);
    if (dueDate >= today)
        return null;
    const dueMs = new Date(`${dueDate}T00:00:00`).getTime();
    const todayMs = new Date(`${today}T00:00:00`).getTime();
    const daysOverdue = Math.floor((todayMs - dueMs) / 86400000) - policy.graceDays;
    if (daysOverdue <= 0)
        return null;
    let amount = daysOverdue * policy.finePerDay;
    if (policy.fineCap != null && amount > policy.fineCap)
        amount = policy.fineCap;
    const [fineId] = await conn('library_fines').insert({
        college_id: collegeId,
        member_id: loan.member_id,
        loan_id: loanId,
        fine_type: 'OVERDUE',
        amount: toMoney(amount),
        waived_amount: '0.00',
        paid_amount: '0.00',
        outstanding_amount: toMoney(amount),
        status: 'DUE',
        remarks: `${daysOverdue} day(s) overdue`,
    });
    const fine = await conn('library_fines').where({ id: fineId }).first();
    // Create finance demand outside the transaction; safe to retry via reconcilePendingFineFinanceHandoffs.
    setImmediate(() => {
        createLibraryFineDemand(collegeId, Number(fineId)).catch(() => { });
    });
    return serializeFine(fine);
}
export async function createLostFine(trx, params) {
    const [fineId] = await trx('library_fines').insert({
        college_id: params.collegeId,
        member_id: params.memberId,
        loan_id: params.loanId,
        fine_type: 'LOST',
        amount: toMoney(params.amount),
        waived_amount: '0.00',
        paid_amount: '0.00',
        outstanding_amount: toMoney(params.amount),
        status: 'DUE',
        assessed_by: params.assessedBy,
        remarks: params.remarks ?? null,
    });
    const fine = await trx('library_fines').where({ id: fineId }).first();
    const serialized = serializeFine(fine);
    // Create finance demand outside transaction
    setImmediate(() => {
        createLibraryFineDemand(params.collegeId, Number(fineId)).catch(() => { });
    });
    return serialized;
}
export async function listMemberFines(memberId, collegeId) {
    const rows = await db('library_fines')
        .where({ member_id: memberId, college_id: collegeId })
        .orderBy('created_at', 'desc');
    return rows.map(serializeFine);
}
export async function waiveFine(actor, fineId, amount, reason) {
    const row = await db('library_fines').where({ id: fineId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Fine not found');
    const newWaived = Number(row.waived_amount) + amount;
    const outstanding = Math.max(0, Number(row.amount) - newWaived - Number(row.paid_amount));
    const status = outstanding <= 0 ? 'WAIVED' : row.status;
    await db('library_fines').where({ id: fineId }).update({
        waived_amount: toMoney(newWaived),
        outstanding_amount: toMoney(outstanding),
        status,
    });
    await recordLibraryAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'FINE_WAIVE',
        entityType: 'library_fine',
        entityId: fineId,
        beforeState: row,
        afterState: { waivedAmount: newWaived, outstanding },
        reason,
    });
    return serializeFine({ ...row, waived_amount: newWaived, outstanding_amount: outstanding, status });
}
export async function syncFineFromFinance(fineId, collegeId) {
    const fine = await db('library_fines').where({ id: fineId, college_id: collegeId }).first();
    if (!fine?.finance_demand_id)
        return;
    const demand = await db('student_fee_demands').where({ id: fine.finance_demand_id }).first();
    if (!demand)
        return;
    if (demand.status === 'PAID') {
        await db('library_fines').where({ id: fineId }).update({
            paid_amount: fine.amount,
            outstanding_amount: '0.00',
            status: 'PAID',
        });
    }
    else if (demand.status === 'PARTIALLY_PAID') {
        const paid = Number(demand.paid_amount);
        const outstanding = Math.max(0, Number(fine.amount) - Number(fine.waived_amount) - paid);
        await db('library_fines').where({ id: fineId }).update({
            paid_amount: toMoney(paid),
            outstanding_amount: toMoney(outstanding),
            status: outstanding <= 0 ? 'PAID' : 'PARTIALLY_PAID',
        });
    }
}
export async function syncAllFinesForStudent(studentId, collegeId) {
    const member = await db('library_members').where({ student_id: studentId, college_id: collegeId }).first();
    if (!member)
        return;
    const fines = await db('library_fines')
        .where({ member_id: member.id, college_id: collegeId })
        .whereNotNull('finance_demand_id')
        .whereIn('status', ['DUE', 'PARTIALLY_PAID']);
    for (const fine of fines) {
        await syncFineFromFinance(Number(fine.id), collegeId);
    }
}
/**
 * Retries the Finance handoff for fines whose demand creation previously failed or was
 * never attempted (e.g. process restart between insert and the fire-and-forget call).
 * Idempotent: createLibraryFineDemand no-ops once finance_demand_id is set.
 */
export async function reconcilePendingFineFinanceHandoffs(collegeId) {
    const pending = await db('library_fines as f')
        .join('library_members as m', 'm.id', 'f.member_id')
        .where('f.college_id', collegeId)
        .whereIn('f.status', ['DUE', 'PARTIALLY_PAID'])
        .whereNull('f.finance_demand_id')
        .whereNotNull('m.student_id')
        .select('f.id');
    let succeeded = 0;
    let failed = 0;
    for (const row of pending) {
        try {
            const demandId = await createLibraryFineDemand(collegeId, Number(row.id));
            if (demandId)
                succeeded++;
        }
        catch {
            failed++;
        }
    }
    return { attempted: pending.length, succeeded, failed };
}
export async function getMemberOutstanding(memberId, collegeId) {
    const row = await db('library_fines')
        .where({ member_id: memberId, college_id: collegeId })
        .whereIn('status', ['DUE', 'PARTIALLY_PAID'])
        .select(db.raw('COALESCE(SUM(outstanding_amount), 0) as total'))
        .first();
    return toMoney(row?.total ?? 0);
}
export async function staffListFines(actor, status) {
    let query = db('library_fines as f')
        .join('library_members as m', 'm.id', 'f.member_id')
        .leftJoin('students as s', 's.id', 'm.student_id')
        .leftJoin('faculty_users as fu', 'fu.id', 'm.faculty_id')
        .where('f.college_id', actor.collegeId)
        .select('f.*', db.raw('COALESCE(s.name, fu.name) as member_name'), db.raw('COALESCE(s.usn, fu.employee_id) as member_id_display'))
        .orderBy('f.created_at', 'desc');
    if (status)
        query = query.where('f.status', status);
    const rows = await query.limit(200);
    return rows.map((r) => ({ ...serializeFine(r), memberName: r.member_name, memberIdentifier: r.member_id_display }));
}
