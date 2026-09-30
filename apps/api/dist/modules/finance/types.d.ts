import { z } from 'zod';
export type FinancePermission = 'finance.view' | 'finance.fee_structure.manage' | 'finance.demand.generate' | 'finance.payment.record' | 'finance.payroll.post' | 'finance.receipt.view' | 'finance.concession.approve' | 'finance.scholarship.manage' | 'finance.refund.approve' | 'finance.report.view' | 'finance.scholarship_application.process' | 'finance.scholarship_application.approve';
export type FinanceActor = {
    facultyUserId: number;
    collegeId: number;
    departmentId?: number | null;
    role: string;
    name?: string;
};
export type StudentFinanceActor = {
    studentId: number;
    collegeId: number;
};
export type NoDueDomainStatus = 'CLEAR' | 'DUE' | 'WAIVED' | 'NOT_APPLICABLE' | 'PENDING_INTEGRATION';
export type FinancialClearanceResult = {
    cleared: boolean;
    mode: 'BLOCK' | 'WARN' | 'ALLOW';
    outstandingAmount: string;
    domains: Record<string, NoDueDomainStatus>;
};
export declare const feeHeadSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    category: z.ZodDefault<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    isRefundable: z.ZodOptional<z.ZodBoolean>;
    isOptional: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    category: string;
    description?: string | undefined;
    isRefundable?: boolean | undefined;
    isOptional?: boolean | undefined;
}, {
    code: string;
    name: string;
    description?: string | undefined;
    category?: string | undefined;
    isRefundable?: boolean | undefined;
    isOptional?: boolean | undefined;
}>;
export declare const feeStructureItemSchema: z.ZodObject<{
    feeHeadId: z.ZodNumber;
    amount: z.ZodNumber;
    dueDate: z.ZodOptional<z.ZodString>;
    installmentGroup: z.ZodOptional<z.ZodString>;
    isMandatory: z.ZodOptional<z.ZodBoolean>;
    lateFeePolicyId: z.ZodOptional<z.ZodNumber>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    feeHeadId: number;
    amount: number;
    isMandatory?: boolean | undefined;
    sortOrder?: number | undefined;
    dueDate?: string | undefined;
    installmentGroup?: string | undefined;
    lateFeePolicyId?: number | undefined;
}, {
    feeHeadId: number;
    amount: number;
    isMandatory?: boolean | undefined;
    sortOrder?: number | undefined;
    dueDate?: string | undefined;
    installmentGroup?: string | undefined;
    lateFeePolicyId?: number | undefined;
}>;
export declare const feeStructureInstallmentSchema: z.ZodObject<{
    installmentNumber: z.ZodNumber;
    label: z.ZodString;
    amount: z.ZodNumber;
    dueDate: z.ZodString;
}, "strip", z.ZodTypeAny, {
    label: string;
    dueDate: string;
    amount: number;
    installmentNumber: number;
}, {
    label: string;
    dueDate: string;
    amount: number;
    installmentNumber: number;
}>;
export declare const createFeeStructureSchema: z.ZodObject<{
    academicYearId: z.ZodNumber;
    programId: z.ZodOptional<z.ZodNumber>;
    departmentId: z.ZodOptional<z.ZodNumber>;
    schemeId: z.ZodOptional<z.ZodNumber>;
    semesterId: z.ZodOptional<z.ZodNumber>;
    studentCategory: z.ZodOptional<z.ZodString>;
    admissionBatch: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    code: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        feeHeadId: z.ZodNumber;
        amount: z.ZodNumber;
        dueDate: z.ZodOptional<z.ZodString>;
        installmentGroup: z.ZodOptional<z.ZodString>;
        isMandatory: z.ZodOptional<z.ZodBoolean>;
        lateFeePolicyId: z.ZodOptional<z.ZodNumber>;
        sortOrder: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        feeHeadId: number;
        amount: number;
        isMandatory?: boolean | undefined;
        sortOrder?: number | undefined;
        dueDate?: string | undefined;
        installmentGroup?: string | undefined;
        lateFeePolicyId?: number | undefined;
    }, {
        feeHeadId: number;
        amount: number;
        isMandatory?: boolean | undefined;
        sortOrder?: number | undefined;
        dueDate?: string | undefined;
        installmentGroup?: string | undefined;
        lateFeePolicyId?: number | undefined;
    }>, "many">;
    installments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        installmentNumber: z.ZodNumber;
        label: z.ZodString;
        amount: z.ZodNumber;
        dueDate: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        label: string;
        dueDate: string;
        amount: number;
        installmentNumber: number;
    }, {
        label: string;
        dueDate: string;
        amount: number;
        installmentNumber: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    academicYearId: number;
    items: {
        feeHeadId: number;
        amount: number;
        isMandatory?: boolean | undefined;
        sortOrder?: number | undefined;
        dueDate?: string | undefined;
        installmentGroup?: string | undefined;
        lateFeePolicyId?: number | undefined;
    }[];
    departmentId?: number | undefined;
    description?: string | undefined;
    semesterId?: number | undefined;
    programId?: number | undefined;
    schemeId?: number | undefined;
    studentCategory?: string | undefined;
    admissionBatch?: string | undefined;
    installments?: {
        label: string;
        dueDate: string;
        amount: number;
        installmentNumber: number;
    }[] | undefined;
}, {
    code: string;
    name: string;
    academicYearId: number;
    items: {
        feeHeadId: number;
        amount: number;
        isMandatory?: boolean | undefined;
        sortOrder?: number | undefined;
        dueDate?: string | undefined;
        installmentGroup?: string | undefined;
        lateFeePolicyId?: number | undefined;
    }[];
    departmentId?: number | undefined;
    description?: string | undefined;
    semesterId?: number | undefined;
    programId?: number | undefined;
    schemeId?: number | undefined;
    studentCategory?: string | undefined;
    admissionBatch?: string | undefined;
    installments?: {
        label: string;
        dueDate: string;
        amount: number;
        installmentNumber: number;
    }[] | undefined;
}>;
export declare const bulkAssignSchema: z.ZodObject<{
    feeStructureId: z.ZodNumber;
    academicClassId: z.ZodOptional<z.ZodNumber>;
    programId: z.ZodOptional<z.ZodNumber>;
    semesterId: z.ZodOptional<z.ZodNumber>;
    academicYearId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    academicYearId: number;
    feeStructureId: number;
    semesterId?: number | undefined;
    programId?: number | undefined;
    academicClassId?: number | undefined;
}, {
    academicYearId: number;
    feeStructureId: number;
    semesterId?: number | undefined;
    programId?: number | undefined;
    academicClassId?: number | undefined;
}>;
export declare const bulkDemandSchema: z.ZodObject<{
    feeStructureId: z.ZodNumber;
    academicYearId: z.ZodNumber;
    semesterId: z.ZodNumber;
    academicClassId: z.ZodOptional<z.ZodNumber>;
    dueDate: z.ZodOptional<z.ZodString>;
    issueDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    academicYearId: number;
    semesterId: number;
    feeStructureId: number;
    issueDate?: string | undefined;
    academicClassId?: number | undefined;
    dueDate?: string | undefined;
}, {
    academicYearId: number;
    semesterId: number;
    feeStructureId: number;
    issueDate?: string | undefined;
    academicClassId?: number | undefined;
    dueDate?: string | undefined;
}>;
export declare const manualPaymentSchema: z.ZodEffects<z.ZodObject<{
    studentId: z.ZodOptional<z.ZodNumber>;
    applicantId: z.ZodOptional<z.ZodNumber>;
    amount: z.ZodNumber;
    paymentDate: z.ZodString;
    paymentMethod: z.ZodEnum<["CASH", "CARD", "UPI", "NET_BANKING", "BANK_TRANSFER", "CHEQUE", "DD", "ONLINE_GATEWAY", "OTHER"]>;
    transactionReference: z.ZodOptional<z.ZodString>;
    bankReference: z.ZodOptional<z.ZodString>;
    chequeStatus: z.ZodOptional<z.ZodEnum<["RECEIVED", "DEPOSITED", "CLEARED", "BOUNCED"]>>;
    remarks: z.ZodOptional<z.ZodString>;
    demandIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    demandItemIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    paymentDate: string;
    paymentMethod: "OTHER" | "CASH" | "CARD" | "UPI" | "NET_BANKING" | "BANK_TRANSFER" | "CHEQUE" | "DD" | "ONLINE_GATEWAY";
    remarks?: string | undefined;
    studentId?: number | undefined;
    applicantId?: number | undefined;
    transactionReference?: string | undefined;
    bankReference?: string | undefined;
    chequeStatus?: "RECEIVED" | "DEPOSITED" | "CLEARED" | "BOUNCED" | undefined;
    demandIds?: number[] | undefined;
    demandItemIds?: number[] | undefined;
}, {
    amount: number;
    paymentDate: string;
    paymentMethod: "OTHER" | "CASH" | "CARD" | "UPI" | "NET_BANKING" | "BANK_TRANSFER" | "CHEQUE" | "DD" | "ONLINE_GATEWAY";
    remarks?: string | undefined;
    studentId?: number | undefined;
    applicantId?: number | undefined;
    transactionReference?: string | undefined;
    bankReference?: string | undefined;
    chequeStatus?: "RECEIVED" | "DEPOSITED" | "CLEARED" | "BOUNCED" | undefined;
    demandIds?: number[] | undefined;
    demandItemIds?: number[] | undefined;
}>, {
    amount: number;
    paymentDate: string;
    paymentMethod: "OTHER" | "CASH" | "CARD" | "UPI" | "NET_BANKING" | "BANK_TRANSFER" | "CHEQUE" | "DD" | "ONLINE_GATEWAY";
    remarks?: string | undefined;
    studentId?: number | undefined;
    applicantId?: number | undefined;
    transactionReference?: string | undefined;
    bankReference?: string | undefined;
    chequeStatus?: "RECEIVED" | "DEPOSITED" | "CLEARED" | "BOUNCED" | undefined;
    demandIds?: number[] | undefined;
    demandItemIds?: number[] | undefined;
}, {
    amount: number;
    paymentDate: string;
    paymentMethod: "OTHER" | "CASH" | "CARD" | "UPI" | "NET_BANKING" | "BANK_TRANSFER" | "CHEQUE" | "DD" | "ONLINE_GATEWAY";
    remarks?: string | undefined;
    studentId?: number | undefined;
    applicantId?: number | undefined;
    transactionReference?: string | undefined;
    bankReference?: string | undefined;
    chequeStatus?: "RECEIVED" | "DEPOSITED" | "CLEARED" | "BOUNCED" | undefined;
    demandIds?: number[] | undefined;
    demandItemIds?: number[] | undefined;
}>;
export declare const initiatePaymentSchema: z.ZodObject<{
    demandIds: z.ZodArray<z.ZodNumber, "many">;
    installmentIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    amount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    demandIds: number[];
    amount?: number | undefined;
    installmentIds?: number[] | undefined;
}, {
    demandIds: number[];
    amount?: number | undefined;
    installmentIds?: number[] | undefined;
}>;
export declare const concessionSchema: z.ZodObject<{
    studentId: z.ZodNumber;
    demandId: z.ZodOptional<z.ZodNumber>;
    feeHeadId: z.ZodOptional<z.ZodNumber>;
    concessionType: z.ZodString;
    amount: z.ZodOptional<z.ZodNumber>;
    percentage: z.ZodOptional<z.ZodNumber>;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
    studentId: number;
    concessionType: string;
    percentage?: number | undefined;
    feeHeadId?: number | undefined;
    amount?: number | undefined;
    demandId?: number | undefined;
}, {
    reason: string;
    studentId: number;
    concessionType: string;
    percentage?: number | undefined;
    feeHeadId?: number | undefined;
    amount?: number | undefined;
    demandId?: number | undefined;
}>;
export declare const scholarshipSchema: z.ZodObject<{
    studentId: z.ZodNumber;
    schemeId: z.ZodNumber;
    academicYearId: z.ZodNumber;
    expectedAmount: z.ZodOptional<z.ZodNumber>;
    sanctionedAmount: z.ZodOptional<z.ZodNumber>;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    studentId: number;
    academicYearId: number;
    schemeId: number;
    remarks?: string | undefined;
    expectedAmount?: number | undefined;
    sanctionedAmount?: number | undefined;
}, {
    studentId: number;
    academicYearId: number;
    schemeId: number;
    remarks?: string | undefined;
    expectedAmount?: number | undefined;
    sanctionedAmount?: number | undefined;
}>;
export declare const refundSchema: z.ZodObject<{
    studentId: z.ZodNumber;
    paymentId: z.ZodOptional<z.ZodNumber>;
    amount: z.ZodNumber;
    reasonCode: z.ZodEnum<["EXCESS_PAYMENT", "ADMISSION_CANCELLED", "FEE_REVERSAL", "SCHOLARSHIP_ADJUSTMENT", "OTHER"]>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    studentId: number;
    reasonCode: "OTHER" | "EXCESS_PAYMENT" | "ADMISSION_CANCELLED" | "FEE_REVERSAL" | "SCHOLARSHIP_ADJUSTMENT";
    amount: number;
    reason?: string | undefined;
    paymentId?: number | undefined;
}, {
    studentId: number;
    reasonCode: "OTHER" | "EXCESS_PAYMENT" | "ADMISSION_CANCELLED" | "FEE_REVERSAL" | "SCHOLARSHIP_ADJUSTMENT";
    amount: number;
    reason?: string | undefined;
    paymentId?: number | undefined;
}>;
export declare const voidReceiptSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const eligibilityCriteriaSchema: z.ZodObject<{
    programIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    minSemester: z.ZodOptional<z.ZodNumber>;
    minCgpa: z.ZodOptional<z.ZodNumber>;
    maxIncome: z.ZodOptional<z.ZodNumber>;
    categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    minAttendancePercent: z.ZodOptional<z.ZodNumber>;
    requiredDocumentCategories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    programIds?: number[] | undefined;
    minSemester?: number | undefined;
    minCgpa?: number | undefined;
    maxIncome?: number | undefined;
    categories?: string[] | undefined;
    minAttendancePercent?: number | undefined;
    requiredDocumentCategories?: string[] | undefined;
}, {
    programIds?: number[] | undefined;
    minSemester?: number | undefined;
    minCgpa?: number | undefined;
    maxIncome?: number | undefined;
    categories?: string[] | undefined;
    minAttendancePercent?: number | undefined;
    requiredDocumentCategories?: string[] | undefined;
}>;
export declare const createEligibilityPolicySchema: z.ZodObject<{
    schemeId: z.ZodNumber;
    academicYearId: z.ZodNumber;
    criteria: z.ZodObject<{
        programIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        minSemester: z.ZodOptional<z.ZodNumber>;
        minCgpa: z.ZodOptional<z.ZodNumber>;
        maxIncome: z.ZodOptional<z.ZodNumber>;
        categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        minAttendancePercent: z.ZodOptional<z.ZodNumber>;
        requiredDocumentCategories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strict", z.ZodTypeAny, {
        programIds?: number[] | undefined;
        minSemester?: number | undefined;
        minCgpa?: number | undefined;
        maxIncome?: number | undefined;
        categories?: string[] | undefined;
        minAttendancePercent?: number | undefined;
        requiredDocumentCategories?: string[] | undefined;
    }, {
        programIds?: number[] | undefined;
        minSemester?: number | undefined;
        minCgpa?: number | undefined;
        maxIncome?: number | undefined;
        categories?: string[] | undefined;
        minAttendancePercent?: number | undefined;
        requiredDocumentCategories?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    academicYearId: number;
    criteria: {
        programIds?: number[] | undefined;
        minSemester?: number | undefined;
        minCgpa?: number | undefined;
        maxIncome?: number | undefined;
        categories?: string[] | undefined;
        minAttendancePercent?: number | undefined;
        requiredDocumentCategories?: string[] | undefined;
    };
    schemeId: number;
}, {
    academicYearId: number;
    criteria: {
        programIds?: number[] | undefined;
        minSemester?: number | undefined;
        minCgpa?: number | undefined;
        maxIncome?: number | undefined;
        categories?: string[] | undefined;
        minAttendancePercent?: number | undefined;
        requiredDocumentCategories?: string[] | undefined;
    };
    schemeId: number;
}>;
export declare const createSchemeSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodString>;
    providerType: z.ZodOptional<z.ZodEnum<["INSTITUTION", "GOVERNMENT", "TRUST", "CORPORATE", "ALUMNI", "OTHER"]>>;
    benefitType: z.ZodOptional<z.ZodEnum<["FEE_CONCESSION", "FEE_WAIVER", "REIMBURSEMENT", "DIRECT_PAYMENT", "STIPEND", "OTHER"]>>;
    isExternal: z.ZodOptional<z.ZodBoolean>;
    externalPortalUrl: z.ZodOptional<z.ZodString>;
    allowMultipleApplications: z.ZodOptional<z.ZodBoolean>;
    renewalAllowed: z.ZodOptional<z.ZodBoolean>;
    applicationStartDate: z.ZodOptional<z.ZodString>;
    applicationEndDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    description?: string | undefined;
    provider?: string | undefined;
    providerType?: "ALUMNI" | "OTHER" | "INSTITUTION" | "GOVERNMENT" | "TRUST" | "CORPORATE" | undefined;
    benefitType?: "OTHER" | "FEE_CONCESSION" | "FEE_WAIVER" | "REIMBURSEMENT" | "DIRECT_PAYMENT" | "STIPEND" | undefined;
    isExternal?: boolean | undefined;
    externalPortalUrl?: string | undefined;
    allowMultipleApplications?: boolean | undefined;
    renewalAllowed?: boolean | undefined;
    applicationStartDate?: string | undefined;
    applicationEndDate?: string | undefined;
}, {
    code: string;
    name: string;
    description?: string | undefined;
    provider?: string | undefined;
    providerType?: "ALUMNI" | "OTHER" | "INSTITUTION" | "GOVERNMENT" | "TRUST" | "CORPORATE" | undefined;
    benefitType?: "OTHER" | "FEE_CONCESSION" | "FEE_WAIVER" | "REIMBURSEMENT" | "DIRECT_PAYMENT" | "STIPEND" | undefined;
    isExternal?: boolean | undefined;
    externalPortalUrl?: string | undefined;
    allowMultipleApplications?: boolean | undefined;
    renewalAllowed?: boolean | undefined;
    applicationStartDate?: string | undefined;
    applicationEndDate?: string | undefined;
}>;
export declare const draftApplicationSchema: z.ZodObject<{
    schemeId: z.ZodNumber;
    academicYearId: z.ZodNumber;
    requestedAmount: z.ZodOptional<z.ZodNumber>;
    selfDeclaredIncome: z.ZodOptional<z.ZodNumber>;
    selfDeclaredCategory: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    academicYearId: number;
    schemeId: number;
    requestedAmount?: number | undefined;
    selfDeclaredIncome?: number | undefined;
    selfDeclaredCategory?: string | undefined;
}, {
    academicYearId: number;
    schemeId: number;
    requestedAmount?: number | undefined;
    selfDeclaredIncome?: number | undefined;
    selfDeclaredCategory?: string | undefined;
}>;
export declare const applicationActionSchema: z.ZodObject<{
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    remarks?: string | undefined;
}, {
    remarks?: string | undefined;
}>;
export declare const sanctionApplicationSchema: z.ZodObject<{
    sanctionedAmount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    sanctionedAmount: number;
}, {
    sanctionedAmount: number;
}>;
export declare const completeApplicationSchema: z.ZodObject<{
    evidenceReference: z.ZodString;
}, "strip", z.ZodTypeAny, {
    evidenceReference: string;
}, {
    evidenceReference: string;
}>;
export declare const applicationDocumentUploadSchema: z.ZodObject<{
    category: z.ZodString;
    fileName: z.ZodString;
    mimeType: z.ZodString;
    contentBase64: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    expiryDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    category: string;
    fileName: string;
    mimeType: string;
    contentBase64: string;
    description?: string | null | undefined;
    expiryDate?: string | null | undefined;
}, {
    category: string;
    fileName: string;
    mimeType: string;
    contentBase64: string;
    description?: string | null | undefined;
    expiryDate?: string | null | undefined;
}>;
