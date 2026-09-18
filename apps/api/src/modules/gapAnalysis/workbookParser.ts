import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import { normalizeActionType } from './types.js';

export const GAP_SHEETS = [
  'GAP_MASTER',
  'GAP_CO_MAPPING',
  'GAP_OUTCOME_MAPPING',
  'GAP_ACTION_MASTER',
  'GAP_SOURCES',
  'GAP_REVIEW_QUEUE',
  'GAP_SUMMARY',
] as const;

export type ParsedGapMaster = {
  gapId: string;
  subjectKey: string | null;
  subjectName: string;
  courseCode: string;
  scheme: string | null;
  program: string | null;
  semester: string | null;
  moduleUnit: string | null;
  relatedTopic: string | null;
  gapType: string;
  gapStatement: string;
  gapJustification: string | null;
  officialSyllabusCoverage: string | null;
  currentTeachingCoverage: string | null;
  expectedCoverageLevel: number | null;
  priority: string | null;
  relatedCosRaw: string | null;
  suggestedActionType: string | null;
  sourceBasis: string | null;
  mappingOrigin: string | null;
  verificationStatus: string | null;
  sourceRow: number;
};

export type ParsedGapCoLink = {
  gapId: string;
  courseCode: string;
  coCode: string;
  relationship: string | null;
  basis: string | null;
  verificationStatus: string | null;
  sourceRow: number;
};

export type ParsedGapOutcomeLink = {
  gapId: string;
  courseCode: string;
  coCode: string | null;
  outcomeType: string;
  outcomeCode: string;
  strength: number | null;
  derivedFrom: string | null;
  verificationStatus: string | null;
  sourceRow: number;
};

export type ParsedGapAction = {
  actionId: string;
  gapId: string;
  actionType: string;
  recommendedAction: string;
  expectedCoverageLevel: number | null;
  priority: string | null;
  sourceBasis: string | null;
  verificationStatus: string | null;
  sourceRow: number;
};

export type ParsedGapSource = {
  sourceId: string;
  gapId: string;
  sourceType: string | null;
  sourceFile: string | null;
  sourceReference: string | null;
  notes: string | null;
  sourceRow: number;
};

export type ParsedGapReview = {
  reviewId: string;
  subjectName: string | null;
  courseCode: string | null;
  entityType: string | null;
  entityId: string | null;
  issue: string | null;
  proposedValue: string | null;
  reason: string | null;
  source: string | null;
  reviewStatus: string | null;
  sourceRow: number;
};

export type ParsedGapWorkbook = {
  gaps: ParsedGapMaster[];
  coLinks: ParsedGapCoLink[];
  outcomeLinks: ParsedGapOutcomeLink[];
  actions: ParsedGapAction[];
  sources: ParsedGapSource[];
  reviewQueue: ParsedGapReview[];
  sheets: string[];
  errors: string[];
  warnings: string[];
};

function cellStr(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object' && value !== null && 'text' in (value as object)) {
    return String((value as { text?: unknown }).text ?? '').trim();
  }
  if (typeof value === 'object' && value !== null && 'result' in (value as object)) {
    return String((value as { result?: unknown }).result ?? '').trim();
  }
  return String(value).trim();
}

function cellNum(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(typeof value === 'object' && value && 'result' in value ? (value as { result: unknown }).result : value);
  return Number.isFinite(n) ? n : null;
}

function headerMap(row: ExcelJS.Row): Map<string, number> {
  const map = new Map<string, number>();
  row.eachCell((cell, col) => {
    const key = cellStr(cell.value).toLowerCase().replace(/[\s-]+/g, '_');
    if (key) map.set(key, col);
  });
  return map;
}

function getBy(headers: Map<string, number>, row: ExcelJS.Row, ...names: string[]) {
  for (const name of names) {
    const col = headers.get(name.toLowerCase().replace(/[\s-]+/g, '_'));
    if (col != null) return row.getCell(col).value;
  }
  return null;
}

function normalizeCourseCode(code: string) {
  return code.replace(/\s+/g, '').toUpperCase();
}

export function parseGapWorkbookBuffer(buffer: Buffer): ParsedGapWorkbook {
  // sync wrapper not used — keep async API
  void buffer;
  throw new Error('Use parseGapWorkbook');
}

