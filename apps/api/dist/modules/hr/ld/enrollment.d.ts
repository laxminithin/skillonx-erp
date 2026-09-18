import type { Knex } from 'knex';
import type { HrActor } from '../types.js';
import type { z } from 'zod';
import type { nominationSchema } from './types.js';
export declare function createNomination(actor: HrActor, input: z.infer<typeof nominationSchema>): Promise<{
    id: number;
    status: any;
    idempotent: boolean;
    enrollmentId?: undefined;
} | {
    id: null;
    enrollmentId: number;
    status: any;
    idempotent: boolean;
} | {
    id: number;
    status: string;
    idempotent?: undefined;
    enrollmentId?: undefined;
}>;
/**
 * Decide a nomination. Managers move SUBMITTED→MANAGER_APPROVED; L&D/HR approvers
 * move to APPROVED (converting to an enrollment). A nominee can never approve
 * their own nomination.
 */
export declare function decideNomination(actor: HrActor, nominationId: number, decision: 'APPROVE' | 'REJECT', reason?: string): Promise<{
    id: number;
    status: any;
    idempotent: boolean;
    enrollment?: undefined;
} | {
    id: number;
    status: string;
    idempotent?: undefined;
    enrollment?: undefined;
} | {
    id: number;
    status: string;
    enrollment: {
        id: number;
        status: string;
        waitlistPosition: number | null;
        idempotent?: boolean;
    };
    idempotent?: undefined;
}>;
export declare function withdrawNomination(actor: HrActor, nominationId: number): Promise<{
    id: number;
    status: any;
    idempotent: boolean;
} | {
    id: number;
    status: string;
    idempotent?: undefined;
}>;
export declare function enroll(actor: HrActor, programId: number, forEmployeeId?: number): Promise<{
    id: number;
    status: string;
    waitlistPosition: number | null;
    idempotent?: boolean;
}>;
/**
 * Capacity-safe seat confirmation. MUST be called inside a transaction that has
 * already locked the program row (forUpdate) so concurrent callers serialize.
 * Idempotent: an existing active enrollment is returned unchanged.
 */
export declare function confirmSeat(trx: Knex.Transaction, collegeId: number, program: Record<string, unknown>, employeeId: number, nominationId: number | null): Promise<{
    id: number;
    status: string;
    waitlistPosition: number | null;
    idempotent?: boolean;
}>;
export declare function cancelEnrollment(actor: HrActor, enrollmentId: number): Promise<{
    id: number;
    status: any;
    idempotent: boolean;
    promoted?: undefined;
} | {
    id: number;
    status: string;
    promoted: number | null;
    idempotent?: undefined;
}>;
export declare function listProgramEnrollments(actor: HrActor, programId: number): Promise<any[]>;
export declare function listMyEnrollments(actor: HrActor): Promise<any[]>;
