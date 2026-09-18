import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { serializeClass, loadClassRow } from './service.js';
import {
  accessibleCourseIds,
  approvedEnrollments,
  assertClassMembership,
  assertSubjectAccess,
  currentClassContext,
  facultyName,
  subjectsForStudent,
} from './studentAccess.js';
import { progressForCourses } from './studentProgress.js';
import { coBand } from './studentProgressMath.js';
import { listStudentAssessments, listStudentAssignments, listStudentQuizzes } from './studentWork.js';
import { studentAttendanceSummary } from '../attendance/service.js';

export async function studentPerformance(studentId: number, courseId?: number) {
  const ctx = await currentClassContext(studentId);
  if (!ctx.classId || !ctx.pack || !ctx.classRow) {
    return { overall: null, subjects: [] as unknown[] };
  }
  if (courseId) await assertSubjectAccess(studentId, courseId);
  const courseIds = courseId ? [courseId] : accessibleCourseIds(ctx.pack);
  const progress = await progressForCourses(
    studentId,
    ctx.collegeId,
    ctx.classId,
    courseIds,
    Number(ctx.classRow.class_section_id),
  );
  const [assignments, quizzes, assessments, attendance] = await Promise.all([
    listStudentAssignments(studentId, courseId),
    listStudentQuizzes(studentId, courseId),
    listStudentAssessments(studentId, courseId),
    studentAttendanceSummary(studentId, ctx.classId).catch(() => null),
  ]);
  const attendanceByCourse = new Map(
    (attendance?.subjects || []).map((s) => [s.courseId, s]),
  );

  const subjects = [...ctx.pack.current, ...ctx.pack.backlogs, ...ctx.pack.overrides]
    .filter((s) => courseIds.includes(s.courseId))
    .map((s) => {
      const p = progress.byCourse.get(s.courseId);
      const a = assignments.assignments.filter((x) => x.courseId === s.courseId);
      const q = quizzes.quizzes.filter((x) => x.courseId === s.courseId);
      const ia = assessments.assessments.filter((x) => x.courseId === s.courseId);
      const aDone = a.filter((x) => ['SUBMITTED', 'LATE', 'EVALUATED', 'RETURNED'].includes(x.studentStatus));
      const aMarks = a.filter((x) => x.obtainedMarks != null);
      const qDone = q.filter((x) => x.bucket === 'COMPLETED');
      const qMarks = q.filter((x) => x.obtainedMarks != null);
      const iaReleased = ia.filter((x) => x.status === 'RESULT_RELEASED' && x.marks != null);
      const att = attendanceByCourse.get(s.courseId);
      return {
        courseId: s.courseId,
        name: s.name,
        code: s.code,
        facultyName: facultyName(s),
        learningProgress: p?.progress ?? 0,
        assignments: {
          done: aDone.length,
          total: a.length,
          obtained: aMarks.reduce((sum, x) => sum + Number(x.obtainedMarks ?? 0), 0),
          max: aMarks.reduce((sum, x) => sum + Number(x.totalMarks ?? 0), 0),
        },
        quizzes: {
          done: qDone.length,
          total: q.length,
          obtained: qMarks.reduce((sum, x) => sum + Number(x.obtainedMarks ?? 0), 0),
          max: qMarks.reduce((sum, x) => sum + Number(x.totalMarks ?? 0), 0),
        },
        internals: {
          done: iaReleased.length,
          total: ia.length,
          obtained: iaReleased.reduce((sum, x) => sum + Number(x.marks ?? 0), 0),
          max: iaReleased.reduce((sum, x) => sum + Number(x.maxMarks ?? 0), 0),
        },
        attendance: att?.percentage ?? null,
        attendanceStanding: att?.standing ?? null,
      };
    });

  const sum = (key: 'assignments' | 'quizzes' | 'internals') => ({
    obtained: subjects.reduce((n, s) => n + s[key].obtained, 0),
    max: subjects.reduce((n, s) => n + s[key].max, 0),
    done: subjects.reduce((n, s) => n + s[key].done, 0),
    total: subjects.reduce((n, s) => n + s[key].total, 0),
  });

  return {
    overall: {
      progress: progress.overall,
      assignments: sum('assignments'),
      quizzes: sum('quizzes'),
      internals: sum('internals'),
      attendance: attendance?.overall ?? null,
      attendanceStanding: attendance?.standing ?? null,
    },
    subjects,
  };
}

