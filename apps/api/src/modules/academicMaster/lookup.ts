import type { Knex } from 'knex';

export function normalizeCourseCode(code: string | null | undefined) {
  return String(code || '')
    .replace(/\s+/g, '')
    .toUpperCase();
}

export function courseCodeVariants(code: string | null | undefined) {
  const normalized = normalizeCourseCode(code);
  const variants = new Set<string>([normalized].filter(Boolean));
  if (normalized.includes('/')) {
    const parts = normalized.split('/').filter(Boolean);
    if (parts.length === 2 && /^\d+$/.test(parts[1])) {
      const prefix = parts[0].replace(/\d+$/, '');
      variants.add(parts[0]);
      variants.add(`${prefix}${parts[1]}`);
    } else {
      for (const part of parts) variants.add(part);
    }
  }
  return [...variants];
}

export function overlayByNaturalKey(
  rows: Array<Record<string, any>>,
  keyFn: (row: Record<string, any>) => string,
): Array<Record<string, any>> {
  const map = new Map<string, Record<string, any>>();
  for (const row of rows) {
    if (row.college_id != null) map.set(keyFn(row), row);
  }
  for (const row of rows) {
    if (row.college_id == null) map.set(keyFn(row), row);
  }
  return [...map.values()];
}

export function scopeMasterQuery(query: Knex.QueryBuilder, collegeId: number, column = 'college_id') {
  return query.andWhere(function globalOrCollege(this: Knex.QueryBuilder) {
    this.whereNull(column).orWhere(column, collegeId);
  });
}

export function missingAcademicMasterPayload(input: {
  subjectCode: string;
  subjectName?: string | null;
  scheme?: string | null;
  semester?: string | null;
  missing: string[];
}) {
  const missing = input.missing.length ? input.missing : ['academic master'];
  return {
    found: false as const,
    reason: 'NO_MASTER',
    message: 'Academic master data for this subject has not yet been configured.',
    diagnostics: {
      subjectCode: input.subjectCode,
      subjectName: input.subjectName ?? null,
      scheme: input.scheme ?? null,
      semester: input.semester ?? null,
      missing,
    },
  };
}

export async function loadScopedMasterRows(
  db: Knex,
  table: string,
  collegeId: number,
  opts: {
    courseId?: number | null;
    courseCode?: string | null;
    activeOnly?: boolean;
    orderBy?: string;
  } = {},
) {
  const q = db(table);
  scopeMasterQuery(q, collegeId);
  if (opts.activeOnly !== false) {
    q.andWhere('is_active', true);
  }
  const variants = courseCodeVariants(opts.courseCode);
  if (opts.courseId || variants.length) {
    q.andWhere(function matchCourse(this: Knex.QueryBuilder) {
      if (opts.courseId) this.orWhere('course_id', opts.courseId);
      if (variants.length) this.orWhereIn('course_code', variants);
    });
  }
  if (opts.orderBy) q.orderBy(opts.orderBy);
  return q.select('*');
}
