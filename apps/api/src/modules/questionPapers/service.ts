import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { catalog as copoCatalog } from '../copo/masters.js';
import { assignedCourseIds } from '../copo/helpers.js';
import { resolveDerivedOutcomes } from '../questions/coMapping.js';
import { publicUrlForSource } from './discover.js';
import { fingerprintQuestion, appearancesFor } from './repeatAnalysis.js';
import { applyPreviousYearImport } from './importService.js';
import { textbookCitation } from './sourcePolicy.js';
import type { QpActor } from './access.js';

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

export const paperFiltersSchema = z.object({
  q: z.string().optional(),
  courseId: z.number().int().positive().optional(),
  courseCode: z.string().optional(),
  scheme: z.string().optional(),
  semester: z.string().optional(),
  program: z.string().optional(),
  academicYear: z.string().optional(),
  examType: z.string().optional(),
  year: z.number().int().optional(),
});

export async function getCatalog(collegeId: number, actor?: QpActor, academicYearId?: number) {
  const catalog = await copoCatalog(collegeId);
  const assigned = actor ? await assignedCourseIds(actor, academicYearId ?? null) : [];
  return { ...catalog, assignedCourseIds: assigned };
}

export async function listPapers(collegeId: number, filters: z.infer<typeof paperFiltersSchema> = {}) {
  let q = db('previous_year_papers as p')
    .leftJoin('courses as c', 'c.id', 'p.course_id')
    .where({ 'p.college_id': collegeId, 'p.is_active': true })
    .select(
      'p.*',
      'c.name as matched_course_name',
      'c.code as matched_course_code',
    )
    .orderBy('p.exam_year', 'desc')
    .orderBy('p.subject_name');

  if (filters.courseId) q = q.andWhere('p.course_id', filters.courseId);
  if (filters.courseCode) {
    const code = filters.courseCode.replace(/\s+/g, '').toUpperCase();
    q = q.andWhere((b) => {
      b.where('p.course_code', code).orWhere('p.course_code', 'like', `%${code}%`);
    });
  }
  if (filters.scheme) q = q.andWhere('p.scheme_label', filters.scheme);
  if (filters.semester) q = q.andWhere('p.semester_label', filters.semester);
  if (filters.program) q = q.andWhere('p.program_name', filters.program);
  if (filters.academicYear) q = q.andWhere('p.academic_year', filters.academicYear);
  if (filters.examType) q = q.andWhere('p.exam_type', filters.examType);
  if (filters.year) q = q.andWhere('p.exam_year', filters.year);
  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    q = q.andWhere((b) => {
      b.where('p.subject_name', 'like', term)
        .orWhere('p.course_code', 'like', term)
        .orWhere('p.paper_id', 'like', term);
    });
  }

  const rows = await q;
  const ids = rows.map((r) => r.id);
  const questions = ids.length
    ? await db('previous_year_questions').whereIn('paper_id', ids).whereNull('parent_id').select('paper_id', 'primary_co_code')
    : [];
  const coByPaper = new Map<number, Set<string>>();
  for (const qq of questions) {
    const set = coByPaper.get(Number(qq.paper_id)) ?? new Set();
    if (qq.primary_co_code) set.add(String(qq.primary_co_code));
    coByPaper.set(Number(qq.paper_id), set);
  }

  return {
    papers: rows.map((r) => ({
      id: Number(r.id),
      paperId: r.paper_id,
      subjectName: r.subject_name || r.matched_course_name,
      courseCode: r.course_code || r.matched_course_code,
      courseId: r.course_id ? Number(r.course_id) : null,
      scheme: r.scheme_label,
      program: r.program_name,
      semester: r.semester_label,
      examType: r.exam_type,
      academicYear: r.academic_year,
      examMonth: r.exam_month,
      examYear: r.exam_year ? Number(r.exam_year) : null,
      examDate: r.exam_date,
      maxMarks: r.max_marks != null ? Number(r.max_marks) : null,
      durationMinutes: r.duration_minutes != null ? Number(r.duration_minutes) : null,
      university: r.university,
      sourceFile: r.source_file,
      sourceUrl: publicUrlForSource(String(r.source_file)),
      sourceType: r.source_type,
      extractionStatus: r.extraction_status,
      verificationStatus: r.verification_status,
      mappingStatus: r.mapping_status ?? null,
      solutionReadiness: r.solution_readiness ?? null,
      readyQuestionCount: r.ready_question_count != null ? Number(r.ready_question_count) : null,
      questionCount: Number(r.question_count || 0),
      cos: [...(coByPaper.get(Number(r.id)) ?? [])].sort(),
      startPage: r.start_page,
      endPage: r.end_page,
    })),
  };
}

