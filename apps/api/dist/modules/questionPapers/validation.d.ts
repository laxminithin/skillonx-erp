import { type Blueprint } from './generator.js';
export type ValidationIssue = {
    code: string;
    severity: 'CRITICAL' | 'WARNING';
    message: string;
    itemKey?: string | null;
    questionLabel?: string | null;
};
export type PaperValidationReport = {
    ok: boolean;
    canFinalize: boolean;
    issues: ValidationIssue[];
    requiredAnswerMarks: number;
    printedMarks: number;
    patternOk: boolean;
};
export type ValidatableItem = {
    itemKey: string;
    questionNumber: number;
    subLetter?: string | null;
    orAlternative?: string | null;
    orGroupId?: string | null;
    maxMarks: number;
    fingerprint?: string | null;
    primaryCo?: string | null;
    moduleId?: number | null;
    moduleOrUnit?: string | null;
    topicId?: number | null;
    bloomLevel?: string | null;
    rbtLevel?: string | null;
    difficulty?: string | null;
    modelAnswer?: string | null;
    scheme?: Array<{
        maxMarks: number;
        label?: string;
    }> | null;
    verificationStatus?: string | null;
    readinessStatus?: string | null;
    sourceKind?: string | null;
    sourceType?: string | null;
    coMappingBlocked?: boolean;
    needsFacultyVerification?: boolean;
};
export declare function validateInternalPaper(input: {
    maxMarks: number;
    requiredAnswerMarks?: number;
    patternMarks?: number[];
    blueprint: Blueprint | null;
    items: ValidatableItem[];
}): PaperValidationReport;
