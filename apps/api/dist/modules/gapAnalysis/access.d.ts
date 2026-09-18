export type GapActor = {
    facultyUserId: number;
    collegeId: number;
    role: string;
    departmentId?: number | null;
};
export type GapOwnership = {
    collegeId: number;
    createdBy: number;
    departmentId?: number | null;
};
export type AccessDecision = 'ALLOW' | 'NOT_FOUND' | 'FORBIDDEN';
export declare function canManageAllGapAnalyses(role: string): boolean;
export declare function canViewCollegeGapAnalyses(role: string): boolean;
export declare function decideGapAnalysisAccess(actor: GapActor, analysis: GapOwnership): AccessDecision;
export declare function decideGapAnalysisMutateAccess(actor: GapActor, analysis: GapOwnership): AccessDecision;
export declare function assertGapAnalysisAccess(analysisId: number, actor: GapActor, mode?: 'read' | 'mutate'): Promise<GapOwnership & {
    id: number;
    status: string;
}>;
