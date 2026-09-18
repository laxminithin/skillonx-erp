import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isSuperAdmin } from '../../utils/permissions.js';
const ROLE_FINANCE_PERMISSIONS = {
    SUPER_ADMIN: [
        'finance.view',
        'finance.fee_structure.manage',
        'finance.payroll.post',
        'finance.receipt.view',
        'finance.report.view',
    ],
    COLLEGE_ADMIN: [
        'finance.view',
        'finance.fee_structure.manage',
        'finance.payroll.post',
        'finance.receipt.view',
        'finance.report.view',
    ],
    ACCOUNTANT: [
        'finance.view',
        'finance.fee_structure.manage',
        'finance.demand.generate',
        'finance.payment.record',
        'finance.payroll.post',
        'finance.receipt.view',
        'finance.concession.approve',
        'finance.scholarship.manage',
        'finance.refund.approve',
        'finance.report.view',
    ],
    PRINCIPAL: ['finance.view', 'finance.receipt.view', 'finance.report.view'],
    HOD: ['finance.view', 'finance.report.view'],
    // Executive leadership: read-only fee/collection summaries. No generate/
    // record/approve/manage — cannot mutate any ledger state.
    MANAGEMENT: ['finance.view', 'finance.receipt.view', 'finance.report.view'],
    FACULTY: [],
};
export function financePermissionsForRole(role) {
    if (isSuperAdmin(role))
        return ROLE_FINANCE_PERMISSIONS.SUPER_ADMIN;
    if (role === 'CHAIRMAN')
        return ROLE_FINANCE_PERMISSIONS.MANAGEMENT;
    return ROLE_FINANCE_PERMISSIONS[role] ?? [];
}
export function hasFinancePermission(actor, permission) {
    return financePermissionsForRole(actor.role).includes(permission);
}
export function assertFinancePermission(actor, permission) {
    if (!hasFinancePermission(actor, permission)) {
        throw new AppError(403, 'You do not have permission for this finance action');
    }
}
export async function assertFinanceCollege(entityTable, entityId, collegeId) {
    const row = await db(entityTable).where({ id: entityId }).first();
    if (!row)
        throw new AppError(404, 'Record not found');
    if (Number(row.college_id) !== collegeId)
        throw new AppError(404, 'Record not found');
    return row;
}
export async function assertStudentCollege(studentId, collegeId) {
    const student = await db('students').where({ id: studentId, college_id: collegeId }).first();
    if (!student)
        throw new AppError(404, 'Student not found');
    return student;
}
export async function assertStudentOwnsDemand(studentId, demandId, collegeId) {
    const demand = await db('student_fee_demands')
        .where({ id: demandId, student_id: studentId, college_id: collegeId })
        .first();
    if (!demand)
        throw new AppError(404, 'Demand not found');
    return demand;
}
export async function assertStudentOwnsPayment(studentId, paymentId, collegeId) {
    const payment = await db('student_payments')
        .where({ id: paymentId, student_id: studentId, college_id: collegeId })
        .first();
    if (!payment)
        throw new AppError(404, 'Payment not found');
    return payment;
}
export async function assertStudentOwnsReceipt(studentId, receiptId, collegeId) {
    const receipt = await db('fee_receipts')
        .where({ id: receiptId, student_id: studentId, college_id: collegeId })
        .first();
    if (!receipt)
        throw new AppError(404, 'Receipt not found');
    return receipt;
}
