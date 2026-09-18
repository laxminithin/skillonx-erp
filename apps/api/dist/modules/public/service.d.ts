import { z } from 'zod';
import { type AvailabilityStatus } from '../../utils/surveyStatus.js';
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
export declare const answerSchema: z.ZodObject<{
    questionId: z.ZodNumber;
    textAnswer: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    numericAnswer: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    selectedOptionId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    jsonAnswer: z.ZodNullable<z.ZodOptional<z.ZodUnknown>>;
    comment: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    questionId: number;
    comment?: string | null | undefined;
    textAnswer?: string | null | undefined;
    numericAnswer?: number | null | undefined;
    selectedOptionId?: number | null | undefined;
    jsonAnswer?: unknown;
}, {
    questionId: number;
    comment?: string | null | undefined;
    textAnswer?: string | null | undefined;
    numericAnswer?: number | null | undefined;
    selectedOptionId?: number | null | undefined;
    jsonAnswer?: unknown;
}>;
export declare const submitSchema: z.ZodObject<{
    submissionId: z.ZodNumber;
    answers: z.ZodArray<z.ZodObject<{
        questionId: z.ZodNumber;
        textAnswer: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        numericAnswer: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        selectedOptionId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        jsonAnswer: z.ZodNullable<z.ZodOptional<z.ZodUnknown>>;
        comment: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        questionId: number;
        comment?: string | null | undefined;
        textAnswer?: string | null | undefined;
        numericAnswer?: number | null | undefined;
        selectedOptionId?: number | null | undefined;
        jsonAnswer?: unknown;
    }, {
        questionId: number;
        comment?: string | null | undefined;
        textAnswer?: string | null | undefined;
        numericAnswer?: number | null | undefined;
        selectedOptionId?: number | null | undefined;
        jsonAnswer?: unknown;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    submissionId: number;
    answers: {
        questionId: number;
        comment?: string | null | undefined;
        textAnswer?: string | null | undefined;
        numericAnswer?: number | null | undefined;
        selectedOptionId?: number | null | undefined;
        jsonAnswer?: unknown;
    }[];
}, {
    submissionId: number;
    answers: {
        questionId: number;
        comment?: string | null | undefined;
        textAnswer?: string | null | undefined;
        numericAnswer?: number | null | undefined;
        selectedOptionId?: number | null | undefined;
        jsonAnswer?: unknown;
    }[];
}>;
export declare function getPublicSurvey(code: string): Promise<{
    accessible: boolean;
    reason: import("../../utils/surveyStatus.js").SurveyAvailabilityReason;
    message: string;
    survey: {
        title: unknown;
        description: unknown;
        surveyType: unknown;
        departmentName: unknown;
        courseName: unknown;
        courseCode: unknown;
        identityMode: unknown;
        effectiveStatus: AvailabilityStatus;
        availabilityReason: import("../../utils/surveyStatus.js").SurveyAvailabilityReason;
        startAt: {} | null;
        endAt: {} | null;
        closedAt: {} | null;
        timezone: string;
    };
} | {
    accessible: boolean;
    reason: import("../../utils/surveyStatus.js").SurveyAvailabilityReason;
    survey: {
        id: any;
        responsePolicy: any;
        sections: {
            id: any;
            title: any;
            description: any;
            questions: {
                id: any;
                questionType: "STAR_RATING" | "SMILE_RATING" | "NUMERICAL" | "LIKERT" | "MULTIPLE_CHOICE" | "CHECKBOX" | "YES_NO" | "SHORT_ANSWER" | "LONG_ANSWER" | "DROPDOWN" | "RATING";
                prompt: any;
                helpText: any;
                isRequired: boolean;
                allowComment: boolean;
                config: any;
                options: {
                    id: any;
                    label: any;
                    value: any;
                }[];
            }[];
        }[];
        title: unknown;
        description: unknown;
        surveyType: unknown;
        departmentName: unknown;
        courseName: unknown;
        courseCode: unknown;
        identityMode: unknown;
        effectiveStatus: AvailabilityStatus;
        availabilityReason: import("../../utils/surveyStatus.js").SurveyAvailabilityReason;
        startAt: {} | null;
        endAt: {} | null;
        closedAt: {} | null;
        timezone: string;
    };
    message?: undefined;
}>;
export declare function validateAnswerAgainstQuestion(question: Record<string, unknown>, answer: z.infer<typeof answerSchema>, options: Array<{
    id: number;
    value: number | null;
}>): void;
export declare function startSubmission(code: string, info: z.infer<typeof studentInfoSchema>, meta: {
    ip?: string;
    userAgent?: string;
}): Promise<{
    submissionId: any;
    studentId: number;
}>;
export declare function submitAnswers(code: string, input: z.infer<typeof submitSchema>): Promise<{
    ok: boolean;
    submissionId: any;
}>;
