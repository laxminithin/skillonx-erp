export const SCHEME_STATUSES = ['ACTIVE', 'ARCHIVED'] as const;
export const PROGRAM_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export const SUBJECT_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;
export const OUTCOME_STATUSES = ['ACTIVE', 'ARCHIVED', 'PENDING'] as const;

export const COURSE_TYPES = [
  'PCC',
  'PEC',
  'OEC',
  'IPCC',
  'LABORATORY',
  'PROJECT',
  'INTERNSHIP',
  'AEC',
  'HSMC',
  'BSC',
  'ESC',
  'NCMC',
  'OTHER',
] as const;

export const COURSE_TYPE_LABELS: Record<string, string> = {
  PCC: 'Professional Core Course',
  PEC: 'Professional Elective Course',
  OEC: 'Open Elective Course',
  IPCC: 'Integrated Professional Core Course',
  LABORATORY: 'Laboratory',
  PROJECT: 'Project',
  INTERNSHIP: 'Internship',
  AEC: 'Ability Enhancement Course',
  HSMC: 'Humanities & Social Sciences',
  BSC: 'Basic Science Course',
  ESC: 'Engineering Science Course',
  NCMC: 'Non-Credit Mandatory Course',
  OTHER: 'Other',
};

export const BLOOMS_LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] as const;
export type BloomsLevel = (typeof BLOOMS_LEVELS)[number];

export const BLOOMS_LABELS: Record<BloomsLevel, string> = {
  L1: 'Remember',
  L2: 'Understand',
  L3: 'Apply',
  L4: 'Analyze',
  L5: 'Evaluate',
  L6: 'Create',
};

export const MAPPING_STATUSES = [
  'NOT_STARTED',
  'DRAFT',
  'SUBMITTED',
  'NEEDS_REVISION',
  'APPROVED',
  'ARCHIVED',
] as const;
export type MappingStatus = (typeof MAPPING_STATUSES)[number];

export const MAPPING_STATUS_LABELS: Record<MappingStatus, string> = {
  NOT_STARTED: 'Not Started',
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  NEEDS_REVISION: 'Needs Revision',
  APPROVED: 'Approved',
  ARCHIVED: 'Archived',
};

export const CORRELATION_STRENGTHS = [1, 2, 3] as const;
export type CorrelationStrength = (typeof CORRELATION_STRENGTHS)[number];

export const CORRELATION_LABELS: Record<CorrelationStrength, string> = {
  1: 'Low Correlation',
  2: 'Moderate Correlation',
  3: 'High Correlation',
};

export const MAPPING_KINDS = ['PO', 'PSO', 'SDG'] as const;
export type MappingKind = (typeof MAPPING_KINDS)[number];

export const MAPPING_KIND_LABELS: Record<MappingKind, string> = {
  PO: 'CO–PO',
  PSO: 'CO–PSO',
  SDG: 'CO–SDG',
};

export const PENDING_PSO_STATEMENT = 'Official / Approved PSO Data Pending';
export const PENDING_OFFICIAL_DATA = 'Official Data Pending';

export function isMappingKind(value: unknown): value is MappingKind {
  return value === 'PO' || value === 'PSO' || value === 'SDG';
}

export const CORRELATION_SCALE = [
  { value: 3, label: 'High Correlation', hint: 'The CO strongly and directly contributes to achievement of the PO.' },
  { value: 2, label: 'Moderate Correlation', hint: 'The CO meaningfully contributes to the PO.' },
  { value: 1, label: 'Low Correlation', hint: 'The CO has a limited or supporting contribution.' },
  { value: null, label: 'No Correlation', hint: 'No meaningful relationship exists.' },
] as const;

export const EDITABLE_MAPPING_STATUSES: MappingStatus[] = ['DRAFT', 'NEEDS_REVISION'];
export const LOCKED_MAPPING_STATUSES: MappingStatus[] = ['SUBMITTED', 'APPROVED', 'ARCHIVED'];

export function isValidCorrelation(value: unknown): value is CorrelationStrength {
  return value === 1 || value === 2 || value === 3;
}

export function cycleCorrelation(current: number | null): number | null {
  if (current === null || current === undefined || current === 0) return 1;
  if (current === 1) return 2;
  if (current === 2) return 3;
  return null;
}

export function bloomsLabel(level?: string | null) {
  if (!level) return null;
  const key = level.toUpperCase() as BloomsLevel;
  const name = BLOOMS_LABELS[key];
  return name ? `${key} ${name}` : level;
}
