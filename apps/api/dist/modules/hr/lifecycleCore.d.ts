import type { HrActor } from './types.js';
type Row = Record<string, unknown>;
type Trx = import('knex').Knex.Transaction;
export declare const STATUS_TRANSITIONS: Record<string, string[]>;
export declare function assertStatusTransition(from: string, to: string): void;
export declare function recordServiceEvent(trx: Trx, params: {
    collegeId: number;
    employeeId: number;
    eventType: string;
    effectiveDate: string;
    details?: unknown;
    notes?: string | null;
    recordedBy?: number | null;
}): Promise<any>;
export declare function closeActiveEmploymentRecord(trx: Trx, employeeId: number, effectiveTo: string): Promise<void>;
export declare function createEmploymentRecord(trx: Trx, params: {
    collegeId: number;
    employeeId: number;
    employmentTypeId?: number | null;
    departmentId?: number | null;
    designationId?: number | null;
    reportingManagerEmployeeId?: number | null;
    effectiveFrom: string;
    status?: string;
    createdBy?: number | null;
    remarks?: string | null;
}): Promise<number | null>;
export declare function resolveProbationPolicy(collegeId: number, employee: Row): Promise<{
    probationRequired: any;
    defaultDurationDays: number;
    reviewBeforeDays: number;
    extensionsAllowed: any;
    maxExtensions: number;
}>;
export declare function ensureOnboardingTemplate(collegeId: number): Promise<void>;
export declare function initializeOnboarding(trx: Trx, collegeId: number, employeeId: number): Promise<any>;
export declare function checkOnboardingComplete(employeeId: number, allowOverride?: boolean): Promise<{
    complete: boolean;
    missing: string[];
}>;
export declare function transitionEmploymentStatus(trx: Trx, actor: HrActor, employeeId: number, toStatus: string, effectiveDate: string, eventType: string, details?: unknown, reason?: string): Promise<void>;
export declare function validateDuplicateEmployee(collegeId: number, params: {
    officialEmail?: string | null;
    facultyUserId?: number | null;
    employeeNumber?: string | null;
    excludeId?: number;
}): Promise<void>;
export declare function validateCollegeRefs(collegeId: number, params: {
    departmentId?: number | null;
    designationId?: number | null;
    employmentTypeId?: number | null;
    reportingManagerEmployeeId?: number | null;
}): Promise<void>;
export declare function buildDisplayName(first: string, middle: string | null | undefined, last: string, title?: string | null): string;
export declare function getActiveEmploymentRecord(employeeId: number): Promise<any>;
export {};
