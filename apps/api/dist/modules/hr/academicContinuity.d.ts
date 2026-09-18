import type { Knex } from 'knex';
type Row = Record<string, unknown>;
export type SlotProbe = {
    collegeId: number;
    academicClassId: number;
    facultyIds: number[];
    roomId?: number | null;
    date: string;
    startTime: string;
    endTime: string;
    excludeSlotId?: number | null;
};
export type ConflictCode = 'FACULTY_CONFLICT' | 'CLASS_CONFLICT' | 'ROOM_CONFLICT' | 'EMPLOYEE_ON_LEAVE' | 'INVALID_SWAP' | 'ACADEMIC_DAY_BLOCKED';
export declare function validateSlotAvailability(probe: SlotProbe): Promise<{
    available: boolean;
    code?: ConflictCode;
    message?: string;
}>;
export declare function validateFacultyOnLeave(employeeId: number, date: string): Promise<boolean>;
export declare function createLeaveSubstitutionOverride(trx: Knex.Transaction, input: {
    collegeId: number;
    coverage: Row;
    leaveRequestId: number;
    createdBy: number;
}): Promise<number | null>;
export declare function createLeaveMakeupOverride(trx: Knex.Transaction, input: {
    collegeId: number;
    coverage: Row;
    leaveRequestId: number;
    createdBy: number;
}): Promise<number>;
export declare function createLeaveSwapOverrides(trx: Knex.Transaction, input: {
    collegeId: number;
    swap: Row;
    coverage: Row;
    leaveRequestId: number;
    createdBy: number;
}): Promise<{
    sourceOverrideId: number;
    targetOverrideId: number;
}>;
export declare function createAuthorizedCancellationOverride(trx: Knex.Transaction, input: {
    collegeId: number;
    coverage: Row;
    leaveRequestId: number;
    createdBy: number;
    reason: string;
}): Promise<number | null>;
export declare function cancelLeaveAcademicOverride(trx: Knex.Transaction, overrideId: number, cancelledBy: number): Promise<boolean>;
export declare function applyCoverageOverrides(trx: Knex.Transaction, input: {
    collegeId: number;
    leaveRequestId: number;
    createdBy: number;
}): Promise<number[]>;
export declare function notifyCoverageStudents(collegeId: number, coverage: Row, slot: Row | null, type: 'SUBSTITUTION' | 'RESCHEDULE' | 'CANCELLATION' | 'RESTORE', extras?: {
    substituteName?: string;
    newDate?: string;
    newTime?: string;
}): Promise<void>;
export declare function getSlotTimes(slotId: number, date?: string): Promise<{
    slot: Row;
    academicClassId: number;
    startTime: string;
    endTime: string;
    roomId: number | null;
    courseId: number | null;
}>;
export {};
