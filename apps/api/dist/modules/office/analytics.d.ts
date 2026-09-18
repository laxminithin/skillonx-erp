import type { ServicesActor } from '../studentServices/types.js';
/** College-scoped, aggregate-only Office analytics. */
export declare function managementOfficeAnalytics(actor: ServicesActor): Promise<{
    totalRequests: number;
    pending: number;
    overdue: number;
    issuedDocuments: number;
    averageTurnaroundHours: number;
    slaCompliance: number;
    inwardVolume: number;
    outwardDispatchVolume: number;
}>;
