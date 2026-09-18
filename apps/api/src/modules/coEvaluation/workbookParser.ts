import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import { isYes, normalizeCode, numOrNull, parseCoOrder } from './types.js';

export const CO_EVAL_SHEETS = [
  'ASSESSMENT_COMPONENT_MASTER',
  'COURSE_ASSESSMENT_STRUCTURE',
  'COURSE_ASSESSMENT_COMPONENTS',
  'CO_EVALUATION_MASTER',
  'CO_EVALUATION_COMPONENTS',
  'CO_EVALUATION_JUSTIFICATION',
  'CO_EVALUATION_SOURCE',
  'CO_EVALUATION_REVIEW',
  'CO_EVALUATION_SUMMARY',
  'CO_EVALUATION_MATRIX',
] as const;

export type ParsedAssessmentComponent = {
  componentId: string;
  code: string;
  displayName: string;
  category: string | null;
  directIndirect: string | null;
  description: string | null;
  displayOrder: number;
  active: boolean;
  sourceRow: number;
};

export type ParsedCourseAssessmentStructure = {
  courseAssessmentId: string;
  subjectKey: string | null;
  subjectName: string;
  courseCode: string;
  scheme: string | null;
  program: string | null;
  semester: string | null;
  courseType: string | null;
  cieMaxMarks: number | null;
  seeMaxMarks: number | null;
  cieWeightage: number | null;
  seeWeightage: number | null;
  minCiePass: number | null;
  minSeePass: number | null;
  overallPassRule: string | null;
  numberOfIa: number | null;
  assignmentComponent: string | null;
  quizComponent: string | null;
  activityComponent: string | null;
  labComponent: string | null;
  projectComponent: string | null;
  practicalComponent: string | null;
  questionPaperPattern: string | null;
  assessmentDescription: string | null;
  sourceFile: string | null;
  sourceSection: string | null;
  sourcePage: string | null;
  verificationStatus: string | null;
  notes: string | null;
  sourceRow: number;
};

export type ParsedCourseAssessmentComponent = {
  courseAssessmentComponentId: string;
  subjectKey: string | null;
  courseCode: string;
  scheme: string | null;
  componentId: string;
  componentName: string;
  maxMarks: number | null;
  weightage: number | null;
  count: number | null;
  mandatory: boolean;
  description: string | null;
  source: string | null;
  verificationStatus: string | null;
  sourceRow: number;
};

export type ParsedCoEvaluationMaster = {
  coEvaluationId: string;
  subjectKey: string | null;
  subjectName: string;
  courseCode: string;
  scheme: string | null;
  program: string | null;
  semester: string | null;
  coCode: string;
  coStatement: string | null;
  coSourceStatus: string | null;
  standardMarksDistribution: number | null;
  standardEvaluationPercent: number | null;
  totalStandardComponentMarks: number | null;
  defaultStatus: string | null;
  sourceOrigin: string | null;
  verificationStatus: string | null;
  lecturerEditable: boolean;
  notes: string | null;
  displayOrder: number;
  sourceRow: number;
};

export type ParsedCoEvaluationComponent = {
  coEvaluationComponentId: string;
  subjectKey: string | null;
  subjectName: string | null;
  courseCode: string;
  scheme: string | null;
  program: string | null;
  semester: string | null;
  coCode: string;
  assessmentComponentId: string;
  assessmentComponentName: string;
  standardMarksAssigned: number | null;
  standardWeightage: number | null;
  evaluationPercentContribution: number | null;
  isDefault: boolean;
  lecturerEditable: boolean;
  mappingBasis: string | null;
  sourceOrigin: string | null;
  verificationStatus: string | null;
  notes: string | null;
  sourceRow: number;
};

export type ParsedCoEvaluationJustification = {
  justificationId: string;
  subjectKey: string | null;
  courseCode: string;
  scheme: string | null;
  coCode: string;
  assessmentComponentId: string;
  standardValue: number | null;
  justification: string | null;
  sourceOrigin: string | null;
  sourceReference: string | null;
  verificationStatus: string | null;
  notes: string | null;
  sourceRow: number;
};

