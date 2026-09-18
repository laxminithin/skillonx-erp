import {
  type BloomLevel,
  type Difficulty,
  type ExamType,
  type ExtractedPage,
  type ExtractedPaper,
  type IndexRow,
  type PageCell,
  type PageLine,
  type PaperMetadata,
  type ParsedQuestion,
  type ParsedSubquestion,
  type QpQuestionType,
  type ReviewItem,
  academicYearFromExam,
  durationMinutesFromText,
  flattenText,
  maxMarksFromText,
  monthKey,
  normalizeCourseCode,
  type PrintedAcademicTags,
} from './types.js';
import { bloomFromRbt } from './rbt.js';
import { cleanDisplayText } from './sourcePolicy.js';
import { assignVtuOrStructure, missingOrAlternatives, marksMismatchReviews } from './vtuStructure.js';

const COURSE_CODE_RE =
  /\b(\d{2}[A-Z]{2,6}\d{2,3}|[A-Z]{2,6}\s?\d{2,4}(?:\s?\/\s?[A-Z]{0,6}\s?\d{2,4})?|[A-Z]{3,6}[A-Z]\d{3}(?:\s?\/\s?\d{3})?)\b/g;

const PAPER_START_RE =
  /((?:USN\s+)?[A-Z0-9/]{5,14}\s+)?((?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|1st|2nd|3rd|[4-8]th|I{1,3}|IV|V{1,3}|VI{0,3}|VII|VIII)(?:\/(?:First|Second|I{1,2}))?\s+Semester[^.]{0,40}Degree(?:\s+Supplementary)?\s+Examination)/i;

const MODULE_RE = /\bModule[-–—\s]*(\d+)\b/gi;

const BLOOM_VERBS: Array<{ level: BloomLevel; verbs: string[] }> = [
  { level: 'CREATE', verbs: ['design', 'develop', 'construct', 'formulate', 'compose', 'create', 'devise'] },
  { level: 'EVALUATE', verbs: ['evaluate', 'justify', 'assess', 'critique', 'criticise', 'criticize', 'appraise'] },
  { level: 'ANALYZE', verbs: ['analyse', 'analyze', 'compare', 'distinguish', 'differentiate', 'examine', 'prove'] },
  { level: 'APPLY', verbs: ['apply', 'compute', 'calculate', 'convert', 'demonstrate', 'implement', 'solve', 'use'] },
  { level: 'UNDERSTAND', verbs: ['explain', 'describe', 'discuss', 'summarize', 'summarise', 'interpret', 'illustrate'] },
  { level: 'REMEMBER', verbs: ['define', 'list', 'name', 'state', 'recall', 'identify', 'mention'] },
];

const FOLDER_PROGRAM: Record<string, string> = {
  CS: 'CSE',
  IS: 'ISE',
  EC: 'ECE',
  ME: 'ME',
  CV: 'CV',
  MBA: 'MBA',
  MCA: 'MCA',
  'Basic Science (Physics, Chemistry and Mathematics )': 'Basic Science',
};

const ROMAN: Record<string, string> = {
  first: '1',
  second: '2',
  third: '3',
  fourth: '4',
  fifth: '5',
  sixth: '6',
  seventh: '7',
  eighth: '8',
  i: '1',
  ii: '2',
  iii: '3',
  iv: '4',
  v: '5',
  vi: '6',
  vii: '7',
  viii: '8',
};

export function parseIndex(pages: ExtractedPage[]): IndexRow[] {
  const joined = pages
    .slice(0, 6)
    .map((p) => p.text)
    .join('\n');
  if (!/\bINDEX\b/i.test(joined)) return [];
  const rows: IndexRow[] = [];
  const re =
    /(?:^|\s)(\d{1,2})\s+(\d{2}[A-Z]{2,6}\d{2,3}|[A-Z]{2,8}\s?\d{2,4}(?:\s?\/\s?[A-Z]{0,8}\s?\d{2,4})?)\s+([A-Za-z][^0-9]{6,90}?)\s+((?:June|July|Dec|Jan|Feb|Mar|Apr|May|Aug|Sep|Oct|Nov)[^0-9]{0,20}(?:20\d{2})(?:\s*\/\s*(?:Jan(?:uary)?\.?\s*20\d{2}))?)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(joined))) {
    rows.push({
      serial: Number(m[1]),
      courseCode: normalizeCourseCode(m[2]),
      subjectName: m[3].replace(/\s+/g, ' ').trim(),
      examDateLabel: m[4].replace(/\s+/g, ' ').trim(),
    });
  }
  return rows;
}

export function isCoverOrIndexPage(text: string) {
  const t = flattenText(text);
  if (t.length < 80) return true;
  if (/library and information centre/i.test(t) && t.length < 900) return true;
  if (/^\s*INDEX\b/i.test(t) || (/\bINDEX\b/i.test(t) && /subject\s+(code|title)/i.test(t))) return true;
  return false;
}

export function looksLikePaperStart(text: string) {
  const t = flattenText(text);
  if (isCoverOrIndexPage(t) && !/Degree(?:\s+Supplementary)?\s+Examination/i.test(t)) return false;
  if (/Degree(?:\s+Supplementary)?\s+Examination/i.test(t) && /Max\.?\s*Marks/i.test(t)) return true;
  if (PAPER_START_RE.test(t) && /Time\s*:/i.test(t)) return true;
  return false;
}

export function detectExamType(text: string, fileName: string): ExamType {
  const hay = `${text} ${fileName}`;
  if (/makeup/i.test(hay)) return 'MAKEUP';
  if (/supplementary/i.test(hay)) return 'SUPPLEMENTARY';
  if (/\bmodel\b/i.test(hay) && /question paper/i.test(hay)) return 'MODEL';
  if (/\bIA[- ]?1\b/i.test(hay) || /internal assessment/i.test(hay)) return 'INTERNAL';
  return 'SEE';
}

