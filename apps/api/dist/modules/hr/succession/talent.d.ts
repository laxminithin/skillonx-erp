import type { HrActor } from '../types.js';
import type { z } from 'zod';
import type { assessmentSchema, assessmentUpdateSchema, poolSchema, poolMemberSchema } from './types.js';
export declare function createAssessment(actor: HrActor, input: z.infer<typeof assessmentSchema>): Promise<{
    id: number;
    versionNo: number;
}>;
export declare function updateAssessment(actor: HrActor, id: number, input: z.infer<typeof assessmentUpdateSchema>): Promise<{
    id: number;
}>;
export declare function finalizeAssessment(actor: HrActor, id: number): Promise<{
    id: number;
    status: string;
    idempotent: boolean;
} | {
    id: number;
    status: string;
    idempotent?: undefined;
}>;
/** Correction of a finalized assessment → new DRAFT version (history preserved). */
export declare function correctAssessment(actor: HrActor, id: number): Promise<{
    id: number;
    versionNo: number;
    parentId: any;
}>;
export declare function listAssessments(actor: HrActor, opts?: {
    employeeId?: number;
    period?: string;
    status?: string;
}): Promise<any[]>;
/** Performance × Potential matrix from the latest FINALIZED assessment per employee. */
export declare function talentMatrix(actor: HrActor): Promise<{
    classifiedEmployees: number;
    matrix: {
        performance: "MEDIUM" | "HIGH" | "LOW";
        potential: "MEDIUM" | "HIGH" | "LOW";
        count: number;
    }[];
    sources: Record<string, number>;
    note: string;
}>;
export declare function createPool(actor: HrActor, input: z.infer<typeof poolSchema>): Promise<{
    id: number;
}>;
export declare function listPools(actor: HrActor): Promise<any[]>;
export declare function addPoolMember(actor: HrActor, poolId: number, input: z.infer<typeof poolMemberSchema>): Promise<{
    id: number;
    idempotent: boolean;
    reactivated?: undefined;
} | {
    id: number;
    reactivated: boolean;
    idempotent?: undefined;
} | {
    id: number;
    idempotent?: undefined;
    reactivated?: undefined;
}>;
export declare function removePoolMember(actor: HrActor, poolId: number, memberId: number): Promise<{
    id: number;
    idempotent: boolean;
    status?: undefined;
} | {
    id: number;
    status: string;
    idempotent?: undefined;
}>;
export declare function listPoolMembers(actor: HrActor, poolId: number): Promise<any[]>;
