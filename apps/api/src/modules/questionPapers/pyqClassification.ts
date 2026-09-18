/**
 * Paper-level QA classification for the Previous-Year Question Paper rebuild.
 *
 * Categories (§6 / §20):
 *   VERIFIED                 standard SEE, Q1–Q10 complete
 *   VERIFIED_SPECIAL_FORMAT  legitimate non-standard structure (MBA, MCQ, 50-mark design, …)
 *   PARSER_DEFECT            source complete but parser missed content — must be fixed
 *   SOURCE_TRUNCATION        fewer pages than printed N-of-K
 *   MANUAL_REVIEW_REQUIRED   ambiguous / cannot decide automatically
 */
import type { ExtractedPaper } from './types.js';
import { looksLikeStandardFiveModulePaper, moduleNumberFromLabel } from './vtuStructure.js';
import type { readPaperPageSpan } from './parser.js';

export type PaperClassification =
  | 'VERIFIED'
  | 'VERIFIED_SPECIAL_FORMAT'
  | 'PARSER_DEFECT'
  | 'SOURCE_TRUNCATION'
  | 'MANUAL_REVIEW_REQUIRED';

export type PaperQaResult = {
  classification: PaperClassification;
  expectedQuestions: number | null;
  isStandardSee: boolean;
  warnings: string[];
  reviewNote: string;
  missingQ: number[];
  duplicateQ: number[];
  missingOrPairs: string[];
};

type PageSpan = ReturnType<typeof readPaperPageSpan>;

function isMcqPaper(p: ExtractedPaper): boolean {
  return p.questions.some((q) => q.section === 'MCQ' || q.questionType === 'MCQ');
}

/** Printed instruction that signals the classic five-module SEE pattern. */
export function hasStandardFiveModuleNote(text: string): boolean {
  return /Answer any FIVE full questions,\s*choosing ONE full question from each module/i.test(text);
}

/** Design / elective papers that ask for TWO 50-mark questions, etc. */
export function hasReducedModuleNote(text: string): boolean {
  return /Answer any TWO full questions/i.test(text) || /Answer any THREE full questions/i.test(text);
}

function moduleNumbersPresent(p: ExtractedPaper): number[] {
  return [
    ...new Set(
      p.questions
        .map((q) => moduleNumberFromLabel(q.moduleOrUnit))
        .filter((n): n is number => n != null && n >= 1 && n <= 5),
    ),
  ].sort((a, b) => a - b);
}

/**
 * Decide whether this paper is intended to be a standard five-module SEE
 * (Q1 OR Q2 … Q9 OR Q10), vs a legitimate special format.
 */
export function isIntendedStandardSee(p: ExtractedPaper): boolean {
  if (isMcqPaper(p)) return false;
  if (p.metadata.examType === 'MAKEUP') return false;
  if (p.metadata.maxMarks != null && p.metadata.maxMarks < 100) return false;
  if (p.metadata.examType !== 'SEE' && p.metadata.examType !== 'SUPPLEMENTARY') return false;

  const text = p.fullText || '';
  if (hasReducedModuleNote(text)) return false;
  if (hasStandardFiveModuleNote(text)) return true;

  // Fallback: structural signals from the extraction itself.
  const mods = moduleNumbersPresent(p);
  if (mods.length >= 5) return true;
  if (looksLikeStandardFiveModulePaper(p.questions)) return true;

  // MBA / case-study style: Q1–Q8, no five-module note → not standard.
  const nums = p.questions.map((q) => q.questionNumber);
  const maxQ = nums.length ? Math.max(...nums) : 0;
  if (maxQ <= 8 && mods.length < 4) return false;

  return false;
}

function missingOrPairIds(p: ExtractedPaper): string[] {
  const byPair = new Map<string, Set<string>>();
  for (const q of p.questions) {
    if (!q.orPairId) continue;
    if (!byPair.has(q.orPairId)) byPair.set(q.orPairId, new Set());
    if (q.orAlternative) byPair.get(q.orPairId)!.add(q.orAlternative);
  }
  const incomplete: string[] = [];
  for (const [pair, alts] of byPair) if (alts.size < 2) incomplete.push(pair);
  return incomplete;
}

