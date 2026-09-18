import type { ManagementActor } from './types.js';
export declare function departmentScorecards(actor: ManagementActor): Promise<{
    departments: import("./metrics.js").DeptRow[];
    count: number;
}>;
export declare function departmentDetail(actor: ManagementActor, departmentId: number): Promise<import("./sources.js").SourceResult<{
    hods: import("../academicLeadership/types.js").LeadershipAssignment[];
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
}>>;
