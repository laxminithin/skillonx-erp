import type { HostelVisibility } from './types.js';
export declare function getStudentHostelAccess(studentId: number, collegeId: number): Promise<{
    visibility: HostelVisibility;
    canApply: boolean;
    canAccessResidentFeatures: boolean;
    residentId?: undefined;
    hostelId?: undefined;
    currentAllocationId?: undefined;
    applicationId?: undefined;
} | {
    visibility: HostelVisibility;
    canApply: boolean;
    residentId: number;
    hostelId: number;
    currentAllocationId: number | undefined;
    canAccessResidentFeatures: boolean;
    applicationId?: undefined;
} | {
    visibility: HostelVisibility;
    canApply: boolean;
    applicationId: number;
    canAccessResidentFeatures: boolean;
    residentId?: undefined;
    hostelId?: undefined;
    currentAllocationId?: undefined;
} | {
    visibility: HostelVisibility;
    canApply: boolean;
    applicationId: number;
    residentId: number;
    canAccessResidentFeatures: boolean;
    hostelId?: undefined;
    currentAllocationId?: undefined;
} | {
    visibility: HostelVisibility;
    canApply: boolean;
    residentId: number;
    canAccessResidentFeatures: boolean;
    hostelId?: undefined;
    currentAllocationId?: undefined;
    applicationId?: undefined;
}>;
