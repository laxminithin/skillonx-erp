import { db } from '../../db/index.js';
import { createAdHocDemand } from './demands.js';
import { getFeeHeadByCode } from './feeHeads.js';
import { getFinancialClearance } from './clearance.js';

/** Create a fee demand for a student service request when fee is required. */
export async function createServiceRequestFeeDemand(
  collegeId: number,
  studentId: number,
  requestTypeCode: string,
  requestId: number,
) {
  if (!(await db.schema.hasTable('student_fee_demands'))) return null;

  const typeRow = await db('student_service_request_types')
    .where({ college_id: collegeId, code: requestTypeCode })
    .first();
  if (!typeRow?.fee_required || !typeRow.fee_amount) return null;

  const student = await db('students').where({ id: studentId, college_id: collegeId }).first();
  if (!student) return null;

  let feeHeadId: number | null = null;
  if (typeRow.fee_head_code) {
    const head = await getFeeHeadByCode(collegeId, typeRow.fee_head_code);
    feeHeadId = head ? Number(head.id) : null;
  }
  if (!feeHeadId) {
    const misc = await getFeeHeadByCode(collegeId, 'MISCELLANEOUS');
    feeHeadId = misc ? Number(misc.id) : null;
  }
  if (!feeHeadId) return null;

  const academicYear = student.academic_year_id
    ? Number(student.academic_year_id)
    : Number((await db('academic_years').where({ college_id: collegeId }).orderBy('id', 'desc').first())?.id ?? 0);
  if (!academicYear) throw new Error('No academic year configured for Finance demand');
  const semester = student.semester_id
    ? Number(student.semester_id)
    : Number((await db('semesters').where({ college_id: collegeId }).orderBy('id', 'desc').first())?.id ?? 0) || undefined;
  return createAdHocDemand(collegeId, {
    studentId,
    academicYearId: academicYear,
    semesterId: semester,
    demandType: 'SERVICE_FEE',
    sourceType: 'student_service_request',
    sourceId: requestId,
    items: [{ feeHeadId, amount: Number(typeRow.fee_amount), description: typeRow.label }],
  });
}

/** Check if student can proceed with a service request based on finance clearance. */
export async function checkServiceFinancialClearance(studentId: number, collegeId: number) {
  return getFinancialClearance(studentId, collegeId);
}

/** Create revaluation fee demand linked to exam_revaluation_requests. */
export async function createRevaluationFeeDemand(
  collegeId: number,
  studentId: number,
  revaluationRequestId: number,
  amount = 500,
) {
  if (!(await db.schema.hasTable('student_fee_demands'))) return null;

  const student = await db('students').where({ id: studentId, college_id: collegeId }).first();
  if (!student) return null;

  const head = await getFeeHeadByCode(collegeId, 'REVALUATION_FEE');
  if (!head) return null;

  const demand = await createAdHocDemand(collegeId, {
    studentId,
    academicYearId: Number(student.academic_year_id),
    semesterId: student.semester_id ? Number(student.semester_id) : undefined,
    demandType: 'REVALUATION_FEE',
    sourceType: 'exam_revaluation_request',
    sourceId: revaluationRequestId,
    items: [{ feeHeadId: Number(head.id), amount, description: 'Revaluation Fee' }],
  });

  if (await db.schema.hasColumn('exam_revaluation_requests', 'finance_demand_id')) {
    await db('exam_revaluation_requests').where({ id: revaluationRequestId }).update({
      finance_demand_id: demand.id,
    });
  }

  return demand;
}

/** Returns true if a service request's linked fee demand is fully paid. */
export async function isServiceRequestFeePaid(requestId: number, collegeId: number): Promise<boolean> {
  if (!(await db.schema.hasTable('student_fee_demands'))) return true;
  const demand = await db('student_fee_demands')
    .where({
      college_id: collegeId,
      source_type: 'student_service_request',
      source_id: requestId,
    })
    .first();
  if (!demand) return true;
  return demand.status === 'PAID';
}
