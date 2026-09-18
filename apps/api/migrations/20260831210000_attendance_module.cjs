/**
 * Attendance module for class-derived rolls.
 *
 * Additive only. Sessions attach to AcademicClass + subject (course).
 * Student list comes from approved class enrollments — not subject enrollments.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('college_attendance_policies'))) {
    await knex.schema.createTable('college_attendance_policies', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.decimal('minimum_percentage', 5, 2).notNullable().defaultTo(85);
      t.boolean('count_late_as_present').notNullable().defaultTo(true);
      t.boolean('count_excused_in_denominator').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id'], { indexName: 'cap_college_unique' });
    });
  }

  if (!(await knex.schema.hasTable('attendance_sessions'))) {
    await knex.schema.createTable('attendance_sessions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('academic_class_id').unsigned().notNullable().references('id').inTable('academic_classes').onDelete('CASCADE');
      t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('CASCADE');
      t.integer('faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.integer('academic_year_id').unsigned().nullable().references('id').inTable('academic_years').onDelete('SET NULL');
      t.integer('semester_id').unsigned().nullable().references('id').inTable('semesters').onDelete('SET NULL');
      t.date('session_date').notNullable();
      t.integer('period_number').unsigned().nullable();
      t.time('start_time').nullable();
      t.time('end_time').nullable();
      t.integer('lesson_plan_entry_id').unsigned().nullable();
      t.integer('topic_id').unsigned().nullable().references('id').inTable('lesson_topics').onDelete('SET NULL');
      t.string('topic_label', 255).nullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('completed_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'academic_class_id', 'course_id', 'session_date'], 'as_class_course_date_idx');
      t.index(['college_id', 'course_id', 'status'], 'as_course_status_idx');
      t.index(['college_id', 'faculty_id', 'session_date'], 'as_faculty_date_idx');
      t.unique(['academic_class_id', 'course_id', 'session_date', 'period_number'], {
        indexName: 'as_class_course_date_period_unique',
      });
    });
  }

  if (!(await knex.schema.hasTable('attendance_records'))) {
    await knex.schema.createTable('attendance_records', (t) => {
      t.increments('id').primary();
      t.integer('attendance_session_id').unsigned().notNullable().references('id').inTable('attendance_sessions').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.string('status', 16).notNullable().defaultTo('PRESENT');
      t.string('remarks', 500).nullable();
      t.timestamp('marked_at').nullable();
      t.integer('marked_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['attendance_session_id', 'student_id'], { indexName: 'ar_session_student_unique' });
      t.index(['college_id', 'student_id', 'status'], 'ar_student_status_idx');
      t.index(['attendance_session_id', 'status'], 'ar_session_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('attendance_record_audits'))) {
    await knex.schema.createTable('attendance_record_audits', (t) => {
      t.increments('id').primary();
      t.integer('attendance_record_id').unsigned().notNullable().references('id').inTable('attendance_records').onDelete('CASCADE');
      t.integer('attendance_session_id').unsigned().notNullable().references('id').inTable('attendance_sessions').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.string('from_status', 16).nullable();
      t.string('to_status', 16).notNullable();
      t.string('reason', 500).nullable();
      t.integer('changed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('changed_at').notNullable().defaultTo(knex.fn.now());
      t.index(['attendance_session_id', 'student_id'], 'ara_session_student_idx');
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('attendance_record_audits');
  await knex.schema.dropTableIfExists('attendance_records');
  await knex.schema.dropTableIfExists('attendance_sessions');
  await knex.schema.dropTableIfExists('college_attendance_policies');
};
