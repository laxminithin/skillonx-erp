type AuditParams = {
    collegeId: number;
    actorId?: number | null;
    actorType?: 'FACULTY' | 'STUDENT' | 'SYSTEM';
    action: string;
    entityType: string;
    entityId?: number | null;
    beforeState?: unknown;
    afterState?: unknown;
    reason?: string | null;
};
export declare function recordLibraryAudit(params: AuditParams): Promise<void>;
export {};
