/**
 * Examination management + results layer.
 *
 * Reuses: academic_classes, courses, rooms, academic_calendar_events,
 * attendance_sessions, backlog_subject_registrations, assessment_mark_sheets.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('exam_policies'))) {
    await knex.schema.createTable('exam_policies', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('scheme_id').unsigned().nullable().references('id').inTable('academic_schemes').onDelete('CASCADE');
      t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('CASCADE');
      t.string('name', 128).notNullable();
      t.decimal('minimum_attendance_pct', 5, 2).notNullable().defaultTo(75);
      t.decimal('minimum_internal_marks', 6, 2).nullable();
      t.decimal('cie_maximum', 6, 2).notNullable().defaultTo(50);
      t.decimal('see_maximum', 6, 2).notNullable().defaultTo(50);
      t.decimal('pass_percentage', 5, 2).notNullable().defaultTo(40);
      t.decimal('minimum_see_score', 6, 2).nullable();
      t.string('internal_aggregation', 32).notNullable().defaultTo('WEIGHTED_SUM');
      t.json('cie_components').nullable();
      t.json('grade_bands').nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.integer('version').unsigned().notNullable().defaultTo(1);
      t.timestamps(true, true);
      t.index(['college_id', 'scheme_id', 'is_active'], 'expol_college_scheme_active_idx');
    });
  }

  if (!(await knex.schema.hasTable('examinations'))) {
    await knex.schema.createTable('examinations', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
      t.integer('semester_id').unsigned().notNullable().references('id').inTable('semesters').onDelete('RESTRICT');
      t.integer('scheme_id').unsigned().nullable().references('id').inTable('academic_schemes').onDelete('SET NULL');
      t.integer('exam_policy_id').unsigned().nullable().references('id').inTable('exam_policies').onDelete('SET NULL');
      t.string('exam_type', 32).notNullable();
      t.string('name', 255).notNullable();
      t.string('code', 64).notNullable();
      t.date('start_date').nullable();
      t.date('end_date').nullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'exam_college_code_unique' });
      t.index(['college_id', 'academic_year_id', 'semester_id', 'status'], 'exam_college_year_sem_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('examination_subjects'))) {
    await knex.schema.createTable('examination_subjects', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('exam_id').unsigned().notNullable().references('id').inTable('examinations').onDelete('CASCADE');
      t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('RESTRICT');
      t.integer('academic_class_id').unsigned().nullable().references('id').inTable('academic_classes').onDelete('SET NULL');
      t.decimal('maximum_marks', 6, 2).notNullable();
      t.decimal('minimum_pass_marks', 6, 2).nullable();
      t.integer('duration_minutes').unsigned().nullable();
      t.date('exam_date').nullable();
      t.time('start_time').nullable();
      t.time('end_time').nullable();
      t.string('room_allocation_mode', 32).notNullable().defaultTo('MANUAL');
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.boolean('seats_locked').notNullable().defaultTo(false);
      t.integer('calendar_event_id').unsigned().nullable();
      t.timestamps(true, true);
      t.unique(['exam_id', 'course_id', 'academic_class_id'], { indexName: 'exsub_exam_course_class_unique' });
      t.index(['college_id', 'exam_id'], 'exsub_college_exam_idx');
      t.index(['exam_date', 'start_time'], 'exsub_date_time_idx');
    });
  }

  if (!(await knex.schema.hasTable('exam_eligibility'))) {
    await knex.schema.createTable('exam_eligibility', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('exam_id').unsigned().notNullable().references('id').inTable('examinations').onDelete('CASCADE');
      t.integer('exam_subject_id').unsigned().notNullable().references('id').inTable('examination_subjects').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('RESTRICT');
      t.string('status', 32).notNullable().defaultTo('NOT_ELIGIBLE');
      t.string('reason_code', 64).nullable();
      t.text('reason_detail').nullable();
      t.decimal('attendance_pct', 5, 2).nullable();
      t.decimal('internal_marks', 6, 2).nullable();
      t.decimal('internal_max', 6, 2).nullable();
      t.integer('condoned_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('condoned_at').nullable();
      t.text('condone_reason').nullable();
      t.timestamps(true, true);
      t.unique(['exam_subject_id', 'student_id'], { indexName: 'exelig_subject_student_unique' });
      t.index(['college_id', 'exam_id', 'student_id'], 'exelig_college_exam_student_idx');
      t.index(['college_id', 'status'], 'exelig_college_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('exam_room_allocations'))) {
    await knex.schema.createTable('exam_room_allocations', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('exam_subject_id').unsigned().notNullable().references('id').inTable('examination_subjects').onDelete('CASCADE');
      t.integer('room_id').unsigned().notNullable().references('id').inTable('rooms').onDelete('RESTRICT');
      t.integer('capacity').unsigned().notNullable();
      t.integer('assigned_count').unsigned().notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.unique(['exam_subject_id', 'room_id'], { indexName: 'exroom_subject_room_unique' });
      t.index(['college_id', 'exam_subject_id'], 'exroom_college_subject_idx');
    });
  }

  if (!(await knex.schema.hasTable('exam_student_seats'))) {
    await knex.schema.createTable('exam_student_seats', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('exam_subject_id').unsigned().notNullable().references('id').inTable('examination_subjects').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('room_id').unsigned().notNullable().references('id').inTable('rooms').onDelete('RESTRICT');
      t.integer('room_allocation_id').unsigned().nullable().references('id').inTable('exam_room_allocations').onDelete('SET NULL');
      t.string('seat_number', 16).nullable();
      t.string('register_number', 64).nullable();
      t.timestamps(true, true);
      t.unique(['exam_subject_id', 'student_id'], { indexName: 'exseat_subject_student_unique' });
      t.index(['college_id', 'exam_subject_id', 'room_id'], 'exseat_college_subject_room_idx');
    });
  }

  if (!(await knex.schema.hasTable('exam_invigilation_duties'))) {
    await knex.schema.createTable('exam_invigilation_duties', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('exam_subject_id').unsigned().notNullable().references('id').inTable('examination_subjects').onDelete('CASCADE');
      t.integer('room_id').unsigned().nullable().references('id').inTable('rooms').onDelete('SET NULL');
      t.integer('faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      t.string('role', 32).notNullable().defaultTo('INVIGILATOR');
      t.date('duty_date').nullable();
      t.time('start_time').nullable();
      t.time('end_time').nullable();
      t.integer('calendar_event_id').unsigned().nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'faculty_id', 'duty_date'], 'exinv_college_faculty_date_idx');
      t.index(['exam_subject_id', 'room_id'], 'exinv_subject_room_idx');
    });
  }

  if (!(await knex.schema.hasTable('exam_marks_sheets'))) {
    await knex.schema.createTable('exam_marks_sheets', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('exam_subject_id').unsigned().notNullable().references('id').inTable('examination_subjects').onDelete('CASCADE');
      t.integer('faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.boolean('locked').notNullable().defaultTo(false);
      t.integer('submitted_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('submitted_at').nullable();
      t.integer('verified_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('verified_at').nullable();
      t.integer('locked_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('locked_at').nullable();
      t.string('marks_source', 32).notNullable().defaultTo('INSTITUTION');
      t.timestamps(true, true);
      t.unique(['exam_subject_id'], { indexName: 'exmsheet_subject_unique' });
      t.index(['college_id', 'status'], 'exmsheet_college_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('exam_marks'))) {
    await knex.schema.createTable('exam_marks', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('marks_sheet_id').unsigned().notNullable().references('id').inTable('exam_marks_sheets').onDelete('CASCADE');
      t.integer('exam_subject_id').unsigned().notNullable().references('id').inTable('examination_subjects').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.decimal('marks', 6, 2).nullable();
      t.string('status', 32).notNullable().defaultTo('PRESENT');
      t.decimal('internal_marks', 6, 2).nullable();
      t.string('internal_source', 32).nullable();
      t.timestamps(true, true);
      t.unique(['marks_sheet_id', 'student_id'], { indexName: 'exmark_sheet_student_unique' });
      t.index(['college_id', 'exam_subject_id'], 'exmark_college_subject_idx');
      t.index(['student_id'], 'exmark_student_idx');
    });
  }

  if (!(await knex.schema.hasTable('exam_marks_adjustments'))) {
    await knex.schema.createTable('exam_marks_adjustments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('exam_mark_id').unsigned().notNullable().references('id').inTable('exam_marks').onDelete('CASCADE');
      t.decimal('original_marks', 6, 2).nullable();
      t.decimal('adjusted_marks', 6, 2).nullable();
      t.text('reason').notNullable();
      t.integer('approved_by').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.timestamps(true, true);
      t.index(['college_id', 'exam_mark_id'], 'exadj_college_mark_idx');
    });
  }

  if (!(await knex.schema.hasTable('semester_results'))) {
    await knex.schema.createTable('semester_results', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('exam_id').unsigned().notNullable().references('id').inTable('examinations').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.integer('semester_id').unsigned().notNullable().references('id').inTable('semesters').onDelete('RESTRICT');
      t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
      t.decimal('sgpa', 4, 2).nullable();
      t.decimal('total_credits', 6, 2).nullable();
      t.decimal('earned_credits', 6, 2).nullable();
      t.string('status', 32).notNullable().defaultTo('INCOMPLETE');
      t.integer('result_version').unsigned().notNullable().defaultTo(1);
      t.boolean('published').notNullable().defaultTo(false);
      t.timestamp('published_at').nullable();
      t.integer('published_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('exam_policy_id').unsigned().nullable().references('id').inTable('exam_policies').onDelete('SET NULL');
      t.json('grade_bands_snapshot').nullable();
      t.timestamps(true, true);
      t.unique(['student_id', 'exam_id', 'result_version'], { indexName: 'semres_student_exam_version_unique' });
      t.index(['college_id', 'exam_id', 'published'], 'semres_college_exam_pub_idx');
      t.index(['student_id', 'semester_id'], 'semres_student_sem_idx');
    });
  }

  if (!(await knex.schema.hasTable('subject_results'))) {
    await knex.schema.createTable('subject_results', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('semester_result_id').unsigned().notNullable().references('id').inTable('semester_results').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('RESTRICT');
      t.integer('exam_subject_id').unsigned().nullable().references('id').inTable('examination_subjects').onDelete('SET NULL');
      t.decimal('internal_marks', 6, 2).nullable();
      t.decimal('external_marks', 6, 2).nullable();
      t.decimal('total_marks', 6, 2).nullable();
      t.decimal('max_marks', 6, 2).nullable();
      t.string('grade', 8).nullable();
      t.decimal('grade_points', 4, 2).nullable();
      t.decimal('credits', 4, 2).nullable();
      t.string('result_status', 32).notNullable().defaultTo('INCOMPLETE');
      t.string('marks_source', 32).notNullable().defaultTo('INSTITUTION');
      t.timestamps(true, true);
      t.unique(['semester_result_id', 'course_id'], { indexName: 'subres_sem_course_unique' });
      t.index(['college_id', 'student_id', 'course_id'], 'subres_college_student_course_idx');
    });
  }

  if (!(await knex.schema.hasTable('student_academic_records'))) {
    await knex.schema.createTable('student_academic_records', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('semester_id').unsigned().notNullable().references('id').inTable('semesters').onDelete('RESTRICT');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.integer('semester_result_id').unsigned().nullable().references('id').inTable('semester_results').onDelete('SET NULL');
      t.decimal('sgpa', 4, 2).nullable();
      t.decimal('credits_earned', 6, 2).nullable();
      t.string('status', 32).notNullable().defaultTo('IN_PROGRESS');
      t.timestamps(true, true);
      t.unique(['student_id', 'semester_id', 'academic_year_id'], { indexName: 'sacrec_student_sem_year_unique' });
      t.index(['college_id', 'student_id'], 'sacrec_college_student_idx');
    });
  }

  if (!(await knex.schema.hasTable('exam_revaluation_requests'))) {
    await knex.schema.createTable('exam_revaluation_requests', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('subject_result_id').unsigned().notNullable().references('id').inTable('subject_results').onDelete('CASCADE');
      t.string('request_type', 32).notNullable();
      t.string('status', 32).notNullable().defaultTo('REQUESTED');
      t.text('reason').nullable();
      t.integer('processed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('processed_at').nullable();
      t.text('admin_notes').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'student_id', 'status'], 'exrev_college_student_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('examination_audit_log'))) {
    await knex.schema.createTable('examination_audit_log', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('actor_id').unsigned().nullable();
      t.string('actor_type', 16).notNullable().defaultTo('FACULTY');
      t.string('actor_name', 255).nullable();
      t.string('action', 64).notNullable();
      t.string('entity_type', 64).notNullable();
      t.integer('entity_id').unsigned().nullable();
      t.json('before_state').nullable();
      t.json('after_state').nullable();
      t.text('reason').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['college_id', 'entity_type', 'entity_id'], 'exaudit_college_entity_idx');
      t.index(['college_id', 'action', 'created_at'], 'exaudit_college_action_idx');
    });
  }

  if (await knex.schema.hasTable('rooms')) {
    if (!(await knex.schema.hasColumn('rooms', 'exam_seating_capacity'))) {
      await knex.schema.alterTable('rooms', (t) => {
        t.integer('exam_seating_capacity').unsigned().nullable();
      });
    }
  }
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('examination_audit_log');
  await knex.schema.dropTableIfExists('exam_revaluation_requests');
  await knex.schema.dropTableIfExists('student_academic_records');
  await knex.schema.dropTableIfExists('subject_results');
  await knex.schema.dropTableIfExists('semester_results');
  await knex.schema.dropTableIfExists('exam_marks_adjustments');
  await knex.schema.dropTableIfExists('exam_marks');
  await knex.schema.dropTableIfExists('exam_marks_sheets');
  await knex.schema.dropTableIfExists('exam_invigilation_duties');
  await knex.schema.dropTableIfExists('exam_student_seats');
  await knex.schema.dropTableIfExists('exam_room_allocations');
  await knex.schema.dropTableIfExists('exam_eligibility');
  await knex.schema.dropTableIfExists('examination_subjects');
  await knex.schema.dropTableIfExists('examinations');
  await knex.schema.dropTableIfExists('exam_policies');
  if (await knex.schema.hasColumn('rooms', 'exam_seating_capacity')) {
    await knex.schema.alterTable('rooms', (t) => {
      t.dropColumn('exam_seating_capacity');
    });
  }
};
