export type LessonAuditAction = 'CREATED' | 'GENERATED' | 'ACTIVATED' | 'RESCHEDULED' | 'FUTURE_SCHEDULE_SHIFTED' | 'TOPIC_ADDED' | 'TOPIC_EDITED' | 'TOPIC_SPLIT' | 'TOPIC_MERGED' | 'TOPIC_REORDERED' | 'LESSON_COMPLETED' | 'LESSON_SKIPPED' | 'COMPLETED_ENTRY_CORRECTED' | 'ARCHIVED' | 'DELETED' | 'HOLIDAY_CONFLICT_FLAGGED';
export declare function recordLessonAudit(entry: {
    collegeId: number;
    planId: number;
    actorId?: number | null;
    actorName?: string | null;
    action: LessonAuditAction;
    metadata?: Record<string, unknown> | null;
}): Promise<void>;
export declare function listLessonAudit(planId: number, collegeId: number): Promise<{
    id: any;
    action: any;
    createdAt: any;
    actor: any;
    metadata: Record<string, unknown> | null;
}[]>;