export async function parseGapWorkbook(buffer: Buffer | string): Promise<ParsedGapWorkbook> {
  const wb = new ExcelJS.Workbook();
  if (typeof buffer === 'string') await wb.xlsx.readFile(buffer);
  else await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const sheets = wb.worksheets.map((s) => s.name);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!sheets.includes('GAP_MASTER')) {
    errors.push('GAP_MASTER sheet is required');
    return { gaps: [], coLinks: [], outcomeLinks: [], actions: [], sources: [], reviewQueue: [], sheets, errors, warnings };
  }

  const gaps: ParsedGapMaster[] = [];
  const gapSheet = wb.getWorksheet('GAP_MASTER')!;
  const gapHeaders = headerMap(gapSheet.getRow(1));
  gapSheet.eachRow((row, n) => {
    if (n === 1) return;
    const gapId = cellStr(getBy(gapHeaders, row, 'gap_id'));
    const gapStatement = cellStr(getBy(gapHeaders, row, 'gap_statement'));
    if (!gapId || !gapStatement) return;
    const suggested = cellStr(getBy(gapHeaders, row, 'suggested_gap_filling_action'));
    gaps.push({
      gapId,
      subjectKey: cellStr(getBy(gapHeaders, row, 'subject_id')) || null,
      subjectName: cellStr(getBy(gapHeaders, row, 'subject')) || gapId,
      courseCode: normalizeCourseCode(cellStr(getBy(gapHeaders, row, 'course_code'))),
      scheme: cellStr(getBy(gapHeaders, row, 'scheme')) || null,
      program: cellStr(getBy(gapHeaders, row, 'program')) || null,
      semester: cellStr(getBy(gapHeaders, row, 'semester')) || null,
      moduleUnit: cellStr(getBy(gapHeaders, row, 'module_unit')) || null,
      relatedTopic: cellStr(getBy(gapHeaders, row, 'related_topic')) || null,
      gapType: cellStr(getBy(gapHeaders, row, 'gap_type')) || 'OTHER',
      gapStatement,
      gapJustification: cellStr(getBy(gapHeaders, row, 'gap_justification')) || null,
      officialSyllabusCoverage: cellStr(getBy(gapHeaders, row, 'official_syllabus_coverage')) || null,
      currentTeachingCoverage: cellStr(getBy(gapHeaders, row, 'current_teaching_coverage')) || null,
      expectedCoverageLevel: cellNum(getBy(gapHeaders, row, 'expected_coverage_level')),
      priority: cellStr(getBy(gapHeaders, row, 'priority')) || null,
      relatedCosRaw: cellStr(getBy(gapHeaders, row, 'related_cos')) || null,
      suggestedActionType: suggested ? normalizeActionType(suggested) : null,
      sourceBasis: cellStr(getBy(gapHeaders, row, 'source_basis')) || null,
      mappingOrigin: cellStr(getBy(gapHeaders, row, 'mapping_origin')) || null,
      verificationStatus: cellStr(getBy(gapHeaders, row, 'verification_status')) || null,
      sourceRow: n,
    });
  });

  const coLinks: ParsedGapCoLink[] = [];
  const coSheet = wb.getWorksheet('GAP_CO_MAPPING');
  if (coSheet) {
    const headers = headerMap(coSheet.getRow(1));
    coSheet.eachRow((row, n) => {
      if (n === 1) return;
      const gapId = cellStr(getBy(headers, row, 'gap_id'));
      const coCode = cellStr(getBy(headers, row, 'co_code'));
      if (!gapId || !coCode) return;
      coLinks.push({
        gapId,
        courseCode: normalizeCourseCode(cellStr(getBy(headers, row, 'course_code'))),
        coCode: coCode.toUpperCase(),
        relationship: cellStr(getBy(headers, row, 'relationship')) || null,
        basis: cellStr(getBy(headers, row, 'basis')) || null,
        verificationStatus: cellStr(getBy(headers, row, 'verification_status')) || null,
        sourceRow: n,
      });
    });
  } else {
    warnings.push('GAP_CO_MAPPING sheet missing');
  }

  const outcomeLinks: ParsedGapOutcomeLink[] = [];
  const outcomeSheet = wb.getWorksheet('GAP_OUTCOME_MAPPING');
  if (outcomeSheet) {
    const headers = headerMap(outcomeSheet.getRow(1));
    outcomeSheet.eachRow((row, n) => {
      if (n === 1) return;
      const gapId = cellStr(getBy(headers, row, 'gap_id'));
      const outcomeType = cellStr(getBy(headers, row, 'outcome_type'));
      const outcomeCode = cellStr(getBy(headers, row, 'outcome_code'));
      if (!gapId || !outcomeType || !outcomeCode) return;
      outcomeLinks.push({
        gapId,
        courseCode: normalizeCourseCode(cellStr(getBy(headers, row, 'course_code'))),
        coCode: cellStr(getBy(headers, row, 'co_code')).toUpperCase() || null,
        outcomeType: outcomeType.toUpperCase(),
        outcomeCode: outcomeCode.toUpperCase(),
        strength: cellNum(getBy(headers, row, 'strength')),
        derivedFrom: cellStr(getBy(headers, row, 'derived_from')) || null,
        verificationStatus: cellStr(getBy(headers, row, 'verification_status')) || null,
        sourceRow: n,
      });
    });
  }

  const actions: ParsedGapAction[] = [];
  const actionSheet = wb.getWorksheet('GAP_ACTION_MASTER');
  if (actionSheet) {
    const headers = headerMap(actionSheet.getRow(1));
    actionSheet.eachRow((row, n) => {
      if (n === 1) return;
      const actionId = cellStr(getBy(headers, row, 'action_id'));
      const gapId = cellStr(getBy(headers, row, 'gap_id'));
      const recommended = cellStr(getBy(headers, row, 'recommended_action'));
      if (!actionId || !gapId || !recommended) return;
      actions.push({
        actionId,
        gapId,
        actionType: normalizeActionType(cellStr(getBy(headers, row, 'action_type'))),
        recommendedAction: recommended,
        expectedCoverageLevel: cellNum(getBy(headers, row, 'expected_coverage_level')),
        priority: cellStr(getBy(headers, row, 'priority')) || null,
        sourceBasis: cellStr(getBy(headers, row, 'source_basis')) || null,
        verificationStatus: cellStr(getBy(headers, row, 'verification_status')) || null,
        sourceRow: n,
      });
    });
  }

  const sources: ParsedGapSource[] = [];
  const sourceSheet = wb.getWorksheet('GAP_SOURCES');
  if (sourceSheet) {
    const headers = headerMap(sourceSheet.getRow(1));
    sourceSheet.eachRow((row, n) => {
      if (n === 1) return;
      const sourceId = cellStr(getBy(headers, row, 'source_id'));
      const gapId = cellStr(getBy(headers, row, 'gap_id'));
      if (!sourceId || !gapId) return;
      sources.push({
        sourceId,
        gapId,
        sourceType: cellStr(getBy(headers, row, 'source_type')) || null,
        sourceFile: cellStr(getBy(headers, row, 'source_file')) || null,
        sourceReference: cellStr(getBy(headers, row, 'source_reference')) || null,
        notes: cellStr(getBy(headers, row, 'notes')) || null,
        sourceRow: n,
      });
    });
  }

  const reviewQueue: ParsedGapReview[] = [];
  const reviewSheet = wb.getWorksheet('GAP_REVIEW_QUEUE');
  if (reviewSheet) {
    const headers = headerMap(reviewSheet.getRow(1));
    reviewSheet.eachRow((row, n) => {
      if (n === 1) return;
      const reviewId = cellStr(getBy(headers, row, 'review_id'));
      if (!reviewId) return;
      reviewQueue.push({
        reviewId,
        subjectName: cellStr(getBy(headers, row, 'subject')) || null,
        courseCode: normalizeCourseCode(cellStr(getBy(headers, row, 'course_code'))) || null,
        entityType: cellStr(getBy(headers, row, 'entity_type')) || null,
        entityId: cellStr(getBy(headers, row, 'entity_id')) || null,
        issue: cellStr(getBy(headers, row, 'issue')) || null,
        proposedValue: cellStr(getBy(headers, row, 'proposed_value')) || null,
        reason: cellStr(getBy(headers, row, 'reason')) || null,
        source: cellStr(getBy(headers, row, 'source')) || null,
        reviewStatus: cellStr(getBy(headers, row, 'review_status')) || null,
        sourceRow: n,
      });
    });
  }

  // Preserve verification lineage — never upgrade ACADEMIC_ANALYSIS to VERIFIED
  for (const g of gaps) {
    if (g.verificationStatus && /verified/i.test(g.verificationStatus) && /academic_analysis/i.test(g.mappingOrigin || '')) {
      warnings.push(`${g.gapId}: mapping origin is ACADEMIC_ANALYSIS; verification left as ${g.verificationStatus}`);
    }
  }

  return { gaps, coLinks, outcomeLinks, actions, sources, reviewQueue, sheets, errors, warnings };
}

