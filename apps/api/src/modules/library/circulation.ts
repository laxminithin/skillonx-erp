import { db } from '../../db/index.js';
import type { Knex } from 'knex';
import { AppError } from '../../utils/errors.js';
import { addDaysPreservingWallClock } from '../../utils/timezone.js';
import { collegeTimezone, todayInTimezone } from '../timetable/time.js';
import { recordLibraryAudit } from './audit.js';
import { resolvePolicyForMember } from './policies.js';
import { promoteReservationQueue } from './reservations.js';
import { generateOverdueFine } from './fines.js';
import { notifyLoanDue, notifyLoanOverdue } from './notifications.js';
import type { LibraryActor } from './types.js';

async function collegeTz(collegeId: number) {
  const row = await db('colleges').where({ id: collegeId }).select('timezone').first();
  return collegeTimezone(row?.timezone);
}

export async function refreshOverdueStatuses(collegeId: number) {
  const tz = await collegeTz(collegeId);
  const today = todayInTimezone(tz);
  const now = new Date();

  const activeLoans = await db('library_loans')
    .where({ college_id: collegeId, status: 'ACTIVE' })
    .where('due_at', '<', now);

  for (const loan of activeLoans) {
    await db('library_loans').where({ id: loan.id }).update({ status: 'OVERDUE' });
    await generateOverdueFine(Number(loan.id), collegeId);
    if (loan.member_id) {
      const member = await db('library_members').where({ id: loan.member_id }).first();
      if (member?.student_id) {
        await notifyLoanOverdue(Number(member.student_id), collegeId, Number(loan.id));
      }
    }
  }

  return { refreshedAt: today };
}

export async function issueBook(
  actor: LibraryActor,
  params: { memberId: number; barcode: string },
) {
  return db.transaction(async (trx) => {
    const member = await trx('library_members')
      .where({ id: params.memberId, college_id: actor.collegeId })
      .forUpdate()
      .first();
    if (!member) throw new AppError(404, 'Member not found');
    if (member.status !== 'ACTIVE') throw new AppError(400, 'Membership is not active');

    const policy = await resolvePolicyForMember(params.memberId, actor.collegeId);

    const activeCount = await trx('library_loans')
      .where({ member_id: params.memberId, college_id: actor.collegeId })
      .whereIn('status', ['ACTIVE', 'OVERDUE'])
      .count({ c: '*' })
      .first();
    if (Number(activeCount?.c ?? 0) >= policy.maxActiveLoans) {
      throw new AppError(400, 'Borrowing limit reached');
    }

    if (policy.blockIssueOnFine) {
      const fines = await trx('library_fines')
        .where({ member_id: params.memberId, college_id: actor.collegeId })
        .whereIn('status', ['DUE', 'PARTIALLY_PAID'])
        .count({ c: '*' })
        .first();
      if (Number(fines?.c ?? 0) > 0) throw new AppError(400, 'Outstanding fines block issue');
    }

    const copy = await trx('library_copies')
      .where({ college_id: actor.collegeId })
      .where((q) => {
        q.where('barcode', params.barcode).orWhere('accession_number', params.barcode);
      })
      .forUpdate()
      .first();
    if (!copy) throw new AppError(404, 'Copy not found');
    if (copy.status !== 'AVAILABLE' && copy.status !== 'RESERVED') {
      throw new AppError(409, `Copy is ${copy.status}, cannot issue`);
    }

    // Check reservation ownership if copy is reserved
    if (copy.status === 'RESERVED') {
      const readyRes = await trx('library_reservations')
        .where({ copy_id: copy.id, status: 'READY', member_id: params.memberId })
        .first();
      if (!readyRes) throw new AppError(409, 'This copy is reserved for another member');
    }

    const tz = await collegeTz(actor.collegeId);
    const issuedAt = new Date();
    const dueAt = addDaysPreservingWallClock(issuedAt, policy.loanDays, tz);

    const [loanId] = await trx('library_loans').insert({
      college_id: actor.collegeId,
      member_id: params.memberId,
      copy_id: copy.id,
      catalog_item_id: copy.catalog_item_id,
      issued_at: issuedAt,
      due_at: dueAt,
      renewal_count: 0,
      status: 'ACTIVE',
      issued_by: actor.facultyUserId,
    });

    await trx('library_copies').where({ id: copy.id }).update({ status: 'ISSUED' });

    // Fulfill reservation if any
    const reservation = await trx('library_reservations')
      .where({ member_id: params.memberId, catalog_item_id: copy.catalog_item_id })
      .whereIn('status', ['ACTIVE', 'READY'])
      .orderBy('queue_position')
      .first();
    if (reservation) {
      await trx('library_reservations').where({ id: reservation.id }).update({
        status: 'FULFILLED',
        fulfilled_at: new Date(),
        copy_id: copy.id,
      });
      await trx('library_loans').where({ id: loanId }).update({ reservation_id: reservation.id });
    }

    await recordLibraryAudit({
      collegeId: actor.collegeId,
      actorId: actor.facultyUserId,
      action: 'ISSUE',
      entityType: 'library_loan',
      entityId: Number(loanId),
      afterState: { memberId: params.memberId, copyId: copy.id },
    });

    return loadLoan(trx, Number(loanId), actor.collegeId);
  });
}

