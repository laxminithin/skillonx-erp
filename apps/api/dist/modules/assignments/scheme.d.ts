import { z } from 'zod';
import { type AssignmentQuestionType } from '../../types/assignment.js';
export declare const evaluationCriterionSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    maxMarks: z.ZodNumber;
    guidance: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    label: string;
    maxMarks: number;
    guidance?: string | null | undefined;
}, {
    id: string;
    label: string;
    maxMarks: number;
    guidance?: string | null | undefined;
}>;
export declare const evaluationSchemeSchema: z.ZodObject<{
    criteria: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        maxMarks: z.ZodNumber;
        guidance: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        label: string;
        maxMarks: number;
        guidance?: string | null | undefined;
    }, {
        id: string;
        label: string;
        maxMarks: number;
        guidance?: string | null | undefined;
    }>, "many">;
    expectedKeyPoints: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    facultyNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    expectedKeyPoints: string[];
    criteria: {
        id: string;
        label: string;
        maxMarks: number;
        guidance?: string | null | undefined;
    }[];
    facultyNotes?: string | null | undefined;
}, {
    criteria: {
        id: string;
        label: string;
        maxMarks: number;
        guidance?: string | null | undefined;
    }[];
    expectedKeyPoints?: string[] | undefined;
    facultyNotes?: string | null | undefined;
}>;
export type EvaluationCriterion = z.output<typeof evaluationCriterionSchema>;
export type EvaluationScheme = z.output<typeof evaluationSchemeSchema>;
export declare function schemeTotalMarks(scheme: EvaluationScheme | null | undefined): number;
export declare function parseEvaluationScheme(raw: unknown): EvaluationScheme | null;
/** Build a sensible default rubric for a question type / marks total. */
export declare function buildDefaultScheme(questionType: AssignmentQuestionType, marks: number): EvaluationScheme;
export declare function validateSchemeMatchesMarks(scheme: unknown, marks: number, opts?: {
    required?: boolean;
}): EvaluationScheme;
export declare function hasModelSolution(guidance: string | null | undefined): boolean;
export declare function findDuplicateNormalizedTexts(texts: string[]): string[];
