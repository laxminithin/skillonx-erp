/**
 * Previous-year question paper library + faculty-owned internal question papers.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('qp_import_batches'))) {
    await knex.schema.createTable('qp_import_batches', (t) => {
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
  }

  if (!(await knex.schema.hasTable('previous_year_source_files'))) {
    await knex.schema.createTable('previous_year_source_files', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('relative_path', 512).notNullable();
      t.string('file_name', 512).notNullable();
      t.string('folder', 255).nullable();
      t.string('program_hint', 128).nullable();
      t.string('source_type', 32).notNullable();
      t.bigInteger('byte_size').unsigned().nullable();
      t.integer('page_count').unsigned().nullable();
      t.string('extraction_status', 64).notNullable().defaultTo('EXTRACTED');
      t.integer('paper_count').unsigned().notNullable().defaultTo(0);
      t.boolean('ocr_required').notNullable().defaultTo(false);
      t.text('notes').nullable();
      t.string('import_batch', 64).nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'relative_path'], 'pysf_college_path_uid');
    });
  }

  if (!(await knex.schema.hasTable('previous_year_papers'))) {
    await knex.schema.createTable('previous_year_papers', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('paper_id', 128).notNullable();
      t.integer('course_id').unsigned().nullable().references('id').inTable('courses').onDelete('SET NULL');
      t.string('subject_name', 255).nullable();
      t.string('course_code', 64).nullable();
      t.string('scheme_label', 64).nullable();
      t.string('program_name', 128).nullable();
      t.string('semester_label', 32).nullable();
      t.string('exam_type', 32).notNullable().defaultTo('SEE');
      t.string('academic_year', 32).nullable();
      t.string('exam_month', 16).nullable();
      t.integer('exam_year').unsigned().nullable();
      t.string('exam_date', 128).nullable();
      t.decimal('max_marks', 10, 2).nullable();
      t.integer('duration_minutes').unsigned().nullable();
      t.string('university', 255).nullable();
      t.string('source_file', 1024).notNullable();
      t.string('source_type', 32).notNullable().defaultTo('PDF');
      t.integer('source_file_id').unsigned().nullable().references('id').inTable('previous_year_source_files').onDelete('SET NULL');
      t.integer('start_page').unsigned().nullable();
      t.integer('end_page').unsigned().nullable();
      t.string('extraction_status', 64).notNullable().defaultTo('EXTRACTED');
      t.string('verification_status', 64).nullable();
      t.text('notes').nullable();
      t.integer('question_count').unsigned().notNullable().defaultTo(0);
      t.string('import_batch', 64).nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'paper_id'], 'pyp_college_paper_uid');
      t.index(['college_id', 'course_code']);
      t.index(['college_id', 'course_id']);
      t.index(['college_id', 'exam_year']);
    });
  }

  if (!(await knex.schema.hasTable('previous_year_questions'))) {
    await knex.schema.createTable('previous_year_questions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('paper_id').unsigned().notNullable().references('id').inTable('previous_year_papers').onDelete('CASCADE');
      t.string('question_id', 160).notNullable();
      t.integer('parent_id').unsigned().nullable().references('id').inTable('previous_year_questions').onDelete('CASCADE');
      t.integer('question_number').unsigned().notNullable();
      t.string('sub_letter', 8).nullable();
      t.string('section', 64).nullable();
      t.text('question_text').notNullable();
      t.string('question_type', 32).notNullable().defaultTo('DESCRIPTIVE');
      t.decimal('max_marks', 10, 2).nullable();
      t.boolean('marks_missing').notNullable().defaultTo(false);
      t.string('module_or_unit', 255).nullable();
      t.integer('module_id').unsigned().nullable().references('id').inTable('subject_modules').onDelete('SET NULL');
      t.string('primary_co_code', 32).nullable();
      t.integer('primary_co_id').unsigned().nullable();
      t.string('difficulty', 16).nullable();
      t.string('bloom_level', 32).nullable();
      t.boolean('is_or_choice').notNullable().defaultTo(false);
      t.string('or_group_id', 64).nullable();
      t.integer('source_page').unsigned().nullable();
      t.string('source_reference', 512).nullable();
      t.string('mapping_basis', 512).nullable();
      t.string('verification_status', 64).nullable();
      t.boolean('co_mapping_blocked').notNullable().defaultTo(false);
      t.json('derived_outcomes_snapshot').nullable();
      t.string('fingerprint', 64).nullable();
      t.text('notes').nullable();
      t.string('import_batch', 64).nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'question_id'], 'pyq_college_qid_uid');
      t.index(['college_id', 'paper_id']);
      t.index(['college_id', 'fingerprint']);
      t.index(['college_id', 'primary_co_code']);
      t.index(['college_id', 'module_id']);
    });
  }

  if (!(await knex.schema.hasTable('previous_year_question_co_links'))) {
    await knex.schema.createTable('previous_year_question_co_links', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('question_row_id').unsigned().notNullable().references('id').inTable('previous_year_questions').onDelete('CASCADE');
      t.string('co_code', 32).notNullable();
      t.string('role', 32).notNullable().defaultTo('PRIMARY');
      t.string('provenance', 64).notNullable().defaultTo('DERIVED_FROM_CO_MAPPING');
      t.timestamps(true, true);
      t.unique(['question_row_id', 'co_code', 'role'], 'pyqco_unique');
    });
  }

  if (!(await knex.schema.hasTable('qp_review_queue'))) {
    await knex.schema.createTable('qp_review_queue', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('review_id', 64).notNullable();
      t.string('issue_type', 64).notNullable();
      t.text('reason').nullable();
      t.string('paper_id', 128).nullable();
      t.string('question_ref', 64).nullable();
      t.string('source_file', 1024).nullable();
      t.integer('source_page').unsigned().nullable();
      t.string('priority', 16).nullable();
      t.string('review_status', 32).notNullable().defaultTo('NEEDS_REVIEW');
      t.string('import_batch', 64).nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'review_id'], 'qprq_college_rid_uid');
    });
  }

  if (!(await knex.schema.hasTable('internal_question_papers'))) {
    await knex.schema.createTable('internal_question_papers', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('created_by').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('RESTRICT');
      t.integer('academic_year_id').unsigned().nullable().references('id').inTable('academic_years').onDelete('SET NULL');
      t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
      t.integer('semester_id').unsigned().nullable().references('id').inTable('semesters').onDelete('SET NULL');
      t.integer('class_section_id').unsigned().nullable().references('id').inTable('class_sections').onDelete('SET NULL');
      t.integer('scheme_id').unsigned().nullable().references('id').inTable('academic_schemes').onDelete('SET NULL');
      t.string('subject_name', 255).nullable();
      t.string('course_code', 64).nullable();
      t.string('scheme_label', 64).nullable();
      t.string('program_name', 128).nullable();
      t.string('semester_label', 32).nullable();
      t.string('academic_year_label', 32).nullable();
      t.string('exam_type', 32).notNullable().defaultTo('IA-1');
      t.string('title', 255).nullable();
      t.date('exam_date').nullable();
      t.decimal('max_marks', 10, 2).notNullable().defaultTo(50);
      t.integer('duration_minutes').unsigned().nullable();
      t.text('instructions').nullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.integer('co_evaluation_id').unsigned().nullable().references('id').inTable('faculty_co_evaluations').onDelete('SET NULL');
      t.boolean('modified_from_co_eval').notNullable().defaultTo(false);
      t.text('change_justification').nullable();
      t.json('blueprint_json').nullable();
      t.json('snapshot_json').nullable();
      t.timestamp('finalized_at').nullable();
      t.integer('finalized_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'created_by']);
      t.index(['college_id', 'course_id']);
      t.index(['college_id', 'status']);
    });
  }

  if (!(await knex.schema.hasTable('internal_question_paper_items'))) {
    await knex.schema.createTable('internal_question_paper_items', (t) => {
      t.increments('id').primary();
      t.integer('paper_id').unsigned().notNullable().references('id').inTable('internal_question_papers').onDelete('CASCADE');
      t.string('item_key', 64).notNullable();
      t.string('section', 64).nullable();
      t.integer('question_number').unsigned().notNullable();
      t.string('sub_letter', 8).nullable();
      t.text('question_text').notNullable();
      t.string('question_type', 32).notNullable().defaultTo('DESCRIPTIVE');
      t.decimal('max_marks', 10, 2).notNullable();
      t.string('module_or_unit', 255).nullable();
      t.integer('module_id').unsigned().nullable();
      t.string('primary_co_code', 32).nullable();
      t.integer('primary_co_id').unsigned().nullable();
      t.string('difficulty', 16).nullable();
      t.string('bloom_level', 32).nullable();
      t.boolean('is_or_choice').notNullable().defaultTo(false);
      t.string('or_group_id', 64).nullable();
      t.string('source_kind', 32).notNullable().defaultTo('CUSTOM');
      t.integer('source_py_question_id').unsigned().nullable().references('id').inTable('previous_year_questions').onDelete('SET NULL');
      t.integer('source_bank_question_id').unsigned().nullable();
      t.integer('source_quiz_question_id').unsigned().nullable();
      t.string('source_paper_id', 128).nullable();
      t.string('fingerprint', 64).nullable();
      t.json('derived_outcomes_snapshot').nullable();
      t.text('model_answer').nullable();
      t.string('model_answer_status', 64).nullable();
      t.integer('sort_order').unsigned().notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.index(['paper_id', 'sort_order']);
      t.unique(['paper_id', 'item_key'], 'iqpi_paper_key_uid');
    });
  }

  if (!(await knex.schema.hasTable('internal_question_paper_audit'))) {
    await knex.schema.createTable('internal_question_paper_audit', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable();
      t.integer('paper_id').unsigned().notNullable().references('id').inTable('internal_question_papers').onDelete('CASCADE');
      t.integer('item_id').unsigned().nullable();
      t.integer('actor_id').unsigned().nullable();
      t.string('actor_name', 255).nullable();
      t.string('action', 64).notNullable();
      t.json('metadata').nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['paper_id', 'created_at']);
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('internal_question_paper_audit');
  await knex.schema.dropTableIfExists('internal_question_paper_items');
  await knex.schema.dropTableIfExists('internal_question_papers');
  await knex.schema.dropTableIfExists('qp_review_queue');
  await knex.schema.dropTableIfExists('previous_year_question_co_links');
  await knex.schema.dropTableIfExists('previous_year_questions');
  await knex.schema.dropTableIfExists('previous_year_papers');
  await knex.schema.dropTableIfExists('previous_year_source_files');
  await knex.schema.dropTableIfExists('qp_import_batches');
};
