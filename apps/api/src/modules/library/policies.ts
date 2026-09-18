import { db } from '../../db/index.js';
import type { MemberType } from './types.js';

type PolicyRow = Record<string, unknown>;

export type BorrowingPolicy = {
  id: number;
  memberType: MemberType;
  programId: number | null;
  maxActiveLoans: number;
  loanDays: number;
  maxRenewals: number;
  finePerDay: number;
  graceDays: number;
  reservationLimit: number;
  renewalAllowed: boolean;
  fineCap: number | null;
  blockIssueOnFine: boolean;
  pickupHoldDays: number;
};

function serializePolicy(row: PolicyRow): BorrowingPolicy {
  return {
    id: Number(row.id),
    memberType: row.member_type as MemberType,
    programId: row.program_id != null ? Number(row.program_id) : null,
    maxActiveLoans: Number(row.max_active_loans),
    loanDays: Number(row.loan_days),
    maxRenewals: Number(row.max_renewals),
    finePerDay: Number(row.fine_per_day),
    graceDays: Number(row.grace_days),
    reservationLimit: Number(row.reservation_limit),
    renewalAllowed: !!row.renewal_allowed,
    fineCap: row.fine_cap != null ? Number(row.fine_cap) : null,
    blockIssueOnFine: !!row.block_issue_on_fine,
    pickupHoldDays: Number(row.pickup_hold_days ?? 3),
  };
}

export async function listPolicies(collegeId: number) {
  const rows = await db('library_borrowing_policies')
    .where({ college_id: collegeId, is_active: true })
    .orderBy(['member_type', 'program_id']);
  return rows.map(serializePolicy);
}

export async function resolvePolicyForMember(memberId: number, collegeId: number): Promise<BorrowingPolicy> {
  const member = await db('library_members').where({ id: memberId, college_id: collegeId }).first();
  if (!member) throw new Error('Member not found');

  let programId: number | null = null;
  if (member.student_id) {
    const student = await db('students').where({ id: member.student_id }).first();
    programId = student?.program_id ? Number(student.program_id) : null;
  }

  let policy = await db('library_borrowing_policies')
    .where({ college_id: collegeId, member_type: member.member_type, is_active: true })
    .where((q) => {
      if (programId) q.where({ program_id: programId });
      else q.whereNull('program_id');
    })
    .first();

  if (!policy && programId) {
    policy = await db('library_borrowing_policies')
      .where({ college_id: collegeId, member_type: member.member_type, is_active: true })
      .whereNull('program_id')
      .first();
  }

  if (!policy) {
    policy = await db('library_borrowing_policies')
      .where({ college_id: collegeId, member_type: member.member_type, is_active: true })
      .first();
  }

  if (!policy) {
    return {
      id: 0,
      memberType: member.member_type,
      programId: null,
      maxActiveLoans: 4,
      loanDays: 14,
      maxRenewals: 2,
      finePerDay: 5,
      graceDays: 0,
      reservationLimit: 3,
      renewalAllowed: true,
      fineCap: null,
      blockIssueOnFine: false,
      pickupHoldDays: 3,
    };
  }

  return serializePolicy(policy);
}
