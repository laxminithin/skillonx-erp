/**
 * Succession Planning & Talent Management — enums, state machines and schemas.
 */
import { z } from 'zod';
export declare const CRITICALITY: readonly ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export declare const RISK: readonly ["LOW", "MEDIUM", "HIGH"];
export declare const BAND: readonly ["LOW", "MEDIUM", "HIGH"];
export declare const READINESS: readonly ["READY_NOW", "READY_1_YEAR", "READY_2_YEARS", "DEVELOPING", "NOT_READY"];
export declare const NOMINATION_SOURCES: readonly ["HR", "HOD", "PRINCIPAL", "MANAGER"];
export declare const DEV_ACTION_TYPES: readonly ["TRAINING", "MENTORING", "SHADOWING", "STRETCH", "CERTIFICATION", "LEADERSHIP_PROGRAM", "CUSTOM"];
export declare const CANDIDATE_STATUSES: readonly ["DRAFT", "NOMINATED", "UNDER_REVIEW", "APPROVED", "REJECTED", "WITHDRAWN"];
export declare const CANDIDATE_TRANSITIONS: Record<string, string[]>;
export declare const DEV_ACTION_STATUSES: readonly ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
export declare const EVENT_STATUSES: readonly ["OPEN", "UNDER_REVIEW", "DECIDED", "CLOSED", "CANCELLED"];
/** Employment statuses that may hold an ACTIVE successor nomination. */
export declare const NOMINATION_ELIGIBLE_STATUSES: readonly ["ACTIVE", "PROBATION", "CONFIRMED", "ON_LONG_LEAVE"];
/** Statuses that force a successor out of active standing (terminal/ineligible). */
export declare const INELIGIBLE_STATUSES: readonly ["SEPARATED", "RETIRED", "TERMINATED", "INACTIVE", "DRAFT", "PRE_JOINING"];
export declare function canTransition(map: Record<string, string[]>, from: string, to: string): boolean;
export declare const criticalRoleSchema: z.ZodObject<{
    code: z.ZodString;
    roleTitle: z.ZodString;
    departmentId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    designationId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    incumbentEmployeeId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    criticality: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>>;
    impactNotes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    vacancyRisk: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>;
    exitRisk: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>;
    replacementUrgency: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>;
    requiredCompetencies: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>;
    minExperienceYears: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    minReadiness: z.ZodOptional<z.ZodNullable<z.ZodEnum<["READY_NOW", "READY_1_YEAR", "READY_2_YEARS", "DEVELOPING", "NOT_READY"]>>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    effectiveFrom: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    effectiveTo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    roleTitle: string;
    criticality: "MEDIUM" | "HIGH" | "LOW" | "CRITICAL";
    vacancyRisk: "MEDIUM" | "HIGH" | "LOW";
    exitRisk: "MEDIUM" | "HIGH" | "LOW";
    replacementUrgency: "MEDIUM" | "HIGH" | "LOW";
    departmentId?: number | null | undefined;
    designationId?: number | null | undefined;
    notes?: string | null | undefined;
    effectiveFrom?: string | null | undefined;
    effectiveTo?: string | null | undefined;
    incumbentEmployeeId?: number | null | undefined;
    impactNotes?: string | null | undefined;
    requiredCompetencies?: string[] | null | undefined;
    minExperienceYears?: number | null | undefined;
    minReadiness?: "READY_NOW" | "READY_1_YEAR" | "READY_2_YEARS" | "DEVELOPING" | "NOT_READY" | null | undefined;
}, {
    code: string;
    roleTitle: string;
    departmentId?: number | null | undefined;
    designationId?: number | null | undefined;
    notes?: string | null | undefined;
    effectiveFrom?: string | null | undefined;
    effectiveTo?: string | null | undefined;
    incumbentEmployeeId?: number | null | undefined;
    criticality?: "MEDIUM" | "HIGH" | "LOW" | "CRITICAL" | undefined;
    impactNotes?: string | null | undefined;
    vacancyRisk?: "MEDIUM" | "HIGH" | "LOW" | undefined;
    exitRisk?: "MEDIUM" | "HIGH" | "LOW" | undefined;
    replacementUrgency?: "MEDIUM" | "HIGH" | "LOW" | undefined;
    requiredCompetencies?: string[] | null | undefined;
    minExperienceYears?: number | null | undefined;
    minReadiness?: "READY_NOW" | "READY_1_YEAR" | "READY_2_YEARS" | "DEVELOPING" | "NOT_READY" | null | undefined;
}>;
export declare const criticalRoleUpdateSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    roleTitle: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    designationId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    incumbentEmployeeId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    criticality: z.ZodOptional<z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>>>;
    impactNotes: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    vacancyRisk: z.ZodOptional<z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>>;
    exitRisk: z.ZodOptional<z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>>;
    replacementUrgency: z.ZodOptional<z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>>;
    requiredCompetencies: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>>;
    minExperienceYears: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    minReadiness: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodEnum<["READY_NOW", "READY_1_YEAR", "READY_2_YEARS", "DEVELOPING", "NOT_READY"]>>>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    effectiveFrom: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    effectiveTo: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    departmentId?: number | null | undefined;
    designationId?: number | null | undefined;
    notes?: string | null | undefined;
    effectiveFrom?: string | null | undefined;
    effectiveTo?: string | null | undefined;
    roleTitle?: string | undefined;
    incumbentEmployeeId?: number | null | undefined;
    criticality?: "MEDIUM" | "HIGH" | "LOW" | "CRITICAL" | undefined;
    impactNotes?: string | null | undefined;
    vacancyRisk?: "MEDIUM" | "HIGH" | "LOW" | undefined;
    exitRisk?: "MEDIUM" | "HIGH" | "LOW" | undefined;
    replacementUrgency?: "MEDIUM" | "HIGH" | "LOW" | undefined;
    requiredCompetencies?: string[] | null | undefined;
    minExperienceYears?: number | null | undefined;
    minReadiness?: "READY_NOW" | "READY_1_YEAR" | "READY_2_YEARS" | "DEVELOPING" | "NOT_READY" | null | undefined;
}, {
    code?: string | undefined;
    departmentId?: number | null | undefined;
    designationId?: number | null | undefined;
    notes?: string | null | undefined;
    effectiveFrom?: string | null | undefined;
    effectiveTo?: string | null | undefined;
    roleTitle?: string | undefined;
    incumbentEmployeeId?: number | null | undefined;
    criticality?: "MEDIUM" | "HIGH" | "LOW" | "CRITICAL" | undefined;
    impactNotes?: string | null | undefined;
    vacancyRisk?: "MEDIUM" | "HIGH" | "LOW" | undefined;
    exitRisk?: "MEDIUM" | "HIGH" | "LOW" | undefined;
    replacementUrgency?: "MEDIUM" | "HIGH" | "LOW" | undefined;
    requiredCompetencies?: string[] | null | undefined;
    minExperienceYears?: number | null | undefined;
    minReadiness?: "READY_NOW" | "READY_1_YEAR" | "READY_2_YEARS" | "DEVELOPING" | "NOT_READY" | null | undefined;
}>;
export declare const assessmentSchema: z.ZodObject<{
    employeeId: z.ZodNumber;
    assessmentPeriod: z.ZodString;
    performanceBand: z.ZodOptional<z.ZodNullable<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>>;
    potentialBand: z.ZodOptional<z.ZodNullable<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>>;
    overallPotential: z.ZodOptional<z.ZodNullable<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>>;
    readiness: z.ZodOptional<z.ZodNullable<z.ZodEnum<["READY_NOW", "READY_1_YEAR", "READY_2_YEARS", "DEVELOPING", "NOT_READY"]>>>;
    leadershipCapability: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    functionalCapability: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    institutionalKnowledge: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    mobility: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    retentionConcern: z.ZodOptional<z.ZodNullable<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>>;
    developmentSummary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    comments: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    classificationSource: z.ZodDefault<z.ZodEnum<["APPRAISAL", "ASSESSMENT", "RULE"]>>;
}, "strip", z.ZodTypeAny, {
    employeeId: number;
    assessmentPeriod: string;
    classificationSource: "ASSESSMENT" | "APPRAISAL" | "RULE";
    comments?: string | null | undefined;
    performanceBand?: "MEDIUM" | "HIGH" | "LOW" | null | undefined;
    potentialBand?: "MEDIUM" | "HIGH" | "LOW" | null | undefined;
    overallPotential?: "MEDIUM" | "HIGH" | "LOW" | null | undefined;
    readiness?: "READY_NOW" | "READY_1_YEAR" | "READY_2_YEARS" | "DEVELOPING" | "NOT_READY" | null | undefined;
    leadershipCapability?: number | null | undefined;
    functionalCapability?: number | null | undefined;
    institutionalKnowledge?: number | null | undefined;
    mobility?: string | null | undefined;
    retentionConcern?: "MEDIUM" | "HIGH" | "LOW" | null | undefined;
    developmentSummary?: string | null | undefined;
}, {
    employeeId: number;
    assessmentPeriod: string;
    comments?: string | null | undefined;
    performanceBand?: "MEDIUM" | "HIGH" | "LOW" | null | undefined;
    potentialBand?: "MEDIUM" | "HIGH" | "LOW" | null | undefined;
    overallPotential?: "MEDIUM" | "HIGH" | "LOW" | null | undefined;
    readiness?: "READY_NOW" | "READY_1_YEAR" | "READY_2_YEARS" | "DEVELOPING" | "NOT_READY" | null | undefined;
    leadershipCapability?: number | null | undefined;
    functionalCapability?: number | null | undefined;
    institutionalKnowledge?: number | null | undefined;
    mobility?: string | null | undefined;
    retentionConcern?: "MEDIUM" | "HIGH" | "LOW" | null | undefined;
    developmentSummary?: string | null | undefined;
    classificationSource?: "ASSESSMENT" | "APPRAISAL" | "RULE" | undefined;
}>;
export declare const assessmentUpdateSchema: z.ZodObject<Omit<{
    employeeId: z.ZodOptional<z.ZodNumber>;
    assessmentPeriod: z.ZodOptional<z.ZodString>;
    performanceBand: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>>>;
    potentialBand: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>>>;
    overallPotential: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>>>;
    readiness: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodEnum<["READY_NOW", "READY_1_YEAR", "READY_2_YEARS", "DEVELOPING", "NOT_READY"]>>>>;
    leadershipCapability: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    functionalCapability: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    institutionalKnowledge: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    mobility: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    retentionConcern: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>>>;
    developmentSummary: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    comments: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    classificationSource: z.ZodOptional<z.ZodDefault<z.ZodEnum<["APPRAISAL", "ASSESSMENT", "RULE"]>>>;
}, "employeeId" | "assessmentPeriod">, "strip", z.ZodTypeAny, {
    comments?: string | null | undefined;
    performanceBand?: "MEDIUM" | "HIGH" | "LOW" | null | undefined;
    potentialBand?: "MEDIUM" | "HIGH" | "LOW" | null | undefined;
    overallPotential?: "MEDIUM" | "HIGH" | "LOW" | null | undefined;
    readiness?: "READY_NOW" | "READY_1_YEAR" | "READY_2_YEARS" | "DEVELOPING" | "NOT_READY" | null | undefined;
    leadershipCapability?: number | null | undefined;
    functionalCapability?: number | null | undefined;
    institutionalKnowledge?: number | null | undefined;
    mobility?: string | null | undefined;
    retentionConcern?: "MEDIUM" | "HIGH" | "LOW" | null | undefined;
    developmentSummary?: string | null | undefined;
    classificationSource?: "ASSESSMENT" | "APPRAISAL" | "RULE" | undefined;
}, {
    comments?: string | null | undefined;
    performanceBand?: "MEDIUM" | "HIGH" | "LOW" | null | undefined;
    potentialBand?: "MEDIUM" | "HIGH" | "LOW" | null | undefined;
    overallPotential?: "MEDIUM" | "HIGH" | "LOW" | null | undefined;
    readiness?: "READY_NOW" | "READY_1_YEAR" | "READY_2_YEARS" | "DEVELOPING" | "NOT_READY" | null | undefined;
    leadershipCapability?: number | null | undefined;
    functionalCapability?: number | null | undefined;
    institutionalKnowledge?: number | null | undefined;
    mobility?: string | null | undefined;
    retentionConcern?: "MEDIUM" | "HIGH" | "LOW" | null | undefined;
    developmentSummary?: string | null | undefined;
    classificationSource?: "ASSESSMENT" | "APPRAISAL" | "RULE" | undefined;
}>;
export declare const poolSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    departmentId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    eligibilityCriteria: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    departmentId?: number | null | undefined;
    description?: string | null | undefined;
    eligibilityCriteria?: string | null | undefined;
}, {
    name: string;
    departmentId?: number | null | undefined;
    description?: string | null | undefined;
    eligibilityCriteria?: string | null | undefined;
}>;
export declare const poolMemberSchema: z.ZodObject<{
    employeeId: z.ZodNumber;
    entryReason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    employeeId: number;
    entryReason?: string | null | undefined;
}, {
    employeeId: number;
    entryReason?: string | null | undefined;
}>;
export declare const nominateSchema: z.ZodObject<{
    criticalRoleId: z.ZodNumber;
    employeeId: z.ZodNumber;
    readiness: z.ZodDefault<z.ZodEnum<["READY_NOW", "READY_1_YEAR", "READY_2_YEARS", "DEVELOPING", "NOT_READY"]>>;
    rank: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    strengths: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    developmentGaps: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    employeeId: number;
    readiness: "READY_NOW" | "READY_1_YEAR" | "READY_2_YEARS" | "DEVELOPING" | "NOT_READY";
    criticalRoleId: number;
    rank?: number | null | undefined;
    strengths?: string | null | undefined;
    developmentGaps?: string | null | undefined;
}, {
    employeeId: number;
    criticalRoleId: number;
    rank?: number | null | undefined;
    readiness?: "READY_NOW" | "READY_1_YEAR" | "READY_2_YEARS" | "DEVELOPING" | "NOT_READY" | undefined;
    strengths?: string | null | undefined;
    developmentGaps?: string | null | undefined;
}>;
export declare const candidateDecisionSchema: z.ZodObject<{
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    remarks?: string | undefined;
}, {
    remarks?: string | undefined;
}>;
export declare const readinessReviewSchema: z.ZodObject<{
    newReadiness: z.ZodEnum<["READY_NOW", "READY_1_YEAR", "READY_2_YEARS", "DEVELOPING", "NOT_READY"]>;
    developmentGaps: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    comments: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    newReadiness: "READY_NOW" | "READY_1_YEAR" | "READY_2_YEARS" | "DEVELOPING" | "NOT_READY";
    comments?: string | null | undefined;
    developmentGaps?: string | null | undefined;
}, {
    newReadiness: "READY_NOW" | "READY_1_YEAR" | "READY_2_YEARS" | "DEVELOPING" | "NOT_READY";
    comments?: string | null | undefined;
    developmentGaps?: string | null | undefined;
}>;
export declare const devActionSchema: z.ZodObject<{
    employeeId: z.ZodNumber;
    candidateId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    criticalRoleId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    actionType: z.ZodEnum<["TRAINING", "MENTORING", "SHADOWING", "STRETCH", "CERTIFICATION", "LEADERSHIP_PROGRAM", "CUSTOM"]>;
    description: z.ZodString;
    mentorEmployeeId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    linkedLdProgramId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    employeeId: number;
    actionType: "TRAINING" | "CUSTOM" | "CERTIFICATION" | "MENTORING" | "SHADOWING" | "STRETCH" | "LEADERSHIP_PROGRAM";
    dueDate?: string | null | undefined;
    candidateId?: number | null | undefined;
    criticalRoleId?: number | null | undefined;
    mentorEmployeeId?: number | null | undefined;
    linkedLdProgramId?: number | null | undefined;
}, {
    description: string;
    employeeId: number;
    actionType: "TRAINING" | "CUSTOM" | "CERTIFICATION" | "MENTORING" | "SHADOWING" | "STRETCH" | "LEADERSHIP_PROGRAM";
    dueDate?: string | null | undefined;
    candidateId?: number | null | undefined;
    criticalRoleId?: number | null | undefined;
    mentorEmployeeId?: number | null | undefined;
    linkedLdProgramId?: number | null | undefined;
}>;
export declare const devActionStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"]>;
    completionEvidence: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "COMPLETED" | "CANCELLED" | "IN_PROGRESS" | "OPEN";
    completionEvidence?: string | null | undefined;
}, {
    status: "COMPLETED" | "CANCELLED" | "IN_PROGRESS" | "OPEN";
    completionEvidence?: string | null | undefined;
}>;
export declare const eventSchema: z.ZodObject<{
    criticalRoleId: z.ZodNumber;
    reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    criticalRoleId: number;
    reason?: string | null | undefined;
}, {
    criticalRoleId: number;
    reason?: string | null | undefined;
}>;
export declare const eventDecisionSchema: z.ZodObject<{
    selectedCandidateId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    selectedEmployeeId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    decisionNotes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    effectiveDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    effectiveDate?: string | null | undefined;
    selectedCandidateId?: number | null | undefined;
    selectedEmployeeId?: number | null | undefined;
    decisionNotes?: string | null | undefined;
}, {
    effectiveDate?: string | null | undefined;
    selectedCandidateId?: number | null | undefined;
    selectedEmployeeId?: number | null | undefined;
    decisionNotes?: string | null | undefined;
}>;
