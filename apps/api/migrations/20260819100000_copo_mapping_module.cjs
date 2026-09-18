/**
 * CO–PO mapping academic master, versioned mappings, approval, audit,
 * syllabus import, and future attainment hooks.
 *
 * Reuses colleges, departments, faculty_users, academic_years, semesters,
 * programs, and courses. Does not duplicate subject identity for lesson plans
 * or quizzes — courses remain the shared subject master.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('academic_schemes'))) {
    await knex.schema.createTable('academic_schemes', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('name', 255).notNullable();
      t.string('code', 64).notNullable();
      t.string('university', 255).nullable();
      t.string('effective_academic_year', 32).nullable();
      t.integer('start_year').unsigned().nullable();
      t.integer('end_year').unsigned().nullable();
      t.string('status', 32).notNullable().defaultTo('ACTIVE');
      t.text('notes').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'code']);
      t.index(['college_id', 'status']);
    });
  }

  if (!(await knex.schema.hasColumn('programs', 'scheme_id'))) {
    await knex.schema.alterTable('programs', (t) => {
      t.integer('scheme_id').unsigned().nullable().references('id').inTable('academic_schemes').onDelete('SET NULL');
      t.string('degree', 64).nullable();
      t.decimal('duration_years', 4, 1).nullable();
      t.string('status', 32).notNullable().defaultTo('ACTIVE');
    });
  }

  if (!(await knex.schema.hasTable('scheme_programs'))) {
    await knex.schema.createTable('scheme_programs', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('scheme_id').unsigned().notNullable().references('id').inTable('academic_schemes').onDelete('CASCADE');
      t.integer('program_id').unsigned().notNullable().references('id').inTable('programs').onDelete('CASCADE');
      t.string('status', 32).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.unique(['scheme_id', 'program_id']);
      t.index(['college_id', 'scheme_id']);
    });
  }

  const hasSchemeOnCourses = await knex.schema.hasColumn('courses', 'scheme_id');
  if (!hasSchemeOnCourses) {
    await knex.schema.alterTable('courses', (t) => {
      t.integer('scheme_id').unsigned().nullable().references('id').inTable('academic_schemes').onDelete('SET NULL');
      t.integer('semester_id').unsigned().nullable().references('id').inTable('semesters').onDelete('SET NULL');
      t.string('course_type', 32).nullable();
      t.decimal('lecture_hours', 4, 1).nullable();
      t.decimal('tutorial_hours', 4, 1).nullable();
      t.decimal('practical_hours', 4, 1).nullable();
      t.decimal('credits', 4, 1).nullable();
      t.decimal('cie_marks', 6, 1).nullable();
      t.decimal('see_marks', 6, 1).nullable();
      t.decimal('total_marks', 6, 1).nullable();
      t.string('status', 32).notNullable().defaultTo('ACTIVE');
    });
  }

  const indexes = await knex.raw('SHOW INDEX FROM courses');
  const indexRows = Array.isArray(indexes[0]) ? indexes[0] : indexes;
  const uniqueName = indexRows.find(
    (row) => row.Key_name && row.Non_unique === 0 && String(row.Key_name).includes('college_id') && String(row.Column_name) === 'code',
  )?.Key_name;
  if (uniqueName && uniqueName !== 'PRIMARY') {
    try {
      await knex.raw(`ALTER TABLE courses DROP INDEX \`${uniqueName}\``);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes('needed in a foreign key constraint')) throw err;
    }
  }
  const hasSchemeKey = await knex.schema.hasColumn('courses', 'scheme_key');
  if (!hasSchemeKey) {
    try {
      await knex.raw(
        'ALTER TABLE courses ADD COLUMN scheme_key INT GENERATED ALWAYS AS (IFNULL(scheme_id, 0)) STORED',
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes('foreign key')) throw err;
    }
  }
  const indexesAfter = await knex.raw('SHOW INDEX FROM courses');
  const indexRowsAfter = Array.isArray(indexesAfter[0]) ? indexesAfter[0] : indexesAfter;
  const schemeCodeIndex = indexRowsAfter.some((row) => String(row.Key_name) === 'courses_college_scheme_code');
  if (!schemeCodeIndex && (await knex.schema.hasColumn('courses', 'scheme_key'))) {
    await knex.raw(
      'ALTER TABLE courses ADD UNIQUE KEY courses_college_scheme_code (college_id, scheme_key, code)',
    );
  }

  if (!(await knex.schema.hasTable('program_subjects'))) {
  await knex.schema.createTable('program_subjects', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('program_id').unsigned().notNullable().references('id').inTable('programs').onDelete('CASCADE');
    t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('CASCADE');
    t.integer('scheme_id').unsigned().nullable().references('id').inTable('academic_schemes').onDelete('SET NULL');
    t.integer('semester_id').unsigned().nullable().references('id').inTable('semesters').onDelete('SET NULL');
    t.string('status', 32).notNullable().defaultTo('ACTIVE');
    t.timestamps(true, true);
    t.unique(['program_id', 'course_id']);
    t.index(['college_id', 'program_id']);
    t.index(['college_id', 'course_id']);
  });
  }

  if (!(await knex.schema.hasTable('program_outcome_versions'))) {
  await knex.schema.createTable('program_outcome_versions', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('scheme_id').unsigned().notNullable().references('id').inTable('academic_schemes').onDelete('CASCADE');
    t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
    t.integer('version_number').unsigned().notNullable().defaultTo(1);
    t.string('label', 128).nullable();
    t.string('source', 255).nullable();
    t.string('status', 32).notNullable().defaultTo('ACTIVE');
    t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.timestamps(true, true);
    t.unique(['scheme_id', 'program_id', 'version_number'], { indexName: 'pov_scheme_program_ver_unique' });
    t.index(['college_id', 'scheme_id', 'status']);
  });
  }

  if (!(await knex.schema.hasTable('program_outcomes'))) {
  await knex.schema.createTable('program_outcomes', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('framework_version_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('program_outcome_versions')
      .onDelete('CASCADE');
    t.integer('scheme_id').unsigned().notNullable().references('id').inTable('academic_schemes').onDelete('CASCADE');
    t.integer('po_number').unsigned().notNullable();
    t.string('po_code', 32).notNullable();
    t.string('short_title', 255).nullable();
    t.text('official_statement').nullable();
    t.string('source', 255).nullable();
    t.string('status', 32).notNullable().defaultTo('ACTIVE');
    t.boolean('official_text_pending').notNullable().defaultTo(true);
    t.integer('sort_order').notNullable().defaultTo(0);
    t.timestamps(true, true);
    t.unique(['framework_version_id', 'po_code']);
    t.unique(['framework_version_id', 'po_number']);
    t.index(['college_id', 'scheme_id']);
  });
  }

  if (!(await knex.schema.hasTable('program_outcome_programs'))) {
  await knex.schema.createTable('program_outcome_programs', (t) => {
    t.increments('id').primary();
    t.integer('program_outcome_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('program_outcomes')
      .onDelete('CASCADE');
    t.integer('program_id').unsigned().notNullable().references('id').inTable('programs').onDelete('CASCADE');
    t.unique(['program_outcome_id', 'program_id']);
  });
  }

  if (!(await knex.schema.hasTable('syllabus_documents'))) {
  await knex.schema.createTable('syllabus_documents', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('scheme_id').unsigned().nullable().references('id').inTable('academic_schemes').onDelete('SET NULL');
    t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
    t.integer('course_id').unsigned().nullable().references('id').inTable('courses').onDelete('SET NULL');
    t.string('title', 255).notNullable();
    t.string('source_label', 255).nullable();
    t.string('file_name', 512).nullable();
    t.string('mime_type', 128).nullable();
    t.string('storage_path', 1024).nullable();
    t.string('external_url', 1024).nullable();
    t.integer('page_count').unsigned().nullable();
    t.integer('uploaded_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.timestamps(true, true);
    t.index(['college_id', 'course_id']);
  });
  }

  if (!(await knex.schema.hasTable('course_outcomes'))) {
  await knex.schema.createTable('course_outcomes', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('CASCADE');
    t.integer('scheme_id').unsigned().nullable().references('id').inTable('academic_schemes').onDelete('SET NULL');
    t.integer('co_number').unsigned().notNullable();
    t.string('co_code', 32).notNullable();
    t.text('statement').notNullable();
    t.string('blooms_level', 8).nullable();
    t.string('knowledge_level', 64).nullable();
    t.string('source', 255).nullable();
    t.integer('source_document_id').unsigned().nullable().references('id').inTable('syllabus_documents').onDelete('SET NULL');
    t.string('source_page', 32).nullable();
    t.integer('version_number').unsigned().notNullable().defaultTo(1);
    t.boolean('is_current').notNullable().defaultTo(true);
    t.string('status', 32).notNullable().defaultTo('ACTIVE');
    t.boolean('official_text_pending').notNullable().defaultTo(false);
    t.integer('supersedes_id').unsigned().nullable();
    t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.integer('updated_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.timestamps(true, true);
    t.index(['college_id', 'course_id', 'is_current']);
    t.index(['course_id', 'co_code', 'version_number']);
  });
  }

  if (!(await knex.schema.hasTable('faculty_subject_assignments'))) {
  await knex.schema.createTable('faculty_subject_assignments', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('CASCADE');
    t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('CASCADE');
    t.integer('academic_year_id').unsigned().nullable().references('id').inTable('academic_years').onDelete('SET NULL');
    t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
    t.integer('semester_id').unsigned().nullable().references('id').inTable('semesters').onDelete('SET NULL');
    t.string('status', 32).notNullable().defaultTo('ACTIVE');
    t.timestamps(true, true);
    t.unique(['faculty_id', 'course_id', 'academic_year_id', 'program_id'], { indexName: 'fsa_faculty_course_year_program_unique' });
    t.index(['college_id', 'faculty_id']);
    t.index(['college_id', 'course_id']);
  });
  }

  if (!(await knex.schema.hasTable('copo_mapping_versions'))) {
  await knex.schema.createTable('copo_mapping_versions', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('scheme_id').unsigned().nullable().references('id').inTable('academic_schemes').onDelete('SET NULL');
    t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
    t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('RESTRICT');
    t.integer('academic_year_id').unsigned().nullable().references('id').inTable('academic_years').onDelete('SET NULL');
    t.integer('semester_id').unsigned().nullable().references('id').inTable('semesters').onDelete('SET NULL');
    t.integer('po_framework_version_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('program_outcome_versions')
      .onDelete('SET NULL');
    t.integer('version_number').unsigned().notNullable().defaultTo(1);
    t.string('status', 32).notNullable().defaultTo('DRAFT');
    t.boolean('is_current').notNullable().defaultTo(true);
    t.integer('copied_from_id').unsigned().nullable();
    t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.integer('updated_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.integer('submitted_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.timestamp('submitted_at').nullable();
    t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.timestamp('approved_at').nullable();
    t.integer('returned_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.timestamp('returned_at').nullable();
    t.integer('reopened_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.timestamp('reopened_at').nullable();
    t.timestamps(true, true);
    t.index(['college_id', 'course_id', 'academic_year_id', 'is_current'], { indexName: 'copo_versions_course_year_current_idx' });
    t.index(['college_id', 'status']);
    t.index(['college_id', 'program_id']);
  });
  }

  if (!(await knex.schema.hasTable('copo_mapping_items'))) {
  await knex.schema.createTable('copo_mapping_items', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('mapping_version_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('copo_mapping_versions')
      .onDelete('CASCADE');
    t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('CASCADE');
    t.integer('course_outcome_id').unsigned().notNullable().references('id').inTable('course_outcomes').onDelete('RESTRICT');
    t.integer('program_outcome_id').unsigned().notNullable().references('id').inTable('program_outcomes').onDelete('RESTRICT');
    t.integer('correlation_strength').unsigned().nullable();
    t.text('justification').nullable();
    t.boolean('ai_suggested').notNullable().defaultTo(false);
    t.boolean('faculty_reviewed').notNullable().defaultTo(false);
    t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.integer('updated_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.timestamps(true, true);
    t.unique(['mapping_version_id', 'course_outcome_id', 'program_outcome_id'], { indexName: 'copo_items_version_co_po_unique' });
    t.index(['college_id', 'course_id']);
    t.index(['mapping_version_id', 'correlation_strength']);
  });
  }

  const correlationCheck = await knex.raw(
    `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'copo_mapping_items' AND CONSTRAINT_NAME = 'chk_copo_correlation'`,
  );
  if (!correlationCheck[0]?.length && (await knex.schema.hasTable('copo_mapping_items'))) {
    await knex.raw(`
    ALTER TABLE copo_mapping_items
    ADD CONSTRAINT chk_copo_correlation
    CHECK (correlation_strength IS NULL OR correlation_strength IN (1, 2, 3))
  `);
  }

  if (!(await knex.schema.hasTable('mapping_review_comments'))) {
  await knex.schema.createTable('mapping_review_comments', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('mapping_version_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('copo_mapping_versions')
      .onDelete('CASCADE');
    t.integer('course_outcome_id').unsigned().nullable().references('id').inTable('course_outcomes').onDelete('SET NULL');
    t.integer('program_outcome_id').unsigned().nullable().references('id').inTable('program_outcomes').onDelete('SET NULL');
    t.integer('author_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.string('author_name', 255).nullable();
    t.string('action', 32).notNullable().defaultTo('COMMENT');
    t.text('comment').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['mapping_version_id', 'created_at']);
  });
  }

  if (!(await knex.schema.hasTable('copo_audit_log'))) {
  await knex.schema.createTable('copo_audit_log', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('actor_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.string('actor_name', 255).nullable();
    t.string('action', 64).notNullable();
    t.integer('mapping_version_id').unsigned().nullable();
    t.integer('course_id').unsigned().nullable();
    t.integer('course_outcome_id').unsigned().nullable();
    t.integer('program_outcome_id').unsigned().nullable();
    t.integer('academic_year_id').unsigned().nullable();
    t.text('previous_value').nullable();
    t.text('new_value').nullable();
    t.json('metadata').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['college_id', 'created_at']);
    t.index(['mapping_version_id', 'created_at']);
    t.index(['course_id', 'created_at']);
  });
  }

  if (!(await knex.schema.hasTable('syllabus_import_batches'))) {
  await knex.schema.createTable('syllabus_import_batches', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.string('batch_id', 64).notNullable().unique();
    t.string('source_file', 512).nullable();
    t.json('payload').nullable();
    t.json('preview').nullable();
    t.json('resolutions').nullable();
    t.string('status', 32).notNullable().defaultTo('PREVIEWED');
    t.boolean('dry_run').notNullable().defaultTo(true);
    t.integer('imported_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.timestamp('imported_at').nullable();
    t.timestamps(true, true);
    t.index(['college_id', 'created_at']);
  });
  }

  if (!(await knex.schema.hasTable('assessment_question_outcomes'))) {
  await knex.schema.createTable('assessment_question_outcomes', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.string('source_kind', 32).notNullable();
    t.integer('source_question_id').unsigned().notNullable();
    t.integer('course_outcome_id').unsigned().notNullable().references('id').inTable('course_outcomes').onDelete('RESTRICT');
    t.decimal('weight', 6, 3).notNullable().defaultTo(1);
    t.timestamps(true, true);
    t.unique(['source_kind', 'source_question_id', 'course_outcome_id'], { indexName: 'aqo_source_question_co_unique' });
    t.index(['college_id', 'course_outcome_id']);
  });
  }

  const hasQuizCo = await knex.schema.hasColumn('quiz_bank_questions', 'course_outcome_id');
  if (!hasQuizCo) {
    await knex.schema.alterTable('quiz_bank_questions', (t) => {
      t.integer('course_outcome_id').unsigned().nullable().references('id').inTable('course_outcomes').onDelete('SET NULL');
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  if (await knex.schema.hasColumn('quiz_bank_questions', 'course_outcome_id')) {
    await knex.schema.alterTable('quiz_bank_questions', (t) => {
      t.dropForeign(['course_outcome_id']);
      t.dropColumn('course_outcome_id');
    });
  }
  await knex.schema.dropTableIfExists('assessment_question_outcomes');
  await knex.schema.dropTableIfExists('syllabus_import_batches');
  await knex.schema.dropTableIfExists('copo_audit_log');
  await knex.schema.dropTableIfExists('mapping_review_comments');
  await knex.schema.dropTableIfExists('copo_mapping_items');
  await knex.schema.dropTableIfExists('copo_mapping_versions');
  await knex.schema.dropTableIfExists('faculty_subject_assignments');
  await knex.schema.dropTableIfExists('course_outcomes');
  await knex.schema.dropTableIfExists('syllabus_documents');
  await knex.schema.dropTableIfExists('program_outcome_programs');
  await knex.schema.dropTableIfExists('program_outcomes');
  await knex.schema.dropTableIfExists('program_outcome_versions');
  await knex.schema.dropTableIfExists('program_subjects');
  await knex.schema.dropTableIfExists('scheme_programs');

  const hasSchemeKey = await knex.schema.hasColumn('courses', 'scheme_key');
  if (hasSchemeKey) {
    await knex.raw('ALTER TABLE courses DROP INDEX courses_college_scheme_code');
    await knex.raw('ALTER TABLE courses DROP COLUMN scheme_key');
  }
  if (await knex.schema.hasColumn('courses', 'scheme_id')) {
    await knex.schema.alterTable('courses', (t) => {
      t.dropForeign(['scheme_id']);
      t.dropForeign(['semester_id']);
      t.dropColumn('scheme_id');
      t.dropColumn('semester_id');
      t.dropColumn('course_type');
      t.dropColumn('lecture_hours');
      t.dropColumn('tutorial_hours');
      t.dropColumn('practical_hours');
      t.dropColumn('credits');
      t.dropColumn('cie_marks');
      t.dropColumn('see_marks');
      t.dropColumn('total_marks');
      t.dropColumn('status');
    });
  }
  await knex.raw('ALTER TABLE courses ADD UNIQUE KEY courses_college_id_code_unique (college_id, code)');

  if (await knex.schema.hasColumn('programs', 'scheme_id')) {
    await knex.schema.alterTable('programs', (t) => {
      t.dropForeign(['scheme_id']);
      t.dropColumn('scheme_id');
      t.dropColumn('degree');
      t.dropColumn('duration_years');
      t.dropColumn('status');
    });
  }
  await knex.schema.dropTableIfExists('academic_schemes');
};
