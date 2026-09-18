import { db } from '../../db/index.js';
import { tokenizeAcademicText } from '../questions/coMapping.js';
import { computeReadiness, isReadyForInternalPaper, textbookCitation, textbookRequiredError } from './sourcePolicy.js';
import { rbtFromBloom } from './rbt.js';
import { getPrimaryTextbook } from './textbookService.js';
import { schemeComponentsValid } from '../attainment/marksValidation.js';

const STOP = new Set(['the', 'and', 'with', 'from', 'that', 'this', 'into', 'for', 'are', 'was']);

function sentences(text: string) {
  return String(text || '')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length >= 24);
}

function overlapScore(question: string, excerpt: string) {
  const qTokens = tokenizeAcademicText(question).filter((t) => !STOP.has(t) && t.length >= 4);
  const eTokens = new Set(tokenizeAcademicText(excerpt));
  let score = 0;
  for (const t of qTokens) if (eTokens.has(t)) score += t.length >= 6 ? 1.4 : 1;
  return score;
}

function examAppropriateSolution(opts: {
  questionText: string;
  marks: number;
  rbt?: string | null;
  excerpt: string;
}) {
  const scored = sentences(opts.excerpt)
    .map((s) => ({ s, score: overlapScore(opts.questionText, s) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  const budget = opts.marks <= 4 ? 3 : opts.marks <= 8 ? 5 : 8;
  const picked = scored.slice(0, budget).map((x) => x.s);
  if (!picked.length) return null;
  const rbt = opts.rbt ? `RBT ${opts.rbt}. ` : '';
  return `${rbt}${picked.join(' ')}`.slice(0, 4000);
}

function keyPointsFromSolution(solution: string, marks: number) {
  const parts = sentences(solution).slice(0, Math.max(2, Math.min(6, Math.round(marks / 2) || 2)));
  if (!parts.length) {
    const labels = ['Definition', 'Principle', 'Steps', 'Example'].slice(0, Math.min(4, Math.max(2, Math.round(marks / 2))));
    return labels;
  }
  const labels = ['Definition', 'Principle', 'Steps', 'Explanation', 'Example', 'Conclusion'];
  return parts.map((p, i) => ({ label: labels[i] || `Point ${i + 1}`, text: p }));
}

function allocateScheme(marks: number, points: Array<{ label: string; text?: string } | string>) {
  const items = points.map((p) => (typeof p === 'string' ? { label: p } : p));
  if (!items.length) return [];
  const base = Math.floor((marks * 100) / items.length) / 100;
  let remaining = marks;
  return items.map((p, i) => {
    const last = i === items.length - 1;
    const maxMarks = last ? remaining : Math.max(0.5, Math.round(base * 2) / 2);
    remaining = Math.round((remaining - maxMarks) * 100) / 100;
    return {
      code: `k${i + 1}`,
      label: p.label,
      maxMarks,
    };
  });
}

export type GroundedSolution = {
  textbookId: number;
  textbookTitle: string;
  authors: string | null;
  edition: string | null;
  chapter: string | null;
  section: string | null;
  pageRange: string | null;
  extractedSourceReference: string | null;
  modelSolution: string;
  expectedKeyPoints: string;
  scheme: Array<{ code: string; label: string; maxMarks: number }>;
  schemeStatus: 'READY' | 'SCHEME_NEEDS_REVIEW' | 'SCHEME_PENDING';
  verificationStatus: 'TEXTBOOK_GROUNDED' | 'TEXTBOOK_SOURCE_REQUIRED' | 'SOLUTION_PENDING';
  textbookGrounded: boolean;
  citation: string | null;
};

export async function locateTextbookExcerpt(collegeId: number, courseId: number, questionText: string) {
  const book = await getPrimaryTextbook(collegeId, courseId);
  if (!book) return { book: null, excerpt: null, reason: 'TEXTBOOK_SOURCE_REQUIRED' as const };
  const excerpts = await db.schema.hasTable('course_textbook_excerpts')
    ? await db('course_textbook_excerpts').where({ textbook_id: book.id })
    : [];
  if (!excerpts.length) return { book, excerpt: null, reason: 'TEXTBOOK_SOURCE_REQUIRED' as const };
  const ranked = excerpts
    .map((e) => ({
      e,
      score: overlapScore(questionText, `${e.topic || ''} ${e.chapter || ''} ${e.section || ''} ${e.excerpt_text}`),
    }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.score < 1.2) return { book, excerpt: null, reason: 'SOLUTION_PENDING' as const };
  return { book, excerpt: best.e, reason: null };
}

export async function generateTextbookGroundedSolution(opts: {
  collegeId: number;
  courseId: number;
  questionText: string;
  marks: number;
  rbt?: string | null;
  bloomLevel?: string | null;
}): Promise<GroundedSolution> {
  const located = await locateTextbookExcerpt(opts.collegeId, opts.courseId, opts.questionText);
  if (!located.book || located.reason === 'TEXTBOOK_SOURCE_REQUIRED') {
    throw textbookRequiredError();
  }
  if (!located.excerpt) {
    return {
      textbookId: located.book.id,
      textbookTitle: located.book.title,
      authors: located.book.authors,
      edition: located.book.edition,
      chapter: null,
      section: null,
      pageRange: null,
      extractedSourceReference: null,
      modelSolution: '',
      expectedKeyPoints: '',
      scheme: [],
      schemeStatus: 'SCHEME_PENDING',
      verificationStatus: 'SOLUTION_PENDING',
      textbookGrounded: false,
      citation: textbookCitation({ title: located.book.title }),
    };
  }
  const rbt = rbtFromBloom(opts.rbt || opts.bloomLevel);
  const solution = examAppropriateSolution({
    questionText: opts.questionText,
    marks: opts.marks,
    rbt,
    excerpt: String(located.excerpt.excerpt_text),
  });
  if (!solution) {
    return {
      textbookId: located.book.id,
      textbookTitle: located.book.title,
      authors: located.book.authors,
      edition: located.book.edition,
      chapter: located.excerpt.chapter,
      section: located.excerpt.section,
      pageRange: located.excerpt.page_range,
      extractedSourceReference: String(located.excerpt.excerpt_text).slice(0, 400),
      modelSolution: '',
      expectedKeyPoints: '',
      scheme: [],
      schemeStatus: 'SCHEME_PENDING',
      verificationStatus: 'SOLUTION_PENDING',
      textbookGrounded: false,
      citation: textbookCitation({
        title: located.book.title,
        chapter: located.excerpt.chapter,
        section: located.excerpt.section,
      }),
    };
  }
  const points = keyPointsFromSolution(solution, opts.marks);
  const scheme = allocateScheme(opts.marks, points);
  const check = schemeComponentsValid(opts.marks, scheme);
  return {
    textbookId: located.book.id,
    textbookTitle: located.book.title,
    authors: located.book.authors,
    edition: located.book.edition,
    chapter: located.excerpt.chapter,
    section: located.excerpt.section,
    pageRange: located.excerpt.page_range,
    extractedSourceReference: String(located.excerpt.excerpt_text).slice(0, 800),
    modelSolution: solution,
    expectedKeyPoints: points.map((p) => (typeof p === 'string' ? p : `${p.label}: ${p.text || ''}`)).join('\n'),
    scheme,
    schemeStatus: check.ok ? 'READY' : 'SCHEME_NEEDS_REVIEW',
    verificationStatus: 'TEXTBOOK_GROUNDED',
    textbookGrounded: true,
    citation: textbookCitation({
      title: located.book.title,
      chapter: located.excerpt.chapter,
      section: located.excerpt.section,
    }),
  };
}

export async function persistQuestionSolution(opts: {
  collegeId: number;
  questionRowId: number;
  courseId: number | null;
  questionText: string;
  marks: number | null;
  rbt?: string | null;
  bloomLevel?: string | null;
}) {
  if (!(await db.schema.hasTable('qp_master_solutions'))) return null;
  if (!opts.courseId || opts.marks == null) {
    await db('previous_year_questions').where({ id: opts.questionRowId }).update({
      solution_status: opts.courseId ? 'SOLUTION_PENDING' : 'TEXTBOOK_SOURCE_REQUIRED',
      scheme_status: 'SCHEME_PENDING',
    });
    return null;
  }
  const located = await locateTextbookExcerpt(opts.collegeId, opts.courseId, opts.questionText);
  if (!located.book) {
    await upsertSolutionRow(opts.collegeId, opts.questionRowId, {
      textbookId: null,
      textbookTitle: null,
      authors: null,
      edition: null,
      chapter: null,
      section: null,
      pageRange: null,
      extractedSourceReference: null,
      modelSolution: null,
      expectedKeyPoints: null,
      verificationStatus: 'TEXTBOOK_SOURCE_REQUIRED',
      textbookGrounded: false,
    });
    await db('previous_year_questions').where({ id: opts.questionRowId }).update({
      textbook_id: null,
      solution_status: 'TEXTBOOK_SOURCE_REQUIRED',
      scheme_status: 'SCHEME_PENDING',
    });
    return { status: 'TEXTBOOK_SOURCE_REQUIRED' };
  }
  try {
    const grounded = await generateTextbookGroundedSolution({
      collegeId: opts.collegeId,
      courseId: opts.courseId,
      questionText: opts.questionText,
      marks: opts.marks,
      rbt: opts.rbt,
      bloomLevel: opts.bloomLevel,
    });
    const solutionId = await upsertSolutionRow(opts.collegeId, opts.questionRowId, {
      textbookId: grounded.textbookId,
      textbookTitle: grounded.textbookTitle,
      authors: grounded.authors,
      edition: grounded.edition,
      chapter: grounded.chapter,
      section: grounded.section,
      pageRange: grounded.pageRange,
      extractedSourceReference: grounded.extractedSourceReference,
      modelSolution: grounded.modelSolution || null,
      expectedKeyPoints: grounded.expectedKeyPoints || null,
      verificationStatus: grounded.verificationStatus,
      textbookGrounded: grounded.textbookGrounded,
    });
    if (grounded.scheme.length && (await db.schema.hasTable('qp_master_scheme_components'))) {
      await db('qp_master_scheme_components').where({ question_row_id: opts.questionRowId }).del();
      if (grounded.schemeStatus === 'READY') {
        await db('qp_master_scheme_components').insert(
          grounded.scheme.map((c, i) => ({
            question_row_id: opts.questionRowId,
            solution_id: solutionId,
            code: c.code,
            label: c.label,
            max_marks: c.maxMarks,
            sort_order: i,
          })),
        );
      }
    }
    await db('previous_year_questions').where({ id: opts.questionRowId }).update({
      textbook_id: grounded.textbookId,
      solution_status: grounded.verificationStatus,
      scheme_status: grounded.schemeStatus,
    });
    return grounded;
  } catch {
    await db('previous_year_questions').where({ id: opts.questionRowId }).update({
      textbook_id: located.book.id,
      solution_status: 'TEXTBOOK_SOURCE_REQUIRED',
      scheme_status: 'SCHEME_PENDING',
    });
    return { status: 'TEXTBOOK_SOURCE_REQUIRED' };
  }
}

async function upsertSolutionRow(
  collegeId: number,
  questionRowId: number,
  row: {
    textbookId: number | null;
    textbookTitle: string | null;
    authors: string | null;
    edition: string | null;
    chapter: string | null;
    section: string | null;
    pageRange: string | null;
    extractedSourceReference: string | null;
    modelSolution: string | null;
    expectedKeyPoints: string | null;
    verificationStatus: string;
    textbookGrounded: boolean;
  },
) {
  const existing = await db('qp_master_solutions').where({ question_row_id: questionRowId }).first();
  const payload = {
    college_id: collegeId,
    textbook_id: row.textbookId,
    textbook_title: row.textbookTitle,
    textbook_authors: row.authors,
    textbook_edition: row.edition,
    chapter: row.chapter,
    section: row.section,
    page_range: row.pageRange,
    extracted_source_reference: row.extractedSourceReference,
    model_solution: row.modelSolution,
    expected_key_points: row.expectedKeyPoints,
    verification_status: row.verificationStatus,
    textbook_grounded: row.textbookGrounded,
    updated_at: db.fn.now(),
  };
  if (existing) {
    await db('qp_master_solutions').where({ id: existing.id }).update(payload);
    return Number(existing.id);
  }
  const [id] = await db('qp_master_solutions').insert({
    question_row_id: questionRowId,
    ...payload,
  });
  return Number(id);
}

export async function refreshQuestionReadiness(questionRowId: number) {
  const q = await db('previous_year_questions as q')
    .join('previous_year_papers as p', 'p.id', 'q.paper_id')
    .where('q.id', questionRowId)
    .select(
      'q.*',
      'p.paper_id as paper_key',
      'p.course_id',
    )
    .first();
  if (!q) return null;
  const schemeRows = (await db.schema.hasTable('qp_master_scheme_components'))
    ? await db('qp_master_scheme_components').where({ question_row_id: questionRowId })
    : [];
  const schemeTotal = schemeRows.reduce((n, r) => n + Number(r.max_marks || 0), 0);
  const schemeValid = q.max_marks != null && schemeRows.length > 0 && Math.abs(schemeTotal - Number(q.max_marks)) < 0.05;
  const derived = q.derived_outcomes_snapshot
    ? (typeof q.derived_outcomes_snapshot === 'string'
        ? JSON.parse(q.derived_outcomes_snapshot)
        : q.derived_outcomes_snapshot)
    : null;
  const readiness = computeReadiness({
    sourceType: q.source_type || 'PREVIOUS_YEAR_QUESTION_PAPER',
    sourcePaperId: q.paper_key || q.paper_id,
    originalQuestionText: q.original_question_text || q.question_text,
    questionText: q.display_question_text || q.question_text,
    marks: q.max_marks != null ? Number(q.max_marks) : null,
    marksStatus: q.marks_status,
    marksMissing: Boolean(q.marks_missing),
    moduleId: q.module_id,
    moduleName: q.module_or_unit,
    moduleMappingStatus: q.module_mapping_status,
    coCode: q.primary_co_code || q.derived_co || q.printed_co,
    coVerified: String(q.co_mapping_status || '') === 'VERIFIED',
    coMappingStatus: q.co_mapping_status,
    mappingDiscrepancy: String(q.co_mapping_status || '') === 'MAPPING_DISCREPANCY',
    poDerived: Array.isArray(derived?.pos) ? derived.pos.length > 0 : undefined,
    psoDerived: Array.isArray(derived?.psos) ? derived.psos.length > 0 : undefined,
    rbtLevel: q.rbt_level || q.printed_rbt,
    bloomLevel: q.bloom_level,
    textbookId: q.textbook_id,
    hasTextbookSource: Boolean(q.textbook_id),
    hasTextbookSolution: String(q.solution_status || '') === 'TEXTBOOK_GROUNDED',
    solutionStatus: q.solution_status,
    hasScheme: schemeRows.length > 0,
    schemeStatus: q.scheme_status,
    schemeValid,
    isOrChoice: Boolean(q.is_or_choice),
    orPairId: q.or_pair_id || q.or_group_id,
    requiresSubquestion: Boolean(q.sub_letter),
    subquestionLetter: q.sub_letter,
  });
  let status = readiness.status;
  if (!q.parent_id) {
    const children = await db('previous_year_questions').where({ parent_id: questionRowId, is_active: true });
    if (children.length) {
      const childReady = children.every((c) => isReadyForInternalPaper(c.readiness_status));
      const childSchemes = children.every((c) => String(c.scheme_status || '') === 'READY' || String(c.scheme_status || '') === 'TEXTBOOK_GROUNDED');
      const childSols = children.every((c) => String(c.solution_status || '') === 'TEXTBOOK_GROUNDED');
      if (childReady && childSchemes && childSols && readiness.checks.moduleMapped && readiness.checks.orPaired) {
        status = 'READY_FOR_INTERNAL_PAPER';
      }
    }
  }
  await db('previous_year_questions').where({ id: questionRowId }).update({
    readiness_status: status,
    verification_status: status,
  });
  return { ...readiness, status, ready: status === 'READY_FOR_INTERNAL_PAPER' };
}

export { computeReadiness };
