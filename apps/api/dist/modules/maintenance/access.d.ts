import type { MaintActor, MaintPermission } from './types.js';
export declare function maintPermissionsForRole(role: string): MaintPermission[];
export declare function hasMaintPermission(actor: MaintActor, permission: MaintPermission): boolean;
export declare function assertMaintPermission(actor: MaintActor, permission: MaintPermission): void;
/** A back-office operator can see/act beyond their own tickets. */
export declare function isOperator(actor: MaintActor): boolean;
/** Manager-tier: owns the central queue, routing, assignment, config. */
export declare function isManager(actor: MaintActor): boolean;
/** A worker (technician / IT support) — sees only assigned/team tickets. */
export declare function isWorkerOnly(actor: MaintActor): boolean;
export declare function hodDepartmentIds(actor: MaintActor): Promise<number[]>;
export declare function isPrincipal(actor: MaintActor): Promise<boolean>;
/** Team ids this actor belongs to (as technician / support agent). */
export declare function actorTeamIds(actor: MaintActor): Promise<number[]>;
/**
 * Enforce that the actor may VIEW a ticket row and return the visibility mode.
 *  - 'FULL'      → operator/manager/assignee: internal notes visible
 *  - 'REQUESTER' → the requester (or oversight): requester-visible content only
 * Throws 403 when the actor has no legitimate relationship to the ticket.
 */
export declare function assertTicketVisibility(actor: MaintActor, ticket: Record<string, unknown>): Promise<'FULL' | 'REQUESTER'>;
/** Assert the actor can perform work actions on a specific ticket (assignee or team member or manager). */
export declare function assertCanWork(actor: MaintActor, ticket: Record<string, unknown>): Promise<void>;
