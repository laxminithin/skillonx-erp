import type { CieComponent } from './types.js';
export declare function computeInternalMarks(studentId: number, courseId: number, classId: number | null, collegeId: number, schemeId?: number | null, programId?: number | null): Promise<{
    internalMarks: number;
    internalMax: number;
    breakdown: {
        label: string;
        obtained: number;
        max: number;
        weight: number;
    }[];
    policy: {
        id: number;
        collegeId: number;
        schemeId: number | null;
        programId: number | null;
        name: any;
        minimumAttendancePct: number;
        minimumInternalMarks: number | null;
        cieMaximum: number;
        seeMaximum: number;
        passPercentage: number;
        minimumSeeScore: number | null;
        internalAggregation: any;
        cieComponents: CieComponent[];
        gradeBands: import("./types.js").GradeBand[];
        isActive: boolean;
        version: number;
        createdAt: any;
        updatedAt: any;
    } | {
        id: null;
        collegeId: number;
        schemeId: number | null;
        programId: number | null;
        name: string;
        minimumAttendancePct: number;
        minimumInternalMarks: null;
        cieMaximum: number;
        seeMaximum: number;
        passPercentage: number;
        minimumSeeScore: null;
        internalAggregation: "WEIGHTED_SUM";
        cieComponents: ({
            kind: "IA";
            label: string;
            weight: number;
            aggregation: "SUM";
        } | {
            kind: "ASSIGNMENT";
            label: string;
            weight: number;
            aggregation: "SUM";
        } | {
            kind: "QUIZ";
            label: string;
            weight: number;
            aggregation: "SUM";
        })[];
        gradeBands: import("./types.js").GradeBand[];
        isActive: boolean;
        version: number;
    };
}>;
export declare function studentAttendancePct(studentId: number, courseId: number, classId: number | null): Promise<number | null>;
export declare function eligibleStudentsForSubject(examId: number, examSubjectId: number, courseId: number, classId: number | null, collegeId: number, examType: string): Promise<{
    studentId: number;
    classId: number | null;
    source: string;
}[]>;
