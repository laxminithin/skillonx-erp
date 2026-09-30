export declare function generateCertificateForRequest(collegeId: number, requestId: number, issuedByFacultyId: number | null): Promise<{
    id: number;
    documentType: unknown;
    duplicateOfId: number | null;
    certificateNumber: unknown;
    documentUuid: unknown;
    verificationCode: unknown;
    status: unknown;
    documentData: {};
    issuedAt: unknown;
    requestId: number | null;
}>;
/**
 * Issues a duplicate of a still-VALID original document (distinct from
 * `reissueDocument`, which only applies to a REVOKED original). The
 * original is never touched — a new, separately-numbered document is
 * created and linked via `duplicate_of_id`. Idempotent: a retry against
 * the same request returns the already-issued duplicate instead of
 * minting a second one.
 */
export declare function duplicateDocument(collegeId: number, requestId: number, issuedByFacultyId: number): Promise<{
    id: number;
    documentType: unknown;
    duplicateOfId: number | null;
    certificateNumber: unknown;
    documentUuid: unknown;
    verificationCode: unknown;
    status: unknown;
    documentData: {};
    issuedAt: unknown;
    requestId: number | null;
}>;
export declare function listStudentCertificates(studentId: number, collegeId: number): Promise<{
    id: number;
    documentType: unknown;
    duplicateOfId: number | null;
    certificateNumber: unknown;
    documentUuid: unknown;
    verificationCode: unknown;
    status: unknown;
    documentData: {};
    issuedAt: unknown;
    requestId: number | null;
}[]>;
export declare function getStudentCertificate(studentId: number, collegeId: number, documentId: number): Promise<{
    id: number;
    documentType: unknown;
    duplicateOfId: number | null;
    certificateNumber: unknown;
    documentUuid: unknown;
    verificationCode: unknown;
    status: unknown;
    documentData: {};
    issuedAt: unknown;
    requestId: number | null;
}>;
export declare function revokeDocument(collegeId: number, documentId: number, facultyId: number, reason: string): Promise<{
    id: number;
    documentType: unknown;
    duplicateOfId: number | null;
    certificateNumber: unknown;
    documentUuid: unknown;
    verificationCode: unknown;
    status: unknown;
    documentData: {};
    issuedAt: unknown;
    requestId: number | null;
}>;
/** Reissue creates a new immutable document and retains the revoked original. */
export declare function reissueDocument(collegeId: number, documentId: number, facultyId: number, reason: string): Promise<{
    id: number;
    documentType: unknown;
    duplicateOfId: number | null;
    certificateNumber: unknown;
    documentUuid: unknown;
    verificationCode: unknown;
    status: unknown;
    documentData: {};
    issuedAt: unknown;
    requestId: number | null;
}>;
export declare function verifyDocument(verificationCode: string): Promise<{
    valid: boolean;
    status: any;
    documentType: any;
    certificateNumber: any;
    title: any;
    studentName: string;
    usn: string;
    institution: any;
    issuedAt: any;
}>;
export declare function getCertificateTemplate(collegeId: number, certificateType: string): Promise<any>;
