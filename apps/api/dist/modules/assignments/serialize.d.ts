/**
 * Submission snapshots are stored as a flat question array.
 * Published assignment snapshots use `{ questions: [...] }`.
 * Accept both shapes so evaluate/detail never silently see zero questions.
 */
export declare function parseSnapshotQuestions(raw: unknown): SnapshotAssignmentQuestion[];
export type PublicAssignmentQuestion = {
    id: number | string;
    questionText: string;
    questionType: string;
    responseFormat: string;
    marks: number;
    difficulty: string | null;
    sortOrder?: number;
};
export type SnapshotAssignmentQuestion = PublicAssignmentQuestion & {
    bankQuestionId?: number | null;
    moduleId?: number | null;
    moduleName?: string | null;
    expectedAnswerGuidance?: string | null;
    modelSolution?: string | null;
    evaluationRubric?: unknown;
    evaluationScheme?: unknown;
    expectedKeyPoints?: string[];
    facultyNotes?: string | null;
    primaryCoCode?: string | null;
    primaryCoId?: number | null;
    secondaryCoCodes?: string[] | null;
    mappingBasis?: string | null;
    mappingSource?: string | null;
    verificationStatus?: string | null;
    derivedOutcomes?: unknown;
};
export declare function toPublicAssignmentQuestion(question: SnapshotAssignmentQuestion): PublicAssignmentQuestion;
export declare function collectForbiddenKeys(value: unknown, found?: Set<string>): string[];
export declare function assertNoAnswerLeak(payload: unknown, context: string): void;
export declare function canShowAssignmentSolutions(params: {
    policy: string | null | undefined;
    dueAt: Date | string | null | undefined;
    solutionsReleasedAt: Date | string | null | undefined;
    evaluationComplete: boolean;
    now?: Date;
}): boolean;
export declare function canShowAssignmentMarks(params: {
    showMarksImmediately: boolean;
    resultsReleased: boolean;
    evaluationStatus: string;
}): boolean;
