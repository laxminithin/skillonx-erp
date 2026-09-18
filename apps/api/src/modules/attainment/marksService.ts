import ExcelJS from 'exceljs';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { AttainmentActor } from './access.js';
import { recordAttainmentAudit } from './audit.js';
import { parseJson } from './json.js';
import { schemeComponentsValid, validateMarksImport } from './marksValidation.js';
import { buildMarkColumns, resolveOrMarkEntry } from './orMarks.js';

export const createSheetSchema = z.object({
  courseId: z.number().int().positive(),
  sourceKind: z.enum(['INTERNAL_PAPER', 'SEE', 'LAB', 'PROJECT', 'REASSESSMENT']),
  sourceId: z.number().int().positive().optional().nullable(),
  title: z.string().max(255).optional().nullable(),
  academicYearId: z.number().int().positive().optional().nullable(),
  programId: z.number().int().positive().optional().nullable(),
  semesterId: z.number().int().positive().optional().nullable(),
  seeMethod: z.enum(['ACTUAL', 'PAPER_WEIGHTED', 'EQUAL_WEIGHT']).optional().nullable(),
  seePaperId: z.number().int().positive().optional().nullable(),
  maxMarks: z.number().positive().optional(),
});

async function actorName(id: number) {
  const row = await db('faculty_users').where({ id }).first();
  return row?.name ? String(row.name) : null;
}

export async function createSheetFromInternalPaper(actor: AttainmentActor, paperId: number) {
  const paper = await db('internal_question_papers').where({ id: paperId, college_id: actor.collegeId }).first();
  if (!paper) throw new AppError(404, 'Internal question paper not found');
  const existing = await db('assessment_mark_sheets')
    .where({ college_id: actor.collegeId, source_kind: 'INTERNAL_PAPER', source_id: paperId })
    .first();
  if (existing) return getSheet(Number(existing.id), actor.collegeId);
  // Include BOTH OR alternatives on the mark sheet. Internal papers are mandatory-OR:
  // each slot is Q(A) OR Q(B) and the mark sheet must carry both so the attempted
  // alternative can be scored and the unchosen one recorded NOT_ATTEMPTED_DUE_TO_OR.
  const items = await db('internal_question_paper_items').where({ paper_id: paperId }).orderBy('sort_order');
  const ids = await db('assessment_mark_sheets').insert({
    college_id: actor.collegeId,
    created_by: actor.facultyUserId,
    department_id: paper.department_id,
    course_id: paper.course_id,
    academic_year_id: paper.academic_year_id,
    program_id: paper.program_id,
    semester_id: paper.semester_id,
    class_section_id: paper.class_section_id,
    source_kind: 'INTERNAL_PAPER',
    source_id: paperId,
    title: paper.title || `${paper.exam_type} marks`,
    max_marks: paper.max_marks,
    status: 'DRAFT',
    frozen: false,
  });
  const sheetId = Number(ids[0]);
  for (const [i, item] of items.entries()) {
    const scheme = await db('internal_qp_scheme_components').where({ item_id: item.id }).orderBy('sort_order');
    const alt = String(item.or_alternative || 'A').toUpperCase();
    const orGroupId = item.or_group_id || (item.is_or_choice ? `Q${item.question_number}` : null);
    await db('assessment_mark_questions').insert({
      sheet_id: sheetId,
      question_key: String(item.item_key),
      label: `Q${item.question_number}(${alt})${item.sub_letter || ''}`,
      max_marks: item.max_marks,
      primary_co_code: item.primary_co_code,
      secondary_co_code: item.secondary_co_code ?? null,
      bloom_level: item.bloom_level,
      difficulty: item.difficulty,
      topic: item.topic ?? null,
      module_or_unit: item.module_or_unit,
      sort_order: i,
      question_number: item.question_number,
      sub_letter: item.sub_letter ?? null,
      or_group_id: orGroupId,
      or_alternative: orGroupId ? alt : null,
      scheme_snapshot: scheme.length ? JSON.stringify(scheme.map((s) => ({ code: s.code, label: s.label, maxMarks: Number(s.max_marks) }))) : null,
    });
  }
  await recordAttainmentAudit({
    collegeId: actor.collegeId,
    sheetId,
    actorId: actor.facultyUserId,
    actorName: await actorName(actor.facultyUserId),
    action: 'MARK_SHEET_CREATED',
    metadata: { paperId },
  });
  return getSheet(sheetId, actor.collegeId);
}