export function parseSemester(text: string): string | null {
  const m = text.match(
    /\b(First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|1st|2nd|3rd|[4-8]th|I{1,3}|IV|VI{0,3}|V|VII|VIII)(?:\/(?:First|Second|I{1,2}))?\s+Semester/i,
  );
  if (!m) return null;
  const token = m[1].toLowerCase();
  return ROMAN[token] || token.replace(/(st|nd|rd|th)$/i, '');
}

export function parseProgramFromHeader(text: string, folder: string): string | null {
  if (/\bMBA\b/.test(text)) return 'MBA';
  if (/\bMCA\b/.test(text)) return 'MCA';
  if (/\bB\.?E\.?\b|\bB\.?Tech\.?\b/i.test(text)) {
    return FOLDER_PROGRAM[folder] || folder;
  }
  return FOLDER_PROGRAM[folder] || folder || null;
}

export function parseScheme(text: string, fileName: string): string | null {
  const hay = `${text} ${fileName}`;
  const m = hay.match(/\b(20\d{2})\s*Scheme\b/i);
  if (m) return `${m[1]} Scheme`;
  if (/\bCBCS\b/i.test(hay)) return 'CBCS Scheme';
  const code = extractHeaderCourseCode(text);
  if (code?.startsWith('22') || code?.startsWith('B')) return '2022 Scheme';
  if (code?.startsWith('21')) return '2021 Scheme';
  if (code?.startsWith('20')) return '2020 Scheme';
  if (code?.startsWith('18')) return '2018 Scheme';
  return null;
}

const COURSE_CODE_TOKEN =
  '(\\d{2}[A-Z]{2,6}\\d{2,3}|[A-Z]{2,8}\\s?\\d{2,4}(?:\\s?\\/\\s?[A-Z]{0,8}\\s?\\d{2,4})?)';

export function extractHeaderCourseCode(text: string): string | null {
  const t = flattenText(text).slice(0, 500);
  const usn = t.match(new RegExp(`\\bUSN\\s+${COURSE_CODE_TOKEN}`, 'i'));
  if (usn) return normalizeCourseCode(usn[1]);
  const before = t.match(
    new RegExp(
      `\\b${COURSE_CODE_TOKEN}\\s+(?:USN|First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth)`,
      'i',
    ),
  );
  if (before) return normalizeCourseCode(before[1]);
  const codes = [...t.matchAll(COURSE_CODE_RE)].map((m) => normalizeCourseCode(m[1]));
  const plausible = codes.find((c) =>
    /^(B[A-Z]{2,5}\d{3}|\d{2}[A-Z]{2,6}\d{2,3}|[A-Z]{2,4}\d{2,4})$/.test(c),
  );
  return plausible ?? null;
}

/** A VTU subject code, possibly a dual/triple slash-joined scheme code (e.g. BCHEC102/202). */
const STRONG_CODE_RE = /^(?:\d{2}[A-Z]{1,6}\d{2,3}[A-Z]?|B[A-Z]{2,5}\d{3}[A-Z]?|[A-Z]{2,4}DIP\d{2,3})(?:\/[A-Z0-9]{2,10})*$/i;

/**
 * Read the subject code from the reconstructed header lines. The code is printed as the
 * top-right header cell (x on the right margin) or immediately after the "USN" cell — a
 * placement that flattening the text stream does not preserve reliably. Falls back to null.
 */
export function extractHeaderCourseCodeFromLines(lines: PageLine[] | undefined): string | null {
  if (!lines || !lines.length) return null;
  const head = lines.slice(0, 6);
  // 1. Cell directly after a "USN" cell on the same line.
  for (const line of head) {
    const usnIdx = line.cells.findIndex((c) => /^USN$/i.test(c.str.trim()));
    if (usnIdx >= 0) {
      const rightOfUsn = line.cells
        .slice(usnIdx + 1)
        .find((c) => STRONG_CODE_RE.test(c.str.trim().replace(/\s+/g, '')));
      if (rightOfUsn) return normalizeCourseCode(rightOfUsn.str);
    }
  }
  // 2. A strong code token sitting in the right header zone (x >= 350).
  for (const line of head) {
    const right = line.cells
      .filter((c) => c.x >= 350)
      .find((c) => STRONG_CODE_RE.test(c.str.trim().replace(/\s+/g, '')));
    if (right) return normalizeCourseCode(right.str);
  }
  return null;
}

/** Subject title is the centered line between the "Degree Examination" line and "Time:". */
export function extractSubjectNameFromLines(lines: PageLine[] | undefined): string | null {
  if (!lines || !lines.length) return null;
  const head = lines.slice(0, 10);
  const examIdx = head.findIndex((l) => /Degree(?:\s+Supplementary)?\s+Examination/i.test(l.text));
  const timeIdx = head.findIndex((l) => /Time\s*:/i.test(l.text));
  if (examIdx < 0) return null;
  const end = timeIdx > examIdx ? timeIdx : examIdx + 3;
  const parts: string[] = [];
  for (let i = examIdx + 1; i < end && i < head.length; i += 1) {
    const line = head[i];
    if (/Time\s*:|Max\.?\s*Marks|Examination|Note\s*:|^USN$/i.test(line.text)) continue;
    // Stop once question content or module headers begin — the title never runs that far.
    const first = line.cells[0];
    if (first && first.x < 100 && QNUM_CELL_RE.test(first.str.trim())) break;
    if (MODULE_LINE_RE.test(line.text)) break;
    parts.push(line.text);
  }
  const name = parts.join(' ').replace(/\s+/g, ' ').trim();
  return name.length >= 6 ? name : null;
}

