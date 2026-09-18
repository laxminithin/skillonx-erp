import type { HrActor } from './types.js';
import { attendanceSchemaReady } from './attendanceEngine.js';
declare const CLOSURE_STATUSES: readonly ["OPEN", "PROCESSING", "REVIEW", "FINALIZED", "LOCKED"];
export declare function getMonthClosure(actor: HrActor, year: number, month: number): Promise<{
    id: number;
    collegeId: number;
    year: number;
    month: number;
    status: unknown;
    exceptionCount: number;
    processedAt: unknown;
    finalizedAt: unknown;
    lockedAt: unknown;
    reopenedAt: unknown;
    reopenReason: unknown;
    calculationVersion: number;
} | {
    collegeId: number;
    year: number;
    month: number;
    status: string;
    exceptionCount: number;
}>;
export declare function detectExceptions(collegeId: number, year: number, month: number): Promise<Array<{
    type: string;
    employeeId: number;
    date?: string;
    message: string;
}>>;
export declare function processMonth(actor: HrActor, year: number, month: number): Promise<{
    closure: {
        id: number;
        collegeId: number;
        year: number;
        month: number;
        status: unknown;
        exceptionCount: number;
        processedAt: unknown;
        finalizedAt: unknown;
        lockedAt: unknown;
        reopenedAt: unknown;
        reopenReason: unknown;
        calculationVersion: number;
    } | {
        collegeId: number;
        year: number;
        month: number;
        status: string;
        exceptionCount: number;
    };
    processed: number;
    exceptions: {
        type: string;
        employeeId: number;
        date?: string;
        message: string;
    }[];
}>;
export declare function finalizeMonth(actor: HrActor, year: number, month: number): Promise<{
    id: number;
    collegeId: number;
    year: number;
    month: number;
    status: unknown;
    exceptionCount: number;
    processedAt: unknown;
    finalizedAt: unknown;
    lockedAt: unknown;
    reopenedAt: unknown;
    reopenReason: unknown;
    calculationVersion: number;
} | {
    collegeId: number;
    year: number;
    month: number;
    status: string;
    exceptionCount: number;
}>;
export declare function lockMonth(actor: HrActor, year: number, month: number): Promise<{
    id: number;
    collegeId: number;
    year: number;
    month: number;
    status: unknown;
    exceptionCount: number;
    processedAt: unknown;
    finalizedAt: unknown;
    lockedAt: unknown;
    reopenedAt: unknown;
    reopenReason: unknown;
    calculationVersion: number;
} | {
    collegeId: number;
    year: number;
    month: number;
    status: string;
    exceptionCount: number;
}>;
export declare function reopenMonth(actor: HrActor, year: number, month: number, reason: string): Promise<{
    id: number;
    collegeId: number;
    year: number;
    month: number;
    status: unknown;
    exceptionCount: number;
    processedAt: unknown;
    finalizedAt: unknown;
    lockedAt: unknown;
    reopenedAt: unknown;
    reopenReason: unknown;
    calculationVersion: number;
} | {
    collegeId: number;
    year: number;
    month: number;
    status: string;
    exceptionCount: number;
}>;
export { CLOSURE_STATUSES, attendanceSchemaReady };
