/**
 * Resolve the [from, to] leave window from a request's form_data. Supports the
 * day-range leave type (fromDate/toDate) and the single-day permission type
 * (onDate). Returns null when no usable dates are present.
 */
export declare function resolveLeaveWindow(formData: Record<string, unknown>): {
    from: string;
    to: string;
} | null;
export type LeaveReconciliation = {
    applied: boolean;
    window: {
        from: string;
        to: string;
    } | null;
    reclassified: number;
};
/**
 * Reconcile attendance for a fully-approved leave/permission request.
 * Caller must have already verified the request belongs to `collegeId` and is
 * approved/completed. Safe to call more than once.
 */
export declare function applyApprovedLeaveToAttendance(collegeId: number, requestId: number, actorFacultyId: number | null): Promise<LeaveReconciliation>;
/** Whether a request type should trigger attendance reconciliation on approval. */
export declare function isLeaveType(typeRow: {
    code?: unknown;
    category?: unknown;
} | null | undefined): boolean;