export function extractSubjectName(text: string): string | null {
  const t = flattenText(text);
  const m = t.match(
    /Degree(?:\s+Supplementary)?\s+Examination,\s*[^.]{0,40}?\s+([A-Z][A-Za-z0-9&/(),+\-–—' ]{8,90}?)\s+Time\s*:/i,
  );
  if (m) return m[1].replace(/\s+/g, ' ').trim();
  return null;
}

export function inferBloom(text: string): BloomLevel | null {
  const lead = text.trim().split(/\s+/).slice(0, 6).join(' ').toLowerCase();
  for (const row of BLOOM_VERBS) {
    if (row.verbs.some((v) => new RegExp(`\\b${v}\\b`, 'i').test(lead))) return row.level;
  }
  const tagged = text.match(/\bL\s*([1-6])\b/i);
  if (tagged) {
    return (['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'] as BloomLevel[])[
      Number(tagged[1]) - 1
    ];
  }
  return null;
}

export function difficultyFromBloom(bloom: BloomLevel | null): Difficulty | null {
  if (!bloom) return null;
  if (bloom === 'REMEMBER' || bloom === 'UNDERSTAND') return 'EASY';
  if (bloom === 'APPLY') return 'INTERMEDIATE';
  return 'DIFFICULT';
}

export function parseMarksToken(raw: string): number | null {
  const m = String(raw).match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** Extract CO/PO/PSO/RBT/marks as printed on the PYQ. Does not infer or rewrite. */
export function extractPrintedAcademicTags(text: string): PrintedAcademicTags {
  const raw = String(text || '');
  const marksMatch =
    raw.match(/\((\d+(?:\.\d+)?)\s*Marks?\)/i) ||
    raw.match(/\b(\d+(?:\.\d+)?)\s*Marks\b/i) ||
    // VTU tabular trail: "... question text. 08 L2 CO4" or "... 10 L3 CO1"
    raw.match(/(?:^|[.\s])(\d{1,2})\s+L\s*[1-6]\b/i) ||
    raw.match(/(?:^|[.\s])(\d{1,2})\s+CO\s*\d{1,2}\b/i);
  const coMatch = raw.match(/\bCO\s*[-:]?\s*(\d{1,2})\b/i);
  const poMatches = [...raw.matchAll(/\bPO\s*[-:]?\s*(\d{1,2})\b/gi)].map((m) => `PO${m[1]}`);
  const psoMatches = [...raw.matchAll(/\bPSO\s*[-:]?\s*(\d{1,2})\b/gi)].map((m) => `PSO${m[1]}`);
  const rbtMatch = raw.match(/\bL\s*([1-6])\b/i);
  return {
    printedMarks: marksMatch ? Number(marksMatch[1]) : null,
    printedCo: coMatch ? `CO${coMatch[1]}` : null,
    printedPo: poMatches.length ? [...new Set(poMatches)].join(',') : null,
    printedPso: psoMatches.length ? [...new Set(psoMatches)].join(',') : null,
    printedRbt: rbtMatch ? `L${rbtMatch[1]}` : null,
  };
}

function bloomFromPrintedOrInferred(text: string, printedRbt: string | null): BloomLevel | null {
  if (printedRbt) return bloomFromRbt(printedRbt);
  return inferBloom(text);
}

function questionTypeFor(text: string, maxMarks: number | null): QpQuestionType {
  if (/\b(case study|read the following)\b/i.test(text)) return 'CASE_STUDY';
  if (/\b(compute|calculate|find|determine|derive)\b/i.test(text)) return 'NUMERICAL';
  if (maxMarks != null && maxMarks <= 2) return 'SHORT_ANSWER';
  if (/\b(write a program|algorithm|pseudo[- ]?code)\b/i.test(text)) return 'PROBLEM';
  return 'DESCRIPTIVE';
}

export function parseSubquestions(block: string, sourcePage: number | null): ParsedSubquestion[] {
  const subs: ParsedSubquestion[] = [];
  const re = /\b([a-h])[.)]\s+([\s\S]+?)(?=(?:\s+[a-h][.)]\s+)|\s*$)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    const originalText = m[2].replace(/\s+/g, ' ').trim();
    const tags = extractPrintedAcademicTags(originalText);
    const display = cleanDisplayText(originalText);
    if (display.length < 8) continue;
    const maxMarks = tags.printedMarks;
    const bloom = bloomFromPrintedOrInferred(display, tags.printedRbt);
    subs.push({
      letter: m[1].toLowerCase(),
      originalText,
      questionText: display,
      maxMarks: maxMarks ?? null,
      marksMissing: maxMarks == null,
      bloomLevel: bloom,
      difficulty: difficultyFromBloom(bloom),
      sourcePage,
      printedCo: tags.printedCo,
      printedPo: tags.printedPo,
      printedPso: tags.printedPso,
      printedRbt: tags.printedRbt,
    });
  }
  return subs;
}

// ---------------------------------------------------------------------------
// Coordinate-aware ("positional") question extraction.
//
// VTU papers are laid out as a table (Q-number | sub-letter | text | marks[/CO/RBT]).
// Flattening the PDF text stream scrambles those columns, which is why the legacy
// flat-text parser mis-counts questions. Here we work from the reconstructed page
// `lines` (see pdfExtract.reconstructLines) and classify each cell by column so the
// original table is faithfully recovered. Two schemes are handled:
//   - Old (18/21): marks printed inline as "(NN Marks)" on the right.
//   - New (2022/BCS): separate M / L / C columns (marks number, Bloom "Lx", "COx").
// ---------------------------------------------------------------------------

const QNUM_CELL_RE = /^Q?[.\s]*(\d{1,2})[.)]?$/i;
const SUBLETTER_CELL_RE = /^\(?([a-h])[.)]?$/i;
const MARKS_WORD_RE = /\(?\s*(\d{1,2})\s*Marks?\s*\)?/i;
const MODULE_LINE_RE = /Module\s*[-–—]?\s*(\d{1,2})/i;

