import { db } from '../../db/index.js';
import { parseSnapshotQuestions } from '../assignments/serialize.js';
import { parseJson } from './json.js';
import type { AssessmentSourceInput, StudentMarkStatus, StudentQuestionMark } from './types.js';

type SnapQ = { id: number; marks: number; primaryCoCode?: string | null; bloomLevel?: string | null; difficulty?: string | null };

function parseSnap(raw: unknown): SnapQ[] {
  const value =
    typeof raw === 'string'
      ? (() => {
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        })()
      : raw;
  if (Array.isArray(value)) return value as SnapQ[];
  if (value && typeof value === 'object' && Array.isArray((value as { questions?: unknown }).questions)) {
    return (value as { questions: SnapQ[] }).questions;
  }
  return [];
}

export type GatherContext = {
  collegeId: number;
  courseId: number;
  createdBy?: number | null;
  academicYearId?: number | null;
  semesterId?: number | null;
};

function matchContext(row: { academic_year_id?: number | null; semester_id?: number | null }, ctx: GatherContext) {
  if (ctx.academicYearId && row.academic_year_id && Number(row.academic_year_id) !== ctx.academicYearId) return false;
  if (ctx.semesterId && row.semester_id && Number(row.semester_id) !== ctx.semesterId) return false;
  return true;
}

export async function gatherQuizSources(ctx: GatherContext): Promise<AssessmentSourceInput[]> {
  if (!(await db.schema.hasTable('quizzes'))) return [];
  const quizzes = await db('quizzes')
    .where({ college_id: ctx.collegeId, course_id: ctx.courseId })
    .whereNull('deleted_at')
    .modify((q) => {
      if (ctx.createdBy != null) q.andWhere({ created_by: ctx.createdBy });
    })
    .whereIn('status', ['PUBLISHED', 'ACTIVE', 'CLOSED']);
  const sources: AssessmentSourceInput[] = [];
  for (const quiz of quizzes) {
    if (!matchContext(quiz, ctx)) continue;
    const questions = await db('quiz_questions').where({ quiz_id: quiz.id }).select('id', 'marks', 'primary_co_code', 'difficulty');
    const attempts = await db('quiz_attempts as a')
      .leftJoin('students as s', 's.id', 'a.student_id')
      .where({ 'a.quiz_id': quiz.id, 'a.college_id': ctx.collegeId })
      .whereIn('a.status', ['SUBMITTED', 'EXPIRED_SUBMITTED'])
      .select('a.id', 'a.student_id', 'a.question_snapshot', 's.usn', 's.name');
    const students = attempts.map((a) => ({
      studentKey: String(a.student_id || a.id),
      usn: String(a.usn || a.student_id || a.id),
      name: a.name ? String(a.name) : null,
      status: 'PRESENT' as const,
    }));
    const marks: StudentQuestionMark[] = [];
    for (const attempt of attempts) {
      const snap = parseSnap(attempt.question_snapshot);
      const answers = await db('quiz_attempt_answers').where({ attempt_id: attempt.id });
      const byQ = new Map(answers.map((x) => [Number(x.snapshot_question_id), x]));
      const questionList: SnapQ[] = snap.length
        ? snap
        : questions.map((qq) => ({ id: Number(qq.id), marks: Number(qq.marks), primaryCoCode: qq.primary_co_code as string | null }));
      for (const q of questionList) {
        const live = questions.find((lq) => Number(lq.id) === Number(q.id));
        const ans = byQ.get(Number(q.id));
        marks.push({
          studentKey: String(attempt.student_id || attempt.id),
          questionKey: String(q.id),
          coCode: (q.primaryCoCode || live?.primary_co_code || ans?.primary_co_code || null) as string | null,
          awarded: ans?.awarded_marks != null ? Number(ans.awarded_marks) : 0,
          maxMarks: Number(q.marks || live?.marks || ans?.max_marks || 0),
          status: 'PRESENT',
          bloomLevel: q.bloomLevel ?? null,
          difficulty: live?.difficulty ?? q.difficulty ?? null,
        });
      }
    }
    sources.push({
      sourceKind: 'QUIZ',
      sourceId: Number(quiz.id),
      sourceLabel: String(quiz.title || `Quiz ${quiz.id}`),
      category: 'CIE',
      weight: 1,
      questions: questions.map((q) => ({
        questionKey: String(q.id),
        maxMarks: Number(q.marks),
        coCode: q.primary_co_code,
        difficulty: q.difficulty,
      })),
      students,
      marks,
    });
  }
  return sources;
}