export async function createSheet(actor: AttainmentActor, body: z.infer<typeof createSheetSchema>) {
  if (body.sourceKind === 'INTERNAL_PAPER' && body.sourceId) {
    return createSheetFromInternalPaper(actor, body.sourceId);
  }
  const course = await db('courses').where({ id: body.courseId, college_id: actor.collegeId }).first();
  if (!course) throw new AppError(404, 'Course not found');
  const ids = await db('assessment_mark_sheets').insert({
    college_id: actor.collegeId,
    created_by: actor.facultyUserId,
    department_id: actor.departmentId ?? course.department_id ?? null,
    course_id: body.courseId,
    academic_year_id: body.academicYearId ?? null,
    program_id: body.programId ?? null,
    semester_id: body.semesterId ?? null,
    source_kind: body.sourceKind,
    source_id: body.sourceId ?? null,
    title: body.title ?? body.sourceKind,
    max_marks: body.maxMarks ?? course.see_marks ?? 100,
    see_method: body.seeMethod ?? null,
    see_paper_id: body.seePaperId ?? null,
    status: 'DRAFT',
    frozen: false,
  });
  return getSheet(Number(ids[0]), actor.collegeId);
}

export async function getSheet(sheetId: number, collegeId: number) {
  const sheet = await db('assessment_mark_sheets as s')
    .leftJoin('courses as c', 'c.id', 's.course_id')
    .where({ 's.id': sheetId, 's.college_id': collegeId })
    .select('s.*', 'c.code as courseCode', 'c.name as courseName')
    .first();
  if (!sheet) throw new AppError(404, 'Mark sheet not found');
  const questions = await db('assessment_mark_questions').where({ sheet_id: sheetId }).orderBy('sort_order');
  const students = await db('assessment_student_rows').where({ sheet_id: sheetId }).orderBy('usn');
  const marks = students.length
    ? await db('assessment_student_question_marks').whereIn(
        'student_row_id',
        students.map((s) => s.id),
      )
    : [];
  return {
    sheet: {
      id: Number(sheet.id),
      title: sheet.title,
      sourceKind: sheet.source_kind,
      sourceId: sheet.source_id,
      status: sheet.status,
      frozen: Boolean(sheet.frozen),
      maxMarks: Number(sheet.max_marks),
      seeMethod: sheet.see_method,
      courseCode: sheet.courseCode,
      courseName: sheet.courseName,
      courseId: Number(sheet.course_id),
      createdBy: Number(sheet.created_by),
    },
    questions: questions.map((q) => ({
      id: Number(q.id),
      questionKey: q.question_key,
      label: q.label,
      maxMarks: Number(q.max_marks),
      coCode: q.primary_co_code,
      bloomLevel: q.bloom_level,
      difficulty: q.difficulty,
      questionNumber: q.question_number != null ? Number(q.question_number) : null,
      subLetter: q.sub_letter ?? null,
      orGroupId: q.or_group_id ?? null,
      orAlternative: q.or_alternative ?? null,
      scheme: parseJson(q.scheme_snapshot, null),
    })),
    students: students.map((s) => {
      const studentMarks = marks.filter((m) => Number(m.student_row_id) === Number(s.id));
      const keyOf = (m: (typeof marks)[number]) => {
        const q = questions.find((qq) => Number(qq.id) === Number(m.question_id));
        return q?.question_key || String(m.question_id);
      };
      return {
        id: Number(s.id),
        usn: s.usn,
        name: s.student_name,
        status: s.status,
        total: s.total_awarded != null ? Number(s.total_awarded) : null,
        marks: Object.fromEntries(
          studentMarks.map((m) => [keyOf(m), m.awarded_marks != null ? Number(m.awarded_marks) : null]),
        ),
        statuses: Object.fromEntries(studentMarks.map((m) => [keyOf(m), String(m.status || 'PRESENT')])),
        // Attempted alternative per OR slot, derived from question statuses.
        attempts: Object.fromEntries(
          studentMarks
            .map((m) => {
              const q = questions.find((qq) => Number(qq.id) === Number(m.question_id));
              if (!q?.or_group_id || String(m.status) !== 'ATTEMPTED') return null;
              return [String(q.or_group_id), String(q.or_alternative || 'A')];
            })
            .filter((x): x is [string, string] => x != null),
        ),
      };
    }),
  };
}

