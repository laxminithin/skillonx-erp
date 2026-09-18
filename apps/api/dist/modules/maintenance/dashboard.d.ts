import type { MaintActor } from './types.js';
/**
 * Maintenance Manager operational dashboard. Aggregated — a bounded set of
 * open tickets is fetched ONCE and SLA state computed in JS; counts come from
 * grouped SQL. No per-ticket / per-team round trips.
 */
export declare function managerDashboard(actor: MaintActor): Promise<{
    actionRequired: {
        unassigned: {
            id: number;
            ticketNo: unknown;
            title: unknown;
            priority: unknown;
            status: unknown;
            categoryName: string;
            teamName: string;
            assigneeName: string;
            createdAt: unknown;
            sla: {
                ackState: import("./sla.js").SlaState;
                ackDueAt: string | null;
                resolveState: import("./sla.js").SlaState;
                resolveDueAt: string | null;
                overall: import("./sla.js").SlaState;
                pausedMs: number;
            };
        }[];
        critical: {
            id: number;
            ticketNo: unknown;
            title: unknown;
            priority: unknown;
            status: unknown;
            categoryName: string;
            teamName: string;
            assigneeName: string;
            createdAt: unknown;
            sla: {
                ackState: import("./sla.js").SlaState;
                ackDueAt: string | null;
                resolveState: import("./sla.js").SlaState;
                resolveDueAt: string | null;
                overall: import("./sla.js").SlaState;
                pausedMs: number;
            };
        }[];
        slaBreached: {
            id: number;
            ticketNo: unknown;
            title: unknown;
            priority: unknown;
            status: unknown;
            categoryName: string;
            teamName: string;
            assigneeName: string;
            createdAt: unknown;
            sla: {
                ackState: import("./sla.js").SlaState;
                ackDueAt: string | null;
                resolveState: import("./sla.js").SlaState;
                resolveDueAt: string | null;
                overall: import("./sla.js").SlaState;
                pausedMs: number;
            };
        }[];
        slaApproaching: {
            id: number;
            ticketNo: unknown;
            title: unknown;
            priority: unknown;
            status: unknown;
            categoryName: string;
            teamName: string;
            assigneeName: string;
            createdAt: unknown;
            sla: {
                ackState: import("./sla.js").SlaState;
                ackDueAt: string | null;
                resolveState: import("./sla.js").SlaState;
                resolveDueAt: string | null;
                overall: import("./sla.js").SlaState;
                pausedMs: number;
            };
        }[];
        reopened: {
            id: number;
            ticketNo: unknown;
            title: unknown;
            priority: unknown;
            status: unknown;
            categoryName: string;
            teamName: string;
            assigneeName: string;
            createdAt: unknown;
            sla: {
                ackState: import("./sla.js").SlaState;
                ackDueAt: string | null;
                resolveState: import("./sla.js").SlaState;
                resolveDueAt: string | null;
                overall: import("./sla.js").SlaState;
                pausedMs: number;
            };
        }[];
        waitingParts: {
            id: number;
            ticketNo: unknown;
            title: unknown;
            priority: unknown;
            status: unknown;
            categoryName: string;
            teamName: string;
            assigneeName: string;
            createdAt: unknown;
            sla: {
                ackState: import("./sla.js").SlaState;
                ackDueAt: string | null;
                resolveState: import("./sla.js").SlaState;
                resolveDueAt: string | null;
                overall: import("./sla.js").SlaState;
                pausedMs: number;
            };
        }[];
        waitingApproval: {
            id: number;
            ticketNo: unknown;
            title: unknown;
            priority: unknown;
            status: unknown;
            categoryName: string;
            teamName: string;
            assigneeName: string;
            createdAt: unknown;
            sla: {
                ackState: import("./sla.js").SlaState;
                ackDueAt: string | null;
                resolveState: import("./sla.js").SlaState;
                resolveDueAt: string | null;
                overall: import("./sla.js").SlaState;
                pausedMs: number;
            };
        }[];
    };
    counts: {
        open: number;
        unassigned: number;
        critical: number;
        slaBreached: number;
        slaApproaching: number;
        reopened: number;
        waitingParts: number;
        waitingApproval: number;
        resolvedToday: number;
        closedToday: number;
    };
    queueHealth: Record<string, number>;
    byTeam: {
        teamId: number | null;
        teamName: any;
        kind: any;
        open: number;
    }[];
    recentActivity: {
        id: number;
        type: any;
        actorName: any;
        note: any;
        ticketNo: any;
        ticketId: number;
        createdAt: any;
    }[];
}>;
/** Technician / IT-support workspace: only assigned / team tickets. */
export declare function technicianDashboard(actor: MaintActor): Promise<{
    counts: {
        assigned: number;
        overdue: number;
        dueToday: number;
        highPriority: number;
        waiting: number;
    };
    overdue: {
        id: number;
        ticketNo: unknown;
        title: unknown;
        priority: unknown;
        status: unknown;
        categoryName: string;
        roomName: string;
        building: {} | null;
        createdAt: unknown;
        sla: {
            ackState: import("./sla.js").SlaState;
            ackDueAt: string | null;
            resolveState: import("./sla.js").SlaState;
            resolveDueAt: string | null;
            overall: import("./sla.js").SlaState;
            pausedMs: number;
        };
    }[];
    dueToday: {
        id: number;
        ticketNo: unknown;
        title: unknown;
        priority: unknown;
        status: unknown;
        categoryName: string;
        roomName: string;
        building: {} | null;
        createdAt: unknown;
        sla: {
            ackState: import("./sla.js").SlaState;
            ackDueAt: string | null;
            resolveState: import("./sla.js").SlaState;
            resolveDueAt: string | null;
            overall: import("./sla.js").SlaState;
            pausedMs: number;
        };
    }[];
    highPriority: {
        id: number;
        ticketNo: unknown;
        title: unknown;
        priority: unknown;
        status: unknown;
        categoryName: string;
        roomName: string;
        building: {} | null;
        createdAt: unknown;
        sla: {
            ackState: import("./sla.js").SlaState;
            ackDueAt: string | null;
            resolveState: import("./sla.js").SlaState;
            resolveDueAt: string | null;
            overall: import("./sla.js").SlaState;
            pausedMs: number;
        };
    }[];
    waiting: {
        id: number;
        ticketNo: unknown;
        title: unknown;
        priority: unknown;
        status: unknown;
        categoryName: string;
        roomName: string;
        building: {} | null;
        createdAt: unknown;
        sla: {
            ackState: import("./sla.js").SlaState;
            ackDueAt: string | null;
            resolveState: import("./sla.js").SlaState;
            resolveDueAt: string | null;
            overall: import("./sla.js").SlaState;
            pausedMs: number;
        };
    }[];
    assigned: {
        id: number;
        ticketNo: unknown;
        title: unknown;
        priority: unknown;
        status: unknown;
        categoryName: string;
        roomName: string;
        building: {} | null;
        createdAt: unknown;
        sla: {
            ackState: import("./sla.js").SlaState;
            ackDueAt: string | null;
            resolveState: import("./sla.js").SlaState;
            resolveDueAt: string | null;
            overall: import("./sla.js").SlaState;
            pausedMs: number;
        };
    }[];
    recentlyCompleted: {
        id: number;
        ticketNo: unknown;
        title: unknown;
        priority: unknown;
        status: unknown;
        categoryName: string;
        roomName: string;
        building: {} | null;
        createdAt: unknown;
        sla: {
            ackState: import("./sla.js").SlaState;
            ackDueAt: string | null;
            resolveState: import("./sla.js").SlaState;
            resolveDueAt: string | null;
            overall: import("./sla.js").SlaState;
            pausedMs: number;
        };
    }[];
}>;
