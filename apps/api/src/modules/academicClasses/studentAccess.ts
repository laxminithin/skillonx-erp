import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { listClassSubjects, loadClassRow, serializeClass } from './service.js';
import { classDisplayName } from './format.js';

type Row = Record<string, any>;

export type ClassSubject = Awaited<ReturnType<typeof listClassSubjects>>[number];

export type AccessibleSubject = {
  id: number;
  courseId: number;
  code: string;
  name: string;
  kind: string;
  credits?: number | null;
  faculty: ClassSubject['faculty'];
  facultyName?: string | null;
  source: 'CLASS' | 'BACKLOG' | 'OVERRIDE';
  originSemesterId?: number | null;
  reason?: string | null;
};

export function isCoreKind(kind: string) {
  return kind === 'CORE' || kind === 'LAB' || kind === 'ABILITY_ENHANCEMENT';
}

export async function loadActiveStudent(studentId: number) {
  const student = await db('students').where({ id: studentId }).first();
  if (!student) throw new AppError(404, 'Student not found');
  if (!student.is_active) {
    throw new AppError(403, 'This student account is deactivated', undefined, 'ACCOUNT_DEACTIVATED');
  }
  return student as Row;
}

export async function approvedEnrollments(studentId: number) {
  return db('academic_class_enrollments as e')
    .join('academic_classes as ac', 'ac.id', 'e.academic_class_id')
    .where({ 'e.student_id': studentId })
    .whereIn('e.status', ['APPROVED', 'COMPLETED'])
    .select('e.*', 'ac.status as class_status', 'ac.college_id as class_college_id')
    .orderBy('e.id', 'desc');
}

export async function activeClassForStudent(studentId: number) {
  const approved = await approvedEnrollments(studentId);
  const active =
    approved.find((row) => row.status === 'APPROVED' && row.class_status === 'ACTIVE') ??
    approved.find((row) => row.status === 'APPROVED') ??
    null;
  return active ? Number(active.academic_class_id) : null;
}

export async function subjectsForStudent(studentId: number, classId: number) {
  const all = await listClassSubjects(classId);
  const electives = await db('student_elective_selections')
    .where({ student_id: studentId, academic_class_id: classId, status: 'ACTIVE' })
    .select('class_subject_id');
  const electiveIds = new Set(electives.map((r) => Number(r.class_subject_id)));
  const current = all.filter((s) => isCoreKind(s.kind) || electiveIds.has(s.id));

  const backlogs = await db('backlog_subject_registrations as b')
    .join('courses as c', 'c.id', 'b.course_id')
    .where({ 'b.student_id': studentId, 'b.status': 'ACTIVE' })
    .select('b.*', 'c.code as course_code', 'c.name as course_name', 'c.course_type', 'c.credits');
  const overrides = await db('subject_enrollment_overrides as o')
    .join('courses as c', 'c.id', 'o.course_id')
    .where({ 'o.student_id': studentId, 'o.status': 'ACTIVE' })
    .select('o.*', 'c.code as course_code', 'c.name as course_name', 'c.course_type', 'c.credits');

  return {
    all,
    current,
    electives: all.filter((s) => !isCoreKind(s.kind)),
    selectedElectiveIds: [...electiveIds],
    backlogs: backlogs.map((row) => ({
      id: Number(row.id),
      courseId: Number(row.course_id),
      code: row.course_code,
      name: row.course_name,
      courseType: row.course_type ?? 'CORE',
      credits: row.credits != null ? Number(row.credits) : null,
      originSemesterId: row.origin_semester_id != null ? Number(row.origin_semester_id) : null,
      faculty: [] as ClassSubject['faculty'],
      kind: 'BACKLOG',
      source: 'BACKLOG' as const,
    })),
    overrides: overrides.map((row) => ({
      id: Number(row.id),
      courseId: Number(row.course_id),
      code: row.course_code,
      name: row.course_name,
      courseType: row.course_type ?? 'CORE',
      credits: row.credits != null ? Number(row.credits) : null,
      reason: row.reason,
      faculty: [] as ClassSubject['faculty'],
      kind: 'OVERRIDE',
      source: 'OVERRIDE' as const,
    })),
  };
}

export function accessibleCourseIds(pack: Awaited<ReturnType<typeof subjectsForStudent>>) {
  return [
    ...pack.current.map((s) => s.courseId),
    ...pack.backlogs.map((s) => s.courseId),
    ...pack.overrides.map((s) => s.courseId),
  ];
}

export async function pendingEnrollments(studentId: number) {
  return db('academic_class_enrollments as e')
    .join('academic_classes as ac', 'ac.id', 'e.academic_class_id')
    .join('departments as d', 'd.id', 'ac.department_id')
    .join('semesters as sem', 'sem.id', 'ac.semester_id')
    .join('class_sections as cs', 'cs.id', 'ac.class_section_id')
    .where({ 'e.student_id': studentId })
    .whereIn('e.status', ['PENDING', 'REJECTED'])
    .select(
      'e.id',
      'e.status',
      'e.remarks',
      'ac.id as class_id',
      'ac.name',
      'd.code as department_code',
      'd.name as department_name',
      'sem.number as semester_number',
      'sem.label as semester_label',
      'cs.label as section_label',
    )
    .orderBy('e.requested_at', 'desc');
}

