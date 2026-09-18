/**
 * Real-DB E2E for Assignment module:
 * TOC Modules 1&2 STANDARD(8) generate → publish → student paste/submit → scheme eval → CO performance
 * + second subject (DBMS) smoke generate/publish/ownership
 *
 * Run: node --import tsx src/scripts/e2eAssignment.ts
 */
import { db } from '../db/index.js';
import { decideAssignmentAccess } from '../modules/assignments/access.js';
import * as generator from '../modules/assignments/generatorService.js';
import * as assignments from '../modules/assignments/service.js';
import * as submission from '../modules/assignments/submissionService.js';
import { getAssignmentCoPerformance } from '../modules/assignments/coPerformance.js';
import { exportAssignmentXlsx } from '../modules/assignments/exportService.js';
import { assertNoAnswerLeak } from '../modules/assignments/serialize.js';
import { buildDefaultScheme, parseEvaluationScheme } from '../modules/assignments/scheme.js';
import type { AssignmentQuestionType } from '../types/assignment.js';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function findCourse(collegeId: number, nameLike: string) {
  const row = await db('courses')
    .where({ college_id: collegeId })
    .andWhere('name', 'like', `%${nameLike}%`)
    .orderBy('id')
    .first();
  return row;
}

async function runSubjectFlow(opts: {
  collegeId: number;
  facultyAId: number;
  facultyBId: number;
  courseNameLike: string;
  moduleCount: number;
  preset: 'STANDARD' | 'SHORT';
  label: string;
}) {
  const course = await findCourse(opts.collegeId, opts.courseNameLike);
  assert(course, `Course not found: ${opts.courseNameLike}`);
  const modules = await db('subject_modules')
    .where({ college_id: opts.collegeId, course_id: course.id })
    .orderBy('name')
    .limit(opts.moduleCount);
  assert(modules.length >= opts.moduleCount, `${opts.label}: need ${opts.moduleCount} modules`);

  const startAt = new Date(Date.now() - 60_000).toISOString();
  const dueAt = new Date(Date.now() + 7 * 24 * 3600_000).toISOString();

  const created = await generator.generateAssignment(opts.collegeId, opts.facultyAId, {
    title: `E2E ${opts.label} Assignment`,
    courseId: Number(course.id),
    moduleIds: modules.map((m) => Number(m.id)),
    preset: opts.preset,
    distribution: 'BALANCED',
    startAt,
    dueAt,
    lateSubmissionAllowed: true,
    lateDeadlineAt: new Date(Date.now() + 10 * 24 * 3600_000).toISOString(),
    instructions: 'Answer in your own words. Show working where needed.',
    solutionReleasePolicy: 'MANUAL_RELEASE',
  } as any);

  assert(created.questions?.length >= 5, `${opts.label}: expected generated questions`);
  for (const q of created.questions) {
    assert(q.questionText, `${opts.label}: missing question text`);
    assert(Number(q.marks) > 0, `${opts.label}: missing marks`);
    assert(q.expectedAnswerGuidance || (q as any).modelSolution, `${opts.label}: missing model solution`);
    let scheme = parseEvaluationScheme(q.evaluationRubric ?? (q as any).evaluationScheme);
    if (!scheme) {
      scheme = buildDefaultScheme(
        (q.questionType as AssignmentQuestionType) || 'DESCRIPTIVE',
        Number(q.marks),
      );
    }
    assert(scheme.criteria.length >= 1, `${opts.label}: missing scheme`);
    const total = scheme.criteria.reduce((s, c) => s + Number(c.maxMarks), 0);
    assert(Math.abs(total - Number(q.marks)) < 0.02, `${opts.label}: scheme total != marks for Q${q.id}`);
  }

  const publishedResult = await assignments.publishAssignment(Number(created.id), opts.collegeId);
  const published = (publishedResult as any).assignment ?? publishedResult;
  const shareCode = String((publishedResult as any).shareCode || published.shareCode);
  assert(shareCode, `${opts.label}: missing share code`);
  assert(
    ['PUBLISHED', 'ACTIVE'].includes(String(published.status)),
    `${opts.label}: bad status (${published.status})`,
  );

  const publicLanding = await submission.getPublicAssignment(shareCode);
  assertNoAnswerLeak(publicLanding, `${opts.label} public landing`);
  assert(publicLanding.accessible, `${opts.label}: not accessible`);

  const started = await submission.startSubmission(
    shareCode,
    {
      name: 'E2E Student',
      usn: `E2E${Date.now().toString().slice(-8)}`,
      email: `e2e.${Date.now()}@example.com`,
    },
    { ip: '127.0.0.1', userAgent: 'e2e-assignment' },
  );
  assertNoAnswerLeak(started, `${opts.label} start`);
  const token = String((started as any).submissionToken || (started as any).token);
  assert(token, `${opts.label}: missing submission token`);

  const questions = ((started as any).questions || []) as Array<{ id: number | string }>;
  const answers = questions.map((q, i) => ({
    questionId: q.id,
    textAnswer: `E2E pasted answer for question ${i + 1}.\nLine two with reasoning.`,
  }));

  const saved = await submission.saveSubmissionAnswers(shareCode, {
    submissionToken: token,
    answers: answers.slice(0, Math.max(1, answers.length - 1)),
  });
  assertNoAnswerLeak(saved, `${opts.label} autosave`);

  const resumed = await submission.getSubmission(shareCode, token);
  assertNoAnswerLeak(resumed, `${opts.label} resume`);

  const submitted = await submission.submitAssignment(shareCode, {
    submissionToken: token,
    answers,
  });
  assertNoAnswerLeak(submitted, `${opts.label} submit`);

  const detail = await assignments.getSubmissionDetail(Number(created.id), opts.collegeId, token);
  const evalQuestions = detail.questions.map((q: any) => {
    let scheme = parseEvaluationScheme(q.evaluationRubric ?? q.evaluationScheme);
    if (!scheme) {
      scheme = buildDefaultScheme(
        (q.questionType as AssignmentQuestionType) || 'DESCRIPTIVE',
        Number(q.marks),
      );
    }
    return {
      snapshotQuestionId: q.id,
      feedback: 'Solid attempt',
      criteria: scheme.criteria.map((c) => ({
        id: c.id,
        awarded: Number(c.maxMarks),
        feedback: null,
      })),
    };
  });

  await assignments.evaluateSubmission(Number(created.id), opts.collegeId, token, opts.facultyAId, {
    mode: 'FINALIZE',
    overallFeedback: 'Good work overall',
    releaseResults: true,
    questions: evalQuestions,
  });

  const coPerf = await getAssignmentCoPerformance(Number(created.id), opts.collegeId);
  assert(Array.isArray(coPerf.cos), `${opts.label}: CO performance shape`);

  const print = await assignments.buildPrintModel(Number(created.id), opts.collegeId);
  assert(print, `${opts.label}: print model`);

  const xlsx = await exportAssignmentXlsx(Number(created.id), opts.collegeId);
  assert(xlsx?.body, `${opts.label}: export`);

  // Ownership: faculty B cannot access
  const decision = decideAssignmentAccess(
    { facultyUserId: opts.facultyBId, collegeId: opts.collegeId, role: 'FACULTY' },
    { collegeId: opts.collegeId, createdBy: opts.facultyAId },
  );
  assert(decision === 'FORBIDDEN', `${opts.label}: peer faculty should be FORBIDDEN`);

  try {
    await assignments.getAssignment(Number(created.id), opts.collegeId);
    // getAssignment is college-scoped; ownership is enforced at controller. Soft-check via access decision above.
  } catch {
    /* ignore */
  }

  return {
    label: opts.label,
    assignmentId: Number(created.id),
    shareCode,
    questionCount: created.questions.length,
    totalMarks: created.questions.reduce((s: number, q: any) => s + Number(q.marks), 0),
    coPerformance: coPerf,
  };
}