export async function gatherAssignmentSources(ctx: GatherContext): Promise<AssessmentSourceInput[]> {
  if (!(await db.schema.hasTable('assignments'))) return [];
  const assignments = await db('assignments')
    .where({ college_id: ctx.collegeId, course_id: ctx.courseId })
    .whereNull('deleted_at')
    .modify((q) => {
      if (ctx.createdBy != null) q.andWhere({ created_by: ctx.createdBy });
    });
  const sources: AssessmentSourceInput[] = [];
  for (const assignment of assignments) {
    if (!matchContext(assignment, ctx)) continue;
    const questions = await db('assignment_questions').where({ assignment_id: assignment.id }).select('id', 'marks', 'primary_co_code', 'difficulty');
    const submissions = await db('assignment_submissions as s')
      .leftJoin('students as st', 'st.id', 's.student_id')
      .where({ 's.assignment_id': assignment.id, 's.college_id': ctx.collegeId })
      .whereIn('s.evaluation_status', ['EVALUATED', 'RELEASED'])
      .select('s.id', 's.student_id', 's.question_snapshot', 'st.usn', 'st.name');
    const students = submissions.map((s) => ({
      studentKey: String(s.student_id || s.id),
      usn: String(s.usn || s.student_id || s.id),
      name: s.name ? String(s.name) : null,
      status: 'PRESENT' as const,
    }));
    const marks: StudentQuestionMark[] = [];
    for (const sub of submissions) {
      const snap = parseSnapshotQuestions(sub.question_snapshot);
      const answers = await db('assignment_answers').where({ submission_id: sub.id });
      const byQ = new Map(answers.map((a) => [String(a.snapshot_question_id), a]));
      for (const q of snap) {
        const ans = byQ.get(String(q.id));
        marks.push({
          studentKey: String(sub.student_id || sub.id),
          questionKey: String(q.id),
          coCode: q.primaryCoCode || null,
          awarded: ans?.awarded_marks != null ? Number(ans.awarded_marks) : 0,
          maxMarks: Number(q.marks) || 0,
          status: 'PRESENT',
          bloomLevel: (q as { bloomsLevel?: string | null }).bloomsLevel ?? null,
          difficulty: q.difficulty ?? null,
        });
      }
    }
    sources.push({
      sourceKind: 'ASSIGNMENT',
      sourceId: Number(assignment.id),
      sourceLabel: String(assignment.title || `Assignment ${assignment.id}`),
      category: 'CIE',
      weight: 1,
      questions: questions.map((q) => ({
        questionKey: String(q.id),
        maxMarks: Number(q.marks),
        coCode: q.primary_co_code,
        difficulty: q.difficulty,
      })),
      students,
      marks,
    });
  }
  return sources;
}