const QNUM_MAX_X = 100;
const SUBLETTER_MAX_X = 135;
/** Right-hand marks/CO/RBT columns begin around here across both schemes. */
const RIGHT_ZONE_X = 460;

/**
 * Footer / header cells that PDF.js often merges onto the same baseline as a real
 * question row (Important Note + Q4, USN + Q5 on a continuation page, etc.).
 * Strip them before classifying so the Q-number column is still visible.
 */
function isBoilerplateCell(cell: PageCell): boolean {
  const s = cell.str.trim();
  if (!s) return true;
  if (/^USN$/i.test(s)) return true;
  // VTU footers sometimes prepend a stray glyph ("fImportant Note …").
  if (/^.?Important\s+Note\b/i.test(s) || /\bImportant\s+Note\s*:/i.test(s)) return true;
  if (/^\d+\.\s+Any revealing of identification/i.test(s)) return true;
  if (/^[A-Z]{2}\s*-\s*[A-Z]{2}\s*-\s*[A-Z]{2}/i.test(s)) return true; // MN/MH watermarks
  if (/^VTU-\d{2}-\d{2}-\d{4}/i.test(s)) return true;
  return false;
}

type RightTags = { marks: number | null; rbt: string | null; co: string | null };

/** A right-zone cell is one that reads like a marks / Bloom / CO token, wherever it sits. */
function isRightZoneCell(cell: PageCell): boolean {
  const s = cell.str.trim();
  if (MARKS_WORD_RE.test(s) && /Marks?/i.test(s)) return true;
  if (/^L\s*[1-6],?$/i.test(s)) return true;
  if (/^CO\s*\d{1,2},?$/i.test(s)) return true;
  if (/^\(?\d{1,2}\)?$/.test(s) && cell.x >= RIGHT_ZONE_X) return true;
  return false;
}

function parseRightTags(raw: string): RightTags {
  const withWord = raw.match(/(\d{1,2})\s*Marks?/i);
  const bareInt = raw.match(/\b(\d{1,2})\b/);
  const rbt = raw.match(/L\s*([1-6])/i);
  const co = raw.match(/CO\s*(\d{1,2})/i);
  return {
    marks: withWord ? Number(withWord[1]) : bareInt ? Number(bareInt[1]) : null,
    rbt: rbt ? `L${rbt[1]}` : null,
    co: co ? `CO${co[1]}` : null,
  };
}

type LineClass =
  | { kind: 'skip' }
  | { kind: 'module'; module: number }
  | { kind: 'or' }
  | {
      kind: 'content';
      qnum: number | null;
      letter: string | null;
      textCells: PageCell[];
      rightCells: PageCell[];
    };

function classifyLine(line: PageLine): LineClass {
  // Drop footer/header cells that share a baseline with real question content.
  const cells = line.cells.filter((c) => c.str.trim().length && !isBoilerplateCell(c));
  if (!cells.length) return { kind: 'skip' };
  const joined = cells
    .map((c) => c.str)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Pure footers / boilerplate / headers that never carry question content.
  if (/^\d{1,2}\s+of\s+\d{1,2}$/i.test(joined)) return { kind: 'skip' };
  if (/^[*\s]+$/.test(joined)) return { kind: 'skip' };
  if (/^(Time\s*:|Max\.?\s*Marks|Note\s*:)/i.test(joined)) return { kind: 'skip' };
  if (/Degree\s+(?:Supplementary\s+)?Examination/i.test(joined)) return { kind: 'skip' };

  const leftmost = cells[0];
  // Module header: centered, no left-margin number.
  const moduleMatch = joined.match(MODULE_LINE_RE);
  if (moduleMatch && leftmost.x > 150 && !QNUM_CELL_RE.test(leftmost.str.trim())) {
    return { kind: 'module', module: Number(moduleMatch[1]) };
  }
  // Standalone OR between an alternative pair.
  if (/^OR$/i.test(joined) && leftmost.x > 150) return { kind: 'or' };

  let idx = 0;
  let qnum: number | null = null;
  let letter: string | null = null;
  const first = cells[idx];
  const qm = first.str.trim().match(QNUM_CELL_RE);
  if (qm && first.x <= QNUM_MAX_X) {
    const n = Number(qm[1]);
    if (n >= 1 && n <= 14) {
      qnum = n;
      idx += 1;
    }
  }
  const sub = cells[idx];
  if (sub) {
    const sm = sub.str.trim().match(SUBLETTER_CELL_RE);
    if (sm && sub.x <= SUBLETTER_MAX_X) {
      letter = sm[1].toLowerCase();
      idx += 1;
      // The sub-letter's period is sometimes emitted as its own cell (e.g. "a" then ".").
      if (cells[idx] && /^[.)]$/.test(cells[idx].str.trim())) idx += 1;
    }
  }

  const rest = cells.slice(idx);
  const rightCells = rest.filter(isRightZoneCell);
  const textCells = rest.filter((c) => !isRightZoneCell(c));
  return { kind: 'content', qnum, letter, textCells, rightCells };
}

type SubAccumulator = {
  letter: string;
  textCells: PageCell[];
  rightCells: PageCell[];
};

type QuestionAccumulator = {
  questionNumber: number;
  module: number | null;
  subs: SubAccumulator[];
};