export type ParsedCoEvaluationSource = {
  sourceId: string;
  subjectKey: string | null;
  subjectName: string | null;
  courseCode: string;
  scheme: string | null;
  sourceType: string | null;
  sourceFile: string | null;
  sourcePageSection: string | null;
  extractedField: string | null;
  extractedValue: string | null;
  verificationStatus: string | null;
  notes: string | null;
  sourceRow: number;
};

export type ParsedCoEvaluationReview = {
  reviewId: string;
  subjectName: string | null;
  courseCode: string | null;
  scheme: string | null;
  coCode: string | null;
  component: string | null;
  issueType: string | null;
  currentValue: string | null;
  proposedValue: string | null;
  reason: string | null;
  source: string | null;
  priority: string | null;
  reviewStatus: string | null;
  reviewer: string | null;
  reviewNotes: string | null;
  sourceRow: number;
};

export type ParsedCoEvaluationSummary = {
  subjectName: string;
  courseCode: string;
  scheme: string | null;
  program: string | null;
  semester: string | null;
  courseType: string | null;
  coCount: number;
  assessmentComponentsLabel: string | null;
  officialStructureStatus: string | null;
  standardEvaluationStatus: string | null;
  evaluationPercentTotal: number | null;
  componentTotalValidation: string | null;
  sourceStatus: string | null;
  reviewItems: number | null;
  readyForImport: string | null;
  sourceRow: number;
};

export type ParsedCoEvalWorkbook = {
  assessmentComponents: ParsedAssessmentComponent[];
  structures: ParsedCourseAssessmentStructure[];
  courseComponents: ParsedCourseAssessmentComponent[];
  coMasters: ParsedCoEvaluationMaster[];
  componentMappings: ParsedCoEvaluationComponent[];
  justifications: ParsedCoEvaluationJustification[];
  sources: ParsedCoEvaluationSource[];
  reviewQueue: ParsedCoEvaluationReview[];
  summaries: ParsedCoEvaluationSummary[];
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
  return numOrNull(
    typeof value === 'object' && value && 'result' in value
      ? (value as { result: unknown }).result
      : value,
  );
}

function headerMap(row: ExcelJS.Row): Map<string, number> {
  const map = new Map<string, number>();
  row.eachCell((cell, col) => {
    const key = cellStr(cell.value)
      .toLowerCase()
      .replace(/[%]/g, 'percent')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    if (key) map.set(key, col);
  });
  return map;
}

function getBy(headers: Map<string, number>, row: ExcelJS.Row, ...names: string[]) {
  for (const name of names) {
    const key = name
      .toLowerCase()
      .replace(/[%]/g, 'percent')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    const col = headers.get(key);
    if (col != null) return row.getCell(col).value;
  }
  return null;
}

