type Row = Record<string, unknown>;
export declare const CALCULATION_VERSION = 1;
export type DailyCalcInput = {
    collegeId: number;
    employeeId: number;
    date: string;
    employmentStatus: string;
    dateOfJoining: string | null;
    lastWorkingDate: string | null;
    schedule: WorkSchedule | null;
    shift: ShiftDef | null;
    holiday: Row | null;
    leave: LeaveDayInfo | null;
    punches: PunchInfo[];
    approvedAdjustment: Row | null;
    existingRecord: Row | null;
    settings: AttendanceSettings;
};
export type WorkSchedule = {
    workingDays: number[];
    weeklyOff: number[];
    graceMinutes: number;
    halfDayThresholdMinutes: number;
    fullDayMinutes: number;
};
export type ShiftDef = {
    id: number;
    startTime: string;
    endTime: string;
    breakDurationMinutes: number;
    graceInMinutes: number;
    graceOutMinutes: number;
    lateThresholdMinutes: number;
    earlyOutThresholdMinutes: number;
    minimumFullDayMinutes: number;
    minimumHalfDayMinutes: number;
    crossesMidnight: boolean;
};
export type PunchInfo = {
    punchAt: Date;
    punchType: string | null;
};
export type LeaveDayInfo = {
    leaveRequestId: number;
    leaveTypeCode: string;
    isPaid: boolean;
    session: 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF';
    portion: number;
};
export type AttendanceSettings = {
    sandwichLeavePolicy: string;
    lateMarksCountAsLop: boolean;
    autoFlagMissingPunch: boolean;
};
export type DailyCalcResult = {
    status: string;
    firstInAt: Date | null;
    lastOutAt: Date | null;
    workMinutes: number;
    lateMinutes: number;
    earlyOutMinutes: number;
    overtimeMinutes: number;
    leaveRequestId: number | null;
    holidayId: number | null;
    shiftId: number | null;
    source: string;
    isUnresolved: boolean;
};
export declare function leaveSessionForDate(fromDate: string, toDate: string, fromSession: string, toSession: string, date: string): 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF';
export declare function sessionPortion(session: 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF'): number;
export declare function calculateDailyAttendance(input: DailyCalcInput): DailyCalcResult;
export declare function attendanceSchemaReady(): Promise<boolean>;
export declare function isMonthLocked(collegeId: number, year: number, month: number): Promise<boolean>;
export declare function getAttendanceSettings(collegeId: number): Promise<AttendanceSettings & {
    id: number;
}>;
export declare function getWorkScheduleForEmployee(employeeId: number, date: string): Promise<WorkSchedule | null>;
export declare function getShiftForEmployee(employeeId: number, date: string): Promise<ShiftDef | null>;
export declare function getHolidayForDate(collegeId: number, date: string, departmentId?: number | null): Promise<Row | null>;
export declare function getApprovedLeaveForDate(employeeId: number, date: string): Promise<LeaveDayInfo | null>;
export declare function getPunchesForDate(employeeId: number, date: string): Promise<PunchInfo[]>;
export declare function getApprovedAdjustment(employeeId: number, date: string): Promise<Row | null>;
export declare function calculateEmployeeDay(employeeId: number, date: string): Promise<DailyCalcResult>;
export declare function upsertDailyRecord(employeeId: number, date: string, result: DailyCalcResult): Promise<number>;
export declare function recalculateEmployeeRange(employeeId: number, fromDate: string, toDate: string): Promise<number>;
export declare function recalculateCollegeMonth(collegeId: number, year: number, month: number): Promise<{
    processed: number;
}>;
export {};