export async function studentCoPerformance(studentId: number, courseId: number) {
  const access = await assertSubjectAccess(studentId, courseId);
  const outcomes = await db('course_outcomes')
    .where({ college_id: access.collegeId, course_id: courseId, is_current: true })
    .orderBy('co_number')
    .select('id', 'co_code', 'statement');

  const scores = new Map<string, { awarded: number; max: number }>();
  const bump = (code: string | null, awarded: number, max: number) => {
    if (!code) return;
    const cur = scores.get(code) ?? { awarded: 0, max: 0 };
    cur.awarded += awarded;
    cur.max += max;
    scores.set(code, cur);
  };

  const assignments = await db('assignment_submissions as s')
    .join('assignments as a', 'a.id', 's.assignment_id')
    .where({
      's.student_id': studentId,
      's.college_id': access.collegeId,
      'a.course_id': courseId,
      's.results_released': true,
    })
    .select('s.id');
  if (assignments.length) {
    const answers = await db('assignment_answers as ans')
      .join('assignment_questions as q', 'q.id', 'ans.snapshot_question_id')
      .whereIn(
        'ans.submission_id',
        assignments.map((r) => r.id),
      )
      .select('q.primary_co_code', 'q.marks', 'ans.awarded_marks');
    for (const row of answers) bump(row.primary_co_code, Number(row.awarded_marks ?? 0), Number(row.marks ?? 0));
  }

  const quizAttempts = await db('quiz_attempts as at')
    .join('quizzes as q', 'q.id', 'at.quiz_id')
    .where({
      'at.student_id': studentId,
      'at.college_id': access.collegeId,
      'q.course_id': courseId,
    })
    .whereIn('at.status', ['SUBMITTED', 'EXPIRED_SUBMITTED'])
    .select('at.id', 'q.show_score_immediately');
  const releasedAttempts = quizAttempts.filter((r) => r.show_score_immediately == null || r.show_score_immediately);
  if (releasedAttempts.length) {
    const answers = await db('quiz_attempt_answers')
      .whereIn(
        'attempt_id',
        releasedAttempts.map((r) => r.id),
      )
      .select('primary_co_code', 'awarded_marks', 'max_marks');
    for (const ans of answers) {
      bump(ans.primary_co_code, Number(ans.awarded_marks ?? 0), Number(ans.max_marks ?? 0));
    }
  }

  const assessments = await listStudentAssessments(studentId, courseId);
  for (const ia of assessments.assessments) {
    if (ia.status !== 'RESULT_RELEASED') continue;
    for (const co of ia.coBreakup) bump(co.code, co.awarded, co.max);
  }

  return {
    outcomes: outcomes.map((row) => {
      const score = scores.get(String(row.co_code));
      const percentage = score && score.max ? Math.round((score.awarded / score.max) * 100) : null;
      const band = coBand(percentage);
      return {
        id: Number(row.id),
        code: row.co_code,
        statement: row.statement,
        percentage,
        band: band.label,
        tone: band.tone,
      };
    }),
  };
}

export async function academicHistory(studentId: number) {
  const enrollments = await approvedEnrollments(studentId);
  const currentId = (await currentClassContext(studentId)).classId;
  const items = [];
  for (const row of enrollments) {
    const classRow = await loadClassRow(Number(row.academic_class_id));
    const serialized = serializeClass(classRow);
    items.push({
      enrollmentId: Number(row.id),
      classId: Number(row.academic_class_id),
      status: row.status === 'COMPLETED' || classRow.status === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE',
      current: Number(row.academic_class_id) === currentId,
      academicYearLabel: serialized.academicYearLabel,
      semesterLabel: serialized.semesterLabel,
      semesterNumber: serialized.semesterNumber,
      departmentCode: serialized.departmentCode,
      sectionLabel: serialized.sectionLabel,
      displayName: serialized.displayName,
    });
  }
  return { history: items };
}

export async function academicHistoryClass(studentId: number, classId: number) {
  await assertClassMembership(studentId, classId);
  const classRow = await loadClassRow(classId);
  const pack = await subjectsForStudent(studentId, classId);
  const progress = await progressForCourses(
    studentId,
    Number(classRow.college_id),
    classId,
    accessibleCourseIds(pack),
    Number(classRow.class_section_id),
  );
  const attendance = await studentAttendanceSummary(studentId, classId).catch(() => null);
  const attendanceByCourse = new Map((attendance?.subjects || []).map((s) => [s.courseId, s]));
  return {
    class: serializeClass(classRow),
    attendance: attendance
      ? { overall: attendance.overall, standing: attendance.standing }
      : null,
    subjects: pack.current.map((s) => ({
      courseId: s.courseId,
      code: s.code,
      name: s.name,
      facultyName: facultyName(s),
      progress: progress.byCourse.get(s.courseId)?.progress ?? 0,
      attendance: attendanceByCourse.get(s.courseId)?.percentage ?? null,
      attendanceStanding: attendanceByCourse.get(s.courseId)?.standing ?? null,
    })),
  };
}
