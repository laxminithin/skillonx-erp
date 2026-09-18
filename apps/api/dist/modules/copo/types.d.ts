export declare const SCHEME_STATUSES: readonly ["ACTIVE", "ARCHIVED"];
export declare const PROGRAM_STATUSES: readonly ["ACTIVE", "INACTIVE"];
export declare const SUBJECT_STATUSES: readonly ["ACTIVE", "INACTIVE", "ARCHIVED"];
export declare const OUTCOME_STATUSES: readonly ["ACTIVE", "ARCHIVED", "PENDING"];
export declare const COURSE_TYPES: readonly ["PCC", "PEC", "OEC", "IPCC", "LABORATORY", "PROJECT", "INTERNSHIP", "AEC", "HSMC", "BSC", "ESC", "NCMC", "OTHER"];
export declare const COURSE_TYPE_LABELS: Record<string, string>;
export declare const BLOOMS_LEVELS: readonly ["L1", "L2", "L3", "L4", "L5", "L6"];
export type BloomsLevel = (typeof BLOOMS_LEVELS)[number];
export declare const BLOOMS_LABELS: Record<BloomsLevel, string>;
export declare const MAPPING_STATUSES: readonly ["NOT_STARTED", "DRAFT", "SUBMITTED", "NEEDS_REVISION", "APPROVED", "ARCHIVED"];
export type MappingStatus = (typeof MAPPING_STATUSES)[number];
export declare const MAPPING_STATUS_LABELS: Record<MappingStatus, string>;
export declare const CORRELATION_STRENGTHS: readonly [1, 2, 3];
export type CorrelationStrength = (typeof CORRELATION_STRENGTHS)[number];
export declare const CORRELATION_LABELS: Record<CorrelationStrength, string>;
export declare const MAPPING_KINDS: readonly ["PO", "PSO", "SDG"];
export type MappingKind = (typeof MAPPING_KINDS)[number];
export declare const MAPPING_KIND_LABELS: Record<MappingKind, string>;
export declare const PENDING_PSO_STATEMENT = "Official / Approved PSO Data Pending";
export declare const PENDING_OFFICIAL_DATA = "Official Data Pending";
export declare function isMappingKind(value: unknown): value is MappingKind;
export declare const CORRELATION_SCALE: readonly [{
    readonly value: 3;
    readonly label: "High Correlation";
    readonly hint: "The CO strongly and directly contributes to achievement of the PO.";
}, {
    readonly value: 2;
    readonly label: "Moderate Correlation";
    readonly hint: "The CO meaningfully contributes to the PO.";
}, {
    readonly value: 1;
    readonly label: "Low Correlation";
    readonly hint: "The CO has a limited or supporting contribution.";
}, {
    readonly value: null;
    readonly label: "No Correlation";
    readonly hint: "No meaningful relationship exists.";
}];
export declare const EDITABLE_MAPPING_STATUSES: MappingStatus[];
export declare const LOCKED_MAPPING_STATUSES: MappingStatus[];
export declare function isValidCorrelation(value: unknown): value is CorrelationStrength;
export declare function cycleCorrelation(current: number | null): number | null;
export declare function bloomsLabel(level?: string | null): string | null;
