/**
 * CO Evaluation master + faculty operational snapshots.
 * Master data is shared/academic; operational evaluations are faculty-owned.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('co_eval_import_batches'))) {
    await knex.schema.createTable('co_eval_import_batches', (t) => {
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

  if (!(await knex.schema.hasTable('assessment_component_masters'))) {
    await knex.schema.createTable('assessment_component_masters', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('component_id', 64).notNullable();
      t.string('code', 64).notNullable();
      t.string('display_name', 255).notNullable();
      t.string('category', 64).nullable();
      t.string('direct_indirect', 32).nullable();
      t.text('description').nullable();
      t.integer('display_order').unsigned().notNullable().defaultTo(100);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.string('import_batch', 64).nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'component_id'], 'acm_college_comp_uid');
      t.index(['college_id', 'code']);
    });
  }

  if (!(await knex.schema.hasTable('course_assessment_structures'))) {
    await knex.schema.createTable('course_assessment_structures', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('course_assessment_id', 64).notNullable();
      t.string('subject_key', 255).nullable();
      t.string('subject_name', 255).notNullable();
      t.string('course_code', 64).notNullable();
      t.integer('course_id').unsigned().nullable().references('id').inTable('courses').onDelete('SET NULL');
      t.string('scheme_label', 64).nullable();
      t.integer('scheme_id').unsigned().nullable().references('id').inTable('academic_schemes').onDelete('SET NULL');
      t.string('program_name', 255).nullable();
      t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
      t.string('semester_label', 32).nullable();
      t.string('course_type', 64).nullable();
      t.decimal('cie_max_marks', 10, 2).nullable();
      t.decimal('see_max_marks', 10, 2).nullable();
      t.decimal('cie_weightage', 10, 2).nullable();
      t.decimal('see_weightage', 10, 2).nullable();
      t.decimal('min_cie_pass', 10, 2).nullable();
      t.decimal('min_see_pass', 10, 2).nullable();
      t.text('overall_pass_rule').nullable();
      t.integer('number_of_ia').unsigned().nullable();
      t.text('assignment_component').nullable();
      t.text('quiz_component').nullable();
      t.text('activity_component').nullable();
      t.text('lab_component').nullable();
      t.text('project_component').nullable();
      t.text('practical_component').nullable();
      t.text('question_paper_pattern').nullable();
      t.text('assessment_description').nullable();
      t.string('source_file', 1024).nullable();
      t.string('source_section', 512).nullable();
      t.string('source_page', 64).nullable();
      t.string('verification_status', 64).nullable();
      t.text('notes').nullable();
      t.string('import_batch', 64).nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'course_assessment_id'], 'cas_college_cas_uid');
      t.index(['college_id', 'course_code']);
      t.index(['college_id', 'course_id']);
    });
  }

  if (!(await knex.schema.hasTable('course_assessment_components'))) {
    await knex.schema.createTable('course_assessment_components', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('course_assessment_component_id', 64).notNullable();
      t.integer('structure_id').unsigned().nullable().references('id').inTable('course_assessment_structures').onDelete('CASCADE');
      t.string('subject_key', 255).nullable();
      t.string('course_code', 64).notNullable();
      t.string('scheme_label', 64).nullable();
      t.string('component_id', 64).notNullable();
      t.string('component_name', 255).notNullable();
      t.decimal('max_marks', 10, 2).nullable();
      t.decimal('weightage', 10, 2).nullable();
      t.integer('count').unsigned().nullable();
      t.boolean('mandatory').notNullable().defaultTo(true);
      t.text('description').nullable();
      t.string('source', 1024).nullable();
      t.string('verification_status', 64).nullable();
      t.integer('display_order').unsigned().notNullable().defaultTo(100);
      t.string('import_batch', 64).nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'course_assessment_component_id'], 'cac_college_cac_uid');
      t.unique(['college_id', 'course_code', 'scheme_label', 'component_id'], 'cac_course_comp_unique');
      t.index(['structure_id']);
      t.index(['college_id', 'course_code']);
    });
  }

  if (!(await knex.schema.hasTable('co_evaluation_subject_masters'))) {
    await knex.schema.createTable('co_evaluation_subject_masters', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('subject_key', 255).nullable();
      t.string('subject_name', 255).notNullable();
      t.string('course_code', 64).notNullable();
      t.integer('course_id').unsigned().nullable().references('id').inTable('courses').onDelete('SET NULL');
      t.string('scheme_label', 64).nullable();
      t.integer('scheme_id').unsigned().nullable().references('id').inTable('academic_schemes').onDelete('SET NULL');
      t.string('program_name', 255).nullable();
      t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
      t.string('semester_label', 32).nullable();
      t.string('course_type', 64).nullable();
      t.integer('co_count').unsigned().notNullable().defaultTo(0);
      t.integer('component_count').unsigned().notNullable().defaultTo(0);
      t.text('assessment_components_label').nullable();
      t.string('official_structure_status', 64).nullable();
      t.string('standard_evaluation_status', 64).nullable();
      t.decimal('evaluation_percent_total', 10, 2).nullable();
      t.string('component_total_validation', 64).nullable();
      t.string('source_status', 128).nullable();
      t.integer('review_items').unsigned().nullable();
      t.string('ready_for_import', 64).nullable();
      t.boolean('is_evaluable').notNullable().defaultTo(false);
      t.boolean('is_blocked').notNullable().defaultTo(false);
      t.text('blocked_reason').nullable();
      t.string('verification_status', 64).nullable();
      t.string('import_batch', 64).nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'course_code', 'scheme_label'], 'co_eval_subj_unique');
      t.index(['college_id', 'course_id']);
      t.index(['college_id', 'is_evaluable'], 'cesubj_evaluable_idx');
    });
  }

  if (!(await knex.schema.hasTable('co_evaluation_co_masters'))) {
    await knex.schema.createTable('co_evaluation_co_masters', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('subject_master_id').unsigned().nullable().references('id').inTable('co_evaluation_subject_masters').onDelete('CASCADE');
      t.string('co_evaluation_id', 64).notNullable();
      t.string('subject_key', 255).nullable();
      t.string('subject_name', 255).notNullable();
      t.string('course_code', 64).notNullable();
      t.string('scheme_label', 64).nullable();
      t.string('program_name', 255).nullable();
      t.string('semester_label', 32).nullable();
      t.string('co_code', 32).notNullable();
      t.text('co_statement').nullable();
      t.string('co_source_status', 64).nullable();
      t.decimal('standard_marks_distribution', 10, 2).nullable();
      t.decimal('standard_evaluation_percent', 10, 4).nullable();
      t.decimal('total_standard_component_marks', 10, 2).nullable();
      t.string('default_status', 64).nullable();
      t.string('source_origin', 64).nullable();
      t.string('verification_status', 64).nullable();
      t.boolean('lecturer_editable').notNullable().defaultTo(true);
      t.text('notes').nullable();
      t.integer('display_order').unsigned().notNullable().defaultTo(0);
      t.string('import_batch', 64).nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'co_evaluation_id'], 'cecm_college_ce_uid');
      t.unique(['college_id', 'course_code', 'scheme_label', 'co_code'], 'co_eval_co_unique');
      t.index(['subject_master_id']);
      t.index(['college_id', 'course_code']);
    });
  }

  if (!(await knex.schema.hasTable('co_evaluation_component_masters'))) {
    await knex.schema.createTable('co_evaluation_component_masters', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('subject_master_id').unsigned().nullable().references('id').inTable('co_evaluation_subject_masters').onDelete('CASCADE');
      t.integer('co_master_id').unsigned().nullable().references('id').inTable('co_evaluation_co_masters').onDelete('CASCADE');
      t.string('co_evaluation_component_id', 64).notNullable();
      t.string('subject_key', 255).nullable();
      t.string('subject_name', 255).nullable();
      t.string('course_code', 64).notNullable();
      t.string('scheme_label', 64).nullable();
      t.string('program_name', 255).nullable();
      t.string('semester_label', 32).nullable();
      t.string('co_code', 32).notNullable();
      t.string('assessment_component_id', 64).notNullable();
      t.string('assessment_component_name', 255).notNullable();
      t.decimal('standard_marks_assigned', 10, 2).nullable();
      t.decimal('standard_weightage', 10, 2).nullable();
      t.decimal('evaluation_percent_contribution', 10, 4).nullable();
      t.boolean('is_default').notNullable().defaultTo(true);
      t.boolean('lecturer_editable').notNullable().defaultTo(true);
      t.string('mapping_basis', 128).nullable();
      t.string('source_origin', 64).nullable();
      t.string('verification_status', 64).nullable();
      t.text('notes').nullable();
      t.string('import_batch', 64).nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'co_evaluation_component_id'], 'cecomp_college_id_uid');
      t.unique(
        ['college_id', 'course_code', 'scheme_label', 'co_code', 'assessment_component_id'],
        'cecomp_map_unique',
      );
      t.index(['subject_master_id']);
      t.index(['co_master_id']);
      t.index(['college_id', 'course_code']);
    });
  }

  if (!(await knex.schema.hasTable('co_evaluation_justification_masters'))) {
    await knex.schema.createTable('co_evaluation_justification_masters', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('subject_master_id').unsigned().nullable().references('id').inTable('co_evaluation_subject_masters').onDelete('CASCADE');
      t.string('justification_id', 64).notNullable();
      t.string('subject_key', 255).nullable();
      t.string('course_code', 64).notNullable();
      t.string('scheme_label', 64).nullable();
      t.string('co_code', 32).notNullable();
      t.string('assessment_component_id', 64).notNullable();
      t.decimal('standard_value', 10, 2).nullable();
      t.text('justification').nullable();
      t.string('source_origin', 64).nullable();
      t.string('source_reference', 1024).nullable();
      t.string('verification_status', 64).nullable();
      t.text('notes').nullable();
      t.string('import_batch', 64).nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'justification_id'], 'cej_college_just_uid');
      t.unique(
        ['college_id', 'course_code', 'scheme_label', 'co_code', 'assessment_component_id'],
        'cej_map_unique',
      );
      t.index(['subject_master_id']);
    });
  }

  if (!(await knex.schema.hasTable('co_evaluation_sources'))) {
    await knex.schema.createTable('co_evaluation_sources', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('subject_master_id').unsigned().nullable().references('id').inTable('co_evaluation_subject_masters').onDelete('CASCADE');
      t.string('source_id', 64).notNullable();
      t.string('subject_key', 255).nullable();
      t.string('subject_name', 255).nullable();
      t.string('course_code', 64).notNullable();
      t.string('scheme_label', 64).nullable();
      t.string('source_type', 128).nullable();
      t.string('source_file', 1024).nullable();
      t.string('source_page_section', 512).nullable();
      t.string('extracted_field', 255).nullable();
      t.text('extracted_value').nullable();
      t.string('verification_status', 64).nullable();
      t.text('notes').nullable();
      t.string('import_batch', 64).nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'source_id'], 'ces_college_src_uid');
      t.index(['subject_master_id']);
      t.index(['college_id', 'course_code']);
    });
  }

  if (!(await knex.schema.hasTable('co_evaluation_review_queue'))) {
    await knex.schema.createTable('co_evaluation_review_queue', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('review_id', 64).notNullable();
      t.string('subject_name', 255).nullable();
      t.string('course_code', 64).nullable();
      t.string('scheme_label', 64).nullable();
      t.string('co_code', 32).nullable();
      t.string('component', 128).nullable();
      t.string('issue_type', 128).nullable();
      t.text('current_value').nullable();
      t.text('proposed_value').nullable();
      t.text('reason').nullable();
      t.string('source', 1024).nullable();
      t.string('priority', 32).nullable();
      t.string('review_status', 64).nullable();
      t.string('reviewer', 255).nullable();
      t.text('review_notes').nullable();
      t.string('import_batch', 64).nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'review_id'], 'cer_college_rev_uid');
      t.index(['college_id', 'course_code']);
      t.index(['college_id', 'review_status'], 'cer_college_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('faculty_co_evaluations'))) {
    await knex.schema.createTable('faculty_co_evaluations', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('created_by').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('RESTRICT');
      t.integer('academic_year_id').unsigned().nullable().references('id').inTable('academic_years').onDelete('SET NULL');
      t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
      t.integer('semester_id').unsigned().nullable().references('id').inTable('semesters').onDelete('SET NULL');
      t.integer('scheme_id').unsigned().nullable().references('id').inTable('academic_schemes').onDelete('SET NULL');
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('subject_master_id').unsigned().nullable().references('id').inTable('co_evaluation_subject_masters').onDelete('SET NULL');
      t.string('subject_name', 255).notNullable();
      t.string('course_code', 64).notNullable();
      t.string('scheme_label', 64).nullable();
      t.string('program_name', 255).nullable();
      t.string('semester_label', 64).nullable();
      t.string('academic_year_label', 64).nullable();
      t.string('course_type', 64).nullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.string('verification_status', 64).nullable();
      t.string('source_status', 128).nullable();
      t.string('import_batch', 64).nullable();
      t.json('snapshot_meta').nullable();
      t.json('assessment_structure_snapshot').nullable();
      t.timestamp('finalized_at').nullable();
      t.integer('finalized_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('archived_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'created_by', 'status'], 'fce_owner_status_idx');
      t.index(['college_id', 'course_id']);
      t.index(
        ['college_id', 'created_by', 'course_id', 'academic_year_id', 'program_id', 'semester_id', 'scheme_id'],
        'fce_owner_context_idx',
      );
    });
  }

  if (!(await knex.schema.hasTable('faculty_co_evaluation_components'))) {
    await knex.schema.createTable('faculty_co_evaluation_components', (t) => {
      t.increments('id').primary();
      t.integer('evaluation_id').unsigned().notNullable().references('id').inTable('faculty_co_evaluations').onDelete('CASCADE');
      t.string('assessment_component_id', 64).notNullable();
      t.string('component_code', 64).nullable();
      t.string('display_name', 255).notNullable();
      t.string('category', 64).nullable();
      t.decimal('official_max_marks', 10, 2).nullable();
      t.integer('display_order').unsigned().notNullable().defaultTo(100);
      t.boolean('include_in_matrix').notNullable().defaultTo(true);
      t.boolean('lecturer_editable').notNullable().defaultTo(true);
      t.json('snapshot_json').nullable();
      t.timestamps(true, true);
      t.unique(['evaluation_id', 'assessment_component_id'], 'fcec_eval_comp_uid');
      t.index(['evaluation_id', 'display_order'], 'fcec_eval_ord_idx');
    });
  }

  if (!(await knex.schema.hasTable('faculty_co_evaluation_cos'))) {
    await knex.schema.createTable('faculty_co_evaluation_cos', (t) => {
      t.increments('id').primary();
      t.integer('evaluation_id').unsigned().notNullable().references('id').inTable('faculty_co_evaluations').onDelete('CASCADE');
      t.string('co_code', 32).notNullable();
      t.text('co_statement').nullable();
      t.integer('display_order').unsigned().notNullable().defaultTo(0);
      t.decimal('master_marks_distribution', 10, 2).nullable();
      t.decimal('current_marks_distribution', 10, 2).nullable();
      t.decimal('master_evaluation_percent', 10, 4).nullable();
      t.decimal('current_evaluation_percent', 10, 4).nullable();
      t.boolean('marks_distribution_editable').notNullable().defaultTo(true);
      t.boolean('evaluation_percent_editable').notNullable().defaultTo(true);
      t.text('marks_distribution_change_justification').nullable();
      t.text('evaluation_percent_change_justification').nullable();
      t.string('co_source_status', 64).nullable();
      t.string('verification_status', 64).nullable();
      t.json('snapshot_json').nullable();
      t.timestamps(true, true);
      t.unique(['evaluation_id', 'co_code'], 'fceco_eval_co_uid');
      t.index(['evaluation_id', 'display_order'], 'fceco_eval_ord_idx');
    });
  }

  if (!(await knex.schema.hasTable('faculty_co_evaluation_cells'))) {
    await knex.schema.createTable('faculty_co_evaluation_cells', (t) => {
      t.increments('id').primary();
      t.integer('evaluation_id').unsigned().notNullable().references('id').inTable('faculty_co_evaluations').onDelete('CASCADE');
      t.integer('co_row_id').unsigned().notNullable().references('id').inTable('faculty_co_evaluation_cos').onDelete('CASCADE');
      t.integer('component_row_id').unsigned().notNullable().references('id').inTable('faculty_co_evaluation_components').onDelete('CASCADE');
      t.string('co_code', 32).notNullable();
      t.string('assessment_component_id', 64).notNullable();
      t.decimal('master_value', 10, 2).nullable();
      t.decimal('current_value', 10, 2).nullable();
      t.boolean('lecturer_editable').notNullable().defaultTo(true);
      t.text('master_justification').nullable();
      t.text('change_justification').nullable();
      t.string('mapping_basis', 128).nullable();
      t.string('source_origin', 64).nullable();
      t.string('verification_status', 64).nullable();
      t.json('snapshot_json').nullable();
      t.timestamps(true, true);
      t.unique(['evaluation_id', 'co_code', 'assessment_component_id'], 'fcecell_eval_co_comp_uid');
      t.index(['co_row_id']);
      t.index(['component_row_id']);
    });
  }

  if (!(await knex.schema.hasTable('co_evaluation_audit_log'))) {
    await knex.schema.createTable('co_evaluation_audit_log', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('evaluation_id').unsigned().notNullable().references('id').inTable('faculty_co_evaluations').onDelete('CASCADE');
      t.integer('cell_id').unsigned().nullable();
      t.integer('co_row_id').unsigned().nullable();
      t.integer('actor_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('actor_name', 255).nullable();
      t.string('action', 64).notNullable();
      t.json('metadata').nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['evaluation_id', 'created_at'], 'cea_eval_created_idx');
      t.index(['college_id', 'created_at'], 'cea_college_created_idx');
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('co_evaluation_audit_log');
  await knex.schema.dropTableIfExists('faculty_co_evaluation_cells');
  await knex.schema.dropTableIfExists('faculty_co_evaluation_cos');
  await knex.schema.dropTableIfExists('faculty_co_evaluation_components');
  await knex.schema.dropTableIfExists('faculty_co_evaluations');
  await knex.schema.dropTableIfExists('co_evaluation_review_queue');
  await knex.schema.dropTableIfExists('co_evaluation_sources');
  await knex.schema.dropTableIfExists('co_evaluation_justification_masters');
  await knex.schema.dropTableIfExists('co_evaluation_component_masters');
  await knex.schema.dropTableIfExists('co_evaluation_co_masters');
  await knex.schema.dropTableIfExists('co_evaluation_subject_masters');
  await knex.schema.dropTableIfExists('course_assessment_components');
  await knex.schema.dropTableIfExists('course_assessment_structures');
  await knex.schema.dropTableIfExists('assessment_component_masters');
  await knex.schema.dropTableIfExists('co_eval_import_batches');
};
