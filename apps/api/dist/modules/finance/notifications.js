import { notifyStudent } from '../academicClasses/studentNotifications.js';
import { toMoney } from './money.js';
export async function notifyPaymentSuccess(studentId, collegeId, amount, receiptNumber) {
    await notifyStudent({
        studentId,
        collegeId,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Successful',
        body: `Your payment of ${toMoney(amount)} was successful${receiptNumber ? `. Receipt: ${receiptNumber}` : ''}.`,
        link: '/lms/fees/history',
        relatedType: 'receipt',
        relatedId: receiptNumber,
    });
}
export async function notifyPaymentFailed(studentId, collegeId) {
    await notifyStudent({
        studentId,
        collegeId,
        type: 'PAYMENT_FAILED',
        title: 'Payment Failed',
        body: 'Your online payment could not be processed. Please try again or contact accounts.',
        link: '/lms/fees',
    });
}
export async function notifyReceiptGenerated(studentId, collegeId, receiptNumber) {
    await notifyStudent({
        studentId,
        collegeId,
        type: 'RECEIPT_GENERATED',
        title: 'Receipt Generated',
        body: `Receipt ${receiptNumber} has been generated for your payment.`,
        link: '/lms/fees/history',
        relatedType: 'receipt',
        relatedId: receiptNumber,
    });
}
export async function notifyFeeDueSoon(studentId, collegeId, dueDate, amount) {
    await notifyStudent({
        studentId,
        collegeId,
        type: 'FEE_DUE_SOON',
        title: 'Fee Due Soon',
        body: `Fee of ${amount} is due on ${dueDate}.`,
        link: '/lms/fees',
        relatedType: 'fee_due',
        relatedId: dueDate,
    });
}
export async function notifyFeeOverdue(studentId, collegeId, amount) {
    await notifyStudent({
        studentId,
        collegeId,
        type: 'FEE_OVERDUE',
        title: 'Fee Overdue',
        body: `You have an overdue balance of ${amount}. Please pay at the earliest.`,
        link: '/lms/fees',
        relatedType: 'fee_overdue',
        relatedId: new Date().toISOString().slice(0, 7),
    });
}
export async function notifyScholarshipSanctioned(studentId, collegeId, amount) {
    await notifyStudent({
        studentId,
        collegeId,
        type: 'SCHOLARSHIP_SANCTIONED',
        title: 'Scholarship Sanctioned',
        body: `Your scholarship of ${toMoney(amount)} has been sanctioned.`,
        link: '/lms/fees/scholarships',
    });
}
export async function notifyApplicationSubmitted(studentId, collegeId, applicationId, schemeName) {
    await notifyStudent({
        studentId,
        collegeId,
        type: 'SCHOLARSHIP_APPLICATION_SUBMITTED',
        title: 'Scholarship Application Submitted',
        body: `Your application for ${schemeName} has been submitted.`,
        link: '/lms/fees/scholarships',
        relatedType: 'scholarship_application',
        relatedId: applicationId,
    });
}
export async function notifyApplicationReturned(studentId, collegeId, applicationId, schemeName, remarks) {
    await notifyStudent({
        studentId,
        collegeId,
        type: 'SCHOLARSHIP_APPLICATION_RETURNED',
        title: 'Scholarship Application Needs Attention',
        body: `Your application for ${schemeName} was returned for more information.${remarks ? ` ${remarks}` : ''}`,
        link: '/lms/fees/scholarships',
        relatedType: 'scholarship_application',
        relatedId: applicationId,
        dedupeKeyOverride: `SCHOLARSHIP_APPLICATION_RETURNED:${applicationId}:${Date.now()}`,
    });
}
export async function notifyApplicationDecision(studentId, collegeId, applicationId, schemeName, decision) {
    await notifyStudent({
        studentId,
        collegeId,
        type: `SCHOLARSHIP_APPLICATION_${decision}`,
        title: decision === 'APPROVED' ? 'Scholarship Application Approved' : 'Scholarship Application Rejected',
        body: `Your application for ${schemeName} was ${decision.toLowerCase()}.`,
        link: '/lms/fees/scholarships',
        relatedType: 'scholarship_application',
        relatedId: applicationId,
    });
}
export async function notifyApplicationSanctioned(studentId, collegeId, applicationId, schemeName, amount) {
    await notifyStudent({
        studentId,
        collegeId,
        type: 'SCHOLARSHIP_APPLICATION_SANCTIONED',
        title: 'Scholarship Sanctioned',
        body: `Your ${schemeName} scholarship of ${toMoney(amount)} has been sanctioned.`,
        link: '/lms/fees/scholarships',
        relatedType: 'scholarship_application',
        relatedId: applicationId,
    });
}
export async function notifyRefundProcessed(studentId, collegeId, amount) {
    await notifyStudent({
        studentId,
        collegeId,
        type: 'REFUND_PROCESSED',
        title: 'Refund Processed',
        body: `Your refund of ${toMoney(amount)} has been processed.`,
        link: '/lms/fees/history',
    });
}
