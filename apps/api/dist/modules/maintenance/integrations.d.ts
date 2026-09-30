import type { MaintActor } from './types.js';
/**
 * Source-module integration boundary.
 *
 * Maintenance is a CENTRAL service layer. Source modules keep domain ownership.
 * Integration is by reference only:
 *   - LAB: reuses `lab_faults.maintenance_ref` (the frozen Lab boundary). We
 *     NEVER create a second lab fault and NEVER mutate lab asset lifecycle.
 *   - HOSTEL / LIBRARY / TRANSPORT / CLASSROOM: linked via source_module /
 *     source_entity_type / source_entity_id on the ticket — no duplicate rows.
 */
/** Link an existing frozen-module Lab fault to a central maintenance ticket. */
export declare function linkLabFault(actor: MaintActor, faultId: number, extra?: {
    priority?: string;
    note?: string;
}): Promise<{
    id: number;
    ticketNo: unknown;
    title: unknown;
    description: {} | null;
    categoryId: number | null;
    categoryName: string;
    categoryKind: string;
    subcategory: {} | null;
    requesterType: unknown;
    requesterName: string;
    requesterFacultyId: number | null;
    requesterStudentId: number | null;
    departmentId: number | null;
    departmentName: string;
    roomId: number | null;
    roomName: string;
    building: {} | null;
    locationNote: {} | null;
    sourceModule: unknown;
    sourceEntityType: {} | null;
    sourceEntityId: number | null;
    assetRef: {} | null;
    assetId: number | null;
    asset: {
        id: number;
        assetTag: string;
        name: string;
        status: string;
        warrantyEndDate: {} | null;
        amcReference: {} | null;
        amcExpiryDate: {} | null;
    } | null;
    erpModule: {} | null;
    erpRoute: {} | null;
    priority: unknown;
    status: unknown;
    teamId: number | null;
    teamName: string;
    assignedTo: number | null;
    assigneeName: string;
    routingExplanation: {} | null;
    createdAt: unknown;
    acknowledgedAt: {} | null;
    startedAt: {} | null;
    resolvedAt: {} | null;
    confirmedAt: {} | null;
    closedAt: {} | null;
    resolutionSummary: {} | null;
    closureOutcome: {} | null;
    reopenCount: number;
    escalationLevel: {};
    sla: {
        ackState: import("./sla.js").SlaState;
        ackDueAt: string | null;
        resolveState: import("./sla.js").SlaState;
        resolveDueAt: string | null;
        overall: import("./sla.js").SlaState;
        pausedMs: number;
    };
}>;
/**
 * On resolution, safely sync back to the source module. For Lab, we record the
 * resolution against the fault's maintenance_ref context. We do NOT flip the
 * lab fault status or asset lifecycle — the Lab Assistant verifies operational
 * condition and closes the fault through the frozen Lab workflow.
 */
export declare function onTicketResolvedSyncSource(actor: MaintActor, ticket: Record<string, unknown>): Promise<void>;
/** Source entities a requester can attach for a given module (for the create UX). */
export declare function sourceOptions(actor: MaintActor, module: string): Promise<{
    id: number;
    type: string;
    label: string;
}[]>;