export async function gatherMarkSheetSources(
  ctx: GatherContext,
  category: 'CIE' | 'SEE',
  sourceKind?: string,
): Promise<AssessmentSourceInput[]> {
  if (!(await db.schema.hasTable('assessment_mark_sheets'))) return [];
  const q = db('assessment_mark_sheets')
    .where({ college_id: ctx.collegeId, course_id: ctx.courseId })
    .whereIn('status', ['FROZEN', 'COMMITTED', 'FINALIZED'])
    .modify((qb) => {
      if (ctx.createdBy != null) qb.andWhere({ created_by: ctx.createdBy });
    });
  if (sourceKind) q.andWhere({ source_kind: sourceKind });
  else if (category === 'SEE') q.andWhere({ source_kind: 'SEE' });
  else q.whereIn('source_kind', ['INTERNAL_PAPER', 'LAB', 'PROJECT', 'REASSESSMENT']);
  const sheets = await q;
  const sources: AssessmentSourceInput[] = [];
  for (const sheet of sheets) {
    if (!matchContext(sheet, ctx)) continue;
    const questions = await db('assessment_mark_questions').where({ sheet_id: sheet.id }).orderBy('sort_order');
    const rows = await db('assessment_student_rows').where({ sheet_id: sheet.id });
    const marksRows = rows.length
      ? await db('assessment_student_question_marks').whereIn(
          'student_row_id',
          rows.map((r) => r.id),
        )
      : [];
    const qById = new Map(questions.map((qq) => [Number(qq.id), qq]));
    const marks: StudentQuestionMark[] = marksRows.map((m) => {
      const qrow = qById.get(Number(m.question_id));
      const student = rows.find((r) => Number(r.id) === Number(m.student_row_id));
      return {
        studentKey: String(student?.usn || m.student_row_id),
        questionKey: String(qrow?.question_key || m.question_id),
        coCode: qrow?.primary_co_code ?? null,
        awarded: m.awarded_marks != null ? Number(m.awarded_marks) : null,
        maxMarks: Number(qrow?.max_marks || 0),
        status: (m.status || student?.status || 'PRESENT') as StudentMarkStatus,
        bloomLevel: qrow?.bloom_level,
        difficulty: qrow?.difficulty,
        topic: qrow?.topic,
        module: qrow?.module_or_unit,
        orGroupId: qrow?.or_group_id ?? null,
        orAlternative: qrow?.or_alternative ?? null,
      };
    });
    sources.push({
      sourceKind: String(sheet.source_kind),
      sourceId: Number(sheet.id),
      sourceLabel: String(sheet.title || sheet.source_kind),
      category: sheet.source_kind === 'SEE' ? 'SEE' : category,
      weight: 1,
      questions: questions.map((qq) => ({
        questionKey: String(qq.question_key),
        maxMarks: Number(qq.max_marks),
        coCode: qq.primary_co_code,
        bloomLevel: qq.bloom_level,
        difficulty: qq.difficulty,
        topic: qq.topic,
        module: qq.module_or_unit,
        orGroupId: qq.or_group_id ?? null,
        orAlternative: qq.or_alternative ?? null,
      })),
      students: rows.map((r) => ({
        studentKey: String(r.usn),
        usn: String(r.usn),
        name: r.student_name,
        status: (r.status || 'PRESENT') as StudentMarkStatus,
        totalAwarded: r.total_awarded != null ? Number(r.total_awarded) : null,
        totalMax: Number(sheet.max_marks),
      })),
      marks,
    });
  }
  return sources;
}

export async function gatherIndirectSources(ctx: GatherContext): Promise<AssessmentSourceInput[]> {
  if (!(await db.schema.hasTable('survey_question_co_links'))) return [];
  const links = await db('survey_question_co_links as l')
    .join('surveys as s', 's.id', 'l.survey_id')
    .where({ 'l.college_id': ctx.collegeId, 'l.approved': true, 's.course_id': ctx.courseId })
    .whereNull('s.deleted_at')
    .select('l.*', 's.title as surveyTitle');
  if (!links.length) return [];
  const bySurvey = new Map<number, typeof links>();
  for (const link of links) {
    const sid = Number(link.survey_id);
    const list = bySurvey.get(sid) ?? [];
    list.push(link);
    bySurvey.set(sid, list);
  }
  const sources: AssessmentSourceInput[] = [];
  for (const [surveyId, surveyLinks] of bySurvey) {
    const questionsMeta = await db('questions').whereIn(
      'id',
      surveyLinks.map((l) => l.question_id),
    );
    const options = await db('question_options').whereIn(
      'question_id',
      questionsMeta.map((q) => q.id),
    );
    const maxByQ = new Map<number, number>();
    for (const q of questionsMeta) {
      const qOpts = options.filter((o) => Number(o.question_id) === Number(q.id));
      const maxVal = qOpts.reduce((m, o) => Math.max(m, Number(o.value ?? 0)), 0);
      maxByQ.set(Number(q.id), maxVal || 5);
    }
    const submissions = await db('survey_submissions as ss')
      .leftJoin('students as st', 'st.id', 'ss.student_id')
      .where({ 'ss.survey_id': surveyId, 'ss.status': 'COMPLETED' })
      .select('ss.id', 'ss.student_id', 'st.usn', 'st.name');
    const answers = submissions.length
      ? await db('survey_answers').whereIn(
          'submission_id',
          submissions.map((s) => s.id),
        )
      : [];
    const marks: StudentQuestionMark[] = [];
    for (const sub of submissions) {
      const subAnswers = answers.filter((a) => Number(a.submission_id) === Number(sub.id));
      for (const link of surveyLinks) {
        const ans = subAnswers.find((a) => Number(a.question_id) === Number(link.question_id));
        const max = maxByQ.get(Number(link.question_id)) || 5;
        const numeric =
          ans?.numeric_answer != null
            ? Number(ans.numeric_answer)
            : ans?.selected_option_id
              ? Number(options.find((o) => Number(o.id) === Number(ans.selected_option_id))?.value ?? 0)
              : null;
        marks.push({
          studentKey: String(sub.student_id || sub.id),
          questionKey: String(link.question_id),
          coCode: String(link.co_code),
          awarded: numeric,
          maxMarks: max,
          status: 'PRESENT',
        });
      }
    }
    sources.push({
      sourceKind: 'SURVEY',
      sourceId: surveyId,
      sourceLabel: String(surveyLinks[0]?.surveyTitle || `Survey ${surveyId}`),
      category: 'INDIRECT',
      weight: 1,
      questions: surveyLinks.map((l) => ({
        questionKey: String(l.question_id),
        maxMarks: maxByQ.get(Number(l.question_id)) || 5,
        coCode: String(l.co_code),
      })),
      students: submissions.map((s) => ({
        studentKey: String(s.student_id || s.id),
        usn: String(s.usn || s.student_id || s.id),
        name: s.name,
        status: 'PRESENT' as const,
      })),
      marks,
    });
  }
  return sources;
}

