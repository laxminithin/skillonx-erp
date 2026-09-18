export declare function recordTransportAudit(input: {
    collegeId: number;
    actorId?: number | null;
    actorType?: string;
    action: string;
    entityType: string;
    entityId?: number | null;
    beforeState?: unknown;
    afterState?: unknown;
    reason?: string | null;
}): Promise<void>;
