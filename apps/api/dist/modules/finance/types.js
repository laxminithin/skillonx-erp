import { z } from 'zod';
export const feeHeadSchema = z.object({
    code: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(255),
    category: z.string().trim().max(32).default('GENERAL'),
    description: z.string().trim().max(2000).optional(),
    isRefundable: z.boolean().optional(),
    isOptional: z.boolean().optional(),
});
export const feeStructureItemSchema = z.object({
    feeHeadId: z.number().int().positive(),
    amount: z.number().positive(),
    dueDate: z.string().optional(),
    installmentGroup: z.string().max(32).optional(),
    isMandatory: z.boolean().optional(),
    lateFeePolicyId: z.number().int().positive().optional(),
    sortOrder: z.number().int().optional(),
});
export const feeStructureInstallmentSchema = z.object({
    installmentNumber: z.number().int().positive(),
    label: z.string().trim().min(1).max(128),
    amount: z.number().positive(),
    dueDate: z.string(),
});
export const createFeeStructureSchema = z.object({
    academicYearId: z.number().int().positive(),
    programId: z.number().int().positive().optional(),
    departmentId: z.number().int().positive().optional(),
    schemeId: z.number().int().positive().optional(),
    semesterId: z.number().int().positive().optional(),
    studentCategory: z.string().max(64).optional(),
    admissionBatch: z.string().max(64).optional(),
    name: z.string().trim().min(1).max(255),
    code: z.string().trim().min(1).max(64),
    description: z.string().max(2000).optional(),
    items: z.array(feeStructureItemSchema).min(1),
    installments: z.array(feeStructureInstallmentSchema).optional(),
});
export const bulkAssignSchema = z.object({
    feeStructureId: z.number().int().positive(),
    academicClassId: z.number().int().positive().optional(),
    programId: z.number().int().positive().optional(),
    semesterId: z.number().int().positive().optional(),
    academicYearId: z.number().int().positive(),
});
export const bulkDemandSchema = z.object({
    feeStructureId: z.number().int().positive(),
    academicYearId: z.number().int().positive(),
    semesterId: z.number().int().positive(),
    academicClassId: z.number().int().positive().optional(),
    dueDate: z.string().optional(),
    issueDate: z.string().optional(),
});
export const manualPaymentSchema = z.object({
    studentId: z.number().int().positive().optional(),
    applicantId: z.number().int().positive().optional(),
    amount: z.number().positive(),
    paymentDate: z.string(),
    paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'NET_BANKING', 'BANK_TRANSFER', 'CHEQUE', 'DD', 'ONLINE_GATEWAY', 'OTHER']),
    transactionReference: z.string().max(128).optional(),
    bankReference: z.string().max(128).optional(),
    chequeStatus: z.enum(['RECEIVED', 'DEPOSITED', 'CLEARED', 'BOUNCED']).optional(),
    remarks: z.string().max(500).optional(),
    demandIds: z.array(z.number().int().positive()).optional(),
    demandItemIds: z.array(z.number().int().positive()).optional(),
}).refine((value) => Boolean(value.studentId) !== Boolean(value.applicantId), {
    message: 'Provide exactly one of studentId or applicantId',
    path: ['studentId'],
});
export const initiatePaymentSchema = z.object({
    demandIds: z.array(z.number().int().positive()).min(1),
    installmentIds: z.array(z.number().int().positive()).optional(),
    amount: z.number().positive().optional(),
});
export const concessionSchema = z.object({
    studentId: z.number().int().positive(),
    demandId: z.number().int().positive().optional(),
    feeHeadId: z.number().int().positive().optional(),
    concessionType: z.string().trim().min(1).max(64),
    amount: z.number().positive().optional(),
    percentage: z.number().min(0).max(100).optional(),
    reason: z.string().trim().min(1).max(1000),
});
export const scholarshipSchema = z.object({
    studentId: z.number().int().positive(),
    schemeId: z.number().int().positive(),
    academicYearId: z.number().int().positive(),
    expectedAmount: z.number().positive().optional(),
    sanctionedAmount: z.number().positive().optional(),
    remarks: z.string().max(500).optional(),
});
export const refundSchema = z.object({
    studentId: z.number().int().positive(),
    paymentId: z.number().int().positive().optional(),
    amount: z.number().positive(),
    reasonCode: z.enum(['EXCESS_PAYMENT', 'ADMISSION_CANCELLED', 'FEE_REVERSAL', 'SCHOLARSHIP_ADJUSTMENT', 'OTHER']),
    reason: z.string().max(1000).optional(),
});
export const voidReceiptSchema = z.object({
    reason: z.string().trim().min(1).max(500),
});
export const eligibilityCriteriaSchema = z.object({
    programIds: z.array(z.number().int().positive()).optional(),
    minSemester: z.number().int().positive().optional(),
    minCgpa: z.number().min(0).max(10).optional(),
    maxIncome: z.number().nonnegative().optional(),
    categories: z.array(z.string().trim().min(1).max(64)).optional(),
    minAttendancePercent: z.number().min(0).max(100).optional(),
    requiredDocumentCategories: z.array(z.string().trim().min(1).max(96)).optional(),
}).strict();
export const createEligibilityPolicySchema = z.object({
    schemeId: z.number().int().positive(),
    academicYearId: z.number().int().positive(),
    criteria: eligibilityCriteriaSchema,
});
export const createSchemeSchema = z.object({
    code: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(255),
    description: z.string().trim().max(2000).optional(),
    provider: z.string().trim().max(128).optional(),
    providerType: z.enum(['INSTITUTION', 'GOVERNMENT', 'TRUST', 'CORPORATE', 'ALUMNI', 'OTHER']).optional(),
    benefitType: z.enum(['FEE_CONCESSION', 'FEE_WAIVER', 'REIMBURSEMENT', 'DIRECT_PAYMENT', 'STIPEND', 'OTHER']).optional(),
    isExternal: z.boolean().optional(),
    externalPortalUrl: z.string().trim().max(512).optional(),
    allowMultipleApplications: z.boolean().optional(),
    renewalAllowed: z.boolean().optional(),
    applicationStartDate: z.string().trim().max(16).optional(),
    applicationEndDate: z.string().trim().max(16).optional(),
});
export const draftApplicationSchema = z.object({
    schemeId: z.number().int().positive(),
    academicYearId: z.number().int().positive(),
    requestedAmount: z.number().positive().optional(),
    selfDeclaredIncome: z.number().nonnegative().optional(),
    selfDeclaredCategory: z.string().trim().max(64).optional(),
}).strict();
export const applicationActionSchema = z.object({
    remarks: z.string().trim().max(2000).optional(),
});
export const sanctionApplicationSchema = z.object({
    sanctionedAmount: z.number().positive(),
});
export const completeApplicationSchema = z.object({
    evidenceReference: z.string().trim().min(1).max(255),
});
export const applicationDocumentUploadSchema = z.object({
    category: z.string().trim().min(1).max(96),
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().min(1).max(128),
    contentBase64: z.string().min(1),
    description: z.string().trim().max(2000).optional().nullable(),
    expiryDate: z.string().trim().max(16).optional().nullable(),
}).strict();
