import { isMappingKind, type MappingKind } from './types.js';

/** Stable internal enum — never use display labels for logic. */
export const ACADEMIC_MAPPING_TYPES = [
  'CO_PO',
  'CO_PSO',
  'CO_SDG',
  'CO_PO_PSO',
  'CO_PO_SDG',
  'CO_PO_PSO_SDG',
] as const;

export type AcademicMappingType = (typeof ACADEMIC_MAPPING_TYPES)[number];

export const ACADEMIC_MAPPING_TYPE_LABELS: Record<AcademicMappingType, string> = {
  CO_PO: 'CO–PO',
  CO_PSO: 'CO–PSO',
  CO_SDG: 'CO–SDG',
  CO_PO_PSO: 'CO–PO–PSO',
  CO_PO_SDG: 'CO–PO–SDG',
  CO_PO_PSO_SDG: 'CO–PO–PSO–SDG',
};

export type DomainFlags = { po: boolean; pso: boolean; sdg: boolean };

export function isAcademicMappingType(value: unknown): value is AcademicMappingType {
  return typeof value === 'string' && (ACADEMIC_MAPPING_TYPES as readonly string[]).includes(value);
}

export function domainsFromType(type: AcademicMappingType): DomainFlags {
  switch (type) {
    case 'CO_PO':
      return { po: true, pso: false, sdg: false };
    case 'CO_PSO':
      return { po: false, pso: true, sdg: false };
    case 'CO_SDG':
      return { po: false, pso: false, sdg: true };
    case 'CO_PO_PSO':
      return { po: true, pso: true, sdg: false };
    case 'CO_PO_SDG':
      return { po: true, pso: false, sdg: true };
    case 'CO_PO_PSO_SDG':
      return { po: true, pso: true, sdg: true };
    default:
      return { po: false, pso: false, sdg: false };
  }
}

export function typeFromDomains(flags: DomainFlags): AcademicMappingType | null {
  const { po, pso, sdg } = flags;
  if (po && pso && sdg) return 'CO_PO_PSO_SDG';
  if (po && pso && !sdg) return 'CO_PO_PSO';
  if (po && !pso && sdg) return 'CO_PO_SDG';
  if (po && !pso && !sdg) return 'CO_PO';
  if (!po && pso && !sdg) return 'CO_PSO';
  if (!po && !pso && sdg) return 'CO_SDG';
  return null;
}

/** Legacy single-kind → academic mapping type. */
export function typeFromLegacyKind(kind: MappingKind): AcademicMappingType {
  if (kind === 'PSO') return 'CO_PSO';
  if (kind === 'SDG') return 'CO_SDG';
  return 'CO_PO';
}

/** Primary legacy kind for DB mapping_kind column (compat with old filters). */
export function primaryKindFromType(type: AcademicMappingType): MappingKind {
  const d = domainsFromType(type);
  if (d.po) return 'PO';
  if (d.pso) return 'PSO';
  return 'SDG';
}

export function domainsFromTypeOrKind(
  mappingType: string | null | undefined,
  mappingKind: string | null | undefined,
): DomainFlags {
  if (isAcademicMappingType(mappingType)) return domainsFromType(mappingType);
  if (isMappingKind(mappingKind)) {
    return domainsFromType(typeFromLegacyKind(mappingKind));
  }
  return { po: true, pso: false, sdg: false };
}

export function labelForType(type: AcademicMappingType): string {
  return ACADEMIC_MAPPING_TYPE_LABELS[type];
}

/** Is `next` a strict or equal superset of `current` domains? */
export function isDomainSuperset(current: DomainFlags, next: DomainFlags): boolean {
  if (current.po && !next.po) return false;
  if (current.pso && !next.pso) return false;
  if (current.sdg && !next.sdg) return false;
  return true;
}

export function isStrictDomainUpgrade(current: DomainFlags, next: DomainFlags): boolean {
  if (!isDomainSuperset(current, next)) return false;
  return (
    (next.po && !current.po) || (next.pso && !current.pso) || (next.sdg && !current.sdg)
  );
}

export type TypeAvailability = {
  type: AcademicMappingType;
  label: string;
  available: boolean;
  missing: string[];
};

/**
 * Given master readiness flags, which of the six mapping types can be generated.
 */
export function availableMappingTypes(ready: DomainFlags): TypeAvailability[] {
  return ACADEMIC_MAPPING_TYPES.map((type) => {
    const need = domainsFromType(type);
    const missing: string[] = [];
    if (need.po && !ready.po) missing.push('CO–PO Master Mapping');
    if (need.pso && !ready.pso) missing.push('CO–PSO Master Mapping');
    if (need.sdg && !ready.sdg) missing.push('CO–SDG Master Mapping');
    return {
      type,
      label: ACADEMIC_MAPPING_TYPE_LABELS[type],
      available: missing.length === 0,
      missing,
    };
  });
}

export function domainKinds(type: AcademicMappingType): MappingKind[] {
  const d = domainsFromType(type);
  const kinds: MappingKind[] = [];
  if (d.po) kinds.push('PO');
  if (d.pso) kinds.push('PSO');
  if (d.sdg) kinds.push('SDG');
  return kinds;
}
