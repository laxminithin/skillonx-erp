export type QuizAuditAction = 'CREATED' | 'PUBLISHED' | 'SCHEDULE_CHANGED' | 'EXTENDED' | 'CLOSED' | 'REOPENED' | 'ARCHIVED' | 'DELETED' | 'DUPLICATED' | 'ANSWER_KEY_CHANGED' | 'QUESTION_ADDED' | 'QUESTION_REMOVED';
export declare function recordQuizAudit(entry: {
    collegeId: number;
    quizId: number;
    actorId?: number | null;
    actorName?: string | null;
    action: QuizAuditAction;
    metadata?: Record<string, unknown> | null;
}): Promise<void>;
export declare function listQuizAudit(quizId: number, collegeId: number): Promise<{
    id: any;
    action: any;
    createdAt: any;
    actor: any;
    metadata: Record<string, unknown> | null;
}[]>;
