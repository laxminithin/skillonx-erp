import ExcelJS from 'exceljs';
import { z } from 'zod';
import type { AttainmentActor } from './access.js';
export declare const createSheetSchema: z.ZodObject<{
    courseId: z.ZodNumber;
    sourceKind: z.ZodEnum<["INTERNAL_PAPER", "SEE", "LAB", "PROJECT", "REASSESSMENT"]>;
    sourceId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    academicYearId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    programId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    semesterId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    seeMethod: z.ZodNullable<z.ZodOptional<z.ZodEnum<["ACTUAL", "PAPER_WEIGHTED", "EQUAL_WEIGHT"]>>>;
    seePaperId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    maxMarks: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    courseId: number;
    sourceKind: "LAB" | "PROJECT" | "SEE" | "INTERNAL_PAPER" | "REASSESSMENT";
    title?: string | null | undefined;
    academicYearId?: number | null | undefined;
    semesterId?: number | null | undefined;
    maxMarks?: number | undefined;
    programId?: number | null | undefined;
    seeMethod?: "ACTUAL" | "PAPER_WEIGHTED" | "EQUAL_WEIGHT" | null | undefined;
    sourceId?: number | null | undefined;
    seePaperId?: number | null | undefined;
}, {
    courseId: number;
    sourceKind: "LAB" | "PROJECT" | "SEE" | "INTERNAL_PAPER" | "REASSESSMENT";
    title?: string | null | undefined;
    academicYearId?: number | null | undefined;
    semesterId?: number | null | undefined;
    maxMarks?: number | undefined;
    programId?: number | null | undefined;
    seeMethod?: "ACTUAL" | "PAPER_WEIGHTED" | "EQUAL_WEIGHT" | null | undefined;
    sourceId?: number | null | undefined;
    seePaperId?: number | null | undefined;
}>;
export declare function createSheetFromInternalPaper(actor: AttainmentActor, paperId: number): Promise<{
    sheet: {
        id: number;
        title: any;
        sourceKind: any;
        sourceId: any;
        status: any;
        frozen: boolean;
        maxMarks: number;
        seeMethod: any;
        courseCode: any;
        courseName: any;
        courseId: number;
        createdBy: number;
    };
    questions: {
        id: number;
        questionKey: any;
        label: any;
        maxMarks: number;
        coCode: any;
        bloomLevel: any;
        difficulty: any;
        questionNumber: number | null;
        subLetter: any;
        orGroupId: any;
        orAlternative: any;
        scheme: null;
    }[];
    students: {
        id: number;
        usn: any;
        name: any;
        status: any;
        total: number | null;
        marks: any;
        statuses: any;
        attempts: {
            [k: string]: string;
        };
    }[];
}>;
export declare function createSheet(actor: AttainmentActor, body: z.infer<typeof createSheetSchema>): Promise<{
    sheet: {
        id: number;
        title: any;
        sourceKind: any;
        sourceId: any;
        status: any;
        frozen: boolean;
        maxMarks: number;
        seeMethod: any;
        courseCode: any;
        courseName: any;
        courseId: number;
        createdBy: number;
    };
    questions: {
        id: number;
        questionKey: any;
        label: any;
        maxMarks: number;
        coCode: any;
        bloomLevel: any;
        difficulty: any;
        questionNumber: number | null;
        subLetter: any;
        orGroupId: any;
        orAlternative: any;
        scheme: null;
    }[];
    students: {
        id: number;
        usn: any;
        name: any;
        status: any;
        total: number | null;
        marks: any;
        statuses: any;
        attempts: {
            [k: string]: string;
        };
    }[];
}>;
export declare function getSheet(sheetId: number, collegeId: number): Promise<{
    sheet: {
        id: number;
        title: any;
        sourceKind: any;
        sourceId: any;
        status: any;
        frozen: boolean;
        maxMarks: number;
        seeMethod: any;
        courseCode: any;
        courseName: any;
        courseId: number;
        createdBy: number;
    };
    questions: {
        id: number;
        questionKey: any;
        label: any;
        maxMarks: number;
        coCode: any;
        bloomLevel: any;
        difficulty: any;
        questionNumber: number | null;
        subLetter: any;
        orGroupId: any;
        orAlternative: any;
        scheme: null;
    }[];
    students: {
        id: number;
        usn: any;
        name: any;
        status: any;
        total: number | null;
        marks: any;
        statuses: any;
        attempts: {
            [k: string]: string;
        };
    }[];
}>;
/**
 * Question-wise marks export. Unchosen OR alternatives are shown as
 * "NOT ATTEMPTED — OR" (never 0) so the OR distinction is visible in audit exports.
 */
