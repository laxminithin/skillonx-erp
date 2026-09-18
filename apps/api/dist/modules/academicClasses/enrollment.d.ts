import { z } from 'zod';
import { type EligibilityLabels, type EligibilitySnapshot } from './eligibility.js';
import { type ClassActor } from './service.js';
export declare const remarksSchema: z.ZodObject<{
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    remarks?: string | null | undefined;
}, {
    remarks?: string | null | undefined;
}>;
export declare const bulkApproveSchema: z.ZodObject<{
    enrollmentIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    allEligible: z.ZodOptional<z.ZodBoolean>;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    remarks?: string | null | undefined;
    enrollmentIds?: number[] | undefined;
    allEligible?: boolean | undefined;
}, {
    remarks?: string | null | undefined;
    enrollmentIds?: number[] | undefined;
    allEligible?: boolean | undefined;
}>;
type Row = Record<string, any>;
export declare function loadStudentAcademicContext(studentId: number, classRow: Row): Promise<{
    student: any;
    registration: any;
    active: any;
    snapshot: EligibilitySnapshot;
    studentLabels: EligibilityLabels;
}>;
export declare function eligibilityFor(student: EligibilitySnapshot, classRow: Row, studentLabels: EligibilityLabels): import("./eligibility.js").EligibilityResult;
export declare function requestClassMembership(studentId: number, classId: number): Promise<{
    enrollment: {
        id: number;
        studentId: number;
        classId: number;
        status: any;
        requestedAt: any;
        approvedAt: any;
        approvedBy: any;
        rejectedAt: any;
        rejectedBy: any;
        remarks: any;
        usn: any;
        name: any;
        email: any;
    };
    alreadyMember: boolean;
}>;
export declare function listEnrollments(actor: ClassActor, classId: number, status?: string): Promise<{
    id: number;
    studentId: number;
    classId: number;
    status: any;
    requestedAt: any;
    approvedAt: any;
    approvedBy: any;
    rejectedAt: any;
    rejectedBy: any;
    remarks: any;
    usn: any;
    name: any;
    email: any;
}[]>;
export declare function approveEnrollment(actor: ClassActor, classId: number, enrollmentId: number, remarks?: string | null): Promise<{
    id: number;
    studentId: number;
    classId: number;
    status: any;
    requestedAt: any;
    approvedAt: any;
    approvedBy: any;
    rejectedAt: any;
    rejectedBy: any;
    remarks: any;
    usn: any;
    name: any;
    email: any;
}[]>;
export declare function rejectEnrollment(actor: ClassActor, classId: number, enrollmentId: number, remarks?: string | null): Promise<{
    id: number;
    studentId: number;
    classId: number;
    status: any;
    requestedAt: any;
    approvedAt: any;
    approvedBy: any;
    rejectedAt: any;
    rejectedBy: any;
    remarks: any;
    usn: any;
    name: any;
    email: any;
}[]>;
export declare function bulkApprove(actor: ClassActor, classId: number, input: z.infer<typeof bulkApproveSchema>): Promise<{
    id: number;
    studentId: number;
    classId: number;
    status: any;
    requestedAt: any;
    approvedAt: any;
    approvedBy: any;
    rejectedAt: any;
    rejectedBy: any;
    remarks: any;
    usn: any;
    name: any;
    email: any;
}[]>;
export declare function completeClassEnrollment(actor: ClassActor, classId: number, enrollmentId: number): Promise<{
    id: number;
    studentId: number;
    classId: number;
    status: any;
    requestedAt: any;
    approvedAt: any;
    approvedBy: any;
    rejectedAt: any;
    rejectedBy: any;
    remarks: any;
    usn: any;
    name: any;
    email: any;
}[]>;
export {};