function cellsToText(cells: PageCell[]): string {
  return cells
    .map((c) => c.str)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function finalizeSub(letter: string, sub: SubAccumulator, sourcePage: number | null): ParsedSubquestion | null {
  const originalText = cellsToText(sub.textCells);
  const display = cleanDisplayText(originalText);
  if (display.length < 6) return null;
  const rightRaw = cellsToText(sub.rightCells);
  const tags = parseRightTags(rightRaw);
  const inlineTags = extractPrintedAcademicTags(`${originalText} ${rightRaw}`);
  const maxMarks = tags.marks ?? inlineTags.printedMarks;
  const printedRbt = tags.rbt ?? inlineTags.printedRbt;
  const printedCo = tags.co ?? inlineTags.printedCo;
  const bloom = bloomFromPrintedOrInferred(display, printedRbt);
  return {
    letter,
    originalText,
    questionText: display,
    maxMarks: maxMarks ?? null,
    marksMissing: maxMarks == null,
    bloomLevel: bloom,
    difficulty: difficultyFromBloom(bloom),
    sourcePage,
    printedCo,
    printedPo: inlineTags.printedPo,
    printedPso: inlineTags.printedPso,
    printedRbt,
  };
}

function buildQuestionFromAccumulator(acc: QuestionAccumulator, sourcePage: number | null): ParsedQuestion | null {
  const subs: ParsedSubquestion[] = [];
  for (const s of acc.subs) {
    const finalized = finalizeSub(s.letter, s, sourcePage);
    if (finalized) subs.push(finalized);
  }
  const lettered = subs.filter((s) => s.letter);
  const moduleLabel = acc.module ? `Module ${acc.module}` : null;

  let questionText = '';
  let originalText = '';
  let maxMarks: number | null = null;
  let marksMissing = false;
  if (lettered.length) {
    questionText = lettered.map((s) => `(${s.letter}) ${s.questionText}`).join(' ');
    originalText = lettered.map((s) => `(${s.letter}) ${s.originalText}`).join(' ');
    const allMarked = lettered.every((s) => s.maxMarks != null);
    maxMarks = allMarked ? lettered.reduce((n, s) => n + (s.maxMarks ?? 0), 0) : null;
    marksMissing = !allMarked;
  } else {
    const direct = subs[0];
    if (!direct) return null;
    questionText = direct.questionText;
    originalText = direct.originalText;
    maxMarks = direct.maxMarks;
    marksMissing = direct.marksMissing;
  }
  if (questionText.length < 10) return null;

  const printedRbt = lettered.find((s) => s.printedRbt)?.printedRbt ?? subs.find((s) => s.printedRbt)?.printedRbt ?? null;
  const printedCo = lettered.find((s) => s.printedCo)?.printedCo ?? subs.find((s) => s.printedCo)?.printedCo ?? null;
  const printedPo = subs.find((s) => s.printedPo)?.printedPo ?? null;
  const printedPso = subs.find((s) => s.printedPso)?.printedPso ?? null;
  const bloom = bloomFromPrintedOrInferred(lettered[0]?.questionText || questionText, printedRbt);
  const verification = marksMissing ? 'MARKS_UNRESOLVED' : 'PYQ_EXTRACTED';

  return {
    questionNumber: acc.questionNumber,
    section: moduleLabel ? 'MODULE' : null,
    moduleOrUnit: moduleLabel,
    originalText,
    questionText,
    questionType: questionTypeFor(questionText, maxMarks),
    maxMarks,
    marksMissing,
    isOrChoice: false,
    orGroupId: null,
    orPairId: null,
    orAlternative: null,
    moduleAssignmentMethod: moduleLabel ? 'SOURCE_EXPLICIT' : null,
    subquestions: lettered,
    bloomLevel: bloom,
    difficulty: difficultyFromBloom(bloom),
    sourcePage,
    verificationStatus: verification,
    notes: marksMissing ? 'MARKS_UNRESOLVED' : null,
    printedCo,
    printedPo,
    printedPso,
    printedRbt,
    printedMarks: maxMarks,
  };
}

/**
 * Positional VTU question extractor. Consumes the reconstructed page lines of a single
 * segmented paper and rebuilds Q1..Q10 with their sub-questions, marks, module and printed
 * CO/RBT tags by column. Returns [] when the pages carry no usable line geometry so the
 * caller can fall back to the flat-text parser.
 */
type QuestionAccumulatorWithPage = QuestionAccumulator & { sourcePage: number };

export function parseQuestionsFromPaperLines(pages: ExtractedPage[]): ParsedQuestion[] {
  const withLines = pages.filter((p) => p.lines && p.lines.length);
  if (!withLines.length) return [];

  const accumulators: QuestionAccumulatorWithPage[] = [];
  let currentModule: number | null = null;
  let currentQ: QuestionAccumulatorWithPage | null = null;
  let currentSub: SubAccumulator | null = null;

  const startNewSub = (question: QuestionAccumulator, letter: string): SubAccumulator => {
    const sub: SubAccumulator = { letter, textCells: [], rightCells: [] };
    question.subs.push(sub);
    return sub;
  };

  for (const page of withLines) {
    for (const line of page.lines!) {
      const cls = classifyLine(line);
      if (cls.kind === 'skip' || cls.kind === 'or') continue;
      if (cls.kind === 'module') {
        currentModule = cls.module;
        continue;
      }
      // content line
      if (cls.qnum != null && (!currentQ || cls.qnum !== currentQ.questionNumber)) {
        currentQ = { questionNumber: cls.qnum, module: currentModule, subs: [], sourcePage: page.page };
        accumulators.push(currentQ);
        currentSub = null;
      }
      if (!currentQ) continue; // stray content before the first question header
      if (cls.letter) {
        currentSub = startNewSub(currentQ, cls.letter);
      } else if (!currentSub) {
        currentSub = startNewSub(currentQ, ''); // direct question with no a/b/c parts
      }
      currentSub.textCells.push(...cls.textCells);
      currentSub.rightCells.push(...cls.rightCells);
    }
  }

  const seen = new Map<number, ParsedQuestion>();
  for (const acc of accumulators) {
    const q = buildQuestionFromAccumulator(acc, acc.sourcePage);
    if (!q) continue;
    const prev = seen.get(q.questionNumber);
    if (!prev) {
      seen.set(q.questionNumber, q);
      continue;
    }
    // Keep the richer duplicate (e.g. a header echo vs. the real question).
    const score = (x: ParsedQuestion) =>
      x.subquestions.length * 4 + (x.maxMarks != null ? 3 : 0) + Math.min(20, x.questionText.length / 40);
    if (score(q) > score(prev)) seen.set(q.questionNumber, q);
  }
  return assignVtuOrStructure([...seen.values()].sort((a, b) => a.questionNumber - b.questionNumber));
}

export function parseQuestionsFromPaperText(text: string, startPage = 1): ParsedQuestion[] {
  const cleaned = flattenText(text)
    .replace(/\*{3,}.+$/s, '')
    .replace(/(?:\*\s*){4,}.+$/s, '')
    .replace(/Important Note\s*:[\s\S]+$/i, '')
    .replace(/\b\d+\s+of\s+\d+\b/g, ' ');

  const moduleSpans: Array<{ module: string; start: number; end: number }> = [];
  let mm: RegExpExecArray | null;
  const moduleRe = new RegExp(MODULE_RE.source, 'gi');
  while ((mm = moduleRe.exec(cleaned))) {
    moduleSpans.push({ module: `Module ${mm[1]}`, start: mm.index, end: cleaned.length });
  }
  for (let i = 0; i < moduleSpans.length - 1; i += 1) {
    moduleSpans[i].end = moduleSpans[i + 1].start;
  }

  const moduleAt = (idx: number) => {
    const hit = [...moduleSpans].reverse().find((s) => idx >= s.start && idx < s.end);
    return hit?.module ?? null;
  };

  const questions: ParsedQuestion[] = [];
  const orGroups = new Map<string, string>();
  let orSeq = 0;

  const qRe =
    /(?:^|\s)(\d{1,2})\s+(?=((?:[a-h][.)]\s+)|[A-Z]))([\s\S]+?)(?=(?:\s+OR\b)|(?:\s+\d{1,2}\s+(?:[a-h][.)]\s+|[A-Z][a-z]{2,}))|(?:\s+Module[-–—\s]*\d+\b)|$)/g;

  const orPositions: number[] = [];
  const orFind = /\bOR\b/g;
  let om: RegExpExecArray | null;
  while ((om = orFind.exec(cleaned))) orPositions.push(om.index);

  let qm: RegExpExecArray | null;
  while ((qm = qRe.exec(cleaned))) {
    const questionNumber = Number(qm[1]);
    if (!Number.isFinite(questionNumber) || questionNumber < 1 || questionNumber > 50) continue;
    const rawBlock = String(qm[3] || '').trim();
    if (!rawBlock || rawBlock.length < 8) continue;
    if (/^of\s+\d+\b/i.test(rawBlock)) continue;

    const subs = parseSubquestions(rawBlock, startPage);
    const usableSubs = subs.filter((s) => s.questionText.length >= 8);
    let questionText = '';
    let maxMarks: number | null = null;
    let marksMissing = false;

    const parentTags = extractPrintedAcademicTags(rawBlock);
    let originalText = rawBlock.replace(/\s+/g, ' ').trim();
    if (usableSubs.length) {
      questionText = usableSubs.map((s) => `(${s.letter}) ${s.questionText}`).join(' ');
      originalText = usableSubs.map((s) => `(${s.letter}) ${s.originalText}`).join(' ');
      const markSum = usableSubs.reduce((n, s) => n + (s.maxMarks ?? 0), 0);
      maxMarks = usableSubs.every((s) => s.maxMarks != null) ? markSum : parentTags.printedMarks;
      marksMissing = usableSubs.some((s) => s.marksMissing) && parentTags.printedMarks == null;
    } else {
      maxMarks = parentTags.printedMarks;
      marksMissing = maxMarks == null;
      questionText = cleanDisplayText(rawBlock);
    }

    if (questionText.length < 12) continue;
    if (/^(hrs\.?|marks|note[:.]|time[:.]|important note)/i.test(questionText)) continue;
    if (/^Max\.?\s*Marks/i.test(questionText)) continue;
    if (/on completing your answers|revealing of identification|will be treated as malpractice/i.test(questionText)) continue;

    const startIdx = qm.index;
    const precedingOr = [...orPositions].reverse().find((p) => p < startIdx && startIdx - p < 24);
    const followingOr = orPositions.find((p) => p > startIdx && p < startIdx + rawBlock.length + 8);
    const isOrChoice = Boolean(precedingOr) || Boolean(followingOr);
    let orGroupId: string | null = null;
    if (isOrChoice) {
      const pair = precedingOr ? questionNumber - 1 : questionNumber;
      const key = `pair-${Math.max(1, pair)}`;
      if (!orGroups.has(key)) {
        orSeq += 1;
        orGroups.set(key, `OR-GROUP-${String(orSeq).padStart(2, '0')}`);
      }
      orGroupId = orGroups.get(key)!;
    }

    const printedRbt = parentTags.printedRbt || usableSubs.find((s) => s.printedRbt)?.printedRbt || null;
    const printedCo = parentTags.printedCo || usableSubs.find((s) => s.printedCo)?.printedCo || null;
    const printedPo = parentTags.printedPo || usableSubs.find((s) => s.printedPo)?.printedPo || null;
    const printedPso = parentTags.printedPso || usableSubs.find((s) => s.printedPso)?.printedPso || null;
    const bloom = bloomFromPrintedOrInferred(usableSubs[0]?.questionText || questionText, printedRbt);
    const verification = marksMissing
      ? 'MARKS_UNRESOLVED'
      : questionText.length < 20
        ? 'QUESTION_TEXT_INCOMPLETE'
        : 'PYQ_EXTRACTED';

    questions.push({
      questionNumber,
      section: moduleAt(startIdx) ? 'MODULE' : null,
      moduleOrUnit: moduleAt(startIdx),
      originalText,
      questionText,
      questionType: questionTypeFor(questionText, maxMarks),
      maxMarks,
      marksMissing,
        isOrChoice,
        orGroupId,
        orPairId: orGroupId,
        orAlternative: null,
        moduleAssignmentMethod: moduleAt(startIdx) ? 'SOURCE_EXPLICIT' : null,
        subquestions: usableSubs,
      bloomLevel: bloom,
      difficulty: difficultyFromBloom(bloom),
      sourcePage: startPage,
      verificationStatus: verification,
      notes: marksMissing ? 'MARKS_UNRESOLVED' : null,
      printedCo,
      printedPo,
      printedPso,
      printedRbt,
      printedMarks: maxMarks,
    });
  }

  const seen = new Map<number, ParsedQuestion>();
  for (const q of questions) {
    const prev = seen.get(q.questionNumber);
    if (!prev) {
      seen.set(q.questionNumber, q);
      continue;
    }
    const score = (x: ParsedQuestion) =>
      x.subquestions.length * 4 + (x.maxMarks != null ? 3 : 0) + Math.min(20, (x.questionText?.length || 0) / 40);
    if (score(q) > score(prev)) seen.set(q.questionNumber, q);
  }
  return assignVtuOrStructure([...seen.values()].sort((a, b) => a.questionNumber - b.questionNumber));
}

