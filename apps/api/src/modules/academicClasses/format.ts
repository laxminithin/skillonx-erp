const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

export function romanNumeral(n: number | null | undefined) {
  if (!n || n < 1 || n > 8) return n ? String(n) : '';
  return ROMAN[n];
}

export function semesterTitle(label?: string | null, number?: number | null) {
  const n = number ?? (label ? Number.parseInt(String(label).replace(/\D/g, ''), 10) : NaN);
  if (Number.isFinite(n) && n > 0) return `Semester ${romanNumeral(n)}`;
  if (label) return String(label).toLowerCase().startsWith('sem') ? String(label) : `Semester ${label}`;
  return 'Semester';
}

export function classDisplayName(input: {
  departmentCode?: string | null;
  departmentName?: string | null;
  semesterLabel?: string | null;
  semesterNumber?: number | null;
  sectionLabel?: string | null;
}) {
  const branch = (input.departmentCode || input.departmentName || 'Class').toString().trim();
  const sem = semesterTitle(input.semesterLabel, input.semesterNumber);
  const section = input.sectionLabel ? `Section ${input.sectionLabel}` : null;
  return [branch, sem, section].filter(Boolean).join(' – ');
}

export function classCode(input: {
  departmentCode?: string | null;
  semesterNumber?: number | null;
  semesterLabel?: string | null;
  sectionLabel?: string | null;
  yearLabel?: string | null;
}) {
  const dept = String(input.departmentCode || 'CLS')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8) || 'CLS';
  const semNum =
    input.semesterNumber ??
    (input.semesterLabel ? Number.parseInt(String(input.semesterLabel).replace(/\D/g, ''), 10) : NaN);
  const sem = Number.isFinite(semNum) ? String(semNum) : 'X';
  const section = String(input.sectionLabel || 'A')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 4) || 'A';
  const year = String(input.yearLabel || '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, '')
    .slice(0, 9);
  const yearPart = year ? `-${year}` : '';
  return `${dept}-${sem}${section}${yearPart}`;
}

export function subjectKindFromCourseType(courseType?: string | null) {
  const t = String(courseType || '').toUpperCase();
  if (t.includes('OPEN') && t.includes('ELECTIVE')) return 'OPEN_ELECTIVE';
  if (t.includes('ELECTIVE')) return 'ELECTIVE';
  if (t.includes('LAB') || t.includes('PRACTICAL')) return 'LAB';
  if (t.includes('AEC') || t.includes('ABILITY')) return 'ABILITY_ENHANCEMENT';
  return 'CORE';
}

export function joinClassUrl(publicAppUrl: string, code: string) {
  const base = publicAppUrl.replace(/\/+$/, '');
  return `${base}/join/class/${encodeURIComponent(code)}`;
}
