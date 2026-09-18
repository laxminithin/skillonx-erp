import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import { normalizeAssessment, normalizeDelivery, normalizeOrigin } from './types.js';

export const CBS_SHEETS = [
  'BEYOND_SYLLABUS_MASTER',
  'BEYOND_SYLLABUS_CO_MAPPING',
  'BEYOND_SYLLABUS_ACTIONS',
  'BEYOND_SYLLABUS_SOURCES',
  'BEYOND_SYLLABUS_REVIEW',
  'BEYOND_SYLLABUS_SUMMARY',
] as const;

export type ParsedCbsMaster = {
  cbsId: string;
  subjectKey: string | null;
  subjectName: string;
  courseCode: string;
  scheme: string | null;
  program: string | null;
  semester: string | null;
  moduleUnit: string | null;
  relatedTopic: string | null;
  title: string;
  contentDescription: string | null;
  originType: string;
  relatedGapId: string | null;
  rationale: string | null;
  expectedBenefit: string | null;
  suggestedCo: string | null;
  suggestedDeliveryMethod: string | null;
  suggestedHours: number | null;
  suggestedAssessment: string | null;
  priority: string | null;
  sourceType: string | null;
  sourceReference: string | null;
  mappingOrigin: string | null;
  verificationStatus: string | null;
  active: boolean;
  notes: string | null;
  sourceRow: number;
};

export type ParsedCbsCoLink = {
  cbsId: string;
  courseCode: string;
  coCode: string;
  relationship: string | null;
  basis: string | null;
  verificationStatus: string | null;
  sourceRow: number;
};

export type ParsedCbsAction = {
  actionId: string;
  cbsId: string;
  actionType: string;
  recommendedAction: string;
  priority: string | null;
  verificationStatus: string | null;
  sourceRow: number;
};

export type ParsedCbsSource = {
  sourceId: string;
  cbsId: string;
  sourceType: string | null;
  sourceFile: string | null;
  sourceReference: string | null;
  notes: string | null;
  sourceRow: number;
};