/**
 * Question-wise marks export. Unchosen OR alternatives are shown as
 * "NOT ATTEMPTED — OR" (never 0) so the OR distinction is visible in audit exports.
 */
export async function exportMarksSheet(sheetId: number, collegeId: number) {
  const detail = await getSheet(sheetId, collegeId);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SkillonX';
  const ws = wb.addWorksheet('Question-wise Marks');
  ws.addRow(['USN', 'Student Name', 'Row Status', ...detail.questions.map((q) => `${q.label} ${q.coCode || ''}`.trim()), 'Total']);
  ws.getRow(1).font = { bold: true };
  for (const student of detail.students) {
    const cells = detail.questions.map((q) => {
      const status = (student as { statuses?: Record<string, string> }).statuses?.[q.questionKey] || student.status;
      if (status === 'NOT_ATTEMPTED_DUE_TO_OR') return 'NOT ATTEMPTED — OR';
      if (status === 'ABSENT') return 'ABSENT';
      if (status === 'EXEMPT') return 'EXEMPT';
      if (status === 'NOT_EVALUATED') return 'NE';
      const mark = student.marks[q.questionKey];
      return mark != null ? mark : '';
    });
    ws.addRow([student.usn, student.name || '', student.status, ...cells, student.total ?? '']);
  }
  const buf = await wb.xlsx.writeBuffer();
  return { buffer: Buffer.from(buf as ArrayBuffer), filename: `${detail.sheet.courseCode || 'marks'}-question-wise.xlsx` };
}

export async function listSheets(actor: AttainmentActor, courseId?: number) {
  const rows = await db('assessment_mark_sheets as s')
    .leftJoin('courses as c', 'c.id', 's.course_id')
    .where({ 's.college_id': actor.collegeId })
    .modify((q) => {
      if (courseId) q.andWhere('s.course_id', courseId);
      if (actor.role === 'FACULTY') q.andWhere('s.created_by', actor.facultyUserId);
    })
    .orderBy('s.updated_at', 'desc')
    .select('s.id', 's.title', 's.source_kind', 's.status', 's.frozen', 's.max_marks', 'c.code as courseCode', 'c.name as courseName');
  return { sheets: rows };
}

export async function freezeSheet(actor: AttainmentActor, sheetId: number) {
  const detail = await getSheet(sheetId, actor.collegeId);
  if (detail.sheet.frozen) throw new AppError(409, 'Mark sheet is already frozen');
  for (const q of detail.questions) {
    if (q.scheme && Array.isArray(q.scheme)) {
      const check = schemeComponentsValid(q.maxMarks, q.scheme as Array<{ maxMarks: number }>);
      if (!check.ok) throw new AppError(422, check.message || 'Invalid scheme');
    }
  }
  await db('assessment_mark_sheets').where({ id: sheetId }).update({
    status: 'FROZEN',
    frozen: true,
    frozen_at: db.fn.now(),
    frozen_by: actor.facultyUserId,
    snapshot_json: JSON.stringify(detail),
    updated_at: db.fn.now(),
  });
  return getSheet(sheetId, actor.collegeId);
}

