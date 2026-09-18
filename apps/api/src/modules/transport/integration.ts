import { db } from '../../db/index.js';
import { createAdHocDemand } from '../finance/demands.js';
import { getFeeHeadByCode } from '../finance/feeHeads.js';
import { getTransportPolicy } from './defaults.js';

export async function createTransportFeeDemand(
  collegeId: number,
  studentId: number,
  applicationId: number,
  academicYearId: number,
  routeId?: number,
) {
  const policy = await getTransportPolicy(collegeId);
  if (policy.assignmentPaymentPolicy === 'NO_PAYMENT_BLOCK') return null;

  const existing = await db('student_fee_demands')
    .where({ college_id: collegeId, student_id: studentId, source_type: 'transport_application', source_id: applicationId })
    .whereNot('status', 'CANCELLED')
    .first();
  if (existing) return existing;

  const feeHead = await getFeeHeadByCode(collegeId, 'TRANSPORT_FEE');
  if (!feeHead) return null;

  let amount = 12000;
  const app = await db('transport_applications').where({ id: applicationId }).first();
  const planQuery = db('transport_fee_plans')
    .where({ college_id: collegeId, academic_year_id: academicYearId, status: 'ACTIVE' });
  if (routeId ?? app?.preferred_route_id) {
    planQuery.where({ route_id: routeId ?? app.preferred_route_id });
  }
  const plan = await planQuery.first();
  if (plan) amount = Number(plan.amount);

  const demand = await createAdHocDemand(collegeId, {
    studentId,
    academicYearId,
    demandType: 'TRANSPORT_FEE',
    sourceType: 'transport_application',
    sourceId: applicationId,
    items: [{ feeHeadId: Number(feeHead.id), amount, description: 'Transport fee' }],
  });

  await db('transport_applications').where({ id: applicationId }).update({
    finance_demand_id: demand.id,
  });

  return demand;
}

export async function getStudentTransportDues(studentId: number, collegeId: number) {
  const demands = await db('student_fee_demands')
    .where({ student_id: studentId, college_id: collegeId })
    .whereIn('demand_type', ['TRANSPORT_FEE', 'TRANSPORT_ADMISSION_FEE', 'TRANSPORT_DEPOSIT', 'TRANSPORT_ROUTE_CHANGE_FEE', 'TRANSPORT_DAMAGE_CHARGE', 'TRANSPORT_FINE'])
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

export async function isTransportFinanceClear(studentId: number, collegeId: number): Promise<boolean> {
  const dues = await getStudentTransportDues(studentId, collegeId);
  return Number(dues.totalOutstanding) <= 0;
}

export async function canAssignAfterPayment(studentId: number, collegeId: number): Promise<boolean> {
  const policy = await getTransportPolicy(collegeId);
  if (policy.assignmentPaymentPolicy === 'NO_PAYMENT_BLOCK') return true;
  if (policy.assignmentPaymentPolicy === 'PAY_AFTER_ASSIGNMENT') return true;
  return isTransportFinanceClear(studentId, collegeId);
}
