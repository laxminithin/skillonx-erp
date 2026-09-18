import type { HrActor } from './types.js';
export declare function recruitmentDashboard(actor: HrActor): Promise<{
    openRequisitions: number;
    publishedOpenings: number;
    activeApplications: number;
    issuedOffers: number;
    acceptedOffers: number;
    joined: number;
    interviewsScheduled: number;
}>;
export declare function pipelineReport(actor: HrActor, openingId?: number): Promise<{
    status: string;
    count: number;
}[]>;
export declare function timeToHireReport(actor: HrActor): Promise<{
    applicationId: number;
    openingId: number;
    appliedAt: any;
    joinedAt: any;
    daysToHire: number;
}[]>;
export declare function sourceEffectivenessReport(actor: HrActor): Promise<{
    source: string;
    candidates: number;
    applications: number;
    joined: number;
}[]>;
