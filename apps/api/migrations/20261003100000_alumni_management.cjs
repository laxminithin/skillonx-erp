/**
 * Alumni Management Web module.
 *
 * Alumni is an extension over canonical Student identity. Finance, T&P,
 * notifications, and academic calendar remain the source systems for their
 * own domains.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('alumni_profiles'))) {
    await knex.schema.createTable('alumni_profiles', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('RESTRICT');
      t.string('alumni_code', 64).nullable();
      t.string('email', 255).notNullable();
      t.string('password_hash', 255).nullable();
      t.string('reset_token', 255).nullable();
      t.timestamp('reset_token_expires_at').nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamp('last_login_at').nullable();
      t.string('lifecycle_state', 32).notNullable().defaultTo('ELIGIBLE');
      t.string('verification_state', 32).notNullable().defaultTo('PENDING');
      t.integer('verified_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('verified_at').nullable();
      t.integer('rejected_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('rejected_at').nullable();
      t.text('rejection_reason').nullable();
      t.integer('suspended_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('suspended_at').nullable();
      t.text('suspension_reason').nullable();
      t.string('historical_name', 255).notNullable();
      t.string('historical_usn', 64).notNullable();
      t.integer('historical_department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('historical_program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
      t.string('batch_label', 64).nullable();
      t.integer('admission_year').nullable();
      t.integer('graduation_year').notNullable();
      t.string('headline', 255).nullable();
      t.text('biography').nullable();
      t.string('profile_photo_url', 512).nullable();
      t.string('current_city', 128).nullable();
      t.string('current_country', 128).nullable();
      t.json('skills').nullable();
      t.json('interests').nullable();
      t.string('linkedin_url', 512).nullable();
      t.string('website_url', 512).nullable();
      t.boolean('networking_available').notNullable().defaultTo(false);
      t.boolean('mentorship_available').notNullable().defaultTo(false);
      t.json('mentorship_areas').nullable();
      t.string('email_visibility', 32).notNullable().defaultTo('INSTITUTION_ONLY');
      t.string('phone_visibility', 32).notNullable().defaultTo('PRIVATE');
      t.string('bio_visibility', 32).notNullable().defaultTo('ALUMNI_NETWORK');
      t.string('employment_visibility', 32).notNullable().defaultTo('ALUMNI_NETWORK');
      t.string('social_visibility', 32).notNullable().defaultTo('ALUMNI_NETWORK');
      t.string('networking_visibility', 32).notNullable().defaultTo('ALUMNI_NETWORK');
      t.timestamps(true, true);
      t.unique(['student_id'], { indexName: 'alumni_profile_student_unique' });
      t.unique(['college_id', 'email'], { indexName: 'alumni_profile_college_email_unique' });
      t.unique(['college_id', 'historical_usn'], { indexName: 'alumni_profile_college_usn_unique' });
      t.index(['college_id', 'verification_state', 'lifecycle_state'], 'alumni_profile_state_idx');
      t.index(['college_id', 'graduation_year'], 'alumni_profile_grad_year_idx');
      t.index(['college_id', 'historical_department_id'], 'alumni_profile_dept_idx');
      t.index(['college_id', 'historical_program_id'], 'alumni_profile_program_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_employment'))) {
    await knex.schema.createTable('alumni_employment', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('alumni_profile_id').unsigned().notNullable().references('id').inTable('alumni_profiles').onDelete('CASCADE');
      t.string('organization', 255).notNullable();
      t.string('designation', 128).nullable();
      t.string('industry', 128).nullable();
      t.string('location', 128).nullable();
      t.date('start_date').nullable();
      t.date('end_date').nullable();
      t.boolean('is_current').notNullable().defaultTo(false);
      t.string('employment_type', 32).nullable();
      t.text('description').nullable();
      t.string('verification_status', 32).notNullable().defaultTo('SELF_DECLARED');
      t.timestamps(true, true);
      t.index(['college_id', 'organization'], 'alumni_emp_org_idx');
      t.index(['alumni_profile_id', 'is_current'], 'alumni_emp_profile_current_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_higher_studies'))) {
    await knex.schema.createTable('alumni_higher_studies', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('alumni_profile_id').unsigned().notNullable().references('id').inTable('alumni_profiles').onDelete('CASCADE');
      t.string('institution', 255).notNullable();
      t.string('program_name', 255).nullable();
      t.string('specialization', 255).nullable();
      t.string('country', 128).nullable();
      t.string('location', 128).nullable();
      t.integer('start_year').nullable();
      t.integer('completion_year').nullable();
      t.string('status', 32).notNullable().defaultTo('CURRENT');
      t.text('description').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'institution'], 'alumni_hs_inst_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_entrepreneurship'))) {
    await knex.schema.createTable('alumni_entrepreneurship', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('alumni_profile_id').unsigned().notNullable().references('id').inTable('alumni_profiles').onDelete('CASCADE');
      t.string('organization', 255).notNullable();
      t.string('role', 128).nullable();
      t.string('sector', 128).nullable();
      t.string('location', 128).nullable();
      t.string('website_url', 512).nullable();
      t.integer('year_founded').nullable();
      t.text('description').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'sector'], 'alumni_ent_sector_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_achievements'))) {
    await knex.schema.createTable('alumni_achievements', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('alumni_profile_id').unsigned().notNullable().references('id').inTable('alumni_profiles').onDelete('CASCADE');
      t.string('achievement_type', 64).notNullable();
      t.string('title', 255).notNullable();
      t.string('issuer', 255).nullable();
      t.date('achievement_date').nullable();
      t.text('description').nullable();
      t.string('moderation_state', 32).notNullable().defaultTo('PENDING');
      t.integer('moderated_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('moderated_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'moderation_state'], 'alumni_ach_state_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_events'))) {
    await knex.schema.createTable('alumni_events', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('calendar_event_id').unsigned().nullable().references('id').inTable('academic_calendar_events').onDelete('SET NULL');
      t.string('title', 255).notNullable();
      t.string('event_type', 64).notNullable().defaultTo('ALUMNI_MEET');
      t.text('description').nullable();
      t.dateTime('starts_at').notNullable();
      t.dateTime('ends_at').nullable();
      t.string('venue', 255).nullable();
      t.string('visibility', 32).notNullable().defaultTo('ALUMNI_NETWORK');
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.integer('capacity').unsigned().nullable();
      t.timestamp('registration_opens_at').nullable();
      t.timestamp('registration_closes_at').nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'status', 'starts_at'], 'alumni_event_status_date_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_event_registrations'))) {
    await knex.schema.createTable('alumni_event_registrations', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('event_id').unsigned().notNullable().references('id').inTable('alumni_events').onDelete('CASCADE');
      t.integer('alumni_profile_id').unsigned().notNullable().references('id').inTable('alumni_profiles').onDelete('CASCADE');
      t.string('status', 32).notNullable().defaultTo('REGISTERED');
      t.timestamp('registered_at').notNullable().defaultTo(knex.fn.now());
      t.timestamp('checked_in_at').nullable();
      t.timestamps(true, true);
      t.unique(['event_id', 'alumni_profile_id'], { indexName: 'alumni_event_registration_unique' });
      t.index(['college_id', 'event_id', 'status'], 'alumni_event_reg_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_opportunities'))) {
    await knex.schema.createTable('alumni_opportunities', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('submitted_by_alumni_id').unsigned().nullable().references('id').inTable('alumni_profiles').onDelete('SET NULL');
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('approved_at').nullable();
      t.string('title', 255).notNullable();
      t.string('opportunity_type', 64).notNullable();
      t.string('organization', 255).nullable();
      t.string('location', 128).nullable();
      t.text('description').nullable();
      t.string('application_url', 512).nullable();
      t.string('status', 32).notNullable().defaultTo('PENDING');
      t.date('deadline').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'status', 'deadline'], 'alumni_opp_status_deadline_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_contributions'))) {
    await knex.schema.createTable('alumni_contributions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('alumni_profile_id').unsigned().notNullable().references('id').inTable('alumni_profiles').onDelete('CASCADE');
      t.string('purpose', 128).notNullable();
      t.decimal('amount', 12, 2).nullable();
      t.string('status', 32).notNullable().defaultTo('INTENT_RECORDED');
      t.integer('finance_receipt_id').unsigned().nullable().references('id').inTable('fee_receipts').onDelete('SET NULL');
      t.string('idempotency_key', 191).nullable();
      t.text('note').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'idempotency_key'], { indexName: 'alumni_contribution_idempotency_unique' });
      t.index(['college_id', 'alumni_profile_id', 'status'], 'alumni_contrib_profile_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_notices'))) {
    await knex.schema.createTable('alumni_notices', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('title', 255).notNullable();
      t.text('body').nullable();
      t.string('audience_scope', 64).notNullable().defaultTo('ALL_ALUMNI');
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
      t.integer('graduation_year').nullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.timestamp('published_at').nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'status', 'published_at'], 'alumni_notice_pub_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_engagement'))) {
    await knex.schema.createTable('alumni_engagement', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('alumni_profile_id').unsigned().notNullable().references('id').inTable('alumni_profiles').onDelete('CASCADE');
      t.string('engagement_type', 64).notNullable();
      t.string('source_type', 64).nullable();
      t.integer('source_id').unsigned().nullable();
      t.text('notes').nullable();
      t.timestamp('occurred_at').notNullable().defaultTo(knex.fn.now());
      t.timestamps(true, true);
      t.index(['college_id', 'engagement_type', 'occurred_at'], 'alumni_engage_type_date_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_audit_log'))) {
    await knex.schema.createTable('alumni_audit_log', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('actor_type', 32).notNullable();
      t.integer('actor_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('actor_alumni_id').unsigned().nullable().references('id').inTable('alumni_profiles').onDelete('SET NULL');
      t.string('action', 64).notNullable();
      t.string('entity_type', 64).nullable();
      t.integer('entity_id').unsigned().nullable();
      t.json('metadata').nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'action', 'created_at'], 'alumni_audit_action_idx');
      t.index(['college_id', 'entity_type', 'entity_id'], 'alumni_audit_entity_idx');
    });
  }
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('alumni_audit_log');
  await knex.schema.dropTableIfExists('alumni_engagement');
  await knex.schema.dropTableIfExists('alumni_notices');
  await knex.schema.dropTableIfExists('alumni_contributions');
  await knex.schema.dropTableIfExists('alumni_opportunities');
  await knex.schema.dropTableIfExists('alumni_event_registrations');
  await knex.schema.dropTableIfExists('alumni_events');
  await knex.schema.dropTableIfExists('alumni_achievements');
  await knex.schema.dropTableIfExists('alumni_entrepreneurship');
  await knex.schema.dropTableIfExists('alumni_higher_studies');
  await knex.schema.dropTableIfExists('alumni_employment');
  await knex.schema.dropTableIfExists('alumni_profiles');
};
