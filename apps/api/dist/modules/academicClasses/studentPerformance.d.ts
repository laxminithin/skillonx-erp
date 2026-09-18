export declare function studentPerformance(studentId: number, courseId?: number): Promise<{
    overall: null;
    subjects: unknown[];
} | {
    overall: {
        progress: number;
        assignments: {
            obtained: number;
            max: number;
            done: number;
            total: number;
        };
        quizzes: {
            obtained: number;
            max: number;
            done: number;
            total: number;
        };
        internals: {
            obtained: number;
            max: number;
            done: number;
            total: number;
        };
        attendance: number | null;
        attendanceStanding: {
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
        } | null;
    };
    subjects: {
        courseId: number;
        name: any;
        code: any;
        facultyName: string | null;
        learningProgress: number;
        assignments: {
            done: number;
            total: number;
            obtained: number;
            max: number;
        };
        quizzes: {
            done: number;
            total: number;
            obtained: number;
            max: number;
        };
        internals: {
            done: number;
            total: number;
            obtained: number;
            max: number;
        };
        attendance: number | null;
        attendanceStanding: {
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
        } | null;
    }[];
}>;
export declare function studentCoPerformance(studentId: number, courseId: number): Promise<{
    outcomes: {
        id: number;
        code: any;
        statement: any;
        percentage: number | null;
        band: string;
        tone: "muted" | "success" | "warning" | "danger";
    }[];
}>;
export declare function academicHistory(studentId: number): Promise<{
    history: {
        enrollmentId: number;
        classId: number;
        status: string;
        current: boolean;
        academicYearLabel: any;
        semesterLabel: any;
        semesterNumber: number | null;
        departmentCode: any;
        sectionLabel: any;
        displayName: string;
    }[];
}>;
export declare function academicHistoryClass(studentId: number, classId: number): Promise<{
    class: {
        id: number;
        collegeId: number;
        collegeName: any;
        academicYearId: number;
        academicYearLabel: any;
        programId: number;
        programName: any;
        programCode: any;
        departmentId: number;
        departmentName: any;
        departmentCode: any;
        semesterId: number;
        semesterLabel: any;
        semesterNumber: number | null;
        schemeId: number | null;
        schemeName: any;
        schemeCode: any;
        classSectionId: number;
        sectionLabel: any;
        coordinatorId: number | null;
        coordinatorName: any;
        name: any;
        displayName: string;
        code: any;
        status: any;
        studentCount: number;
        pendingCount: number;
        subjectCount: number;
        facultyCount: number;
        createdAt: any;
        updatedAt: any;
    };
    attendance: {
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
    } | null;
    subjects: {
        courseId: number;
        code: any;
        name: any;
        facultyName: string | null;
        progress: number;
        attendance: number | null;
        attendanceStanding: {
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
        } | null;
    }[];
}>;
