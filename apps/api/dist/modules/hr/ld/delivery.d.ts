import type { HrActor } from '../types.js';
import type { z } from 'zod';
import type { attendanceSchema, completionSchema, certificateIssueSchema, externalCertSchema, certVerifySchema, feedbackSchema, managerReviewSchema } from './types.js';
export declare function recordAttendance(actor: HrActor, programId: number, input: z.infer<typeof attendanceSchema>): Promise<{
    programId: number;
    recorded: number;
}>;
export declare function finalizeAttendance(actor: HrActor, programId: number, sessionId?: number | null): Promise<{
    programId: number;
    finalized: number;
}>;
export declare function recordCompletion(actor: HrActor, programId: number, input: z.infer<typeof completionSchema>): Promise<{
    id: number;
    result: any;
    idempotent: boolean;
    attendancePct?: undefined;
} | {
    id: number;
    result: string;
    attendancePct: number;
    idempotent?: undefined;
}>;
export declare function issueCertificate(actor: HrActor, programId: number, input: z.infer<typeof certificateIssueSchema>): Promise<{
    id: number;
    certificateNumber: any;
    idempotent: boolean;
    issuedOn?: undefined;
    expiresOn?: undefined;
} | {
    id: number;
    certificateNumber: string;
    issuedOn: string;
    expiresOn: string | null;
    idempotent?: undefined;
}>;
export declare function submitExternalCertificate(actor: HrActor, input: z.infer<typeof externalCertSchema>): Promise<{
    id: number;
    status: string;
}>;
export declare function verifyCertificate(actor: HrActor, certId: number, input: z.infer<typeof certVerifySchema>): Promise<{
    id: number;
    status: any;
    idempotent: boolean;
} | {
    id: number;
    status: "VERIFIED" | "REJECTED";
    idempotent?: undefined;
}>;
export declare function listMyCertificates(actor: HrActor): Promise<any[]>;
export declare function getCertificate(actor: HrActor, certId: number): Promise<any>;
export declare function submitFeedback(actor: HrActor, input: z.infer<typeof feedbackSchema>): Promise<{
    id: number;
    idempotent: boolean;
} | {
    id: number;
    idempotent?: undefined;
}>;
export declare function managerReview(actor: HrActor, input: z.infer<typeof managerReviewSchema>): Promise<{
    id: number;
    updated: boolean;
} | {
    id: number;
    updated?: undefined;
}>;
