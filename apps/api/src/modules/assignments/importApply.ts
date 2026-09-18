import { createHash } from 'node:crypto';
import { db } from '../../db/index.js';
import { normalizeQuestionText, normalizeSubjectName } from '../../types/quiz.js';
import {
  defaultResponseFormatForType,
  type AssignmentDifficulty,
} from '../../types/assignment.js';
import { AppError } from '../../utils/errors.js';
import {
  inferPrimaryCoFromIntent,
  resolveDerivedOutcomes,
  snapshotDerivedOutcomes,
} from '../questions/coMapping.js';
import { scanAssignmentFiles, type AssignmentImportCandidate } from './importService.js';

export type AssignmentImportApplyOptions = {
  collegeId: number;
  createdBy: number;
  createMissingSubjects?: boolean;
  dryRun?: boolean;
  root?: string;
};

export type AssignmentSubjectImportSummary = {
  subject: string;
  courseId: number | null;
  mapping: 'matched' | 'created' | 'unmatched';
  modules: Array<{
    name: string;
    easy: number;
    intermediate: number;
    difficult: number;
    needsReview: number;
    imported: number;
    coMapped: number;
    coBlocked: number;
  }>;
};

export type AssignmentImportApplyReport = {
  batchId: string;
  dryRun: boolean;
  filesDiscovered: number;
  subjectsFound: number;
  questionsDiscovered: number;
  validated: number;
  imported: number;
  needsReview: number;
  duplicates: number;
  coMapped: number;
  coNeedsReview: number;
  coBlocked: number;
  unmatchedSubjects: string[];
  createdSubjects: string[];
  subjects: AssignmentSubjectImportSummary[];
};

function courseCodeFromSubject(name: string, existing: Set<string>) {
  const words = name.replace(/[^A-Za-z0-9 ]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  let code = words
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 8);
  if (code.length < 2) code = name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8) || 'SUBJ';
  let candidate = code;
  let n = 2;
  while (existing.has(candidate)) {
    candidate = `${code.slice(0, 6)}${n}`;
    n += 1;
  }
  existing.add(candidate);
  return candidate;
}

function moduleNumberKey(name: string) {
  const match = name.match(/\b(module|unit)\s*0*(\d+)/i);
  if (!match) return null;
  return `${match[1].toLowerCase()}:${Number(match[2])}`;
}

function difficultyBucket(d: AssignmentDifficulty | null, reviewStatus: string) {
  if (reviewStatus === 'NEEDS_REVIEW') return 'needsReview' as const;
  if (d === 'EASY') return 'easy' as const;
  if (d === 'INTERMEDIATE') return 'intermediate' as const;
  if (d === 'DIFFICULT') return 'difficult' as const;
  return 'needsReview' as const;
}

