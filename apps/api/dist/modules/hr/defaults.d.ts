export declare function ensureCollegeHrmsDefaults(collegeId: number): Promise<void>;
export declare function getHrmsPolicy(collegeId: number): Promise<{
    employeeNumberSeries: any;
    leaveRequestSeries: any;
    emergencyLeaveEnabled: boolean;
    academicCoverageRequired: boolean;
}>;
