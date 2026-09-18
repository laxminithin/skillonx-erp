import type { MaintActor } from './types.js';
/**
 * Operational reports + recurring-issue analytics. All deterministic aggregated
 * SQL — evidence and counts only, NO opaque AI. HOD reports are scoped to their
 * department(s); manager/principal/management see the whole college.
 */
export declare function reports(actor: MaintActor): Promise<{
    summary: {
        open: number;
        byStatus: Record<string, number>;
        avgResolutionHours: number | null;
        slaCompliance: number | null;
        slaSampleSize: number;
        reopened: number;
        pendingParts: number;
    };
    byCategory: {
        category: string;
        kind: string;
        count: number;
    }[];
    byPriority: {
        priority: string;
        count: number;
    }[];
    byTeam: {
        team: any;
        total: number;
        open: number;
        resolved: number;
    }[];
    byLocation: {
        room: string;
        building: string;
        count: number;
    }[];
    itVsFacilities: {
        kind: string;
        count: number;
    }[];
    recurring: {
        byAsset: {
            assetRef: string;
            failures: number;
        }[];
        byRoomCategory: {
            room: any;
            building: any;
            category: any;
            occurrences: number;
        }[];
    };
}>;
/**
 * Recurring-issue detection — deterministic. Surfaces repeated failures with
 * evidence (counts), never a black-box score.
 */
export declare function recurringIssues(actor: MaintActor, deptFilter?: number[] | null): Promise<{
    byAsset: {
        assetRef: string;
        failures: number;
    }[];
    byRoomCategory: {
        room: any;
        building: any;
        category: any;
        occurrences: number;
    }[];
}>;
