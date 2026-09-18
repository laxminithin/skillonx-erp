/**
 * Class-centric student LMS.
 *
 * Reuses existing academic master:
 *   colleges, academic_years, programs, departments (branch),
 *   semesters, academic_schemes, class_sections (section labels),
 *   courses (subjects), program_subjects, faculty_subject_assignments, students.
 *
 * AcademicClass is the cohort container. Students enroll in a class once;
 * subjects come from ClassSubject mappings, not per-subject enrollment.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const studentCols = [
    ['password_hash', (t) => t.string('password_hash', 255).nullable()],
    ['phone', (t) => t.string('phone', 32).nullable()],
    ['program_id', (t) => t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL')],
    ['scheme_id', (t) => t.integer('scheme_id').unsigned().nullable().references('id').inTable('academic_schemes').onDelete('SET NULL')],
    ['academic_year_id', (t) => t.integer('academic_year_id').unsigned().nullable().references('id').inTable('academic_years').onDelete('SET NULL')],
    ['semester_id', (t) => t.integer('semester_id').unsigned().nullable().references('id').inTable('semesters').onDelete('SET NULL')],
    ['class_section_id', (t) => t.integer('class_section_id').unsigned().nullable().references('id').inTable('class_sections').onDelete('SET NULL')],
    ['is_active', (t) => t.boolean('is_active').notNullable().defaultTo(true)],
    ['profile_completed_at', (t) => t.timestamp('profile_completed_at').nullable()],
    ['last_login_at', (t) => t.timestamp('last_login_at').nullable()],
    ['reset_token', (t) => t.string('reset_token', 255).nullable()],
    ['reset_token_expires_at', (t) => t.timestamp('reset_token_expires_at').nullable()],
  ];
  for (const [col, add] of studentCols) {
    if (!(await knex.schema.hasColumn('students', col))) {
      await knex.schema.alterTable('students', (t) => add(t));
    }
  }

  if (!(await knex.schema.hasTable('academic_classes'))) {
    await knex.schema.createTable('academic_classes', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.integer('program_id').unsigned().notNullable().references('id').inTable('programs').onDelete('RESTRICT');
      t.integer('department_id').unsigned().notNullable().references('id').inTable('departments').onDelete('RESTRICT');
      t.integer('semester_id').unsigned().notNullable().references('id').inTable('semesters').onDelete('RESTRICT');
      t.integer('scheme_id').unsigned().nullable().references('id').inTable('academic_schemes').onDelete('SET NULL');
      t.integer('class_section_id').unsigned().notNullable().references('id').inTable('class_sections').onDelete('RESTRICT');
      t.integer('coordinator_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('name', 255).notNullable();
      t.string('code', 64).notNullable();
      t.string('status', 32).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'ac_college_code_unique' });
      t.unique(
        [
          'college_id',
          'academic_year_id',
          'program_id',
          'department_id',
          'semester_id',
          'class_section_id',
        ],
        { indexName: 'ac_cohort_unique' },
      );
      t.index(['college_id', 'status'], 'ac_college_status_idx');
      t.index(['college_id', 'department_id', 'semester_id'], 'ac_college_dept_sem_idx');
    });
  }

  if (!(await knex.schema.hasTable('academic_class_subjects'))) {
    await knex.schema.createTable('academic_class_subjects', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('academic_class_id').unsigned().notNullable().references('id').inTable('academic_classes').onDelete('CASCADE');
      t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('RESTRICT');
      t.string('kind', 32).notNullable().defaultTo('CORE');
      t.string('elective_group', 64).nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.integer('sort_order').notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.unique(['academic_class_id', 'course_id'], { indexName: 'acs_class_course_unique' });
      t.index(['college_id', 'academic_class_id'], 'acs_college_class_idx');
    });
  }

  if (!(await knex.schema.hasTable('academic_class_subject_faculty'))) {
    await knex.schema.createTable('academic_class_subject_faculty', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('academic_class_id').unsigned().notNullable().references('id').inTable('academic_classes').onDelete('CASCADE');
      t.integer('class_subject_id').unsigned().notNullable().references('id').inTable('academic_class_subjects').onDelete('CASCADE');
      t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('CASCADE');
      t.integer('faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      t.boolean('is_primary').notNullable().defaultTo(true);
      t.boolean('can_manage').notNullable().defaultTo(false);
      t.string('status', 32).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.unique(['class_subject_id', 'faculty_id'], { indexName: 'acsf_subject_faculty_unique' });
      t.index(['college_id', 'academic_class_id'], 'acsf_college_class_idx');
      t.index(['college_id', 'faculty_id'], 'acsf_college_faculty_idx');
    });
  }

  if (!(await knex.schema.hasTable('academic_class_coordinators'))) {
    await knex.schema.createTable('academic_class_coordinators', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('academic_class_id').unsigned().notNullable().references('id').inTable('academic_classes').onDelete('CASCADE');
      t.integer('faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      t.string('role', 32).notNullable().defaultTo('COORDINATOR');
      t.timestamps(true, true);
      t.unique(['academic_class_id', 'faculty_id'], { indexName: 'acc_class_faculty_unique' });
      t.index(['college_id', 'faculty_id'], 'acc_college_faculty_idx');
    });
  }

  if (!(await knex.schema.hasTable('academic_class_links'))) {
    await knex.schema.createTable('academic_class_links', (t) => {
      t.increments('id').primary();
      t.integer('academic_class_id').unsigned().notNullable().references('id').inTable('academic_classes').onDelete('CASCADE');
      t.string('code', 16).notNullable().unique();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('disabled_at').nullable();
      t.timestamps(true, true);
      t.index(['academic_class_id', 'is_active'], 'acl_class_active_idx');
    });
  }

  if (!(await knex.schema.hasTable('student_semester_registrations'))) {
    await knex.schema.createTable('student_semester_registrations', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('semester_id').unsigned().notNullable().references('id').inTable('semesters').onDelete('RESTRICT');
      t.integer('scheme_id').unsigned().nullable().references('id').inTable('academic_schemes').onDelete('SET NULL');
      t.integer('class_section_id').unsigned().nullable().references('id').inTable('class_sections').onDelete('SET NULL');
      t.string('status', 32).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.unique(['student_id', 'academic_year_id', 'semester_id'], {
        indexName: 'ssr_student_year_sem_unique',
      });
      t.index(['college_id', 'student_id', 'status'], 'ssr_college_student_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('academic_class_enrollments'))) {
    await knex.schema.createTable('academic_class_enrollments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('academic_class_id').unsigned().notNullable().references('id').inTable('academic_classes').onDelete('CASCADE');
      t.integer('semester_registration_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('student_semester_registrations')
        .onDelete('SET NULL');
      t.string('status', 32).notNullable().defaultTo('PENDING');
      t.timestamp('requested_at').notNullable();
      t.timestamp('approved_at').nullable();
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('rejected_at').nullable();
      t.integer('rejected_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('remarks').nullable();
      t.timestamps(true, true);
      t.unique(['student_id', 'academic_class_id'], { indexName: 'ace_student_class_unique' });
      t.index(['college_id', 'academic_class_id', 'status'], 'ace_class_status_idx');
      t.index(['college_id', 'student_id', 'status'], 'ace_student_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('student_elective_selections'))) {
    await knex.schema.createTable('student_elective_selections', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('academic_class_id').unsigned().notNullable().references('id').inTable('academic_classes').onDelete('CASCADE');
      t.integer('class_subject_id').unsigned().notNullable().references('id').inTable('academic_class_subjects').onDelete('CASCADE');
      t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('CASCADE');
      t.string('elective_group', 64).nullable();
      t.string('status', 32).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.unique(['student_id', 'academic_class_id', 'class_subject_id'], {
        indexName: 'ses_student_class_subject_unique',
      });
      t.index(['college_id', 'student_id'], 'ses_college_student_idx');
    });
  }

  if (!(await knex.schema.hasTable('backlog_subject_registrations'))) {
    await knex.schema.createTable('backlog_subject_registrations', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('RESTRICT');
      t.integer('offering_class_id').unsigned().nullable().references('id').inTable('academic_classes').onDelete('SET NULL');
      t.integer('class_subject_id').unsigned().nullable().references('id').inTable('academic_class_subjects').onDelete('SET NULL');
      t.integer('origin_semester_id').unsigned().nullable().references('id').inTable('semesters').onDelete('SET NULL');
      t.string('status', 32).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.index(['college_id', 'student_id', 'status'], 'bsr_student_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('subject_enrollment_overrides'))) {
    await knex.schema.createTable('subject_enrollment_overrides', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('RESTRICT');
      t.integer('academic_class_id').unsigned().nullable().references('id').inTable('academic_classes').onDelete('SET NULL');
      t.integer('class_subject_id').unsigned().nullable().references('id').inTable('academic_class_subjects').onDelete('SET NULL');
      t.string('reason', 32).notNullable().defaultTo('ADDITIONAL');
      t.text('notes').nullable();
      t.string('status', 32).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.index(['college_id', 'student_id', 'status'], 'seo_student_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('academic_class_announcements'))) {
    await knex.schema.createTable('academic_class_announcements', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('academic_class_id').unsigned().notNullable().references('id').inTable('academic_classes').onDelete('CASCADE');
      t.integer('course_id').unsigned().nullable().references('id').inTable('courses').onDelete('CASCADE');
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('scope', 16).notNullable().defaultTo('CLASS');
      t.string('title', 255).notNullable();
      t.text('body').nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamp('published_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'academic_class_id', 'scope'], 'aca_class_scope_idx');
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('academic_class_announcements');
  await knex.schema.dropTableIfExists('subject_enrollment_overrides');
  await knex.schema.dropTableIfExists('backlog_subject_registrations');
  await knex.schema.dropTableIfExists('student_elective_selections');
  await knex.schema.dropTableIfExists('academic_class_enrollments');
  await knex.schema.dropTableIfExists('student_semester_registrations');
  await knex.schema.dropTableIfExists('academic_class_links');
  await knex.schema.dropTableIfExists('academic_class_coordinators');
  await knex.schema.dropTableIfExists('academic_class_subject_faculty');
  await knex.schema.dropTableIfExists('academic_class_subjects');
  await knex.schema.dropTableIfExists('academic_classes');

  const dropCols = [
    'reset_token_expires_at',
    'reset_token',
    'last_login_at',
    'profile_completed_at',
    'is_active',
    'class_section_id',
    'semester_id',
    'academic_year_id',
    'scheme_id',
    'program_id',
    'phone',
    'password_hash',
  ];
  for (const col of dropCols) {
    if (await knex.schema.hasColumn('students', col)) {
      await knex.schema.alterTable('students', (t) => {
        t.dropColumn(col);
      });
    }
  }
};
