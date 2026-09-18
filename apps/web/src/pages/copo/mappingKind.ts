/** Stable academic mapping type enums — never use display labels for logic. */
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

/** @deprecated Prefer AcademicMappingType — kept for legacy route props. */
export type OperationalMappingKind = 'PO' | 'PSO' | 'SDG';

export type DomainFlags = { po: boolean; pso: boolean; sdg: boolean };

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

export function labelForType(type: AcademicMappingType | string | null | undefined) {
  if (type && type in ACADEMIC_MAPPING_TYPE_LABELS) {
    return ACADEMIC_MAPPING_TYPE_LABELS[type as AcademicMappingType];
  }
  return 'Academic Mapping';
}

export function kindLabel(kind: OperationalMappingKind) {
  if (kind === 'PSO') return 'CO–PSO';
  if (kind === 'SDG') return 'CO–SDG';
  return 'CO–PO';
}

export function kindTargetLabel(kind: OperationalMappingKind) {
  if (kind === 'PSO') return 'PSO';
  if (kind === 'SDG') return 'SDG';
  return 'PO';
}

export function kindBasePath(basePath: string, kind: OperationalMappingKind) {
  if (kind === 'PSO') return `${basePath}/pso`;
  if (kind === 'SDG') return `${basePath}/sdg`;
  return basePath;
}

/** Strip /pso or /sdg suffix so print/export routes stay under the root copo path. */
export function printBasePath(basePath: string) {
  return basePath.replace(/\/(pso|sdg)$/, '');
}

export function typeFromLegacyKind(kind: OperationalMappingKind): AcademicMappingType {
  if (kind === 'PSO') return 'CO_PSO';
  if (kind === 'SDG') return 'CO_SDG';
  return 'CO_PO';
}
