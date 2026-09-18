import type { LabActor } from './types.js';
/**
 * Oversight analytics for Lab In-charge / HOD / Principal / Management.
 * Scope is resolved by scopedLabIds (assignment → department → institution),
 * so the same function safely serves every oversight tier without leaking
 * out-of-scope labs.
 */
export declare function oversight(actor: LabActor): Promise<{
    scope: string;
    summary: {
        labs: number;
        operationalLabs: number;
        assets: number;
        faulty: number;
        underRepair: number;
        lowStockItems: number;
        openFaults: number;
        repairBacklog: number;
        pendingApprovals: number;
        avgReadinessPct: number;
    };
    departments: never[];
    labs: never[];
    faults: never[];
    pendingApprovals: never[];
    lowStock: never[];
    generatedAt?: undefined;
} | {
    scope: string;
    summary: {
        labs: number;
        operationalLabs: number;
        assets: any;
        faulty: any;
        underRepair: any;
        lowStockItems: number;
        openFaults: number;
        repairBacklog: number;
        pendingApprovals: number;
        avgReadinessPct: number;
    };
    departments: any[];
    labs: any[];
    faults: any[];
    pendingApprovals: {
        id: number;
        labId: number;
        labName: any;
        item: any;
        status: any;
        priority: any;
        requestType: any;
    }[];
    lowStock: {
        id: number;
        labId: number;
        name: any;
        currentStock: number;
        minThreshold: number;
    }[];
    generatedAt: string;
}>;
