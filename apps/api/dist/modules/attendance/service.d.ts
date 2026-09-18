import { z } from 'zod';
import { type ClassActor } from '../academicClasses/access.js';
import { type AttendancePolicy } from './policy.js';
export declare const createSessionSchema: z.ZodObject<{
    academicClassId: z.ZodNumber;
    courseId: z.ZodNumber;
    sessionDate: z.ZodString;
    periodNumber: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    startTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    endTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    topicId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    topicLabel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    lessonPlanEntryId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    timetableSlotId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    timetableOverrideId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    courseId: number;
    academicClassId: number;
    sessionDate: string;
    startTime?: string | null | undefined;
    endTime?: string | null | undefined;
    periodNumber?: number | null | undefined;
    topicId?: number | null | undefined;
    topicLabel?: string | null | undefined;
    lessonPlanEntryId?: number | null | undefined;
    timetableSlotId?: number | null | undefined;
    timetableOverrideId?: number | null | undefined;
}, {
    courseId: number;
    academicClassId: number;
    sessionDate: string;
    startTime?: string | null | undefined;
    endTime?: string | null | undefined;
    periodNumber?: number | null | undefined;
    topicId?: number | null | undefined;
    topicLabel?: string | null | undefined;
    lessonPlanEntryId?: number | null | undefined;
    timetableSlotId?: number | null | undefined;
    timetableOverrideId?: number | null | undefined;
}>;
export declare const markRecordsSchema: z.ZodObject<{
    records: z.ZodArray<z.ZodObject<{
        studentId: z.ZodNumber;
        status: z.ZodEnum<["PRESENT", "ABSENT", "LATE", "EXCUSED"]>;
        remarks: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
        studentId: number;
        remarks?: string | null | undefined;
    }, {
        status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
        studentId: number;
        remarks?: string | null | undefined;
    }>, "many">;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    records: {
        status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
        studentId: number;
        remarks?: string | null | undefined;
    }[];
    reason?: string | undefined;
}, {
    records: {
        status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
        studentId: number;
        remarks?: string | null | undefined;
    }[];
    reason?: string | undefined;
}>;
export declare function ensureCollegePolicy(collegeId: number): Promise<AttendancePolicy>;
export declare function listFacultySessions(actor: ClassActor, courseId: number, classId?: number): Promise<{
    policy: AttendancePolicy;
    sessions: {
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
    }[];
}>;
export declare function createSession(actor: ClassActor, input: z.infer<typeof createSessionSchema>): Promise<{
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
    policy: AttendancePolicy;
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
export declare function getSession(actor: ClassActor, sessionId: number): Promise<{
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
    policy: AttendancePolicy;
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
export declare function markRecords(actor: ClassActor, sessionId: number, input: z.infer<typeof markRecordsSchema>): Promise<{
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
    policy: AttendancePolicy;
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
export declare function markAllPresent(actor: ClassActor, sessionId: number): Promise<{
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
    policy: AttendancePolicy;
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
export declare function finalizeSession(actor: ClassActor, sessionId: number): Promise<{
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
    policy: AttendancePolicy;
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
export declare function courseAnalytics(actor: ClassActor, courseId: number, classId: number): Promise<{
    policy: AttendancePolicy;
    sessions: number;
    average: number | null;
    belowThreshold: {
        studentId: number;
        usn: any;
        name: any;
        percentage: number | null;
        standing: {
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
    }[];
    students: {
        studentId: number;
        usn: any;
        name: any;
        percentage: number | null;
        standing: {
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
    }[];
}>;
export declare function adminAttendanceOverview(actor: ClassActor): Promise<{
    policy: AttendancePolicy;
    classes: {
        classId: number;
        name: any;
        code: any;
        status: any;
        approvedStudents: number;
        sessions: number;
        draftSessions: number;
        average: number | null;
    }[];
    subjects: {
        courseId: number;
        code: string;
        name: string;
        sessions: number;
        average: number | null;
    }[];
    faculty: {
        facultyId: number;
        name: string;
        completed: number;
        open: number;
    }[];
}>;
export declare function analyticsToCsv(data: Awaited<ReturnType<typeof courseAnalytics>>): string;
export declare function studentAttendanceSummary(studentId: number, classId?: number): Promise<{
    policy: AttendancePolicy;
    overall: null;
    subjects: never[];
    standing: {
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
    belowCount?: undefined;
} | {
    policy: AttendancePolicy;
    overall: number | null;
    standing: {
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
    belowCount: number;
    subjects: {
        PRESENT: number;
        ABSENT: number;
        LATE: number;
        EXCUSED: number;
        total: number;
        courseId: number;
        code: any;
        name: any;
        percentage: number | null;
        standing: {
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
    }[];
}>;
export declare function studentSubjectAttendance(studentId: number, courseId: number): Promise<{
    history: {
        sessionId: number;
        date: any;
        periodNumber: number | null;
        topicLabel: any;
        status: any;
        remarks: any;
    }[];
    PRESENT: number;
    ABSENT: number;
    LATE: number;
    EXCUSED: number;
    total: number;
    historical: boolean;
    course: {
        id: number;
        code: string;
        name: string;
    };
    policy: AttendancePolicy;
    percentage: number | null;
    standing: {
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
}>;
