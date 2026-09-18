import type { HostelNoDueReason, HostelNoDueStatus } from './types.js';
export declare function getHostelNoDueStatus(studentId: number, collegeId: number): Promise<{
    status: HostelNoDueStatus;
    reasons: HostelNoDueReason[];
}>;
export declare function getStudentClearance(studentId: number, collegeId: number): Promise<{
    hostel: {
        status: HostelNoDueStatus;
        reasons: HostelNoDueReason[];
        label: string;
    };
    overallClear: boolean;
}>;
