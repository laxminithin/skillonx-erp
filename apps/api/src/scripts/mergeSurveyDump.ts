/**
 * Merge values from a phpMyAdmin dump database (`survey_dump`) into the live
 * skillonx_survey database without wiping quiz / lesson-plan / existing rows.
 *
 * Matching is by natural keys (college code, email, USN, course code/name,
 * survey title). Dump primary keys are remapped. Existing matched rows are
 * left unchanged.
 *
 * Prerequisite: load survey.sql into a sibling database named survey_dump.
 */
import knex, { type Knex } from 'knex';
import { db } from '../db/index.js';
import { env } from '../config/env.js';

const DUMP_DB = process.env.SURVEY_DUMP_DATABASE || 'survey_dump';

type IdMap = Map<number, number>;

function dumpUrl(liveUrl: string, database: string) {
  const parsed = new URL(liveUrl);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}

function asId(value: unknown) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function requireMapped(map: IdMap, dumpId: unknown, label: string) {
  const id = asId(dumpId);
  if (id == null) throw new Error(`${label} is required but dump id was empty`);
  const mapped = map.get(id);
  if (mapped == null) throw new Error(`${label}: dump id ${id} was not mapped`);
  return mapped;
}

function optionalMapped(map: IdMap, dumpId: unknown) {
  const id = asId(dumpId);
  if (id == null) return null;
  return map.get(id) ?? null;
}

function normText(value: unknown) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function parseJson(value: unknown) {
  if (value == null) return null;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string' || value.trim() === '') return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function stringifyJson(value: unknown) {
  const parsed = parseJson(value);
  if (parsed == null) return null;
  if (typeof parsed === 'string') return parsed;
  return JSON.stringify(parsed);
}

function rewriteSnapshot(snapshot: unknown, sections: IdMap, questions: IdMap, options: IdMap) {
  const data = parseJson(snapshot);
  if (!data || typeof data !== 'object' || !Array.isArray((data as { sections?: unknown }).sections)) {
    return snapshot == null ? null : typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);
  }
  const root = data as {
    sections: Array<{
      id: number;
      questions?: Array<{ id: number; sectionId: number; options?: Array<{ id: number }> }>;
    }>;
  };
  for (const section of root.sections) {
    section.id = sections.get(section.id) ?? section.id;
    for (const question of section.questions ?? []) {
      question.id = questions.get(question.id) ?? question.id;
      question.sectionId = sections.get(question.sectionId) ?? question.sectionId;
      for (const option of question.options ?? []) {
        option.id = options.get(option.id) ?? option.id;
      }
    }
  }
  return JSON.stringify(root);
}

async function count(dbConn: Knex, table: string) {
  const row = await dbConn(table).count({ c: '*' }).first();
  return Number(row?.c ?? 0);
}

async function insertOne(live: Knex, table: string, row: Record<string, unknown>) {
  const [id] = await live(table).insert(row);
  return Number(id);
}

