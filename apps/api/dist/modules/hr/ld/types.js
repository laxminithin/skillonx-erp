/**
 * Employee L&D — constants, state machines and validation schemas.
 */
import { z } from 'zod';
// ── State machines ───────────────────────────────────────────────────────────
export const DEV_NEED_STATUSES = ['IDENTIFIED', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'WAIVED', 'CANCELLED'];
export const DEV_NEED_TRANSITIONS = {
    IDENTIFIED: ['PLANNED', 'IN_PROGRESS', 'WAIVED', 'CANCELLED'],
    PLANNED: ['IN_PROGRESS', 'WAIVED', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'WAIVED', 'CANCELLED'],
    COMPLETED: [],
    WAIVED: [],
    CANCELLED: [],
};
export const PROGRAM_STATUSES = [
    'DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'CANCELLED',
];
export const PROGRAM_TRANSITIONS = {
    DRAFT: ['PUBLISHED', 'CANCELLED'],
    PUBLISHED: ['REGISTRATION_OPEN', 'CANCELLED'],
    REGISTRATION_OPEN: ['REGISTRATION_CLOSED', 'IN_PROGRESS', 'CANCELLED'],
    REGISTRATION_CLOSED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: ['CLOSED'],
    CLOSED: [],
    CANCELLED: [],
};
/** Statuses in which enrollment/nomination is permitted. */
export const PROGRAM_ENROLLABLE = ['REGISTRATION_OPEN'];
export const NOMINATION_STATUSES = ['SUBMITTED', 'MANAGER_APPROVED', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'CONVERTED'];
export const ENROLLMENT_STATUSES = ['CONFIRMED', 'WAITLISTED', 'CANCELLED', 'DROPPED'];
export const LD_ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'EXCUSED', 'NOT_REQUIRED'];
export const DELIVERY_MODES = ['IN_PERSON', 'ONLINE', 'HYBRID', 'SELF_PACED'];
export const APPLICABILITY_TYPES = ['ALL', 'FACULTY', 'NON_FACULTY', 'DEPARTMENT', 'DESIGNATION', 'EMPLOYMENT_TYPE', 'SPECIFIC'];
export const DEV_NEED_SOURCES = ['APPRAISAL', 'SELF', 'MANAGER', 'HR', 'INSTITUTIONAL', 'ROLE', 'COMPLIANCE'];
export const CATEGORIES = ['TECHNICAL', 'PEDAGOGY', 'RESEARCH', 'LEADERSHIP', 'COMPLIANCE', 'COMMUNICATION', 'MANAGEMENT', 'DIGITAL', 'DOMAIN', 'INSTITUTIONAL', 'OTHER'];
export function canTransition(map, from, to) {
    return (map[from] ?? []).includes(to);
}
// ── Schemas ──────────────────────────────────────────────────────────────────
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const providerSchema = z.object({
    name: z.string().trim().min(1).max(200),
    type: z.enum(['INTERNAL', 'EXTERNAL']).default('EXTERNAL'),
    contact: z.string().max(200).nullable().optional(),
    website: z.string().max(255).nullable().optional(),
});
export const courseSchema = z.object({
    code: z.string().trim().min(1).max(48),
    title: z.string().trim().min(1).max(200),
    description: z.string().max(4000).nullable().optional(),
    category: z.enum(CATEGORIES).default('OTHER'),
    providerType: z.enum(['INTERNAL', 'EXTERNAL']).default('INTERNAL'),
    defaultDeliveryMode: z.enum(DELIVERY_MODES).default('IN_PERSON'),
    durationHours: z.number().nonnegative().nullable().optional(),
    learningObjectives: z.string().max(4000).nullable().optional(),
    targetAudience: z.string().max(32).nullable().optional(),
    skillTags: z.array(z.string().max(64)).max(50).nullable().optional(),
    validityMonths: z.number().int().positive().nullable().optional(),
    isMandatoryDefault: z.boolean().optional(),
});
export const courseUpdateSchema = courseSchema.partial();
export const programSchema = z.object({
    courseId: z.number().int().positive().nullable().optional(),
    providerId: z.number().int().positive().nullable().optional(),
    code: z.string().trim().min(1).max(48),
    title: z.string().trim().min(1).max(200),
    providerType: z.enum(['INTERNAL', 'EXTERNAL']).default('INTERNAL'),
    trainerEmployeeId: z.number().int().positive().nullable().optional(),
    externalTrainerName: z.string().max(200).nullable().optional(),
    deliveryMode: z.enum(DELIVERY_MODES).default('IN_PERSON'),
    startDate: dateStr.nullable().optional(),
    endDate: dateStr.nullable().optional(),
    venue: z.string().max(255).nullable().optional(),
    link: z.string().max(512).nullable().optional(),
    durationHours: z.number().nonnegative().nullable().optional(),
    capacity: z.number().int().positive().nullable().optional(),
    registrationOpensAt: z.string().nullable().optional(),
    registrationClosesAt: z.string().nullable().optional(),
    applicabilityType: z.enum(APPLICABILITY_TYPES).default('ALL'),
    applicabilityRef: z
        .object({
        departmentIds: z.array(z.number().int().positive()).optional(),
        designationIds: z.array(z.number().int().positive()).optional(),
        employmentTypeIds: z.array(z.number().int().positive()).optional(),
        employeeIds: z.array(z.number().int().positive()).optional(),
    })
        .nullable()
        .optional(),
    isMandatory: z.boolean().optional(),
    mandatoryDueDate: dateStr.nullable().optional(),
    cost: z.record(z.string(), z.number()).nullable().optional(),
    completionRule: z
        .object({
        attendanceThreshold: z.number().min(0).max(100).optional(),
        requireAssessment: z.boolean().optional(),
        assessmentPassMark: z.number().min(0).max(100).optional(),
        requireMandatorySessions: z.boolean().optional(),
        requireTrainerConfirmation: z.boolean().optional(),
    })
        .nullable()
        .optional(),
});
export const programUpdateSchema = programSchema.partial();
export const programStatusSchema = z.object({ status: z.enum(PROGRAM_STATUSES), reason: z.string().max(2000).optional() });
export const sessionSchema = z.object({
    title: z.string().trim().min(1).max(200),
    sessionDate: dateStr.nullable().optional(),
    startTime: z.string().max(8).nullable().optional(),
    endTime: z.string().max(8).nullable().optional(),
    trainerEmployeeId: z.number().int().positive().nullable().optional(),
    externalTrainerName: z.string().max(200).nullable().optional(),
    venue: z.string().max(255).nullable().optional(),
    link: z.string().max(512).nullable().optional(),
    isMandatory: z.boolean().optional(),
});
export const devNeedSchema = z.object({
    employeeId: z.number().int().positive().optional(), // omitted = self
    sourceType: z.enum(DEV_NEED_SOURCES).default('SELF'),
    sourceRefId: z.number().int().positive().nullable().optional(),
    developmentArea: z.string().trim().min(1).max(200),
    targetCompetency: z.string().max(200).nullable().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
    targetPeriod: z.string().max(48).nullable().optional(),
});
export const devNeedTransitionSchema = z.object({ status: z.enum(DEV_NEED_STATUSES), reason: z.string().max(2000).optional() });
export const nominationSchema = z.object({
    programId: z.number().int().positive(),
    employeeId: z.number().int().positive().optional(), // omitted = self request
    developmentNeedId: z.number().int().positive().nullable().optional(),
    reason: z.string().max(2000).nullable().optional(),
    estimatedCost: z.number().nonnegative().nullable().optional(),
    supportingRef: z.string().max(512).nullable().optional(),
    eligibilityOverride: z.boolean().optional(),
    overrideReason: z.string().max(2000).nullable().optional(),
});
export const nominationDecisionSchema = z.object({ reason: z.string().max(2000).optional() });
export const enrollSchema = z.object({ programId: z.number().int().positive() });
export const attendanceSchema = z.object({
    sessionId: z.number().int().positive().nullable().optional(),
    entries: z
        .array(z.object({ employeeId: z.number().int().positive(), status: z.enum(LD_ATTENDANCE_STATUSES) }))
        .min(1)
        .max(500),
});
export const completionSchema = z.object({
    employeeId: z.number().int().positive(),
    assessmentScore: z.number().min(0).max(100).nullable().optional(),
    grade: z.string().max(16).nullable().optional(),
});
export const certificateIssueSchema = z.object({
    employeeId: z.number().int().positive(),
    title: z.string().max(200).optional(),
});
export const externalCertSchema = z.object({
    programId: z.number().int().positive().nullable().optional(),
    title: z.string().trim().min(1).max(200),
    provider: z.string().max(200).nullable().optional(),
    issuedOn: dateStr.nullable().optional(),
    expiresOn: dateStr.nullable().optional(),
    fileReference: z.string().max(512).nullable().optional(),
});
export const certVerifySchema = z.object({ decision: z.enum(['VERIFIED', 'REJECTED']), reason: z.string().max(2000).optional() });
export const feedbackSchema = z.object({
    programId: z.number().int().positive(),
    rating: z.number().int().min(1).max(5).nullable().optional(),
    relevanceRating: z.number().int().min(1).max(5).nullable().optional(),
    learningGained: z.string().max(2000).nullable().optional(),
    comments: z.string().max(2000).nullable().optional(),
});
export const managerReviewSchema = z.object({
    programId: z.number().int().positive(),
    employeeId: z.number().int().positive(),
    improvementObserved: z.boolean().optional(),
    objectiveMet: z.boolean().optional(),
    followUpRequired: z.boolean().optional(),
    comments: z.string().max(2000).nullable().optional(),
});
export const closeNeedSchema = z.object({ reason: z.string().max(2000).optional() });
