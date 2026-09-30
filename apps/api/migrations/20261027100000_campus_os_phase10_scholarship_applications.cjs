/**
 * Campus OS Phase 10 — Scholarships, Financial Aid & Student Benefits.
 *
 * Additive only. Extends the existing Finance scheme/scholarship registry
 * (migration 20260904100000_finance_module.cjs) with a student application
 * intake, versioned eligibility policy, and a document-engine student-actor
 * extension. Finance remains the sole ledger — no new payment/ledger table
 * is created here; sanctioned applications post through the existing
 * `applyScholarshipToDemands` -> `recalculateDemandTotals` path.
 */

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  // ── Scheme master enrichment (additive columns only) ──────────────────
  if (!(await knex.schema.hasColumn('scholarship_schemes', 'provider_type'))) {
    await knex.schema.alterTable('scholarship_schemes', (t) => {
      t.string('provider_type', 32).notNullable().defaultTo('INSTITUTION');
      t.string('benefit_type', 32).notNullable().defaultTo('FEE_CONCESSION');
      t.boolean('is_external').notNullable().defaultTo(false);
      t.string('external_portal_url', 512).nullable();
      t.boolean('allow_multiple_applications').notNullable().defaultTo(false);
      t.boolean('renewal_allowed').notNullable().defaultTo(false);
      t.date('application_start_date').nullable();
      t.date('application_end_date').nullable();
    });
  }

  if (!(await knex.schema.hasColumn('student_scholarships', 'application_id'))) {
    await knex.schema.alterTable('student_scholarships', (t) => {
      t.integer('application_id').unsigned().nullable();
    });
  }

  // ── Versioned eligibility policy (historical-immutability: applications
  //    snapshot the policy version they were evaluated against; a later
  //    policy edit never mutates a past decision) ─────────────────────────
  if (!(await knex.schema.hasTable('scholarship_eligibility_policies'))) {
    await knex.schema.createTable('scholarship_eligibility_policies', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('scheme_id').unsigned().notNullable().references('id').inTable('scholarship_schemes').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.integer('version').unsigned().notNullable().defaultTo(1);
      // Structured, deterministic criteria only — never executable code.
      // Shape: { programIds?, minSemester?, minCgpa?, maxIncome?, categories?,
      //          minAttendancePercent?, requiredDocumentCategories? }
      t.text('criteria').notNullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['college_id', 'scheme_id', 'academic_year_id', 'version'], { indexName: 'sep_scheme_year_version_unique' });
      t.index(['college_id', 'scheme_id', 'academic_year_id', 'is_active'], 'sep_active_lookup_idx');
    });
  }

  // ── Application ─────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('scholarship_applications'))) {
    await knex.schema.createTable('scholarship_applications', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('scheme_id').unsigned().notNullable().references('id').inTable('scholarship_schemes').onDelete('RESTRICT');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.integer('eligibility_policy_id').unsigned().nullable()
        .references('id').inTable('scholarship_eligibility_policies').onDelete('SET NULL');

      // DRAFT -> SUBMITTED -> UNDER_VERIFICATION -> (RETURNED <-> UNDER_VERIFICATION) -> VERIFIED
      //       -> APPROVED -> SANCTIONED -> COMPLETED
      // Terminal side-states: REJECTED, WITHDRAWN, EXPIRED, CANCELLED.
      t.string('status', 24).notNullable().defaultTo('DRAFT');
      // Eligibility is evaluated, not equivalent to approval (directive §20).
      t.string('eligibility_status', 24).notNullable().defaultTo('PENDING');
      // Frozen result of the eligibility evaluation at submit time — never
      // recomputed against a later policy version (directive §19/§70).
      t.text('eligibility_snapshot').nullable();

      t.decimal('self_declared_income', 12, 2).nullable();
      t.string('self_declared_category', 64).nullable();
      t.decimal('requested_amount', 12, 2).nullable();
      t.decimal('sanctioned_amount', 12, 2).nullable();

      // Staff-only processing notes vs. what the student is shown — never
      // conflated (directive §52/§53).
      t.text('internal_remarks').nullable();
      t.text('student_remarks').nullable();

      // Set once the Finance handoff has posted a financial effect. The
      // presence of this FK plus `finance_handoff_key`'s unique index is
      // the idempotency guard for repeated sanction/handoff retries.
      t.integer('student_scholarship_id').unsigned().nullable()
        .references('id').inTable('student_scholarships').onDelete('SET NULL');
      t.string('finance_handoff_key', 191).nullable();

      t.timestamp('submitted_at').nullable();
      t.integer('verified_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('verified_at').nullable();
      t.integer('decided_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('decided_at').nullable();
      t.integer('sanctioned_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('sanctioned_at').nullable();
      t.timestamp('withdrawn_at').nullable();

      t.timestamps(true, true);

      t.unique(['finance_handoff_key'], { indexName: 'sa_finance_handoff_key_unique' });
      t.index(['college_id', 'student_id', 'status'], 'sa_college_student_status_idx');
      t.index(['college_id', 'scheme_id', 'academic_year_id'], 'sa_college_scheme_year_idx');
      t.index(['college_id', 'status'], 'sa_college_status_idx');
    });
  }

  // ── One-active-application-per-(student, scheme, year) guard ──────────
  // A real DB unique index, not an application-level check, so concurrent
  // duplicate submissions are rejected atomically (directive §16/§61/§62).
  // Only held while the application is in a non-terminal-reopenable state;
  // removed on WITHDRAWN/REJECTED so a student may reapply if the scheme's
  // policy allows it.
  if (!(await knex.schema.hasTable('scholarship_application_slots'))) {
    await knex.schema.createTable('scholarship_application_slots', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('scheme_id').unsigned().notNullable().references('id').inTable('scholarship_schemes').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('CASCADE');
      t.integer('application_id').unsigned().notNullable()
        .references('id').inTable('scholarship_applications').onDelete('CASCADE');
      t.timestamps(true, true);
      t.unique(['college_id', 'student_id', 'scheme_id', 'academic_year_id'], { indexName: 'sas_one_slot_unique' });
    });
  }

  // ── Document Engine: additive student-actor support ───────────────────
  // campus_documents was faculty-only (uploaded_by_faculty_id NOT NULL).
  // Scholarship evidence is student-uploaded, so we relax that column to
  // nullable and add a parallel nullable student column. Exactly one of the
  // two is enforced in application code (documentEngine/service.ts), not a
  // DB CHECK, to stay portable across the project's MySQL versions.
  if (!(await knex.schema.hasColumn('campus_documents', 'uploaded_by_student_id'))) {
    await knex.schema.alterTable('campus_documents', (t) => {
      t.integer('uploaded_by_student_id').unsigned().nullable()
        .references('id').inTable('students').onDelete('SET NULL');
    });
    await knex.schema.alterTable('campus_documents', (t) => {
      t.integer('uploaded_by_faculty_id').unsigned().nullable().alter();
    });
  }
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  if (await knex.schema.hasColumn('campus_documents', 'uploaded_by_student_id')) {
    await knex.schema.alterTable('campus_documents', (t) => {
      t.dropForeign(['uploaded_by_student_id']);
    });
    await knex.schema.alterTable('campus_documents', (t) => {
      t.dropColumn('uploaded_by_student_id');
    });
    await knex.schema.alterTable('campus_documents', (t) => {
      t.integer('uploaded_by_faculty_id').unsigned().notNullable().alter();
    });
  }

  await knex.schema.dropTableIfExists('scholarship_application_slots');
  await knex.schema.dropTableIfExists('scholarship_applications');
  await knex.schema.dropTableIfExists('scholarship_eligibility_policies');

  if (await knex.schema.hasColumn('student_scholarships', 'application_id')) {
    await knex.schema.alterTable('student_scholarships', (t) => {
      t.dropColumn('application_id');
    });
  }

  if (await knex.schema.hasColumn('scholarship_schemes', 'provider_type')) {
    await knex.schema.alterTable('scholarship_schemes', (t) => {
      t.dropColumn('provider_type');
      t.dropColumn('benefit_type');
      t.dropColumn('is_external');
      t.dropColumn('external_portal_url');
      t.dropColumn('allow_multiple_applications');
      t.dropColumn('renewal_allowed');
      t.dropColumn('application_start_date');
      t.dropColumn('application_end_date');
    });
  }
};
