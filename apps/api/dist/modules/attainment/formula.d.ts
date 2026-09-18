import { type AcademicPolicy, type AssessmentSourceInput, type CoStatus, type CoStatusInput, type MappingCell, type StudentMarkStatus, type WeightedPart, type WeightedResult } from './types.js';
export declare function round4(n: number): number;
export declare function round2(n: number): number;
export declare function percentToLevel(percent: number, policy: AcademicPolicy): number;
export declare function average(values: number[]): number | null;
export declare function weightedAverage(parts: WeightedPart[]): WeightedResult;
export declare function classifyCoStatus(input: CoStatusInput, policy: AcademicPolicy): CoStatus;
export declare function gap(actual: number | null, target: number): number | null;
export declare function improvementDelta(revised: number | null, previous: number | null): number | null;
export declare function isEvaluatedStatus(status: StudentMarkStatus): boolean;
export type StudentCoScore = {
    studentKey: string;
    coCode: string;
    obtained: number;
    maxMarks: number;
    percent: number;
    level: number;
    belowThreshold: boolean;
};
export type SourceCoAttainment = {
    coCode: string;
    attainment: number | null;
    studentCount: number;
    weakStudentCount: number;
    weakStudentRatio: number;
    availableMarks: number;
    questionCount: number;
    studentScores: StudentCoScore[];
    weakQuestions: Array<{
        questionKey: string;
        averagePercent: number;
        bloomLevel?: string | null;
        difficulty?: string | null;
        topic?: string | null;
    }>;
    bloomWeakness: Array<{
        bloomLevel: string;
        averagePercent: number;
    }>;
    difficultyWeakness: Array<{
        difficulty: string;
        averagePercent: number;
    }>;
    topicWeakness: Array<{
        topic: string;
        averagePercent: number;
    }>;
};
export declare function computeSourceCoAttainment(source: AssessmentSourceInput, policy: AcademicPolicy): SourceCoAttainment[];
export declare function combineDirect(cie: number | null, see: number | null, cieWeight: number, seeWeight: number): WeightedResult;
export declare function combineFinal(direct: number | null, indirect: number | null, policy: AcademicPolicy): WeightedResult & {
    indirectMissing: boolean;
};
export type OutcomeRollup = {
    outcomeCode: string;
    attainment: number | null;
    contributing: Array<{
        coCode: string;
        strength: number;
        coAttainment: number;
        weighted: number;
    }>;
    formula: string;
};
export declare function rollupOutcomes(coAttainments: Array<{
    coCode: string;
    attainment: number | null;
}>, mappings: MappingCell[]): OutcomeRollup[];
export declare function courseHealthPercent(statuses: CoStatus[]): number | null;
