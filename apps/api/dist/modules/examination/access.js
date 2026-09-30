import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isSuperAdmin } from '../../utils/permissions.js';
const ROLE_EXAM_PERMISSIONS = {
    SUPER_ADMIN: [],
    COLLEGE_ADMIN: [],
    PRINCIPAL: [],
    HOD: [],
    COE: [
        'exam.create',
        'exam.schedule',
        'exam.eligibility',
        'exam.registration',
        'exam.rooms',
        'exam.invigilation',
        'exam.questionPapers',
        'exam.attendance',
        'exam.malpractice',
        'exam.custody',
        'exam.valuation',
        'exam.marks.verify',
        'exam.result.process',
        'exam.result.publish',
        'exam.documents',
        'exam.finance',
        'exam.reports',
    ],
    FACULTY: [],
};
export function examPermissionsForRole(role) {
    if (isSuperAdmin(role))
        return ROLE_EXAM_PERMISSIONS.SUPER_ADMIN;
    return ROLE_EXAM_PERMISSIONS[role] ?? [];
}
export function hasExamPermission(actor, permission) {
    return examPermissionsForRole(actor.role).includes(permission);
}
export function assertExamPermission(actor, permission) {
    if (!hasExamPermission(actor, permission)) {
        throw new AppError(403, 'You do not have permission for this examination action');
    }
}
export function canManageExams(actor) {
    return hasExamPermission(actor, 'exam.create');
}
export function canVerifyMarks(actor) {
    return hasExamPermission(actor, 'exam.marks.verify');
}
export function canPublishResults(actor) {
    return hasExamPermission(actor, 'exam.result.publish');
}
export async function assertExamCollege(examId, collegeId) {
    const exam = await db('examinations').where({ id: examId }).first();
    if (!exam)
        throw new AppError(404, 'Examination not found');
    if (Number(exam.college_id) !== collegeId)
        throw new AppError(404, 'Examination not found');
    return exam;
}
export async function assertExamSubjectCollege(examSubjectId, collegeId) {
    const row = await db('examination_subjects as es')
        .join('examinations as e', 'e.id', 'es.exam_id')
        .where('es.id', examSubjectId)
        .select('es.*', 'e.college_id', 'e.status as exam_status', 'e.exam_type')
        .first();
    if (!row || Number(row.college_id) !== collegeId)
        throw new AppError(404, 'Exam subject not found');
    return row;
}
export async function assertFacultySubjectAccess(actor, examSubjectId) {
    if (canManageExams(actor))
        return;
    const subject = await assertExamSubjectCollege(examSubjectId, actor.collegeId);
    const classId = subject.academic_class_id;
    if (!classId)
        throw new AppError(403, 'You are not authorized for this exam subject');
    const mapping = await db('academic_class_subject_faculty')
        .where({
        academic_class_id: classId,
        course_id: subject.course_id,
        faculty_id: actor.facultyUserId,
        status: 'ACTIVE',
    })
        .first();
    if (!mapping)
        throw new AppError(403, 'You are not authorized to enter marks for this subject');
}
export async function assertStudentOwnsResult(studentId, semesterResultId, collegeId) {
    const row = await db('semester_results')
        .where({ id: semesterResultId, student_id: studentId, college_id: collegeId })
        .first();
    if (!row)
        throw new AppError(404, 'Result not found');
    return row;
}
