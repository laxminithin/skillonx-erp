import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { ExamActor } from './access.js';
import { assertExamCollege, assertExamPermission, canPublishResults } from './access.js';
import { recordExamAudit } from './audit.js';
import { computeCgpa, computeSgpa, gradeForMarks, parseGradeBands, subjectPass } from './grading.js';
import { computeInternalMarks } from './internalMarks.js';
import { resolvePolicy } from './policy.js';

type Row = Record<string, any>;

function resultStatusForSubject(
  markStatus: string,
  passed: boolean,
): string {
  if (markStatus === 'ABSENT') return 'ABSENT';
  if (markStatus === 'MALPRACTICE') return 'MALPRACTICE';
  if (markStatus === 'WITHHELD') return 'WITHHELD';
  return passed ? 'PASS' : 'FAIL';
}

export async function processResults(actor: ExamActor, examId: number) {
  assertExamPermission(actor, 'exam.result.process');
  const exam = await assertExamCollege(examId, actor.collegeId);
  if (!['COMPLETED', 'RESULT_PROCESSING'].includes(exam.status)) {
    await db('examinations').where({ id: examId }).update({ status: 'RESULT_PROCESSING' });
  }
  const policy = await resolvePolicy(actor.collegeId, exam.scheme_id, exam.program_id);
  const gradeBands = parseGradeBands(policy.gradeBands);
  const subjects = await db('examination_subjects').where({ exam_id: examId });
  let studentsProcessed = 0;

  const studentIds = new Set<number>();
  for (const subject of subjects) {
    const marks = await db('exam_marks as m')
      .join('exam_marks_sheets as s', 's.id', 'm.marks_sheet_id')
      .where({ 'm.exam_subject_id': subject.id, 's.locked': true })
      .select('m.*');
    for (const m of marks) studentIds.add(Number(m.student_id));
  }

  for (const studentId of studentIds) {
    const student = await db('students').where({ id: studentId }).first();
    if (!student) continue;

    const existing = await db('semester_results')
      .where({ student_id: studentId, exam_id: examId, published: false })
      .orderBy('result_version', 'desc')
      .first();
    const version = existing ? Number(existing.result_version) : 1;

    let semResultId: number;
    if (existing) {
      semResultId = Number(existing.id);
      await db('subject_results').where({ semester_result_id: semResultId }).delete();
    } else {
      const [id] = await db('semester_results').insert({
        college_id: actor.collegeId,
        student_id: studentId,
        exam_id: examId,
        academic_year_id: exam.academic_year_id,
        semester_id: exam.semester_id,
        program_id: exam.program_id,
        status: 'INCOMPLETE',
        result_version: version,
        exam_policy_id: policy.id,
        grade_bands_snapshot: JSON.stringify(gradeBands),
      });
      semResultId = Number(id);
    }

    const subjectResults = [];
    let hasFail = false;
    let hasWithheld = false;

    for (const subject of subjects) {
      const course = await db('courses').where({ id: subject.course_id }).first();
      const mark = await db('exam_marks as m')
        .join('exam_marks_sheets as s', 's.id', 'm.marks_sheet_id')
        .where({ 'm.exam_subject_id': subject.id, 'm.student_id': studentId, 's.locked': true })
        .select('m.*')
        .first();

      const classId = subject.academic_class_id ? Number(subject.academic_class_id) : null;
      const internal = await computeInternalMarks(
        studentId,
        Number(subject.course_id),
        classId,
        actor.collegeId,
        exam.scheme_id,
        exam.program_id,
      );

      const externalMarks = mark?.marks != null ? Number(mark.marks) : null;
      const markStatus = mark?.status ?? 'ABSENT';
      const internalMarks = internal.internalMarks;
      const totalMarks =
        markStatus === 'PRESENT' && externalMarks != null
          ? internalMarks + externalMarks
          : markStatus === 'PRESENT'
            ? internalMarks
            : 0;
      const maxMarks = policy.cieMaximum + Number(subject.maximum_marks);
      const passed =
        markStatus === 'PRESENT' &&
        subjectPass(totalMarks, maxMarks, policy.passPercentage, policy.minimumSeeScore, externalMarks);
      const subStatus = resultStatusForSubject(markStatus, passed);
      if (subStatus === 'FAIL') hasFail = true;
      if (subStatus === 'WITHHELD' || subStatus === 'MALPRACTICE') hasWithheld = true;

      const grade =
        subStatus === 'PASS' || subStatus === 'FAIL'
          ? gradeForMarks(totalMarks, maxMarks, gradeBands)
          : { grade: subStatus === 'ABSENT' ? 'AB' : 'WH', gradePoints: 0 };

      const credits = Number(course?.credits ?? 0);
      await db('subject_results').insert({
        college_id: actor.collegeId,
        semester_result_id: semResultId,
        student_id: studentId,
        course_id: subject.course_id,
        exam_subject_id: subject.id,
        internal_marks: internalMarks,
        external_marks: externalMarks,
        total_marks: totalMarks,
        max_marks: maxMarks,
        grade: grade.grade,
        grade_points: grade.gradePoints,
        credits,
        result_status: subStatus,
        marks_source: mark ? 'INSTITUTION' : 'INSTITUTION',
      });

      subjectResults.push({
        gradePoints: grade.gradePoints,
        credits,
        resultStatus: subStatus,
      });
    }

    const sgpa = computeSgpa(subjectResults);
    const earnedCredits = subjectResults
      .filter((s) => s.resultStatus === 'PASS')
      .reduce((sum, s) => sum + s.credits, 0);
    const totalCredits = subjectResults.reduce((sum, s) => sum + s.credits, 0);
    const semStatus = hasWithheld ? 'WITHHELD' : hasFail ? 'FAIL' : 'PASS';

    await db('semester_results').where({ id: semResultId }).update({
      sgpa,
      total_credits: totalCredits,
      earned_credits: earnedCredits,
      status: semStatus,
      updated_at: db.fn.now(),
    });

    await upsertAcademicRecord(actor.collegeId, studentId, exam, sgpa, earnedCredits, semResultId, semStatus);
    studentsProcessed += 1;
  }

  await recordExamAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'RESULTS_PROCESSED',
    entityType: 'examination',
    entityId: examId,
    afterState: { studentsProcessed },
  });
  return { studentsProcessed };
}

