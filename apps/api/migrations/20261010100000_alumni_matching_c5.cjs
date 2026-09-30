/**
 * Alumni Opportunity Matching & Institutional Connect (Phase C5).
 *
 * Matching workflow around institutional needs. Does NOT auto-contact alumni.
 * Prefer source links to Mentoring / T&P / Projects / Events where they exist;
 * C5 owns lightweight need records only when no authoritative source module exists.
 *
 * FK names kept short and unique (avoid collision with alumni_crm_notes acn_*).
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const fk = (col, table, onDelete, name) =>
    col.unsigned().references('id').inTable(table).onDelete(onDelete).withKeyName(name);

  // Drop partial failed create if a prior migrate attempt left an empty/broken table
  if (await knex.schema.hasTable('alumni_connect_needs')) {
    const cols = await knex('alumni_connect_needs').columnInfo().catch(() => null);
    if (!cols || !cols.type) {
      await knex.schema.dropTableIfExists('alumni_matching_tasks');
      await knex.schema.dropTableIfExists('alumni_connect_fulfilment');
      await knex.schema.dropTableIfExists('alumni_connect_dismissals');
      await knex.schema.dropTableIfExists('alumni_connect_shortlist');
      await knex.schema.dropTableIfExists('alumni_connect_beneficiaries');
      await knex.schema.dropTableIfExists('alumni_connect_needs');
    }
  }

  // ── Institutional connect needs ─────────────────────────────────────────
  if (!(await knex.schema.hasTable('alumni_connect_needs'))) {
    await knex.schema.createTable('alumni_connect_needs', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'acneed_college_fk');
      /** ADHOC | MENTORING | TPMS | STUDENT_PROJECT | ALUMNI_EVENT | CRM_OPPORTUNITY | OTHER */
      t.string('source_type', 32).notNullable().defaultTo('ADHOC');
      t.string('source_reference', 255).nullable();
      t.string('type', 48).notNullable();
      t.string('title', 255).notNullable();
      t.text('description').nullable();
      fk(t.integer('department_id').nullable(), 'departments', 'SET NULL', 'acneed_dept_fk');
      t.string('programme', 128).nullable();
      t.string('domain', 128).nullable();
      /** JSON string[] — skills / topics */
      t.text('skills_topics').nullable();
      /** JSON: { type, refs[], summary } — authoritative IDs only */
      t.text('target_beneficiaries').nullable();
      t.integer('quantity_required').unsigned().nullable();
      t.integer('quantity_confirmed').unsigned().notNullable().defaultTo(0);
      t.integer('quantity_verified').unsigned().notNullable().defaultTo(0);
      t.string('mode', 32).nullable(); // IN_PERSON | ONLINE | HYBRID | ANY
      t.string('location', 255).nullable();
      t.date('start_date').nullable();
      t.date('target_date').nullable();
      t.date('deadline').nullable();
      t.string('priority', 16).notNullable().defaultTo('NORMAL'); // LOW | NORMAL | HIGH | URGENT
      fk(t.integer('owner_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'acneed_owner_fk');
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      fk(t.integer('created_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'acneed_created_fk');
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'acneed_college_status_idx');
      t.index(['college_id', 'type'], 'acneed_college_type_idx');
      t.index(['college_id', 'department_id'], 'acneed_college_dept_idx');
      t.index(['college_id', 'deadline'], 'acneed_college_deadline_idx');
      t.index(['college_id', 'owner_faculty_id'], 'acneed_college_owner_idx');
      t.index(['college_id', 'source_type', 'source_reference'], 'acneed_source_idx');
    });
  }

  // ── Beneficiary linkage (authoritative IDs, no duplication) ─────────────
  if (!(await knex.schema.hasTable('alumni_connect_beneficiaries'))) {
    await knex.schema.createTable('alumni_connect_beneficiaries', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'acben_college_fk');
      fk(t.integer('need_id').notNullable(), 'alumni_connect_needs', 'CASCADE', 'acben_need_fk');
      /** STUDENT | STUDENT_GROUP | PROJECT | DEPARTMENT | PROGRAMME | FACULTY | STARTUP_TEAM | OTHER */
      t.string('beneficiary_type', 32).notNullable();
      t.string('beneficiary_ref', 128).notNullable();
      t.string('label', 255).nullable();
      t.timestamps(true, true);
      t.unique(['need_id', 'beneficiary_type', 'beneficiary_ref'], { indexName: 'acben_need_ben_uq' });
      t.index(['college_id', 'need_id'], 'acben_college_need_idx');
    });
  }

  // ── Shortlist (human decision) ──────────────────────────────────────────
  if (!(await knex.schema.hasTable('alumni_connect_shortlist'))) {
    await knex.schema.createTable('alumni_connect_shortlist', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'acsl_college_fk');
      fk(t.integer('need_id').notNullable(), 'alumni_connect_needs', 'CASCADE', 'acsl_need_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'acsl_profile_fk');
      /** SUGGESTED | SHORTLISTED | ENGAGEMENT_REQUESTED | ACCEPTED | DECLINED | REMOVED | COMPLETED */
      t.string('status', 32).notNullable().defaultTo('SHORTLISTED');
      t.text('reason_notes').nullable();
      /** Snapshot of explainable match at shortlist time (JSON) */
      t.text('match_snapshot').nullable();
      t.integer('allocated_quantity').unsigned().nullable();
      t.integer('confirmed_quantity').unsigned().notNullable().defaultTo(0);
      t.integer('verified_quantity').unsigned().notNullable().defaultTo(0);
      fk(t.integer('shortlisted_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'acsl_by_fk');
      t.timestamp('shortlisted_at').nullable();
      fk(t.integer('engagement_campaign_id').nullable(), 'alumni_engagement_campaigns', 'SET NULL', 'acsl_camp_fk');
      fk(t.integer('engagement_recipient_id').nullable(), 'alumni_engagement_recipients', 'SET NULL', 'acsl_recip_fk');
      fk(t.integer('crm_opportunity_id').nullable(), 'alumni_crm_opportunities', 'SET NULL', 'acsl_opp_fk');
      fk(t.integer('crm_outcome_id').nullable(), 'alumni_crm_outcomes', 'SET NULL', 'acsl_out_fk');
      t.timestamps(true, true);
      t.unique(['need_id', 'alumni_profile_id'], { indexName: 'acsl_need_profile_uq' });
      t.index(['college_id', 'need_id', 'status'], 'acsl_need_status_idx');
      t.index(['college_id', 'alumni_profile_id'], 'acsl_profile_idx');
    });
  }

  // ── Per-need dismissals (not global penalties) ──────────────────────────
  if (!(await knex.schema.hasTable('alumni_connect_dismissals'))) {
    await knex.schema.createTable('alumni_connect_dismissals', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'acdis_college_fk');
      fk(t.integer('need_id').notNullable(), 'alumni_connect_needs', 'CASCADE', 'acdis_need_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'acdis_profile_fk');
      /** NOT_RELEVANT | INSUFFICIENT_CAPABILITY | TIMING | ALREADY_ENGAGED | DATA_STALE | RELATIONSHIP_CONCERN | OTHER */
      t.string('reason', 48).notNullable();
      t.text('notes').nullable();
      fk(t.integer('dismissed_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'acdis_by_fk');
      t.timestamp('dismissed_at').notNullable().defaultTo(knex.fn.now());
      t.timestamps(true, true);
      t.unique(['need_id', 'alumni_profile_id'], { indexName: 'acdis_need_profile_uq' });
      t.index(['college_id', 'need_id'], 'acdis_college_need_idx');
    });
  }

  // ── Fulfilment allocations (multi-alumni quantity tracking) ─────────────
  if (!(await knex.schema.hasTable('alumni_connect_fulfilment'))) {
    await knex.schema.createTable('alumni_connect_fulfilment', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'acful_college_fk');
      fk(t.integer('need_id').notNullable(), 'alumni_connect_needs', 'CASCADE', 'acful_need_fk');
      fk(t.integer('shortlist_id').nullable(), 'alumni_connect_shortlist', 'SET NULL', 'acful_sl_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'acful_profile_fk');
      t.integer('promised_quantity').unsigned().notNullable().defaultTo(0);
      t.integer('confirmed_quantity').unsigned().notNullable().defaultTo(0);
      t.integer('verified_quantity').unsigned().notNullable().defaultTo(0);
      fk(t.integer('crm_opportunity_id').nullable(), 'alumni_crm_opportunities', 'SET NULL', 'acful_opp_fk');
      fk(t.integer('crm_outcome_id').nullable(), 'alumni_crm_outcomes', 'SET NULL', 'acful_out_fk');
      t.string('status', 32).notNullable().defaultTo('PROMISED');
      // PROMISED | CONFIRMED | VERIFIED | WITHDRAWN
      t.text('notes').nullable();
      fk(t.integer('recorded_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'acful_by_fk');
      t.timestamps(true, true);
      t.index(['college_id', 'need_id'], 'acful_college_need_idx');
      t.index(['college_id', 'alumni_profile_id'], 'acful_profile_idx');
    });
  }

  // ── Internal attention / task queue (no external channel claims) ────────
  if (!(await knex.schema.hasTable('alumni_matching_tasks'))) {
    await knex.schema.createTable('alumni_matching_tasks', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'amtask_college_fk');
      fk(t.integer('need_id').nullable(), 'alumni_connect_needs', 'CASCADE', 'amtask_need_fk');
      fk(t.integer('shortlist_id').nullable(), 'alumni_connect_shortlist', 'SET NULL', 'amtask_sl_fk');
      fk(t.integer('assignee_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'amtask_assignee_fk');
      /** NEED_ASSIGNED | SHORTLIST_REVIEW | ENGAGEMENT_RESPONSE | DEADLINE_APPROACHING | FULFILMENT_PENDING */
      t.string('task_type', 48).notNullable();
      t.string('title', 255).notNullable();
      t.text('body').nullable();
      t.string('status', 24).notNullable().defaultTo('OPEN'); // OPEN | DONE | DISMISSED
      t.timestamp('due_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'status', 'assignee_faculty_id'], 'amtask_assignee_idx');
      t.index(['college_id', 'need_id'], 'amtask_need_idx');
    });
  }
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('alumni_matching_tasks');
  await knex.schema.dropTableIfExists('alumni_connect_fulfilment');
  await knex.schema.dropTableIfExists('alumni_connect_dismissals');
  await knex.schema.dropTableIfExists('alumni_connect_shortlist');
  await knex.schema.dropTableIfExists('alumni_connect_beneficiaries');
  await knex.schema.dropTableIfExists('alumni_connect_needs');
};
