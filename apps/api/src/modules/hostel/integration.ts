import { db } from '../../db/index.js';
import { createAdHocDemand } from '../finance/demands.js';
import { getFeeHeadByCode } from '../finance/feeHeads.js';
import { getHostelPolicy } from './defaults.js';

export async function createHostelAdmissionDemand(
  collegeId: number,
  studentId: number,
  applicationId: number,
  academicYearId: number,
) {
  const policy = await getHostelPolicy(collegeId);
  if (!policy.securityDepositRequired) return null;

  const admissionHead = await getFeeHeadByCode(collegeId, 'HOSTEL_FEE');
  if (!admissionHead) return null;

  const app = await db('hostel_applications').where({ id: applicationId }).first();
  let amount = 15000;
  if (app?.preferred_hostel_id) {
    const plan = await db('hostel_fee_plans')
      .where({ college_id: collegeId, hostel_id: app.preferred_hostel_id, fee_type: 'HOSTEL_ADMISSION_FEE', status: 'ACTIVE' })
      .first();
    if (plan) amount = Number(plan.amount);
  }

  const demand = await createAdHocDemand(collegeId, {
    studentId,
    academicYearId,
    demandType: 'HOSTEL_FEE',
    sourceType: 'hostel_application',
    sourceId: applicationId,
    items: [{ feeHeadId: Number(admissionHead.id), amount, description: 'Hostel admission fee' }],
  });
  return demand;
}

export async function createHostelDamageDemand(
  collegeId: number,
  studentId: number,
  damageId: number,
  academicYearId: number,
  amount: number,
) {
  const damageHead = await getFeeHeadByCode(collegeId, 'HOSTEL_FEE');
  if (!damageHead) return null;

  const demand = await createAdHocDemand(collegeId, {
    studentId,
    academicYearId,
    demandType: 'HOSTEL_DAMAGE_CHARGE',
    sourceType: 'hostel_damage',
    sourceId: damageId,
    items: [{ feeHeadId: Number(damageHead.id), amount, description: 'Hostel damage charge' }],
  });

  await db('hostel_damage_assessments').where({ id: damageId }).update({
    finance_demand_id: demand.id,
    status: 'CHARGED',
  });

  return demand;
}

export async function getStudentHostelDues(studentId: number, collegeId: number) {
  const demands = await db('student_fee_demands')
    .where({ student_id: studentId, college_id: collegeId })
    .whereIn('demand_type', ['HOSTEL_FEE', 'HOSTEL_DAMAGE_CHARGE', 'MESS_FEE'])
    .whereNot('status', 'CANCELLED');

  const total = demands.reduce((acc, d) => acc + Number(d.outstanding_amount), 0);
  const items = demands.map((d) => ({
    demandType: d.demand_type,
    description: d.description ?? d.demand_type,
    amount: Number(d.net_amount),
    paid: Number(d.paid_amount),
    outstanding: Number(d.outstanding_amount),
    status: d.status,
    demandId: Number(d.id),
  }));

  return { totalOutstanding: total.toFixed(2), items };
}

export async function isHostelFinanceClear(studentId: number, collegeId: number): Promise<boolean> {
  const dues = await getStudentHostelDues(studentId, collegeId);
  return Number(dues.totalOutstanding) <= 0;
}

export async function canAllocateAfterPayment(studentId: number, collegeId: number): Promise<boolean> {
  const policy = await getHostelPolicy(collegeId);
  if (policy.allocationPaymentPolicy === 'NO_PAYMENT_BLOCK') return true;
  if (policy.allocationPaymentPolicy === 'PAY_AFTER_ALLOCATION') return true;
  return isHostelFinanceClear(studentId, collegeId);
}
