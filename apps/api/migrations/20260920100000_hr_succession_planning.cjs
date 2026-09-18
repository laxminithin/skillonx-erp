/**
 * HRMS Succession Planning & Talent Management.
 *
 * Strategic HR layer that CONSUMES evidence from Employee Lifecycle,
 * Performance/Appraisal and Employee L&D but never mutates them. Uses its own
 * `succession_*` tables. Never touches student T&P training tables, HR
 * attendance, payroll or finalized appraisal/L&D records.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const fkCollege = (t) => t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
  const fkEmp = (t, col, nn) => {
    const c = t.integer(col).unsigned();
    (nn ? c.notNullable() : c.nullable()).references('id').inTable('employees').onDelete(nn ? 'CASCADE' : 'SET NULL');
    return c;
  };
  const fkFac = (t, col) => t.integer(col).unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');

  // ── Critical roles ──────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('succession_critical_roles'))) {
    await knex.schema.createTable('succession_critical_roles', (t) => {
      t.increments('id').primary();
      fkCollege(t);
      t.string('code', 48).notNullable();
      t.string('role_title', 200).notNullable();
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('designation_id').unsigned().nullable().references('id').inTable('hr_designations').onDelete('SET NULL');
      fkEmp(t, 'incumbent_employee_id', false);
      t.string('criticality', 12).notNullable().defaultTo('MEDIUM'); // LOW|MEDIUM|HIGH|CRITICAL
      t.text('impact_notes').nullable();
      t.string('vacancy_risk', 12).notNullable().defaultTo('MEDIUM'); // LOW|MEDIUM|HIGH
      t.string('exit_risk', 12).notNullable().defaultTo('MEDIUM');
      t.string('replacement_urgency', 12).notNullable().defaultTo('MEDIUM');
      t.json('required_competencies').nullable();
      t.integer('min_experience_years').unsigned().nullable();
      t.string('min_readiness', 16).nullable(); // READY_NOW|READY_1_YEAR|...
      t.text('notes').nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.date('effective_from').nullable();
      t.date('effective_to').nullable();
      fkFac(t, 'created_by');
      fkFac(t, 'updated_by');
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'scr_college_code_uq' });
      t.index(['college_id', 'is_active', 'criticality'], 'scr_college_active_crit_idx');
      t.index(['college_id', 'department_id'], 'scr_college_dept_idx');
    });
  }

  // ── Talent assessments (versioned; finalized = immutable) ────────────────────
  if (!(await knex.schema.hasTable('succession_talent_assessments'))) {
    await knex.schema.createTable('succession_talent_assessments', (t) => {
      t.increments('id').primary();
      fkCollege(t);
      fkEmp(t, 'employee_id', true);
      t.string('assessment_period', 48).notNullable();
      fkFac(t, 'assessor_faculty_id');
      t.string('performance_band', 8).nullable(); // LOW|MEDIUM|HIGH
      t.string('potential_band', 8).nullable();
      t.string('overall_potential', 8).nullable();
      t.string('readiness', 16).nullable(); // READY_NOW|READY_1_YEAR|READY_2_YEARS|DEVELOPING|NOT_READY
      t.integer('leadership_capability').unsigned().nullable(); // 1..5
      t.integer('functional_capability').unsigned().nullable();
      t.integer('institutional_knowledge').unsigned().nullable();
      t.string('mobility', 16).nullable();
      t.string('retention_concern', 12).nullable(); // LOW|MEDIUM|HIGH
      t.text('development_summary').nullable();
      t.text('comments').nullable();
      t.json('evidence_refs').nullable();
      t.string('classification_source', 16).notNullable().defaultTo('ASSESSMENT'); // APPRAISAL|ASSESSMENT|RULE
      t.string('status', 12).notNullable().defaultTo('DRAFT'); // DRAFT|FINALIZED
      t.integer('version_no').unsigned().notNullable().defaultTo(1);
      t.integer('parent_assessment_id').unsigned().nullable();
      t.timestamp('finalized_at').nullable();
      fkFac(t, 'finalized_by');
      t.timestamps(true, true);
      t.unique(['college_id', 'employee_id', 'assessment_period', 'version_no'], { indexName: 'sta_emp_period_ver_uq' });
      t.index(['college_id', 'employee_id', 'status'], 'sta_college_emp_status_idx');
      t.index(['college_id', 'performance_band', 'potential_band'], 'sta_matrix_idx');
    });
  }

  // ── Talent pools + members ──────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('succession_talent_pools'))) {
    await knex.schema.createTable('succession_talent_pools', (t) => {
      t.increments('id').primary();
      fkCollege(t);
      t.string('name', 160).notNullable();
      t.text('description').nullable();
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.text('eligibility_criteria').nullable();
      fkFac(t, 'owner_faculty_id');
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'name'], { indexName: 'stp_college_name_uq' });
    });
  }
  if (!(await knex.schema.hasTable('succession_talent_pool_members'))) {
    await knex.schema.createTable('succession_talent_pool_members', (t) => {
      t.increments('id').primary();
      fkCollege(t);
      t.integer('pool_id').unsigned().notNullable().references('id').inTable('succession_talent_pools').onDelete('CASCADE');
      fkEmp(t, 'employee_id', true);
      t.date('entry_date').nullable();
      t.date('exit_date').nullable();
      t.text('entry_reason').nullable();
      t.string('status', 12).notNullable().defaultTo('ACTIVE'); // ACTIVE|EXITED
      fkFac(t, 'added_by');
      t.timestamps(true, true);
      t.unique(['college_id', 'pool_id', 'employee_id'], { indexName: 'stpm_pool_emp_uq' });
      t.index(['college_id', 'employee_id'], 'stpm_college_emp_idx');
    });
  }

  // ── Succession candidates (the slate for each critical role) ─────────────────
  if (!(await knex.schema.hasTable('succession_candidates'))) {
    await knex.schema.createTable('succession_candidates', (t) => {
      t.increments('id').primary();
      fkCollege(t);
      t.integer('critical_role_id').unsigned().notNullable().references('id').inTable('succession_critical_roles').onDelete('CASCADE');
      fkEmp(t, 'employee_id', true);
      t.string('nomination_source', 16).notNullable(); // HR|HOD|PRINCIPAL|MANAGER
      fkFac(t, 'nominated_by');
      t.timestamp('nominated_at').nullable().defaultTo(knex.fn.now());
      t.string('readiness', 16).notNullable().defaultTo('DEVELOPING'); // READY_NOW|READY_1_YEAR|READY_2_YEARS|DEVELOPING|NOT_READY
      t.integer('rank').unsigned().nullable();
      t.text('strengths').nullable();
      t.text('development_gaps').nullable();
      t.json('evidence_refs').nullable();
      t.string('status', 16).notNullable().defaultTo('NOMINATED'); // DRAFT|NOMINATED|UNDER_REVIEW|APPROVED|REJECTED|WITHDRAWN
      fkFac(t, 'approved_by');
      t.timestamp('approved_at').nullable();
      fkFac(t, 'rejected_by');
      t.timestamp('rejected_at').nullable();
      t.text('decision_remarks').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'critical_role_id', 'employee_id'], { indexName: 'scand_role_emp_uq' });
      t.index(['college_id', 'critical_role_id', 'status'], 'scand_role_status_idx');
      t.index(['college_id', 'readiness'], 'scand_readiness_idx');
    });
  }

  // ── Readiness reviews (append-only history) ──────────────────────────────────
  if (!(await knex.schema.hasTable('succession_readiness_reviews'))) {
    await knex.schema.createTable('succession_readiness_reviews', (t) => {
      t.increments('id').primary();
      fkCollege(t);
      t.integer('candidate_id').unsigned().notNullable().references('id').inTable('succession_candidates').onDelete('CASCADE');
      t.integer('critical_role_id').unsigned().nullable().references('id').inTable('succession_critical_roles').onDelete('SET NULL');
      fkEmp(t, 'employee_id', true);
      t.string('previous_readiness', 16).nullable();
      t.string('new_readiness', 16).notNullable();
      t.date('review_date').nullable();
      fkFac(t, 'reviewer_faculty_id');
      t.text('development_gaps').nullable();
      t.json('evidence_refs').nullable();
      t.text('comments').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'candidate_id'], 'srr_college_cand_idx');
    });
  }

  // ── Development actions ──────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('succession_development_actions'))) {
    await knex.schema.createTable('succession_development_actions', (t) => {
      t.increments('id').primary();
      fkCollege(t);
      t.integer('candidate_id').unsigned().nullable().references('id').inTable('succession_candidates').onDelete('SET NULL');
      t.integer('critical_role_id').unsigned().nullable().references('id').inTable('succession_critical_roles').onDelete('SET NULL');
      fkEmp(t, 'employee_id', true);
      t.string('action_type', 24).notNullable(); // TRAINING|MENTORING|SHADOWING|STRETCH|CERTIFICATION|LEADERSHIP_PROGRAM|CUSTOM
      t.text('description').notNullable();
      fkFac(t, 'owner_faculty_id');
      fkEmp(t, 'mentor_employee_id', false);
      t.date('due_date').nullable();
      t.string('status', 16).notNullable().defaultTo('OPEN'); // OPEN|IN_PROGRESS|COMPLETED|CANCELLED
      // read-only references into frozen L&D (never mutated by succession)
      t.integer('linked_ld_program_id').unsigned().nullable();
      t.integer('linked_ld_completion_id').unsigned().nullable();
      t.text('completion_evidence').nullable();
      t.timestamp('completed_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'employee_id', 'status'], 'sda_college_emp_status_idx');
      t.index(['college_id', 'candidate_id'], 'sda_college_cand_idx');
    });
  }

  // ── Succession events (vacancy activation / decision) ────────────────────────
  if (!(await knex.schema.hasTable('succession_events'))) {
    await knex.schema.createTable('succession_events', (t) => {
      t.increments('id').primary();
      fkCollege(t);
      t.integer('critical_role_id').unsigned().notNullable().references('id').inTable('succession_critical_roles').onDelete('CASCADE');
      t.timestamp('opened_at').nullable().defaultTo(knex.fn.now());
      fkFac(t, 'opened_by');
      t.text('reason').nullable();
      t.integer('selected_candidate_id').unsigned().nullable().references('id').inTable('succession_candidates').onDelete('SET NULL');
      fkEmp(t, 'selected_employee_id', false);
      t.text('decision_notes').nullable();
      t.date('effective_date').nullable();
      t.string('status', 16).notNullable().defaultTo('OPEN'); // OPEN|UNDER_REVIEW|DECIDED|CLOSED|CANCELLED
      t.timestamp('closed_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'sevt_college_status_idx');
    });
  }
};

exports.down = async function down(knex) {
  for (const table of [
    'succession_events',
    'succession_development_actions',
    'succession_readiness_reviews',
    'succession_candidates',
    'succession_talent_pool_members',
    'succession_talent_pools',
    'succession_talent_assessments',
    'succession_critical_roles',
  ]) {
    // eslint-disable-next-line no-await-in-loop
    if (await knex.schema.hasTable(table)) await knex.schema.dropTable(table);
  }
};
