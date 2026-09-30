import type { z } from 'zod';
import { type EventsActor, type reservationDecisionSchema, type reservationSchema } from './types.js';
/**
 * Ad-hoc (non-event) reservation, e.g. a conference room for a meeting.
 * Retrying with the same idempotency key returns the original reservation,
 * sequentially or concurrently. Resources that require approval stay
 * REQUESTED (non-blocking) until a resource manager confirms.
 */
export declare function createReservation(actor: EventsActor, input: z.infer<typeof reservationSchema>): Promise<{
    idempotentReplay: boolean;
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
}>;
export declare function listMyReservations(actor: EventsActor): Promise<{
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
}[]>;
export declare function reservationQueue(actor: EventsActor): Promise<{
    requesterName: any;
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
}[]>;
export declare function decideReservation(actor: EventsActor, reservationId: number, input: z.infer<typeof reservationDecisionSchema>): Promise<{
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
}>;
export declare function cancelReservation(actor: EventsActor, reservationId: number): Promise<{
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
}>;
