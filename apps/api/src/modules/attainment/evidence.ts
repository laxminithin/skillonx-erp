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
export function evidenceCompleteness(items: EvidenceItem[]): EvidenceCompleteness {
  const required = items.filter((i) => i.required);
  const optional = items.filter((i) => !i.required);
  const requiredSatisfied = required.filter((i) => i.satisfied).length;
  const optionalSatisfied = optional.filter((i) => i.satisfied).length;
  const requiredTotal = required.length;
  const percent = requiredTotal === 0 ? 100 : Math.round((requiredSatisfied / requiredTotal) * 100);
  return {
    requiredTotal,
    requiredSatisfied,
    optionalSatisfied,
    optionalTotal: optional.length,
    percent,
    complete: requiredTotal === 0 || requiredSatisfied === requiredTotal,
    items,
  };
}