export type ParsedCbsReview = {
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

export type ParsedCbsWorkbook = {
  items: ParsedCbsMaster[];
  coLinks: ParsedCbsCoLink[];
  actions: ParsedCbsAction[];
  sources: ParsedCbsSource[];
  reviewQueue: ParsedCbsReview[];
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

function findSheet(wb: ExcelJS.Workbook, ...names: string[]) {
  for (const name of names) {
    const ws = wb.getWorksheet(name);
    if (ws) return ws;
  }
  // truncated Excel names (31-char limit)
  for (const ws of wb.worksheets) {
    for (const name of names) {
      if (ws.name === name || name.startsWith(ws.name) || ws.name.startsWith(name.slice(0, 28))) return ws;
    }
  }
  return null;
}

export async function parseCbsWorkbook(buffer: Buffer | string): Promise<ParsedCbsWorkbook> {
  const wb = new ExcelJS.Workbook();
  if (typeof buffer === 'string') await wb.xlsx.readFile(buffer);
  else await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const sheets = wb.worksheets.map((s) => s.name);
  const errors: string[] = [];
  const warnings: string[] = [];

  const masterSheet = findSheet(wb, 'BEYOND_SYLLABUS_MASTER');
  if (!masterSheet) {
    errors.push('BEYOND_SYLLABUS_MASTER sheet is required');
    return { items: [], coLinks: [], actions: [], sources: [], reviewQueue: [], sheets, errors, warnings };
  }

  const items: ParsedCbsMaster[] = [];
  const headers = headerMap(masterSheet.getRow(1));
  masterSheet.eachRow((row, n) => {
    if (n === 1) return;
    const cbsId = cellStr(getBy(headers, row, 'cbs_id'));
    const title = cellStr(getBy(headers, row, 'title'));
    if (!cbsId || !title) return;
    const activeRaw = cellStr(getBy(headers, row, 'active')).toUpperCase();
    items.push({
      cbsId,
      subjectKey: cellStr(getBy(headers, row, 'subject_id')) || null,
      subjectName: cellStr(getBy(headers, row, 'subject_name')) || title,
      courseCode: normalizeCourseCode(cellStr(getBy(headers, row, 'course_code'))),
      scheme: cellStr(getBy(headers, row, 'scheme')) || null,
      program: cellStr(getBy(headers, row, 'program')) || null,
      semester: cellStr(getBy(headers, row, 'semester')) || null,
      moduleUnit: cellStr(getBy(headers, row, 'module_or_unit', 'module_unit')) || null,
      relatedTopic: cellStr(getBy(headers, row, 'related_topic')) || null,
      title,
      contentDescription: cellStr(getBy(headers, row, 'content_description')) || null,
      originType: normalizeOrigin(cellStr(getBy(headers, row, 'origin_type'))),
      relatedGapId: cellStr(getBy(headers, row, 'related_gap_id')) || null,
      rationale: cellStr(getBy(headers, row, 'rationale')) || null,
      expectedBenefit: cellStr(getBy(headers, row, 'expected_benefit')) || null,
      suggestedCo: cellStr(getBy(headers, row, 'suggested_co')).toUpperCase() || null,
      suggestedDeliveryMethod: normalizeDelivery(cellStr(getBy(headers, row, 'suggested_delivery_method'))),
      suggestedHours: cellNum(getBy(headers, row, 'suggested_hours')),
      suggestedAssessment: normalizeAssessment(cellStr(getBy(headers, row, 'suggested_assessment'))),
      priority: cellStr(getBy(headers, row, 'priority')) || null,
      sourceType: cellStr(getBy(headers, row, 'source_type')) || null,
      sourceReference: cellStr(getBy(headers, row, 'source_reference')) || null,
      mappingOrigin: cellStr(getBy(headers, row, 'mapping_origin')) || null,
      verificationStatus: cellStr(getBy(headers, row, 'verification_status')) || null,
      active: activeRaw === '' || activeRaw === 'YES' || activeRaw === 'TRUE' || activeRaw === '1',
      notes: cellStr(getBy(headers, row, 'notes')) || null,
      sourceRow: n,
    });
  });

  const coLinks: ParsedCbsCoLink[] = [];
  const coSheet = findSheet(wb, 'BEYOND_SYLLABUS_CO_MAPPING');
  if (coSheet) {
    const h = headerMap(coSheet.getRow(1));
    coSheet.eachRow((row, n) => {
      if (n === 1) return;
      const cbsId = cellStr(getBy(h, row, 'cbs_id'));
      const coCode = cellStr(getBy(h, row, 'co_code'));
      if (!cbsId || !coCode) return;
      coLinks.push({
        cbsId,
        courseCode: normalizeCourseCode(cellStr(getBy(h, row, 'course_code'))),
        coCode: coCode.toUpperCase(),
        relationship: cellStr(getBy(h, row, 'relationship')) || null,
        basis: cellStr(getBy(h, row, 'basis')) || null,
        verificationStatus: cellStr(getBy(h, row, 'verification_status')) || null,
        sourceRow: n,
      });
    });
  } else warnings.push('BEYOND_SYLLABUS_CO_MAPPING sheet missing');

  const actions: ParsedCbsAction[] = [];
  const actionSheet = findSheet(wb, 'BEYOND_SYLLABUS_ACTIONS', 'BEYOND_SYLLABUS_RECOMMENDED_ACTIONS');
  if (actionSheet) {
    const h = headerMap(actionSheet.getRow(1));
    actionSheet.eachRow((row, n) => {
      if (n === 1) return;
      const actionId = cellStr(getBy(h, row, 'action_id'));
      const cbsId = cellStr(getBy(h, row, 'cbs_id'));
      const recommended = cellStr(getBy(h, row, 'recommended_action'));
      if (!actionId || !cbsId || !recommended) return;
      actions.push({
        actionId,
        cbsId,
        actionType: normalizeDelivery(cellStr(getBy(h, row, 'action_type'))),
        recommendedAction: recommended,
        priority: cellStr(getBy(h, row, 'priority')) || null,
        verificationStatus: cellStr(getBy(h, row, 'verification_status')) || null,
        sourceRow: n,
      });
    });
  }

  const sources: ParsedCbsSource[] = [];
  const sourceSheet = findSheet(wb, 'BEYOND_SYLLABUS_SOURCES');
  if (sourceSheet) {
    const h = headerMap(sourceSheet.getRow(1));
    sourceSheet.eachRow((row, n) => {
      if (n === 1) return;
      const sourceId = cellStr(getBy(h, row, 'source_id'));
      const cbsId = cellStr(getBy(h, row, 'cbs_id'));
      if (!sourceId || !cbsId) return;
      sources.push({
        sourceId,
        cbsId,
        sourceType: cellStr(getBy(h, row, 'source_type')) || null,
        sourceFile: cellStr(getBy(h, row, 'source_file')) || null,
        sourceReference: cellStr(getBy(h, row, 'source_reference')) || null,
        notes: cellStr(getBy(h, row, 'notes')) || null,
        sourceRow: n,
      });
    });
  }

  const reviewQueue: ParsedCbsReview[] = [];
  const reviewSheet = findSheet(wb, 'BEYOND_SYLLABUS_REVIEW');
  if (reviewSheet) {
    const h = headerMap(reviewSheet.getRow(1));
    reviewSheet.eachRow((row, n) => {
      if (n === 1) return;
      const reviewId = cellStr(getBy(h, row, 'review_id'));
      if (!reviewId || reviewId === 'EMPTY') return;
      reviewQueue.push({
        reviewId,
        subjectName: cellStr(getBy(h, row, 'subject_name', 'subject')) || null,
        courseCode: normalizeCourseCode(cellStr(getBy(h, row, 'course_code'))) || null,
        entityType: cellStr(getBy(h, row, 'entity_type')) || null,
        entityId: cellStr(getBy(h, row, 'entity_id')) || null,
        issue: cellStr(getBy(h, row, 'issue')) || null,
        proposedValue: cellStr(getBy(h, row, 'proposed_value')) || null,
        reason: cellStr(getBy(h, row, 'reason')) || null,
        source: cellStr(getBy(h, row, 'source')) || null,
        reviewStatus: cellStr(getBy(h, row, 'review_status')) || null,
        sourceRow: n,
      });
    });
  }

  return { items, coLinks, actions, sources, reviewQueue, sheets, errors, warnings };
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

export async function discoverCbsMasterFiles(roots: string[] = defaultPublicRoots()) {
  const found: string[] = [];
  for (const root of roots) {
    let entries: string[] = [];
    try {
      entries = await readdir(root);
    } catch {
      continue;
    }
    for (const name of entries) {
      if (!/\.xlsx$/i.test(name) || name.startsWith('~') || name.includes('.bak')) continue;
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
    if (sheets.includes('BEYOND_SYLLABUS_MASTER')) {
      masters.push({ filePath, fileName: path.basename(filePath), sheets });
    }
  }
  masters.sort((a, b) => {
    const score = (m: { fileName: string }) => (/SkillonX_Academic_Mapping_Master/i.test(m.fileName) ? 100 : 0);
    return score(b) - score(a);
  });
  return masters;
}