export function parseMcqPaper(text: string, startPage = 1): ParsedQuestion[] {
  const cleaned = flattenText(text);
  if (!/fifty questions|answer all the fifty|each (?:question )?carries one mark/i.test(cleaned)) return [];
  if (/Important Note/i.test(cleaned) && !/fifty questions/i.test(cleaned)) return [];
  const questions: ParsedQuestion[] = [];
  const re = /(?:^|\s)(\d{1,2})\s*[.)]\s+(.+?)(?=(?:\s+\d{1,2}\s*[.)]\s+)|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned))) {
    const n = Number(m[1]);
    const body = m[2].replace(/\s+/g, ' ').trim();
    if (n < 1 || n > 50 || body.length < 12) continue;
    if (/^of\s+\d+/.test(body)) continue;
    const tags = extractPrintedAcademicTags(body);
    const display = body.replace(/\s+[a-d][).]\s+/gi, ' | ').trim();
    questions.push({
      questionNumber: n,
      section: 'MCQ',
      moduleOrUnit: null,
      originalText: body,
      questionText: display,
      questionType: 'MCQ',
      maxMarks: 1,
      marksMissing: false,
      isOrChoice: false,
      orGroupId: null,
      orPairId: null,
      orAlternative: null,
      moduleAssignmentMethod: null,
      subquestions: [],
      bloomLevel: bloomFromPrintedOrInferred(body, tags.printedRbt),
      difficulty: 'EASY',
      sourcePage: startPage,
      verificationStatus: 'PYQ_EXTRACTED',
      notes: null,
      printedCo: tags.printedCo,
      printedPo: tags.printedPo,
      printedPso: tags.printedPso,
      printedRbt: tags.printedRbt,
      printedMarks: 1,
    });
  }
  return questions.length >= 2 ? questions : [];
}

