import ExcelJS from 'exceljs';
import type { getEvaluation } from './service.js';

type Detail = Awaited<ReturnType<typeof getEvaluation>>;

function dash(n: number | null | undefined) {
  if (n == null || !Number.isFinite(Number(n)) || Number(n) === 0) return '—';
  return Number(n);
}

export function buildPrintModel(detail: Detail) {
  const components = detail.components.filter((c) => c.includeInMatrix);
  return {
    documentTitle: 'CO EVALUATION',
    institutionName: detail.collegeName,
    logoUrl: detail.logoUrl,
    departmentName: detail.departmentName,
    programName: detail.programName,
    subjectName: detail.subjectName,
    subjectCode: detail.courseCode,
    schemeName: detail.schemeLabel,
    semesterLabel: detail.semesterLabel,
    academicYearLabel: detail.academicYearLabel,
    preparedBy: detail.facultyName,
    status: detail.status,
    courseType: detail.courseType,
    summary: detail.summary,
    validation: detail.validation,
    matrix: {
      columns: components.map((c) => ({
        id: c.assessmentComponentId,
        name: c.displayName,
        officialMaxMarks: c.officialMaxMarks,
      })),
      rows: detail.cos.map((co) => ({
        coCode: co.coCode,
        coStatement: co.coStatement,
        values: components.map((c) => {
          const cell = detail.cells.find(
            (x) => x.coCode === co.coCode && x.assessmentComponentId === c.assessmentComponentId,
          );
          return {
            assessmentComponentId: c.assessmentComponentId,
            value: cell?.currentValue ?? null,
          };
        }),
        marksDistribution: co.currentMarksDistribution,
        evaluationPercent: co.currentEvaluationPercent,
      })),
      totals: components.map((c) => {
        const total = detail.validation.componentTotals.find(
          (t) => t.assessmentComponentId === c.assessmentComponentId,
        );
        return {
          assessmentComponentId: c.assessmentComponentId,
          allocated: total?.allocated ?? 0,
          expected: total?.expected ?? null,
        };
      }),
      evaluationPercentTotal: detail.validation.evaluationPercentTotal,
    },
    assessmentStructure: detail.assessmentStructure,
    justifications: detail.justifications.filter((j) => j.modified || (j.standardValue != null && j.standardValue !== 0)),
    sourceNotes: {
      verificationStatus: detail.verificationStatus,
      sourceStatus: detail.sourceStatus,
      snapshotMeta: detail.snapshotMeta,
    },
  };
}

