export type EligibilitySnapshot = {
  collegeId?: number | null;
  programId?: number | null;
  departmentId?: number | null;
  semesterId?: number | null;
  classSectionId?: number | null;
  schemeId?: number | null;
  academicYearId?: number | null;
};

export type EligibilityLabels = {
  departmentCode?: string | null;
  departmentName?: string | null;
  semesterLabel?: string | null;
  semesterNumber?: number | null;
  sectionLabel?: string | null;
};

export type EligibilityMismatch = {
  field: string;
  expected: string;
  actual: string;
};

export type EligibilityResult =
  | { ok: true }
  | { ok: false; code: 'MISMATCH'; message: string; mismatches: EligibilityMismatch[] };

function sameId(a?: number | null, b?: number | null) {
  if (a == null || b == null) return true;
  return Number(a) === Number(b);
}

function fieldLabel(field: string) {
  switch (field) {
    case 'collegeId':
      return 'institution';
    case 'programId':
      return 'program';
    case 'departmentId':
      return 'branch';
    case 'semesterId':
      return 'semester';
    case 'classSectionId':
      return 'section';
    case 'schemeId':
      return 'scheme';
    case 'academicYearId':
      return 'academic year';
    default:
      return field;
  }
}

export function describeClass(labels: EligibilityLabels) {
  const branch = labels.departmentCode || labels.departmentName || 'this branch';
  const semNum = labels.semesterNumber ?? (labels.semesterLabel ? Number.parseInt(String(labels.semesterLabel), 10) : NaN);
  const sem = Number.isFinite(semNum) ? `Semester ${semNum}` : labels.semesterLabel || 'this semester';
  const section = labels.sectionLabel ? `Section ${labels.sectionLabel}` : 'this section';
  return `${branch} ${sem} ${section}`;
}

export function evaluateClassEligibility(
  student: EligibilitySnapshot,
  academicClass: EligibilitySnapshot,
  labels: { class: EligibilityLabels; student: EligibilityLabels },
): EligibilityResult {
  const checks: Array<{ field: keyof EligibilitySnapshot; required: boolean }> = [
    { field: 'collegeId', required: true },
    { field: 'programId', required: false },
    { field: 'departmentId', required: true },
    { field: 'semesterId', required: true },
    { field: 'classSectionId', required: true },
    { field: 'schemeId', required: false },
    { field: 'academicYearId', required: false },
  ];

  const mismatches: EligibilityMismatch[] = [];
  for (const { field, required } of checks) {
    const expected = academicClass[field] ?? null;
    const actual = student[field] ?? null;
    if (expected == null) continue;
    if (actual == null) {
      if (required) {
        mismatches.push({
          field,
          expected: String(expected),
          actual: 'not registered',
        });
      }
      continue;
    }
    if (!sameId(expected, actual)) {
      mismatches.push({
        field,
        expected: String(expected),
        actual: String(actual),
      });
    }
  }

  if (!mismatches.length) return { ok: true };

  const className = describeClass(labels.class);
  const sectionMismatch = mismatches.find((m) => m.field === 'classSectionId');
  if (sectionMismatch && mismatches.every((m) => m.field === 'classSectionId' || m.field === 'schemeId')) {
    const studentSection = labels.student.sectionLabel
      ? `Section ${labels.student.sectionLabel}`
      : 'a different section';
    return {
      ok: false,
      code: 'MISMATCH',
      message: `This LMS is for ${className}. Your registered section is ${studentSection}.`,
      mismatches,
    };
  }

  const parts = mismatches.map((m) => fieldLabel(m.field));
  const unique = [...new Set(parts)];
  return {
    ok: false,
    code: 'MISMATCH',
    message: `This LMS is for ${className}. Your current semester registration does not match (${unique.join(', ')}).`,
    mismatches,
  };
}

export function snapshotFromRegistration(row: Record<string, unknown> | null | undefined): EligibilitySnapshot {
  if (!row) return {};
  return {
    collegeId: row.college_id != null ? Number(row.college_id) : null,
    programId: row.program_id != null ? Number(row.program_id) : null,
    departmentId: row.department_id != null ? Number(row.department_id) : null,
    semesterId: row.semester_id != null ? Number(row.semester_id) : null,
    classSectionId: row.class_section_id != null ? Number(row.class_section_id) : null,
    schemeId: row.scheme_id != null ? Number(row.scheme_id) : null,
    academicYearId: row.academic_year_id != null ? Number(row.academic_year_id) : null,
  };
}
