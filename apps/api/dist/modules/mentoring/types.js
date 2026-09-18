import { z } from 'zod';
/** Session categories — mentoring topics, NOT clinical diagnoses. */
export const SESSION_CATEGORIES = [
    'ACADEMIC_PERFORMANCE',
    'ATTENDANCE',
    'BACKLOG',
    'STUDY_PLANNING',
    'CAREER_PLACEMENT',
    'HIGHER_STUDIES',
    'SKILL_DEVELOPMENT',
    'GENERAL_GUIDANCE',
    'FINANCIAL_ADMIN_REFERRAL',
    'PERSONAL_CONCERN',
    'PARENT_INTERACTION',
    'OTHER',
];
export const SESSION_TYPES = ['IN_PERSON', 'PHONE', 'ONLINE', 'PARENT_INTERACTION', 'OTHER', 'GENERAL', 'ACADEMIC', 'CAREER', 'PERSONAL'];
/** Note visibility levels. */
export const VISIBILITY_LEVELS = ['SHARED', 'MENTORING_TEAM', 'CONFIDENTIAL'];
export const ACTION_STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
export const ACTION_OWNERS = ['STUDENT', 'MENTOR'];
export const ACTION_PRIORITIES = ['LOW', 'NORMAL', 'HIGH'];
export const ESCALATION_LEVELS = ['HOD', 'PRINCIPAL'];
export const ESCALATION_STATUSES = ['OPEN', 'ACKNOWLEDGED', 'RETURNED', 'RESOLVED'];
export const ESCALATION_REASON_CODES = [
    'PERSISTENT_ACADEMIC_RISK',
    'SEVERE_ATTENDANCE_SHORTAGE',
    'REPEATED_INTERVENTION_FAILURE',
    'ADMINISTRATIVE_SUPPORT_REQUIRED',
    'OTHER',
];
export const REFERRAL_FUNCTIONS = ['ACADEMIC_SERVICES', 'TP', 'FINANCE', 'GRIEVANCE', 'HOD', 'PRINCIPAL', 'OTHER'];
export const REFERRAL_STATUSES = ['OPEN', 'ACCEPTED', 'CLOSED'];
export const PARENT_MODES = ['PHONE', 'IN_PERSON', 'ONLINE', 'LETTER', 'OTHER'];
export const PARENT_INITIATORS = ['MENTOR', 'PARENT', 'INSTITUTION'];
/** Overall attention level derived by the risk engine. */
export const ATTENTION_LEVELS = ['NORMAL', 'WATCH', 'ATTENTION', 'HIGH'];
export const RISK_DIMENSIONS = ['ATTENDANCE', 'ACADEMIC', 'ENGAGEMENT', 'BACKLOG', 'FOLLOW_UP'];
// ── Zod input schemas ──────────────────────────────────────────────────
export const createSessionSchema = z.object({
    studentId: z.number().int().positive(),
    meetingType: z.enum(SESSION_TYPES).optional(),
    sessionCategory: z.enum(SESSION_CATEGORIES).optional(),
    scheduledAt: z.string().optional().nullable(),
    agenda: z.string().trim().min(1).max(2000),
    summary: z.string().trim().max(8000).optional().nullable(),
    observations: z.string().trim().max(8000).optional().nullable(),
    studentVisibleNotes: z.string().trim().max(8000).optional().nullable(),
    privateNotes: z.string().trim().max(8000).optional().nullable(),
    visibility: z.enum(VISIBILITY_LEVELS).optional(),
    followUpDate: z.string().optional().nullable(),
    status: z.enum(['SCHEDULED', 'COMPLETED']).optional(),
});
export const updateSessionSchema = z.object({
    meetingType: z.enum(SESSION_TYPES).optional(),
    sessionCategory: z.enum(SESSION_CATEGORIES).optional(),
    scheduledAt: z.string().optional().nullable(),
    agenda: z.string().trim().max(2000).optional().nullable(),
    summary: z.string().trim().max(8000).optional().nullable(),
    observations: z.string().trim().max(8000).optional().nullable(),
    studentVisibleNotes: z.string().trim().max(8000).optional().nullable(),
    privateNotes: z.string().trim().max(8000).optional().nullable(),
    visibility: z.enum(VISIBILITY_LEVELS).optional(),
    outcome: z.string().trim().max(8000).optional().nullable(),
    followUpDate: z.string().optional().nullable(),
    status: z.enum(['REQUESTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
});
export const completeFollowUpSchema = z.object({
    outcome: z.string().trim().max(8000).optional().nullable(),
});
export const createActionSchema = z.object({
    studentId: z.number().int().positive(),
    meetingId: z.number().int().positive().optional().nullable(),
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().max(4000).optional().nullable(),
    owner: z.enum(ACTION_OWNERS).optional(),
    priority: z.enum(ACTION_PRIORITIES).optional(),
    dueDate: z.string().optional().nullable(),
    studentVisible: z.boolean().optional(),
});
export const updateActionSchema = z.object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(4000).optional().nullable(),
    owner: z.enum(ACTION_OWNERS).optional(),
    priority: z.enum(ACTION_PRIORITIES).optional(),
    status: z.enum(ACTION_STATUSES).optional(),
    dueDate: z.string().optional().nullable(),
    outcome: z.string().trim().max(4000).optional().nullable(),
    studentVisible: z.boolean().optional(),
});
export const createEscalationSchema = z.object({
    studentId: z.number().int().positive(),
    meetingId: z.number().int().positive().optional().nullable(),
    reasonCode: z.enum(ESCALATION_REASON_CODES),
    reason: z.string().trim().min(1).max(4000),
    targetLevel: z.enum(ESCALATION_LEVELS).optional(),
});
export const resolveEscalationSchema = z.object({
    action: z.enum(['ACKNOWLEDGE', 'RETURN', 'RESOLVE', 'ESCALATE_PRINCIPAL']),
    resolution: z.string().trim().max(4000).optional().nullable(),
});
export const createReferralSchema = z.object({
    studentId: z.number().int().positive(),
    targetFunction: z.enum(REFERRAL_FUNCTIONS),
    subject: z.string().trim().min(1).max(255),
    context: z.string().trim().max(2000).optional().nullable(),
});
export const closeReferralSchema = z.object({
    outcome: z.string().trim().max(2000).optional().nullable(),
});
export const createParentInteractionSchema = z.object({
    studentId: z.number().int().positive(),
    interactionDate: z.string(),
    mode: z.enum(PARENT_MODES).optional(),
    initiatedBy: z.enum(PARENT_INITIATORS).optional(),
    purpose: z.string().trim().min(1).max(255),
    summary: z.string().trim().max(4000).optional().nullable(),
    agreedFollowUp: z.string().trim().max(2000).optional().nullable(),
    visibility: z.enum(VISIBILITY_LEVELS).optional(),
});
export const assignMentorSchema = z.object({
    studentId: z.number().int().positive(),
    mentorFacultyId: z.number().int().positive(),
    academicYearId: z.number().int().positive().optional().nullable(),
});
export const bulkAssignMentorSchema = z.object({
    studentIds: z.array(z.number().int().positive()).min(1).max(500),
    mentorFacultyId: z.number().int().positive(),
    academicYearId: z.number().int().positive().optional().nullable(),
});
export const riskConfigSchema = z.object({
    attendanceAttentionPct: z.number().int().min(0).max(100).optional(),
    attendanceHighPct: z.number().int().min(0).max(100).optional(),
    cieAttentionPct: z.number().int().min(0).max(100).optional(),
    assignmentMissAttention: z.number().int().min(0).max(50).optional(),
    assignmentMissHigh: z.number().int().min(0).max(50).optional(),
    backlogWatch: z.number().int().min(0).max(50).optional(),
    backlogAttention: z.number().int().min(0).max(50).optional(),
    backlogHigh: z.number().int().min(0).max(50).optional(),
    followupOverdueDays: z.number().int().min(0).max(90).optional(),
});