export async function loadCourseAssessmentWeights(collegeId: number, courseId: number, courseCode?: string | null) {
  const structure = await db('course_assessment_structures')
    .where({ college_id: collegeId })
    .modify((q) => {
      q.andWhere((inner) => {
        inner.where({ course_id: courseId });
        if (courseCode) inner.orWhere({ course_code: courseCode });
      });
    })
    .where({ is_active: true })
    .orderBy('id', 'desc')
    .first();
  const components = structure
    ? await db('course_assessment_components').where({ structure_id: structure.id }).orderBy('display_order')
    : [];
  return {
    cieWeight: structure?.cie_weightage != null ? Number(structure.cie_weightage) : null,
    seeWeight: structure?.see_weightage != null ? Number(structure.see_weightage) : null,
    cieMax: structure?.cie_max_marks != null ? Number(structure.cie_max_marks) : null,
    seeMax: structure?.see_max_marks != null ? Number(structure.see_max_marks) : null,
    components: components.map((c) => ({
      code: String(c.component_id || c.component_name),
      name: String(c.component_name),
      weightage: c.weightage != null ? Number(c.weightage) : null,
      maxMarks: c.max_marks != null ? Number(c.max_marks) : null,
    })),
    structureId: structure ? Number(structure.id) : null,
  };
}

export async function loadCourseOutcomes(collegeId: number, courseId: number) {
  return db('course_outcomes')
    .where({ college_id: collegeId, course_id: courseId, is_current: true })
    .select('id', 'co_code', 'statement', 'blooms_level')
    .orderBy('co_number');
}

export async function loadMappingSnapshot(collegeId: number, courseId: number) {
  const versions = await db('copo_mapping_versions')
    .where({ college_id: collegeId, course_id: courseId, is_current: true })
    .select('id', 'mapping_kind', 'mapping_type', 'status');
  const items = versions.length
    ? await db('copo_mapping_items as i')
        .leftJoin('course_outcomes as co', 'co.id', 'i.course_outcome_id')
        .leftJoin('program_outcomes as po', 'po.id', 'i.program_outcome_id')
        .leftJoin('program_specific_outcomes as pso', 'pso.id', 'i.program_specific_outcome_id')
        .whereIn(
          'i.mapping_version_id',
          versions.map((v) => v.id),
        )
        .whereNotNull('i.correlation_strength')
        .select(
          'i.correlation_strength',
          'co.co_code as coCode',
          'po.po_code as poCode',
          'pso.pso_code as psoCode',
        )
    : [];
  return { versions, items };
}

export async function loadSeePaperQuestions(collegeId: number, courseId: number) {
  const paper = await db('previous_year_papers')
    .where({ college_id: collegeId, course_id: courseId, exam_type: 'SEE', is_active: true })
    .orderBy('exam_year', 'desc')
    .first();
  if (!paper) return { paper: null, questions: [] as Array<{ questionKey: string; coCode: string | null; maxMarks: number }> };
  const questions = await db('previous_year_questions')
    .where({ paper_id: paper.id, is_active: true })
    .select('id', 'question_id', 'primary_co_code', 'max_marks');
  return {
    paper,
    questions: questions.map((q) => ({
      questionKey: String(q.question_id || q.id),
      coCode: q.primary_co_code,
      maxMarks: Number(q.max_marks || 0),
    })),
  };
}

export { parseJson };
