export type CoPerformanceRow = {
    coCode: string;
    questionCount: number;
    availableMarks: number;
    classAverageMarks: number;
    averagePercent: number | null;
};
/**
 * Per-CO class performance from evaluated submissions only.
 * This is NOT final CO attainment — just observed average performance.
 */
export declare function getAssignmentCoPerformance(assignmentId: number, collegeId: number): Promise<{
    assignmentId: number;
    evaluatedSubmissionCount: number;
    note: string;
    cos: CoPerformanceRow[];
}>;
/** Light helper for quiz CO performance using primary_co_code on quiz_questions. */
export declare function getQuizCoPerformance(quizId: number, collegeId: number): Promise<{
    quizId: number;
    evaluatedAttemptCount: number;
    note: string;
    cos: {
        coCode: string;
        questionCount: number;
        availableMarks: number;
        classAverageMarks: number;
        averagePercent: number | null;
    }[];
}>;
