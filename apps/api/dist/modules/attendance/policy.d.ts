export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export type AttendancePolicy = {
    minimumPercentage: number;
    countLateAsPresent: boolean;
    countExcusedInDenominator: boolean;
};
export declare const DEFAULT_ATTENDANCE_POLICY: AttendancePolicy;
export declare function countsAsAttended(status: AttendanceStatus, policy: AttendancePolicy): boolean;
export declare function countsInDenominator(status: AttendanceStatus, policy: AttendancePolicy): boolean;
export declare function computeAttendancePercentage(statuses: AttendanceStatus[], policy?: AttendancePolicy): number | null;
export declare function attendanceStanding(percentage: number | null, policy?: AttendancePolicy): {
    label: string;
    tone: "muted";
    code: string;
} | {
    label: string;
    tone: "success";
    code: string;
} | {
    label: string;
    tone: "warning";
    code: string;
} | {
    label: string;
    tone: "danger";
    code: string;
};
export declare function summarizeStatuses(statuses: AttendanceStatus[]): {
    PRESENT: number;
    ABSENT: number;
    LATE: number;
    EXCUSED: number;
    total: number;
};