export function serializePending(row: Row) {
  return {
    enrollmentId: Number(row.id),
    classId: Number(row.class_id),
    name: row.name,
    displayName: classDisplayName({
      departmentCode: row.department_code,
      departmentName: row.department_name,
      semesterLabel: row.semester_label,
      semesterNumber: row.semester_number != null ? Number(row.semester_number) : null,
      sectionLabel: row.section_label,
    }),
    status: row.status,
    remarks: row.remarks ?? null,
    departmentCode: row.department_code,
    departmentName: row.department_name,
    semesterNumber: row.semester_number != null ? Number(row.semester_number) : null,
    semesterLabel: row.semester_label,
    sectionLabel: row.section_label,
  };
}

export type SubjectAccess = {
  student: Row;
  classId: number;
  classRow: Row;
  collegeId: number;
  subject: {
    courseId: number;
    code: string;
    name: string;
    kind?: string;
    credits?: number | null;
    faculty?: ClassSubject['faculty'];
    facultyName?: string | null;
  };
  source: 'CLASS' | 'BACKLOG' | 'OVERRIDE' | 'HISTORY';
  historical: boolean;
  pack: Awaited<ReturnType<typeof subjectsForStudent>>;
};

export async function assertSubjectAccess(studentId: number, courseId: number): Promise<SubjectAccess> {
  const student = await loadActiveStudent(studentId);
  const collegeId = Number(student.college_id);

  const classId = await activeClassForStudent(studentId);
  if (classId) {
    const classRow = await loadClassRow(classId);
    if (Number(classRow.college_id) !== collegeId) {
      throw new AppError(403, 'You cannot access this class', undefined, 'TENANT_MISMATCH');
    }
    const pack = await subjectsForStudent(studentId, classId);
    const current = pack.current.find((s) => s.courseId === courseId);
    const backlog = pack.backlogs.find((s) => s.courseId === courseId);
    const override = pack.overrides.find((s) => s.courseId === courseId);
    const subject = current || backlog || override;
    if (subject) {
      return {
        student,
        classId,
        classRow,
        collegeId,
        subject,
        source: current ? 'CLASS' : backlog ? 'BACKLOG' : 'OVERRIDE',
        historical: false,
        pack,
      };
    }
  }

  const history = await approvedEnrollments(studentId);
  for (const enrollment of history) {
    if (Number(enrollment.class_college_id) !== collegeId) continue;
    const histClassId = Number(enrollment.academic_class_id);
    const pack = await subjectsForStudent(studentId, histClassId);
    const subject =
      pack.current.find((s) => s.courseId === courseId) ||
      pack.backlogs.find((s) => s.courseId === courseId) ||
      pack.overrides.find((s) => s.courseId === courseId);
    if (subject) {
      const classRow = await loadClassRow(histClassId);
      return {
        student,
        classId: histClassId,
        classRow,
        collegeId,
        subject,
        source: 'HISTORY',
        historical: true,
        pack,
      };
    }
  }

  const pending = await db('academic_class_enrollments')
    .where({ student_id: studentId, status: 'PENDING' })
    .first();
  if (pending) {
    throw new AppError(
      403,
      'Your class membership is still awaiting approval. You will get access to all class subjects after approval.',
      undefined,
      'ENROLLMENT_PENDING',
    );
  }

  throw new AppError(403, 'This subject is not part of your class LMS', undefined, 'SUBJECT_FORBIDDEN');
}

export async function assertClassMembership(studentId: number, classId: number) {
  const student = await loadActiveStudent(studentId);
  const enrollment = await db('academic_class_enrollments')
    .where({ student_id: studentId, academic_class_id: classId })
    .whereIn('status', ['APPROVED', 'COMPLETED'])
    .first();
  if (!enrollment) throw new AppError(403, 'You are not a member of this class');
  const classRow = await loadClassRow(classId);
  if (Number(classRow.college_id) !== Number(student.college_id)) {
    throw new AppError(403, 'You cannot access this class', undefined, 'TENANT_MISMATCH');
  }
  return { student, enrollment, classRow, collegeId: Number(student.college_id) };
}

export async function currentClassContext(studentId: number) {
  const student = await loadActiveStudent(studentId);
  const pending = await pendingEnrollments(studentId);
  const classId = await activeClassForStudent(studentId);
  if (!classId) {
    return {
      student,
      collegeId: Number(student.college_id),
      classId: null as number | null,
      classRow: null as Row | null,
      class: null,
      pack: null,
      pending: pending.map(serializePending),
    };
  }
  const classRow = await loadClassRow(classId);
  if (Number(classRow.college_id) !== Number(student.college_id)) {
    throw new AppError(403, 'You cannot access this class', undefined, 'TENANT_MISMATCH');
  }
  const pack = await subjectsForStudent(studentId, classId);
  return {
    student,
    collegeId: Number(student.college_id),
    classId,
    classRow,
    class: serializeClass(classRow),
    pack,
    pending: pending.map(serializePending),
  };
}

export function facultyName(subject: { faculty?: Array<{ name: string }>; facultyName?: string | null }) {
  return subject.facultyName || subject.faculty?.[0]?.name || null;
}

export function courseTypeLabel(kind?: string | null, courseType?: string | null) {
  const raw = (courseType || kind || '').toUpperCase();
  if (raw === 'LAB' || raw === 'LABORATORY') return 'Laboratory';
  if (raw === 'ELECTIVE' || raw === 'PROFESSIONAL_ELECTIVE') return 'Elective';
  if (raw === 'OPEN_ELECTIVE') return 'Open Elective';
  if (raw === 'ABILITY_ENHANCEMENT' || raw === 'AEC') return 'Ability Enhancement';
  if (raw === 'PROJECT') return 'Project';
  return 'Theory';
}
