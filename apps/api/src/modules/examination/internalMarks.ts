import { db } from '../../db/index.js';
import { studentAttendanceSummary } from '../attendance/service.js';
import type { CieComponent } from './types.js';
import { resolvePolicy } from './policy.js';

type Row = Record<string, any>;

export async function computeInternalMarks(
  studentId: number,
  courseId: number,
  classId: number | null,
  collegeId: number,
  schemeId?: number | null,
  programId?: number | null,
) {
  const policy = await resolvePolicy(collegeId, schemeId, programId);
  const components = policy.cieComponents.length
    ? policy.cieComponents
    : [
        { kind: 'IA' as const, label: 'IA', weight: 50, aggregation: 'SUM' as const },
        { kind: 'ASSIGNMENT' as const, label: 'Assignment', weight: 25, aggregation: 'SUM' as const },
        { kind: 'QUIZ' as const, label: 'Quiz', weight: 25, aggregation: 'SUM' as const },
      ];

  let total = 0;
  const breakdown: Array<{ label: string; obtained: number; max: number; weight: number }> = [];

  for (const comp of components) {
    const result = await componentMarks(studentId, courseId, classId, collegeId, comp);
    const scaled = scaleComponent(result.obtained, result.max, comp.weight, policy.internalAggregation, components);
    total += scaled.obtained;
    breakdown.push({ label: comp.label, obtained: scaled.obtained, max: comp.weight, weight: comp.weight });
  }

  const capped = Math.min(total, policy.cieMaximum);
  return { internalMarks: capped, internalMax: policy.cieMaximum, breakdown, policy };
}

function scaleComponent(
  obtained: number,
  max: number,
  weight: number,
  aggregation: string,
  _all: CieComponent[],
) {
  if (max <= 0) return { obtained: 0, max: weight };
  const ratio = obtained / max;
  return { obtained: Math.round(ratio * weight * 100) / 100, max: weight };
}

async function componentMarks(
  studentId: number,
  courseId: number,
  classId: number | null,
  collegeId: number,
  comp: CieComponent,
) {
  switch (comp.kind) {
    case 'ASSIGNMENT':
      return assignmentMarks(studentId, courseId, collegeId, classId);
    case 'QUIZ':
      return quizMarks(studentId, courseId, collegeId, classId);
    case 'IA':
    case 'INTERNAL_ASSESSMENT':
      return iaMarks(studentId, courseId, collegeId, classId, comp);
    default:
      return { obtained: 0, max: comp.weight };
  }
}

async function assignmentMarks(studentId: number, courseId: number, collegeId: number, classId: number | null) {
  let q = db('assignment_submissions as s')
    .join('assignments as a', 'a.id', 's.assignment_id')
    .where({ 's.student_id': studentId, 'a.course_id': courseId, 'a.college_id': collegeId })
    .whereIn('s.status', ['SUBMITTED', 'LATE', 'EVALUATED', 'RETURNED'])
    .whereNotNull('s.obtained_marks');
  if (classId && (await db.schema.hasColumn('assignments', 'academic_class_id'))) {
    q = q.andWhere('a.academic_class_id', classId);
  }
  const rows = await q.select('s.obtained_marks', 's.total_marks');
  const obtained = rows.reduce((sum, r) => sum + Number(r.obtained_marks ?? 0), 0);
  const max = rows.reduce((sum, r) => sum + Number(r.total_marks ?? 0), 0);
  return { obtained, max: max || 1 };
}

async function quizMarks(studentId: number, courseId: number, collegeId: number, classId: number | null) {
  let q = db('quiz_attempts as qa')
    .join('quizzes as q', 'q.id', 'qa.quiz_id')
    .where({ 'qa.student_id': studentId, 'q.course_id': courseId, 'q.college_id': collegeId })
    .whereIn('qa.status', ['SUBMITTED', 'EVALUATED', 'AUTO_GRADED'])
    .whereNotNull('qa.obtained_marks');
  if (classId && (await db.schema.hasColumn('quizzes', 'academic_class_id'))) {
    q = q.andWhere('q.academic_class_id', classId);
  }
  const rows = await q.select('qa.obtained_marks', 'qa.total_marks');
  const obtained = rows.reduce((sum, r) => sum + Number(r.obtained_marks ?? 0), 0);
  const max = rows.reduce((sum, r) => sum + Number(r.total_marks ?? 0), 0);
  return { obtained, max: max || 1 };
}

