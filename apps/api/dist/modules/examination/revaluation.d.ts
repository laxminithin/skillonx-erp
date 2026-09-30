import { z } from 'zod';
import type { ExamActor } from './access.js';
export declare const revaluationSchema: z.ZodObject<{
    subjectResultId: z.ZodNumber;
    requestType: z.ZodEnum<["RETOTALING", "REVALUATION", "PHOTOCOPY"]>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    subjectResultId: number;
    requestType: "RETOTALING" | "REVALUATION" | "PHOTOCOPY";
    reason?: string | undefined;
}, {
    subjectResultId: number;
    requestType: "RETOTALING" | "REVALUATION" | "PHOTOCOPY";
    reason?: string | undefined;
}>;
export declare function requestRevaluation(studentId: number, collegeId: number, body: z.infer<typeof revaluationSchema>): Promise<{
    id: number;
    status: string;
}>;
export declare function reviewRevaluation(actor: ExamActor, id: number, accept: boolean, note?: string): Promise<{
    id: number;
    status: string;
}>;
export declare function assignRevaluationExaminer(actor: ExamActor, id: number, examinerId: number): Promise<{
    id: number;
    status: string;
    examinerId: number;
}>;
export declare function submitRevaluation(actor: ExamActor, id: number, revisedMarks: number, revisedMax: number): Promise<{
    id: number;
    status: string;
    revisedMarks: number;
}>;
export declare function decideRevaluation(actor: ExamActor, id: number, decision: 'REVISED' | 'UNCHANGED', reason: string): Promise<{
    id: number;
    status: string;
    decision: "UNCHANGED" | "REVISED";
    newSemesterResultId: number | null;
}>;
export declare function examinerRevaluations(actor: ExamActor): Promise<{
    id: number;
    courseCode: any;
    courseName: any;
    requestType: any;
    status: any;
    revisedMarks: number | null;
}[]>;
export declare function studentRevaluationOutcomes(studentId: number, collegeId: number): Promise<{
    id: number;
    courseCode: any;
    courseName: any;
    requestType: any;
    status: any;
    decision: any;
    decisionReason: any;
    revisedMarks: number | null;
    completedAt: any;
}[]>;
export declare function listRevaluationRequests(collegeId: number, status?: string): Promise<{
    id: number;
    studentId: number;
    studentName: any;
    usn: any;
    subjectResultId: number;
    courseCode: any;
    courseName: any;
    requestType: any;
    status: any;
    reason: any;
    examinerId: number | null;
    revisedMarks: number | null;
    decision: any;
    newSemesterResultId: number | null;
    createdAt: any;
}[]>;
