export type CourseRef = {
  id: number;
  name: string;
  code: string;
  schemeId?: number | null;
  schemeCode?: string | null;
};

export type ReconcileStatus = 'MATCHED' | 'NEW' | 'AMBIGUOUS' | 'COURSE_CODE_CONFLICT' | 'SCHEME_CONFLICT';

export type SubjectReconcile = {
  status: ReconcileStatus;
  course: CourseRef | null;
  reason: string;
  existing: { name: string; code: string; scheme: string | null } | null;
  mapper: { name: string; code: string; scheme: string };
};

function strip(value: string) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeCode(value: string) {
  return String(value ?? '')
    .toUpperCase()
    .replace(/\s+/g, '');
}

const NAME_ALIASES: Record<string, string> = {
  chemistry: 'chemistry',
  'applied chemistry for smart systems': 'chemistry',
  'computer networks i': 'computer networks i',
  'computer networks 1': 'computer networks i',
  'research methodology ipr': 'research methodology and ipr',
  'research methodology and ipr': 'research methodology and ipr',
};

function canonicalName(name: string) {
  const key = strip(name);
  return NAME_ALIASES[key] || key;
}

function namesMatch(a: string, b: string) {
  return canonicalName(a) === canonicalName(b);
}

function schemeCode(scheme: string | null | undefined) {
  if (!scheme) return null;
  const s = String(scheme).trim();
  if (!s) return null;
  if (/^VTU-/i.test(s)) return s.toUpperCase();
  if (/^\d{4}$/.test(s)) return `VTU-${s}`;
  return s.toUpperCase();
}

export function reconcileSubject(
  mapper: { name: string; code: string; scheme: string; aliasName?: string | null },
  courses: CourseRef[],
): SubjectReconcile {
  const mapperCode = normalizeCode(mapper.code);
  const mapperScheme = schemeCode(mapper.scheme);
  const mapperView = { name: mapper.name, code: mapperCode, scheme: mapper.scheme };

  const empty = (status: ReconcileStatus, reason: string, course: CourseRef | null = null): SubjectReconcile => ({
    status,
    course,
    reason,
    existing: course
      ? { name: course.name, code: course.code, scheme: course.schemeCode ?? null }
      : null,
    mapper: mapperView,
  });

  const byCodeScheme = courses.filter(
    (c) =>
      normalizeCode(c.code) === mapperCode &&
      mapperScheme &&
      schemeCode(c.schemeCode || '') === mapperScheme,
  );
  if (byCodeScheme.length === 1) {
    return empty('MATCHED', `Matched course code ${mapperCode} on ${mapper.scheme} scheme`, byCodeScheme[0]);
  }
  if (byCodeScheme.length > 1) {
    return empty('AMBIGUOUS', `Multiple courses share code ${mapperCode} on scheme ${mapper.scheme}`);
  }

  const byCode = courses.filter((c) => normalizeCode(c.code) === mapperCode);
  if (byCode.length === 1) {
    const hit = byCode[0];
    const existingScheme = schemeCode(hit.schemeCode || '');
    if (existingScheme && mapperScheme && existingScheme !== mapperScheme) {
      return {
        status: 'SCHEME_CONFLICT',
        course: hit,
        reason: `Same course code ${mapperCode} appears under different schemes`,
        existing: { name: hit.name, code: hit.code, scheme: hit.schemeCode ?? null },
        mapper: mapperView,
      };
    }
    return empty('MATCHED', `Matched exact course code ${mapperCode}`, hit);
  }
  if (byCode.length > 1) {
    return empty('AMBIGUOUS', `Multiple courses share code ${mapperCode}`);
  }

  const namePool = courses.filter(
    (c) => namesMatch(c.name, mapper.name) || (mapper.aliasName && namesMatch(c.name, mapper.aliasName)),
  );
  if (namePool.length > 1) {
    return empty('AMBIGUOUS', `Multiple existing subjects match "${mapper.name}"`);
  }
  if (namePool.length === 1) {
    const hit = namePool[0];
    const existingCode = normalizeCode(hit.code);
    if (existingCode && existingCode !== mapperCode) {
      return {
        status: 'COURSE_CODE_CONFLICT',
        course: hit,
        reason: 'Existing subject name matches the master mapper but the course codes differ',
        existing: { name: hit.name, code: hit.code, scheme: hit.schemeCode ?? null },
        mapper: mapperView,
      };
    }
    return empty('MATCHED', `Matched normalized subject name "${hit.name}"`, hit);
  }

  return empty('NEW', `No existing subject for ${mapperCode} / ${mapper.name}`);
}

export function buildMatrix(
  courseOutcomes: Array<{ id: number; code: string }>,
  programOutcomes: Array<{ id: number; code: string }>,
  items: Array<{ courseOutcomeId: number; programOutcomeId: number; strength: number | null }>,
) {
  return courseOutcomes.map((co) => ({
    coCode: co.code,
    cells: programOutcomes.map((po) => {
      const item = items.find((i) => i.courseOutcomeId === co.id && i.programOutcomeId === po.id);
      const strength = item?.strength ?? null;
      return { poCode: po.code, strength };
    }),
  }));
}
