import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { ExamActor } from './access.js';
import { assertExamCollege, assertExamPermission, canPublishResults } from './access.js';
import { recordExamAudit } from './audit.js';
import { assertInstitutionOwnsCapability } from './capabilities.js';
import { computeCgpa, computeSgpa, gradeForMarks, parseGradeBands, subjectPass } from './grading.js';
import { computeInternalMarks } from './internalMarks.js';
import { resolvePolicy } from './policy.js';

type Row = Record<string, any>;

function resultStatusForSubject(
  markStatus: string,
  passed: boolean,
): string {
  if (markStatus === 'ABSENT') return 'ABSENT';
  if (markStatus === 'MALPRACTICE' || markStatus === 'MPC') return 'MALPRACTICE';
  if (markStatus === 'WITHHELD') return 'WITHHELD';
  return passed ? 'PASS' : 'FAIL';
}

export async function processResults(actor: ExamActor, examId: number) {
  assertExamPermission(actor, 'exam.result.process');
  await assertInstitutionOwnsCapability(actor, 'RESULT_PROCESSING');
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
  await assertInstitutionOwnsCapability(actor, 'RESULT_PROCESSING');
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

// Governed versioned result correction: V1 is retained as history; a corrected V2 becomes current (§28).
export const resultCorrectionSchema = z.object({
  reason: z.string().trim().min(1).max(2000),
  subjectCorrections: z
    .array(
      z.object({
        courseId: z.number().int().positive(),
        totalMarks: z.number().nonnegative().optional(),
        internalMarks: z.number().nonnegative().optional(),
        externalMarks: z.number().nonnegative().optional(),
        maxMarks: z.number().positive().optional(),
        credits: z.number().nonnegative().optional(),
        resultStatus: z.enum(['PASS', 'FAIL', 'ABSENT', 'MALPRACTICE', 'WITHHELD']).optional(),
      }),
    )
    .min(1),
});
export async function correctResult(
  actor: ExamActor,
  semesterResultId: number,
  body: z.infer<typeof resultCorrectionSchema>,
) {
  if (!canPublishResults(actor)) throw new AppError(403, 'Not authorized to correct results');
  // Only the institution that owns result processing may version-correct (VTU results are external authority).
  await assertInstitutionOwnsCapability(actor, 'RESULT_PROCESSING');
  const base = await db('semester_results')
    .where({ id: semesterResultId, college_id: actor.collegeId })
    .first();
  if (!base) throw new AppError(404, 'Result not found');
  if (!base.published) throw new AppError(400, 'Only a published result can be corrected');
  if (base.superseded_at) throw new AppError(409, 'This result version has already been superseded');
  const bands = parseGradeBands(base.grade_bands_snapshot);
  const exam = await db('examinations').where({ id: base.exam_id }).first();
  const subjects = await db('subject_results').where({ semester_result_id: base.id });
  const byCourse = new Map(body.subjectCorrections.map((c) => [c.courseId, c]));
  for (const c of body.subjectCorrections) {
    if (!subjects.some((s: Row) => Number(s.course_id) === c.courseId)) {
      throw new AppError(400, `Course ${c.courseId} is not part of this result`);
    }
  }

  const result = await db.transaction(async (trx) => {
    const newVersion = Number(base.result_version) + 1;
    const [newId] = await trx('semester_results').insert({
      college_id: base.college_id,
      student_id: base.student_id,
      exam_id: base.exam_id,
      academic_year_id: base.academic_year_id,
      semester_id: base.semester_id,
      program_id: base.program_id,
      total_credits: base.total_credits,
      earned_credits: base.earned_credits,
      status: base.status,
      result_version: newVersion,
      published: true,
      published_at: trx.fn.now(),
      published_by: actor.facultyUserId,
      exam_policy_id: base.exam_policy_id,
      grade_bands_snapshot:
        base.grade_bands_snapshot == null
          ? null
          : typeof base.grade_bands_snapshot === 'string'
            ? base.grade_bands_snapshot
            : JSON.stringify(base.grade_bands_snapshot),
    });

    const changes: Array<Record<string, unknown>> = [];
    const nextSubjects: Array<{ gradePoints: number; credits: number; resultStatus: string }> = [];
    for (const s of subjects) {
      const c = byCourse.get(Number(s.course_id));
      const total = c?.totalMarks ?? (s.total_marks != null ? Number(s.total_marks) : null);
      const maxMarks = c?.maxMarks ?? (s.max_marks != null ? Number(s.max_marks) : null);
      let grade = s.grade;
      let gradePoints = s.grade_points != null ? Number(s.grade_points) : 0;
      let resultStatus = s.result_status;
      if (c) {
        if (total != null && maxMarks != null && maxMarks > 0) {
          const g = gradeForMarks(total, maxMarks, bands);
          grade = g.grade;
          gradePoints = g.gradePoints;
        }
        resultStatus = c.resultStatus ?? (grade !== 'F' ? 'PASS' : 'FAIL');
        changes.push({
          courseId: Number(s.course_id),
          before: { totalMarks: s.total_marks != null ? Number(s.total_marks) : null, grade: s.grade, resultStatus: s.result_status },
          after: { totalMarks: total, grade, resultStatus },
        });
      }
      const credits = c?.credits ?? (s.credits != null ? Number(s.credits) : 0);
      await trx('subject_results').insert({
        college_id: s.college_id,
        semester_result_id: newId,
        student_id: s.student_id,
        course_id: s.course_id,
        exam_subject_id: s.exam_subject_id,
        internal_marks: c?.internalMarks ?? s.internal_marks,
        external_marks: c?.externalMarks ?? s.external_marks,
        total_marks: total,
        max_marks: maxMarks,
        grade,
        grade_points: gradePoints,
        credits,
        result_status: resultStatus,
        marks_source: s.marks_source,
      });
      nextSubjects.push({ gradePoints, credits, resultStatus });
    }

    const sgpa = computeSgpa(nextSubjects);
    const earnedCredits = nextSubjects
      .filter((s) => !['FAIL', 'ABSENT', 'WITHHELD', 'MALPRACTICE', 'INCOMPLETE'].includes(s.resultStatus))
      .reduce((sum, s) => sum + (s.credits || 0), 0);
    await trx('semester_results').where({ id: newId }).update({ sgpa, earned_credits: earnedCredits });

    await trx('semester_results').where({ id: base.id }).update({
      superseded_at: trx.fn.now(),
      superseded_by_id: newId,
      updated_at: trx.fn.now(),
    });

    await trx('exam_result_corrections').insert({
      college_id: actor.collegeId,
      base_semester_result_id: base.id,
      new_semester_result_id: newId,
      student_id: base.student_id,
      exam_id: base.exam_id,
      from_version: Number(base.result_version),
      to_version: newVersion,
      changes: JSON.stringify(changes),
      reason: body.reason,
      requested_by: actor.facultyUserId,
      approved_by: actor.facultyUserId,
    });

    return { newId: Number(newId), newVersion, sgpa, earnedCredits, changes };
  });

  if (exam) {
    await upsertAcademicRecord(
      actor.collegeId,
      Number(base.student_id),
      exam,
      result.sgpa,
      result.earnedCredits,
      result.newId,
      String(base.status),
    );
  }

  await recordExamAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'RESULT_CORRECTED',
    entityType: 'semester_result',
    entityId: result.newId,
    beforeState: { version: Number(base.result_version), semesterResultId: base.id },
    afterState: { version: result.newVersion, semesterResultId: result.newId, changes: result.changes },
    reason: body.reason,
  });

  return {
    baseSemesterResultId: Number(base.id),
    baseVersion: Number(base.result_version),
    newSemesterResultId: result.newId,
    newVersion: result.newVersion,
    sgpa: result.sgpa,
    changes: result.changes,
  };
}

export async function studentResults(studentId: number, collegeId: number, semesterId?: number) {
  let q = db('semester_results as sr')
    .join('examinations as e', 'e.id', 'sr.exam_id')
    .join('semesters as s', 's.id', 'sr.semester_id')
    .where({ 'sr.student_id': studentId, 'sr.college_id': collegeId, 'sr.published': true })
    .whereNull('sr.superseded_at')
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
