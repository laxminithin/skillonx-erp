import type { AttentionLevel, RiskDimension } from './types.js';
export type RiskConfig = {
    attendanceAttentionPct: number;
    attendanceHighPct: number;
    cieAttentionPct: number;
    assignmentMissAttention: number;
    assignmentMissHigh: number;
    backlogWatch: number;
    backlogAttention: number;
    backlogHigh: number;
    followupOverdueDays: number;
};
export declare const DEFAULT_RISK_CONFIG: RiskConfig;
export type DimensionResult = {
    dimension: RiskDimension;
    level: AttentionLevel;
    value: number | null;
    reason: string | null;
};
export type RiskResult = {
    studentId: number;
    attention: AttentionLevel;
    score: number;
    dimensions: DimensionResult[];
    reasons: string[];
    signals: {
        attendancePct: number | null;
        ciePct: number | null;
        backlogs: number;
        overdueAssignments: number;
        overdueFollowUps: number;
    };
};
/** Load per-college risk configuration, merged with attendance policy + defaults. */
export declare function getRiskConfig(collegeId: number): Promise<RiskConfig>;
/**
 * Batched, rule-based, fully explainable risk computation for a set of students.
 * Reuses attendance, CIE (assessment sheets), examination backlogs, LMS
 * assignments, and mentoring follow-ups. No opaque scoring — every flag carries
 * a human-readable reason tied to the underlying data.
 */
export declare function computeRiskForStudents(collegeId: number, studentIds: number[], config?: RiskConfig): Promise<Map<number, RiskResult>>;
export declare function computeRisk(collegeId: number, studentId: number): Promise<RiskResult>;
