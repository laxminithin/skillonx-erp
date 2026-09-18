import { z } from 'zod';
import { AppError } from '../../utils/errors.js';
import { type EvaluationScheme } from './scheme.js';
export declare const criterionAwardSchema: z.ZodObject<{
    id: z.ZodString;
    awarded: z.ZodEffects<z.ZodNumber, number, unknown>;
    feedback: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    awarded: number;
    feedback?: string | null | undefined;
}, {
    id: string;
    awarded?: unknown;
    feedback?: string | null | undefined;
}>;
export declare const questionEvaluationSchema: z.ZodObject<{
    snapshotQuestionId: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    criteria: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        awarded: z.ZodEffects<z.ZodNumber, number, unknown>;
        feedback: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        awarded: number;
        feedback?: string | null | undefined;
    }, {
        id: string;
        awarded?: unknown;
        feedback?: string | null | undefined;
    }>, "many">;
    feedback: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    /** Optional simple-mode total; ignored when criteria are present (scheme mode). */
    awardedMarks: z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>;
}, "strip", z.ZodTypeAny, {
    criteria: {
        id: string;
        awarded: number;
        feedback?: string | null | undefined;
    }[];
    snapshotQuestionId: string | number;
    awardedMarks?: number | undefined;
    feedback?: string | null | undefined;
}, {
    criteria: {
        id: string;
        awarded?: unknown;
        feedback?: string | null | undefined;
    }[];
    snapshotQuestionId: string | number;
    awardedMarks?: unknown;
    feedback?: string | null | undefined;
}>;
export declare const evaluateSubmissionSchema: z.ZodEffects<z.ZodObject<{
    mode: z.ZodDefault<z.ZodEnum<["DRAFT", "FINALIZE", "RELEASE"]>>;
    overallFeedback: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    /** @deprecated Prefer mode: 'RELEASE'. Kept for older clients that finalize+release together. */
    releaseResults: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    questions: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        snapshotQuestionId: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
        criteria: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            awarded: z.ZodEffects<z.ZodNumber, number, unknown>;
            feedback: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            awarded: number;
            feedback?: string | null | undefined;
        }, {
            id: string;
            awarded?: unknown;
            feedback?: string | null | undefined;
        }>, "many">;
        feedback: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        /** Optional simple-mode total; ignored when criteria are present (scheme mode). */
        awardedMarks: z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>;
    }, "strip", z.ZodTypeAny, {
        criteria: {
            id: string;
            awarded: number;
            feedback?: string | null | undefined;
        }[];
        snapshotQuestionId: string | number;
        awardedMarks?: number | undefined;
        feedback?: string | null | undefined;
    }, {
        criteria: {
            id: string;
            awarded?: unknown;
            feedback?: string | null | undefined;
        }[];
        snapshotQuestionId: string | number;
        awardedMarks?: unknown;
        feedback?: string | null | undefined;
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    mode: "DRAFT" | "FINALIZE" | "RELEASE";
    questions: {
        criteria: {
            id: string;
            awarded: number;
            feedback?: string | null | undefined;
        }[];
        snapshotQuestionId: string | number;
        awardedMarks?: number | undefined;
        feedback?: string | null | undefined;
    }[];
    releaseResults: boolean;
    overallFeedback?: string | null | undefined;
}, {
    mode?: "DRAFT" | "FINALIZE" | "RELEASE" | undefined;
    questions?: {
        criteria: {
            id: string;
            awarded?: unknown;
            feedback?: string | null | undefined;
        }[];
        snapshotQuestionId: string | number;
        awardedMarks?: unknown;
        feedback?: string | null | undefined;
    }[] | undefined;
    overallFeedback?: string | null | undefined;
    releaseResults?: boolean | undefined;
}>, {
    mode: "DRAFT" | "FINALIZE" | "RELEASE";
    questions: {
        criteria: {
            id: string;
            awarded: number;
            feedback?: string | null | undefined;
        }[];
        snapshotQuestionId: string | number;
        awardedMarks?: number | undefined;
        feedback?: string | null | undefined;
    }[];
    releaseResults: boolean;
    overallFeedback?: string | null | undefined;
}, {
    mode?: "DRAFT" | "FINALIZE" | "RELEASE" | undefined;
    questions?: {
        criteria: {
            id: string;
            awarded?: unknown;
            feedback?: string | null | undefined;
        }[];
        snapshotQuestionId: string | number;
        awardedMarks?: unknown;
        feedback?: string | null | undefined;
    }[] | undefined;
    overallFeedback?: string | null | undefined;
    releaseResults?: boolean | undefined;
}>;
export type CriterionAwardInput = z.output<typeof criterionAwardSchema>;
export type QuestionEvaluationInput = z.output<typeof questionEvaluationSchema>;
export type EvaluateSubmissionInput = z.output<typeof evaluateSubmissionSchema>;
export type SchemeMarkCriterion = {
    id: string;
    label: string;
    maxMarks: number;
    awarded: number;
    feedback: string | null;
};
export type SchemeMarks = {
    criteria: SchemeMarkCriterion[];
    awardedTotal: number;
    maxTotal: number;
};
export declare function applyCriterionMarks(scheme: EvaluationScheme, awards: CriterionAwardInput[]): SchemeMarks;
/** Resolve scheme from published snapshot; fall back to type default for legacy rows. */
export declare function resolveSchemeFromSnapshotQuestion(question: {
    evaluationRubric?: unknown;
    evaluationScheme?: unknown;
    marks: number;
    questionType?: string;
}): EvaluationScheme;
export declare function summarizeEvaluation(questionMarks: Array<{
    awarded: number;
    max: number;
}>, passPercentage: number): {
    obtainedMarks: number;
    totalMarks: number;
    percentage: number;
    passed: boolean;
};
/** Map Zod flatten to a faculty-readable evaluation validation error. */
export declare function evaluationZodToAppError(err: z.ZodError): AppError;
