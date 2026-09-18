import { z } from 'zod';
import { type QuizQuestionType } from '../../types/quiz.js';
export declare const moduleSchema: z.ZodObject<{
    courseId: z.ZodNumber;
    name: z.ZodString;
    code: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    courseId: number;
    code?: string | null | undefined;
    description?: string | null | undefined;
    sortOrder?: number | undefined;
}, {
    name: string;
    courseId: number;
    code?: string | null | undefined;
    description?: string | null | undefined;
    sortOrder?: number | undefined;
}>;
export declare const bankOptionSchema: z.ZodObject<{
    label: z.ZodString;
    isCorrect: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    label: string;
    isCorrect: boolean;
    sortOrder?: number | undefined;
}, {
    label: string;
    sortOrder?: number | undefined;
    isCorrect?: boolean | undefined;
}>;
export declare const bankQuestionSchema: z.ZodObject<{
    courseId: z.ZodNumber;
    moduleId: z.ZodNumber;
    questionText: z.ZodString;
    questionType: z.ZodEnum<["SINGLE_CHOICE", "MULTIPLE_SELECT", "TRUE_FALSE", "NUMERIC", "SHORT_ANSWER"]>;
    marks: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    difficulty: z.ZodNullable<z.ZodOptional<z.ZodEnum<["EASY", "INTERMEDIATE", "DIFFICULT"]>>>;
    explanation: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    source: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sourceFile: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sourceReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    originalModule: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    originalDifficulty: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    importBatch: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    duplicateGroup: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    reviewStatus: z.ZodOptional<z.ZodEnum<["APPROVED", "NEEDS_REVIEW"]>>;
    reviewNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    numericAnswer: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    numericTolerance: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    options: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        isCorrect: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        sortOrder: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        isCorrect: boolean;
        sortOrder?: number | undefined;
    }, {
        label: string;
        sortOrder?: number | undefined;
        isCorrect?: boolean | undefined;
    }>, "many">>>;
    primaryCoCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    secondaryCoCodes: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    mappingBasis: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    mappingSource: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    verificationStatus: z.ZodNullable<z.ZodOptional<z.ZodEnum<["VERIFIED_SOURCE", "VERIFIED", "ACADEMIC_ANALYSIS", "NEEDS_REVIEW", "CO_MAPPING_BLOCKED"]>>>;
}, "strip", z.ZodTypeAny, {
    options: {
        label: string;
        isCorrect: boolean;
        sortOrder?: number | undefined;
    }[];
    courseId: number;
    questionType: "SHORT_ANSWER" | "SINGLE_CHOICE" | "MULTIPLE_SELECT" | "TRUE_FALSE" | "NUMERIC";
    moduleId: number;
    questionText: string;
    marks: number;
    numericAnswer?: number | null | undefined;
    numericTolerance?: number | null | undefined;
    explanation?: string | null | undefined;
    primaryCoCode?: string | null | undefined;
    difficulty?: "INTERMEDIATE" | "EASY" | "DIFFICULT" | null | undefined;
    source?: string | null | undefined;
    sourceFile?: string | null | undefined;
    sourceReference?: string | null | undefined;
    originalModule?: string | null | undefined;
    originalDifficulty?: string | null | undefined;
    importBatch?: string | null | undefined;
    duplicateGroup?: string | null | undefined;
    reviewStatus?: "APPROVED" | "NEEDS_REVIEW" | undefined;
    reviewNotes?: string | null | undefined;
    secondaryCoCodes?: string[] | null | undefined;
    mappingBasis?: string | null | undefined;
    mappingSource?: string | null | undefined;
    verificationStatus?: "VERIFIED" | "NEEDS_REVIEW" | "VERIFIED_SOURCE" | "ACADEMIC_ANALYSIS" | "CO_MAPPING_BLOCKED" | null | undefined;
}, {
    courseId: number;
    questionType: "SHORT_ANSWER" | "SINGLE_CHOICE" | "MULTIPLE_SELECT" | "TRUE_FALSE" | "NUMERIC";
    moduleId: number;
    questionText: string;
    options?: {
        label: string;
        sortOrder?: number | undefined;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    numericAnswer?: number | null | undefined;
    numericTolerance?: number | null | undefined;
    explanation?: string | null | undefined;
    primaryCoCode?: string | null | undefined;
    marks?: number | undefined;
    difficulty?: "INTERMEDIATE" | "EASY" | "DIFFICULT" | null | undefined;
    source?: string | null | undefined;
    sourceFile?: string | null | undefined;
    sourceReference?: string | null | undefined;
    originalModule?: string | null | undefined;
    originalDifficulty?: string | null | undefined;
    importBatch?: string | null | undefined;
    duplicateGroup?: string | null | undefined;
    reviewStatus?: "APPROVED" | "NEEDS_REVIEW" | undefined;
    reviewNotes?: string | null | undefined;
    secondaryCoCodes?: string[] | null | undefined;
    mappingBasis?: string | null | undefined;
    mappingSource?: string | null | undefined;
    verificationStatus?: "VERIFIED" | "NEEDS_REVIEW" | "VERIFIED_SOURCE" | "ACADEMIC_ANALYSIS" | "CO_MAPPING_BLOCKED" | null | undefined;
}>;
export type BankQuestionInput = z.output<typeof bankQuestionSchema>;
export declare function validateGradableQuestion(input: {
    questionType: QuizQuestionType;
    options: Array<{
        label: string;
        isCorrect?: boolean;
    }>;
    numericAnswer?: number | null;
}): {
    ok: boolean;
    reviewStatus: 'APPROVED' | 'NEEDS_REVIEW';
    notes: string[];
};
declare function parseJson(value: unknown): any;
export declare function assertCourseInCollege(courseId: number, collegeId: number): Promise<any>;
export declare function assertModuleInCourse(moduleId: number, courseId: number, collegeId: number): Promise<any>;
export declare function listModules(collegeId: number, courseId?: number): Promise<any[]>;
export declare function createModule(collegeId: number, createdBy: number, input: z.output<typeof moduleSchema>): Promise<any>;
export declare function updateModule(collegeId: number, id: number, input: Partial<z.output<typeof moduleSchema>>): Promise<any>;
export declare function deleteModule(collegeId: number, id: number): Promise<{
    ok: boolean;
}>;
export declare function listBankQuestions(collegeId: number, filters?: {
    courseId?: number;
    moduleId?: number;
    questionType?: string;
    difficulty?: string;
    reviewStatus?: string;
    coCode?: string;
    verificationStatus?: string;
    needsCoReview?: boolean;
    q?: string;
    page?: number;
    pageSize?: number;
}): Promise<{
    total: number;
    page: number;
    pageSize: number;
    questions: {
        id: unknown;
        courseId: unknown;
        moduleId: unknown;
        questionText: unknown;
        questionType: unknown;
        marks: number;
        difficulty: unknown;
        explanation: unknown;
        source: unknown;
        sourceFile: unknown;
        sourceReference: unknown;
        originalModule: unknown;
        originalDifficulty: unknown;
        importBatch: unknown;
        duplicateGroup: unknown;
        reviewStatus: unknown;
        reviewNotes: unknown;
        numericAnswer: number | null;
        numericTolerance: number | null;
        createdBy: unknown;
        createdAt: unknown;
        courseName: unknown;
        courseCode: unknown;
        moduleName: unknown;
        primaryCoCode: string | null;
        primaryCoId: number | null;
        secondaryCoCodes: string[];
        mappingBasis: {} | null;
        mappingSource: {} | null;
        verificationStatus: {} | null;
        coMappingBlocked: boolean;
        coMappingBlockReason: {} | null;
        derivedOutcomes: any;
        options: {
            id: unknown;
            label: unknown;
            isCorrect: boolean;
            sortOrder: unknown;
        }[];
    }[];
}>;
export declare function getBankQuestion(collegeId: number, id: number): Promise<{
    derivedOutcomes: any;
    coStatement: string | null;
    id: unknown;
    courseId: unknown;
    moduleId: unknown;
    questionText: unknown;
    questionType: unknown;
    marks: number;
    difficulty: unknown;
    explanation: unknown;
    source: unknown;
    sourceFile: unknown;
    sourceReference: unknown;
    originalModule: unknown;
    originalDifficulty: unknown;
    importBatch: unknown;
    duplicateGroup: unknown;
    reviewStatus: unknown;
    reviewNotes: unknown;
    numericAnswer: number | null;
    numericTolerance: number | null;
    createdBy: unknown;
    createdAt: unknown;
    courseName: unknown;
    courseCode: unknown;
    moduleName: unknown;
    primaryCoCode: string | null;
    primaryCoId: number | null;
    secondaryCoCodes: string[];
    mappingBasis: {} | null;
    mappingSource: {} | null;
    verificationStatus: {} | null;
    coMappingBlocked: boolean;
    coMappingBlockReason: {} | null;
    options: {
        id: unknown;
        label: unknown;
        isCorrect: boolean;
        sortOrder: unknown;
    }[];
}>;
export declare function createBankQuestion(collegeId: number, createdBy: number, raw: BankQuestionInput, opts?: {
    allowNeedsReview?: boolean;
    skipIfDuplicate?: boolean;
}): Promise<{
    derivedOutcomes: any;
    coStatement: string | null;
    id: unknown;
    courseId: unknown;
    moduleId: unknown;
    questionText: unknown;
    questionType: unknown;
    marks: number;
    difficulty: unknown;
    explanation: unknown;
    source: unknown;
    sourceFile: unknown;
    sourceReference: unknown;
    originalModule: unknown;
    originalDifficulty: unknown;
    importBatch: unknown;
    duplicateGroup: unknown;
    reviewStatus: unknown;
    reviewNotes: unknown;
    numericAnswer: number | null;
    numericTolerance: number | null;
    createdBy: unknown;
    createdAt: unknown;
    courseName: unknown;
    courseCode: unknown;
    moduleName: unknown;
    primaryCoCode: string | null;
    primaryCoId: number | null;
    secondaryCoCodes: string[];
    mappingBasis: {} | null;
    mappingSource: {} | null;
    verificationStatus: {} | null;
    coMappingBlocked: boolean;
    coMappingBlockReason: {} | null;
    options: {
        id: unknown;
        label: unknown;
        isCorrect: boolean;
        sortOrder: unknown;
    }[];
}>;
export declare function updateBankQuestion(collegeId: number, id: number, raw: Partial<BankQuestionInput>): Promise<{
    question: {
        derivedOutcomes: any;
        coStatement: string | null;
        id: unknown;
        courseId: unknown;
        moduleId: unknown;
        questionText: unknown;
        questionType: unknown;
        marks: number;
        difficulty: unknown;
        explanation: unknown;
        source: unknown;
        sourceFile: unknown;
        sourceReference: unknown;
        originalModule: unknown;
        originalDifficulty: unknown;
        importBatch: unknown;
        duplicateGroup: unknown;
        reviewStatus: unknown;
        reviewNotes: unknown;
        numericAnswer: number | null;
        numericTolerance: number | null;
        createdBy: unknown;
        createdAt: unknown;
        courseName: unknown;
        courseCode: unknown;
        moduleName: unknown;
        primaryCoCode: string | null;
        primaryCoId: number | null;
        secondaryCoCodes: string[];
        mappingBasis: {} | null;
        mappingSource: {} | null;
        verificationStatus: {} | null;
        coMappingBlocked: boolean;
        coMappingBlockReason: {} | null;
        options: {
            id: unknown;
            label: unknown;
            isCorrect: boolean;
            sortOrder: unknown;
        }[];
    };
    answerKeyChanged: boolean | undefined;
}>;
export declare function deleteBankQuestion(collegeId: number, id: number): Promise<{
    ok: boolean;
}>;
export declare function bankOverview(collegeId: number): Promise<{
    subjects: {
        courseId: number;
        courseName: string;
        courseCode: string;
        modules: any[];
        questionCount: number;
        easy: number;
        intermediate: number;
        difficult: number;
        needsReview: number;
    }[];
}>;
export declare function bankInventory(collegeId: number, filters: {
    courseId: number;
    moduleIds?: number[];
}): Promise<{
    totals: Record<"INTERMEDIATE" | "EASY" | "DIFFICULT", number>;
    byModule: {
        [k: string]: Record<"INTERMEDIATE" | "EASY" | "DIFFICULT", number>;
    };
}>;
export declare function listNeedsReview(collegeId: number): Promise<{
    total: number;
    page: number;
    pageSize: number;
    questions: {
        id: unknown;
        courseId: unknown;
        moduleId: unknown;
        questionText: unknown;
        questionType: unknown;
        marks: number;
        difficulty: unknown;
        explanation: unknown;
        source: unknown;
        sourceFile: unknown;
        sourceReference: unknown;
        originalModule: unknown;
        originalDifficulty: unknown;
        importBatch: unknown;
        duplicateGroup: unknown;
        reviewStatus: unknown;
        reviewNotes: unknown;
        numericAnswer: number | null;
        numericTolerance: number | null;
        createdBy: unknown;
        createdAt: unknown;
        courseName: unknown;
        courseCode: unknown;
        moduleName: unknown;
        primaryCoCode: string | null;
        primaryCoId: number | null;
        secondaryCoCodes: string[];
        mappingBasis: {} | null;
        mappingSource: {} | null;
        verificationStatus: {} | null;
        coMappingBlocked: boolean;
        coMappingBlockReason: {} | null;
        derivedOutcomes: any;
        options: {
            id: unknown;
            label: unknown;
            isCorrect: boolean;
            sortOrder: unknown;
        }[];
    }[];
}>;
/** QA report: CO mapping readiness for question bank (not final attainment). */
export declare function coMappingQaReport(collegeId: number, courseId?: number): Promise<{
    kind: string;
    note: string;
    totals: {
        attainmentReady: string;
        total: number;
        mapped: number;
        needsReview: number;
        blocked: number;
    };
    subjects: {
        courseId: number;
        courseName: string;
        courseCode: string;
        total: number;
        mapped: number;
        needsReview: number;
        blocked: number;
        attainmentReady: string;
        coMappingStatus: string;
        coDistribution: Record<string, number>;
        modules: {
            moduleName: string;
            questions: number;
            mapped: number;
            unmapped: number;
            coCoverage: Record<string, number>;
        }[];
    }[];
    coverage: {
        byCo: Record<string, number>;
        total: number;
        unmapped: number;
    };
}>;
export { parseJson };
