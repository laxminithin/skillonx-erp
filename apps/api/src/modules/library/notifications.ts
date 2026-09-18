import { notifyStudent } from '../academicClasses/studentNotifications.js';

export async function notifyReservationReady(
  studentId: number,
  collegeId: number,
  reservationId: number,
  title: string,
) {
  await notifyStudent({
    studentId,
    collegeId,
    type: 'LIBRARY_RESERVATION_READY',
    title: 'Book ready for collection',
    body: `${title} is ready for collection at the library.`,
    link: '/lms/library/reservations',
    relatedType: 'LIBRARY_RESERVATION',
    relatedId: reservationId,
  });
}

export async function notifyLoanDue(
  studentId: number,
  collegeId: number,
  loanId: number,
  dueDate: string,
) {
  await notifyStudent({
    studentId,
    collegeId,
    type: 'LIBRARY_DUE_REMINDER',
    title: 'Library book due soon',
    body: `A borrowed book is due on ${dueDate}.`,
    link: '/lms/library/books',
    relatedType: 'LIBRARY_LOAN',
    relatedId: loanId,
  });
}

export async function notifyLoanOverdue(studentId: number, collegeId: number, loanId: number) {
  await notifyStudent({
    studentId,
    collegeId,
    type: 'LIBRARY_OVERDUE',
    title: 'Library book overdue',
    body: 'You have an overdue library book. Please return it or renew if eligible.',
    link: '/lms/library/books',
    relatedType: 'LIBRARY_LOAN',
    relatedId: loanId,
  });
}

export async function notifyFineGenerated(studentId: number, collegeId: number, fineId: number, amount: string) {
  await notifyStudent({
    studentId,
    collegeId,
    type: 'LIBRARY_FINE',
    title: 'Library fine generated',
    body: `A library fine of ₹${amount} has been recorded.`,
    link: '/lms/library/fines',
    relatedType: 'LIBRARY_FINE',
    relatedId: fineId,
  });
}

export async function notifyClearanceAchieved(studentId: number, collegeId: number) {
  await notifyStudent({
    studentId,
    collegeId,
    type: 'LIBRARY_CLEARANCE',
    title: 'Library clearance achieved',
    body: 'You have no outstanding library obligations.',
    link: '/lms/library',
    relatedType: 'LIBRARY_CLEARANCE',
    relatedId: studentId,
  });
}
