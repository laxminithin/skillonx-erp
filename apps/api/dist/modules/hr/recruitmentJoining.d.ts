import type { HrActor } from './types.js';
/**
 * Convert accepted candidate → employee via lifecycle createEmployeeRecord.
 * Idempotent on application_id. Does NOT create a second employee master.
 * Offer acceptance alone does NOT create an employee.
 */
export declare function completeJoining(actor: HrActor, applicationId: number, opts?: unknown): Promise<{
    idempotent: boolean;
    application: {
        id: number;
        collegeId: number;
        candidateId: number;
        openingId: number;
        status: unknown;
        source: unknown;
        salaryExpectation: number | null;
        coverLetter: unknown;
        screenedBy: number | null;
        screeningNotes: unknown;
        screeningDecision: unknown;
        screenedAt: unknown;
        shortlistBy: number | null;
        shortlistReason: unknown;
        shortlistedAt: unknown;
        selectedBy: number | null;
        selectionReason: unknown;
        selectedAt: unknown;
        employeeId: number | null;
        joinedAt: unknown;
        createdAt: unknown;
        updatedAt: unknown;
    };
    employee: {
        id: number;
        employeeNumber: any;
        employmentStatus: any;
    } | null;
}>;
export declare function convertCandidateToEmployee(actor: HrActor, applicationId: number, opts?: unknown): Promise<{
    idempotent: boolean;
    application: {
        id: number;
        collegeId: number;
        candidateId: number;
        openingId: number;
        status: unknown;
        source: unknown;
        salaryExpectation: number | null;
        coverLetter: unknown;
        screenedBy: number | null;
        screeningNotes: unknown;
        screeningDecision: unknown;
        screenedAt: unknown;
        shortlistBy: number | null;
        shortlistReason: unknown;
        shortlistedAt: unknown;
        selectedBy: number | null;
        selectionReason: unknown;
        selectedAt: unknown;
        employeeId: number | null;
        joinedAt: unknown;
        createdAt: unknown;
        updatedAt: unknown;
    };
    employee: {
        id: number;
        employeeNumber: any;
        employmentStatus: any;
    } | null;
}>;
