/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('colleges', (t) => {
    t.increments('id').primary();
    t.string('name', 255).notNullable();
    t.string('code', 64).notNullable().unique();
    t.string('domain', 255).nullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('departments', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.string('name', 255).notNullable();
    t.string('code', 64).notNullable();
    t.timestamps(true, true);
    t.unique(['college_id', 'code']);
  });

  await knex.schema.createTable('faculty_users', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
    t.string('name', 255).notNullable();
    t.string('email', 255).notNullable();
    t.string('password_hash', 255).notNullable();
    t.string('role', 64).notNullable().defaultTo('FACULTY');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.string('reset_token', 255).nullable();
    t.timestamp('reset_token_expires_at').nullable();
    t.timestamps(true, true);
    t.unique(['college_id', 'email']);
  });

  await knex.schema.createTable('students', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
    t.string('name', 255).notNullable();
    t.string('usn', 64).notNullable();
    t.string('email', 255).notNullable();
    t.string('semester', 32).nullable();
    t.string('section', 32).nullable();
    t.timestamps(true, true);
    t.unique(['college_id', 'usn']);
  });

  await knex.schema.createTable('academic_years', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.string('label', 32).notNullable();
    t.boolean('is_current').notNullable().defaultTo(false);
    t.timestamps(true, true);
    t.unique(['college_id', 'label']);
  });

  await knex.schema.createTable('semesters', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.string('label', 32).notNullable();
    t.integer('number').unsigned().nullable();
    t.timestamps(true, true);
    t.unique(['college_id', 'label']);
  });

  await knex.schema.createTable('courses', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
    t.string('code', 64).notNullable();
    t.string('name', 255).notNullable();
    t.timestamps(true, true);
    t.unique(['college_id', 'code']);
  });

  await knex.schema.createTable('class_sections', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
    t.string('label', 32).notNullable();
    t.timestamps(true, true);
    t.unique(['college_id', 'department_id', 'label']);
  });

  await knex.schema.createTable('surveys', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('created_by').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
    t.string('title', 255).notNullable();
    t.text('description').nullable();
    t.string('survey_type', 64).notNullable().defaultTo('CUSTOM');
    t.integer('academic_year_id').unsigned().nullable().references('id').inTable('academic_years').onDelete('SET NULL');
    t.integer('semester_id').unsigned().nullable().references('id').inTable('semesters').onDelete('SET NULL');
    t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
    t.integer('course_id').unsigned().nullable().references('id').inTable('courses').onDelete('SET NULL');
    t.integer('subject_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.integer('class_section_id').unsigned().nullable().references('id').inTable('class_sections').onDelete('SET NULL');
    t.timestamp('start_at').nullable();
    t.timestamp('end_at').nullable();
    t.string('status', 32).notNullable().defaultTo('DRAFT');
    t.string('response_policy', 32).notNullable().defaultTo('ONE_PER_STUDENT');
    t.string('identity_mode', 32).notNullable().defaultTo('IDENTIFIED');
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
  });

  await knex.schema.createTable('survey_sections', (t) => {
    t.increments('id').primary();
    t.integer('survey_id').unsigned().notNullable().references('id').inTable('surveys').onDelete('CASCADE');
    t.string('title', 255).notNullable();
    t.text('description').nullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('questions', (t) => {
    t.increments('id').primary();
    t.integer('survey_id').unsigned().notNullable().references('id').inTable('surveys').onDelete('CASCADE');
    t.integer('section_id').unsigned().notNullable().references('id').inTable('survey_sections').onDelete('CASCADE');
    t.string('question_type', 64).notNullable();
    t.text('prompt').notNullable();
    t.text('help_text').nullable();
    t.boolean('is_required').notNullable().defaultTo(true);
    t.boolean('allow_comment').notNullable().defaultTo(false);
    t.integer('sort_order').notNullable().defaultTo(0);
    t.json('config').nullable();
    t.integer('question_bank_item_id').unsigned().nullable();
    t.integer('structure_version').unsigned().notNullable().defaultTo(1);
    t.timestamps(true, true);
    t.index(['survey_id', 'sort_order']);
  });

  await knex.schema.createTable('question_options', (t) => {
    t.increments('id').primary();
    t.integer('question_id').unsigned().notNullable().references('id').inTable('questions').onDelete('CASCADE');
    t.string('label', 255).notNullable();
    t.integer('value').nullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('survey_links', (t) => {
    t.increments('id').primary();
    t.integer('survey_id').unsigned().notNullable().references('id').inTable('surveys').onDelete('CASCADE');
    t.string('code', 16).notNullable().unique();
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('survey_submissions', (t) => {
    t.increments('id').primary();
    t.integer('survey_id').unsigned().notNullable().references('id').inTable('surveys').onDelete('CASCADE');
    t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('RESTRICT');
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.timestamp('started_at').notNullable();
    t.timestamp('submitted_at').nullable();
    t.string('status', 32).notNullable().defaultTo('STARTED');
    t.string('ip_address', 64).nullable();
    t.string('device_information', 512).nullable();
    t.integer('attempt_number').unsigned().notNullable().defaultTo(1);
    t.timestamps(true, true);
    t.index(['survey_id', 'student_id']);
    t.index(['survey_id', 'status']);
  });

  await knex.schema.createTable('survey_answers', (t) => {
    t.increments('id').primary();
    t.integer('submission_id').unsigned().notNullable().references('id').inTable('survey_submissions').onDelete('CASCADE');
    t.integer('question_id').unsigned().notNullable().references('id').inTable('questions').onDelete('CASCADE');
    t.text('text_answer').nullable();
    t.decimal('numeric_answer', 10, 2).nullable();
    t.integer('selected_option_id').unsigned().nullable().references('id').inTable('question_options').onDelete('SET NULL');
    t.json('json_answer').nullable();
    t.text('comment').nullable();
    t.integer('question_structure_version').unsigned().notNullable().defaultTo(1);
    t.timestamps(true, true);
    t.unique(['submission_id', 'question_id']);
  });

  await knex.schema.createTable('question_bank_items', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.string('question_type', 64).notNullable();
    t.text('prompt').notNullable();
    t.text('help_text').nullable();
    t.json('config').nullable();
    t.json('options').nullable();
    t.string('category', 64).nullable();
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('question_bank_tags', (t) => {
    t.increments('id').primary();
    t.integer('question_bank_item_id').unsigned().notNullable().references('id').inTable('question_bank_items').onDelete('CASCADE');
    t.string('tag', 64).notNullable();
    t.unique(['question_bank_item_id', 'tag']);
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('question_bank_tags');
  await knex.schema.dropTableIfExists('question_bank_items');
  await knex.schema.dropTableIfExists('survey_answers');
  await knex.schema.dropTableIfExists('survey_submissions');
  await knex.schema.dropTableIfExists('survey_links');
  await knex.schema.dropTableIfExists('question_options');
  await knex.schema.dropTableIfExists('questions');
  await knex.schema.dropTableIfExists('survey_sections');
  await knex.schema.dropTableIfExists('surveys');
  await knex.schema.dropTableIfExists('class_sections');
  await knex.schema.dropTableIfExists('courses');
  await knex.schema.dropTableIfExists('semesters');
  await knex.schema.dropTableIfExists('academic_years');
  await knex.schema.dropTableIfExists('students');
  await knex.schema.dropTableIfExists('faculty_users');
  await knex.schema.dropTableIfExists('departments');
  await knex.schema.dropTableIfExists('colleges');
};