export async function applyAssignmentBankImport(
  opts: AssignmentImportApplyOptions,
): Promise<AssignmentImportApplyReport> {
  const scan = await scanAssignmentFiles(opts.root);
  const batchId = `asgn-import-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
  const createMissing = opts.createMissingSubjects !== false;

  const courses = await db('courses').where({ college_id: opts.collegeId }).select('id', 'name', 'code');
  const byName = new Map(courses.map((c) => [normalizeSubjectName(c.name), c]));
  const usedCodes = new Set(courses.map((c) => String(c.code).toUpperCase()));

  const unmatchedSubjects: string[] = [];
  const createdSubjects: string[] = [];
  const courseBySubject = new Map<
    string,
    { id: number; name: string; mapping: 'matched' | 'created' | 'unmatched' }
  >();

  const uniqueSubjects = [
    ...new Set(scan.candidates.map((c) => c.subjectHint).filter(Boolean) as string[]),
  ];
  for (const subject of uniqueSubjects) {
    const existing = byName.get(normalizeSubjectName(subject));
    if (existing) {
      courseBySubject.set(subject, { id: existing.id, name: existing.name, mapping: 'matched' });
      continue;
    }
    if (!createMissing || opts.dryRun) {
      unmatchedSubjects.push(subject);
      courseBySubject.set(subject, { id: 0, name: subject, mapping: 'unmatched' });
      continue;
    }
    const code = courseCodeFromSubject(subject, usedCodes);
    const [id] = await db('courses').insert({
      college_id: opts.collegeId,
      name: subject,
      code,
    });
    createdSubjects.push(subject);
    courseBySubject.set(subject, { id, name: subject, mapping: 'created' });
    byName.set(normalizeSubjectName(subject), { id, name: subject, code });
  }

  const modulesByCourse = new Map<number, Array<{ id: number; name: string }>>();
  async function resolveModule(courseId: number, moduleHint: string) {
    let list = modulesByCourse.get(courseId);
    if (!list) {
      const rows = await db('subject_modules')
        .where({ college_id: opts.collegeId, course_id: courseId })
        .select('id', 'name');
      list = rows.map((r) => ({ id: Number(r.id), name: String(r.name) }));
      modulesByCourse.set(courseId, list);
    }
    const exact = list.find((m) => m.name.toLowerCase() === moduleHint.toLowerCase());
    if (exact) return exact.id;
    const key = moduleNumberKey(moduleHint);
    if (key) {
      const byNumber = list.find((m) => moduleNumberKey(m.name) === key);
      if (byNumber) {
        if (byNumber.name !== moduleHint && !opts.dryRun) {
          await db('subject_modules').where({ id: byNumber.id }).update({ name: moduleHint });
          byNumber.name = moduleHint;
        }
        return byNumber.id;
      }
    }
    if (opts.dryRun) return -1;
    const sort = Number(key?.split(':')[1] ?? list.length + 1);
    try {
      const [id] = await db('subject_modules').insert({
        college_id: opts.collegeId,
        course_id: courseId,
        name: moduleHint,
        code: key ? key.replace(':', '').toUpperCase().slice(0, 8) : null,
        sort_order: sort,
        created_by: opts.createdBy,
      });
      list.push({ id, name: moduleHint });
      return id;
    } catch {
      const again = await db('subject_modules')
        .where({ college_id: opts.collegeId, course_id: courseId, name: moduleHint })
        .first();
      if (!again) throw new AppError(409, `Could not create module ${moduleHint}`);
      list.push({ id: again.id, name: again.name });
      return again.id;
    }
  }

  const cosByCourse = new Map<
    number,
    Array<{ id: number; coCode: string; statement: string }>
  >();
  async function loadCos(courseId: number) {
    let list = cosByCourse.get(courseId);
    if (!list) {
      const rows = await db('course_outcomes')
        .where({ college_id: opts.collegeId, course_id: courseId, is_current: true })
        .select('id', 'co_code', 'statement');
      list = rows.map((r) => ({
        id: Number(r.id),
        coCode: String(r.co_code).toUpperCase(),
        statement: String(r.statement || ''),
      }));
      cosByCourse.set(courseId, list);
    }
    return list;
  }

  const summaries = new Map<string, AssignmentSubjectImportSummary>();
  let imported = 0;
  let skippedDup = 0;
  let coMapped = 0;
  let coNeedsReview = 0;
  let coBlocked = 0;

  const grouped = new Map<string, AssignmentImportCandidate[]>();
  for (const candidate of scan.candidates) {
    const subject = candidate.subjectHint || 'Unknown subject';
    const list = grouped.get(subject) ?? [];
    list.push(candidate);
    grouped.set(subject, list);
  }

  for (const [subject, items] of grouped) {
    const mapping = courseBySubject.get(subject) ?? {
      id: 0,
      name: subject,
      mapping: 'unmatched' as const,
    };
    const moduleNames = [...new Set(items.map((i) => i.moduleHint || 'Unassigned'))];
    const moduleRows = moduleNames.map((name) => ({
      name,
      easy: 0,
      intermediate: 0,
      difficult: 0,
      needsReview: 0,
      imported: 0,
      coMapped: 0,
      coBlocked: 0,
    }));
    const moduleIndex = new Map(moduleRows.map((m) => [m.name, m]));

    const existing =
      mapping.mapping === 'unmatched' || opts.dryRun
        ? []
        : await db('assignment_bank_questions')
            .where({ college_id: opts.collegeId, course_id: mapping.id, is_active: true })
            .select('module_id', 'normalized_text');
    const existingSet = new Set(existing.map((e) => `${e.module_id}|${e.normalized_text}`));

    const outcomes = mapping.mapping === 'unmatched' ? [] : await loadCos(mapping.id);

    await db.transaction(async (trx) => {
      for (const candidate of items) {
        const moduleName = candidate.moduleHint || 'Unassigned';
        const row = moduleIndex.get(moduleName)!;
        const bucket = difficultyBucket(candidate.difficulty, candidate.reviewStatus);
        row[bucket] += 1;

        if (opts.dryRun || mapping.mapping === 'unmatched' || !candidate.moduleHint) continue;
        const moduleId = await resolveModule(mapping.id, candidate.moduleHint);
        const normalized = normalizeQuestionText(candidate.questionText).slice(0, 512);
        const dupKey = `${moduleId}|${normalized}`;
        if (existingSet.has(dupKey)) {
          skippedDup += 1;
          continue;
        }
        existingSet.add(dupKey);

        const inference = inferPrimaryCoFromIntent({
          questionText: candidate.questionText,
          modelAnswer: candidate.expectedAnswerGuidance,
          moduleHint: candidate.moduleHint,
          outcomes,
        });
        // Ignore CO codes embedded in markdown headings — those often mirrored Module N→CO N.
        // Primary CO is always inferred from question intent vs current CO master statements.

        let derivedSnapshot: ReturnType<typeof snapshotDerivedOutcomes> | null = null;
        if (inference.primaryCoCode && !inference.coMappingBlocked) {
          const derived = await resolveDerivedOutcomes({
            collegeId: opts.collegeId,
            courseId: mapping.id,
            primaryCoCode: inference.primaryCoCode,
            primaryCoId: inference.primaryCoId,
          });
          derivedSnapshot = snapshotDerivedOutcomes(derived);
        }

        if (inference.coMappingBlocked) {
          coBlocked += 1;
          row.coBlocked += 1;
        } else if (inference.needsReview || !inference.primaryCoCode) {
          coNeedsReview += 1;
        } else {
          coMapped += 1;
          row.coMapped += 1;
        }

        const reviewNotes = [...candidate.reviewNotes];
        if (inference.needsReview) reviewNotes.push(inference.mappingBasis || 'CO needs review');
        if (inference.coMappingBlocked) reviewNotes.push(inference.coMappingBlockReason || 'CO blocked');

        const reviewStatus =
          candidate.reviewStatus === 'NEEDS_REVIEW' || inference.needsReview
            ? 'NEEDS_REVIEW'
            : 'APPROVED';

        const [id] = await trx('assignment_bank_questions').insert({
          college_id: opts.collegeId,
          course_id: mapping.id,
          module_id: moduleId,
          created_by: opts.createdBy,
          question_text: candidate.questionText,
          question_type: candidate.questionType,
          response_format:
            candidate.responseFormat || defaultResponseFormatForType(candidate.questionType),
          marks: candidate.marks,
          difficulty: candidate.difficulty,
          expected_answer_guidance: candidate.expectedAnswerGuidance,
          evaluation_rubric: candidate.evaluationRubric
            ? JSON.stringify(candidate.evaluationRubric)
            : null,
          source: candidate.relativePath,
          source_file: candidate.relativePath,
          source_reference: candidate.sourceReference,
          original_difficulty: candidate.originalDifficulty,
          import_batch: batchId,
          review_status: reviewStatus,
          review_notes: reviewNotes.length ? reviewNotes.join('; ') : null,
          normalized_text: normalized,
          primary_co_code: inference.primaryCoCode,
          primary_co_id: inference.primaryCoId,
          mapping_basis: inference.mappingBasis,
          mapping_source: 'Current CO Master + Question Intent',
          verification_status: inference.verificationStatus,
          co_mapping_blocked: inference.coMappingBlocked,
          co_mapping_block_reason: inference.coMappingBlockReason,
          derived_outcomes_snapshot: derivedSnapshot ? JSON.stringify(derivedSnapshot) : null,
          is_active: true,
        });

        if (inference.primaryCoId && inference.primaryCoCode) {
          await trx('assignment_question_co_links').insert({
            bank_question_id: id,
            course_outcome_id: inference.primaryCoId,
            co_code: inference.primaryCoCode,
            is_primary: true,
          });
        }

        void createHash;
        imported += 1;
        row.imported += 1;
      }
    });

    summaries.set(subject, {
      subject,
      courseId: mapping.id || null,
      mapping: mapping.mapping,
      modules: moduleRows,
    });
  }

  return {
    batchId,
    dryRun: Boolean(opts.dryRun),
    filesDiscovered: scan.filesDiscovered.length,
    subjectsFound: uniqueSubjects.length,
    questionsDiscovered: scan.questionsFound,
    validated: scan.validQuestions,
    imported: opts.dryRun ? 0 : imported,
    needsReview: scan.needsReview,
    duplicates: scan.duplicates + skippedDup,
    coMapped: opts.dryRun ? 0 : coMapped,
    coNeedsReview: opts.dryRun ? 0 : coNeedsReview,
    coBlocked: opts.dryRun ? 0 : coBlocked,
    unmatchedSubjects,
    createdSubjects,
    subjects: [...summaries.values()],
  };
}
