import { z } from 'zod';
import { type LessonAuditAction } from './audit.js';
import { type TeachingSlot } from './scheduler.js';
export declare const teachingSlotSchema: z.ZodObject<{
    weekday: z.ZodNumber;
    startTime: z.ZodString;
    endTime: z.ZodString;
    hours: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    hours: number;
    startTime: string;
    endTime: string;
    weekday: number;
}, {
    startTime: string;
    endTime: string;
    weekday: number;
    hours?: number | undefined;
}>;
export declare const createPlanSchema: z.ZodObject<{
    courseId: z.ZodNumber;
    academicYearId: z.ZodNumber;
    semesterId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    programId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    classSectionId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    calendarId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    includeSupplementary: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    continueWithShortfall: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    teachingSlots: z.ZodArray<z.ZodObject<{
        weekday: z.ZodNumber;
        startTime: z.ZodString;
        endTime: z.ZodString;
        hours: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        hours: number;
        startTime: string;
        endTime: string;
        weekday: number;
    }, {
        startTime: string;
        endTime: string;
        weekday: number;
        hours?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    academicYearId: number;
    courseId: number;
    includeSupplementary: boolean;
    continueWithShortfall: boolean;
    teachingSlots: {
        hours: number;
        startTime: string;
        endTime: string;
        weekday: number;
    }[];
    departmentId?: number | null | undefined;
    semesterId?: number | null | undefined;
    classSectionId?: number | null | undefined;
    programId?: number | null | undefined;
    calendarId?: number | null | undefined;
}, {
    academicYearId: number;
    courseId: number;
    teachingSlots: {
        startTime: string;
        endTime: string;
        weekday: number;
        hours?: number | undefined;
    }[];
    departmentId?: number | null | undefined;
    semesterId?: number | null | undefined;
    classSectionId?: number | null | undefined;
    programId?: number | null | undefined;
    calendarId?: number | null | undefined;
    includeSupplementary?: boolean | undefined;
    continueWithShortfall?: boolean | undefined;
}>;
export declare const rescheduleSchema: z.ZodObject<{
    actualDate: z.ZodString;
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    mode: z.ZodEnum<["THIS_ONLY", "SHIFT_SUBSEQUENT"]>;
}, "strip", z.ZodTypeAny, {
    mode: "THIS_ONLY" | "SHIFT_SUBSEQUENT";
    actualDate: string;
    reason?: string | null | undefined;
}, {
    mode: "THIS_ONLY" | "SHIFT_SUBSEQUENT";
    actualDate: string;
    reason?: string | null | undefined;
}>;
export declare const completeSchema: z.ZodObject<{
    actualDate: z.ZodOptional<z.ZodString>;
    actualHours: z.ZodOptional<z.ZodNumber>;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    remarks?: string | null | undefined;
    actualDate?: string | undefined;
    actualHours?: number | undefined;
}, {
    remarks?: string | null | undefined;
    actualDate?: string | undefined;
    actualHours?: number | undefined;
}>;
export declare const editEntrySchema: z.ZodObject<{
    topicName: z.ZodOptional<z.ZodString>;
    subtopicName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    plannedHours: z.ZodOptional<z.ZodNumber>;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    teachingMethod: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    remarks?: string | null | undefined;
    topicName?: string | undefined;
    subtopicName?: string | null | undefined;
    plannedHours?: number | undefined;
    teachingMethod?: string | null | undefined;
}, {
    remarks?: string | null | undefined;
    topicName?: string | undefined;
    subtopicName?: string | null | undefined;
    plannedHours?: number | undefined;
    teachingMethod?: string | null | undefined;
}>;
export declare const addEntrySchema: z.ZodObject<{
    moduleId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    topicName: z.ZodString;
    subtopicName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    hours: z.ZodDefault<z.ZodNumber>;
    afterEntryId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    isSupplementary: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    hours: number;
    topicName: string;
    isSupplementary: boolean;
    moduleId?: number | null | undefined;
    subtopicName?: string | null | undefined;
    afterEntryId?: number | null | undefined;
}, {
    topicName: string;
    hours?: number | undefined;
    moduleId?: number | null | undefined;
    subtopicName?: string | null | undefined;
    afterEntryId?: number | null | undefined;
    isSupplementary?: boolean | undefined;
}>;
export declare const splitSchema: z.ZodObject<{
    parts: z.ZodArray<z.ZodObject<{
        topicName: z.ZodString;
        subtopicName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        hours: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        hours: number;
        topicName: string;
        subtopicName?: string | null | undefined;
    }, {
        hours: number;
        topicName: string;
        subtopicName?: string | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    parts: {
        hours: number;
        topicName: string;
        subtopicName?: string | null | undefined;
    }[];
}, {
    parts: {
        hours: number;
        topicName: string;
        subtopicName?: string | null | undefined;
    }[];
}>;
export declare const calendarSchema: z.ZodObject<{
    academicYearId: z.ZodNumber;
    semesterId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    name: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    workingWeekdays: z.ZodOptional<z.ZodString>;
    isDefault: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string;
    name: string;
    academicYearId: number;
    isDefault?: boolean | undefined;
    semesterId?: number | null | undefined;
    workingWeekdays?: string | undefined;
}, {
    startDate: string;
    endDate: string;
    name: string;
    academicYearId: number;
    isDefault?: boolean | undefined;
    semesterId?: number | null | undefined;
    workingWeekdays?: string | undefined;
}>;
export declare const exceptionSchema: z.ZodObject<{
    exceptionDate: z.ZodString;
    exceptionType: z.ZodEnum<["HOLIDAY", "EXAM", "BLOCKED", "NON_TEACHING"]>;
    label: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    exceptionDate: string;
    exceptionType: "HOLIDAY" | "NON_TEACHING" | "BLOCKED" | "EXAM";
    label?: string | null | undefined;
}, {
    exceptionDate: string;
    exceptionType: "HOLIDAY" | "NON_TEACHING" | "BLOCKED" | "EXAM";
    label?: string | null | undefined;
}>;
export declare function catalog(collegeId: number): Promise<{
    subjects: {
        courseId: number;
        courseName: string;
        courseCode: string;
        moduleCount: number;
        topicCount: number;
        subtopicCount: number;
        hours: number;
    }[];
}>;
export declare function catalogSubject(collegeId: number, courseId: number): Promise<{
    course: {
        id: any;
        name: any;
        code: any;
    };
    moduleCount: number;
    topicCount: number;
    subtopicCount: number;
    hours: any;
    modules: {
        id: number;
        name: string;
        unitKind: any;
        sortOrder: number;
        topicCount: number;
        subtopicCount: number;
        hours: any;
        topics: {
            id: number;
            name: string;
            sortOrder: number;
            subtopics: {
                id: number;
                name: string;
                hours: number;
                hoursSource: any;
                classification: any;
                sourceReference: any;
            }[];
        }[];
    }[];
}>;
export declare function listPlans(collegeId: number, opts?: {
    createdBy?: number;
    status?: string;
    courseId?: number;
    departmentId?: number;
    facultyId?: number;
    semesterId?: number;
    sectionId?: number;
}): Promise<{
    id: number;
    title: any;
    status: any;
    courseName: any;
    courseCode: any;
    sectionLabel: any;
    academicYearLabel: any;
    semesterLabel: any;
    facultyName: any;
    departmentName: any;
    requiredHours: number;
    availableHours: number;
    shortfallHours: number;
    updatedAt: any;
    createdBy: number;
    progress: import("./progress.js").PlanProgress;
}[]>;
export declare function todayLessons(collegeId: number, facultyId: number, today?: string): Promise<{
    entryId: number;
    planId: number;
    courseName: any;
    sectionLabel: any;
    moduleLabel: any;
    moduleName: any;
    topicName: any;
    subtopicName: any;
    hours: number;
    actualDate: string | null;
    startTime: string | null;
    endTime: string | null;
}[]>;
export declare function getPlan(planId: number, collegeId: number): Promise<{
    plan: {
        id: number;
        title: any;
        status: any;
        courseId: number;
        courseName: any;
        courseCode: any;
        departmentName: any;
        programName: any;
        academicYearLabel: any;
        semesterLabel: any;
        sectionLabel: any;
        facultyName: any;
        collegeName: any;
        collegeLogoUrl: any;
        includeSupplementary: boolean;
        continuedWithShortfall: boolean;
        requiredHours: number;
        availableHours: number;
        shortfallHours: number;
        generatedAt: any;
        updatedAt: any;
        holidayConflicts: number;
    };
    slots: TeachingSlot[];
    calendar: {
        id: number;
        name: string;
        startDate: string;
        endDate: string;
        blockedDates: string[];
        exceptions: {
            date: string;
            type: string;
            label: string | null;
        }[];
    } | null;
    progress: import("./progress.js").PlanProgress;
    entries: {
        id: number;
        serialNo: number;
        moduleId: number | null;
        moduleLabel: string | null;
        moduleName: string | null;
        topicId: number | null;
        topicName: string;
        subtopicId: number | null;
        subtopicName: string | null;
        plannedDate: string | null;
        actualDate: string | null;
        displayDate: string | null;
        dateChanged: boolean;
        plannedHours: number;
        actualHours: number;
        hoursChanged: boolean;
        status: string;
        remarks: string | null;
        teachingMethod: string | null;
        rescheduleReason: string | null;
        isSupplementary: boolean;
        isFacultyAdded: boolean;
        sortOrder: number;
        completedAt: {} | null;
    }[];
    audit: {
        id: any;
        action: any;
        createdAt: any;
        actor: any;
        metadata: Record<string, unknown> | null;
    }[];
}>;
export declare function previewGenerate(collegeId: number, body: z.infer<typeof createPlanSchema>): Promise<{
    content: {
        course: {
            id: any;
            name: any;
            code: any;
        };
        moduleCount: number;
        topicCount: number;
        subtopicCount: number;
        hours: any;
        modules: {
            id: number;
            name: string;
            unitKind: any;
            sortOrder: number;
            topicCount: number;
            subtopicCount: number;
            hours: any;
            topics: {
                id: number;
                name: string;
                sortOrder: number;
                subtopics: {
                    id: number;
                    name: string;
                    hours: number;
                    hoursSource: any;
                    classification: any;
                    sourceReference: any;
                }[];
            }[];
        }[];
    };
    calendar: {
        id: number;
        name: string;
        startDate: string;
        endDate: string;
        blockedDates: string[];
        exceptions: {
            date: string;
            type: string;
            label: string | null;
        }[];
    };
    requiredHours: any;
    availableHours: number;
    result: import("./scheduler.js").ScheduleResult;
}>;
export declare function createAndGenerate(collegeId: number, facultyId: number, body: z.infer<typeof createPlanSchema>): Promise<{
    id: number;
}>;
export declare function completeEntry(planId: number, entryId: number, collegeId: number, actorId: number, body: z.infer<typeof completeSchema>): Promise<{
    plan: {
        id: number;
        title: any;
        status: any;
        courseId: number;
        courseName: any;
        courseCode: any;
        departmentName: any;
        programName: any;
        academicYearLabel: any;
        semesterLabel: any;
        sectionLabel: any;
        facultyName: any;
        collegeName: any;
        collegeLogoUrl: any;
        includeSupplementary: boolean;
        continuedWithShortfall: boolean;
        requiredHours: number;
        availableHours: number;
        shortfallHours: number;
        generatedAt: any;
        updatedAt: any;
        holidayConflicts: number;
    };
    slots: TeachingSlot[];
    calendar: {
        id: number;
        name: string;
        startDate: string;
        endDate: string;
        blockedDates: string[];
        exceptions: {
            date: string;
            type: string;
            label: string | null;
        }[];
    } | null;
    progress: import("./progress.js").PlanProgress;
    entries: {
        id: number;
        serialNo: number;
        moduleId: number | null;
        moduleLabel: string | null;
        moduleName: string | null;
        topicId: number | null;
        topicName: string;
        subtopicId: number | null;
        subtopicName: string | null;
        plannedDate: string | null;
        actualDate: string | null;
        displayDate: string | null;
        dateChanged: boolean;
        plannedHours: number;
        actualHours: number;
        hoursChanged: boolean;
        status: string;
        remarks: string | null;
        teachingMethod: string | null;
        rescheduleReason: string | null;
        isSupplementary: boolean;
        isFacultyAdded: boolean;
        sortOrder: number;
        completedAt: {} | null;
    }[];
    audit: {
        id: any;
        action: any;
        createdAt: any;
        actor: any;
        metadata: Record<string, unknown> | null;
    }[];
}>;
export declare function rescheduleEntry(planId: number, entryId: number, collegeId: number, actorId: number, body: z.infer<typeof rescheduleSchema>): Promise<{
    plan: {
        id: number;
        title: any;
        status: any;
        courseId: number;
        courseName: any;
        courseCode: any;
        departmentName: any;
        programName: any;
        academicYearLabel: any;
        semesterLabel: any;
        sectionLabel: any;
        facultyName: any;
        collegeName: any;
        collegeLogoUrl: any;
        includeSupplementary: boolean;
        continuedWithShortfall: boolean;
        requiredHours: number;
        availableHours: number;
        shortfallHours: number;
        generatedAt: any;
        updatedAt: any;
        holidayConflicts: number;
    };
    slots: TeachingSlot[];
    calendar: {
        id: number;
        name: string;
        startDate: string;
        endDate: string;
        blockedDates: string[];
        exceptions: {
            date: string;
            type: string;
            label: string | null;
        }[];
    } | null;
    progress: import("./progress.js").PlanProgress;
    entries: {
        id: number;
        serialNo: number;
        moduleId: number | null;
        moduleLabel: string | null;
        moduleName: string | null;
        topicId: number | null;
        topicName: string;
        subtopicId: number | null;
        subtopicName: string | null;
        plannedDate: string | null;
        actualDate: string | null;
        displayDate: string | null;
        dateChanged: boolean;
        plannedHours: number;
        actualHours: number;
        hoursChanged: boolean;
        status: string;
        remarks: string | null;
        teachingMethod: string | null;
        rescheduleReason: string | null;
        isSupplementary: boolean;
        isFacultyAdded: boolean;
        sortOrder: number;
        completedAt: {} | null;
    }[];
    audit: {
        id: any;
        action: any;
        createdAt: any;
        actor: any;
        metadata: Record<string, unknown> | null;
    }[];
}>;
export declare function skipEntry(planId: number, entryId: number, collegeId: number, actorId: number, remarks?: string): Promise<{
    plan: {
        id: number;
        title: any;
        status: any;
        courseId: number;
        courseName: any;
        courseCode: any;
        departmentName: any;
        programName: any;
        academicYearLabel: any;
        semesterLabel: any;
        sectionLabel: any;
        facultyName: any;
        collegeName: any;
        collegeLogoUrl: any;
        includeSupplementary: boolean;
        continuedWithShortfall: boolean;
        requiredHours: number;
        availableHours: number;
        shortfallHours: number;
        generatedAt: any;
        updatedAt: any;
        holidayConflicts: number;
    };
    slots: TeachingSlot[];
    calendar: {
        id: number;
        name: string;
        startDate: string;
        endDate: string;
        blockedDates: string[];
        exceptions: {
            date: string;
            type: string;
            label: string | null;
        }[];
    } | null;
    progress: import("./progress.js").PlanProgress;
    entries: {
        id: number;
        serialNo: number;
        moduleId: number | null;
        moduleLabel: string | null;
        moduleName: string | null;
        topicId: number | null;
        topicName: string;
        subtopicId: number | null;
        subtopicName: string | null;
        plannedDate: string | null;
        actualDate: string | null;
        displayDate: string | null;
        dateChanged: boolean;
        plannedHours: number;
        actualHours: number;
        hoursChanged: boolean;
        status: string;
        remarks: string | null;
        teachingMethod: string | null;
        rescheduleReason: string | null;
        isSupplementary: boolean;
        isFacultyAdded: boolean;
        sortOrder: number;
        completedAt: {} | null;
    }[];
    audit: {
        id: any;
        action: any;
        createdAt: any;
        actor: any;
        metadata: Record<string, unknown> | null;
    }[];
}>;
export declare function editEntry(planId: number, entryId: number, collegeId: number, actorId: number, body: z.infer<typeof editEntrySchema>): Promise<{
    plan: {
        id: number;
        title: any;
        status: any;
        courseId: number;
        courseName: any;
        courseCode: any;
        departmentName: any;
        programName: any;
        academicYearLabel: any;
        semesterLabel: any;
        sectionLabel: any;
        facultyName: any;
        collegeName: any;
        collegeLogoUrl: any;
        includeSupplementary: boolean;
        continuedWithShortfall: boolean;
        requiredHours: number;
        availableHours: number;
        shortfallHours: number;
        generatedAt: any;
        updatedAt: any;
        holidayConflicts: number;
    };
    slots: TeachingSlot[];
    calendar: {
        id: number;
        name: string;
        startDate: string;
        endDate: string;
        blockedDates: string[];
        exceptions: {
            date: string;
            type: string;
            label: string | null;
        }[];
    } | null;
    progress: import("./progress.js").PlanProgress;
    entries: {
        id: number;
        serialNo: number;
        moduleId: number | null;
        moduleLabel: string | null;
        moduleName: string | null;
        topicId: number | null;
        topicName: string;
        subtopicId: number | null;
        subtopicName: string | null;
        plannedDate: string | null;
        actualDate: string | null;
        displayDate: string | null;
        dateChanged: boolean;
        plannedHours: number;
        actualHours: number;
        hoursChanged: boolean;
        status: string;
        remarks: string | null;
        teachingMethod: string | null;
        rescheduleReason: string | null;
        isSupplementary: boolean;
        isFacultyAdded: boolean;
        sortOrder: number;
        completedAt: {} | null;
    }[];
    audit: {
        id: any;
        action: any;
        createdAt: any;
        actor: any;
        metadata: Record<string, unknown> | null;
    }[];
}>;
export declare function addEntry(planId: number, collegeId: number, actorId: number, body: z.infer<typeof addEntrySchema>): Promise<{
    plan: {
        id: number;
        title: any;
        status: any;
        courseId: number;
        courseName: any;
        courseCode: any;
        departmentName: any;
        programName: any;
        academicYearLabel: any;
        semesterLabel: any;
        sectionLabel: any;
        facultyName: any;
        collegeName: any;
        collegeLogoUrl: any;
        includeSupplementary: boolean;
        continuedWithShortfall: boolean;
        requiredHours: number;
        availableHours: number;
        shortfallHours: number;
        generatedAt: any;
        updatedAt: any;
        holidayConflicts: number;
    };
    slots: TeachingSlot[];
    calendar: {
        id: number;
        name: string;
        startDate: string;
        endDate: string;
        blockedDates: string[];
        exceptions: {
            date: string;
            type: string;
            label: string | null;
        }[];
    } | null;
    progress: import("./progress.js").PlanProgress;
    entries: {
        id: number;
        serialNo: number;
        moduleId: number | null;
        moduleLabel: string | null;
        moduleName: string | null;
        topicId: number | null;
        topicName: string;
        subtopicId: number | null;
        subtopicName: string | null;
        plannedDate: string | null;
        actualDate: string | null;
        displayDate: string | null;
        dateChanged: boolean;
        plannedHours: number;
        actualHours: number;
        hoursChanged: boolean;
        status: string;
        remarks: string | null;
        teachingMethod: string | null;
        rescheduleReason: string | null;
        isSupplementary: boolean;
        isFacultyAdded: boolean;
        sortOrder: number;
        completedAt: {} | null;
    }[];
    audit: {
        id: any;
        action: any;
        createdAt: any;
        actor: any;
        metadata: Record<string, unknown> | null;
    }[];
}>;
export declare function splitEntry(planId: number, entryId: number, collegeId: number, actorId: number, body: z.infer<typeof splitSchema>): Promise<{
    plan: {
        id: number;
        title: any;
        status: any;
        courseId: number;
        courseName: any;
        courseCode: any;
        departmentName: any;
        programName: any;
        academicYearLabel: any;
        semesterLabel: any;
        sectionLabel: any;
        facultyName: any;
        collegeName: any;
        collegeLogoUrl: any;
        includeSupplementary: boolean;
        continuedWithShortfall: boolean;
        requiredHours: number;
        availableHours: number;
        shortfallHours: number;
        generatedAt: any;
        updatedAt: any;
        holidayConflicts: number;
    };
    slots: TeachingSlot[];
    calendar: {
        id: number;
        name: string;
        startDate: string;
        endDate: string;
        blockedDates: string[];
        exceptions: {
            date: string;
            type: string;
            label: string | null;
        }[];
    } | null;
    progress: import("./progress.js").PlanProgress;
    entries: {
        id: number;
        serialNo: number;
        moduleId: number | null;
        moduleLabel: string | null;
        moduleName: string | null;
        topicId: number | null;
        topicName: string;
        subtopicId: number | null;
        subtopicName: string | null;
        plannedDate: string | null;
        actualDate: string | null;
        displayDate: string | null;
        dateChanged: boolean;
        plannedHours: number;
        actualHours: number;
        hoursChanged: boolean;
        status: string;
        remarks: string | null;
        teachingMethod: string | null;
        rescheduleReason: string | null;
        isSupplementary: boolean;
        isFacultyAdded: boolean;
        sortOrder: number;
        completedAt: {} | null;
    }[];
    audit: {
        id: any;
        action: any;
        createdAt: any;
        actor: any;
        metadata: Record<string, unknown> | null;
    }[];
}>;
export declare function mergeEntries(planId: number, entryId: number, otherId: number, collegeId: number, actorId: number): Promise<{
    plan: {
        id: number;
        title: any;
        status: any;
        courseId: number;
        courseName: any;
        courseCode: any;
        departmentName: any;
        programName: any;
        academicYearLabel: any;
        semesterLabel: any;
        sectionLabel: any;
        facultyName: any;
        collegeName: any;
        collegeLogoUrl: any;
        includeSupplementary: boolean;
        continuedWithShortfall: boolean;
        requiredHours: number;
        availableHours: number;
        shortfallHours: number;
        generatedAt: any;
        updatedAt: any;
        holidayConflicts: number;
    };
    slots: TeachingSlot[];
    calendar: {
        id: number;
        name: string;
        startDate: string;
        endDate: string;
        blockedDates: string[];
        exceptions: {
            date: string;
            type: string;
            label: string | null;
        }[];
    } | null;
    progress: import("./progress.js").PlanProgress;
    entries: {
        id: number;
        serialNo: number;
        moduleId: number | null;
        moduleLabel: string | null;
        moduleName: string | null;
        topicId: number | null;
        topicName: string;
        subtopicId: number | null;
        subtopicName: string | null;
        plannedDate: string | null;
        actualDate: string | null;
        displayDate: string | null;
        dateChanged: boolean;
        plannedHours: number;
        actualHours: number;
        hoursChanged: boolean;
        status: string;
        remarks: string | null;
        teachingMethod: string | null;
        rescheduleReason: string | null;
        isSupplementary: boolean;
        isFacultyAdded: boolean;
        sortOrder: number;
        completedAt: {} | null;
    }[];
    audit: {
        id: any;
        action: any;
        createdAt: any;
        actor: any;
        metadata: Record<string, unknown> | null;
    }[];
}>;
export declare function moveEntry(planId: number, entryId: number, collegeId: number, actorId: number, direction: 'up' | 'down'): Promise<{
    plan: {
        id: number;
        title: any;
        status: any;
        courseId: number;
        courseName: any;
        courseCode: any;
        departmentName: any;
        programName: any;
        academicYearLabel: any;
        semesterLabel: any;
        sectionLabel: any;
        facultyName: any;
        collegeName: any;
        collegeLogoUrl: any;
        includeSupplementary: boolean;
        continuedWithShortfall: boolean;
        requiredHours: number;
        availableHours: number;
        shortfallHours: number;
        generatedAt: any;
        updatedAt: any;
        holidayConflicts: number;
    };
    slots: TeachingSlot[];
    calendar: {
        id: number;
        name: string;
        startDate: string;
        endDate: string;
        blockedDates: string[];
        exceptions: {
            date: string;
            type: string;
            label: string | null;
        }[];
    } | null;
    progress: import("./progress.js").PlanProgress;
    entries: {
        id: number;
        serialNo: number;
        moduleId: number | null;
        moduleLabel: string | null;
        moduleName: string | null;
        topicId: number | null;
        topicName: string;
        subtopicId: number | null;
        subtopicName: string | null;
        plannedDate: string | null;
        actualDate: string | null;
        displayDate: string | null;
        dateChanged: boolean;
        plannedHours: number;
        actualHours: number;
        hoursChanged: boolean;
        status: string;
        remarks: string | null;
        teachingMethod: string | null;
        rescheduleReason: string | null;
        isSupplementary: boolean;
        isFacultyAdded: boolean;
        sortOrder: number;
        completedAt: {} | null;
    }[];
    audit: {
        id: any;
        action: any;
        createdAt: any;
        actor: any;
        metadata: Record<string, unknown> | null;
    }[];
}>;
export declare function archivePlan(planId: number, collegeId: number, actorId: number): Promise<{
    plan: {
        id: number;
        title: any;
        status: any;
        courseId: number;
        courseName: any;
        courseCode: any;
        departmentName: any;
        programName: any;
        academicYearLabel: any;
        semesterLabel: any;
        sectionLabel: any;
        facultyName: any;
        collegeName: any;
        collegeLogoUrl: any;
        includeSupplementary: boolean;
        continuedWithShortfall: boolean;
        requiredHours: number;
        availableHours: number;
        shortfallHours: number;
        generatedAt: any;
        updatedAt: any;
        holidayConflicts: number;
    };
    slots: TeachingSlot[];
    calendar: {
        id: number;
        name: string;
        startDate: string;
        endDate: string;
        blockedDates: string[];
        exceptions: {
            date: string;
            type: string;
            label: string | null;
        }[];
    } | null;
    progress: import("./progress.js").PlanProgress;
    entries: {
        id: number;
        serialNo: number;
        moduleId: number | null;
        moduleLabel: string | null;
        moduleName: string | null;
        topicId: number | null;
        topicName: string;
        subtopicId: number | null;
        subtopicName: string | null;
        plannedDate: string | null;
        actualDate: string | null;
        displayDate: string | null;
        dateChanged: boolean;
        plannedHours: number;
        actualHours: number;
        hoursChanged: boolean;
        status: string;
        remarks: string | null;
        teachingMethod: string | null;
        rescheduleReason: string | null;
        isSupplementary: boolean;
        isFacultyAdded: boolean;
        sortOrder: number;
        completedAt: {} | null;
    }[];
    audit: {
        id: any;
        action: any;
        createdAt: any;
        actor: any;
        metadata: Record<string, unknown> | null;
    }[];
}>;
export declare function deletePlan(planId: number, collegeId: number, actorId: number): Promise<{
    ok: boolean;
}>;
export declare function listCalendars(collegeId: number): Promise<{
    id: number;
    name: any;
    academicYearId: number;
    academicYearLabel: any;
    semesterId: number | null;
    semesterLabel: any;
    startDate: string | null;
    endDate: string | null;
    workingWeekdays: any;
    isDefault: boolean;
    exceptions: {
        id: number;
        date: string | null;
        type: any;
        label: any;
    }[];
}[]>;
export declare function createCalendar(collegeId: number, body: z.infer<typeof calendarSchema>): Promise<{
    id: number;
}>;
export declare function updateCalendar(collegeId: number, calendarId: number, body: Partial<z.infer<typeof calendarSchema>>): Promise<{
    id: number;
}>;
export declare function addException(collegeId: number, calendarId: number, body: z.infer<typeof exceptionSchema>): Promise<{
    id: number;
    affectedPlans: number;
}>;
export declare function deleteException(collegeId: number, calendarId: number, exceptionId: number): Promise<{
    ok: boolean;
}>;
export declare function updateMasterSubtopic(collegeId: number, subtopicId: number, body: {
    name?: string;
    suggestedHours?: number;
    notes?: string | null;
    classification?: string;
}): Promise<{
    id: number;
}>;
export declare function audit(action: LessonAuditAction, collegeId: number, planId: number, actorId: number, metadata?: Record<string, unknown>): Promise<void>;