export async function exportCoEvaluationXlsx(detail: Detail) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SkillonX';
  wb.created = new Date();

  const summary = wb.addWorksheet('SUMMARY');
  summary.addRow(['Field', 'Value']);
  const summaryRows: Array<[string, unknown]> = [
    ['Subject', detail.subjectName],
    ['Course Code', detail.courseCode],
    ['Scheme', detail.schemeLabel],
    ['Program', detail.programName],
    ['Semester', detail.semesterLabel],
    ['Academic Year', detail.academicYearLabel],
    ['Course Type', detail.courseType],
    ['Prepared By', detail.facultyName],
    ['Status', detail.status],
    ['CO Count', detail.summary.courseOutcomes],
    ['Assessment Components', detail.summary.assessmentComponents],
    ['Allocated Marks', `${detail.summary.allocatedMarks} / ${detail.summary.expectedMarks ?? '—'}`],
    ['Evaluation Allocation %', detail.summary.evaluationAllocation],
    ['Modified Values', detail.summary.modifiedValues],
    ['Verification', detail.verificationStatus],
    ['Source Status', detail.sourceStatus],
  ];
  for (const [k, v] of summaryRows) summary.addRow([k, v ?? '']);

  const matrix = wb.addWorksheet('CO_EVALUATION');
  const components = detail.components.filter((c) => c.includeInMatrix);
  matrix.addRow([
    'Course Outcomes',
    ...components.map((c) => c.displayName),
    'Marks Distribution',
    '% Assigned for Evaluation',
  ]);
  for (const co of detail.cos) {
    matrix.addRow([
      co.coCode,
      ...components.map((c) => {
        const cell = detail.cells.find(
          (x) => x.coCode === co.coCode && x.assessmentComponentId === c.assessmentComponentId,
        );
        return dash(cell?.currentValue ?? null);
      }),
      dash(co.currentMarksDistribution),
      co.currentEvaluationPercent == null ? '—' : `${co.currentEvaluationPercent}%`,
    ]);
  }
  matrix.addRow([
    'TOTAL / Marks Assigned',
    ...components.map((c) => {
      const total = detail.validation.componentTotals.find(
        (t) => t.assessmentComponentId === c.assessmentComponentId,
      );
      return total?.allocated ?? 0;
    }),
    '',
    `${detail.validation.evaluationPercentTotal}%`,
  ]);

  const masterCurrent = wb.addWorksheet('MASTER_VS_CURRENT');
  masterCurrent.addRow([
    'CO',
    'Assessment Component',
    'Master Value',
    'Current Value',
    'Modified',
    'Master Justification',
    'Lecturer Change Justification',
  ]);
  for (const cell of detail.cells) {
    const name =
      components.find((c) => c.assessmentComponentId === cell.assessmentComponentId)?.displayName ||
      cell.assessmentComponentId;
    masterCurrent.addRow([
      cell.coCode,
      name,
      cell.masterValue,
      cell.currentValue,
      cell.modified ? 'YES' : 'NO',
      cell.masterJustification,
      cell.changeJustification,
    ]);
  }

  const just = wb.addWorksheet('JUSTIFICATIONS');
  just.addRow([
    'CO',
    'Assessment Component',
    'Standard Value',
    'Current Value',
    'Master Justification',
    'Lecturer Change Justification',
    'Source Status',
  ]);
  for (const j of detail.justifications) {
    just.addRow([
      j.coCode,
      j.componentName,
      j.standardValue,
      j.currentValue,
      j.masterJustification,
      j.lecturerChangeJustification,
      j.sourceStatus,
    ]);
  }

  const structure = wb.addWorksheet('ASSESSMENT_STRUCTURE');
  structure.addRow(['Field', 'Value']);
  const snap = detail.assessmentStructure as {
    structure?: Record<string, unknown> | null;
    courseComponents?: Array<Record<string, unknown>>;
  } | null;
  if (snap?.structure) {
    for (const [k, v] of Object.entries(snap.structure)) {
      if (['id', 'college_id', 'created_at', 'updated_at', 'import_batch'].includes(k)) continue;
      structure.addRow([k, v == null ? '' : String(v)]);
    }
  }
  structure.addRow([]);
  structure.addRow(['Component', 'Max Marks', 'Mandatory', 'Verification']);
  for (const c of snap?.courseComponents || []) {
    structure.addRow([
      c.component_name || c.component_id,
      c.max_marks,
      c.mandatory ? 'YES' : 'NO',
      c.verification_status,
    ]);
  }

  const source = wb.addWorksheet('SOURCE');
  source.addRow(['Field', 'Value']);
  source.addRow(['Verification Status', detail.verificationStatus]);
  source.addRow(['Source Status', detail.sourceStatus]);
  const sources = (snap as { sources?: Array<Record<string, unknown>> } | null)?.sources || [];
  source.addRow([]);
  source.addRow(['Source ID', 'Type', 'File', 'Section', 'Field', 'Value', 'Verification']);
  for (const s of sources) {
    source.addRow([
      s.source_id,
      s.source_type,
      s.source_file,
      s.source_page_section,
      s.extracted_field,
      s.extracted_value,
      s.verification_status,
    ]);
  }

  const audit = wb.addWorksheet('ACTIVITY_LOG');
  audit.addRow(['Note', 'Activity log is available via API; export captures evaluation snapshot only.']);
  audit.addRow(['Subject', detail.subjectName]);
  audit.addRow(['Prepared By', detail.facultyName]);
  audit.addRow(['Status', detail.status]);
  audit.addRow(['Updated At', detail.updatedAt]);

  const buffer = await wb.xlsx.writeBuffer();
  const safeName = String(detail.subjectName || detail.courseCode)
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const year = String(detail.academicYearLabel || '').replace(/[^0-9–-]+/g, '') || 'export';
  const fileName = `${safeName}-CO-Evaluation-${year}.xlsx`;
  return { buffer: Buffer.from(buffer), fileName };
}
