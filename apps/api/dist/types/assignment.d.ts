export declare const ASSIGNMENT_QUESTION_TYPES: readonly ["DESCRIPTIVE", "SHORT_ANALYSIS", "USE_CASE", "CASE_STUDY", "PROBLEM_SOLVING", "DESIGN", "COMPARE_JUSTIFY", "APPLICATION", "RESEARCH_TASK", "CODE_EXPLANATION", "SCENARIO", "ALGORITHM", "INTERPRETATION"];
export type AssignmentQuestionType = (typeof ASSIGNMENT_QUESTION_TYPES)[number];
export declare const ASSIGNMENT_RESPONSE_FORMATS: readonly ["LONG_TEXT", "SHORT_TEXT", "CODE_TEXT", "NUMERIC"];
export type AssignmentResponseFormat = (typeof ASSIGNMENT_RESPONSE_FORMATS)[number];
export declare const ASSIGNMENT_DIFFICULTIES: readonly ["EASY", "INTERMEDIATE", "DIFFICULT"];
export type AssignmentDifficulty = (typeof ASSIGNMENT_DIFFICULTIES)[number];
export declare const ASSIGNMENT_REVIEW_STATUSES: readonly ["APPROVED", "NEEDS_REVIEW", "READY"];
export type AssignmentReviewStatus = (typeof ASSIGNMENT_REVIEW_STATUSES)[number];
export declare const ASSIGNMENT_SELECTABLE_STATUSES: readonly ["APPROVED", "READY"];
export declare const ASSIGNMENT_STATUSES: readonly ["DRAFT", "PUBLISHED", "ACTIVE", "CLOSED", "ARCHIVED"];
export type AssignmentStoredStatus = (typeof ASSIGNMENT_STATUSES)[number];
export declare const ASSIGNMENT_SUBMISSION_STATUSES: readonly ["IN_PROGRESS", "SUBMITTED", "LATE_SUBMITTED"];
export type AssignmentSubmissionStatus = (typeof ASSIGNMENT_SUBMISSION_STATUSES)[number];
export declare const ASSIGNMENT_EVALUATION_STATUSES: readonly ["PENDING", "IN_PROGRESS", "EVALUATED", "RELEASED"];
export type AssignmentEvaluationStatus = (typeof ASSIGNMENT_EVALUATION_STATUSES)[number];
export declare const CO_VERIFICATION_STATUSES: readonly ["VERIFIED_SOURCE", "VERIFIED", "ACADEMIC_ANALYSIS", "NEEDS_REVIEW", "CO_MAPPING_BLOCKED"];
export type CoVerificationStatus = (typeof CO_VERIFICATION_STATUSES)[number];
export declare const SOLUTION_RELEASE_POLICIES: readonly ["NEVER", "AFTER_DUE_DATE", "AFTER_EVALUATION", "MANUAL_RELEASE"];
export type SolutionReleasePolicy = (typeof SOLUTION_RELEASE_POLICIES)[number];
export declare const GENERATOR_PRESETS: readonly ["SHORT", "STANDARD", "DEEP_DIVE", "CUSTOM"];
export type GeneratorPreset = (typeof GENERATOR_PRESETS)[number];
/** Keys that must never appear in public/student assignment payloads. */
export declare const ANSWER_LEAK_KEYS: readonly ["modelSolution", "expectedAnswerGuidance", "expected_answer_guidance", "evaluationRubric", "evaluation_rubric", "evaluationScheme", "evaluation_scheme", "expectedKeyPoints", "expected_key_points", "facultyNotes", "faculty_notes", "schemeMarks", "scheme_marks", "correctAnswer", "answerKey"];
export declare const ASSIGNMENT_QUESTION_TYPE_LABELS: Record<AssignmentQuestionType, string>;
export declare const ASSIGNMENT_DIFFICULTY_LABELS: Record<AssignmentDifficulty, string>;
export declare function normalizeAssignmentDifficulty(raw: string | null | undefined): AssignmentDifficulty | null;
export declare function normalizeAssignmentQuestionType(raw: string | null | undefined): AssignmentQuestionType | null;
export declare function isSelectableAssignmentStatus(status: string | null | undefined): status is "APPROVED" | "READY";
export declare function normalizeQuestionText(text: string): string;
export declare function defaultMarksForDifficulty(difficulty: AssignmentDifficulty | null | undefined): number;
export declare function countWords(text: string | null | undefined): number;
export declare function defaultResponseFormatForType(type: AssignmentQuestionType | null | undefined): AssignmentResponseFormat;
export type EvaluationCriterion = {
    criterion: string;
    marks: number;
    guidance?: string;
};
export type EvaluationRubric = {
    totalMarks: number;
    criteria: EvaluationCriterion[];
};
/** Type-appropriate rubric whose criterion marks sum exactly to `marks`. */
export declare function synthesizeEvaluationRubric(type: AssignmentQuestionType | null | undefined, marks: number): EvaluationRubric;
