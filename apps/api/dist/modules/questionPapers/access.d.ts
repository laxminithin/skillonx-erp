export type QpActor = {
    facultyUserId: number;
    collegeId: number;
    role: string;
    departmentId?: number | null;
};
export type PaperOwnership = {
    collegeId: number;
    createdBy: number;
    departmentId?: number | null;
};
export type AccessDecision = 'ALLOW' | 'NOT_FOUND' | 'FORBIDDEN';
export declare function canManageAllInternalPapers(role: string): boolean;
export declare function canViewCollegeInternalPapers(role: string): boolean;
export declare function canViewPreviousYearLibrary(role: string): boolean;
export declare function decideInternalPaperAccess(actor: QpActor, paper: PaperOwnership): AccessDecision;
export declare function decideInternalPaperMutateAccess(actor: QpActor, paper: PaperOwnership): AccessDecision;
export declare function assertInternalPaperAccess(paperId: number, actor: QpActor, mode?: 'read' | 'mutate'): Promise<PaperOwnership & {
    id: number;
    status: string;
}>;
