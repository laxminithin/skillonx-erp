import type { MentoringActor } from './types.js';
import type { z } from 'zod';
import type { createSessionSchema, updateSessionSchema, createActionSchema, updateActionSchema } from './types.js';
type Row = Record<string, unknown>;
export declare function listSessions(actor: MentoringActor, studentId: number): Promise<{
    id: number;
    studentId: number;
    status: unknown;
    meetingType: unknown;
    sessionCategory: {} | null;
    visibility: {};
    scheduledAt: unknown;
    agenda: unknown;
    observations: {} | null;
    outcome: {} | null;
    studentVisibleNotes: {} | null;
    privateNotes: {} | null;
    followUpDate: {} | null;
    followUpStatus: {} | null;
    createdAt: unknown;
    updatedAt: unknown;
}[]>;
export declare function getSession(actor: MentoringActor, sessionId: number): Promise<{
    studentName: any;
    usn: any;
    id: number;
    studentId: number;
    status: unknown;
    meetingType: unknown;
    sessionCategory: {} | null;
    visibility: {};
    scheduledAt: unknown;
    agenda: unknown;
    observations: {} | null;
    outcome: {} | null;
    studentVisibleNotes: {} | null;
    privateNotes: {} | null;
    followUpDate: {} | null;
    followUpStatus: {} | null;
    createdAt: unknown;
    updatedAt: unknown;
}>;
export declare function createSession(actor: MentoringActor, input: z.infer<typeof createSessionSchema>): Promise<{
    id: number;
    status: "COMPLETED" | "SCHEDULED";
}>;
export declare function updateSession(actor: MentoringActor, sessionId: number, input: z.infer<typeof updateSessionSchema>): Promise<{
    id: number;
    status: any;
}>;
/** Complete a pending follow-up without destroying the originating session. */
export declare function completeFollowUp(actor: MentoringActor, sessionId: number, outcome?: string | null): Promise<{
    id: number;
    followUpStatus: string;
}>;
/** Follow-ups across the mentor's mentees, bucketed for the dashboard. */
export declare function listFollowUps(actor: MentoringActor): Promise<{
    overdue: Row[];
    dueToday: Row[];
    upcoming: Row[];
}>;
export declare function listActions(actor: MentoringActor, studentId: number): Promise<{
    id: number;
    studentId: number;
    meetingId: number | null;
    title: unknown;
    description: {} | null;
    owner: unknown;
    status: unknown;
    priority: unknown;
    dueDate: {} | null;
    completedAt: {} | null;
    outcome: {} | null;
    studentVisible: boolean;
    createdAt: unknown;
}[]>;
export declare function createAction(actor: MentoringActor, input: z.infer<typeof createActionSchema>): Promise<{
    id: number;
    status: string;
}>;
export declare function updateAction(actor: MentoringActor, actionId: number, input: z.infer<typeof updateActionSchema>): Promise<{
    id: number;
    status: any;
}>;
export {};
