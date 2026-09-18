import ExcelJS from 'exceljs';
import { sanitizeFilename } from '../../utils/filename.js';
import { formatDisplayDate } from './dates.js';
import { getPlan } from './service.js';

export async function exportLessonPlanXlsx(planId: number, collegeId: number) {
  const data = await getPlan(planId, collegeId);
  const p = data.plan;
  const year = String(p.academicYearLabel || '').replace(/\s+/g, '');
  const filename = `${sanitizeFilename(String(p.courseName || 'Lesson-Plan'))}-Lesson-Plan-${year || 'draft'}.xlsx`;

  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Lesson Plan');
  const header = [
    ['Institution', p.collegeName ?? ''],
    ['Department', p.departmentName ?? ''],
    ['Program', p.programName ?? ''],
    ['Semester', p.semesterLabel ?? ''],
    ['Section', p.sectionLabel ?? ''],
    ['Subject', `${p.courseName ?? ''} (${p.courseCode ?? ''})`],
    ['Faculty', p.facultyName ?? ''],
    ['Academic Year', p.academicYearLabel ?? ''],
  ];
  header.forEach((row, i) => {
    sheet.getCell(i + 1, 1).value = row[0];
    sheet.getCell(i + 1, 1).font = { bold: true };
    sheet.getCell(i + 1, 2).value = row[1];
  });
  const start = header.length + 2;
  const columns = [
    'Sl. No.',
    'Module / Unit',
    'Topic',
    'Subtopic',
    'Planned Date',
    'Actual Date',
    'Planned Hours',
    'Actual Hours',
    'Status',
    'Remarks',
  ];
  columns.forEach((col, i) => {
    const cell = sheet.getCell(start, i + 1);
    cell.value = col;
    cell.font = { bold: true };
  });
  data.entries.forEach((entry, idx) => {
    const r = start + 1 + idx;
    sheet.getCell(r, 1).value = entry.serialNo;
    sheet.getCell(r, 2).value = [entry.moduleLabel, entry.moduleName].filter(Boolean).join(' — ');
    sheet.getCell(r, 3).value = entry.topicName;
    sheet.getCell(r, 4).value = entry.subtopicName;
    sheet.getCell(r, 5).value = formatDisplayDate(entry.plannedDate);
    sheet.getCell(r, 6).value = formatDisplayDate(entry.actualDate);
    sheet.getCell(r, 7).value = entry.plannedHours;
    sheet.getCell(r, 8).value = entry.actualHours;
    sheet.getCell(r, 9).value = entry.status;
    sheet.getCell(r, 10).value = entry.remarks ?? '';
  });
  sheet.columns = [
    { width: 10 },
    { width: 36 },
    { width: 32 },
    { width: 48 },
    { width: 16 },
    { width: 16 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 28 },
  ];
  const body = Buffer.from(await wb.xlsx.writeBuffer());
  return {
    filename,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    body,
  };
}
