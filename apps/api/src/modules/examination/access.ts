import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isSuperAdmin } from '../../utils/permissions.js';
import type { ExamPermission } from './types.js';

export type ExamActor = {
  facultyUserId: number;
  collegeId: number;
  role: string;
  departmentId?: number | null;
};

const ROLE_EXAM_PERMISSIONS: Record<string, ExamPermission[]> = {
  SUPER_ADMIN: [
  ],
  COLLEGE_ADMIN: [
  ],
  PRINCIPAL: [
  ],
  HOD: [
  ],
  COE: [
    'exam.create',
    'exam.schedule',
    'exam.eligibility',
    'exam.rooms',
    'exam.invigilation',
    'exam.marks.verify',
    'exam.result.process',
    'exam.result.publish',
  ],
  FACULTY: [],
};

export function examPermissionsForRole(role: string): ExamPermission[] {
  if (isSuperAdmin(role)) return ROLE_EXAM_PERMISSIONS.SUPER_ADMIN;
  return ROLE_EXAM_PERMISSIONS[role] ?? [];
}

export function hasExamPermission(actor: ExamActor, permission: ExamPermission): boolean {
  return examPermissionsForRole(actor.role).includes(permission);
}

export function assertExamPermission(actor: ExamActor, permission: ExamPermission) {
  if (!hasExamPermission(actor, permission)) {
    throw new AppError(403, 'You do not have permission for this examination action');
  }
}

export function canManageExams(actor: ExamActor) {
  return hasExamPermission(actor, 'exam.create');
}

export function canVerifyMarks(actor: ExamActor) {
  return hasExamPermission(actor, 'exam.marks.verify');
}

export function canPublishResults(actor: ExamActor) {
  return hasExamPermission(actor, 'exam.result.publish');
}

export async function assertExamCollege(examId: number, collegeId: number) {
  const exam = await db('examinations').where({ id: examId }).first();
  if (!exam) throw new AppError(404, 'Examination not found');
  if (Number(exam.college_id) !== collegeId) throw new AppError(404, 'Examination not found');
  return exam;
}

export async function assertExamSubjectCollege(examSubjectId: number, collegeId: number) {
  const row = await db('examination_subjects as es')
    .join('examinations as e', 'e.id', 'es.exam_id')
    .where('es.id', examSubjectId)
    .select('es.*', 'e.college_id', 'e.status as exam_status', 'e.exam_type')
    .first();
  if (!row || Number(row.college_id) !== collegeId) throw new AppError(404, 'Exam subject not found');
  return row;
}

export async function assertFacultySubjectAccess(actor: ExamActor, examSubjectId: number) {
  if (canManageExams(actor)) return;
  const subject = await assertExamSubjectCollege(examSubjectId, actor.collegeId);
  const classId = subject.academic_class_id;
  if (!classId) throw new AppError(403, 'You are not authorized for this exam subject');
  const mapping = await db('academic_class_subject_faculty')
    .where({
      academic_class_id: classId,
      course_id: subject.course_id,
      faculty_id: actor.facultyUserId,
      status: 'ACTIVE',
    })
    .first();
  if (!mapping) throw new AppError(403, 'You are not authorized to enter marks for this subject');
}

export async function assertStudentOwnsResult(studentId: number, semesterResultId: number, collegeId: number) {
  const row = await db('semester_results')
    .where({ id: semesterResultId, student_id: studentId, college_id: collegeId })
    .first();
  if (!row) throw new AppError(404, 'Result not found');
  return row;
}
