/**
 * Alumni Recognition, Value & Community Engine (Phase C6).
 *
 * Reciprocal value layer: institution↔alumni recognition and offerings.
 * Recognition decisions remain HUMAN. No popularity/wealth/donor ranking.
 * Projects C1 achievements, C2 outcomes, C4 noms, C5 fulfilments — does not duplicate.
 *
 * FK names kept short for MySQL 64-char identifier limit.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const fk = (col, table, onDelete, name) =>
    col.unsigned().references('id').inTable(table).onDelete(onDelete).withKeyName(name);

  // ── Recognition taxonomy (configurable categories) ──────────────────────
  if (!(await knex.schema.hasTable('alumni_recognition_categories'))) {
    await knex.schema.createTable('alumni_recognition_categories', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'arc_college_fk');
      t.string('code', 48).notNullable();
      t.string('label', 128).notNullable();
      t.text('description').nullable();
      t.boolean('is_system').notNullable().defaultTo(false);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.integer('sort_order').notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'arc_college_code_uq' });
    });
  }

  // ── Recognition programs ────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('alumni_recognition_programs'))) {
    await knex.schema.createTable('alumni_recognition_programs', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'arp_college_fk');
      t.string('name', 255).notNullable();
      t.string('category', 48).notNullable().defaultTo('OTHER');
      t.text('description').nullable();
      t.string('academic_year', 32).nullable();
      /** JSON eligibility rules — factual checks only, never auto-award */
      t.text('eligibility_rules').nullable();
      t.date('nomination_start').nullable();
      t.date('nomination_end').nullable();
      t.date('review_start').nullable();
      t.date('review_end').nullable();
      t.date('award_date').nullable();
      t.date('publication_date').nullable();
      fk(t.integer('owner_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'arp_owner_fk');
      fk(t.integer('department_id').nullable(), 'departments', 'SET NULL', 'arp_dept_fk');
      /** COLLEGE | DEPARTMENT | PROGRAMME | BATCH | OTHER */
      t.string('scope', 32).notNullable().defaultTo('COLLEGE');
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      fk(t.integer('created_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'arp_created_fk');
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'arp_college_status_idx');
      t.index(['college_id', 'category'], 'arp_college_cat_idx');
      t.index(['college_id', 'academic_year'], 'arp_college_year_idx');
    });
  }

  // ── Nominations (≠ awards) ──────────────────────────────────────────────
  if (!(await knex.schema.hasTable('alumni_recognition_nominations'))) {
    await knex.schema.createTable('alumni_recognition_nominations', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'arn_college_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'arn_profile_fk');
      fk(t.integer('program_id').nullable(), 'alumni_recognition_programs', 'SET NULL', 'arn_program_fk');
      t.string('category', 48).notNullable().defaultTo('OTHER');
      t.string('title', 255).notNullable();
      t.text('reason').nullable();
      /** FACULTY | HOD | ALUMNI_OFFICE | TPMS | PRINCIPAL_AUTHORISED | MANAGEMENT_AUTHORISED | ALUMNI_SELF | OTHER_ALUMNUS | C4_HANDOFF | OTHER */
      t.string('source', 48).notNullable().defaultTo('ALUMNI_OFFICE');
      fk(t.integer('nominator_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'arn_nom_fac_fk');
      fk(t.integer('nominator_alumni_id').nullable(), 'alumni_profiles', 'SET NULL', 'arn_nom_alu_fk');
      /** Link to C4 handoff row when ingested */
      fk(t.integer('c4_nomination_id').nullable(), 'alumni_engagement_recognition_noms', 'SET NULL', 'arn_c4_fk');
      t.timestamp('submitted_at').nullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'arn_college_status_idx');
      t.index(['college_id', 'alumni_profile_id'], 'arn_college_profile_idx');
      t.index(['college_id', 'program_id'], 'arn_college_program_idx');
      t.index(['college_id', 'c4_nomination_id'], 'arn_c4_idx');
    });
  }

  // ── Recognition records (authoritative issuance) — before evidence FK ───
  if (!(await knex.schema.hasTable('alumni_recognition_records'))) {
    await knex.schema.createTable('alumni_recognition_records', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'arr_college_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'arr_profile_fk');
      fk(t.integer('program_id').nullable(), 'alumni_recognition_programs', 'SET NULL', 'arr_program_fk');
      fk(t.integer('nomination_id').nullable(), 'alumni_recognition_nominations', 'SET NULL', 'arr_nom_fk');
      t.string('title', 255).notNullable();
      t.string('category', 48).notNullable().defaultTo('OTHER');
      t.text('citation').nullable();
      t.date('award_date').nullable();
      t.string('academic_year', 32).nullable();
      fk(t.integer('approved_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'arr_approved_fk');
      /** PRIVATE | INSTITUTION | ALUMNI_NETWORK | PUBLIC */
      t.string('publication_visibility', 32).notNullable().defaultTo('INSTITUTION');
      t.boolean('publication_consent').notNullable().defaultTo(false);
      t.timestamp('publication_consent_at').nullable();
      t.string('certificate_reference', 128).nullable();
      t.string('verification_token', 64).nullable();
      /** ISSUED | CORRECTED | REVOKED */
      t.string('status', 32).notNullable().defaultTo('ISSUED');
      t.timestamps(true, true);
      t.index(['college_id', 'alumni_profile_id'], 'arr_college_profile_idx');
      t.index(['college_id', 'status'], 'arr_college_status_idx');
      t.index(['college_id', 'category'], 'arr_college_cat_idx');
      t.unique(['college_id', 'verification_token'], { indexName: 'arr_verify_token_uq' });
    });
  }

  // ── Evidence (references only — never invent verification) ──────────────
  if (!(await knex.schema.hasTable('alumni_recognition_evidence'))) {
    await knex.schema.createTable('alumni_recognition_evidence', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'are_college_fk');
      fk(t.integer('nomination_id').nullable(), 'alumni_recognition_nominations', 'CASCADE', 'are_nom_fk');
      fk(t.integer('recognition_id').nullable(), 'alumni_recognition_records', 'CASCADE', 'are_rec_fk');
      /**
       * C1_ACHIEVEMENT | CAREER_MILESTONE | PUBLICATION | PATENT | ENTREPRENEURSHIP |
       * C2_OUTCOME | C5_FULFILMENT | INSTITUTIONAL_RECORD | UPLOADED | EXTERNAL_REF | OTHER
       */
      t.string('source_type', 48).notNullable();
      t.string('source_reference', 255).nullable();
      t.string('label', 255).nullable();
      t.text('notes').nullable();
      /** UNVERIFIED | SELF_DECLARED | INSTITUTIONAL | VERIFIED | REJECTED */
      t.string('verification_status', 32).notNullable().defaultTo('UNVERIFIED');
      fk(t.integer('verified_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'are_verified_fk');
      t.timestamp('verified_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'nomination_id'], 'are_college_nom_idx');
      t.index(['college_id', 'recognition_id'], 'are_college_rec_idx');
      t.index(['college_id', 'source_type', 'source_reference'], 'are_source_idx');
    });
  }

  // ── Review stages + decisions (human only) ──────────────────────────────
  if (!(await knex.schema.hasTable('alumni_recognition_review_stages'))) {
    await knex.schema.createTable('alumni_recognition_review_stages', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'arrs_college_fk');
      fk(t.integer('program_id').nullable(), 'alumni_recognition_programs', 'CASCADE', 'arrs_program_fk');
      t.string('code', 48).notNullable();
      t.string('label', 128).notNullable();
      t.integer('sort_order').notNullable().defaultTo(0);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'program_id', 'code'], { indexName: 'arrs_prog_code_uq' });
    });
  }

  if (!(await knex.schema.hasTable('alumni_recognition_reviews'))) {
    await knex.schema.createTable('alumni_recognition_reviews', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'arrv_college_fk');
      fk(t.integer('nomination_id').notNullable(), 'alumni_recognition_nominations', 'CASCADE', 'arrv_nom_fk');
      t.string('stage_code', 48).notNullable();
      fk(t.integer('reviewer_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'arrv_rev_fk');
      /** APPROVE | REJECT | REQUEST_EVIDENCE | SHORTLIST | ABSTAIN | COMMENT */
      t.string('decision', 32).notNullable();
      t.text('comments').nullable();
      t.timestamp('decided_at').notNullable().defaultTo(knex.fn.now());
      t.timestamps(true, true);
      t.index(['college_id', 'nomination_id'], 'arrv_college_nom_idx');
    });
  }

  // ── Issuance / correction audit (immutable history) ─────────────────────
  if (!(await knex.schema.hasTable('alumni_recognition_issuance_log'))) {
    await knex.schema.createTable('alumni_recognition_issuance_log', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aril_college_fk');
      fk(t.integer('recognition_id').notNullable(), 'alumni_recognition_records', 'CASCADE', 'aril_rec_fk');
      /** ISSUED | CORRECTED | REVOKED | CONSENT_CHANGED | VISIBILITY_CHANGED */
      t.string('action', 48).notNullable();
      t.text('before_snapshot').nullable();
      t.text('after_snapshot').nullable();
      t.text('reason').nullable();
      fk(t.integer('actor_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'aril_actor_fk');
      t.timestamp('acted_at').notNullable().defaultTo(knex.fn.now());
      t.timestamps(true, true);
      t.index(['college_id', 'recognition_id'], 'aril_college_rec_idx');
    });
  }

  // ── Certificates / citations (no crypto signatures) ─────────────────────
  if (!(await knex.schema.hasTable('alumni_recognition_certificates'))) {
    await knex.schema.createTable('alumni_recognition_certificates', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'arct_college_fk');
      fk(t.integer('recognition_id').notNullable(), 'alumni_recognition_records', 'CASCADE', 'arct_rec_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'arct_profile_fk');
      /** RECOGNITION | APPRECIATION | MENTORSHIP | EXPERT_SESSION | INDUSTRY_CONNECT | OTHER */
      t.string('certificate_type', 48).notNullable().defaultTo('RECOGNITION');
      t.string('reference_code', 64).notNullable();
      t.date('issue_date').notNullable();
      t.string('verification_token', 64).nullable();
      t.string('status', 24).notNullable().defaultTo('ISSUED');
      t.timestamps(true, true);
      t.unique(['college_id', 'reference_code'], { indexName: 'arct_ref_uq' });
      t.index(['college_id', 'alumni_profile_id'], 'arct_profile_idx');
    });
  }

  // ── Alumni Spotlight ────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('alumni_spotlights'))) {
    await knex.schema.createTable('alumni_spotlights', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'asp_college_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'asp_profile_fk');
      fk(t.integer('recognition_id').nullable(), 'alumni_recognition_records', 'SET NULL', 'asp_rec_fk');
      t.string('headline', 255).notNullable();
      t.text('professional_summary').nullable();
      t.text('achievement').nullable();
      t.text('institution_connection').nullable();
      t.string('graduation_details', 255).nullable();
      t.string('image_url', 512).nullable();
      t.text('story_content').nullable();
      /** DRAFT | PENDING_CONSENT | APPROVED | PUBLISHED | UNPUBLISHED | ARCHIVED */
      t.string('publication_status', 32).notNullable().defaultTo('DRAFT');
      t.boolean('publication_consent').notNullable().defaultTo(false);
      t.timestamp('publication_consent_at').nullable();
      t.date('publish_at').nullable();
      t.date('unpublish_at').nullable();
      fk(t.integer('approved_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'asp_approved_fk');
      t.timestamps(true, true);
      t.index(['college_id', 'publication_status'], 'asp_college_status_idx');
      t.index(['college_id', 'alumni_profile_id'], 'asp_college_profile_idx');
    });
  }

  // ── Value offering catalogue (institution → alumni) ─────────────────────
  if (!(await knex.schema.hasTable('alumni_value_offerings'))) {
    await knex.schema.createTable('alumni_value_offerings', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'avo_college_fk');
      t.string('title', 255).notNullable();
      t.string('category', 48).notNullable().defaultTo('OTHER');
      t.text('description').nullable();
      fk(t.integer('owner_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'avo_owner_fk');
      t.string('provider_label', 255).nullable();
      t.text('eligibility').nullable();
      t.integer('capacity').unsigned().nullable();
      t.integer('registered_count').unsigned().notNullable().defaultTo(0);
      /** IN_PERSON | ONLINE | HYBRID | ASYNC | OTHER */
      t.string('delivery_mode', 32).nullable();
      t.string('location', 255).nullable();
      t.date('start_date').nullable();
      t.date('end_date').nullable();
      t.date('registration_deadline').nullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      /** PRIVATE | INSTITUTION | ALUMNI_NETWORK | PUBLIC */
      t.string('visibility', 32).notNullable().defaultTo('ALUMNI_NETWORK');
      t.text('benefits').nullable();
      t.text('terms').nullable();
      fk(t.integer('engagement_campaign_id').nullable(), 'alumni_engagement_campaigns', 'SET NULL', 'avo_camp_fk');
      fk(t.integer('created_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'avo_created_fk');
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'avo_college_status_idx');
      t.index(['college_id', 'category'], 'avo_college_cat_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_value_participations'))) {
    await knex.schema.createTable('alumni_value_participations', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'avp_college_fk');
      fk(t.integer('offering_id').notNullable(), 'alumni_value_offerings', 'CASCADE', 'avp_offer_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'avp_profile_fk');
      /** INTERESTED | REGISTERED | ACCEPTED | WAITLISTED | PARTICIPATED | COMPLETED | DECLINED | CANCELLED */
      t.string('status', 32).notNullable().defaultTo('INTERESTED');
      t.text('notes').nullable();
      t.timestamp('registered_at').nullable();
      t.timestamp('completed_at').nullable();
      fk(t.integer('recorded_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'avp_by_fk');
      t.timestamps(true, true);
      t.unique(['offering_id', 'alumni_profile_id'], { indexName: 'avp_offer_profile_uq' });
      t.index(['college_id', 'alumni_profile_id'], 'avp_profile_idx');
      t.index(['college_id', 'status'], 'avp_status_idx');
    });
  }

  // ── Communities & chapters ──────────────────────────────────────────────
  if (!(await knex.schema.hasTable('alumni_communities'))) {
    await knex.schema.createTable('alumni_communities', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'acm_college_fk');
      t.string('name', 255).notNullable();
      /** BATCH | DEPARTMENT | INDUSTRY | LOCATION | FOUNDER | RESEARCH | MENTOR | CHAPTER | OTHER */
      t.string('type', 32).notNullable().defaultTo('OTHER');
      t.string('scope', 128).nullable();
      t.text('description').nullable();
      fk(t.integer('coordinator_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'acm_coord_fac_fk');
      fk(t.integer('coordinator_alumni_id').nullable(), 'alumni_profiles', 'SET NULL', 'acm_coord_alu_fk');
      t.string('city', 128).nullable();
      t.string('region', 128).nullable();
      t.string('country', 128).nullable();
      t.string('batch_year', 32).nullable();
      fk(t.integer('department_id').nullable(), 'departments', 'SET NULL', 'acm_dept_fk');
      t.string('industry', 128).nullable();
      t.string('status', 24).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.index(['college_id', 'type', 'status'], 'acm_college_type_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_community_memberships'))) {
    await knex.schema.createTable('alumni_community_memberships', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'acmm_college_fk');
      fk(t.integer('community_id').notNullable(), 'alumni_communities', 'CASCADE', 'acmm_comm_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'acmm_profile_fk');
      /** OPT_IN | INVITED | ACTIVE | INACTIVE | DECLINED */
      t.string('status', 24).notNullable().defaultTo('OPT_IN');
      t.timestamp('joined_at').nullable();
      fk(t.integer('invited_by_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'acmm_inv_fk');
      t.timestamps(true, true);
      t.unique(['community_id', 'alumni_profile_id'], { indexName: 'acmm_comm_profile_uq' });
      t.index(['college_id', 'alumni_profile_id'], 'acmm_profile_idx');
    });
  }

  // ── Connection requests (consent before contact) ────────────────────────
  if (!(await knex.schema.hasTable('alumni_connection_requests'))) {
    await knex.schema.createTable('alumni_connection_requests', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'acon_college_fk');
      fk(t.integer('from_alumni_id').notNullable(), 'alumni_profiles', 'CASCADE', 'acon_from_fk');
      fk(t.integer('to_alumni_id').notNullable(), 'alumni_profiles', 'CASCADE', 'acon_to_fk');
      t.text('message').nullable();
      /** PENDING | ACCEPTED | DECLINED | CANCELLED */
      t.string('status', 24).notNullable().defaultTo('PENDING');
      t.timestamp('responded_at').nullable();
      t.timestamps(true, true);
      t.unique(['from_alumni_id', 'to_alumni_id'], { indexName: 'acon_from_to_uq' });
      t.index(['college_id', 'to_alumni_id', 'status'], 'acon_to_status_idx');
    });
  }

  // ── Contribution / achievement recognition suggestions (not awards) ────
  if (!(await knex.schema.hasTable('alumni_recognition_suggestions'))) {
    await knex.schema.createTable('alumni_recognition_suggestions', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'arsug_college_fk');
      fk(t.integer('alumni_profile_id').notNullable(), 'alumni_profiles', 'CASCADE', 'arsug_profile_fk');
      /** CONSIDER_FOR_RECOGNITION | POTENTIAL_RECOGNITION_CANDIDATE */
      t.string('suggestion_type', 48).notNullable();
      t.string('category', 48).nullable();
      t.string('title', 255).notNullable();
      t.text('rationale').nullable();
      t.text('evidence_refs').nullable();
      /** OPEN | DISMISSED | NOMINATED | RECOGNISED */
      t.string('status', 24).notNullable().defaultTo('OPEN');
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'arsug_college_status_idx');
      t.index(['college_id', 'alumni_profile_id'], 'arsug_profile_idx');
    });
  }
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('alumni_recognition_suggestions');
  await knex.schema.dropTableIfExists('alumni_connection_requests');
  await knex.schema.dropTableIfExists('alumni_community_memberships');
  await knex.schema.dropTableIfExists('alumni_communities');
  await knex.schema.dropTableIfExists('alumni_value_participations');
  await knex.schema.dropTableIfExists('alumni_value_offerings');
  await knex.schema.dropTableIfExists('alumni_spotlights');
  await knex.schema.dropTableIfExists('alumni_recognition_certificates');
  await knex.schema.dropTableIfExists('alumni_recognition_issuance_log');
  await knex.schema.dropTableIfExists('alumni_recognition_evidence');
  await knex.schema.dropTableIfExists('alumni_recognition_reviews');
  await knex.schema.dropTableIfExists('alumni_recognition_review_stages');
  await knex.schema.dropTableIfExists('alumni_recognition_records');
  await knex.schema.dropTableIfExists('alumni_recognition_nominations');
  await knex.schema.dropTableIfExists('alumni_recognition_programs');
  await knex.schema.dropTableIfExists('alumni_recognition_categories');
};
