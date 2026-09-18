import { listClassSubjects } from './service.js';
type Row = Record<string, any>;
export type ClassSubject = Awaited<ReturnType<typeof listClassSubjects>>[number];
export type AccessibleSubject = {
    id: number;
    courseId: number;
    code: string;
    name: string;
    kind: string;
    credits?: number | null;
    faculty: ClassSubject['faculty'];
    facultyName?: string | null;
    source: 'CLASS' | 'BACKLOG' | 'OVERRIDE';
    originSemesterId?: number | null;
    reason?: string | null;
};
export declare function isCoreKind(kind: string): kind is "CORE" | "LAB" | "ABILITY_ENHANCEMENT";
export declare function loadActiveStudent(studentId: number): Promise<Row>;
export declare function approvedEnrollments(studentId: number): Promise<any[]>;
export declare function activeClassForStudent(studentId: number): Promise<number | null>;
export declare function subjectsForStudent(studentId: number, classId: number): Promise<{
    all: {
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
    current: {
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
    electives: {
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
        faculty: ClassSubject["faculty"];
        kind: string;
        source: "BACKLOG";
    }[];
    overrides: {
        id: number;
        courseId: number;
        code: any;
        name: any;
        courseType: any;
        credits: number | null;
        reason: any;
        faculty: ClassSubject["faculty"];
        kind: string;
        source: "OVERRIDE";
    }[];
}>;
export declare function accessibleCourseIds(pack: Awaited<ReturnType<typeof subjectsForStudent>>): number[];
export declare function pendingEnrollments(studentId: number): Promise<any[]>;
export declare function serializePending(row: Row): {
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
};
export type SubjectAccess = {
    student: Row;
    classId: number;
    classRow: Row;
    collegeId: number;
    subject: {
        courseId: number;
        code: string;
        name: string;
        kind?: string;
        credits?: number | null;
        faculty?: ClassSubject['faculty'];
        facultyName?: string | null;
    };
    source: 'CLASS' | 'BACKLOG' | 'OVERRIDE' | 'HISTORY';
    historical: boolean;
    pack: Awaited<ReturnType<typeof subjectsForStudent>>;
};
export declare function assertSubjectAccess(studentId: number, courseId: number): Promise<SubjectAccess>;
export declare function assertClassMembership(studentId: number, classId: number): Promise<{
    student: Row;
    enrollment: any;
    classRow: {
        [x: string]: any;
    };
    collegeId: number;
}>;
export declare function currentClassContext(studentId: number): Promise<{
    student: Row;
    collegeId: number;
    classId: number | null;
    classRow: Row | null;
    class: null;
    pack: null;
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
} | {
    student: Row;
    collegeId: number;
    classId: number;
    classRow: {
        [x: string]: any;
    };
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
    pack: {
        all: {
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
        current: {
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
        electives: {
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
            faculty: ClassSubject["faculty"];
            kind: string;
            source: "BACKLOG";
        }[];
        overrides: {
            id: number;
            courseId: number;
            code: any;
            name: any;
            courseType: any;
            credits: number | null;
            reason: any;
            faculty: ClassSubject["faculty"];
            kind: string;
            source: "OVERRIDE";
        }[];
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
}>;
export declare function facultyName(subject: {
    faculty?: Array<{
        name: string;
    }>;
    facultyName?: string | null;
}): string | null;
export declare function courseTypeLabel(kind?: string | null, courseType?: string | null): "Laboratory" | "Elective" | "Open Elective" | "Ability Enhancement" | "Project" | "Theory";
export {};
