type AuditInput = {
    collegeId: number;
    actorId?: number | null;
    actorType?: string;
    action: string;
    entityType: string;
    entityId?: number | null;
    beforeState?: unknown;
    afterState?: unknown;
    reason?: string | null;
};
export declare function recordPlacementAudit(input: AuditInput): Promise<void>;
export {};
