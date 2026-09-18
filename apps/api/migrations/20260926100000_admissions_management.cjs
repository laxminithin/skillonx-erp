/**
 * Admissions Management.
 *
 * Admissions owns applicant lifecycle before confirmation. After confirmation,
 * the existing `students` table is the canonical identity. This migration adds
 * only admission-specific workflow tables plus a nullable student admission
 * number; it does not create a parallel admitted-student master.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasColumn('students', 'admission_number'))) {
    await knex.schema.alterTable('students', (t) => {
      t.string('admission_number', 64).nullable();
    });
    await knex.raw('CREATE UNIQUE INDEX students_college_admission_number_unique ON students (college_id, admission_number)');
  }

  // USN may arrive after university registration. Admission number remains the
  // institution-scoped identity during that interval.
  try {
    await knex.raw('ALTER TABLE students MODIFY usn VARCHAR(64) NULL');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes('check that column/key exists')) throw err;
  }

  if (!(await knex.schema.hasTable('admission_cycles'))) {
    await knex.schema.createTable('admission_cycles', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.string('name', 255).notNullable();
      t.date('application_start').nullable();
      t.date('application_end').nullable();
      t.date('admission_start').nullable();
      t.date('admission_end').nullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['college_id', 'name'], { indexName: 'adm_cycles_college_name_unique' });
      t.index(['college_id', 'academic_year_id', 'status'], 'adm_cycles_college_year_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('admission_program_intakes'))) {
    await knex.schema.createTable('admission_program_intakes', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('cycle_id').unsigned().notNullable().references('id').inTable('admission_cycles').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.integer('program_id').unsigned().notNullable().references('id').inTable('programs').onDelete('RESTRICT');
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('scheme_id').unsigned().nullable().references('id').inTable('academic_schemes').onDelete('SET NULL');
      t.integer('semester_id').unsigned().nullable().references('id').inTable('semesters').onDelete('SET NULL');
      t.integer('class_section_id').unsigned().nullable().references('id').inTable('class_sections').onDelete('SET NULL');
      t.string('category', 64).nullable();
      t.integer('approved_intake').unsigned().notNullable();
      t.integer('selected_count').unsigned().notNullable().defaultTo(0);
      t.integer('admitted_count').unsigned().notNullable().defaultTo(0);
      t.string('status', 32).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.unique(['cycle_id', 'program_id', 'category'], { indexName: 'adm_intake_cycle_program_category_unique' });
      t.index(['college_id', 'cycle_id', 'program_id'], 'adm_intake_college_cycle_program_idx');
    });
  }

  if (!(await knex.schema.hasTable('admission_enquiries'))) {
    await knex.schema.createTable('admission_enquiries', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('cycle_id').unsigned().nullable().references('id').inTable('admission_cycles').onDelete('SET NULL');
      t.string('name', 255).notNullable();
      t.string('phone', 32).nullable();
      t.string('email', 255).nullable();
      t.integer('interested_program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
      t.string('source', 32).notNullable().defaultTo('OTHER');
      t.integer('assigned_to').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('status', 32).notNullable().defaultTo('NEW');
      t.date('next_follow_up').nullable();
      t.text('notes').nullable();
      t.integer('converted_applicant_id').unsigned().nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'status', 'next_follow_up'], 'adm_enq_college_status_follow_idx');
      t.index(['college_id', 'email'], 'adm_enq_college_email_idx');
      t.index(['college_id', 'phone'], 'adm_enq_college_phone_idx');
    });
  }

  if (!(await knex.schema.hasTable('admission_applicants'))) {
    await knex.schema.createTable('admission_applicants', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('cycle_id').unsigned().notNullable().references('id').inTable('admission_cycles').onDelete('RESTRICT');
      t.integer('enquiry_id').unsigned().nullable().references('id').inTable('admission_enquiries').onDelete('SET NULL');
      t.string('application_number', 64).notNullable();
      t.string('name', 255).notNullable();
      t.string('email', 255).notNullable();
      t.string('phone', 32).nullable();
      t.json('profile_json').nullable();
      t.json('address_json').nullable();
      t.json('guardian_json').nullable();
      t.string('admission_category', 64).nullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.timestamp('submitted_at').nullable();
      t.timestamp('cancelled_at').nullable();
      t.text('cancellation_reason').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'application_number'], { indexName: 'adm_app_college_appno_unique' });
      t.unique(['college_id', 'cycle_id', 'email'], { indexName: 'adm_app_college_cycle_email_unique' });
      t.index(['college_id', 'cycle_id', 'status'], 'adm_app_college_cycle_status_idx');
      t.index(['college_id', 'phone'], 'adm_app_college_phone_idx');
    });
  }

  if (!(await knex.schema.hasTable('admission_applicant_education'))) {
    await knex.schema.createTable('admission_applicant_education', (t) => {
      t.increments('id').primary();
      t.integer('applicant_id').unsigned().notNullable().references('id').inTable('admission_applicants').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('qualification', 128).notNullable();
      t.string('institution', 255).nullable();
      t.string('board_university', 255).nullable();
      t.integer('year_of_passing').unsigned().nullable();
      t.string('registration_number', 128).nullable();
      t.decimal('marks_percentage', 6, 2).nullable();
      t.decimal('cgpa', 6, 2).nullable();
      t.json('subjects_json').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'applicant_id'], 'adm_edu_college_applicant_idx');
    });
  }

  if (!(await knex.schema.hasTable('admission_program_preferences'))) {
    await knex.schema.createTable('admission_program_preferences', (t) => {
      t.increments('id').primary();
      t.integer('applicant_id').unsigned().notNullable().references('id').inTable('admission_applicants').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('program_id').unsigned().notNullable().references('id').inTable('programs').onDelete('RESTRICT');
      t.integer('preference_order').unsigned().notNullable().defaultTo(1);
      t.timestamps(true, true);
      t.unique(['applicant_id', 'preference_order'], { indexName: 'adm_pref_app_order_unique' });
      t.index(['college_id', 'program_id'], 'adm_pref_college_program_idx');
    });
  }

  if (!(await knex.schema.hasTable('admission_document_requirements'))) {
    await knex.schema.createTable('admission_document_requirements', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('cycle_id').unsigned().notNullable().references('id').inTable('admission_cycles').onDelete('CASCADE');
      t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('CASCADE');
      t.string('category', 64).nullable();
      t.string('document_code', 64).notNullable();
      t.string('name', 255).notNullable();
      t.boolean('is_required').notNullable().defaultTo(true);
      t.json('allowed_mime_types').nullable();
      t.integer('max_size_bytes').unsigned().nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['cycle_id', 'program_id', 'category', 'document_code'], { indexName: 'adm_doc_req_scope_code_unique' });
    });
  }

  if (!(await knex.schema.hasTable('admission_documents'))) {
    await knex.schema.createTable('admission_documents', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('applicant_id').unsigned().notNullable().references('id').inTable('admission_applicants').onDelete('CASCADE');
      t.integer('requirement_id').unsigned().nullable().references('id').inTable('admission_document_requirements').onDelete('SET NULL');
      t.integer('version').unsigned().notNullable().defaultTo(1);
      t.string('file_name', 255).notNullable();
      t.string('mime_type', 128).notNullable();
      t.integer('file_size_bytes').unsigned().notNullable();
      t.string('storage_key', 512).notNullable();
      t.string('verification_status', 32).notNullable().defaultTo('PENDING');
      t.integer('verified_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('verified_at').nullable();
      t.text('remarks').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'applicant_id', 'verification_status'], 'adm_docs_college_app_status_idx');
      t.index(['applicant_id', 'requirement_id', 'version'], 'adm_docs_app_req_ver_idx');
    });
  }

  if (!(await knex.schema.hasTable('admission_document_verification_history'))) {
    await knex.schema.createTable('admission_document_verification_history', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('document_id').unsigned().notNullable().references('id').inTable('admission_documents').onDelete('CASCADE');
      t.string('from_status', 32).nullable();
      t.string('to_status', 32).notNullable();
      t.integer('actor_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('remarks').nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['document_id', 'created_at'], 'adm_doc_hist_doc_created_idx');
    });
  }

  if (!(await knex.schema.hasTable('admission_eligibility_rules'))) {
    await knex.schema.createTable('admission_eligibility_rules', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('cycle_id').unsigned().notNullable().references('id').inTable('admission_cycles').onDelete('CASCADE');
      t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('CASCADE');
      t.string('rule_type', 64).notNullable();
      t.decimal('min_percentage', 6, 2).nullable();
      t.json('required_subjects').nullable();
      t.boolean('verified_documents_required').notNullable().defaultTo(true);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.index(['college_id', 'cycle_id', 'program_id', 'is_active'], 'adm_el_rules_scope_idx');
    });
  }

  if (!(await knex.schema.hasTable('admission_eligibility_decisions'))) {
    await knex.schema.createTable('admission_eligibility_decisions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('applicant_id').unsigned().notNullable().references('id').inTable('admission_applicants').onDelete('CASCADE');
      t.string('status', 32).notNullable();
      t.json('explanation_json').notNullable();
      t.integer('evaluated_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('evaluated_at').notNullable().defaultTo(knex.fn.now());
      t.boolean('is_override').notNullable().defaultTo(false);
      t.text('override_reason').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'applicant_id', 'evaluated_at'], 'adm_el_decision_app_idx');
    });
  }

  if (!(await knex.schema.hasTable('admission_selections'))) {
    await knex.schema.createTable('admission_selections', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('applicant_id').unsigned().notNullable().references('id').inTable('admission_applicants').onDelete('CASCADE');
      t.integer('program_id').unsigned().notNullable().references('id').inTable('programs').onDelete('RESTRICT');
      t.integer('intake_id').unsigned().nullable().references('id').inTable('admission_program_intakes').onDelete('SET NULL');
      t.string('status', 32).notNullable();
      t.integer('waitlist_rank').unsigned().nullable();
      t.decimal('merit_score', 8, 2).nullable();
      t.json('merit_explanation').nullable();
      t.integer('selected_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('remarks').nullable();
      t.timestamps(true, true);
      t.unique(['applicant_id'], { indexName: 'adm_selection_one_per_app_unique' });
      t.index(['college_id', 'program_id', 'status'], 'adm_selection_college_program_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('admission_offers'))) {
    await knex.schema.createTable('admission_offers', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('applicant_id').unsigned().notNullable().references('id').inTable('admission_applicants').onDelete('CASCADE');
      t.integer('program_id').unsigned().notNullable().references('id').inTable('programs').onDelete('RESTRICT');
      t.date('offer_date').notNullable();
      t.date('expires_at').nullable();
      t.string('status', 32).notNullable().defaultTo('OFFERED');
      t.text('conditions').nullable();
      t.timestamp('responded_at').nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['applicant_id'], { indexName: 'adm_offer_one_per_app_unique' });
    });
  }

  if (!(await knex.schema.hasTable('admission_seat_allocations'))) {
    await knex.schema.createTable('admission_seat_allocations', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('applicant_id').unsigned().notNullable().references('id').inTable('admission_applicants').onDelete('CASCADE');
      t.integer('intake_id').unsigned().notNullable().references('id').inTable('admission_program_intakes').onDelete('RESTRICT');
      t.string('status', 32).notNullable().defaultTo('ALLOCATED');
      t.integer('allocated_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('allocated_at').notNullable().defaultTo(knex.fn.now());
      t.timestamps(true, true);
      t.unique(['applicant_id'], { indexName: 'adm_seat_one_per_app_unique' });
      t.index(['college_id', 'intake_id', 'status'], 'adm_seat_college_intake_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('admission_student_conversions'))) {
    await knex.schema.createTable('admission_student_conversions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('applicant_id').unsigned().notNullable().references('id').inTable('admission_applicants').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('RESTRICT');
      t.string('admission_number', 64).notNullable();
      t.integer('converted_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('converted_at').notNullable().defaultTo(knex.fn.now());
      t.json('mapping_snapshot').nullable();
      t.timestamps(true, true);
      t.unique(['applicant_id'], { indexName: 'adm_conv_applicant_unique' });
      t.unique(['student_id'], { indexName: 'adm_conv_student_unique' });
      t.unique(['college_id', 'admission_number'], { indexName: 'adm_conv_college_admno_unique' });
    });
  }

  if (!(await knex.schema.hasTable('admission_audit_log'))) {
    await knex.schema.createTable('admission_audit_log', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('actor_type', 32).notNullable().defaultTo('FACULTY');
      t.integer('actor_id').unsigned().nullable();
      t.string('action', 96).notNullable();
      t.string('entity_type', 64).notNullable();
      t.integer('entity_id').unsigned().nullable();
      t.json('before_state').nullable();
      t.json('after_state').nullable();
      t.text('reason').nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'entity_type', 'entity_id'], 'adm_audit_entity_idx');
      t.index(['college_id', 'action', 'created_at'], 'adm_audit_action_idx');
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('admission_audit_log');
  await knex.schema.dropTableIfExists('admission_student_conversions');
  await knex.schema.dropTableIfExists('admission_seat_allocations');
  await knex.schema.dropTableIfExists('admission_offers');
  await knex.schema.dropTableIfExists('admission_selections');
  await knex.schema.dropTableIfExists('admission_eligibility_decisions');
  await knex.schema.dropTableIfExists('admission_eligibility_rules');
  await knex.schema.dropTableIfExists('admission_document_verification_history');
  await knex.schema.dropTableIfExists('admission_documents');
  await knex.schema.dropTableIfExists('admission_document_requirements');
  await knex.schema.dropTableIfExists('admission_program_preferences');
  await knex.schema.dropTableIfExists('admission_applicant_education');
  await knex.schema.dropTableIfExists('admission_applicants');
  await knex.schema.dropTableIfExists('admission_enquiries');
  await knex.schema.dropTableIfExists('admission_program_intakes');
  await knex.schema.dropTableIfExists('admission_cycles');

  if (await knex.schema.hasColumn('students', 'admission_number')) {
    try {
      await knex.raw('DROP INDEX students_college_admission_number_unique ON students');
    } catch {}
    await knex.schema.alterTable('students', (t) => {
      t.dropColumn('admission_number');
    });
  }
};
