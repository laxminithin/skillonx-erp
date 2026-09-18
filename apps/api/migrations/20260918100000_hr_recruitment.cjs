/**
 * HRMS Recruitment — requisitions, openings, candidates, applications,
 * interviews, offers, pre-joining, candidate portal tokens.
 * Pre-employment only; employee identity created via lifecycle createEmployee on join.
 * Separate from T&P / student placement.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  // ── Requisitions ─────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_recruitment_requisitions'))) {
    await knex.schema.createTable('hr_recruitment_requisitions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 48).notNullable();
      t.integer('department_id').unsigned().notNullable().references('id').inTable('departments').onDelete('RESTRICT');
      t.integer('designation_id').unsigned().notNullable().references('id').inTable('hr_designations').onDelete('RESTRICT');
      t.integer('employment_type_id').unsigned().notNullable().references('id').inTable('employment_types').onDelete('RESTRICT');
      t.integer('requested_headcount').unsigned().notNullable().defaultTo(1);
      t.integer('approved_headcount').unsigned().nullable();
      t.text('reason').nullable();
      t.string('position_type', 32).notNullable().defaultTo('NEW'); // NEW | REPLACEMENT
      t.integer('replacement_employee_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL');
      t.string('budget_reference', 128).nullable();
      t.date('desired_joining_date').nullable();
      t.integer('requested_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.integer('department_approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('department_approved_at').nullable();
      t.integer('hr_reviewed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('hr_reviewed_at').nullable();
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('approved_at').nullable();
      t.integer('rejected_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('rejected_at').nullable();
      t.text('rejection_reason').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'hrr_college_code_uq' });
      t.index(['college_id', 'status'], 'hrr_college_status_idx');
      t.index(['college_id', 'department_id'], 'hrr_college_dept_idx');
    });
  }

  // ── Job openings ─────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_job_openings'))) {
    await knex.schema.createTable('hr_job_openings', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('requisition_id').unsigned().nullable().references('id').inTable('hr_recruitment_requisitions').onDelete('SET NULL');
      t.string('code', 48).notNullable();
      t.string('title', 200).notNullable();
      t.integer('department_id').unsigned().notNullable().references('id').inTable('departments').onDelete('RESTRICT');
      t.integer('designation_id').unsigned().notNullable().references('id').inTable('hr_designations').onDelete('RESTRICT');
      t.integer('employment_type_id').unsigned().notNullable().references('id').inTable('employment_types').onDelete('RESTRICT');
      t.integer('headcount').unsigned().notNullable().defaultTo(1);
      t.integer('joined_count').unsigned().notNullable().defaultTo(0);
      t.string('location', 200).nullable();
      t.text('description').nullable();
      t.text('responsibilities').nullable();
      t.text('qualification').nullable();
      t.text('experience').nullable();
      t.text('skills').nullable();
      t.date('application_start').nullable();
      t.date('application_deadline').nullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.string('job_category', 64).nullable();
      t.timestamp('published_at').nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'hjo_college_code_uq' });
      t.index(['college_id', 'status'], 'hjo_college_status_idx');
      t.index(['college_id', 'department_id'], 'hjo_college_dept_idx');
    });
  }

  // ── Candidates ───────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_recruitment_candidates'))) {
    await knex.schema.createTable('hr_recruitment_candidates', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('full_name', 200).notNullable();
      t.string('email', 255).notNullable();
      t.string('phone', 32).nullable();
      t.string('location', 200).nullable();
      t.text('qualification_summary').nullable();
      t.text('experience_summary').nullable();
      t.string('source', 32).notNullable().defaultTo('CAREER_PORTAL');
      t.integer('referrer_employee_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL');
      t.integer('linked_employee_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL');
      t.timestamp('consent_at').nullable();
      t.string('status', 32).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.unique(['college_id', 'email'], { indexName: 'hrc_college_email_uq' });
      t.index(['college_id', 'phone'], 'hrc_college_phone_idx');
      t.index(['college_id', 'status'], 'hrc_college_status_idx');
    });
  }

  // ── Applications ─────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_recruitment_applications'))) {
    await knex.schema.createTable('hr_recruitment_applications', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('candidate_id').unsigned().notNullable().references('id').inTable('hr_recruitment_candidates').onDelete('RESTRICT');
      t.integer('opening_id').unsigned().notNullable().references('id').inTable('hr_job_openings').onDelete('RESTRICT');
      t.string('status', 32).notNullable().defaultTo('APPLIED');
      t.string('source', 32).nullable();
      t.decimal('salary_expectation', 14, 2).nullable();
      t.text('cover_letter').nullable();
      t.integer('screened_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('screening_notes').nullable();
      t.string('screening_decision', 32).nullable();
      t.timestamp('screened_at').nullable();
      t.integer('shortlist_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('shortlist_reason').nullable();
      t.timestamp('shortlisted_at').nullable();
      t.integer('selected_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('selection_reason').nullable();
      t.timestamp('selected_at').nullable();
      t.integer('employee_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL');
      t.timestamp('joined_at').nullable();
      t.timestamps(true, true);
      t.unique(['candidate_id', 'opening_id'], { indexName: 'hra_cand_opening_uq' });
      t.unique(['employee_id'], { indexName: 'hra_employee_uq' });
      t.index(['college_id', 'status'], 'hra_college_status_idx');
      t.index(['college_id', 'opening_id'], 'hra_college_opening_idx');
    });
  }

  // ── Documents ────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_recruitment_documents'))) {
    await knex.schema.createTable('hr_recruitment_documents', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('candidate_id').unsigned().notNullable().references('id').inTable('hr_recruitment_candidates').onDelete('CASCADE');
      t.integer('application_id').unsigned().nullable().references('id').inTable('hr_recruitment_applications').onDelete('SET NULL');
      t.string('doc_type', 32).notNullable();
      t.string('file_name', 255).nullable();
      t.string('content_type', 128).nullable();
      t.string('storage_key', 128).notNullable();
      t.mediumText('body_text').nullable();
      t.mediumText('content_base64').nullable();
      t.json('fields_json').nullable();
      t.string('uploaded_by_type', 16).notNullable().defaultTo('HR');
      t.integer('uploaded_by_id').unsigned().nullable();
      t.boolean('is_sensitive').notNullable().defaultTo(false);
      t.timestamps(true, true);
      t.index(['college_id', 'candidate_id'], 'hrd_college_cand_idx');
      t.index(['storage_key'], 'hrd_storage_key_idx');
    });
  }

  // ── Interview round templates ────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_interview_round_templates'))) {
    await knex.schema.createTable('hr_interview_round_templates', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 48).notNullable();
      t.string('name', 160).notNullable();
      t.text('description').nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'hirt_college_code_uq' });
    });
  }

  if (!(await knex.schema.hasTable('hr_interview_round_template_items'))) {
    await knex.schema.createTable('hr_interview_round_template_items', (t) => {
      t.increments('id').primary();
      t.integer('template_id').unsigned().notNullable().references('id').inTable('hr_interview_round_templates').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('name', 160).notNullable();
      t.integer('sequence').unsigned().notNullable().defaultTo(1);
      t.string('round_type', 32).notNullable().defaultTo('TECHNICAL');
      t.boolean('required').notNullable().defaultTo(true);
      t.integer('panel_min').unsigned().notNullable().defaultTo(1);
      t.json('evaluation_criteria').nullable();
      t.timestamps(true, true);
      t.index(['template_id'], 'hirti_template_idx');
    });
  }

  // ── Opening-configured interview rounds ──────────────────────────────────
  if (!(await knex.schema.hasTable('hr_job_interview_rounds'))) {
    await knex.schema.createTable('hr_job_interview_rounds', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('opening_id').unsigned().notNullable().references('id').inTable('hr_job_openings').onDelete('CASCADE');
      t.string('name', 160).notNullable();
      t.integer('sequence').unsigned().notNullable().defaultTo(1);
      t.string('round_type', 32).notNullable().defaultTo('TECHNICAL');
      t.boolean('required').notNullable().defaultTo(true);
      t.json('evaluation_template_json').nullable();
      t.timestamps(true, true);
      t.unique(['opening_id', 'sequence'], { indexName: 'hjir_opening_seq_uq' });
      t.index(['college_id', 'opening_id'], 'hjir_college_opening_idx');
    });
  }

  // ── Scheduled interviews ─────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_interviews'))) {
    await knex.schema.createTable('hr_interviews', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('application_id').unsigned().notNullable().references('id').inTable('hr_recruitment_applications').onDelete('CASCADE');
      t.integer('round_id').unsigned().notNullable().references('id').inTable('hr_job_interview_rounds').onDelete('RESTRICT');
      t.timestamp('scheduled_at').notNullable();
      t.string('timezone', 64).nullable().defaultTo('Asia/Kolkata');
      t.string('mode', 32).notNullable().defaultTo('IN_PERSON'); // IN_PERSON | ONLINE | HYBRID
      t.string('location_or_link', 500).nullable();
      t.string('status', 32).notNullable().defaultTo('SCHEDULED');
      t.text('notes').nullable();
      t.integer('scheduled_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'application_id'], 'hi_college_app_idx');
      t.index(['college_id', 'status'], 'hi_college_status_idx');
      t.index(['scheduled_at'], 'hi_scheduled_at_idx');
    });
  }

  if (!(await knex.schema.hasTable('hr_interview_panel'))) {
    await knex.schema.createTable('hr_interview_panel', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('interview_id').unsigned().notNullable().references('id').inTable('hr_interviews').onDelete('CASCADE');
      t.integer('employee_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL');
      t.boolean('is_external').notNullable().defaultTo(false);
      t.string('external_name', 160).nullable();
      t.string('external_email', 255).nullable();
      t.string('status', 32).notNullable().defaultTo('INVITED'); // INVITED | ACCEPTED | DECLINED | COMPLETED
      t.timestamps(true, true);
      t.index(['interview_id'], 'hip_interview_idx');
      t.index(['employee_id'], 'hip_employee_idx');
    });
  }

  if (!(await knex.schema.hasTable('hr_interview_evaluations'))) {
    await knex.schema.createTable('hr_interview_evaluations', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('interview_id').unsigned().notNullable().references('id').inTable('hr_interviews').onDelete('CASCADE');
      t.integer('panel_member_id').unsigned().nullable().references('id').inTable('hr_interview_panel').onDelete('SET NULL');
      t.integer('employee_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL');
      t.json('scores_json').nullable();
      t.decimal('overall_score', 8, 2).nullable();
      t.text('comments').nullable();
      t.text('private_notes').nullable();
      t.string('recommendation', 32).nullable(); // ADVANCE | HOLD | REJECT | STRONG_HIRE
      t.timestamp('submitted_at').nullable();
      t.timestamps(true, true);
      t.unique(['interview_id', 'employee_id'], { indexName: 'hie_interview_emp_uq' });
      t.index(['college_id', 'interview_id'], 'hie_college_interview_idx');
    });
  }

  // ── Offers ───────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_recruitment_offers'))) {
    await knex.schema.createTable('hr_recruitment_offers', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('application_id').unsigned().notNullable().references('id').inTable('hr_recruitment_applications').onDelete('RESTRICT');
      t.integer('candidate_id').unsigned().notNullable().references('id').inTable('hr_recruitment_candidates').onDelete('RESTRICT');
      t.integer('opening_id').unsigned().notNullable().references('id').inTable('hr_job_openings').onDelete('RESTRICT');
      t.string('offer_number', 48).notNullable();
      t.integer('version_no').unsigned().notNullable().defaultTo(1);
      t.integer('parent_offer_id').unsigned().nullable();
      t.integer('designation_id').unsigned().notNullable().references('id').inTable('hr_designations').onDelete('RESTRICT');
      t.integer('department_id').unsigned().notNullable().references('id').inTable('departments').onDelete('RESTRICT');
      t.integer('employment_type_id').unsigned().notNullable().references('id').inTable('employment_types').onDelete('RESTRICT');
      t.date('proposed_joining_date').nullable();
      t.date('offer_date').nullable();
      t.date('valid_until').nullable();
      t.text('compensation_summary').nullable();
      t.json('compensation_json').nullable();
      t.text('terms').nullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.timestamp('issued_at').nullable();
      t.timestamp('accepted_at').nullable();
      t.string('acceptance_method', 32).nullable();
      t.timestamp('declined_at').nullable();
      t.text('decline_reason').nullable();
      t.integer('document_id').unsigned().nullable().references('id').inTable('hr_recruitment_documents').onDelete('SET NULL');
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('approved_at').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'offer_number'], { indexName: 'hro_college_number_uq' });
      t.index(['college_id', 'application_id'], 'hro_college_app_idx');
      t.index(['college_id', 'status'], 'hro_college_status_idx');
    });
  }

  // ── Pre-joining checklists ───────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_prejoining_checklist_templates'))) {
    await knex.schema.createTable('hr_prejoining_checklist_templates', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 48).notNullable();
      t.string('name', 160).notNullable();
      t.string('employee_category', 32).nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'hpct_college_code_uq' });
    });
  }

  if (!(await knex.schema.hasTable('hr_prejoining_checklist_items'))) {
    await knex.schema.createTable('hr_prejoining_checklist_items', (t) => {
      t.increments('id').primary();
      t.integer('template_id').unsigned().notNullable().references('id').inTable('hr_prejoining_checklist_templates').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 48).notNullable();
      t.string('name', 200).notNullable();
      t.boolean('mandatory').notNullable().defaultTo(true);
      t.integer('sort_order').unsigned().notNullable().defaultTo(0);
      t.string('item_type', 32).notNullable().defaultTo('DOCUMENT'); // DOCUMENT | FORM | BGV | ACK | OTHER
      t.timestamps(true, true);
      t.unique(['template_id', 'code'], { indexName: 'hpci_template_code_uq' });
    });
  }

  if (!(await knex.schema.hasTable('hr_prejoining_tasks'))) {
    await knex.schema.createTable('hr_prejoining_tasks', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('application_id').unsigned().notNullable().references('id').inTable('hr_recruitment_applications').onDelete('CASCADE');
      t.integer('offer_id').unsigned().nullable().references('id').inTable('hr_recruitment_offers').onDelete('SET NULL');
      t.string('item_code', 48).notNullable();
      t.string('name', 200).notNullable();
      t.string('status', 32).notNullable().defaultTo('PENDING');
      t.boolean('mandatory').notNullable().defaultTo(true);
      t.string('item_type', 32).notNullable().defaultTo('DOCUMENT');
      t.integer('document_id').unsigned().nullable().references('id').inTable('hr_recruitment_documents').onDelete('SET NULL');
      t.text('notes').nullable();
      t.integer('verified_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('verified_at').nullable();
      t.string('bgv_status', 32).nullable(); // NOT_STARTED | IN_PROGRESS | CLEAR | ADVERSE | WAIVED
      t.timestamps(true, true);
      t.unique(['application_id', 'item_code'], { indexName: 'hpt_app_item_uq' });
      t.index(['college_id', 'application_id'], 'hpt_college_app_idx');
    });
  }

  // ── Candidate access tokens ──────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_candidate_access_tokens'))) {
    await knex.schema.createTable('hr_candidate_access_tokens', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('candidate_id').unsigned().notNullable().references('id').inTable('hr_recruitment_candidates').onDelete('CASCADE');
      t.string('token_hash', 64).notNullable();
      t.string('purpose', 64).notNullable().defaultTo('PORTAL');
      t.timestamp('expires_at').notNullable();
      t.timestamp('revoked_at').nullable();
      t.timestamp('last_used_at').nullable();
      t.timestamps(true, true);
      t.unique(['token_hash'], { indexName: 'hcat_token_hash_uq' });
      t.index(['college_id', 'candidate_id'], 'hcat_college_cand_idx');
    });
  }

  // ── Candidate notifications ──────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_candidate_notifications'))) {
    await knex.schema.createTable('hr_candidate_notifications', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('candidate_id').unsigned().notNullable().references('id').inTable('hr_recruitment_candidates').onDelete('CASCADE');
      t.string('type', 64).notNullable();
      t.string('title', 255).notNullable();
      t.text('body').nullable();
      t.string('link', 500).nullable();
      t.string('related_type', 64).nullable();
      t.integer('related_id').unsigned().nullable();
      t.string('dedupe_key', 128).nullable();
      t.timestamp('read_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'candidate_id'], 'hcn_college_cand_idx');
      t.unique(['candidate_id', 'dedupe_key'], { indexName: 'hcn_cand_dedupe_uq' });
    });
  }
};

exports.down = async function down(knex) {
  const tables = [
    'hr_candidate_notifications',
    'hr_candidate_access_tokens',
    'hr_prejoining_tasks',
    'hr_prejoining_checklist_items',
    'hr_prejoining_checklist_templates',
    'hr_recruitment_offers',
    'hr_interview_evaluations',
    'hr_interview_panel',
    'hr_interviews',
    'hr_job_interview_rounds',
    'hr_interview_round_template_items',
    'hr_interview_round_templates',
    'hr_recruitment_documents',
    'hr_recruitment_applications',
    'hr_recruitment_candidates',
    'hr_job_openings',
    'hr_recruitment_requisitions',
  ];
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
};
