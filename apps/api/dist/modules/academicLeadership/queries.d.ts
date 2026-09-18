import type { HrActor } from '../hr/types.js';
export declare function resolveScopedDepartmentId(actor: HrActor, requestedDepartmentId?: number | null): Promise<{
    departmentId: number | null;
    actor: HrActor;
    ctx: import("./types.js").LeadershipContext;
    collegeWide: boolean;
}>;
export declare function hodDashboard(actor: HrActor, departmentId?: number | null): Promise<{
    department: {
        id: null;
        name: string;
        code: null;
    } | {
        id: number;
        name: any;
        code: any;
    };
    metrics: {
        facultyCount: number;
        studentCount: number;
        programCount: number;
        classCount: number;
        subjectCount: number;
        todayClasses: number;
        facultyAbsentToday: number;
        facultyOnApprovedLeave: number;
        pendingFacultyLeave: number;
        facultyAttendancePct: number | null;
        studentAttendancePct: number | null;
        academicProgressPct: number | null;
        assessmentsPending: number;
        continuityExceptions: number;
        substitutionsToday: number;
        pendingHodActions: number;
    };
    alerts: {
        severity: "high" | "medium" | "low";
        title: string;
        count: number;
    }[];
}>;
export declare function principalDashboard(actor: HrActor): Promise<{
    metrics: {
        departmentCount: number;
        facultyCount: number;
        studentCount: number;
        programCount: number;
        facultyAttendancePct: number | null;
        studentAttendancePct: number | null;
        academicProgressPct: number | null;
        assessmentsPending: number;
        pendingApprovals: number;
        continuityExceptions: number;
        facultyAbsentToday: number;
        activeHodCount: number;
    };
    departmentComparison: {
        departmentId: number;
        departmentName: unknown;
        departmentCode: unknown;
        attendancePct: number | null;
        academicProgressPct: number | null;
        assessmentPending: number;
        exceptions: number;
        pendingLeave: number;
        facultyCount: number;
        studentCount: number;
    }[];
    hods: import("./types.js").LeadershipAssignment[];
}>;
export declare function departmentOverview(actor: HrActor, departmentId: number): Promise<{
    hods: import("./types.js").LeadershipAssignment[];
    faculty: {
        id: number;
        employeeNumber: any;
        name: any;
        designation: any;
        employmentStatus: any;
        departmentId: number | null;
        departmentName: any;
        teaching: {
            courseName: unknown;
            courseCode: unknown;
            className: unknown;
            classCode: unknown;
        }[];
        weeklyHours: number;
        attendanceToday: string | null;
        currentLeave: {
            requestId: number;
            leaveType: any;
            fromDate: string;
            toDate: string;
        } | null;
    }[];
    department: {
        id: null;
        name: string;
        code: null;
    } | {
        id: number;
        name: any;
        code: any;
    };
    metrics: {
        facultyCount: number;
        studentCount: number;
        programCount: number;
        classCount: number;
        subjectCount: number;
        todayClasses: number;
        facultyAbsentToday: number;
        facultyOnApprovedLeave: number;
        pendingFacultyLeave: number;
        facultyAttendancePct: number | null;
        studentAttendancePct: number | null;
        academicProgressPct: number | null;
        assessmentsPending: number;
        continuityExceptions: number;
        substitutionsToday: number;
        pendingHodActions: number;
    };
    alerts: {
        severity: "high" | "medium" | "low";
        title: string;
        count: number;
    }[];
}>;
export declare function listDepartmentsForPrincipal(actor: HrActor): Promise<{
    id: number;
    name: unknown;
    code: unknown;
    hod: import("./types.js").LeadershipAssignment | null;
    facultyCount: number;
    studentCount: number;
    pendingLeave: number;
    exceptions: number;
}[]>;
export declare function listDepartmentFaculty(actor: HrActor, departmentId?: number | null): Promise<{
    id: number;
    employeeNumber: any;
    name: any;
    designation: any;
    employmentStatus: any;
    departmentId: number | null;
    departmentName: any;
    teaching: {
        courseName: unknown;
        courseCode: unknown;
        className: unknown;
        classCode: unknown;
    }[];
    weeklyHours: number;
    attendanceToday: string | null;
    currentLeave: {
        requestId: number;
        leaveType: any;
        fromDate: string;
        toDate: string;
    } | null;
}[]>;
export declare function listWorkload(actor: HrActor, departmentId?: number | null): Promise<{
    employeeId: number;
    name: any;
    designation: any;
    assignedSubjects: unknown[];
    classes: unknown[];
    weeklyTeachingLoad: number;
    additionalResponsibilities: string[];
    currentLoadHours: number;
}[]>;
export declare function listTeachingAllocation(actor: HrActor, departmentId?: number | null): Promise<{
    id: number;
    classId: number;
    classSubjectId: number;
    facultyId: number;
    facultyName: unknown;
    courseName: unknown;
    courseCode: unknown;
    className: unknown;
    classCode: unknown;
    departmentId: number;
    isPrimary: boolean;
}[]>;
export declare function assignTeaching(actor: HrActor, input: {
    classId: number;
    classSubjectId: number;
    facultyId: number;
    isPrimary?: boolean;
    canManage?: boolean;
}): Promise<{
    id: number;
    courseId: number;
    code: any;
    name: any;
    kind: any;
    electiveGroup: any;
    credits: number | null;
    faculty: {
        facultyId: number;
        name: any;
        designation: any;
        isPrimary: boolean;
        canManage: boolean;
    }[];
    facultyNames: any[];
}[]>;
export declare function unassignTeaching(actor: HrActor, input: {
    classId: number;
    classSubjectId: number;
    facultyId: number;
}): Promise<{
    id: number;
    courseId: number;
    code: any;
    name: any;
    kind: any;
    electiveGroup: any;
    credits: number | null;
    faculty: {
        facultyId: number;
        name: any;
        designation: any;
        isPrimary: boolean;
        canManage: boolean;
    }[];
    facultyNames: any[];
}[]>;
export declare function listTimetable(actor: HrActor, departmentId?: number | null): Promise<{
    id: number;
    dayOfWeek: number;
    startTime: unknown;
    endTime: unknown;
    period: unknown;
    className: unknown;
    classCode: unknown;
    departmentId: number;
    courseName: unknown;
    courseCode: unknown;
    facultyName: unknown;
}[]>;
export declare function listFacultyAttendance(actor: HrActor, departmentId?: number | null, from?: string, to?: string): Promise<{
    employeeId: number;
    employeeName: unknown;
    employeeNumber: unknown;
    date: string;
    status: unknown;
    workMinutes: unknown;
}[]>;
export declare function listAcademicProgress(actor: HrActor, departmentId?: number | null): Promise<{
    planId: number;
    courseName: any;
    courseCode: any;
    facultyName: any;
    plannedProgress: number;
    actualProgress: number;
    completionPct: number;
    pendingUnits: number;
    status: any;
}[]>;
export declare function listAssessmentMonitoring(actor: HrActor, departmentId?: number | null): Promise<Record<string, unknown>[]>;
export declare function listResultsMonitoring(actor: HrActor, departmentId?: number | null): Promise<{
    id: number;
    status: unknown;
    courseName: unknown;
    courseCode: unknown;
    facultyName: unknown;
}[]>;
export declare function listContinuity(actor: HrActor, departmentId?: number | null): Promise<{
    id: number;
    status: unknown;
    coverageType: unknown;
    affectedDate: string;
    hodActionRequired: boolean;
    employeeName: unknown;
    departmentId: number | null;
    leaveRequestId: number;
    leaveStatus: unknown;
    subjectName: unknown;
}[]>;
export declare function listExceptions(actor: HrActor, departmentId?: number | null): Promise<{
    id: number;
    status: unknown;
    coverageType: unknown;
    affectedDate: string;
    hodActionRequired: boolean;
    employeeName: unknown;
    departmentId: number | null;
    leaveRequestId: number;
    leaveStatus: unknown;
    subjectName: unknown;
}[]>;
export declare function leadershipReports(actor: HrActor, departmentId?: number | null): Promise<{
    department: {
        id: null;
        name: string;
        code: null;
    } | {
        id: number;
        name: any;
        code: any;
    };
    metrics: {
        facultyCount: number;
        studentCount: number;
        programCount: number;
        classCount: number;
        subjectCount: number;
        todayClasses: number;
        facultyAbsentToday: number;
        facultyOnApprovedLeave: number;
        pendingFacultyLeave: number;
        facultyAttendancePct: number | null;
        studentAttendancePct: number | null;
        academicProgressPct: number | null;
        assessmentsPending: number;
        continuityExceptions: number;
        substitutionsToday: number;
        pendingHodActions: number;
    };
    alerts: {
        severity: "high" | "medium" | "low";
        title: string;
        count: number;
    }[];
    generatedAt: string;
} | {
    metrics: {
        departmentCount: number;
        facultyCount: number;
        studentCount: number;
        programCount: number;
        facultyAttendancePct: number | null;
        studentAttendancePct: number | null;
        academicProgressPct: number | null;
        assessmentsPending: number;
        pendingApprovals: number;
        continuityExceptions: number;
        facultyAbsentToday: number;
        activeHodCount: number;
    };
    departmentComparison: {
        departmentId: number;
        departmentName: unknown;
        departmentCode: unknown;
        attendancePct: number | null;
        academicProgressPct: number | null;
        assessmentPending: number;
        exceptions: number;
        pendingLeave: number;
        facultyCount: number;
        studentCount: number;
    }[];
    hods: import("./types.js").LeadershipAssignment[];
    generatedAt: string;
}>;
export declare function listStudentsOverview(actor: HrActor, departmentId?: number | null): Promise<{
    count: number;
    classes: {
        classId: number;
        className: any;
        classCode: any;
        departmentId: number;
        studentCount: number;
    }[];
}>;
