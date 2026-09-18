/**
 * Academic timetable + calendar scheduling layer.
 *
 * Reuses AcademicClass, class subjects, faculty mappings, academic_calendars,
 * and attendance_sessions. Does not duplicate class/subject/semester masters.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('rooms'))) {
    await knex.schema.createTable('rooms', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('name', 128).notNullable();
      t.string('code', 64).notNullable();
      t.string('building', 128).nullable();
      t.string('floor', 32).nullable();
      t.string('type', 32).notNullable().defaultTo('CLASSROOM');
      t.integer('capacity').unsigned().nullable();
      t.string('status', 32).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'rooms_college_code_unique' });
      t.index(['college_id', 'type', 'status'], 'rooms_college_type_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('timetable_periods'))) {
    await knex.schema.createTable('timetable_periods', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().nullable().references('id').inTable('academic_years').onDelete('SET NULL');
      t.string('name', 64).notNullable();
      t.integer('period_number').unsigned().nullable();
      t.time('start_time').notNullable();
      t.time('end_time').notNullable();
      t.string('kind', 16).notNullable().defaultTo('PERIOD');
      t.integer('sort_order').notNullable().defaultTo(0);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.index(['college_id', 'academic_year_id', 'is_active'], 'ttp_college_year_active_idx');
      t.index(['college_id', 'sort_order'], 'ttp_college_sort_idx');
    });
  }

  if (!(await knex.schema.hasTable('academic_class_batches'))) {
    await knex.schema.createTable('academic_class_batches', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('academic_class_id').unsigned().notNullable().references('id').inTable('academic_classes').onDelete('CASCADE');
      t.string('name', 64).notNullable();
      t.string('code', 32).notNullable();
      t.integer('sort_order').notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.unique(['academic_class_id', 'code'], { indexName: 'acb_class_code_unique' });
      t.index(['college_id', 'academic_class_id'], 'acb_college_class_idx');
    });
  }

  if (!(await knex.schema.hasTable('academic_class_batch_members'))) {
    await knex.schema.createTable('academic_class_batch_members', (t) => {
      t.increments('id').primary();
      t.integer('batch_id').unsigned().notNullable().references('id').inTable('academic_class_batches').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.timestamps(true, true);
      t.unique(['batch_id', 'student_id'], { indexName: 'acbm_batch_student_unique' });
      t.index(['student_id'], 'acbm_student_idx');
    });
  }

  if (!(await knex.schema.hasTable('timetable_slots'))) {
    await knex.schema.createTable('timetable_slots', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('academic_class_id').unsigned().notNullable().references('id').inTable('academic_classes').onDelete('CASCADE');
      t.integer('class_subject_id').unsigned().notNullable().references('id').inTable('academic_class_subjects').onDelete('CASCADE');
      t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('CASCADE');
      t.integer('faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('room_id').unsigned().nullable().references('id').inTable('rooms').onDelete('SET NULL');
      t.integer('batch_id').unsigned().nullable().references('id').inTable('academic_class_batches').onDelete('SET NULL');
      t.integer('start_period_id').unsigned().nullable().references('id').inTable('timetable_periods').onDelete('SET NULL');
      t.integer('end_period_id').unsigned().nullable().references('id').inTable('timetable_periods').onDelete('SET NULL');
      t.integer('start_period_number').unsigned().nullable();
      t.integer('end_period_number').unsigned().nullable();
      t.integer('day_of_week').unsigned().notNullable();
      t.time('start_time').notNullable();
      t.time('end_time').notNullable();
      t.date('effective_from').notNullable();
      t.date('effective_to').nullable();
      t.string('status', 32).notNullable().defaultTo('ACTIVE');
      t.string('kind', 16).notNullable().defaultTo('REGULAR');
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'academic_class_id', 'day_of_week', 'status'], 'tts_class_day_status_idx');
      t.index(['college_id', 'faculty_id', 'day_of_week', 'status'], 'tts_faculty_day_status_idx');
      t.index(['college_id', 'room_id', 'day_of_week', 'status'], 'tts_room_day_status_idx');
      t.index(['college_id', 'effective_from', 'effective_to'], 'tts_effective_range_idx');
      t.index(['college_id', 'course_id', 'status'], 'tts_course_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('timetable_slot_faculty'))) {
    await knex.schema.createTable('timetable_slot_faculty', (t) => {
      t.increments('id').primary();
      t.integer('slot_id').unsigned().notNullable().references('id').inTable('timetable_slots').onDelete('CASCADE');
      t.integer('faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      t.boolean('is_primary').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['slot_id', 'faculty_id'], { indexName: 'tsf_slot_faculty_unique' });
      t.index(['faculty_id'], 'tsf_faculty_idx');
    });
  }

  if (!(await knex.schema.hasTable('timetable_overrides'))) {
    await knex.schema.createTable('timetable_overrides', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('timetable_slot_id').unsigned().nullable().references('id').inTable('timetable_slots').onDelete('SET NULL');
      t.integer('academic_class_id').unsigned().notNullable().references('id').inTable('academic_classes').onDelete('CASCADE');
      t.integer('class_subject_id').unsigned().nullable().references('id').inTable('academic_class_subjects').onDelete('SET NULL');
      t.integer('course_id').unsigned().nullable().references('id').inTable('courses').onDelete('SET NULL');
      t.integer('batch_id').unsigned().nullable().references('id').inTable('academic_class_batches').onDelete('SET NULL');
      t.date('override_date').notNullable();
      t.string('kind', 32).notNullable();
      t.integer('original_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('substitute_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('room_id').unsigned().nullable().references('id').inTable('rooms').onDelete('SET NULL');
      t.integer('start_period_id').unsigned().nullable().references('id').inTable('timetable_periods').onDelete('SET NULL');
      t.integer('end_period_id').unsigned().nullable().references('id').inTable('timetable_periods').onDelete('SET NULL');
      t.integer('start_period_number').unsigned().nullable();
      t.integer('end_period_number').unsigned().nullable();
      t.time('start_time').nullable();
      t.time('end_time').nullable();
      t.string('reason', 500).nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('cancelled_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('cancelled_at').nullable();
      t.string('status', 32).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.index(['college_id', 'academic_class_id', 'override_date'], 'tto_class_date_idx');
      t.index(['college_id', 'timetable_slot_id', 'override_date'], 'tto_slot_date_idx');
      t.index(['college_id', 'faculty_id', 'override_date'], 'tto_faculty_date_idx');
      t.index(['college_id', 'substitute_faculty_id', 'override_date'], 'tto_sub_date_idx');
      t.index(['college_id', 'room_id', 'override_date'], 'tto_room_date_idx');
      t.index(['college_id', 'kind', 'status'], 'tto_kind_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('academic_calendar_events'))) {
    await knex.schema.createTable('academic_calendar_events', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('calendar_id').unsigned().nullable().references('id').inTable('academic_calendars').onDelete('SET NULL');
      t.integer('academic_year_id').unsigned().nullable().references('id').inTable('academic_years').onDelete('SET NULL');
      t.integer('semester_id').unsigned().nullable().references('id').inTable('semesters').onDelete('SET NULL');
      t.string('event_type', 32).notNullable();
      t.string('title', 255).notNullable();
      t.date('start_date').notNullable();
      t.date('end_date').notNullable();
      t.boolean('blocks_teaching').notNullable().defaultTo(false);
      t.text('notes').nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'academic_year_id', 'start_date', 'end_date'], 'acev_college_year_range_idx');
      t.index(['college_id', 'event_type', 'start_date'], 'acev_type_date_idx');
      t.index(['calendar_id', 'start_date'], 'acev_calendar_date_idx');
    });
  }

  if (await knex.schema.hasTable('attendance_sessions')) {
    if (!(await knex.schema.hasColumn('attendance_sessions', 'timetable_slot_id'))) {
      await knex.schema.alterTable('attendance_sessions', (t) => {
        t.integer('timetable_slot_id').unsigned().nullable().references('id').inTable('timetable_slots').onDelete('SET NULL');
        t.index(['college_id', 'timetable_slot_id', 'session_date'], 'as_slot_date_idx');
      });
    }
    if (!(await knex.schema.hasColumn('attendance_sessions', 'timetable_override_id'))) {
      await knex.schema.alterTable('attendance_sessions', (t) => {
        t.integer('timetable_override_id').unsigned().nullable().references('id').inTable('timetable_overrides').onDelete('SET NULL');
      });
    }
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  if (await knex.schema.hasTable('attendance_sessions')) {
    if (await knex.schema.hasColumn('attendance_sessions', 'timetable_override_id')) {
      await knex.schema.alterTable('attendance_sessions', (t) => t.dropColumn('timetable_override_id'));
    }
    if (await knex.schema.hasColumn('attendance_sessions', 'timetable_slot_id')) {
      await knex.schema.alterTable('attendance_sessions', (t) => t.dropColumn('timetable_slot_id'));
    }
  }
  await knex.schema.dropTableIfExists('academic_calendar_events');
  await knex.schema.dropTableIfExists('timetable_overrides');
  await knex.schema.dropTableIfExists('timetable_slot_faculty');
  await knex.schema.dropTableIfExists('timetable_slots');
  await knex.schema.dropTableIfExists('academic_class_batch_members');
  await knex.schema.dropTableIfExists('academic_class_batches');
  await knex.schema.dropTableIfExists('timetable_periods');
  await knex.schema.dropTableIfExists('rooms');
};
