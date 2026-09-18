export declare function recordCbsAudit(input: {
    collegeId: number;
    planId: number;
    itemId?: number | null;
    actorId?: number | null;
    actorName?: string | null;
    action: string;
    metadata?: Record<string, unknown> | null;
}): Promise<void>;
export declare function listCbsAudit(planId: number, collegeId: number): Promise<any[]>;
