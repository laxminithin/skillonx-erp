import { z } from 'zod';
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
export declare function listRevaluationRequests(collegeId: number, status?: string): Promise<{
    id: number;
    studentId: number;
    studentName: any;
    usn: any;
    courseCode: any;
    courseName: any;
    requestType: any;
    status: any;
    reason: any;
    createdAt: any;
}[]>;
