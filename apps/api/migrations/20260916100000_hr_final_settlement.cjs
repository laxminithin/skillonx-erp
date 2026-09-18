/**
 * HRMS Final Settlement / Full & Final — case, clearance snapshot, components,
 * Finance-owned employee dues + F&F posting journal.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  // ── College F&F policy (effective-dated, no hardcoded statutory rates) ──
  if (!(await knex.schema.hasTable('hr_fnf_policies'))) {
    await knex.schema.createTable('hr_fnf_policies', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.date('effective_from').notNullable();
      t.date('effective_to').nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.json('encashable_leave_codes').nullable();
      t.decimal('max_encashable_days', 8, 2).nullable();
      t.string('encashment_salary_basis', 16).notNullable().defaultTo('BASIC');
      t.decimal('encashment_daily_divisor', 8, 2).notNullable().defaultTo(30);
      t.string('notice_salary_basis', 16).notNullable().defaultTo('BASIC');
      t.decimal('notice_daily_divisor', 8, 2).notNullable().defaultTo(30);
      t.boolean('gratuity_enabled').notNullable().defaultTo(false);
      t.decimal('gratuity_min_years', 8, 2).nullable();
      t.decimal('gratuity_days_per_year', 8, 2).nullable();
      t.string('gratuity_wage_basis', 16).nullable();
      t.string('gratuity_rule_version', 32).nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'effective_from'], 'hfp_college_from_idx');
    });
  }

  // ── Finance-owned employee dues (not a GL ledger) ───────────────────────
  if (!(await knex.schema.hasTable('employee_finance_dues'))) {
    await knex.schema.createTable('employee_finance_dues', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.string('due_type', 32).notNullable(); // LOAN, ADVANCE, MISC, ASSET, OTHER
      t.string('source_ref', 64).nullable();
      t.decimal('amount', 14, 2).notNullable().defaultTo(0);
      t.decimal('outstanding', 14, 2).notNullable().defaultTo(0);
      t.string('status', 32).notNullable().defaultTo('OPEN'); // OPEN, SETTLED, WAIVED
      t.integer('settled_by_payroll_run_id').unsigned().nullable();
      t.integer('settled_by_settlement_id').unsigned().nullable();
      t.text('remarks').nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'employee_id', 'status'], 'efd_college_emp_st_idx');
    });
  }

  // ── Settlement case ─────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_final_settlements'))) {
    await knex.schema.createTable('hr_final_settlements', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.integer('separation_request_id').unsigned().notNullable()
        .references('id').inTable('employee_separation_requests').onDelete('RESTRICT');
      t.string('case_number', 48).notNullable();
      t.integer('version_no').unsigned().notNullable().defaultTo(1);
      t.integer('parent_settlement_id').unsigned().nullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.string('separation_type', 32).nullable();
      t.date('last_working_date').nullable();
      t.date('notice_date').nullable();
      t.integer('notice_required_days').unsigned().nullable();
      t.integer('notice_served_days').unsigned().nullable();
      t.integer('notice_shortfall_days').unsigned().nullable();
      t.boolean('notice_waived').notNullable().defaultTo(false);
      t.text('notice_waiver_reason').nullable();
      t.integer('policy_id').unsigned().nullable().references('id').inTable('hr_fnf_policies').onDelete('SET NULL');
      t.integer('calculation_version').unsigned().notNullable().defaultTo(0);
      t.json('input_snapshot').nullable();
      t.string('snapshot_version', 16).notNullable().defaultTo('1');
      t.timestamp('calculated_at').nullable();
      t.decimal('gross_payable', 14, 2).notNullable().defaultTo(0);
      t.decimal('total_recoveries', 14, 2).notNullable().defaultTo(0);
      t.decimal('net_amount', 14, 2).notNullable().defaultTo(0);
      t.string('settlement_direction', 32).nullable(); // PAYABLE_TO_EMPLOYEE | RECEIVABLE_FROM_EMPLOYEE
      t.string('finance_posting_status', 32).notNullable().defaultTo('NOT_POSTED');
      t.integer('finance_posting_id').unsigned().nullable();
      t.string('finance_posting_key', 64).nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('approved_at').nullable();
      t.timestamp('locked_at').nullable();
      t.timestamp('posted_at').nullable();
      t.timestamp('settled_at').nullable();
      t.timestamp('closed_at').nullable();
      t.text('hold_reason').nullable();
      t.text('reject_reason').nullable();
      t.text('reopen_reason').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'employee_id', 'separation_request_id'], { indexName: 'hfs_college_emp_sep_uq' });
      t.unique(['college_id', 'case_number'], { indexName: 'hfs_college_case_uq' });
      t.index(['college_id', 'status'], 'hfs_college_status_idx');
    });
  }

  // ── Clearance items (F&F snapshot of source obligations) ────────────────
  if (!(await knex.schema.hasTable('hr_fnf_clearances'))) {
    await knex.schema.createTable('hr_fnf_clearances', (t) => {
      t.increments('id').primary();
      t.integer('settlement_id').unsigned().notNullable().references('id').inTable('hr_final_settlements').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('domain', 32).notNullable();
      t.string('status', 32).notNullable().defaultTo('PENDING');
      t.string('source_module', 32).nullable();
      t.json('source_snapshot').nullable();
      t.decimal('due_amount', 14, 2).notNullable().defaultTo(0);
      t.boolean('blocking').notNullable().defaultTo(true);
      t.integer('actor_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('decided_at').nullable();
      t.text('remarks').nullable();
      t.boolean('overridden').notNullable().defaultTo(false);
      t.text('override_reason').nullable();
      t.integer('override_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['settlement_id', 'domain'], { indexName: 'hfc_settle_domain_uq' });
    });
  }

  // ── Minimal F&F asset checklist (not a full asset master) ───────────────
  if (!(await knex.schema.hasTable('hr_fnf_asset_items'))) {
    await knex.schema.createTable('hr_fnf_asset_items', (t) => {
      t.increments('id').primary();
      t.integer('settlement_id').unsigned().notNullable().references('id').inTable('hr_final_settlements').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable();
      t.string('item_code', 32).notNullable();
      t.string('item_name', 128).notNullable();
      t.string('status', 32).notNullable().defaultTo('PENDING');
      t.decimal('recovery_amount', 14, 2).notNullable().defaultTo(0);
      t.text('remarks').nullable();
      t.timestamps(true, true);
      t.unique(['settlement_id', 'item_code'], { indexName: 'hfai_settle_item_uq' });
    });
  }

  // ── Settlement components (payables / recoveries) ───────────────────────
  if (!(await knex.schema.hasTable('hr_fnf_components'))) {
    await knex.schema.createTable('hr_fnf_components', (t) => {
      t.increments('id').primary();
      t.integer('settlement_id').unsigned().notNullable().references('id').inTable('hr_final_settlements').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable();
      t.integer('calculation_version').unsigned().notNullable();
      t.string('side', 16).notNullable(); // PAYABLE | RECOVERY
      t.string('code', 32).notNullable();
      t.string('name', 128).notNullable();
      t.string('source', 64).nullable();
      t.string('basis', 128).nullable();
      t.decimal('quantity', 12, 4).nullable();
      t.decimal('rate', 14, 4).nullable();
      t.decimal('amount', 14, 2).notNullable().defaultTo(0);
      t.string('rule_reference', 128).nullable();
      t.string('source_ref', 64).nullable();
      t.json('trace').nullable();
      t.boolean('locked').notNullable().defaultTo(false);
      t.timestamps(true, true);
      t.index(['settlement_id', 'calculation_version'], 'hfnc_settle_ver_idx');
    });
  }

  // ── Manual adjustments (controlled) ─────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_fnf_adjustments'))) {
    await knex.schema.createTable('hr_fnf_adjustments', (t) => {
      t.increments('id').primary();
      t.integer('settlement_id').unsigned().notNullable().references('id').inTable('hr_final_settlements').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable();
      t.string('side', 16).notNullable();
      t.string('code', 32).notNullable().defaultTo('MANUAL');
      t.decimal('amount', 14, 2).notNullable();
      t.string('reason', 500).notNullable();
      t.string('supporting_reference', 128).nullable();
      t.string('status', 32).notNullable().defaultTo('APPROVED');
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('approved_at').nullable();
      t.timestamps(true, true);
      t.index(['settlement_id'], 'hfna_settle_idx');
    });
  }

  // ── Issued documents (immutable snapshots) ──────────────────────────────
  if (!(await knex.schema.hasTable('hr_fnf_documents'))) {
    await knex.schema.createTable('hr_fnf_documents', (t) => {
      t.increments('id').primary();
      t.integer('settlement_id').unsigned().notNullable().references('id').inTable('hr_final_settlements').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable();
      t.integer('employee_id').unsigned().notNullable();
      t.string('doc_type', 32).notNullable();
      t.integer('doc_version').unsigned().notNullable().defaultTo(1);
      t.json('field_snapshot').nullable();
      t.text('body_text').nullable();
      t.string('release_status', 32).notNullable().defaultTo('DRAFT');
      t.timestamp('released_at').nullable();
      t.integer('released_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['settlement_id', 'doc_type', 'doc_version'], { indexName: 'hfd_settle_type_ver_uq' });
    });
  }

  // ── Finance F&F posting journal ─────────────────────────────────────────
  if (!(await knex.schema.hasTable('finance_fnf_account_mappings'))) {
    await knex.schema.createTable('finance_fnf_account_mappings', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('mapping_key', 64).notNullable();
      t.integer('debit_account_id').unsigned().nullable().references('id').inTable('finance_gl_accounts').onDelete('SET NULL');
      t.integer('credit_account_id').unsigned().nullable().references('id').inTable('finance_gl_accounts').onDelete('SET NULL');
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'mapping_key'], { indexName: 'ffam_college_key_uq' });
    });
  }

  if (!(await knex.schema.hasTable('finance_fnf_postings'))) {
    await knex.schema.createTable('finance_fnf_postings', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('settlement_id').unsigned().notNullable().references('id').inTable('hr_final_settlements').onDelete('RESTRICT');
      t.integer('calculation_version').unsigned().notNullable();
      t.string('posting_key', 80).notNullable();
      t.string('posting_number', 80).notNullable();
      t.string('status', 32).notNullable().defaultTo('POSTED');
      t.decimal('debit_total', 14, 2).notNullable().defaultTo(0);
      t.decimal('credit_total', 14, 2).notNullable().defaultTo(0);
      t.string('direction', 32).nullable();
      t.integer('posted_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('posted_at').nullable();
      t.text('reason').nullable();
      t.integer('reversed_by_posting_id').unsigned().nullable();
      t.timestamps(true, true);
      t.unique(['posting_key'], { indexName: 'ffp_posting_key_uq' });
      t.index(['settlement_id', 'status'], 'ffp_settle_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('finance_fnf_posting_lines'))) {
    await knex.schema.createTable('finance_fnf_posting_lines', (t) => {
      t.increments('id').primary();
      t.integer('posting_id').unsigned().notNullable().references('id').inTable('finance_fnf_postings').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable();
      t.integer('account_id').unsigned().notNullable().references('id').inTable('finance_gl_accounts').onDelete('RESTRICT');
      t.string('side', 8).notNullable();
      t.decimal('amount', 14, 2).notNullable();
      t.string('line_key', 64).notNullable();
      t.string('description', 255).nullable();
      t.timestamps(true, true);
      t.index(['posting_id'], 'ffpl_posting_idx');
    });
  }
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('finance_fnf_posting_lines');
  await knex.schema.dropTableIfExists('finance_fnf_postings');
  await knex.schema.dropTableIfExists('finance_fnf_account_mappings');
  await knex.schema.dropTableIfExists('hr_fnf_documents');
  await knex.schema.dropTableIfExists('hr_fnf_adjustments');
  await knex.schema.dropTableIfExists('hr_fnf_components');
  await knex.schema.dropTableIfExists('hr_fnf_asset_items');
  await knex.schema.dropTableIfExists('hr_fnf_clearances');
  await knex.schema.dropTableIfExists('hr_final_settlements');
  await knex.schema.dropTableIfExists('employee_finance_dues');
  await knex.schema.dropTableIfExists('hr_fnf_policies');
};
