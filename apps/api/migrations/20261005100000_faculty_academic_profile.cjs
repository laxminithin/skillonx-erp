/**
 * Lecturer Portal Enhancement — Phase B.
 * Faculty Academic & Professional Profile + generic accreditation-evidence engine.
 *
 * Design (spec §B1 source-of-truth audit): HRMS `employees` remains authoritative
 * for employee/service info; academic contribution records that have NO
 * authoritative engine (publications, patents, projects, FDP, awards, memberships,
 * qualifications, experience, teaching contributions, guidance, etc.) live here as
 * a UNIFIED, historical, evidence-backed record engine rather than ~20 bespoke
 * tables. Teaching allocations, mentoring, coordinator and leadership roles are
 * DERIVED at read time from their authoritative modules and never duplicated here.
 *
 * Four additive tables, all college-scoped (multi-tenant), all guarded by hasTable:
 *   faculty_academic_profiles    — one per employee: research identifiers, N/A flags, completeness cache
 *   faculty_records              — generic domain record (QUALIFICATION, PUBLICATION, PATENT, ...)
 *   faculty_record_evidence      — evidence documents attached to a record
 *   faculty_record_verifications — append-only verification history (never overwritten)
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('faculty_academic_profiles'))) {
    await knex.schema.createTable('faculty_academic_profiles', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.integer('faculty_user_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      // Faculty-maintained academic identifiers (unverified unless separately validated)
      t.string('orcid', 32).nullable();
      t.string('google_scholar_id', 128).nullable();
      t.string('scopus_author_id', 64).nullable();
      t.string('wos_researcher_id', 64).nullable();
      t.string('vidwan_id', 64).nullable();
      t.string('other_research_id', 255).nullable();
      t.string('photo_reference', 512).nullable(); // optional override; else HRMS employees.profile_photo_reference
      t.json('not_applicable').nullable(); // { sectionKey: true } — sections the faculty marks N/A
      t.json('completeness_cache').nullable();
      t.timestamp('completeness_updated_at').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'employee_id'], { indexName: 'fap_college_emp_unique' });
      t.index(['college_id', 'faculty_user_id'], 'fap_college_faculty_idx');
    });
  }

  if (!(await knex.schema.hasTable('faculty_records'))) {
    await knex.schema.createTable('faculty_records', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.integer('faculty_user_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('domain', 40).notNullable(); // QUALIFICATION | EXPERIENCE | PUBLICATION | PATENT | PROJECT | ...
      t.string('record_type', 48).nullable(); // sub-kind: JOURNAL | CONFERENCE | PhD | INDUSTRY | FDP | ...
      t.string('title', 512).notNullable();
      t.integer('academic_year_id').unsigned().nullable().references('id').inTable('academic_years').onDelete('SET NULL');
      t.string('academic_year_label', 32).nullable(); // frozen label so history survives AY master edits
      t.date('start_date').nullable();
      t.date('end_date').nullable();
      t.boolean('is_current').notNullable().defaultTo(false);
      t.string('category', 64).nullable();
      t.string('level', 32).nullable(); // INSTITUTIONAL | UNIVERSITY | STATE | NATIONAL | INTERNATIONAL
      t.string('status', 32).nullable(); // domain-specific lifecycle (e.g. SANCTIONED, GRANTED, COMPLETED)
      t.string('role_label', 128).nullable();
      t.string('unique_ref', 255).nullable(); // normalized DOI / application no / credential id for dedupe
      t.json('details').nullable();
      t.string('source', 16).notNullable().defaultTo('FACULTY'); // FACULTY (self-entered) | DERIVED
      t.string('verification_status', 16).notNullable().defaultTo('DRAFT'); // DRAFT|SUBMITTED|VERIFIED|RETURNED|REJECTED|NOT_REQUIRED
      t.integer('verified_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('verified_by_role', 32).nullable();
      t.timestamp('verified_at').nullable();
      t.text('verify_remarks').nullable();
      t.timestamp('submitted_at').nullable();
      t.boolean('is_archived').notNullable().defaultTo(false);
      t.integer('created_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'employee_id', 'domain'], 'frec_col_emp_domain_idx');
      t.index(['college_id', 'domain', 'academic_year_label'], 'frec_col_domain_ay_idx');
      t.index(['college_id', 'domain', 'verification_status'], 'frec_col_domain_vstat_idx');
      t.index(['college_id', 'faculty_user_id'], 'frec_col_faculty_idx');
      t.index(['college_id', 'unique_ref'], 'frec_col_uref_idx');
      // Prevent a faculty from double-entering the same identified output within a domain.
      t.unique(['employee_id', 'domain', 'unique_ref'], { indexName: 'frec_emp_domain_uref_unique' });
    });
  }

  if (!(await knex.schema.hasTable('faculty_record_evidence'))) {
    await knex.schema.createTable('faculty_record_evidence', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('record_id').unsigned().notNullable().references('id').inTable('faculty_records').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.string('file_name', 255).notNullable();
      t.string('mime_type', 128).notNullable();
      t.integer('file_size').notNullable();
      t.string('storage_key', 512).notNullable();
      t.string('checksum', 64).nullable(); // sha256 hex
      t.string('evidence_category', 64).nullable();
      t.string('evidence_subcategory', 64).nullable();
      t.text('description').nullable();
      t.string('reference', 512).nullable();
      t.integer('uploaded_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'record_id'], 'frev_col_record_idx');
      t.index(['college_id', 'employee_id'], 'frev_col_emp_idx');
    });
  }

  if (!(await knex.schema.hasTable('faculty_record_verifications'))) {
    await knex.schema.createTable('faculty_record_verifications', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('record_id').unsigned().notNullable().references('id').inTable('faculty_records').onDelete('CASCADE');
      t.string('action', 16).notNullable(); // SUBMIT | VERIFY | RETURN | REJECT | REOPEN
      t.string('from_status', 16).nullable();
      t.string('to_status', 16).notNullable();
      t.integer('acted_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('acted_by_role', 32).nullable();
      t.text('remarks').nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'record_id', 'created_at'], 'frv_col_record_time_idx');
    });
  }
};

exports.down = async function down(knex) {
  for (const table of [
    'faculty_record_verifications',
    'faculty_record_evidence',
    'faculty_records',
    'faculty_academic_profiles',
  ]) {
    if (await knex.schema.hasTable(table)) {
      await knex.schema.dropTable(table);
    }
  }
};
