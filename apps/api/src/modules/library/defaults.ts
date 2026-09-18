import { db } from '../../db/index.js';

const DEFAULT_POLICIES = [
  { memberType: 'STUDENT', programCode: 'UG', maxActiveLoans: 4, loanDays: 14, maxRenewals: 2, finePerDay: 5, graceDays: 0, reservationLimit: 3 },
  { memberType: 'STUDENT', programCode: 'PG', maxActiveLoans: 6, loanDays: 21, maxRenewals: 2, finePerDay: 5, graceDays: 0, reservationLimit: 4 },
  { memberType: 'FACULTY', programCode: null, maxActiveLoans: 10, loanDays: 90, maxRenewals: 3, finePerDay: 0, graceDays: 7, reservationLimit: 5 },
  { memberType: 'STAFF', programCode: null, maxActiveLoans: 5, loanDays: 30, maxRenewals: 2, finePerDay: 5, graceDays: 0, reservationLimit: 3 },
];

export async function ensureCollegeLibraryDefaults(collegeId: number) {
  if (!(await db.schema.hasTable('library_borrowing_policies'))) return;

  for (const policy of DEFAULT_POLICIES) {
    let programId: number | null = null;
    if (policy.programCode) {
      const prog = await db('programs')
        .where({ college_id: collegeId })
        .where((q) => {
          if (policy.programCode === 'UG') q.where('name', 'like', '%UG%').orWhere('code', 'like', '%UG%');
          else q.where('name', 'like', '%PG%').orWhere('code', 'like', '%PG%');
        })
        .first();
      programId = prog ? Number(prog.id) : null;
    }

    const existing = await db('library_borrowing_policies')
      .where({ college_id: collegeId, member_type: policy.memberType })
      .where((q) => {
        if (programId) q.where({ program_id: programId });
        else q.whereNull('program_id');
      })
      .first();

    if (!existing) {
      await db('library_borrowing_policies').insert({
        college_id: collegeId,
        member_type: policy.memberType,
        program_id: programId,
        max_active_loans: policy.maxActiveLoans,
        loan_days: policy.loanDays,
        max_renewals: policy.maxRenewals,
        fine_per_day: policy.finePerDay,
        grace_days: policy.graceDays,
        reservation_limit: policy.reservationLimit,
        renewal_allowed: true,
        block_issue_on_fine: false,
        pickup_hold_days: 3,
        is_active: true,
      });
    }
  }
}
