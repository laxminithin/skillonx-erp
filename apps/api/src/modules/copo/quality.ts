export type QualityInput = {
  courseOutcomes: Array<{ id: number; code: string; isCurrent?: boolean; status?: string }>;
  programOutcomes: Array<{ id: number; code: string; isCurrent?: boolean; status?: string; officialTextPending?: boolean }>;
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

function mappedItems(input: QualityInput) {
  return input.items.filter((item) => item.strength === 1 || item.strength === 2 || item.strength === 3);
}

export function summarizeMapping(input: QualityInput): MappingSummary {
  const mapped = mappedItems(input);
  const possible = input.courseOutcomes.length * input.programOutcomes.length;
  const missingJustifications = mapped.filter((item) => !String(item.justification || '').trim()).length;
  return {
    courseOutcomeCount: input.courseOutcomes.length,
    programOutcomeCount: input.programOutcomes.length,
    mappedRelationships: mapped.length,
    high: mapped.filter((i) => i.strength === 3).length,
    moderate: mapped.filter((i) => i.strength === 2).length,
    low: mapped.filter((i) => i.strength === 1).length,
    missingJustifications,
    possibleCells: possible,
    mappedPercent: possible === 0 ? 0 : Math.round((mapped.length / possible) * 100),
    justificationPercent:
      mapped.length === 0 ? 0 : Math.round(((mapped.length - missingJustifications) / mapped.length) * 100),
  };
}

export function poCoverage(input: QualityInput): PoCoverageRow[] {
  return input.programOutcomes.map((po) => {
    const rows = mappedItems(input).filter((item) => item.programOutcomeId === po.id);
    const high = rows.filter((r) => r.strength === 3).length;
    const moderate = rows.filter((r) => r.strength === 2).length;
    const low = rows.filter((r) => r.strength === 1).length;
    return {
      programOutcomeId: po.id,
      code: po.code,
      contributingCos: rows.length,
      high,
      moderate,
      low,
      score: high * 3 + moderate * 2 + low,
    };
  });
}

function missingJustificationFlags(
  mapped: ReturnType<typeof mappedItems>,
  courseOutcomes: QualityInput['courseOutcomes'],
  targets: Array<{ id: number; code: string }>,
  idOf: (item: { programOutcomeId: number }) => number,
  targetLabel: string,
): QualityFlag[] {
  const flags: QualityFlag[] = [];
  for (const item of mapped) {
    if (String(item.justification || '').trim()) continue;
    const co = courseOutcomes.find((c) => c.id === item.courseOutcomeId);
    const target = targets.find((t) => t.id === idOf(item));
    flags.push({
      code: 'MISSING_JUSTIFICATION',
      severity: 'warning',
      courseOutcomeId: item.courseOutcomeId,
      programOutcomeId: item.programOutcomeId,
      message: `${co?.code || 'CO'} → ${target?.code || targetLabel} is mapped without a justification.`,
    });
  }
  return flags;
}

export function detectQualityIssues(input: QualityInput): QualityFlag[] {
  const flags: QualityFlag[] = [];
  const mapped = mappedItems(input);
  const poCount = input.programOutcomes.length;

  for (const co of input.courseOutcomes) {
    const rows = mapped.filter((item) => item.courseOutcomeId === co.id);
    if (rows.length === 0) {
      flags.push({
        code: 'CO_UNMAPPED',
        severity: 'warning',
        courseOutcomeId: co.id,
        message: `${co.code} currently has no PO correlation.`,
      });
      continue;
    }
    if (poCount >= 6 && rows.length === poCount) {
      flags.push({
        code: 'OVER_MAPPING',
        severity: 'warning',
        courseOutcomeId: co.id,
        message: `Possible over-mapping detected for ${co.code}. Review whether this CO genuinely contributes to every selected PO.`,
      });
    }
    const highShare = rows.filter((r) => r.strength === 3).length / rows.length;
    if (rows.length >= 5 && highShare >= 0.8) {
      flags.push({
        code: 'EXCESSIVE_HIGH',
        severity: 'warning',
        courseOutcomeId: co.id,
        message: `Almost every mapped relationship for ${co.code} is rated High (3). Consider whether moderate or low correlation is more accurate.`,
      });
    }
  }

  const summary = summarizeMapping(input);
  if (summary.possibleCells >= 12 && summary.mappedPercent >= 90 && summary.high / Math.max(summary.mappedRelationships, 1) >= 0.75) {
    flags.push({
      code: 'MATRIX_OVER_HIGH',
      severity: 'warning',
      message: 'Excessive High mappings detected across the matrix. High correlation should be reserved for strong, direct contributions.',
    });
  }

  flags.push(...missingJustificationFlags(mapped, input.courseOutcomes, input.programOutcomes, (i) => i.programOutcomeId, 'PO'));
  return flags;
}

export function detectPsoQualityIssues(input: QualityInput): QualityFlag[] {
  const flags: QualityFlag[] = [];
  const mapped = mappedItems(input);
  const psoCount = input.programOutcomes.length;

  for (const co of input.courseOutcomes) {
    const rows = mapped.filter((item) => item.courseOutcomeId === co.id);
    if (psoCount >= 2 && rows.length === psoCount) {
      flags.push({
        code: 'PSO_OVER_MAPPING',
        severity: 'warning',
        courseOutcomeId: co.id,
        message: `${co.code} is mapped to every PSO. Confirm each relationship has a program-specific reason.`,
      });
    }
    if (rows.length >= 2 && rows.filter((r) => r.strength === 3).length / rows.length >= 0.8) {
      flags.push({
        code: 'EXCESSIVE_HIGH',
        severity: 'warning',
        courseOutcomeId: co.id,
        message: `Almost every PSO mapping for ${co.code} is High (3). Review whether moderate or low correlation is more accurate.`,
      });
    }
  }

  for (const pso of input.programOutcomes) {
    const rows = mapped.filter((item) => item.programOutcomeId === pso.id);
    if (input.courseOutcomes.length > 0 && rows.length === 0) {
      flags.push({
        code: 'PSO_UNCOVERED',
        severity: 'info',
        programOutcomeId: pso.id,
        programSpecificOutcomeId: pso.id,
        message: `${pso.code} currently has no contributing COs in this subject. This is informational, not an automatic deficiency.`,
      });
    }
    if (pso.status === 'ARCHIVED' && rows.length) {
      flags.push({
        code: 'ARCHIVED_PSO',
        severity: 'warning',
        programOutcomeId: pso.id,
        programSpecificOutcomeId: pso.id,
        message: `${pso.code} is archived but still used in this mapping.`,
      });
    }
    if (pso.isCurrent === false && rows.length) {
      flags.push({
        code: 'OUTDATED_PSO_VERSION',
        severity: 'warning',
        programOutcomeId: pso.id,
        programSpecificOutcomeId: pso.id,
        message: `${pso.code} mapping is based on an older PSO version. Do not silently migrate it; review before using the current statement.`,
      });
    }
  }

  flags.push(...missingJustificationFlags(mapped, input.courseOutcomes, input.programOutcomes, (i) => i.programOutcomeId, 'PSO'));
  return flags;
}

export function detectSdgQualityIssues(input: QualityInput): QualityFlag[] {
  const flags: QualityFlag[] = [];
  const mapped = mappedItems(input);
  const sdg4 = input.programOutcomes.find((s) => s.code === 'SDG4' || s.code === 'SDG 4');

  for (const co of input.courseOutcomes) {
    const rows = mapped.filter((item) => item.courseOutcomeId === co.id);
    if (rows.length >= 6) {
      flags.push({
        code: 'EXCESSIVE_SDGS',
        severity: 'warning',
        courseOutcomeId: co.id,
        message: `${co.code} is mapped to many SDGs. Review whether each relationship represents a meaningful curricular contribution.`,
      });
    }
    if (rows.length >= 3 && rows.filter((r) => r.strength === 3).length / rows.length >= 0.8) {
      flags.push({
        code: 'EXCESSIVE_HIGH',
        severity: 'warning',
        courseOutcomeId: co.id,
        message: `Almost every SDG mapping for ${co.code} is rated 3. Strong/direct contribution should be reserved for clear curricular links.`,
      });
    }
  }

  if (sdg4 && input.courseOutcomes.length >= 2) {
    const mappedToSdg4 = mapped.filter((item) => item.programOutcomeId === sdg4.id);
    const uniqueCos = new Set(mappedToSdg4.map((i) => i.courseOutcomeId));
    if (uniqueCos.size === input.courseOutcomes.length) {
      flags.push({
        code: 'GENERIC_SDG4',
        severity: 'warning',
        programOutcomeId: sdg4.id,
        sdgId: sdg4.id,
        message:
          'Every CO is mapped to SDG 4 (Quality Education). Being a course does not automatically mean every outcome contributes to Quality Education. Review whether each mapping is meaningful.',
      });
    }
  }

  flags.push(...missingJustificationFlags(mapped, input.courseOutcomes, input.programOutcomes, (i) => i.programOutcomeId, 'SDG'));
  return flags;
}

export function overallMappingLabel(statuses: string[]) {
  const normalized = statuses.map((s) => s || 'NOT_STARTED');
  if (normalized.every((s) => s === 'APPROVED')) return 'Approved';
  if (
    normalized.some((s) => s === 'SUBMITTED' || s === 'NEEDS_REVISION') &&
    normalized.every((s) => ['SUBMITTED', 'NEEDS_REVISION', 'APPROVED'].includes(s))
  ) {
    return 'Review';
  }
  if (normalized.every((s) => s === 'NOT_STARTED')) return 'Not Started';
  return 'In Progress';
}
