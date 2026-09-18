/**
 * HRMS Payroll hardening — input snapshots, LOP flags, Finance posting, immutability support.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  // ── Salary component LOP / proration flags ────────────────────────────────
  if (await knex.schema.hasTable('salary_components')) {
    const hasLop = await knex.schema.hasColumn('salary_components', 'lop_affected');
    if (!hasLop) {
      await knex.schema.alterTable('salary_components', (t) => {
        t.boolean('lop_affected').notNullable().defaultTo(true);
        t.boolean('is_proratable').notNullable().defaultTo(true);
      });
    }
    // Earnings default LOP-affected; statutory deductions typically not LOP-affected for fixed floors
    await knex('salary_components').whereIn('code', ['PF', 'ESI', 'PT', 'TDS']).update({
      lop_affected: false,
      is_proratable: false,
    });
    await knex('salary_components').where({ code: 'LOP' }).update({
      lop_affected: false,
      is_proratable: false,
    });
  }

  // ── Payroll run finance + validation columns ──────────────────────────────
  if (await knex.schema.hasTable('payroll_runs')) {
    if (!(await knex.schema.hasColumn('payroll_runs', 'finance_posting_status'))) {
      await knex.schema.alterTable('payroll_runs', (t) => {
        t.string('finance_posting_status', 32).notNullable().defaultTo('NOT_POSTED');
        t.integer('finance_posting_id').unsigned().nullable();
        t.string('validation_status', 32).notNullable().defaultTo('PENDING');
        t.integer('employee_count').unsigned().notNullable().defaultTo(0);
        t.integer('validation_error_count').unsigned().notNullable().defaultTo(0);
        t.decimal('gross_total', 14, 2).notNullable().defaultTo(0);
        t.decimal('deduction_total', 14, 2).notNullable().defaultTo(0);
        t.decimal('net_total', 14, 2).notNullable().defaultTo(0);
        t.decimal('lop_days_total', 10, 2).notNullable().defaultTo(0);
        t.integer('attendance_closure_id').unsigned().nullable();
        t.integer('attendance_calc_version').unsigned().nullable();
        t.timestamp('approved_at').nullable();
        t.timestamp('posted_at').nullable();
        t.text('validation_summary').nullable();
      });
    }
    // Concurrent uniqueness enforced in createPayrollRun (app-level + unique index when clean)
    // Skip adding unique if duplicates already exist in legacy data.
    const dupRows = await knex('payroll_runs')
      .select('college_id', 'period_id')
      .count({ c: '*' })
      .groupBy('college_id', 'period_id')
      .having('c', '>', 1);
    if (!dupRows.length) {
      try {
        const idx = await knex.raw(`
          SELECT COUNT(1) AS c FROM information_schema.statistics
          WHERE table_schema = DATABASE() AND table_name = 'payroll_runs' AND index_name = 'pr_college_period_unique'
        `);
        const count = Number(idx[0][0]?.c ?? idx[0]?.c ?? 0);
        if (!count) {
          await knex.schema.alterTable('payroll_runs', (t) => {
            t.unique(['college_id', 'period_id'], { indexName: 'pr_college_period_unique' });
          });
        }
      } catch (err) {
        console.warn('pr_college_period_unique skipped:', err.message || err);
      }
    }
  }

  // ── Payroll run employee input snapshot + attendance fields ───────────────
  if (await knex.schema.hasTable('payroll_run_employees')) {
    if (!(await knex.schema.hasColumn('payroll_run_employees', 'input_snapshot'))) {
      await knex.schema.alterTable('payroll_run_employees', (t) => {
        t.json('input_snapshot').nullable();
        t.string('snapshot_version', 16).notNullable().defaultTo('1');
        t.decimal('working_days', 8, 2).nullable();
        t.decimal('payable_days', 8, 2).nullable();
        t.decimal('lop_days', 8, 2).nullable();
        t.integer('structure_id').unsigned().nullable();
        t.integer('assignment_id').unsigned().nullable();
        t.string('calculation_status', 32).notNullable().defaultTo('OK');
        t.text('validation_errors').nullable();
        t.json('calculation_trace').nullable();
      });
    }
  }

  // ── Component rows: store code/type snapshot labels ───────────────────────
  if (await knex.schema.hasTable('payroll_run_components')) {
    if (!(await knex.schema.hasColumn('payroll_run_components', 'component_code'))) {
      await knex.schema.alterTable('payroll_run_components', (t) => {
        t.string('component_code', 32).nullable();
        t.string('component_name', 128).nullable();
        t.string('component_type', 32).nullable();
        t.string('calculation_type', 32).nullable();
        t.boolean('lop_affected').nullable();
        t.boolean('is_proratable').nullable();
        t.decimal('base_amount', 12, 2).nullable();
        t.json('calc_detail').nullable();
      });
    }
  }

  // ── Adjustments: arrear linkage ───────────────────────────────────────────
  if (await knex.schema.hasTable('payroll_adjustments')) {
    if (!(await knex.schema.hasColumn('payroll_adjustments', 'adjustment_type'))) {
      await knex.schema.alterTable('payroll_adjustments', (t) => {
        t.string('adjustment_type', 32).notNullable().defaultTo('EARNING_ADJUSTMENT');
        t.integer('source_period_id').unsigned().nullable().references('id').inTable('payroll_periods').onDelete('SET NULL');
        t.integer('source_component_id').unsigned().nullable().references('id').inTable('salary_components').onDelete('SET NULL');
        t.integer('source_payroll_run_id').unsigned().nullable().references('id').inTable('payroll_runs').onDelete('SET NULL');
        t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
        t.timestamp('approved_at').nullable();
      });
    }
  }

  // ── Payslip employee descriptive snapshot ─────────────────────────────────
  if (await knex.schema.hasTable('payslips')) {
    if (!(await knex.schema.hasColumn('payslips', 'employee_snapshot'))) {
      await knex.schema.alterTable('payslips', (t) => {
        t.json('employee_snapshot').nullable();
        t.string('release_status', 32).notNullable().defaultTo('RELEASED');
      });
    }
  }

  // ── Finance GL accounts (Finance-owned) ───────────────────────────────────
  if (!(await knex.schema.hasTable('finance_gl_accounts'))) {
    await knex.schema.createTable('finance_gl_accounts', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 64).notNullable();
      t.string('name', 255).notNullable();
      t.string('account_type', 32).notNullable(); // EXPENSE, LIABILITY, ASSET
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'fga_college_code_unique' });
    });
  }

  // ── Payroll → Finance account mappings (Finance-owned, tenant-scoped) ─────
  if (!(await knex.schema.hasTable('finance_payroll_account_mappings'))) {
    await knex.schema.createTable('finance_payroll_account_mappings', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('mapping_key', 64).notNullable(); // e.g. SALARY_EXPENSE, NET_PAYABLE, STATUTORY_PF, EMPLOYER_PF, COMPONENT:BASIC
      t.integer('debit_account_id').unsigned().nullable().references('id').inTable('finance_gl_accounts').onDelete('SET NULL');
      t.integer('credit_account_id').unsigned().nullable().references('id').inTable('finance_gl_accounts').onDelete('SET NULL');
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'mapping_key'], { indexName: 'fpam_college_key_unique' });
    });
  }

  // ── Finance payroll postings (canonical journal for payroll runs) ─────────
  if (!(await knex.schema.hasTable('finance_payroll_postings'))) {
    await knex.schema.createTable('finance_payroll_postings', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('payroll_run_id').unsigned().notNullable().references('id').inTable('payroll_runs').onDelete('RESTRICT');
      t.string('posting_number', 64).notNullable();
      t.string('status', 32).notNullable().defaultTo('POSTED'); // POSTING, POSTED, FAILED, REVERSED
      t.decimal('debit_total', 14, 2).notNullable().defaultTo(0);
      t.decimal('credit_total', 14, 2).notNullable().defaultTo(0);
      t.integer('posted_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('posted_at').nullable();
      t.integer('reversal_of_id').unsigned().nullable();
      t.integer('reversed_by_posting_id').unsigned().nullable();
      t.text('failure_reason').nullable();
      t.text('reason').nullable();
      t.timestamps(true, true);
      t.unique(['payroll_run_id'], { indexName: 'fpp_run_unique' });
      t.unique(['posting_number'], { indexName: 'fpp_number_unique' });
      t.index(['college_id', 'status'], 'fpp_college_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('finance_payroll_posting_lines'))) {
    await knex.schema.createTable('finance_payroll_posting_lines', (t) => {
      t.increments('id').primary();
      t.integer('posting_id').unsigned().notNullable().references('id').inTable('finance_payroll_postings').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('account_id').unsigned().notNullable().references('id').inTable('finance_gl_accounts').onDelete('RESTRICT');
      t.string('side', 8).notNullable(); // DEBIT | CREDIT
      t.decimal('amount', 14, 2).notNullable();
      t.string('line_key', 64).notNullable();
      t.string('description', 255).nullable();
      t.timestamps(true, true);
      t.index(['posting_id'], 'fppl_posting_idx');
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('finance_payroll_posting_lines');
  await knex.schema.dropTableIfExists('finance_payroll_postings');
  await knex.schema.dropTableIfExists('finance_payroll_account_mappings');
  await knex.schema.dropTableIfExists('finance_gl_accounts');

  if (await knex.schema.hasTable('payslips') && (await knex.schema.hasColumn('payslips', 'employee_snapshot'))) {
    await knex.schema.alterTable('payslips', (t) => {
      t.dropColumn('employee_snapshot');
      t.dropColumn('release_status');
    });
  }

  if (await knex.schema.hasTable('payroll_adjustments') && (await knex.schema.hasColumn('payroll_adjustments', 'adjustment_type'))) {
    await knex.schema.alterTable('payroll_adjustments', (t) => {
      t.dropColumn('adjustment_type');
      t.dropColumn('source_period_id');
      t.dropColumn('source_component_id');
      t.dropColumn('source_payroll_run_id');
      t.dropColumn('created_by');
      t.dropColumn('approved_at');
    });
  }

  if (await knex.schema.hasTable('payroll_run_components') && (await knex.schema.hasColumn('payroll_run_components', 'component_code'))) {
    await knex.schema.alterTable('payroll_run_components', (t) => {
      t.dropColumn('component_code');
      t.dropColumn('component_name');
      t.dropColumn('component_type');
      t.dropColumn('calculation_type');
      t.dropColumn('lop_affected');
      t.dropColumn('is_proratable');
      t.dropColumn('base_amount');
      t.dropColumn('calc_detail');
    });
  }

  if (await knex.schema.hasTable('payroll_run_employees') && (await knex.schema.hasColumn('payroll_run_employees', 'input_snapshot'))) {
    await knex.schema.alterTable('payroll_run_employees', (t) => {
      t.dropColumn('input_snapshot');
      t.dropColumn('snapshot_version');
      t.dropColumn('working_days');
      t.dropColumn('payable_days');
      t.dropColumn('lop_days');
      t.dropColumn('structure_id');
      t.dropColumn('assignment_id');
      t.dropColumn('calculation_status');
      t.dropColumn('validation_errors');
      t.dropColumn('calculation_trace');
    });
  }

  if (await knex.schema.hasTable('payroll_runs') && (await knex.schema.hasColumn('payroll_runs', 'finance_posting_status'))) {
    try {
      await knex.schema.alterTable('payroll_runs', (t) => {
        t.dropUnique(['college_id', 'period_id'], 'pr_college_period_unique');
      });
    } catch { /* ignore */ }
    await knex.schema.alterTable('payroll_runs', (t) => {
      t.dropColumn('finance_posting_status');
      t.dropColumn('finance_posting_id');
      t.dropColumn('validation_status');
      t.dropColumn('employee_count');
      t.dropColumn('validation_error_count');
      t.dropColumn('gross_total');
      t.dropColumn('deduction_total');
      t.dropColumn('net_total');
      t.dropColumn('lop_days_total');
      t.dropColumn('attendance_closure_id');
      t.dropColumn('attendance_calc_version');
      t.dropColumn('approved_at');
      t.dropColumn('posted_at');
      t.dropColumn('validation_summary');
    });
  }

  if (await knex.schema.hasTable('salary_components') && (await knex.schema.hasColumn('salary_components', 'lop_affected'))) {
    await knex.schema.alterTable('salary_components', (t) => {
      t.dropColumn('lop_affected');
      t.dropColumn('is_proratable');
    });
  }
};
