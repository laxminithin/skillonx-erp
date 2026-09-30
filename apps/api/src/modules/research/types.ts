import { z } from 'zod';

/**
 * Campus OS Phase 6 — Research, Grants, Consultancy, Innovation & IPR
 * (minimal administrative scope). See
 * docs/CAMPUS_OS_PHASE6_PREIMPLEMENTATION_AUDIT.md for the approved scope
 * boundary. This module owns ONLY the grants-administration layer
 * (funding agency master, proposal->approval->award->project lifecycle,
 * record-only sanction/utilization tracking). It never touches or
 * duplicates the Faculty Academic Record (`facultyProfile`).
 */

// Shape matches `WorkflowActor` exactly (facultyUserId, collegeId, role) so
// a ResearchActor can be passed directly into workflowEngine functions.
export type ResearchActor = {
  facultyUserId: number;
  collegeId: number;
  departmentId: number | null;
  role: string;
  name?: string | null;
  /**
   * Departments the actor is HOD of, resolved the same canonical way as
   * `facultyProfile/access.ts`'s `hodDepartmentIds` (Academic Leadership
   * enrichment when available, else the legacy role==='HOD' fallback).
   */
  hodDepartmentIds?: number[] | null;
};

export type ResearchPermission =
  | 'research.proposal.create'
  | 'research.proposal.view'
  | 'research.proposal.review'
  | 'research.award.manage'
  | 'research.project.manage'
  | 'research.project.view'
  | 'research.utilization.manage'
  | 'research.fundingAgency.manage';

export const AGENCY_TYPES = ['GOVERNMENT', 'INDUSTRY', 'UNIVERSITY', 'FOUNDATION', 'INTERNAL', 'OTHER'] as const;
export type AgencyType = (typeof AGENCY_TYPES)[number];

export const PROJECT_TYPES = [
  'SPONSORED_RESEARCH',
  'INTERNAL_RESEARCH',
  'SEED_GRANT',
  'CONSULTANCY',
  'INDUSTRY_PROJECT',
  'COLLABORATIVE_RESEARCH',
  'STUDENT_RESEARCH',
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const TEAM_ROLES = ['PI', 'CO_PI', 'CO_INVESTIGATOR', 'TEAM_MEMBER'] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const PROPOSAL_STATUSES = [
  'DRAFT',
  'UNDER_REVIEW',
  'RETURNED',
  'APPROVED_INTERNALLY',
  'REJECTED_INTERNALLY',
  'WITHDRAWN',
  'AWARDED',
  'CONVERTED_TO_PROJECT',
] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const PROJECT_STATUSES = ['ACTIVE', 'ON_HOLD', 'COMPLETION_PENDING', 'COMPLETED', 'CLOSED', 'CANCELLED'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const REVIEW_ACTIONS = ['APPROVE', 'REJECT', 'RETURN'] as const;
export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

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
