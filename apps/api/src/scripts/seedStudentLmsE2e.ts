/**
 * Deterministic Student LMS E2E seed.
 *
 * Usage:
 *   npm run seed:student-lms-e2e -w @skillonx/survey-api
 *
 * Refuses production unless ALLOW_TEST_SEED=true.
 * Idempotent via stable class code SX-E2E-CSE-3A.
 */
import bcrypt from 'bcrypt';
import { pathToFileURL } from 'node:url';
import { db } from '../db/index.js';
import { env } from '../config/env.js';
import { generateAssignmentCode, generateClassCode, generateQuizCode } from '../utils/codes.js';

const CLASS_CODE = 'SX-E2E-CSE-3A';
const HISTORY_CODE = 'SX-E2E-CSE-2A';
const SEED_TAG = 'SEED-STUDENT-LMS-E2E';

function studentE2ePassword() {
  return process.env.MOBILE_E2E_STUDENT_PASSWORD ?? '';
}

type Ids = {
  collegeId: number;
  yearId: number;
  programId: number;
  departmentId: number;
  semester3Id: number;
  semester2Id: number;
  schemeId: number;
  sectionAId: number;
  sectionBId: number;
  coordinatorId: number;
  facultyDsId: number;
  facultyOopId: number;
  facultyMathId: number;
  facultyDdId: number;
};

async function requireProductionGuard() {
  if (env.NODE_ENV === 'production' && process.env.ALLOW_TEST_SEED !== 'true') {
    throw new Error(
      'Refusing Student LMS E2E seed in production. Set ALLOW_TEST_SEED=true only for controlled test environments.',
    );
  }
  if (!studentE2ePassword()) {
    throw new Error('Set MOBILE_E2E_STUDENT_PASSWORD before running the Student LMS E2E seed.');
  }
}

async function ensureSection(collegeId: number, departmentId: number, label: string) {
  const existing = await db('class_sections').where({ college_id: collegeId, department_id: departmentId, label }).first();
  if (existing) return Number(existing.id);
  const [id] = await db('class_sections').insert({ college_id: collegeId, department_id: departmentId, label });
  return Number(id);
}

async function ensureCourse(input: {
  collegeId: number;
  departmentId: number;
  semesterId: number;
  schemeId: number;
  code: string;
  name: string;
  credits: number;
}) {
  let course = await db('courses').where({ college_id: input.collegeId, code: input.code }).first();
  if (!course) {
    const [id] = await db('courses').insert({
      college_id: input.collegeId,
      department_id: input.departmentId,
      semester_id: input.semesterId,
      scheme_id: input.schemeId,
      code: input.code,
      name: input.name,
      course_type: 'PCC',
      credits: input.credits,
    });
    course = await db('courses').where({ id }).first();
  } else {
    await db('courses').where({ id: course.id }).update({
      department_id: input.departmentId,
      semester_id: input.semesterId,
      scheme_id: input.schemeId,
      name: input.name,
      credits: input.credits,
      updated_at: db.fn.now(),
    });
  }
  return Number(course!.id);
}

async function ensureModule(collegeId: number, courseId: number, name: string, sortOrder: number) {
  const existing = await db('subject_modules').where({ college_id: collegeId, course_id: courseId, name }).first();
  if (existing) return Number(existing.id);
  const [id] = await db('subject_modules').insert({
    college_id: collegeId,
    course_id: courseId,
    name,
    sort_order: sortOrder,
  });
  return Number(id);
}

async function ensureTopic(
  collegeId: number,
  courseId: number,
  moduleId: number,
  name: string,
  sortOrder: number,
) {
  const existing = await db('lesson_topics')
    .where({ college_id: collegeId, course_id: courseId, module_id: moduleId, name })
    .first();
  if (existing) return Number(existing.id);
  const [id] = await db('lesson_topics').insert({
    college_id: collegeId,
    course_id: courseId,
    module_id: moduleId,
    name,
    sort_order: sortOrder,
    normalized_name: name.toLowerCase(),
  });
  return Number(id);
}

async function ensureOutcome(collegeId: number, courseId: number, code: string, statement: string, n: number) {
  const existing = await db('course_outcomes').where({ college_id: collegeId, course_id: courseId, co_code: code }).first();
  if (existing) return Number(existing.id);
  const [id] = await db('course_outcomes').insert({
    college_id: collegeId,
    course_id: courseId,
    co_code: code,
    co_number: n,
    statement,
    status: 'ACTIVE',
    is_current: true,
    version_number: 1,
    source: SEED_TAG,
  });
  return Number(id);
}

async function upsertStudent(input: {
  collegeId: number;
  programId: number;
  departmentId: number;
  semesterId: number;
  sectionId: number;
  schemeId: number;
  yearId: number;
  name: string;
  usn: string;
  email: string;
  sectionLabel: string;
  semesterLabel: string;
  active?: boolean;
}) {
  const hash = await bcrypt.hash(studentE2ePassword(), 10);
  const existing = await db('students').where({ college_id: input.collegeId, usn: input.usn }).first();
  const patch = {
    name: input.name,
    email: input.email,
    password_hash: hash,
    program_id: input.programId,
    department_id: input.departmentId,
    semester_id: input.semesterId,
    class_section_id: input.sectionId,
    scheme_id: input.schemeId,
    academic_year_id: input.yearId,
    semester: input.semesterLabel,
    section: input.sectionLabel,
    is_active: input.active !== false,
    profile_completed_at: db.fn.now(),
    updated_at: db.fn.now(),
  };
  if (existing) {
    await db('students').where({ id: existing.id }).update(patch);
    return Number(existing.id);
  }
  const [id] = await db('students').insert({
    college_id: input.collegeId,
    usn: input.usn,
    ...patch,
  });
  return Number(id);
}

async function ensureEnrollment(
  collegeId: number,
  classId: number,
  studentId: number,
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'COMPLETED',
) {
  const existing = await db('academic_class_enrollments')
    .where({ academic_class_id: classId, student_id: studentId })
    .first();
  if (existing) {
    await db('academic_class_enrollments').where({ id: existing.id }).update({
      status,
      approved_at: status === 'APPROVED' || status === 'COMPLETED' ? db.fn.now() : null,
      updated_at: db.fn.now(),
    });
    return Number(existing.id);
  }
  const [id] = await db('academic_class_enrollments').insert({
    college_id: collegeId,
    academic_class_id: classId,
    student_id: studentId,
    status,
    requested_at: db.fn.now(),
    approved_at: status === 'APPROVED' || status === 'COMPLETED' ? db.fn.now() : null,
  });
  return Number(id);
}

async function ensureClass(ids: Ids, code: string, semesterId: number, sectionId: number, status: string) {
  let row = await db('academic_classes').where({ college_id: ids.collegeId, code }).first();
  if (!row) {
    const [id] = await db('academic_classes').insert({
      college_id: ids.collegeId,
      academic_year_id: ids.yearId,
      program_id: ids.programId,
      department_id: ids.departmentId,
      semester_id: semesterId,
      scheme_id: ids.schemeId,
      class_section_id: sectionId,
      coordinator_id: ids.coordinatorId,
      name: code === CLASS_CODE ? 'CSE · Semester III · Section A · 2026-27' : 'CSE · Semester II · Section A · 2026-27',
      code,
      status,
    });
    row = await db('academic_classes').where({ id }).first();
    await db('academic_class_coordinators').insert({
      college_id: ids.collegeId,
      academic_class_id: id,
      faculty_id: ids.coordinatorId,
      role: 'COORDINATOR',
    });
  } else {
    await db('academic_classes').where({ id: row.id }).update({
      status,
      coordinator_id: ids.coordinatorId,
      updated_at: db.fn.now(),
    });
  }
  const classId = Number(row!.id);
  let link = await db('academic_class_links').where({ academic_class_id: classId, is_active: true }).first();
  if (!link) {
    const joinCode = generateClassCode();
    const [linkId] = await db('academic_class_links').insert({
      academic_class_id: classId,
      code: joinCode,
      is_active: true,
      created_by: ids.coordinatorId,
    });
    link = await db('academic_class_links').where({ id: linkId }).first();
  }
  return { classId, joinCode: String(link!.code) };
}

async function mapSubject(
  collegeId: number,
  classId: number,
  courseId: number,
  facultyId: number,
  sortOrder: number,
) {
  let subject = await db('academic_class_subjects').where({ academic_class_id: classId, course_id: courseId }).first();
  if (!subject) {
    const [id] = await db('academic_class_subjects').insert({
      college_id: collegeId,
      academic_class_id: classId,
      course_id: courseId,
      kind: 'CORE',
      is_active: true,
      sort_order: sortOrder,
    });
    subject = await db('academic_class_subjects').where({ id }).first();
  }
  const classSubjectId = Number(subject!.id);
  const existingFaculty = await db('academic_class_subject_faculty')
    .where({ class_subject_id: classSubjectId, faculty_id: facultyId })
    .first();
  if (!existingFaculty) {
    await db('academic_class_subject_faculty').insert({
      college_id: collegeId,
      academic_class_id: classId,
      class_subject_id: classSubjectId,
      course_id: courseId,
      faculty_id: facultyId,
      is_primary: true,
      can_manage: true,
      status: 'ACTIVE',
    });
  }
  return classSubjectId;
}

async function ensureAssignment(input: {
  collegeId: number;
  facultyId: number;
  courseId: number;
  moduleId: number;
  sectionId: number;
  yearId: number;
  semesterId: number;
  departmentId: number;
  title: string;
  draft?: boolean;
}) {
  let row = await db('assignments')
    .where({ college_id: input.collegeId, course_id: input.courseId, title: input.title })
    .whereNull('deleted_at')
    .first();
  const start = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const due = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  if (!row) {
    const [id] = await db('assignments').insert({
      college_id: input.collegeId,
      created_by: input.facultyId,
      title: input.title,
      description: 'E2E seeded assignment for Student LMS.',
      instructions: 'Answer the question in your own words.',
      course_id: input.courseId,
      module_id: input.moduleId,
      academic_year_id: input.yearId,
      semester_id: input.semesterId,
      department_id: input.departmentId,
      class_section_id: input.sectionId,
      start_at: start,
      due_at: due,
      attempts_allowed: 2,
      late_submission_allowed: true,
      status: input.draft ? 'DRAFT' : 'ACTIVE',
      published_at: input.draft ? null : start,
    });
    row = await db('assignments').where({ id }).first();
    const [qid] = await db('assignment_questions').insert({
      assignment_id: id,
      question_text: 'Explain arrays vs linked lists with one example each.',
      question_type: 'SHORT_ANSWER',
      response_format: 'TEXT',
      marks: 10,
      primary_co_code: 'CO1',
      expected_answer_guidance: 'Arrays are contiguous; linked lists use nodes and pointers.',
      evaluation_rubric: JSON.stringify({ total: 10, criteria: [{ label: 'Correctness', marks: 10 }] }),
      sort_order: 1,
    });
    if (!input.draft) {
      await db('assignments').where({ id }).update({
        published_snapshot: JSON.stringify({
          capturedAt: new Date().toISOString(),
          structureVersion: 1,
          questions: [
            {
              id: qid,
              questionText: 'Explain arrays vs linked lists with one example each.',
              questionType: 'SHORT_ANSWER',
              responseFormat: 'TEXT',
              marks: 10,
              primaryCoCode: 'CO1',
              expectedAnswerGuidance: 'Arrays are contiguous; linked lists use nodes and pointers.',
              sortOrder: 1,
            },
          ],
        }),
        structure_locked: true,
      });
    }
  } else if (!input.draft) {
    const questions = await db('assignment_questions').where({ assignment_id: row.id }).orderBy('sort_order');
    await db('assignments').where({ id: row.id }).update({
      status: 'ACTIVE',
      published_at: row.published_at || start,
      class_section_id: input.sectionId,
      due_at: due,
      structure_locked: true,
      published_snapshot: JSON.stringify({
        capturedAt: new Date().toISOString(),
        structureVersion: 1,
        questions: questions.map((q) => ({
          id: Number(q.id),
          questionText: q.question_text,
          questionType: q.question_type,
          responseFormat: q.response_format,
          marks: Number(q.marks),
          primaryCoCode: q.primary_co_code,
          expectedAnswerGuidance: q.expected_answer_guidance,
          sortOrder: Number(q.sort_order),
        })),
      }),
      updated_at: db.fn.now(),
    });
  }
  const assignmentId = Number(row!.id);
  let link = await db('assignment_links').where({ assignment_id: assignmentId, is_active: true }).first();
  if (!link && !input.draft) {
    const [linkId] = await db('assignment_links').insert({
      assignment_id: assignmentId,
      code: generateAssignmentCode(),
      is_active: true,
    });
    link = await db('assignment_links').where({ id: linkId }).first();
  }
  return { assignmentId, shareCode: link ? String(link.code) : null };
}