async function iaMarks(
  studentId: number,
  courseId: number,
  collegeId: number,
  classId: number | null,
  comp: CieComponent,
) {
  let q = db('assessment_student_rows as r')
    .join('assessment_mark_sheets as s', 's.id', 'r.sheet_id')
    .where({ 'r.student_id': studentId, 's.course_id': courseId, 's.college_id': collegeId })
    .where('s.status', 'RESULT_RELEASED');
  if (classId) {
    const classRow = await db('academic_classes').where({ id: classId }).first();
    if (classRow?.class_section_id) {
      q = q.andWhere('s.class_section_id', classRow.class_section_id);
    }
  }
  const rows = await q.select('r.total_awarded', 's.max_marks', 's.title', 's.id');
  if (comp.sourceIds?.length) {
    const filtered = rows.filter((r) => comp.sourceIds!.includes(Number(r.id)));
    if (filtered.length) return aggregateRows(filtered, comp.aggregation);
  }
  if (comp.label) {
    const byLabel = rows.filter((r) => String(r.title || '').toLowerCase().includes(comp.label.toLowerCase()));
    if (byLabel.length) return aggregateRows(byLabel, comp.aggregation);
  }
  return aggregateRows(rows, comp.aggregation);
}

function aggregateRows(rows: Row[], aggregation?: string) {
  if (!rows.length) return { obtained: 0, max: 1 };
  const marks = rows.map((r) => ({ obtained: Number(r.total_awarded ?? 0), max: Number(r.max_marks ?? 0) }));
  if (aggregation === 'BEST_OF') {
    const best = marks.reduce((a, b) => (b.obtained / (b.max || 1) > a.obtained / (a.max || 1) ? b : a));
    return best;
  }
  if (aggregation === 'AVERAGE') {
    const obtained = marks.reduce((s, m) => s + m.obtained, 0) / marks.length;
    const max = marks.reduce((s, m) => s + m.max, 0) / marks.length;
    return { obtained, max: max || 1 };
  }
  return {
    obtained: marks.reduce((s, m) => s + m.obtained, 0),
    max: marks.reduce((s, m) => s + m.max, 0) || 1,
  };
}

export async function studentAttendancePct(studentId: number, courseId: number, classId: number | null) {
  if (!classId) return null;
  const summary = await studentAttendanceSummary(studentId, classId);
  const subject = summary.subjects?.find((s) => s.courseId === courseId);
  return subject?.percentage ?? summary.overall ?? null;
}

export async function eligibleStudentsForSubject(
  examId: number,
  examSubjectId: number,
  courseId: number,
  classId: number | null,
  collegeId: number,
  examType: string,
) {
  const students: Array<{ studentId: number; classId: number | null; source: string }> = [];

  if (classId) {
    const enrolled = await db('academic_class_enrollments')
      .where({ academic_class_id: classId, college_id: collegeId, status: 'APPROVED' })
      .select('student_id');
    for (const e of enrolled) {
      students.push({ studentId: Number(e.student_id), classId, source: 'CLASS' });
    }
  }

  if (examType === 'SUPPLEMENTARY' || examType === 'MAKEUP' || examType === 'IMPROVEMENT') {
    const backlogs = await db('backlog_subject_registrations')
      .where({ course_id: courseId, college_id: collegeId, status: 'ACTIVE' })
      .select('student_id');
    for (const b of backlogs) {
      const sid = Number(b.student_id);
      if (!students.some((s) => s.studentId === sid)) {
        students.push({ studentId: sid, classId: null, source: 'BACKLOG' });
      }
    }
  }

  return students;
}
