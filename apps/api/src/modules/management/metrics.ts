/**
 * Management & Executive Portal — efficient executive metric provider.
 *
 * The canonical Principal dashboard computes department metrics with a
 * per-department subquery loop (O(departments) round-trips). At institution
 * scale that is an N+1 explosion (contract §44). This provider computes the
 * SAME metric DEFINITIONS with set-based GROUP BY aggregates — a bounded number
 * of queries regardless of department count — feeding the command center,
 * department scorecards and the exceptions engine. Definitions are kept
 * deliberately identical to the canonical academic-leadership helpers so the
 * portal and the Principal dashboard never disagree:
 *
 *   students            = distinct APPROVED academic_class_enrollments
 *   faculty             = ACTIVE-ish employees with FACULTY category or a linked
 *                         faculty_user_id (distinct)
 *   studentAttendance%  = present rows / total rows over attendance_records
 *                         (present = PRESENT|LATE|OD)
 *   facultyAttendance%  = month-to-date present / total over
 *                         employee_attendance_records
 *                         (present = PRESENT|ON_DUTY|WORK_FROM_HOME|HALF_DAY)
 *   continuityExceptions= unresolved hr_leave_academic_coverage rows
 *   placementRate       = distinct placed / distinct registered (per dept)
 */
import { db } from '../../db/index.js';
import { pct, num } from './sources.js';

const EMP_ACTIVE = ['ACTIVE', 'PROBATION', 'CONFIRMED', 'ON_NOTICE'];
const STU_PRESENT = ['PRESENT', 'LATE', 'OD'];
const FAC_PRESENT = ['PRESENT', 'ON_DUTY', 'WORK_FROM_HOME', 'HALF_DAY'];
const PLACED = ['ACCEPTED', 'JOINED'];
const REGISTERED = ['REGISTERED', 'ACTIVE'];

async function has(table: string): Promise<boolean> {
  try {
    return await db.schema.hasTable(table);
  } catch {
    return false;
  }
}

function monthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export type InstitutionKpis = {
  students: number;
  faculty: number;
  programs: number;
  departments: number;
  studentAttendancePct: number | null;
  facultyAttendancePct: number | null;
  generatedAt: string;
};

export async function institutionKpis(collegeId: number): Promise<InstitutionKpis> {
  const [students, faculty, programs, departments, stuAtt, facAtt] = await Promise.all([
    (async () =>
      (await has('academic_class_enrollments'))
        ? num(
            (
              await db('academic_class_enrollments')
                .where({ college_id: collegeId, status: 'APPROVED' })
                .countDistinct({ c: 'student_id' })
                .first()
            )?.c,
          )
        : 0)(),
    (async () =>
      (await has('employees'))
        ? num(
            (
              await db('employees as e')
                .where('e.college_id', collegeId)
                .whereIn('e.employment_status', EMP_ACTIVE)
                .where((b) => b.where('e.employee_category', 'FACULTY').orWhereNotNull('e.faculty_user_id'))
                .countDistinct({ c: 'e.id' })
                .first()
            )?.c,
          )
        : 0)(),
    (async () =>
      (await has('programs'))
        ? num((await db('programs').where({ college_id: collegeId }).count({ c: '*' }).first())?.c)
        : 0)(),
    num((await db('departments').where({ college_id: collegeId }).count({ c: '*' }).first())?.c),
    studentAttendanceInstitution(collegeId),
    facultyAttendanceInstitution(collegeId),
  ]);
  return {
    students,
    faculty,
    programs,
    departments,
    studentAttendancePct: stuAtt,
    facultyAttendancePct: facAtt,
    generatedAt: new Date().toISOString(),
  };
}

