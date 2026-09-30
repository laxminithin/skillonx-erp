/**
 * Alumni 360 Foundation (Phase C1).
 *
 * Extends the frozen Alumni Management module without creating a second
 * alumni database. New storage is limited to domains with no authoritative
 * source today: provenance, freshness config, structured willingness /
 * interest capabilities, staff suggestions, identity-resolution candidates,
 * merge audit, contact history, and employment career-timeline enrichment.
 *
 * Academic history, placements, finance receipts, mentoring assignments, and
 * event attendance remain projections from their authoritative modules.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  async function addProfileCol(name, build) {
    if (!(await knex.schema.hasColumn('alumni_profiles', name))) {
      await knex.schema.alterTable('alumni_profiles', (t) => build(t));
    }
  }
  if (await knex.schema.hasTable('alumni_profiles')) {
    await addProfileCol('phone_override', (t) => t.string('phone_override', 32).nullable());
    await addProfileCol('contact_verified_at', (t) => t.timestamp('contact_verified_at').nullable());
    await addProfileCol('willingness_confirmed_at', (t) => t.timestamp('willingness_confirmed_at').nullable());
    await addProfileCol('employment_confirmed_at', (t) => t.timestamp('employment_confirmed_at').nullable());
    for (const col of [
      'open_to_mentoring',
      'open_to_recruitment',
      'open_to_internships',
      'open_to_project_mentoring',
      'open_to_expert_sessions',
      'open_to_bos_advisory',
      'open_to_research_collaboration',
      'open_to_startup_mentoring',
      'open_to_industry_collaboration',
      'open_to_institutional_contribution',
    ]) {
      await addProfileCol(col, (t) => t.boolean(col).nullable());
    }
    await addProfileCol('comm_email_opt_in', (t) => t.boolean('comm_email_opt_in').notNullable().defaultTo(true));
    await addProfileCol('comm_sms_opt_in', (t) => t.boolean('comm_sms_opt_in').notNullable().defaultTo(false));
    await addProfileCol('comm_phone_opt_in', (t) => t.boolean('comm_phone_opt_in').notNullable().defaultTo(false));
    await addProfileCol('comm_whatsapp_opt_in', (t) => t.boolean('comm_whatsapp_opt_in').notNullable().defaultTo(false));
    await addProfileCol('directory_visible', (t) => t.boolean('directory_visible').notNullable().defaultTo(true));
    await addProfileCol('connection_visible', (t) => t.boolean('connection_visible').notNullable().defaultTo(true));
    await addProfileCol('professional_data_visible', (t) => t.boolean('professional_data_visible').notNullable().defaultTo(true));
    await addProfileCol('completeness_cache', (t) => t.json('completeness_cache').nullable());
    await addProfileCol('completeness_updated_at', (t) => t.timestamp('completeness_updated_at').nullable());
    await addProfileCol('technologies', (t) => t.json('technologies').nullable());
    await addProfileCol('domains_expertise', (t) => t.json('domains_expertise').nullable());
    await addProfileCol('industry_expertise', (t) => t.json('industry_expertise').nullable());
    await addProfileCol('research_expertise', (t) => t.json('research_expertise').nullable());
    await addProfileCol('certifications', (t) => t.json('certifications').nullable());
  }

  async function addEmpCol(name, build) {
    if (!(await knex.schema.hasColumn('alumni_employment', name))) {
      await knex.schema.alterTable('alumni_employment', (t) => build(t));
    }
  }
  if (await knex.schema.hasTable('alumni_employment')) {
    await addEmpCol('functional_area', (t) => t.string('functional_area', 128).nullable());
    await addEmpCol('seniority', (t) => t.string('seniority', 64).nullable());
    await addEmpCol('source_type', (t) => t.string('source_type', 32).notNullable().defaultTo('ALUMNI_SELF'));
    await addEmpCol('source_reference', (t) => t.string('source_reference', 255).nullable());
    await addEmpCol('captured_at', (t) => t.timestamp('captured_at').nullable());
    await addEmpCol('last_verified_at', (t) => t.timestamp('last_verified_at').nullable());
    await addEmpCol('verified_by', (t) => t.integer('verified_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL'));
    await addEmpCol('confidence', (t) => t.decimal('confidence', 5, 2).nullable());
    await addEmpCol('evidence_reference', (t) => t.string('evidence_reference', 512).nullable());
    await addEmpCol('is_archived', (t) => t.boolean('is_archived').notNullable().defaultTo(false));
  }

  async function addHsCol(name, build) {
    if (!(await knex.schema.hasColumn('alumni_higher_studies', name))) {
      await knex.schema.alterTable('alumni_higher_studies', (t) => build(t));
    }
  }
  if (await knex.schema.hasTable('alumni_higher_studies')) {
    await addHsCol('source_type', (t) => t.string('source_type', 32).notNullable().defaultTo('ALUMNI_SELF'));
    await addHsCol('source_reference', (t) => t.string('source_reference', 255).nullable());
    await addHsCol('verification_status', (t) => t.string('verification_status', 32).notNullable().defaultTo('SELF_DECLARED'));
    await addHsCol('last_verified_at', (t) => t.timestamp('last_verified_at').nullable());
  }

  if (!(await knex.schema.hasTable('alumni_field_provenance'))) {
    await knex.schema.createTable('alumni_field_provenance', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('alumni_profile_id').unsigned().notNullable().references('id').inTable('alumni_profiles').onDelete('CASCADE');
      t.string('entity_type', 64).notNullable(); // alumni_profile | alumni_employment | ...
      t.integer('entity_id').unsigned().nullable();
      t.string('field_name', 128).notNullable();
      t.string('source_type', 32).notNullable(); // ERP | ALUMNI_SELF | FACULTY | ...
      t.string('source_reference', 255).nullable();
      t.timestamp('captured_at').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      t.timestamp('last_verified_at').nullable();
      t.string('verification_status', 32).notNullable().defaultTo('SELF_DECLARED');
      t.integer('verified_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.decimal('confidence', 5, 2).nullable();
      t.string('evidence_reference', 512).nullable();
      t.text('value_snapshot').nullable();
      t.index(['college_id', 'alumni_profile_id', 'entity_type'], 'a360_prov_profile_entity_idx');
      t.index(['college_id', 'entity_type', 'entity_id'], 'a360_prov_entity_idx');
      t.unique(['alumni_profile_id', 'entity_type', 'entity_id', 'field_name'], { indexName: 'a360_prov_field_unique' });
    });
  }

  if (!(await knex.schema.hasTable('alumni_freshness_config'))) {
    await knex.schema.createTable('alumni_freshness_config', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('domain', 64).notNullable(); // EMPLOYMENT | CONTACT | WILLINGNESS | SKILLS
      t.integer('stale_after_days').notNullable().defaultTo(365);
      t.integer('confirm_after_days').notNullable().defaultTo(180);
      t.timestamps(true, true);
      t.unique(['college_id', 'domain'], { indexName: 'a360_fresh_college_domain_unique' });
    });
  }

  if (!(await knex.schema.hasTable('alumni_interest_capabilities'))) {
    await knex.schema.createTable('alumni_interest_capabilities', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('alumni_profile_id').unsigned().notNullable().references('id').inTable('alumni_profiles').onDelete('CASCADE');
      t.string('capability_domain', 32).notNullable(); // MENTORING | RECRUITMENT | ACADEMIC | INNOVATION | INDUSTRY | CONTRIBUTION
      t.json('details').nullable(); // domain-specific structured payload
      t.boolean('is_active').notNullable().defaultTo(true);
      t.string('source_type', 32).notNullable().defaultTo('ALUMNI_SELF');
      t.string('verification_status', 32).notNullable().defaultTo('SELF_DECLARED');
      t.timestamp('confirmed_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'alumni_profile_id', 'capability_domain'], 'a360_cap_profile_domain_idx');
      t.unique(['alumni_profile_id', 'capability_domain'], { indexName: 'a360_cap_profile_domain_unique' });
    });
  }

  if (!(await knex.schema.hasTable('alumni_profile_suggestions'))) {
    await knex.schema.createTable('alumni_profile_suggestions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('alumni_profile_id').unsigned().notNullable().references('id').inTable('alumni_profiles').onDelete('CASCADE');
      t.integer('suggested_by_faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      t.integer('suggested_by_department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.string('suggestion_type', 64).notNullable(); // EMPLOYMENT_UPDATE | CONTACT | ACHIEVEMENT | OTHER
      t.string('title', 255).notNullable();
      t.text('payload').notNullable(); // JSON string of proposed fields
      t.text('rationale').nullable();
      t.string('status', 32).notNullable().defaultTo('PENDING'); // PENDING | ACCEPTED | REJECTED | WITHDRAWN
      t.integer('reviewed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('reviewed_at').nullable();
      t.text('review_notes').nullable();
      t.integer('applied_entity_id').unsigned().nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'a360_sugg_college_status_idx');
      t.index(['college_id', 'alumni_profile_id'], 'a360_sugg_profile_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_identity_candidates'))) {
    await knex.schema.createTable('alumni_identity_candidates', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('primary_profile_id').unsigned().notNullable().references('id').inTable('alumni_profiles').onDelete('CASCADE');
      t.integer('candidate_profile_id').unsigned().notNullable().references('id').inTable('alumni_profiles').onDelete('CASCADE');
      t.string('match_reason', 128).notNullable(); // EMAIL | PHONE | NAME_USN | NAME_GRAD_YEAR | IMPORT
      t.decimal('match_score', 5, 2).notNullable().defaultTo(0);
      t.json('evidence').nullable();
      t.string('status', 32).notNullable().defaultTo('OPEN'); // OPEN | MERGED | DISMISSED | AMBIGUOUS
      t.timestamps(true, true);
      t.unique(['primary_profile_id', 'candidate_profile_id'], { indexName: 'a360_id_cand_pair_unique' });
      t.index(['college_id', 'status'], 'a360_id_cand_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_merge_audit'))) {
    await knex.schema.createTable('alumni_merge_audit', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('survivor_profile_id').unsigned().notNullable().references('id').inTable('alumni_profiles').onDelete('RESTRICT');
      t.integer('merged_profile_id').unsigned().notNullable(); // may be archived
      t.integer('acted_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('before_snapshot').nullable();
      t.text('after_snapshot').nullable();
      t.text('reason').nullable();
      t.string('status', 32).notNullable().defaultTo('COMPLETED');
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'survivor_profile_id'], 'a360_merge_survivor_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_contact_history'))) {
    await knex.schema.createTable('alumni_contact_history', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('alumni_profile_id').unsigned().notNullable().references('id').inTable('alumni_profiles').onDelete('CASCADE');
      t.string('field_name', 64).notNullable(); // email | phone_override | current_city | current_country
      t.text('old_value').nullable();
      t.text('new_value').nullable();
      t.string('source_type', 32).notNullable().defaultTo('ALUMNI_SELF');
      t.integer('changed_by_alumni_id').unsigned().nullable();
      t.integer('changed_by_faculty_id').unsigned().nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'alumni_profile_id', 'field_name'], 'a360_contact_hist_idx');
    });
  }
};

exports.down = async function down(knex) {
  for (const table of [
    'alumni_contact_history',
    'alumni_merge_audit',
    'alumni_identity_candidates',
    'alumni_profile_suggestions',
    'alumni_interest_capabilities',
    'alumni_freshness_config',
    'alumni_field_provenance',
  ]) {
    if (await knex.schema.hasTable(table)) await knex.schema.dropTable(table);
  }
};
