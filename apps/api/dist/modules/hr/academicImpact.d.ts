import type { LeaveSession } from './leaveCalc.js';
export type AffectedSession = {
    timetableSlotId: number | null;
    overrideId: number | null;
    date: string;
    startTime: string;
    endTime: string;
    periodNumber: number | null;
    classId: number;
    className: string;
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    room: string | null;
    originalFacultyId: number;
};
export declare function getLeaveAcademicImpact(collegeId: number, facultyUserId: number, fromDate: string, toDate: string, fromSession?: LeaveSession, toSession?: LeaveSession, options?: {
    emergencyRemainingOnly?: boolean;
    timeZone?: string;
}): Promise<{
    affectedSessions: AffectedSession[];
    totalAffected: number;
    coverageRequired: boolean;
}>;
export declare function facultyHasTeachingAssignment(facultyUserId: number, collegeId: number): Promise<boolean>;
