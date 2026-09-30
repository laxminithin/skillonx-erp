import { z } from 'zod';
import type { AdmissionActor } from './types.js';
export declare const cycleSchema: z.ZodObject<{
    name: z.ZodString;
    academicYearId: z.ZodNumber;
    applicationStart: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    applicationEnd: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    admissionStart: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    admissionEnd: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodEnum<["DRAFT", "OPEN", "CLOSED", "ARCHIVED"]>>;
}, "strip", z.ZodTypeAny, {
    status: "DRAFT" | "CLOSED" | "ARCHIVED" | "OPEN";
    name: string;
    academicYearId: number;
    applicationStart?: string | null | undefined;
    applicationEnd?: string | null | undefined;
    admissionStart?: string | null | undefined;
    admissionEnd?: string | null | undefined;
}, {
    name: string;
    academicYearId: number;
    status?: "DRAFT" | "CLOSED" | "ARCHIVED" | "OPEN" | undefined;
    applicationStart?: string | null | undefined;
    applicationEnd?: string | null | undefined;
    admissionStart?: string | null | undefined;
    admissionEnd?: string | null | undefined;
}>;
export declare const intakeSchema: z.ZodObject<{
    cycleId: z.ZodNumber;
    academicYearId: z.ZodNumber;
    programId: z.ZodNumber;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    schemeId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    semesterId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    classSectionId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    category: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    approvedIntake: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    academicYearId: number;
    programId: number;
    cycleId: number;
    approvedIntake: number;
    departmentId?: number | null | undefined;
    category?: string | null | undefined;
    semesterId?: number | null | undefined;
    classSectionId?: number | null | undefined;
    schemeId?: number | null | undefined;
}, {
    academicYearId: number;
    programId: number;
    cycleId: number;
    approvedIntake: number;
    departmentId?: number | null | undefined;
    category?: string | null | undefined;
    semesterId?: number | null | undefined;
    classSectionId?: number | null | undefined;
    schemeId?: number | null | undefined;
}>;
export declare const enquirySchema: z.ZodObject<{
    cycleId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    name: z.ZodString;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    interestedProgramId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    source: z.ZodDefault<z.ZodEnum<["WEBSITE", "WALK_IN", "PHONE", "REFERRAL", "EVENT", "SOCIAL", "OTHER"]>>;
    assignedTo: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    nextFollowUp: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    source: "EVENT" | "OTHER" | "WEBSITE" | "PHONE" | "WALK_IN" | "REFERRAL" | "SOCIAL";
    notes?: string | null | undefined;
    phone?: string | null | undefined;
    email?: string | null | undefined;
    cycleId?: number | null | undefined;
    assignedTo?: number | null | undefined;
    interestedProgramId?: number | null | undefined;
    nextFollowUp?: string | null | undefined;
}, {
    name: string;
    notes?: string | null | undefined;
    phone?: string | null | undefined;
    email?: string | null | undefined;
    source?: "EVENT" | "OTHER" | "WEBSITE" | "PHONE" | "WALK_IN" | "REFERRAL" | "SOCIAL" | undefined;
    cycleId?: number | null | undefined;
    assignedTo?: number | null | undefined;
    interestedProgramId?: number | null | undefined;
    nextFollowUp?: string | null | undefined;
}>;
export declare const guardianSchema: z.ZodObject<{
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    relationship: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    name?: string | null | undefined;
    relationship?: string | null | undefined;
    phone?: string | null | undefined;
    email?: string | null | undefined;
}, {
    name?: string | null | undefined;
    relationship?: string | null | undefined;
    phone?: string | null | undefined;
    email?: string | null | undefined;
}>;
export declare const applicantSchema: z.ZodObject<{
    cycleId: z.ZodNumber;
    enquiryId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    name: z.ZodString;
    email: z.ZodEffects<z.ZodString, string, string>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    profile: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    address: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    guardian: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        relationship: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strict", z.ZodTypeAny, {
        name?: string | null | undefined;
        relationship?: string | null | undefined;
        phone?: string | null | undefined;
        email?: string | null | undefined;
    }, {
        name?: string | null | undefined;
        relationship?: string | null | undefined;
        phone?: string | null | undefined;
        email?: string | null | undefined;
    }>>>;
    password: z.ZodOptional<z.ZodString>;
    admissionCategory: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    education: z.ZodDefault<z.ZodArray<z.ZodObject<{
        qualification: z.ZodString;
        institution: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        boardUniversity: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        yearOfPassing: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        registrationNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        marksPercentage: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        cgpa: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        subjects: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            marks: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            marks?: number | null | undefined;
        }, {
            name: string;
            marks?: number | null | undefined;
        }>, "many">>>;
    }, "strip", z.ZodTypeAny, {
        qualification: string;
        institution?: string | null | undefined;
        boardUniversity?: string | null | undefined;
        cgpa?: number | null | undefined;
        subjects?: {
            name: string;
            marks?: number | null | undefined;
        }[] | null | undefined;
        yearOfPassing?: number | null | undefined;
        registrationNumber?: string | null | undefined;
        marksPercentage?: number | null | undefined;
    }, {
        qualification: string;
        institution?: string | null | undefined;
        boardUniversity?: string | null | undefined;
        cgpa?: number | null | undefined;
        subjects?: {
            name: string;
            marks?: number | null | undefined;
        }[] | null | undefined;
        yearOfPassing?: number | null | undefined;
        registrationNumber?: string | null | undefined;
        marksPercentage?: number | null | undefined;
    }>, "many">>;
    preferences: z.ZodArray<z.ZodObject<{
        programId: z.ZodNumber;
        preferenceOrder: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        programId: number;
        preferenceOrder: number;
    }, {
        programId: number;
        preferenceOrder?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    cycleId: number;
    education: {
        qualification: string;
        institution?: string | null | undefined;
        boardUniversity?: string | null | undefined;
        cgpa?: number | null | undefined;
        subjects?: {
            name: string;
            marks?: number | null | undefined;
        }[] | null | undefined;
        yearOfPassing?: number | null | undefined;
        registrationNumber?: string | null | undefined;
        marksPercentage?: number | null | undefined;
    }[];
    preferences: {
        programId: number;
        preferenceOrder: number;
    }[];
    phone?: string | null | undefined;
    address?: Record<string, unknown> | null | undefined;
    password?: string | undefined;
    enquiryId?: number | null | undefined;
    profile?: Record<string, unknown> | null | undefined;
    guardian?: {
        name?: string | null | undefined;
        relationship?: string | null | undefined;
        phone?: string | null | undefined;
        email?: string | null | undefined;
    } | null | undefined;
    admissionCategory?: string | null | undefined;
}, {
    name: string;
    email: string;
    cycleId: number;
    preferences: {
        programId: number;
        preferenceOrder?: number | undefined;
    }[];
    phone?: string | null | undefined;
    address?: Record<string, unknown> | null | undefined;
    password?: string | undefined;
    education?: {
        qualification: string;
        institution?: string | null | undefined;
        boardUniversity?: string | null | undefined;
        cgpa?: number | null | undefined;
        subjects?: {
            name: string;
            marks?: number | null | undefined;
        }[] | null | undefined;
        yearOfPassing?: number | null | undefined;
        registrationNumber?: string | null | undefined;
        marksPercentage?: number | null | undefined;
    }[] | undefined;
    enquiryId?: number | null | undefined;
    profile?: Record<string, unknown> | null | undefined;
    guardian?: {
        name?: string | null | undefined;
        relationship?: string | null | undefined;
        phone?: string | null | undefined;
        email?: string | null | undefined;
    } | null | undefined;
    admissionCategory?: string | null | undefined;
}>;
export declare const applicantLoginSchema: z.ZodObject<{
    applicationNumber: z.ZodString;
    email: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    applicationNumber: string;
}, {
    email: string;
    password: string;
    applicationNumber: string;
}>;
export declare const documentRequirementSchema: z.ZodObject<{
    cycleId: z.ZodNumber;
    programId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    category: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    documentCode: z.ZodString;
    name: z.ZodString;
    isRequired: z.ZodDefault<z.ZodBoolean>;
    allowedMimeTypes: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    maxSizeBytes: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    isRequired: boolean;
    cycleId: number;
    documentCode: string;
    category?: string | null | undefined;
    programId?: number | null | undefined;
    allowedMimeTypes?: string[] | null | undefined;
    maxSizeBytes?: number | null | undefined;
}, {
    name: string;
    cycleId: number;
    documentCode: string;
    category?: string | null | undefined;
    isRequired?: boolean | undefined;
    programId?: number | null | undefined;
    allowedMimeTypes?: string[] | null | undefined;
    maxSizeBytes?: number | null | undefined;
}>;
export declare const documentUploadSchema: z.ZodObject<{
    requirementId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    fileName: z.ZodString;
    mimeType: z.ZodString;
    fileSizeBytes: z.ZodNumber;
    storageKey: z.ZodString;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    mimeType: string;
    storageKey: string;
    fileSizeBytes: number;
    requirementId?: number | null | undefined;
}, {
    fileName: string;
    mimeType: string;
    storageKey: string;
    fileSizeBytes: number;
    requirementId?: number | null | undefined;
}>;
export declare const eligibilityRuleSchema: z.ZodObject<{
    cycleId: z.ZodNumber;
    programId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    ruleType: z.ZodDefault<z.ZodEnum<["MIN_PERCENTAGE", "SUBJECTS", "DOCUMENTS"]>>;
    minPercentage: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    requiredSubjects: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    verifiedDocumentsRequired: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    ruleType: "MIN_PERCENTAGE" | "SUBJECTS" | "DOCUMENTS";
    cycleId: number;
    verifiedDocumentsRequired: boolean;
    programId?: number | null | undefined;
    minPercentage?: number | null | undefined;
    requiredSubjects?: string[] | null | undefined;
}, {
    cycleId: number;
    ruleType?: "MIN_PERCENTAGE" | "SUBJECTS" | "DOCUMENTS" | undefined;
    programId?: number | null | undefined;
    minPercentage?: number | null | undefined;
    requiredSubjects?: string[] | null | undefined;
    verifiedDocumentsRequired?: boolean | undefined;
}>;
export declare const selectionSchema: z.ZodObject<{
    programId: z.ZodNumber;
    intakeId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodEnum<["SELECTED", "WAITLISTED", "NOT_SELECTED"]>;
    waitlistRank: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    meritScore: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    meritExplanation: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "WAITLISTED" | "SELECTED" | "NOT_SELECTED";
    programId: number;
    remarks?: string | null | undefined;
    intakeId?: number | null | undefined;
    waitlistRank?: number | null | undefined;
    meritScore?: number | null | undefined;
    meritExplanation?: Record<string, unknown> | null | undefined;
}, {
    status: "WAITLISTED" | "SELECTED" | "NOT_SELECTED";
    programId: number;
    remarks?: string | null | undefined;
    intakeId?: number | null | undefined;
    waitlistRank?: number | null | undefined;
    meritScore?: number | null | undefined;
    meritExplanation?: Record<string, unknown> | null | undefined;
}>;
export declare const offerSchema: z.ZodObject<{
    programId: z.ZodNumber;
    offerDate: z.ZodDefault<z.ZodString>;
    expiresAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    conditions: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    programId: number;
    offerDate: string;
    expiresAt?: string | null | undefined;
    conditions?: string | null | undefined;
}, {
    programId: number;
    offerDate?: string | undefined;
    expiresAt?: string | null | undefined;
    conditions?: string | null | undefined;
}>;
export declare const confirmSchema: z.ZodObject<{
    intakeId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    intakeId: number;
}, {
    intakeId: number;
}>;
export declare const admissionDemandSchema: z.ZodObject<{
    feeHeadId: z.ZodNumber;
    amount: z.ZodNumber;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    feeHeadId: number;
    amount: number;
    dueDate?: string | null | undefined;
}, {
    feeHeadId: number;
    amount: number;
    dueDate?: string | null | undefined;
}>;
export declare const overrideEligibilitySchema: z.ZodObject<{
    status: z.ZodEnum<["ELIGIBLE", "INELIGIBLE", "NEEDS_REVIEW"]>;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "ELIGIBLE" | "NEEDS_REVIEW" | "INELIGIBLE";
    reason: string;
}, {
    status: "ELIGIBLE" | "NEEDS_REVIEW" | "INELIGIBLE";
    reason: string;
}>;
export declare function createCycle(actor: AdmissionActor, input: z.infer<typeof cycleSchema>): Promise<any>;
export declare function createIntake(actor: AdmissionActor, input: z.infer<typeof intakeSchema>): Promise<any>;
export declare function createEnquiry(actor: AdmissionActor, input: z.infer<typeof enquirySchema>): Promise<any>;
export declare function createApplicant(actor: AdmissionActor, input: z.infer<typeof applicantSchema>): Promise<any>;
export declare function applicantLogin(input: z.infer<typeof applicantLoginSchema>): Promise<{
    token: string;
    user: {
        id: number;
        kind: "applicant";
        name: string;
        email: string;
        role: string;
        collegeId: number;
        departmentId: null;
    };
}>;
export declare function applicantMe(actor: AdmissionActor): Promise<{
    id: number;
    kind: "applicant";
    name: string;
    email: string;
    role: string;
    collegeId: number;
    departmentId: null;
}>;
export declare function submitApplication(actor: AdmissionActor, applicantId: number): Promise<any>;
export declare function createDocumentRequirement(actor: AdmissionActor, input: z.infer<typeof documentRequirementSchema>): Promise<any>;
export declare function uploadDocument(actor: AdmissionActor, applicantId: number, input: z.infer<typeof documentUploadSchema>): Promise<any>;
export declare function verifyDocument(actor: AdmissionActor, documentId: number, status: 'VERIFIED' | 'REJECTED' | 'RESUBMISSION_REQUIRED', remarks?: string | null): Promise<any>;
export declare function createEligibilityRule(actor: AdmissionActor, input: z.infer<typeof eligibilityRuleSchema>): Promise<any>;
export declare function evaluateEligibility(actor: AdmissionActor, applicantId: number): Promise<any>;
export declare function overrideEligibility(actor: AdmissionActor, applicantId: number, input: z.infer<typeof overrideEligibilitySchema>): Promise<any>;
export declare function selectApplicant(actor: AdmissionActor, applicantId: number, input: z.infer<typeof selectionSchema>): Promise<any>;
export declare function issueOffer(actor: AdmissionActor, applicantId: number, input: z.infer<typeof offerSchema>): Promise<any>;
export declare function confirmAdmission(actor: AdmissionActor, applicantId: number, input: z.infer<typeof confirmSchema>): Promise<{
    conversion: Record<string, unknown>;
    activationToken: null;
}>;
export declare function updateApplicantGuardian(actor: AdmissionActor, applicantId: number, input: z.infer<typeof guardianSchema>): Promise<any>;
export declare function createAdmissionFeeDemand(actor: AdmissionActor, applicantId: number, input: z.infer<typeof admissionDemandSchema>): Promise<{
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
}>;
export declare function cancelApplication(actor: AdmissionActor, applicantId: number, reason: string): Promise<any>;
export declare function dashboard(actor: AdmissionActor): Promise<{
    actionRequired: {
        submitted: number;
        documentsPending: number;
        resubmissions: number;
        eligibilityReview: number;
        selectionPending: number;
        paymentPending: number;
        confirmationReady: number;
        conversionFailures: number;
        seatWarnings: number;
    };
    pipeline: {
        status: string;
        count: number;
    }[];
    intake: {
        id: number;
        program: any;
        approvedIntake: number;
        selected: number;
        admitted: number;
        remaining: number;
    }[];
}>;
export declare function listApplications(actor: AdmissionActor, filters: {
    status?: string;
    cycleId?: number;
    programId?: number;
    q?: string;
}): Promise<any[]>;
export declare function getApplicationWorkspace(actor: AdmissionActor, applicantId: number): Promise<{
    applicant: any;
    education: any[];
    preferences: any[];
    documents: any[];
    eligibility: any;
    selection: any;
    offer: any;
    conversion: any;
    audit: any[] | never[];
    finance: {
        status: string;
        demand: null;
        demandAmount: string;
        amountPaid: string;
        outstandingAmount: string;
        paymentState: string;
        receiptReference: null;
    } | {
        status: any;
        demand: {
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
        };
        demandAmount: string;
        amountPaid: string;
        outstandingAmount: string;
        paymentState: any;
        receiptReference: any;
    };
}>;
export declare function validateActivationPassword(password: string): void;
