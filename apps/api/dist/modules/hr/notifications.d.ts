import type { HrActor } from './types.js';
export declare function notifyEmployee(params: {
    employeeId: number;
    collegeId: number;
    type: string;
    title: string;
    body?: string | null;
    link?: string | null;
    relatedType?: string | null;
    relatedId?: number | null;
    dedupeKey?: string | null;
}): Promise<void>;
export declare function listEmployeeNotifications(actor: HrActor, unreadOnly?: boolean): Promise<{
    id: number;
    type: unknown;
    title: unknown;
    body: unknown;
    link: unknown;
    readAt: unknown;
    createdAt: unknown;
}[]>;
