export type ComponentColumn = {
    assessmentComponentId: string;
    displayName: string;
    officialMaxMarks: number | null;
    includeInMatrix?: boolean;
};
export type CoRowInput = {
    coCode: string;
    currentMarksDistribution: number | null;
    currentEvaluationPercent: number | null;
};
export type CellInput = {
    coCode: string;
    assessmentComponentId: string;
    currentValue: number | null;
    masterValue: number | null;
    changeJustification?: string | null;
    lecturerEditable?: boolean;
};
export type ValidationIssue = {
    code: string;
    severity: 'error' | 'warning';
    message: string;
    assessmentComponentId?: string;
    coCode?: string;
};
export type ValidationResult = {
    okForFinalize: boolean;
    componentTotals: Array<{
        assessmentComponentId: string;
        displayName: string;
        allocated: number;
        expected: number | null;
        delta: number | null;
        status: 'valid' | 'under' | 'over' | 'unknown';
    }>;
    evaluationPercentTotal: number;
    evaluationPercentStatus: 'valid' | 'under' | 'over';
    allocatedMarks: number;
    expectedMarks: number | null;
    modifiedCellCount: number;
    missingJustifications: Array<{
        coCode: string;
        assessmentComponentId: string;
    }>;
    issues: ValidationIssue[];
};
export declare function computeMarksDistribution(cells: CellInput[], coCode: string): number;
export declare function validateEvaluationMatrix(input: {
    components: ComponentColumn[];
    cos: CoRowInput[];
    cells: CellInput[];
    allowUnderAllocation?: boolean;
}): ValidationResult;
