import type { MappingKind } from './types.js';
import type { DomainFlags } from './academicMappingTypes.js';
export type MatrixTarget = {
    id: number;
    code: string;
    shortTitle?: string | null;
    officialStatement?: string | null;
    number?: number;
};
export type MatrixGroup = {
    type: MappingKind;
    label: string;
    colSpan: number;
    targets: MatrixTarget[];
};
export type MatrixColumn = MatrixTarget & {
    domain: MappingKind;
};
/**
 * Build ordered column groups for ONE combined academic mapping matrix.
 * SDG targets should already be filtered to relevant (or all-17) by the caller.
 */
export declare function buildCombinedMatrixGroups(input: {
    flags: DomainFlags;
    programOutcomes?: MatrixTarget[];
    programSpecificOutcomes?: MatrixTarget[];
    sdgs?: MatrixTarget[];
}): MatrixGroup[];
/** Flatten groups into ordered columns with domain tags (one row of cells). */
export declare function flattenMatrixColumns(groups: MatrixGroup[]): MatrixColumn[];
/**
 * Relevant SDGs = those with at least one active 1/2/3 relationship.
 * Falls back to provided relevantIds when no active cells yet.
 */
export declare function filterRelevantSdgs<T extends {
    id: number;
}>(allSdgs: T[], options: {
    showAll: boolean;
    relevantIds?: number[];
    activeSdgIds?: number[];
}): T[];
export declare function totalGroupColSpan(groups: MatrixGroup[]): number;