async function main() {
  const dump = knex({
    client: 'mysql2',
    connection: dumpUrl(env.DATABASE_URL, DUMP_DB),
    pool: { min: 0, max: 4 },
  });

  const before = {
    quizBank: await count(db, 'quiz_bank_questions'),
    lessonTopics: await count(db, 'lesson_topics'),
    lessonSubtopics: await count(db, 'lesson_subtopics'),
    subjectModules: await count(db, 'subject_modules'),
    courses: await count(db, 'courses'),
    surveys: await count(db, 'surveys'),
    students: await count(db, 'students'),
  };

  const stats: Record<string, { reused: number; inserted: number; skipped: number }> = {};
  const bump = (table: string, field: 'reused' | 'inserted' | 'skipped') => {
    stats[table] ??= { reused: 0, inserted: 0, skipped: 0 };
    stats[table][field] += 1;
  };

  const colleges: IdMap = new Map();
  const departments: IdMap = new Map();
  const faculty: IdMap = new Map();
  const years: IdMap = new Map();
  const semesters: IdMap = new Map();
  const programs: IdMap = new Map();
  const courses: IdMap = new Map();
  const sections: IdMap = new Map();
  const students: IdMap = new Map();
  const bankItems: IdMap = new Map();
  const surveys: IdMap = new Map();
  const surveySections: IdMap = new Map();
  const questions: IdMap = new Map();
  const options: IdMap = new Map();
  const submissions: IdMap = new Map();
  const skippedSurveys = new Set<number>();

  try {
    for (const row of await dump('colleges').select('*')) {
      const existing = await db('colleges').where({ code: row.code }).first();
      if (existing) {
        colleges.set(row.id, existing.id);
        bump('colleges', 'reused');
        continue;
      }
      colleges.set(
        row.id,
        await insertOne(db, 'colleges', {
          name: row.name,
          code: row.code,
          domain: row.domain,
          address: row.address,
          logo_url: row.logo_url,
          is_active: row.is_active,
          timezone: row.timezone || 'Asia/Kolkata',
          created_at: row.created_at,
          updated_at: row.updated_at,
        }),
      );
      bump('colleges', 'inserted');
    }

    for (const row of await dump('departments').select('*')) {
      const collegeId = requireMapped(colleges, row.college_id, 'department.college_id');
      const existing = await db('departments').where({ college_id: collegeId, code: row.code }).first();
      if (existing) {
        departments.set(row.id, existing.id);
        bump('departments', 'reused');
        continue;
      }
      departments.set(
        row.id,
        await insertOne(db, 'departments', {
          college_id: collegeId,
          name: row.name,
          code: row.code,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }),
      );
      bump('departments', 'inserted');
    }

    for (const row of await dump('faculty_users').select('*')) {
      const email = String(row.email || '').trim().toLowerCase();
      const existing = await db('faculty_users').whereRaw('LOWER(email) = ?', [email]).first();
      if (existing) {
        faculty.set(row.id, existing.id);
        bump('faculty_users', 'reused');
        continue;
      }
      const collegeId = requireMapped(colleges, row.college_id, 'faculty.college_id');
      let employeeId = row.employee_id || null;
      if (employeeId) {
        const taken = await db('faculty_users')
          .where({ college_id: collegeId, employee_id: employeeId })
          .first();
        if (taken) employeeId = null;
      }
      faculty.set(
        row.id,
        await insertOne(db, 'faculty_users', {
          college_id: collegeId,
          department_id: optionalMapped(departments, row.department_id),
          name: row.name,
          email,
          password_hash: row.password_hash,
          role: row.role,
          is_active: row.is_active,
          reset_token: row.reset_token,
          reset_token_expires_at: row.reset_token_expires_at,
          employee_id: employeeId,
          phone: row.phone,
          designation: row.designation,
          permissions: stringifyJson(row.permissions),
          last_login_at: row.last_login_at,
          archived_at: row.archived_at,
          last_password_change_at: row.last_password_change_at,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }),
      );
      bump('faculty_users', 'inserted');
    }

    for (const row of await dump('academic_years').select('*')) {
      const collegeId = requireMapped(colleges, row.college_id, 'academic_years.college_id');
      const liveYears = await db('academic_years').where({ college_id: collegeId });
      const existing =
        liveYears.find((y) => normText(y.label) === normText(row.label)) ||
        (row.is_current ? liveYears.find((y) => y.is_current) : null) ||
        liveYears[0];
      if (existing) {
        years.set(row.id, existing.id);
        bump('academic_years', 'reused');
        continue;
      }
      years.set(
        row.id,
        await insertOne(db, 'academic_years', {
          college_id: collegeId,
          label: row.label,
          is_current: row.is_current,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }),
      );
      bump('academic_years', 'inserted');
    }

    for (const row of await dump('semesters').select('*')) {
      const collegeId = requireMapped(colleges, row.college_id, 'semesters.college_id');
      const existing = await db('semesters').where({ college_id: collegeId, label: row.label }).first();
      if (existing) {
        semesters.set(row.id, existing.id);
        bump('semesters', 'reused');
        continue;
      }
      semesters.set(
        row.id,
        await insertOne(db, 'semesters', {
          college_id: collegeId,
          label: row.label,
          number: row.number,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }),
      );
      bump('semesters', 'inserted');
    }

    for (const row of await dump('programs').select('*')) {
      const collegeId = requireMapped(colleges, row.college_id, 'programs.college_id');
      const existing = await db('programs').where({ college_id: collegeId, code: row.code }).first();
      if (existing) {
        programs.set(row.id, existing.id);
        bump('programs', 'reused');
        continue;
      }
      programs.set(
        row.id,
        await insertOne(db, 'programs', {
          college_id: collegeId,
          department_id: optionalMapped(departments, row.department_id),
          name: row.name,
          code: row.code,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }),
      );
      bump('programs', 'inserted');
    }

    for (const row of await dump('courses').select('*')) {
      const collegeId = requireMapped(colleges, row.college_id, 'courses.college_id');
      const liveCourses = await db('courses').where({ college_id: collegeId });
      const existing =
        liveCourses.find((c) => String(c.code) === String(row.code)) ||
        liveCourses.find((c) => normText(c.name) === normText(row.name));
      if (existing) {
        courses.set(row.id, existing.id);
        bump('courses', 'reused');
        continue;
      }
      courses.set(
        row.id,
        await insertOne(db, 'courses', {
          college_id: collegeId,
          department_id: optionalMapped(departments, row.department_id),
          code: row.code,
          name: row.name,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }),
      );
      bump('courses', 'inserted');
    }

    for (const row of await dump('class_sections').select('*')) {
      const collegeId = requireMapped(colleges, row.college_id, 'class_sections.college_id');
      const departmentId = optionalMapped(departments, row.department_id);
      const existing = await db('class_sections')
        .where({ college_id: collegeId, label: row.label })
        .modify((q) => {
          if (departmentId == null) q.whereNull('department_id');
          else q.where({ department_id: departmentId });
        })
        .first();
      if (existing) {
        sections.set(row.id, existing.id);
        bump('class_sections', 'reused');
        continue;
      }
      sections.set(
        row.id,
        await insertOne(db, 'class_sections', {
          college_id: collegeId,
          department_id: departmentId,
          label: row.label,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }),
      );
      bump('class_sections', 'inserted');
    }

    for (const row of await dump('students').select('*')) {
      const collegeId = requireMapped(colleges, row.college_id, 'students.college_id');
      const existing = await db('students').where({ college_id: collegeId, usn: row.usn }).first();
      if (existing) {
        students.set(row.id, existing.id);
        bump('students', 'reused');
        continue;
      }
      students.set(
        row.id,
        await insertOne(db, 'students', {
          college_id: collegeId,
          department_id: optionalMapped(departments, row.department_id),
          name: row.name,
          usn: row.usn,
          email: row.email,
          semester: row.semester,
          section: row.section,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }),
      );
      bump('students', 'inserted');
    }

    for (const row of await dump('question_bank_items').select('*')) {
      const collegeId = requireMapped(colleges, row.college_id, 'question_bank_items.college_id');
      const existing = await db('question_bank_items')
        .where({ college_id: collegeId, prompt: row.prompt, question_type: row.question_type })
        .first();
      if (existing) {
        bankItems.set(row.id, existing.id);
        bump('question_bank_items', 'reused');
        continue;
      }
      bankItems.set(
        row.id,
        await insertOne(db, 'question_bank_items', {
          college_id: collegeId,
          created_by: optionalMapped(faculty, row.created_by),
          question_type: row.question_type,
          prompt: row.prompt,
          help_text: row.help_text,
          config: stringifyJson(row.config),
          options: stringifyJson(row.options),
          category: row.category,
          is_active: row.is_active,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }),
      );
      bump('question_bank_items', 'inserted');
    }

    for (const row of await dump('question_bank_tags').select('*')) {
      const itemId = optionalMapped(bankItems, row.question_bank_item_id);
      if (itemId == null) {
        bump('question_bank_tags', 'skipped');
        continue;
      }
      const existing = await db('question_bank_tags')
        .where({ question_bank_item_id: itemId, tag: row.tag })
        .first();
      if (existing) {
        bump('question_bank_tags', 'reused');
        continue;
      }
      await db('question_bank_tags').insert({ question_bank_item_id: itemId, tag: row.tag });
      bump('question_bank_tags', 'inserted');
    }

    for (const row of await dump('surveys').select('*')) {
      const collegeId = requireMapped(colleges, row.college_id, 'surveys.college_id');
      const liveSurveys = await db('surveys').where({ college_id: collegeId });
      const existing = liveSurveys.find((s) => normText(s.title) === normText(row.title));
      if (existing) {
        surveys.set(row.id, existing.id);
        skippedSurveys.add(row.id);
        bump('surveys', 'reused');
        continue;
      }
      surveys.set(
        row.id,
        await insertOne(db, 'surveys', {
          college_id: collegeId,
          created_by: requireMapped(faculty, row.created_by, 'surveys.created_by'),
          title: row.title,
          description: row.description,
          survey_type: row.survey_type,
          academic_year_id: optionalMapped(years, row.academic_year_id),
          semester_id: optionalMapped(semesters, row.semester_id),
          department_id: optionalMapped(departments, row.department_id),
          course_id: optionalMapped(courses, row.course_id),
          subject_faculty_id: optionalMapped(faculty, row.subject_faculty_id),
          class_section_id: optionalMapped(sections, row.class_section_id),
          start_at: row.start_at,
          end_at: row.end_at,
          status: row.status,
          response_policy: row.response_policy,
          identity_mode: row.identity_mode,
          duplicated_from_id: optionalMapped(surveys, row.duplicated_from_id),
          published_at: row.published_at,
          closed_at: row.closed_at,
          archived_at: row.archived_at,
          deleted_at: row.deleted_at,
          structure_locked: row.structure_locked,
          structure_version: row.structure_version,
          published_snapshot: null,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }),
      );
      bump('surveys', 'inserted');
    }

    for (const row of await dump('survey_sections').select('*')) {
      if (skippedSurveys.has(row.survey_id)) {
        bump('survey_sections', 'skipped');
        continue;
      }
      const liveId = await insertOne(db, 'survey_sections', {
        survey_id: requireMapped(surveys, row.survey_id, 'survey_sections.survey_id'),
        title: row.title,
        description: row.description,
        sort_order: row.sort_order,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
      surveySections.set(row.id, liveId);
      bump('survey_sections', 'inserted');
    }

    for (const row of await dump('questions').select('*')) {
      if (skippedSurveys.has(row.survey_id)) {
        bump('questions', 'skipped');
        continue;
      }
      const liveId = await insertOne(db, 'questions', {
        survey_id: requireMapped(surveys, row.survey_id, 'questions.survey_id'),
        section_id: requireMapped(surveySections, row.section_id, 'questions.section_id'),
        question_type: row.question_type,
        prompt: row.prompt,
        help_text: row.help_text,
        is_required: row.is_required,
        allow_comment: row.allow_comment,
        sort_order: row.sort_order,
        config: stringifyJson(row.config),
        question_bank_item_id: optionalMapped(bankItems, row.question_bank_item_id),
        structure_version: row.structure_version,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
      questions.set(row.id, liveId);
      bump('questions', 'inserted');
    }

    for (const row of await dump('question_options').select('*')) {
      const questionId = questions.get(row.question_id);
      if (questionId == null) {
        bump('question_options', 'skipped');
        continue;
      }
      const liveId = await insertOne(db, 'question_options', {
        question_id: questionId,
        label: row.label,
        value: row.value,
        sort_order: row.sort_order,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
      options.set(row.id, liveId);
      bump('question_options', 'inserted');
    }

    for (const row of await dump('surveys').select('*')) {
      if (skippedSurveys.has(row.id) || !row.published_snapshot) continue;
      const liveSurveyId = surveys.get(row.id);
      if (liveSurveyId == null) continue;
      await db('surveys')
        .where({ id: liveSurveyId })
        .update({
          published_snapshot: rewriteSnapshot(row.published_snapshot, surveySections, questions, options),
        });
    }

    for (const row of await dump('survey_links').select('*')) {
      if (skippedSurveys.has(row.survey_id)) {
        bump('survey_links', 'skipped');
        continue;
      }
      const existing = await db('survey_links').where({ code: row.code }).first();
      if (existing) {
        bump('survey_links', 'reused');
        continue;
      }
      await db('survey_links').insert({
        survey_id: requireMapped(surveys, row.survey_id, 'survey_links.survey_id'),
        code: row.code,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
      bump('survey_links', 'inserted');
    }

    for (const row of await dump('survey_submissions').select('*')) {
      if (skippedSurveys.has(row.survey_id)) {
        bump('survey_submissions', 'skipped');
        continue;
      }
      const liveId = await insertOne(db, 'survey_submissions', {
        survey_id: requireMapped(surveys, row.survey_id, 'survey_submissions.survey_id'),
        student_id: requireMapped(students, row.student_id, 'survey_submissions.student_id'),
        college_id: requireMapped(colleges, row.college_id, 'survey_submissions.college_id'),
        started_at: row.started_at,
        submitted_at: row.submitted_at,
        status: row.status,
        ip_address: row.ip_address,
        device_information: row.device_information,
        attempt_number: row.attempt_number,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
      submissions.set(row.id, liveId);
      bump('survey_submissions', 'inserted');
    }

    for (const row of await dump('survey_answers').select('*')) {
      const submissionId = submissions.get(row.submission_id);
      const questionId = questions.get(row.question_id);
      if (submissionId == null || questionId == null) {
        bump('survey_answers', 'skipped');
        continue;
      }
      await db('survey_answers').insert({
        submission_id: submissionId,
        question_id: questionId,
        text_answer: row.text_answer,
        numeric_answer: row.numeric_answer,
        selected_option_id: optionalMapped(options, row.selected_option_id),
        json_answer: stringifyJson(row.json_answer),
        comment: row.comment,
        question_structure_version: row.question_structure_version,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
      bump('survey_answers', 'inserted');
    }

    for (const row of await dump('survey_audit_log').select('*')) {
      if (skippedSurveys.has(row.survey_id)) {
        bump('survey_audit_log', 'skipped');
        continue;
      }
      await db('survey_audit_log').insert({
        college_id: requireMapped(colleges, row.college_id, 'survey_audit_log.college_id'),
        survey_id: requireMapped(surveys, row.survey_id, 'survey_audit_log.survey_id'),
        actor_id: optionalMapped(faculty, row.actor_id),
        actor_name: row.actor_name,
        action: row.action,
        metadata: stringifyJson(row.metadata),
        created_at: row.created_at,
      });
      bump('survey_audit_log', 'inserted');
    }

    const after = {
      quizBank: await count(db, 'quiz_bank_questions'),
      lessonTopics: await count(db, 'lesson_topics'),
      lessonSubtopics: await count(db, 'lesson_subtopics'),
      subjectModules: await count(db, 'subject_modules'),
      courses: await count(db, 'courses'),
      surveys: await count(db, 'surveys'),
      students: await count(db, 'students'),
    };

    if (
      after.quizBank !== before.quizBank ||
      after.lessonTopics !== before.lessonTopics ||
      after.lessonSubtopics !== before.lessonSubtopics ||
      after.subjectModules !== before.subjectModules
    ) {
      throw new Error(
        `Protected catalog changed unexpectedly. before=${JSON.stringify(before)} after=${JSON.stringify(after)}`,
      );
    }

    console.log('Survey dump merge complete.\n');
    for (const [table, s] of Object.entries(stats)) {
      console.log(`  ${table}: ${s.inserted} inserted, ${s.reused} reused, ${s.skipped} skipped`);
    }
    console.log('\nPreserved:');
    console.log(`  quiz_bank_questions: ${after.quizBank}`);
    console.log(`  lesson_topics: ${after.lessonTopics}`);
    console.log(`  lesson_subtopics: ${after.lessonSubtopics}`);
    console.log(`  subject_modules: ${after.subjectModules}`);
    console.log(`  courses: ${before.courses} -> ${after.courses}`);
    console.log(`  surveys: ${before.surveys} -> ${after.surveys}`);
    console.log(`  students: ${before.students} -> ${after.students}`);
  } finally {
    await dump.destroy();
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
