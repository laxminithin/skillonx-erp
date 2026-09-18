export type AssignmentActor = {
    facultyUserId: number;
    collegeId: number;
    role: string;
};
export type AssignmentOwnership = {
    collegeId: number;
    createdBy: number;
};
export type AccessDecision = 'ALLOW' | 'NOT_FOUND' | 'FORBIDDEN';
export declare function decideAssignmentAccess(actor: AssignmentActor, assignment: AssignmentOwnership): AccessDecision;
export declare function canManageAllAssignments(role: string): boolean;
export declare function assertAssignmentAccessForActor(assignmentId: number, actor: AssignmentActor): Promise<AssignmentOwnership>;
