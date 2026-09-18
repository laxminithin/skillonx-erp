/**
 * Succession Planning & Talent Management — enums, state machines and schemas.
 */
import { z } from 'zod';

export const CRITICALITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const RISK = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const BAND = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const READINESS = ['READY_NOW', 'READY_1_YEAR', 'READY_2_YEARS', 'DEVELOPING', 'NOT_READY'] as const;
export const NOMINATION_SOURCES = ['HR', 'HOD', 'PRINCIPAL', 'MANAGER'] as const;
export const DEV_ACTION_TYPES = ['TRAINING', 'MENTORING', 'SHADOWING', 'STRETCH', 'CERTIFICATION', 'LEADERSHIP_PROGRAM', 'CUSTOM'] as const;

export const CANDIDATE_STATUSES = ['DRAFT', 'NOMINATED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN'] as const;
export const CANDIDATE_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['NOMINATED', 'WITHDRAWN'],
  NOMINATED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'WITHDRAWN'],
  APPROVED: ['WITHDRAWN'],
  REJECTED: [],
  WITHDRAWN: [],
};

export const DEV_ACTION_STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export const EVENT_STATUSES = ['OPEN', 'UNDER_REVIEW', 'DECIDED', 'CLOSED', 'CANCELLED'] as const;

/** Employment statuses that may hold an ACTIVE successor nomination. */
export const NOMINATION_ELIGIBLE_STATUSES = ['ACTIVE', 'PROBATION', 'CONFIRMED', 'ON_LONG_LEAVE'] as const;
/** Statuses that force a successor out of active standing (terminal/ineligible). */
export const INELIGIBLE_STATUSES = ['SEPARATED', 'RETIRED', 'TERMINATED', 'INACTIVE', 'DRAFT', 'PRE_JOINING'] as const;

export function canTransition(map: Record<string, string[]>, from: string, to: string): boolean {
  return (map[from] ?? []).includes(to);
}

// ── Schemas ──────────────────────────────────────────────────────────────────
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const criticalRoleSchema = z.object({
  code: z.string().trim().min(1).max(48),
  roleTitle: z.string().trim().min(1).max(200),
  departmentId: z.number().int().positive().nullable().optional(),
  designationId: z.number().int().positive().nullable().optional(),
  incumbentEmployeeId: z.number().int().positive().nullable().optional(),
  criticality: z.enum(CRITICALITY).default('MEDIUM'),
  impactNotes: z.string().max(4000).nullable().optional(),
  vacancyRisk: z.enum(RISK).default('MEDIUM'),
  exitRisk: z.enum(RISK).default('MEDIUM'),
  replacementUrgency: z.enum(RISK).default('MEDIUM'),
  requiredCompetencies: z.array(z.string().max(120)).max(50).nullable().optional(),
  minExperienceYears: z.number().int().nonnegative().nullable().optional(),
  minReadiness: z.enum(READINESS).nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
  effectiveFrom: dateStr.nullable().optional(),
  effectiveTo: dateStr.nullable().optional(),
});
export const criticalRoleUpdateSchema = criticalRoleSchema.partial();

export const assessmentSchema = z.object({
  employeeId: z.number().int().positive(),
  assessmentPeriod: z.string().trim().min(1).max(48),
  performanceBand: z.enum(BAND).nullable().optional(),
  potentialBand: z.enum(BAND).nullable().optional(),
  overallPotential: z.enum(BAND).nullable().optional(),
  readiness: z.enum(READINESS).nullable().optional(),
  leadershipCapability: z.number().int().min(1).max(5).nullable().optional(),
  functionalCapability: z.number().int().min(1).max(5).nullable().optional(),
  institutionalKnowledge: z.number().int().min(1).max(5).nullable().optional(),
  mobility: z.string().max(16).nullable().optional(),
  retentionConcern: z.enum(RISK).nullable().optional(),
  developmentSummary: z.string().max(4000).nullable().optional(),
  comments: z.string().max(4000).nullable().optional(),
  classificationSource: z.enum(['APPRAISAL', 'ASSESSMENT', 'RULE']).default('ASSESSMENT'),
});
export const assessmentUpdateSchema = assessmentSchema.partial().omit({ employeeId: true, assessmentPeriod: true });

export const poolSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().max(4000).nullable().optional(),
  departmentId: z.number().int().positive().nullable().optional(),
  eligibilityCriteria: z.string().max(4000).nullable().optional(),
});
export const poolMemberSchema = z.object({
  employeeId: z.number().int().positive(),
  entryReason: z.string().max(2000).nullable().optional(),
});

export const nominateSchema = z.object({
  criticalRoleId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  readiness: z.enum(READINESS).default('DEVELOPING'),
  rank: z.number().int().positive().nullable().optional(),
  strengths: z.string().max(4000).nullable().optional(),
  developmentGaps: z.string().max(4000).nullable().optional(),
});
export const candidateDecisionSchema = z.object({ remarks: z.string().max(2000).optional() });

export const readinessReviewSchema = z.object({
  newReadiness: z.enum(READINESS),
  developmentGaps: z.string().max(4000).nullable().optional(),
  comments: z.string().max(2000).nullable().optional(),
});

export const devActionSchema = z.object({
  employeeId: z.number().int().positive(),
  candidateId: z.number().int().positive().nullable().optional(),
  criticalRoleId: z.number().int().positive().nullable().optional(),
  actionType: z.enum(DEV_ACTION_TYPES),
  description: z.string().trim().min(1).max(4000),
  mentorEmployeeId: z.number().int().positive().nullable().optional(),
  dueDate: dateStr.nullable().optional(),
  linkedLdProgramId: z.number().int().positive().nullable().optional(),
});
export const devActionStatusSchema = z.object({ status: z.enum(DEV_ACTION_STATUSES), completionEvidence: z.string().max(2000).nullable().optional() });

export const eventSchema = z.object({ criticalRoleId: z.number().int().positive(), reason: z.string().max(2000).nullable().optional() });
export const eventDecisionSchema = z.object({
  selectedCandidateId: z.number().int().positive().nullable().optional(),
  selectedEmployeeId: z.number().int().positive().nullable().optional(),
  decisionNotes: z.string().max(4000).nullable().optional(),
  effectiveDate: dateStr.nullable().optional(),
});
