import { QUALITY_SCORE_VERSION } from './types.js';
export type QualitySeverity = 'CRITICAL' | 'WARNING';
export type QualityCheck = {
    code: string;
    label: string;
    severity: QualitySeverity;
    passed: boolean;
    detail: string;
    weight: number;
};
export type QualityReport = {
    version: typeof QUALITY_SCORE_VERSION;
    okToPublish: boolean;
    score: number;
    criticalFailures: QualityCheck[];
    warnings: QualityCheck[];
    checks: QualityCheck[];
};
export type QualityPaperInput = {
    maxMarks: number;
    items: Array<{
        questionKey: string;
        questionText: string;
        maxMarks: number;
        primaryCo?: string | null;
        fingerprint?: string | null;
        bloomLevel?: string | null;
        difficulty?: string | null;
        module?: string | null;
        modelAnswer?: string | null;
        scheme?: Array<{
            maxMarks: number;
        }> | null;
        sourceExamYear?: number | null;
        orAlternative?: string | null;
    }>;
    courseCoCodes: string[];
    courseModules?: string[];
    recentYearExclusion?: number;
    requiredAnswerMarks?: number;
};
export declare function evaluatePaperQuality(input: QualityPaperInput): QualityReport;
