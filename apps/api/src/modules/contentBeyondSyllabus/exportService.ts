import ExcelJS from 'exceljs';
import { friendlyDelivery, friendlyOrigin } from './types.js';
import { getPlan } from './service.js';
import { listCbsAudit } from './audit.js';

function slug(name: string) {
  return String(name || 'Subject')
    .replace(/[^\w]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function exportCbsPlanXlsx(planId: number, collegeId: number) {
  const plan = await getPlan(planId, collegeId);
  const audit = await listCbsAudit(planId, collegeId);
  const wb = new ExcelJS.Workbook();

  const summary = wb.addWorksheet('SUMMARY');
  summary.addRows([
    ['Subject', plan.subjectName],
    ['Course Code', plan.courseCode],
    ['Scheme', plan.schemeLabel],
    ['Program', plan.programName],
    ['Semester', plan.semesterLabel],
    ['Academic Year', plan.academicYearLabel],
    ['Prepared By', plan.preparedBy],
    ['Status', plan.status],
    ['Total Items', plan.summary.totalItems],
    ['Delivered', plan.summary.delivered],
    ['Assessed', plan.summary.assessed],
    ['Completed', plan.summary.completed],
    ['Planned Hours', plan.summary.plannedHours],
    ['Actual Hours', plan.summary.actualHours],
  ]);

  const planSheet = wb.addWorksheet('BEYOND_SYLLABUS_PLAN');
  planSheet.addRow([
    'CBS ID',
    'Subject',
    'Module',
    'Title',
    'Origin',
    'Related Gap',
    'Rationale',
    'Primary CO',
    'Delivery Method',
    'Planned Hours',
    'Actual Hours',
    'Planned Date',
    'Actual Date',
    'Assessment Required',
    'Assessment Type',
    'Linked Assessment',
    'Status',
    'Outcome',
  ]);
  for (const item of plan.items) {
    const linked = item.assessments
      .map((a) => (a.kind === 'QUIZ' ? `Quiz#${a.quizId}` : `Assignment#${a.assignmentId}`))
      .join(', ');
    planSheet.addRow([
      item.cbsId,
      plan.subjectName,
      item.moduleUnit,
      item.title,
      item.originLabel,
      item.relatedGapId,
      item.rationale,
      item.primaryCo,
      friendlyDelivery(item.deliveryMethod),
      item.plannedHours,
      item.actualHours,
      item.plannedDate,
      item.actualDate,
      item.assessmentRequired ? 'YES' : 'NO',
      item.assessmentType,
      linked,
      item.status,
      item.actualOutcome,
    ]);
  }

  const assess = wb.addWorksheet('ASSESSMENTS');
  assess.addRow(['CBS ID', 'Title', 'Kind', 'Quiz ID', 'Assignment ID', 'Include in Formal Attainment']);
  for (const item of plan.items) {
    for (const a of item.assessments) {
      assess.addRow([
        item.cbsId,
        item.title,
        a.kind,
        a.quizId,
        a.assignmentId,
        a.includeInFormalAttainment ? 'YES' : 'NO',
      ]);
    }
  }

  const trace = wb.addWorksheet('ACADEMIC_TRACEABILITY');
  trace.addRow(['CBS ID', 'Primary CO', 'Outcome Type', 'Outcome Code', 'Strength', 'Derived From']);
  for (const item of plan.items) {
    for (const o of item.outcomes) {
      trace.addRow([item.cbsId, o.coCode, o.outcomeType, o.outcomeCode, o.strength, o.derivedFrom]);
    }
  }

  const evidence = wb.addWorksheet('EVIDENCE_INDEX');
  evidence.addRow(['Sl No', 'CBS ID', 'Evidence Type', 'Title', 'Date']);
  plan.evidence.forEach((e, idx) => {
    const item = plan.items.find((i) => i.id === e.itemId);
    evidence.addRow([idx + 1, item?.cbsId || '', e.evidenceType, e.title, e.uploadedAt]);
  });

  const log = wb.addWorksheet('ACTIVITY_LOG');
  log.addRow(['When', 'Actor', 'Action', 'Item ID', 'Metadata']);
  for (const row of audit) {
    log.addRow([row.createdAt, row.actorName, row.action, row.itemId, JSON.stringify(row.metadata || {})]);
  }

  const body = Buffer.from(await wb.xlsx.writeBuffer());
  const filename = `${slug(String(plan.subjectName))}-Beyond-Syllabus-${slug(String(plan.academicYearLabel || 'year'))}.xlsx`;
  return {
    filename,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    body,
  };
}

export function buildPrintModel(plan: Awaited<ReturnType<typeof getPlan>>) {
  return {
    cover: {
      documentTitle: 'CONTENT BEYOND SYLLABUS',
      documentSubtitle: 'COURSE DELIVERY PLAN',
      collegeName: plan.collegeName,
      logoUrl: plan.logoUrl,
      departmentName: plan.departmentName,
      subjectName: plan.subjectName,
      courseCode: plan.courseCode,
      schemeLabel: plan.schemeLabel,
      academicYearLabel: plan.academicYearLabel,
      programName: plan.programName,
      semesterLabel: plan.semesterLabel,
      preparedBy: plan.preparedBy,
    },
    summary: plan.summary,
    items: plan.items,
    evidence: plan.evidence,
    meta: {
      status: plan.status,
      subjectName: plan.subjectName,
      courseCode: plan.courseCode,
    },
  };
}
