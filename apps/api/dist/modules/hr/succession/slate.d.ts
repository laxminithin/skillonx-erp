import type { HrActor } from '../types.js';
import type { z } from 'zod';
import type { nominateSchema, readinessReviewSchema, devActionSchema, devActionStatusSchema, eventSchema, eventDecisionSchema } from './types.js';
export declare function nominate(actor: HrActor, input: z.infer<typeof nominateSchema>): Promise<{
    id: number;
    status: string;
    idempotent?: undefined;
} | {
    id: number;
    status: any;
    idempotent: boolean;
}>;
export declare function decideCandidate(actor: HrActor, candidateId: number, decision: 'APPROVE' | 'REJECT', remarks?: string): Promise<{
    id: number;
    status: string;
    idempotent: boolean;
} | {
    id: number;
    status: string;
    idempotent?: undefined;
}>;
export declare function withdrawCandidate(actor: HrActor, candidateId: number): Promise<{
    id: number;
    status: any;
    idempotent: boolean;
} | {
    id: number;
    status: string;
    idempotent?: undefined;
}>;
export declare function listCandidates(actor: HrActor, roleId: number): Promise<any[]>;
export declare function reviewReadiness(actor: HrActor, candidateId: number, input: z.infer<typeof readinessReviewSchema>): Promise<{
    reviewId: number;
    previousReadiness: string;
    newReadiness: "READY_NOW" | "READY_1_YEAR" | "READY_2_YEARS" | "DEVELOPING" | "NOT_READY";
}>;
export declare function readinessHistory(actor: HrActor, candidateId: number): Promise<any[]>;
export declare function createDevAction(actor: HrActor, input: z.infer<typeof devActionSchema>): Promise<{
    id: number;
}>;
export declare function setDevActionStatus(actor: HrActor, id: number, input: z.infer<typeof devActionStatusSchema>): Promise<{
    id: number;
    status: "COMPLETED" | "CANCELLED" | "IN_PROGRESS" | "OPEN";
    idempotent: boolean;
} | {
    id: number;
    status: "COMPLETED" | "CANCELLED" | "IN_PROGRESS" | "OPEN";
    idempotent?: undefined;
}>;
export declare function listDevActions(actor: HrActor, opts?: {
    employeeId?: number;
    candidateId?: number;
    status?: string;
}): Promise<any[]>;
export declare function openEvent(actor: HrActor, input: z.infer<typeof eventSchema>): Promise<{
    id: number;
    status: string;
}>;
export declare function decideEvent(actor: HrActor, eventId: number, input: z.infer<typeof eventDecisionSchema>): Promise<{
    id: number;
    status: string;
}>;
export declare function closeEvent(actor: HrActor, eventId: number): Promise<{
    id: number;
    status: string;
    idempotent: boolean;
} | {
    id: number;
    status: string;
    idempotent?: undefined;
}>;
export declare function listEvents(actor: HrActor, status?: string): Promise<any[]>;
