import type { LabActor } from './types.js';
/**
 * Upcoming practical sessions derived from the academic timetable.
 * A timetable slot counts as a lab session when its room maps to a managed lab.
 * We never duplicate the timetable — readiness records overlay it by (slot, date).
 */
export declare function upcomingSessions(actor: LabActor, days?: number): Promise<Record<string, unknown>[]>;
/** Create or fetch the readiness record for a timetable slot on a date. */
export declare function prepareSession(actor: LabActor, input: {
    slotId: number;
    sessionDate: string;
}): Promise<{
    id: number;
    labId: number;
    labName: any;
    slotId: number | null;
    sessionDate: any;
    startTime: any;
    endTime: any;
    courseTitle: any;
    facultyName: any;
    readinessStatus: any;
    checklist: any;
    notes: any;
}>;
export declare function getSession(actor: LabActor, sessionId: number): Promise<{
    id: number;
    labId: number;
    labName: any;
    slotId: number | null;
    sessionDate: any;
    startTime: any;
    endTime: any;
    courseTitle: any;
    facultyName: any;
    readinessStatus: any;
    checklist: any;
    notes: any;
}>;
export declare function updateReadiness(actor: LabActor, sessionId: number, input: {
    readinessStatus?: string;
    checklist?: {
        key: string;
        label: string;
        done: boolean;
    }[] | null;
    notes?: string | null;
}): Promise<{
    id: number;
    labId: number;
    labName: any;
    slotId: number | null;
    sessionDate: any;
    startTime: any;
    endTime: any;
    courseTitle: any;
    facultyName: any;
    readinessStatus: any;
    checklist: any;
    notes: any;
}>;