export async function getPaper(collegeId: number, id: number) {
  const header = await db('previous_year_papers').where({ id, college_id: collegeId }).first();
  if (!header) throw new AppError(404, 'Question paper not found');
  const questions = await db('previous_year_questions')
    .where({ paper_id: id, college_id: collegeId, is_active: true })
    .orderBy('question_number')
    .orderBy('sub_letter');
  const parents = questions.filter((q) => !q.parent_id);
  const children = questions.filter((q) => q.parent_id);
  const allTexts = await db('previous_year_questions')
    .where({ college_id: collegeId })
    .whereNull('parent_id')
    .select('question_text', 'question_id', 'paper_id');
  const papersMeta = await db('previous_year_papers')
    .where({ college_id: collegeId })
    .select('paper_id', 'exam_year', 'exam_date');
  const yearByPaper = new Map(papersMeta.map((p) => [String(p.paper_id), { year: p.exam_year ? Number(p.exam_year) : null, examDate: p.exam_date as string | null }]));

  const mapped = parents.map((q) => {
    const subs = children.filter((c) => Number(c.parent_id) === Number(q.id));
    const apps = appearancesFor(String(q.question_text), allTexts.map((t) => ({
      text: String(t.question_text),
      year: yearByPaper.get(String(t.paper_id))?.year ?? null,
      examDate: yearByPaper.get(String(t.paper_id))?.examDate ?? null,
      paperId: String(t.paper_id),
    })));
    return {
      id: Number(q.id),
      questionId: q.question_id,
      questionNumber: Number(q.question_number),
      section: q.section,
      questionText: q.question_text,
      questionType: q.question_type,
      maxMarks: q.max_marks != null ? Number(q.max_marks) : null,
      moduleOrUnit: q.module_or_unit,
      primaryCo: q.primary_co_code,
      difficulty: q.difficulty,
      bloomLevel: q.bloom_level,
      isOrChoice: Boolean(q.is_or_choice),
      orGroupId: q.or_group_id,
      orPairId: q.or_pair_id || q.or_group_id,
      orAlternative: q.or_alternative ?? null,
      moduleAssignmentMethod: q.module_assignment_method ?? null,
      sourcePage: q.source_page,
      mappingBasis: q.mapping_basis,
      verificationStatus: q.verification_status,
      readinessStatus: q.readiness_status || q.verification_status,
      solutionStatus: q.solution_status ?? null,
      schemeStatus: q.scheme_status ?? null,
      moduleMappingStatus: q.module_mapping_status ?? null,
      coMappingBlocked: Boolean(q.co_mapping_blocked),
      derivedOutcomes: parseJson(q.derived_outcomes_snapshot, null),
      fingerprint: q.fingerprint,
      appearances: apps,
      subquestions: subs.map((s) => ({
        id: Number(s.id),
        questionId: s.question_id,
        letter: s.sub_letter,
        questionText: s.question_text,
        maxMarks: s.max_marks != null ? Number(s.max_marks) : null,
        bloomLevel: s.bloom_level,
        difficulty: s.difficulty,
      })),
    };
  });

  return {
    paper: {
      id: Number(header.id),
      paperId: header.paper_id,
      subjectName: header.subject_name,
      courseCode: header.course_code,
      courseId: header.course_id ? Number(header.course_id) : null,
      scheme: header.scheme_label,
      program: header.program_name,
      semester: header.semester_label,
      examType: header.exam_type,
      academicYear: header.academic_year,
      examMonth: header.exam_month,
      examYear: header.exam_year ? Number(header.exam_year) : null,
      examDate: header.exam_date,
      maxMarks: header.max_marks != null ? Number(header.max_marks) : null,
      durationMinutes: header.duration_minutes != null ? Number(header.duration_minutes) : null,
      university: header.university,
      sourceFile: header.source_file,
      sourceUrl: publicUrlForSource(String(header.source_file)),
      sourceType: header.source_type,
      extractionStatus: header.extraction_status,
      verificationStatus: header.verification_status,
      mappingStatus: header.mapping_status ?? null,
      solutionReadiness: header.solution_readiness ?? null,
      notes: header.notes,
      startPage: header.start_page,
      endPage: header.end_page,
    },
    questions: mapped,
  };
}

