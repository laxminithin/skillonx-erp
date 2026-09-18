export type MarksImportRow = {
  usn: string;
  name?: string | null;
  questionMarks: Record<string, number | null | string>;
  total?: number | null;
};

export type MarksQuestionSpec = {
  questionKey: string;
  label: string;
  maxMarks: number;
  coCode?: string | null;
};

export type MarksImportIssue = {
  severity: 'ERROR' | 'WARNING';
  code: string;
  row?: number;
  usn?: string;
  questionKey?: string;
  message: string;
};

export type MarksImportPreview = {
  ok: boolean;
  rows: number;
  errorCount: number;
  warningCount: number;
  issues: MarksImportIssue[];
  parsed: Array<{
    usn: string;
    name: string | null;
    status: 'PRESENT' | 'ABSENT' | 'NOT_EVALUATED' | 'EXEMPT';
    questionMarks: Record<string, number | null>;
    total: number | null;
    expectedTotal: number | null;
  }>;
};

const ABSENT_TOKENS = new Set(['A', 'ABS', 'ABSENT', 'AB']);
const NA_TOKENS = new Set(['NA', 'NE', 'NOT EVALUATED', 'NOT_EVALUATED', '-']);
const EXEMPT_TOKENS = new Set(['EX', 'EXEMPT', 'EXEMPTED']);

function normalizeUsn(usn: string) {
  return String(usn || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function parseCell(raw: unknown): { kind: 'NUMBER' | 'ABSENT' | 'NOT_EVALUATED' | 'EXEMPT' | 'EMPTY' | 'INVALID'; value: number | null } {
  if (raw == null || raw === '') return { kind: 'EMPTY', value: null };
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return { kind: 'INVALID', value: null };
    return { kind: 'NUMBER', value: raw };
  }
  const s = String(raw).trim();
  if (!s) return { kind: 'EMPTY', value: null };
  const u = s.toUpperCase();
  if (ABSENT_TOKENS.has(u)) return { kind: 'ABSENT', value: null };
  if (NA_TOKENS.has(u)) return { kind: 'NOT_EVALUATED', value: null };
  if (EXEMPT_TOKENS.has(u)) return { kind: 'EXEMPT', value: null };
  const n = Number(s);
  if (!Number.isFinite(n)) return { kind: 'INVALID', value: null };
  return { kind: 'NUMBER', value: n };
}

export function validateMarksImport(input: {
  rows: MarksImportRow[];
  questions: MarksQuestionSpec[];
  knownUsns: Set<string>;
}): MarksImportPreview {
  const issues: MarksImportIssue[] = [];
  const seen = new Set<string>();
  const parsed: MarksImportPreview['parsed'] = [];

  input.rows.forEach((row, index) => {
    const line = index + 2; // header is row 1
    const usn = normalizeUsn(row.usn);
    if (!usn) {
      issues.push({ severity: 'ERROR', code: 'MISSING_USN', row: line, message: 'USN is required' });
      return;
    }
    if (seen.has(usn)) {
      issues.push({ severity: 'ERROR', code: 'DUPLICATE_STUDENT', row: line, usn, message: `Duplicate USN ${usn}` });
    }
    seen.add(usn);
    if (input.knownUsns.size && !input.knownUsns.has(usn)) {
      issues.push({ severity: 'ERROR', code: 'UNKNOWN_USN', row: line, usn, message: `Unknown USN ${usn}` });
    }

    const questionMarks: Record<string, number | null> = {};
    let status: 'PRESENT' | 'ABSENT' | 'NOT_EVALUATED' | 'EXEMPT' = 'PRESENT';
    let obtained = 0;
    let anyNumber = false;
    let missing = 0;

    for (const q of input.questions) {
      const cell = parseCell(row.questionMarks[q.questionKey] ?? row.questionMarks[q.label]);
      if (cell.kind === 'ABSENT') {
        status = 'ABSENT';
        questionMarks[q.questionKey] = null;
        continue;
      }
      if (cell.kind === 'EXEMPT') {
        if (status === 'PRESENT') status = 'EXEMPT';
        questionMarks[q.questionKey] = null;
        continue;
      }
      if (cell.kind === 'NOT_EVALUATED' || cell.kind === 'EMPTY') {
        missing += 1;
        questionMarks[q.questionKey] = null;
        if (cell.kind === 'NOT_EVALUATED' && status === 'PRESENT') status = 'NOT_EVALUATED';
        continue;
      }
      if (cell.kind === 'INVALID') {
        issues.push({
          severity: 'ERROR',
          code: 'INVALID_MARK',
          row: line,
          usn,
          questionKey: q.questionKey,
          message: `Invalid mark for ${q.label}`,
        });
        continue;
      }
      if ((cell.value as number) > q.maxMarks) {
        issues.push({
          severity: 'ERROR',
          code: 'MARKS_EXCEED_MAX',
          row: line,
          usn,
          questionKey: q.questionKey,
          message: `${q.label}: ${cell.value} exceeds maximum ${q.maxMarks}`,
        });
      }
      if ((cell.value as number) < 0) {
        issues.push({
          severity: 'ERROR',
          code: 'NEGATIVE_MARK',
          row: line,
          usn,
          questionKey: q.questionKey,
          message: `${q.label}: marks cannot be negative`,
        });
      }
      questionMarks[q.questionKey] = cell.value;
      obtained += cell.value as number;
      anyNumber = true;
    }

    if (status === 'PRESENT' && missing === input.questions.length) {
      issues.push({
        severity: 'ERROR',
        code: 'MISSING_MARKS',
        row: line,
        usn,
        message: 'No marks entered for this student',
      });
      status = 'NOT_EVALUATED';
    } else if (status === 'PRESENT' && missing > 0) {
      issues.push({
        severity: 'WARNING',
        code: 'PARTIAL_MARKS',
        row: line,
        usn,
        message: `${missing} question mark(s) missing`,
      });
    }

    const expectedTotal = anyNumber && status === 'PRESENT' ? Math.round(obtained * 100) / 100 : null;
    if (row.total != null && expectedTotal != null && Math.abs(Number(row.total) - expectedTotal) > 0.05) {
      issues.push({
        severity: 'ERROR',
        code: 'TOTAL_MISMATCH',
        row: line,
        usn,
        message: `Stated total ${row.total} does not match question sum ${expectedTotal}`,
      });
    }

    parsed.push({
      usn,
      name: row.name ? String(row.name) : null,
      status,
      questionMarks,
      total: expectedTotal,
      expectedTotal,
    });
  });

  const errorCount = issues.filter((i) => i.severity === 'ERROR').length;
  return {
    ok: errorCount === 0,
    rows: parsed.length,
    errorCount,
    warningCount: issues.filter((i) => i.severity === 'WARNING').length,
    issues,
    parsed,
  };
}

export function schemeComponentsValid(
  questionMarks: number,
  components: Array<{ maxMarks: number }>,
  tol = 0.05,
) {
  if (!components.length) return { ok: false, total: 0, message: 'Scheme has no components' };
  const total = Math.round(components.reduce((s, c) => s + Number(c.maxMarks || 0), 0) * 100) / 100;
  const ok = Math.abs(total - Number(questionMarks)) <= tol;
  return {
    ok,
    total,
    message: ok ? null : `Scheme components sum to ${total}, question is ${questionMarks} marks`,
  };
}
