import ExcelJS from 'exceljs';
import { sanitizeFilename } from '../../utils/filename.js';
import { getAnalysis, getAudit } from './service.js';
import { friendlyCoverage, friendlyActionType } from './types.js';

export async function exportGapAnalysisXlsx(analysisId: number, collegeId: number) {
  const detail = await getAnalysis(analysisId, collegeId);
  const audit = await getAudit(analysisId, collegeId);
  const year = String(detail.academicYearLabel || 'draft').replace(/\s+/g, '-');
  const filename = `${sanitizeFilename(String(detail.subjectName || 'Gap-Analysis'))}-Gap-Analysis-${sanitizeFilename(year)}.xlsx`;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'SkillonX Survey';
  wb.created = new Date();

  const summary = wb.addWorksheet('SUMMARY');
  summary.addRows([
    ['Gap Analysis Export'],
    ['Subject', detail.subjectName],
    ['Course Code', detail.courseCode],
    ['Scheme', detail.schemeLabel || ''],
    ['Program', detail.programName || ''],
    ['Semester', detail.semesterLabel || ''],
    ['Academic Year', detail.academicYearLabel || ''],
    ['Prepared By', detail.preparedBy || ''],
    ['Status', detail.status],
    [],
    ['Total Gaps', detail.summary.totalGaps],
    ['Applicable', detail.summary.applicable],
    ['Closed', detail.summary.closed],
    ['Open', detail.summary.open],
    ['Not Applicable', detail.summary.notApplicable],
    ['Coverage %', detail.summary.coveragePercent ?? ''],
    ['Actions Completed', `${detail.summary.actionsCompleted} / ${detail.summary.actionsTotal}`],
    ['Evidence Items', detail.summary.evidenceCount],
  ]);

  const gaps = wb.addWorksheet('GAP_ANALYSIS');
  gaps.addRow([
    'Gap ID',
    'Subject',
    'Module',
    'Topic',
    'Gap Type',
    'Gap Statement',
    'Gap Justification',
    'Priority',
    'Related COs',
    'Expected Coverage',
    'Actual Coverage',
    'Coverage %',
    'Applicability',
    'Action Status',
    'Gap Status',
    'Closure Note',
  ]);
  for (const item of detail.items) {
    gaps.addRow([
      item.gapId,
      detail.subjectName,
      item.moduleUnit || '',
      item.relatedTopic || '',
      item.gapType,
      item.gapStatement,
      item.gapJustification || '',
      item.priority || '',
      item.relatedCos.map((c) => c.coCode).join(', '),
      item.expectedCoverageLabel || item.expectedCoverageLevel || '',
      item.actualCoverageLabel || item.actualCoverageLevel || '',
      item.coveragePercent ?? '',
      item.applicability,
      item.actions.map((a) => a.status).join(', '),
      item.itemStatus,
      item.closureNote || '',
    ]);
  }

  const actionsSheet = wb.addWorksheet('GAP_ACTIONS');
  actionsSheet.addRow([
    'Gap ID',
    'Action Type',
    'Action Title',
    'Planned Date',
    'Actual Date',
    'Duration',
    'Target Group',
    'Expected Outcome',
    'Actual Outcome',
    'Participants',
    'Status',
  ]);
  for (const item of detail.items) {
    for (const action of item.actions) {
      actionsSheet.addRow([
        item.gapId,
        action.actionTypeLabel || friendlyActionType(String(action.actionType)),
        action.title,
        action.plannedDate || '',
        action.actualDate || '',
        action.durationHours ?? '',
        action.targetGroup || '',
        action.expectedOutcome || '',
        action.actualOutcome || '',
        action.participants ?? '',
        action.status,
      ]);
    }
  }

  const evidenceSheet = wb.addWorksheet('EVIDENCE_INDEX');
  evidenceSheet.addRow(['Sl No', 'Gap ID', 'Action', 'Evidence Type', 'Evidence Title', 'Date']);
  let evidNo = 1;
  for (const e of detail.evidence) {
    const item = detail.items.find((i) => i.id === e.itemId);
    const action = detail.actions.find((a) => a.id === e.actionId);
    evidenceSheet.addRow([
      evidNo++,
      item?.gapId || '',
      action?.title || '',
      e.evidenceType,
      e.title,
      e.createdAt ? String(e.createdAt).slice(0, 10) : '',
    ]);
  }

  const trace = wb.addWorksheet('ACADEMIC_TRACEABILITY');
  trace.addRow(['Gap ID', 'CO', 'Outcome Type', 'Outcome Code', 'Strength', 'Derived From']);
  for (const item of detail.items) {
    for (const o of item.outcomes) {
      trace.addRow([
        item.gapId,
        o.coCode || '',
        o.outcomeType,
        o.outcomeCode,
        o.strength ?? '',
        o.derivedFrom || '',
      ]);
    }
    if (!item.outcomes.length) {
      for (const c of item.relatedCos) {
        trace.addRow([item.gapId, c.coCode, '', '', '', 'CO link only — no outcome mapping available']);
      }
    }
  }

  const auditSheet = wb.addWorksheet('AUDIT_LOG');
  auditSheet.addRow(['Timestamp', 'Actor', 'Action', 'Item ID', 'Action ID', 'Metadata']);
  for (const ev of audit.events) {
    auditSheet.addRow([
      ev.createdAt,
      ev.actor,
      ev.action,
      ev.itemId ?? '',
      ev.actionId ?? '',
      ev.metadata ? JSON.stringify(ev.metadata) : '',
    ]);
  }

  // Widen columns lightly
  for (const ws of wb.worksheets) {
    ws.columns.forEach((col) => {
      col.width = Math.min(48, Math.max(12, Number(col.width || 18)));
    });
  }

  const body = Buffer.from(await wb.xlsx.writeBuffer());
  return {
    filename,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' as const,
    body,
    preparedBy: detail.preparedBy,
  };
}

