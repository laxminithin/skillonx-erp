import type { HrActor } from './types.js';
export declare function completionReport(actor: HrActor, cycleId?: number): Promise<{
    total: any;
    byStatus: Record<string, number>;
    completionPct: number;
    selfSubmitPct: number;
    reviewSubmitPct: number;
}>;
export declare function ratingDistribution(actor: HrActor, cycleId?: number): Promise<{
    total: any;
    byLabel: Record<string, number>;
    scores: {
        label: unknown;
        value: number | null;
        score: number | null;
    }[];
}>;
export declare function departmentSummary(actor: HrActor, cycleId?: number): Promise<{
    departmentId: number | null;
    departmentName: string | null;
    total: number;
    finalized: number;
    avgFinalScore: number | null;
}[]>;
export declare function goalCompletion(actor: HrActor, cycleId?: number): Promise<{
    total: number;
    byStatus: Record<string, number>;
    avgSelfProgress: number | null;
    approved: number;
    completed: number;
    locked: number;
}>;
export declare function pendingReviews(actor: HrActor, cycleId?: number): Promise<{
    appraisalId: number;
    status: unknown;
    employeeId: number;
    employeeName: unknown;
    employeeNumber: unknown;
    reviewerEmployeeId: number | null;
    reviewerName: {} | null;
    departmentId: number | null;
    selfSubmittedAt: unknown;
}[]>;
export declare function calibrationChanges(actor: HrActor, cycleId?: number): Promise<{
    id: number;
    appraisalId: number;
    employeeName: unknown;
    employeeNumber: unknown;
    departmentId: number | null;
    reviewerScoreBefore: number | null;
    calibratedScore: number;
    delta: number | null;
    calibratedRatingLabel: unknown;
    reason: unknown;
    actorFacultyId: number | null;
    createdAt: unknown;
}[]>;
export declare function developmentNeeds(actor: HrActor, cycleId?: number): Promise<{
    total: number;
    byArea: Record<string, number>;
    items: {
        id: number;
        appraisalId: number;
        employeeName: unknown;
        employeeNumber: unknown;
        departmentId: number | null;
        developmentArea: unknown;
        recommendedTraining: unknown;
        targetCompetency: unknown;
        status: unknown;
        dueDate: unknown;
        finalRatingLabel: unknown;
    }[];
}>;
