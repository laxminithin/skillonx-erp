import { db } from '../../db/index.js';
import type { Knex } from 'knex';
import type { LibraryActor } from './types.js';
export declare function createReservation(memberId: number, collegeId: number, catalogItemId: number): Promise<{
    id: number;
    memberId: number;
    catalogItemId: number;
    copyId: number | null;
    status: unknown;
    queuePosition: number;
    requestedAt: unknown;
    expiresAt: unknown;
    fulfilledAt: unknown;
    readyAt: unknown;
    title: string | null;
}>;
export declare function cancelReservation(memberId: number, collegeId: number, reservationId: number): Promise<{
    cancelled: boolean;
}>;
export declare function promoteReservationQueue(trx: Knex.Transaction | typeof db, collegeId: number, catalogItemId: number, copyId: number): Promise<'AVAILABLE' | 'RESERVED'>;
export declare function listMemberReservations(memberId: number, collegeId: number): Promise<{
    id: number;
    memberId: number;
    catalogItemId: number;
    copyId: number | null;
    status: unknown;
    queuePosition: number;
    requestedAt: unknown;
    expiresAt: unknown;
    fulfilledAt: unknown;
    readyAt: unknown;
    title: string | null;
}[]>;
export declare function expireReadyReservations(collegeId: number): Promise<{
    expired: number;
}>;
export declare function staffListReservations(actor: LibraryActor, status?: string): Promise<{
    memberName: any;
    memberIdentifier: any;
    id: number;
    memberId: number;
    catalogItemId: number;
    copyId: number | null;
    status: unknown;
    queuePosition: number;
    requestedAt: unknown;
    expiresAt: unknown;
    fulfilledAt: unknown;
    readyAt: unknown;
    title: string | null;
}[]>;
