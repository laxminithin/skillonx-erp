import ExcelJS from 'exceljs';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { buildExportFilename } from '../../utils/filename.js';
import { getAssignment, listSubmissions, getSubmissionDetail } from './service.js';
import { getAssignmentCoPerformance } from './coPerformance.js';
import { parseEvaluationScheme, schemeTotalMarks } from './scheme.js';

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function addSheet(wb: ExcelJS.Workbook, name: string, headers: string[], rows: unknown[][]) {
  const sheet = wb.addWorksheet(name);
  sheet.addRow(headers);
  for (const row of rows) sheet.addRow(row);
  return sheet;
}

export async function exportAssignmentXlsx(assignmentId: number, collegeId: number) {
  const assignment = await getAssignment(assignmentId, collegeId);
  const { submissions } = await listSubmissions(assignmentId, collegeId);
  const coPerf = await getAssignmentCoPerformance(assignmentId, collegeId);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'SkillonX';
  wb.created = new Date();

  addSheet(
    wb,
    'SUMMARY',
    ['Field', 'Value'],
    [
      ['Title', assignment.title],
      ['Assignment Number', assignment.assignmentNumber ?? ''],
      ['Status', assignment.status],
      ['Course', assignment.courseName ?? ''],
      ['Course Code', assignment.courseCode ?? ''],
      ['Module', assignment.moduleName ?? ''],
      ['Department', assignment.departmentName ?? ''],
      ['Start At', assignment.startAt ?? ''],
      ['Due At', assignment.dueAt ?? ''],
      ['Pass %', assignment.passPercentage],
      ['Questions', assignment.questions.length],
      ['Total Marks', assignment.questions.reduce((s, q) => s + Number(q.marks), 0)],
      ['Submissions', submissions.filter((s) => ['SUBMITTED', 'LATE_SUBMITTED'].includes(String(s.status))).length],
      ['Share Code', assignment.shareCode ?? ''],
      ['Solution Release Policy', assignment.solutionReleasePolicy],
    ],
  );

  addSheet(
    wb,
    'QUESTIONS',
    ['#', 'ID', 'Type', 'Difficulty', 'Marks', 'Module', 'Primary CO', 'Question'],
    assignment.questions.map((q, i) => [
      i + 1,
      q.id,
      q.questionType,
      q.difficulty ?? '',
      q.marks,
      q.moduleName ?? '',
      q.primaryCoCode ?? '',
      q.questionText,
    ]),
  );

  addSheet(
    wb,
    'ACADEMIC_MAPPING',
    ['Question ID', 'Primary CO', 'Secondary COs', 'Mapping Basis', 'Mapping Source', 'Verification', 'Derived POs', 'Derived PSOs', 'Derived SDGs'],
    assignment.questions.map((q) => {
      const derived = parseJson<{ pos?: string[]; psos?: string[]; sdgs?: string[] }>(q.derivedOutcomes, {});
      return [
        q.id,
        q.primaryCoCode ?? '',
        (q.secondaryCoCodes as string[] | null)?.join(', ') ?? '',
        q.mappingBasis ?? '',
        q.mappingSource ?? '',
        q.verificationStatus ?? '',
        (derived.pos ?? []).join(', '),
        (derived.psos ?? []).join(', '),
        (derived.sdgs ?? []).join(', '),
      ];
    }),
  );

  const schemeRows: unknown[][] = [];
  for (const q of assignment.questions) {
    const scheme = parseEvaluationScheme(q.evaluationScheme ?? q.evaluationRubric);
    if (!scheme) continue;
    for (const c of scheme.criteria) {
      schemeRows.push([q.id, c.id, c.label, c.maxMarks, c.guidance ?? '', schemeTotalMarks(scheme)]);
    }
  }
  addSheet(
    wb,
    'EVALUATION_SCHEME',
    ['Question ID', 'Criterion ID', 'Label', 'Max Marks', 'Guidance', 'Scheme Total'],
    schemeRows,
  );

  addSheet(
    wb,
    'MODEL_SOLUTIONS',
    ['Question ID', 'Model Solution'],
    assignment.questions.map((q) => [q.id, q.expectedAnswerGuidance ?? '']),
  );

  addSheet(
    wb,
    'SUBMISSIONS',
    ['Token', 'Student', 'USN', 'Email', 'Attempt', 'Status', 'Late', 'Obtained', 'Total', '%', 'Passed', 'Eval Status', 'Submitted At'],
    submissions.map((s) => [
      s.submissionToken,
      s.studentName,
      s.usn,
      s.email,
      s.attemptNumber,
      s.status,
      s.isLate ? 'YES' : 'NO',
      s.obtainedMarks ?? '',
      s.totalMarks ?? '',
      s.percentage ?? '',
      s.passed == null ? '' : s.passed ? 'YES' : 'NO',
      s.evaluationStatus,
      s.submittedAt ?? '',
    ]),
  );

  const markRows: unknown[][] = [];
  const schemeMarkRows: unknown[][] = [];
  for (const s of submissions.filter((x) => ['SUBMITTED', 'LATE_SUBMITTED'].includes(String(x.status)))) {
    const detail = await getSubmissionDetail(assignmentId, collegeId, String(s.submissionToken));
    for (const q of detail.questions) {
      markRows.push([
        s.submissionToken,
        s.usn,
        q.id,
        q.awardedMarks ?? '',
        q.marks,
        q.feedback ?? '',
      ]);
      const schemeMarks = parseJson<{
        criteria?: Array<{ id: string; label: string; awarded: number; maxMarks: number }>;
      }>(q.schemeMarks, {});
      for (const c of schemeMarks.criteria ?? []) {
        schemeMarkRows.push([
          s.submissionToken,
          s.usn,
          q.id,
          c.id,
          c.label,
          c.awarded,
          c.maxMarks,
        ]);
      }
    }
  }

  addSheet(
    wb,
    'QUESTION_MARKS',
    ['Submission Token', 'USN', 'Question ID', 'Awarded', 'Max', 'Feedback'],
    markRows,
  );
  addSheet(
    wb,
    'SCHEME_MARKS',
    ['Submission Token', 'USN', 'Question ID', 'Criterion ID', 'Label', 'Awarded', 'Max'],
    schemeMarkRows,
  );

  addSheet(
    wb,
    'CO_PERFORMANCE',
    ['CO', 'Questions', 'Available Marks', 'Class Average Marks', 'Average %'],
    coPerf.cos.map((r) => [
      r.coCode,
      r.questionCount,
      r.availableMarks,
      r.classAverageMarks,
      r.averagePercent ?? '',
    ]),
  );

  const body = Buffer.from(await wb.xlsx.writeBuffer());
  return {
    filename: buildExportFilename(String(assignment.title), 'xlsx'),
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    body,
  };
}

export async function exportAssignment(
  assignmentId: number,
  collegeId: number,
  _format: 'xlsx' | 'csv' = 'xlsx',
) {
  // Full multi-sheet export is Excel-only for assignments
  await db('assignments').where({ id: assignmentId, college_id: collegeId }).first();
  if (!(await db('assignments').where({ id: assignmentId, college_id: collegeId }).whereNull('deleted_at').first())) {
    throw new AppError(404, 'Assignment not found');
  }
  return exportAssignmentXlsx(assignmentId, collegeId);
}
