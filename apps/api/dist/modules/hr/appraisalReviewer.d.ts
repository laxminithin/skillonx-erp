import type { HrActor } from './types.js';
type Row = Record<string, unknown>;
/**
 * Resolve appraisal reviewer for an employee as of a cutoff date.
 *
 * Transfer policy: caller should pass cycle.review_cutoff_date ?? cycle.review_end
 * ?? cycle.period_end so department / reporting_manager as of that date is used.
 *
 * Prefer reporting_manager_employee_id when set, active, and not the subject.
 * Else faculty/HOD path via academic leave approver (HOD for faculty, Principal for HOD).
 * Principal: only configured reporting manager; otherwise null (HR must assign).
 * NEVER returns the subject as reviewer.
 */
export declare function resolveAppraisalReviewer(employeeId: number, collegeId: number, asOfDate: string): Promise<{
    reviewerEmployeeId: number | null;
    source: string | null;
    asOf: string;
}>;
/**
 * Assert actor may submit/edit a review for this appraisal.
 * Blocks self-review. Reviewer match, HR calibrate/manage, or Principal→HOD / HOD dept scope.
 */
export declare function assertCanReviewAppraisal(actor: HrActor, appraisalRow: Row): Promise<void>;
/**
 * Assert actor may view an appraisal.
 * Employee (self), assigned reviewer, HR view, or Principal institution overview.
 */
export declare function assertCanViewAppraisal(actor: HrActor, appraisal: Row, opts?: {
    includePrivateNotes?: boolean;
}): Promise<{
    canSeeReviewerPrivateNotes: boolean;
    canSeeHrNotes: boolean;
}>;
export declare function assertNotSelfReview(actor: HrActor, employeeId: number): Promise<void>;
/** Require performance view permission for HR-scoped reads. */
export declare function requirePerformanceView(actor: HrActor): void;
export {};