async function studentAttendanceInstitution(collegeId: number): Promise<number | null> {
  if (!(await has('attendance_records')) || !(await has('attendance_sessions'))) return null;
  const row = await db('attendance_records as r')
    .join('attendance_sessions as s', 's.id', 'r.attendance_session_id')
    .where('s.college_id', collegeId)
    .select(
      db.raw('count(*) as total'),
      db.raw('sum(case when upper(r.status) in (?, ?, ?) then 1 else 0 end) as present', STU_PRESENT),
    )
    .first();
  const total = num((row as Record<string, unknown>)?.total);
  return total ? pct(num((row as Record<string, unknown>)?.present), total) : null;
}

async function facultyAttendanceInstitution(collegeId: number): Promise<number | null> {
  if (!(await has('employee_attendance_records'))) return null;
  const row = await db('employee_attendance_records')
    .where({ college_id: collegeId })
    .andWhere('attendance_date', '>=', monthStart())
    .select(
      db.raw('count(*) as total'),
      db.raw('sum(case when attendance_status in (?, ?, ?, ?) then 1 else 0 end) as present', FAC_PRESENT),
    )
    .first();
  const total = num((row as Record<string, unknown>)?.total);
  return total ? pct(num((row as Record<string, unknown>)?.present), total) : null;
}

export type DeptRow = {
  departmentId: number;
  departmentName: string;
  departmentCode: string | null;
  students: number;
  faculty: number;
  studentAttendancePct: number | null;
  facultyAttendancePct: number | null;
  continuityExceptions: number;
  registered: number;
  placed: number;
  placementRate: number | null;
};

/**
 * Set-based per-department comparison. A bounded number of GROUP BY queries,
 * then assembled in memory. Only departments that actually have students or
 * faculty are returned (empty departments are institutional noise, never a real
 * 0-signal for leadership).
 */
