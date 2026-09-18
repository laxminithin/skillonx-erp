export type SurveyAuditAction = 'CREATED' | 'PUBLISHED' | 'SCHEDULE_CHANGED' | 'EXTENDED' | 'CLOSED' | 'REOPENED' | 'ARCHIVED' | 'DELETED' | 'DUPLICATED';
/**
 * Record a lifecycle event. Auditing must never break the primary operation,
 * so failures here are swallowed after logging.
 */
export declare function recordSurveyAudit(entry: {
    collegeId: number;
    surveyId: number;
    actorId?: number | null;
    actorName?: string | null;
    action: SurveyAuditAction;
    metadata?: Record<string, unknown> | null;
}): Promise<void>;
export declare function listSurveyAudit(surveyId: number, collegeId: number): Promise<{
    id: any;
    action: any;
    createdAt: any;
    actor: any;
    metadata: Record<string, unknown> | null;
}[]>;