export async function returnBook(actor: LibraryActor, barcode: string) {
  return db.transaction(async (trx) => {
    const copy = await trx('library_copies')
      .where({ college_id: actor.collegeId })
      .where((q) => {
        q.where('barcode', barcode).orWhere('accession_number', barcode);
      })
      .forUpdate()
      .first();
    if (!copy) throw new AppError(404, 'Copy not found');

    const loan = await trx('library_loans')
      .where({ copy_id: copy.id, college_id: actor.collegeId })
      .whereIn('status', ['ACTIVE', 'OVERDUE'])
      .forUpdate()
      .first();
    if (!loan) throw new AppError(404, 'No active loan for this copy');

    const returnedAt = new Date();
    await trx('library_loans').where({ id: loan.id }).update({
      status: 'RETURNED',
      returned_at: returnedAt,
      returned_by: actor.facultyUserId,
    });

    // Generate overdue fine if applicable
    if (loan.status === 'OVERDUE' || returnedAt > new Date(loan.due_at)) {
      await generateOverdueFine(Number(loan.id), actor.collegeId, trx);
    }

    // Check reservation queue — promote next or set AVAILABLE
    const nextStatus = await promoteReservationQueue(trx, actor.collegeId, Number(copy.catalog_item_id), Number(copy.id));

    await trx('library_copies').where({ id: copy.id }).update({ status: nextStatus });

    await recordLibraryAudit({
      collegeId: actor.collegeId,
      actorId: actor.facultyUserId,
      action: 'RETURN',
      entityType: 'library_loan',
      entityId: Number(loan.id),
      afterState: { copyStatus: nextStatus },
    });

    return loadLoan(trx, Number(loan.id), actor.collegeId);
  });
}

export async function renewLoan(
  actorOrMember: LibraryActor | { memberId: number; collegeId: number },
  loanId: number,
) {
  const collegeId = actorOrMember.collegeId;
  const memberId = 'memberId' in actorOrMember ? actorOrMember.memberId : undefined;

  return db.transaction(async (trx) => {
    const loan = await trx('library_loans')
      .where({ id: loanId, college_id: collegeId })
      .forUpdate()
      .first();
    if (!loan) throw new AppError(404, 'Loan not found');
    if (memberId && Number(loan.member_id) !== memberId) throw new AppError(403, 'Access denied');
    if (!['ACTIVE', 'OVERDUE'].includes(loan.status)) throw new AppError(400, 'Loan cannot be renewed');

    const policy = await resolvePolicyForMember(Number(loan.member_id), collegeId);
    if (!policy.renewalAllowed) throw new AppError(400, 'Renewal not allowed by policy');
    if (Number(loan.renewal_count) >= policy.maxRenewals) throw new AppError(400, 'Renewal limit reached');

    // Deny if reservation queue exists for this title
    const waiting = await trx('library_reservations')
      .where({ catalog_item_id: loan.catalog_item_id, college_id: collegeId, status: 'ACTIVE' })
      .count({ c: '*' })
      .first();
    if (Number(waiting?.c ?? 0) > 0) throw new AppError(409, 'Another member is waiting for this title');

    const tz = await collegeTz(collegeId);
    const newDue = addDaysPreservingWallClock(new Date(loan.due_at), policy.loanDays, tz);

    await trx('library_loans').where({ id: loanId }).update({
      due_at: newDue,
      renewal_count: Number(loan.renewal_count) + 1,
      status: 'ACTIVE',
    });

    const actorId = 'facultyUserId' in actorOrMember ? actorOrMember.facultyUserId : null;
    await recordLibraryAudit({
      collegeId,
      actorId,
      actorType: actorId ? 'FACULTY' : 'STUDENT',
      action: 'RENEWAL',
      entityType: 'library_loan',
      entityId: loanId,
      afterState: { newDue, renewalCount: Number(loan.renewal_count) + 1 },
    });

    return loadLoan(trx, loanId, collegeId);
  });
}

