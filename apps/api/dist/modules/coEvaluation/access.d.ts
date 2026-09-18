export type CoEvalActor = {
    facultyUserId: number;
    collegeId: number;
    role: string;
    departmentId?: number | null;
};
export type CoEvalOwnership = {
    collegeId: number;
    createdBy: number;
    departmentId?: number | null;
};
export type AccessDecision = 'ALLOW' | 'NOT_FOUND' | 'FORBIDDEN';
export declare function canManageAllCoEvaluations(role: string): boolean;
export declare function canViewCollegeCoEvaluations(role: string): boolean;
export declare function decideCoEvaluationAccess(actor: CoEvalActor, evaluation: CoEvalOwnership): AccessDecision;
export declare function decideCoEvaluationMutateAccess(actor: CoEvalActor, evaluation: CoEvalOwnership): AccessDecision;
export declare function assertCoEvaluationAccess(evaluationId: number, actor: CoEvalActor, mode?: 'read' | 'mutate'): Promise<CoEvalOwnership & {
    id: number;
    status: string;
}>;
