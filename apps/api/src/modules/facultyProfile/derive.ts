import { db } from '../../db/index.js';
import type { EmployeeScope } from './access.js';
import type { FacultyProfileActor } from './types.js';

/**
 * Derived (read-only) academic contributions. These are PROJECTED from the
 * authoritative modules (academic classes/LMS, mentoring, coordinator,
 * academic leadership, student projects) and never duplicated as writable
 * faculty records (spec §B6/§B16/§B18 "derive where an authoritative
 * assignment already exists"). Keyed on the faculty_users id, which is stable
 * across HRMS designation/department changes so history is preserved.
 */
export async function derivedTeaching(actor: FacultyProfileActor, employee: EmployeeScope) {
  if (!employee.facultyUserId) return [];
  const rows = await db('academic_class_subject_faculty as acsf')
    .join('academic_classes as ac', 'ac.id', 'acsf.academic_class_id')
    .join('courses as c', 'c.id', 'acsf.course_id')
    .leftJoin('academic_years as ay', 'ay.id', 'ac.academic_year_id')
    .leftJoin('semesters as s', 's.id', 'ac.semester_id')
    .leftJoin('class_sections as cs', 'cs.id', 'ac.class_section_id')
    .leftJoin('programs as p', 'p.id', 'ac.program_id')
    .where('acsf.college_id', actor.collegeId)
    .where('acsf.faculty_id', employee.facultyUserId)
    .select(
      'acsf.id', 'acsf.status', 'acsf.is_primary',
      'ay.label as academic_year', 'ay.is_current',
      's.label as semester', 'cs.label as section',
      'c.code as course_code', 'c.name as course_name', 'c.course_type', 'c.credits',
      'p.name as program',
    )
    .orderBy([{ column: 'ay.label', order: 'desc' }, { column: 'c.code', order: 'asc' }]);
  return rows.map((r) => ({
    id: Number(r.id),
    academicYear: r.academic_year ?? null,
    isCurrent: !!r.is_current,
    semester: r.semester ?? null,
    section: r.section ?? null,
    program: r.program ?? null,
    courseCode: r.course_code,
    courseName: r.course_name,
    courseType: r.course_type ?? null,
    credits: r.credits != null ? Number(r.credits) : null,
    isPrimary: !!r.is_primary,
    status: r.status,
    source: 'ACADEMIC_LMS',
  }));
}

export async function derivedMentoring(actor: FacultyProfileActor, employee: EmployeeScope) {
  if (!employee.facultyUserId) return [];
  const rows = await db('mentor_assignments as ma')
    .leftJoin('academic_years as ay', 'ay.id', 'ma.academic_year_id')
    .where('ma.college_id', actor.collegeId)
    .where('ma.mentor_faculty_id', employee.facultyUserId)
    .select('ma.status', 'ma.is_primary', 'ay.label as academic_year', 'ay.is_current')
    .count('* as _count')
    .groupBy('ma.status', 'ma.is_primary', 'ay.label', 'ay.is_current');
  // Aggregate mentee counts by AY + status.
  const byYear = new Map<string, { academicYear: string | null; isCurrent: boolean; active: number; total: number }>();
  for (const r of rows) {
    const key = String(r.academic_year ?? 'ALL');
    const label = r.academic_year != null ? String(r.academic_year) : null;
    const entry = byYear.get(key) ?? { academicYear: label, isCurrent: !!r.is_current, active: 0, total: 0 };
    const c = Number((r as Record<string, unknown>)._count ?? 0);
    entry.total += c;
    if (String(r.status) === 'ACTIVE') entry.active += c;
    byYear.set(key, entry);
  }
  return Array.from(byYear.values()).sort((a, b) => String(b.academicYear).localeCompare(String(a.academicYear)));
}

export async function derivedCoordination(actor: FacultyProfileActor, employee: EmployeeScope) {
  if (!employee.facultyUserId) return [];
  const rows = await db('academic_classes as ac')
    .leftJoin('academic_years as ay', 'ay.id', 'ac.academic_year_id')
    .leftJoin('class_sections as cs', 'cs.id', 'ac.class_section_id')
    .leftJoin('programs as p', 'p.id', 'ac.program_id')
    .leftJoin('semesters as s', 's.id', 'ac.semester_id')
    .where('ac.college_id', actor.collegeId)
    .where('ac.coordinator_id', employee.facultyUserId)
    .select('ac.id', 'ac.name', 'ac.status', 'ay.label as academic_year', 'ay.is_current', 'cs.label as section', 'p.name as program', 's.label as semester')
    .orderBy('ay.label', 'desc');
  return rows.map((r) => ({
    id: Number(r.id),
    className: r.name,
    academicYear: r.academic_year ?? null,
    isCurrent: !!r.is_current,
    semester: r.semester ?? null,
    section: r.section ?? null,
    program: r.program ?? null,
    status: r.status,
    role: 'CLASS_COORDINATOR',
    source: 'ACADEMIC_LMS',
  }));
}

export async function derivedLeadership(actor: FacultyProfileActor, employee: EmployeeScope) {
  if (!(await db.schema.hasTable('academic_leadership_assignments'))) return [];
  const rows = await db('academic_leadership_assignments as ala')
    .leftJoin('departments as d', 'd.id', 'ala.department_id')
    .where('ala.college_id', actor.collegeId)
    .where('ala.employee_id', employee.id)
    .select('ala.id', 'ala.leadership_role', 'ala.status', 'ala.effective_from', 'ala.effective_to', 'd.name as department')
    .orderBy('ala.effective_from', 'desc');
  return rows.map((r) => ({
    id: Number(r.id),
    role: r.leadership_role,
    department: r.department ?? null,
    effectiveFrom: r.effective_from,
    effectiveTo: r.effective_to ?? null,
    status: r.status,
    isCurrent: String(r.status) === 'ACTIVE' && !r.effective_to,
    source: 'ACADEMIC_LEADERSHIP',
  }));
}

/** Student projects the faculty mentors (spec §B16 — project, don't duplicate). */
export async function derivedStudentProjects(actor: FacultyProfileActor, employee: EmployeeScope) {
  if (!employee.facultyUserId) return [];
  const rows = await db('student_projects as sp')
    .join('students as st', 'st.id', 'sp.student_id')
    .where('sp.college_id', actor.collegeId)
    .where('sp.faculty_mentor_id', employee.facultyUserId)
    .select('sp.id', 'sp.title', 'sp.project_type', 'sp.team_type', 'sp.start_date', 'sp.end_date', 'st.name as student_name', 'st.usn')
    .orderBy('sp.id', 'desc');
  return rows.map((r) => ({
    id: Number(r.id),
    title: r.title,
    projectType: r.project_type,
    teamType: r.team_type,
    startDate: r.start_date ?? null,
    endDate: r.end_date ?? null,
    student: r.student_name,
    usn: r.usn,
    source: 'PLACEMENT_PROJECTS',
  }));
}

export async function allDerived(actor: FacultyProfileActor, employee: EmployeeScope) {
  const [teaching, mentoring, coordination, leadership, studentProjects] = await Promise.all([
    derivedTeaching(actor, employee),
    derivedMentoring(actor, employee),
    derivedCoordination(actor, employee),
    derivedLeadership(actor, employee),
    derivedStudentProjects(actor, employee),
  ]);
  return { teaching, mentoring, coordination, leadership, studentProjects };
}
