import { z } from 'zod';
import type { CopoActor } from './access.js';
export declare const importPayloadSchema: z.ZodObject<{
    scheme: z.ZodObject<{
        name: z.ZodString;
        code: z.ZodString;
        university: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        startYear: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        endYear: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        effectiveAcademicYear: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        name: string;
        university?: string | null | undefined;
        effectiveAcademicYear?: string | null | undefined;
        startYear?: number | null | undefined;
        endYear?: number | null | undefined;
    }, {
        code: string;
        name: string;
        university?: string | null | undefined;
        effectiveAcademicYear?: string | null | undefined;
        startYear?: number | null | undefined;
        endYear?: number | null | undefined;
    }>;
    program: z.ZodObject<{
        name: z.ZodString;
        code: z.ZodString;
        degree: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        name: string;
        degree?: string | null | undefined;
    }, {
        code: string;
        name: string;
        degree?: string | null | undefined;
    }>;
    sourceLabel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    subjects: z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        name: z.ZodString;
        semesterNumber: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        courseType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        lectureHours: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        tutorialHours: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        practicalHours: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        credits: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        cieMarks: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        seeMarks: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        outcomes: z.ZodDefault<z.ZodArray<z.ZodObject<{
            number: z.ZodNumber;
            code: z.ZodOptional<z.ZodString>;
            statement: z.ZodString;
            bloomsLevel: z.ZodNullable<z.ZodOptional<z.ZodEnum<["L1", "L2", "L3", "L4", "L5", "L6"]>>>;
            knowledgeLevel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            page: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            source: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            number: number;
            statement: string;
            code?: string | undefined;
            source?: string | null | undefined;
            page?: string | null | undefined;
            bloomsLevel?: "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | null | undefined;
            knowledgeLevel?: string | null | undefined;
        }, {
            number: number;
            statement: string;
            code?: string | undefined;
            source?: string | null | undefined;
            page?: string | null | undefined;
            bloomsLevel?: "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | null | undefined;
            knowledgeLevel?: string | null | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        name: string;
        outcomes: {
            number: number;
            statement: string;
            code?: string | undefined;
            source?: string | null | undefined;
            page?: string | null | undefined;
            bloomsLevel?: "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | null | undefined;
            knowledgeLevel?: string | null | undefined;
        }[];
        credits?: number | null | undefined;
        courseType?: string | null | undefined;
        lectureHours?: number | null | undefined;
        tutorialHours?: number | null | undefined;
        practicalHours?: number | null | undefined;
        cieMarks?: number | null | undefined;
        seeMarks?: number | null | undefined;
        semesterNumber?: number | null | undefined;
    }, {
        code: string;
        name: string;
        credits?: number | null | undefined;
        courseType?: string | null | undefined;
        lectureHours?: number | null | undefined;
        tutorialHours?: number | null | undefined;
        practicalHours?: number | null | undefined;
        cieMarks?: number | null | undefined;
        seeMarks?: number | null | undefined;
        outcomes?: {
            number: number;
            statement: string;
            code?: string | undefined;
            source?: string | null | undefined;
            page?: string | null | undefined;
            bloomsLevel?: "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | null | undefined;
            knowledgeLevel?: string | null | undefined;
        }[] | undefined;
        semesterNumber?: number | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    subjects: {
        code: string;
        name: string;
        outcomes: {
            number: number;
            statement: string;
            code?: string | undefined;
            source?: string | null | undefined;
            page?: string | null | undefined;
            bloomsLevel?: "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | null | undefined;
            knowledgeLevel?: string | null | undefined;
        }[];
        credits?: number | null | undefined;
        courseType?: string | null | undefined;
        lectureHours?: number | null | undefined;
        tutorialHours?: number | null | undefined;
        practicalHours?: number | null | undefined;
        cieMarks?: number | null | undefined;
        seeMarks?: number | null | undefined;
        semesterNumber?: number | null | undefined;
    }[];
    program: {
        code: string;
        name: string;
        degree?: string | null | undefined;
    };
    scheme: {
        code: string;
        name: string;
        university?: string | null | undefined;
        effectiveAcademicYear?: string | null | undefined;
        startYear?: number | null | undefined;
        endYear?: number | null | undefined;
    };
    sourceLabel?: string | null | undefined;
}, {
    subjects: {
        code: string;
        name: string;
        credits?: number | null | undefined;
        courseType?: string | null | undefined;
        lectureHours?: number | null | undefined;
        tutorialHours?: number | null | undefined;
        practicalHours?: number | null | undefined;
        cieMarks?: number | null | undefined;
        seeMarks?: number | null | undefined;
        outcomes?: {
            number: number;
            statement: string;
            code?: string | undefined;
            source?: string | null | undefined;
            page?: string | null | undefined;
            bloomsLevel?: "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | null | undefined;
            knowledgeLevel?: string | null | undefined;
        }[] | undefined;
        semesterNumber?: number | null | undefined;
    }[];
    program: {
        code: string;
        name: string;
        degree?: string | null | undefined;
    };
    scheme: {
        code: string;
        name: string;
        university?: string | null | undefined;
        effectiveAcademicYear?: string | null | undefined;
        startYear?: number | null | undefined;
        endYear?: number | null | undefined;
    };
    sourceLabel?: string | null | undefined;
}>;
export type ImportResolution = {
    courseId: number;
    coCode: string;
    action: 'KEEP_EXISTING' | 'CREATE_NEW_VERSION' | 'REVIEW_LATER';
};
export declare function previewImport(collegeId: number, actor: CopoActor, payload: z.infer<typeof importPayloadSchema>): Promise<{
    batchId: string;
    preview: {
        newSubjects: number;
        matchedSubjects: number;
        newCos: number;
        changedCos: number;
        ambiguousMatches: number;
        scheme: {
            exists: boolean;
            id: any;
            name: any;
            code: string;
        };
        program: {
            exists: boolean;
            id: any;
            name: any;
            code: string;
        };
        subjects: {
            code: string;
            name: string;
            matchStatus: string;
            courseId: number | null;
            existingName: any;
            outcomes: ({
                code: string;
                status: "NEW";
                number: number;
                statement: string;
                source?: string | null | undefined;
                page?: string | null | undefined;
                bloomsLevel?: "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | null | undefined;
                knowledgeLevel?: string | null | undefined;
            } | {
                code: string;
                status: "CHANGED";
                existingId: number;
                existingStatement: string;
                importedStatement: string;
                number: number;
                statement: string;
                source?: string | null | undefined;
                page?: string | null | undefined;
                bloomsLevel?: "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | null | undefined;
                knowledgeLevel?: string | null | undefined;
            } | {
                code: string;
                status: "UNCHANGED";
                existingId: number;
                number: number;
                statement: string;
                source?: string | null | undefined;
                page?: string | null | undefined;
                bloomsLevel?: "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | null | undefined;
                knowledgeLevel?: string | null | undefined;
            })[];
        }[];
    };
}>;
export declare function commitImport(collegeId: number, actor: CopoActor, batchId: string, resolutions?: ImportResolution[]): Promise<{
    subjects: number;
    outcomes: number;
    versions: number;
    skipped: number;
}>;
export { previewWorkbookImport, commitWorkbookImport, workbookErrorReport, importCopoMasterFile } from './workbookImport.js';
