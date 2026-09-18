import { AppError } from '../../utils/errors.js';
export type LeaveAcademicApprover = {
    employeeId: number;
    facultyUserId: number | null;
    role: 'HOD' | 'PRINCIPAL';
    departmentId: number | null;
    source: 'ASSIGNMENT' | 'LEGACY_ROLE';
};
/**
 * Resolve the academic approver for a leave request.
 * Normal faculty → active HOD of the employee's department.
 * Active HOD → active Principal of the college.
 */
export declare function resolveLeaveAcademicApprover(employeeId: number, collegeId: number, leaveRequestDate?: string): Promise<LeaveAcademicApprover | null>;
export declare function tryResolveLeaveAcademicApprover(employeeId: number, collegeId: number, leaveRequestDate?: string): Promise<{
    approver: LeaveAcademicApprover | null;
    error?: AppError;
}>;
