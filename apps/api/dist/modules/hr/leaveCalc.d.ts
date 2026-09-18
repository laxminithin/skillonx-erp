import type { LEAVE_SESSIONS } from './types.js';
export type LeaveSession = (typeof LEAVE_SESSIONS)[number];
export declare function calculateLeaveDays(fromDate: string, toDate: string, fromSession: LeaveSession, toSession: LeaveSession): number;
export declare function datesOverlap(aFrom: string, aTo: string, bFrom: string, bTo: string): boolean;
