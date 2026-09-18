export type EligibilitySnapshot = {
    collegeId?: number | null;
    programId?: number | null;
    departmentId?: number | null;
    semesterId?: number | null;
    classSectionId?: number | null;
    schemeId?: number | null;
    academicYearId?: number | null;
};
export type EligibilityLabels = {
    departmentCode?: string | null;
    departmentName?: string | null;
    semesterLabel?: string | null;
    semesterNumber?: number | null;
    sectionLabel?: string | null;
};
export type EligibilityMismatch = {
    field: string;
    expected: string;
    actual: string;
};
export type EligibilityResult = {
    ok: true;
} | {
    ok: false;
    code: 'MISMATCH';
    message: string;
    mismatches: EligibilityMismatch[];
};
export declare function describeClass(labels: EligibilityLabels): string;
export declare function evaluateClassEligibility(student: EligibilitySnapshot, academicClass: EligibilitySnapshot, labels: {
    class: EligibilityLabels;
    student: EligibilityLabels;
}): EligibilityResult;
export declare function snapshotFromRegistration(row: Record<string, unknown> | null | undefined): EligibilitySnapshot;
