/**
 * HRMS — Employee lifecycle completion tables and extensions.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  // ── Extend employees ────────────────────────────────────────────────────
  if (await knex.schema.hasTable('employees')) {
    if (!(await knex.schema.hasColumn('employees', 'employee_category'))) {
      await knex.schema.alterTable('employees', (t) => {
        t.string('employee_category', 32).notNullable().defaultTo('NON_TEACHING');
        t.index(['college_id', 'employee_category'], 'emp_college_category_idx');
      });
    }
    if (!(await knex.schema.hasColumn('employees', 'notice_period_days'))) {
      await knex.schema.alterTable('employees', (t) => {
        t.integer('notice_period_days').unsigned().nullable();
      });
    }
    if (!(await knex.schema.hasColumn('employees', 'last_working_date'))) {
      await knex.schema.alterTable('employees', (t) => {
        t.date('last_working_date').nullable();
      });
    }
  }

  // ── Personal profile (sensitive) ────────────────────────────────────────
  if (!(await knex.schema.hasTable('employee_personal_profiles'))) {
    await knex.schema.createTable('employee_personal_profiles', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.date('date_of_birth').nullable();
      t.string('gender', 16).nullable();
      t.string('marital_status', 32).nullable();
      t.string('blood_group', 8).nullable();
      t.string('nationality', 64).nullable();
      t.string('personal_email', 255).nullable();
      t.string('personal_phone', 32).nullable();
      t.text('current_address').nullable();
      t.text('permanent_address').nullable();
      t.string('photo_reference', 512).nullable();
      t.timestamps(true, true);
      t.unique(['employee_id']);
    });
  }

  // ── Emergency contacts ──────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('employee_emergency_contacts'))) {
    await knex.schema.createTable('employee_emergency_contacts', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.string('name', 255).notNullable();
      t.string('relationship', 64).notNullable();
      t.string('phone', 32).notNullable();
      t.string('alternate_phone', 32).nullable();
      t.text('address').nullable();
      t.boolean('is_primary').notNullable().defaultTo(false);
      t.timestamps(true, true);
      t.index(['employee_id'], 'eec_emp_idx');
    });
  }

  // ── Effective-dated employment records ──────────────────────────────────
  if (!(await knex.schema.hasTable('employee_employment_records'))) {
    await knex.schema.createTable('employee_employment_records', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.integer('employment_type_id').unsigned().nullable().references('id').inTable('employment_types').onDelete('SET NULL');
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('designation_id').unsigned().nullable().references('id').inTable('hr_designations').onDelete('SET NULL');
      t.integer('grade_id').unsigned().nullable();
      t.integer('reporting_manager_employee_id').unsigned().nullable();
      t.date('effective_from').notNullable();
      t.date('effective_to').nullable();
      t.string('status', 32).notNullable().defaultTo('ACTIVE');
      t.string('appointment_type', 32).nullable();
      t.string('contract_reference', 128).nullable();
      t.text('remarks').nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['employee_id', 'effective_from'], 'eer_emp_from_idx');
      t.index(['employee_id', 'effective_to'], 'eer_emp_to_idx');
    });
    await knex.schema.alterTable('employee_employment_records', (t) => {
      t.foreign('reporting_manager_employee_id', 'eer_mgr_fk').references('id').inTable('employees').onDelete('SET NULL');
    });
  }

  // ── Reporting manager history ─────────────────────────────────────────────
  if (!(await knex.schema.hasTable('employee_reporting_assignments'))) {
    await knex.schema.createTable('employee_reporting_assignments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.integer('reporting_manager_employee_id').unsigned().nullable();
      t.date('effective_from').notNullable();
      t.date('effective_to').nullable();
      t.text('reason').nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['employee_id', 'effective_from'], 'era_emp_from_idx');
    });
    await knex.schema.alterTable('employee_reporting_assignments', (t) => {
      t.foreign('reporting_manager_employee_id', 'era_mgr_fk').references('id').inTable('employees').onDelete('SET NULL');
    });
  } else {
    const hasMgrFk = await knex.raw(
      `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'employee_reporting_assignments'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'era_mgr_fk'`,
    );
    if (!hasMgrFk[0]?.length) {
      await knex.schema.alterTable('employee_reporting_assignments', (t) => {
        t.foreign('reporting_manager_employee_id', 'era_mgr_fk').references('id').inTable('employees').onDelete('SET NULL');
      });
    }
  }

  // ── Career actions (future-dated) ─────────────────────────────────────────
  if (!(await knex.schema.hasTable('employee_career_actions'))) {
    await knex.schema.createTable('employee_career_actions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.string('action_type', 32).notNullable();
      t.string('status', 32).notNullable().defaultTo('PENDING');
      t.date('effective_date').notNullable();
      t.json('payload').nullable();
      t.text('reason').nullable();
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('applied_at').nullable();
      t.integer('applied_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('record_id').unsigned().nullable();
      t.timestamps(true, true);
      t.index(['employee_id', 'status'], 'eca_emp_status_idx');
      t.index(['college_id', 'effective_date', 'status'], 'eca_college_date_status_idx');
    });
  }

  // ── Contracts ─────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('employee_contracts'))) {
    await knex.schema.createTable('employee_contracts', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.string('contract_type', 32).notNullable();
      t.date('start_date').notNullable();
      t.date('end_date').notNullable();
      t.integer('notice_period_days').unsigned().nullable();
      t.string('renewal_status', 32).notNullable().defaultTo('ACTIVE');
      t.string('status', 32).notNullable().defaultTo('ACTIVE');
      t.string('reference', 128).nullable();
      t.text('remarks').nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['employee_id', 'status'], 'ec_emp_status_idx');
      t.index(['college_id', 'end_date'], 'ec_college_end_idx');
    });
  }

  // ── Probation policies ────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_probation_policies'))) {
    await knex.schema.createTable('hr_probation_policies', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 32).notNullable();
      t.string('name', 128).notNullable();
      t.string('employee_category', 32).nullable();
      t.integer('employment_type_id').unsigned().nullable().references('id').inTable('employment_types').onDelete('SET NULL');
      t.integer('designation_id').unsigned().nullable().references('id').inTable('hr_designations').onDelete('SET NULL');
      t.boolean('probation_required').notNullable().defaultTo(true);
      t.integer('default_duration_days').unsigned().notNullable().defaultTo(180);
      t.integer('review_before_days').unsigned().notNullable().defaultTo(30);
      t.boolean('extensions_allowed').notNullable().defaultTo(true);
      t.integer('max_extensions').unsigned().notNullable().defaultTo(2);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'code']);
    });
  }

  // ── Onboarding template items ─────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_onboarding_template_items'))) {
    await knex.schema.createTable('hr_onboarding_template_items', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('task_code', 64).notNullable();
      t.string('title', 255).notNullable();
      t.string('owner_role', 32).notNullable().defaultTo('HR');
      t.boolean('is_mandatory').notNullable().defaultTo(false);
      t.integer('sort_order').unsigned().notNullable().defaultTo(0);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'task_code']);
    });
  }

  // ── Extend onboarding tasks ───────────────────────────────────────────────
  if (await knex.schema.hasTable('employee_onboarding_tasks')) {
    if (!(await knex.schema.hasColumn('employee_onboarding_tasks', 'owner_role'))) {
      await knex.schema.alterTable('employee_onboarding_tasks', (t) => {
        t.string('owner_role', 32).notNullable().defaultTo('HR');
        t.boolean('is_mandatory').notNullable().defaultTo(false);
      });
    }
  }

  // ── Extend probation reviews ──────────────────────────────────────────────
  if (await knex.schema.hasTable('employee_probation_reviews')) {
    const cols = [
      ['probation_start', 'date'],
      ['original_end_date', 'date'],
      ['current_end_date', 'date'],
      ['status', 'string'],
      ['manager_recommendation', 'string'],
      ['hr_recommendation', 'string'],
      ['extension_reason', 'text'],
      ['final_decision', 'string'],
      ['decision_date', 'date'],
      ['performance_summary', 'text'],
    ];
    for (const [col, type] of cols) {
      if (!(await knex.schema.hasColumn('employee_probation_reviews', col))) {
        await knex.schema.alterTable('employee_probation_reviews', (t) => {
          if (type === 'date') t.date(col).nullable();
          else if (type === 'text') t.text(col).nullable();
          else t.string(col, 64).nullable();
        });
      }
    }
  }

  // ── Extend separation requests ────────────────────────────────────────────
  if (await knex.schema.hasTable('employee_separation_requests')) {
    const sepCols = [
      ['notice_period_days', 'integer'],
      ['notice_shortfall_days', 'integer'],
      ['last_working_date', 'date'],
      ['initiated_by_faculty_id', 'integer'],
      ['manager_recommendation', 'string'],
      ['hr_notes', 'text'],
      ['withdrawn_at', 'timestamp'],
    ];
    for (const [col, type] of sepCols) {
      if (!(await knex.schema.hasColumn('employee_separation_requests', col))) {
        await knex.schema.alterTable('employee_separation_requests', (t) => {
          if (type === 'integer') t.integer(col).unsigned().nullable();
          else if (type === 'date') t.date(col).nullable();
          else if (type === 'timestamp') t.timestamp(col).nullable();
          else if (type === 'text') t.text(col).nullable();
          else t.string(col, 64).nullable();
        });
      }
    }
  }

  // ── Extend promotion/transfer with status for scheduling ──────────────────
  for (const table of ['employee_promotion_records', 'employee_transfer_records']) {
    if (await knex.schema.hasTable(table)) {
      if (!(await knex.schema.hasColumn(table, 'status'))) {
        await knex.schema.alterTable(table, (t) => {
          t.string('status', 32).notNullable().defaultTo('APPLIED');
        });
      }
      if (!(await knex.schema.hasColumn(table, 'career_action_id'))) {
        await knex.schema.alterTable(table, (t) => {
          t.integer('career_action_id').unsigned().nullable();
        });
      }
    }
  }

  // ── Required document rules ───────────────────────────────────────────────
  if (!(await knex.schema.hasTable('employee_required_document_rules'))) {
    await knex.schema.createTable('employee_required_document_rules', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('document_type', 64).notNullable();
      t.string('employee_category', 32).nullable();
      t.integer('employment_type_id').unsigned().nullable().references('id').inTable('employment_types').onDelete('SET NULL');
      t.integer('designation_id').unsigned().nullable().references('id').inTable('hr_designations').onDelete('SET NULL');
      t.boolean('is_mandatory').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.index(['college_id'], 'erdr_college_idx');
    });
  }

  // ── Extend employee documents with verification ───────────────────────────
  if (await knex.schema.hasTable('employee_documents')) {
    if (!(await knex.schema.hasColumn('employee_documents', 'verification_status'))) {
      await knex.schema.alterTable('employee_documents', (t) => {
        t.string('verification_status', 32).notNullable().defaultTo('PENDING');
        t.integer('verified_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
        t.timestamp('verified_at').nullable();
      });
    }
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  if (await knex.schema.hasTable('employee_documents')) {
    if (await knex.schema.hasColumn('employee_documents', 'verification_status')) {
      await knex.schema.alterTable('employee_documents', (t) => {
        t.dropColumn('verification_status');
        t.dropColumn('verified_by');
        t.dropColumn('verified_at');
      });
    }
  }
  const tables = [
    'employee_required_document_rules',
    'hr_onboarding_template_items',
    'hr_probation_policies',
    'employee_contracts',
    'employee_career_actions',
    'employee_reporting_assignments',
    'employee_employment_records',
    'employee_emergency_contacts',
    'employee_personal_profiles',
  ];
  for (const table of tables) {
    if (await knex.schema.hasTable(table)) {
      await knex.schema.dropTable(table);
    }
  }
  if (await knex.schema.hasTable('employees')) {
    for (const col of ['employee_category', 'notice_period_days', 'last_working_date']) {
      if (await knex.schema.hasColumn('employees', col)) {
        await knex.schema.alterTable('employees', (t) => t.dropColumn(col));
      }
    }
  }
};
