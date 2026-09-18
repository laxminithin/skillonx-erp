export declare const EXAM_TYPES: readonly ["SEE", "MAKEUP", "SUPPLEMENTARY", "MODEL", "INTERNAL", "CIE", "IA-1", "IA-2", "CUSTOM"];
export type ExamType = (typeof EXAM_TYPES)[number];
export declare const EXTRACTION_STATUSES: readonly ["EXTRACTED", "PARTIAL", "NEEDS_REVIEW", "OCR_REQUIRED", "FAILED"];
export type ExtractionStatus = (typeof EXTRACTION_STATUSES)[number];
export declare const VERIFICATION_STATUSES: readonly ["ACADEMIC_ANALYSIS", "NEEDS_REVIEW", "VERIFIED_SOURCE", "CO_MAPPING_BLOCKED", "MARKS_MISSING", "QUESTION_TEXT_INCOMPLETE", "OR_STRUCTURE_AMBIGUOUS"];
export declare const BLOOM_LEVELS: readonly ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
export type BloomLevel = (typeof BLOOM_LEVELS)[number];
export declare const DIFFICULTIES: readonly ["EASY", "INTERMEDIATE", "DIFFICULT"];
export type Difficulty = (typeof DIFFICULTIES)[number];
export declare const QUESTION_TYPES: readonly ["DESCRIPTIVE", "SHORT_ANSWER", "NUMERICAL", "MCQ", "CASE_STUDY", "PROBLEM"];
export type QpQuestionType = (typeof QUESTION_TYPES)[number];
export declare const INTERNAL_PAPER_STATUSES: readonly ["DRAFT", "FINALIZED", "ARCHIVED"];
export type InternalPaperStatus = (typeof INTERNAL_PAPER_STATUSES)[number];
export declare const INTERNAL_EXAM_TYPES: readonly ["IA-1", "IA-2", "IA-3", "CIE", "MODEL_INTERNAL", "MAKEUP", "CUSTOM"];
export declare const WORKFLOW_STEPS: readonly ["SETUP", "PORTIONS", "PATTERN", "BLUEPRINT", "QUESTIONS", "SCHEME", "REVIEW"];
export type WorkflowStep = (typeof WORKFLOW_STEPS)[number];
export declare const QUESTION_SOURCES: readonly ["PREVIOUS_YEAR", "QUESTION_BANK", "QUIZ_BANK", "CUSTOM"];
export type QuestionSource = (typeof QUESTION_SOURCES)[number];
export declare const MASTER_BANK_SOURCE_TYPE: "PREVIOUS_YEAR_QUESTION_PAPER";
export declare const MQB_READINESS_STATUSES: readonly ["PYQ_EXTRACTED", "MARKS_UNRESOLVED", "MODULE_MAPPING_NEEDS_REVIEW", "CO_MAPPING_NEEDS_REVIEW", "MAPPING_DISCREPANCY", "TEXTBOOK_SOURCE_REQUIRED", "SOLUTION_PENDING", "SCHEME_PENDING", "SCHEME_NEEDS_REVIEW", "READY", "READY_FOR_INTERNAL_PAPER"];
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
export declare const MODULE_ASSIGNMENT_METHODS: readonly ["SOURCE_EXPLICIT", "VTU_STANDARD_PAIR_PATTERN", "SYLLABUS_TOPIC_VERIFIED", "MANUAL_REVIEW"];
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
export declare function normalizeCourseCode(code: string | null | undefined): string;
export declare function monthKey(label: string | null | undefined): {
    month: string | null;
    year: number | null;
};
export declare function academicYearFromExam(month: string | null, year: number | null): string | null;
export declare function durationMinutesFromText(text: string): number | null;
export declare function maxMarksFromText(text: string): number | null;
export declare function flattenText(text: string): string;
export declare function normalizeQuestionFingerprint(text: string): string;
