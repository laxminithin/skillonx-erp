export type EvidenceItem = {
    code: string;
    label: string;
    required: boolean;
    satisfied: boolean;
    autoLinked?: boolean;
    sourceKind?: string | null;
    sourceId?: number | null;
    optional?: boolean;
};
export type EvidenceCompleteness = {
    requiredTotal: number;
    requiredSatisfied: number;
    optionalSatisfied: number;
    optionalTotal: number;
    percent: number;
    complete: boolean;
    items: EvidenceItem[];
};
/** Deterministic: required satisfied / required total. Optional items never reduce completeness. */
export declare function evidenceCompleteness(items: EvidenceItem[]): EvidenceCompleteness;
