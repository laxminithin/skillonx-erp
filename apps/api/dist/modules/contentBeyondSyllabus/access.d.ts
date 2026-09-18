export type CbsActor = {
    facultyUserId: number;
    collegeId: number;
    role: string;
    departmentId?: number | null;
};
export type CbsOwnership = {
    collegeId: number;
    createdBy: number;
    departmentId?: number | null;
};
export type AccessDecision = 'ALLOW' | 'NOT_FOUND' | 'FORBIDDEN';
export declare function canManageAllCbsPlans(role: string): boolean;
export declare function canViewCollegeCbsPlans(role: string): boolean;
export declare function decideCbsPlanAccess(actor: CbsActor, plan: CbsOwnership): AccessDecision;
export declare function decideCbsPlanMutateAccess(actor: CbsActor, plan: CbsOwnership): AccessDecision;
export declare function assertCbsPlanAccess(planId: number, actor: CbsActor, mode?: 'read' | 'mutate'): Promise<CbsOwnership & {
    id: number;
    status: string;
}>;
