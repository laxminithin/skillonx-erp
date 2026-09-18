import type { LabActor } from './types.js';
/**
 * Single aggregated operational dashboard. All counts are batched grouped
 * queries (never per-asset loops) and the independent queries run in parallel.
 */
export declare function labAssistantDashboard(actor: LabActor): Promise<{
    summary: {
        labs: number;
        activeAssets: number;
        faultyAssets: number;
        underRepair: number;
        lowStockItems: number;
        overdueItems: number;
        itemsAwaitingReturn: number;
        openFaults: number;
        pendingRepairs: number;
        pendingSoftwareRequests: number;
        pendingRequirements: number;
        sessionsNeedingPrep: number;
        readinessPct: number;
    };
    actionRequired: {
        faultyAssets: any[];
        overdueItems: any[];
        lowStock: {
            id: number;
            labId: number;
            name: any;
            currentStock: number;
            minThreshold: number;
            unit: any;
        }[];
        sessionsNeedingPrep: any[];
    };
    todaySessions: any[];
    upcomingSessions: any[];
    health: {
        active: number;
        available: number;
        inUse: number;
        faulty: number;
        underRepair: number;
        reserved: number;
        retired: number;
        lost: number;
    };
    labHealth: {
        readinessPct: number;
        available: number;
        total: number;
        faulty: number;
        underRepair: number;
        labId: number;
        labName: any;
    }[];
    recentActivity: {
        action: any;
        entityType: any;
        entityId: any;
        at: any;
    }[];
}>;
