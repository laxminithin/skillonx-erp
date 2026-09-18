import { z } from 'zod';
import type { ExamActor } from './access.js';
export declare const markEntrySchema: z.ZodObject<{
    studentId: z.ZodNumber;
    marks: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    status: z.ZodDefault<z.ZodEnum<["PRESENT", "ABSENT", "MALPRACTICE", "WITHHELD"]>>;
}, "strip", z.ZodTypeAny, {
    status: "PRESENT" | "ABSENT" | "WITHHELD" | "MALPRACTICE";
    studentId: number;
    marks?: number | null | undefined;
}, {
    studentId: number;
    status?: "PRESENT" | "ABSENT" | "WITHHELD" | "MALPRACTICE" | undefined;
    marks?: number | null | undefined;
}>;
export declare const unlockSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare function getMarksSheet(actor: ExamActor, examSubjectId: number): Promise<{
    sheet: {
        id: number;
        examSubjectId: number;
        facultyId: number | null;
        status: any;
        locked: boolean;
        submittedBy: number | null;
        submittedAt: any;
        verifiedBy: number | null;
        verifiedAt: any;
        lockedBy: number | null;
        lockedAt: any;
        marksSource: any;
    };
    subject: {
        id: number;
        courseId: number;
        maximumMarks: number;
    };
    marks: {
        id: number;
        marksSheetId: number;
        examSubjectId: number;
        studentId: number;
        studentName: any;
        usn: any;
        marks: number | null;
        status: any;
        internalMarks: number | null;
        internalSource: any;
    }[];
}>;
export declare function saveMarks(actor: ExamActor, examSubjectId: number, entries: z.infer<typeof markEntrySchema>[]): Promise<{
    sheet: {
        id: number;
        examSubjectId: number;
        facultyId: number | null;
        status: any;
        locked: boolean;
        submittedBy: number | null;
        submittedAt: any;
        verifiedBy: number | null;
        verifiedAt: any;
        lockedBy: number | null;
        lockedAt: any;
        marksSource: any;
    };
    subject: {
        id: number;
        courseId: number;
        maximumMarks: number;
    };
    marks: {
        id: number;
        marksSheetId: number;
        examSubjectId: number;
        studentId: number;
        studentName: any;
        usn: any;
        marks: number | null;
        status: any;
        internalMarks: number | null;
        internalSource: any;
    }[];
}>;
export declare function submitMarks(actor: ExamActor, examSubjectId: number): Promise<{
    sheet: {
        id: number;
        examSubjectId: number;
        facultyId: number | null;
        status: any;
        locked: boolean;
        submittedBy: number | null;
        submittedAt: any;
        verifiedBy: number | null;
        verifiedAt: any;
        lockedBy: number | null;
        lockedAt: any;
        marksSource: any;
    };
    subject: {
        id: number;
        courseId: number;
        maximumMarks: number;
    };
    marks: {
        id: number;
        marksSheetId: number;
        examSubjectId: number;
        studentId: number;
        studentName: any;
        usn: any;
        marks: number | null;
        status: any;
        internalMarks: number | null;
        internalSource: any;
    }[];
}>;
export declare function verifyMarks(actor: ExamActor, examSubjectId: number): Promise<{
    sheet: {
        id: number;
        examSubjectId: number;
        facultyId: number | null;
        status: any;
        locked: boolean;
        submittedBy: number | null;
        submittedAt: any;
        verifiedBy: number | null;
        verifiedAt: any;
        lockedBy: number | null;
        lockedAt: any;
        marksSource: any;
    };
    subject: {
        id: number;
        courseId: number;
        maximumMarks: number;
    };
    marks: {
        id: number;
        marksSheetId: number;
        examSubjectId: number;
        studentId: number;
        studentName: any;
        usn: any;
        marks: number | null;
        status: any;
        internalMarks: number | null;
        internalSource: any;
    }[];
}>;
export declare function lockMarks(actor: ExamActor, examSubjectId: number): Promise<{
    sheet: {
        id: number;
        examSubjectId: number;
        facultyId: number | null;
        status: any;
        locked: boolean;
        submittedBy: number | null;
        submittedAt: any;
        verifiedBy: number | null;
        verifiedAt: any;
        lockedBy: number | null;
        lockedAt: any;
        marksSource: any;
    };
    subject: {
        id: number;
        courseId: number;
        maximumMarks: number;
    };
    marks: {
        id: number;
        marksSheetId: number;
        examSubjectId: number;
        studentId: number;
        studentName: any;
        usn: any;
        marks: number | null;
        status: any;
        internalMarks: number | null;
        internalSource: any;
    }[];
}>;
export declare function unlockMarks(actor: ExamActor, examSubjectId: number, body: z.infer<typeof unlockSchema>): Promise<{
    sheet: {
        id: number;
        examSubjectId: number;
        facultyId: number | null;
        status: any;
        locked: boolean;
        submittedBy: number | null;
        submittedAt: any;
        verifiedBy: number | null;
        verifiedAt: any;
        lockedBy: number | null;
        lockedAt: any;
        marksSource: any;
    };
    subject: {
        id: number;
        courseId: number;
        maximumMarks: number;
    };
    marks: {
        id: number;
        marksSheetId: number;
        examSubjectId: number;
        studentId: number;
        studentName: any;
        usn: any;
        marks: number | null;
        status: any;
        internalMarks: number | null;
        internalSource: any;
    }[];
}>;
export declare function importMarksDryRun(actor: ExamActor, examSubjectId: number, rows: Array<{
    usn: string;
    marks?: number | null;
    status?: string;
}>): Promise<{
    valid: {
        usn: string;
        marks?: number | null;
        status?: string;
    }[];
    errors: string[];
    canCommit: boolean;
}>;
export declare function importMarksCommit(actor: ExamActor, examSubjectId: number, rows: Array<{
    usn: string;
    marks?: number | null;
    status?: string;
}>): Promise<{
    sheet: {
        id: number;
        examSubjectId: number;
        facultyId: number | null;
        status: any;
        locked: boolean;
        submittedBy: number | null;
        submittedAt: any;
        verifiedBy: number | null;
        verifiedAt: any;
        lockedBy: number | null;
        lockedAt: any;
        marksSource: any;
    };
    subject: {
        id: number;
        courseId: number;
        maximumMarks: number;
    };
    marks: {
        id: number;
        marksSheetId: number;
        examSubjectId: number;
        studentId: number;
        studentName: any;
        usn: any;
        marks: number | null;
        status: any;
        internalMarks: number | null;
        internalSource: any;
    }[];
}>;
export declare const moderationSchema: z.ZodObject<{
    examMarkId: z.ZodNumber;
    adjustedMarks: z.ZodNumber;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
    examMarkId: number;
    adjustedMarks: number;
}, {
    reason: string;
    examMarkId: number;
    adjustedMarks: number;
}>;
export declare function moderateMark(actor: ExamActor, body: z.infer<typeof moderationSchema>): Promise<{
    ok: boolean;
}>;
