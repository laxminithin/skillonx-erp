/**
 * Lesson Plan academic master, faculty plans, teaching calendar, and audit.
 * Reuses colleges, courses, subject_modules, academic_years, semesters, etc.
 * Does not alter quiz_bank_questions or survey tables.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const hasUnitKind = await knex.schema.hasColumn('subject_modules', 'unit_kind');
  if (!hasUnitKind) {
    await knex.schema.alterTable('subject_modules', (t) => {
      t.string('unit_kind', 16).nullable();
    });
  }

  await knex.schema.createTable('lesson_plan_import_batches', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.string('batch_id', 64).notNullable().unique();
    t.string('source_file', 512).nullable();
    t.json('report').nullable();
    t.boolean('dry_run').notNullable().defaultTo(false);
    t.integer('imported_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.timestamp('imported_at').notNullable().defaultTo(knex.fn.now());
    t.index(['college_id', 'imported_at']);
  });

  await knex.schema.createTable('lesson_topics', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('CASCADE');
    t.integer('module_id').unsigned().notNullable().references('id').inTable('subject_modules').onDelete('RESTRICT');
    t.string('name', 512).notNullable();
    t.string('normalized_name', 512).notNullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.string('source_file', 512).nullable();
    t.string('source_subject_name', 255).nullable();
    t.string('source_module_name', 255).nullable();
    t.integer('original_order').unsigned().nullable();
    t.string('import_batch', 64).nullable();
    t.timestamp('imported_at').nullable();
    t.timestamps(true, true);
    t.unique(['college_id', 'module_id', 'normalized_name']);
    t.index(['college_id', 'course_id', 'module_id']);
  });

  await knex.schema.createTable('lesson_subtopics', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('topic_id').unsigned().notNullable().references('id').inTable('lesson_topics').onDelete('CASCADE');
    t.text('name').notNullable();
    t.string('normalized_name', 512).notNullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.decimal('suggested_hours', 6, 2).nullable();
    t.string('hours_source', 32).notNullable().defaultTo('ESTIMATED');
    t.string('source_reference', 255).nullable();
    t.text('notes').nullable();
    t.string('classification', 32).notNullable().defaultTo('CORE');
    t.integer('original_order').unsigned().nullable();
    t.string('source_file', 512).nullable();
    t.string('source_module_name', 255).nullable();
    t.string('import_batch', 64).nullable();
    t.string('fingerprint', 64).notNullable();
    t.timestamp('imported_at').nullable();
    t.timestamps(true, true);
    t.unique(['college_id', 'fingerprint']);
    t.index(['college_id', 'topic_id']);
  });

  await knex.schema.createTable('academic_calendars', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('CASCADE');
    t.integer('semester_id').unsigned().nullable().references('id').inTable('semesters').onDelete('SET NULL');
    t.string('name', 255).notNullable();
    t.date('start_date').notNullable();
    t.date('end_date').notNullable();
    t.string('working_weekdays', 32).notNullable().defaultTo('1,2,3,4,5,6');
    t.boolean('is_default').notNullable().defaultTo(false);
    t.timestamps(true, true);
    t.index(['college_id', 'academic_year_id']);
  });

  await knex.schema.createTable('academic_calendar_exceptions', (t) => {
    t.increments('id').primary();
    t.integer('calendar_id').unsigned().notNullable().references('id').inTable('academic_calendars').onDelete('CASCADE');
    t.date('exception_date').notNullable();
    t.string('exception_type', 32).notNullable();
    t.string('label', 255).nullable();
    t.timestamps(true, true);
    t.unique(['calendar_id', 'exception_date']);
    t.index(['calendar_id', 'exception_type']);
  });

  await knex.schema.createTable('faculty_lesson_plans', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('created_by').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
    t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('RESTRICT');
    t.integer('academic_year_id').unsigned().nullable().references('id').inTable('academic_years').onDelete('SET NULL');
    t.integer('semester_id').unsigned().nullable().references('id').inTable('semesters').onDelete('SET NULL');
    t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
    t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
    t.integer('class_section_id').unsigned().nullable().references('id').inTable('class_sections').onDelete('SET NULL');
    t.integer('calendar_id').unsigned().nullable().references('id').inTable('academic_calendars').onDelete('SET NULL');
    t.string('title', 255).notNullable();
    t.string('status', 32).notNullable().defaultTo('DRAFT');
    t.boolean('include_supplementary').notNullable().defaultTo(false);
    t.boolean('continued_with_shortfall').notNullable().defaultTo(false);
    t.decimal('required_hours', 8, 2).notNullable().defaultTo(0);
    t.decimal('available_hours', 8, 2).notNullable().defaultTo(0);
    t.decimal('shortfall_hours', 8, 2).notNullable().defaultTo(0);
    t.timestamp('generated_at').nullable();
    t.timestamp('activated_at').nullable();
    t.timestamp('archived_at').nullable();
    t.timestamps(true, true);
    t.index(['college_id', 'created_by', 'status']);
    t.index(['college_id', 'course_id']);
  });

  await knex.schema.createTable('lesson_plan_teaching_slots', (t) => {
    t.increments('id').primary();
    t.integer('plan_id').unsigned().notNullable().references('id').inTable('faculty_lesson_plans').onDelete('CASCADE');
    t.integer('weekday').unsigned().notNullable();
    t.string('start_time', 8).notNullable();
    t.string('end_time', 8).notNullable();
    t.decimal('hours', 6, 2).notNullable().defaultTo(1);
    t.integer('sort_order').notNullable().defaultTo(0);
    t.timestamps(true, true);
    t.index(['plan_id', 'weekday', 'sort_order']);
  });

  await knex.schema.createTable('lesson_plan_entries', (t) => {
    t.increments('id').primary();
    t.integer('plan_id').unsigned().notNullable().references('id').inTable('faculty_lesson_plans').onDelete('CASCADE');
    t.integer('serial_no').unsigned().notNullable();
    t.integer('module_id').unsigned().nullable().references('id').inTable('subject_modules').onDelete('SET NULL');
    t.string('module_label', 64).nullable();
    t.string('module_name', 255).nullable();
    t.integer('topic_id').unsigned().nullable().references('id').inTable('lesson_topics').onDelete('SET NULL');
    t.string('topic_name', 512).notNullable();
    t.integer('subtopic_id').unsigned().nullable().references('id').inTable('lesson_subtopics').onDelete('SET NULL');
    t.text('subtopic_name').nullable();
    t.date('planned_date').nullable();
    t.date('actual_date').nullable();
    t.decimal('planned_hours', 6, 2).notNullable().defaultTo(1);
    t.decimal('actual_hours', 6, 2).nullable();
    t.string('status', 32).notNullable().defaultTo('PLANNED');
    t.text('remarks').nullable();
    t.string('teaching_method', 128).nullable();
    t.string('reschedule_reason', 512).nullable();
    t.boolean('is_supplementary').notNullable().defaultTo(false);
    t.boolean('is_faculty_added').notNullable().defaultTo(false);
    t.integer('split_from_entry_id').unsigned().nullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.timestamp('completed_at').nullable();
    t.integer('completed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.timestamps(true, true);
    t.index(['plan_id', 'serial_no']);
    t.index(['plan_id', 'actual_date']);
    t.index(['plan_id', 'status']);
  });

  await knex.schema.createTable('lesson_plan_audit_log', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('plan_id').unsigned().notNullable().references('id').inTable('faculty_lesson_plans').onDelete('CASCADE');
    t.integer('actor_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.string('actor_name', 255).nullable();
    t.string('action', 64).notNullable();
    t.json('metadata').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['plan_id', 'created_at']);
    t.index(['college_id', 'created_at']);
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('lesson_plan_audit_log');
  await knex.schema.dropTableIfExists('lesson_plan_entries');
  await knex.schema.dropTableIfExists('lesson_plan_teaching_slots');
  await knex.schema.dropTableIfExists('faculty_lesson_plans');
  await knex.schema.dropTableIfExists('academic_calendar_exceptions');
  await knex.schema.dropTableIfExists('academic_calendars');
  await knex.schema.dropTableIfExists('lesson_subtopics');
  await knex.schema.dropTableIfExists('lesson_topics');
  await knex.schema.dropTableIfExists('lesson_plan_import_batches');
  if (await knex.schema.hasColumn('subject_modules', 'unit_kind')) {
    await knex.schema.alterTable('subject_modules', (t) => {
      t.dropColumn('unit_kind');
    });
  }
};
