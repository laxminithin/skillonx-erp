import { activeClassForStudent, isCoreKind, subjectsForStudent } from './studentAccess.js';
export { activeClassForStudent, subjectsForStudent, isCoreKind };
export declare function studentDashboard(studentId: number): Promise<{
    class: null;
    pending: {
        enrollmentId: number;
        classId: number;
        name: any;
        displayName: string;
        status: any;
        remarks: any;
        departmentCode: any;
        departmentName: any;
        semesterNumber: number | null;
        semesterLabel: any;
        sectionLabel: any;
    }[];
    subjects: never[];
    backlogs: never[];
    additional: never[];
    announcements: never[];
    upcoming: {
        assignments: number;
        quizzes: number;
        assessments: number;
        materials: number;
        items: never[];
    };
    recentlyAdded: never[];
    performance: null;
    continueLearning: null;
    todayClasses: never[];
    progress: number;
    electiveOptions: never[];
    selectedElectiveIds: never[];
    attendance?: undefined;
} | {
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
    pending: {
        enrollmentId: number;
        classId: number;
        name: any;
        displayName: string;
        status: any;
        remarks: any;
        departmentCode: any;
        departmentName: any;
        semesterNumber: number | null;
        semesterLabel: any;
        sectionLabel: any;
    }[];
    subjects: {
        nextActivity: {
            kind: string;
            title: string;
            at: string | Date;
        } | {
            kind: string;
            title: string;
            at: null;
        };
        courseId: number;
        code: any;
        name: any;
        kind: any;
        courseType: string;
        credits: number | null;
        facultyName: string | null;
        faculty: {
            facultyId: number;
            name: any;
            designation: any;
            isPrimary: boolean;
            canManage: boolean;
        }[];
        progress: any;
        pendingTasks: any;
        nextAssignment: {
            title: any;
            dueAt: any;
        } | null;
        nextQuiz: {
            title: any;
            endAt: any;
        } | null;
    }[];
    electiveOptions: {
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
    }[];
    selectedElectiveIds: number[];
    backlogs: {
        id: number;
        courseId: number;
        code: any;
        name: any;
        courseType: any;
        credits: number | null;
        originSemesterId: number | null;
        faculty: import("./studentAccess.js").ClassSubject["faculty"];
        kind: string;
        source: "BACKLOG";
    }[];
    additional: {
        id: number;
        courseId: number;
        code: any;
        name: any;
        courseType: any;
        credits: number | null;
        reason: any;
        faculty: import("./studentAccess.js").ClassSubject["faculty"];
        kind: string;
        source: "OVERRIDE";
    }[];
    announcements: {
        unread: boolean;
        id: number;
        scope: any;
        title: any;
        body: any;
        courseId: number | null;
        courseCode: any;
        courseName: any;
        authorName: any;
        publishedAt: any;
    }[];
    upcoming: {
        assignments: number;
        quizzes: number;
        assessments: number;
        materials: number;
        items: ({
            kind: "assignment";
            id: any;
            title: any;
            endAt: any;
            courseId: any;
            courseName: any;
            path: string;
        } | {
            kind: "quiz";
            id: any;
            title: any;
            endAt: any;
            courseId: any;
            courseName: any;
            path: string;
        } | {
            kind: "assessment";
            id: any;
            title: any;
            endAt: any;
            courseId: any;
            courseName: any;
            path: string;
        })[];
    };
    recentlyAdded: ({
        kind: "assignment";
        id: any;
        title: any;
        at: any;
        path: string;
    } | {
        kind: "quiz";
        id: any;
        title: any;
        at: any;
        path: string;
    } | {
        kind: "announcement";
        id: number;
        title: any;
        at: any;
        path: string;
    })[];
    continueLearning: {
        courseId: number;
        courseName: any;
        courseCode: any;
        moduleId: number | null;
        moduleName: any;
        topicId: number | null;
        topicName: any;
        path: any;
        label: any;
    } | null;
    todayClasses: never[] | import("../timetable/types.js").Occurrence[];
    progress: number;
    performance: {
        assignments: {
            obtained: number;
            max: number;
        };
        quizzes: {
            obtained: number;
            max: number;
        };
        internals: {
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
        attendanceBelowCount: number;
    };
    attendance: {
        policy: import("../attendance/policy.js").AttendancePolicy;
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
        policy: import("../attendance/policy.js").AttendancePolicy;
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
    } | null;
}>;
export declare function studentSubjects(studentId: number): Promise<{
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
    } | null;
    subjects: never[] | {
        nextActivity: {
            kind: string;
            title: string;
            at: string | Date;
        } | {
            kind: string;
            title: string;
            at: null;
        };
        courseId: number;
        code: any;
        name: any;
        kind: any;
        courseType: string;
        credits: number | null;
        facultyName: string | null;
        faculty: {
            facultyId: number;
            name: any;
            designation: any;
            isPrimary: boolean;
            canManage: boolean;
        }[];
        progress: any;
        pendingTasks: any;
        nextAssignment: {
            title: any;
            dueAt: any;
        } | null;
        nextQuiz: {
            title: any;
            endAt: any;
        } | null;
    }[];
    backlogs: never[] | {
        id: number;
        courseId: number;
        code: any;
        name: any;
        courseType: any;
        credits: number | null;
        originSemesterId: number | null;
        faculty: import("./studentAccess.js").ClassSubject["faculty"];
        kind: string;
        source: "BACKLOG";
    }[];
    additional: never[] | {
        id: number;
        courseId: number;
        code: any;
        name: any;
        courseType: any;
        credits: number | null;
        reason: any;
        faculty: import("./studentAccess.js").ClassSubject["faculty"];
        kind: string;
        source: "OVERRIDE";
    }[];
    electiveOptions: never[] | {
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
    }[];
    selectedElectiveIds: number[] | never[];
}>;
export declare function studentCurrentClass(studentId: number): Promise<{
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
    } | null;
    pending: {
        enrollmentId: number;
        classId: number;
        name: any;
        displayName: string;
        status: any;
        remarks: any;
        departmentCode: any;
        departmentName: any;
        semesterNumber: number | null;
        semesterLabel: any;
        sectionLabel: any;
    }[];
    subjectCount: number;
}>;
export declare function studentSubject(studentId: number, courseId: number): Promise<{
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
    historical: boolean;
    source: "CLASS" | "BACKLOG" | "OVERRIDE" | "HISTORY";
    subject: {
        courseId: number;
        code: string;
        name: string;
        kind: string | undefined;
        courseType: string;
        credits: number | null;
        facultyName: string | null;
        faculty: {
            name: string;
        }[];
        progress: any;
        pendingTasks: any;
    };
    modules: {
        topics: {
            completed: boolean;
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
        completedTopics: number;
        progress: number;
        id: number;
        name: string;
        unitKind: any;
        sortOrder: number;
        topicCount: number;
        subtopicCount: number;
        hours: any;
    }[];
    outcomes: {
        id: number;
        code: any;
        statement: any;
        number: number | null;
    }[];
    announcements: {
        unread: boolean;
        faculty: any;
        id: number;
        scope: any;
        title: any;
        body: any;
        courseId: number | null;
        courseCode: any;
        courseName: any;
        authorName: any;
        publishedAt: any;
    }[];
    beyondSyllabus: {
        [x: string]: any;
    }[] | {
        id: number;
        title: any;
        whyItMatters: any;
        learningObjective: any;
        resources: any;
        activity: any;
        module: any;
        relatedTopic: any;
        hours: number | null;
    }[];
    assignments: {
        [x: string]: any;
    }[] | {
        id: number;
        title: any;
        courseId: number;
        courseName: string | undefined;
        courseCode: string | undefined;
        moduleName: any;
        facultyName: any;
        startAt: any;
        dueAt: any;
        publishedAt: any;
        attemptsAllowed: number;
        lateSubmissionAllowed: boolean;
        effectiveStatus: import("../assignments/status.js").AvailabilityStatus;
        studentStatus: string;
        obtainedMarks: number | null;
        totalMarks: number | null;
    }[];
    quizzes: {
        [x: string]: any;
    }[] | {
        id: number;
        title: any;
        courseId: number;
        courseName: string | undefined;
        courseCode: string | undefined;
        moduleName: any;
        startAt: any;
        endAt: any;
        durationMinutes: number | null;
        attemptsAllowed: number;
        attemptsUsed: number;
        effectiveStatus: import("../assignments/status.js").AvailabilityStatus;
        bucket: "COMPLETED" | "UPCOMING" | "AVAILABLE";
        inProgress: boolean;
        scoreReleased: boolean;
        obtainedMarks: number | null;
        totalMarks: number | null;
    }[];
    assessments: {
        [x: string]: any;
    }[] | {
        id: number;
        title: any;
        courseId: number;
        courseName: any;
        courseCode: any;
        sourceKind: any;
        date: any;
        maxMarks: number;
        marks: number | null;
        percentage: number | null;
        status: string;
        coBreakup: {
            code: string;
            awarded: number;
            max: number;
            percentage: number | null;
        }[];
    }[];
    coPerformance: {
        id: number;
        code: any;
        statement: any;
        percentage: number | null;
        band: string;
        tone: "muted" | "success" | "warning" | "danger";
    }[];
    attendance: {
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
        PRESENT: number;
        ABSENT: number;
        total: number;
    } | null;
    continueLearning: {
        courseId: number;
        courseName: any;
        courseCode: any;
        moduleId: number | null;
        moduleName: any;
        topicId: number | null;
        topicName: any;
        path: any;
        label: any;
    } | null;
}>;
export declare function selectElective(studentId: number, classId: number, classSubjectId: number): Promise<{
    class: null;
    pending: {
        enrollmentId: number;
        classId: number;
        name: any;
        displayName: string;
        status: any;
        remarks: any;
        departmentCode: any;
        departmentName: any;
        semesterNumber: number | null;
        semesterLabel: any;
        sectionLabel: any;
    }[];
    subjects: never[];
    backlogs: never[];
    additional: never[];
    announcements: never[];
    upcoming: {
        assignments: number;
        quizzes: number;
        assessments: number;
        materials: number;
        items: never[];
    };
    recentlyAdded: never[];
    performance: null;
    continueLearning: null;
    todayClasses: never[];
    progress: number;
    electiveOptions: never[];
    selectedElectiveIds: never[];
    attendance?: undefined;
} | {
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
    pending: {
        enrollmentId: number;
        classId: number;
        name: any;
        displayName: string;
        status: any;
        remarks: any;
        departmentCode: any;
        departmentName: any;
        semesterNumber: number | null;
        semesterLabel: any;
        sectionLabel: any;
    }[];
    subjects: {
        nextActivity: {
            kind: string;
            title: string;
            at: string | Date;
        } | {
            kind: string;
            title: string;
            at: null;
        };
        courseId: number;
        code: any;
        name: any;
        kind: any;
        courseType: string;
        credits: number | null;
        facultyName: string | null;
        faculty: {
            facultyId: number;
            name: any;
            designation: any;
            isPrimary: boolean;
            canManage: boolean;
        }[];
        progress: any;
        pendingTasks: any;
        nextAssignment: {
            title: any;
            dueAt: any;
        } | null;
        nextQuiz: {
            title: any;
            endAt: any;
        } | null;
    }[];
    electiveOptions: {
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
    }[];
    selectedElectiveIds: number[];
    backlogs: {
        id: number;
        courseId: number;
        code: any;
        name: any;
        courseType: any;
        credits: number | null;
        originSemesterId: number | null;
        faculty: import("./studentAccess.js").ClassSubject["faculty"];
        kind: string;
        source: "BACKLOG";
    }[];
    additional: {
        id: number;
        courseId: number;
        code: any;
        name: any;
        courseType: any;
        credits: number | null;
        reason: any;
        faculty: import("./studentAccess.js").ClassSubject["faculty"];
        kind: string;
        source: "OVERRIDE";
    }[];
    announcements: {
        unread: boolean;
        id: number;
        scope: any;
        title: any;
        body: any;
        courseId: number | null;
        courseCode: any;
        courseName: any;
        authorName: any;
        publishedAt: any;
    }[];
    upcoming: {
        assignments: number;
        quizzes: number;
        assessments: number;
        materials: number;
        items: ({
            kind: "assignment";
            id: any;
            title: any;
            endAt: any;
            courseId: any;
            courseName: any;
            path: string;
        } | {
            kind: "quiz";
            id: any;
            title: any;
            endAt: any;
            courseId: any;
            courseName: any;
            path: string;
        } | {
            kind: "assessment";
            id: any;
            title: any;
            endAt: any;
            courseId: any;
            courseName: any;
            path: string;
        })[];
    };
    recentlyAdded: ({
        kind: "assignment";
        id: any;
        title: any;
        at: any;
        path: string;
    } | {
        kind: "quiz";
        id: any;
        title: any;
        at: any;
        path: string;
    } | {
        kind: "announcement";
        id: number;
        title: any;
        at: any;
        path: string;
    })[];
    continueLearning: {
        courseId: number;
        courseName: any;
        courseCode: any;
        moduleId: number | null;
        moduleName: any;
        topicId: number | null;
        topicName: any;
        path: any;
        label: any;
    } | null;
    todayClasses: never[] | import("../timetable/types.js").Occurrence[];
    progress: number;
    performance: {
        assignments: {
            obtained: number;
            max: number;
        };
        quizzes: {
            obtained: number;
            max: number;
        };
        internals: {
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
        attendanceBelowCount: number;
    };
    attendance: {
        policy: import("../attendance/policy.js").AttendancePolicy;
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
        policy: import("../attendance/policy.js").AttendancePolicy;
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
    } | null;
}>;
