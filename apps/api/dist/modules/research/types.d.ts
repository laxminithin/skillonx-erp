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
export type ResearchPermission = 'research.proposal.create' | 'research.proposal.view' | 'research.proposal.review' | 'research.award.manage' | 'research.project.manage' | 'research.project.view' | 'research.utilization.manage' | 'research.fundingAgency.manage';
export declare const AGENCY_TYPES: readonly ["GOVERNMENT", "INDUSTRY", "UNIVERSITY", "FOUNDATION", "INTERNAL", "OTHER"];
export type AgencyType = (typeof AGENCY_TYPES)[number];
export declare const PROJECT_TYPES: readonly ["SPONSORED_RESEARCH", "INTERNAL_RESEARCH", "SEED_GRANT", "CONSULTANCY", "INDUSTRY_PROJECT", "COLLABORATIVE_RESEARCH", "STUDENT_RESEARCH"];
export type ProjectType = (typeof PROJECT_TYPES)[number];
export declare const TEAM_ROLES: readonly ["PI", "CO_PI", "CO_INVESTIGATOR", "TEAM_MEMBER"];
export type TeamRole = (typeof TEAM_ROLES)[number];
export declare const PROPOSAL_STATUSES: readonly ["DRAFT", "UNDER_REVIEW", "RETURNED", "APPROVED_INTERNALLY", "REJECTED_INTERNALLY", "WITHDRAWN", "AWARDED", "CONVERTED_TO_PROJECT"];
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];
export declare const PROJECT_STATUSES: readonly ["ACTIVE", "ON_HOLD", "COMPLETION_PENDING", "COMPLETED", "CLOSED", "CANCELLED"];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export declare const REVIEW_ACTIONS: readonly ["APPROVE", "REJECT", "RETURN"];
export type ReviewAction = (typeof REVIEW_ACTIONS)[number];
export declare const fundingAgencySchema: z.ZodObject<{
    name: z.ZodString;
    agencyType: z.ZodOptional<z.ZodEnum<["GOVERNMENT", "INDUSTRY", "UNIVERSITY", "FOUNDATION", "INTERNAL", "OTHER"]>>;
    contactName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    contactEmail: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    contactPhone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    name: string;
    agencyType?: "OTHER" | "GOVERNMENT" | "INTERNAL" | "UNIVERSITY" | "INDUSTRY" | "FOUNDATION" | undefined;
    contactName?: string | null | undefined;
    contactEmail?: string | null | undefined;
    contactPhone?: string | null | undefined;
}, {
    name: string;
    agencyType?: "OTHER" | "GOVERNMENT" | "INTERNAL" | "UNIVERSITY" | "INDUSTRY" | "FOUNDATION" | undefined;
    contactName?: string | null | undefined;
    contactEmail?: string | null | undefined;
    contactPhone?: string | null | undefined;
}>;
export declare const proposalTeamMemberSchema: z.ZodObject<{
    facultyId: z.ZodNumber;
    roleInProject: z.ZodEnum<["PI", "CO_PI", "CO_INVESTIGATOR", "TEAM_MEMBER"]>;
}, "strict", z.ZodTypeAny, {
    facultyId: number;
    roleInProject: "PI" | "CO_PI" | "CO_INVESTIGATOR" | "TEAM_MEMBER";
}, {
    facultyId: number;
    roleInProject: "PI" | "CO_PI" | "CO_INVESTIGATOR" | "TEAM_MEMBER";
}>;
export declare const proposalSchema: z.ZodEffects<z.ZodObject<{
    title: z.ZodString;
    projectType: z.ZodEnum<["SPONSORED_RESEARCH", "INTERNAL_RESEARCH", "SEED_GRANT", "CONSULTANCY", "INDUSTRY_PROJECT", "COLLABORATIVE_RESEARCH", "STUDENT_RESEARCH"]>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    fundingAgencyId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    requestedAmount: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    durationMonths: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    abstract: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    team: z.ZodArray<z.ZodObject<{
        facultyId: z.ZodNumber;
        roleInProject: z.ZodEnum<["PI", "CO_PI", "CO_INVESTIGATOR", "TEAM_MEMBER"]>;
    }, "strict", z.ZodTypeAny, {
        facultyId: number;
        roleInProject: "PI" | "CO_PI" | "CO_INVESTIGATOR" | "TEAM_MEMBER";
    }, {
        facultyId: number;
        roleInProject: "PI" | "CO_PI" | "CO_INVESTIGATOR" | "TEAM_MEMBER";
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    title: string;
    projectType: "CONSULTANCY" | "INDUSTRY_PROJECT" | "SPONSORED_RESEARCH" | "INTERNAL_RESEARCH" | "SEED_GRANT" | "COLLABORATIVE_RESEARCH" | "STUDENT_RESEARCH";
    team: {
        facultyId: number;
        roleInProject: "PI" | "CO_PI" | "CO_INVESTIGATOR" | "TEAM_MEMBER";
    }[];
    departmentId?: number | null | undefined;
    requestedAmount?: number | null | undefined;
    fundingAgencyId?: number | null | undefined;
    durationMonths?: number | null | undefined;
    abstract?: string | null | undefined;
}, {
    title: string;
    projectType: "CONSULTANCY" | "INDUSTRY_PROJECT" | "SPONSORED_RESEARCH" | "INTERNAL_RESEARCH" | "SEED_GRANT" | "COLLABORATIVE_RESEARCH" | "STUDENT_RESEARCH";
    team: {
        facultyId: number;
        roleInProject: "PI" | "CO_PI" | "CO_INVESTIGATOR" | "TEAM_MEMBER";
    }[];
    departmentId?: number | null | undefined;
    requestedAmount?: number | null | undefined;
    fundingAgencyId?: number | null | undefined;
    durationMonths?: number | null | undefined;
    abstract?: string | null | undefined;
}>, {
    title: string;
    projectType: "CONSULTANCY" | "INDUSTRY_PROJECT" | "SPONSORED_RESEARCH" | "INTERNAL_RESEARCH" | "SEED_GRANT" | "COLLABORATIVE_RESEARCH" | "STUDENT_RESEARCH";
    team: {
        facultyId: number;
        roleInProject: "PI" | "CO_PI" | "CO_INVESTIGATOR" | "TEAM_MEMBER";
    }[];
    departmentId?: number | null | undefined;
    requestedAmount?: number | null | undefined;
    fundingAgencyId?: number | null | undefined;
    durationMonths?: number | null | undefined;
    abstract?: string | null | undefined;
}, {
    title: string;
    projectType: "CONSULTANCY" | "INDUSTRY_PROJECT" | "SPONSORED_RESEARCH" | "INTERNAL_RESEARCH" | "SEED_GRANT" | "COLLABORATIVE_RESEARCH" | "STUDENT_RESEARCH";
    team: {
        facultyId: number;
        roleInProject: "PI" | "CO_PI" | "CO_INVESTIGATOR" | "TEAM_MEMBER";
    }[];
    departmentId?: number | null | undefined;
    requestedAmount?: number | null | undefined;
    fundingAgencyId?: number | null | undefined;
    durationMonths?: number | null | undefined;
    abstract?: string | null | undefined;
}>;
export declare const awardSchema: z.ZodObject<{
    sanctionedAmount: z.ZodNumber;
    sanctionReference: z.ZodString;
    sanctionDate: z.ZodString;
    fundingAgencyId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    sanctionedAmount: number;
    sanctionReference: string;
    sanctionDate: string;
    fundingAgencyId?: number | null | undefined;
}, {
    sanctionedAmount: number;
    sanctionReference: string;
    sanctionDate: string;
    fundingAgencyId?: number | null | undefined;
}>;
export declare const utilizationEntrySchema: z.ZodObject<{
    amount: z.ZodNumber;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    recordedAt: z.ZodString;
}, "strict", z.ZodTypeAny, {
    amount: number;
    recordedAt: string;
    description?: string | null | undefined;
}, {
    amount: number;
    recordedAt: string;
    description?: string | null | undefined;
}>;
export declare const projectClosureSchema: z.ZodObject<{
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    reason?: string | null | undefined;
}, {
    reason?: string | null | undefined;
}>;
export declare const reviewSchema: z.ZodObject<{
    action: z.ZodEnum<["APPROVE", "REJECT", "RETURN"]>;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    action: "RETURN" | "APPROVE" | "REJECT";
    remarks?: string | null | undefined;
}, {
    action: "RETURN" | "APPROVE" | "REJECT";
    remarks?: string | null | undefined;
}>;
export declare const withdrawSchema: z.ZodObject<{
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    reason?: string | null | undefined;
}, {
    reason?: string | null | undefined;
}>;