async function ensureQuiz(input: {
  collegeId: number;
  facultyId: number;
  courseId: number;
  moduleId: number;
  sectionId: number;
  yearId: number;
  semesterId: number;
  departmentId: number;
  title: string;
  draft?: boolean;
}) {
  let row = await db('quizzes')
    .where({ college_id: input.collegeId, course_id: input.courseId, title: input.title })
    .whereNull('deleted_at')
    .first();
  const start = new Date(Date.now() - 60 * 60 * 1000);
  const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  if (!row) {
    const [id] = await db('quizzes').insert({
      college_id: input.collegeId,
      created_by: input.facultyId,
      title: input.title,
      description: 'E2E seeded quiz',
      instructions: 'Choose the best answer.',
      course_id: input.courseId,
      module_id: input.moduleId,
      academic_year_id: input.yearId,
      semester_id: input.semesterId,
      department_id: input.departmentId,
      class_section_id: input.sectionId,
      duration_minutes: 15,
      start_at: start,
      end_at: end,
      attempts_allowed: 1,
      show_score_immediately: true,
      show_correct_answers: 'AFTER_END',
      status: input.draft ? 'DRAFT' : 'ACTIVE',
      published_at: input.draft ? null : start,
    });
    row = await db('quizzes').where({ id }).first();
    const [qid] = await db('quiz_questions').insert({
      quiz_id: id,
      question_text: 'Which structure uses LIFO order?',
      question_type: 'SINGLE_CHOICE',
      marks: 2,
      difficulty: 'EASY',
      primary_co_code: 'CO2',
      sort_order: 1,
    });
    await db('quiz_question_options').insert([
      { quiz_question_id: qid, label: 'Queue', sort_order: 0, is_correct: false },
      { quiz_question_id: qid, label: 'Stack', sort_order: 1, is_correct: true },
      { quiz_question_id: qid, label: 'Array', sort_order: 2, is_correct: false },
      { quiz_question_id: qid, label: 'Tree', sort_order: 3, is_correct: false },
    ]);
    const options = await db('quiz_question_options').where({ quiz_question_id: qid }).orderBy('sort_order');
    await db('quizzes').where({ id }).update({
      published_snapshot: JSON.stringify({
        capturedAt: new Date().toISOString(),
        structureVersion: 1,
        questions: [
          {
            id: qid,
            questionText: 'Which structure uses LIFO order?',
            questionType: 'SINGLE_CHOICE',
            marks: 2,
            maxMarks: 2,
            difficulty: 'EASY',
            primaryCoCode: 'CO2',
            options: options.map((o) => ({
              id: Number(o.id),
              label: o.label,
              isCorrect: Boolean(o.is_correct),
            })),
            correctOptionIds: options.filter((o) => o.is_correct).map((o) => Number(o.id)),
          },
        ],
      }),
    });
  } else if (!input.draft) {
    const questions = await db('quiz_questions').where({ quiz_id: row.id }).orderBy('sort_order');
    const qids = questions.map((q) => Number(q.id));
    const options = qids.length
      ? await db('quiz_question_options').whereIn('quiz_question_id', qids).orderBy('sort_order')
      : [];
    const optionsByQ = new Map<number, typeof options>();
    for (const o of options) {
      const list = optionsByQ.get(Number(o.quiz_question_id)) ?? [];
      list.push(o);
      optionsByQ.set(Number(o.quiz_question_id), list);
    }
    await db('quizzes').where({ id: row.id }).update({
      status: 'ACTIVE',
      published_at: row.published_at || start,
      class_section_id: input.sectionId,
      end_at: end,
      published_snapshot: JSON.stringify({
        capturedAt: new Date().toISOString(),
        structureVersion: 1,
        questions: questions.map((q) => {
          const opts = optionsByQ.get(Number(q.id)) ?? [];
          return {
            id: Number(q.id),
            questionText: q.question_text,
            questionType: q.question_type,
            marks: Number(q.marks),
            maxMarks: Number(q.marks),
            difficulty: q.difficulty,
            primaryCoCode: q.primary_co_code,
            options: opts.map((o) => ({
              id: Number(o.id),
              label: o.label,
              isCorrect: Boolean(o.is_correct),
            })),
            correctOptionIds: opts.filter((o) => o.is_correct).map((o) => Number(o.id)),
          };
        }),
      }),
      updated_at: db.fn.now(),
    });
  }
  const quizId = Number(row!.id);
  let link = await db('quiz_links').where({ quiz_id: quizId, is_active: true }).first();
  if (!link && !input.draft) {
    const [linkId] = await db('quiz_links').insert({
      quiz_id: quizId,
      code: generateQuizCode(),
      is_active: true,
    });
    link = await db('quiz_links').where({ id: linkId }).first();
  }
  return { quizId, shareCode: link ? String(link.code) : null };
}

