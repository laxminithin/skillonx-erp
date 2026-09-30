import { z } from 'zod';
export const AGENCY_TYPES = ['GOVERNMENT', 'INDUSTRY', 'UNIVERSITY', 'FOUNDATION', 'INTERNAL', 'OTHER'];
export const PROJECT_TYPES = [
    'SPONSORED_RESEARCH',
    'INTERNAL_RESEARCH',
    'SEED_GRANT',
    'CONSULTANCY',
    'INDUSTRY_PROJECT',
    'COLLABORATIVE_RESEARCH',
    'STUDENT_RESEARCH',
];
export const TEAM_ROLES = ['PI', 'CO_PI', 'CO_INVESTIGATOR', 'TEAM_MEMBER'];
export const PROPOSAL_STATUSES = [
    'DRAFT',
    'UNDER_REVIEW',
    'RETURNED',
    'APPROVED_INTERNALLY',
    'REJECTED_INTERNALLY',
    'WITHDRAWN',
    'AWARDED',
    'CONVERTED_TO_PROJECT',
];
export const PROJECT_STATUSES = ['ACTIVE', 'ON_HOLD', 'COMPLETION_PENDING', 'COMPLETED', 'CLOSED', 'CANCELLED'];
export const REVIEW_ACTIONS = ['APPROVE', 'REJECT', 'RETURN'];
// ── Zod schemas ─────────────────────────────────────────────────────────────
export const fundingAgencySchema = z.object({
    name: z.string().trim().min(1).max(255),
    agencyType: z.enum(AGENCY_TYPES).optional(),
    contactName: z.string().trim().max(255).optional().nullable(),
    contactEmail: z.string().trim().max(255).optional().nullable(),
    contactPhone: z.string().trim().max(32).optional().nullable(),
}).strict();
export const proposalTeamMemberSchema = z.object({
    facultyId: z.number().int().positive(),
    roleInProject: z.enum(TEAM_ROLES),
}).strict();
export const proposalSchema = z.object({
    title: z.string().trim().min(1).max(512),
    projectType: z.enum(PROJECT_TYPES),
    departmentId: z.number().int().positive().optional().nullable(),
    fundingAgencyId: z.number().int().positive().optional().nullable(),
    requestedAmount: z.number().nonnegative().optional().nullable(),
    durationMonths: z.number().int().positive().optional().nullable(),
    abstract: z.string().trim().max(20000).optional().nullable(),
    team: z.array(proposalTeamMemberSchema).min(1).max(30),
}).strict().superRefine((val, ctx) => {
    const piCount = val.team.filter((m) => m.roleInProject === 'PI').length;
    if (piCount !== 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['team'], message: 'Exactly one team member must have roleInProject PI' });
    }
    const facultyIds = new Set(val.team.map((m) => m.facultyId));
    if (facultyIds.size !== val.team.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['team'], message: 'Duplicate faculty in proposal team' });
    }
});
export const awardSchema = z.object({
    sanctionedAmount: z.number().positive(),
    sanctionReference: z.string().trim().min(1).max(128),
    sanctionDate: z.string().trim().min(1),
    fundingAgencyId: z.number().int().positive().optional().nullable(),
}).strict();
export const utilizationEntrySchema = z.object({
    amount: z.number().positive(),
    description: z.string().trim().max(500).optional().nullable(),
    recordedAt: z.string().trim().min(1),
}).strict();
export const projectClosureSchema = z.object({
    reason: z.string().trim().max(2000).optional().nullable(),
}).strict();
export const reviewSchema = z.object({
    action: z.enum(REVIEW_ACTIONS),
    remarks: z.string().trim().max(2000).optional().nullable(),
}).strict();
export const withdrawSchema = z.object({
    reason: z.string().trim().max(2000).optional().nullable(),
}).strict();
