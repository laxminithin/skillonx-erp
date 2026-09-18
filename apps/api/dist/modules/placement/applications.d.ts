import type { PlacementActor } from './types.js';
export declare function listStudentOpportunities(studentId: number, collegeId: number, filter?: string): Promise<{
    id: number;
    companyId: number;
    companyName: unknown;
    title: unknown;
    role: unknown;
    opportunityType: unknown;
    workMode: unknown;
    ctcMin: number | null;
    ctcMax: number | null;
    stipend: number | null;
    currency: unknown;
    deadline: unknown;
    driveDate: unknown;
    status: unknown;
    eligibilityStatus: "ELIGIBLE" | "NOT_ELIGIBLE" | "ELIGIBLE_WITH_OVERRIDE";
    eligibilityReasons: {
        code: string;
        message: string;
        passed: boolean;
    }[];
    applicationStatus: string | null;
}[]>;
export declare function getStudentOpportunity(studentId: number, collegeId: number, opportunityId: number): Promise<{
    description: any;
    companyDescription: any;
    companyWebsite: any;
    bondDetails: any;
    instructions: any;
    eligibilityRules: any[];
    locations: any[];
    eligibility: import("./types.js").EligibilityResult;
    application: {
        id: number;
        status: any;
        applicationNumber: any;
    } | null;
    id: number;
    companyId: number;
    companyName: unknown;
    title: unknown;
    role: unknown;
    opportunityType: unknown;
    workMode: unknown;
    ctcMin: number | null;
    ctcMax: number | null;
    stipend: number | null;
    currency: unknown;
    deadline: unknown;
    driveDate: unknown;
    status: unknown;
    eligibilityStatus: "ELIGIBLE" | "NOT_ELIGIBLE" | "ELIGIBLE_WITH_OVERRIDE";
    eligibilityReasons: {
        code: string;
        message: string;
        passed: boolean;
    }[];
    applicationStatus: string | null;
}>;
export declare function applyToOpportunity(studentId: number, collegeId: number, opportunityId: number, resumeVersionId?: number): Promise<any>;
export declare function listStudentApplications(studentId: number, collegeId: number): Promise<{
    id: number;
    applicationNumber: any;
    status: any;
    appliedAt: any;
    companyName: any;
    title: any;
    role: any;
}[]>;
export declare function getStudentApplication(studentId: number, collegeId: number, applicationId: number): Promise<{
    id: number;
    applicationNumber: any;
    status: any;
    appliedAt: any;
    companyName: any;
    title: any;
    role: any;
    eligibilitySnapshot: any;
    rounds: {
        roundName: any;
        roundType: any;
        scheduledAt: any;
        status: any;
        result: any;
        score: number | null;
    }[];
    upcomingRounds: any[];
}>;
export declare function withdrawApplication(studentId: number, collegeId: number, applicationId: number, reason?: string): Promise<any>;
export declare function listStaffApplications(actor: PlacementActor, filters?: {
    opportunityId?: number;
    status?: string;
}): Promise<{
    id: number;
    applicationNumber: any;
    status: any;
    studentName: any;
    usn: any;
    companyName: any;
    title: any;
    appliedAt: any;
}[]>;
export declare function updateApplicationStatus(actor: PlacementActor, applicationId: number, status: string, reason?: string): Promise<any>;
export declare function importShortlist(actor: PlacementActor, opportunityId: number, rows: Array<{
    usn: string;
    roundResult?: string;
    score?: number;
}>, dryRun?: boolean): Promise<{
    dryRun: boolean;
    valid: number;
    errors: string[];
    updated?: undefined;
} | {
    dryRun: boolean;
    updated: number;
    errors: string[];
    valid?: undefined;
}>;