export function buildPaperId(meta: {
  courseCode: string | null;
  examYear: number | null;
  examMonth: string | null;
  examType: ExamType;
}) {
  const code = meta.courseCode || 'UNKNOWN';
  const year = meta.examYear || 'ND';
  const month = meta.examMonth || 'ND';
  return `QPB-${code}-${year}-${month}-${meta.examType}`.replace(/\s+/g, '');
}

export function parsePaperMetadata(opts: {
  text: string;
  sourceFile: string;
  fileName: string;
  folder: string;
  startPage: number;
  endPage: number;
  indexRow?: IndexRow | null;
  headerLines?: PageLine[];
}): PaperMetadata {
  const text = flattenText(opts.text);
  const courseCode =
    extractHeaderCourseCodeFromLines(opts.headerLines) ||
    extractHeaderCourseCode(text) ||
    (opts.indexRow ? opts.indexRow.courseCode : null);
  const subjectName =
    extractSubjectNameFromLines(opts.headerLines) ||
    extractSubjectName(text) ||
    opts.indexRow?.subjectName ||
    null;
  const examType = detectExamType(text, opts.fileName);
  const dateLabel =
    text.match(
      /Examination,\s*([A-Za-z./ ]+20\d{2}(?:\s*\/\s*[A-Za-z.]*\s*20\d{2})?)/i,
    )?.[1] || opts.indexRow?.examDateLabel || null;
  const { month, year } = monthKey(dateLabel || opts.fileName);
  const maxMarks = maxMarksFromText(text);
  const durationMinutes = durationMinutesFromText(text);
  const scheme = parseScheme(text, opts.fileName);
  const semester = parseSemester(text);
  const program = parseProgramFromHeader(text, opts.folder);
  const paperId = buildPaperId({ courseCode, examYear: year, examMonth: month, examType });

  const notes: string[] = [];
  let extractionStatus: PaperMetadata['extractionStatus'] = 'EXTRACTED';
  let verificationStatus = 'ACADEMIC_ANALYSIS';
  if (!courseCode) {
    notes.push('Course code unresolved');
    verificationStatus = 'NEEDS_REVIEW';
    extractionStatus = 'NEEDS_REVIEW';
  }
  if (!subjectName) {
    notes.push('Subject name unresolved');
    verificationStatus = 'NEEDS_REVIEW';
  }
  if (maxMarks == null) notes.push('Max marks not visible');
  if (durationMinutes == null) notes.push('Duration not visible');

  return {
    paperId,
    courseCode,
    subjectName,
    scheme,
    program,
    semester,
    examType,
    academicYear: academicYearFromExam(month, year),
    examMonth: month,
    examYear: year,
    examDate: dateLabel ? dateLabel.replace(/\s+/g, ' ').trim() : null,
    maxMarks,
    durationMinutes,
    university: 'Visvesvaraya Technological University (VTU)',
    sourceFile: opts.sourceFile,
    sourceType: 'PDF',
    extractionStatus,
    verificationStatus,
    notes: notes.length ? notes.join('; ') : null,
    startPage: opts.startPage,
    endPage: opts.endPage,
  };
}

