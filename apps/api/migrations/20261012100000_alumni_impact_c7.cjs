/**
 * Alumni Institutional Impact, Accreditation & Executive Analytics (Phase C7).
 *
 * Measurement/evidence layer over C1–C6. Does not invent impact.
 * Activity ≠ engagement ≠ opportunity ≠ outcome ≠ impact without evidence.
 * Projects authoritative sources; never edits them.
 * Accreditation mappings are configurable — no hard-coded NBA/NAAC criteria.
 *
 * FK names kept short for MySQL 64-char identifier limit.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const fk = (col, table, onDelete, name) =>
    col.unsigned().references('id').inTable(table).onDelete(onDelete).withKeyName(name);

  // ── Metric registry (versioned definitions) ─────────────────────────────
  if (!(await knex.schema.hasTable('alumni_impact_metric_defs'))) {
    await knex.schema.createTable('alumni_impact_metric_defs', (t) => {
      t.increments('id').primary();
      /** Null = system-wide seed; college_id set for college overrides only */
      fk(t.integer('college_id').nullable(), 'colleges', 'CASCADE', 'aimd_college_fk');
      t.string('metric_key', 96).notNullable();
      t.string('name', 255).notNullable();
      t.text('description').nullable();
      /** IMPACT_DOMAIN taxonomy code */
      t.string('impact_domain', 48).notNullable();
      /** COUNT | RATE | UNIQUE_COUNT | SUM | FUNNEL_STAGE | RATIO */
      t.string('calculation_type', 32).notNullable().defaultTo('COUNT');
      t.text('numerator_definition').nullable();
      t.text('denominator_definition').nullable();
      /** count | percent | ratio | hours | currency_ref */
      t.string('unit', 32).notNullable().defaultTo('count');
      /** JSON array of source module codes e.g. ["C1","C2"] */
      t.text('source_modules').nullable();
      t.text('evidence_requirements').nullable();
      /** JSON array of dimensions: institution, department, programme, batch, graduation_year */
      t.text('supported_dimensions').nullable();
      t.string('freshness_expectations', 128).nullable();
      t.integer('version').unsigned().notNullable().defaultTo(1);
      t.date('active_from').notNullable();
      t.date('retired_at').nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'metric_key', 'version'], { indexName: 'aimd_key_ver_uq' });
      t.index(['metric_key', 'is_active'], 'aimd_key_active_idx');
      t.index(['impact_domain'], 'aimd_domain_idx');
    });
  }

  // ── Evidence ledger (projection references — not a second SoT) ──────────
  if (!(await knex.schema.hasTable('alumni_impact_evidence_ledger'))) {
    await knex.schema.createTable('alumni_impact_evidence_ledger', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aiel_college_fk');
      t.string('impact_domain', 48).notNullable();
      t.string('metric_key', 96).nullable();
      /**
       * C1_PROFILE | C2_OUTCOME | C2_INTERACTION | C4_CAMPAIGN | C5_NEED |
       * C5_FULFILMENT | C6_RECOGNITION | C6_VALUE | C6_COMMUNITY |
       * FINANCE_REF | PLACEMENT_REF | STUDENT_PROJECT | OTHER
       */
      t.string('source_type', 48).notNullable();
      t.string('source_reference', 255).notNullable();
      t.string('evidence_reference', 512).nullable();
      fk(t.integer('department_id').nullable(), 'departments', 'SET NULL', 'aiel_dept_fk');
      fk(t.integer('programme_id').nullable(), 'programs', 'SET NULL', 'aiel_prog_fk');
      t.string('academic_year', 32).nullable();
      t.date('event_date').nullable();
      /** UNVERIFIED | PENDING | VERIFIED | REJECTED | PROJECTED */
      t.string('verification_status', 32).notNullable().defaultTo('PROJECTED');
      fk(t.integer('verified_by').nullable(), 'faculty_users', 'SET NULL', 'aiel_verifier_fk');
      t.timestamp('verified_at').nullable();
      /** DIRECT | SUPPORTED | ASSOCIATED | UNKNOWN */
      t.string('attribution_level', 32).notNullable().defaultTo('UNKNOWN');
      fk(t.integer('alumni_profile_id').nullable(), 'alumni_profiles', 'SET NULL', 'aiel_alumni_fk');
      t.string('beneficiary_type', 32).nullable();
      t.string('beneficiary_ref', 128).nullable();
      t.integer('quantity').unsigned().nullable();
      t.text('notes').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'impact_domain', 'event_date'], 'aiel_domain_date_idx');
      t.index(['college_id', 'metric_key'], 'aiel_metric_idx');
      t.index(['college_id', 'source_type', 'source_reference'], 'aiel_source_idx');
      t.index(['college_id', 'verification_status'], 'aiel_verify_idx');
      t.index(['college_id', 'department_id'], 'aiel_dept_idx');
      t.unique(['college_id', 'source_type', 'source_reference', 'metric_key'], {
        indexName: 'aiel_proj_uq',
      });
    });
  }

  // ── Accreditation frameworks (configurable — empty until institution maps) ─
  if (!(await knex.schema.hasTable('alumni_impact_accred_frameworks'))) {
    await knex.schema.createTable('alumni_impact_accred_frameworks', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aiaf_college_fk');
      t.string('code', 48).notNullable();
      t.string('label', 255).notNullable();
      t.text('description').nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      fk(t.integer('created_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'aiaf_created_fk');
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'aiaf_college_code_uq' });
    });
  }

  if (!(await knex.schema.hasTable('alumni_impact_accred_criteria'))) {
    await knex.schema.createTable('alumni_impact_accred_criteria', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aiac_college_fk');
      fk(t.integer('framework_id').notNullable(), 'alumni_impact_accred_frameworks', 'CASCADE', 'aiac_fw_fk');
      t.string('code', 64).notNullable();
      t.string('label', 255).notNullable();
      t.string('parent_code', 64).nullable();
      t.text('description').nullable();
      t.integer('sort_order').notNullable().defaultTo(0);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['framework_id', 'code'], { indexName: 'aiac_fw_code_uq' });
      t.index(['college_id', 'framework_id'], 'aiac_college_fw_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_impact_accred_mappings'))) {
    await knex.schema.createTable('alumni_impact_accred_mappings', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aiam_college_fk');
      fk(t.integer('framework_id').notNullable(), 'alumni_impact_accred_frameworks', 'CASCADE', 'aiam_fw_fk');
      fk(t.integer('criterion_id').notNullable(), 'alumni_impact_accred_criteria', 'CASCADE', 'aiam_crit_fk');
      t.string('metric_key', 96).nullable();
      t.string('impact_domain', 48).nullable();
      t.string('outcome_type', 64).nullable();
      t.string('academic_year', 32).nullable();
      t.text('evidence_references').nullable();
      t.text('notes').nullable();
      /** DRAFT | ACTIVE | VERIFIED | ARCHIVED */
      t.string('verification_status', 32).notNullable().defaultTo('DRAFT');
      fk(t.integer('verified_by').nullable(), 'faculty_users', 'SET NULL', 'aiam_verifier_fk');
      t.timestamp('verified_at').nullable();
      fk(t.integer('created_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'aiam_created_fk');
      t.timestamps(true, true);
      t.index(['college_id', 'framework_id', 'criterion_id'], 'aiam_map_idx');
      t.index(['college_id', 'metric_key'], 'aiam_metric_idx');
      t.index(['college_id', 'academic_year'], 'aiam_year_idx');
    });
  }

  // ── Immutable report snapshots ──────────────────────────────────────────
  if (!(await knex.schema.hasTable('alumni_impact_report_snapshots'))) {
    await knex.schema.createTable('alumni_impact_report_snapshots', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'airs_college_fk');
      /** ANNUAL_IMPACT | DEPARTMENT | MENTORSHIP | RECRUITMENT_INTERNSHIP |
       * EXPERT_INDUSTRY | RECOGNITION_VALUE | ACCREDITATION_EVIDENCE | DATA_QUALITY | CUSTOM */
      t.string('report_type', 48).notNullable();
      t.string('title', 255).notNullable();
      t.string('period_type', 32).notNullable().defaultTo('ACADEMIC_YEAR');
      t.string('period_label', 64).nullable();
      t.date('period_start').nullable();
      t.date('period_end').nullable();
      t.boolean('period_complete').notNullable().defaultTo(true);
      /** JSON filters: departmentId, programmeId, batch, graduationYear, impactDomain */
      t.text('filters_json').nullable();
      /** JSON: metric_key → { version, definition snapshot, result } */
      t.text('metric_defs_json').notNullable();
      t.text('results_json').notNullable();
      t.text('evidence_refs_json').nullable();
      t.text('data_quality_json').nullable();
      t.string('status', 32).notNullable().defaultTo('FINAL');
      fk(t.integer('generated_by').nullable(), 'faculty_users', 'SET NULL', 'airs_gen_fk');
      t.timestamp('generated_at').notNullable().defaultTo(knex.fn.now());
      t.timestamps(true, true);
      t.index(['college_id', 'report_type', 'period_label'], 'airs_type_period_idx');
      t.index(['college_id', 'generated_at'], 'airs_gen_idx');
    });
  }

  // ── College config (privacy thresholds etc.) ─────────────────────────────
  if (!(await knex.schema.hasTable('alumni_impact_config'))) {
    await knex.schema.createTable('alumni_impact_config', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aicfg_college_fk');
      /** Suppress individual drill-down below this cohort size */
      t.integer('small_cohort_threshold').notNullable().defaultTo(5);
      /** Meaningful engagement lookback months (metric version context) */
      t.integer('engagement_lookback_months').notNullable().defaultTo(12);
      t.timestamps(true, true);
      t.unique(['college_id'], { indexName: 'aicfg_college_uq' });
    });
  }
};

exports.down = async function down(knex) {
  for (const table of [
    'alumni_impact_config',
    'alumni_impact_report_snapshots',
    'alumni_impact_accred_mappings',
    'alumni_impact_accred_criteria',
    'alumni_impact_accred_frameworks',
    'alumni_impact_evidence_ledger',
    'alumni_impact_metric_defs',
  ]) {
    await knex.schema.dropTableIfExists(table);
  }
};