export declare function exportMarksSheet(sheetId: number, collegeId: number): Promise<{
    buffer: Buffer<ArrayBuffer>;
    filename: string;
}>;
export declare function listSheets(actor: AttainmentActor, courseId?: number): Promise<{
    sheets: any;
}>;
export declare function freezeSheet(actor: AttainmentActor, sheetId: number): Promise<{
    sheet: {
        id: number;
        title: any;
        sourceKind: any;
        sourceId: any;
        status: any;
        frozen: boolean;
        maxMarks: number;
        seeMethod: any;
        courseCode: any;
        courseName: any;
        courseId: number;
        createdBy: number;
    };
    questions: {
        id: number;
        questionKey: any;
        label: any;
        maxMarks: number;
        coCode: any;
        bloomLevel: any;
        difficulty: any;
        questionNumber: number | null;
        subLetter: any;
        orGroupId: any;
        orAlternative: any;
        scheme: null;
    }[];
    students: {
        id: number;
        usn: any;
        name: any;
        status: any;
        total: number | null;
        marks: any;
        statuses: any;
        attempts: {
            [k: string]: string;
        };
    }[];
}>;
export declare function marksTemplate(sheetId: number, collegeId: number): Promise<{
    buffer: Buffer<ArrayBuffer>;
    filename: string;
}>;
export declare function previewMarksImport(actor: AttainmentActor, sheetId: number, workbookBase64: string): Promise<import("./marksValidation.js").MarksImportPreview | OrImportPreview>;
export type OrImportPreview = {
    ok: boolean;
    rows: number;
    errorCount: number;
    warningCount: number;
    or: true;
    issues: Array<{
        severity: 'ERROR' | 'WARNING';
        code: string;
        row?: number;
        usn?: string;
        message: string;
    }>;
    parsed: Array<{
        usn: string;
        name: string | null;
        status: string;
        perQuestion: Array<{
            questionKey: string;
            awarded: number | null;
            status: string;
        }>;
        total: number | null;
    }>;
};
/** Parse an OR-structured workbook (Attempted + A/B mark columns). */
export declare function previewOrMarksImport(detail: Awaited<ReturnType<typeof getSheet>>, ws: ExcelJS.Worksheet, knownUsns: Set<string>): OrImportPreview;
export declare function commitMarksImport(actor: AttainmentActor, sheetId: number, workbookBase64: string): Promise<{
    imported: number;
    preview: import("./marksValidation.js").MarksImportPreview | OrImportPreview;
}>;
export declare const manualMarksSchema: z.ZodObject<{
    usn: z.ZodString;
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<["PRESENT", "ABSENT", "NOT_EVALUATED", "EXEMPT"]>>;
    marks: z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodNumber>>;
    attempts: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["A", "B"]>>>;
}, "strip", z.ZodTypeAny, {
    usn: string;
    marks: Record<string, number | null>;
    status?: "PRESENT" | "ABSENT" | "NOT_EVALUATED" | "EXEMPT" | undefined;
    name?: string | null | undefined;
    attempts?: Record<string, "A" | "B"> | undefined;
}, {
    usn: string;
    marks: Record<string, number | null>;
    status?: "PRESENT" | "ABSENT" | "NOT_EVALUATED" | "EXEMPT" | undefined;
    name?: string | null | undefined;
    attempts?: Record<string, "A" | "B"> | undefined;
}>;
export declare function upsertManualMarks(actor: AttainmentActor, sheetId: number, body: z.infer<typeof manualMarksSchema>): Promise<{
    sheet: {
        id: number;
        title: any;
        sourceKind: any;
        sourceId: any;
        status: any;
        frozen: boolean;
        maxMarks: number;
        seeMethod: any;
        courseCode: any;
        courseName: any;
        courseId: number;
        createdBy: number;
    };
    questions: {
        id: number;
        questionKey: any;
        label: any;
        maxMarks: number;
        coCode: any;
        bloomLevel: any;
        difficulty: any;
        questionNumber: number | null;
        subLetter: any;
        orGroupId: any;
        orAlternative: any;
        scheme: null;
    }[];
    students: {
        id: number;
        usn: any;
        name: any;
        status: any;
        total: number | null;
        marks: any;
        statuses: any;
        attempts: {
            [k: string]: string;
        };
    }[];
}>;