/**
 * Read the per-paper "N of K" page counter printed in VTU footers/headers. Lets QA decide
 * whether a short paper is a genuine source truncation (fewer pages than K) or a parser
 * defect (all K pages present but questions still missing).
 */
export function readPaperPageSpan(pages: ExtractedPage[]): {
  firstN: number | null;
  totalK: number | null;
  pagesSeen: number;
} {
  let firstN: number | null = null;
  let totalK: number | null = null;
  for (const p of pages) {
    const src = p.lines?.map((l) => l.text).join(' ') ?? p.text;
    const m = src.match(/\b(\d{1,2})\s+of\s+(\d{1,2})\b/);
    if (!m) continue;
    const n = Number(m[1]);
    const k = Number(m[2]);
    if (n >= 1 && k >= 1 && k <= 30) {
      if (firstN == null) firstN = n;
      if (totalK == null || k > totalK) totalK = k;
    }
  }
  return { firstN, totalK, pagesSeen: pages.length };
}

export function splitMergedDocument(pages: ExtractedPage[], sourceFile: string, folder: string) {
  const fileName = sourceFile.split('/').pop() || sourceFile;
  const index = parseIndex(pages);
  const starts: number[] = [];
  for (const page of pages) {
    if (looksLikePaperStart(page.text)) starts.push(page.page);
  }
  if (!starts.length) {
    const firstContent = pages.find((p) => !isCoverOrIndexPage(p.text) && p.charCount > 200);
    if (firstContent) starts.push(firstContent.page);
  }

  const papers: ExtractedPaper[] = [];
  const reviewItems: ReviewItem[] = [];

  for (let i = 0; i < starts.length; i += 1) {
    const startPage = starts[i];
    const endPage = (starts[i + 1] ?? pages[pages.length - 1].page + 1) - 1;
    const slice = pages.filter((p) => p.page >= startPage && p.page <= endPage);
    const fullText = slice.map((p) => p.text).join('\n');
    const avgChars = slice.reduce((n, p) => n + p.charCount, 0) / Math.max(1, slice.length);
    if (avgChars < 40) {
      reviewItems.push({
        issueType: 'OCR_REQUIRED',
        reason: 'Page text too sparse to extract questions',
        sourceFile,
        sourcePage: startPage,
        priority: 'HIGH',
      });
    }
    const indexRow = index[i] ?? index.find((r) => fullText.toUpperCase().includes(r.courseCode)) ?? null;
    const metadata = parsePaperMetadata({
      text: fullText,
      sourceFile,
      fileName,
      folder,
      startPage,
      endPage,
      indexRow,
      headerLines: slice[0]?.lines,
    });
    const mcq = parseMcqPaper(fullText, startPage);
    let questions: ParsedQuestion[];
    if (mcq.length) {
      questions = mcq;
    } else {
      const positional = parseQuestionsFromPaperLines(slice);
      questions = positional.length ? positional : parseQuestionsFromPaperText(fullText, startPage);
    }
    const paperReviews: ReviewItem[] = [...reviewItems.filter((r) => r.sourcePage === startPage)];
    if (!questions.length) {
      metadata.extractionStatus = avgChars < 40 ? 'OCR_REQUIRED' : 'NEEDS_REVIEW';
      metadata.verificationStatus = 'NEEDS_REVIEW';
      paperReviews.push({
        issueType: avgChars < 40 ? 'OCR_REQUIRED' : 'QUESTION_TEXT_INCOMPLETE',
        reason: 'No questions extracted from paper text',
        paperId: metadata.paperId,
        sourceFile,
        sourcePage: startPage,
        priority: 'HIGH',
      });
    } else if (questions.length < 3 && (metadata.maxMarks ?? 100) >= 50) {
      metadata.extractionStatus = 'PARTIAL';
      metadata.verificationStatus = 'NEEDS_REVIEW';
      paperReviews.push({
        issueType: 'QUESTION_TEXT_INCOMPLETE',
        reason: `Only ${questions.length} question(s) extracted from a ${metadata.maxMarks ?? 'full'} mark paper`,
        paperId: metadata.paperId,
        sourceFile,
        sourcePage: startPage,
        priority: 'HIGH',
      });
    }
    for (const q of questions) {
      if (q.marksMissing) {
        paperReviews.push({
          issueType: 'MARKS_MISSING',
          reason: `Marks not visible for Q${q.questionNumber}`,
          paperId: metadata.paperId,
          questionRef: String(q.questionNumber),
          sourceFile,
          sourcePage: q.sourcePage,
          priority: 'MEDIUM',
        });
      }
    }
    for (const rev of [...missingOrAlternatives(questions), ...marksMismatchReviews(questions)]) {
      paperReviews.push({ ...rev, paperId: metadata.paperId, sourceFile });
    }
    papers.push({ metadata, fullText, questions, reviewItems: paperReviews });
  }

  if (!papers.length) {
    reviewItems.push({
      issueType: 'PAGE_EXTRACTION_FAILED',
      reason: 'No paper boundaries detected',
      sourceFile,
      priority: 'HIGH',
    });
  }

  return { papers, index, reviewItems };
}
