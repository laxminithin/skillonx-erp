/**
 * Assignment module (parallel to Quiz) + question→CO academic mapping
 * for both quiz and assignment banks.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  // ── Shared CO mapping columns on quiz bank / instance questions ──────────
  const addCoColumns = async (tableName) => {
    const has = await knex.schema.hasTable(tableName);
    if (!has) return;
    const hasPrimary = await knex.schema.hasColumn(tableName, 'primary_co_code');
    if (hasPrimary) return;
    await knex.schema.alterTable(tableName, (t) => {
      t.string('primary_co_code', 32).nullable();
      t.integer('primary_co_id').unsigned().nullable().references('id').inTable('course_outcomes').onDelete('SET NULL');
      t.json('secondary_co_codes').nullable();
      t.string('mapping_basis', 512).nullable();
      t.string('mapping_source', 255).nullable();
      t.string('verification_status', 32).nullable();
      t.boolean('co_mapping_blocked').notNullable().defaultTo(false);
      t.string('co_mapping_block_reason', 512).nullable();
      t.json('derived_outcomes_snapshot').nullable();
      t.index(['primary_co_code']);
    });
  };

  await addCoColumns('quiz_bank_questions');
  await addCoColumns('quiz_questions');

  // ── Assignment question bank ─────────────────────────────────────────────
  if (!(await knex.schema.hasTable('assignment_bank_questions'))) {
  await knex.schema.createTable('assignment_bank_questions', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('CASCADE');
    t.integer('module_id').unsigned().notNullable().references('id').inTable('subject_modules').onDelete('RESTRICT');
    t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.text('question_text').notNullable();
    t.string('question_type', 32).notNullable().defaultTo('DESCRIPTIVE');
    t.string('response_format', 32).notNullable().defaultTo('LONG_TEXT');
    t.decimal('marks', 8, 2).notNullable().defaultTo(10);
    t.string('difficulty', 16).nullable();
    t.text('expected_answer_guidance').nullable();
    t.json('evaluation_rubric').nullable();
    t.string('source', 255).nullable();
    t.string('review_status', 32).notNullable().defaultTo('READY');
    t.text('review_notes').nullable();
    t.boolean('is_active').notNullable().defaultTo(true);
    t.string('normalized_text', 512).nullable();
    t.string('source_file', 512).nullable();
    t.string('source_reference', 128).nullable();
    t.string('import_batch', 64).nullable();
    t.string('original_difficulty', 64).nullable();
    t.string('primary_co_code', 32).nullable();
    t.integer('primary_co_id').unsigned().nullable().references('id').inTable('course_outcomes').onDelete('SET NULL');
    t.json('secondary_co_codes').nullable();
    t.string('mapping_basis', 512).nullable();
    t.string('mapping_source', 255).nullable();
    t.string('verification_status', 32).nullable();
    t.boolean('co_mapping_blocked').notNullable().defaultTo(false);
    t.string('co_mapping_block_reason', 512).nullable();
    t.json('derived_outcomes_snapshot').nullable();
    t.timestamps(true, true);
    t.index(['college_id', 'course_id', 'module_id']);
    t.index(['college_id', 'created_by']);
    t.index(['college_id', 'review_status']);
    t.index(['primary_co_code']);
  });
  }

  if (!(await knex.schema.hasTable('assignment_question_co_links'))) {
  await knex.schema.createTable('assignment_question_co_links', (t) => {
    t.increments('id').primary();
    t.integer('bank_question_id').unsigned().notNullable().references('id').inTable('assignment_bank_questions').onDelete('CASCADE');
    t.integer('course_outcome_id').unsigned().notNullable().references('id').inTable('course_outcomes').onDelete('CASCADE');
    t.string('co_code', 32).notNullable();
    t.boolean('is_primary').notNullable().defaultTo(true);
    t.timestamps(true, true);
    t.unique(['bank_question_id', 'course_outcome_id'], { indexName: 'aq_co_link_uniq' });
  });
  } else {
    // Resume after partial migrate: ensure short unique exists
    const indexes = await knex.raw('SHOW INDEX FROM assignment_question_co_links');
    const names = new Set((indexes[0] || []).map((r) => r.Key_name));
    if (!names.has('aq_co_link_uniq')) {
      await knex.schema.alterTable('assignment_question_co_links', (t) => {
        t.unique(['bank_question_id', 'course_outcome_id'], { indexName: 'aq_co_link_uniq' });
      });
    }
  }

  if (!(await knex.schema.hasTable('quiz_question_co_links'))) {
  await knex.schema.createTable('quiz_question_co_links', (t) => {
    t.increments('id').primary();
    t.integer('bank_question_id').unsigned().notNullable().references('id').inTable('quiz_bank_questions').onDelete('CASCADE');
    t.integer('course_outcome_id').unsigned().notNullable().references('id').inTable('course_outcomes').onDelete('CASCADE');
    t.string('co_code', 32).notNullable();
    t.boolean('is_primary').notNullable().defaultTo(true);
    t.timestamps(true, true);
    t.unique(['bank_question_id', 'course_outcome_id'], { indexName: 'qq_co_link_uniq' });
  });
  }

  // ── Assignments (instances) ──────────────────────────────────────────────
  if (!(await knex.schema.hasTable('assignments'))) {
  await knex.schema.createTable('assignments', (t) => {
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
    t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
    t.timestamp('start_at').nullable();
    t.timestamp('due_at').nullable();
    t.boolean('late_submission_allowed').notNullable().defaultTo(false);
    t.timestamp('late_deadline_at').nullable();
    t.string('status', 32).notNullable().defaultTo('DRAFT');
    t.integer('attempts_allowed').unsigned().notNullable().defaultTo(1);
    t.boolean('show_marks_immediately').notNullable().defaultTo(false);
    t.boolean('show_feedback_after_evaluation').notNullable().defaultTo(true);
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
  }

  if (!(await knex.schema.hasTable('assignment_questions'))) {
  await knex.schema.createTable('assignment_questions', (t) => {
    t.increments('id').primary();
    t.integer('assignment_id').unsigned().notNullable().references('id').inTable('assignments').onDelete('CASCADE');
    t.integer('bank_question_id').unsigned().nullable().references('id').inTable('assignment_bank_questions').onDelete('SET NULL');
    t.integer('module_id').unsigned().nullable().references('id').inTable('subject_modules').onDelete('SET NULL');
    t.text('question_text').notNullable();
    t.string('question_type', 32).notNullable().defaultTo('DESCRIPTIVE');
    t.string('response_format', 32).notNullable().defaultTo('LONG_TEXT');
    t.decimal('marks', 8, 2).notNullable().defaultTo(10);
    t.string('difficulty', 16).nullable();
    t.text('expected_answer_guidance').nullable();
    t.json('evaluation_rubric').nullable();
    t.string('primary_co_code', 32).nullable();
    t.integer('primary_co_id').unsigned().nullable().references('id').inTable('course_outcomes').onDelete('SET NULL');
    t.json('secondary_co_codes').nullable();
    t.string('mapping_basis', 512).nullable();
    t.string('mapping_source', 255).nullable();
    t.string('verification_status', 32).nullable();
    t.json('derived_outcomes_snapshot').nullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.timestamps(true, true);
    t.index(['assignment_id', 'sort_order']);
  });
  }

  if (!(await knex.schema.hasTable('assignment_links'))) {
  await knex.schema.createTable('assignment_links', (t) => {
    t.increments('id').primary();
    t.integer('assignment_id').unsigned().notNullable().references('id').inTable('assignments').onDelete('CASCADE');
    t.string('code', 16).notNullable().unique({ indexName: 'asgn_link_code_uniq' });
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
    t.index(['assignment_id', 'is_active']);
  });
  }

  if (!(await knex.schema.hasTable('assignment_submissions'))) {
  await knex.schema.createTable('assignment_submissions', (t) => {
    t.increments('id').primary();
    t.integer('assignment_id').unsigned().notNullable().references('id').inTable('assignments').onDelete('CASCADE');
    t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('RESTRICT');
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('attempt_number').unsigned().notNullable().defaultTo(1);
    t.string('public_token', 32).notNullable().unique({ indexName: 'asgn_sub_token_uniq' });
    t.timestamp('started_at').notNullable();
    t.timestamp('submitted_at').nullable();
    t.string('status', 32).notNullable().defaultTo('IN_PROGRESS');
    t.boolean('is_late').notNullable().defaultTo(false);
    t.decimal('obtained_marks', 10, 2).nullable();
    t.decimal('total_marks', 10, 2).nullable();
    t.decimal('percentage', 6, 2).nullable();
    t.boolean('passed').nullable();
    t.string('evaluation_status', 32).notNullable().defaultTo('PENDING');
    t.integer('evaluated_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.timestamp('evaluated_at').nullable();
    t.boolean('results_released').notNullable().defaultTo(false);
    t.json('question_snapshot').notNullable();
    t.string('ip_address', 64).nullable();
    t.string('device_information', 512).nullable();
    t.timestamps(true, true);
    t.unique(['assignment_id', 'student_id', 'attempt_number'], { indexName: 'asgn_sub_attempt_uniq' });
    t.index(['assignment_id', 'student_id']);
    t.index(['assignment_id', 'status']);
    t.index(['college_id', 'submitted_at']);
  });
  }

  if (!(await knex.schema.hasTable('assignment_answers'))) {
  await knex.schema.createTable('assignment_answers', (t) => {
    t.increments('id').primary();
    t.integer('submission_id').unsigned().notNullable().references('id').inTable('assignment_submissions').onDelete('CASCADE');
    t.string('snapshot_question_id', 64).notNullable();
    t.text('text_answer').nullable();
    t.string('response_format', 32).nullable();
    t.integer('word_count').unsigned().nullable();
    t.decimal('awarded_marks', 8, 2).nullable();
    t.text('feedback').nullable();
    t.integer('evaluated_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.timestamp('evaluated_at').nullable();
    t.timestamps(true, true);
    t.unique(['submission_id', 'snapshot_question_id'], { indexName: 'asgn_ans_snap_uniq' });
  });
  }

  if (!(await knex.schema.hasTable('assignment_audit_log'))) {
  await knex.schema.createTable('assignment_audit_log', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('assignment_id').unsigned().notNullable().references('id').inTable('assignments').onDelete('CASCADE');
    t.integer('actor_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.string('actor_name', 255).nullable();
    t.string('action', 64).notNullable();
    t.json('metadata').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['assignment_id', 'created_at']);
    t.index(['college_id', 'created_at']);
  });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('assignment_audit_log');
  await knex.schema.dropTableIfExists('assignment_answers');
  await knex.schema.dropTableIfExists('assignment_submissions');
  await knex.schema.dropTableIfExists('assignment_links');
  await knex.schema.dropTableIfExists('assignment_questions');
  await knex.schema.dropTableIfExists('assignments');
  await knex.schema.dropTableIfExists('quiz_question_co_links');
  await knex.schema.dropTableIfExists('assignment_question_co_links');
  await knex.schema.dropTableIfExists('assignment_bank_questions');

  const dropCoColumns = async (tableName) => {
    if (!(await knex.schema.hasTable(tableName))) return;
    const cols = [
      'primary_co_code',
      'primary_co_id',
      'secondary_co_codes',
      'mapping_basis',
      'mapping_source',
      'verification_status',
      'co_mapping_blocked',
      'co_mapping_block_reason',
      'derived_outcomes_snapshot',
    ];
    for (const col of cols) {
      const has = await knex.schema.hasColumn(tableName, col);
      if (has) await knex.schema.alterTable(tableName, (t) => t.dropColumn(col));
    }
  };
  await dropCoColumns('quiz_questions');
  await dropCoColumns('quiz_bank_questions');
};
