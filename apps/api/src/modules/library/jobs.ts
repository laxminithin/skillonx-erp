import { db } from '../../db/index.js';
import { refreshOverdueStatuses, sendDueReminders } from './circulation.js';
import { expireReadyReservations } from './reservations.js';
import { generateOverdueFine, reconcilePendingFineFinanceHandoffs } from './fines.js';

/** Idempotent scheduled library maintenance for a college. */
export async function runLibraryJobs(collegeId: number) {
  const overdue = await refreshOverdueStatuses(collegeId);
  const reminders = await sendDueReminders(collegeId);
  const expired = await expireReadyReservations(collegeId);

  // Ensure fines exist for all overdue loans
  const overdueLoans = await db('library_loans')
    .where({ college_id: collegeId, status: 'OVERDUE' });
  for (const loan of overdueLoans) {
    await generateOverdueFine(Number(loan.id), collegeId);
  }

  // Retry any fine → Finance handoffs that failed or were never attempted
  const financeHandoffs = await reconcilePendingFineFinanceHandoffs(collegeId);

  return { overdue, reminders, expired, financeHandoffs };
}

export async function runLibraryJobsAllColleges() {
  const colleges = await db('colleges').select('id');
  const results = [];
  for (const c of colleges) {
    results.push({ collegeId: Number(c.id), ...(await runLibraryJobs(Number(c.id))) });
  }
  return results;
}
