import type { EventsActor, EventsPermission } from './types.js';
/** Roles allowed to act on the "returned to organiser" workflow step (any organiser role). */
export declare const ORGANIZER_ROLES: string[];
export declare function eventsPermissionsForRole(role: string): EventsPermission[];
export declare function hasEventsPermission(actor: {
    role: string;
}, permission: EventsPermission): boolean;
export declare function assertEventsPermission(actor: {
    role: string;
}, permission: EventsPermission): void;
export declare function hodDepartmentIds(actor: EventsActor): number[];
export declare function isHodOfDepartment(actor: EventsActor, departmentId: number | null): boolean;
