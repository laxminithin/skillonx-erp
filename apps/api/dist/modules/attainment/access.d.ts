export type AttainmentActor = {
    facultyUserId: number;
    collegeId: number;
    role: string;
    departmentId?: number | null;
};
export type OwnedRecord = {
    collegeId: number;
    createdBy: number;
    departmentId?: number | null;
};
export type AccessDecision = 'ALLOW' | 'NOT_FOUND' | 'FORBIDDEN';
export declare function canManageAllAttainment(role: string): boolean;
export declare function canViewCollegeAttainment(role: string): boolean;
export declare function decideAttainmentAccess(actor: AttainmentActor, record: OwnedRecord): AccessDecision;
export declare function decideAttainmentMutateAccess(actor: AttainmentActor, record: OwnedRecord): AccessDecision;
export declare function assertRunAccess(runId: number, actor: AttainmentActor, mode?: 'read' | 'mutate'): Promise<{
    id: number;
    collegeId: number;
    createdBy: number;
    departmentId: number | null;
    status: string;
}>;
export declare function assertCycleAccess(cycleId: number, actor: AttainmentActor, mode?: 'read' | 'mutate' | 'review'): Promise<{
    id: number;
    collegeId: number;
    createdBy: number;
    departmentId: number | null;
    state: string;
}>;
export declare function assertSheetAccess(sheetId: number, actor: AttainmentActor, mode?: 'read' | 'mutate'): Promise<{
    id: number;
    collegeId: number;
    createdBy: number;
    departmentId: number | null;
    status: string;
    frozen: boolean;
}>;
