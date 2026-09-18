/**
 * Attainment & Continuous Improvement engine:
 * versioned academic standard, question-wise marks, attainment snapshots,
 * improvement cycles, and survey→CO links. Does not duplicate CO/PO masters.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const hasCol = async (table, column) => knex.schema.hasColumn(table, column);

  if (!(await knex.schema.hasTable('academic_standards'))) {
    await knex.schema.createTable('academic_standards', (t) => {
      t.increments('id').primary();
      t.string('code', 64).notNullable();
      t.string('name', 255).notNullable();
      t.string('scope', 32).notNullable().defaultTo('PLATFORM');
      t.string('scope_key', 128).notNullable();
      t.integer('college_id').unsigned().nullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('CASCADE');
      t.integer('course_id').unsigned().nullable().references('id').inTable('courses').onDelete('CASCADE');
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['code', 'scope_key'], 'astd_code_scope_uid');
    });
  }

  if (!(await knex.schema.hasTable('academic_standard_versions'))) {
    await knex.schema.createTable('academic_standard_versions', (t) => {
      t.increments('id').primary();
      t.integer('standard_id').unsigned().notNullable().references('id').inTable('academic_standards').onDelete('CASCADE');
      t.string('version', 32).notNullable();
      t.string('status', 32).notNullable().defaultTo('ACTIVE');
      t.boolean('is_current').notNullable().defaultTo(false);
      t.json('policy_json').notNullable();
      t.string('formula_version', 64).notNullable();
      t.timestamp('published_at').nullable();
      t.integer('published_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['standard_id', 'version'], 'astdv_std_ver_uid');
      t.index(['standard_id', 'is_current']);
    });
  }

  if (!(await knex.schema.hasTable('attainment_root_causes'))) {
    await knex.schema.createTable('attainment_root_causes', (t) => {
      t.increments('id').primary();
      t.string('code', 64).notNullable().unique();
      t.string('category', 32).notNullable();
      t.string('label', 255).notNullable();
      t.text('description').nullable();
      t.string('library_version', 32).notNullable().defaultTo('1.0');
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('attainment_corrective_actions'))) {
    await knex.schema.createTable('attainment_corrective_actions', (t) => {
      t.increments('id').primary();
      t.string('code', 64).notNullable().unique();
      t.string('label', 255).notNullable();
      t.string('category', 64).nullable();
      t.text('description').nullable();
      t.string('evidence_profile', 32).notNullable();
      t.string('library_version', 32).notNullable().defaultTo('1.0');
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('attainment_cause_action_links'))) {
    await knex.schema.createTable('attainment_cause_action_links', (t) => {
      t.increments('id').primary();
      t.integer('cause_id').unsigned().notNullable().references('id').inTable('attainment_root_causes').onDelete('CASCADE');
      t.integer('action_id').unsigned().notNullable().references('id').inTable('attainment_corrective_actions').onDelete('CASCADE');
      t.unique(['cause_id', 'action_id'], 'acal_unique');
    });
  }

  if (!(await knex.schema.hasTable('attainment_evidence_templates'))) {
    await knex.schema.createTable('attainment_evidence_templates', (t) => {
      t.increments('id').primary();
      t.string('evidence_profile', 32).notNullable();
      t.string('code', 64).notNullable();
      t.string('label', 255).notNullable();
      t.boolean('required').notNullable().defaultTo(true);
      t.string('auto_link_source', 64).nullable();
      t.string('library_version', 32).notNullable().defaultTo('1.0');
      t.unique(['evidence_profile', 'code'], 'aet_profile_code_uid');
    });
  }

  if (!(await knex.schema.hasTable('attainment_po_action_recs'))) {
    await knex.schema.createTable('attainment_po_action_recs', (t) => {
      t.increments('id').primary();
      t.string('po_code', 16).notNullable();
      t.string('label', 512).notNullable();
      t.string('action_code', 64).notNullable();
      t.string('library_version', 32).notNullable().defaultTo('1.0');
      t.unique(['po_code', 'action_code'], 'apar_po_action_uid');
    });
  }

  if (!(await knex.schema.hasTable('internal_qp_scheme_components'))) {
    await knex.schema.createTable('internal_qp_scheme_components', (t) => {
      t.increments('id').primary();
      t.integer('item_id').unsigned().notNullable().references('id').inTable('internal_question_paper_items').onDelete('CASCADE');
      t.string('code', 64).notNullable();
      t.string('label', 255).notNullable();
      t.decimal('max_marks', 10, 2).notNullable();
      t.integer('sort_order').unsigned().notNullable().defaultTo(0);
      t.index(['item_id']);
    });
  }

  if (await knex.schema.hasTable('internal_question_paper_items')) {
    if (!(await hasCol('internal_question_paper_items', 'secondary_co_code'))) {
      await knex.schema.alterTable('internal_question_paper_items', (t) => {
        t.string('secondary_co_code', 32).nullable();
        t.string('topic', 255).nullable();
        t.text('expected_key_points').nullable();
      });
    }
  }

  if (await knex.schema.hasTable('internal_question_papers')) {
    if (!(await hasCol('internal_question_papers', 'quality_snapshot'))) {
      await knex.schema.alterTable('internal_question_papers', (t) => {
        t.json('quality_snapshot').nullable();
        t.decimal('quality_score', 6, 2).nullable();
        t.string('quality_score_version', 64).nullable();
        t.timestamp('scheme_frozen_at').nullable();
      });
    }
  }

  if (!(await knex.schema.hasTable('survey_question_co_links'))) {
    await knex.schema.createTable('survey_question_co_links', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('question_id').unsigned().notNullable().references('id').inTable('questions').onDelete('CASCADE');
      t.integer('survey_id').unsigned().notNullable().references('id').inTable('surveys').onDelete('CASCADE');
      t.string('co_code', 32).notNullable();
      t.integer('course_outcome_id').unsigned().nullable();
      t.boolean('approved').notNullable().defaultTo(false);
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['question_id', 'co_code'], 'sqcl_q_co_uid');
      t.index(['college_id', 'survey_id']);
    });
  }

  if (!(await knex.schema.hasTable('assessment_mark_sheets'))) {
    await knex.schema.createTable('assessment_mark_sheets', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('created_by').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('RESTRICT');
      t.integer('academic_year_id').unsigned().nullable().references('id').inTable('academic_years').onDelete('SET NULL');
      t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
      t.integer('semester_id').unsigned().nullable().references('id').inTable('semesters').onDelete('SET NULL');
      t.integer('class_section_id').unsigned().nullable().references('id').inTable('class_sections').onDelete('SET NULL');
      t.string('source_kind', 32).notNullable();
      t.integer('source_id').unsigned().nullable();
      t.string('title', 255).nullable();
      t.decimal('max_marks', 10, 2).notNullable().defaultTo(0);
      t.string('see_method', 32).nullable();
      t.integer('see_paper_id').unsigned().nullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.boolean('frozen').notNullable().defaultTo(false);
      t.json('snapshot_json').nullable();
      t.timestamp('frozen_at').nullable();
      t.integer('frozen_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'course_id']);
      t.index(['college_id', 'created_by']);
      t.index(['college_id', 'source_kind', 'source_id'], 'ams_source_idx');
    });
  }

  if (!(await knex.schema.hasTable('assessment_mark_questions'))) {
    await knex.schema.createTable('assessment_mark_questions', (t) => {
      t.increments('id').primary();
      t.integer('sheet_id').unsigned().notNullable().references('id').inTable('assessment_mark_sheets').onDelete('CASCADE');
      t.string('question_key', 64).notNullable();
      t.string('label', 64).nullable();
      t.decimal('max_marks', 10, 2).notNullable();
      t.string('primary_co_code', 32).nullable();
      t.string('secondary_co_code', 32).nullable();
      t.string('bloom_level', 32).nullable();
      t.string('difficulty', 16).nullable();
      t.string('topic', 255).nullable();
      t.string('module_or_unit', 255).nullable();
      t.integer('sort_order').unsigned().notNullable().defaultTo(0);
      t.json('scheme_snapshot').nullable();
      t.unique(['sheet_id', 'question_key'], 'amq_sheet_key_uid');
    });
  }

  if (!(await knex.schema.hasTable('assessment_student_rows'))) {
    await knex.schema.createTable('assessment_student_rows', (t) => {
      t.increments('id').primary();
      t.integer('sheet_id').unsigned().notNullable().references('id').inTable('assessment_mark_sheets').onDelete('CASCADE');
      t.integer('student_id').unsigned().nullable().references('id').inTable('students').onDelete('SET NULL');
      t.string('usn', 32).notNullable();
      t.string('student_name', 255).nullable();
      t.string('status', 32).notNullable().defaultTo('PRESENT');
      t.decimal('total_awarded', 10, 2).nullable();
      t.timestamps(true, true);
      t.unique(['sheet_id', 'usn'], 'asr_sheet_usn_uid');
    });
  }

  if (!(await knex.schema.hasTable('assessment_student_question_marks'))) {
    await knex.schema.createTable('assessment_student_question_marks', (t) => {
      t.increments('id').primary();
      t.integer('student_row_id').unsigned().notNullable().references('id').inTable('assessment_student_rows').onDelete('CASCADE');
      t.integer('question_id').unsigned().notNullable().references('id').inTable('assessment_mark_questions').onDelete('CASCADE');
      t.decimal('awarded_marks', 10, 2).nullable();
      t.string('status', 32).notNullable().defaultTo('PRESENT');
      t.unique(['student_row_id', 'question_id'], 'asqm_unique');
    });
  }

  if (!(await knex.schema.hasTable('attainment_runs'))) {
    await knex.schema.createTable('attainment_runs', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('created_by').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('RESTRICT');
      t.integer('academic_year_id').unsigned().nullable().references('id').inTable('academic_years').onDelete('SET NULL');
      t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
      t.integer('semester_id').unsigned().nullable().references('id').inTable('semesters').onDelete('SET NULL');
      t.integer('class_section_id').unsigned().nullable().references('id').inTable('class_sections').onDelete('SET NULL');
      t.integer('policy_version_id').unsigned().nullable().references('id').inTable('academic_standard_versions').onDelete('SET NULL');
      t.json('policy_snapshot').notNullable();
      t.string('formula_version', 64).notNullable();
      t.string('status', 32).notNullable().defaultTo('PREVIEW');
      t.string('see_method', 32).nullable();
      t.string('see_confidence', 16).nullable();
      t.boolean('see_estimated').notNullable().defaultTo(false);
      t.integer('see_paper_id').unsigned().nullable();
      t.string('see_marks_source', 64).nullable();
      t.integer('superseded_by').unsigned().nullable();
      t.integer('reviewed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('calculated_at').notNullable().defaultTo(knex.fn.now());
      t.json('structure_snapshot').nullable();
      t.json('mapping_snapshot').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'course_id', 'status']);
      t.index(['college_id', 'created_by']);
    });
  }

  if (!(await knex.schema.hasTable('co_attainment_results'))) {
    await knex.schema.createTable('co_attainment_results', (t) => {
      t.increments('id').primary();
      t.integer('run_id').unsigned().notNullable().references('id').inTable('attainment_runs').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable();
      t.string('co_code', 32).notNullable();
      t.integer('course_outcome_id').unsigned().nullable();
      t.text('statement_snapshot').nullable();
      t.decimal('target', 10, 4).notNullable();
      t.decimal('cie_attainment', 10, 4).nullable();
      t.decimal('see_attainment', 10, 4).nullable();
      t.decimal('direct_attainment', 10, 4).nullable();
      t.decimal('indirect_attainment', 10, 4).nullable();
      t.decimal('final_attainment', 10, 4).nullable();
      t.decimal('gap', 10, 4).nullable();
      t.string('status', 32).notNullable();
      t.integer('student_count').unsigned().notNullable().defaultTo(0);
      t.integer('weak_student_count').unsigned().notNullable().defaultTo(0);
      t.json('formula_json').nullable();
      t.json('detail_json').nullable();
      t.unique(['run_id', 'co_code'], 'car_run_co_uid');
    });
  }

  if (!(await knex.schema.hasTable('co_attainment_sources'))) {
    await knex.schema.createTable('co_attainment_sources', (t) => {
      t.increments('id').primary();
      t.integer('result_id').unsigned().notNullable().references('id').inTable('co_attainment_results').onDelete('CASCADE');
      t.string('source_kind', 32).notNullable();
      t.string('source_id', 64).nullable();
      t.string('source_label', 255).nullable();
      t.string('category', 16).nullable();
      t.decimal('weight', 10, 4).nullable();
      t.decimal('attainment', 10, 4).nullable();
      t.integer('student_count').unsigned().nullable();
      t.string('confidence', 16).nullable();
      t.json('detail_json').nullable();
    });
  }

  if (!(await knex.schema.hasTable('co_attainment_students'))) {
    await knex.schema.createTable('co_attainment_students', (t) => {
      t.increments('id').primary();
      t.integer('result_id').unsigned().notNullable().references('id').inTable('co_attainment_results').onDelete('CASCADE');
      t.integer('student_id').unsigned().nullable();
      t.string('usn', 32).notNullable();
      t.string('student_name', 255).nullable();
      t.decimal('cie_percent', 10, 2).nullable();
      t.decimal('see_percent', 10, 2).nullable();
      t.string('see_method', 32).nullable();
      t.decimal('direct_level', 10, 4).nullable();
      t.decimal('indirect_level', 10, 4).nullable();
      t.decimal('final_level', 10, 4).nullable();
      t.boolean('below_threshold').notNullable().defaultTo(false);
    });
  }

  if (!(await knex.schema.hasTable('see_co_weights'))) {
    await knex.schema.createTable('see_co_weights', (t) => {
      t.increments('id').primary();
      t.integer('run_id').unsigned().notNullable().references('id').inTable('attainment_runs').onDelete('CASCADE');
      t.string('co_code', 32).notNullable();
      t.decimal('marks', 10, 2).nullable();
      t.decimal('weight', 10, 4).notNullable();
      t.string('method', 32).notNullable();
      t.unique(['run_id', 'co_code'], 'scw_run_co_uid');
    });
  }

  if (!(await knex.schema.hasTable('attainment_calc_details'))) {
    await knex.schema.createTable('attainment_calc_details', (t) => {
      t.increments('id').primary();
      t.integer('run_id').unsigned().notNullable().references('id').inTable('attainment_runs').onDelete('CASCADE');
      t.integer('result_id').unsigned().nullable().references('id').inTable('co_attainment_results').onDelete('CASCADE');
      t.string('step_key', 64).notNullable();
      t.text('formula').nullable();
      t.json('inputs_json').nullable();
      t.decimal('output', 12, 4).nullable();
    });
  }

  if (!(await knex.schema.hasTable('po_attainment_results'))) {
    await knex.schema.createTable('po_attainment_results', (t) => {
      t.increments('id').primary();
      t.integer('run_id').unsigned().notNullable().references('id').inTable('attainment_runs').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable();
      t.string('po_code', 16).notNullable();
      t.decimal('target', 10, 4).notNullable();
      t.decimal('attainment', 10, 4).nullable();
      t.decimal('gap', 10, 4).nullable();
      t.string('status', 32).notNullable();
      t.json('contributing_json').nullable();
      t.text('formula').nullable();
      t.unique(['run_id', 'po_code'], 'par_run_po_uid');
    });
  }

  if (!(await knex.schema.hasTable('pso_attainment_results'))) {
    await knex.schema.createTable('pso_attainment_results', (t) => {
      t.increments('id').primary();
      t.integer('run_id').unsigned().notNullable().references('id').inTable('attainment_runs').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable();
      t.string('pso_code', 16).notNullable();
      t.decimal('target', 10, 4).notNullable();
      t.decimal('attainment', 10, 4).nullable();
      t.decimal('gap', 10, 4).nullable();
      t.string('status', 32).notNullable();
      t.json('contributing_json').nullable();
      t.text('formula').nullable();
      t.unique(['run_id', 'pso_code'], 'psar_run_pso_uid');
    });
  }

  if (!(await knex.schema.hasTable('continuous_improvement_cycles'))) {
    await knex.schema.createTable('continuous_improvement_cycles', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('created_by').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('RESTRICT');
      t.integer('run_id').unsigned().nullable().references('id').inTable('attainment_runs').onDelete('SET NULL');
      t.integer('result_id').unsigned().nullable();
      t.string('kind', 8).notNullable().defaultTo('CO');
      t.string('outcome_code', 32).notNullable();
      t.string('state', 40).notNullable().defaultTo('DETECTED');
      t.decimal('target', 10, 4).nullable();
      t.decimal('actual', 10, 4).nullable();
      t.decimal('gap', 10, 4).nullable();
      t.decimal('previous_attainment', 10, 4).nullable();
      t.decimal('revised_attainment', 10, 4).nullable();
      t.decimal('improvement', 10, 4).nullable();
      t.integer('root_cause_id').unsigned().nullable().references('id').inTable('attainment_root_causes').onDelete('SET NULL');
      t.string('suggested_root_cause', 64).nullable();
      t.text('root_cause_other').nullable();
      t.text('faculty_notes').nullable();
      t.json('recommendation_json').nullable();
      t.json('weakness_json').nullable();
      t.integer('students_identified').unsigned().nullable();
      t.integer('closed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('closed_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'course_id', 'state']);
      t.index(['college_id', 'created_by']);
    });
  }

  if (!(await knex.schema.hasTable('improvement_actions'))) {
    await knex.schema.createTable('improvement_actions', (t) => {
      t.increments('id').primary();
      t.integer('cycle_id').unsigned().notNullable().references('id').inTable('continuous_improvement_cycles').onDelete('CASCADE');
      t.integer('action_id').unsigned().nullable().references('id').inTable('attainment_corrective_actions').onDelete('SET NULL');
      t.string('action_code', 64).nullable();
      t.string('label', 255).notNullable();
      t.boolean('planned').notNullable().defaultTo(true);
      t.boolean('implemented').notNullable().defaultTo(false);
      t.date('activity_date').nullable();
      t.string('duration', 64).nullable();
      t.integer('students_benefited').unsigned().nullable();
      t.text('notes').nullable();
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('improvement_evidence'))) {
    await knex.schema.createTable('improvement_evidence', (t) => {
      t.increments('id').primary();
      t.integer('cycle_id').unsigned().notNullable().references('id').inTable('continuous_improvement_cycles').onDelete('CASCADE');
      t.integer('action_row_id').unsigned().nullable().references('id').inTable('improvement_actions').onDelete('CASCADE');
      t.string('requirement_code', 64).notNullable();
      t.string('label', 255).notNullable();
      t.boolean('required').notNullable().defaultTo(true);
      t.boolean('satisfied').notNullable().defaultTo(false);
      t.boolean('auto_linked').notNullable().defaultTo(false);
      t.string('source_kind', 64).nullable();
      t.string('source_id', 64).nullable();
      t.text('note').nullable();
      t.json('file_meta').nullable();
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('improvement_reassessments'))) {
    await knex.schema.createTable('improvement_reassessments', (t) => {
      t.increments('id').primary();
      t.integer('cycle_id').unsigned().notNullable().references('id').inTable('continuous_improvement_cycles').onDelete('CASCADE');
      t.string('source_kind', 32).notNullable();
      t.integer('source_id').unsigned().nullable();
      t.string('co_code', 32).notNullable();
      t.integer('run_id').unsigned().nullable().references('id').inTable('attainment_runs').onDelete('SET NULL');
      t.decimal('revised_attainment', 10, 4).nullable();
      t.timestamp('completed_at').nullable();
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('improvement_approvals'))) {
    await knex.schema.createTable('improvement_approvals', (t) => {
      t.increments('id').primary();
      t.integer('cycle_id').unsigned().notNullable().references('id').inTable('continuous_improvement_cycles').onDelete('CASCADE');
      t.string('from_state', 40).nullable();
      t.string('to_state', 40).notNullable();
      t.integer('actor_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('actor_role', 32).nullable();
      t.string('decision', 32).notNullable();
      t.text('comment').nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('attainment_audit_log'))) {
    await knex.schema.createTable('attainment_audit_log', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable();
      t.integer('run_id').unsigned().nullable();
      t.integer('cycle_id').unsigned().nullable();
      t.integer('sheet_id').unsigned().nullable();
      t.integer('actor_id').unsigned().nullable();
      t.string('actor_name', 255).nullable();
      t.string('action', 64).notNullable();
      t.json('metadata').nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'created_at']);
      t.index(['run_id']);
      t.index(['cycle_id']);
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  const tables = [
    'attainment_audit_log',
    'improvement_approvals',
    'improvement_reassessments',
    'improvement_evidence',
    'improvement_actions',
    'continuous_improvement_cycles',
    'pso_attainment_results',
    'po_attainment_results',
    'attainment_calc_details',
    'see_co_weights',
    'co_attainment_students',
    'co_attainment_sources',
    'co_attainment_results',
    'attainment_runs',
    'assessment_student_question_marks',
    'assessment_student_rows',
    'assessment_mark_questions',
    'assessment_mark_sheets',
    'survey_question_co_links',
    'internal_qp_scheme_components',
    'attainment_po_action_recs',
    'attainment_evidence_templates',
    'attainment_cause_action_links',
    'attainment_corrective_actions',
    'attainment_root_causes',
    'academic_standard_versions',
    'academic_standards',
  ];
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
};
