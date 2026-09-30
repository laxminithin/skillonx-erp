import { z } from 'zod';
import type { ExamActor } from './access.js';
export declare const importPreviewSchema: z.ZodObject<{
    examId: z.ZodOptional<z.ZodNumber>;
    artifactType: z.ZodEnum<["VTU_TIMETABLE", "VTU_REGISTRATION", "VTU_RESULT", "VTU_REVALUATION"]>;
    fileName: z.ZodString;
    fileHash: z.ZodString;
    academicYear: z.ZodOptional<z.ZodString>;
    semester: z.ZodOptional<z.ZodString>;
    examCycle: z.ZodOptional<z.ZodString>;
    rows: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    rows: Record<string, unknown>[];
    artifactType: "VTU_TIMETABLE" | "VTU_REGISTRATION" | "VTU_RESULT" | "VTU_REVALUATION";
    fileHash: string;
    semester?: string | undefined;
    academicYear?: string | undefined;
    examId?: number | undefined;
    examCycle?: string | undefined;
}, {
    fileName: string;
    rows: Record<string, unknown>[];
    artifactType: "VTU_TIMETABLE" | "VTU_REGISTRATION" | "VTU_RESULT" | "VTU_REVALUATION";
    fileHash: string;
    semester?: string | undefined;
    academicYear?: string | undefined;
    examId?: number | undefined;
    examCycle?: string | undefined;
}>;
export declare const importFileSchema: z.ZodObject<Omit<{
    examId: z.ZodOptional<z.ZodNumber>;
    artifactType: z.ZodEnum<["VTU_TIMETABLE", "VTU_REGISTRATION", "VTU_RESULT", "VTU_REVALUATION"]>;
    fileName: z.ZodString;
    fileHash: z.ZodString;
    academicYear: z.ZodOptional<z.ZodString>;
    semester: z.ZodOptional<z.ZodString>;
    examCycle: z.ZodOptional<z.ZodString>;
    rows: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">;
}, "rows" | "fileHash"> & {
    fileBase64: z.ZodString;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    fileBase64: string;
    artifactType: "VTU_TIMETABLE" | "VTU_REGISTRATION" | "VTU_RESULT" | "VTU_REVALUATION";
    semester?: string | undefined;
    academicYear?: string | undefined;
    examId?: number | undefined;
    examCycle?: string | undefined;
}, {
    fileName: string;
    fileBase64: string;
    artifactType: "VTU_TIMETABLE" | "VTU_REGISTRATION" | "VTU_RESULT" | "VTU_REVALUATION";
    semester?: string | undefined;
    academicYear?: string | undefined;
    examId?: number | undefined;
    examCycle?: string | undefined;
}>;
export declare function previewVtuFile(actor: ExamActor, body: z.infer<typeof importFileSchema>): Promise<{
    artifactType: "VTU_TIMETABLE" | "VTU_REGISTRATION" | "VTU_RESULT" | "VTU_REVALUATION";
    authority: string;
    rows: {
        status: string;
        issues: string[];
        studentId: any;
        courseId: any;
        normalized: {
            usn: string | null;
            courseCode: string | null;
        };
    }[];
    summary: {
        [x: string]: number;
    };
}>;
export declare function commitVtuFile(actor: ExamActor, body: z.infer<typeof importFileSchema>): Promise<{
    artifactType: "VTU_TIMETABLE" | "VTU_REGISTRATION" | "VTU_RESULT" | "VTU_REVALUATION";
    authority: string;
    rows: {
        status: string;
        issues: string[];
        studentId: any;
        courseId: any;
        normalized: {
            usn: string | null;
            courseCode: string | null;
        };
    }[];
    summary: {
        [x: string]: number;
    };
    id: number;
}>;
export declare function previewVtuImport(actor: ExamActor, body: z.infer<typeof importPreviewSchema>): Promise<{
    artifactType: "VTU_TIMETABLE" | "VTU_REGISTRATION" | "VTU_RESULT" | "VTU_REVALUATION";
    authority: string;
    rows: {
        status: string;
        issues: string[];
        studentId: any;
        courseId: any;
        normalized: {
            usn: string | null;
            courseCode: string | null;
        };
    }[];
    summary: {
        [x: string]: number;
    };
}>;
export declare function commitVtuImport(actor: ExamActor, body: z.infer<typeof importPreviewSchema>): Promise<{
    artifactType: "VTU_TIMETABLE" | "VTU_REGISTRATION" | "VTU_RESULT" | "VTU_REVALUATION";
    authority: string;
    rows: {
        status: string;
        issues: string[];
        studentId: any;
        courseId: any;
        normalized: {
            usn: string | null;
            courseCode: string | null;
        };
    }[];
    summary: {
        [x: string]: number;
    };
    id: number;
}>;
export declare const windowSchema: z.ZodObject<{
    opensAt: z.ZodOptional<z.ZodDate>;
    closesAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    opensAt?: Date | undefined;
    closesAt?: Date | undefined;
}, {
    opensAt?: Date | undefined;
    closesAt?: Date | undefined;
}>;
export declare function createRegistrationWindow(actor: ExamActor, examId: number, body: z.infer<typeof windowSchema>): Promise<{
    id: number;
    status: string;
}>;
export declare function freezeRegistration(actor: ExamActor, examId: number): Promise<{
    id: number;
    status: string;
}>;
export declare function reopenRegistration(actor: ExamActor, examId: number, reason: string): Promise<{
    id: number;
    status: string;
}>;
export declare function studentRegistrationOptions(studentId: number, collegeId: number): Promise<{
    windows: {
        windowId: number;
        examId: number;
        examName: any;
        examCode: any;
        closesAt: any;
        courses: any[];
    }[];
}>;
export declare function submitStudentRegistration(studentId: number, collegeId: number, windowId: number, subjectIds: number[], attemptType?: 'REGULAR' | 'BACKLOG' | 'REPEATER'): Promise<{
    windowId: number;
    status: string;
    count: number;
}>;
export declare function decideRegistration(actor: ExamActor, registrationId: number, decision: 'VERIFIED' | 'APPROVED' | 'REJECTED', reason?: string): Promise<{
    id: number;
    status: "VERIFIED" | "APPROVED" | "REJECTED";
}>;
export declare function bulkDecideRegistrations(actor: ExamActor, registrationIds: number[], decision: 'VERIFIED' | 'APPROVED' | 'REJECTED', reason?: string): Promise<{
    total: number;
    succeeded: number;
    failed: number;
    decision: "VERIFIED" | "APPROVED" | "REJECTED";
    results: {
        id: number;
        ok: boolean;
        status?: string;
        error?: string;
    }[];
}>;
export declare function decideRegistrationException(actor: ExamActor, registrationId: number, b: {
    ruleCode: string;
    originalCondition?: unknown;
    reason: string;
    decision: 'APPROVED' | 'REJECTED';
}): Promise<{
    id: number;
    decision: "APPROVED" | "REJECTED";
}>;
export declare function listVtuImports(actor: ExamActor, artifactType?: string): Promise<{
    batches: {
        id: number;
        artifactType: any;
        fileName: any;
        fileHash: any;
        authority: any;
        validationState: any;
        reconciliationState: any;
        version: number;
        importedAt: any;
        rows: any[];
    }[];
}>;
export declare function listExternalRecords(actor: ExamActor, artifactType: string, currentOnly?: boolean): Promise<{
    records: {
        id: number;
        batchId: number;
        artifactType: any;
        naturalKey: any;
        authority: any;
        source: any;
        version: number;
        changeType: any;
        payload: any;
        isCurrent: boolean;
        supersedesId: number | null;
        createdAt: any;
    }[];
}>;
export declare function registrationQueue(actor: ExamActor, opts: {
    examId?: number;
    status?: string;
    search?: string;
    page: number;
    pageSize: number;
}): Promise<{
    page: number;
    pageSize: number;
    total: number;
    registrations: {
        id: number;
        examId: number;
        studentId: number;
        studentName: any;
        usn: any;
        semester: any;
        courseCode: any;
        courseName: any;
        eligibilityStatus: any;
        status: any;
        attemptType: any;
        exceptionReason: any;
        createdAt: any;
    }[];
}>;
