/**
 * Finance / Student Fee Management domain.
 * Separate from academic modules — other domains consume via finance services.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  // ── College finance policy ───────────────────────────────────────────
  if (!(await knex.schema.hasTable('college_finance_policies'))) {
    await knex.schema.createTable('college_finance_policies', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('currency', 8).notNullable().defaultTo('INR');
      t.string('scholarship_treatment', 32).notNullable().defaultTo('REDUCE_DEMAND');
      t.boolean('exam_fee_paid_required').notNullable().defaultTo(false);
      t.string('financial_clearance_mode', 16).notNullable().defaultTo('BLOCK');
      t.string('receipt_series', 16).notNullable().defaultTo('RCPT');
      t.string('demand_series', 16).notNullable().defaultTo('DEM');
      t.string('payment_series', 16).notNullable().defaultTo('PAY');
      t.string('default_gateway_provider', 64).nullable();
      t.json('gateway_config').nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id'], { indexName: 'cfp_college_unique' });
    });
  }

  // ── Fee head master ────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('fee_heads'))) {
    await knex.schema.createTable('fee_heads', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 64).notNullable();
      t.string('name', 255).notNullable();
      t.string('category', 32).notNullable().defaultTo('GENERAL');
      t.text('description').nullable();
      t.boolean('is_refundable').notNullable().defaultTo(false);
      t.boolean('is_optional').notNullable().defaultTo(false);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'fh_college_code_unique' });
      t.index(['college_id', 'is_active'], 'fh_college_active_idx');
    });
  }

  // ── Late fee policies ──────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('late_fee_policies'))) {
    await knex.schema.createTable('late_fee_policies', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('name', 128).notNullable();
      t.string('rule_type', 16).notNullable().defaultTo('FIXED');
      t.decimal('fixed_amount', 12, 2).nullable();
      t.decimal('daily_amount', 12, 2).nullable();
      t.json('slab_rules').nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.index(['college_id', 'is_active'], 'lfp_college_active_idx');
    });
  }

  // ── Fee structures ─────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('fee_structures'))) {
    await knex.schema.createTable('fee_structures', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('scheme_id').unsigned().nullable().references('id').inTable('academic_schemes').onDelete('SET NULL');
      t.integer('semester_id').unsigned().nullable().references('id').inTable('semesters').onDelete('SET NULL');
      t.string('student_category', 64).nullable();
      t.string('admission_batch', 64).nullable();
      t.string('name', 255).notNullable();
      t.string('code', 64).notNullable();
      t.string('status', 16).notNullable().defaultTo('DRAFT');
      t.text('description').nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'fs_college_code_unique' });
      t.index(['college_id', 'academic_year_id', 'semester_id', 'status'], 'fs_college_year_sem_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('fee_structure_items'))) {
    await knex.schema.createTable('fee_structure_items', (t) => {
      t.increments('id').primary();
      t.integer('fee_structure_id').unsigned().notNullable().references('id').inTable('fee_structures').onDelete('CASCADE');
      t.integer('fee_head_id').unsigned().notNullable().references('id').inTable('fee_heads').onDelete('RESTRICT');
      t.decimal('amount', 12, 2).notNullable();
      t.date('due_date').nullable();
      t.string('installment_group', 32).nullable();
      t.boolean('is_mandatory').notNullable().defaultTo(true);
      t.integer('late_fee_policy_id').unsigned().nullable().references('id').inTable('late_fee_policies').onDelete('SET NULL');
      t.integer('sort_order').notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.unique(['fee_structure_id', 'fee_head_id'], { indexName: 'fsi_structure_head_unique' });
    });
  }

  if (!(await knex.schema.hasTable('fee_structure_installments'))) {
    await knex.schema.createTable('fee_structure_installments', (t) => {
      t.increments('id').primary();
      t.integer('fee_structure_id').unsigned().notNullable().references('id').inTable('fee_structures').onDelete('CASCADE');
      t.integer('installment_number').unsigned().notNullable();
      t.string('label', 128).notNullable();
      t.decimal('amount', 12, 2).notNullable();
      t.date('due_date').notNullable();
      t.timestamps(true, true);
      t.unique(['fee_structure_id', 'installment_number'], { indexName: 'fsinst_structure_num_unique' });
    });
  }

  // ── Student fee assignments ────────────────────────────────────────────
  if (!(await knex.schema.hasTable('student_fee_assignments'))) {
    await knex.schema.createTable('student_fee_assignments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.integer('semester_id').unsigned().notNullable().references('id').inTable('semesters').onDelete('RESTRICT');
      t.integer('fee_structure_id').unsigned().notNullable().references('id').inTable('fee_structures').onDelete('RESTRICT');
      t.integer('academic_class_id').unsigned().nullable().references('id').inTable('academic_classes').onDelete('SET NULL');
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.text('override_reason').nullable();
      t.integer('assigned_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['student_id', 'academic_year_id', 'semester_id', 'fee_structure_id'], {
        indexName: 'sfa_student_year_sem_structure_unique',
      });
      t.index(['college_id', 'student_id', 'status'], 'sfa_college_student_status_idx');
      t.index(['college_id', 'academic_year_id', 'semester_id'], 'sfa_college_year_sem_idx');
    });
  }

  // ── Demands / invoices ─────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('student_fee_demands'))) {
    await knex.schema.createTable('student_fee_demands', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.integer('semester_id').unsigned().nullable().references('id').inTable('semesters').onDelete('SET NULL');
      t.integer('fee_assignment_id').unsigned().nullable().references('id').inTable('student_fee_assignments').onDelete('SET NULL');
      t.string('demand_number', 64).notNullable();
      t.string('demand_type', 32).notNullable().defaultTo('SEMESTER_FEE');
      t.string('source_type', 32).nullable();
      t.integer('source_id').unsigned().nullable();
      t.date('issue_date').notNullable();
      t.date('due_date').nullable();
      t.decimal('gross_amount', 12, 2).notNullable().defaultTo(0);
      t.decimal('discount_amount', 12, 2).notNullable().defaultTo(0);
      t.decimal('scholarship_amount', 12, 2).notNullable().defaultTo(0);
      t.decimal('adjustment_amount', 12, 2).notNullable().defaultTo(0);
      t.decimal('late_fee_amount', 12, 2).notNullable().defaultTo(0);
      t.decimal('net_amount', 12, 2).notNullable().defaultTo(0);
      t.decimal('paid_amount', 12, 2).notNullable().defaultTo(0);
      t.decimal('outstanding_amount', 12, 2).notNullable().defaultTo(0);
      t.string('status', 16).notNullable().defaultTo('DRAFT');
      t.string('idempotency_key', 128).nullable();
      t.text('notes').nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['college_id', 'demand_number'], { indexName: 'sfd_college_number_unique' });
      t.unique(['college_id', 'idempotency_key'], { indexName: 'sfd_college_idempotency_unique' });
      t.index(['college_id', 'student_id', 'status'], 'sfd_college_student_status_idx');
      t.index(['college_id', 'due_date', 'status'], 'sfd_college_due_status_idx');
      t.index(['college_id', 'academic_year_id', 'semester_id'], 'sfd_college_year_sem_idx');
    });
  }

  if (!(await knex.schema.hasTable('student_fee_demand_items'))) {
    await knex.schema.createTable('student_fee_demand_items', (t) => {
      t.increments('id').primary();
      t.integer('demand_id').unsigned().notNullable().references('id').inTable('student_fee_demands').onDelete('CASCADE');
      t.integer('fee_head_id').unsigned().notNullable().references('id').inTable('fee_heads').onDelete('RESTRICT');
      t.integer('fee_structure_item_id').unsigned().nullable().references('id').inTable('fee_structure_items').onDelete('SET NULL');
      t.string('description', 255).nullable();
      t.decimal('gross_amount', 12, 2).notNullable();
      t.decimal('discount_amount', 12, 2).notNullable().defaultTo(0);
      t.decimal('scholarship_amount', 12, 2).notNullable().defaultTo(0);
      t.decimal('adjustment_amount', 12, 2).notNullable().defaultTo(0);
      t.decimal('net_amount', 12, 2).notNullable();
      t.decimal('paid_amount', 12, 2).notNullable().defaultTo(0);
      t.decimal('outstanding_amount', 12, 2).notNullable();
      t.date('due_date').nullable();
      t.string('installment_group', 32).nullable();
      t.timestamps(true, true);
      t.index(['demand_id'], 'sfdi_demand_idx');
      t.index(['fee_head_id'], 'sfdi_head_idx');
    });
  }

  if (!(await knex.schema.hasTable('student_fee_demand_installments'))) {
    await knex.schema.createTable('student_fee_demand_installments', (t) => {
      t.increments('id').primary();
      t.integer('demand_id').unsigned().notNullable().references('id').inTable('student_fee_demands').onDelete('CASCADE');
      t.integer('installment_number').unsigned().notNullable();
      t.string('label', 128).notNullable();
      t.decimal('amount', 12, 2).notNullable();
      t.decimal('paid_amount', 12, 2).notNullable().defaultTo(0);
      t.decimal('outstanding_amount', 12, 2).notNullable();
      t.date('due_date').notNullable();
      t.string('status', 16).notNullable().defaultTo('PENDING');
      t.timestamps(true, true);
      t.unique(['demand_id', 'installment_number'], { indexName: 'sfdinst_demand_num_unique' });
      t.index(['demand_id', 'due_date', 'status'], 'sfdinst_demand_due_status_idx');
    });
  }

  // ── Scholarships ───────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('scholarship_schemes'))) {
    await knex.schema.createTable('scholarship_schemes', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 64).notNullable();
      t.string('name', 255).notNullable();
      t.text('description').nullable();
      t.string('provider', 128).nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'ss_college_code_unique' });
    });
  }

  if (!(await knex.schema.hasTable('student_scholarships'))) {
    await knex.schema.createTable('student_scholarships', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('scheme_id').unsigned().notNullable().references('id').inTable('scholarship_schemes').onDelete('RESTRICT');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.decimal('expected_amount', 12, 2).nullable();
      t.decimal('sanctioned_amount', 12, 2).nullable();
      t.decimal('received_amount', 12, 2).notNullable().defaultTo(0);
      t.string('status', 16).notNullable().defaultTo('APPLIED');
      t.text('remarks').nullable();
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('approved_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'student_id', 'status'], 'ssch_college_student_status_idx');
      t.index(['college_id', 'academic_year_id'], 'ssch_college_year_idx');
    });
  }

  // ── Concessions ────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('student_fee_concessions'))) {
    await knex.schema.createTable('student_fee_concessions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('demand_id').unsigned().nullable().references('id').inTable('student_fee_demands').onDelete('SET NULL');
      t.integer('fee_head_id').unsigned().nullable().references('id').inTable('fee_heads').onDelete('SET NULL');
      t.string('concession_type', 64).notNullable();
      t.decimal('amount', 12, 2).nullable();
      t.decimal('percentage', 5, 2).nullable();
      t.text('reason').notNullable();
      t.string('status', 16).notNullable().defaultTo('PENDING');
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('approved_at').nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'student_id', 'status'], 'sfc_college_student_status_idx');
    });
  }

  // ── Payments ───────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('student_payments'))) {
    await knex.schema.createTable('student_payments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.string('payment_number', 64).notNullable();
      t.decimal('amount', 12, 2).notNullable();
      t.date('payment_date').notNullable();
      t.string('payment_method', 32).notNullable();
      t.string('transaction_reference', 128).nullable();
      t.string('gateway_reference', 128).nullable();
      t.string('bank_reference', 128).nullable();
      t.string('cheque_status', 16).nullable();
      t.string('status', 16).notNullable().defaultTo('INITIATED');
      t.text('remarks').nullable();
      t.integer('recorded_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('idempotency_key', 128).nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'payment_number'], { indexName: 'sp_college_number_unique' });
      t.unique(['college_id', 'idempotency_key'], { indexName: 'sp_college_idempotency_unique' });
      t.index(['college_id', 'student_id', 'status'], 'sp_college_student_status_idx');
      t.index(['college_id', 'payment_date', 'status'], 'sp_college_date_status_idx');
      t.index(['transaction_reference'], 'sp_txn_ref_idx');
    });
  }

  if (!(await knex.schema.hasTable('payment_allocations'))) {
    await knex.schema.createTable('payment_allocations', (t) => {
      t.increments('id').primary();
      t.integer('payment_id').unsigned().notNullable().references('id').inTable('student_payments').onDelete('CASCADE');
      t.integer('demand_id').unsigned().notNullable().references('id').inTable('student_fee_demands').onDelete('RESTRICT');
      t.integer('demand_item_id').unsigned().nullable().references('id').inTable('student_fee_demand_items').onDelete('SET NULL');
      t.integer('installment_id').unsigned().nullable().references('id').inTable('student_fee_demand_installments').onDelete('SET NULL');
      t.decimal('amount', 12, 2).notNullable();
      t.timestamps(true, true);
      t.index(['payment_id'], 'pa_payment_idx');
      t.index(['demand_id'], 'pa_demand_idx');
    });
  }

  // ── Gateway orders & webhooks ──────────────────────────────────────────
  if (!(await knex.schema.hasTable('payment_gateway_orders'))) {
    await knex.schema.createTable('payment_gateway_orders', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('payment_id').unsigned().nullable().references('id').inTable('student_payments').onDelete('SET NULL');
      t.string('provider', 64).notNullable();
      t.string('order_id', 128).notNullable();
      t.decimal('amount', 12, 2).notNullable();
      t.string('currency', 8).notNullable().defaultTo('INR');
      t.string('status', 16).notNullable().defaultTo('CREATED');
      t.json('metadata').nullable();
      t.timestamps(true, true);
      t.unique(['provider', 'order_id'], { indexName: 'pgo_provider_order_unique' });
      t.index(['college_id', 'student_id', 'status'], 'pgo_college_student_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('payment_gateway_webhook_events'))) {
    await knex.schema.createTable('payment_gateway_webhook_events', (t) => {
      t.increments('id').primary();
      t.string('provider', 64).notNullable();
      t.string('event_id', 128).notNullable();
      t.string('event_type', 64).nullable();
      t.json('payload').nullable();
      t.string('status', 16).notNullable().defaultTo('RECEIVED');
      t.timestamp('processed_at').nullable();
      t.timestamps(true, true);
      t.unique(['provider', 'event_id'], { indexName: 'pgwe_provider_event_unique' });
    });
  }

  // ── Receipts ───────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('fee_receipt_number_sequences'))) {
    await knex.schema.createTable('fee_receipt_number_sequences', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('series_code', 16).notNullable();
      t.integer('year').unsigned().notNullable();
      t.integer('last_number').unsigned().notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.unique(['college_id', 'series_code', 'year'], { indexName: 'frns_college_series_year_unique' });
    });
  }

  if (!(await knex.schema.hasTable('fee_receipts'))) {
    await knex.schema.createTable('fee_receipts', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('payment_id').unsigned().notNullable().references('id').inTable('student_payments').onDelete('RESTRICT');
      t.string('receipt_number', 64).notNullable();
      t.date('receipt_date').notNullable();
      t.decimal('amount', 12, 2).notNullable();
      t.string('payment_method', 32).notNullable();
      t.string('transaction_reference', 128).nullable();
      t.decimal('outstanding_balance', 12, 2).notNullable().defaultTo(0);
      t.string('status', 16).notNullable().defaultTo('ISSUED');
      t.integer('voided_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('voided_at').nullable();
      t.text('void_reason').nullable();
      t.integer('corrected_receipt_id').unsigned().nullable();
      t.json('snapshot').nullable();
      t.string('idempotency_key', 128).nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'receipt_number'], { indexName: 'fr_college_number_unique' });
      t.unique(['college_id', 'idempotency_key'], { indexName: 'fr_college_idempotency_unique' });
      t.index(['college_id', 'student_id', 'status'], 'fr_college_student_status_idx');
      t.index(['college_id', 'receipt_date'], 'fr_college_date_idx');
    });
  }

  if (!(await knex.schema.hasTable('fee_receipt_items'))) {
    await knex.schema.createTable('fee_receipt_items', (t) => {
      t.increments('id').primary();
      t.integer('receipt_id').unsigned().notNullable().references('id').inTable('fee_receipts').onDelete('CASCADE');
      t.integer('fee_head_id').unsigned().nullable().references('id').inTable('fee_heads').onDelete('SET NULL');
      t.string('description', 255).notNullable();
      t.decimal('amount', 12, 2).notNullable();
      t.timestamps(true, true);
      t.index(['receipt_id'], 'fri_receipt_idx');
    });
  }

  // ── Refunds ────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('student_refunds'))) {
    await knex.schema.createTable('student_refunds', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('payment_id').unsigned().nullable().references('id').inTable('student_payments').onDelete('SET NULL');
      t.decimal('amount', 12, 2).notNullable();
      t.string('reason_code', 32).notNullable();
      t.text('reason').nullable();
      t.string('status', 16).notNullable().defaultTo('REQUESTED');
      t.string('payment_reference', 128).nullable();
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('approved_at').nullable();
      t.integer('processed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('processed_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'student_id', 'status'], 'sr_college_student_status_idx');
    });
  }

  // ── Bulk generation tracking ───────────────────────────────────────────
  if (!(await knex.schema.hasTable('finance_demand_generation_runs'))) {
    await knex.schema.createTable('finance_demand_generation_runs', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('run_key', 128).notNullable();
      t.integer('demands_created').unsigned().notNullable().defaultTo(0);
      t.integer('demands_skipped').unsigned().notNullable().defaultTo(0);
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['college_id', 'run_key'], { indexName: 'fdgr_college_run_unique' });
    });
  }

  // ── Finance audit log ──────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('finance_audit_log'))) {
    await knex.schema.createTable('finance_audit_log', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('actor_id').unsigned().nullable();
      t.string('actor_type', 16).notNullable().defaultTo('FACULTY');
      t.string('action', 64).notNullable();
      t.string('entity_type', 64).notNullable();
      t.integer('entity_id').unsigned().nullable();
      t.json('before_state').nullable();
      t.json('after_state').nullable();
      t.text('reason').nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'entity_type', 'entity_id'], 'fal_college_entity_idx');
      t.index(['college_id', 'action', 'created_at'], 'fal_college_action_idx');
    });
  }

  // ── Extend exam_policies for fee requirement ───────────────────────────
  if (await knex.schema.hasTable('exam_policies')) {
    if (!(await knex.schema.hasColumn('exam_policies', 'exam_fee_paid_required'))) {
      await knex.schema.alterTable('exam_policies', (t) => {
        t.boolean('exam_fee_paid_required').notNullable().defaultTo(false);
      });
    }
  }

  // ── Extend student service request types for fees ──────────────────────
  if (await knex.schema.hasTable('student_service_request_types')) {
    if (!(await knex.schema.hasColumn('student_service_request_types', 'fee_required'))) {
      await knex.schema.alterTable('student_service_request_types', (t) => {
        t.boolean('fee_required').notNullable().defaultTo(false);
        t.decimal('fee_amount', 12, 2).nullable();
        t.string('fee_head_code', 64).nullable();
      });
    }
  }

  // ── Extend revaluation for finance demand link ─────────────────────────
  if (await knex.schema.hasTable('exam_revaluation_requests')) {
    if (!(await knex.schema.hasColumn('exam_revaluation_requests', 'finance_demand_id'))) {
      await knex.schema.alterTable('exam_revaluation_requests', (t) => {
        t.integer('finance_demand_id').unsigned().nullable();
      });
    }
  }
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('finance_audit_log');
  await knex.schema.dropTableIfExists('finance_demand_generation_runs');
  await knex.schema.dropTableIfExists('student_refunds');
  await knex.schema.dropTableIfExists('fee_receipt_items');
  await knex.schema.dropTableIfExists('fee_receipts');
  await knex.schema.dropTableIfExists('fee_receipt_number_sequences');
  await knex.schema.dropTableIfExists('payment_gateway_webhook_events');
  await knex.schema.dropTableIfExists('payment_gateway_orders');
  await knex.schema.dropTableIfExists('payment_allocations');
  await knex.schema.dropTableIfExists('student_payments');
  await knex.schema.dropTableIfExists('student_fee_concessions');
  await knex.schema.dropTableIfExists('student_scholarships');
  await knex.schema.dropTableIfExists('scholarship_schemes');
  await knex.schema.dropTableIfExists('student_fee_demand_installments');
  await knex.schema.dropTableIfExists('student_fee_demand_items');
  await knex.schema.dropTableIfExists('student_fee_demands');
  await knex.schema.dropTableIfExists('student_fee_assignments');
  await knex.schema.dropTableIfExists('fee_structure_installments');
  await knex.schema.dropTableIfExists('fee_structure_items');
  await knex.schema.dropTableIfExists('fee_structures');
  await knex.schema.dropTableIfExists('late_fee_policies');
  await knex.schema.dropTableIfExists('fee_heads');
  await knex.schema.dropTableIfExists('college_finance_policies');

  if (await knex.schema.hasTable('exam_policies')) {
    if (await knex.schema.hasColumn('exam_policies', 'exam_fee_paid_required')) {
      await knex.schema.alterTable('exam_policies', (t) => t.dropColumn('exam_fee_paid_required'));
    }
  }
  if (await knex.schema.hasTable('student_service_request_types')) {
    if (await knex.schema.hasColumn('student_service_request_types', 'fee_required')) {
      await knex.schema.alterTable('student_service_request_types', (t) => {
        t.dropColumn('fee_required');
        t.dropColumn('fee_amount');
        t.dropColumn('fee_head_code');
      });
    }
  }
  if (await knex.schema.hasTable('exam_revaluation_requests')) {
    if (await knex.schema.hasColumn('exam_revaluation_requests', 'finance_demand_id')) {
      await knex.schema.alterTable('exam_revaluation_requests', (t) => t.dropColumn('finance_demand_id'));
    }
  }
};
