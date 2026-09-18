export type CopoCatalog = {
  schemes: Array<{
    id: number;
    name: string;
    code: string;
    university?: string | null;
    effectiveAcademicYear?: string | null;
    startYear?: number | null;
    endYear?: number | null;
    status: string;
  }>;
  programs: Array<{
    id: number;
    name: string;
    code: string;
    departmentId?: number | null;
    departmentName?: string | null;
    schemeId?: number | null;
    schemeName?: string | null;
    degree?: string | null;
    durationYears?: number | null;
    status: string;
  }>;
  semesters: Array<{ id: number; label: string; number?: number | null }>;
  academicYears: Array<{ id: number; label: string; isCurrent: boolean }>;
  subjects: CopoSubject[];
  departments: Array<{ id: number; name: string; code: string }>;
  assignedCourseIds?: number[];
};

export type CopoSubject = {
  id: number;
  code: string;
  name: string;
  departmentId?: number | null;
  departmentName?: string | null;
  schemeId?: number | null;
  schemeName?: string | null;
  schemeCode?: string | null;
  semesterId?: number | null;
  semesterLabel?: string | null;
  courseType?: string | null;
  lectureHours?: number | null;
  tutorialHours?: number | null;
  practicalHours?: number | null;
  credits?: number | null;
  cieMarks?: number | null;
  seeMarks?: number | null;
  totalMarks?: number | null;
  status: string;
  programs?: Array<{ id: number; name: string; code: string }>;
};

export type CourseOutcome = {
  id: number;
  courseId: number;
  number: number;
  code: string;
  statement: string;
  bloomsLevel?: string | null;
  bloomsLabel?: string | null;
  knowledgeLevel?: string | null;
  source?: string | null;
  sourcePage?: string | null;
  sourceDocumentId?: number | null;
  versionNumber: number;
  isCurrent: boolean;
  status: string;
  officialTextPending: boolean;
};

export type ProgramOutcome = {
  id: number;
  frameworkVersionId: number;
  schemeId: number;
  number: number;
  code: string;
  shortTitle?: string | null;
  officialStatement?: string | null;
  source?: string | null;
  status: string;
  officialTextPending: boolean;
};

export type MappingItem = {
  id: number;
  courseOutcomeId: number;
  programOutcomeId?: number | null;
  programSpecificOutcomeId?: number | null;
  sdgId?: number | null;
  targetId?: number | null;
  strength: 1 | 2 | 3 | null;
  justification?: string | null;
  aiSuggested?: boolean;
  facultyReviewed?: boolean;
};

export type ProgramSpecificOutcome = {
  id: number;
  schemeId: number;
  programId: number;
  number: number;
  code: string;
  shortTitle?: string | null;
  officialStatement?: string | null;
  effectiveAcademicYear?: string | null;
  versionNumber: number;
  isCurrent: boolean;
  source?: string | null;
  approvalReference?: string | null;
  status: string;
  officialTextPending: boolean;
  schemeName?: string;
  programName?: string;
  departmentName?: string | null;
  displayStatement?: string;
};

export type SdgGoal = {
  id: number;
  number: number;
  code: string;
  officialTitle: string;
  officialDescription: string;
  iconKey?: string | null;
  colorHex?: string | null;
  source: string;
  sourceUrl?: string | null;
  active: boolean;
};

export type CopoWorkspace = {
  mappingKind?: 'PO' | 'PSO' | 'SDG';
  course: CopoSubject;
  program: { id: number; name: string; code: string } | null;
  academicYear: { id: number; label: string } | null;
  courseOutcomes: CourseOutcome[];
  programOutcomes: ProgramOutcome[];
  programSpecificOutcomes?: ProgramSpecificOutcome[];
  sdgs?: SdgGoal[];
  visibleSdgs?: SdgGoal[];
  relevantSdgIds?: number[];
  showAllSdgs?: boolean;
  poFramework: { id: number; versionNumber: number; label?: string | null } | null;
  mapping: {
    id: number | null;
    versionNumber: number;
    status: string;
    mappingKind?: string;
    isCurrent?: boolean;
  };
  items: MappingItem[];
  summary: {
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
  coverage: Array<{
    programOutcomeId: number;
    code: string;
    contributingCos: number;
    high: number;
    moderate: number;
    low: number;
    score: number;
  }>;
  qualityFlags: Array<{
    code: string;
    severity: string;
    message: string;
    courseOutcomeId?: number;
    programOutcomeId?: number;
  }>;
  comments: Array<{
    id: number;
    action: string;
    comment: string;
    authorName?: string | null;
    createdAt: string;
  }>;
  sourceDocuments: Array<{ id: number; title: string; sourceLabel?: string | null; externalUrl?: string | null }>;
  permissions: {
    canEdit: boolean;
    canSubmit: boolean;
    canReview: boolean;
    canManageMasters: boolean;
  };
  officialDataPending: {
    outcomes: boolean;
    programmeOutcomes: boolean;
    poStatements: boolean;
    programSpecificOutcomes?: boolean;
    psoStatements?: boolean;
  };
};

export type UnifiedWorkspace = {
  course: CopoSubject;
  program: { id: number; name: string; code: string } | null;
  academicYear: { id: number; label: string } | null;
  courseOutcomes: CourseOutcome[];
  po: CopoWorkspace;
  pso: CopoWorkspace;
  sdg: CopoWorkspace;
  progress: {
    po: { status: string; label: string; percent: number };
    pso: { status: string; label: string; percent: number };
    sdg: { status: string; label: string; percent: number };
    overall: string;
  };
  alignment: Array<{
    courseOutcome: CourseOutcome;
    po: Array<{ code: string; strength: number | null; justification?: string | null }>;
    pso: Array<{ code: string; strength: number | null; justification?: string | null }>;
    sdg: Array<{ code: string; title?: string; strength: number | null; justification?: string | null }>;
  }>;
  permissions: CopoWorkspace['permissions'];
};

export const COURSE_TYPES = [
  ['PCC', 'Professional Core'],
  ['PEC', 'Professional Elective'],
  ['OEC', 'Open Elective'],
  ['IPCC', 'Integrated PCC'],
  ['LABORATORY', 'Laboratory'],
  ['PROJECT', 'Project'],
  ['INTERNSHIP', 'Internship'],
  ['AEC', 'Ability Enhancement'],
  ['HSMC', 'Humanities'],
  ['BSC', 'Basic Science'],
  ['ESC', 'Engineering Science'],
  ['OTHER', 'Other'],
] as const;

export const BLOOMS = [
  ['L1', 'Remember'],
  ['L2', 'Understand'],
  ['L3', 'Apply'],
  ['L4', 'Analyze'],
  ['L5', 'Evaluate'],
  ['L6', 'Create'],
] as const;
