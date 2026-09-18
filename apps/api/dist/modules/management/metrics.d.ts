export type InstitutionKpis = {
    students: number;
    faculty: number;
    programs: number;
    departments: number;
    studentAttendancePct: number | null;
    facultyAttendancePct: number | null;
    generatedAt: string;
};
export declare function institutionKpis(collegeId: number): Promise<InstitutionKpis>;
export type DeptRow = {
    departmentId: number;
    departmentName: string;
    departmentCode: string | null;
    students: number;
    faculty: number;
    studentAttendancePct: number | null;
    facultyAttendancePct: number | null;
    continuityExceptions: number;
    registered: number;
    placed: number;
    placementRate: number | null;
};
/**
 * Set-based per-department comparison. A bounded number of GROUP BY queries,
 * then assembled in memory. Only departments that actually have students or
 * faculty are returned (empty departments are institutional noise, never a real
 * 0-signal for leadership).
 */
export declare function departmentComparison(collegeId: number): Promise<DeptRow[]>;
