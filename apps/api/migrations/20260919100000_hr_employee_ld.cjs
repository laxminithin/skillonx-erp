/**
 * HRMS Employee Learning & Development (L&D).
 *
 * Owns EMPLOYEE/FACULTY development execution: development needs, training
 * catalogue, scheduled programs + sessions, nominations/requests, approvals,
 * enrollment + capacity + waitlist, L&D training attendance (independent of HR
 * work attendance), completion, certificates (internal + external verification),
 * effectiveness reviews and development history.
 *
 * STRICTLY separate from Unified T&P (which owns STUDENT training via
 * training_programs / training_enrollments / training_attendance_records keyed
 * on student_id). L&D never touches those tables, nor HR employee attendance,
 * nor appraisal result tables.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const fkCollege = (t) => t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
  const fkEmployee = (t, col = 'employee_id', nn = true) => {
    const c = t.integer(col).unsigned();
    (nn ? c.notNullable() : c.nullable()).references('id').inTable('employees').onDelete('CASCADE');
    return c;
  };
  const fkFaculty = (t, col) => t.integer(col).unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');

  // ── Providers ──────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('ld_providers'))) {
    await knex.schema.createTable('ld_providers', (t) => {
      t.increments('id').primary();
      fkCollege(t);
      t.string('name', 200).notNullable();
      t.string('type', 16).notNullable().defaultTo('EXTERNAL'); // INTERNAL | EXTERNAL
      t.string('contact', 200).nullable();
      t.string('website', 255).nullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.decimal('quality_rating', 4, 2).nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'ldprov_college_status_idx');
    });
  }

  // ── Catalogue (reusable course definitions) ─────────────────────────────────
  if (!(await knex.schema.hasTable('ld_courses'))) {
    await knex.schema.createTable('ld_courses', (t) => {
      t.increments('id').primary();
      fkCollege(t);
      t.string('code', 48).notNullable();
      t.string('title', 200).notNullable();
      t.text('description').nullable();
      t.string('category', 48).notNullable().defaultTo('OTHER');
      t.string('provider_type', 16).notNullable().defaultTo('INTERNAL'); // INTERNAL | EXTERNAL
      t.string('default_delivery_mode', 16).notNullable().defaultTo('IN_PERSON');
      t.decimal('duration_hours', 6, 2).nullable();
      t.text('learning_objectives').nullable();
      t.string('target_audience', 32).nullable();
      t.json('skill_tags').nullable();
      t.integer('validity_months').unsigned().nullable(); // for certificate expiry
      t.boolean('is_mandatory_default').notNullable().defaultTo(false);
      t.string('status', 16).notNullable().defaultTo('ACTIVE'); // ACTIVE | ARCHIVED
      fkFaculty(t, 'created_by');
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'ldcourse_college_code_uq' });
      t.index(['college_id', 'status'], 'ldcourse_college_status_idx');
      t.index(['college_id', 'category'], 'ldcourse_college_cat_idx');
    });
  }

  // ── Programs (scheduled instances) ──────────────────────────────────────────
  if (!(await knex.schema.hasTable('ld_programs'))) {
    await knex.schema.createTable('ld_programs', (t) => {
      t.increments('id').primary();
      fkCollege(t);
      t.integer('course_id').unsigned().nullable().references('id').inTable('ld_courses').onDelete('SET NULL');
      t.integer('provider_id').unsigned().nullable().references('id').inTable('ld_providers').onDelete('SET NULL');
      t.string('code', 48).notNullable();
      t.string('title', 200).notNullable();
      t.string('provider_type', 16).notNullable().defaultTo('INTERNAL'); // INTERNAL | EXTERNAL
      fkEmployee(t, 'trainer_employee_id', false); // internal trainer (canonical employee)
      t.string('external_trainer_name', 200).nullable();
      t.string('delivery_mode', 16).notNullable().defaultTo('IN_PERSON'); // IN_PERSON|ONLINE|HYBRID|SELF_PACED
      t.date('start_date').nullable();
      t.date('end_date').nullable();
      t.string('timezone', 64).notNullable().defaultTo('Asia/Kolkata');
      t.string('venue', 255).nullable();
      t.string('link', 512).nullable();
      t.decimal('duration_hours', 6, 2).nullable();
      t.integer('capacity').unsigned().nullable(); // null = unlimited
      t.timestamp('registration_opens_at').nullable();
      t.timestamp('registration_closes_at').nullable();
      t.string('applicability_type', 24).notNullable().defaultTo('ALL'); // ALL|FACULTY|NON_FACULTY|DEPARTMENT|DESIGNATION|EMPLOYMENT_TYPE|SPECIFIC
      t.json('applicability_ref').nullable(); // {departmentIds:[], designationIds:[], employeeIds:[], employmentTypeIds:[]}
      t.boolean('is_mandatory').notNullable().defaultTo(false);
      t.date('mandatory_due_date').nullable();
      t.json('cost_json').nullable();
      // completion rule: {attendanceThreshold, requireAssessment, assessmentPassMark, requireMandatorySessions, requireTrainerConfirmation}
      t.json('completion_rule').nullable();
      t.string('status', 24).notNullable().defaultTo('DRAFT');
      fkFaculty(t, 'created_by');
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'ldprog_college_code_uq' });
      t.index(['college_id', 'status'], 'ldprog_college_status_idx');
      t.index(['college_id', 'start_date'], 'ldprog_college_start_idx');
    });
  }

  // ── Program sessions ────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('ld_program_sessions'))) {
    await knex.schema.createTable('ld_program_sessions', (t) => {
      t.increments('id').primary();
      fkCollege(t);
      t.integer('program_id').unsigned().notNullable().references('id').inTable('ld_programs').onDelete('CASCADE');
      t.string('title', 200).notNullable();
      t.date('session_date').nullable();
      t.string('start_time', 8).nullable();
      t.string('end_time', 8).nullable();
      fkEmployee(t, 'trainer_employee_id', false);
      t.string('external_trainer_name', 200).nullable();
      t.string('venue', 255).nullable();
      t.string('link', 512).nullable();
      t.boolean('is_mandatory').notNullable().defaultTo(true);
      t.string('status', 16).notNullable().defaultTo('SCHEDULED');
      t.timestamps(true, true);
      t.index(['college_id', 'program_id'], 'ldsess_college_prog_idx');
    });
  }

  // ── Development needs ───────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('ld_development_needs'))) {
    await knex.schema.createTable('ld_development_needs', (t) => {
      t.increments('id').primary();
      fkCollege(t);
      fkEmployee(t, 'employee_id', true);
      t.string('source_type', 24).notNullable().defaultTo('SELF'); // APPRAISAL|SELF|MANAGER|HR|INSTITUTIONAL|ROLE|COMPLIANCE
      t.integer('source_ref_id').unsigned().nullable(); // e.g. hr_appraisal_development_actions.id (read-only reference)
      t.string('development_area', 200).notNullable();
      t.string('target_competency', 200).nullable();
      t.string('priority', 12).notNullable().defaultTo('MEDIUM'); // LOW|MEDIUM|HIGH
      t.string('target_period', 48).nullable();
      t.string('status', 16).notNullable().defaultTo('IDENTIFIED'); // IDENTIFIED|PLANNED|IN_PROGRESS|COMPLETED|WAIVED|CANCELLED
      fkFaculty(t, 'created_by');
      fkFaculty(t, 'closed_by');
      t.timestamp('closed_at').nullable();
      t.text('close_reason').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'employee_id', 'status'], 'ldneed_college_emp_status_idx');
      t.index(['college_id', 'source_type', 'source_ref_id'], 'ldneed_source_idx');
    });
  }

  // ── Nominations / requests (pre-enrollment approval) ────────────────────────
  if (!(await knex.schema.hasTable('ld_nominations'))) {
    await knex.schema.createTable('ld_nominations', (t) => {
      t.increments('id').primary();
      fkCollege(t);
      t.integer('program_id').unsigned().notNullable().references('id').inTable('ld_programs').onDelete('CASCADE');
      fkEmployee(t, 'employee_id', true);
      t.integer('development_need_id').unsigned().nullable().references('id').inTable('ld_development_needs').onDelete('SET NULL');
      t.string('nomination_type', 16).notNullable(); // SELF_REQUEST | MANAGER | HR
      fkFaculty(t, 'nominated_by');
      t.text('reason').nullable();
      t.decimal('estimated_cost', 12, 2).nullable();
      t.string('supporting_ref', 512).nullable();
      t.string('status', 24).notNullable().defaultTo('SUBMITTED'); // SUBMITTED|MANAGER_APPROVED|APPROVED|REJECTED|WITHDRAWN|CONVERTED
      fkFaculty(t, 'manager_approved_by');
      t.timestamp('manager_approved_at').nullable();
      fkFaculty(t, 'hr_approved_by');
      t.timestamp('hr_approved_at').nullable();
      fkFaculty(t, 'rejected_by');
      t.timestamp('rejected_at').nullable();
      t.text('reject_reason').nullable();
      t.boolean('eligibility_override').notNullable().defaultTo(false);
      t.text('override_reason').nullable();
      t.timestamps(true, true);
      // One active nomination per (program, employee). Withdrawn/rejected free the slot.
      t.index(['college_id', 'program_id', 'employee_id', 'status'], 'ldnom_prog_emp_status_idx');
      t.index(['college_id', 'status'], 'ldnom_college_status_idx');
    });
  }

  // ── Enrollments (confirmed / waitlisted) ────────────────────────────────────
  if (!(await knex.schema.hasTable('ld_enrollments'))) {
    await knex.schema.createTable('ld_enrollments', (t) => {
      t.increments('id').primary();
      fkCollege(t);
      t.integer('program_id').unsigned().notNullable().references('id').inTable('ld_programs').onDelete('CASCADE');
      fkEmployee(t, 'employee_id', true);
      t.integer('nomination_id').unsigned().nullable().references('id').inTable('ld_nominations').onDelete('SET NULL');
      t.string('status', 16).notNullable().defaultTo('CONFIRMED'); // CONFIRMED|WAITLISTED|CANCELLED|DROPPED
      t.integer('waitlist_position').unsigned().nullable();
      t.string('completion_status', 16).notNullable().defaultTo('NOT_STARTED'); // NOT_STARTED|IN_PROGRESS|COMPLETED|FAILED
      t.timestamp('enrolled_at').nullable().defaultTo(knex.fn.now());
      t.timestamp('cancelled_at').nullable();
      t.timestamps(true, true);
      // Idempotency + no duplicate active enrollment.
      t.unique(['college_id', 'program_id', 'employee_id'], { indexName: 'ldenr_prog_emp_uq' });
      t.index(['college_id', 'program_id', 'status'], 'ldenr_prog_status_idx');
    });
  }

  // ── L&D training attendance (INDEPENDENT of HR attendance) ───────────────────
  if (!(await knex.schema.hasTable('ld_attendance'))) {
    await knex.schema.createTable('ld_attendance', (t) => {
      t.increments('id').primary();
      fkCollege(t);
      t.integer('program_id').unsigned().notNullable().references('id').inTable('ld_programs').onDelete('CASCADE');
      t.integer('session_id').unsigned().nullable().references('id').inTable('ld_program_sessions').onDelete('CASCADE');
      fkEmployee(t, 'employee_id', true);
      t.integer('enrollment_id').unsigned().nullable().references('id').inTable('ld_enrollments').onDelete('CASCADE');
      t.string('status', 16).notNullable().defaultTo('PRESENT'); // PRESENT|ABSENT|EXCUSED|NOT_REQUIRED
      t.boolean('finalized').notNullable().defaultTo(false);
      fkFaculty(t, 'recorded_by');
      t.timestamp('recorded_at').nullable().defaultTo(knex.fn.now());
      t.timestamps(true, true);
      // One attendance row per (session, employee); program-level uses session_id NULL.
      t.unique(['college_id', 'program_id', 'session_id', 'employee_id'], { indexName: 'ldatt_sess_emp_uq' });
      t.index(['college_id', 'program_id'], 'ldatt_college_prog_idx');
    });
  }

  // ── Completions (→ development history) ──────────────────────────────────────
  if (!(await knex.schema.hasTable('ld_completions'))) {
    await knex.schema.createTable('ld_completions', (t) => {
      t.increments('id').primary();
      fkCollege(t);
      t.integer('program_id').unsigned().notNullable().references('id').inTable('ld_programs').onDelete('CASCADE');
      fkEmployee(t, 'employee_id', true);
      t.integer('enrollment_id').unsigned().nullable().references('id').inTable('ld_enrollments').onDelete('SET NULL');
      t.string('result', 16).notNullable().defaultTo('COMPLETED'); // COMPLETED|PASSED|FAILED
      t.decimal('attendance_pct', 6, 2).nullable();
      t.decimal('assessment_score', 6, 2).nullable();
      t.boolean('assessment_passed').nullable();
      t.string('grade', 16).nullable();
      t.timestamp('completed_at').nullable().defaultTo(knex.fn.now());
      fkFaculty(t, 'confirmed_by');
      t.timestamps(true, true);
      t.unique(['college_id', 'program_id', 'employee_id'], { indexName: 'ldcomp_prog_emp_uq' });
      t.index(['college_id', 'employee_id'], 'ldcomp_college_emp_idx');
    });
  }

  // ── Certificates (internal issued + external submitted/verified) ────────────
  if (!(await knex.schema.hasTable('ld_certificates'))) {
    await knex.schema.createTable('ld_certificates', (t) => {
      t.increments('id').primary();
      fkCollege(t);
      fkEmployee(t, 'employee_id', true);
      t.integer('program_id').unsigned().nullable().references('id').inTable('ld_programs').onDelete('SET NULL');
      t.integer('completion_id').unsigned().nullable().references('id').inTable('ld_completions').onDelete('SET NULL');
      t.string('certificate_type', 16).notNullable().defaultTo('INTERNAL'); // INTERNAL | EXTERNAL
      t.string('certificate_number', 64).nullable(); // internal only
      t.string('title', 200).notNullable();
      t.string('provider', 200).nullable();
      t.date('issued_on').nullable();
      t.date('expires_on').nullable();
      t.string('file_reference', 512).nullable();
      // INTERNAL: ISSUED. EXTERNAL: SUBMITTED|VERIFIED|REJECTED
      t.string('status', 16).notNullable().defaultTo('ISSUED');
      fkFaculty(t, 'verified_by');
      t.timestamp('verified_at').nullable();
      t.text('reject_reason').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'certificate_number'], { indexName: 'ldcert_college_number_uq' });
      t.index(['college_id', 'employee_id'], 'ldcert_college_emp_idx');
      t.index(['college_id', 'expires_on'], 'ldcert_college_expiry_idx');
    });
  }

  // ── Effectiveness (employee feedback + manager review) ──────────────────────
  if (!(await knex.schema.hasTable('ld_effectiveness'))) {
    await knex.schema.createTable('ld_effectiveness', (t) => {
      t.increments('id').primary();
      fkCollege(t);
      t.integer('program_id').unsigned().notNullable().references('id').inTable('ld_programs').onDelete('CASCADE');
      fkEmployee(t, 'employee_id', true);
      t.integer('enrollment_id').unsigned().nullable().references('id').inTable('ld_enrollments').onDelete('SET NULL');
      t.string('kind', 20).notNullable(); // EMPLOYEE_FEEDBACK | MANAGER_REVIEW
      t.integer('rating').unsigned().nullable(); // 1..5
      t.integer('relevance_rating').unsigned().nullable();
      t.text('learning_gained').nullable();
      t.text('comments').nullable();
      t.boolean('improvement_observed').nullable();
      t.boolean('objective_met').nullable();
      t.boolean('follow_up_required').nullable();
      fkFaculty(t, 'created_by');
      t.timestamps(true, true);
      // One feedback of each kind per (program, employee).
      t.unique(['college_id', 'program_id', 'employee_id', 'kind'], { indexName: 'ldeff_prog_emp_kind_uq' });
    });
  }
};

exports.down = async function down(knex) {
  for (const table of [
    'ld_effectiveness',
    'ld_certificates',
    'ld_completions',
    'ld_attendance',
    'ld_enrollments',
    'ld_nominations',
    'ld_development_needs',
    'ld_program_sessions',
    'ld_programs',
    'ld_courses',
    'ld_providers',
  ]) {
    // eslint-disable-next-line no-await-in-loop
    if (await knex.schema.hasTable(table)) await knex.schema.dropTable(table);
  }
};
