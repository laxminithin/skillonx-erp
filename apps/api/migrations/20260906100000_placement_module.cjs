/**
 * Training & Placement Management System (TPMS) domain.
 * Single shared backend for six role-based panels with RBAC-scoped access.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  // ── Placement seasons ───────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('placement_seasons'))) {
    await knex.schema.createTable('placement_seasons', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.string('name', 255).notNullable();
      t.date('start_date').nullable();
      t.date('end_date').nullable();
      t.integer('graduating_batch_year').nullable();
      t.string('status', 16).notNullable().defaultTo('DRAFT');
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'ps_college_status_idx');
    });
  }

  // ── College placement policies ──────────────────────────────────────────
  if (!(await knex.schema.hasTable('college_placement_policies'))) {
    await knex.schema.createTable('college_placement_policies', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('min_profile_completion').notNullable().defaultTo(60);
      t.boolean('allow_multiple_offers').notNullable().defaultTo(true);
      t.string('offer_policy', 32).notNullable().defaultTo('MULTIPLE_ALLOWED');
      t.boolean('allow_withdraw_after_apply').notNullable().defaultTo(true);
      t.boolean('placement_registration_required').notNullable().defaultTo(true);
      t.boolean('resume_required').notNullable().defaultTo(true);
      t.boolean('block_after_offer_acceptance').notNullable().defaultTo(false);
      t.decimal('dream_company_threshold', 12, 2).nullable();
      t.boolean('data_consent_required').notNullable().defaultTo(true);
      t.boolean('recruiter_portal_enabled').notNullable().defaultTo(false);
      t.json('recruiter_share_fields').nullable();
      t.timestamps(true, true);
      t.unique(['college_id'], { indexName: 'cpp_college_unique' });
    });
  }

  // ── Placement registrations ─────────────────────────────────────────────
  if (!(await knex.schema.hasTable('placement_registrations'))) {
    await knex.schema.createTable('placement_registrations', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.integer('placement_season_id').unsigned().notNullable().references('id').inTable('placement_seasons').onDelete('CASCADE');
      t.string('status', 16).notNullable().defaultTo('DRAFT');
      t.boolean('data_consent_given').notNullable().defaultTo(false);
      t.string('consent_version', 32).nullable();
      t.timestamp('consent_at').nullable();
      t.timestamp('registered_at').nullable();
      t.text('opt_out_reason').nullable();
      t.timestamps(true, true);
      t.unique(['student_id', 'placement_season_id'], { indexName: 'pr_student_season_unique' });
      t.index(['college_id', 'placement_season_id', 'status'], 'pr_college_season_status_idx');
    });
  }

  // ── Student career profiles ─────────────────────────────────────────────
  if (!(await knex.schema.hasTable('student_career_profiles'))) {
    await knex.schema.createTable('student_career_profiles', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.string('headline', 255).nullable();
      t.text('career_objective').nullable();
      t.json('preferred_roles').nullable();
      t.json('preferred_locations').nullable();
      t.boolean('higher_studies_interest').notNullable().defaultTo(false);
      t.boolean('entrepreneurship_interest').notNullable().defaultTo(false);
      t.string('placement_status', 32).notNullable().defaultTo('NOT_REGISTERED');
      t.integer('profile_completion_percentage').notNullable().defaultTo(0);
      t.string('resume_visibility', 16).notNullable().defaultTo('PLACEMENT_TEAM');
      t.string('linkedin_url', 512).nullable();
      t.string('github_url', 512).nullable();
      t.string('portfolio_url', 512).nullable();
      t.string('leetcode_url', 512).nullable();
      t.timestamps(true, true);
      t.unique(['student_id'], { indexName: 'scp_student_unique' });
      t.index(['college_id', 'placement_status'], 'scp_college_status_idx');
    });
  }

  // ── Prior education ─────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('student_prior_education'))) {
    await knex.schema.createTable('student_prior_education', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.string('qualification_type', 32).notNullable();
      t.string('institution', 255).nullable();
      t.string('board_university', 255).nullable();
      t.integer('year_of_completion').nullable();
      t.decimal('percentage', 5, 2).nullable();
      t.decimal('cgpa', 4, 2).nullable();
      t.decimal('conversion_percentage', 5, 2).nullable();
      t.string('document_reference', 512).nullable();
      t.string('verification_status', 16).notNullable().defaultTo('SELF_DECLARED');
      t.timestamps(true, true);
      t.index(['student_id', 'qualification_type'], 'spe_student_type_idx');
    });
  }

  // ── Skill master ────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('placement_skills'))) {
    await knex.schema.createTable('placement_skills', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('name', 128).notNullable();
      t.string('category', 32).notNullable().defaultTo('TECHNICAL');
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'name'], { indexName: 'psk_college_name_unique' });
    });
  }

  // ── Student skills ──────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('student_skills'))) {
    await knex.schema.createTable('student_skills', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('skill_id').unsigned().nullable().references('id').inTable('placement_skills').onDelete('SET NULL');
      t.string('skill_name', 128).notNullable();
      t.string('level', 16).notNullable().defaultTo('BEGINNER');
      t.string('source', 32).notNullable().defaultTo('SELF_DECLARED');
      t.string('verification_status', 16).notNullable().defaultTo('SELF_DECLARED');
      t.string('evidence_reference', 512).nullable();
      t.timestamps(true, true);
      t.index(['student_id'], 'ssk_student_idx');
    });
  }

  // ── Certifications ──────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('student_certifications'))) {
    await knex.schema.createTable('student_certifications', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.string('provider', 255).nullable();
      t.string('certificate_name', 255).notNullable();
      t.date('issue_date').nullable();
      t.date('expiry_date').nullable();
      t.string('credential_id', 128).nullable();
      t.string('credential_url', 512).nullable();
      t.string('verification_status', 16).notNullable().defaultTo('SELF_DECLARED');
      t.string('attachment_reference', 512).nullable();
      t.timestamps(true, true);
      t.index(['student_id'], 'scert_student_idx');
    });
  }

  // ── Projects ────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('student_projects'))) {
    await knex.schema.createTable('student_projects', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.string('title', 255).notNullable();
      t.text('description').nullable();
      t.string('project_type', 32).notNullable().defaultTo('PERSONAL');
      t.json('technologies').nullable();
      t.string('team_type', 16).notNullable().defaultTo('INDIVIDUAL');
      t.string('role', 128).nullable();
      t.date('start_date').nullable();
      t.date('end_date').nullable();
      t.string('repository_url', 512).nullable();
      t.string('demo_url', 512).nullable();
      t.integer('faculty_mentor_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('visibility', 16).notNullable().defaultTo('PLACEMENT');
      t.timestamps(true, true);
      t.index(['student_id'], 'sproj_student_idx');
    });
  }

  // ── Experiences ─────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('student_experiences'))) {
    await knex.schema.createTable('student_experiences', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.string('experience_type', 32).notNullable();
      t.string('organization', 255).notNullable();
      t.string('role', 128).nullable();
      t.date('start_date').nullable();
      t.date('end_date').nullable();
      t.text('description').nullable();
      t.string('verification_status', 16).notNullable().defaultTo('SELF_DECLARED');
      t.timestamps(true, true);
      t.index(['student_id'], 'sexp_student_idx');
    });
  }

  // ── Achievements ────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('student_achievements'))) {
    await knex.schema.createTable('student_achievements', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.string('achievement_type', 32).notNullable();
      t.string('title', 255).notNullable();
      t.string('issuer', 255).nullable();
      t.date('achievement_date').nullable();
      t.text('description').nullable();
      t.string('verification_status', 16).notNullable().defaultTo('SELF_DECLARED');
      t.string('evidence_reference', 512).nullable();
      t.timestamps(true, true);
      t.index(['student_id'], 'sach_student_idx');
    });
  }

  // ── Resume versions ─────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('student_resume_versions'))) {
    await knex.schema.createTable('student_resume_versions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.string('name', 128).notNullable();
      t.string('template', 64).notNullable().defaultTo('STANDARD');
      t.text('career_objective').nullable();
      t.json('selected_projects').nullable();
      t.json('selected_skills').nullable();
      t.json('selected_certifications').nullable();
      t.boolean('is_default').notNullable().defaultTo(false);
      t.string('visibility', 16).notNullable().defaultTo('PLACEMENT');
      t.timestamps(true, true);
      t.index(['student_id'], 'srv_student_idx');
    });
  }

  // ── Companies ───────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('placement_companies'))) {
    await knex.schema.createTable('placement_companies', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('name', 255).notNullable();
      t.string('legal_name', 255).nullable();
      t.string('industry', 128).nullable();
      t.string('website', 512).nullable();
      t.string('logo_reference', 512).nullable();
      t.string('company_type', 32).notNullable().defaultTo('OTHER');
      t.text('description').nullable();
      t.string('headquarters', 255).nullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.date('first_contact_date').nullable();
      t.date('last_contact_date').nullable();
      t.string('relationship_status', 32).nullable();
      t.integer('assigned_officer_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('internal_notes').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'pc_college_status_idx');
    });
  }

  // ── Company contacts ────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('placement_company_contacts'))) {
    await knex.schema.createTable('placement_company_contacts', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('company_id').unsigned().notNullable().references('id').inTable('placement_companies').onDelete('CASCADE');
      t.string('name', 255).notNullable();
      t.string('designation', 128).nullable();
      t.string('email', 255).nullable();
      t.string('phone', 32).nullable();
      t.string('contact_type', 32).notNullable().defaultTo('RECRUITER');
      t.boolean('is_primary').notNullable().defaultTo(false);
      t.text('notes').nullable();
      t.string('visibility', 16).notNullable().defaultTo('STAFF_ONLY');
      t.timestamps(true, true);
      t.index(['company_id'], 'pcc_company_idx');
    });
  }

  // ── Opportunities ───────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('placement_opportunities'))) {
    await knex.schema.createTable('placement_opportunities', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('company_id').unsigned().notNullable().references('id').inTable('placement_companies').onDelete('CASCADE');
      t.integer('placement_season_id').unsigned().nullable().references('id').inTable('placement_seasons').onDelete('SET NULL');
      t.string('opportunity_type', 32).notNullable().defaultTo('PLACEMENT');
      t.string('title', 255).notNullable();
      t.string('role', 255).nullable();
      t.text('description').nullable();
      t.string('work_mode', 32).nullable();
      t.string('employment_type', 32).nullable();
      t.decimal('ctc_min', 12, 2).nullable();
      t.decimal('ctc_max', 12, 2).nullable();
      t.decimal('fixed_component', 12, 2).nullable();
      t.decimal('variable_component', 12, 2).nullable();
      t.decimal('stipend', 12, 2).nullable();
      t.string('currency', 8).notNullable().defaultTo('INR');
      t.string('compensation_period', 16).notNullable().defaultTo('ANNUAL');
      t.text('bond_details').nullable();
      t.text('instructions').nullable();
      t.date('open_date').nullable();
      t.date('deadline').nullable();
      t.date('drive_date').nullable();
      t.string('status', 24).notNullable().defaultTo('DRAFT');
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'po_college_status_idx');
      t.index(['company_id'], 'po_company_idx');
      t.index(['deadline'], 'po_deadline_idx');
    });
  }

  // ── Opportunity locations ───────────────────────────────────────────────
  if (!(await knex.schema.hasTable('placement_opportunity_locations'))) {
    await knex.schema.createTable('placement_opportunity_locations', (t) => {
      t.increments('id').primary();
      t.integer('opportunity_id').unsigned().notNullable().references('id').inTable('placement_opportunities').onDelete('CASCADE');
      t.string('city', 128).notNullable();
      t.string('state', 128).nullable();
      t.string('country', 64).notNullable().defaultTo('India');
      t.timestamps(true, true);
      t.index(['opportunity_id'], 'pol_opp_idx');
    });
  }

  // ── Eligibility rules ───────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('placement_eligibility_rules'))) {
    await knex.schema.createTable('placement_eligibility_rules', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('opportunity_id').unsigned().notNullable().references('id').inTable('placement_opportunities').onDelete('CASCADE');
      t.string('rule_type', 64).notNullable();
      t.string('operator', 16).notNullable().defaultTo('GTE');
      t.string('value', 255).notNullable();
      t.boolean('is_mandatory').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.index(['opportunity_id'], 'per_opp_idx');
    });
  }

  // ── Eligibility overrides ───────────────────────────────────────────────
  if (!(await knex.schema.hasTable('placement_eligibility_overrides'))) {
    await knex.schema.createTable('placement_eligibility_overrides', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('opportunity_id').unsigned().notNullable().references('id').inTable('placement_opportunities').onDelete('CASCADE');
      t.text('reason').notNullable();
      t.integer('approved_by').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.timestamp('approved_at').notNullable().defaultTo(knex.fn.now());
      t.timestamps(true, true);
      t.unique(['student_id', 'opportunity_id'], { indexName: 'peo_student_opp_unique' });
    });
  }

  // ── Applications ────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('placement_applications'))) {
    await knex.schema.createTable('placement_applications', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('opportunity_id').unsigned().notNullable().references('id').inTable('placement_opportunities').onDelete('CASCADE');
      t.string('application_number', 64).notNullable();
      t.string('status', 24).notNullable().defaultTo('DRAFT');
      t.timestamp('applied_at').nullable();
      t.integer('resume_version_id').unsigned().nullable().references('id').inTable('student_resume_versions').onDelete('SET NULL');
      t.json('resume_snapshot').nullable();
      t.json('eligibility_snapshot').nullable();
      t.text('withdraw_reason').nullable();
      t.timestamps(true, true);
      t.unique(['student_id', 'opportunity_id'], { indexName: 'pa_student_opp_unique' });
      t.unique(['college_id', 'application_number'], { indexName: 'pa_college_number_unique' });
      t.index(['college_id', 'status'], 'pa_college_status_idx');
      t.index(['opportunity_id', 'status'], 'pa_opp_status_idx');
    });
  }

  // ── Drives ──────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('placement_drives'))) {
    await knex.schema.createTable('placement_drives', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('opportunity_id').unsigned().notNullable().references('id').inTable('placement_opportunities').onDelete('CASCADE');
      t.string('name', 255).notNullable();
      t.string('drive_type', 32).notNullable();
      t.date('drive_date').nullable();
      t.time('start_time').nullable();
      t.time('end_time').nullable();
      t.string('venue', 255).nullable();
      t.string('online_link', 512).nullable();
      t.text('instructions').nullable();
      t.timestamps(true, true);
      t.index(['opportunity_id'], 'pd_opp_idx');
    });
  }

  // ── Hiring rounds ───────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('placement_rounds'))) {
    await knex.schema.createTable('placement_rounds', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('opportunity_id').unsigned().notNullable().references('id').inTable('placement_opportunities').onDelete('CASCADE');
      t.integer('round_order').notNullable();
      t.string('round_type', 32).notNullable();
      t.string('name', 255).notNullable();
      t.timestamp('scheduled_at').nullable();
      t.string('venue', 255).nullable();
      t.string('online_link', 512).nullable();
      t.string('status', 16).notNullable().defaultTo('PLANNED');
      t.timestamps(true, true);
      t.index(['opportunity_id', 'round_order'], 'pr_opp_order_idx');
    });
  }

  // ── Round participants ──────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('placement_round_participants'))) {
    await knex.schema.createTable('placement_round_participants', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('round_id').unsigned().notNullable().references('id').inTable('placement_rounds').onDelete('CASCADE');
      t.integer('application_id').unsigned().notNullable().references('id').inTable('placement_applications').onDelete('CASCADE');
      t.string('status', 24).notNullable().defaultTo('ELIGIBLE');
      t.decimal('score', 8, 2).nullable();
      t.text('remarks').nullable();
      t.string('result', 24).nullable();
      t.timestamps(true, true);
      t.unique(['round_id', 'application_id'], { indexName: 'prp_round_app_unique' });
    });
  }

  // ── Drive participation (non-academic attendance) ─────────────────────
  if (!(await knex.schema.hasTable('placement_drive_participation'))) {
    await knex.schema.createTable('placement_drive_participation', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('drive_id').unsigned().notNullable().references('id').inTable('placement_drives').onDelete('CASCADE');
      t.integer('application_id').unsigned().notNullable().references('id').inTable('placement_applications').onDelete('CASCADE');
      t.string('status', 16).notNullable().defaultTo('REGISTERED');
      t.timestamps(true, true);
      t.unique(['drive_id', 'application_id'], { indexName: 'pdp_drive_app_unique' });
    });
  }

  // ── Offers ──────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('placement_offers'))) {
    await knex.schema.createTable('placement_offers', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('opportunity_id').unsigned().notNullable().references('id').inTable('placement_opportunities').onDelete('CASCADE');
      t.integer('application_id').unsigned().nullable().references('id').inTable('placement_applications').onDelete('SET NULL');
      t.integer('company_id').unsigned().notNullable().references('id').inTable('placement_companies').onDelete('CASCADE');
      t.string('role', 255).nullable();
      t.date('offer_date').nullable();
      t.decimal('ctc', 12, 2).nullable();
      t.string('joining_location', 255).nullable();
      t.date('joining_date').nullable();
      t.string('offer_status', 16).notNullable().defaultTo('OFFERED');
      t.string('offer_letter_reference', 512).nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'offer_status'], 'poff_college_status_idx');
      t.index(['student_id'], 'poff_student_idx');
    });
  }

  // ── Training programs ───────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('training_programs'))) {
    await knex.schema.createTable('training_programs', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('opportunity_id').unsigned().nullable().references('id').inTable('placement_opportunities').onDelete('SET NULL');
      t.string('title', 255).notNullable();
      t.string('provider', 128).nullable();
      t.string('category', 32).notNullable().defaultTo('APTITUDE');
      t.text('description').nullable();
      t.date('start_date').nullable();
      t.date('end_date').nullable();
      t.integer('hours').nullable();
      t.string('mode', 16).notNullable().defaultTo('OFFLINE');
      t.integer('capacity').nullable();
      t.string('status', 16).notNullable().defaultTo('DRAFT');
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'tp_college_status_idx');
    });
  }

  // ── Trainer assignments ─────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('placement_trainer_assignments'))) {
    await knex.schema.createTable('placement_trainer_assignments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('training_program_id').unsigned().notNullable().references('id').inTable('training_programs').onDelete('CASCADE');
      t.integer('faculty_user_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      t.string('role', 32).notNullable().defaultTo('TRAINER');
      t.timestamps(true, true);
      t.unique(['training_program_id', 'faculty_user_id'], { indexName: 'pta_prog_faculty_unique' });
    });
  }

  // ── Department coordinator assignments ──────────────────────────────────
  if (!(await knex.schema.hasTable('placement_coordinator_assignments'))) {
    await knex.schema.createTable('placement_coordinator_assignments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('faculty_user_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('CASCADE');
      t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('CASCADE');
      t.timestamps(true, true);
      t.index(['faculty_user_id'], 'pca_faculty_idx');
    });
  }

  // ── Training enrollments ────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('training_enrollments'))) {
    await knex.schema.createTable('training_enrollments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('training_program_id').unsigned().notNullable().references('id').inTable('training_programs').onDelete('CASCADE');
      t.string('status', 16).notNullable().defaultTo('ENROLLED');
      t.string('completion_status', 16).notNullable().defaultTo('IN_PROGRESS');
      t.timestamp('enrolled_at').nullable();
      t.timestamps(true, true);
      t.unique(['student_id', 'training_program_id'], { indexName: 'te_student_prog_unique' });
    });
  }

  // ── Training sessions ───────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('training_sessions'))) {
    await knex.schema.createTable('training_sessions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('training_program_id').unsigned().notNullable().references('id').inTable('training_programs').onDelete('CASCADE');
      t.string('title', 255).notNullable();
      t.timestamp('scheduled_at').nullable();
      t.string('venue', 255).nullable();
      t.string('online_link', 512).nullable();
      t.integer('duration_minutes').nullable();
      t.timestamps(true, true);
      t.index(['training_program_id'], 'ts_prog_idx');
    });
  }

  // ── Training attendance ─────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('training_attendance_records'))) {
    await knex.schema.createTable('training_attendance_records', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('session_id').unsigned().notNullable().references('id').inTable('training_sessions').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.string('status', 16).notNullable().defaultTo('PRESENT');
      t.timestamps(true, true);
      t.unique(['session_id', 'student_id'], { indexName: 'tar_session_student_unique' });
    });
  }

  // ── Training assessments ────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('training_assessments'))) {
    await knex.schema.createTable('training_assessments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('training_program_id').unsigned().notNullable().references('id').inTable('training_programs').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.string('assessment_type', 32).notNullable();
      t.decimal('score', 8, 2).nullable();
      t.decimal('max_score', 8, 2).nullable();
      t.text('feedback').nullable();
      t.text('staff_notes').nullable();
      t.timestamps(true, true);
      t.index(['training_program_id', 'student_id'], 'ta_prog_student_idx');
    });
  }

  // ── Mock interviews ─────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('training_mock_interviews'))) {
    await knex.schema.createTable('training_mock_interviews', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('training_program_id').unsigned().nullable().references('id').inTable('training_programs').onDelete('SET NULL');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('interviewer_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('interview_type', 32).notNullable().defaultTo('TECHNICAL');
      t.timestamp('scheduled_at').nullable();
      t.json('rubric_scores').nullable();
      t.text('student_feedback').nullable();
      t.text('staff_notes').nullable();
      t.string('status', 16).notNullable().defaultTo('SCHEDULED');
      t.timestamps(true, true);
      t.index(['student_id'], 'tmi_student_idx');
    });
  }

  // ── Recruiter accounts (secure architecture, feature-flagged portal) ───
  if (!(await knex.schema.hasTable('placement_recruiter_accounts'))) {
    await knex.schema.createTable('placement_recruiter_accounts', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('company_id').unsigned().notNullable().references('id').inTable('placement_companies').onDelete('CASCADE');
      t.string('email', 255).notNullable();
      t.string('password_hash', 255).notNullable();
      t.string('name', 255).notNullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.timestamp('last_login_at').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'email'], { indexName: 'pra_college_email_unique' });
    });
  }

  // ── Audit log ───────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('placement_audit_log'))) {
    await knex.schema.createTable('placement_audit_log', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('actor_id').unsigned().nullable();
      t.string('actor_type', 16).notNullable().defaultTo('FACULTY');
      t.string('action', 64).notNullable();
      t.string('entity_type', 64).notNullable();
      t.integer('entity_id').unsigned().nullable();
      t.json('before_state').nullable();
      t.json('after_state').nullable();
      t.text('reason').nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'entity_type', 'entity_id'], 'pal_entity_idx');
    });
  }
};

exports.down = async function down(knex) {
  const tables = [
    'placement_audit_log',
    'placement_recruiter_accounts',
    'training_mock_interviews',
    'training_assessments',
    'training_attendance_records',
    'training_sessions',
    'training_enrollments',
    'placement_coordinator_assignments',
    'placement_trainer_assignments',
    'training_programs',
    'placement_offers',
    'placement_drive_participation',
    'placement_round_participants',
    'placement_rounds',
    'placement_drives',
    'placement_applications',
    'placement_eligibility_overrides',
    'placement_eligibility_rules',
    'placement_opportunity_locations',
    'placement_opportunities',
    'placement_company_contacts',
    'placement_companies',
    'student_resume_versions',
    'student_achievements',
    'student_experiences',
    'student_projects',
    'student_certifications',
    'student_skills',
    'placement_skills',
    'student_prior_education',
    'student_career_profiles',
    'placement_registrations',
    'college_placement_policies',
    'placement_seasons',
  ];
  for (const table of tables) {
    if (await knex.schema.hasTable(table)) await knex.schema.dropTable(table);
  }
};
