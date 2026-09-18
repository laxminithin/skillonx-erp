import { db } from '../../db/index.js';
import type {
  FinancialClearanceResult,
  NoDueDomainStatus,
} from './types.js';
import { compareMoney, toMoney } from './money.js';
import { getStudentOutstandingTotal, getNextDueDate } from './demands.js';
import { getFinancePolicy } from './feeHeads.js';
import { getLibraryNoDueStatus } from '../library/clearance.js';
import { getHostelNoDueStatus } from '../hostel/clearance.js';
import { getTransportNoDueStatus } from '../transport/clearance.js';

/** Central finance clearance API for other domains. */
export async function getFinancialClearance(
  studentId: number,
  collegeId: number,
): Promise<FinancialClearanceResult> {
  const policy = await getFinancePolicy(collegeId);
  const outstanding = await getStudentOutstandingTotal(studentId, collegeId);
  const hasDue = compareMoney(outstanding, 0) > 0;
  const financeStatus: NoDueDomainStatus = hasDue ? 'DUE' : 'CLEAR';

  let libraryStatus: NoDueDomainStatus = 'NOT_APPLICABLE';
  try {
    if (await db.schema.hasTable('library_members')) {
      const lib = await getLibraryNoDueStatus(studentId, collegeId);
      libraryStatus =
        lib.status === 'BLOCKED' ? 'DUE' : (lib.status as NoDueDomainStatus);
    }
  } catch {
    libraryStatus = 'PENDING_INTEGRATION';
  }

  let hostelStatus: NoDueDomainStatus = 'NOT_APPLICABLE';
  try {
    if (await db.schema.hasTable('hostel_residents')) {
      const hostel = await getHostelNoDueStatus(studentId, collegeId);
      hostelStatus = hostel.status === 'BLOCKED' ? 'DUE' : (hostel.status as NoDueDomainStatus);
    }
  } catch {
    hostelStatus = 'PENDING_INTEGRATION';
  }

  let transportStatus: NoDueDomainStatus = 'NOT_APPLICABLE';
  try {
    if (await db.schema.hasTable('transport_members')) {
      const transport = await getTransportNoDueStatus(studentId, collegeId);
      transportStatus = transport.status === 'BLOCKED' ? 'DUE' : (transport.status as NoDueDomainStatus);
    }
  } catch {
    transportStatus = 'PENDING_INTEGRATION';
  }

  const domains: Record<string, NoDueDomainStatus> = {
    FINANCE: financeStatus,
    LIBRARY: libraryStatus,
    HOSTEL: hostelStatus,
    TRANSPORT: transportStatus,
    LAB: 'PENDING_INTEGRATION',
  };

  let cleared = !hasDue;
  if (policy.financialClearanceMode === 'WARN') cleared = true;
  if (policy.financialClearanceMode === 'ALLOW') cleared = true;

  return {
    cleared,
    mode: policy.financialClearanceMode,
    outstandingAmount: outstanding,
    domains,
  };
}

export async function getStudentNoDueStatus(studentId: number, collegeId: number) {
  const clearance = await getFinancialClearance(studentId, collegeId);
  return {
    domains: Object.entries(clearance.domains).map(([domain, status]) => ({
      domain,
      status,
      label: domainLabels[domain] ?? domain,
    })),
    overallClear: Object.values(clearance.domains).every(
      (s) => s === 'CLEAR' || s === 'NOT_APPLICABLE' || s === 'WAIVED',
    ),
  };
}

const domainLabels: Record<string, string> = {
  FINANCE: 'Finance',
  LIBRARY: 'Library',
  HOSTEL: 'Hostel',
  TRANSPORT: 'Transport',
  LAB: 'Lab / Department',
};

export async function hasOutstandingDues(studentId: number, collegeId: number): Promise<boolean> {
  const total = await getStudentOutstandingTotal(studentId, collegeId);
  return compareMoney(total, 0) > 0;
}

export async function getStudentFinancialStatus(studentId: number, collegeId: number) {
  const demands = await db('student_fee_demands')
    .where({ student_id: studentId, college_id: collegeId })
    .whereNot('status', 'CANCELLED');

  const totalFees = demands.reduce((acc, d) => acc + Number(d.net_amount), 0);
  const paid = demands.reduce((acc, d) => acc + Number(d.paid_amount), 0);
  const outstanding = demands.reduce((acc, d) => acc + Number(d.outstanding_amount), 0);
  const nextDue = await getNextDueDate(studentId, collegeId);

  return {
    totalFees: toMoney(totalFees),
    paid: toMoney(paid),
    outstanding: toMoney(outstanding),
    nextDueDate: nextDue,
    demandCount: demands.length,
  };
}

export async function getExamFinancialEligibility(
  studentId: number,
  collegeId: number,
  examId?: number,
): Promise<{ eligible: boolean; reasonCode?: string; outstandingAmount: string }> {
  let examFeeRequired = false;
  if (examId) {
    const exam = await db('examinations as e')
      .leftJoin('exam_policies as p', 'p.id', 'e.exam_policy_id')
      .where('e.id', examId)
      .select('p.exam_fee_paid_required')
      .first();
    examFeeRequired = !!exam?.exam_fee_paid_required;
  } else {
    const policy = await getFinancePolicy(collegeId);
    examFeeRequired = policy.examFeePaidRequired;
  }

  if (!examFeeRequired) {
    return { eligible: true, outstandingAmount: '0.00' };
  }

  const examDemands = await db('student_fee_demands')
    .where({ student_id: studentId, college_id: collegeId })
    .whereIn('demand_type', ['EXAMINATION_FEE', 'EXAM_FEE', 'SEE_FEE', 'BACKLOG_EXAM_FEE'])
    .whereIn('status', ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE']);

  const outstanding = examDemands.reduce((acc, d) => acc + Number(d.outstanding_amount), 0);
  const totalOutstanding = await getStudentOutstandingTotal(studentId, collegeId);

  if (compareMoney(outstanding, 0) > 0 || compareMoney(totalOutstanding, 0) > 0) {
    return {
      eligible: false,
      reasonCode: 'EXAM_FEE_PENDING',
      outstandingAmount: toMoney(outstanding || totalOutstanding),
    };
  }

  return { eligible: true, outstandingAmount: '0.00' };
}

export async function getExamFeeStatus(studentId: number, collegeId: number) {
  return getExamFinancialEligibility(studentId, collegeId);
}
