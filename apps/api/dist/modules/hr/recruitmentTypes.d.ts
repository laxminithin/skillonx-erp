import { z } from 'zod';
export declare const REQUISITION_STATUSES: readonly ["DRAFT", "SUBMITTED", "DEPARTMENT_APPROVED", "HR_REVIEW", "APPROVED", "OPENED", "CLOSED", "REJECTED", "CANCELLED"];
export type RequisitionStatus = (typeof REQUISITION_STATUSES)[number];
export declare const REQUISITION_TRANSITIONS: Record<RequisitionStatus, RequisitionStatus[]>;
export declare const OPENING_STATUSES: readonly ["DRAFT", "PUBLISHED", "PAUSED", "CLOSED", "FILLED", "CANCELLED"];
export type OpeningStatus = (typeof OPENING_STATUSES)[number];
export declare const OPENING_TRANSITIONS: Record<OpeningStatus, OpeningStatus[]>;
export declare const APPLICATION_STATUSES: readonly ["APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW", "SELECTED", "OFFERED", "ACCEPTED", "PRE_JOINING", "JOINED", "REJECTED", "WITHDRAWN", "OFFER_DECLINED", "NO_SHOW", "CANCELLED"];
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export declare const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]>;
export declare const OFFER_STATUSES: readonly ["DRAFT", "APPROVAL_PENDING", "APPROVED", "ISSUED", "ACCEPTED", "REJECTED", "DECLINED", "EXPIRED", "WITHDRAWN", "SUPERSEDED"];
export type OfferStatus = (typeof OFFER_STATUSES)[number];
export declare const OFFER_TRANSITIONS: Record<OfferStatus, OfferStatus[]>;
export declare const CANDIDATE_SOURCES: readonly ["CAREER_PORTAL", "EMPLOYEE_REFERRAL", "JOB_PORTAL", "CAMPUS", "AGENCY", "WALK_IN", "INTERNAL", "OTHER"];
export declare const DOC_TYPES: readonly ["RESUME", "CERTIFICATE", "EXPERIENCE", "IDENTITY", "PORTFOLIO", "OTHER", "OFFER_LETTER"];
export declare const INTERVIEW_STATUSES: readonly ["SCHEDULED", "COMPLETED", "RESCHEDULED", "CANCELLED", "NO_SHOW"];
export declare const PREJOINING_TASK_STATUSES: readonly ["PENDING", "SUBMITTED", "VERIFIED", "REJECTED", "WAIVED", "NOT_APPLICABLE"];
export declare const BGV_STATUSES: readonly ["NOT_STARTED", "IN_PROGRESS", "CLEAR", "ADVERSE", "WAIVED"];
export declare const POSITION_TYPES: readonly ["NEW", "REPLACEMENT"];
export declare const createRequisitionSchema: z.ZodObject<{
    departmentId: z.ZodNumber;
    designationId: z.ZodNumber;
    employmentTypeId: z.ZodNumber;
    requestedHeadcount: z.ZodDefault<z.ZodNumber>;
    reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    positionType: z.ZodDefault<z.ZodEnum<["NEW", "REPLACEMENT"]>>;
    replacementEmployeeId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    budgetReference: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    desiredJoiningDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    code: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    departmentId: number;
    designationId: number;
    employmentTypeId: number;
    requestedHeadcount: number;
    positionType: "NEW" | "REPLACEMENT";
    code?: string | undefined;
    reason?: string | null | undefined;
    replacementEmployeeId?: number | null | undefined;
    budgetReference?: string | null | undefined;
    desiredJoiningDate?: string | null | undefined;
}, {
    departmentId: number;
    designationId: number;
    employmentTypeId: number;
    code?: string | undefined;
    reason?: string | null | undefined;
    requestedHeadcount?: number | undefined;
    positionType?: "NEW" | "REPLACEMENT" | undefined;
    replacementEmployeeId?: number | null | undefined;
    budgetReference?: string | null | undefined;
    desiredJoiningDate?: string | null | undefined;
}>;
export declare const updateRequisitionSchema: z.ZodObject<{
    departmentId: z.ZodOptional<z.ZodNumber>;
    designationId: z.ZodOptional<z.ZodNumber>;
    employmentTypeId: z.ZodOptional<z.ZodNumber>;
    requestedHeadcount: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    reason: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    positionType: z.ZodOptional<z.ZodDefault<z.ZodEnum<["NEW", "REPLACEMENT"]>>>;
    replacementEmployeeId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    budgetReference: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    desiredJoiningDate: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    code: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    departmentId?: number | undefined;
    designationId?: number | undefined;
    employmentTypeId?: number | undefined;
    reason?: string | null | undefined;
    requestedHeadcount?: number | undefined;
    positionType?: "NEW" | "REPLACEMENT" | undefined;
    replacementEmployeeId?: number | null | undefined;
    budgetReference?: string | null | undefined;
    desiredJoiningDate?: string | null | undefined;
}, {
    code?: string | undefined;
    departmentId?: number | undefined;
    designationId?: number | undefined;
    employmentTypeId?: number | undefined;
    reason?: string | null | undefined;
    requestedHeadcount?: number | undefined;
    positionType?: "NEW" | "REPLACEMENT" | undefined;
    replacementEmployeeId?: number | null | undefined;
    budgetReference?: string | null | undefined;
    desiredJoiningDate?: string | null | undefined;
}>;
export declare const requisitionDecisionSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
    approvedHeadcount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
    approvedHeadcount?: number | undefined;
}, {
    reason?: string | undefined;
    approvedHeadcount?: number | undefined;
}>;
export declare const createOpeningSchema: z.ZodObject<{
    requisitionId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    title: z.ZodString;
    departmentId: z.ZodNumber;
    designationId: z.ZodNumber;
    employmentTypeId: z.ZodNumber;
    headcount: z.ZodDefault<z.ZodNumber>;
    location: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    responsibilities: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    qualification: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    experience: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    skills: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>>;
    applicationStart: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    applicationDeadline: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    jobCategory: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    code: z.ZodOptional<z.ZodString>;
    rounds: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        sequence: z.ZodOptional<z.ZodNumber>;
        roundType: z.ZodDefault<z.ZodString>;
        required: z.ZodOptional<z.ZodBoolean>;
        evaluationTemplate: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        roundType: string;
        required?: boolean | undefined;
        sequence?: number | undefined;
        evaluationTemplate?: unknown;
    }, {
        name: string;
        required?: boolean | undefined;
        roundType?: string | undefined;
        sequence?: number | undefined;
        evaluationTemplate?: unknown;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    departmentId: number;
    designationId: number;
    employmentTypeId: number;
    headcount: number;
    code?: string | undefined;
    description?: string | null | undefined;
    location?: string | null | undefined;
    skills?: string | string[] | null | undefined;
    rounds?: {
        name: string;
        roundType: string;
        required?: boolean | undefined;
        sequence?: number | undefined;
        evaluationTemplate?: unknown;
    }[] | undefined;
    applicationStart?: string | null | undefined;
    qualification?: string | null | undefined;
    requisitionId?: number | null | undefined;
    responsibilities?: string | null | undefined;
    experience?: string | null | undefined;
    applicationDeadline?: string | null | undefined;
    jobCategory?: string | null | undefined;
}, {
    title: string;
    departmentId: number;
    designationId: number;
    employmentTypeId: number;
    code?: string | undefined;
    description?: string | null | undefined;
    location?: string | null | undefined;
    skills?: string | string[] | null | undefined;
    rounds?: {
        name: string;
        required?: boolean | undefined;
        roundType?: string | undefined;
        sequence?: number | undefined;
        evaluationTemplate?: unknown;
    }[] | undefined;
    applicationStart?: string | null | undefined;
    qualification?: string | null | undefined;
    requisitionId?: number | null | undefined;
    headcount?: number | undefined;
    responsibilities?: string | null | undefined;
    experience?: string | null | undefined;
    applicationDeadline?: string | null | undefined;
    jobCategory?: string | null | undefined;
}>;
export declare const updateOpeningSchema: z.ZodObject<Omit<{
    requisitionId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    title: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodOptional<z.ZodNumber>;
    designationId: z.ZodOptional<z.ZodNumber>;
    employmentTypeId: z.ZodOptional<z.ZodNumber>;
    headcount: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    location: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    responsibilities: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    qualification: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    experience: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    skills: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>>>;
    applicationStart: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    applicationDeadline: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    jobCategory: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    code: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    rounds: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        sequence: z.ZodOptional<z.ZodNumber>;
        roundType: z.ZodDefault<z.ZodString>;
        required: z.ZodOptional<z.ZodBoolean>;
        evaluationTemplate: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        roundType: string;
        required?: boolean | undefined;
        sequence?: number | undefined;
        evaluationTemplate?: unknown;
    }, {
        name: string;
        required?: boolean | undefined;
        roundType?: string | undefined;
        sequence?: number | undefined;
        evaluationTemplate?: unknown;
    }>, "many">>>;
}, "rounds">, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    title?: string | undefined;
    departmentId?: number | undefined;
    designationId?: number | undefined;
    employmentTypeId?: number | undefined;
    description?: string | null | undefined;
    location?: string | null | undefined;
    skills?: string | string[] | null | undefined;
    applicationStart?: string | null | undefined;
    qualification?: string | null | undefined;
    requisitionId?: number | null | undefined;
    headcount?: number | undefined;
    responsibilities?: string | null | undefined;
    experience?: string | null | undefined;
    applicationDeadline?: string | null | undefined;
    jobCategory?: string | null | undefined;
}, {
    code?: string | undefined;
    title?: string | undefined;
    departmentId?: number | undefined;
    designationId?: number | undefined;
    employmentTypeId?: number | undefined;
    description?: string | null | undefined;
    location?: string | null | undefined;
    skills?: string | string[] | null | undefined;
    applicationStart?: string | null | undefined;
    qualification?: string | null | undefined;
    requisitionId?: number | null | undefined;
    headcount?: number | undefined;
    responsibilities?: string | null | undefined;
    experience?: string | null | undefined;
    applicationDeadline?: string | null | undefined;
    jobCategory?: string | null | undefined;
}>;
export declare const createCandidateSchema: z.ZodObject<{
    fullName: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    location: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    qualificationSummary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    experienceSummary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    source: z.ZodDefault<z.ZodEnum<["CAREER_PORTAL", "EMPLOYEE_REFERRAL", "JOB_PORTAL", "CAMPUS", "AGENCY", "WALK_IN", "INTERNAL", "OTHER"]>>;
    referrerEmployeeId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    linkedEmployeeId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    consent: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email: string;
    source: "OTHER" | "INTERNAL" | "WALK_IN" | "CAREER_PORTAL" | "EMPLOYEE_REFERRAL" | "JOB_PORTAL" | "CAMPUS" | "AGENCY";
    fullName: string;
    phone?: string | null | undefined;
    location?: string | null | undefined;
    qualificationSummary?: string | null | undefined;
    experienceSummary?: string | null | undefined;
    referrerEmployeeId?: number | null | undefined;
    linkedEmployeeId?: number | null | undefined;
    consent?: boolean | undefined;
}, {
    email: string;
    fullName: string;
    phone?: string | null | undefined;
    source?: "OTHER" | "INTERNAL" | "WALK_IN" | "CAREER_PORTAL" | "EMPLOYEE_REFERRAL" | "JOB_PORTAL" | "CAMPUS" | "AGENCY" | undefined;
    location?: string | null | undefined;
    qualificationSummary?: string | null | undefined;
    experienceSummary?: string | null | undefined;
    referrerEmployeeId?: number | null | undefined;
    linkedEmployeeId?: number | null | undefined;
    consent?: boolean | undefined;
}>;
export declare const applySchema: z.ZodObject<{
    openingId: z.ZodNumber;
    fullName: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    location: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    qualificationSummary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    experienceSummary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    source: z.ZodDefault<z.ZodEnum<["CAREER_PORTAL", "EMPLOYEE_REFERRAL", "JOB_PORTAL", "CAMPUS", "AGENCY", "WALK_IN", "INTERNAL", "OTHER"]>>;
    coverLetter: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    salaryExpectation: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    consent: z.ZodDefault<z.ZodBoolean>;
    resumeText: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    resumeFileName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    source: "OTHER" | "INTERNAL" | "WALK_IN" | "CAREER_PORTAL" | "EMPLOYEE_REFERRAL" | "JOB_PORTAL" | "CAMPUS" | "AGENCY";
    fullName: string;
    consent: boolean;
    openingId: number;
    phone?: string | null | undefined;
    location?: string | null | undefined;
    qualificationSummary?: string | null | undefined;
    experienceSummary?: string | null | undefined;
    coverLetter?: string | null | undefined;
    salaryExpectation?: number | null | undefined;
    resumeText?: string | null | undefined;
    resumeFileName?: string | null | undefined;
}, {
    email: string;
    fullName: string;
    openingId: number;
    phone?: string | null | undefined;
    source?: "OTHER" | "INTERNAL" | "WALK_IN" | "CAREER_PORTAL" | "EMPLOYEE_REFERRAL" | "JOB_PORTAL" | "CAMPUS" | "AGENCY" | undefined;
    location?: string | null | undefined;
    qualificationSummary?: string | null | undefined;
    experienceSummary?: string | null | undefined;
    consent?: boolean | undefined;
    coverLetter?: string | null | undefined;
    salaryExpectation?: number | null | undefined;
    resumeText?: string | null | undefined;
    resumeFileName?: string | null | undefined;
}>;
export declare const screenApplicationSchema: z.ZodObject<{
    decision: z.ZodEnum<["SHORTLIST", "REJECT", "HOLD"]>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    decision: "REJECT" | "SHORTLIST" | "HOLD";
    notes?: string | null | undefined;
}, {
    decision: "REJECT" | "SHORTLIST" | "HOLD";
    notes?: string | null | undefined;
}>;
export declare const shortlistSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    reason?: string | null | undefined;
}, {
    reason?: string | null | undefined;
}>;
export declare const selectCandidateSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    reason?: string | null | undefined;
}, {
    reason?: string | null | undefined;
}>;
export declare const scheduleInterviewSchema: z.ZodObject<{
    roundId: z.ZodNumber;
    scheduledAt: z.ZodString;
    timezone: z.ZodOptional<z.ZodString>;
    mode: z.ZodDefault<z.ZodEnum<["IN_PERSON", "ONLINE", "HYBRID"]>>;
    locationOrLink: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    panelEmployeeIds: z.ZodDefault<z.ZodArray<z.ZodNumber, "many">>;
    externalPanel: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        email?: string | undefined;
    }, {
        name: string;
        email?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    mode: "ONLINE" | "HYBRID" | "IN_PERSON";
    scheduledAt: string;
    roundId: number;
    panelEmployeeIds: number[];
    notes?: string | null | undefined;
    timezone?: string | undefined;
    locationOrLink?: string | null | undefined;
    externalPanel?: {
        name: string;
        email?: string | undefined;
    }[] | undefined;
}, {
    scheduledAt: string;
    roundId: number;
    notes?: string | null | undefined;
    mode?: "ONLINE" | "HYBRID" | "IN_PERSON" | undefined;
    timezone?: string | undefined;
    locationOrLink?: string | null | undefined;
    panelEmployeeIds?: number[] | undefined;
    externalPanel?: {
        name: string;
        email?: string | undefined;
    }[] | undefined;
}>;
export declare const evaluateInterviewSchema: z.ZodObject<{
    scores: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodNumber, z.ZodString]>>>;
    overallScore: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    comments: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    privateNotes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    recommendation: z.ZodEnum<["ADVANCE", "HOLD", "REJECT", "STRONG_HIRE"]>;
}, "strip", z.ZodTypeAny, {
    recommendation: "REJECT" | "ADVANCE" | "HOLD" | "STRONG_HIRE";
    privateNotes?: string | null | undefined;
    scores?: Record<string, string | number> | undefined;
    overallScore?: number | null | undefined;
    comments?: string | null | undefined;
}, {
    recommendation: "REJECT" | "ADVANCE" | "HOLD" | "STRONG_HIRE";
    privateNotes?: string | null | undefined;
    scores?: Record<string, string | number> | undefined;
    overallScore?: number | null | undefined;
    comments?: string | null | undefined;
}>;
export declare const createOfferSchema: z.ZodObject<{
    applicationId: z.ZodNumber;
    designationId: z.ZodOptional<z.ZodNumber>;
    departmentId: z.ZodOptional<z.ZodNumber>;
    employmentTypeId: z.ZodOptional<z.ZodNumber>;
    proposedJoiningDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    offerDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    validUntil: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    compensationSummary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    compensation: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    terms: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    applicationId: number;
    departmentId?: number | undefined;
    designationId?: number | undefined;
    employmentTypeId?: number | undefined;
    offerDate?: string | null | undefined;
    proposedJoiningDate?: string | null | undefined;
    validUntil?: string | null | undefined;
    compensationSummary?: string | null | undefined;
    compensation?: Record<string, unknown> | null | undefined;
    terms?: string | null | undefined;
}, {
    applicationId: number;
    departmentId?: number | undefined;
    designationId?: number | undefined;
    employmentTypeId?: number | undefined;
    offerDate?: string | null | undefined;
    proposedJoiningDate?: string | null | undefined;
    validUntil?: string | null | undefined;
    compensationSummary?: string | null | undefined;
    compensation?: Record<string, unknown> | null | undefined;
    terms?: string | null | undefined;
}>;
export declare const offerDecisionSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
    acceptanceMethod: z.ZodOptional<z.ZodEnum<["PORTAL", "EMAIL", "IN_PERSON", "OTHER"]>>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
    acceptanceMethod?: "OTHER" | "IN_PERSON" | "EMAIL" | "PORTAL" | undefined;
}, {
    reason?: string | undefined;
    acceptanceMethod?: "OTHER" | "IN_PERSON" | "EMAIL" | "PORTAL" | undefined;
}>;
export declare const updatePrejoiningTaskSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["PENDING", "SUBMITTED", "VERIFIED", "REJECTED", "WAIVED", "NOT_APPLICABLE"]>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    bgvStatus: z.ZodOptional<z.ZodNullable<z.ZodEnum<["NOT_STARTED", "IN_PROGRESS", "CLEAR", "ADVERSE", "WAIVED"]>>>;
    documentId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    status?: "VERIFIED" | "SUBMITTED" | "REJECTED" | "PENDING" | "NOT_APPLICABLE" | "WAIVED" | undefined;
    notes?: string | null | undefined;
    bgvStatus?: "IN_PROGRESS" | "NOT_STARTED" | "CLEAR" | "WAIVED" | "ADVERSE" | null | undefined;
    documentId?: number | null | undefined;
}, {
    status?: "VERIFIED" | "SUBMITTED" | "REJECTED" | "PENDING" | "NOT_APPLICABLE" | "WAIVED" | undefined;
    notes?: string | null | undefined;
    bgvStatus?: "IN_PROGRESS" | "NOT_STARTED" | "CLEAR" | "WAIVED" | "ADVERSE" | null | undefined;
    documentId?: number | null | undefined;
}>;
export declare const completeJoiningSchema: z.ZodObject<{
    employeeCategory: z.ZodOptional<z.ZodEnum<["FACULTY", "NON_TEACHING", "MANAGEMENT", "CONTRACTUAL", "OTHER"]>>;
    markJoined: z.ZodOptional<z.ZodBoolean>;
    authMode: z.ZodOptional<z.ZodEnum<["LINK_EXISTING", "CREATE_LOGIN", "NO_LOGIN"]>>;
}, "strip", z.ZodTypeAny, {
    employeeCategory?: "FACULTY" | "MANAGEMENT" | "OTHER" | "NON_TEACHING" | "CONTRACTUAL" | undefined;
    authMode?: "LINK_EXISTING" | "CREATE_LOGIN" | "NO_LOGIN" | undefined;
    markJoined?: boolean | undefined;
}, {
    employeeCategory?: "FACULTY" | "MANAGEMENT" | "OTHER" | "NON_TEACHING" | "CONTRACTUAL" | undefined;
    authMode?: "LINK_EXISTING" | "CREATE_LOGIN" | "NO_LOGIN" | undefined;
    markJoined?: boolean | undefined;
}>;
export declare const uploadDocumentSchema: z.ZodObject<{
    candidateId: z.ZodNumber;
    applicationId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    docType: z.ZodEnum<["RESUME", "CERTIFICATE", "EXPERIENCE", "IDENTITY", "PORTFOLIO", "OTHER", "OFFER_LETTER"]>;
    fileName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    contentType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    bodyText: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    contentBase64: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    fields: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    isSensitive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    candidateId: number;
    docType: "OTHER" | "CERTIFICATE" | "RESUME" | "EXPERIENCE" | "IDENTITY" | "PORTFOLIO" | "OFFER_LETTER";
    applicationId?: number | null | undefined;
    fileName?: string | null | undefined;
    contentType?: string | null | undefined;
    bodyText?: string | null | undefined;
    contentBase64?: string | null | undefined;
    fields?: Record<string, unknown> | null | undefined;
    isSensitive?: boolean | undefined;
}, {
    candidateId: number;
    docType: "OTHER" | "CERTIFICATE" | "RESUME" | "EXPERIENCE" | "IDENTITY" | "PORTFOLIO" | "OFFER_LETTER";
    applicationId?: number | null | undefined;
    fileName?: string | null | undefined;
    contentType?: string | null | undefined;
    bodyText?: string | null | undefined;
    contentBase64?: string | null | undefined;
    fields?: Record<string, unknown> | null | undefined;
    isSensitive?: boolean | undefined;
}>;
export type Row = Record<string, unknown>;
