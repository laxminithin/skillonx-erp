export type QualityInput = {
    courseOutcomes: Array<{
        id: number;
        code: string;
        isCurrent?: boolean;
        status?: string;
    }>;
    programOutcomes: Array<{
        id: number;
        code: string;
        isCurrent?: boolean;
        status?: string;
        officialTextPending?: boolean;
    }>;
    items: Array<{
        courseOutcomeId: number;
        programOutcomeId: number;
        strength: number | null;
        justification?: string | null;
    }>;
};
export type QualityFlag = {
    code: string;
    severity: 'info' | 'warning';
    message: string;
    courseOutcomeId?: number;
    programOutcomeId?: number;
    programSpecificOutcomeId?: number;
    sdgId?: number;
};
export type MappingSummary = {
    courseOutcomeCount: number;
    programOutcomeCount: number;
    mappedRelationships: number;
    high: number;
    moderate: number;
    low: number;
    missingJustifications: number;
    possibleCells: number;
    mappedPercent: number;
    justificationPercent: number;
};
export type PoCoverageRow = {
    programOutcomeId: number;
    code: string;
    contributingCos: number;
    high: number;
    moderate: number;
    low: number;
    score: number;
};
export declare function summarizeMapping(input: QualityInput): MappingSummary;
export declare function poCoverage(input: QualityInput): PoCoverageRow[];
export declare function detectQualityIssues(input: QualityInput): QualityFlag[];
export declare function detectPsoQualityIssues(input: QualityInput): QualityFlag[];
export declare function detectSdgQualityIssues(input: QualityInput): QualityFlag[];
export declare function overallMappingLabel(statuses: string[]): "Not Started" | "Approved" | "Review" | "In Progress";