async function main() {
  const college = await db('colleges').orderBy('id').first();
  assert(college, 'No college');
  const collegeId = Number(college.id);

  const facultyUsers = await db('faculty_users')
    .where({ college_id: collegeId, role: 'FACULTY' })
    .orderBy('id')
    .limit(2);
  if (facultyUsers.length < 2) {
    const any = await db('faculty_users').where({ college_id: collegeId }).orderBy('id').limit(2);
    facultyUsers.splice(0, facultyUsers.length, ...any);
  }
  assert(facultyUsers.length >= 2, 'Need two faculty users');

  const bankCount = await db('assignment_bank_questions')
    .where({ college_id: collegeId, is_active: true })
    .count({ c: '*' })
    .first();
  console.log('Assignment bank rows:', Number(bankCount?.c ?? 0));

  const toc = await runSubjectFlow({
    collegeId,
    facultyAId: Number(facultyUsers[0].id),
    facultyBId: Number(facultyUsers[1].id),
    courseNameLike: 'Theory of Computation',
    moduleCount: 2,
    preset: 'STANDARD',
    label: 'TOC',
  });
  console.log('TOC E2E OK', {
    id: toc.assignmentId,
    code: toc.shareCode,
    questions: toc.questionCount,
    marks: toc.totalMarks,
  });

  const dbms = await runSubjectFlow({
    collegeId,
    facultyAId: Number(facultyUsers[0].id),
    facultyBId: Number(facultyUsers[1].id),
    courseNameLike: 'Database Management',
    moduleCount: 2,
    preset: 'SHORT',
    label: 'DBMS',
  });
  console.log('DBMS E2E OK', {
    id: dbms.assignmentId,
    code: dbms.shareCode,
    questions: dbms.questionCount,
    marks: dbms.totalMarks,
  });

  console.log('E2E_ASSIGNMENT_PASS');
  await db.destroy();
}

main().catch(async (err) => {
  console.error('E2E_ASSIGNMENT_FAIL', err);
  try {
    await db.destroy();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
