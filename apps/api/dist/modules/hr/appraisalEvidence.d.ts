export type AppraisalEvidenceItem = {
    evidenceKey: string;
    sourceModule: string;
    sourceRef?: string | null;
    sourcePeriod?: string | null;
    valueNumeric?: number | null;
    valueDisplay?: string | null;
    payload?: Record<string, unknown> | null;
    criterionId?: number | null;
};
/**
 * Collect read-only evidence from Attendance / Academic / Survey / T&P.
 * Does not invent RESULTS aggregates — returns N/A when no safe source exists.
 * Does not accept arbitrary client source IDs.
 */
export declare function collectEvidenceForEmployee(collegeId: number, employeeId: number, periodStart: string, periodEnd: string, facultyUserId: number | null): Promise<AppraisalEvidenceItem[]>;
export declare function snapshotEvidence(appraisalId: number, collegeId: number, employeeId: number, items: AppraisalEvidenceItem[], snapshotVersion: number): Promise<number>;
export declare function getSnapshots(appraisalId: number): Promise<{
    id: number;
    appraisalId: number;
    collegeId: number;
    employeeId: number;
    criterionId: number | null;
    sourceModule: string;
    evidenceKey: string;
    sourceRef: string;
    sourcePeriod: string;
    valueNumeric: number | null;
    valueDisplay: string;
    payload: any;
    calculationVersion: string;
    snapshotVersion: number;
    snapshotAt: unknown;
}[]>;
