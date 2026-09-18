import type { ManagementActor } from './types.js';
export declare const THRESHOLDS: {
    readonly LOW_ATTENDANCE_PCT: 75;
    readonly LOW_PLACEMENT_PCT: 40;
};
export type ExceptionItem = {
    id: string;
    category: 'ACADEMICS' | 'HR' | 'FINANCE' | 'PLACEMENT' | 'CAMPUS';
    severity: 'HIGH' | 'MEDIUM';
    reason: string;
    metric: string;
    rule: string;
    scope: string;
    timestamp: string;
    drilldown: string;
};
export declare function listExceptions(actor: ManagementActor): Promise<{
    items: ExceptionItem[];
    total: number;
    byCategory: Record<string, number>;
    generatedAt: string;
}>;
