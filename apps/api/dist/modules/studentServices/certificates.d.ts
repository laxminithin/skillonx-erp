export declare function generateCertificateForRequest(collegeId: number, requestId: number, issuedByFacultyId: number | null): Promise<{
    id: number;
    documentType: unknown;
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
