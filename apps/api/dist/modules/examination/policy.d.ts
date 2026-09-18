import { z } from 'zod';
import type { ExamActor } from './access.js';
import type { CieComponent } from './types.js';
export declare const policySchema: z.ZodObject<{
    schemeId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    programId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    name: z.ZodString;
    minimumAttendancePct: z.ZodDefault<z.ZodNumber>;
    minimumInternalMarks: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    cieMaximum: z.ZodDefault<z.ZodNumber>;
    seeMaximum: z.ZodDefault<z.ZodNumber>;
    passPercentage: z.ZodDefault<z.ZodNumber>;
    minimumSeeScore: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    internalAggregation: z.ZodDefault<z.ZodEnum<["WEIGHTED_SUM", "BEST_OF", "AVERAGE"]>>;
    cieComponents: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<["IA", "ASSIGNMENT", "QUIZ", "INTERNAL_ASSESSMENT"]>;
        label: z.ZodString;
        weight: z.ZodNumber;
        aggregation: z.ZodOptional<z.ZodEnum<["SUM", "BEST_OF", "AVERAGE"]>>;
        sourceIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        kind: "ASSIGNMENT" | "QUIZ" | "IA" | "INTERNAL_ASSESSMENT";
        weight: number;
        aggregation?: "SUM" | "BEST_OF" | "AVERAGE" | undefined;
        sourceIds?: number[] | undefined;
    }, {
        label: string;
        kind: "ASSIGNMENT" | "QUIZ" | "IA" | "INTERNAL_ASSESSMENT";
        weight: number;
        aggregation?: "SUM" | "BEST_OF" | "AVERAGE" | undefined;
        sourceIds?: number[] | undefined;
    }>, "many">>>;
    gradeBands: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
        grade: z.ZodString;
        gradePoints: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        min: number;
        max: number;
        grade: string;
        gradePoints: number;
    }, {
        min: number;
        max: number;
        grade: string;
        gradePoints: number;
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    passPercentage: number;
    minimumAttendancePct: number;
    cieMaximum: number;
    seeMaximum: number;
    internalAggregation: "BEST_OF" | "AVERAGE" | "WEIGHTED_SUM";
    programId?: number | null | undefined;
    schemeId?: number | null | undefined;
    minimumInternalMarks?: number | null | undefined;
    minimumSeeScore?: number | null | undefined;
    cieComponents?: {
        label: string;
        kind: "ASSIGNMENT" | "QUIZ" | "IA" | "INTERNAL_ASSESSMENT";
        weight: number;
        aggregation?: "SUM" | "BEST_OF" | "AVERAGE" | undefined;
        sourceIds?: number[] | undefined;
    }[] | null | undefined;
    gradeBands?: {
        min: number;
        max: number;
        grade: string;
        gradePoints: number;
    }[] | null | undefined;
}, {
    name: string;
    passPercentage?: number | undefined;
    programId?: number | null | undefined;
    schemeId?: number | null | undefined;
    minimumAttendancePct?: number | undefined;
    minimumInternalMarks?: number | null | undefined;
    cieMaximum?: number | undefined;
    seeMaximum?: number | undefined;
    minimumSeeScore?: number | null | undefined;
    internalAggregation?: "BEST_OF" | "AVERAGE" | "WEIGHTED_SUM" | undefined;
    cieComponents?: {
        label: string;
        kind: "ASSIGNMENT" | "QUIZ" | "IA" | "INTERNAL_ASSESSMENT";
        weight: number;
        aggregation?: "SUM" | "BEST_OF" | "AVERAGE" | undefined;
        sourceIds?: number[] | undefined;
    }[] | null | undefined;
    gradeBands?: {
        min: number;
        max: number;
        grade: string;
        gradePoints: number;
    }[] | null | undefined;
}>;
export declare function listPolicies(collegeId: number, schemeId?: number): Promise<{
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
}[]>;
export declare function resolvePolicy(collegeId: number, schemeId?: number | null, programId?: number | null): Promise<{
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
}>;
export declare function savePolicy(actor: ExamActor, body: z.infer<typeof policySchema>, id?: number): Promise<{
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
}>;
