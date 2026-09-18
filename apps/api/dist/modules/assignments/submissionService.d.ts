import { z } from 'zod';
import { type AvailabilityStatus } from './status.js';
export declare const studentInfoSchema: z.ZodObject<{
    name: z.ZodString;
    usn: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    usn: string;
}, {
    name: string;
    email: string;
    usn: string;
}>;
export declare const submissionAnswerSchema: z.ZodObject<{
    questionId: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    textAnswer: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    questionId: string | number;
    textAnswer?: string | null | undefined;
}, {
    questionId: string | number;
    textAnswer?: string | null | undefined;
}>;
export declare const saveAnswersSchema: z.ZodObject<{
    submissionToken: z.ZodString;
    answers: z.ZodArray<z.ZodObject<{
        questionId: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
        textAnswer: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        questionId: string | number;
        textAnswer?: string | null | undefined;
    }, {
        questionId: string | number;
        textAnswer?: string | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    answers: {
        questionId: string | number;
        textAnswer?: string | null | undefined;
    }[];
    submissionToken: string;
}, {
    answers: {
        questionId: string | number;
        textAnswer?: string | null | undefined;
    }[];
    submissionToken: string;
}>;
export declare const submitSchema: z.ZodObject<{
    submissionToken: z.ZodString;
    answers: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        questionId: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
        textAnswer: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        questionId: string | number;
        textAnswer?: string | null | undefined;
    }, {
        questionId: string | number;
        textAnswer?: string | null | undefined;
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    answers: {
        questionId: string | number;
        textAnswer?: string | null | undefined;
    }[];
    submissionToken: string;
}, {
    submissionToken: string;
    answers?: {
        questionId: string | number;
        textAnswer?: string | null | undefined;
    }[] | undefined;
}>;
export declare function getPublicAssignment(code: string): Promise<{
    accessible: boolean;
    lateWindow: boolean;
    reason: string;
    assignment: {
        questionCount: number;
        totalMarks: number;
        title: unknown;
        description: unknown;
        instructions: unknown;
        assignmentNumber: {} | null;
        courseName: unknown;
        courseCode: unknown;
        moduleName: unknown;
        attemptsAllowed: number;
        passPercentage: number;
        lateSubmissionAllowed: boolean;
        lateDeadlineAt: {} | null;
        startAt: {} | null;
        dueAt: {} | null;
        endAt: {} | null;
        effectiveStatus: AvailabilityStatus;
        availabilityReason: string;
        timezone: string;
    };
    message?: undefined;
} | {
    accessible: boolean;
    reason: string;
    message: string;
    assignment: {
        questionCount: number;
        totalMarks: number;
        title: unknown;
        description: unknown;
        instructions: unknown;
        assignmentNumber: {} | null;
        courseName: unknown;
        courseCode: unknown;
        moduleName: unknown;
        attemptsAllowed: number;
        passPercentage: number;
        lateSubmissionAllowed: boolean;
        lateDeadlineAt: {} | null;
        startAt: {} | null;
        dueAt: {} | null;
        endAt: {} | null;
        effectiveStatus: AvailabilityStatus;
        availabilityReason: string;
        timezone: string;
    };
    lateWindow?: undefined;
} | {
    accessible: boolean;
    reason: string;
    assignment: {
        questionCount: number;
        totalMarks: number;
        title: unknown;
        description: unknown;
        instructions: unknown;
        assignmentNumber: {} | null;
        courseName: unknown;
        courseCode: unknown;
        moduleName: unknown;
        attemptsAllowed: number;
        passPercentage: number;
        lateSubmissionAllowed: boolean;
        lateDeadlineAt: {} | null;
        startAt: {} | null;
        dueAt: {} | null;
        endAt: {} | null;
        effectiveStatus: AvailabilityStatus;
        availabilityReason: string;
        timezone: string;
    };
    lateWindow?: undefined;
    message?: undefined;
}>;
export declare function startSubmission(code: string, info: z.infer<typeof studentInfoSchema>, meta: {
    ip?: string;
    userAgent?: string;
}): Promise<{
    submissionToken: unknown;
    attemptNumber: number;
    startedAt: unknown;
    status: unknown;
    isLate: boolean;
    questions: import("./serialize.js").PublicAssignmentQuestion[];
    answers: {
        questionId: string | number;
        textAnswer: string | null;
        wordCount: number;
    }[];
    resumed: boolean;
    assignment: {
        title: unknown;
        description: unknown;
        instructions: unknown;
        assignmentNumber: {} | null;
        courseName: unknown;
        courseCode: unknown;
        moduleName: unknown;
        attemptsAllowed: number;
        passPercentage: number;
        lateSubmissionAllowed: boolean;
        lateDeadlineAt: {} | null;
        startAt: {} | null;
        dueAt: {} | null;
        endAt: {} | null;
        effectiveStatus: AvailabilityStatus;
        availabilityReason: string;
        timezone: string;
    };
}>;
export declare function saveSubmissionAnswers(code: string, body: z.output<typeof saveAnswersSchema>): Promise<{
    saved: boolean;
    status: any;
}>;
export declare function submitAssignment(code: string, body: z.output<typeof submitSchema>): Promise<{
    status: any;
    isLate: boolean;
    submissionToken: any;
    attemptNumber: number;
    startedAt: any;
    submittedAt: any;
    assignment: {
        title: unknown;
        description: unknown;
        instructions: unknown;
        assignmentNumber: {} | null;
        courseName: unknown;
        courseCode: unknown;
        moduleName: unknown;
        attemptsAllowed: number;
        passPercentage: number;
        lateSubmissionAllowed: boolean;
        lateDeadlineAt: {} | null;
        startAt: {} | null;
        dueAt: {} | null;
        endAt: {} | null;
        effectiveStatus: AvailabilityStatus;
        availabilityReason: string;
        timezone: string;
    };
    obtainedMarks: number | null;
    totalMarks: number | null;
    percentage: number | null;
    passed: boolean | null;
    overallFeedback: any;
    questions: {
        textAnswer: any;
        wordCount: number;
        awardedMarks: number | null;
        feedback: any;
        modelSolution: string | null | undefined;
        id: number | string;
        questionText: string;
        questionType: string;
        responseFormat: string;
        marks: number;
        difficulty: string | null;
        sortOrder?: number;
    }[];
} | {
    submissionToken: unknown;
    attemptNumber: number;
    startedAt: unknown;
    status: unknown;
    isLate: boolean;
    questions: import("./serialize.js").PublicAssignmentQuestion[];
    answers: {
        questionId: string | number;
        textAnswer: string | null;
        wordCount: number;
    }[];
    assignment: {
        title: unknown;
        description: unknown;
        instructions: unknown;
        assignmentNumber: {} | null;
        courseName: unknown;
        courseCode: unknown;
        moduleName: unknown;
        attemptsAllowed: number;
        passPercentage: number;
        lateSubmissionAllowed: boolean;
        lateDeadlineAt: {} | null;
        startAt: {} | null;
        dueAt: {} | null;
        endAt: {} | null;
        effectiveStatus: AvailabilityStatus;
        availabilityReason: string;
        timezone: string;
    };
}>;
export declare function getSubmission(code: string, token: string): Promise<{
    status: any;
    isLate: boolean;
    submissionToken: any;
    attemptNumber: number;
    startedAt: any;
    submittedAt: any;
    assignment: {
        title: unknown;
        description: unknown;
        instructions: unknown;
        assignmentNumber: {} | null;
        courseName: unknown;
        courseCode: unknown;
        moduleName: unknown;
        attemptsAllowed: number;
        passPercentage: number;
        lateSubmissionAllowed: boolean;
        lateDeadlineAt: {} | null;
        startAt: {} | null;
        dueAt: {} | null;
        endAt: {} | null;
        effectiveStatus: AvailabilityStatus;
        availabilityReason: string;
        timezone: string;
    };
    obtainedMarks: number | null;
    totalMarks: number | null;
    percentage: number | null;
    passed: boolean | null;
    overallFeedback: any;
    questions: {
        textAnswer: any;
        wordCount: number;
        awardedMarks: number | null;
        feedback: any;
        modelSolution: string | null | undefined;
        id: number | string;
        questionText: string;
        questionType: string;
        responseFormat: string;
        marks: number;
        difficulty: string | null;
        sortOrder?: number;
    }[];
} | {
    submissionToken: unknown;
    attemptNumber: number;
    startedAt: unknown;
    status: unknown;
    isLate: boolean;
    questions: import("./serialize.js").PublicAssignmentQuestion[];
    answers: {
        questionId: string | number;
        textAnswer: string | null;
        wordCount: number;
    }[];
    assignment: {
        title: unknown;
        description: unknown;
        instructions: unknown;
        assignmentNumber: {} | null;
        courseName: unknown;
        courseCode: unknown;
        moduleName: unknown;
        attemptsAllowed: number;
        passPercentage: number;
        lateSubmissionAllowed: boolean;
        lateDeadlineAt: {} | null;
        startAt: {} | null;
        dueAt: {} | null;
        endAt: {} | null;
        effectiveStatus: AvailabilityStatus;
        availabilityReason: string;
        timezone: string;
    };
}>;
