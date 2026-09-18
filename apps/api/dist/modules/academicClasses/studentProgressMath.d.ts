export type ProgressCounts = {
    done: number;
    total: number;
};
export type ProgressInputs = {
    topics: ProgressCounts;
    assignments: ProgressCounts;
    quizzes: ProgressCounts;
    activities: ProgressCounts;
};
export declare const PROGRESS_WEIGHTS: {
    readonly topics: 40;
    readonly assignments: 25;
    readonly quizzes: 25;
    readonly activities: 10;
};
export declare function ratio(counts: ProgressCounts): number | null;
export declare function combineProgress(input: ProgressInputs): number;
export declare function coBand(percentage: number | null): {
    label: string;
    tone: "muted";
} | {
    label: string;
    tone: "success";
} | {
    label: string;
    tone: "warning";
} | {
    label: string;
    tone: "danger";
};
export declare function mapAssignmentStatus(row: {
    status?: string | null;
    submittedAt?: Date | string | null;
    isLate?: boolean;
    evaluationStatus?: string | null;
    resultsReleased?: boolean;
    obtainedMarks?: number | null;
}): "DRAFT" | "SUBMITTED" | "EVALUATED" | "NOT_STARTED" | "LATE" | "RETURNED";
export declare function mapAssessmentStatus(row: {
    frozen?: boolean;
    hasScore?: boolean;
    date?: Date | string | null;
}): "COMPLETED" | "RESULT_RELEASED" | "RESULT_PENDING" | "UPCOMING";