export async function seedStudentLmsE2e(options: { closeDb?: boolean; collegeId?: number } = {}) {
  await requireProductionGuard();
  console.log('Seeding Student LMS E2E data…');

  // Resolve by stable college code (or explicit override). Never hard-require demo PK=4 —
  // production restores rarely preserve local autoincrement IDs.
  const collegeCode = (process.env.STUDENT_LMS_E2E_COLLEGE_CODE || 'VVIET').trim().toUpperCase();
  let college = options.collegeId
    ? await db('colleges').where({ id: options.collegeId }).first()
    : await db('colleges').where({ code: collegeCode }).first();
  if (!college && !options.collegeId) {
    college = await db('colleges').whereILike('name', '%VVIET%').orWhereILike('name', '%Vidyavardhaka%').first();
  }
  if (!college) {
    throw new Error(
      `Expected college code=${collegeCode} (or set STUDENT_LMS_E2E_COLLEGE_CODE / pass collegeId). ` +
        'Run `npm run seed:live-qa` first to bootstrap VVIET + Anita for live QA.',
    );
  }
  const collegeId = Number(college.id);

  const year = await db('academic_years').where({ college_id: collegeId, is_current: true }).first();
  const program = await db('programs').where({ college_id: collegeId, code: 'BE-CSE' }).first();
  const department = await db('departments').where({ college_id: collegeId, code: 'CSE' }).first();
  const semester3 = await db('semesters').where({ college_id: collegeId, number: 3 }).first();
  const semester2 = await db('semesters').where({ college_id: collegeId, number: 2 }).first();
  const scheme = await db('academic_schemes').where({ college_id: collegeId, code: 'VTU-2022' }).first();
  const coordinator = await db('faculty_users').where({ college_id: collegeId, email: 'anita@vviet.edu.in' }).first();
  const facultyRavi = await db('faculty_users').where({ college_id: collegeId, email: 'ravi@vviet.edu.in' }).first();
  const facultyRanjitha = await db('faculty_users').where({ email: 'ranjitha@vidyavikas.edu.in' }).first();
  const facultyMadhu = await db('faculty_users').where({ email: 'madhu.bk@vidyavikas.edu.in' }).first();

  if (!year || !program || !department || !semester3 || !semester2 || !scheme || !coordinator) {
    throw new Error(
      'Missing master data for Student LMS E2E seed (year/program/CSE/semesters/scheme/anita@vviet.edu.in). ' +
        'Run `npm run seed:live-qa` to create them.',
    );
  }

  const ids: Ids = {
    collegeId,
    yearId: Number(year.id),
    programId: Number(program.id),
    departmentId: Number(department.id),
    semester3Id: Number(semester3.id),
    semester2Id: Number(semester2.id),
    schemeId: Number(scheme.id),
    sectionAId: await ensureSection(collegeId, Number(department.id), 'A'),
    sectionBId: await ensureSection(collegeId, Number(department.id), 'B'),
    coordinatorId: Number(coordinator.id),
    facultyDsId: Number(coordinator.id),
    facultyOopId: Number(facultyRavi?.id || coordinator.id),
    facultyMathId: Number(facultyRanjitha?.id || coordinator.id),
    facultyDdId: Number(facultyMadhu?.id || coordinator.id),
  };

  await db('college_attendance_policies')
    .insert({
      college_id: ids.collegeId,
      minimum_percentage: 85,
      count_late_as_present: true,
      count_excused_in_denominator: true,
    })
    .onConflict('college_id')
    .ignore();

  const dsId = await ensureCourse({
    collegeId: ids.collegeId,
    departmentId: ids.departmentId,
    semesterId: ids.semester3Id,
    schemeId: ids.schemeId,
    code: '1BCS305',
    name: 'Data Structures and Applications',
    credits: 4,
  });
  const oopId = await ensureCourse({
    collegeId: ids.collegeId,
    departmentId: ids.departmentId,
    semesterId: ids.semester3Id,
    schemeId: ids.schemeId,
    code: '1BCS302',
    name: 'Object Oriented Programming with Java',
    credits: 4,
  });
  const mathId = await ensureCourse({
    collegeId: ids.collegeId,
    departmentId: ids.departmentId,
    semesterId: ids.semester3Id,
    schemeId: ids.schemeId,
    code: 'BMATS301',
    name: 'Mathematics for Computer Science',
    credits: 3,
  });
  const ddId = await ensureCourse({
    collegeId: ids.collegeId,
    departmentId: ids.departmentId,
    semesterId: ids.semester3Id,
    schemeId: ids.schemeId,
    code: 'BCS304',
    name: 'Digital Design',
    credits: 3,
  });

  const m1 = await ensureModule(ids.collegeId, dsId, 'Module 1 — Introduction to Data Structures', 1);
  const m2 = await ensureModule(ids.collegeId, dsId, 'Module 2 — Linear Structures', 2);
  const topicArrays = await ensureTopic(ids.collegeId, dsId, m1, 'Arrays', 1);
  const topicLists = await ensureTopic(ids.collegeId, dsId, m1, 'Linked Lists', 2);
  await ensureTopic(ids.collegeId, dsId, m2, 'Stacks', 1);
  await ensureTopic(ids.collegeId, dsId, m2, 'Queues', 2);
  // "Draft" topic is simply created; student LMS shows syllabus topics as published curriculum.
  await ensureTopic(ids.collegeId, dsId, m1, 'DRAFT — Faculty notes (hidden via unpublished assignment)', 99);

  await ensureOutcome(ids.collegeId, dsId, 'CO1', 'Apply array and linked list operations to solve problems.', 1);
  await ensureOutcome(ids.collegeId, dsId, 'CO2', 'Implement stack and queue applications.', 2);
  await ensureOutcome(ids.collegeId, dsId, 'CO3', 'Analyze time complexity of basic data structure operations.', 3);

  const current = await ensureClass(ids, CLASS_CODE, ids.semester3Id, ids.sectionAId, 'ACTIVE');
  const history = await ensureClass(ids, HISTORY_CODE, ids.semester2Id, ids.sectionAId, 'COMPLETED');

  const dsSubjectId = await mapSubject(ids.collegeId, current.classId, dsId, ids.facultyDsId, 1);
  const oopSubjectId = await mapSubject(ids.collegeId, current.classId, oopId, ids.facultyOopId, 2);
  const mathSubjectId = await mapSubject(ids.collegeId, current.classId, mathId, ids.facultyMathId, 3);
  await mapSubject(ids.collegeId, current.classId, ddId, ids.facultyDdId, 4);
  await mapSubject(ids.collegeId, history.classId, dsId, ids.facultyDsId, 1);

  const approved = await upsertStudent({
    collegeId: ids.collegeId,
    programId: ids.programId,
    departmentId: ids.departmentId,
    semesterId: ids.semester3Id,
    sectionId: ids.sectionAId,
    schemeId: ids.schemeId,
    yearId: ids.yearId,
    name: 'Aarav Approved',
    usn: '4VV24CS001',
    email: 'e2e.approved@student.skillonx.test',
    sectionLabel: 'A',
    semesterLabel: 'III',
  });
  const pending = await upsertStudent({
    collegeId: ids.collegeId,
    programId: ids.programId,
    departmentId: ids.departmentId,
    semesterId: ids.semester3Id,
    sectionId: ids.sectionAId,
    schemeId: ids.schemeId,
    yearId: ids.yearId,
    name: 'Priya Pending',
    usn: '4VV24CS002',
    email: 'e2e.pending@student.skillonx.test',
    sectionLabel: 'A',
    semesterLabel: 'III',
  });
  const rejected = await upsertStudent({
    collegeId: ids.collegeId,
    programId: ids.programId,
    departmentId: ids.departmentId,
    semesterId: ids.semester3Id,
    sectionId: ids.sectionAId,
    schemeId: ids.schemeId,
    yearId: ids.yearId,
    name: 'Rohan Rejected',
    usn: '4VV24CS003',
    email: 'e2e.rejected@student.skillonx.test',
    sectionLabel: 'A',
    semesterLabel: 'III',
  });
  const wrongSection = await upsertStudent({
    collegeId: ids.collegeId,
    programId: ids.programId,
    departmentId: ids.departmentId,
    semesterId: ids.semester3Id,
    sectionId: ids.sectionBId,
    schemeId: ids.schemeId,
    yearId: ids.yearId,
    name: 'Sneha SectionB',
    usn: '4VV24CS004',
    email: 'e2e.sectionb@student.skillonx.test',
    sectionLabel: 'B',
    semesterLabel: 'III',
  });
  const inactive = await upsertStudent({
    collegeId: ids.collegeId,
    programId: ids.programId,
    departmentId: ids.departmentId,
    semesterId: ids.semester3Id,
    sectionId: ids.sectionAId,
    schemeId: ids.schemeId,
    yearId: ids.yearId,
    name: 'Inactive Student',
    usn: '4VV24CS005',
    email: 'e2e.inactive@student.skillonx.test',
    sectionLabel: 'A',
    semesterLabel: 'III',
    active: false,
  });
  const approved2 = await upsertStudent({
    collegeId: ids.collegeId,
    programId: ids.programId,
    departmentId: ids.departmentId,
    semesterId: ids.semester3Id,
    sectionId: ids.sectionAId,
    schemeId: ids.schemeId,
    yearId: ids.yearId,
    name: 'Diya PresentAbsent',
    usn: '4VV24CS006',
    email: 'e2e.absent@student.skillonx.test',
    sectionLabel: 'A',
    semesterLabel: 'III',
  });

  await ensureEnrollment(ids.collegeId, current.classId, approved, 'APPROVED');
  await ensureEnrollment(ids.collegeId, current.classId, approved2, 'APPROVED');
  await ensureEnrollment(ids.collegeId, current.classId, pending, 'PENDING');
  await ensureEnrollment(ids.collegeId, current.classId, rejected, 'REJECTED');
  await ensureEnrollment(ids.collegeId, history.classId, approved, 'COMPLETED');

  const assignment = await ensureAssignment({
    collegeId: ids.collegeId,
    facultyId: ids.facultyDsId,
    courseId: dsId,
    moduleId: m1,
    sectionId: ids.sectionAId,
    yearId: ids.yearId,
    semesterId: ids.semester3Id,
    departmentId: ids.departmentId,
    title: 'DS Assignment 1 — Arrays & Lists',
  });
  await ensureAssignment({
    collegeId: ids.collegeId,
    facultyId: ids.facultyDsId,
    courseId: dsId,
    moduleId: m1,
    sectionId: ids.sectionAId,
    yearId: ids.yearId,
    semesterId: ids.semester3Id,
    departmentId: ids.departmentId,
    title: 'DS Draft Assignment (hidden)',
    draft: true,
  });
  const quiz = await ensureQuiz({
    collegeId: ids.collegeId,
    facultyId: ids.facultyDsId,
    courseId: dsId,
    moduleId: m2,
    sectionId: ids.sectionAId,
    yearId: ids.yearId,
    semesterId: ids.semester3Id,
    departmentId: ids.departmentId,
    title: 'DS Quiz 1 — Stacks',
  });

  const announcement = await db('academic_class_announcements')
    .where({ academic_class_id: current.classId, title: 'Quiz 1 on Wednesday' })
    .first();
  if (!announcement) {
    await db('academic_class_announcements').insert({
      college_id: ids.collegeId,
      academic_class_id: current.classId,
      course_id: dsId,
      scope: 'SUBJECT',
      title: 'Quiz 1 on Wednesday',
      body: 'Data Structures Quiz 1 will be conducted on Wednesday during the first hour.',
      created_by: ids.facultyDsId,
      published_at: db.fn.now(),
    });
  }

  try {
    let cbsPlan = await db('faculty_cbs_plans')
      .where({ college_id: ids.collegeId, course_id: dsId, subject_name: 'Data Structures and Applications' })
      .first();
    if (!cbsPlan) {
      const [planId] = await db('faculty_cbs_plans').insert({
        college_id: ids.collegeId,
        course_id: dsId,
        course_code: '1BCS305',
        subject_name: 'Data Structures and Applications',
        academic_year_id: ids.yearId,
        semester_id: ids.semester3Id,
        department_id: ids.departmentId,
        program_id: ids.programId,
        scheme_id: ids.schemeId,
        status: 'ACTIVE',
        created_by: ids.facultyDsId,
      });
      cbsPlan = await db('faculty_cbs_plans').where({ id: planId }).first();
    }
    const cbsItem = await db('faculty_cbs_plan_items')
      .where({ plan_id: cbsPlan!.id, title: 'Introduction to Redis' })
      .first();
    if (!cbsItem) {
      await db('faculty_cbs_plan_items').insert({
        plan_id: cbsPlan!.id,
        cbs_id: 'CBS-E2E-DS-REDIS',
        serial_no: 1,
        title: 'Introduction to Redis',
        content_description: 'Used in modern distributed systems for caching.',
        expected_benefit: 'Connect syllabus data structures to industry practice.',
        resources: 'https://redis.io/docs/latest/',
        primary_co: 'CO3',
        status: 'PLANNED',
        is_custom: true,
        origin_type: 'INDUSTRY_REQUIREMENT',
      });
    }
  } catch (err) {
    console.warn('CBS seed skipped:', err instanceof Error ? err.message : err);
  }

  const paperId = 'QPB-E2E-DS-2024-SEE';
  let paper = await db('previous_year_papers').where({ college_id: ids.collegeId, paper_id: paperId }).first();
  if (!paper) {
    const [id] = await db('previous_year_papers').insert({
      college_id: ids.collegeId,
      paper_id: paperId,
      course_id: dsId,
      course_code: '1BCS305',
      subject_name: 'Data Structures and Applications',
      exam_type: 'SEE',
      exam_year: 2024,
      scheme_label: 'VTU 2022',
      semester_label: 'III',
      source_file: 'e2e-seed://data-structures-2024-see.pdf',
      source_type: 'SEED',
      is_active: true,
      verification_status: 'VERIFIED',
    });
    paper = await db('previous_year_papers').where({ id }).first();
  }

  let sheet = await db('assessment_mark_sheets')
    .where({ college_id: ids.collegeId, course_id: dsId, title: 'Internal Assessment 1 — Data Structures' })
    .first();
  if (!sheet) {
    const [sheetId] = await db('assessment_mark_sheets').insert({
      college_id: ids.collegeId,
      course_id: dsId,
      title: 'Internal Assessment 1 — Data Structures',
      source_kind: 'INTERNAL_PAPER',
      max_marks: 50,
      academic_year_id: ids.yearId,
      semester_id: ids.semester3Id,
      department_id: ids.departmentId,
      program_id: ids.programId,
      class_section_id: ids.sectionAId,
      created_by: ids.facultyDsId,
      status: 'FROZEN',
      frozen: true,
      frozen_at: db.fn.now(),
      frozen_by: ids.facultyDsId,
    });
    sheet = await db('assessment_mark_sheets').where({ id: sheetId }).first();
  }
  const sheetId = Number(sheet!.id);
  let iaQuestion = await db('assessment_mark_questions').where({ sheet_id: sheetId, question_key: 'E2E-IA1-Q1' }).first();
  if (!iaQuestion) {
    const [qId] = await db('assessment_mark_questions').insert({
      sheet_id: sheetId,
      question_key: 'E2E-IA1-Q1',
      question_number: 1,
      label: 'Q1',
      max_marks: 50,
      primary_co_code: 'CO1',
      sort_order: 1,
    });
    iaQuestion = await db('assessment_mark_questions').where({ id: qId }).first();
  }
  for (const studentId of [approved, approved2]) {
    const student = await db('students').where({ id: studentId }).first();
    let row = await db('assessment_student_rows').where({ sheet_id: sheetId, student_id: studentId }).first();
    if (!row) {
      const [rowId] = await db('assessment_student_rows').insert({
        sheet_id: sheetId,
        student_id: studentId,
        usn: student.usn,
        student_name: student.name,
        total_awarded: studentId === approved ? 42 : 30,
        status: 'SCORED',
      });
      row = await db('assessment_student_rows').where({ id: rowId }).first();
    }
    const mark = await db('assessment_student_question_marks')
      .where({ student_row_id: row!.id, question_id: iaQuestion!.id })
      .first();
    if (!mark) {
      await db('assessment_student_question_marks').insert({
        student_row_id: row!.id,
        question_id: iaQuestion!.id,
        awarded_marks: studentId === approved ? 42 : 30,
        status: 'SCORED',
      });
    }
  }

  if (await db.schema.hasTable('timetable_periods')) {
    const periodCount = await db('timetable_periods').where({ college_id: ids.collegeId }).count({ c: '*' }).first();
    if (!Number(periodCount?.c ?? 0)) {
      await db('timetable_periods').insert([
        { college_id: ids.collegeId, name: 'Period 1', period_number: 1, start_time: '09:00', end_time: '09:55', kind: 'PERIOD', sort_order: 1, is_active: true },
        { college_id: ids.collegeId, name: 'Period 2', period_number: 2, start_time: '09:55', end_time: '10:50', kind: 'PERIOD', sort_order: 2, is_active: true },
        { college_id: ids.collegeId, name: 'Break', period_number: null, start_time: '10:50', end_time: '11:05', kind: 'BREAK', sort_order: 3, is_active: true },
        { college_id: ids.collegeId, name: 'Period 3', period_number: 3, start_time: '11:05', end_time: '12:00', kind: 'PERIOD', sort_order: 4, is_active: true },
        { college_id: ids.collegeId, name: 'Period 4', period_number: 4, start_time: '12:00', end_time: '12:55', kind: 'PERIOD', sort_order: 5, is_active: true },
        { college_id: ids.collegeId, name: 'Lunch', period_number: null, start_time: '12:55', end_time: '13:45', kind: 'LUNCH', sort_order: 6, is_active: true },
        { college_id: ids.collegeId, name: 'Period 5', period_number: 5, start_time: '13:45', end_time: '14:40', kind: 'PERIOD', sort_order: 7, is_active: true },
        { college_id: ids.collegeId, name: 'Period 6', period_number: 6, start_time: '14:40', end_time: '15:35', kind: 'PERIOD', sort_order: 8, is_active: true },
        { college_id: ids.collegeId, name: 'Period 7', period_number: 7, start_time: '15:35', end_time: '16:30', kind: 'PERIOD', sort_order: 9, is_active: true },
      ]);
    }
    const periods = await db('timetable_periods').where({ college_id: ids.collegeId, kind: 'PERIOD' }).orderBy('period_number');
    const p1 = periods.find((p) => Number(p.period_number) === 1);
    const p2 = periods.find((p) => Number(p.period_number) === 2);
    const p3 = periods.find((p) => Number(p.period_number) === 3);

    if (await db.schema.hasTable('rooms')) {
      const room301 = await db('rooms').where({ college_id: ids.collegeId, code: 'R301' }).first();
      const lab2 = await db('rooms').where({ college_id: ids.collegeId, code: 'LAB2' }).first();
      const room301Id = room301
        ? Number(room301.id)
        : Number((await db('rooms').insert({ college_id: ids.collegeId, name: 'Room 301', code: 'R301', building: 'Main', floor: '3', type: 'CLASSROOM', status: 'ACTIVE' }))[0]);
      const lab2Id = lab2
        ? Number(lab2.id)
        : Number((await db('rooms').insert({ college_id: ids.collegeId, name: 'Lab 2', code: 'LAB2', building: 'Main', floor: '2', type: 'LAB', status: 'ACTIVE' }))[0]);

      let calendar = await db('academic_calendars').where({ college_id: ids.collegeId, academic_year_id: ids.yearId }).first();
      if (!calendar) {
        const [calId] = await db('academic_calendars').insert({
          college_id: ids.collegeId,
          academic_year_id: ids.yearId,
          name: 'E2E Odd Semester 2026-27',
          start_date: '2026-08-01',
          end_date: '2026-12-18',
          working_weekdays: '1,2,3,4,5,6',
          is_default: true,
        });
        calendar = await db('academic_calendars').where({ id: calId }).first();
      }

      const slotSpecs = [
        { subjectId: dsSubjectId, courseId: dsId, facultyId: ids.facultyDsId, period: p1, roomId: room301Id, time: ['09:00', '09:55'] },
        { subjectId: oopSubjectId, courseId: oopId, facultyId: ids.facultyOopId, period: p2, roomId: lab2Id, time: ['09:55', '10:50'] },
        { subjectId: mathSubjectId, courseId: mathId, facultyId: ids.facultyMathId, period: p3, roomId: room301Id, time: ['11:05', '12:00'] },
      ];
      for (const day of [1, 2, 3, 4, 5]) {
        for (const spec of slotSpecs) {
          if (!spec.period) continue;
          const existing = await db('timetable_slots')
            .where({
              academic_class_id: current.classId,
              class_subject_id: spec.subjectId,
              day_of_week: day,
              start_period_id: spec.period.id,
              status: 'ACTIVE',
            })
            .first();
          if (existing) continue;
          const [slotId] = await db('timetable_slots').insert({
            college_id: ids.collegeId,
            academic_class_id: current.classId,
            class_subject_id: spec.subjectId,
            course_id: spec.courseId,
            faculty_id: spec.facultyId,
            room_id: spec.roomId,
            start_period_id: spec.period.id,
            end_period_id: spec.period.id,
            start_period_number: spec.period.period_number,
            end_period_number: spec.period.period_number,
            day_of_week: day,
            start_time: spec.time[0],
            end_time: spec.time[1],
            effective_from: '2026-08-01',
            effective_to: null,
            status: 'ACTIVE',
            kind: 'REGULAR',
            created_by: ids.coordinatorId,
          });
          await db('timetable_slot_faculty').insert({
            slot_id: slotId,
            faculty_id: spec.facultyId,
            is_primary: true,
          });
        }
      }
    }
  }

  // Attendance sample session (requires migration)
  if (await db.schema.hasTable('attendance_sessions')) {
    const date = new Date().toISOString().slice(0, 10);
    let session = await db('attendance_sessions')
      .where({
        academic_class_id: current.classId,
        course_id: dsId,
        session_date: date,
        period_number: 1,
      })
      .first();
    if (!session) {
      const [sessionId] = await db('attendance_sessions').insert({
        college_id: ids.collegeId,
        academic_class_id: current.classId,
        course_id: dsId,
        faculty_id: ids.facultyDsId,
        academic_year_id: ids.yearId,
        semester_id: ids.semester3Id,
        session_date: date,
        period_number: 1,
        topic_id: topicArrays,
        topic_label: 'Arrays',
        status: 'COMPLETED',
        created_by: ids.facultyDsId,
        completed_at: db.fn.now(),
      });
      session = await db('attendance_sessions').where({ id: sessionId }).first();
      await db('attendance_records').insert([
        {
          attendance_session_id: sessionId,
          college_id: ids.collegeId,
          student_id: approved,
          status: 'PRESENT',
          marked_at: db.fn.now(),
          marked_by: ids.facultyDsId,
        },
        {
          attendance_session_id: sessionId,
          college_id: ids.collegeId,
          student_id: approved2,
          status: 'ABSENT',
          marked_at: db.fn.now(),
          marked_by: ids.facultyDsId,
        },
      ]);
    }

    const historyDate = '2026-01-20';
    let historySession = await db('attendance_sessions')
      .where({
        academic_class_id: history.classId,
        course_id: dsId,
        session_date: historyDate,
        period_number: 1,
      })
      .first();
    if (!historySession) {
      const [historySessionId] = await db('attendance_sessions').insert({
        college_id: ids.collegeId,
        academic_class_id: history.classId,
        course_id: dsId,
        faculty_id: ids.facultyDsId,
        academic_year_id: ids.yearId,
        semester_id: ids.semester2Id,
        session_date: historyDate,
        period_number: 1,
        topic_label: 'Semester 2 — Recap',
        status: 'COMPLETED',
        created_by: ids.facultyDsId,
        completed_at: db.fn.now(),
      });
      await db('attendance_records').insert({
        attendance_session_id: historySessionId,
        college_id: ids.collegeId,
        student_id: approved,
        status: 'PRESENT',
        marked_at: db.fn.now(),
        marked_by: ids.facultyDsId,
      });
    }
  }

  // Examination module E2E seed
  if (await db.schema.hasTable('examinations')) {
    const examCode = 'SX-E2E-SEE-2026';
    let exam = await db('examinations').where({ college_id: ids.collegeId, code: examCode }).first();
    if (!exam) {
      let policyId: number | null = null;
      if (await db.schema.hasTable('exam_policies')) {
        const policy = await db('exam_policies').where({ college_id: ids.collegeId, name: 'E2E Default Policy' }).first();
        if (policy) {
          policyId = Number(policy.id);
        } else {
          const [pid] = await db('exam_policies').insert({
            college_id: ids.collegeId,
            scheme_id: ids.schemeId,
            program_id: ids.programId,
            name: 'E2E Default Policy',
            minimum_attendance_pct: 85,
            cie_maximum: 50,
            see_maximum: 50,
            pass_percentage: 40,
            internal_aggregation: 'WEIGHTED_SUM',
            cie_components: JSON.stringify([
              { kind: 'IA', label: 'IA1', weight: 25, aggregation: 'SUM' },
              { kind: 'IA', label: 'IA2', weight: 25, aggregation: 'SUM' },
              { kind: 'ASSIGNMENT', label: 'Assignment', weight: 10, aggregation: 'SUM' },
              { kind: 'QUIZ', label: 'Quiz', weight: 10, aggregation: 'SUM' },
            ]),
            grade_bands: JSON.stringify([
              { min: 90, max: 100, grade: 'O', gradePoints: 10 },
              { min: 80, max: 89.99, grade: 'A+', gradePoints: 9 },
              { min: 70, max: 79.99, grade: 'A', gradePoints: 8 },
              { min: 60, max: 69.99, grade: 'B+', gradePoints: 7 },
              { min: 50, max: 59.99, grade: 'C', gradePoints: 5 },
              { min: 40, max: 49.99, grade: 'P', gradePoints: 4 },
              { min: 0, max: 39.99, grade: 'F', gradePoints: 0 },
            ]),
          });
          policyId = Number(pid);
        }
      }
      const [examId] = await db('examinations').insert({
        college_id: ids.collegeId,
        academic_year_id: ids.yearId,
        program_id: ids.programId,
        semester_id: ids.semester3Id,
        scheme_id: ids.schemeId,
        exam_policy_id: policyId,
        exam_type: 'SEE',
        name: 'Semester III End Examination',
        code: examCode,
        start_date: '2026-09-14',
        end_date: '2026-09-18',
        status: 'SCHEDULED',
        created_by: ids.coordinatorId,
      });
      exam = await db('examinations').where({ id: examId }).first();
    }

    const dsExamSubject = await db('examination_subjects')
      .where({ exam_id: exam.id, course_id: dsId, academic_class_id: current.classId })
      .first();
    let dsExamSubjectId: number;
    if (!dsExamSubject) {
      const [sid] = await db('examination_subjects').insert({
        college_id: ids.collegeId,
        exam_id: exam.id,
        course_id: dsId,
        academic_class_id: current.classId,
        maximum_marks: 50,
        minimum_pass_marks: 20,
        duration_minutes: 180,
        exam_date: '2026-09-14',
        start_time: '10:00:00',
        end_time: '13:00:00',
        status: 'SCHEDULED',
      });
      dsExamSubjectId = Number(sid);
      await db('exam_marks_sheets').insert({
        college_id: ids.collegeId,
        exam_subject_id: dsExamSubjectId,
        faculty_id: ids.facultyDsId,
        status: 'DRAFT',
      });
    } else {
      dsExamSubjectId = Number(dsExamSubject.id);
    }

    // Low attendance student for eligibility E2E
    let lowAttStudent = await db('students').where({ college_id: ids.collegeId, usn: 'SX-E2E-LOW-ATT' }).first();
    if (!lowAttStudent) {
      const hash = await bcrypt.hash(studentE2ePassword(), 10);
      const [lowId] = await db('students').insert({
        college_id: ids.collegeId,
        department_id: ids.departmentId,
        program_id: ids.programId,
        scheme_id: ids.schemeId,
        academic_year_id: ids.yearId,
        semester_id: ids.semester3Id,
        class_section_id: ids.sectionAId,
        usn: 'SX-E2E-LOW-ATT',
        name: 'E2E Low Attendance',
        email: 'e2e.lowatt@student.skillonx.test',
        password_hash: hash,
        is_active: true,
        profile_completed_at: db.fn.now(),
      });
      lowAttStudent = await db('students').where({ id: lowId }).first();
      await db('academic_class_enrollments').insert({
        college_id: ids.collegeId,
        academic_class_id: current.classId,
        student_id: lowId,
        status: 'APPROVED',
      });
    }

    if (await db.schema.hasTable('rooms')) {
      const room301 = await db('rooms').where({ college_id: ids.collegeId, code: 'R301' }).first();
      const room302 = await db('rooms').where({ college_id: ids.collegeId, code: 'R302' }).first();
      const room301Id = room301
        ? Number(room301.id)
        : Number((await db('rooms').insert({ college_id: ids.collegeId, name: 'Room 301', code: 'R301', building: 'Main', floor: '3', type: 'CLASSROOM', capacity: 30, exam_seating_capacity: 30, status: 'ACTIVE' }))[0]);
      const room302Id = room302
        ? Number(room302.id)
        : Number((await db('rooms').insert({ college_id: ids.collegeId, name: 'Room 302', code: 'R302', building: 'Main', floor: '3', type: 'CLASSROOM', capacity: 32, exam_seating_capacity: 32, status: 'ACTIVE' }))[0]);

      const allocCount = await db('exam_room_allocations').where({ exam_subject_id: dsExamSubjectId }).count({ c: '*' }).first();
      if (!Number(allocCount?.c ?? 0)) {
        await db('exam_room_allocations').insert([
          { college_id: ids.collegeId, exam_subject_id: dsExamSubjectId, room_id: room301Id, capacity: 30, assigned_count: 0 },
          { college_id: ids.collegeId, exam_subject_id: dsExamSubjectId, room_id: room302Id, capacity: 32, assigned_count: 0 },
        ]);
      }
    }

    // Compute eligibility via direct insert for deterministic E2E
    const enrollments = await db('academic_class_enrollments')
      .where({ academic_class_id: current.classId, status: 'APPROVED' })
      .select('student_id');
    for (const e of enrollments) {
      const sid = Number(e.student_id);
      const isLow = sid === Number(lowAttStudent?.id);
      const existing = await db('exam_eligibility')
        .where({ exam_subject_id: dsExamSubjectId, student_id: sid })
        .first();
      if (existing) continue;
      await db('exam_eligibility').insert({
        college_id: ids.collegeId,
        exam_id: exam.id,
        exam_subject_id: dsExamSubjectId,
        student_id: sid,
        course_id: dsId,
        status: isLow ? 'NOT_ELIGIBLE' : 'ELIGIBLE',
        reason_code: isLow ? 'ATTENDANCE_SHORTAGE' : null,
        reason_detail: isLow ? 'Attendance 74% — required 85%' : null,
        attendance_pct: isLow ? 74 : 90,
        internal_marks: sid === approved ? 44 : 30,
        internal_max: 50,
      });
    }

    // Backlog supplementary exam subject
    if (await db.schema.hasTable('backlog_subject_registrations')) {
      const backlogStudent = await db('students').where({ usn: '4VV24CS001' }).first();
      if (backlogStudent) {
        const backlog = await db('backlog_subject_registrations')
          .where({ student_id: backlogStudent.id, course_id: dsId, status: 'ACTIVE' })
          .first();
        if (!backlog) {
          await db('backlog_subject_registrations').insert({
            college_id: ids.collegeId,
            student_id: backlogStudent.id,
            course_id: dsId,
            origin_semester_id: ids.semester2Id,
            status: 'ACTIVE',
          });
        }
      }
    }
  }

  // ── Student Academic Services E2E data ─────────────────────────────
  if (await db.schema.hasTable('student_service_requests')) {
    const { ensureCollegeServicesDefaults } = await import('../modules/studentServices/defaults.js');
    const { createRequest, submitRequest, staffActionOnRequest } = await import('../modules/studentServices/requestEngine.js');
    const { generateCertificateForRequest } = await import('../modules/studentServices/certificates.js');
    const { createGrievance, assignGrievance, resolveGrievance } = await import('../modules/studentServices/grievances.js');
    const { assignMentor, requestMeeting, scheduleMeeting, completeMeeting } = await import('../modules/studentServices/mentoring.js');
    const { generateAcademicAlerts } = await import('../modules/studentServices/alerts.js');

    await ensureCollegeServicesDefaults(ids.collegeId);

    const approvedStudent = await db('students').where({ usn: '4VV24CS001' }).first();
    const admin = await db('faculty_users').where({ college_id: ids.collegeId, role: 'COLLEGE_ADMIN' }).first();
    const coordinator = await db('faculty_users').where({ id: ids.coordinatorId }).first();

    if (approvedStudent && admin) {
      const studentActor = { studentId: Number(approvedStudent.id), collegeId: ids.collegeId };
      const adminActor = {
        facultyUserId: Number(admin.id),
        collegeId: ids.collegeId,
        departmentId: admin.department_id,
        role: admin.role,
        name: admin.name,
      };

      // Bonafide request (approved + certificate)
      let bonafideReq = await db('student_service_requests')
        .where({ student_id: approvedStudent.id, title: 'E2E Bonafide Certificate' })
        .first();
      if (!bonafideReq) {
        const created = await createRequest(studentActor, {
          requestTypeCode: 'BONAFIDE_CERTIFICATE',
          title: 'E2E Bonafide Certificate',
          formData: { purpose: 'Internship', organization: 'E2E Corp' },
        });
        await submitRequest(studentActor, created.id);
        bonafideReq = await db('student_service_requests').where({ id: created.id }).first();
        // Fast-track through workflow for E2E
        let req = await staffActionOnRequest(adminActor, created.id, { action: 'APPROVE', remarks: 'E2E seed approved' });
        while (req.status === 'UNDER_REVIEW') {
          req = await staffActionOnRequest(adminActor, created.id, { action: 'APPROVE', remarks: 'E2E seed approved' });
        }
        if (req.status === 'APPROVED') {
          await generateCertificateForRequest(ids.collegeId, created.id, Number(admin.id));
        }
      }

      // Grievance
      const existingGrievance = await db('student_grievances')
        .where({ student_id: approvedStudent.id, subject: 'E2E Academic Grievance' })
        .first();
      if (!existingGrievance) {
        const g = await createGrievance(studentActor, {
          category: 'ACADEMIC',
          subject: 'E2E Academic Grievance',
          description: 'Seeded grievance for E2E testing',
        });
        await assignGrievance(adminActor, g.id, Number(admin.id));
        await resolveGrievance(adminActor, g.id, 'Resolved during E2E seed');
      }

      // Mentor assignment + meeting
      if (coordinator) {
        const existingMentor = await db('mentor_assignments')
          .where({ student_id: approvedStudent.id, status: 'ACTIVE' })
          .first();
        if (!existingMentor) {
          await assignMentor(adminActor, Number(approvedStudent.id), Number(coordinator.id));
        }
        const existingMeeting = await db('mentor_meetings')
          .where({ student_id: approvedStudent.id, agenda: 'E2E mentor meeting' })
          .first();
        if (!existingMeeting) {
          const meeting = await requestMeeting(studentActor, {
            agenda: 'E2E mentor meeting',
            meetingType: 'ACADEMIC',
          });
          const mentorActor = {
            facultyUserId: Number(coordinator.id),
            collegeId: ids.collegeId,
            role: 'FACULTY',
          };
          await scheduleMeeting(mentorActor, meeting.meeting.id, {
            scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          });
          await completeMeeting(mentorActor, meeting.meeting.id, {
            studentVisibleNotes: 'E2E: Discussed semester goals',
            privateNotes: 'E2E internal note — not visible to student',
          });
        }
      }

      await generateAcademicAlerts(ids.collegeId, Number(approvedStudent.id));
    }
  }

  // ── Mentoring & Student Advisory E2E data ──────────────────────────
  if (await db.schema.hasTable('mentoring_actions')) {
    const { assignMentor } = await import('../modules/mentoring/allocation.js');
    const { createSession, createAction, updateAction } = await import('../modules/mentoring/sessions.js');
    const { createEscalation } = await import('../modules/mentoring/escalations.js');
    const { leadershipContext } = await import('../modules/mentoring/permissions.js');

    const coordinator = await db('faculty_users').where({ id: ids.coordinatorId }).first();
    const admin = await db('faculty_users').where({ college_id: ids.collegeId, role: 'COLLEGE_ADMIN' }).first();
    const backlogStudent = await db('students').where({ usn: '4VV24CS001', college_id: ids.collegeId }).first();
    const lowAttStudent = await db('students').where({ usn: 'SX-E2E-LOW-ATT', college_id: ids.collegeId }).first();

    if (coordinator && admin) {
      const adminActor = {
        facultyUserId: Number(admin.id),
        collegeId: ids.collegeId,
        departmentId: admin.department_id,
        role: admin.role,
        name: admin.name,
      };
      const mentorActor = {
        facultyUserId: Number(coordinator.id),
        collegeId: ids.collegeId,
        departmentId: coordinator.department_id,
        role: 'FACULTY',
        name: coordinator.name,
      };
      const adminCtx = await leadershipContext(adminActor);

      // Deterministically ensure the QA CSE HOD's leadership scope covers the
      // E2E mentoring student's department, so HOD oversight of mentoring
      // escalations is testable regardless of accumulated shared leadership-seed
      // drift (the QA leadership seed historically pinned the CSE HOD to the
      // lowest-id department, which is not always the CSE department). This is
      // additive: any other HOD department assignments are left untouched, and
      // the read model (leadershipContext) aggregates all HOD departments.
      if (backlogStudent?.department_id != null) {
        const qaHod = await db('faculty_users')
          .where({ college_id: ids.collegeId, email: 'qa.hod.cse@vviet.edu.in' })
          .first();
        const qaHodEmp = qaHod
          ? await db('employees').where({ faculty_user_id: qaHod.id }).first()
          : null;
        if (qaHodEmp) {
          const deptId = Number(backlogStudent.department_id);
          // The platform enforces exactly one active HOD per department (HR leave
          // approver, academic leadership). End any OTHER active HOD assignment on
          // this department (accumulated QA/perf-test drift squatting on the QA
          // CSE department) so the deterministic QA CSE HOD becomes the sole HOD.
          const yesterdayIso = (() => {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          })();
          await db('academic_leadership_assignments')
            .where({
              college_id: ids.collegeId,
              leadership_role: 'HOD',
              department_id: deptId,
              status: 'ACTIVE',
            })
            .whereNot('employee_id', qaHodEmp.id)
            .update({ status: 'ENDED', effective_to: yesterdayIso, remarks: 'Ended by E2E: deterministic single QA CSE HOD', updated_at: db.fn.now() });
          const covers = await db('academic_leadership_assignments')
            .where({
              college_id: ids.collegeId,
              employee_id: qaHodEmp.id,
              leadership_role: 'HOD',
              department_id: deptId,
              status: 'ACTIVE',
            })
            .first();
          if (!covers) {
            await db('academic_leadership_assignments').insert({
              college_id: ids.collegeId,
              employee_id: qaHodEmp.id,
              leadership_role: 'HOD',
              department_id: deptId,
              effective_from: '2026-01-01',
              status: 'ACTIVE',
              remarks: 'E2E: QA CSE HOD scoped to mentoring E2E student department (deterministic).',
            });
          }
        }
      }

      // Assign both a backlog student and a low-attendance student to the mentor.
      for (const st of [backlogStudent, lowAttStudent]) {
        if (!st) continue;
        const existing = await db('mentor_assignments')
          .where({ student_id: st.id, college_id: ids.collegeId, status: 'ACTIVE', is_primary: true })
          .first();
        if (!existing) {
          await assignMentor(adminActor, adminCtx, Number(st.id), Number(coordinator.id));
        }
      }

      if (backlogStudent) {
        // A completed session with an overdue follow-up.
        const hasSession = await db('mentor_meetings')
          .where({ student_id: backlogStudent.id, agenda: 'E2E advisory session — academic review' })
          .first();
        if (!hasSession) {
          const overdue = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
          await createSession(mentorActor, {
            studentId: Number(backlogStudent.id),
            meetingType: 'IN_PERSON',
            sessionCategory: 'ACADEMIC_PERFORMANCE',
            agenda: 'E2E advisory session — academic review',
            observations: 'Reviewed backlog subjects and study plan.',
            studentVisibleNotes: 'Focus on clearing pending backlog this cycle.',
            privateNotes: 'E2E confidential — internal mentor note, not student-visible.',
            visibility: 'CONFIDENTIAL',
            followUpDate: overdue,
            status: 'COMPLETED',
          });
        }

        // Action items: one open (student-owned) and one completed.
        const hasAction = await db('mentoring_actions')
          .where({ student_id: backlogStudent.id, title: 'E2E: Submit backlog preparation plan' })
          .first();
        if (!hasAction) {
          await createAction(mentorActor, {
            studentId: Number(backlogStudent.id),
            title: 'E2E: Submit backlog preparation plan',
            description: 'Draft a week-by-week study plan for pending subjects.',
            owner: 'STUDENT',
            priority: 'HIGH',
            dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          });
          const done = await createAction(mentorActor, {
            studentId: Number(backlogStudent.id),
            title: 'E2E: Share previous question papers',
            owner: 'MENTOR',
          });
          await updateAction(mentorActor, done.id, { status: 'COMPLETED', outcome: 'Shared with student.' });
        }

        // An escalation to HOD for persistent academic risk.
        const hasEsc = await db('mentoring_escalations')
          .where({ student_id: backlogStudent.id, reason_code: 'PERSISTENT_ACADEMIC_RISK' })
          .first();
        if (!hasEsc) {
          await createEscalation(mentorActor, {
            studentId: Number(backlogStudent.id),
            reasonCode: 'PERSISTENT_ACADEMIC_RISK',
            reason: 'E2E: Repeated backlogs despite mentoring; requesting department support.',
            targetLevel: 'HOD',
          });
        }
      }
    }
  }

  // ── Finance module E2E data ────────────────────────────────────────
  if (await db.schema.hasTable('fee_structures')) {
    const { ensureCollegeFinanceDefaults } = await import('../modules/finance/defaults.js');
    const { createFeeStructure, activateFeeStructure, bulkAssignFeeStructure } = await import('../modules/finance/feeStructures.js');
    const { bulkGenerateDemands } = await import('../modules/finance/demands.js');
    const { recordManualPayment } = await import('../modules/finance/payments.js');

    await ensureCollegeFinanceDefaults(ids.collegeId);

    const financePasswordHash = await bcrypt.hash(studentE2ePassword(), 10);
    let accountant = await db('faculty_users')
      .where({ college_id: ids.collegeId, email: 'qa.student-lms.accountant@example.edu' })
      .first();
    if (!accountant) {
      const [accountantId] = await db('faculty_users').insert({
        college_id: ids.collegeId,
        department_id: ids.departmentId,
        email: 'qa.student-lms.accountant@example.edu',
        name: 'QA Student LMS Accountant',
        role: 'ACCOUNTANT',
        password_hash: financePasswordHash,
        is_active: true,
        employee_id: 'QA-STUDENT-LMS-ACCOUNTANT',
      });
      accountant = await db('faculty_users').where({ id: accountantId }).first();
    } else {
      await db('faculty_users').where({ id: accountant.id }).update({
        role: 'ACCOUNTANT',
        password_hash: financePasswordHash,
        is_active: true,
        updated_at: db.fn.now(),
      });
      accountant = await db('faculty_users').where({ id: accountant.id }).first();
    }
    const approvedStudent = await db('students').where({ usn: '4VV24CS001' }).first();
    if (accountant && approvedStudent) {
      const financeActor = {
        facultyUserId: Number(accountant.id),
        collegeId: ids.collegeId,
        departmentId: accountant.department_id,
        role: accountant.role,
        name: accountant.name,
      };

      const feeHeads = await db('fee_heads').where({ college_id: ids.collegeId }).select('id', 'code');
      const headMap = Object.fromEntries(feeHeads.map((h) => [h.code, Number(h.id)]));

      let structure = await db('fee_structures').where({ college_id: ids.collegeId, code: 'SX-E2E-CSE-S3-2026' }).first();
      if (!structure) {
        const created = await createFeeStructure(financeActor, {
          academicYearId: ids.yearId,
          programId: ids.programId,
          semesterId: ids.semester3Id,
          schemeId: ids.schemeId,
          name: 'CSE Semester 3 Fee — E2E',
          code: 'SX-E2E-CSE-S3-2026',
          description: 'E2E semester fee structure',
          items: [
            { feeHeadId: headMap.TUITION, amount: 50000 },
            { feeHeadId: headMap.UNIVERSITY_FEE, amount: 4500 },
            { feeHeadId: headMap.LAB_FEE, amount: 3000 },
          ].filter((i) => i.feeHeadId),
          installments: [
            { installmentNumber: 1, label: 'Installment 1', amount: 30000, dueDate: '2026-08-10' },
            { installmentNumber: 2, label: 'Installment 2', amount: 27500, dueDate: '2026-10-10' },
          ],
        });
        await activateFeeStructure(financeActor, created.id);
        structure = await db('fee_structures').where({ id: created.id }).first();
      } else if (structure.status === 'DRAFT') {
        await activateFeeStructure(financeActor, Number(structure.id));
      }

      if (structure) {
        await bulkAssignFeeStructure(financeActor, {
          feeStructureId: Number(structure.id),
          academicYearId: ids.yearId,
          semesterId: ids.semester3Id,
          academicClassId: current.classId,
        });

        await bulkGenerateDemands(financeActor, {
          feeStructureId: Number(structure.id),
          academicYearId: ids.yearId,
          semesterId: ids.semester3Id,
          academicClassId: current.classId,
          dueDate: '2026-10-10',
        });

        // Idempotent — second run should skip
        await bulkGenerateDemands(financeActor, {
          feeStructureId: Number(structure.id),
          academicYearId: ids.yearId,
          semesterId: ids.semester3Id,
          academicClassId: current.classId,
        });

        const existingPayment = await db('student_payments')
          .where({ college_id: ids.collegeId, student_id: approvedStudent.id, status: 'SUCCESS' })
          .where('amount', 40000)
          .first();

        if (!existingPayment) {
          await recordManualPayment(financeActor, {
            studentId: Number(approvedStudent.id),
            amount: 40000,
            paymentDate: '2026-08-15',
            paymentMethod: 'UPI',
            transactionReference: 'E2E-UPI-40000',
            remarks: 'E2E partial payment',
          });
        }
      }
    }
  }

  // ── Library circulation E2E seed ─────────────────────────────────────
  if (await db.schema.hasTable('library_catalog_items')) {
    const { ensureCollegeLibraryDefaults } = await import('../modules/library/defaults.js');
    await ensureCollegeLibraryDefaults(ids.collegeId);

    const approvedStudent = await db('students').where({ usn: '4VV24CS001' }).first();
    const admin = await db('faculty_users').where({ college_id: ids.collegeId, role: 'COLLEGE_ADMIN' }).first();

    if (approvedStudent && admin) {
      // Membership
      let member = await db('library_members')
        .where({ student_id: approvedStudent.id, college_id: ids.collegeId })
        .first();
      if (!member) {
        const [memberId] = await db('library_members').insert({
          college_id: ids.collegeId,
          member_type: 'STUDENT',
          student_id: approvedStudent.id,
          faculty_id: null,
          membership_number: approvedStudent.usn,
          card_token: 'e2e-lib-card-4vv24cs001',
          status: 'ACTIVE',
          joined_at: new Date(),
        });
        member = await db('library_members').where({ id: memberId }).first();
      }

      const catalogTitles = [
        {
          title: 'Data Structures Using C',
          isbn: '978-9353161276',
          authors: 'Reema Thareja',
          publisher: 'Oxford University Press',
          edition: '2nd',
          publication_year: 2019,
          subjects: 'Computer Science, Data Structures',
          call_number: '005.73 THA',
          default_location: 'Main Library — CS Section',
        },
        {
          title: 'Operating Systems',
          isbn: '978-9332579039',
          authors: 'Galvin, Gagne, Silberschatz',
          publisher: 'Wiley',
          edition: '9th',
          publication_year: 2018,
          subjects: 'Computer Science, Operating Systems',
          call_number: '005.43 SIL',
          default_location: 'Main Library — CS Section',
        },
        {
          title: 'Design and Analysis of Algorithms',
          isbn: '978-8120340077',
          authors: 'S. K. Basu',
          publisher: 'PHI Learning',
          edition: '1st',
          publication_year: 2015,
          subjects: 'Computer Science, Algorithms',
          call_number: '005.1 BAS',
          default_location: 'Main Library — CS Section',
        },
      ];

      const catalogIds: number[] = [];
      for (const cat of catalogTitles) {
        let item = await db('library_catalog_items')
          .where({ college_id: ids.collegeId, title: cat.title })
          .first();
        if (!item) {
          const [id] = await db('library_catalog_items').insert({
            college_id: ids.collegeId,
            ...cat,
            status: 'ACTIVE',
          });
          catalogIds.push(Number(id));
        } else {
          catalogIds.push(Number(item.id));
        }
      }

      // Physical copies — 8 for Data Structures, 3 for OS, 2 for Algorithms
      const copySpecs = [
        { catalogIdx: 0, count: 8, prefix: 'VVIET-LIB-DS' },
        { catalogIdx: 1, count: 3, prefix: 'VVIET-LIB-OS' },
        { catalogIdx: 2, count: 2, prefix: 'VVIET-LIB-ALG' },
      ];

      for (const spec of copySpecs) {
        const catalogId = catalogIds[spec.catalogIdx];
        for (let i = 1; i <= spec.count; i++) {
          const accession = `${spec.prefix}-${String(i).padStart(6, '0')}`;
          const existing = await db('library_copies')
            .where({ college_id: ids.collegeId, accession_number: accession })
            .first();
          if (!existing) {
            await db('library_copies').insert({
              college_id: ids.collegeId,
              catalog_item_id: catalogId,
              accession_number: accession,
              barcode: accession,
              location: 'Main Library',
              shelf: `CS-${spec.catalogIdx + 1}`,
              status: 'AVAILABLE',
            });
          }
        }
      }

      // Active loan on Operating Systems copy 1
      const osCopy = await db('library_copies')
        .where({ college_id: ids.collegeId, accession_number: 'VVIET-LIB-OS-000001' })
        .first();
      if (osCopy && osCopy.status === 'AVAILABLE') {
        const dueAt = new Date();
        dueAt.setDate(dueAt.getDate() + 14);
        await db('library_copies').where({ id: osCopy.id }).update({ status: 'ISSUED' });
        await db('library_loans').insert({
          college_id: ids.collegeId,
          member_id: member!.id,
          copy_id: osCopy.id,
          catalog_item_id: osCopy.catalog_item_id,
          issued_at: new Date(),
          due_at: dueAt,
          renewal_count: 0,
          status: 'ACTIVE',
          issued_by: admin.id,
        });
      }

      // Previous returned loan
      const dsCopy2 = await db('library_copies')
        .where({ college_id: ids.collegeId, accession_number: 'VVIET-LIB-DS-000002' })
        .first();
      if (dsCopy2) {
        const existingLoan = await db('library_loans')
          .where({ copy_id: dsCopy2.id, member_id: member!.id, status: 'RETURNED' })
          .first();
        if (!existingLoan) {
          const issued = new Date();
          issued.setDate(issued.getDate() - 30);
          const returned = new Date();
          returned.setDate(returned.getDate() - 16);
          const due = new Date();
          due.setDate(due.getDate() - 18);
          await db('library_loans').insert({
            college_id: ids.collegeId,
            member_id: member!.id,
            copy_id: dsCopy2.id,
            catalog_item_id: dsCopy2.catalog_item_id,
            issued_at: issued,
            due_at: due,
            returned_at: returned,
            renewal_count: 0,
            status: 'RETURNED',
            issued_by: admin.id,
            returned_by: admin.id,
          });
        }
      }

      // Reservation on fully issued title (reserve DS when no copies available)
      const dsAvailable = await db('library_copies')
        .where({ catalog_item_id: catalogIds[0], college_id: ids.collegeId, status: 'AVAILABLE' })
        .count({ c: '*' })
        .first();
      if (Number(dsAvailable?.c ?? 0) > 0) {
        const existingRes = await db('library_reservations')
          .where({ member_id: member!.id, catalog_item_id: catalogIds[0], status: 'ACTIVE' })
          .first();
        if (!existingRes) {
          await db('library_reservations').insert({
            college_id: ids.collegeId,
            member_id: member!.id,
            catalog_item_id: catalogIds[0],
            status: 'ACTIVE',
            queue_position: 1,
            requested_at: new Date(),
          });
        }
      }

      // Fine of ₹100
      const existingFine = await db('library_fines')
        .where({ member_id: member!.id, college_id: ids.collegeId, fine_type: 'OVERDUE' })
        .first();
      if (!existingFine) {
        const returnedLoan = await db('library_loans')
          .where({ member_id: member!.id, status: 'RETURNED' })
          .first();
        await db('library_fines').insert({
          college_id: ids.collegeId,
          member_id: member!.id,
          loan_id: returnedLoan?.id ?? null,
          fine_type: 'OVERDUE',
          amount: '100.00',
          waived_amount: '0.00',
          paid_amount: '0.00',
          outstanding_amount: '100.00',
          status: 'DUE',
          remarks: 'E2E overdue fine',
        });
      }
    }
  }

  // ── TPMS / Placement E2E seed ───────────────────────────────────────────
  if (await db.schema.hasTable('placement_seasons')) {
    const { ensureCollegePlacementDefaults } = await import('../modules/placement/careerProfile.js');
    const { getOrCreateCareerProfile, registerForPlacement, refreshProfileCompletion } = await import('../modules/placement/careerProfile.js');
    const { createCompany, createOpportunity, publishOpportunity, createOffer, createRound, updateRoundParticipant } = await import('../modules/placement/companies.js');
    const { applyToOpportunity, updateApplicationStatus } = await import('../modules/placement/applications.js');
    const { upsertPriorEducation, addStudentSkill, addStudentProject, createResumeVersion } = await import('../modules/placement/resume.js');
    const { createTrainingProgram, enrollStudents } = await import('../modules/placement/training.js');

    await ensureCollegePlacementDefaults(ids.collegeId);

    let season = await db('placement_seasons')
      .where({ college_id: ids.collegeId, name: '2026–27 Campus Placements' })
      .first();
    if (!season) {
      const [seasonId] = await db('placement_seasons').insert({
        college_id: ids.collegeId,
        academic_year_id: ids.yearId,
        name: '2026–27 Campus Placements',
        start_date: '2026-08-01',
        end_date: '2027-05-31',
        graduating_batch_year: 2027,
        status: 'ACTIVE',
      });
      season = await db('placement_seasons').where({ id: seasonId }).first();
    }

    const admin = await db('faculty_users').where({ college_id: ids.collegeId, role: 'COLLEGE_ADMIN' }).first();
    const aarav = await db('students').where({ usn: '4VV24CS001' }).first();
    const ineligible = await db('students').where({ usn: '4VV24CS002' }).first();

    if (admin && aarav && season) {
      const actor = {
        facultyUserId: Number(admin.id),
        collegeId: ids.collegeId,
        departmentId: admin.department_id,
        role: admin.role,
        name: admin.name,
      };

      await getOrCreateCareerProfile(Number(aarav.id), ids.collegeId);
      await upsertPriorEducation(Number(aarav.id), ids.collegeId, {
        qualificationType: 'SSLC_10TH',
        institution: 'Demo High School',
        percentage: 85,
        yearOfCompletion: 2020,
      });
      await upsertPriorEducation(Number(aarav.id), ids.collegeId, {
        qualificationType: 'PUC_12TH',
        institution: 'Demo PU College',
        percentage: 78,
        yearOfCompletion: 2022,
      });
      await addStudentSkill(Number(aarav.id), ids.collegeId, { skillName: 'Python', level: 'ADVANCED' });
      await addStudentSkill(Number(aarav.id), ids.collegeId, { skillName: 'SQL', level: 'INTERMEDIATE' });
      await addStudentProject(Number(aarav.id), ids.collegeId, {
        title: 'Campus Placement Tracker',
        projectType: 'PERSONAL',
        technologies: ['React', 'Node.js'],
      });
      await createResumeVersion(Number(aarav.id), ids.collegeId, {
        name: 'Software Resume',
        isDefault: true,
        careerObjective: 'Seeking a software engineering role.',
      });
      await refreshProfileCompletion(Number(aarav.id), ids.collegeId);

      await registerForPlacement(Number(aarav.id), ids.collegeId, {
        placementSeasonId: Number(season.id),
        dataConsentGiven: true,
        consentVersion: 'v1',
      });

      if (await db.schema.hasTable('student_academic_records')) {
        for (const semId of [ids.semester2Id, ids.semester3Id]) {
          const existing = await db('student_academic_records')
            .where({ student_id: aarav.id, semester_id: semId, academic_year_id: ids.yearId })
            .first();
          if (!existing) {
            await db('student_academic_records').insert({
              college_id: ids.collegeId,
              student_id: aarav.id,
              semester_id: semId,
              academic_year_id: ids.yearId,
              sgpa: 8.2,
              credits_earned: 22,
              status: 'COMPLETED',
            });
          } else {
            await db('student_academic_records').where({ id: existing.id }).update({
              sgpa: 8.2,
              credits_earned: 22,
              status: 'COMPLETED',
              updated_at: db.fn.now(),
            });
          }
        }
      }

      if (await db.schema.hasTable('backlog_subject_registrations')) {
        await db('backlog_subject_registrations')
          .where({ student_id: aarav.id, status: 'ACTIVE' })
          .update({ status: 'CLEARED', updated_at: db.fn.now() });
      }

      await refreshProfileCompletion(Number(aarav.id), ids.collegeId);

      let company = await db('placement_companies')
        .where({ college_id: ids.collegeId, name: 'SkillonX Technologies' })
        .first();
      if (!company) {
        company = await createCompany(actor, {
          name: 'SkillonX Technologies',
          industry: 'Software',
          companyType: 'PRODUCT',
          website: 'https://skillonx.example',
        });
      }

      let company2 = await db('placement_companies')
        .where({ college_id: ids.collegeId, name: 'Infosys' })
        .first();
      if (!company2) {
        company2 = await createCompany(actor, {
          name: 'Infosys',
          industry: 'IT Services',
          companyType: 'SERVICE',
        });
      }

      let opp = await db('placement_opportunities')
        .where({ college_id: ids.collegeId, company_id: company.id, title: 'Campus Drive 2026' })
        .first();
      if (!opp) {
        opp = await createOpportunity(actor, {
          companyId: Number(company.id),
          placementSeasonId: Number(season.id),
          title: 'Campus Drive 2026',
          role: 'Graduate Software Engineer',
          description: 'Full-time software engineering role.',
          ctcMin: 8,
          ctcMax: 10,
          locations: [{ city: 'Bengaluru' }, { city: 'Mysuru' }],
          eligibilityRules: [
            { ruleType: 'MIN_CGPA', operator: 'GTE', value: '7.0' },
            { ruleType: 'PROGRAM', operator: 'EQ', value: 'CSE,ISE' },
            { ruleType: 'MAX_ACTIVE_BACKLOGS', operator: 'LTE', value: '0' },
          ],
        });
        await publishOpportunity(actor, Number(opp.id));
      }

      let internshipOpp = await db('placement_opportunities')
        .where({ college_id: ids.collegeId, company_id: company2.id, opportunity_type: 'INTERNSHIP' })
        .first();
      if (!internshipOpp) {
        internshipOpp = await createOpportunity(actor, {
          companyId: Number(company2.id),
          placementSeasonId: Number(season.id),
          opportunityType: 'INTERNSHIP',
          title: 'Summer Internship 2026',
          role: 'Intern — Developer',
          stipend: 25000,
          eligibilityRules: [{ ruleType: 'MIN_CGPA', operator: 'GTE', value: '6.0' }],
        });
        await publishOpportunity(actor, Number(internshipOpp.id));
      }

      const existingApp = await db('placement_applications')
        .where({ student_id: aarav.id, opportunity_id: opp.id })
        .first();
      if (!existingApp) {
        await applyToOpportunity(Number(aarav.id), ids.collegeId, Number(opp.id));
      }
      const app = await db('placement_applications')
        .where({ student_id: aarav.id, opportunity_id: opp.id })
        .first();
      if (app && app.status === 'APPLIED') {
        await updateApplicationStatus(actor, Number(app.id), 'SHORTLISTED', 'E2E shortlist');
      }

      let round = await db('placement_rounds')
        .where({ opportunity_id: opp.id, name: 'Technical Interview' })
        .first();
      if (!round && app) {
        round = await createRound(actor, Number(opp.id), {
          roundOrder: 1,
          roundType: 'TECHNICAL_INTERVIEW',
          name: 'Technical Interview',
          scheduledAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 19).replace('T', ' '),
        });
        await updateRoundParticipant(actor, Number(round.id), Number(app.id), {
          status: 'QUALIFIED',
          result: 'QUALIFIED',
          score: 82,
        });
      }

      const existingOffer = await db('placement_offers')
        .where({ student_id: aarav.id, opportunity_id: opp.id })
        .first();
      if (!existingOffer && app) {
        await createOffer(actor, {
          studentId: Number(aarav.id),
          opportunityId: Number(opp.id),
          applicationId: Number(app.id),
          role: 'Graduate Software Engineer',
          ctc: 8,
        });
      }

      let training = await db('training_programs')
        .where({ college_id: ids.collegeId, title: 'Aptitude Training — E2E' })
        .first();
      if (!training) {
        training = await createTrainingProgram(actor, {
          title: 'Aptitude Training — E2E',
          category: 'APTITUDE',
          mode: 'OFFLINE',
          hours: 20,
        });
        await enrollStudents(actor, Number(training.id), [Number(aarav.id)]);
      }

      if (ineligible) {
        await getOrCreateCareerProfile(Number(ineligible.id), ids.collegeId);
      }
    }
  }

  // ── Hostel Management E2E seed ─────────────────────────────────────────
  if (await db.schema.hasTable('hostels')) {
    const { ensureCollegeHostelDefaults } = await import('../modules/hostel/defaults.js');
    await ensureCollegeHostelDefaults(ids.collegeId);

    let hostel = await db('hostels')
      .where({ college_id: ids.collegeId, code: 'VVIET-BOYS' })
      .first();
    if (!hostel) {
      const [hostelId] = await db('hostels').insert({
        college_id: ids.collegeId,
        code: 'VVIET-BOYS',
        name: 'VVIET Boys Hostel',
        hostel_type: 'BOYS',
        gender_policy: 'MALE',
        status: 'ACTIVE',
      });
      hostel = await db('hostels').where({ id: hostelId }).first();
    }

    let warden = await db('faculty_users')
      .where({ college_id: ids.collegeId, email: 'qa.warden@vviet.edu.in' })
      .first();
    if (!warden) {
      const [wardenId] = await db('faculty_users').insert({
        college_id: ids.collegeId,
        department_id: null,
        name: 'QA Hostel Warden',
        email: 'qa.warden@vviet.edu.in',
        password_hash: await bcrypt.hash('Password123', 10),
        role: 'WARDEN',
        is_active: true,
        employee_id: `QA-WARDEN-${ids.collegeId}`,
      });
      warden = await db('faculty_users').where({ id: wardenId }).first();
    } else {
      await db('faculty_users').where({ id: warden.id }).update({
        college_id: ids.collegeId,
        department_id: null,
        name: 'QA Hostel Warden',
        password_hash: await bcrypt.hash('Password123', 10),
        role: 'WARDEN',
        is_active: true,
        archived_at: null,
        updated_at: db.fn.now(),
      });
      warden = await db('faculty_users').where({ id: warden.id }).first();
    }

    if (warden) {
      const existingAssignment = await db('hostel_warden_assignments')
        .where({
          college_id: ids.collegeId,
          hostel_id: hostel.id,
          faculty_user_id: warden.id,
          status: 'ACTIVE',
        })
        .first();
      if (!existingAssignment) {
        await db('hostel_warden_assignments').insert({
          college_id: ids.collegeId,
          hostel_id: hostel.id,
          faculty_user_id: warden.id,
          assignment_role: 'WARDEN',
          status: 'ACTIVE',
        });
      }
    }

    let management = await db('faculty_users')
      .where({ college_id: ids.collegeId, email: 'qa.management@vviet.edu.in' })
      .first();
    if (!management) {
      const [managementId] = await db('faculty_users').insert({
        college_id: ids.collegeId,
        department_id: null,
        name: 'QA Management',
        email: 'qa.management@vviet.edu.in',
        password_hash: await bcrypt.hash('Password123', 10),
        role: 'MANAGEMENT',
        is_active: true,
        employee_id: `QA-MGMT-${ids.collegeId}`,
      });
      management = await db('faculty_users').where({ id: managementId }).first();
    } else {
      await db('faculty_users').where({ id: management.id }).update({
        college_id: ids.collegeId,
        department_id: null,
        name: 'QA Management',
        password_hash: await bcrypt.hash('Password123', 10),
        role: 'MANAGEMENT',
        is_active: true,
        archived_at: null,
        updated_at: db.fn.now(),
      });
    }

    let block = await db('hostel_blocks')
      .where({ hostel_id: hostel.id, code: 'A' })
      .first();
    if (!block) {
      const [blockId] = await db('hostel_blocks').insert({
        college_id: ids.collegeId,
        hostel_id: hostel.id,
        code: 'A',
        name: 'Block A',
        status: 'ACTIVE',
      });
      block = await db('hostel_blocks').where({ id: blockId }).first();
    }

    let floor = await db('hostel_floors')
      .where({ block_id: block.id, floor_number: 1 })
      .first();
    if (!floor) {
      const [floorId] = await db('hostel_floors').insert({
        college_id: ids.collegeId,
        hostel_id: hostel.id,
        block_id: block.id,
        floor_number: 1,
        name: 'Ground Floor',
        status: 'ACTIVE',
      });
      floor = await db('hostel_floors').where({ id: floorId }).first();
    }

    const roomDefs = [
      { roomNumber: 'A-101', beds: ['A-101-A', 'A-101-B', 'A-101-C'] },
      { roomNumber: 'A-102', beds: ['A-102-A', 'A-102-B', 'A-102-C'] },
      { roomNumber: 'A-103', beds: ['A-103-A'] },
    ];

    const bedStatuses: Record<string, string> = {
      'A-101-A': 'OCCUPIED',
      'A-101-B': 'AVAILABLE',
      'A-101-C': 'AVAILABLE',
      'A-102-A': 'AVAILABLE',
      'A-102-B': 'AVAILABLE',
      'A-102-C': 'MAINTENANCE',
      'A-103-A': 'AVAILABLE',
    };

    for (const rd of roomDefs) {
      let room = await db('hostel_rooms')
        .where({ hostel_id: hostel.id, room_number: rd.roomNumber })
        .first();
      if (!room) {
        const [roomId] = await db('hostel_rooms').insert({
          college_id: ids.collegeId,
          hostel_id: hostel.id,
          block_id: block.id,
          floor_id: floor.id,
          room_number: rd.roomNumber,
          room_type: 'TRIPLE',
          capacity: rd.beds.length,
          status: 'AVAILABLE',
        });
        room = await db('hostel_rooms').where({ id: roomId }).first();
      }
      for (const bedCode of rd.beds) {
        const existing = await db('hostel_beds').where({ room_id: room.id, bed_code: bedCode }).first();
        if (!existing) {
          await db('hostel_beds').insert({
            college_id: ids.collegeId,
            hostel_id: hostel.id,
            room_id: room.id,
            bed_code: bedCode,
            status: bedStatuses[bedCode] ?? 'AVAILABLE',
          });
        } else {
          await db('hostel_beds').where({ id: existing.id }).update({ status: bedStatuses[bedCode] ?? 'AVAILABLE' });
        }
      }
    }

    const aarav = await db('students').where({ usn: '4VV24CS001' }).first();
    const other = await db('students').where({ usn: '4VV24CS002' }).first();
    const waitlisted = await db('students').where({ usn: '4VV24CS006' }).first();

    let cycle = await db('hostel_application_cycles')
      .where({ college_id: ids.collegeId, name: 'Hostel Admission 2026-27' })
      .first();
    if (!cycle) {
      const [cycleId] = await db('hostel_application_cycles').insert({
        college_id: ids.collegeId,
        academic_year_id: ids.yearId,
        name: 'Hostel Admission 2026-27',
        opens_at: new Date(Date.now() - 30 * 86400000),
        closes_at: new Date(Date.now() + 60 * 86400000),
        status: 'OPEN',
      });
      cycle = await db('hostel_application_cycles').where({ id: cycleId }).first();
    } else {
      await db('hostel_application_cycles').where({ id: cycle.id }).update({ status: 'OPEN' });
    }

    let messPlan = await db('mess_plans')
      .where({ college_id: ids.collegeId, name: 'Full Board E2E' })
      .first();
    if (!messPlan) {
      const [mpId] = await db('mess_plans').insert({
        college_id: ids.collegeId,
        hostel_id: hostel.id,
        name: 'Full Board E2E',
        plan_type: 'FULL_BOARD',
        monthly_amount: 4500,
        status: 'ACTIVE',
      });
      messPlan = await db('mess_plans').where({ id: mpId }).first();
    }

    if (aarav) {
      let app = await db('hostel_applications')
        .where({ student_id: aarav.id, application_cycle_id: cycle.id })
        .first();
      if (!app) {
        const [appId] = await db('hostel_applications').insert({
          college_id: ids.collegeId,
          student_id: aarav.id,
          academic_year_id: ids.yearId,
          application_cycle_id: cycle.id,
          application_number: 'SX/HST/2026/000001',
          preferred_hostel_id: hostel.id,
          preferred_room_type: 'TRIPLE',
          mess_required: true,
          rules_accepted: true,
          declaration_accepted: true,
          status: 'ALLOCATED',
          submitted_at: db.fn.now(),
        });
        app = await db('hostel_applications').where({ id: appId }).first();
      }

      let resident = await db('hostel_residents')
        .where({ student_id: aarav.id, status: 'ACTIVE' })
        .first();
      if (!resident) {
        const [resId] = await db('hostel_residents').insert({
          college_id: ids.collegeId,
          student_id: aarav.id,
          academic_year_id: ids.yearId,
          hostel_id: hostel.id,
          application_id: app?.id,
          resident_number: 'VVIET/HST/2026/00145',
          status: 'ACTIVE',
          admitted_at: db.fn.now(),
        });
        resident = await db('hostel_residents').where({ id: resId }).first();
      }

      const bed = await db('hostel_beds').where({ bed_code: 'A-101-A', hostel_id: hostel.id }).first();
      if (resident && bed) {
        const existingAlloc = await db('hostel_bed_allocations')
          .where({ resident_id: resident.id, status: 'ACTIVE' })
          .first();
        if (!existingAlloc) {
          await db('hostel_bed_allocations').insert({
            college_id: ids.collegeId,
            resident_id: resident.id,
            student_id: aarav.id,
            hostel_id: hostel.id,
            room_id: bed.room_id,
            bed_id: bed.id,
            allocation_type: 'INITIAL',
            start_at: db.fn.now(),
            status: 'ACTIVE',
          });
        }
      }

      if (resident && messPlan) {
        const existingMess = await db('resident_mess_assignments')
          .where({ resident_id: resident.id, status: 'ACTIVE' })
          .first();
        if (!existingMess) {
          await db('resident_mess_assignments').insert({
            college_id: ids.collegeId,
            resident_id: resident.id,
            mess_plan_id: messPlan.id,
            status: 'ACTIVE',
          });
        }
      }

      const existingOutpass = await db('hostel_outpasses')
        .where({ student_id: aarav.id })
        .whereIn('status', ['APPROVED', 'ACTIVE', 'RETURNED'])
        .first();
      if (!existingOutpass && resident) {
        const exitAt = new Date();
        exitAt.setHours(18, 0, 0, 0);
        const returnAt = new Date();
        returnAt.setHours(22, 0, 0, 0);
        await db('hostel_outpasses').insert({
          college_id: ids.collegeId,
          resident_id: resident.id,
          student_id: aarav.id,
          outpass_number: 'SX/HOP/2026/001245',
          qr_token: 'e2e-outpass-token-aarav',
          purpose: 'Personal errand',
          destination: 'City',
          expected_exit_at: exitAt,
          expected_return_at: returnAt,
          status: 'APPROVED',
          approved_at: db.fn.now(),
        });
      }

      const existingLeave = await db('hostel_leave_requests')
        .where({ student_id: aarav.id, status: 'RETURNED' })
        .first();
      if (!existingLeave && resident) {
        await db('hostel_leave_requests').insert({
          college_id: ids.collegeId,
          resident_id: resident.id,
          student_id: aarav.id,
          leave_type: 'HOME_VISIT',
          from_at: new Date(Date.now() - 14 * 86400000),
          to_at: new Date(Date.now() - 12 * 86400000),
          destination: 'Home',
          reason: 'Weekend visit',
          status: 'RETURNED',
          approved_at: db.fn.now(),
          actual_departure_at: new Date(Date.now() - 14 * 86400000),
          actual_return_at: new Date(Date.now() - 12 * 86400000),
        });
      }

      const existingComplaint = await db('hostel_complaints')
        .where({ student_id: aarav.id, category: 'PLUMBING' })
        .first();
      if (!existingComplaint && resident) {
        await db('hostel_complaints').insert({
          college_id: ids.collegeId,
          resident_id: resident.id,
          student_id: aarav.id,
          hostel_id: hostel.id,
          room_id: bed?.room_id,
          category: 'PLUMBING',
          description: 'Leaking tap in bathroom',
          status: 'OPEN',
        });
      }
    }

    if (other) {
      const existingApp = await db('hostel_applications')
        .where({ student_id: other.id, application_cycle_id: cycle.id })
        .first();
      if (!existingApp) {
        await db('hostel_applications').insert({
          college_id: ids.collegeId,
          student_id: other.id,
          academic_year_id: ids.yearId,
          application_cycle_id: cycle.id,
          application_number: 'SX/HST/2026/000002',
          preferred_hostel_id: hostel.id,
          preferred_room_type: 'TRIPLE',
          mess_required: true,
          rules_accepted: true,
          declaration_accepted: true,
          status: 'SUBMITTED',
          submitted_at: db.fn.now(),
        });
      }
    }

    if (waitlisted) {
      const existingApp = await db('hostel_applications')
        .where({ student_id: waitlisted.id, application_cycle_id: cycle.id })
        .first();
      if (!existingApp) {
        const [appId] = await db('hostel_applications').insert({
          college_id: ids.collegeId,
          student_id: waitlisted.id,
          academic_year_id: ids.yearId,
          application_cycle_id: cycle.id,
          application_number: 'SX/HST/2026/000003',
          preferred_hostel_id: hostel.id,
          preferred_room_type: 'TRIPLE',
          mess_required: false,
          rules_accepted: true,
          declaration_accepted: true,
          status: 'WAITLISTED',
          submitted_at: db.fn.now(),
        });
        await db('hostel_waitlist_entries').insert({
          college_id: ids.collegeId,
          application_id: appId,
          hostel_id: hostel.id,
          room_type_preference: 'TRIPLE',
          position: 1,
          status: 'ACTIVE',
        });
      }
    }
  }

  // ── Transport E2E seed ──────────────────────────────────────────────────
  if (await db.schema.hasTable('transport_stops')) {
    const { ensureCollegeTransportDefaults } = await import('../modules/transport/defaults.js');
    await ensureCollegeTransportDefaults(ids.collegeId);

    const stops = [
      { code: 'VIJ', name: 'Vijayanagar' },
      { code: 'HOOT', name: 'Hootagalli' },
      { code: 'RING', name: 'Ring Road' },
      { code: 'CAMP', name: 'VVIET Campus' },
    ];
    const stopIds: Record<string, number> = {};
    for (const s of stops) {
      let stop = await db('transport_stops').where({ college_id: ids.collegeId, code: s.code }).first();
      if (!stop) {
        const [id] = await db('transport_stops').insert({
          college_id: ids.collegeId,
          code: s.code,
          name: s.name,
          status: 'ACTIVE',
        });
        stop = await db('transport_stops').where({ id }).first();
      }
      stopIds[s.code] = Number(stop.id);
    }

    let route = await db('transport_routes').where({ college_id: ids.collegeId, code: 'R01' }).first();
    if (!route) {
      const [routeId] = await db('transport_routes').insert({
        college_id: ids.collegeId,
        code: 'R01',
        name: 'Vijayanagar → VVIET',
        origin: 'Vijayanagar',
        destination: 'VVIET Campus',
        direction_type: 'BIDIRECTIONAL',
        status: 'ACTIVE',
      });
      route = await db('transport_routes').where({ id: routeId }).first();
      const seq = [
        { stop: 'VIJ', seq: 1, pickup: '07:15', drop: '08:45' },
        { stop: 'HOOT', seq: 2, pickup: '07:30', drop: '08:30' },
        { stop: 'RING', seq: 3, pickup: '07:45', drop: '08:15' },
        { stop: 'CAMP', seq: 4, pickup: '08:00', drop: '08:00' },
      ];
      for (const item of seq) {
        await db('transport_route_stops').insert({
          college_id: ids.collegeId,
          route_id: routeId,
          stop_id: stopIds[item.stop],
          sequence_number: item.seq,
          scheduled_pickup_time: item.pickup,
          scheduled_drop_time: item.drop,
        });
      }
    }

    let vehicle = await db('transport_vehicles')
      .where({ college_id: ids.collegeId, vehicle_number: 'KA-XX-AB-1234' })
      .first();
    if (!vehicle) {
      const [vehicleId] = await db('transport_vehicles').insert({
        college_id: ids.collegeId,
        vehicle_number: 'KA-XX-AB-1234',
        internal_code: 'BUS-01',
        vehicle_type: 'BUS',
        seating_capacity: 50,
        total_capacity: 50,
        status: 'ACTIVE',
        operational_status: 'AVAILABLE',
        registration_expiry: '2027-12-31',
        insurance_expiry: '2027-12-31',
        fitness_expiry: '2027-12-31',
        permit_expiry: '2027-12-31',
        pollution_expiry: '2027-12-31',
      });
      vehicle = await db('transport_vehicles').where({ id: vehicleId }).first();
    }

    const existingVehicleAssign = await db('transport_route_vehicle_assignments')
      .where({ route_id: route.id, vehicle_id: vehicle.id, status: 'ACTIVE' })
      .first();
    if (!existingVehicleAssign) {
      await db('transport_route_vehicle_assignments').insert({
        college_id: ids.collegeId,
        route_id: route.id,
        vehicle_id: vehicle.id,
        status: 'ACTIVE',
      });
    }

    let cycle = await db('transport_application_cycles')
      .where({ college_id: ids.collegeId, name: '2026–27' })
      .first();
    if (!cycle) {
      const opens = new Date();
      opens.setMonth(opens.getMonth() - 1);
      const closes = new Date();
      closes.setMonth(closes.getMonth() + 6);
      const [cycleId] = await db('transport_application_cycles').insert({
        college_id: ids.collegeId,
        academic_year_id: ids.yearId,
        name: '2026–27',
        opens_at: opens,
        closes_at: closes,
        effective_from: opens,
        effective_to: closes,
        status: 'OPEN',
      });
      cycle = await db('transport_application_cycles').where({ id: cycleId }).first();
    }

    const feePlan = await db('transport_fee_plans')
      .where({ college_id: ids.collegeId, route_id: route.id, academic_year_id: ids.yearId })
      .first();
    if (!feePlan) {
      await db('transport_fee_plans').insert({
        college_id: ids.collegeId,
        academic_year_id: ids.yearId,
        route_id: route.id,
        service_type: 'TWO_WAY',
        fee_head_code: 'TRANSPORT_FEE',
        amount: 12000,
        billing_frequency: 'ANNUAL',
        status: 'ACTIVE',
      });
    }

    const aarav = await db('students').where({ usn: '4VV24CS001' }).first();
    const other = await db('students').where({ usn: '4VV24CS002' }).first();
    const waitlisted = await db('students').where({ usn: '4VV24CS003' }).first();

    if (aarav && cycle && route) {
      let app = await db('transport_applications')
        .where({ student_id: aarav.id, application_cycle_id: cycle.id })
        .first();
      if (!app) {
        const [appId] = await db('transport_applications').insert({
          college_id: ids.collegeId,
          student_id: aarav.id,
          application_cycle_id: cycle.id,
          application_number: 'SX/TRN/2026/000145',
          pickup_stop_preference_id: stopIds.VIJ,
          drop_stop_preference_id: stopIds.VIJ,
          preferred_route_id: route.id,
          service_type: 'TWO_WAY',
          rules_accepted: true,
          declaration_accepted: true,
          status: 'ASSIGNED',
          submitted_at: db.fn.now(),
        });
        app = await db('transport_applications').where({ id: appId }).first();
      }

      let member = await db('transport_members')
        .where({ student_id: aarav.id, status: 'ACTIVE' })
        .first();
      if (!member) {
        const [memberId] = await db('transport_members').insert({
          college_id: ids.collegeId,
          student_id: aarav.id,
          academic_year_id: ids.yearId,
          application_id: app?.id,
          member_number: 'VVIET/TRN/2026/00145',
          status: 'ACTIVE',
          activated_at: db.fn.now(),
        });
        member = await db('transport_members').where({ id: memberId }).first();
      }

      let assignment = await db('student_transport_assignments')
        .where({ student_id: aarav.id, status: 'ACTIVE' })
        .first();
      if (!assignment && member) {
        const [assignId] = await db('student_transport_assignments').insert({
          college_id: ids.collegeId,
          transport_member_id: member.id,
          student_id: aarav.id,
          route_id: route.id,
          pickup_stop_id: stopIds.VIJ,
          drop_stop_id: stopIds.VIJ,
          service_type: 'TWO_WAY',
          status: 'ACTIVE',
          start_at: db.fn.now(),
        });
        assignment = await db('student_transport_assignments').where({ id: assignId }).first();

        const existingPass = await db('transport_passes')
          .where({ transport_member_id: member.id, status: 'ACTIVE' })
          .first();
        if (!existingPass) {
          const validUntil = new Date();
          validUntil.setFullYear(validUntil.getFullYear() + 1);
          await db('transport_passes').insert({
            college_id: ids.collegeId,
            transport_member_id: member.id,
            student_id: aarav.id,
            route_assignment_id: assignId,
            pass_number: 'SX/TPASS/2026/00145',
            valid_from: db.fn.now(),
            valid_until: validUntil,
            status: 'ACTIVE',
            verification_token: 'e2e-transport-pass-token-aarav',
            issued_at: db.fn.now(),
          });
        }
      }

      const today = new Date().toISOString().slice(0, 10);
      const dayOfWeek = new Date().getDay();
      const schedules = [
        { trip_type: 'MORNING_PICKUP', start_time: '07:00', end_time: '09:00' },
        { trip_type: 'EVENING_DROP', start_time: '16:30', end_time: '18:30' },
      ];
      for (const sch of schedules) {
        const existingSchedule = await db('transport_route_schedules')
          .where({ route_id: route.id, day_of_week: dayOfWeek, trip_type: sch.trip_type })
          .first();
        if (!existingSchedule) {
          await db('transport_route_schedules').insert({
            college_id: ids.collegeId,
            route_id: route.id,
            day_of_week: dayOfWeek,
            trip_type: sch.trip_type,
            start_time: sch.start_time,
            expected_end_time: sch.end_time,
            status: 'ACTIVE',
          });
        }
        const idempotencyKey = `${ids.collegeId}:${route.id}:${today}:${sch.trip_type}`;
        let trip = await db('transport_trips').where({ idempotency_key: idempotencyKey }).first();
        if (!trip) {
          const start = new Date(`${today}T${sch.start_time}:00`);
          const end = new Date(`${today}T${sch.end_time}:00`);
          const [tripId] = await db('transport_trips').insert({
            college_id: ids.collegeId,
            route_id: route.id,
            vehicle_id: vehicle.id,
            trip_date: today,
            trip_type: sch.trip_type,
            idempotency_key: idempotencyKey,
            scheduled_start_at: start,
            scheduled_end_at: end,
            status: sch.trip_type === 'MORNING_PICKUP' ? 'COMPLETED' : 'SCHEDULED',
          });
          trip = await db('transport_trips').where({ id: tripId }).first();
        }
        if (sch.trip_type === 'MORNING_PICKUP' && trip) {
          const boarded = await db('transport_boarding_events')
            .where({ trip_id: trip.id, student_id: aarav.id, event_type: 'BOARDED' })
            .first();
          if (!boarded) {
            await db('transport_boarding_events').insert({
              college_id: ids.collegeId,
              trip_id: trip.id,
              student_id: aarav.id,
              transport_member_id: member?.id,
              event_type: 'BOARDED',
              source: 'MANUAL',
              idempotency_key: `board:${trip.id}:${aarav.id}`,
            });
            await db('transport_boarding_events').insert({
              college_id: ids.collegeId,
              trip_id: trip.id,
              student_id: aarav.id,
              transport_member_id: member?.id,
              event_type: 'ALIGHTED',
              source: 'MANUAL',
              idempotency_key: `alight:${trip.id}:${aarav.id}`,
            });
          }
        }
      }

      const existingComplaint = await db('transport_complaints')
        .where({ student_id: aarav.id, category: 'DELAY' })
        .first();
      if (!existingComplaint) {
        await db('transport_complaints').insert({
          college_id: ids.collegeId,
          transport_member_id: member?.id,
          student_id: aarav.id,
          route_id: route.id,
          category: 'DELAY',
          description: 'Bus delayed by 20 minutes',
          status: 'OPEN',
        });
      }
    }

    if (other && cycle) {
      const existingApp = await db('transport_applications')
        .where({ student_id: other.id, application_cycle_id: cycle.id })
        .first();
      if (!existingApp) {
        await db('transport_applications').insert({
          college_id: ids.collegeId,
          student_id: other.id,
          application_cycle_id: cycle.id,
          application_number: 'SX/TRN/2026/000146',
          pickup_stop_preference_id: stopIds.HOOT,
          drop_stop_preference_id: stopIds.HOOT,
          preferred_route_id: route.id,
          service_type: 'TWO_WAY',
          rules_accepted: true,
          declaration_accepted: true,
          status: 'SUBMITTED',
          submitted_at: db.fn.now(),
        });
      }
    }

    if (waitlisted && cycle) {
      const existingApp = await db('transport_applications')
        .where({ student_id: waitlisted.id, application_cycle_id: cycle.id })
        .first();
      if (!existingApp) {
        const [appId] = await db('transport_applications').insert({
          college_id: ids.collegeId,
          student_id: waitlisted.id,
          application_cycle_id: cycle.id,
          application_number: 'SX/TRN/2026/000147',
          pickup_stop_preference_id: stopIds.VIJ,
          drop_stop_preference_id: stopIds.VIJ,
          preferred_route_id: route.id,
          service_type: 'TWO_WAY',
          rules_accepted: true,
          declaration_accepted: true,
          status: 'WAITLISTED',
          submitted_at: db.fn.now(),
        });
        await db('transport_waitlist_entries').insert({
          college_id: ids.collegeId,
          application_id: appId,
          route_id: route.id,
          stop_id: stopIds.VIJ,
          position: 1,
          status: 'ACTIVE',
        });
      }
    }
  }

  // ── HRMS E2E seed ───────────────────────────────────────────────────────
  if (await db.schema.hasTable('employees')) {
    const { ensureCollegeHrmsDefaults } = await import('../modules/hr/defaults.js');
    const { backfillFacultyToEmployees } = await import('../modules/hr/employees.js');
    await ensureCollegeHrmsDefaults(ids.collegeId);
    await backfillFacultyToEmployees(ids.collegeId);

    const clType = await db('hr_leave_types').where({ college_id: ids.collegeId, code: 'CL' }).first();
    const elType = await db('hr_leave_types').where({ college_id: ids.collegeId, code: 'EL' }).first();
    const year = new Date().getFullYear();

    const facultyForBalances = await db('faculty_users')
      .where({ college_id: ids.collegeId })
      .whereNull('archived_at')
      .select('id');
    for (const f of facultyForBalances) {
      const emp = await db('employees').where({ faculty_user_id: f.id }).first();
      if (!emp) continue;
      for (const lt of [clType, elType].filter(Boolean)) {
        const balance = lt!.code === 'CL' ? 8 : 14;
        const existing = await db('employee_leave_balances')
          .where({ employee_id: emp.id, leave_type_id: lt!.id, year })
          .first();
        if (!existing) {
          await db('employee_leave_balances').insert({
            college_id: ids.collegeId,
            employee_id: emp.id,
            leave_type_id: lt!.id,
            year,
            opening_balance: 0,
            credited: balance,
            availed: 0,
            adjusted: 0,
            carried_forward: 0,
            available_balance: balance,
          });
        }
      }
    }

    const anitaFaculty = await db('faculty_users').where({ college_id: ids.collegeId, email: 'anita@vviet.edu.in' }).first();
    const anitaEmp = anitaFaculty
      ? await db('employees').where({ faculty_user_id: anitaFaculty.id }).first()
      : null;
    const hodFaculty = await db('faculty_users').where({ college_id: ids.collegeId, role: 'HOD' }).first();
    if (anitaEmp && hodFaculty) {
      const hodEmp = await db('employees').where({ faculty_user_id: hodFaculty.id }).first();
      if (hodEmp && !anitaEmp.reporting_manager_employee_id) {
        await db('employees').where({ id: anitaEmp.id }).update({
          reporting_manager_employee_id: hodEmp.id,
        });
      }
    }
  }

  // Lab Assistant / Laboratory Management deterministic seed (idempotent).
  try {
    const { seedLabManagement } = await import('./seedLabManagement.js');
    await seedLabManagement({ closeDb: false });
  } catch (err) {
    console.error('Lab management seed failed (non-fatal):', (err as Error).message);
  }

  const summary = {
    classCode: CLASS_CODE,
    joinCode: current.joinCode,
    joinUrl: `${env.PUBLIC_APP_URL.replace(/\/$/, '')}/join/class/${current.joinCode}`,
    courseIds: { dataStructures: dsId, oop: oopId, mathematics: mathId, digitalDesign: ddId },
    topics: { arrays: topicArrays, linkedLists: topicLists },
    assignmentId: assignment.assignmentId,
    quizId: quiz.quizId,
    paperId: paper?.id,
    accounts: {
      approved: { usn: '4VV24CS001', email: 'e2e.approved@student.skillonx.test' },
      pending: { usn: '4VV24CS002', email: 'e2e.pending@student.skillonx.test' },
      rejected: { usn: '4VV24CS003', email: 'e2e.rejected@student.skillonx.test' },
      wrongSection: { usn: '4VV24CS004', email: 'e2e.sectionb@student.skillonx.test' },
      inactive: { usn: '4VV24CS005', email: 'e2e.inactive@student.skillonx.test' },
      approved2: { usn: '4VV24CS006', email: 'e2e.absent@student.skillonx.test' },
      faculty: { email: 'anita@vviet.edu.in' },
    },
  };

  console.log('\nStudent LMS E2E seed complete.\n');
  console.log(JSON.stringify(summary, null, 2));
  if (options.closeDb !== false) await db.destroy();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedStudentLmsE2e().catch(async (err) => {
    console.error(err);
    try {
      await db.destroy();
    } catch {
      /* ignore */
    }
    process.exit(1);
  });
}