export async function getQuestion(collegeId: number, id: number) {
  const row = await db('previous_year_questions as q')
    .join('previous_year_papers as p', 'p.id', 'q.paper_id')
    .where({ 'q.id': id, 'q.college_id': collegeId })
    .select('q.*', 'p.paper_id as paper_key', 'p.subject_name', 'p.course_code', 'p.exam_type', 'p.exam_year', 'p.exam_date', 'p.course_id', 'p.source_file')
    .first();
  if (!row) throw new AppError(404, 'Question not found');

  let derived: unknown = parseJson(row.derived_outcomes_snapshot, null);
  if (row.course_id && row.primary_co_code) {
    derived = await resolveDerivedOutcomes({
      collegeId,
      courseId: Number(row.course_id),
      primaryCoCode: String(row.primary_co_code),
      primaryCoId: row.primary_co_id ? Number(row.primary_co_id) : null,
    });
  }

  const all = await db('previous_year_questions as q')
    .join('previous_year_papers as p', 'p.id', 'q.paper_id')
    .where({ 'q.college_id': collegeId })
    .whereNull('q.parent_id')
    .select('q.question_text', 'p.paper_id', 'p.exam_year', 'p.exam_date', 'p.subject_name');
  const apps = appearancesFor(String(row.question_text), all.map((t) => ({
    text: String(t.question_text),
    year: t.exam_year ? Number(t.exam_year) : null,
    examDate: t.exam_date,
    paperId: String(t.paper_id),
  })));

  let coStatement: string | null = null;
  if (row.course_id && row.primary_co_code) {
    const co = await db('course_outcomes')
      .where({ college_id: collegeId, course_id: row.course_id, co_code: row.primary_co_code, is_current: true })
      .first();
    coStatement = co?.statement ? String(co.statement) : null;
  }

  let citation: string | null = null;
  if (await db.schema.hasTable('qp_master_solutions')) {
    const sol = await db('qp_master_solutions').where({ question_row_id: id }).first();
    if (sol) {
      citation = textbookCitation({
        title: sol.textbook_title,
        chapter: sol.chapter,
        section: sol.section,
      });
    }
  }

  return {
    id: Number(row.id),
    questionId: row.question_id,
    questionNumber: Number(row.question_number),
    questionText: row.question_text,
    maxMarks: row.max_marks != null ? Number(row.max_marks) : null,
    moduleOrUnit: row.module_or_unit,
    primaryCo: row.primary_co_code,
    coStatement,
    difficulty: row.difficulty,
    bloomLevel: row.bloom_level,
    sourcePage: row.source_page,
    mappingBasis: row.mapping_basis,
    verificationStatus: row.verification_status,
    coMappingBlocked: Boolean(row.co_mapping_blocked),
    derivedOutcomes: derived,
    paper: {
      paperId: row.paper_key,
      subjectName: row.subject_name,
      courseCode: row.course_code,
      courseId: row.course_id ? Number(row.course_id) : null,
      examType: row.exam_type,
      examYear: row.exam_year ? Number(row.exam_year) : null,
      examDate: row.exam_date,
      sourceFile: row.source_file,
      sourceUrl: publicUrlForSource(String(row.source_file)),
    },
    appearances: apps,
    originalQuestionText: row.original_question_text || row.question_text,
    displayQuestionText: row.display_question_text || row.question_text,
    sourceType: row.source_type || 'PREVIOUS_YEAR_QUESTION_PAPER',
    readinessStatus: row.readiness_status || 'PYQ_EXTRACTED',
    printedCo: row.printed_co ?? null,
    derivedCo: row.derived_co ?? row.primary_co_code,
    printedPo: row.printed_po ?? null,
    printedPso: row.printed_pso ?? null,
    printedRbt: row.printed_rbt ?? null,
    rbtLevel: row.rbt_level || row.printed_rbt,
    marksStatus: row.marks_status ?? null,
    moduleMappingStatus: row.module_mapping_status ?? null,
    coMappingStatus: row.co_mapping_status ?? null,
    solutionStatus: row.solution_status ?? null,
    schemeStatus: row.scheme_status ?? null,
    textbookId: row.textbook_id ? Number(row.textbook_id) : null,
    textbookCitation: citation,
  };
}