export function classifyExtractedPaper(p: ExtractedPaper, span: PageSpan): PaperQaResult {
  const warnings: string[] = [];
  const q = p.questions;
  const nums = q.map((x) => x.questionNumber);
  const dupSet = [...new Set(nums.filter((n, i) => nums.indexOf(n) !== i))];
  if (dupSet.length) warnings.push(`DUPLICATE_Q:${dupSet.join('/')}`);

  const mcq = isMcqPaper(p);
  const reduced = hasReducedModuleNote(p.fullText || '');
  const specialHint =
    mcq ||
    (p.metadata.maxMarks != null && p.metadata.maxMarks < 100) ||
    p.metadata.examType === 'MAKEUP' ||
    reduced;

  if (specialHint || !isIntendedStandardSee(p)) {
    const note = mcq
      ? 'MCQ / 50-mark format'
      : reduced
        ? 'Reduced-module / high-mark design paper (not Q1–Q10)'
        : p.metadata.examType === 'MAKEUP'
          ? 'Makeup exam format'
          : 'Non-standard VTU format (not five-module SEE)';
    return {
      classification: 'VERIFIED_SPECIAL_FORMAT',
      expectedQuestions: null,
      isStandardSee: false,
      warnings,
      reviewNote: note,
      missingQ: [],
      duplicateQ: dupSet,
      missingOrPairs: missingOrPairIds(p),
    };
  }

  const expected = 10;
  const present = new Set(nums);
  const missingQ = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((n) => !present.has(n));
  const complete = q.length === expected && present.size === expected && !dupSet.length && missingQ.length === 0;

  if (complete) {
    return {
      classification: 'VERIFIED',
      expectedQuestions: expected,
      isStandardSee: true,
      warnings,
      reviewNote: '',
      missingQ: [],
      duplicateQ: [],
      missingOrPairs: missingOrPairIds(p),
    };
  }

  if (q.length > expected || dupSet.length) {
    warnings.push('OVER_EXTRACTION');
    return {
      classification: 'PARSER_DEFECT',
      expectedQuestions: expected,
      isStandardSee: true,
      warnings,
      reviewNote: 'More questions than expected / duplicates — parser over-extracted.',
      missingQ,
      duplicateQ: dupSet,
      missingOrPairs: missingOrPairIds(p),
    };
  }

  if (span.totalK != null && span.pagesSeen >= span.totalK) {
    return {
      classification: 'PARSER_DEFECT',
      expectedQuestions: expected,
      isStandardSee: true,
      warnings,
      reviewNote: `All ${span.totalK} printed pages present but only ${q.length} questions parsed.`,
      missingQ,
      duplicateQ: dupSet,
      missingOrPairs: missingOrPairIds(p),
    };
  }

  if (span.totalK != null && span.pagesSeen < span.totalK) {
    return {
      classification: 'SOURCE_TRUNCATION',
      expectedQuestions: expected,
      isStandardSee: true,
      warnings,
      reviewNote: `Only ${span.pagesSeen} of ${span.totalK} printed pages present in source — extraction correct for available content.`,
      missingQ,
      duplicateQ: dupSet,
      missingOrPairs: missingOrPairIds(p),
    };
  }

  // No page counter: if the standard five-module note is present, treat shortfalls
  // as parser defects (source is usually complete; counter just missing from OCR/text).
  if (hasStandardFiveModuleNote(p.fullText || '') && missingQ.length) {
    return {
      classification: 'PARSER_DEFECT',
      expectedQuestions: expected,
      isStandardSee: true,
      warnings,
      reviewNote: `Standard five-module note present but Q${missingQ.join('/')} missing — verify against source.`,
      missingQ,
      duplicateQ: dupSet,
      missingOrPairs: missingOrPairIds(p),
    };
  }

  return {
    classification: 'MANUAL_REVIEW_REQUIRED',
    expectedQuestions: expected,
    isStandardSee: true,
    warnings,
    reviewNote: `Could not read page counter; ${q.length} questions parsed — verify against source.`,
    missingQ,
    duplicateQ: dupSet,
    missingOrPairs: missingOrPairIds(p),
  };
}
