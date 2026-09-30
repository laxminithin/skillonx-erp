type AuditInput = {
    collegeId: number;
    actorId?: number | null;
    actorType?: 'FACULTY' | 'STUDENT' | 'PARENT' | 'SYSTEM';
    actorName?: string | null;
    action: string;
    entityType: string;
    entityId?: number | null;
    beforeState?: unknown;
    afterState?: unknown;
    reason?: string | null;
};
export declare function recordServicesAudit(input: AuditInput): Promise<void>;
export {};
