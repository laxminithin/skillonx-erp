import { z } from 'zod';
import ExcelJS from 'exceljs';
export declare const evaluationItemSchema: z.ZodObject<{
    questionId: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    awardedMarks: z.ZodNumber;
    feedback: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    questionId: string | number;
    awardedMarks: number;
    feedback?: string | null | undefined;
}, {
    questionId: string | number;
    awardedMarks: number;
    feedback?: string | null | undefined;
}>;
export declare const evaluationSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        questionId: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
        awardedMarks: z.ZodNumber;
        feedback: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        questionId: string | number;
        awardedMarks: number;
        feedback?: string | null | undefined;
    }, {
        questionId: string | number;
        awardedMarks: number;
        feedback?: string | null | undefined;
    }>, "many">;
    releaseResults: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    releaseResults: boolean;
    items: {
        questionId: string | number;
        awardedMarks: number;
        feedback?: string | null | undefined;
    }[];
}, {
    items: {
        questionId: string | number;
        awardedMarks: number;
        feedback?: string | null | undefined;
    }[];
    releaseResults?: boolean | undefined;
}>;
export declare function listSubmissions(assignmentId: number, collegeId: number): Promise<{
    submissions: any[];
}>;
export declare function getSubmissionDetail(assignmentId: number, submissionId: number, collegeId: number): Promise<{
    id: any;
    publicToken: any;
    status: any;
    isLate: boolean;
    startedAt: any;
    submittedAt: any;
    obtainedMarks: any;
    totalMarks: any;
    percentage: any;
    evaluationStatus: any;
    resultsReleased: boolean;
    evaluatedAt: any;
    student: {
        name: any;
        usn: any;
        email: any;
    };
    questions: {
        id: unknown;
        questionText: unknown;
        questionType: unknown;
        marks: number;
        difficulty: unknown;
        primaryCoCode: unknown;
        derivedOutcomes: unknown;
        expectedAnswerGuidance: unknown;
        textAnswer: any;
        wordCount: any;
        awardedMarks: any;
        feedback: any;
    }[];
}>;
export declare function saveEvaluation(assignmentId: number, submissionId: number, collegeId: number, facultyUserId: number, body: z.output<typeof evaluationSchema>): Promise<{
    id: any;
    publicToken: any;
    status: any;
    isLate: boolean;
    startedAt: any;
    submittedAt: any;
    obtainedMarks: any;
    totalMarks: any;
    percentage: any;
    evaluationStatus: any;
    resultsReleased: boolean;
    evaluatedAt: any;
    student: {
        name: any;
        usn: any;
        email: any;
    };
    questions: {
        id: unknown;
        questionText: unknown;
        questionType: unknown;
        marks: number;
        difficulty: unknown;
        primaryCoCode: unknown;
        derivedOutcomes: unknown;
        expectedAnswerGuidance: unknown;
        textAnswer: any;
        wordCount: any;
        awardedMarks: any;
        feedback: any;
    }[];
}>;
export declare function releaseResults(assignmentId: number, submissionId: number, collegeId: number): Promise<{
    id: any;
    publicToken: any;
    status: any;
    isLate: boolean;
    startedAt: any;
    submittedAt: any;
    obtainedMarks: any;
    totalMarks: any;
    percentage: any;
    evaluationStatus: any;
    resultsReleased: boolean;
    evaluatedAt: any;
    student: {
        name: any;
        usn: any;
        email: any;
    };
    questions: {
        id: unknown;
        questionText: unknown;
        questionType: unknown;
        marks: number;
        difficulty: unknown;
        primaryCoCode: unknown;
        derivedOutcomes: unknown;
        expectedAnswerGuidance: unknown;
        textAnswer: any;
        wordCount: any;
        awardedMarks: any;
        feedback: any;
    }[];
}>;
/** CO Performance Summary — NOT final attainment. */
export declare function coPerformanceSummary(assignmentId: number, collegeId: number): Promise<{
    kind: string;
    note: string;
    evaluatedSubmissions: number;
    rows: {
        coCode: string;
        questionCount: number;
        marksAvailable: number;
        classAverage: number;
        evaluatedSubmissions: number;
        label: string;
    }[];
}>;
export declare function exportAssignmentResults(assignmentId: number, collegeId: number): Promise<{
    filename: string;
    buffer: Buffer<ExcelJS.Buffer>;
}>;
