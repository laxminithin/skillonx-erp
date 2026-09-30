/**
 * Alumni Relationship CRM & Interaction Timeline (Phase C2).
 *
 * Institutional relationship layer around every alumnus. Does NOT duplicate
 * authoritative Event / Mentoring / T&P / Finance / Achievement records —
 * those remain source-projected into the timeline.
 *
 * New storage is limited to CRM-owned domains: relationship record, manual
 * interactions, follow-ups, CRM opportunities (distinct from job-board
 * alumni_opportunities), outcomes, notes, ownership/stage history.
 *
 * WhatsApp / email / SMS / telephony delivery status is NOT stored as fact
 * unless an integration later supplies it (capture_mode distinguishes MANUAL).
 *
 * FK constraint names are kept short for MySQL's 64-char identifier limit.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const fk = (col, table, onDelete, name) =>
    col.unsigned().references('id').inTable(table).onDelete(onDelete).withKeyName(name);

  if (!(await knex.schema.hasTable('alumni_relationships'))) {
    await knex.schema.createTable('alumni_relationships', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'arel_college_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'arel_profile_fk');
      t.string('relationship_stage', 32).notNullable().defaultTo('IDENTIFIED');
      t.string('relationship_owner_type', 32).nullable();
      fk(t.integer('relationship_owner_id').nullable(), 'faculty_users', 'SET NULL', 'arel_owner_fk');
      fk(t.integer('department_id').nullable(), 'departments', 'SET NULL', 'arel_dept_fk');
      t.timestamp('first_contact_at').nullable();
      t.timestamp('last_contact_at').nullable();
      t.timestamp('last_response_at').nullable();
      t.timestamp('last_engagement_at').nullable();
      t.timestamp('next_action_at').nullable();
      t.string('relationship_status', 32).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.unique(['alumni_profile_id'], { indexName: 'arel_profile_unique' });
      t.index(['college_id', 'relationship_stage'], 'arel_college_stage_idx');
      t.index(['college_id', 'relationship_owner_id'], 'arel_owner_idx');
      t.index(['college_id', 'next_action_at'], 'arel_next_action_idx');
      t.index(['college_id', 'last_contact_at'], 'arel_last_contact_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_relationship_stage_history'))) {
    await knex.schema.createTable('alumni_relationship_stage_history', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'arsh_college_fk');
      fk(t.integer('relationship_id').notNullable(), 'alumni_relationships', 'CASCADE', 'arsh_rel_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'arsh_profile_fk');
      t.string('from_stage', 32).nullable();
      t.string('to_stage', 32).notNullable();
      t.string('reason', 255).notNullable();
      t.string('rule_code', 64).nullable();
      t.boolean('explicit').notNullable().defaultTo(false);
      fk(t.integer('acted_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'arsh_actor_fk');
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'alumni_profile_id', 'created_at'], 'arsh_profile_time_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_relationship_ownership_history'))) {
    await knex.schema.createTable('alumni_relationship_ownership_history', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aroh_college_fk');
      fk(t.integer('relationship_id').notNullable(), 'alumni_relationships', 'CASCADE', 'aroh_rel_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'aroh_profile_fk');
      t.integer('from_owner_id').unsigned().nullable();
      t.string('from_owner_type', 32).nullable();
      t.integer('to_owner_id').unsigned().nullable();
      t.string('to_owner_type', 32).nullable();
      t.integer('from_department_id').unsigned().nullable();
      t.integer('to_department_id').unsigned().nullable();
      t.text('reason').nullable();
      fk(t.integer('acted_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'aroh_actor_fk');
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'alumni_profile_id'], 'aroh_profile_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_crm_collaborators'))) {
    await knex.schema.createTable('alumni_crm_collaborators', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'accol_college_fk');
      fk(t.integer('relationship_id').notNullable(), 'alumni_relationships', 'CASCADE', 'accol_rel_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'accol_profile_fk');
      fk(t.integer('faculty_user_id').notNullable(), 'faculty_users', 'CASCADE', 'accol_faculty_fk');
      fk(t.integer('department_id').nullable(), 'departments', 'SET NULL', 'accol_dept_fk');
      t.string('role_label', 64).nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['relationship_id', 'faculty_user_id'], { indexName: 'accol_unique' });
      t.index(['college_id', 'alumni_profile_id'], 'accol_profile_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_crm_interactions'))) {
    await knex.schema.createTable('alumni_crm_interactions', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aci_college_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'aci_profile_fk');
      fk(t.integer('relationship_id').nullable(), 'alumni_relationships', 'SET NULL', 'aci_rel_fk');
      t.string('interaction_type', 32).notNullable();
      t.string('channel', 32).nullable();
      t.string('direction', 16).notNullable().defaultTo('OUTBOUND');
      t.string('purpose', 255).nullable();
      t.text('summary').nullable();
      t.string('outcome_status', 32).nullable();
      t.timestamp('occurred_at').notNullable();
      fk(t.integer('actor_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'aci_actor_fk');
      t.json('participant_faculty_ids').nullable();
      t.boolean('follow_up_required').notNullable().defaultTo(false);
      t.timestamp('next_action_at').nullable();
      t.text('next_action_summary').nullable();
      t.integer('related_opportunity_id').unsigned().nullable();
      t.string('capture_mode', 32).notNullable().defaultTo('MANUAL');
      t.string('visibility', 32).notNullable().defaultTo('INSTITUTIONAL');
      t.string('evidence_reference', 512).nullable();
      t.boolean('is_contact_attempt').notNullable().defaultTo(false);
      t.boolean('is_meaningful_engagement').notNullable().defaultTo(false);
      t.timestamps(true, true);
      t.index(['college_id', 'alumni_profile_id', 'occurred_at'], 'aci_profile_time_idx');
      t.index(['college_id', 'actor_faculty_id', 'occurred_at'], 'aci_actor_time_idx');
      t.index(['college_id', 'outcome_status'], 'aci_outcome_idx');
      t.index(['related_opportunity_id'], 'aci_related_opp_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_crm_followups'))) {
    await knex.schema.createTable('alumni_crm_followups', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'acf_college_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'acf_profile_fk');
      fk(t.integer('relationship_id').nullable(), 'alumni_relationships', 'SET NULL', 'acf_rel_fk');
      fk(t.integer('interaction_id').nullable(), 'alumni_crm_interactions', 'SET NULL', 'acf_ix_fk');
      t.integer('opportunity_id').unsigned().nullable();
      fk(t.integer('owner_faculty_id').notNullable(), 'faculty_users', 'RESTRICT', 'acf_owner_fk');
      fk(t.integer('department_id').nullable(), 'departments', 'SET NULL', 'acf_dept_fk');
      t.date('due_date').notNullable();
      t.string('priority', 16).notNullable().defaultTo('NORMAL');
      t.string('reason', 255).notNullable();
      t.text('notes').nullable();
      t.string('status', 16).notNullable().defaultTo('OPEN');
      t.timestamp('completed_at').nullable();
      fk(t.integer('completed_by').nullable(), 'faculty_users', 'SET NULL', 'acf_done_fk');
      t.timestamps(true, true);
      t.index(['college_id', 'owner_faculty_id', 'status', 'due_date'], 'acf_owner_idx');
      t.index(['college_id', 'department_id', 'status', 'due_date'], 'acf_dept_idx');
      t.index(['college_id', 'alumni_profile_id', 'status'], 'acf_profile_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_crm_opportunities'))) {
    await knex.schema.createTable('alumni_crm_opportunities', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aco_college_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'aco_profile_fk');
      fk(t.integer('relationship_id').nullable(), 'alumni_relationships', 'SET NULL', 'aco_rel_fk');
      t.string('opportunity_type', 32).notNullable();
      t.string('title', 255).notNullable();
      t.text('description').nullable();
      fk(t.integer('identified_by').nullable(), 'faculty_users', 'SET NULL', 'aco_id_by_fk');
      t.timestamp('identified_at').notNullable().defaultTo(knex.fn.now());
      fk(t.integer('owner_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'aco_owner_fk');
      fk(t.integer('department_id').nullable(), 'departments', 'SET NULL', 'aco_dept_fk');
      t.string('status', 32).notNullable().defaultTo('IDENTIFIED');
      t.string('expected_outcome', 255).nullable();
      t.date('target_date').nullable();
      fk(t.integer('source_interaction_id').nullable(), 'alumni_crm_interactions', 'SET NULL', 'aco_src_ix_fk');
      t.timestamps(true, true);
      t.index(['college_id', 'status', 'opportunity_type'], 'aco_status_idx');
      t.index(['college_id', 'alumni_profile_id', 'status'], 'aco_profile_idx');
      t.index(['college_id', 'owner_faculty_id', 'status'], 'aco_owner_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_crm_outcomes'))) {
    await knex.schema.createTable('alumni_crm_outcomes', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'acout_college_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'acout_profile_fk');
      fk(t.integer('opportunity_id').nullable(), 'alumni_crm_opportunities', 'SET NULL', 'acout_opp_fk');
      fk(t.integer('interaction_id').nullable(), 'alumni_crm_interactions', 'SET NULL', 'acout_ix_fk');
      t.string('outcome_type', 64).notNullable();
      t.string('title', 255).notNullable();
      t.text('description').nullable();
      t.integer('quantity').unsigned().nullable();
      t.string('beneficiary_type', 32).nullable();
      t.json('beneficiary_refs').nullable();
      t.string('source_type', 32).notNullable().defaultTo('CRM_MANUAL');
      t.string('source_reference', 255).nullable();
      t.string('evidence_reference', 512).nullable();
      t.string('verification_status', 32).notNullable().defaultTo('UNVERIFIED');
      fk(t.integer('verified_by').nullable(), 'faculty_users', 'SET NULL', 'acout_verifier_fk');
      t.timestamp('verified_at').nullable();
      t.date('outcome_date').notNullable();
      fk(t.integer('recorded_by').nullable(), 'faculty_users', 'SET NULL', 'acout_recorder_fk');
      t.timestamps(true, true);
      t.index(['college_id', 'verification_status'], 'acout_verify_idx');
      t.index(['college_id', 'alumni_profile_id'], 'acout_profile_idx');
      t.index(['college_id', 'opportunity_id'], 'acout_opp_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_crm_notes'))) {
    await knex.schema.createTable('alumni_crm_notes', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'acn_college_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'acn_profile_fk');
      fk(t.integer('relationship_id').nullable(), 'alumni_relationships', 'SET NULL', 'acn_rel_fk');
      fk(t.integer('followup_id').nullable(), 'alumni_crm_followups', 'SET NULL', 'acn_fu_fk');
      fk(t.integer('opportunity_id').nullable(), 'alumni_crm_opportunities', 'SET NULL', 'acn_opp_fk');
      t.string('note_type', 32).notNullable().defaultTo('GENERAL_RELATIONSHIP_NOTE');
      t.text('body').notNullable();
      t.string('visibility', 32).notNullable().defaultTo('INSTITUTIONAL');
      fk(t.integer('author_faculty_id').notNullable(), 'faculty_users', 'RESTRICT', 'acn_author_fk');
      t.boolean('is_deleted').notNullable().defaultTo(false);
      fk(t.integer('deleted_by').nullable(), 'faculty_users', 'SET NULL', 'acn_deleted_fk');
      t.timestamp('deleted_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'alumni_profile_id', 'is_deleted'], 'acn_profile_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_crm_config'))) {
    await knex.schema.createTable('alumni_crm_config', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'accfg_college_fk');
      t.integer('recent_contact_warn_days').notNullable().defaultTo(7);
      t.integer('dormant_after_days').notNullable().defaultTo(180);
      t.integer('no_contact_review_days').notNullable().defaultTo(90);
      t.timestamps(true, true);
      t.unique(['college_id'], { indexName: 'accfg_college_unique' });
    });
  }
};

exports.down = async function down(knex) {
  for (const table of [
    'alumni_crm_notes',
    'alumni_crm_outcomes',
    'alumni_crm_opportunities',
    'alumni_crm_followups',
    'alumni_crm_interactions',
    'alumni_crm_collaborators',
    'alumni_relationship_ownership_history',
    'alumni_relationship_stage_history',
    'alumni_relationships',
    'alumni_crm_config',
  ]) {
    if (await knex.schema.hasTable(table)) await knex.schema.dropTable(table);
  }
};