async function upsertAcademicRecord(
  collegeId: number,
  studentId: number,
  exam: Row,
  sgpa: number | null,
  creditsEarned: number,
  semResultId: number,
  status: string,
) {
  const existing = await db('student_academic_records')
    .where({
      student_id: studentId,
      semester_id: exam.semester_id,
      academic_year_id: exam.academic_year_id,
    })
    .first();
  const payload = {
    college_id: collegeId,
    student_id: studentId,
    semester_id: exam.semester_id,
    academic_year_id: exam.academic_year_id,
    semester_result_id: semResultId,
    sgpa,
    credits_earned: creditsEarned,
    status: status === 'PASS' ? 'COMPLETED' : status,
    updated_at: db.fn.now(),
  };
  if (existing) {
    await db('student_academic_records').where({ id: existing.id }).update(payload);
  } else {
    await db('student_academic_records').insert(payload);
  }
}

export async function publishResults(actor: ExamActor, examId: number) {
  if (!canPublishResults(actor)) throw new AppError(403, 'Not authorized to publish results');
  const exam = await assertExamCollege(examId, actor.collegeId);
  const count = await db('semester_results')
    .where({ exam_id: examId, college_id: actor.collegeId })
    .update({
      published: true,
      published_at: db.fn.now(),
      published_by: actor.facultyUserId,
    });
  if (!count) throw new AppError(400, 'No results to publish. Process results first.');
  await db('examinations').where({ id: examId }).update({ status: 'RESULT_PUBLISHED' });
  await recordExamAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'RESULTS_PUBLISHED',
    entityType: 'examination',
    entityId: examId,
    afterState: { count },
  });
  return { published: count };
}