function markColumnsFor(questions: Awaited<ReturnType<typeof getSheet>>['questions']) {
  return buildMarkColumns(
    questions.map((q) => ({
      questionKey: q.questionKey,
      label: q.label,
      maxMarks: q.maxMarks,
      orGroupId: q.orGroupId,
      orAlternative: q.orAlternative,
      questionNumber: q.questionNumber,
    })),
  );
}

export async function marksTemplate(sheetId: number, collegeId: number) {
  const detail = await getSheet(sheetId, collegeId);
  const columns = markColumnsFor(detail.questions);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Marks');
  const header = ['USN', 'Student Name', ...columns.map((c) => c.header), 'Total'];
  ws.addRow(header);
  // Sample row: attempt alternative A for OR slots, leave B blank (not zero).
  const sample = columns.map((c) => {
    if (c.kind === 'ATTEMPT') return 'A';
    if (c.kind === 'QUESTION' && c.orAlternative === 'B') return '';
    return 0;
  });
  ws.addRow(['1AB21CS001', 'Sample Student', ...sample, 0]);
  ws.getRow(1).font = { bold: true };
  const buf = await wb.xlsx.writeBuffer();
  return { buffer: Buffer.from(buf as ArrayBuffer), filename: `${detail.sheet.courseCode || 'marks'}-template.xlsx` };
}

export async function previewMarksImport(
  actor: AttainmentActor,
  sheetId: number,
  workbookBase64: string,
) {
  const detail = await getSheet(sheetId, actor.collegeId);
  if (detail.sheet.frozen) throw new AppError(409, 'Frozen mark sheets cannot be imported into');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(workbookBase64, 'base64') as unknown as ExcelJS.Buffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new AppError(400, 'Workbook has no sheets');
  const questions = detail.questions;
  const known = await db('students').where({ college_id: actor.collegeId }).select('usn');
  const knownUsns = new Set(known.map((s) => String(s.usn).toUpperCase().replace(/\s+/g, '')));

  const hasOr = questions.some((q) => q.orGroupId);
  if (hasOr) {
    return previewOrMarksImport(detail, ws, knownUsns);
  }

  const header = (ws.getRow(1).values as unknown[]) || [];
  const rows: Array<{ usn: string; name?: string | null; questionMarks: Record<string, unknown>; total?: number | null }> = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const values = row.values as unknown[];
    const usn = String(values[1] ?? '');
    const name = values[2] != null ? String(values[2]) : null;
    const questionMarks: Record<string, unknown> = {};
    questions.forEach((q, i) => {
      questionMarks[q.questionKey] = values[3 + i];
    });
    const total = values[2 + questions.length + 1] != null ? Number(values[2 + questions.length + 1]) : null;
    rows.push({ usn, name, questionMarks, total: Number.isFinite(total as number) ? total : null });
  });
  void header;
  return validateMarksImport({
    rows: rows as never,
    questions: questions.map((q) => ({ questionKey: q.questionKey, label: q.label || q.questionKey, maxMarks: q.maxMarks })),
    knownUsns,
  });
}

export type OrImportPreview = {
  ok: boolean;
  rows: number;
  errorCount: number;
  warningCount: number;
  or: true;
  issues: Array<{ severity: 'ERROR' | 'WARNING'; code: string; row?: number; usn?: string; message: string }>;
  parsed: Array<{
    usn: string;
    name: string | null;
    status: string;
    perQuestion: Array<{ questionKey: string; awarded: number | null; status: string }>;
    total: number | null;
  }>;
};

const OR_ABSENT_TOKENS = new Set(['A', 'ABS', 'ABSENT', 'AB']);

