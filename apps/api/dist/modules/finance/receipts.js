import { db } from '../../db/index.js';
import { assertFinancePermission, assertStudentOwnsReceipt } from './access.js';
import { recordFinanceAudit } from './audit.js';
import { toMoney } from './money.js';
import { nextDocumentNumber, getFinancePolicy } from './feeHeads.js';
import { getStudentOutstandingTotal } from './demands.js';
import { AppError } from '../../utils/errors.js';
export async function generateReceipt(trx, params) {
    const existing = await trx('fee_receipts')
        .where({ payment_id: params.paymentId, status: 'ISSUED' })
        .first();
    if (existing)
        return serializeReceipt(existing);
    const policy = await getFinancePolicy(params.collegeId);
    const idempotencyKey = `receipt:${params.paymentId}`;
    const dup = await trx('fee_receipts').where({ college_id: params.collegeId, idempotency_key: idempotencyKey }).first();
    if (dup)
        return serializeReceipt(dup);
    const payment = await trx('student_payments').where({ id: params.paymentId }).first();
    if (!payment || payment.status !== 'SUCCESS')
        throw new Error('Payment not successful');
    const student = await trx('students as s')
        .leftJoin('programs as p', 'p.id', 's.program_id')
        .leftJoin('semesters as sem', 'sem.id', 's.semester_id')
        .leftJoin('colleges as c', 'c.id', 's.college_id')
        .where('s.id', params.studentId)
        .select('s.*', 'p.name as program_name', 'sem.label as semester_label', 'c.name as college_name', 'c.code as college_code', 'c.address as college_address', 'c.logo_url as college_logo')
        .first();
    const allocations = await trx('payment_allocations as a')
        .leftJoin('student_fee_demand_items as di', 'di.demand_id', 'a.demand_id')
        .leftJoin('fee_heads as h', 'h.id', 'di.fee_head_id')
        .where('a.payment_id', params.paymentId)
        .select('a.*', 'h.code as fee_head_code', 'h.name as fee_head_name', 'di.description');
    const receiptNumber = await nextDocumentNumber(trx, params.collegeId, policy.receiptSeries);
    const receiptDate = payment.payment_date;
    const outstanding = await getStudentOutstandingTotal(params.studentId, params.collegeId);
    const snapshot = {
        studentName: student?.name,
        usn: student?.usn,
        programName: student?.program_name,
        semesterLabel: student?.semester_label,
        collegeName: student?.college_name,
        collegeAddress: student?.college_address,
        collegeLogo: student?.college_logo,
        feeHeads: allocations.map((a) => ({
            code: a.fee_head_code,
            name: a.fee_head_name ?? a.description,
            amount: toMoney(a.amount),
        })),
    };
    const [receiptId] = await trx('fee_receipts').insert({
        college_id: params.collegeId,
        student_id: params.studentId,
        payment_id: params.paymentId,
        receipt_number: receiptNumber,
        receipt_date: receiptDate,
        amount: toMoney(payment.amount),
        payment_method: payment.payment_method,
        transaction_reference: payment.transaction_reference ?? payment.gateway_reference,
        outstanding_balance: outstanding,
        status: 'ISSUED',
        snapshot: JSON.stringify(snapshot),
        idempotency_key: idempotencyKey,
    });
    const seenHeads = new Set();
    for (const alloc of allocations) {
        if (alloc.fee_head_id && seenHeads.has(Number(alloc.fee_head_id)))
            continue;
        await trx('fee_receipt_items').insert({
            receipt_id: receiptId,
            fee_head_id: alloc.fee_head_id ?? null,
            description: alloc.fee_head_name ?? alloc.description ?? 'Fee',
            amount: toMoney(alloc.amount),
        });
        if (alloc.fee_head_id)
            seenHeads.add(Number(alloc.fee_head_id));
    }
    const row = await trx('fee_receipts').where({ id: receiptId }).first();
    return serializeReceipt(row, snapshot);
}
export function serializeReceipt(row, snapshot) {
    let parsed = snapshot;
    if (!parsed && row.snapshot) {
        try {
            parsed = typeof row.snapshot === 'string' ? JSON.parse(row.snapshot) : row.snapshot;
        }
        catch {
            parsed = null;
        }
    }
    return {
        id: Number(row.id),
        receiptNumber: String(row.receipt_number),
        studentId: Number(row.student_id),
        paymentId: Number(row.payment_id),
        receiptDate: row.receipt_date,
        amount: toMoney(row.amount),
        paymentMethod: row.payment_method,
        transactionReference: row.transaction_reference,
        outstandingBalance: toMoney(row.outstanding_balance),
        status: row.status,
        snapshot: parsed,
        voidedAt: row.voided_at,
        voidReason: row.void_reason,
    };
}
export async function listReceipts(actor, filters) {
    assertFinancePermission(actor, 'finance.receipt.view');
    let q = db('fee_receipts as r')
        .join('students as s', 's.id', 'r.student_id')
        .where('r.college_id', actor.collegeId)
        .select('r.*', 's.name as student_name', 's.usn');
    if (filters?.studentId)
        q = q.andWhere('r.student_id', filters.studentId);
    if (filters?.fromDate)
        q = q.andWhere('r.receipt_date', '>=', filters.fromDate);
    if (filters?.toDate)
        q = q.andWhere('r.receipt_date', '<=', filters.toDate);
    if (filters?.receiptNumber)
        q = q.andWhere('r.receipt_number', 'like', `%${filters.receiptNumber}%`);
    const rows = await q.orderBy('r.receipt_date', 'desc').limit(200);
    return rows.map((r) => serializeReceipt(r));
}
export async function listStudentReceipts(studentId, collegeId) {
    const rows = await db('fee_receipts')
        .where({ student_id: studentId, college_id: collegeId })
        .orderBy('receipt_date', 'desc');
    return rows.map((r) => serializeReceipt(r));
}
export async function getReceipt(actor, receiptId) {
    assertFinancePermission(actor, 'finance.receipt.view');
    const row = await db('fee_receipts').where({ id: receiptId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Receipt not found');
    const items = await db('fee_receipt_items').where({ receipt_id: receiptId });
    return {
        ...serializeReceipt(row),
        items: items.map((i) => ({
            description: i.description,
            amount: toMoney(i.amount),
        })),
    };
}
export async function getStudentReceipt(studentId, collegeId, receiptId) {
    await assertStudentOwnsReceipt(studentId, receiptId, collegeId);
    const row = await db('fee_receipts').where({ id: receiptId }).first();
    const items = await db('fee_receipt_items').where({ receipt_id: receiptId });
    return {
        ...serializeReceipt(row),
        items: items.map((i) => ({
            description: i.description,
            amount: toMoney(i.amount),
        })),
    };
}
export async function voidReceipt(actor, receiptId, reason) {
    assertFinancePermission(actor, 'finance.payment.record');
    const before = await db('fee_receipts').where({ id: receiptId, college_id: actor.collegeId }).first();
    if (!before)
        throw new AppError(404, 'Receipt not found');
    if (before.status === 'VOID')
        throw new AppError(400, 'Receipt already voided');
    await db('fee_receipts').where({ id: receiptId }).update({
        status: 'VOID',
        voided_by: actor.facultyUserId,
        voided_at: db.fn.now(),
        void_reason: reason,
        updated_at: db.fn.now(),
    });
    await recordFinanceAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'RECEIPT_VOIDED',
        entityType: 'fee_receipt',
        entityId: receiptId,
        beforeState: { status: before.status },
        afterState: { status: 'VOID', reason },
        reason,
    });
    const row = await db('fee_receipts').where({ id: receiptId }).first();
    return serializeReceipt(row);
}
