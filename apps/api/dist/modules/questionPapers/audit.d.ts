export declare function recordQpAudit(input: {
    collegeId: number;
    paperId: number;
    itemId?: number | null;
    actorId?: number | null;
    actorName?: string | null;
    action: string;
    metadata?: Record<string, unknown> | null;
}): Promise<void>;
