import type { Knex } from 'knex';
import type { z } from 'zod';
import { db } from '../../db/index.js';
import { type EventsActor, type resourceConfigSchema, type resourceConfigUpdateSchema } from './types.js';
type Conn = Knex.Transaction | typeof db;
type Row = Record<string, any>;
export declare const BOOKING_TRX: {
    isolationLevel: "read committed";
};
export type ResourceDetail = {
    id: number;
    collegeId: number;
    resourceKind: 'ROOM' | 'ASSET';
    roomId: number | null;
    assetId: number | null;
    name: string;
    code: string | null;
    roomType: string | null;
    building: string | null;
    floor: string | null;
    capacity: number | null;
    sourceStatus: string | null;
    isActive: boolean;
    requiresApproval: boolean;
    setupBufferMinutes: number;
    cleanupBufferMinutes: number;
    notes: string | null;
};
export type Blocker = {
    kind: 'RESERVATION' | 'ACADEMIC_TIMETABLE' | 'EXAMINATION' | 'ASSET_STATUS' | 'ROOM_INACTIVE' | 'RESOURCE_INACTIVE' | 'CAPACITY';
    message: string;
    resourceId: number;
    reservationId?: number;
    startsAt?: string | null;
    endsAt?: string | null;
};
export type Window = {
    blockStart: string;
    blockEnd: string;
};
export declare function isDupError(err: any): boolean;
/** InnoDB may pick a deadlock victim under real concurrency; the whole transaction is retried fresh. */
export declare function withDeadlockRetry<T>(fn: () => Promise<T>, attempts?: number): Promise<T>;
export declare function loadResources(conn: Conn, collegeId: number, ids: number[]): Promise<ResourceDetail[]>;
export declare function getResource(conn: Conn, collegeId: number, id: number): Promise<ResourceDetail>;
/** Serialises every booking decision per resource: rows locked in ascending id order (deadlock-free ordering). */
export declare function lockResources(trx: Knex.Transaction, collegeId: number, ids: number[]): Promise<ResourceDetail[]>;
export declare function windowFor(resource: ResourceDetail, start: string, end: string): Window;
/**
 * Server-authoritative availability. Checks, per resource and window:
 * bookability config, authoritative room/asset status, room capacity,
 * overlapping CONFIRMED reservations (REQUESTED never blocks), academic
 * timetable occupancy and examination room allocations.
 */
export declare function evaluateAvailability(conn: Conn, collegeId: number, resources: ResourceDetail[], windows: Map<number, Window>, opts?: {
    excludeReservationIds?: number[];
    requiredCapacity?: number | null;
    capacityOverride?: boolean;
}): Promise<Map<number, Blocker[]>>;
export declare function flatten(blockers: Map<number, Blocker[]>): Blocker[];
export declare function throwIfBlocked(blockers: Map<number, Blocker[]>): void;
/**
 * Confirms the given REQUESTED reservations all-or-nothing. Caller owns the
 * transaction (READ COMMITTED) and must not have locked any resource yet.
 */
export declare function confirmReservationsInTrx(trx: Knex.Transaction, collegeId: number, reservations: Row[], opts: {
    actorId: number;
    requiredCapacity?: number | null;
    capacityOverride?: boolean;
}): Promise<void>;
export declare function shapeReservation(row: Row, resource?: ResourceDetail | null, opts?: {
    includePurpose?: boolean;
}): {
    id: number;
    resourceId: number;
    resourceName: any;
    resourceKind: any;
    eventId: number | null;
    purpose: any;
    startsAt: string | null;
    endsAt: string | null;
    blockStartsAt: string | null;
    blockEndsAt: string | null;
    status: any;
    requestedBy: number;
    decidedBy: number | null;
    decidedAt: any;
    decisionRemarks: any;
};
export declare function listResources(actor: EventsActor, filters?: {
    kind?: string;
    activeOnly?: boolean;
}): Promise<any>;
export declare function configureResource(actor: EventsActor, input: z.infer<typeof resourceConfigSchema>): Promise<ResourceDetail>;
export declare function updateResource(actor: EventsActor, resourceId: number, input: z.infer<typeof resourceConfigUpdateSchema>): Promise<ResourceDetail>;
/** Candidates the resource manager may opt in: canonical rooms/assets not yet configured. */
export declare function listResourceCandidates(actor: EventsActor): Promise<{
    rooms: any;
    assets: any;
}>;
export {};
