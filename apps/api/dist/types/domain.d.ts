export declare const SURVEY_TYPES: readonly ["FACULTY_FEEDBACK", "COURSE_END", "SEMESTER_END", "SUBJECT_FEEDBACK", "LABORATORY", "TRAINING", "EVENT", "PLACEMENT_TRAINING", "INFRASTRUCTURE", "CUSTOM"];
export type SurveyType = (typeof SURVEY_TYPES)[number];
export declare const SURVEY_STATUSES: readonly ["DRAFT", "PUBLISHED", "ACTIVE", "CLOSED", "ARCHIVED"];
export type SurveyStatus = (typeof SURVEY_STATUSES)[number];
export declare const RESPONSE_POLICIES: readonly ["ONE_PER_STUDENT", "MULTIPLE", "ONE_PER_CYCLE"];
export type ResponsePolicy = (typeof RESPONSE_POLICIES)[number];
export declare const IDENTITY_MODES: readonly ["IDENTIFIED", "ANONYMOUS"];
export type IdentityMode = (typeof IDENTITY_MODES)[number];
export declare const QUESTION_TYPES: readonly ["STAR_RATING", "SMILE_RATING", "NUMERICAL", "LIKERT", "MULTIPLE_CHOICE", "CHECKBOX", "YES_NO", "SHORT_ANSWER", "LONG_ANSWER", "DROPDOWN", "RATING"];
export type QuestionType = (typeof QUESTION_TYPES)[number];
export declare const SUBMISSION_STATUSES: readonly ["STARTED", "COMPLETED", "ABANDONED"];
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];
export declare const FACULTY_ROLES: readonly ["FACULTY", "ACCOUNTANT", "ADMISSIONS_OFFICER", "ADMISSIONS_MANAGER", "COE", "OFFICE_ADMIN", "OFFICE_SUPERINTENDENT", "HOD", "PRINCIPAL", "MANAGEMENT", "CHAIRMAN", "IQAC_COORDINATOR", "NBA_COORDINATOR", "COLLEGE_ADMIN", "SUPER_ADMIN"];
export type FacultyRole = (typeof FACULTY_ROLES)[number];
export declare const SURVEY_TYPE_LABELS: Record<SurveyType, string>;
export declare const QUESTION_TYPE_LABELS: Record<string, string>;
export declare const LIKERT_DEFAULT_OPTIONS: {
    label: string;
    value: number;
}[];
export declare const SMILE_DEFAULT_OPTIONS: {
    label: string;
    value: number;
    emoji: string;
}[];
export declare const STAR_DEFAULT_LABELS: Record<number, string>;
export declare const YES_NO_OPTIONS: {
    label: string;
    value: number;
}[];
export declare const YES_NO_NA_OPTIONS: {
    label: string;
    value: number;
}[];
export declare const NUMERIC_QUESTION_TYPES: Set<string>;
export declare function normalizeUsn(usn: string): string;
export declare function normalizeQuestionType(type: string): QuestionType;
