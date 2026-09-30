/**
 * Alumni Engagement & Campaign Orchestration (Phase C4).
 *
 * Orchestration layer over C1 preferences, C2 CRM, and C3 segments.
 * Does NOT integrate WhatsApp / email / SMS / telephony delivery.
 * Channel adapters report MANUAL_ONLY / CONFIGURED / UNAVAILABLE honestly.
 * Delivery/open/read telemetry is NEVER stored as fact without a real provider.
 *
 * FK constraint names are kept short for MySQL's 64-char identifier limit.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const fk = (col, table, onDelete, name) =>
    col.unsigned().references('id').inTable(table).onDelete(onDelete).withKeyName(name);

  // ── Preference centre extensions (C1) ───────────────────────────────────
  const prefCols = [
    ['pref_events_opt_in', (t) => t.boolean('pref_events_opt_in').notNullable().defaultTo(true)],
    ['pref_mentorship_opt_in', (t) => t.boolean('pref_mentorship_opt_in').notNullable().defaultTo(true)],
    ['pref_recruitment_opt_in', (t) => t.boolean('pref_recruitment_opt_in').notNullable().defaultTo(true)],
    ['pref_networking_opt_in', (t) => t.boolean('pref_networking_opt_in').notNullable().defaultTo(true)],
    ['pref_research_opt_in', (t) => t.boolean('pref_research_opt_in').notNullable().defaultTo(true)],
    ['pref_entrepreneurship_opt_in', (t) => t.boolean('pref_entrepreneurship_opt_in').notNullable().defaultTo(true)],
    ['pref_contribution_opt_in', (t) => t.boolean('pref_contribution_opt_in').notNullable().defaultTo(true)],
    ['pref_institution_updates_opt_in', (t) => t.boolean('pref_institution_updates_opt_in').notNullable().defaultTo(true)],
    ['global_comm_opt_out', (t) => t.boolean('global_comm_opt_out').notNullable().defaultTo(false)],
    ['global_opt_out_at', (t) => t.timestamp('global_opt_out_at').nullable()],
    ['global_opt_out_reason', (t) => t.string('global_opt_out_reason', 255).nullable()],
    ['temporary_unavailable_until', (t) => t.timestamp('temporary_unavailable_until').nullable()],
    ['temporary_unavailable_reason', (t) => t.string('temporary_unavailable_reason', 255).nullable()],
  ];
  for (const [name, add] of prefCols) {
    if (!(await knex.schema.hasColumn('alumni_profiles', name))) {
      await knex.schema.alterTable('alumni_profiles', (t) => add(t));
    }
  }

  // ── Configurable engagement categories ──────────────────────────────────
  if (!(await knex.schema.hasTable('alumni_engagement_categories'))) {
    await knex.schema.createTable('alumni_engagement_categories', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aecat_college_fk');
      t.string('code', 48).notNullable();
      t.string('label', 128).notNullable();
      t.boolean('is_system').notNullable().defaultTo(false);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.integer('sort_order').notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'aecat_college_code_uq' });
    });
  }

  // ── Fatigue / suppression rules (per college + category) ────────────────
  if (!(await knex.schema.hasTable('alumni_engagement_fatigue_rules'))) {
    await knex.schema.createTable('alumni_engagement_fatigue_rules', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aefr_college_fk');
      t.string('category_code', 48).notNullable(); // ENGAGEMENT category or '*'
      t.integer('min_days_between_equivalent').notNullable().defaultTo(30);
      t.integer('warn_recent_contact_days').notNullable().defaultTo(14);
      t.boolean('suppress_active_opportunity').notNullable().defaultTo(true);
      t.boolean('suppress_open_followup').notNullable().defaultTo(false);
      t.boolean('warn_open_followup').notNullable().defaultTo(true);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'category_code'], { indexName: 'aefr_college_cat_uq' });
    });
  }

  // ── Engagement programs ─────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('alumni_engagement_programs'))) {
    await knex.schema.createTable('alumni_engagement_programs', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aep_college_fk');
      t.string('name', 255).notNullable();
      t.text('objective').nullable();
      t.string('category', 48).notNullable().defaultTo('OTHER');
      t.string('academic_year', 32).nullable();
      fk(t.integer('owner_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'aep_owner_fk');
      fk(t.integer('department_id').nullable(), 'departments', 'SET NULL', 'aep_dept_fk');
      t.string('scope', 32).notNullable().defaultTo('INSTITUTION'); // INSTITUTION | DEPARTMENT
      t.date('start_date').nullable();
      t.date('end_date').nullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      /** JSON: audience target definition (segment/rules/filters) — not membership. */
      t.text('target_definition').nullable();
      t.text('success_definition').nullable();
      /** VALUE_TO_ALUMNI | VALUE_TO_INSTITUTION | MUTUAL_VALUE */
      t.string('value_exchange', 32).notNullable().defaultTo('MUTUAL_VALUE');
      t.text('value_to_alumni').nullable();
      t.text('value_to_institution').nullable();
      fk(t.integer('created_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'aep_created_fk');
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'aep_college_status_idx');
      t.index(['college_id', 'category'], 'aep_college_cat_idx');
      t.index(['college_id', 'academic_year'], 'aep_college_year_idx');
      t.index(['college_id', 'start_date', 'end_date'], 'aep_college_dates_idx');
    });
  }

  // ── Templates ───────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('alumni_engagement_templates'))) {
    await knex.schema.createTable('alumni_engagement_templates', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aet_college_fk');
      t.string('name', 255).notNullable();
      t.string('category', 48).notNullable().defaultTo('OTHER');
      t.string('channel', 32).notNullable().defaultTo('MANUAL');
      t.string('subject', 255).nullable();
      t.text('body').notNullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      fk(t.integer('created_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'aet_created_fk');
      t.timestamps(true, true);
      t.index(['college_id', 'category', 'is_active'], 'aet_college_cat_idx');
    });
  }

  // ── Campaigns ───────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('alumni_engagement_campaigns'))) {
    await knex.schema.createTable('alumni_engagement_campaigns', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aec_college_fk');
      fk(t.integer('program_id').notNullable(), 'alumni_engagement_programs', 'CASCADE', 'aec_program_fk');
      t.string('name', 255).notNullable();
      t.text('purpose').nullable();
      t.string('channel', 32).notNullable().defaultTo('MANUAL');
      fk(t.integer('template_id').nullable(), 'alumni_engagement_templates', 'SET NULL', 'aec_template_fk');
      /** JSON audience source: SAVED_SEGMENT | DYNAMIC_RULES | EXPLICIT_IDS | FILTERS | EVENT_PARTICIPANTS */
      t.text('audience_source').notNullable();
      t.timestamp('scheduled_at').nullable();
      fk(t.integer('owner_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'aec_owner_fk');
      fk(t.integer('department_id').nullable(), 'departments', 'SET NULL', 'aec_dept_fk');
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.boolean('requires_approval').notNullable().defaultTo(true);
      t.boolean('approval_complete').notNullable().defaultTo(false);
      fk(t.integer('created_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'aec_created_fk');
      t.timestamp('audience_snapshotted_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'aec_college_status_idx');
      t.index(['college_id', 'program_id'], 'aec_college_program_idx');
      t.index(['college_id', 'scheduled_at'], 'aec_college_sched_idx');
    });
  }

  // ── Approval history ────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('alumni_engagement_approvals'))) {
    await knex.schema.createTable('alumni_engagement_approvals', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aea_college_fk');
      fk(t.integer('campaign_id').notNullable(), 'alumni_engagement_campaigns', 'CASCADE', 'aea_campaign_fk');
      t.string('step', 64).notNullable(); // HOD_REVIEW | ALUMNI_TP_REVIEW | INSTITUTIONAL
      t.string('decision', 32).notNullable(); // PENDING | APPROVED | REJECTED
      t.text('notes').nullable();
      fk(t.integer('acted_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'aea_actor_fk');
      t.timestamp('acted_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'campaign_id'], 'aea_campaign_idx');
    });
  }

  // ── Recipient snapshot (min identity + eligibility) ─────────────────────
  if (!(await knex.schema.hasTable('alumni_engagement_recipients'))) {
    await knex.schema.createTable('alumni_engagement_recipients', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aer_college_fk');
      fk(t.integer('campaign_id').notNullable(), 'alumni_engagement_campaigns', 'CASCADE', 'aer_campaign_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'aer_profile_fk');
      t.string('eligibility', 32).notNullable(); // ELIGIBLE | SUPPRESSED | REQUIRES_REVIEW
      t.text('eligibility_reasons').nullable(); // JSON string[]
      t.string('funnel_stage', 48).notNullable().defaultTo('TARGETED');
      t.string('contact_status', 32).notNullable().defaultTo('NOT_CONTACTED');
      // NOT_CONTACTED | CONTACTED | NO_RESPONSE | RESPONDED | INTERESTED | DECLINED | WRONG_CONTACT | FOLLOW_UP
      t.string('response_status', 32).nullable();
      t.boolean('suppression_overridden').notNullable().defaultTo(false);
      t.text('override_reason').nullable();
      fk(t.integer('override_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'aer_override_fk');
      t.timestamp('override_at').nullable();
      fk(t.integer('crm_interaction_id').nullable(), 'alumni_crm_interactions', 'SET NULL', 'aer_interaction_fk');
      fk(t.integer('crm_opportunity_id').nullable(), 'alumni_crm_opportunities', 'SET NULL', 'aer_opp_fk');
      fk(t.integer('crm_followup_id').nullable(), 'alumni_crm_followups', 'SET NULL', 'aer_followup_fk');
      t.timestamp('contacted_at').nullable();
      t.timestamp('responded_at').nullable();
      t.timestamps(true, true);
      t.unique(['campaign_id', 'alumni_profile_id'], { indexName: 'aer_campaign_profile_uq' });
      t.index(['college_id', 'campaign_id', 'eligibility'], 'aer_elig_idx');
      t.index(['college_id', 'campaign_id', 'funnel_stage'], 'aer_funnel_idx');
      t.index(['college_id', 'alumni_profile_id'], 'aer_profile_idx');
      t.index(['college_id', 'contact_status'], 'aer_contact_idx');
    });
  }

  // ── Login-less response tokens ──────────────────────────────────────────
  if (!(await knex.schema.hasTable('alumni_engagement_response_tokens'))) {
    await knex.schema.createTable('alumni_engagement_response_tokens', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aert_college_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'aert_profile_fk');
      fk(t.integer('campaign_id').nullable(), 'alumni_engagement_campaigns', 'SET NULL', 'aert_campaign_fk');
      fk(t.integer('recipient_id').nullable(), 'alumni_engagement_recipients', 'SET NULL', 'aert_recipient_fk');
      t.string('token_hash', 128).notNullable();
      t.string('action_type', 64).notNullable();
      /** JSON: allowed response options / form schema — never full profile. */
      t.text('action_payload').nullable();
      t.timestamp('expires_at').notNullable();
      t.timestamp('revoked_at').nullable();
      t.timestamp('used_at').nullable();
      t.integer('use_count').notNullable().defaultTo(0);
      t.integer('max_uses').notNullable().defaultTo(1);
      t.integer('rate_limit_hits').notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.unique(['token_hash'], { indexName: 'aert_token_hash_uq' });
      t.index(['college_id', 'alumni_profile_id'], 'aert_profile_idx');
      t.index(['expires_at'], 'aert_expires_idx');
    });
  }

  // ── Engagement responses ────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('alumni_engagement_responses'))) {
    await knex.schema.createTable('alumni_engagement_responses', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aeres_college_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'aeres_profile_fk');
      fk(t.integer('campaign_id').nullable(), 'alumni_engagement_campaigns', 'SET NULL', 'aeres_campaign_fk');
      fk(t.integer('recipient_id').nullable(), 'alumni_engagement_recipients', 'SET NULL', 'aeres_recipient_fk');
      fk(t.integer('token_id').nullable(), 'alumni_engagement_response_tokens', 'SET NULL', 'aeres_token_fk');
      t.string('action_type', 64).notNullable();
      t.string('choice', 64).nullable(); // YES | NO | MAYBE | MAYBE_LATER | NO_CHANGE | …
      t.text('form_payload').nullable(); // JSON
      t.string('source', 32).notNullable().defaultTo('ENGAGEMENT_RESPONSE');
      t.boolean('applied_to_c1').notNullable().defaultTo(false);
      t.boolean('applied_to_c2').notNullable().defaultTo(false);
      t.boolean('applied_to_c3_signal').notNullable().defaultTo(false);
      t.boolean('requires_staff_action').notNullable().defaultTo(false);
      t.timestamp('staff_actioned_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'campaign_id'], 'aeres_campaign_idx');
      t.index(['college_id', 'alumni_profile_id'], 'aeres_profile_idx');
      t.index(['college_id', 'requires_staff_action'], 'aeres_staff_idx');
    });
  }

  // ── Recognition nominations (C4 → C6 handoff only) ──────────────────────
  if (!(await knex.schema.hasTable('alumni_engagement_recognition_noms'))) {
    await knex.schema.createTable('alumni_engagement_recognition_noms', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aern_college_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'aern_profile_fk');
      fk(t.integer('program_id').nullable(), 'alumni_engagement_programs', 'SET NULL', 'aern_program_fk');
      fk(t.integer('campaign_id').nullable(), 'alumni_engagement_campaigns', 'SET NULL', 'aern_campaign_fk');
      t.string('title', 255).notNullable();
      t.text('rationale').nullable();
      t.text('evidence_refs').nullable(); // JSON
      t.string('status', 32).notNullable().defaultTo('NOMINATED'); // NOMINATED | RECORDED | WITHDRAWN
      fk(t.integer('nominated_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'aern_nom_fk');
      t.timestamps(true, true);
      t.index(['college_id', 'alumni_profile_id'], 'aern_profile_idx');
      t.index(['college_id', 'status'], 'aern_status_idx');
    });
  }

  // ── Preference consent evidence ─────────────────────────────────────────
  if (!(await knex.schema.hasTable('alumni_engagement_pref_evidence'))) {
    await knex.schema.createTable('alumni_engagement_pref_evidence', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aepe_college_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'aepe_profile_fk');
      t.string('change_type', 64).notNullable();
      t.text('before_snapshot').nullable();
      t.text('after_snapshot').nullable();
      t.string('source', 64).notNullable(); // ALUMNI_SELF | ENGAGEMENT_RESPONSE | ADMIN
      t.string('ip_hint', 64).nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'alumni_profile_id', 'created_at'], 'aepe_profile_time_idx');
    });
  }
};

exports.down = async function down(knex) {
  const tables = [
    'alumni_engagement_pref_evidence',
    'alumni_engagement_recognition_noms',
    'alumni_engagement_responses',
    'alumni_engagement_response_tokens',
    'alumni_engagement_recipients',
    'alumni_engagement_approvals',
    'alumni_engagement_campaigns',
    'alumni_engagement_templates',
    'alumni_engagement_programs',
    'alumni_engagement_fatigue_rules',
    'alumni_engagement_categories',
  ];
  for (const table of tables) {
    if (await knex.schema.hasTable(table)) await knex.schema.dropTable(table);
  }
};
