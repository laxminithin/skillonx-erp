/**
 * Quiz domain: subject modules, question bank, quizzes, attempts, results.
 * Separate from survey tables — historical attempts must remain gradeable
 * against the exact question snapshot the student received.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('subject_modules', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('CASCADE');
    t.string('name', 255).notNullable();
    t.string('code', 64).nullable();
    t.text('description').nullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.timestamps(true, true);
    t.unique(['college_id', 'course_id', 'name']);
    t.index(['college_id', 'course_id']);
  });

  await knex.schema.createTable('quiz_bank_questions', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('CASCADE');
    t.integer('module_id').unsigned().notNullable().references('id').inTable('subject_modules').onDelete('RESTRICT');
    t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.text('question_text').notNullable();
    t.string('question_type', 32).notNullable();
    t.decimal('marks', 8, 2).notNullable().defaultTo(1);
    t.string('difficulty', 16).nullable();
    t.text('explanation').nullable();
    t.string('source', 255).nullable();
    t.string('review_status', 32).notNullable().defaultTo('READY');
    t.text('review_notes').nullable();
    t.decimal('numeric_answer', 18, 6).nullable();
    t.decimal('numeric_tolerance', 18, 6).nullable();
    t.boolean('is_active').notNullable().defaultTo(true);
    t.string('normalized_text', 512).nullable();
    t.timestamps(true, true);
    t.index(['college_id', 'course_id', 'module_id']);
    t.index(['college_id', 'created_by']);
    t.index(['college_id', 'review_status']);
  });

  await knex.schema.createTable('quiz_bank_options', (t) => {
    t.increments('id').primary();
    t.integer('question_id').unsigned().notNullable().references('id').inTable('quiz_bank_questions').onDelete('CASCADE');
    t.string('label', 500).notNullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.boolean('is_correct').notNullable().defaultTo(false);
    t.timestamps(true, true);
    t.index(['question_id', 'sort_order']);
  });

  await knex.schema.createTable('quizzes', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('created_by').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
    t.string('title', 255).notNullable();
    t.text('description').nullable();
    t.text('instructions').nullable();
    t.integer('course_id').unsigned().nullable().references('id').inTable('courses').onDelete('SET NULL');
    t.integer('module_id').unsigned().nullable().references('id').inTable('subject_modules').onDelete('SET NULL');
    t.integer('academic_year_id').unsigned().nullable().references('id').inTable('academic_years').onDelete('SET NULL');
    t.integer('semester_id').unsigned().nullable().references('id').inTable('semesters').onDelete('SET NULL');
    t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
    t.integer('class_section_id').unsigned().nullable().references('id').inTable('class_sections').onDelete('SET NULL');
    t.integer('duration_minutes').unsigned().nullable();
    t.timestamp('start_at').nullable();
    t.timestamp('end_at').nullable();
    t.string('status', 32).notNullable().defaultTo('DRAFT');
    t.integer('attempts_allowed').unsigned().notNullable().defaultTo(1);
    t.boolean('shuffle_questions').notNullable().defaultTo(false);
    t.boolean('shuffle_options').notNullable().defaultTo(false);
    t.boolean('show_score_immediately').notNullable().defaultTo(true);
    t.string('show_correct_answers', 32).notNullable().defaultTo('AFTER_END');
    t.boolean('show_explanation').notNullable().defaultTo(true);
    t.decimal('pass_percentage', 5, 2).notNullable().defaultTo(40);
    t.json('random_selection').nullable();
    t.integer('duplicated_from_id').unsigned().nullable();
    t.timestamp('published_at').nullable();
    t.timestamp('closed_at').nullable();
    t.timestamp('archived_at').nullable();
    t.timestamp('deleted_at').nullable();
    t.boolean('structure_locked').notNullable().defaultTo(false);
    t.integer('structure_version').unsigned().notNullable().defaultTo(1);
    t.json('published_snapshot').nullable();
    t.timestamps(true, true);
    t.index(['college_id', 'status']);
    t.index(['college_id', 'created_by']);
    t.index(['college_id', 'course_id']);
  });

  await knex.schema.createTable('quiz_questions', (t) => {
    t.increments('id').primary();
    t.integer('quiz_id').unsigned().notNullable().references('id').inTable('quizzes').onDelete('CASCADE');
    t.integer('bank_question_id').unsigned().nullable().references('id').inTable('quiz_bank_questions').onDelete('SET NULL');
    t.integer('module_id').unsigned().nullable().references('id').inTable('subject_modules').onDelete('SET NULL');
    t.text('question_text').notNullable();
    t.string('question_type', 32).notNullable();
    t.decimal('marks', 8, 2).notNullable().defaultTo(1);
    t.string('difficulty', 16).nullable();
    t.text('explanation').nullable();
    t.decimal('numeric_answer', 18, 6).nullable();
    t.decimal('numeric_tolerance', 18, 6).nullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.timestamps(true, true);
    t.index(['quiz_id', 'sort_order']);
  });

  await knex.schema.createTable('quiz_question_options', (t) => {
    t.increments('id').primary();
    t.integer('quiz_question_id').unsigned().notNullable().references('id').inTable('quiz_questions').onDelete('CASCADE');
    t.string('label', 500).notNullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.boolean('is_correct').notNullable().defaultTo(false);
    t.timestamps(true, true);
    t.index(['quiz_question_id', 'sort_order']);
  });

  await knex.schema.createTable('quiz_links', (t) => {
    t.increments('id').primary();
    t.integer('quiz_id').unsigned().notNullable().references('id').inTable('quizzes').onDelete('CASCADE');
    t.string('code', 16).notNullable().unique();
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
    t.index(['quiz_id', 'is_active']);
  });

  await knex.schema.createTable('quiz_attempts', (t) => {
    t.increments('id').primary();
    t.integer('quiz_id').unsigned().notNullable().references('id').inTable('quizzes').onDelete('CASCADE');
    t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('RESTRICT');
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('attempt_number').unsigned().notNullable();
    t.string('public_token', 32).notNullable().unique();
    t.timestamp('started_at').notNullable();
    t.timestamp('expires_at').nullable();
    t.timestamp('submitted_at').nullable();
    t.string('status', 32).notNullable().defaultTo('IN_PROGRESS');
    t.decimal('obtained_marks', 10, 2).nullable();
    t.decimal('total_marks', 10, 2).nullable();
    t.decimal('percentage', 6, 2).nullable();
    t.boolean('passed').nullable();
    t.integer('time_taken_seconds').unsigned().nullable();
    t.boolean('needs_manual_grading').notNullable().defaultTo(false);
    t.json('question_snapshot').notNullable();
    t.string('ip_address', 64).nullable();
    t.string('device_information', 512).nullable();
    t.timestamps(true, true);
    t.unique(['quiz_id', 'student_id', 'attempt_number']);
    t.index(['quiz_id', 'student_id']);
    t.index(['quiz_id', 'status']);
    t.index(['college_id', 'submitted_at']);
  });

  await knex.schema.createTable('quiz_attempt_answers', (t) => {
    t.increments('id').primary();
    t.integer('attempt_id').unsigned().notNullable().references('id').inTable('quiz_attempts').onDelete('CASCADE');
    t.string('snapshot_question_id', 64).notNullable();
    t.json('selected_option_ids').nullable();
    t.decimal('numeric_answer', 18, 6).nullable();
    t.text('text_answer').nullable();
    t.decimal('awarded_marks', 8, 2).nullable();
    t.boolean('is_correct').nullable();
    t.boolean('needs_manual_grading').notNullable().defaultTo(false);
    t.timestamps(true, true);
    t.unique(['attempt_id', 'snapshot_question_id']);
  });

  await knex.schema.createTable('quiz_audit_log', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('quiz_id').unsigned().notNullable().references('id').inTable('quizzes').onDelete('CASCADE');
    t.integer('actor_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.string('actor_name', 255).nullable();
    t.string('action', 64).notNullable();
    t.json('metadata').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['quiz_id', 'created_at']);
    t.index(['college_id', 'created_at']);
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('quiz_audit_log');
  await knex.schema.dropTableIfExists('quiz_attempt_answers');
  await knex.schema.dropTableIfExists('quiz_attempts');
  await knex.schema.dropTableIfExists('quiz_links');
  await knex.schema.dropTableIfExists('quiz_question_options');
  await knex.schema.dropTableIfExists('quiz_questions');
  await knex.schema.dropTableIfExists('quizzes');
  await knex.schema.dropTableIfExists('quiz_bank_options');
  await knex.schema.dropTableIfExists('quiz_bank_questions');
  await knex.schema.dropTableIfExists('subject_modules');
};
