import { type MappingKind } from './types.js';
/** Stable internal enum — never use display labels for logic. */
export declare const ACADEMIC_MAPPING_TYPES: readonly ["CO_PO", "CO_PSO", "CO_SDG", "CO_PO_PSO", "CO_PO_SDG", "CO_PO_PSO_SDG"];
export type AcademicMappingType = (typeof ACADEMIC_MAPPING_TYPES)[number];
export declare const ACADEMIC_MAPPING_TYPE_LABELS: Record<AcademicMappingType, string>;
export type DomainFlags = {
    po: boolean;
    pso: boolean;
    sdg: boolean;
};
export declare function isAcademicMappingType(value: unknown): value is AcademicMappingType;
export declare function domainsFromType(type: AcademicMappingType): DomainFlags;
export declare function typeFromDomains(flags: DomainFlags): AcademicMappingType | null;
/** Legacy single-kind → academic mapping type. */
export declare function typeFromLegacyKind(kind: MappingKind): AcademicMappingType;
/** Primary legacy kind for DB mapping_kind column (compat with old filters). */
export declare function primaryKindFromType(type: AcademicMappingType): MappingKind;
export declare function domainsFromTypeOrKind(mappingType: string | null | undefined, mappingKind: string | null | undefined): DomainFlags;
export declare function labelForType(type: AcademicMappingType): string;
/** Is `next` a strict or equal superset of `current` domains? */
export declare function isDomainSuperset(current: DomainFlags, next: DomainFlags): boolean;
export declare function isStrictDomainUpgrade(current: DomainFlags, next: DomainFlags): boolean;
export type TypeAvailability = {
    type: AcademicMappingType;
    label: string;
    available: boolean;
    missing: string[];
};
/**
 * Given master readiness flags, which of the six mapping types can be generated.
 */
export declare function availableMappingTypes(ready: DomainFlags): TypeAvailability[];
export declare function domainKinds(type: AcademicMappingType): MappingKind[];
