import type { HrActor } from './types.js';
export declare function runHrLifecycleJobs(collegeId?: number): Promise<{
    careerActionsApplied: number;
    separationsFinalized: number;
    contractsMarkedExpiring: number;
    probationAlerts: number;
    contractAlerts: number;
    retirementAlerts: number;
}>;
export declare function hrActionQueue(actor: HrActor): Promise<{
    type: string;
    priority: string;
    label: string;
    employeeId?: number;
    relatedId?: number;
}[]>;
export declare function enhancedHrAdminDashboard(actor: HrActor): Promise<{
    totalEmployees: number;
    facultyEmployees: number;
    nonTeachingEmployees: number;
    activeEmployees: number;
    probationEmployees: number;
    employeesOnNotice: number;
    joiningSoon: number;
    contractsExpiring: number;
    incompleteOnboarding: number;
    clearancePending: number;
    openHrActions: number;
    actionQueue: {
        type: string;
        priority: string;
        label: string;
        employeeId?: number;
        relatedId?: number;
    }[];
}>;
export declare function hrReports(actor: HrActor, reportType: string): Promise<{
    reportType: string;
    generatedAt: string;
    count: number;
    rows: {
        employeeNumber: unknown;
        displayName: unknown;
        department: unknown;
        designation: unknown;
        employmentType: unknown;
        status: unknown;
        category: unknown;
        dateOfJoining: unknown;
    }[];
}>;
