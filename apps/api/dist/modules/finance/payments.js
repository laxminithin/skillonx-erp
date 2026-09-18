import { db } from '../../db/index.js';
import { assertFinancePermission, assertStudentCollege } from './access.js';
import { recordFinanceAudit } from './audit.js';
import { compareMoney, isZeroMoney, minMoney, subtractMoney, toMoney } from './money.js';
import { nextDocumentNumber, getFinancePolicy } from './feeHeads.js';
import { recalculateDemandTotals } from './demands.js';
import { generateReceipt } from './receipts.js';
import { notifyPaymentSuccess } from './notifications.js';
import { AppError } from '../../utils/errors.js';
function paymentIsFinal(method, chequeStatus) {
    if (['CHEQUE', 'DD'].includes(method))
        return chequeStatus === 'CLEARED';
    return true;
}
export async function recordManualPayment(actor, body) {
    assertFinancePermission(actor, 'finance.payment.record');
    if (body.studentId) {
        await assertStudentCollege(body.studentId, actor.collegeId);
    }
    else if (body.applicantId) {
        const applicant = await db('admission_applicants')
            .where({ id: body.applicantId, college_id: actor.collegeId })
            .first();
        if (!applicant)
            throw new AppError(404, 'Applicant not found');
    }
    else {
        throw new AppError(400, 'Student or applicant is required');
    }
    if (['CHEQUE', 'DD'].includes(body.paymentMethod) && !body.chequeStatus) {
        throw new AppError(400, 'Cheque/DD status is required');
    }
    const isFinal = paymentIsFinal(body.paymentMethod, body.chequeStatus);
    const status = isFinal ? 'SUCCESS' : 'PENDING';
    const subjectType = body.studentId ? 'STUDENT' : 'ADMISSION_APPLICANT';
    const subjectId = body.studentId ?? body.applicantId;
    return db.transaction(async (trx) => {
        const policy = await getFinancePolicy(actor.collegeId);
        const paymentNumber = await nextDocumentNumber(trx, actor.collegeId, policy.paymentSeries);
        const idempotencyKey = `manual:${subjectType}:${subjectId}:${body.transactionReference ?? paymentNumber}`;
        const [paymentId] = await trx('student_payments').insert({
            college_id: actor.collegeId,
            student_id: body.studentId ?? null,
            subject_type: subjectType,
            subject_id: subjectId,
            payment_number: paymentNumber,
            amount: toMoney(body.amount),
            payment_date: body.paymentDate,
            payment_method: body.paymentMethod,
            transaction_reference: body.transactionReference ?? null,
            bank_reference: body.bankReference ?? null,
            cheque_status: body.chequeStatus ?? null,
            status,
            remarks: body.remarks ?? null,
            recorded_by: actor.facultyUserId,
            idempotency_key: idempotencyKey,
        });
        let receipt = null;
        let allocation = null;
        if (isFinal) {
            allocation = await allocatePayment(trx, {
                paymentId: Number(paymentId),
                collegeId: actor.collegeId,
                studentId: body.studentId ?? null,
                subjectType,
                subjectId,
                amount: body.amount,
                demandIds: body.demandIds,
            });
            await trx('student_payments').where({ id: paymentId }).update({ status: 'SUCCESS' });
            if (body.studentId) {
                receipt = await generateReceipt(trx, {
                    collegeId: actor.collegeId,
                    studentId: body.studentId,
                    paymentId: Number(paymentId),
                    actorId: actor.facultyUserId,
                });
            }
        }
        await recordFinanceAudit({
            collegeId: actor.collegeId,
            actorId: actor.facultyUserId,
            action: 'MANUAL_PAYMENT_RECORDED',
            entityType: 'student_payment',
            entityId: Number(paymentId),
            afterState: { ...body, status },
        });
        return {
            paymentId: Number(paymentId),
            paymentNumber,
            status,
            receipt,
            allocation,
        };
    }).then(async (result) => {
        if (result.status === 'SUCCESS' && body.studentId) {
            await notifyPaymentSuccess(body.studentId, actor.collegeId, toMoney(body.amount), result.receipt?.receiptNumber);
        }
        return result;
    });
}
export async function allocatePayment(trx, params) {
    let remaining = toMoney(params.amount);
    const subjectType = params.subjectType ?? 'STUDENT';
    const subjectId = params.subjectId ?? params.studentId;
    if (!subjectId)
        return { allocated: toMoney(0), remaining };
    let demandsQuery = trx('student_fee_demands')
        .where({ college_id: params.collegeId, subject_type: subjectType, subject_id: subjectId })
        .whereIn('status', ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'])
        .where('outstanding_amount', '>', 0)
        .orderBy('due_date', 'asc');
    if (params.demandIds?.length) {
        demandsQuery = demandsQuery.whereIn('id', params.demandIds);
    }
    const demands = await demandsQuery;
    for (const demand of demands) {
        if (compareMoney(remaining, 0) <= 0)
            break;
        const allocAmount = minMoney(remaining, demand.outstanding_amount);
        await trx('payment_allocations').insert({
            payment_id: params.paymentId,
            demand_id: demand.id,
            amount: allocAmount,
        });
        const items = await trx('student_fee_demand_items')
            .where({ demand_id: demand.id })
            .where('outstanding_amount', '>', 0)
            .orderBy('id');
        let itemRemaining = allocAmount;
        for (const item of items) {
            if (compareMoney(itemRemaining, 0) <= 0)
                break;
            const itemAlloc = minMoney(itemRemaining, item.outstanding_amount);
            await trx('student_fee_demand_items').where({ id: item.id }).update({
                paid_amount: toMoney(Number(item.paid_amount) + Number(itemAlloc)),
                outstanding_amount: subtractMoney(item.outstanding_amount, itemAlloc),
                updated_at: trx.fn.now(),
            });
            itemRemaining = subtractMoney(itemRemaining, itemAlloc);
        }
        const installments = await trx('student_fee_demand_installments')
            .where({ demand_id: demand.id })
            .where('outstanding_amount', '>', 0)
            .orderBy('installment_number');
        let instRemaining = allocAmount;
        for (const inst of installments) {
            if (compareMoney(instRemaining, 0) <= 0)
                break;
            const instAlloc = minMoney(instRemaining, inst.outstanding_amount);
            const newPaid = Number(inst.paid_amount) + Number(instAlloc);
            const newOutstanding = subtractMoney(inst.outstanding_amount, instAlloc);
            await trx('student_fee_demand_installments').where({ id: inst.id }).update({
                paid_amount: toMoney(newPaid),
                outstanding_amount: newOutstanding,
                status: isZeroMoney(newOutstanding) ? 'PAID' : 'PARTIALLY_PAID',
                updated_at: trx.fn.now(),
            });
            instRemaining = subtractMoney(instRemaining, instAlloc);
        }
        await recalculateDemandTotals(trx, Number(demand.id));
        remaining = subtractMoney(remaining, allocAmount);
    }
    return { allocated: subtractMoney(params.amount, remaining), remaining };
}
export async function completeChequePayment(actor, paymentId, chequeStatus) {
    assertFinancePermission(actor, 'finance.payment.record');
    const payment = await db('student_payments').where({ id: paymentId, college_id: actor.collegeId }).first();
    if (!payment)
        throw new AppError(404, 'Payment not found');
    if (!['CHEQUE', 'DD'].includes(payment.payment_method)) {
        throw new AppError(400, 'Not a cheque/DD payment');
    }
    if (chequeStatus === 'BOUNCED') {
        await db('student_payments').where({ id: paymentId }).update({
            cheque_status: 'BOUNCED',
            status: 'FAILED',
            updated_at: db.fn.now(),
        });
        await recordFinanceAudit({
            collegeId: actor.collegeId,
            actorId: actor.facultyUserId,
            action: 'CHEQUE_BOUNCED',
            entityType: 'student_payment',
            entityId: paymentId,
        });
        return { status: 'FAILED' };
    }
    return db.transaction(async (trx) => {
        await trx('student_payments').where({ id: paymentId }).update({
            cheque_status: 'CLEARED',
            status: 'SUCCESS',
            updated_at: trx.fn.now(),
        });
        await allocatePayment(trx, {
            paymentId,
            collegeId: actor.collegeId,
            studentId: Number(payment.student_id),
            subjectType: String(payment.subject_type ?? 'STUDENT'),
            subjectId: Number(payment.subject_id ?? payment.student_id),
            amount: Number(payment.amount),
        });
        const receipt = await generateReceipt(trx, {
            collegeId: actor.collegeId,
            studentId: Number(payment.student_id),
            paymentId,
            actorId: actor.facultyUserId,
        });
        await notifyPaymentSuccess(Number(payment.student_id), actor.collegeId, String(payment.amount), String(receipt.receiptNumber));
        return { status: 'SUCCESS', receipt };
    });
}
export async function listPayments(actor, filters) {
    assertFinancePermission(actor, 'finance.view');
    let q = db('student_payments as p')
        .leftJoin('students as s', 's.id', 'p.student_id')
        .leftJoin('admission_applicants as a', function joinApplicant() {
        this.on('a.id', 'p.subject_id').andOn('p.subject_type', db.raw('?', ['ADMISSION_APPLICANT']));
    })
        .where('p.college_id', actor.collegeId)
        .select('p.*', 's.name as student_name', 's.usn', 'a.name as applicant_name', 'a.application_number');
    if (filters?.studentId)
        q = q.andWhere('p.student_id', filters.studentId);
    if (filters?.status)
        q = q.andWhere('p.status', filters.status);
    if (filters?.fromDate)
        q = q.andWhere('p.payment_date', '>=', filters.fromDate);
    if (filters?.toDate)
        q = q.andWhere('p.payment_date', '<=', filters.toDate);
    const rows = await q.orderBy('p.payment_date', 'desc').limit(200);
    return rows.map(serializePayment);
}
export async function listStudentPayments(studentId, collegeId) {
    const rows = await db('student_payments')
        .where({ student_id: studentId, college_id: collegeId })
        .orderBy('payment_date', 'desc');
    return rows.map(serializePayment);
}
export function serializePayment(row) {
    return {
        id: Number(row.id),
        paymentNumber: row.payment_number,
        studentId: row.student_id != null ? Number(row.student_id) : null,
        subjectType: row.subject_type ?? 'STUDENT',
        subjectId: row.subject_id != null ? Number(row.subject_id) : row.student_id != null ? Number(row.student_id) : null,
        studentName: row.student_name ?? null,
        applicantName: row.applicant_name ?? null,
        applicationNumber: row.application_number ?? null,
        usn: row.usn ?? null,
        amount: toMoney(row.amount),
        paymentDate: row.payment_date,
        paymentMethod: row.payment_method,
        transactionReference: row.transaction_reference,
        status: row.status,
        chequeStatus: row.cheque_status,
        createdAt: row.created_at,
    };
}
export async function getPayment(actor, paymentId) {
    assertFinancePermission(actor, 'finance.view');
    const row = await db('student_payments as p')
        .leftJoin('students as s', 's.id', 'p.student_id')
        .leftJoin('admission_applicants as a', function joinApplicant() {
        this.on('a.id', 'p.subject_id').andOn('p.subject_type', db.raw('?', ['ADMISSION_APPLICANT']));
    })
        .where('p.id', paymentId)
        .andWhere('p.college_id', actor.collegeId)
        .select('p.*', 's.name as student_name', 's.usn', 'a.name as applicant_name', 'a.application_number')
        .first();
    if (!row)
        throw new AppError(404, 'Payment not found');
    const allocations = await db('payment_allocations as a')
        .join('student_fee_demands as d', 'd.id', 'a.demand_id')
        .where('a.payment_id', paymentId)
        .select('a.*', 'd.demand_number');
    return {
        ...serializePayment(row),
        allocations: allocations.map((a) => ({
            demandId: Number(a.demand_id),
            demandNumber: a.demand_number,
            amount: toMoney(a.amount),
        })),
    };
}
