import { z } from 'zod';
import type { ExamActor } from './access.js';
export declare const condoneSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare function computeEligibility(actor: ExamActor, examId: number): Promise<{
    processed: number;
}>;
export declare function listEligibility(actor: ExamActor, examId: number, filters?: {
    status?: string;
    examSubjectId?: number;
}): Promise<{
    id: number;
    examId: number;
    examSubjectId: number;
    studentId: number;
    studentName: any;
    usn: any;
    courseId: number;
    status: any;
    reasonCode: any;
    reasonDetail: any;
    attendancePct: number | null;
    internalMarks: number | null;
    internalMax: number | null;
    condonedBy: number | null;
    condonedAt: any;
    condoneReason: any;
}[]>;
export declare function condoneEligibility(actor: ExamActor, eligibilityId: number, body: z.infer<typeof condoneSchema>): Promise<{
    id: number;
    examId: number;
    examSubjectId: number;
    studentId: number;
    studentName: any;
    usn: any;
    courseId: number;
    status: any;
    reasonCode: any;
    reasonDetail: any;
    attendancePct: number | null;
    internalMarks: number | null;
    internalMax: number | null;
    condonedBy: number | null;
    condonedAt: any;
    condoneReason: any;
}>;
export declare function studentEligibility(studentId: number, collegeId: number, examId?: number): Promise<{
    examName: any;
    examType: any;
    examStatus: any;
    examDate: any;
    startTime: any;
    endTime: any;
    courseCode: any;
    courseName: any;
    id: number;
    examId: number;
    examSubjectId: number;
    studentId: number;
    studentName: any;
    usn: any;
    courseId: number;
    status: any;
    reasonCode: any;
    reasonDetail: any;
    attendancePct: number | null;
    internalMarks: number | null;
    internalMax: number | null;
    condonedBy: number | null;
    condonedAt: any;
    condoneReason: any;
}[]>;
