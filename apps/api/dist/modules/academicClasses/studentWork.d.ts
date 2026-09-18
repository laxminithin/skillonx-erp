import { z } from 'zod';
import * as quizPublic from '../quizzes/attemptService.js';
import * as assignmentPublic from '../assignments/submissionService.js';
type Row = Record<string, any>;
export declare const quizAnswerBodySchema: z.ZodObject<Omit<{
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
}, "attemptToken"> & {
    attemptToken: z.ZodString;
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
export declare const quizSubmitBodySchema: z.ZodObject<{
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
export declare const assignmentSaveBodySchema: z.ZodObject<{
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
export declare const assignmentSubmitBodySchema: z.ZodObject<{
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
declare function isOpenStatus(status: string): status is "ACTIVE" | "SCHEDULED";
export declare function listStudentAssignments(studentId: number, courseId?: number): Promise<{
    assignments: Row[];
} | {
    assignments: {
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
        effectiveStatus: import("../../utils/surveyStatus.js").AvailabilityStatus;
        studentStatus: string;
        obtainedMarks: number | null;
        totalMarks: number | null;
    }[];
}>;
export declare function getStudentAssignment(studentId: number, assignmentId: number): Promise<{
    historical: boolean;
    assignment: {
        id: number;
        title: any;
        description: any;
        instructions: any;
        courseId: number;
        courseName: any;
        courseCode: any;
        moduleName: any;
        facultyName: any;
        assignedAt: any;
        dueAt: any;
        maxMarks: number;
        questionCount: number;
        attemptsAllowed: number;
        lateSubmissionAllowed: boolean;
        lateDeadlineAt: any;
        cos: any[];
        questions: {
            id: number;
            questionText: any;
            marks: number;
            co: any;
            responseFormat: any;
        }[];
        effectiveStatus: import("../../utils/surveyStatus.js").AvailabilityStatus;
    };
    submission: {
        id: number;
        token: any;
        status: string;
        submittedAt: any;
        isLate: boolean;
        obtainedMarks: number | null;
        totalMarks: number | null;
        percentage: number | null;
        feedbackReleased: boolean;
    } | null;
}>;
export declare function startStudentAssignment(studentId: number, assignmentId: number, meta: {
    ip?: string;
    userAgent?: string;
}): Promise<{
    submissionToken: unknown;
    attemptNumber: number;
    startedAt: unknown;
    status: unknown;
    isLate: boolean;
    questions: import("../assignments/serialize.js").PublicAssignmentQuestion[];
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
        effectiveStatus: import("../../utils/surveyStatus.js").AvailabilityStatus;
        availabilityReason: string;
        timezone: string;
    };
}>;
export declare function saveStudentAssignment(studentId: number, assignmentId: number, body: z.output<typeof assignmentPublic.saveAnswersSchema>): Promise<{
    saved: boolean;
    status: any;
}>;
export declare function submitStudentAssignment(studentId: number, assignmentId: number, body: z.output<typeof assignmentPublic.submitSchema>): Promise<{
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
        effectiveStatus: import("../../utils/surveyStatus.js").AvailabilityStatus;
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
    questions: import("../assignments/serialize.js").PublicAssignmentQuestion[];
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
        effectiveStatus: import("../../utils/surveyStatus.js").AvailabilityStatus;
        availabilityReason: string;
        timezone: string;
    };
}>;
export declare function getStudentAssignmentSubmission(studentId: number, assignmentId: number, token: string): Promise<{
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
        effectiveStatus: import("../../utils/surveyStatus.js").AvailabilityStatus;
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
    questions: import("../assignments/serialize.js").PublicAssignmentQuestion[];
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
        effectiveStatus: import("../../utils/surveyStatus.js").AvailabilityStatus;
        availabilityReason: string;
        timezone: string;
    };
}>;
export declare function listStudentQuizzes(studentId: number, courseId?: number): Promise<{
    quizzes: Row[];
} | {
    quizzes: {
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
        effectiveStatus: import("../../utils/surveyStatus.js").AvailabilityStatus;
        bucket: "COMPLETED" | "UPCOMING" | "AVAILABLE";
        inProgress: boolean;
        scoreReleased: boolean;
        obtainedMarks: number | null;
        totalMarks: number | null;
    }[];
}>;
export declare function getStudentQuiz(studentId: number, quizId: number): Promise<{
    historical: boolean;
    accessible: boolean;
    message: string | undefined;
    quiz: {
        id: number;
        title: any;
        description: any;
        instructions: any;
        courseId: number;
        courseName: any;
        courseCode: any;
        moduleName: any;
        durationMinutes: number | null;
        attemptsAllowed: number;
        attemptsUsed: number;
        questionCount: number;
        totalMarks: number;
        startAt: any;
        endAt: any;
        showScoreImmediately: boolean;
        effectiveStatus: import("../../utils/surveyStatus.js").AvailabilityStatus;
    };
    attempt: {
        token: any;
        status: any;
        obtainedMarks: number | null;
    } | null;
}>;
export declare function startStudentQuiz(studentId: number, quizId: number, meta: {
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
    review: import("../quizzes/serialize.js").ReviewQuestion[] | null;
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
    questions: import("../quizzes/serialize.js").PublicQuizQuestion[];
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
        effectiveStatus: import("../../utils/surveyStatus.js").AvailabilityStatus;
        availabilityReason: import("../../utils/quizStatus.js").QuizAvailabilityReason;
        startAt: {} | null;
        endAt: {} | null;
        timezone: string;
    };
}>;
export declare function saveStudentQuiz(studentId: number, quizId: number, body: z.output<typeof quizPublic.saveAnswersSchema>): Promise<{
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
    review: import("../quizzes/serialize.js").ReviewQuestion[] | null;
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
export declare function submitStudentQuiz(studentId: number, quizId: number, body: z.output<typeof quizPublic.submitSchema>): Promise<{
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
    review: import("../quizzes/serialize.js").ReviewQuestion[] | null;
    scoreReleased: boolean;
    answersReleased: boolean;
    message: string | undefined;
}>;
export declare function getStudentQuizAttempt(studentId: number, quizId: number, token: string): Promise<{
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
    review: import("../quizzes/serialize.js").ReviewQuestion[] | null;
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
    questions: import("../quizzes/serialize.js").PublicQuizQuestion[];
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
        effectiveStatus: import("../../utils/surveyStatus.js").AvailabilityStatus;
        availabilityReason: import("../../utils/quizStatus.js").QuizAvailabilityReason;
        startAt: {} | null;
        endAt: {} | null;
        timezone: string;
    };
}>;
export declare function listStudentAssessments(studentId: number, courseId?: number): Promise<{
    assessments: Row[];
} | {
    assessments: {
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
}>;
export declare function listStudentTasks(studentId: number, tab?: string): Promise<{
    tasks: {
        id: string;
        kind: "ASSIGNMENT" | "QUIZ" | "ASSESSMENT";
        title: string;
        courseName?: string;
        dueAt: string | Date | null;
        status: string;
        path: string;
        completed: boolean;
    }[];
}>;
export declare function studentCalendar(studentId: number): Promise<{
    events: {
        id: string;
        kind: string;
        title: string;
        date: string | Date | null;
        path: string;
        startTime?: string | null;
        endTime?: string | null;
    }[];
}>;
export { isOpenStatus };
