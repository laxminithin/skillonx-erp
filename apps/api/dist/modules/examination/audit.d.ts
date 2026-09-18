type AuditInput = {
    collegeId: number;
    actorId?: number | null;
    actorType?: 'FACULTY' | 'STUDENT' | 'SYSTEM';
    actorName?: string | null;
    action: string;
    entityType: string;
    entityId?: number | null;
    beforeState?: unknown;
    afterState?: unknown;
    reason?: string | null;
};
export declare function recordExamAudit(input: AuditInput): Promise<void>;
export {};
