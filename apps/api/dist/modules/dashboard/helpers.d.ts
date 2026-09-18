/**
 * Pure helpers for lecturer dashboard aggregation — unit-tested without DB.
 */
export type AttentionSeverity = 'high' | 'medium' | 'low';
export type AttentionItemInput = {
    kind: string;
    severity: AttentionSeverity;
    title: string;
    count?: number;
    courseId?: number | null;
    courseCode?: string | null;
    href: string;
};
export type UpcomingItemInput = {
    at: string;
    kind: string;
    title: string;
    courseId?: number | null;
    courseCode?: string | null;
    href: string;
};
/** Faculty isolation: only the owner's id may appear in scoped queries. */
export declare function facultyScopeFilter(role: string, facultyUserId: number): {
    createdBy: number | null;
};
export declare function mapMappingStatus(dbStatus?: string | null): 'MISSING' | 'DRAFT' | 'FINALIZED' | 'IN_PROGRESS';
export declare function isActiveAssessmentStatus(effective: string): effective is "ACTIVE";
export declare function countReadyPlans(params: {
    courseCount: number;
    lessonPlansCreated: number;
    mappingsFinalized: number;
    gapCompleted: number;
    cbsCompleted: number;
    coEvalFinalized: number;
}): {
    ready: number;
    total: number;
};
export declare function sortAttentionItems(items: AttentionItemInput[]): AttentionItemInput[];
export declare function sortUpcomingItems(items: UpcomingItemInput[], limit?: number): UpcomingItemInput[];
export declare function resolveAcademicContext(rows: Array<{
    academicYearId?: number | null;
    academicYearLabel?: string | null;
    programId?: number | null;
    programName?: string | null;
    semesterId?: number | null;
    semesterLabel?: string | null;
}>): {
    academicYearId: number | null;
    academicYearLabel: string | null;
    programId: number | null;
    programName: string | null;
    semesterId: number | null;
    semesterLabel: string | null;
    multiContext: boolean;
};
export declare function assertFacultyIsolation(ownerId: number, resourceOwnerIds: number[]): boolean;
export declare function pendingEvaluationTotal(parts: {
    assignmentPending: number;
    quizManual: number;
    coEvalDrafts: number;
    openGaps: number;
}): number;
