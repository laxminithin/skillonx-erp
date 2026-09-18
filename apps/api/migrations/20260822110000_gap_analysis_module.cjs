/**
 * Gap Analysis master + operational faculty workflow.
 * Master data is shared/academic; operational analyses are faculty-owned snapshots.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('gap_master_import_batches'))) {
    await knex.schema.createTable('gap_master_import_batches', (t) => {
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

  if (!(await knex.schema.hasTable('gap_masters'))) {
    await knex.schema.createTable('gap_masters', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('gap_id', 64).notNullable();
      t.string('subject_key', 128).nullable();
      t.integer('course_id').unsigned().nullable().references('id').inTable('courses').onDelete('SET NULL');
      t.string('subject_name', 255).notNullable();
      t.string('course_code', 64).notNullable();
      t.string('scheme_label', 64).nullable();
      t.integer('scheme_id').unsigned().nullable().references('id').inTable('academic_schemes').onDelete('SET NULL');
      t.string('program_name', 255).nullable();
      t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
      t.string('semester_label', 32).nullable();
      t.string('module_unit', 128).nullable();
      t.string('related_topic', 512).nullable();
      t.string('gap_type', 64).notNullable();
      t.text('gap_statement').notNullable();
      t.text('gap_justification').nullable();
      t.text('official_syllabus_coverage').nullable();
      t.text('current_teaching_coverage').nullable();
      t.integer('expected_coverage_level').unsigned().nullable();
      t.string('priority', 32).nullable();
      t.string('related_cos_raw', 255).nullable();
      t.string('suggested_action_type', 64).nullable();
      t.text('source_basis').nullable();
      t.string('mapping_origin', 64).nullable();
      t.string('verification_status', 64).nullable();
      t.string('import_batch', 64).nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'gap_id']);
      t.index(['college_id', 'course_code']);
      t.index(['college_id', 'course_id']);
      t.index(['college_id', 'verification_status']);
    });
  }

  if (!(await knex.schema.hasTable('gap_master_co_links'))) {
    await knex.schema.createTable('gap_master_co_links', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('gap_master_id').unsigned().notNullable().references('id').inTable('gap_masters').onDelete('CASCADE');
      t.string('gap_id', 64).notNullable();
      t.string('course_code', 64).notNullable();
      t.string('co_code', 32).notNullable();
      t.integer('course_outcome_id').unsigned().nullable().references('id').inTable('course_outcomes').onDelete('SET NULL');
      t.string('relationship', 32).nullable();
      t.text('basis').nullable();
      t.string('verification_status', 64).nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'gap_id', 'co_code']);
      t.index(['gap_master_id']);
    });
  }

  if (!(await knex.schema.hasTable('gap_master_outcome_links'))) {
    await knex.schema.createTable('gap_master_outcome_links', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('gap_master_id').unsigned().notNullable().references('id').inTable('gap_masters').onDelete('CASCADE');
      t.string('gap_id', 64).notNullable();
      t.string('course_code', 64).notNullable();
      t.string('co_code', 32).nullable();
      t.string('outcome_type', 16).notNullable();
      t.string('outcome_code', 32).notNullable();
      t.integer('strength').unsigned().nullable();
      t.string('derived_from', 255).nullable();
      t.string('verification_status', 64).nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'gap_id', 'outcome_type', 'outcome_code', 'co_code'], 'gap_outcome_unique');
      t.index(['gap_master_id']);
    });
  }

  if (!(await knex.schema.hasTable('gap_master_actions'))) {
    await knex.schema.createTable('gap_master_actions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('gap_master_id').unsigned().notNullable().references('id').inTable('gap_masters').onDelete('CASCADE');
      t.string('action_id', 64).notNullable();
      t.string('gap_id', 64).notNullable();
      t.string('action_type', 64).notNullable();
      t.text('recommended_action').notNullable();
      t.integer('expected_coverage_level').unsigned().nullable();
      t.string('priority', 32).nullable();
      t.text('source_basis').nullable();
      t.string('verification_status', 64).nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'action_id']);
      t.index(['gap_master_id']);
      t.index(['college_id', 'gap_id']);
    });
  }

  if (!(await knex.schema.hasTable('gap_master_sources'))) {
    await knex.schema.createTable('gap_master_sources', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('gap_master_id').unsigned().notNullable().references('id').inTable('gap_masters').onDelete('CASCADE');
      t.string('source_id', 64).notNullable();
      t.string('gap_id', 64).notNullable();
      t.string('source_type', 64).nullable();
      t.string('source_file', 512).nullable();
      t.string('source_reference', 255).nullable();
      t.text('notes').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'source_id']);
      t.index(['gap_master_id']);
    });
  }

  if (!(await knex.schema.hasTable('gap_master_review_queue'))) {
    await knex.schema.createTable('gap_master_review_queue', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('review_id', 64).notNullable();
      t.string('subject_name', 255).nullable();
      t.string('course_code', 64).nullable();
      t.string('entity_type', 64).nullable();
      t.string('entity_id', 64).nullable();
      t.text('issue').nullable();
      t.text('proposed_value').nullable();
      t.text('reason').nullable();
      t.string('source', 255).nullable();
      t.string('review_status', 64).nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'review_id', 'entity_id']);
      t.index(['college_id', 'review_status']);
    });
  }

  if (!(await knex.schema.hasTable('faculty_gap_analyses'))) {
    await knex.schema.createTable('faculty_gap_analyses', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('created_by').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('RESTRICT');
      t.integer('academic_year_id').unsigned().nullable().references('id').inTable('academic_years').onDelete('SET NULL');
      t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
      t.integer('semester_id').unsigned().nullable().references('id').inTable('semesters').onDelete('SET NULL');
      t.integer('scheme_id').unsigned().nullable().references('id').inTable('academic_schemes').onDelete('SET NULL');
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.string('subject_name', 255).notNullable();
      t.string('course_code', 64).notNullable();
      t.string('scheme_label', 64).nullable();
      t.string('program_name', 255).nullable();
      t.string('semester_label', 64).nullable();
      t.string('academic_year_label', 64).nullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.string('import_batch', 64).nullable();
      t.integer('master_version_batch_id').unsigned().nullable();
      t.json('snapshot_meta').nullable();
      t.timestamp('completed_at').nullable();
      t.timestamp('archived_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'created_by', 'status']);
      t.index(['college_id', 'course_id']);
      t.index(
        ['college_id', 'created_by', 'course_id', 'academic_year_id', 'program_id', 'semester_id', 'scheme_id'],
        'fga_owner_context_idx',
      );
    });
  }

  if (!(await knex.schema.hasTable('faculty_gap_analysis_items'))) {
    await knex.schema.createTable('faculty_gap_analysis_items', (t) => {
      t.increments('id').primary();
      t.integer('analysis_id').unsigned().notNullable().references('id').inTable('faculty_gap_analyses').onDelete('CASCADE');
      t.integer('gap_master_id').unsigned().nullable().references('id').inTable('gap_masters').onDelete('SET NULL');
      t.string('gap_id', 64).notNullable();
      t.integer('serial_no').unsigned().notNullable();
      t.string('gap_type', 64).notNullable();
      t.text('gap_statement').notNullable();
      t.text('gap_justification').nullable();
      t.string('module_unit', 128).nullable();
      t.string('related_topic', 512).nullable();
      t.string('priority', 32).nullable();
      t.integer('expected_coverage_level').unsigned().nullable();
      t.integer('actual_coverage_level').unsigned().nullable();
      t.string('suggested_action_type', 64).nullable();
      t.text('suggested_action_title').nullable();
      t.text('source_basis').nullable();
      t.string('mapping_origin', 64).nullable();
      t.string('verification_status', 64).nullable();
      t.string('applicability', 32).notNullable().defaultTo('APPLICABLE');
      t.text('not_applicable_reason').nullable();
      t.string('item_status', 32).notNullable().defaultTo('OPEN');
      t.text('closure_note').nullable();
      t.text('actual_outcome').nullable();
      t.string('assessment_method', 255).nullable();
      t.text('assessment_result').nullable();
      t.text('faculty_observation').nullable();
      t.integer('final_coverage_level').unsigned().nullable();
      t.integer('participants').unsigned().nullable();
      t.decimal('actual_duration_hours', 8, 2).nullable();
      t.timestamp('closed_at').nullable();
      t.integer('closed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.json('snapshot_json').nullable();
      t.timestamps(true, true);
      t.unique(['analysis_id', 'gap_id']);
      t.index(['analysis_id', 'item_status']);
      t.index(['analysis_id', 'serial_no']);
    });
  }

  if (!(await knex.schema.hasTable('faculty_gap_item_co_links'))) {
    await knex.schema.createTable('faculty_gap_item_co_links', (t) => {
      t.increments('id').primary();
      t.integer('item_id').unsigned().notNullable().references('id').inTable('faculty_gap_analysis_items').onDelete('CASCADE');
      t.string('co_code', 32).notNullable();
      t.text('co_statement').nullable();
      t.string('relationship', 32).nullable();
      t.string('verification_status', 64).nullable();
      t.timestamps(true, true);
      t.unique(['item_id', 'co_code']);
    });
  }

  if (!(await knex.schema.hasTable('faculty_gap_item_outcome_links'))) {
    await knex.schema.createTable('faculty_gap_item_outcome_links', (t) => {
      t.increments('id').primary();
      t.integer('item_id').unsigned().notNullable().references('id').inTable('faculty_gap_analysis_items').onDelete('CASCADE');
      t.string('co_code', 32).nullable();
      t.string('outcome_type', 16).notNullable();
      t.string('outcome_code', 32).notNullable();
      t.integer('strength').unsigned().nullable();
      t.string('derived_from', 255).nullable();
      t.string('verification_status', 64).nullable();
      t.timestamps(true, true);
      t.index(['item_id', 'outcome_type']);
    });
  }

  if (!(await knex.schema.hasTable('gap_filling_actions'))) {
    await knex.schema.createTable('gap_filling_actions', (t) => {
      t.increments('id').primary();
      t.integer('analysis_id').unsigned().notNullable().references('id').inTable('faculty_gap_analyses').onDelete('CASCADE');
      t.integer('item_id').unsigned().notNullable().references('id').inTable('faculty_gap_analysis_items').onDelete('CASCADE');
      t.string('action_type', 64).notNullable();
      t.string('title', 512).notNullable();
      t.text('description').nullable();
      t.date('planned_date').nullable();
      t.date('actual_date').nullable();
      t.decimal('duration_hours', 8, 2).nullable();
      t.string('target_group', 255).nullable();
      t.text('expected_outcome').nullable();
      t.text('actual_outcome').nullable();
      t.integer('participants').unsigned().nullable();
      t.string('responsible_faculty', 255).nullable();
      t.string('status', 32).notNullable().defaultTo('PLANNED');
      t.text('notes').nullable();
      t.boolean('from_master_recommendation').notNullable().defaultTo(false);
      t.string('master_action_id', 64).nullable();
      t.timestamp('completed_at').nullable();
      t.timestamps(true, true);
      t.index(['analysis_id', 'status']);
      t.index(['item_id']);
    });
  }

  if (!(await knex.schema.hasTable('gap_evidence'))) {
    await knex.schema.createTable('gap_evidence', (t) => {
      t.increments('id').primary();
      t.integer('analysis_id').unsigned().notNullable().references('id').inTable('faculty_gap_analyses').onDelete('CASCADE');
      t.integer('item_id').unsigned().nullable().references('id').inTable('faculty_gap_analysis_items').onDelete('CASCADE');
      t.integer('action_id').unsigned().nullable().references('id').inTable('gap_filling_actions').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('evidence_type', 64).notNullable();
      t.string('title', 512).notNullable();
      t.text('description').nullable();
      t.string('file_name', 512).nullable();
      t.string('mime_type', 128).nullable();
      t.integer('file_size').unsigned().nullable();
      t.string('storage_key', 512).nullable();
      t.string('external_url', 1024).nullable();
      t.integer('uploaded_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['analysis_id']);
      t.index(['item_id']);
      t.index(['action_id']);
      t.index(['college_id', 'analysis_id']);
    });
  }

  if (!(await knex.schema.hasTable('gap_analysis_audit_log'))) {
    await knex.schema.createTable('gap_analysis_audit_log', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('analysis_id').unsigned().notNullable().references('id').inTable('faculty_gap_analyses').onDelete('CASCADE');
      t.integer('item_id').unsigned().nullable();
      t.integer('action_id').unsigned().nullable();
      t.integer('actor_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('actor_name', 255).nullable();
      t.string('action', 64).notNullable();
      t.json('metadata').nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['analysis_id', 'created_at']);
      t.index(['college_id', 'created_at']);
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('gap_analysis_audit_log');
  await knex.schema.dropTableIfExists('gap_evidence');
  await knex.schema.dropTableIfExists('gap_filling_actions');
  await knex.schema.dropTableIfExists('faculty_gap_item_outcome_links');
  await knex.schema.dropTableIfExists('faculty_gap_item_co_links');
  await knex.schema.dropTableIfExists('faculty_gap_analysis_items');
  await knex.schema.dropTableIfExists('faculty_gap_analyses');
  await knex.schema.dropTableIfExists('gap_master_review_queue');
  await knex.schema.dropTableIfExists('gap_master_sources');
  await knex.schema.dropTableIfExists('gap_master_actions');
  await knex.schema.dropTableIfExists('gap_master_outcome_links');
  await knex.schema.dropTableIfExists('gap_master_co_links');
  await knex.schema.dropTableIfExists('gap_masters');
  await knex.schema.dropTableIfExists('gap_master_import_batches');
};