/** Parse an OR-structured workbook (Attempted + A/B mark columns). */
export function previewOrMarksImport(
  detail: Awaited<ReturnType<typeof getSheet>>,
  ws: ExcelJS.Worksheet,
  knownUsns: Set<string>,
): OrImportPreview {
  const columns = markColumnsFor(detail.questions);
  const issues: OrImportPreview['issues'] = [];
  const parsed: OrImportPreview['parsed'] = [];
  const seen = new Set<string>();

  ws.eachRow((row, n) => {
    if (n === 1) return;
    const values = row.values as unknown[];
    const usn = String(values[1] ?? '').trim().toUpperCase().replace(/\s+/g, '');
    const name = values[2] != null ? String(values[2]) : null;
    const line = n;
    if (!usn) {
      issues.push({ severity: 'ERROR', code: 'MISSING_USN', row: line, message: 'USN is required' });
      return;
    }
    if (seen.has(usn)) issues.push({ severity: 'ERROR', code: 'DUPLICATE_STUDENT', row: line, usn, message: `Duplicate USN ${usn}` });
    seen.add(usn);
    if (knownUsns.size && !knownUsns.has(usn)) {
      issues.push({ severity: 'ERROR', code: 'UNKNOWN_USN', row: line, usn, message: `Unknown USN ${usn}` });
    }

    const marks: Record<string, number | null> = {};
    const attempts: Record<string, string> = {};
    let rowStatus: 'PRESENT' | 'ABSENT' = 'PRESENT';
    columns.forEach((col, i) => {
      const raw = values[3 + i];
      if (col.kind === 'ATTEMPT') {
        const token = raw != null ? String(raw).trim().toUpperCase() : '';
        if (OR_ABSENT_TOKENS.has(token) && token !== 'A') rowStatus = 'ABSENT';
        else if (token === 'A' || token === 'B') attempts[col.orGroupId] = token;
        return;
      }
      if (raw == null || raw === '') {
        marks[col.questionKey] = null;
        return;
      }
      const token = String(raw).trim().toUpperCase();
      if (OR_ABSENT_TOKENS.has(token) && !/^\d/.test(token)) {
        rowStatus = 'ABSENT';
        marks[col.questionKey] = null;
        return;
      }
      const num = Number(raw);
      marks[col.questionKey] = Number.isFinite(num) ? num : null;
      if (!Number.isFinite(num)) {
        issues.push({ severity: 'ERROR', code: 'INVALID_MARK', row: line, usn, message: `Invalid mark for ${col.header}` });
      }
    });

    const resolution = resolveOrMarkEntry({
      questions: detail.questions.map((q) => ({
        questionKey: q.questionKey,
        label: q.label,
        maxMarks: q.maxMarks,
        orGroupId: q.orGroupId,
        orAlternative: q.orAlternative,
        questionNumber: q.questionNumber,
      })),
      marks,
      attempts,
      rowStatus,
    });
    for (const issue of resolution.issues) {
      issues.push({ severity: 'ERROR', code: issue.code, row: line, usn, message: issue.message });
    }
    parsed.push({
      usn,
      name,
      status: rowStatus,
      perQuestion: resolution.perQuestion,
      total: resolution.total,
    });
  });

  const errorCount = issues.filter((i) => i.severity === 'ERROR').length;
  return {
    ok: errorCount === 0,
    rows: parsed.length,
    errorCount,
    warningCount: issues.filter((i) => i.severity === 'WARNING').length,
    or: true,
    issues,
    parsed,
  };
}

