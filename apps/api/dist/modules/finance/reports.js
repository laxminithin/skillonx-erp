import { db } from '../../db/index.js';
import { assertFinancePermission } from './access.js';
import { toMoney } from './money.js';
export async function financeDashboard(actor) {
    assertFinancePermission(actor, 'finance.view');
    const collegeId = actor.collegeId;
    const today = new Date().toISOString().slice(0, 10);
    const [expectedRow, collectedRow, outstandingRow, todayRow, overdueRow, scholarshipRow, refundRow] = await Promise.all([
        db('student_fee_demands')
            .where({ college_id: collegeId })
            .whereNot('status', 'CANCELLED')
            .sum({ total: 'net_amount' })
            .first(),
        db('student_payments')
            .where({ college_id: collegeId, status: 'SUCCESS' })
            .sum({ total: 'amount' })
            .first(),
        db('student_fee_demands')
            .where({ college_id: collegeId })
            .whereIn('status', ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'])
            .sum({ total: 'outstanding_amount' })
            .first(),
        db('student_payments')
            .where({ college_id: collegeId, status: 'SUCCESS', payment_date: today })
            .sum({ total: 'amount' })
            .first(),
        db('student_fee_demands')
            .where({ college_id: collegeId, status: 'OVERDUE' })
            .sum({ total: 'outstanding_amount' })
            .first(),
        db('student_scholarships')
            .where({ college_id: collegeId })
            .whereIn('status', ['SANCTIONED', 'VERIFIED'])
            .sum({ total: 'sanctioned_amount' })
            .first(),
        db('student_refunds')
            .where({ college_id: collegeId })
            .whereIn('status', ['REQUESTED', 'APPROVED', 'PROCESSING'])
            .sum({ total: 'amount' })
            .first(),
    ]);
    const modeBreakdown = await db('student_payments')
        .where({ college_id: collegeId, status: 'SUCCESS', payment_date: today })
        .groupBy('payment_method')
        .select('payment_method')
        .sum({ total: 'amount' });
    const [recentPayments, pendingRefunds, pendingGatewayOrders, failedPayments, concessionsPending] = await Promise.all([
        db('student_payments as p')
            .join('students as s', 's.id', 'p.student_id')
            .where('p.college_id', collegeId)
            .select('p.id', 'p.payment_number', 'p.amount', 'p.payment_date', 'p.payment_method', 'p.status', 's.name as student_name', 's.usn')
            .orderBy('p.created_at', 'desc')
            .limit(8),
        db('student_refunds').where({ college_id: collegeId }).whereIn('status', ['REQUESTED', 'APPROVED', 'PROCESSING']).count({ c: '*' }).first(),
        db('payment_gateway_orders').where({ college_id: collegeId }).whereIn('status', ['CREATED', 'PENDING']).count({ c: '*' }).first(),
        db('student_payments').where({ college_id: collegeId, status: 'FAILED' }).count({ c: '*' }).first(),
        db('student_fee_concessions').where({ college_id: collegeId, status: 'PENDING' }).count({ c: '*' }).first(),
    ]);
    return {
        expectedCollection: toMoney(expectedRow?.total ?? 0),
        collected: toMoney(collectedRow?.total ?? 0),
        outstanding: toMoney(outstandingRow?.total ?? 0),
        todayCollection: toMoney(todayRow?.total ?? 0),
        overdueAmount: toMoney(overdueRow?.total ?? 0),
        scholarshipReceivable: toMoney(scholarshipRow?.total ?? 0),
        refundPending: toMoney(refundRow?.total ?? 0),
        todayByMode: modeBreakdown.map((r) => ({
            method: r.payment_method,
            amount: toMoney(r.total),
        })),
        actionRequired: [
            { label: 'Pending refunds', count: Number(pendingRefunds?.c ?? 0) },
            { label: 'Gateway orders to reconcile', count: Number(pendingGatewayOrders?.c ?? 0) },
            { label: 'Failed payments', count: Number(failedPayments?.c ?? 0) },
            { label: 'Pending concessions', count: Number(concessionsPending?.c ?? 0) },
        ],
        recentTransactions: recentPayments.map((p) => ({
            id: Number(p.id),
            paymentNumber: p.payment_number,
            studentName: p.student_name,
            usn: p.usn,
            amount: toMoney(p.amount),
            paymentDate: p.payment_date,
            paymentMethod: p.payment_method,
            status: p.status,
        })),
    };
}
export async function reconciliationWorkspace(actor) {
    assertFinancePermission(actor, 'finance.report.view');
    const [gatewayOrders, failedPayments, duplicatedReferences] = await Promise.all([
        db('payment_gateway_orders as g')
            .leftJoin('student_payments as p', 'p.id', 'g.payment_id')
            .leftJoin('students as s', 's.id', 'g.student_id')
            .where('g.college_id', actor.collegeId)
            .whereIn('g.status', ['CREATED', 'PENDING', 'FAILED'])
            .select('g.order_id', 'g.provider', 'g.amount', 'g.currency', 'g.status', 'g.created_at', 'p.payment_number', 's.name as student_name', 's.usn')
            .orderBy('g.created_at', 'desc')
            .limit(100),
        db('student_payments as p')
            .join('students as s', 's.id', 'p.student_id')
            .where({ 'p.college_id': actor.collegeId, 'p.status': 'FAILED' })
            .select('p.payment_number', 'p.amount', 'p.payment_date', 'p.payment_method', 'p.transaction_reference', 's.name as student_name', 's.usn')
            .orderBy('p.updated_at', 'desc')
            .limit(100),
        db('student_payments')
            .where('college_id', actor.collegeId)
            .whereNotNull('transaction_reference')
            .groupBy('transaction_reference')
            .select('transaction_reference')
            .count({ count: '*' })
            .havingRaw('count(*) > 1'),
    ]);
    return {
        gatewayOrders: gatewayOrders.map((g) => ({
            orderId: g.order_id,
            provider: g.provider,
            paymentNumber: g.payment_number,
            studentName: g.student_name,
            usn: g.usn,
            amount: toMoney(g.amount),
            currency: g.currency,
            status: g.status,
            createdAt: g.created_at,
        })),
        failedPayments: failedPayments.map((p) => ({
            paymentNumber: p.payment_number,
            studentName: p.student_name,
            usn: p.usn,
            amount: toMoney(p.amount),
            paymentDate: p.payment_date,
            paymentMethod: p.payment_method,
            transactionReference: p.transaction_reference,
        })),
        duplicatedReferences: duplicatedReferences.map((r) => ({
            transactionReference: r.transaction_reference,
            count: Number(r.count),
        })),
    };
}
export async function dailyCollectionReport(actor, filters) {
    assertFinancePermission(actor, 'finance.report.view');
    const date = filters.date ?? new Date().toISOString().slice(0, 10);
    let q = db('student_payments as p')
        .leftJoin('faculty_users as f', 'f.id', 'p.recorded_by')
        .where({ 'p.college_id': actor.collegeId, 'p.status': 'SUCCESS', 'p.payment_date': date })
        .select('p.*', 'f.name as cashier_name');
    if (filters.paymentMethod)
        q = q.andWhere('p.payment_method', filters.paymentMethod);
    if (filters.recordedBy)
        q = q.andWhere('p.recorded_by', filters.recordedBy);
    const rows = await q.orderBy('p.created_at');
    const byMode = {};
    for (const r of rows) {
        byMode[r.payment_method] = (byMode[r.payment_method] ?? 0) + Number(r.amount);
    }
    return {
        date,
        payments: rows.map((r) => ({
            paymentNumber: r.payment_number,
            amount: toMoney(r.amount),
            method: r.payment_method,
            cashier: r.cashier_name,
            transactionReference: r.transaction_reference,
        })),
        totalsByMode: Object.entries(byMode).map(([method, total]) => ({
            method,
            amount: toMoney(total),
        })),
        grandTotal: toMoney(rows.reduce((acc, r) => acc + Number(r.amount), 0)),
    };
}
export async function outstandingReport(actor, filters) {
    assertFinancePermission(actor, 'finance.report.view');
    let q = db('student_fee_demands as d')
        .join('students as s', 's.id', 'd.student_id')
        .leftJoin('programs as p', 'p.id', 's.program_id')
        .leftJoin('semesters as sem', 'sem.id', 'd.semester_id')
        .where('d.college_id', actor.collegeId)
        .whereIn('d.status', ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'])
        .where('d.outstanding_amount', '>', 0)
        .select('d.*', 's.name as student_name', 's.usn', 'p.name as program_name', 'sem.label as semester_label');
    if (filters.academicYearId)
        q = q.andWhere('d.academic_year_id', filters.academicYearId);
    if (filters.programId)
        q = q.andWhere('s.program_id', filters.programId);
    if (filters.semesterId)
        q = q.andWhere('d.semester_id', filters.semesterId);
    if (filters.classId) {
        q = q.join('academic_class_enrollments as e', function join() {
            this.on('e.student_id', 's.id').andOn('e.status', db.raw('?', ['APPROVED']));
        }).andWhere('e.academic_class_id', filters.classId);
    }
    const rows = await q.orderBy('d.due_date', 'asc').limit(500);
    return rows.map((r) => ({
        studentName: r.student_name,
        usn: r.usn,
        programName: r.program_name,
        semesterLabel: r.semester_label,
        demandNumber: r.demand_number,
        totalDemand: toMoney(r.net_amount),
        paid: toMoney(r.paid_amount),
        outstanding: toMoney(r.outstanding_amount),
        dueDate: r.due_date,
        status: r.status,
    }));
}
export async function searchStudentFinance(actor, query) {
    assertFinancePermission(actor, 'finance.view');
    const term = `%${query.trim()}%`;
    const students = await db('students as s')
        .leftJoin('programs as p', 'p.id', 's.program_id')
        .leftJoin('academic_class_enrollments as e', function join() {
        this.on('e.student_id', 's.id').andOn('e.status', db.raw('?', ['APPROVED']));
    })
        .leftJoin('academic_classes as c', 'c.id', 'e.academic_class_id')
        .where('s.college_id', actor.collegeId)
        .where(function where() {
        this.where('s.usn', 'like', term)
            .orWhere('s.name', 'like', term)
            .orWhere('s.email', 'like', term);
    })
        .select('s.id', 's.name', 's.usn', 'p.name as program_name', 'c.name as class_name')
        .groupBy('s.id')
        .limit(20);
    const results = [];
    for (const s of students) {
        const outstanding = await db('student_fee_demands')
            .where({ student_id: s.id, college_id: actor.collegeId })
            .whereIn('status', ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'])
            .sum({ total: 'outstanding_amount' })
            .first();
        results.push({
            studentId: Number(s.id),
            name: s.name,
            usn: s.usn,
            programName: s.program_name,
            className: s.class_name,
            outstanding: toMoney(outstanding?.total ?? 0),
        });
    }
    return results;
}
export async function getStudentFinanceProfile(actor, studentId) {
    assertFinancePermission(actor, 'finance.view');
    const student = await db('students as s')
        .leftJoin('programs as p', 'p.id', 's.program_id')
        .leftJoin('semesters as sem', 'sem.id', 's.semester_id')
        .where({ 's.id': studentId, 's.college_id': actor.collegeId })
        .select('s.*', 'p.name as program_name', 'sem.label as semester_label')
        .first();
    if (!student)
        throw new Error('Student not found');
    const { getStudentFinancialStatus } = await import('./clearance.js');
    const { listStudentDemands } = await import('./demands.js');
    const { listStudentPayments } = await import('./payments.js');
    const { listStudentScholarships, listConcessions, listStudentRefunds } = await import('./scholarships.js');
    const { listStudentReceipts } = await import('./receipts.js');
    const { getStudentNoDueStatus } = await import('./clearance.js');
    const status = await getStudentFinancialStatus(studentId, actor.collegeId);
    const demands = await listStudentDemands(studentId, actor.collegeId);
    const payments = await listStudentPayments(studentId, actor.collegeId);
    const receipts = await listStudentReceipts(studentId, actor.collegeId);
    const scholarships = await listStudentScholarships(studentId, actor.collegeId);
    const concessions = await listConcessions(actor, { studentId });
    const refunds = await listStudentRefunds(studentId, actor.collegeId);
    const noDue = await getStudentNoDueStatus(studentId, actor.collegeId);
    const auditHistory = await db('finance_audit_log')
        .where({ college_id: actor.collegeId })
        .where(function whereStudent() {
        this.where('entity_type', 'student').andWhere('entity_id', studentId)
            .orWhereExists(function existsDemand() {
            this.select(db.raw('1'))
                .from('student_fee_demands as d')
                .whereRaw('d.id = finance_audit_log.entity_id')
                .where('finance_audit_log.entity_type', 'student_fee_demand')
                .where('d.student_id', studentId);
        })
            .orWhereExists(function existsPayment() {
            this.select(db.raw('1'))
                .from('student_payments as p')
                .whereRaw('p.id = finance_audit_log.entity_id')
                .where('finance_audit_log.entity_type', 'student_payment')
                .where('p.student_id', studentId);
        })
            .orWhereExists(function existsReceipt() {
            this.select(db.raw('1'))
                .from('fee_receipts as r')
                .whereRaw('r.id = finance_audit_log.entity_id')
                .where('finance_audit_log.entity_type', 'fee_receipt')
                .where('r.student_id', studentId);
        })
            .orWhereExists(function existsRefund() {
            this.select(db.raw('1'))
                .from('student_refunds as rf')
                .whereRaw('rf.id = finance_audit_log.entity_id')
                .where('finance_audit_log.entity_type', 'student_refund')
                .where('rf.student_id', studentId);
        });
    })
        .select('action', 'entity_type', 'entity_id', 'created_at')
        .orderBy('created_at', 'desc')
        .limit(30);
    return {
        student: {
            id: Number(student.id),
            name: student.name,
            usn: student.usn,
            email: student.email,
            programName: student.program_name,
            semesterLabel: student.semester_label,
        },
        summary: status,
        demands,
        payments,
        receipts,
        scholarships,
        concessions,
        refunds,
        noDue,
        auditHistory: auditHistory.map((row) => ({
            action: row.action,
            entityType: row.entity_type,
            entityId: Number(row.entity_id),
            createdAt: row.created_at,
        })),
    };
}