export async function studentResults(studentId: number, collegeId: number, semesterId?: number) {
  let q = db('semester_results as sr')
    .join('examinations as e', 'e.id', 'sr.exam_id')
    .join('semesters as s', 's.id', 'sr.semester_id')
    .where({ 'sr.student_id': studentId, 'sr.college_id': collegeId, 'sr.published': true })
    .select('sr.*', 'e.name as exam_name', 'e.exam_type', 's.label as semester_label');
  if (semesterId) q = q.andWhere('sr.semester_id', semesterId);
  const semesters = await q.orderBy('sr.semester_id');

  const results = [];
  for (const sem of semesters) {
    const subjects = await db('subject_results as sub')
      .join('courses as c', 'c.id', 'sub.course_id')
      .where({ semester_result_id: sem.id })
      .select('sub.*', 'c.code as course_code', 'c.name as course_name')
      .orderBy('c.code');
    results.push({
      semesterResultId: Number(sem.id),
      examId: Number(sem.exam_id),
      examName: sem.exam_name,
      examType: sem.exam_type,
      semesterId: Number(sem.semester_id),
      semesterLabel: sem.semester_label,
      sgpa: sem.sgpa != null ? Number(sem.sgpa) : null,
      status: sem.status,
      resultVersion: Number(sem.result_version),
      publishedAt: sem.published_at,
      subjects: subjects.map((s) => ({
        courseId: Number(s.course_id),
        courseCode: s.course_code,
        courseName: s.course_name,
        internalMarks: s.internal_marks != null ? Number(s.internal_marks) : null,
        externalMarks: s.external_marks != null ? Number(s.external_marks) : null,
        totalMarks: s.total_marks != null ? Number(s.total_marks) : null,
        grade: s.grade,
        gradePoints: s.grade_points != null ? Number(s.grade_points) : null,
        credits: s.credits != null ? Number(s.credits) : null,
        resultStatus: s.result_status,
      })),
    });
  }
  return results;
}

export async function studentAcademicRecord(studentId: number, collegeId: number) {
  const records = await db('student_academic_records as r')
    .join('semesters as s', 's.id', 'r.semester_id')
    .join('academic_years as y', 'y.id', 'r.academic_year_id')
    .where({ 'r.student_id': studentId, 'r.college_id': collegeId })
    .select('r.*', 's.label as semester_label', 's.number as semester_number', 'y.label as year_label')
    .orderBy('s.number');

  const cgpa = computeCgpa(
    records.map((r) => ({
      sgpa: r.sgpa != null ? Number(r.sgpa) : null,
      creditsEarned: r.credits_earned != null ? Number(r.credits_earned) : 0,
    })),
  );

  const failed = await db('subject_results as sub')
    .join('courses as c', 'c.id', 'sub.course_id')
    .where({ 'sub.student_id': studentId, 'sub.college_id': collegeId, 'sub.result_status': 'FAIL' })
    .select('c.code', 'c.name', 'sub.total_marks', 'sub.grade');

  const totalCredits = records.reduce((s, r) => s + Number(r.credits_earned ?? 0), 0);

  return {
    semesters: records.map((r) => ({
      semesterId: Number(r.semester_id),
      semesterLabel: r.semester_label,
      semesterNumber: r.semester_number,
      academicYearLabel: r.year_label,
      sgpa: r.sgpa != null ? Number(r.sgpa) : null,
      creditsEarned: r.credits_earned != null ? Number(r.credits_earned) : null,
      status: r.status,
    })),
    cgpa,
    totalCreditsEarned: totalCredits,
    backlogs: failed.map((f) => ({ code: f.code, name: f.name, grade: f.grade })),
  };
}

export async function subjectAnalytics(actor: ExamActor, examSubjectId: number) {
  const marks = await db('exam_marks as m')
    .join('exam_marks_sheets as s', 's.id', 'm.marks_sheet_id')
    .where({ 'm.exam_subject_id': examSubjectId, 'm.college_id': actor.collegeId, 's.locked': true })
    .select('m.marks', 'm.status');
  const appeared = marks.filter((m) => m.status === 'PRESENT' && m.marks != null);
  const values = appeared.map((m) => Number(m.marks));
  const passed = await db('subject_results')
    .where({ exam_subject_id: examSubjectId, college_id: actor.collegeId, result_status: 'PASS' })
    .count({ c: '*' })
    .first();
  const failed = await db('subject_results')
    .where({ exam_subject_id: examSubjectId, college_id: actor.collegeId, result_status: 'FAIL' })
    .count({ c: '*' })
    .first();
  const passCount = Number(passed?.c ?? 0);
  const failCount = Number(failed?.c ?? 0);
  const total = passCount + failCount;
  return {
    appeared: appeared.length,
    passed: passCount,
    failed: failCount,
    passPercentage: total ? Math.round((passCount / total) * 10000) / 100 : 0,
    average: values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100 : null,
    highest: values.length ? Math.max(...values) : null,
    lowest: values.length ? Math.min(...values) : null,
  };
}
