export type AssignmentAuditAction = 'CREATED' | 'PUBLISHED' | 'SCHEDULE_CHANGED' | 'CLOSED' | 'REOPENED' | 'ARCHIVED' | 'DELETED' | 'DUPLICATED' | 'QUESTION_ADDED' | 'QUESTION_REMOVED' | 'EVALUATED' | 'RESULTS_RELEASED';
export declare function recordAssignmentAudit(entry: {
    collegeId: number;
    assignmentId: number;
    actorId?: number | null;
    actorName?: string | null;
    action: AssignmentAuditAction;
    metadata?: Record<string, unknown> | null;
}): Promise<void>;
export declare function listAssignmentAudit(assignmentId: number, collegeId: number): Promise<{
    id: any;
    action: any;
    createdAt: any;
    actor: any;
    metadata: Record<string, unknown> | null;
}[]>;