export async function commitMarksImport(
  actor: AttainmentActor,
  sheetId: number,
  workbookBase64: string,
) {
  const preview = await previewMarksImport(actor, sheetId, workbookBase64);
  if (!preview.ok) throw new AppError(422, 'Import has errors', preview);
  const detail = await getSheet(sheetId, actor.collegeId);
  const students = await db('students').where({ college_id: actor.collegeId });
  const byUsn = new Map(students.map((s) => [String(s.usn).toUpperCase().replace(/\s+/g, ''), s]));
  const questionIdByKey = new Map(detail.questions.map((q) => [q.questionKey, q.id]));
  await db('assessment_student_question_marks')
    .whereIn(
      'student_row_id',
      db('assessment_student_rows').where({ sheet_id: sheetId }).select('id'),
    )
    .del();
  await db('assessment_student_rows').where({ sheet_id: sheetId }).del();

  const isOr = (preview as { or?: boolean }).or === true;
  for (const row of preview.parsed as Array<Record<string, unknown>>) {
    const usn = String(row.usn);
    const student = byUsn.get(usn);
    const ids = await db('assessment_student_rows').insert({
      sheet_id: sheetId,
      student_id: student?.id ?? null,
      usn,
      student_name: (row.name as string) || student?.name || null,
      status: String(row.status),
      total_awarded: (row.total as number | null) ?? null,
    });
    const studentRowId = Number(ids[0]);
    if (isOr) {
      const perQuestion = row.perQuestion as Array<{ questionKey: string; awarded: number | null; status: string }>;
      for (const pq of perQuestion) {
        const questionId = questionIdByKey.get(pq.questionKey);
        if (!questionId) continue;
        await db('assessment_student_question_marks').insert({
          student_row_id: studentRowId,
          question_id: questionId,
          awarded_marks: pq.awarded,
          status: pq.status,
        });
      }
    } else {
      const questionMarks = row.questionMarks as Record<string, number | null>;
      for (const q of detail.questions) {
        await db('assessment_student_question_marks').insert({
          student_row_id: studentRowId,
          question_id: q.id,
          awarded_marks: questionMarks[q.questionKey],
          status: String(row.status),
        });
      }
    }
  }
  return { imported: preview.parsed.length, preview };
}

export const manualMarksSchema = z.object({
  usn: z.string().min(1),
  name: z.string().optional().nullable(),
  status: z.enum(['PRESENT', 'ABSENT', 'NOT_EVALUATED', 'EXEMPT']).optional(),
  marks: z.record(z.number().nullable()),
  // Per OR slot: the attempted alternative, keyed by orGroupId → 'A' | 'B'.
  attempts: z.record(z.enum(['A', 'B'])).optional(),
});

export async function upsertManualMarks(actor: AttainmentActor, sheetId: number, body: z.infer<typeof manualMarksSchema>) {
  const detail = await getSheet(sheetId, actor.collegeId);
  if (detail.sheet.frozen) throw new AppError(409, 'Frozen mark sheets cannot be edited');
  const usn = body.usn.trim().toUpperCase();

  const resolution = resolveOrMarkEntry({
    questions: detail.questions.map((q) => ({
      questionKey: q.questionKey,
      label: q.label,
      maxMarks: q.maxMarks,
      orGroupId: q.orGroupId,
      orAlternative: q.orAlternative,
      questionNumber: q.questionNumber,
    })),
    marks: body.marks,
    attempts: body.attempts,
    rowStatus: body.status || 'PRESENT',
  });
  if (!resolution.ok) {
    throw new AppError(422, resolution.issues[0]?.message || 'Invalid OR mark entry', { issues: resolution.issues });
  }
  const statusByKey = new Map(resolution.perQuestion.map((p) => [p.questionKey, p]));

  const student = await db('students').where({ college_id: actor.collegeId, usn }).first();
  let row = await db('assessment_student_rows').where({ sheet_id: sheetId, usn }).first();
  if (!row) {
    const ids = await db('assessment_student_rows').insert({
      sheet_id: sheetId,
      student_id: student?.id ?? null,
      usn,
      student_name: body.name || student?.name || null,
      status: body.status || 'PRESENT',
      total_awarded: resolution.total,
    });
    row = { id: ids[0] };
  } else {
    await db('assessment_student_rows').where({ id: row.id }).update({
      status: body.status || row.status,
      total_awarded: resolution.total,
      student_name: body.name || row.student_name,
    });
  }
  for (const q of detail.questions) {
    const resolved = statusByKey.get(q.questionKey);
    const existing = await db('assessment_student_question_marks').where({ student_row_id: row.id, question_id: q.id }).first();
    const payload = { awarded_marks: resolved?.awarded ?? null, status: resolved?.status || body.status || 'PRESENT' };
    if (existing) await db('assessment_student_question_marks').where({ id: existing.id }).update(payload);
    else await db('assessment_student_question_marks').insert({ student_row_id: row.id, question_id: q.id, ...payload });
  }
  return getSheet(sheetId, actor.collegeId);
}
