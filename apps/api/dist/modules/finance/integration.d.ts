/** Create a fee demand for a student service request when fee is required. */
export declare function createServiceRequestFeeDemand(collegeId: number, studentId: number, requestTypeCode: string, requestId: number): Promise<{
    id: number;
    studentId: number | null;
    subjectType: {};
    subjectId: number | null;
    academicYearId: number;
    semesterId: number | null;
    demandNumber: unknown;
    demandType: unknown;
    issueDate: unknown;
    dueDate: unknown;
    grossAmount: string;
    discountAmount: string;
    scholarshipAmount: string;
    adjustmentAmount: string;
    lateFeeAmount: string;
    netAmount: string;
    paidAmount: string;
    outstandingAmount: string;
    status: unknown;
    receiptReference: {} | null;
    items: unknown[];
} | null>;
/** Check if student can proceed with a service request based on finance clearance. */
export declare function checkServiceFinancialClearance(studentId: number, collegeId: number): Promise<import("./types.js").FinancialClearanceResult>;
/** Create revaluation fee demand linked to exam_revaluation_requests. */
export declare function createRevaluationFeeDemand(collegeId: number, studentId: number, revaluationRequestId: number, amount?: number): Promise<{
    id: number;
    studentId: number | null;
    subjectType: {};
    subjectId: number | null;
    academicYearId: number;
    semesterId: number | null;
    demandNumber: unknown;
    demandType: unknown;
    issueDate: unknown;
    dueDate: unknown;
    grossAmount: string;
    discountAmount: string;
    scholarshipAmount: string;
    adjustmentAmount: string;
    lateFeeAmount: string;
    netAmount: string;
    paidAmount: string;
    outstandingAmount: string;
    status: unknown;
    receiptReference: {} | null;
    items: unknown[];
} | null>;
/** Returns true if a service request's linked fee demand is fully paid. */
export declare function isServiceRequestFeePaid(requestId: number, collegeId: number): Promise<boolean>;