export async function parseCoEvalWorkbook(buffer: Buffer | string): Promise<ParsedCoEvalWorkbook> {
  const wb = new ExcelJS.Workbook();
  if (typeof buffer === 'string') await wb.xlsx.readFile(buffer);
  else await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const sheets = wb.worksheets.map((s) => s.name);
  const errors: string[] = [];
  const warnings: string[] = [];

  const required = [
    'ASSESSMENT_COMPONENT_MASTER',
    'COURSE_ASSESSMENT_STRUCTURE',
    'COURSE_ASSESSMENT_COMPONENTS',
    'CO_EVALUATION_MASTER',
    'CO_EVALUATION_COMPONENTS',
  ];
  for (const name of required) {
    if (!sheets.includes(name)) errors.push(`${name} sheet is required`);
  }
  if (errors.length) {
    return {
      assessmentComponents: [],
      structures: [],
      courseComponents: [],
      coMasters: [],
      componentMappings: [],
      justifications: [],
      sources: [],
      reviewQueue: [],
      summaries: [],
      sheets,
      errors,
      warnings,
    };
  }

  const assessmentComponents: ParsedAssessmentComponent[] = [];
  {
    const ws = wb.getWorksheet('ASSESSMENT_COMPONENT_MASTER')!;
    const headers = headerMap(ws.getRow(1));
    const seen = new Set<string>();
    ws.eachRow((row, n) => {
      if (n === 1) return;
      const componentId = cellStr(getBy(headers, row, 'assessment_component_id'));
      if (!componentId) return;
      if (seen.has(componentId)) {
        errors.push(`Duplicate ASSESSMENT_COMPONENT_ID ${componentId} at row ${n}`);
        return;
      }
      seen.add(componentId);
      assessmentComponents.push({
        componentId,
        code: cellStr(getBy(headers, row, 'code')) || componentId,
        displayName: cellStr(getBy(headers, row, 'display_name')) || componentId,
        category: cellStr(getBy(headers, row, 'category')) || null,
        directIndirect: cellStr(getBy(headers, row, 'direct_indirect')) || null,
        description: cellStr(getBy(headers, row, 'description')) || null,
        displayOrder: cellNum(getBy(headers, row, 'display_order')) ?? 100,
        active: isYes(getBy(headers, row, 'active') ?? 'YES'),
        sourceRow: n,
      });
    });
  }

  const structures: ParsedCourseAssessmentStructure[] = [];
  {
    const ws = wb.getWorksheet('COURSE_ASSESSMENT_STRUCTURE')!;
    const headers = headerMap(ws.getRow(1));
    const seen = new Set<string>();
    ws.eachRow((row, n) => {
      if (n === 1) return;
      const courseAssessmentId = cellStr(getBy(headers, row, 'course_assessment_id'));
      const courseCode = normalizeCode(cellStr(getBy(headers, row, 'course_code')));
      if (!courseAssessmentId || !courseCode) return;
      if (seen.has(courseAssessmentId)) {
        errors.push(`Duplicate COURSE_ASSESSMENT_ID ${courseAssessmentId} at row ${n}`);
        return;
      }
      seen.add(courseAssessmentId);
      structures.push({
        courseAssessmentId,
        subjectKey: cellStr(getBy(headers, row, 'subject_id')) || null,
        subjectName: cellStr(getBy(headers, row, 'subject_name')) || courseCode,
        courseCode,
        scheme: cellStr(getBy(headers, row, 'scheme')) || null,
        program: cellStr(getBy(headers, row, 'program')) || null,
        semester: cellStr(getBy(headers, row, 'semester')) || null,
        courseType: cellStr(getBy(headers, row, 'course_type')) || null,
        cieMaxMarks: cellNum(getBy(headers, row, 'cie_max_marks')),
        seeMaxMarks: cellNum(getBy(headers, row, 'see_max_marks')),
        cieWeightage: cellNum(getBy(headers, row, 'cie_weightage')),
        seeWeightage: cellNum(getBy(headers, row, 'see_weightage')),
        minCiePass: cellNum(getBy(headers, row, 'min_cie_pass')),
        minSeePass: cellNum(getBy(headers, row, 'min_see_pass')),
        overallPassRule: cellStr(getBy(headers, row, 'overall_pass_rule')) || null,
        numberOfIa: cellNum(getBy(headers, row, 'number_of_ia')),
        assignmentComponent: cellStr(getBy(headers, row, 'assignment_component')) || null,
        quizComponent: cellStr(getBy(headers, row, 'quiz_component')) || null,
        activityComponent: cellStr(getBy(headers, row, 'activity_component')) || null,
        labComponent: cellStr(getBy(headers, row, 'lab_component')) || null,
        projectComponent: cellStr(getBy(headers, row, 'project_component')) || null,
        practicalComponent: cellStr(getBy(headers, row, 'practical_component')) || null,
        questionPaperPattern: cellStr(getBy(headers, row, 'question_paper_pattern')) || null,
        assessmentDescription: cellStr(getBy(headers, row, 'assessment_description')) || null,
        sourceFile: cellStr(getBy(headers, row, 'source_file')) || null,
        sourceSection: cellStr(getBy(headers, row, 'source_section')) || null,
        sourcePage: cellStr(getBy(headers, row, 'source_page')) || null,
        verificationStatus: cellStr(getBy(headers, row, 'verification_status')) || null,
        notes: cellStr(getBy(headers, row, 'notes')) || null,
        sourceRow: n,
      });
    });
  }

  const courseComponents: ParsedCourseAssessmentComponent[] = [];
  {
    const ws = wb.getWorksheet('COURSE_ASSESSMENT_COMPONENTS')!;
    const headers = headerMap(ws.getRow(1));
    const seen = new Set<string>();
    ws.eachRow((row, n) => {
      if (n === 1) return;
      const id = cellStr(getBy(headers, row, 'course_assessment_component_id'));
      const courseCode = normalizeCode(cellStr(getBy(headers, row, 'course_code')));
      const componentId = cellStr(getBy(headers, row, 'component_id'));
      if (!id || !courseCode || !componentId) return;
      if (seen.has(id)) {
        errors.push(`Duplicate COURSE_ASSESSMENT_COMPONENT_ID ${id} at row ${n}`);
        return;
      }
      seen.add(id);
      courseComponents.push({
        courseAssessmentComponentId: id,
        subjectKey: cellStr(getBy(headers, row, 'subject_id')) || null,
        courseCode,
        scheme: cellStr(getBy(headers, row, 'scheme')) || null,
        componentId,
        componentName: cellStr(getBy(headers, row, 'component_name')) || componentId,
        maxMarks: cellNum(getBy(headers, row, 'max_marks')),
        weightage: cellNum(getBy(headers, row, 'weightage')),
        count: cellNum(getBy(headers, row, 'count')),
        mandatory: isYes(getBy(headers, row, 'mandatory') ?? 'YES'),
        description: cellStr(getBy(headers, row, 'description')) || null,
        source: cellStr(getBy(headers, row, 'source')) || null,
        verificationStatus: cellStr(getBy(headers, row, 'verification_status')) || null,
        sourceRow: n,
      });
    });
  }

  const coMasters: ParsedCoEvaluationMaster[] = [];
  {
    const ws = wb.getWorksheet('CO_EVALUATION_MASTER')!;
    const headers = headerMap(ws.getRow(1));
    const seen = new Set<string>();
    ws.eachRow((row, n) => {
      if (n === 1) return;
      const coEvaluationId = cellStr(getBy(headers, row, 'co_evaluation_id'));
      const courseCode = normalizeCode(cellStr(getBy(headers, row, 'course_code')));
      const coCode = cellStr(getBy(headers, row, 'co_code')).toUpperCase();
      if (!coEvaluationId || !courseCode || !coCode) return;
      if (seen.has(coEvaluationId)) {
        errors.push(`Duplicate CO_EVALUATION_ID ${coEvaluationId} at row ${n}`);
        return;
      }
      seen.add(coEvaluationId);
      coMasters.push({
        coEvaluationId,
        subjectKey: cellStr(getBy(headers, row, 'subject_id')) || null,
        subjectName: cellStr(getBy(headers, row, 'subject_name')) || courseCode,
        courseCode,
        scheme: cellStr(getBy(headers, row, 'scheme')) || null,
        program: cellStr(getBy(headers, row, 'program')) || null,
        semester: cellStr(getBy(headers, row, 'semester')) || null,
        coCode,
        coStatement: cellStr(getBy(headers, row, 'co_statement')) || null,
        coSourceStatus: cellStr(getBy(headers, row, 'co_source_status')) || null,
        standardMarksDistribution: cellNum(getBy(headers, row, 'standard_marks_distribution')),
        standardEvaluationPercent: cellNum(getBy(headers, row, 'standard_evaluation_percent')),
        totalStandardComponentMarks: cellNum(getBy(headers, row, 'total_standard_component_marks')),
        defaultStatus: cellStr(getBy(headers, row, 'default_status')) || null,
        sourceOrigin: cellStr(getBy(headers, row, 'source_origin')) || null,
        verificationStatus: cellStr(getBy(headers, row, 'verification_status')) || null,
        lecturerEditable: isYes(getBy(headers, row, 'lecturer_editable') ?? 'YES'),
        notes: cellStr(getBy(headers, row, 'notes')) || null,
        displayOrder: parseCoOrder(coCode),
        sourceRow: n,
      });
    });
  }

  const componentMappings: ParsedCoEvaluationComponent[] = [];
  {
    const ws = wb.getWorksheet('CO_EVALUATION_COMPONENTS')!;
    const headers = headerMap(ws.getRow(1));
    const seen = new Set<string>();
    ws.eachRow((row, n) => {
      if (n === 1) return;
      const id = cellStr(getBy(headers, row, 'co_evaluation_component_id'));
      const courseCode = normalizeCode(cellStr(getBy(headers, row, 'course_code')));
      const coCode = cellStr(getBy(headers, row, 'co_code')).toUpperCase();
      const assessmentComponentId = cellStr(getBy(headers, row, 'assessment_component_id'));
      if (!id || !courseCode || !coCode || !assessmentComponentId) return;
      if (seen.has(id)) {
        errors.push(`Duplicate CO_EVALUATION_COMPONENT_ID ${id} at row ${n}`);
        return;
      }
      seen.add(id);
      componentMappings.push({
        coEvaluationComponentId: id,
        subjectKey: cellStr(getBy(headers, row, 'subject_id')) || null,
        subjectName: cellStr(getBy(headers, row, 'subject_name')) || null,
        courseCode,
        scheme: cellStr(getBy(headers, row, 'scheme')) || null,
        program: cellStr(getBy(headers, row, 'program')) || null,
        semester: cellStr(getBy(headers, row, 'semester')) || null,
        coCode,
        assessmentComponentId,
        assessmentComponentName:
          cellStr(getBy(headers, row, 'assessment_component_name')) || assessmentComponentId,
        standardMarksAssigned: cellNum(getBy(headers, row, 'standard_marks_assigned')),
        standardWeightage: cellNum(getBy(headers, row, 'standard_weightage')),
        evaluationPercentContribution: cellNum(
          getBy(headers, row, 'evaluation_percent_contribution'),
        ),
        isDefault: isYes(getBy(headers, row, 'is_default') ?? 'YES'),
        lecturerEditable: isYes(getBy(headers, row, 'lecturer_editable') ?? 'YES'),
        mappingBasis: cellStr(getBy(headers, row, 'mapping_basis')) || null,
        sourceOrigin: cellStr(getBy(headers, row, 'source_origin')) || null,
        verificationStatus: cellStr(getBy(headers, row, 'verification_status')) || null,
        notes: cellStr(getBy(headers, row, 'notes')) || null,
        sourceRow: n,
      });
    });
  }

  const justifications: ParsedCoEvaluationJustification[] = [];
  const justSheet = wb.getWorksheet('CO_EVALUATION_JUSTIFICATION');
  if (justSheet) {
    const headers = headerMap(justSheet.getRow(1));
    const seen = new Set<string>();
    justSheet.eachRow((row, n) => {
      if (n === 1) return;
      const justificationId = cellStr(getBy(headers, row, 'justification_id'));
      const courseCode = normalizeCode(cellStr(getBy(headers, row, 'course_code')));
      const coCode = cellStr(getBy(headers, row, 'co_code')).toUpperCase();
      const assessmentComponentId = cellStr(getBy(headers, row, 'assessment_component_id'));
      if (!justificationId || !courseCode || !coCode || !assessmentComponentId) return;
      if (seen.has(justificationId)) {
        errors.push(`Duplicate JUSTIFICATION_ID ${justificationId} at row ${n}`);
        return;
      }
      seen.add(justificationId);
      justifications.push({
        justificationId,
        subjectKey: cellStr(getBy(headers, row, 'subject_id')) || null,
        courseCode,
        scheme: cellStr(getBy(headers, row, 'scheme')) || null,
        coCode,
        assessmentComponentId,
        standardValue: cellNum(getBy(headers, row, 'standard_value')),
        justification: cellStr(getBy(headers, row, 'justification')) || null,
        sourceOrigin: cellStr(getBy(headers, row, 'source_origin')) || null,
        sourceReference: cellStr(getBy(headers, row, 'source_reference')) || null,
        verificationStatus: cellStr(getBy(headers, row, 'verification_status')) || null,
        notes: cellStr(getBy(headers, row, 'notes')) || null,
        sourceRow: n,
      });
    });
  } else {
    warnings.push('CO_EVALUATION_JUSTIFICATION sheet missing');
  }

  const sources: ParsedCoEvaluationSource[] = [];
  const sourceSheet = wb.getWorksheet('CO_EVALUATION_SOURCE');
  if (sourceSheet) {
    const headers = headerMap(sourceSheet.getRow(1));
    const seen = new Set<string>();
    sourceSheet.eachRow((row, n) => {
      if (n === 1) return;
      const sourceId = cellStr(getBy(headers, row, 'source_id'));
      const courseCode = normalizeCode(cellStr(getBy(headers, row, 'course_code')));
      if (!sourceId || !courseCode) return;
      if (seen.has(sourceId)) {
        errors.push(`Duplicate SOURCE_ID ${sourceId} at row ${n}`);
        return;
      }
      seen.add(sourceId);
      sources.push({
        sourceId,
        subjectKey: cellStr(getBy(headers, row, 'subject_id')) || null,
        subjectName: cellStr(getBy(headers, row, 'subject_name')) || null,
        courseCode,
        scheme: cellStr(getBy(headers, row, 'scheme')) || null,
        sourceType: cellStr(getBy(headers, row, 'source_type')) || null,
        sourceFile: cellStr(getBy(headers, row, 'source_file')) || null,
        sourcePageSection: cellStr(getBy(headers, row, 'source_page_section')) || null,
        extractedField: cellStr(getBy(headers, row, 'extracted_field')) || null,
        extractedValue: cellStr(getBy(headers, row, 'extracted_value')) || null,
        verificationStatus: cellStr(getBy(headers, row, 'verification_status')) || null,
        notes: cellStr(getBy(headers, row, 'notes')) || null,
        sourceRow: n,
      });
    });
  }

  const reviewQueue: ParsedCoEvaluationReview[] = [];
  const reviewSheet = wb.getWorksheet('CO_EVALUATION_REVIEW');
  if (reviewSheet) {
    const headers = headerMap(reviewSheet.getRow(1));
    const seen = new Set<string>();
    reviewSheet.eachRow((row, n) => {
      if (n === 1) return;
      const reviewId = cellStr(getBy(headers, row, 'review_id'));
      if (!reviewId) return;
      if (seen.has(reviewId)) {
        errors.push(`Duplicate REVIEW_ID ${reviewId} at row ${n}`);
        return;
      }
      seen.add(reviewId);
      reviewQueue.push({
        reviewId,
        subjectName: cellStr(getBy(headers, row, 'subject')) || null,
        courseCode: normalizeCode(cellStr(getBy(headers, row, 'course_code'))) || null,
        scheme: cellStr(getBy(headers, row, 'scheme')) || null,
        coCode: cellStr(getBy(headers, row, 'co')).toUpperCase() || null,
        component: cellStr(getBy(headers, row, 'component')) || null,
        issueType: cellStr(getBy(headers, row, 'issue_type')) || null,
        currentValue: cellStr(getBy(headers, row, 'current_value')) || null,
        proposedValue: cellStr(getBy(headers, row, 'proposed_value')) || null,
        reason: cellStr(getBy(headers, row, 'reason')) || null,
        source: cellStr(getBy(headers, row, 'source')) || null,
        priority: cellStr(getBy(headers, row, 'priority')) || null,
        reviewStatus: cellStr(getBy(headers, row, 'status')) || null,
        reviewer: cellStr(getBy(headers, row, 'reviewer')) || null,
        reviewNotes: cellStr(getBy(headers, row, 'review_notes')) || null,
        sourceRow: n,
      });
    });
  }

  const summaries: ParsedCoEvaluationSummary[] = [];
  const summarySheet = wb.getWorksheet('CO_EVALUATION_SUMMARY');
  if (summarySheet) {
    const headers = headerMap(summarySheet.getRow(1));
    summarySheet.eachRow((row, n) => {
      if (n === 1) return;
      const courseCode = normalizeCode(cellStr(getBy(headers, row, 'course_code')));
      const subjectName = cellStr(getBy(headers, row, 'subject'));
      if (!courseCode && !subjectName) return;
      summaries.push({
        subjectName: subjectName || courseCode,
        courseCode,
        scheme: cellStr(getBy(headers, row, 'scheme')) || null,
        program: cellStr(getBy(headers, row, 'program')) || null,
        semester: cellStr(getBy(headers, row, 'semester')) || null,
        courseType: cellStr(getBy(headers, row, 'course_type')) || null,
        coCount: cellNum(getBy(headers, row, 'co_count')) ?? 0,
        assessmentComponentsLabel: cellStr(getBy(headers, row, 'assessment_components')) || null,
        officialStructureStatus:
          cellStr(getBy(headers, row, 'official_assessment_structure_status')) || null,
        standardEvaluationStatus:
          cellStr(getBy(headers, row, 'standard_co_evaluation_status')) || null,
        evaluationPercentTotal: cellNum(getBy(headers, row, 'evaluation_percent_total')),
        componentTotalValidation: cellStr(getBy(headers, row, 'component_total_validation')) || null,
        sourceStatus: cellStr(getBy(headers, row, 'source_status')) || null,
        reviewItems: cellNum(getBy(headers, row, 'review_items')),
        readyForImport: cellStr(getBy(headers, row, 'ready_for_import')) || null,
        sourceRow: n,
      });
    });
  }

  // Cross-check: component mappings should reference known assessment components / COs
  const acIds = new Set(assessmentComponents.map((a) => a.componentId));
  const coKeys = new Set(coMasters.map((c) => `${c.courseCode}|${c.scheme || ''}|${c.coCode}`));
  for (const m of componentMappings) {
    if (!acIds.has(m.assessmentComponentId)) {
      warnings.push(
        `${m.coEvaluationComponentId}: unknown assessment component ${m.assessmentComponentId}`,
      );
    }
    const key = `${m.courseCode}|${m.scheme || ''}|${m.coCode}`;
    if (!coKeys.has(key)) {
      warnings.push(`${m.coEvaluationComponentId}: CO ${m.coCode} missing from CO_EVALUATION_MASTER`);
    }
  }

  return {
    assessmentComponents,
    structures,
    courseComponents,
    coMasters,
    componentMappings,
    justifications,
    sources,
    reviewQueue,
    summaries,
    sheets,
    errors,
    warnings,
  };
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

export async function discoverCoEvalMasterFiles(roots: string[] = defaultPublicRoots()) {
  const found: string[] = [];
  for (const root of roots) {
    let entries: string[] = [];
    try {
      entries = await readdir(root);
    } catch {
      continue;
    }
    for (const name of entries) {
      if (!/\.xlsx$/i.test(name) || name.startsWith('~') || name.endsWith('.bak')) continue;
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
    const sheetNames = wb.worksheets.map((s) => s.name);
    if (sheetNames.includes('CO_EVALUATION_MASTER') && sheetNames.includes('COURSE_ASSESSMENT_STRUCTURE')) {
      masters.push({ filePath, fileName: path.basename(filePath), sheets: sheetNames });
    }
  }
  masters.sort((a, b) => {
    const score = (m: { fileName: string; sheets: string[] }) => {
      let s = 0;
      if (/SkillonX_Academic_Mapping_Master/i.test(m.fileName)) s += 100;
      if (m.sheets.includes('CO_EVALUATION_COMPONENTS')) s += 20;
      if (m.sheets.includes('CO_EVALUATION_SUMMARY')) s += 5;
      return s;
    };
    return score(b) - score(a);
  });
  return masters;
}