export async function markLoanLost(actor: LibraryActor, loanId: number, chargeAmount: number, remarks?: string) {
  return db.transaction(async (trx) => {
    const loan = await trx('library_loans').where({ id: loanId, college_id: actor.collegeId }).forUpdate().first();
    if (!loan) throw new AppError(404, 'Loan not found');

    await trx('library_loans').where({ id: loanId }).update({ status: 'LOST' });
    await trx('library_copies').where({ id: loan.copy_id }).update({ status: 'LOST' });

    const { createLostFine } = await import('./fines.js');
    const fine = await createLostFine(trx, {
      collegeId: actor.collegeId,
      memberId: Number(loan.member_id),
      loanId,
      amount: chargeAmount,
      assessedBy: actor.facultyUserId,
      remarks,
    });

    await trx('library_damage_events').insert({
      college_id: actor.collegeId,
      loan_id: loanId,
      copy_id: loan.copy_id,
      event_type: 'LOST',
      charge_amount: chargeAmount,
      fine_id: fine.id,
      assessed_by: actor.facultyUserId,
      remarks: remarks ?? null,
    });

    await recordLibraryAudit({
      collegeId: actor.collegeId,
      actorId: actor.facultyUserId,
      action: 'LOST',
      entityType: 'library_loan',
      entityId: loanId,
      afterState: { chargeAmount },
    });

    return { loan: await loadLoan(trx, loanId, actor.collegeId), fine };
  });
}

async function loadLoan(trx: Knex.Transaction | typeof db, loanId: number, collegeId: number) {
  const loan = await trx('library_loans as l')
    .join('library_copies as c', 'c.id', 'l.copy_id')
    .join('library_catalog_items as ci', 'ci.id', 'l.catalog_item_id')
    .where('l.id', loanId)
    .where('l.college_id', collegeId)
    .select('l.*', 'c.accession_number', 'c.barcode', 'ci.title', 'ci.authors')
    .first();

  if (!loan) throw new AppError(404, 'Loan not found');

  const tz = await collegeTz(collegeId);
  const today = todayInTimezone(tz);
  const dueDate = new Date(loan.due_at).toISOString().slice(0, 10);
  let displayStatus = loan.status;
  if (loan.status === 'ACTIVE' && dueDate < today) displayStatus = 'OVERDUE';

  const policy = await resolvePolicyForMember(Number(loan.member_id), collegeId);
  const renewalsLeft = Math.max(0, policy.maxRenewals - Number(loan.renewal_count));

  return {
    id: Number(loan.id),
    memberId: Number(loan.member_id),
    copyId: Number(loan.copy_id),
    catalogItemId: Number(loan.catalog_item_id),
    title: loan.title,
    authors: loan.authors,
    accessionNumber: loan.accession_number,
    barcode: loan.barcode,
    issuedAt: loan.issued_at,
    dueAt: loan.due_at,
    returnedAt: loan.returned_at,
    renewalCount: Number(loan.renewal_count),
    renewalsLeft,
    status: displayStatus,
    rawStatus: loan.status,
  };
}

export async function getLoan(loanId: number, collegeId: number) {
  return loadLoan(db, loanId, collegeId);
}

export async function listMemberLoans(memberId: number, collegeId: number, activeOnly = false) {
  let query = db('library_loans').where({ member_id: memberId, college_id: collegeId });
  if (activeOnly) query = query.whereIn('status', ['ACTIVE', 'OVERDUE']);
  const loans = await query.orderBy('issued_at', 'desc');
  return Promise.all(loans.map((l) => loadLoan(db, Number(l.id), collegeId)));
}

export async function listMemberHistory(memberId: number, collegeId: number) {
  return listMemberLoans(memberId, collegeId, false);
}

export async function sendDueReminders(collegeId: number) {
  const tz = await collegeTz(collegeId);
  const today = todayInTimezone(tz);
  const tomorrow = addDaysPreservingWallClock(new Date(`${today}T12:00:00`), 1, tz).toISOString().slice(0, 10);
  const threeDays = addDaysPreservingWallClock(new Date(`${today}T12:00:00`), 3, tz).toISOString().slice(0, 10);

  const loans = await db('library_loans as l')
    .join('library_members as m', 'm.id', 'l.member_id')
    .where('l.college_id', collegeId)
    .whereIn('l.status', ['ACTIVE', 'OVERDUE'])
    .whereNotNull('m.student_id')
    .select('l.*', 'm.student_id');

  let sent = 0;
  for (const loan of loans) {
    const dueDate = new Date(loan.due_at).toISOString().slice(0, 10);
    if (dueDate === tomorrow || dueDate === threeDays) {
      await notifyLoanDue(Number(loan.student_id), collegeId, Number(loan.id), dueDate);
      sent++;
    }
  }
  return { sent };
}