export async function searchQuestions(
  collegeId: number,
  filters: {
    q?: string;
    courseId?: number;
    courseCode?: string;
    module?: string;
    co?: string;
    marks?: number;
    year?: number;
    difficulty?: string;
    bloom?: string;
    repeated?: boolean;
    page?: number;
    pageSize?: number;
  },
) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
  let query = db('previous_year_questions as q')
    .join('previous_year_papers as p', 'p.id', 'q.paper_id')
    .where({ 'q.college_id': collegeId, 'q.is_active': true })
    .whereNull('q.parent_id');

  if (filters.courseId) query = query.andWhere('p.course_id', filters.courseId);
  if (filters.courseCode) {
    const code = filters.courseCode.replace(/\s+/g, '').toUpperCase();
    query = query.andWhere((b) => {
      b.where('p.course_code', code).orWhere('p.course_code', 'like', `%${code}%`);
    });
  }
  if (filters.module) query = query.andWhere('q.module_or_unit', 'like', `%${filters.module}%`);
  if (filters.co) query = query.andWhere('q.primary_co_code', filters.co.toUpperCase());
  if (filters.marks != null) query = query.andWhere('q.max_marks', filters.marks);
  if (filters.year) query = query.andWhere('p.exam_year', filters.year);
  if (filters.difficulty) query = query.andWhere('q.difficulty', filters.difficulty);
  if (filters.bloom) query = query.andWhere('q.bloom_level', filters.bloom);
  if (filters.q?.trim()) query = query.andWhere('q.question_text', 'like', `%${filters.q.trim()}%`);

  const countRow = await query.clone().count({ c: '*' }).first();
  const total = Number(countRow?.c ?? 0);
  const hasReadiness = await db.schema.hasColumn('previous_year_questions', 'readiness_status');
  const rows = await query
    .clone()
    .select(
      'q.id',
      'q.question_id as questionId',
      'q.question_number as questionNumber',
      'q.question_text as questionText',
      'q.max_marks as maxMarks',
      'q.module_or_unit as moduleOrUnit',
      'q.primary_co_code as primaryCo',
      'q.difficulty',
      'q.bloom_level as bloomLevel',
      'q.fingerprint',
      'p.paper_id as paperId',
      'p.subject_name as subjectName',
      'p.course_code as courseCode',
      'p.exam_year as examYear',
      'p.exam_type as examType',
      'p.exam_date as examDate',
      ...(hasReadiness ? ['q.readiness_status as readinessStatus', 'q.solution_status as solutionStatus'] : []),
    )
    .orderBy('p.exam_year', 'desc')
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const fpCounts = await db('previous_year_questions')
    .where({ college_id: collegeId })
    .whereNull('parent_id')
    .whereNotNull('fingerprint')
    .select('fingerprint')
    .count({ c: '*' })
    .groupBy('fingerprint');
  const countByFp = new Map(
    (fpCounts as Array<{ fingerprint?: string; c?: number }>).map((r) => [String(r.fingerprint), Number(r.c)]),
  );

  let questions = rows.map((r) => ({
    ...r,
    id: Number(r.id),
    maxMarks: r.maxMarks != null ? Number(r.maxMarks) : null,
    examYear: r.examYear != null ? Number(r.examYear) : null,
    appearanceCount: countByFp.get(String(r.fingerprint)) || 1,
  }));
  if (filters.repeated) questions = questions.filter((q) => q.appearanceCount > 1);

  return { total, page, pageSize, questions };
}