function defaultPublicRoots() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return [
    path.resolve(here, '../../../../web/public'),
    path.resolve(here, '../../../../../apps/web/public'),
    path.resolve(process.cwd(), '../web/public'),
    path.resolve(process.cwd(), 'apps/web/public'),
    path.resolve(process.cwd(), 'public'),
  ];
}

export async function discoverGapMasterFiles(roots: string[] = defaultPublicRoots()) {
  const found: string[] = [];
  for (const root of roots) {
    let entries: string[] = [];
    try {
      entries = await readdir(root);
    } catch {
      continue;
    }
    for (const name of entries) {
      if (!/\.xlsx$/i.test(name) || name.startsWith('~')) continue;
      found.push(path.join(root, name));
    }
  }

  const masters: Array<{ filePath: string; fileName: string; sheets: string[] }> = [];
  for (const filePath of found) {
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.readFile(filePath);
    } catch {
      continue;
    }
    const sheets = wb.worksheets.map((s) => s.name);
    if (sheets.includes('GAP_MASTER')) {
      masters.push({ filePath, fileName: path.basename(filePath), sheets });
    }
  }
  masters.sort((a, b) => {
    const score = (m: { fileName: string; sheets: string[] }) => {
      let s = 0;
      if (/SkillonX_Academic_Mapping_Master/i.test(m.fileName)) s += 100;
      if (m.sheets.includes('GAP_CO_MAPPING')) s += 10;
      if (m.sheets.includes('GAP_ACTION_MASTER')) s += 5;
      return s;
    };
    return score(b) - score(a);
  });
  return masters;
}
