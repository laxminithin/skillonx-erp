import type { PlacementActor } from './types.js';
export declare function staffDashboard(actor: PlacementActor): Promise<{
    registeredStudents: number;
    applications: number;
    totalOffers: number;
    uniqueStudentsPlaced: number;
    openOpportunities: number;
    companyCount: number;
    driveCount: number;
}>;
export declare function managementAnalytics(actor: PlacementActor, seasonId?: number): Promise<{
    registeredPlacementSeeking: number;
    totalApplications: number;
    shortlisted: number;
    uniqueStudentsPlaced: number;
    totalOffers: number;
    joined: number;
    notJoined: number;
    placementPercentage: number;
    denominator: string;
    highestCtc: number | null;
    averageCtc: number | null;
    medianCtc: number | null;
    internships: number;
}>;
export declare function driveFunnel(actor: PlacementActor, opportunityId: number): Promise<{
    opportunityId: number;
    eligible: number;
    applied: number;
    shortlisted: number;
    offered: number;
    accepted: number;
    joined: number;
} | null>;
export declare function coordinatorDashboard(actor: PlacementActor): Promise<{
    departmentStudentCount: number;
    profileIncomplete: number;
    placedStudents: number;
    unplacedStudents: number;
}>;
export declare function departmentPlacementRates(actor: PlacementActor): Promise<{
    departments: {
        departmentId: number;
        departmentName: any;
        departmentCode: any;
        registered: number;
        placed: number;
        placementRate: number;
    }[];
    denominator: string;
}>;
export declare function bulkEligibilityReport(actor: PlacementActor, opportunityId: number): Promise<{
    eligible: number[];
    notEligible: number[];
    eligibleCount: number;
    notEligibleCount: number;
}>;
