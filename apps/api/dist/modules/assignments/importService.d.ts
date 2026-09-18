import { type AssignmentDifficulty, type AssignmentQuestionType, type AssignmentResponseFormat, type EvaluationRubric } from '../../types/assignment.js';
export type AssignmentImportCandidate = {
    key: string;
    file: string;
    relativePath: string;
    subjectHint: string | null;
    moduleHint: string | null;
    sourceReference: string | null;
    questionText: string;
    questionType: AssignmentQuestionType;
    responseFormat: AssignmentResponseFormat;
    marks: number;
    difficulty: AssignmentDifficulty | null;
    originalDifficulty: string | null;
    expectedAnswerGuidance: string | null;
    evaluationRubric: EvaluationRubric | Record<string, unknown> | null;
    primaryCoCode?: string | null;
    mappingBasis?: string | null;
    verificationStatus?: string | null;
    reviewStatus: 'APPROVED' | 'NEEDS_REVIEW';
    reviewNotes: string[];
    duplicateOfKey?: string;
};
export type AssignmentImportScanReport = {
    rootsInspected: string[];
    filesDiscovered: string[];
    subjectsDetected: string[];
    modulesDetected: string[];
    questionsFound: number;
    validQuestions: number;
    needsReview: number;
    duplicates: number;
    skippedFiles: string[];
    candidates: AssignmentImportCandidate[];
};
export declare function assignmentSearchRoots(): string[];
export declare function prettyFolderTitle(raw: string): string;
export declare function hintsFromAssessmentPath(file: string): {
    subjectHint: string;
    moduleHint: string | null;
};
export declare function parseAssignmentMarkdown(content: string, file: string, subjectHint: string | null, moduleHint: string | null): AssignmentImportCandidate[];
export declare function scanAssignmentFiles(rootOverride?: string): Promise<AssignmentImportScanReport>;
/** @deprecated Prefer scanAssignmentFiles */
export declare function scanAssignmentBank(root?: string): Promise<{
    assessmentsRoot: string;
    files: string[];
    candidates: AssignmentImportCandidate[];
}>;
export declare function fingerprint(text: string): string;
