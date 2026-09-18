import type { AcademicPolicy, AssessmentSourceInput, SeeMethod } from './types.js';
import { classifyCoStatus, rollupOutcomes, type SourceCoAttainment } from './formula.js';
import { decideSeeMethod, paperCoWeights } from './see.js';
import { recommendPlan } from './recommend.js';
export type CalculatedCo = {
    coCode: string;
    statement: string | null;
    courseOutcomeId: number | null;
    target: number;
    cie: number | null;
    see: number | null;
    direct: number | null;
    indirect: number | null;
    final: number | null;
    gap: number | null;
    status: ReturnType<typeof classifyCoStatus>;
    studentCount: number;
    weakStudentCount: number;
    weakStudentRatio: number;
    formula: {
        cie?: string;
        see?: string;
        direct: string;
        final: string;
    };
    sources: Array<{
        sourceKind: string;
        sourceId: string | number;
        sourceLabel: string;
        category: string;
        weight: number;
        attainment: number | null;
        studentCount: number;
        diagnostics: SourceCoAttainment | null;
    }>;
    students: Array<{
        studentKey: string;
        usn?: string;
        belowThreshold: boolean;
        level: number | null;
    }>;
    recommendation: ReturnType<typeof recommendPlan>;
};
export type CalculatedRun = {
    policy: AcademicPolicy;
    seeDecision: ReturnType<typeof decideSeeMethod>;
    seeWeights: ReturnType<typeof paperCoWeights>;
    cieWeightUsed: number;
    seeWeightUsed: number;
    cos: CalculatedCo[];
    po: ReturnType<typeof rollupOutcomes>;
    pso: ReturnType<typeof rollupOutcomes>;
    structure: {
        cieWeight: number;
        seeWeight: number;
        note: string;
    };
};
export declare function calculateRun(input: {
    policyRaw: unknown;
    outcomes: Array<{
        id: number;
        co_code: string;
        statement?: string | null;
    }>;
    cieSources: AssessmentSourceInput[];
    seeSources: AssessmentSourceInput[];
    indirectSources: AssessmentSourceInput[];
    seePaperQuestions: Array<{
        questionKey: string;
        coCode: string | null;
        maxMarks: number;
    }>;
    preferredSeeMethod?: SeeMethod | null;
    cieWeight: number | null;
    seeWeight: number | null;
    components: Array<{
        code: string;
        name: string;
        weightage: number | null;
    }>;
    poMappings: Array<{
        coCode: string;
        outcomeCode: string;
        strength: number;
    }>;
    psoMappings: Array<{
        coCode: string;
        outcomeCode: string;
        strength: number;
    }>;
}): CalculatedRun;
