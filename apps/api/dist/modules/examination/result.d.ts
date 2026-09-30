import { z } from 'zod';
import type { ExamActor } from './access.js';
export declare function processResults(actor: ExamActor, examId: number): Promise<{
    studentsProcessed: number;
}>;
export declare function publishResults(actor: ExamActor, examId: number): Promise<{
    published: number;
}>;
export declare const resultCorrectionSchema: z.ZodObject<{
    reason: z.ZodString;
    subjectCorrections: z.ZodArray<z.ZodObject<{
        courseId: z.ZodNumber;
        totalMarks: z.ZodOptional<z.ZodNumber>;
        internalMarks: z.ZodOptional<z.ZodNumber>;
        externalMarks: z.ZodOptional<z.ZodNumber>;
        maxMarks: z.ZodOptional<z.ZodNumber>;
        credits: z.ZodOptional<z.ZodNumber>;
        resultStatus: z.ZodOptional<z.ZodEnum<["PASS", "FAIL", "ABSENT", "MALPRACTICE", "WITHHELD"]>>;
    }, "strip", z.ZodTypeAny, {
        courseId: number;
        maxMarks?: number | undefined;
        totalMarks?: number | undefined;
        credits?: number | undefined;
        internalMarks?: number | undefined;
        externalMarks?: number | undefined;
        resultStatus?: "ABSENT" | "FAIL" | "WITHHELD" | "MALPRACTICE" | "PASS" | undefined;
    }, {
        courseId: number;
        maxMarks?: number | undefined;
        totalMarks?: number | undefined;
        credits?: number | undefined;
        internalMarks?: number | undefined;
        externalMarks?: number | undefined;
        resultStatus?: "ABSENT" | "FAIL" | "WITHHELD" | "MALPRACTICE" | "PASS" | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    reason: string;
    subjectCorrections: {
        courseId: number;
        maxMarks?: number | undefined;
        totalMarks?: number | undefined;
        credits?: number | undefined;
        internalMarks?: number | undefined;
        externalMarks?: number | undefined;
        resultStatus?: "ABSENT" | "FAIL" | "WITHHELD" | "MALPRACTICE" | "PASS" | undefined;
    }[];
}, {
    reason: string;
    subjectCorrections: {
        courseId: number;
        maxMarks?: number | undefined;
        totalMarks?: number | undefined;
        credits?: number | undefined;
        internalMarks?: number | undefined;
        externalMarks?: number | undefined;
        resultStatus?: "ABSENT" | "FAIL" | "WITHHELD" | "MALPRACTICE" | "PASS" | undefined;
    }[];
}>;
export declare function correctResult(actor: ExamActor, semesterResultId: number, body: z.infer<typeof resultCorrectionSchema>): Promise<{
    baseSemesterResultId: number;
    baseVersion: number;
    newSemesterResultId: number;
    newVersion: number;
    sgpa: number | null;
    changes: Record<string, unknown>[];
}>;
export declare function coeResultsOverview(actor: ExamActor, examId: number): Promise<{
    examId: number;
    results: {
        id: number;
        studentId: number;
        studentName: any;
        usn: any;
        version: number;
        published: boolean;
        current: boolean;
        sgpa: number | null;
        status: any;
        publishedAt: any;
    }[];
    corrections: {
        id: number;
        studentId: number;
        fromVersion: number;
        toVersion: number;
        reason: any;
        createdAt: any;
    }[];
}>;
export declare function studentResults(studentId: number, collegeId: number, semesterId?: number): Promise<{
    semesterResultId: number;
    examId: number;
    examName: any;
    examType: any;
    semesterId: number;
    semesterLabel: any;
    sgpa: number | null;
    status: any;
    resultVersion: number;
    publishedAt: any;
    subjects: {
        courseId: number;
        courseCode: any;
        courseName: any;
        internalMarks: number | null;
        externalMarks: number | null;
        totalMarks: number | null;
        grade: any;
        gradePoints: number | null;
        credits: number | null;
        resultStatus: any;
    }[];
}[]>;
export declare function studentAcademicRecord(studentId: number, collegeId: number): Promise<{
    semesters: {
        semesterId: number;
        semesterLabel: any;
        semesterNumber: any;
        academicYearLabel: any;
        sgpa: number | null;
        creditsEarned: number | null;
        status: any;
    }[];
    cgpa: number | null;
    totalCreditsEarned: any;
    backlogs: {
        code: any;
        name: any;
        grade: any;
    }[];
}>;
export declare function subjectAnalytics(actor: ExamActor, examSubjectId: number): Promise<{
    appeared: number;
    passed: number;
    failed: number;
    passPercentage: number;
    average: number | null;
    highest: number | null;
    lowest: number | null;
}>;