export async function listModuleBank(
  collegeId: number,
  filters: { courseId?: number; courseCode?: string; subject?: string },
) {
  let query = db('previous_year_questions as q')
    .join('previous_year_papers as p', 'p.id', 'q.paper_id')
    .where({ 'q.college_id': collegeId, 'q.is_active': true })
    .whereNull('q.parent_id');
  if (filters.courseId) query = query.andWhere('p.course_id', filters.courseId);
  if (filters.courseCode) {
    const code = filters.courseCode.replace(/\s+/g, '').toUpperCase();
    query = query.andWhere((b) => {
      b.where('p.course_code', code).orWhere('p.course_code', 'like', `%${code}%`);
    });
  }
  if (filters.subject) query = query.andWhere('p.subject_name', 'like', `%${filters.subject}%`);

  const hasOrPair = await db.schema.hasColumn('previous_year_questions', 'or_pair_id');
  const hasAssign = await db.schema.hasColumn('previous_year_questions', 'module_assignment_method');
  const rows = await query.select(
    'q.id',
    'q.question_id as questionId',
    'q.question_number as questionNumber',
    'q.question_text as questionText',
    'q.max_marks as maxMarks',
    'q.module_or_unit as moduleOrUnit',
    'q.primary_co_code as primaryCo',
    'q.printed_co as printedCo',
    'q.rbt_level as rbtLevel',
    'q.printed_rbt as printedRbt',
    'q.bloom_level as bloomLevel',
    'q.or_group_id as orGroupId',
    ...(hasOrPair ? ['q.or_pair_id as orPairId', 'q.or_alternative as orAlternative'] : []),
    ...(hasAssign ? ['q.module_assignment_method as moduleAssignmentMethod'] : []),
    'q.readiness_status as readinessStatus',
    'q.solution_status as solutionStatus',
    'q.scheme_status as schemeStatus',
    'q.fingerprint',
    'p.paper_id as paperId',
    'p.subject_name as subjectName',
    'p.course_code as courseCode',
    'p.exam_year as examYear',
    'p.exam_type as examType',
    'p.exam_month as examMonth',
    'p.academic_year as academicYear',
  );
  const children = rows.length
    ? await db('previous_year_questions')
        .whereIn(
          'parent_id',
          rows.map((r) => Number(r.id)),
        )
        .select('parent_id', 'sub_letter', 'question_text', 'max_marks')
    : [];
  const fpCounts = new Map<string, { count: number; years: number[] }>();
  for (const r of rows) {
    const fp = String(r.fingerprint || fingerprintQuestion(String(r.questionText)));
    const cur = fpCounts.get(fp) || { count: 0, years: [] };
    cur.count += 1;
    if (r.examYear) cur.years.push(Number(r.examYear));
    fpCounts.set(fp, cur);
  }

  const questions = rows.map((r) => {
    const fp = String(r.fingerprint || fingerprintQuestion(String(r.questionText)));
    const freq = fpCounts.get(fp);
    const years = [...new Set(freq?.years || [])].sort();
    const subs = children.filter((c) => Number(c.parent_id) === Number(r.id));
    return {
      id: Number(r.id),
      questionId: r.questionId,
      questionNumber: Number(r.questionNumber),
      questionText: r.questionText,
      maxMarks: r.maxMarks != null ? Number(r.maxMarks) : null,
      moduleOrUnit: r.moduleOrUnit,
      primaryCo: r.primaryCo || r.printedCo,
      rbt: r.rbtLevel || r.printedRbt,
      bloomLevel: r.bloomLevel,
      orPairId: r.orPairId || r.orGroupId,
      orAlternative: r.orAlternative,
      moduleAssignmentMethod: r.moduleAssignmentMethod,
      readinessStatus: r.readinessStatus,
      schemeStatus: r.schemeStatus,
      solutionStatus: r.solutionStatus,
      paperId: r.paperId,
      subjectName: r.subjectName,
      courseCode: r.courseCode,
      examYear: r.examYear != null ? Number(r.examYear) : null,
      examType: r.examType,
      examMonth: r.examMonth,
      academicYear: r.academicYear,
      appearanceCount: freq?.count || 1,
      yearsAppeared: years,
      lastAskedYear: years.length ? years[years.length - 1] : null,
      subquestions: subs.map((s) => ({
        letter: s.sub_letter,
        questionText: s.question_text,
        maxMarks: s.max_marks != null ? Number(s.max_marks) : null,
      })),
    };
  });

  const subjectName = questions[0]?.subjectName || filters.subject || null;
  const courseCode = questions[0]?.courseCode || filters.courseCode || null;
  const byModule = new Map<number, typeof questions>();
  for (const q of questions) {
    const n = Number(String(q.moduleOrUnit || '').match(/(\d+)/)?.[1] || 0) || 0;
    const list = byModule.get(n) || [];
    list.push(q);
    byModule.set(n, list);
  }
  const modules = [1, 2, 3, 4, 5].map((n) => ({
    module: n,
    name: `Module ${n}`,
    questions: (byModule.get(n) || []).sort((a, b) => Number(b.examYear || 0) - Number(a.examYear || 0) || a.questionNumber - b.questionNumber),
  }));
  const unmapped = byModule.get(0) || [];
  if (unmapped.length) {
    modules.push({ module: 0, name: 'Unmapped', questions: unmapped });
  }
  return { subjectName, courseCode, modules, total: questions.length };
}

