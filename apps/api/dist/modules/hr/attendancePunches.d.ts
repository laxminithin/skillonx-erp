import type { HrActor } from './types.js';
export declare function importPunch(collegeId: number, input: {
    employeeId: number;
    punchAt: string;
    punchType?: string | null;
    source?: string;
    deviceId?: string | null;
    externalEventId?: string | null;
    rawMetadata?: unknown;
}): Promise<{
    id: number;
    duplicate: boolean;
}>;
export declare function importPunchesBatch(actor: HrActor, punches: Array<{
    employeeId: number;
    punchAt: string;
    punchType?: string | null;
    source?: string;
    deviceId?: string | null;
    externalEventId?: string | null;
}>): Promise<{
    imported: number;
    duplicates: number;
}>;
export declare function recordManualPunch(actor: HrActor, input: {
    employeeId: number;
    punchAt: string;
    punchType: string;
}): Promise<{
    id: number;
    duplicate: boolean;
}>;
