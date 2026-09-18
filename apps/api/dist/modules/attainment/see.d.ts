import type { AcademicPolicy, SeeMethod, SeePaperQuestion, StudentRow } from './types.js';
export type SeeCoWeight = {
    coCode: string;
    marks: number;
    weight: number;
};
export type SeeModeDecision = {
    method: SeeMethod;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    label: string;
    reason: string;
    estimated: boolean;
};
export declare function paperCoWeights(questions: SeePaperQuestion[]): SeeCoWeight[];
export declare function equalWeights(coCodes: string[]): SeeCoWeight[];
export declare function decideSeeMethod(input: {
    hasQuestionWiseSeeMarks: boolean;
    hasSeePaperWithCoMapping: boolean;
    preferred?: SeeMethod | null;
}): SeeModeDecision;
export type EstimatedSeeStudent = {
    studentKey: string;
    seePercent: number;
    coLevels: Record<string, number>;
};
/**
 * Paper-weighted / equal-weight estimate:
 * student overall SEE percent is applied uniformly to every CO that has exposure.
 * Paper weights are stored for audit (CO exposure of the paper) and do not
 * invent different per-CO scores from a single total mark.
 */
export declare function estimateSeeFromTotals(students: Array<StudentRow & {
    seePercent: number | null;
}>, weights: SeeCoWeight[], policy: AcademicPolicy): {
    classAttainment: Array<{
        coCode: string;
        attainment: number | null;
        studentCount: number;
    }>;
    students: EstimatedSeeStudent[];
};
export declare function seePercentFromTotals(awarded: number | null, max: number | null): number | null;
