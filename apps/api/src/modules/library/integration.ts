import { db } from '../../db/index.js';
import { createAdHocDemand } from '../finance/demands.js';
import { getFeeHeadByCode } from '../finance/feeHeads.js';

/** Create a Finance demand for a library fine. Idempotent via source reference. */
export async function createLibraryFineDemand(collegeId: number, fineId: number) {
  if (!(await db.schema.hasTable('library_fines'))) return null;
  if (!(await db.schema.hasTable('student_fee_demands'))) return null;

  const fine = await db('library_fines as f')
    .join('library_members as m', 'm.id', 'f.member_id')
    .where('f.id', fineId)
    .where('f.college_id', collegeId)
    .select('f.*', 'm.student_id')
    .first();

  if (!fine || !fine.student_id) return null;
  if (fine.finance_demand_id) return fine.finance_demand_id;

  const student = await db('students').where({ id: fine.student_id, college_id: collegeId }).first();
  if (!student) return null;

  let head = await getFeeHeadByCode(collegeId, 'LIBRARY_FINE');
  if (!head) head = await getFeeHeadByCode(collegeId, 'LIBRARY_FEE');
  if (!head) head = await getFeeHeadByCode(collegeId, 'MISCELLANEOUS');
  if (!head) return null;

  const demand = await createAdHocDemand(collegeId, {
    studentId: Number(fine.student_id),
    academicYearId: Number(student.academic_year_id),
    semesterId: student.semester_id ? Number(student.semester_id) : undefined,
    demandType: 'LIBRARY_FINE',
    sourceType: 'library_fine',
    sourceId: fineId,
    items: [
      {
        feeHeadId: Number(head.id),
        amount: Number(fine.outstanding_amount),
        description: `Library fine #${fineId} (${fine.fine_type})`,
      },
    ],
  });

  await db('library_fines').where({ id: fineId }).update({ finance_demand_id: demand.id });
  return demand.id;
}
