import { z } from 'zod';
import { type ClassActor } from '../academicClasses/access.js';
import { type ConflictHit, type FacultyRef, type Occurrence, type PeriodRow } from './types.js';
export declare const periodSchema: z.ZodObject<{
    name: z.ZodString;
    periodNumber: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    startTime: z.ZodString;
    endTime: z.ZodString;
    kind: z.ZodDefault<z.ZodEnum<["PERIOD", "BREAK", "LUNCH"]>>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    academicYearId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    startTime: string;
    endTime: string;
    kind: "PERIOD" | "BREAK" | "LUNCH";
    academicYearId?: number | null | undefined;
    sortOrder?: number | undefined;
    periodNumber?: number | null | undefined;
    isActive?: boolean | undefined;
}, {
    name: string;
    startTime: string;
    endTime: string;
    academicYearId?: number | null | undefined;
    sortOrder?: number | undefined;
    periodNumber?: number | null | undefined;
    kind?: "PERIOD" | "BREAK" | "LUNCH" | undefined;
    isActive?: boolean | undefined;
}>;
export declare const roomSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    building: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    floor: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    type: z.ZodDefault<z.ZodEnum<["CLASSROOM", "LAB", "SEMINAR_HALL", "AUDITORIUM", "OTHER"]>>;
    capacity: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE"]>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    type: "OTHER" | "LAB" | "CLASSROOM" | "SEMINAR_HALL" | "AUDITORIUM";
    name: string;
    status?: "ACTIVE" | "INACTIVE" | undefined;
    capacity?: number | null | undefined;
    building?: string | null | undefined;
    floor?: string | null | undefined;
}, {
    code: string;
    name: string;
    type?: "OTHER" | "LAB" | "CLASSROOM" | "SEMINAR_HALL" | "AUDITORIUM" | undefined;
    status?: "ACTIVE" | "INACTIVE" | undefined;
    capacity?: number | null | undefined;
    building?: string | null | undefined;
    floor?: string | null | undefined;
}>;
export declare const slotSchema: z.ZodObject<{
    academicClassId: z.ZodNumber;
    classSubjectId: z.ZodNumber;
    facultyIds: z.ZodArray<z.ZodNumber, "many">;
    roomId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    batchId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    dayOfWeek: z.ZodNumber;
    startPeriodId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    endPeriodId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    startTime: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
    effectiveFrom: z.ZodString;
    effectiveTo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE"]>>;
}, "strip", z.ZodTypeAny, {
    effectiveFrom: string;
    classSubjectId: number;
    academicClassId: number;
    facultyIds: number[];
    dayOfWeek: number;
    status?: "ACTIVE" | "INACTIVE" | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
    roomId?: number | null | undefined;
    effectiveTo?: string | null | undefined;
    batchId?: number | null | undefined;
    startPeriodId?: number | null | undefined;
    endPeriodId?: number | null | undefined;
}, {
    effectiveFrom: string;
    classSubjectId: number;
    academicClassId: number;
    facultyIds: number[];
    dayOfWeek: number;
    status?: "ACTIVE" | "INACTIVE" | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
    roomId?: number | null | undefined;
    effectiveTo?: string | null | undefined;
    batchId?: number | null | undefined;
    startPeriodId?: number | null | undefined;
    endPeriodId?: number | null | undefined;
}>;
export declare const overrideSchema: z.ZodObject<{
    slotId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    academicClassId: z.ZodNumber;
    classSubjectId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    courseId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    date: z.ZodString;
    kind: z.ZodEnum<["CANCELLED", "ROOM_CHANGE", "SUBSTITUTION", "EXTRA", "MAKEUP", "SPECIAL"]>;
    facultyId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    substituteFacultyId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    roomId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    startPeriodId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    endPeriodId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    startTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    endTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    date: string;
    academicClassId: number;
    kind: "CANCELLED" | "MAKEUP" | "ROOM_CHANGE" | "SUBSTITUTION" | "EXTRA" | "SPECIAL";
    reason?: string | null | undefined;
    startTime?: string | null | undefined;
    endTime?: string | null | undefined;
    roomId?: number | null | undefined;
    classSubjectId?: number | null | undefined;
    facultyId?: number | null | undefined;
    courseId?: number | null | undefined;
    startPeriodId?: number | null | undefined;
    endPeriodId?: number | null | undefined;
    slotId?: number | null | undefined;
    substituteFacultyId?: number | null | undefined;
}, {
    date: string;
    academicClassId: number;
    kind: "CANCELLED" | "MAKEUP" | "ROOM_CHANGE" | "SUBSTITUTION" | "EXTRA" | "SPECIAL";
    reason?: string | null | undefined;
    startTime?: string | null | undefined;
    endTime?: string | null | undefined;
    roomId?: number | null | undefined;
    classSubjectId?: number | null | undefined;
    facultyId?: number | null | undefined;
    courseId?: number | null | undefined;
    startPeriodId?: number | null | undefined;
    endPeriodId?: number | null | undefined;
    slotId?: number | null | undefined;
    substituteFacultyId?: number | null | undefined;
}>;
export declare const calendarEventSchema: z.ZodObject<{
    calendarId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    academicYearId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    semesterId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    eventType: z.ZodEnum<["SEMESTER_START", "SEMESTER_END", "WORKING_DAY", "HOLIDAY", "CIE", "SEE", "EVENT", "VACATION", "REGISTRATION", "RESULT"]>;
    title: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    startDate: string;
    endDate: string;
    eventType: "SEMESTER_END" | "EVENT" | "HOLIDAY" | "SEMESTER_START" | "WORKING_DAY" | "CIE" | "SEE" | "VACATION" | "REGISTRATION" | "RESULT";
    notes?: string | null | undefined;
    academicYearId?: number | null | undefined;
    semesterId?: number | null | undefined;
    calendarId?: number | null | undefined;
}, {
    title: string;
    startDate: string;
    endDate: string;
    eventType: "SEMESTER_END" | "EVENT" | "HOLIDAY" | "SEMESTER_START" | "WORKING_DAY" | "CIE" | "SEE" | "VACATION" | "REGISTRATION" | "RESULT";
    notes?: string | null | undefined;
    academicYearId?: number | null | undefined;
    semesterId?: number | null | undefined;
    calendarId?: number | null | undefined;
}>;
export declare const attendanceFromSlotSchema: z.ZodObject<{
    date: z.ZodString;
    slotId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    overrideId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    lessonPlanEntryId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    topicId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    topicLabel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    date: string;
    topicId?: number | null | undefined;
    topicLabel?: string | null | undefined;
    lessonPlanEntryId?: number | null | undefined;
    slotId?: number | null | undefined;
    overrideId?: number | null | undefined;
}, {
    date: string;
    topicId?: number | null | undefined;
    topicLabel?: string | null | undefined;
    lessonPlanEntryId?: number | null | undefined;
    slotId?: number | null | undefined;
    overrideId?: number | null | undefined;
}>;
export declare function listPeriods(collegeId: number, academicYearId?: number | null): Promise<PeriodRow[]>;
export declare function ensureDefaultPeriods(actor: ClassActor): Promise<{
    periods: PeriodRow[];
    created: boolean;
}>;
export declare function savePeriod(actor: ClassActor, input: z.infer<typeof periodSchema>, id?: number): Promise<PeriodRow>;
export declare function listRooms(actor: ClassActor, type?: string): Promise<{
    id: number;
    collegeId: number;
    name: string;
    code: string;
    building: any;
    floor: any;
    type: any;
    capacity: number | null;
    status: any;
}[]>;
export declare function saveRoom(actor: ClassActor, input: z.infer<typeof roomSchema>, id?: number): Promise<{
    id: number;
    collegeId: number;
    name: string;
    code: string;
    building: any;
    floor: any;
    type: any;
    capacity: number | null;
    status: any;
}>;
export declare function classTimetableContext(actor: ClassActor, classId: number): Promise<{
    class: {
        id: number;
        name: any;
        code: any;
        academicYearId: number;
        programId: number;
        departmentId: number;
        semesterId: number;
        sectionLabel: any;
    };
    canEdit: boolean;
    subjects: {
        id: number;
        courseId: number;
        code: any;
        name: any;
        faculty: {
            facultyId: number;
            name: any;
            designation: any;
            isPrimary: boolean;
            canManage: boolean;
        }[];
        facultyAssigned: boolean;
    }[];
    unassignedSubjects: {
        id: number;
        code: any;
        name: any;
    }[];
    periods: PeriodRow[];
    rooms: {
        id: number;
        collegeId: number;
        name: string;
        code: string;
        building: any;
        floor: any;
        type: any;
        capacity: number | null;
        status: any;
    }[];
    batches: {
        id: number;
        name: any;
        code: any;
    }[];
}>;
type SlotRecord = {
    id: number;
    collegeId: number;
    academicClassId: number;
    classSubjectId: number;
    courseId: number;
    facultyId: number | null;
    faculty: FacultyRef[];
    roomId: number | null;
    batchId: number | null;
    dayOfWeek: number;
    startPeriodId: number | null;
    endPeriodId: number | null;
    startPeriodNumber: number | null;
    endPeriodNumber: number | null;
    startTime: string;
    endTime: string;
    effectiveFrom: string;
    effectiveTo: string | null;
    status: string;
    className?: string;
    classCode?: string;
    courseName?: string;
    courseCode?: string;
    roomName?: string | null;
    roomCode?: string | null;
    batchName?: string | null;
};
export declare function listClassSlots(actor: ClassActor, classId: number): Promise<SlotRecord[]>;
type ConflictProbe = {
    excludeSlotId?: number | null;
    excludeOverrideId?: number | null;
    academicClassId: number;
    facultyIds: number[];
    roomId?: number | null;
    batchId?: number | null;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    effectiveFrom: string;
    effectiveTo?: string | null;
    date?: string | null;
};
export declare function findConflicts(collegeId: number, probe: ConflictProbe): Promise<ConflictHit[]>;
export declare function createSlot(actor: ClassActor, input: z.infer<typeof slotSchema>): Promise<SlotRecord>;
export declare function getSlot(actor: ClassActor, slotId: number): Promise<SlotRecord>;
export declare function updateSlot(actor: ClassActor, slotId: number, input: z.infer<typeof slotSchema>): Promise<SlotRecord>;
export declare function deactivateSlot(actor: ClassActor, slotId: number): Promise<SlotRecord>;
type DayFlags = {
    teaching: boolean;
    holiday: boolean;
    label: string | null;
};
export declare function teachingDayMap(collegeId: number, academicYearId: number | null, from: string, to: string): Promise<Map<string, DayFlags>>;
export declare function listCalendarEvents(actor: ClassActor, academicYearId?: number): Promise<{
    calendars: {
        id: number;
        name: any;
        academicYearId: number;
        academicYearLabel: any;
        startDate: string;
        endDate: string;
        workingWeekdays: any;
        isDefault: boolean;
        exceptions: {
            id: number;
            date: string;
            type: any;
            label: any;
        }[];
    }[];
    events: {
        id: number;
        calendarId: number | null;
        academicYearId: number | null;
        semesterId: number | null;
        eventType: any;
        title: any;
        startDate: string;
        endDate: string;
        blocksTeaching: boolean;
        notes: any;
    }[];
}>;
export declare function createCalendarEvent(actor: ClassActor, input: z.infer<typeof calendarEventSchema>): Promise<any>;
export declare function classWeek(actor: ClassActor, classId: number, from?: string, to?: string): Promise<{
    timezone: string;
    today: string;
    from: string;
    to: string;
    periods: PeriodRow[];
    occurrences: Occurrence[];
}>;
export declare function facultyTimetable(actor: ClassActor, from?: string, to?: string): Promise<{
    timezone: string;
    today: string;
    from: string;
    to: string;
    periods: never[];
    occurrences: never[];
    nextClass?: undefined;
} | {
    timezone: string;
    today: string;
    from: string;
    to: string;
    periods: PeriodRow[];
    occurrences: Occurrence[];
    nextClass: Occurrence;
}>;
export declare function studentTimetable(studentId: number, from?: string, to?: string): Promise<{
    class: null;
    timezone: string;
    today: null;
    from: null;
    to: null;
    periods: never[];
    occurrences: never[];
} | {
    class: {
        id: number;
        name: any;
        code: any;
    };
    timezone: string;
    today: string;
    from: string;
    to: string;
    periods: PeriodRow[];
    occurrences: Occurrence[];
}>;
export declare function createOverride(actor: ClassActor, input: z.infer<typeof overrideSchema>): Promise<any>;
export declare function authorizedForOccurrence(actor: ClassActor, occ: Occurrence): Promise<boolean>;
export declare function takeAttendanceFromOccurrence(actor: ClassActor, input: z.infer<typeof attendanceFromSlotSchema>): Promise<{
    session: {
        id: number;
        collegeId: number;
        academicClassId: number;
        courseId: number;
        facultyId: number;
        sessionDate: string | null;
        periodNumber: number | null;
        startTime: any;
        endTime: any;
        topicId: number | null;
        topicLabel: any;
        lessonPlanEntryId: number | null;
        status: any;
        completedAt: any;
        createdAt: any;
    };
    policy: import("../attendance/policy.js").AttendancePolicy;
    summary: {
        percentage: number | null;
        PRESENT: number;
        ABSENT: number;
        LATE: number;
        EXCUSED: number;
        total: number;
    };
    records: {
        id: number;
        studentId: number;
        usn: any;
        name: any;
        email: any;
        status: any;
        remarks: any;
        markedAt: any;
    }[];
}>;
export declare function facultyWorkload(actor: ClassActor, facultyId?: number): Promise<{
    facultyId: number;
    rows: never[];
    totalPeriods: number;
    totalHours: number;
    facultyName?: undefined;
    workloadBreakdown?: undefined;
} | {
    facultyId: number;
    facultyName: any;
    rows: {
        subject: string;
        className: string;
        classCode: string;
        periods: number;
        hours: number;
    }[];
    totalPeriods: number;
    totalHours: number;
    workloadBreakdown: {
        normalAssigned: number;
        substitution: number;
        makeup: number;
        extra: number;
    };
}>;
export declare function courseDelivery(actor: ClassActor, classId: number, courseId: number): Promise<{
    scheduledHours: number;
    deliveredHours: number;
    remainingHours: number;
    attendanceSessions: number;
    topicCompletion: {
        planned: number;
        completed: number;
    };
}>;
export declare function timetableOverview(actor: ClassActor): Promise<{
    timezone: string;
    today: string;
    classesWithTimetable: number;
    classesMissingTimetable: {
        id: number;
        name: any;
        code: any;
    }[];
    unassignedSubjects: {
        classId: number;
        className: any;
        subject: any;
        code: any;
    }[];
    conflicts: ConflictHit[];
    attendanceNotTakenToday: Occurrence[];
}>;
export declare function exportTimetableCsv(actor: ClassActor, kind: 'class' | 'faculty' | 'room', id: number): Promise<{
    filename: string;
    csv: string;
}>;
export declare function facultyCalendar(actor: ClassActor, from?: string, to?: string): Promise<{
    timezone: string;
    from: string;
    to: string;
    events: {
        id: string;
        kind: string;
        title: string;
        date: string;
        path: string;
    }[];
}>;
export { sqlDate } from '../lessonPlans/dates.js';