export async function departmentComparison(collegeId: number): Promise<DeptRow[]> {
  const depts = (await db('departments').where({ college_id: collegeId }).select('id', 'name', 'code')) as Array<{
    id: number;
    name: string;
    code: string | null;
  }>;
  const map = new Map<number, DeptRow>();
  for (const d of depts) {
    map.set(Number(d.id), {
      departmentId: Number(d.id),
      departmentName: d.name,
      departmentCode: d.code ?? null,
      students: 0,
      faculty: 0,
      studentAttendancePct: null,
      facultyAttendancePct: null,
      continuityExceptions: 0,
      registered: 0,
      placed: 0,
      placementRate: null,
    });
  }
  const bump = (id: unknown, patch: Partial<DeptRow>) => {
    const key = Number(id);
    const cur = map.get(key);
    if (cur) Object.assign(cur, patch);
  };

  // Students per department (distinct approved enrollments).
  if (await has('academic_class_enrollments')) {
    const rows = await db('academic_class_enrollments as en')
      .join('academic_classes as ac', 'ac.id', 'en.academic_class_id')
      .where({ 'en.college_id': collegeId, 'en.status': 'APPROVED' })
      .whereNotNull('ac.department_id')
      .groupBy('ac.department_id')
      .select('ac.department_id', db.raw('count(distinct en.student_id) as c'));
    for (const r of rows as Array<Record<string, unknown>>) bump(r.department_id, { students: num(r.c) });
  }

  // Faculty per department.
  if (await has('employees')) {
    const rows = await db('employees as e')
      .where('e.college_id', collegeId)
      .whereIn('e.employment_status', EMP_ACTIVE)
      .where((b) => b.where('e.employee_category', 'FACULTY').orWhereNotNull('e.faculty_user_id'))
      .whereNotNull('e.department_id')
      .groupBy('e.department_id')
      .select('e.department_id', db.raw('count(distinct e.id) as c'));
    for (const r of rows as Array<Record<string, unknown>>) bump(r.department_id, { faculty: num(r.c) });
  }

  // Student attendance per department.
  if ((await has('attendance_records')) && (await has('attendance_sessions'))) {
    const rows = await db('attendance_records as r')
      .join('attendance_sessions as s', 's.id', 'r.attendance_session_id')
      .join('academic_classes as ac', 'ac.id', 's.academic_class_id')
      .where('s.college_id', collegeId)
      .whereNotNull('ac.department_id')
      .groupBy('ac.department_id')
      .select(
        'ac.department_id',
        db.raw('count(*) as total'),
        db.raw('sum(case when upper(r.status) in (?, ?, ?) then 1 else 0 end) as present', STU_PRESENT),
      );
    for (const r of rows as Array<Record<string, unknown>>) {
      bump(r.department_id, { studentAttendancePct: pct(num(r.present), num(r.total)) });
    }
  }

  // Faculty attendance per department (month-to-date).
  if (await has('employee_attendance_records')) {
    const rows = await db('employee_attendance_records as ar')
      .join('employees as e', 'e.id', 'ar.employee_id')
      .where('ar.college_id', collegeId)
      .andWhere('ar.attendance_date', '>=', monthStart())
      .whereNotNull('e.department_id')
      .groupBy('e.department_id')
      .select(
        'e.department_id',
        db.raw('count(*) as total'),
        db.raw('sum(case when ar.attendance_status in (?, ?, ?, ?) then 1 else 0 end) as present', FAC_PRESENT),
      );
    for (const r of rows as Array<Record<string, unknown>>) {
      bump(r.department_id, { facultyAttendancePct: pct(num(r.present), num(r.total)) });
    }
  }

  // Continuity exceptions per department.
  if ((await has('hr_leave_academic_coverage')) && (await has('hr_leave_requests'))) {
    const rows = await db('hr_leave_academic_coverage as c')
      .join('hr_leave_requests as lr', 'lr.id', 'c.leave_request_id')
      .join('employees as e', 'e.id', 'lr.employee_id')
      .where('c.college_id', collegeId)
      .where((b) => b.whereIn('c.status', ['UNRESOLVED', 'REQUESTED']).orWhere('c.hod_action_required', true))
      .whereNotNull('e.department_id')
      .groupBy('e.department_id')
      .select('e.department_id', db.raw('count(*) as c'));
    for (const r of rows as Array<Record<string, unknown>>) bump(r.department_id, { continuityExceptions: num(r.c) });
  }

  // Placement per department (registered / placed distinct students).
  if (
    (await has('placement_registrations')) &&
    (await has('placement_offers')) &&
    (await has('academic_class_enrollments'))
  ) {
    const regRows = await db('placement_registrations as pr')
      .join('academic_class_enrollments as en', 'en.student_id', 'pr.student_id')
      .join('academic_classes as ac', 'ac.id', 'en.academic_class_id')
      .where('pr.college_id', collegeId)
      .whereIn('pr.status', REGISTERED)
      .where('en.status', 'APPROVED')
      .whereNotNull('ac.department_id')
      .groupBy('ac.department_id')
      .select('ac.department_id', db.raw('count(distinct pr.student_id) as c'));
    for (const r of regRows as Array<Record<string, unknown>>) bump(r.department_id, { registered: num(r.c) });

    const offRows = await db('placement_offers as po')
      .join('academic_class_enrollments as en', 'en.student_id', 'po.student_id')
      .join('academic_classes as ac', 'ac.id', 'en.academic_class_id')
      .where('po.college_id', collegeId)
      .whereIn('po.offer_status', PLACED)
      .where('en.status', 'APPROVED')
      .whereNotNull('ac.department_id')
      .groupBy('ac.department_id')
      .select('ac.department_id', db.raw('count(distinct po.student_id) as c'));
    for (const r of offRows as Array<Record<string, unknown>>) bump(r.department_id, { placed: num(r.c) });
  }

  const result: DeptRow[] = [];
  for (const row of map.values()) {
    if (row.students === 0 && row.faculty === 0) continue; // skip empty departments
    row.placementRate = row.registered > 0 ? pct(row.placed, row.registered) : null;
    result.push(row);
  }
  result.sort((a, b) => b.students - a.students || a.departmentName.localeCompare(b.departmentName));
  return result;
}
