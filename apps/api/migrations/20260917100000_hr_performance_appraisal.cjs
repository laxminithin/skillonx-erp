/**
 * HRMS Performance & Appraisal — cycles, templates (versioned), goals,
 * employee appraisals, evidence snapshots, calibration, development plans.
 * Evaluation layer only; does not duplicate Employee/Academic/Attendance/Survey/T&P engines.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  // ── Rating scales ───────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_appraisal_rating_scales'))) {
    await knex.schema.createTable('hr_appraisal_rating_scales', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 32).notNullable();
      t.string('name', 128).notNullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.boolean('is_default').notNullable().defaultTo(false);
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'hars_college_code_uq' });
    });
  }

  if (!(await knex.schema.hasTable('hr_appraisal_rating_levels'))) {
    await knex.schema.createTable('hr_appraisal_rating_levels', (t) => {
      t.increments('id').primary();
      t.integer('scale_id').unsigned().notNullable().references('id').inTable('hr_appraisal_rating_scales').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.decimal('score', 8, 2).notNullable();
      t.string('label', 64).notNullable();
      t.decimal('min_score', 8, 2).nullable();
      t.decimal('max_score', 8, 2).nullable();
      t.integer('sort_order').unsigned().notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.unique(['scale_id', 'score'], { indexName: 'harl_scale_score_uq' });
    });
  }

  // ── Cycles ──────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_appraisal_cycles'))) {
    await knex.schema.createTable('hr_appraisal_cycles', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('name', 160).notNullable();
      t.string('code', 48).notNullable();
      t.date('period_start').notNullable();
      t.date('period_end').notNullable();
      t.date('goal_setting_start').nullable();
      t.date('goal_setting_end').nullable();
      t.date('self_review_start').nullable();
      t.date('self_review_end').nullable();
      t.date('review_start').nullable();
      t.date('review_end').nullable();
      t.date('calibration_start').nullable();
      t.date('calibration_end').nullable();
      t.date('review_cutoff_date').nullable(); // reviewer resolution / transfer cutoff
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.integer('default_template_id').unsigned().nullable();
      t.integer('rating_scale_id').unsigned().nullable().references('id').inTable('hr_appraisal_rating_scales').onDelete('SET NULL');
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('locked_at').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'hac_college_code_uq' });
      t.index(['college_id', 'status'], 'hac_college_status_idx');
    });
  }

  // ── Templates (versioned) ───────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_appraisal_templates'))) {
    await knex.schema.createTable('hr_appraisal_templates', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 48).notNullable();
      t.string('name', 160).notNullable();
      t.integer('version_no').unsigned().notNullable().defaultTo(1);
      t.integer('parent_template_id').unsigned().nullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT'); // DRAFT, ACTIVE, ARCHIVED
      t.decimal('total_weight', 8, 2).notNullable().defaultTo(100);
      t.integer('rating_scale_id').unsigned().nullable().references('id').inTable('hr_appraisal_rating_scales').onDelete('SET NULL');
      t.boolean('self_rating_enabled').notNullable().defaultTo(true);
      t.text('description').nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('published_at').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'code', 'version_no'], { indexName: 'hat_college_code_ver_uq' });
      t.index(['college_id', 'status'], 'hat_college_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('hr_appraisal_template_applicability'))) {
    await knex.schema.createTable('hr_appraisal_template_applicability', (t) => {
      t.increments('id').primary();
      t.integer('template_id').unsigned().notNullable().references('id').inTable('hr_appraisal_templates').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('employee_category', 32).nullable(); // FACULTY, NON_TEACHING, ...
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('CASCADE');
      t.integer('designation_id').unsigned().nullable().references('id').inTable('hr_designations').onDelete('CASCADE');
      t.integer('employment_type_id').unsigned().nullable().references('id').inTable('employment_types').onDelete('CASCADE');
      t.string('capability', 64).nullable(); // e.g. HOD, TNP_COORDINATOR
      t.timestamps(true, true);
      t.index(['template_id'], 'hata_template_idx');
    });
  }

  if (!(await knex.schema.hasTable('hr_appraisal_template_sections'))) {
    await knex.schema.createTable('hr_appraisal_template_sections', (t) => {
      t.increments('id').primary();
      t.integer('template_id').unsigned().notNullable().references('id').inTable('hr_appraisal_templates').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 48).notNullable();
      t.string('name', 160).notNullable();
      t.decimal('weight', 8, 2).notNullable().defaultTo(0);
      t.integer('sort_order').unsigned().notNullable().defaultTo(0);
      t.text('description').nullable();
      t.timestamps(true, true);
      t.unique(['template_id', 'code'], { indexName: 'hats_template_code_uq' });
    });
  }

  if (!(await knex.schema.hasTable('hr_appraisal_template_criteria'))) {
    await knex.schema.createTable('hr_appraisal_template_criteria', (t) => {
      t.increments('id').primary();
      t.integer('template_id').unsigned().notNullable().references('id').inTable('hr_appraisal_templates').onDelete('CASCADE');
      t.integer('section_id').unsigned().notNullable().references('id').inTable('hr_appraisal_template_sections').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 48).notNullable();
      t.string('name', 200).notNullable();
      t.text('description').nullable();
      t.decimal('weight', 8, 2).notNullable().defaultTo(0);
      t.string('measurement_type', 32).notNullable().defaultTo('RATING');
      // NUMERIC | PERCENTAGE | RATING | BOOLEAN | TEXT | SYSTEM_DERIVED
      t.decimal('target_value', 12, 4).nullable();
      t.boolean('self_rating_allowed').notNullable().defaultTo(true);
      t.boolean('reviewer_rating_allowed').notNullable().defaultTo(true);
      t.boolean('mandatory_evidence').notNullable().defaultTo(false);
      t.string('evidence_source', 64).nullable();
      // ATTENDANCE | ACADEMIC_WORKLOAD | LESSON_PLAN | RESULTS | SURVEY_FEEDBACK | TP | NONE
      t.integer('sort_order').unsigned().notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.unique(['template_id', 'code'], { indexName: 'hatc_template_code_uq' });
    });
  }

  // ── Employee appraisals ─────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_employee_appraisals'))) {
    await knex.schema.createTable('hr_employee_appraisals', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('cycle_id').unsigned().notNullable().references('id').inTable('hr_appraisal_cycles').onDelete('RESTRICT');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('RESTRICT');
      t.integer('template_id').unsigned().notNullable().references('id').inTable('hr_appraisal_templates').onDelete('RESTRICT');
      t.integer('template_version_no').unsigned().notNullable().defaultTo(1);
      t.integer('version_no').unsigned().notNullable().defaultTo(1);
      t.integer('parent_appraisal_id').unsigned().nullable();
      t.string('status', 40).notNullable().defaultTo('NOT_STARTED');
      t.integer('department_id').unsigned().nullable();
      t.integer('designation_id').unsigned().nullable();
      t.string('employee_category', 32).nullable();
      t.integer('reviewer_employee_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL');
      t.string('reviewer_source', 32).nullable(); // REPORTING_MANAGER | HOD | PRINCIPAL | CONFIGURED
      t.date('reviewer_resolved_as_of').nullable();
      t.decimal('self_score', 8, 2).nullable();
      t.decimal('reviewer_score', 8, 2).nullable();
      t.decimal('calibrated_score', 8, 2).nullable();
      t.decimal('final_score', 8, 2).nullable();
      t.string('final_rating_label', 64).nullable();
      t.decimal('final_rating_value', 8, 2).nullable();
      t.text('employee_summary').nullable();
      t.text('reviewer_summary').nullable();
      t.text('reviewer_private_notes').nullable(); // reviewer-only
      t.text('hr_notes').nullable(); // HR/calibration-only
      t.string('promotion_recommendation', 32).nullable(); // YES | NO | DEFER | null
      t.string('increment_recommendation', 32).nullable();
      t.string('probation_recommendation', 32).nullable(); // CONFIRM | EXTEND | TERMINATE | null
      t.text('recommendation_notes').nullable();
      t.timestamp('goals_locked_at').nullable();
      t.timestamp('self_submitted_at').nullable();
      t.timestamp('review_submitted_at').nullable();
      t.timestamp('calibrated_at').nullable();
      t.timestamp('finalized_at').nullable();
      t.timestamp('locked_at').nullable();
      t.integer('self_submitted_by').unsigned().nullable();
      t.integer('review_submitted_by').unsigned().nullable();
      t.integer('calibrated_by').unsigned().nullable();
      t.integer('finalized_by').unsigned().nullable();
      t.text('reopen_reason').nullable();
      t.integer('evidence_snapshot_version').unsigned().notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.unique(['college_id', 'cycle_id', 'employee_id', 'version_no'], { indexName: 'hea_college_cycle_emp_ver_uq' });
      t.index(['college_id', 'cycle_id', 'status'], 'hea_college_cycle_st_idx');
      t.index(['college_id', 'reviewer_employee_id', 'status'], 'hea_reviewer_st_idx');
      t.index(['college_id', 'department_id'], 'hea_college_dept_idx');
    });
  }

  // ── Goals / KRAs ────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_appraisal_goals'))) {
    await knex.schema.createTable('hr_appraisal_goals', (t) => {
      t.increments('id').primary();
      t.integer('appraisal_id').unsigned().notNullable().references('id').inTable('hr_employee_appraisals').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.string('title', 200).notNullable();
      t.text('description').nullable();
      t.string('category', 64).nullable();
      t.string('target', 500).nullable();
      t.decimal('weight', 8, 2).notNullable().defaultTo(0);
      t.date('start_date').nullable();
      t.date('end_date').nullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      // DRAFT | SUBMITTED | APPROVED | REJECTED | LOCKED | COMPLETED
      t.decimal('self_progress', 8, 2).nullable();
      t.decimal('self_rating', 8, 2).nullable();
      t.text('self_comments').nullable();
      t.decimal('reviewer_rating', 8, 2).nullable();
      t.text('reviewer_comments').nullable();
      t.integer('approved_by').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL');
      t.timestamp('approved_at').nullable();
      t.timestamps(true, true);
      t.index(['appraisal_id', 'status'], 'hag_appraisal_st_idx');
    });
  }

  // ── Criterion responses ─────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_appraisal_criterion_responses'))) {
    await knex.schema.createTable('hr_appraisal_criterion_responses', (t) => {
      t.increments('id').primary();
      t.integer('appraisal_id').unsigned().notNullable().references('id').inTable('hr_employee_appraisals').onDelete('CASCADE');
      t.integer('criterion_id').unsigned().notNullable().references('id').inTable('hr_appraisal_template_criteria').onDelete('RESTRICT');
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.decimal('self_rating', 8, 2).nullable();
      t.text('self_comments').nullable();
      t.decimal('reviewer_rating', 8, 2).nullable();
      t.text('reviewer_comments').nullable();
      t.decimal('system_value', 14, 4).nullable();
      t.string('system_display', 256).nullable();
      t.decimal('weighted_contribution', 10, 4).nullable();
      t.boolean('evidence_attached').notNullable().defaultTo(false);
      t.timestamps(true, true);
      t.unique(['appraisal_id', 'criterion_id'], { indexName: 'hacr_appraisal_crit_uq' });
    });
  }

  // ── Evidence snapshots (appraisal-owned) ────────────────────────────────
  if (!(await knex.schema.hasTable('hr_appraisal_evidence_snapshots'))) {
    await knex.schema.createTable('hr_appraisal_evidence_snapshots', (t) => {
      t.increments('id').primary();
      t.integer('appraisal_id').unsigned().notNullable().references('id').inTable('hr_employee_appraisals').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.integer('criterion_id').unsigned().nullable().references('id').inTable('hr_appraisal_template_criteria').onDelete('SET NULL');
      t.string('source_module', 48).notNullable();
      t.string('evidence_key', 64).notNullable();
      t.string('source_ref', 128).nullable();
      t.string('source_period', 64).nullable();
      t.decimal('value_numeric', 14, 4).nullable();
      t.string('value_display', 256).nullable();
      t.json('payload').nullable();
      t.string('calculation_version', 16).notNullable().defaultTo('1');
      t.integer('snapshot_version').unsigned().notNullable().defaultTo(1);
      t.timestamp('snapshot_at').notNullable();
      t.timestamps(true, true);
      t.unique(['appraisal_id', 'evidence_key', 'snapshot_version'], { indexName: 'haes_appraisal_key_ver_uq' });
      t.index(['appraisal_id', 'source_module'], 'haes_appraisal_src_idx');
    });
  }

  // ── Calibration history ─────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_appraisal_calibrations'))) {
    await knex.schema.createTable('hr_appraisal_calibrations', (t) => {
      t.increments('id').primary();
      t.integer('appraisal_id').unsigned().notNullable().references('id').inTable('hr_employee_appraisals').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.decimal('reviewer_score_before', 8, 2).nullable();
      t.decimal('calibrated_score', 8, 2).notNullable();
      t.string('calibrated_rating_label', 64).nullable();
      t.text('reason').notNullable();
      t.integer('actor_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['appraisal_id'], 'hacali_appraisal_idx');
    });
  }

  // ── Development plans ───────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_appraisal_development_plans'))) {
    await knex.schema.createTable('hr_appraisal_development_plans', (t) => {
      t.increments('id').primary();
      t.integer('appraisal_id').unsigned().notNullable().references('id').inTable('hr_employee_appraisals').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.string('status', 32).notNullable().defaultTo('OPEN');
      t.text('summary').nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['appraisal_id'], { indexName: 'hadp_appraisal_uq' });
    });
  }

  if (!(await knex.schema.hasTable('hr_appraisal_development_actions'))) {
    await knex.schema.createTable('hr_appraisal_development_actions', (t) => {
      t.increments('id').primary();
      t.integer('plan_id').unsigned().notNullable().references('id').inTable('hr_appraisal_development_plans').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('development_area', 200).notNullable();
      t.string('recommended_training', 200).nullable();
      t.string('target_competency', 200).nullable();
      t.text('action').nullable();
      t.integer('owner_employee_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL');
      t.date('due_date').nullable();
      t.string('status', 32).notNullable().defaultTo('OPEN');
      t.timestamps(true, true);
      t.index(['plan_id', 'status'], 'hada_plan_st_idx');
    });
  }

  // ── Lightweight PIP (optional, appraisal-scoped) ────────────────────────
  if (!(await knex.schema.hasTable('hr_appraisal_pips'))) {
    await knex.schema.createTable('hr_appraisal_pips', (t) => {
      t.increments('id').primary();
      t.integer('appraisal_id').unsigned().notNullable().references('id').inTable('hr_employee_appraisals').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.text('reason').notNullable();
      t.text('objectives').nullable();
      t.date('review_date').nullable();
      t.text('support_actions').nullable();
      t.integer('reviewer_employee_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL');
      t.string('status', 32).notNullable().defaultTo('OPEN');
      t.timestamps(true, true);
      t.unique(['appraisal_id'], { indexName: 'hapip_appraisal_uq' });
    });
  }

  // FK default_template_id after templates exist
  if (await knex.schema.hasTable('hr_appraisal_cycles')) {
    const hasFk = await knex.schema.hasColumn('hr_appraisal_cycles', 'default_template_id');
    if (hasFk) {
      try {
        await knex.schema.alterTable('hr_appraisal_cycles', (t) => {
          t.foreign('default_template_id', 'hac_default_template_fk')
            .references('id')
            .inTable('hr_appraisal_templates')
            .onDelete('SET NULL');
        });
      } catch {
        /* already exists */
      }
    }
  }
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('hr_appraisal_pips');
  await knex.schema.dropTableIfExists('hr_appraisal_development_actions');
  await knex.schema.dropTableIfExists('hr_appraisal_development_plans');
  await knex.schema.dropTableIfExists('hr_appraisal_calibrations');
  await knex.schema.dropTableIfExists('hr_appraisal_evidence_snapshots');
  await knex.schema.dropTableIfExists('hr_appraisal_criterion_responses');
  await knex.schema.dropTableIfExists('hr_appraisal_goals');
  await knex.schema.dropTableIfExists('hr_employee_appraisals');
  await knex.schema.dropTableIfExists('hr_appraisal_template_criteria');
  await knex.schema.dropTableIfExists('hr_appraisal_template_sections');
  await knex.schema.dropTableIfExists('hr_appraisal_template_applicability');
  await knex.schema.dropTableIfExists('hr_appraisal_templates');
  await knex.schema.dropTableIfExists('hr_appraisal_cycles');
  await knex.schema.dropTableIfExists('hr_appraisal_rating_levels');
  await knex.schema.dropTableIfExists('hr_appraisal_rating_scales');
};
