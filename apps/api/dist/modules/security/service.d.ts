import type { Knex } from 'knex';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { type SecurityActor, gateSchema, gateStatusSchema, incidentSchema, incidentStatusSchema, visitCancelSchema, visitCheckInSchema, visitCheckOutSchema, visitDecisionSchema, visitorRequestSchema } from './types.js';
export { gateSchema, gateStatusSchema, incidentSchema, incidentStatusSchema, visitCancelSchema, visitCheckInSchema, visitCheckOutSchema, visitDecisionSchema, visitorRequestSchema, };
export declare function createGate(actor: SecurityActor, input: z.infer<typeof gateSchema>): Promise<{
    [k: string]: unknown;
}>;
export declare function listGates(actor: SecurityActor, opts?: {
    activeOnly?: boolean;
}): Promise<{
    [k: string]: unknown;
}[]>;
export declare function getGate(actor: SecurityActor, gateId: number): Promise<{
    [k: string]: unknown;
}>;
export declare function setGateStatus(actor: SecurityActor, gateId: number, input: z.infer<typeof gateStatusSchema>): Promise<{
    [k: string]: unknown;
}>;
/**
 * Cross-module read-only accessor, mirroring the established convention
 * (`procurement/service.ts:findVendorRef`, `assetManagement/service.ts:findAssetRef`)
 * for another module to reference the gate master without duplicating it.
 */
export declare function findGateRef(collegeId: number, gateId: number | null | undefined): Promise<{
    [k: string]: unknown;
} | null>;
export declare function requestVisit(actor: SecurityActor, input: z.infer<typeof visitorRequestSchema>): Promise<{
    vendorName: string | null;
    events: {
        [k: string]: unknown;
    }[];
}>;
export declare function decideVisit(actor: SecurityActor, visitId: number, input: z.infer<typeof visitDecisionSchema>): Promise<{
    vendorName: string | null;
    events: {
        [k: string]: unknown;
    }[];
}>;
export declare function cancelVisit(actor: SecurityActor, visitId: number, input: z.infer<typeof visitCancelSchema>): Promise<{
    vendorName: string | null;
    events: {
        [k: string]: unknown;
    }[];
}>;
/**
 * Concurrency-safe check-in: a row lock (`forUpdate`) inside a transaction
 * guarantees that if two check-in requests race for the same visit, only the
 * first to acquire the lock observes status === 'APPROVED' and transitions
 * it; the second sees the already-updated status and is rejected. This
 * mirrors `transport/passes.ts:activatePass` and
 * `assetManagement/service.ts:lockAsset`, the codebase's own precedent for
 * this exact class of problem.
 */
export declare function checkInVisit(actor: SecurityActor, visitId: number, input: z.infer<typeof visitCheckInSchema>): Promise<{
    vendorName: string | null;
    events: {
        [k: string]: unknown;
    }[];
}>;
/**
 * Idempotent, race-safe checkout: the same row-lock + conditional-update
 * pattern as `checkInVisit`. A second concurrent (or accidental duplicate)
 * checkout call sees status already CHECKED_OUT and is rejected rather than
 * writing a second exit event or overwriting `exit_at`.
 */
export declare function checkOutVisit(actor: SecurityActor, visitId: number, input: z.infer<typeof visitCheckOutSchema>): Promise<{
    vendorName: string | null;
    events: {
        [k: string]: unknown;
    }[];
}>;
export declare function getVisit(actor: SecurityActor, visitId: number, trx?: Knex.Transaction | typeof db): Promise<{
    vendorName: string | null;
    events: {
        [k: string]: unknown;
    }[];
}>;
export declare function listVisits(actor: SecurityActor, filters?: {
    status?: string;
    gateId?: number;
    visitType?: string;
}): Promise<{
    [k: string]: unknown;
}[]>;
export declare function reportIncident(actor: SecurityActor, input: z.infer<typeof incidentSchema>): Promise<{
    [k: string]: unknown;
}>;
export declare function updateIncidentStatus(actor: SecurityActor, incidentId: number, input: z.infer<typeof incidentStatusSchema>): Promise<{
    [k: string]: unknown;
}>;
/**
 * Incident detail is privacy-scoped by RBAC alone (`security.incident.view`
 * — only Security Manager/Guard + admin/management tier hold it; general
 * Faculty/Student roles have no permission for it and no route ever exposes
 * this to them), matching the approved scope's privacy requirement.
 */
export declare function getIncident(actor: SecurityActor, incidentId: number, trx?: Knex.Transaction | typeof db): Promise<{
    [k: string]: unknown;
}>;
export declare function listIncidents(actor: SecurityActor, filters?: {
    status?: string;
    severity?: string;
    category?: string;
}): Promise<{
    [k: string]: unknown;
}[]>;