export function buildPrintModel(detail: Awaited<ReturnType<typeof getAnalysis>>) {
  return {
    documentTitle: 'GAP ANALYSIS',
    institutionName: detail.collegeName,
    logoUrl: detail.logoUrl,
    departmentName: detail.departmentName,
    programName: detail.programName,
    subjectName: detail.subjectName,
    subjectCode: detail.courseCode,
    schemeName: detail.schemeLabel,
    semesterLabel: detail.semesterLabel,
    academicYearLabel: detail.academicYearLabel,
    preparedBy: detail.preparedBy,
    status: detail.status,
    summary: detail.summary,
    gaps: detail.items.map((item) => ({
      serialNo: item.serialNo,
      gapId: item.gapId,
      gapStatement: item.gapStatement,
      gapType: item.gapType,
      moduleUnit: item.moduleUnit,
      relatedCos: item.relatedCos.map((c) => c.coCode).join(', '),
      expectedCoverage: item.expectedCoverageLabel || friendlyCoverage(item.expectedCoverageLevel),
      actualCoverage: item.actualCoverageLabel || friendlyCoverage(item.actualCoverageLevel),
      action: item.actions[0]?.title || item.suggestedActionTitle || '—',
      outcome: item.actualOutcome || item.closureNote || '—',
      status: item.itemStatus,
      justification: item.gapJustification,
      sourceBasis: item.sourceBasis,
      evidence: item.evidence.map((e) => e.title),
      traceability: {
        gapId: item.gapId,
        cos: item.relatedCos.map((c) => ({ code: c.coCode, statement: c.coStatement })),
        outcomes: item.outcomes,
      },
    })),
    evidenceIndex: detail.evidence.map((e, idx) => {
      const item = detail.items.find((i) => i.id === e.itemId);
      const action = detail.actions.find((a) => a.id === e.actionId);
      return {
        slNo: idx + 1,
        gapId: item?.gapId || '',
        action: action?.title || '',
        evidenceType: e.evidenceType,
        title: e.title,
        date: e.createdAt ? String(e.createdAt).slice(0, 10) : '',
      };
    }),
  };
}
