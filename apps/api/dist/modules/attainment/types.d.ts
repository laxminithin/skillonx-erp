export declare const FORMULA_VERSION = "skillonx-attainment-formula-v1.0";
export declare const QUALITY_SCORE_VERSION = "skillonx-qp-quality-v1.0";
export declare const STANDARD_CODE = "SKILLONX_ACADEMIC_STANDARD";
export declare const STANDARD_VERSION = "1.0";
export declare const SEE_METHODS: readonly ["ACTUAL", "PAPER_WEIGHTED", "EQUAL_WEIGHT"];
export type SeeMethod = (typeof SEE_METHODS)[number];
export declare const SEE_CONFIDENCE: {
    readonly ACTUAL: "HIGH";
    readonly PAPER_WEIGHTED: "MEDIUM";
    readonly EQUAL_WEIGHT: "LOW";
};
export declare const SEE_METHOD_LABELS: Record<SeeMethod, string>;
export declare const CO_STATUSES: readonly ["GREEN", "AMBER", "RED", "INSUFFICIENT_DATA"];
export type CoStatus = (typeof CO_STATUSES)[number];
export declare const RUN_STATUSES: readonly ["PREVIEW", "COMMITTED", "SUPERSEDED"];
export type RunStatus = (typeof RUN_STATUSES)[number];
export declare const MARK_SHEET_KINDS: readonly ["INTERNAL_PAPER", "SEE", "LAB", "PROJECT", "QUIZ", "ASSIGNMENT", "REASSESSMENT"];
export type MarkSheetKind = (typeof MARK_SHEET_KINDS)[number];
export declare const STUDENT_MARK_STATUSES: readonly ["PRESENT", "ATTEMPTED", "NOT_ATTEMPTED_DUE_TO_OR", "ABSENT", "NOT_EVALUATED", "EXEMPT"];
export type StudentMarkStatus = (typeof STUDENT_MARK_STATUSES)[number];
/** A mark counts toward CO evidence only when the alternative was actually attempted. */
export declare function isAttemptedMarkStatus(status: StudentMarkStatus | string | null | undefined): boolean;
/** Statuses whose marks are excluded from both numerator and denominator of a CO. */
export declare function isExcludedMarkStatus(status: StudentMarkStatus | string | null | undefined): boolean;
export declare const CYCLE_KINDS: readonly ["CO", "PO", "PSO"];
export type CycleKind = (typeof CYCLE_KINDS)[number];
export declare const CI_STATES: readonly ["DETECTED", "FACULTY_REVIEW_REQUIRED", "ACTION_PLANNED", "APPROVED_FOR_IMPLEMENTATION", "IN_PROGRESS", "IMPLEMENTED", "EVIDENCE_INCOMPLETE", "READY_FOR_REASSESSMENT", "REASSESSED", "TARGET_ACHIEVED", "TARGET_NOT_ACHIEVED", "SUBMITTED_FOR_REVIEW", "APPROVED", "CLOSED", "REOPENED"];
export type CiState = (typeof CI_STATES)[number];
export type StudentLevelThreshold = {
    minPercent: number;
    level: number;
};
export type AcademicPolicy = {
    code: string;
    version: string;
    name: string;
    coAttainmentScaleLevels: number;
    scaleMax: number;
    defaultCoTarget: number;
    defaultPoTarget: number;
    defaultPsoTarget: number;
    directWeight: number;
    indirectWeight: number;
    feedbackBenchmarkPercent: number;
    studentLevelThresholds: StudentLevelThreshold[];
    studentWeakPercent: number;
    amberBand: number;
    amberWeakStudentRatio: number;
    amberComponentGap: number;
    greenComfortMargin: number;
    deteriorationThreshold: number;
    coBelowTargetRequiresImprovement: boolean;
    poBelowTargetRequiresImprovement: boolean;
    reassessmentMandatoryForRed: boolean;
    evidenceMandatoryByIntervention: boolean;
    beforeAfterComparisonMandatory: boolean;
    facultyCannotSelfClose: boolean;
    closureRequiresApproval: boolean;
    seeMethodPriority: SeeMethod[];
    defaultCieSeeSplitWhenMissing: {
        cie: number;
        see: number;
    };
    formulaVersion: string;
    qualityScoreVersion: string;
};
export type WeightedPart = {
    key: string;
    label: string;
    value: number | null;
    weight: number;
};
export type WeightedResult = {
    result: number | null;
    usedWeight: number;
    missing: string[];
    formula: string;
    parts: Array<{
        key: string;
        label: string;
        value: number | null;
        weight: number;
        included: boolean;
    }>;
};
export type CoStatusInput = {
    actual: number | null;
    target: number;
    weakStudentRatio: number;
    weakComponentGap: number;
    previousActual?: number | null;
};
export type StudentQuestionMark = {
    studentKey: string;
    questionKey: string;
    coCode: string | null;
    awarded: number | null;
    maxMarks: number;
    status: StudentMarkStatus;
    bloomLevel?: string | null;
    difficulty?: string | null;
    topic?: string | null;
    module?: string | null;
    orGroupId?: string | null;
    orAlternative?: string | null;
};
export type StudentRow = {
    studentKey: string;
    usn: string;
    name?: string | null;
    status: StudentMarkStatus;
    totalAwarded?: number | null;
    totalMax?: number | null;
};
export type AssessmentSourceInput = {
    sourceKind: string;
    sourceId: number | string;
    sourceLabel: string;
    category: 'CIE' | 'SEE' | 'INDIRECT' | 'OTHER';
    weight: number;
    questions: Array<{
        questionKey: string;
        maxMarks: number;
        coCode: string | null;
        bloomLevel?: string | null;
        difficulty?: string | null;
        topic?: string | null;
        module?: string | null;
        orGroupId?: string | null;
        orAlternative?: string | null;
    }>;
    students: StudentRow[];
    marks: StudentQuestionMark[];
};
export type SeePaperQuestion = {
    questionKey: string;
    coCode: string | null;
    maxMarks: number;
};
export type MappingCell = {
    coCode: string;
    outcomeCode: string;
    strength: number;
};
