import { z } from 'zod';
import type { Knex } from 'knex';
import { type AvailabilityStatus } from '../../utils/quizStatus.js';
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
export declare const attemptAnswerSchema: z.ZodObject<{
    questionId: z.ZodNumber;
    selectedOptionIds: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>>;
    numericAnswer: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    textAnswer: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    questionId: number;
    textAnswer?: string | null | undefined;
    numericAnswer?: number | null | undefined;
    selectedOptionIds?: number[] | null | undefined;
}, {
    questionId: number;
    textAnswer?: string | null | undefined;
    numericAnswer?: number | null | undefined;
    selectedOptionIds?: number[] | null | undefined;
}>;
export declare const saveAnswersSchema: z.ZodObject<{
    attemptToken: z.ZodString;
    answers: z.ZodArray<z.ZodObject<{
        questionId: z.ZodNumber;
        selectedOptionIds: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>>;
        numericAnswer: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        textAnswer: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        questionId: number;
        textAnswer?: string | null | undefined;
        numericAnswer?: number | null | undefined;
        selectedOptionIds?: number[] | null | undefined;
    }, {
        questionId: number;
        textAnswer?: string | null | undefined;
        numericAnswer?: number | null | undefined;
        selectedOptionIds?: number[] | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    answers: {
        questionId: number;
        textAnswer?: string | null | undefined;
        numericAnswer?: number | null | undefined;
        selectedOptionIds?: number[] | null | undefined;
    }[];
    attemptToken: string;
}, {
    answers: {
        questionId: number;
        textAnswer?: string | null | undefined;
        numericAnswer?: number | null | undefined;
        selectedOptionIds?: number[] | null | undefined;
    }[];
    attemptToken: string;
}>;
export declare const submitSchema: z.ZodObject<{
    attemptToken: z.ZodString;
    answers: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        questionId: z.ZodNumber;
        selectedOptionIds: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>>;
        numericAnswer: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        textAnswer: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        questionId: number;
        textAnswer?: string | null | undefined;
        numericAnswer?: number | null | undefined;
        selectedOptionIds?: number[] | null | undefined;
    }, {
        questionId: number;
        textAnswer?: string | null | undefined;
        numericAnswer?: number | null | undefined;
        selectedOptionIds?: number[] | null | undefined;
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    answers: {
        questionId: number;
        textAnswer?: string | null | undefined;
        numericAnswer?: number | null | undefined;
        selectedOptionIds?: number[] | null | undefined;
    }[];
    attemptToken: string;
}, {
    attemptToken: string;
    answers?: {
        questionId: number;
        textAnswer?: string | null | undefined;
        numericAnswer?: number | null | undefined;
        selectedOptionIds?: number[] | null | undefined;
    }[] | undefined;
}>;
export declare function getPublicQuiz(code: string): Promise<{
    accessible: boolean;
    reason: import("../../utils/quizStatus.js").QuizAvailabilityReason;
    message: string;
    quiz: {
        questionCount: number;
        totalMarks: number;
        title: unknown;
        description: unknown;
        instructions: unknown;
        courseName: unknown;
        courseCode: unknown;
        moduleName: unknown;
        durationMinutes: number | null;
        attemptsAllowed: number;
        passPercentage: number;
        shuffleQuestions: boolean;
        showScoreImmediately: boolean;
        effectiveStatus: AvailabilityStatus;
        availabilityReason: import("../../utils/quizStatus.js").QuizAvailabilityReason;
        startAt: {} | null;
        endAt: {} | null;
        timezone: string;
    };
} | {
    accessible: boolean;
    reason: import("../../utils/quizStatus.js").QuizAvailabilityReason;
    quiz: {
        questionCount: number;
        totalMarks: number;
        title: unknown;
        description: unknown;
        instructions: unknown;
        courseName: unknown;
        courseCode: unknown;
        moduleName: unknown;
        durationMinutes: number | null;
        attemptsAllowed: number;
        passPercentage: number;
        shuffleQuestions: boolean;
        showScoreImmediately: boolean;
        effectiveStatus: AvailabilityStatus;
        availabilityReason: import("../../utils/quizStatus.js").QuizAvailabilityReason;
        startAt: {} | null;
        endAt: {} | null;
        timezone: string;
    };
    message?: undefined;
}>;
export declare function upsertIdentifiedStudent(collegeId: number, info: z.infer<typeof studentInfoSchema>, departmentId: number | null, trx?: Knex | Knex.Transaction): Promise<number>;
export declare function startAttempt(code: string, info: z.infer<typeof studentInfoSchema>, meta: {
    ip?: string;
    userAgent?: string;
}): Promise<{
    submitted: boolean;
    attemptToken: unknown;
    attemptNumber: number;
    startedAt: unknown;
    submittedAt: unknown;
    status: unknown;
    quiz: {
        title: unknown;
        courseName: unknown;
        moduleName: unknown;
    };
    result: {
        obtainedMarks: number;
        totalMarks: number;
        percentage: number;
        passed: boolean;
        timeTakenSeconds: number;
        needsManualGrading: boolean;
    } | null;
    review: import("./serialize.js").ReviewQuestion[] | null;
    scoreReleased: boolean;
    answersReleased: boolean;
    message: string | undefined;
} | {
    attemptToken: unknown;
    attemptNumber: number;
    startedAt: unknown;
    expiresAt: unknown;
    remainingSeconds: number | null;
    status: unknown;
    questions: import("./serialize.js").PublicQuizQuestion[];
    answers: {
        questionId: number;
        selectedOptionIds: number[];
        numericAnswer: number | null;
        textAnswer: string | null;
    }[];
    resumed: boolean;
    quiz: {
        title: unknown;
        description: unknown;
        instructions: unknown;
        courseName: unknown;
        courseCode: unknown;
        moduleName: unknown;
        durationMinutes: number | null;
        attemptsAllowed: number;
        passPercentage: number;
        shuffleQuestions: boolean;
        showScoreImmediately: boolean;
        effectiveStatus: AvailabilityStatus;
        availabilityReason: import("../../utils/quizStatus.js").QuizAvailabilityReason;
        startAt: {} | null;
        endAt: {} | null;
        timezone: string;
    };
}>;
export declare function saveAttemptAnswers(code: string, body: z.output<typeof saveAnswersSchema>): Promise<{
    submitted: boolean;
    attemptToken: unknown;
    attemptNumber: number;
    startedAt: unknown;
    submittedAt: unknown;
    status: unknown;
    quiz: {
        title: unknown;
        courseName: unknown;
        moduleName: unknown;
    };
    result: {
        obtainedMarks: number;
        totalMarks: number;
        percentage: number;
        passed: boolean;
        timeTakenSeconds: number;
        needsManualGrading: boolean;
    } | null;
    review: import("./serialize.js").ReviewQuestion[] | null;
    scoreReleased: boolean;
    answersReleased: boolean;
    message: string | undefined;
} | {
    saved: boolean;
    status: any;
    remainingSeconds?: undefined;
} | {
    saved: boolean;
    remainingSeconds: number | null;
    status: string;
}>;
export declare function submitAttempt(code: string, body: z.output<typeof submitSchema>): Promise<{
    submitted: boolean;
    attemptToken: unknown;
    attemptNumber: number;
    startedAt: unknown;
    submittedAt: unknown;
    status: unknown;
    quiz: {
        title: unknown;
        courseName: unknown;
        moduleName: unknown;
    };
    result: {
        obtainedMarks: number;
        totalMarks: number;
        percentage: number;
        passed: boolean;
        timeTakenSeconds: number;
        needsManualGrading: boolean;
    } | null;
    review: import("./serialize.js").ReviewQuestion[] | null;
    scoreReleased: boolean;
    answersReleased: boolean;
    message: string | undefined;
}>;
export declare function getAttempt(code: string, token: string): Promise<{
    submitted: boolean;
    attemptToken: unknown;
    attemptNumber: number;
    startedAt: unknown;
    submittedAt: unknown;
    status: unknown;
    quiz: {
        title: unknown;
        courseName: unknown;
        moduleName: unknown;
    };
    result: {
        obtainedMarks: number;
        totalMarks: number;
        percentage: number;
        passed: boolean;
        timeTakenSeconds: number;
        needsManualGrading: boolean;
    } | null;
    review: import("./serialize.js").ReviewQuestion[] | null;
    scoreReleased: boolean;
    answersReleased: boolean;
    message: string | undefined;
} | {
    attemptToken: unknown;
    attemptNumber: number;
    startedAt: unknown;
    expiresAt: unknown;
    remainingSeconds: number | null;
    status: unknown;
    questions: import("./serialize.js").PublicQuizQuestion[];
    answers: {
        questionId: number;
        selectedOptionIds: number[];
        numericAnswer: number | null;
        textAnswer: string | null;
    }[];
    resumed: boolean;
    quiz: {
        title: unknown;
        description: unknown;
        instructions: unknown;
        courseName: unknown;
        courseCode: unknown;
        moduleName: unknown;
        durationMinutes: number | null;
        attemptsAllowed: number;
        passPercentage: number;
        shuffleQuestions: boolean;
        showScoreImmediately: boolean;
        effectiveStatus: AvailabilityStatus;
        availabilityReason: import("../../utils/quizStatus.js").QuizAvailabilityReason;
        startAt: {} | null;
        endAt: {} | null;
        timezone: string;
    };
}>;
