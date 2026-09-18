import type { ManagementActor } from './types.js';
export declare function placementOverview(actor: ManagementActor, seasonId?: number): Promise<{
    analytics: import("./sources.js").SourceResult<{
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
    byDepartment: import("./sources.js").SourceResult<{
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
}>;
