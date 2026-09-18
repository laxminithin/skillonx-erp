import { z } from 'zod';
/** Session categories — mentoring topics, NOT clinical diagnoses. */
export declare const SESSION_CATEGORIES: readonly ["ACADEMIC_PERFORMANCE", "ATTENDANCE", "BACKLOG", "STUDY_PLANNING", "CAREER_PLACEMENT", "HIGHER_STUDIES", "SKILL_DEVELOPMENT", "GENERAL_GUIDANCE", "FINANCIAL_ADMIN_REFERRAL", "PERSONAL_CONCERN", "PARENT_INTERACTION", "OTHER"];
export declare const SESSION_TYPES: readonly ["IN_PERSON", "PHONE", "ONLINE", "PARENT_INTERACTION", "OTHER", "GENERAL", "ACADEMIC", "CAREER", "PERSONAL"];
/** Note visibility levels. */
export declare const VISIBILITY_LEVELS: readonly ["SHARED", "MENTORING_TEAM", "CONFIDENTIAL"];
export type Visibility = (typeof VISIBILITY_LEVELS)[number];
export declare const ACTION_STATUSES: readonly ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
export declare const ACTION_OWNERS: readonly ["STUDENT", "MENTOR"];
export declare const ACTION_PRIORITIES: readonly ["LOW", "NORMAL", "HIGH"];
export declare const ESCALATION_LEVELS: readonly ["HOD", "PRINCIPAL"];
export declare const ESCALATION_STATUSES: readonly ["OPEN", "ACKNOWLEDGED", "RETURNED", "RESOLVED"];
export declare const ESCALATION_REASON_CODES: readonly ["PERSISTENT_ACADEMIC_RISK", "SEVERE_ATTENDANCE_SHORTAGE", "REPEATED_INTERVENTION_FAILURE", "ADMINISTRATIVE_SUPPORT_REQUIRED", "OTHER"];
export declare const REFERRAL_FUNCTIONS: readonly ["ACADEMIC_SERVICES", "TP", "FINANCE", "GRIEVANCE", "HOD", "PRINCIPAL", "OTHER"];
export declare const REFERRAL_STATUSES: readonly ["OPEN", "ACCEPTED", "CLOSED"];
export declare const PARENT_MODES: readonly ["PHONE", "IN_PERSON", "ONLINE", "LETTER", "OTHER"];
export declare const PARENT_INITIATORS: readonly ["MENTOR", "PARENT", "INSTITUTION"];
/** Overall attention level derived by the risk engine. */
export declare const ATTENTION_LEVELS: readonly ["NORMAL", "WATCH", "ATTENTION", "HIGH"];
export type AttentionLevel = (typeof ATTENTION_LEVELS)[number];
export declare const RISK_DIMENSIONS: readonly ["ATTENDANCE", "ACADEMIC", "ENGAGEMENT", "BACKLOG", "FOLLOW_UP"];
export type RiskDimension = (typeof RISK_DIMENSIONS)[number];
export type MentoringActor = {
    facultyUserId: number;
    collegeId: number;
    departmentId?: number | null;
    role: string;
    name?: string | null;
};
export type StudentActor = {
    studentId: number;
    collegeId: number;
};
export declare const createSessionSchema: z.ZodObject<{
    studentId: z.ZodNumber;
    meetingType: z.ZodOptional<z.ZodEnum<["IN_PERSON", "PHONE", "ONLINE", "PARENT_INTERACTION", "OTHER", "GENERAL", "ACADEMIC", "CAREER", "PERSONAL"]>>;
    sessionCategory: z.ZodOptional<z.ZodEnum<["ACADEMIC_PERFORMANCE", "ATTENDANCE", "BACKLOG", "STUDY_PLANNING", "CAREER_PLACEMENT", "HIGHER_STUDIES", "SKILL_DEVELOPMENT", "GENERAL_GUIDANCE", "FINANCIAL_ADMIN_REFERRAL", "PERSONAL_CONCERN", "PARENT_INTERACTION", "OTHER"]>>;
    scheduledAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    agenda: z.ZodString;
    summary: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    observations: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    studentVisibleNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    privateNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    visibility: z.ZodOptional<z.ZodEnum<["SHARED", "MENTORING_TEAM", "CONFIDENTIAL"]>>;
    followUpDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<["SCHEDULED", "COMPLETED"]>>;
}, "strip", z.ZodTypeAny, {
    studentId: number;
    agenda: string;
    status?: "COMPLETED" | "SCHEDULED" | undefined;
    meetingType?: "OTHER" | "ACADEMIC" | "PERSONAL" | "ONLINE" | "PARENT_INTERACTION" | "IN_PERSON" | "PHONE" | "GENERAL" | "CAREER" | undefined;
    sessionCategory?: "OTHER" | "HIGHER_STUDIES" | "BACKLOG" | "ATTENDANCE" | "ACADEMIC_PERFORMANCE" | "STUDY_PLANNING" | "CAREER_PLACEMENT" | "SKILL_DEVELOPMENT" | "GENERAL_GUIDANCE" | "FINANCIAL_ADMIN_REFERRAL" | "PERSONAL_CONCERN" | "PARENT_INTERACTION" | undefined;
    scheduledAt?: string | null | undefined;
    summary?: string | null | undefined;
    observations?: string | null | undefined;
    studentVisibleNotes?: string | null | undefined;
    privateNotes?: string | null | undefined;
    visibility?: "SHARED" | "MENTORING_TEAM" | "CONFIDENTIAL" | undefined;
    followUpDate?: string | null | undefined;
}, {
    studentId: number;
    agenda: string;
    status?: "COMPLETED" | "SCHEDULED" | undefined;
    meetingType?: "OTHER" | "ACADEMIC" | "PERSONAL" | "ONLINE" | "PARENT_INTERACTION" | "IN_PERSON" | "PHONE" | "GENERAL" | "CAREER" | undefined;
    sessionCategory?: "OTHER" | "HIGHER_STUDIES" | "BACKLOG" | "ATTENDANCE" | "ACADEMIC_PERFORMANCE" | "STUDY_PLANNING" | "CAREER_PLACEMENT" | "SKILL_DEVELOPMENT" | "GENERAL_GUIDANCE" | "FINANCIAL_ADMIN_REFERRAL" | "PERSONAL_CONCERN" | "PARENT_INTERACTION" | undefined;
    scheduledAt?: string | null | undefined;
    summary?: string | null | undefined;
    observations?: string | null | undefined;
    studentVisibleNotes?: string | null | undefined;
    privateNotes?: string | null | undefined;
    visibility?: "SHARED" | "MENTORING_TEAM" | "CONFIDENTIAL" | undefined;
    followUpDate?: string | null | undefined;
}>;
export declare const updateSessionSchema: z.ZodObject<{
    meetingType: z.ZodOptional<z.ZodEnum<["IN_PERSON", "PHONE", "ONLINE", "PARENT_INTERACTION", "OTHER", "GENERAL", "ACADEMIC", "CAREER", "PERSONAL"]>>;
    sessionCategory: z.ZodOptional<z.ZodEnum<["ACADEMIC_PERFORMANCE", "ATTENDANCE", "BACKLOG", "STUDY_PLANNING", "CAREER_PLACEMENT", "HIGHER_STUDIES", "SKILL_DEVELOPMENT", "GENERAL_GUIDANCE", "FINANCIAL_ADMIN_REFERRAL", "PERSONAL_CONCERN", "PARENT_INTERACTION", "OTHER"]>>;
    scheduledAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    agenda: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    summary: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    observations: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    studentVisibleNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    privateNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    visibility: z.ZodOptional<z.ZodEnum<["SHARED", "MENTORING_TEAM", "CONFIDENTIAL"]>>;
    outcome: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    followUpDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<["REQUESTED", "SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "COMPLETED" | "CANCELLED" | "REQUESTED" | "SCHEDULED" | "NO_SHOW" | undefined;
    outcome?: string | null | undefined;
    meetingType?: "OTHER" | "ACADEMIC" | "PERSONAL" | "ONLINE" | "PARENT_INTERACTION" | "IN_PERSON" | "PHONE" | "GENERAL" | "CAREER" | undefined;
    sessionCategory?: "OTHER" | "HIGHER_STUDIES" | "BACKLOG" | "ATTENDANCE" | "ACADEMIC_PERFORMANCE" | "STUDY_PLANNING" | "CAREER_PLACEMENT" | "SKILL_DEVELOPMENT" | "GENERAL_GUIDANCE" | "FINANCIAL_ADMIN_REFERRAL" | "PERSONAL_CONCERN" | "PARENT_INTERACTION" | undefined;
    scheduledAt?: string | null | undefined;
    agenda?: string | null | undefined;
    summary?: string | null | undefined;
    observations?: string | null | undefined;
    studentVisibleNotes?: string | null | undefined;
    privateNotes?: string | null | undefined;
    visibility?: "SHARED" | "MENTORING_TEAM" | "CONFIDENTIAL" | undefined;
    followUpDate?: string | null | undefined;
}, {
    status?: "COMPLETED" | "CANCELLED" | "REQUESTED" | "SCHEDULED" | "NO_SHOW" | undefined;
    outcome?: string | null | undefined;
    meetingType?: "OTHER" | "ACADEMIC" | "PERSONAL" | "ONLINE" | "PARENT_INTERACTION" | "IN_PERSON" | "PHONE" | "GENERAL" | "CAREER" | undefined;
    sessionCategory?: "OTHER" | "HIGHER_STUDIES" | "BACKLOG" | "ATTENDANCE" | "ACADEMIC_PERFORMANCE" | "STUDY_PLANNING" | "CAREER_PLACEMENT" | "SKILL_DEVELOPMENT" | "GENERAL_GUIDANCE" | "FINANCIAL_ADMIN_REFERRAL" | "PERSONAL_CONCERN" | "PARENT_INTERACTION" | undefined;
    scheduledAt?: string | null | undefined;
    agenda?: string | null | undefined;
    summary?: string | null | undefined;
    observations?: string | null | undefined;
    studentVisibleNotes?: string | null | undefined;
    privateNotes?: string | null | undefined;
    visibility?: "SHARED" | "MENTORING_TEAM" | "CONFIDENTIAL" | undefined;
    followUpDate?: string | null | undefined;
}>;
export declare const completeFollowUpSchema: z.ZodObject<{
    outcome: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    outcome?: string | null | undefined;
}, {
    outcome?: string | null | undefined;
}>;
export declare const createActionSchema: z.ZodObject<{
    studentId: z.ZodNumber;
    meetingId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    owner: z.ZodOptional<z.ZodEnum<["STUDENT", "MENTOR"]>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "NORMAL", "HIGH"]>>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    studentVisible: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    title: string;
    studentId: number;
    description?: string | null | undefined;
    priority?: "HIGH" | "LOW" | "NORMAL" | undefined;
    meetingId?: number | null | undefined;
    owner?: "STUDENT" | "MENTOR" | undefined;
    dueDate?: string | null | undefined;
    studentVisible?: boolean | undefined;
}, {
    title: string;
    studentId: number;
    description?: string | null | undefined;
    priority?: "HIGH" | "LOW" | "NORMAL" | undefined;
    meetingId?: number | null | undefined;
    owner?: "STUDENT" | "MENTOR" | undefined;
    dueDate?: string | null | undefined;
    studentVisible?: boolean | undefined;
}>;
export declare const updateActionSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    owner: z.ZodOptional<z.ZodEnum<["STUDENT", "MENTOR"]>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "NORMAL", "HIGH"]>>;
    status: z.ZodOptional<z.ZodEnum<["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"]>>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    outcome: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    studentVisible: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    status?: "COMPLETED" | "CANCELLED" | "IN_PROGRESS" | "OPEN" | undefined;
    title?: string | undefined;
    description?: string | null | undefined;
    outcome?: string | null | undefined;
    priority?: "HIGH" | "LOW" | "NORMAL" | undefined;
    owner?: "STUDENT" | "MENTOR" | undefined;
    dueDate?: string | null | undefined;
    studentVisible?: boolean | undefined;
}, {
    status?: "COMPLETED" | "CANCELLED" | "IN_PROGRESS" | "OPEN" | undefined;
    title?: string | undefined;
    description?: string | null | undefined;
    outcome?: string | null | undefined;
    priority?: "HIGH" | "LOW" | "NORMAL" | undefined;
    owner?: "STUDENT" | "MENTOR" | undefined;
    dueDate?: string | null | undefined;
    studentVisible?: boolean | undefined;
}>;
export declare const createEscalationSchema: z.ZodObject<{
    studentId: z.ZodNumber;
    meetingId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    reasonCode: z.ZodEnum<["PERSISTENT_ACADEMIC_RISK", "SEVERE_ATTENDANCE_SHORTAGE", "REPEATED_INTERVENTION_FAILURE", "ADMINISTRATIVE_SUPPORT_REQUIRED", "OTHER"]>;
    reason: z.ZodString;
    targetLevel: z.ZodOptional<z.ZodEnum<["HOD", "PRINCIPAL"]>>;
}, "strip", z.ZodTypeAny, {
    reason: string;
    studentId: number;
    reasonCode: "OTHER" | "PERSISTENT_ACADEMIC_RISK" | "SEVERE_ATTENDANCE_SHORTAGE" | "REPEATED_INTERVENTION_FAILURE" | "ADMINISTRATIVE_SUPPORT_REQUIRED";
    meetingId?: number | null | undefined;
    targetLevel?: "HOD" | "PRINCIPAL" | undefined;
}, {
    reason: string;
    studentId: number;
    reasonCode: "OTHER" | "PERSISTENT_ACADEMIC_RISK" | "SEVERE_ATTENDANCE_SHORTAGE" | "REPEATED_INTERVENTION_FAILURE" | "ADMINISTRATIVE_SUPPORT_REQUIRED";
    meetingId?: number | null | undefined;
    targetLevel?: "HOD" | "PRINCIPAL" | undefined;
}>;
export declare const resolveEscalationSchema: z.ZodObject<{
    action: z.ZodEnum<["ACKNOWLEDGE", "RETURN", "RESOLVE", "ESCALATE_PRINCIPAL"]>;
    resolution: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    action: "RETURN" | "ACKNOWLEDGE" | "RESOLVE" | "ESCALATE_PRINCIPAL";
    resolution?: string | null | undefined;
}, {
    action: "RETURN" | "ACKNOWLEDGE" | "RESOLVE" | "ESCALATE_PRINCIPAL";
    resolution?: string | null | undefined;
}>;
export declare const createReferralSchema: z.ZodObject<{
    studentId: z.ZodNumber;
    targetFunction: z.ZodEnum<["ACADEMIC_SERVICES", "TP", "FINANCE", "GRIEVANCE", "HOD", "PRINCIPAL", "OTHER"]>;
    subject: z.ZodString;
    context: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    studentId: number;
    subject: string;
    targetFunction: "HOD" | "PRINCIPAL" | "OTHER" | "ACADEMIC_SERVICES" | "TP" | "FINANCE" | "GRIEVANCE";
    context?: string | null | undefined;
}, {
    studentId: number;
    subject: string;
    targetFunction: "HOD" | "PRINCIPAL" | "OTHER" | "ACADEMIC_SERVICES" | "TP" | "FINANCE" | "GRIEVANCE";
    context?: string | null | undefined;
}>;
export declare const closeReferralSchema: z.ZodObject<{
    outcome: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    outcome?: string | null | undefined;
}, {
    outcome?: string | null | undefined;
}>;
export declare const createParentInteractionSchema: z.ZodObject<{
    studentId: z.ZodNumber;
    interactionDate: z.ZodString;
    mode: z.ZodOptional<z.ZodEnum<["PHONE", "IN_PERSON", "ONLINE", "LETTER", "OTHER"]>>;
    initiatedBy: z.ZodOptional<z.ZodEnum<["MENTOR", "PARENT", "INSTITUTION"]>>;
    purpose: z.ZodString;
    summary: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    agreedFollowUp: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    visibility: z.ZodOptional<z.ZodEnum<["SHARED", "MENTORING_TEAM", "CONFIDENTIAL"]>>;
}, "strip", z.ZodTypeAny, {
    studentId: number;
    interactionDate: string;
    purpose: string;
    mode?: "OTHER" | "ONLINE" | "LETTER" | "IN_PERSON" | "PHONE" | undefined;
    summary?: string | null | undefined;
    visibility?: "SHARED" | "MENTORING_TEAM" | "CONFIDENTIAL" | undefined;
    initiatedBy?: "PARENT" | "INSTITUTION" | "MENTOR" | undefined;
    agreedFollowUp?: string | null | undefined;
}, {
    studentId: number;
    interactionDate: string;
    purpose: string;
    mode?: "OTHER" | "ONLINE" | "LETTER" | "IN_PERSON" | "PHONE" | undefined;
    summary?: string | null | undefined;
    visibility?: "SHARED" | "MENTORING_TEAM" | "CONFIDENTIAL" | undefined;
    initiatedBy?: "PARENT" | "INSTITUTION" | "MENTOR" | undefined;
    agreedFollowUp?: string | null | undefined;
}>;
export declare const assignMentorSchema: z.ZodObject<{
    studentId: z.ZodNumber;
    mentorFacultyId: z.ZodNumber;
    academicYearId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    studentId: number;
    mentorFacultyId: number;
    academicYearId?: number | null | undefined;
}, {
    studentId: number;
    mentorFacultyId: number;
    academicYearId?: number | null | undefined;
}>;
export declare const bulkAssignMentorSchema: z.ZodObject<{
    studentIds: z.ZodArray<z.ZodNumber, "many">;
    mentorFacultyId: z.ZodNumber;
    academicYearId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    mentorFacultyId: number;
    studentIds: number[];
    academicYearId?: number | null | undefined;
}, {
    mentorFacultyId: number;
    studentIds: number[];
    academicYearId?: number | null | undefined;
}>;
export declare const riskConfigSchema: z.ZodObject<{
    attendanceAttentionPct: z.ZodOptional<z.ZodNumber>;
    attendanceHighPct: z.ZodOptional<z.ZodNumber>;
    cieAttentionPct: z.ZodOptional<z.ZodNumber>;
    assignmentMissAttention: z.ZodOptional<z.ZodNumber>;
    assignmentMissHigh: z.ZodOptional<z.ZodNumber>;
    backlogWatch: z.ZodOptional<z.ZodNumber>;
    backlogAttention: z.ZodOptional<z.ZodNumber>;
    backlogHigh: z.ZodOptional<z.ZodNumber>;
    followupOverdueDays: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    attendanceAttentionPct?: number | undefined;
    attendanceHighPct?: number | undefined;
    cieAttentionPct?: number | undefined;
    assignmentMissAttention?: number | undefined;
    assignmentMissHigh?: number | undefined;
    backlogWatch?: number | undefined;
    backlogAttention?: number | undefined;
    backlogHigh?: number | undefined;
    followupOverdueDays?: number | undefined;
}, {
    attendanceAttentionPct?: number | undefined;
    attendanceHighPct?: number | undefined;
    cieAttentionPct?: number | undefined;
    assignmentMissAttention?: number | undefined;
    assignmentMissHigh?: number | undefined;
    backlogWatch?: number | undefined;
    backlogAttention?: number | undefined;
    backlogHigh?: number | undefined;
    followupOverdueDays?: number | undefined;
}>;
