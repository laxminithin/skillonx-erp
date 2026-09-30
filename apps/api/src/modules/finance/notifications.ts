import { notifyStudent } from '../academicClasses/studentNotifications.js';
import { toMoney } from './money.js';

export async function notifyPaymentSuccess(
  studentId: number,
  collegeId: number,
  amount: unknown,
  receiptNumber?: string,
) {
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

export async function notifyPaymentFailed(studentId: number, collegeId: number) {
  await notifyStudent({
    studentId,
    collegeId,
    type: 'PAYMENT_FAILED',
    title: 'Payment Failed',
    body: 'Your online payment could not be processed. Please try again or contact accounts.',
    link: '/lms/fees',
  });
}

export async function notifyReceiptGenerated(studentId: number, collegeId: number, receiptNumber: string) {
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

export async function notifyFeeDueSoon(studentId: number, collegeId: number, dueDate: string, amount: string) {
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

export async function notifyFeeOverdue(studentId: number, collegeId: number, amount: string) {
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

export async function notifyScholarshipSanctioned(studentId: number, collegeId: number, amount: unknown) {
  await notifyStudent({
    studentId,
    collegeId,
    type: 'SCHOLARSHIP_SANCTIONED',
    title: 'Scholarship Sanctioned',
    body: `Your scholarship of ${toMoney(amount)} has been sanctioned.`,
    link: '/lms/fees/scholarships',
  });
}

export async function notifyApplicationSubmitted(studentId: number, collegeId: number, applicationId: number, schemeName: string) {
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

export async function notifyApplicationReturned(studentId: number, collegeId: number, applicationId: number, schemeName: string, remarks?: string | null) {
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

export async function notifyApplicationDecision(
  studentId: number,
  collegeId: number,
  applicationId: number,
  schemeName: string,
  decision: 'APPROVED' | 'REJECTED',
) {
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

export async function notifyApplicationSanctioned(studentId: number, collegeId: number, applicationId: number, schemeName: string, amount: unknown) {
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

export async function notifyRefundProcessed(studentId: number, collegeId: number, amount: unknown) {
  await notifyStudent({
    studentId,
    collegeId,
    type: 'REFUND_PROCESSED',
    title: 'Refund Processed',
    body: `Your refund of ${toMoney(amount)} has been processed.`,
    link: '/lms/fees/history',
  });
}
