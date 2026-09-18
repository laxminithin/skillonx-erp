import type { EmployeeScope } from './access.js';
import { type FacultyProfileActor } from './types.js';
/** Owner submits a record for verification. */
export declare function submitRecord(actor: FacultyProfileActor, employee: EmployeeScope, recordId: number): Promise<{
    evidence: {
        id: number;
        fileName: unknown;
        mimeType: unknown;
        fileSize: number;
        checksum: {} | null;
        evidenceCategory: {} | null;
        evidenceSubcategory: {} | null;
        description: {} | null;
        reference: {} | null;
        createdAt: unknown;
    }[];
    verificationHistory: {
        id: number;
        action: unknown;
        fromStatus: {} | null;
        toStatus: unknown;
        actedByRole: {} | null;
        remarks: {} | null;
        createdAt: unknown;
    }[];
}>;
/**
 * A verifier (never the owner) verifies / returns / rejects a submitted record.
 * Faculty can NEVER self-verify (enforced in canVerify).
 */
export declare function actOnVerification(actor: FacultyProfileActor, employee: EmployeeScope, recordId: number, action: 'VERIFY' | 'RETURN' | 'REJECT', remarks?: string | null): Promise<{
    evidence: {
        id: number;
        fileName: unknown;
        mimeType: unknown;
        fileSize: number;
        checksum: {} | null;
        evidenceCategory: {} | null;
        evidenceSubcategory: {} | null;
        description: {} | null;
        reference: {} | null;
        createdAt: unknown;
    }[];
    verificationHistory: {
        id: number;
        action: unknown;
        fromStatus: {} | null;
        toStatus: unknown;
        actedByRole: {} | null;
        remarks: {} | null;
        createdAt: unknown;
    }[];
}>;
/**
 * Verification inbox for a verifier: submitted records across the faculty they
 * are authorized to verify (HOD -> own department; institution roles -> college).
 */
export declare function verificationInbox(actor: FacultyProfileActor, filters?: {
    departmentId?: number;
    verificationStatus?: string;
}): Promise<{
    id: number;
    employeeId: number;
    facultyName: any;
    employeeNumber: any;
    department: any;
    domain: any;
    recordType: any;
    title: any;
    academicYearLabel: any;
    status: any;
    verificationStatus: any;
    submittedAt: any;
}[]>;
