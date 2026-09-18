export const EXAM_TYPES = [
  'SEE',
  'MAKEUP',
  'SUPPLEMENTARY',
  'MODEL',
  'INTERNAL',
  'CIE',
  'IA-1',
  'IA-2',
  'CUSTOM',
] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

export const EXTRACTION_STATUSES = [
  'EXTRACTED',
  'PARTIAL',
  'NEEDS_REVIEW',
  'OCR_REQUIRED',
  'FAILED',
] as const;
export type ExtractionStatus = (typeof EXTRACTION_STATUSES)[number];

export const VERIFICATION_STATUSES = [
  'ACADEMIC_ANALYSIS',
  'NEEDS_REVIEW',
  'VERIFIED_SOURCE',
  'CO_MAPPING_BLOCKED',
  'MARKS_MISSING',
  'QUESTION_TEXT_INCOMPLETE',
  'OR_STRUCTURE_AMBIGUOUS',
] as const;

export const BLOOM_LEVELS = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
] as const;
export type BloomLevel = (typeof BLOOM_LEVELS)[number];

export const DIFFICULTIES = ['EASY', 'INTERMEDIATE', 'DIFFICULT'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const QUESTION_TYPES = [
  'DESCRIPTIVE',
  'SHORT_ANSWER',
  'NUMERICAL',
  'MCQ',
  'CASE_STUDY',
  'PROBLEM',
] as const;
export type QpQuestionType = (typeof QUESTION_TYPES)[number];

export const INTERNAL_PAPER_STATUSES = ['DRAFT', 'FINALIZED', 'ARCHIVED'] as const;
export type InternalPaperStatus = (typeof INTERNAL_PAPER_STATUSES)[number];

export const INTERNAL_EXAM_TYPES = [
  'IA-1',
  'IA-2',
  'IA-3',
  'CIE',
  'MODEL_INTERNAL',
  'MAKEUP',
  'CUSTOM',
] as const;

export const WORKFLOW_STEPS = [
  'SETUP',
  'PORTIONS',
  'PATTERN',
  'BLUEPRINT',
  'QUESTIONS',
  'SCHEME',
  'REVIEW',
] as const;
export type WorkflowStep = (typeof WORKFLOW_STEPS)[number];

export const QUESTION_SOURCES = ['PREVIOUS_YEAR', 'QUESTION_BANK', 'QUIZ_BANK', 'CUSTOM'] as const;
export type QuestionSource = (typeof QUESTION_SOURCES)[number];

export const MASTER_BANK_SOURCE_TYPE = 'PREVIOUS_YEAR_QUESTION_PAPER' as const;

export const MQB_READINESS_STATUSES = [
  'PYQ_EXTRACTED',
  'MARKS_UNRESOLVED',
  'MODULE_MAPPING_NEEDS_REVIEW',
  'CO_MAPPING_NEEDS_REVIEW',
  'MAPPING_DISCREPANCY',
  'TEXTBOOK_SOURCE_REQUIRED',
  'SOLUTION_PENDING',
  'SCHEME_PENDING',
  'SCHEME_NEEDS_REVIEW',
  'READY',
  'READY_FOR_INTERNAL_PAPER',
] as const;
export type MqbReadinessStatus = (typeof MQB_READINESS_STATUSES)[number];

export type PrintedAcademicTags = {
  printedMarks: number | null;
  printedCo: string | null;
  printedPo: string | null;
  printedPso: string | null;
  printedRbt: string | null;
};

export type PageCell = {
  x: number;
  str: string;
};

export type PageLine = {
  y: number;
  cells: PageCell[];
  text: string;
};

export type ExtractedPage = {
  page: number;
  text: string;
  charCount: number;
  /**
   * Coordinate-reconstructed lines (top-to-bottom, cells left-to-right). Present when the
   * page was extracted from a real PDF; absent for synthetic/flat-text fixtures. The
   * positional question parser uses these to recover the VTU table columns
   * (Q-number | sub-letter | text | marks) that flattening destroys.
   */
  lines?: PageLine[];
};

export type IndexRow = {
  serial: number;
  courseCode: string;
  subjectName: string;
  examDateLabel: string | null;
};

export type PaperMetadata = {
  paperId: string;
  courseCode: string | null;
  subjectName: string | null;
  scheme: string | null;
  program: string | null;
  semester: string | null;
  examType: ExamType;
  academicYear: string | null;
  examMonth: string | null;
  examYear: number | null;
  examDate: string | null;
  maxMarks: number | null;
  durationMinutes: number | null;
  university: string;
  sourceFile: string;
  sourceType: string;
  extractionStatus: ExtractionStatus;
  verificationStatus: string;
  notes: string | null;
  startPage: number;
  endPage: number;
};

export type ParsedSubquestion = {
  letter: string;
  originalText: string;
  questionText: string;
  maxMarks: number | null;
  marksMissing: boolean;
  bloomLevel: BloomLevel | null;
  difficulty: Difficulty | null;
  sourcePage: number | null;
  printedCo: string | null;
  printedPo: string | null;
  printedPso: string | null;
  printedRbt: string | null;
};

export const MODULE_ASSIGNMENT_METHODS = [
  'SOURCE_EXPLICIT',
  'VTU_STANDARD_PAIR_PATTERN',
  'SYLLABUS_TOPIC_VERIFIED',
  'MANUAL_REVIEW',
] as const;
export type ModuleAssignmentMethod = (typeof MODULE_ASSIGNMENT_METHODS)[number];

export type ParsedQuestion = {
  questionNumber: number;
  section: string | null;
  moduleOrUnit: string | null;
  originalText: string;
  questionText: string;
  questionType: QpQuestionType;
  maxMarks: number | null;
  marksMissing: boolean;
  isOrChoice: boolean;
  orGroupId: string | null;
  orPairId: string | null;
  orAlternative: 'A' | 'B' | null;
  moduleAssignmentMethod: ModuleAssignmentMethod | null;
  subquestions: ParsedSubquestion[];
  bloomLevel: BloomLevel | null;
  difficulty: Difficulty | null;
  sourcePage: number | null;
  verificationStatus: string;
  notes: string | null;
  printedCo: string | null;
  printedPo: string | null;
  printedPso: string | null;
  printedRbt: string | null;
  printedMarks: number | null;
};

export type ExtractedPaper = {
  metadata: PaperMetadata;
  fullText: string;
  questions: ParsedQuestion[];
  reviewItems: ReviewItem[];
};

export type ReviewItem = {
  issueType: string;
  reason: string;
  paperId?: string | null;
  questionRef?: string | null;
  sourceFile?: string | null;
  sourcePage?: number | null;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
};

export type SourceFileRecord = {
  relativePath: string;
  fileName: string;
  folder: string;
  programHint: string | null;
  sourceType: string;
  byteSize: number;
  pageCount: number | null;
  extractionStatus: ExtractionStatus;
  paperCount: number;
  ocrRequired: boolean;
  notes: string | null;
};

export function normalizeCourseCode(code: string | null | undefined) {
  return String(code || '')
    .replace(/\s+/g, '')
    .toUpperCase()
    .replace(/[–—]/g, '/');
}

export function monthKey(label: string | null | undefined): { month: string | null; year: number | null } {
  if (!label) return { month: null, year: null };
  const s = String(label);
  const yearMatch = s.match(/(20\d{2})/g);
  const year = yearMatch ? Number(yearMatch[yearMatch.length - 1]) : null;
  if (/june|july|jun|jul/i.test(s)) return { month: 'JUN', year };
  if (/dec|jan/i.test(s)) return { month: 'JAN', year };
  if (/feb|february/i.test(s)) return { month: 'FEB', year };
  if (/mar|march/i.test(s)) return { month: 'MAR', year };
  if (/apr|april/i.test(s)) return { month: 'APR', year };
  if (/aug|august/i.test(s)) return { month: 'AUG', year };
  if (/sep/i.test(s)) return { month: 'SEP', year };
  if (/oct/i.test(s)) return { month: 'OCT', year };
  if (/nov/i.test(s)) return { month: 'NOV', year };
  if (/may/i.test(s)) return { month: 'MAY', year };
  return { month: null, year };
}

export function academicYearFromExam(month: string | null, year: number | null) {
  if (!year) return null;
  if (month === 'JAN' || month === 'FEB' || month === 'MAR') {
    return `${year - 1}-${String(year).slice(2)}`;
  }
  return `${year}-${String(year + 1).slice(2)}`;
}

export function durationMinutesFromText(text: string): number | null {
  const hours = text.match(/Time\s*:\s*(\d+(?:\.\d+)?)\s*(?:hrs?|hours?)/i);
  if (hours) return Math.round(Number(hours[1]) * 60);
  const mins = text.match(/Time\s*:\s*(\d+)\s*(?:min|minutes)/i);
  if (mins) return Number(mins[1]);
  return null;
}

export function maxMarksFromText(text: string): number | null {
  const m = text.match(/Max\.?\s*Marks\s*:\s*(\d+)/i) || text.match(/\[\s*Max\.?\s*Marks\s*:\s*(\d+)\s*\]/i);
  return m ? Number(m[1]) : null;
}

export function flattenText(text: string) {
  return String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function normalizeQuestionFingerprint(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9+\-./\s]/g, '')
    .trim()
    .slice(0, 512);
}
