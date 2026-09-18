/**
 * Strict Master Question Bank source policy:
 * questions from Previous Year Question Papers only;
 * solutions/schemes from prescribed textbooks only.
 *
 * Existing rows are classified, never deleted.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const hasCol = async (table, column) => knex.schema.hasColumn(table, column);
  const addIfMissing = async (table, column, fn) => {
    if (!(await knex.schema.hasTable(table))) return;
    if (await hasCol(table, column)) return;
    await knex.schema.alterTable(table, (t) => fn(t));
  };

  if (!(await knex.schema.hasTable('course_textbooks'))) {
    await knex.schema.createTable('course_textbooks', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('CASCADE');
      t.integer('scheme_id').unsigned().nullable().references('id').inTable('academic_schemes').onDelete('SET NULL');
      t.string('title', 512).notNullable();
      t.string('authors', 512).nullable();
      t.string('edition', 64).nullable();
      t.string('publisher', 255).nullable();
      t.integer('year').unsigned().nullable();
      t.string('isbn', 32).nullable();
      t.string('status', 32).notNullable().defaultTo('PRESCRIBED');
      t.integer('priority').unsigned().notNullable().defaultTo(1);
      t.boolean('is_primary').notNullable().defaultTo(false);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.string('source_file', 1024).nullable();
      t.string('source_reference', 1024).nullable();
      t.text('notes').nullable();
      t.integer('created_by').unsigned().nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'course_id']);
    });
  }

  if (!(await knex.schema.hasTable('course_textbook_excerpts'))) {
    await knex.schema.createTable('course_textbook_excerpts', (t) => {
      t.increments('id').primary();
      t.integer('textbook_id').unsigned().notNullable().references('id').inTable('course_textbooks').onDelete('CASCADE');
      t.string('chapter', 128).nullable();
      t.string('section', 255).nullable();
      t.string('page_range', 64).nullable();
      t.string('topic', 512).nullable();
      t.text('excerpt_text').notNullable();
      t.timestamps(true, true);
      t.index(['textbook_id']);
    });
  }

  if (!(await knex.schema.hasTable('qp_canonical_questions'))) {
    await knex.schema.createTable('qp_canonical_questions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('course_id').unsigned().nullable().references('id').inTable('courses').onDelete('SET NULL');
      t.string('fingerprint', 64).notNullable();
      t.text('canonical_text').notNullable();
      t.integer('times_asked').unsigned().notNullable().defaultTo(0);
      t.integer('most_recent_year').unsigned().nullable();
      t.string('most_recent_exam', 64).nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'fingerprint'], 'qp_canon_fp_uid');
    });
  }

  if (!(await knex.schema.hasTable('qp_question_source_occurrences'))) {
    await knex.schema.createTable('qp_question_source_occurrences', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable();
      t.integer('canonical_id').unsigned().nullable().references('id').inTable('qp_canonical_questions').onDelete('SET NULL');
      t.integer('question_row_id').unsigned().notNullable().references('id').inTable('previous_year_questions').onDelete('CASCADE');
      t.integer('paper_row_id').unsigned().nullable().references('id').inTable('previous_year_papers').onDelete('SET NULL');
      t.string('paper_id', 128).nullable();
      t.string('exam_type', 32).nullable();
      t.string('academic_year', 32).nullable();
      t.integer('exam_year').unsigned().nullable();
      t.string('exam_month', 16).nullable();
      t.string('fingerprint', 64).nullable();
      t.timestamps(true, true);
      t.unique(['question_row_id'], 'qp_occ_question_uid');
      t.index(['college_id', 'fingerprint']);
    });
  }

  if (!(await knex.schema.hasTable('qp_master_solutions'))) {
    await knex.schema.createTable('qp_master_solutions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable();
      t.integer('question_row_id').unsigned().notNullable().references('id').inTable('previous_year_questions').onDelete('CASCADE');
      t.integer('textbook_id').unsigned().nullable().references('id').inTable('course_textbooks').onDelete('SET NULL');
      t.string('textbook_title', 512).nullable();
      t.string('textbook_authors', 512).nullable();
      t.string('textbook_edition', 64).nullable();
      t.string('chapter', 128).nullable();
      t.string('section', 255).nullable();
      t.string('page_range', 64).nullable();
      t.text('extracted_source_reference').nullable();
      t.text('model_solution').nullable();
      t.text('expected_key_points').nullable();
      t.string('verification_status', 64).notNullable().defaultTo('TEXTBOOK_SOURCE_REQUIRED');
      t.boolean('textbook_grounded').notNullable().defaultTo(false);
      t.timestamps(true, true);
      t.unique(['question_row_id'], 'qp_sol_question_uid');
    });
  }

  if (!(await knex.schema.hasTable('qp_master_scheme_components'))) {
    await knex.schema.createTable('qp_master_scheme_components', (t) => {
      t.increments('id').primary();
      t.integer('question_row_id').unsigned().notNullable().references('id').inTable('previous_year_questions').onDelete('CASCADE');
      t.integer('solution_id').unsigned().nullable().references('id').inTable('qp_master_solutions').onDelete('SET NULL');
      t.string('code', 64).notNullable();
      t.string('label', 255).notNullable();
      t.decimal('max_marks', 10, 2).notNullable();
      t.integer('sort_order').unsigned().notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.index(['question_row_id']);
    });
  }

  if (await knex.schema.hasTable('previous_year_questions')) {
    await addIfMissing('previous_year_questions', 'source_type', (t) =>
      t.string('source_type', 64).notNullable().defaultTo('PREVIOUS_YEAR_QUESTION_PAPER'),
    );
    await addIfMissing('previous_year_questions', 'original_question_text', (t) => t.text('original_question_text').nullable());
    await addIfMissing('previous_year_questions', 'display_question_text', (t) => t.text('display_question_text').nullable());
    await addIfMissing('previous_year_questions', 'parent_question_number', (t) => t.integer('parent_question_number').unsigned().nullable());
    await addIfMissing('previous_year_questions', 'subquestion_identifier', (t) => t.string('subquestion_identifier', 16).nullable());
    await addIfMissing('previous_year_questions', 'printed_marks', (t) => t.decimal('printed_marks', 10, 2).nullable());
    await addIfMissing('previous_year_questions', 'marks_status', (t) => t.string('marks_status', 32).nullable());
    await addIfMissing('previous_year_questions', 'printed_rbt', (t) => t.string('printed_rbt', 8).nullable());
    await addIfMissing('previous_year_questions', 'printed_co', (t) => t.string('printed_co', 32).nullable());
    await addIfMissing('previous_year_questions', 'printed_po', (t) => t.string('printed_po', 64).nullable());
    await addIfMissing('previous_year_questions', 'printed_pso', (t) => t.string('printed_pso', 64).nullable());
    await addIfMissing('previous_year_questions', 'derived_co', (t) => t.string('derived_co', 32).nullable());
    await addIfMissing('previous_year_questions', 'derived_po', (t) => t.string('derived_po', 128).nullable());
    await addIfMissing('previous_year_questions', 'derived_pso', (t) => t.string('derived_pso', 128).nullable());
    await addIfMissing('previous_year_questions', 'co_mapping_status', (t) => t.string('co_mapping_status', 64).nullable());
    await addIfMissing('previous_year_questions', 'topic_id', (t) => t.integer('topic_id').unsigned().nullable());
    await addIfMissing('previous_year_questions', 'topic_name', (t) => t.string('topic_name', 512).nullable());
    await addIfMissing('previous_year_questions', 'module_mapping_confidence', (t) => t.decimal('module_mapping_confidence', 6, 3).nullable());
    await addIfMissing('previous_year_questions', 'module_mapping_status', (t) => t.string('module_mapping_status', 64).nullable());
    await addIfMissing('previous_year_questions', 'readiness_status', (t) =>
      t.string('readiness_status', 64).notNullable().defaultTo('PYQ_EXTRACTED'),
    );
    await addIfMissing('previous_year_questions', 'extraction_timestamp', (t) => t.timestamp('extraction_timestamp').nullable());
    await addIfMissing('previous_year_questions', 'canonical_question_id', (t) => t.integer('canonical_question_id').unsigned().nullable());
    await addIfMissing('previous_year_questions', 'textbook_id', (t) => t.integer('textbook_id').unsigned().nullable());
    await addIfMissing('previous_year_questions', 'solution_status', (t) => t.string('solution_status', 64).nullable());
    await addIfMissing('previous_year_questions', 'scheme_status', (t) => t.string('scheme_status', 64).nullable());
    await addIfMissing('previous_year_questions', 'rbt_level', (t) => t.string('rbt_level', 8).nullable());

    if (await hasCol('previous_year_questions', 'original_question_text')) {
      await knex('previous_year_questions')
        .whereNull('original_question_text')
        .update({
          original_question_text: knex.raw('question_text'),
          display_question_text: knex.raw('question_text'),
          source_type: 'PREVIOUS_YEAR_QUESTION_PAPER',
        });
      await knex('previous_year_questions')
        .whereNull('printed_marks')
        .whereNotNull('max_marks')
        .update({ printed_marks: knex.raw('max_marks') });
      await knex('previous_year_questions')
        .where(function () {
          this.whereNull('max_marks').orWhere('marks_missing', true);
        })
        .update({ marks_status: 'MARKS_UNRESOLVED', readiness_status: 'MARKS_UNRESOLVED' });
      await knex('previous_year_questions')
        .whereNull('marks_status')
        .update({ marks_status: 'RESOLVED', readiness_status: 'PYQ_EXTRACTED' });
    }
  }

  if (await knex.schema.hasTable('previous_year_papers')) {
    await addIfMissing('previous_year_papers', 'mapping_status', (t) => t.string('mapping_status', 64).nullable());
    await addIfMissing('previous_year_papers', 'solution_readiness', (t) => t.string('solution_readiness', 64).nullable());
    await addIfMissing('previous_year_papers', 'pipeline_status', (t) => t.string('pipeline_status', 64).nullable());
    await addIfMissing('previous_year_papers', 'ready_question_count', (t) =>
      t.integer('ready_question_count').unsigned().notNullable().defaultTo(0),
    );
  }

  if (await knex.schema.hasTable('internal_question_paper_items')) {
    await addIfMissing('internal_question_paper_items', 'provenance_json', (t) => t.json('provenance_json').nullable());
    await addIfMissing('internal_question_paper_items', 'textbook_id', (t) => t.integer('textbook_id').unsigned().nullable());
    await addIfMissing('internal_question_paper_items', 'textbook_citation', (t) => t.string('textbook_citation', 1024).nullable());
    await addIfMissing('internal_question_paper_items', 'source_type', (t) => t.string('source_type', 64).nullable());
    await addIfMissing('internal_question_paper_items', 'readiness_status_snapshot', (t) =>
      t.string('readiness_status_snapshot', 64).nullable(),
    );
  }

  if (await knex.schema.hasTable('assignment_bank_questions')) {
    if (!(await hasCol('assignment_bank_questions', 'source_classification'))) {
      await knex.schema.alterTable('assignment_bank_questions', (t) => {
        t.string('source_classification', 64).notNullable().defaultTo('LECTURER_OR_BANK_LEGACY');
        t.boolean('eligible_for_internal_paper').notNullable().defaultTo(false);
      });
    }
  }

  if (await knex.schema.hasTable('quiz_bank_questions')) {
    if (!(await hasCol('quiz_bank_questions', 'source_classification'))) {
      await knex.schema.alterTable('quiz_bank_questions', (t) => {
        t.string('source_classification', 64).notNullable().defaultTo('LECTURER_OR_BANK_LEGACY');
        t.boolean('eligible_for_internal_paper').notNullable().defaultTo(false);
      });
    }
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  const dropCols = async (table, cols) => {
    if (!(await knex.schema.hasTable(table))) return;
    await knex.schema.alterTable(table, (t) => {
      for (const col of cols) t.dropColumn(col);
    });
  };
  await knex.schema.dropTableIfExists('qp_master_scheme_components');
  await knex.schema.dropTableIfExists('qp_master_solutions');
  await knex.schema.dropTableIfExists('qp_question_source_occurrences');
  await knex.schema.dropTableIfExists('qp_canonical_questions');
  await knex.schema.dropTableIfExists('course_textbook_excerpts');
  await knex.schema.dropTableIfExists('course_textbooks');
  if (await knex.schema.hasTable('previous_year_questions')) {
    await dropCols('previous_year_questions', [
      'source_type',
      'original_question_text',
      'display_question_text',
      'parent_question_number',
      'subquestion_identifier',
      'printed_marks',
      'marks_status',
      'printed_rbt',
      'printed_co',
      'printed_po',
      'printed_pso',
      'derived_co',
      'derived_po',
      'derived_pso',
      'co_mapping_status',
      'topic_id',
      'topic_name',
      'module_mapping_confidence',
      'module_mapping_status',
      'readiness_status',
      'extraction_timestamp',
      'canonical_question_id',
      'textbook_id',
      'solution_status',
      'scheme_status',
      'rbt_level',
    ]);
  }
};