export async function frequencyAnalysis(collegeId: number, courseId?: number) {
  let query = db('previous_year_questions as q')
    .join('previous_year_papers as p', 'p.id', 'q.paper_id')
    .where({ 'q.college_id': collegeId, 'q.is_active': true })
    .whereNull('q.parent_id');
  if (courseId) query = query.andWhere('p.course_id', courseId);

  const rows = await query.select(
    'q.question_text',
    'q.fingerprint',
    'q.module_or_unit',
    'q.primary_co_code',
    'q.max_marks',
      'p.exam_year',
      'p.exam_type',
      'p.subject_name',
      'p.course_code',
    );

  const byFp = new Map<string, { text: string; count: number; years: Set<number>; exams: Set<string>; module: string | null; co: string | null; marks: number | null; lastYear: number | null }>();
  const byModule = new Map<string, number>();
  const byCo = new Map<string, number>();
  const byMarks = new Map<string, number>();
  for (const r of rows) {
    const fp = String(r.fingerprint || fingerprintQuestion(String(r.question_text)));
    const cur = byFp.get(fp) || {
      text: String(r.question_text).slice(0, 240),
      count: 0,
      years: new Set<number>(),
      exams: new Set<string>(),
      module: r.module_or_unit,
      co: r.primary_co_code ? String(r.primary_co_code) : null,
      marks: r.max_marks != null ? Number(r.max_marks) : null,
      lastYear: null,
    };
    cur.count += 1;
    if (r.exam_year) {
      const y = Number(r.exam_year);
      cur.years.add(y);
      if (!cur.lastYear || y > cur.lastYear) cur.lastYear = y;
    }
    if (r.exam_type) cur.exams.add(String(r.exam_type));
    byFp.set(fp, cur);
    const mod = String(r.module_or_unit || 'UNMAPPED');
    byModule.set(mod, (byModule.get(mod) || 0) + 1);
    const co = String(r.primary_co_code || 'UNMAPPED');
    byCo.set(co, (byCo.get(co) || 0) + 1);
    const marks = r.max_marks == null ? 'MISSING' : String(Number(r.max_marks));
    byMarks.set(marks, (byMarks.get(marks) || 0) + 1);
  }

  const repeated = [...byFp.values()]
    .filter((x) => x.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 40)
    .map((x) => ({
      text: x.text,
      count: x.count,
      years: [...x.years].sort(),
      exams: [...x.exams],
      module: x.module,
      co: x.co,
      marks: x.marks,
      mostRecentYear: x.lastYear,
      summary: `Asked ${x.count} times in the last ${x.years.size || 1} papers.`,
    }));

  return {
    mostRepeatedQuestions: repeated,
    moduleFrequency: [...byModule.entries()].map(([module, count]) => ({ module, count })).sort((a, b) => b.count - a.count),
    coFrequency: [...byCo.entries()].map(([co, count]) => ({ co, count })).sort((a, b) => b.count - a.count),
    marksFrequency: [...byMarks.entries()].map(([marks, count]) => ({ marks, count })),
  };
}

export async function adminMaster(collegeId: number) {
  const papers = await db('previous_year_papers').where({ college_id: collegeId }).select('extraction_status', 'course_id', 'course_code', 'subject_name', 'verification_status');
  const reviews = await db('qp_review_queue').where({ college_id: collegeId }).orderBy('priority').select('review_id as reviewId', 'issue_type as issueType', 'reason', 'paper_id as paperId', 'source_file as sourceFile', 'priority', 'review_status as reviewStatus');
  const sources = await db('previous_year_source_files').where({ college_id: collegeId }).orderBy('folder');
  const questionCount = await db('previous_year_questions').where({ college_id: collegeId }).whereNull('parent_id').count({ c: '*' }).first();
  const subCount = await db('previous_year_questions').where({ college_id: collegeId }).whereNotNull('parent_id').count({ c: '*' }).first();
  const unmatched = papers.filter((p) => !p.course_id).map((p) => ({ courseCode: p.course_code, subjectName: p.subject_name }));
  return {
    summary: {
      papers: papers.length,
      questions: Number(questionCount?.c ?? 0),
      subquestions: Number(subCount?.c ?? 0),
      unmatchedSubjects: unmatched.length,
      needsReview: reviews.length,
      ocrRequired: sources.filter((s) => s.ocr_required).length,
    },
    sources: sources.map((s) => ({
      id: Number(s.id),
      relativePath: s.relative_path,
      fileName: s.file_name,
      folder: s.folder,
      sourceType: s.source_type,
      extractionStatus: s.extraction_status,
      paperCount: Number(s.paper_count || 0),
      ocrRequired: Boolean(s.ocr_required),
      pageCount: s.page_count,
    })),
    unmatched,
    reviews,
  };
}

export async function adminReimport(collegeId: number, importedBy: number, dryRun = false) {
  return applyPreviousYearImport({ collegeId, importedBy, dryRun, writeWorkbook: !dryRun });
}
