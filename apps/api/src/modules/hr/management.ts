import { db } from '../../db/index.js';
import type { HrActor } from './types.js';
import { assertHrPermission } from './access.js';

export async function managementDashboard(actor: HrActor) {
  assertHrPermission(actor, 'hr.management.view');
  const collegeId = actor.collegeId;

  const [byDept, byDesignation, byType, headcount] = await Promise.all([
    db('employees as e')
      .leftJoin('departments as d', 'd.id', 'e.department_id')
      .where({ 'e.college_id': collegeId, 'e.employment_status': 'ACTIVE' })
      .groupBy('d.id', 'd.name')
      .select('d.name as department', db.raw('count(*) as count')),
    db('employees as e')
      .leftJoin('hr_designations as des', 'des.id', 'e.designation_id')
      .where({ 'e.college_id': collegeId, 'e.employment_status': 'ACTIVE' })
      .groupBy('des.id', 'des.name')
      .select('des.name as designation', db.raw('count(*) as count')),
    db('employees as e')
      .leftJoin('employment_types as et', 'et.id', 'e.employment_type_id')
      .where({ 'e.college_id': collegeId, 'e.employment_status': 'ACTIVE' })
      .groupBy('et.id', 'et.name')
      .select('et.name as employment_type', db.raw('count(*) as count')),
    db('employees').where({ college_id: collegeId }).count('* as c').first(),
  ]);

  return {
    totalHeadcount: Number((headcount as Record<string, unknown>)?.c ?? 0),
    byDepartment: byDept,
    byDesignation: byDesignation,
    byEmploymentType: byType,
  };
}
