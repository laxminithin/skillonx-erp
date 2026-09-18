/**
 * Canonical Stores, Purchase, Procurement, and Inventory web module.
 *
 * Consumer modules link to this engine by source_module/source_entity_id or
 * consumer_module/source_entity_id. Finance remains canonical for settlement.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('procurement_number_sequences'))) {
    await knex.schema.createTable('procurement_number_sequences', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('series', 32).notNullable();
      t.integer('year').notNullable();
      t.integer('last_number').notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.unique(['college_id', 'series', 'year'], { indexName: 'proc_num_seq_unique' });
    });
  }

  if (!(await knex.schema.hasTable('inventory_units'))) {
    await knex.schema.createTable('inventory_units', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 32).notNullable();
      t.string('name', 96).notNullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'inventory_units_college_code_unique' });
    });
  }

  if (!(await knex.schema.hasTable('inventory_item_categories'))) {
    await knex.schema.createTable('inventory_item_categories', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 64).notNullable();
      t.string('name', 128).notNullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'inventory_categories_college_code_unique' });
    });
  }

  if (!(await knex.schema.hasTable('inventory_stores'))) {
    await knex.schema.createTable('inventory_stores', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 64).notNullable();
      t.string('name', 160).notNullable();
      t.string('store_type', 64).notNullable().defaultTo('CENTRAL');
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('responsible_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'inventory_stores_college_code_unique' });
      t.index(['college_id', 'department_id'], 'inventory_stores_college_dept_idx');
    });
  }

  if (!(await knex.schema.hasTable('inventory_items'))) {
    await knex.schema.createTable('inventory_items', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('item_code', 64).notNullable();
      t.string('name', 255).notNullable();
      t.text('description').nullable();
      t.integer('category_id').unsigned().nullable().references('id').inTable('inventory_item_categories').onDelete('SET NULL');
      t.string('subcategory', 128).nullable();
      t.integer('unit_id').unsigned().notNullable().references('id').inTable('inventory_units').onDelete('RESTRICT');
      t.string('item_type', 48).notNullable().defaultTo('CONSUMABLE');
      t.boolean('is_active').notNullable().defaultTo(true);
      t.decimal('reorder_level', 14, 3).notNullable().defaultTo(0);
      t.integer('preferred_store_id').unsigned().nullable().references('id').inTable('inventory_stores').onDelete('SET NULL');
      t.string('tax_classification', 96).nullable();
      t.string('manufacturer', 160).nullable();
      t.string('brand', 160).nullable();
      t.text('specifications').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'item_code'], { indexName: 'inventory_items_college_code_unique' });
      t.index(['college_id', 'name'], 'inventory_items_college_name_idx');
    });
  }

  if (!(await knex.schema.hasTable('inventory_stock_balances'))) {
    await knex.schema.createTable('inventory_stock_balances', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('item_id').unsigned().notNullable().references('id').inTable('inventory_items').onDelete('RESTRICT');
      t.integer('store_id').unsigned().notNullable().references('id').inTable('inventory_stores').onDelete('RESTRICT');
      t.decimal('quantity', 14, 3).notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.unique(['college_id', 'item_id', 'store_id'], { indexName: 'inventory_balance_unique' });
      t.index(['college_id', 'store_id'], 'inventory_balance_store_idx');
    });
  }

  if (!(await knex.schema.hasTable('inventory_stock_ledger'))) {
    await knex.schema.createTable('inventory_stock_ledger', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('item_id').unsigned().notNullable().references('id').inTable('inventory_items').onDelete('RESTRICT');
      t.integer('store_id').unsigned().notNullable().references('id').inTable('inventory_stores').onDelete('RESTRICT');
      t.string('movement_type', 48).notNullable();
      t.decimal('quantity', 14, 3).notNullable();
      t.decimal('balance_after', 14, 3).notNullable();
      t.string('source_type', 64).notNullable();
      t.integer('source_id').unsigned().nullable();
      t.string('source_key', 191).nullable();
      t.integer('actor_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('remarks').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'item_id', 'store_id', 'created_at'], 'inventory_ledger_item_store_idx');
      t.index(['college_id', 'source_type', 'source_id'], 'inventory_ledger_source_idx');
    });
  }

  if (!(await knex.schema.hasTable('procurement_vendors'))) {
    await knex.schema.createTable('procurement_vendors', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('vendor_code', 64).notNullable();
      t.string('name', 255).notNullable();
      t.string('normalized_name', 255).notNullable();
      t.text('address').nullable();
      t.string('contact_person', 160).nullable();
      t.string('phone', 64).nullable();
      t.string('email', 255).nullable();
      t.string('tax_identifier', 96).nullable();
      t.text('bank_details').nullable();
      t.text('categories').nullable();
      t.string('verification_status', 48).notNullable().defaultTo('PENDING');
      t.decimal('rating', 4, 2).nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.text('notes').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'vendor_code'], { indexName: 'proc_vendor_college_code_unique' });
      t.unique(['college_id', 'tax_identifier'], { indexName: 'proc_vendor_college_tax_unique' });
      t.index(['college_id', 'normalized_name'], 'proc_vendor_name_idx');
    });
  }

  if (!(await knex.schema.hasTable('procurement_indents'))) {
    await knex.schema.createTable('procurement_indents', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('indent_no', 64).notNullable();
      t.integer('requester_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.string('consumer_module', 64).notNullable().defaultTo('DEPARTMENT');
      t.string('source_entity_type', 96).nullable();
      t.integer('source_entity_id').unsigned().nullable();
      t.integer('delivery_store_id').unsigned().nullable().references('id').inTable('inventory_stores').onDelete('SET NULL');
      t.date('required_date').nullable();
      t.string('urgency', 32).notNullable().defaultTo('NORMAL');
      t.string('status', 48).notNullable().defaultTo('DRAFT');
      t.text('purpose').nullable();
      t.decimal('estimated_total', 14, 2).notNullable().defaultTo(0);
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('approved_at').nullable();
      t.text('last_decision_comment').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'indent_no'], { indexName: 'proc_indent_no_unique' });
      t.index(['college_id', 'status', 'department_id'], 'proc_indent_status_dept_idx');
    });
  }

  if (!(await knex.schema.hasTable('procurement_indent_items'))) {
    await knex.schema.createTable('procurement_indent_items', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('indent_id').unsigned().notNullable().references('id').inTable('procurement_indents').onDelete('CASCADE');
      t.integer('item_id').unsigned().notNullable().references('id').inTable('inventory_items').onDelete('RESTRICT');
      t.decimal('quantity', 14, 3).notNullable();
      t.decimal('estimated_rate', 14, 2).nullable();
      t.text('specifications').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'indent_id'], 'proc_indent_items_indent_idx');
    });
  }

  if (!(await knex.schema.hasTable('procurement_approvals'))) {
    await knex.schema.createTable('procurement_approvals', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('indent_id').unsigned().notNullable().references('id').inTable('procurement_indents').onDelete('CASCADE');
      t.string('action', 48).notNullable();
      t.integer('actor_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('comments').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'indent_id'], 'proc_approval_indent_idx');
    });
  }

  if (!(await knex.schema.hasTable('procurement_rfqs'))) {
    await knex.schema.createTable('procurement_rfqs', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('rfq_no', 64).notNullable();
      t.integer('indent_id').unsigned().nullable().references('id').inTable('procurement_indents').onDelete('SET NULL');
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.date('due_date').nullable();
      t.text('terms').nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['college_id', 'rfq_no'], { indexName: 'proc_rfq_no_unique' });
      t.index(['college_id', 'status'], 'proc_rfq_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('procurement_rfq_vendors'))) {
    await knex.schema.createTable('procurement_rfq_vendors', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('rfq_id').unsigned().notNullable().references('id').inTable('procurement_rfqs').onDelete('CASCADE');
      t.integer('vendor_id').unsigned().notNullable().references('id').inTable('procurement_vendors').onDelete('RESTRICT');
      t.timestamps(true, true);
      t.unique(['rfq_id', 'vendor_id'], { indexName: 'proc_rfq_vendor_unique' });
    });
  }

  if (!(await knex.schema.hasTable('procurement_quotations'))) {
    await knex.schema.createTable('procurement_quotations', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('rfq_id').unsigned().notNullable().references('id').inTable('procurement_rfqs').onDelete('CASCADE');
      t.integer('vendor_id').unsigned().notNullable().references('id').inTable('procurement_vendors').onDelete('RESTRICT');
      t.string('quotation_no', 96).nullable();
      t.date('quotation_date').nullable();
      t.date('valid_until').nullable();
      t.string('delivery_period', 96).nullable();
      t.text('warranty').nullable();
      t.text('payment_terms').nullable();
      t.decimal('freight_charges', 14, 2).notNullable().defaultTo(0);
      t.decimal('other_charges', 14, 2).notNullable().defaultTo(0);
      t.decimal('total_amount', 14, 2).notNullable().defaultTo(0);
      t.string('status', 32).notNullable().defaultTo('RECORDED');
      t.boolean('is_selected').notNullable().defaultTo(false);
      t.text('selection_justification').nullable();
      t.integer('selected_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('selected_at').nullable();
      t.timestamps(true, true);
      t.unique(['rfq_id', 'vendor_id'], { indexName: 'proc_quote_rfq_vendor_unique' });
      t.index(['college_id', 'rfq_id'], 'proc_quote_rfq_idx');
    });
  }

  if (!(await knex.schema.hasTable('procurement_quotation_items'))) {
    await knex.schema.createTable('procurement_quotation_items', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('quotation_id').unsigned().notNullable().references('id').inTable('procurement_quotations').onDelete('CASCADE');
      t.integer('item_id').unsigned().notNullable().references('id').inTable('inventory_items').onDelete('RESTRICT');
      t.decimal('quantity', 14, 3).notNullable();
      t.decimal('rate', 14, 2).notNullable();
      t.decimal('tax_amount', 14, 2).notNullable().defaultTo(0);
      t.decimal('discount_amount', 14, 2).notNullable().defaultTo(0);
      t.decimal('line_total', 14, 2).notNullable();
      t.text('compliance_notes').nullable();
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('procurement_purchase_orders'))) {
    await knex.schema.createTable('procurement_purchase_orders', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('po_no', 64).notNullable();
      t.integer('vendor_id').unsigned().notNullable().references('id').inTable('procurement_vendors').onDelete('RESTRICT');
      t.integer('indent_id').unsigned().nullable().references('id').inTable('procurement_indents').onDelete('SET NULL');
      t.integer('rfq_id').unsigned().nullable().references('id').inTable('procurement_rfqs').onDelete('SET NULL');
      t.integer('quotation_id').unsigned().nullable().references('id').inTable('procurement_quotations').onDelete('SET NULL');
      t.integer('delivery_store_id').unsigned().nullable().references('id').inTable('inventory_stores').onDelete('SET NULL');
      t.string('status', 48).notNullable().defaultTo('DRAFT');
      t.integer('revision_no').notNullable().defaultTo(0);
      t.decimal('total_amount', 14, 2).notNullable().defaultTo(0);
      t.text('delivery_terms').nullable();
      t.text('payment_terms').nullable();
      t.date('expected_date').nullable();
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('approved_at').nullable();
      t.integer('issued_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('issued_at').nullable();
      t.text('cancel_reason').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'po_no'], { indexName: 'proc_po_no_unique' });
      t.index(['college_id', 'status'], 'proc_po_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('procurement_purchase_order_items'))) {
    await knex.schema.createTable('procurement_purchase_order_items', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('po_id').unsigned().notNullable().references('id').inTable('procurement_purchase_orders').onDelete('CASCADE');
      t.integer('item_id').unsigned().notNullable().references('id').inTable('inventory_items').onDelete('RESTRICT');
      t.decimal('quantity_ordered', 14, 3).notNullable();
      t.decimal('quantity_received', 14, 3).notNullable().defaultTo(0);
      t.decimal('quantity_accepted', 14, 3).notNullable().defaultTo(0);
      t.decimal('quantity_rejected', 14, 3).notNullable().defaultTo(0);
      t.decimal('rate', 14, 2).notNullable();
      t.decimal('tax_amount', 14, 2).notNullable().defaultTo(0);
      t.decimal('discount_amount', 14, 2).notNullable().defaultTo(0);
      t.decimal('line_total', 14, 2).notNullable();
      t.timestamps(true, true);
      t.index(['college_id', 'po_id'], 'proc_po_items_po_idx');
    });
  }

  if (!(await knex.schema.hasTable('procurement_grns'))) {
    await knex.schema.createTable('procurement_grns', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('grn_no', 64).notNullable();
      t.integer('po_id').unsigned().notNullable().references('id').inTable('procurement_purchase_orders').onDelete('RESTRICT');
      t.integer('vendor_id').unsigned().notNullable().references('id').inTable('procurement_vendors').onDelete('RESTRICT');
      t.string('delivery_reference', 128).nullable();
      t.string('invoice_reference', 128).nullable();
      t.date('received_date').notNullable();
      t.integer('receiving_store_id').unsigned().notNullable().references('id').inTable('inventory_stores').onDelete('RESTRICT');
      t.string('inspection_status', 48).notNullable().defaultTo('PENDING_INSPECTION');
      t.integer('received_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('remarks').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'grn_no'], { indexName: 'proc_grn_no_unique' });
      t.index(['college_id', 'po_id'], 'proc_grn_po_idx');
    });
  }

  if (!(await knex.schema.hasTable('procurement_grn_items'))) {
    await knex.schema.createTable('procurement_grn_items', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('grn_id').unsigned().notNullable().references('id').inTable('procurement_grns').onDelete('CASCADE');
      t.integer('po_item_id').unsigned().notNullable().references('id').inTable('procurement_purchase_order_items').onDelete('RESTRICT');
      t.integer('item_id').unsigned().notNullable().references('id').inTable('inventory_items').onDelete('RESTRICT');
      t.decimal('received_quantity', 14, 3).notNullable();
      t.decimal('accepted_quantity', 14, 3).notNullable();
      t.decimal('rejected_quantity', 14, 3).notNullable().defaultTo(0);
      t.text('rejection_reason').nullable();
      t.string('vendor_return_status', 48).nullable();
      t.string('replacement_status', 48).nullable();
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('inventory_stock_issues'))) {
    await knex.schema.createTable('inventory_stock_issues', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('issue_no', 64).notNullable();
      t.integer('store_id').unsigned().notNullable().references('id').inTable('inventory_stores').onDelete('RESTRICT');
      t.string('consumer_module', 64).notNullable();
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.string('recipient_name', 160).nullable();
      t.string('source_entity_type', 96).nullable();
      t.integer('source_entity_id').unsigned().nullable();
      t.text('purpose').nullable();
      t.date('issue_date').notNullable();
      t.integer('issued_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['college_id', 'issue_no'], { indexName: 'inventory_issue_no_unique' });
    });
  }

  if (!(await knex.schema.hasTable('inventory_stock_issue_items'))) {
    await knex.schema.createTable('inventory_stock_issue_items', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('issue_id').unsigned().notNullable().references('id').inTable('inventory_stock_issues').onDelete('CASCADE');
      t.integer('item_id').unsigned().notNullable().references('id').inTable('inventory_items').onDelete('RESTRICT');
      t.decimal('quantity', 14, 3).notNullable();
      t.decimal('returned_quantity', 14, 3).notNullable().defaultTo(0);
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('inventory_stock_returns'))) {
    await knex.schema.createTable('inventory_stock_returns', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('return_no', 64).notNullable();
      t.integer('issue_id').unsigned().notNullable().references('id').inTable('inventory_stock_issues').onDelete('RESTRICT');
      t.integer('store_id').unsigned().notNullable().references('id').inTable('inventory_stores').onDelete('RESTRICT');
      t.date('return_date').notNullable();
      t.integer('received_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('remarks').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'return_no'], { indexName: 'inventory_return_no_unique' });
    });
  }

  if (!(await knex.schema.hasTable('inventory_stock_return_items'))) {
    await knex.schema.createTable('inventory_stock_return_items', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('return_id').unsigned().notNullable().references('id').inTable('inventory_stock_returns').onDelete('CASCADE');
      t.integer('issue_item_id').unsigned().notNullable().references('id').inTable('inventory_stock_issue_items').onDelete('RESTRICT');
      t.integer('item_id').unsigned().notNullable().references('id').inTable('inventory_items').onDelete('RESTRICT');
      t.decimal('quantity', 14, 3).notNullable();
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('inventory_stock_transfers'))) {
    await knex.schema.createTable('inventory_stock_transfers', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('transfer_no', 64).notNullable();
      t.integer('from_store_id').unsigned().notNullable().references('id').inTable('inventory_stores').onDelete('RESTRICT');
      t.integer('to_store_id').unsigned().notNullable().references('id').inTable('inventory_stores').onDelete('RESTRICT');
      t.date('transfer_date').notNullable();
      t.integer('transferred_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('remarks').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'transfer_no'], { indexName: 'inventory_transfer_no_unique' });
    });
  }

  if (!(await knex.schema.hasTable('inventory_stock_transfer_items'))) {
    await knex.schema.createTable('inventory_stock_transfer_items', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('transfer_id').unsigned().notNullable().references('id').inTable('inventory_stock_transfers').onDelete('CASCADE');
      t.integer('item_id').unsigned().notNullable().references('id').inTable('inventory_items').onDelete('RESTRICT');
      t.decimal('quantity', 14, 3).notNullable();
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('inventory_stock_adjustments'))) {
    await knex.schema.createTable('inventory_stock_adjustments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('adjustment_no', 64).notNullable();
      t.integer('store_id').unsigned().notNullable().references('id').inTable('inventory_stores').onDelete('RESTRICT');
      t.integer('item_id').unsigned().notNullable().references('id').inTable('inventory_items').onDelete('RESTRICT');
      t.string('direction', 16).notNullable();
      t.decimal('quantity', 14, 3).notNullable();
      t.text('reason').notNullable();
      t.integer('adjusted_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['college_id', 'adjustment_no'], { indexName: 'inventory_adjustment_no_unique' });
    });
  }

  if (!(await knex.schema.hasTable('procurement_finance_handoffs'))) {
    await knex.schema.createTable('procurement_finance_handoffs', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('po_id').unsigned().notNullable().references('id').inTable('procurement_purchase_orders').onDelete('RESTRICT');
      t.integer('grn_id').unsigned().notNullable().references('id').inTable('procurement_grns').onDelete('RESTRICT');
      t.integer('vendor_id').unsigned().notNullable().references('id').inTable('procurement_vendors').onDelete('RESTRICT');
      t.decimal('accepted_amount', 14, 2).notNullable();
      t.string('invoice_reference', 128).nullable();
      t.string('status', 48).notNullable().defaultTo('PENDING_FINANCE');
      t.string('idempotency_key', 191).notNullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['college_id', 'idempotency_key'], { indexName: 'proc_fin_handoff_idempotency_unique' });
      t.index(['college_id', 'status'], 'proc_fin_handoff_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('procurement_audit_log'))) {
    await knex.schema.createTable('procurement_audit_log', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('actor_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('action', 80).notNullable();
      t.string('entity_type', 80).nullable();
      t.integer('entity_id').unsigned().nullable();
      t.json('before_state').nullable();
      t.json('after_state').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'entity_type', 'entity_id'], 'proc_audit_entity_idx');
    });
  }
};

exports.down = async function down(knex) {
  for (const table of [
    'procurement_audit_log',
    'procurement_finance_handoffs',
    'inventory_stock_adjustments',
    'inventory_stock_transfer_items',
    'inventory_stock_transfers',
    'inventory_stock_return_items',
    'inventory_stock_returns',
    'inventory_stock_issue_items',
    'inventory_stock_issues',
    'procurement_grn_items',
    'procurement_grns',
    'procurement_purchase_order_items',
    'procurement_purchase_orders',
    'procurement_quotation_items',
    'procurement_quotations',
    'procurement_rfq_vendors',
    'procurement_rfqs',
    'procurement_approvals',
    'procurement_indent_items',
    'procurement_indents',
    'procurement_vendors',
    'inventory_stock_ledger',
    'inventory_stock_balances',
    'inventory_items',
    'inventory_stores',
    'inventory_item_categories',
    'inventory_units',
    'procurement_number_sequences',
  ]) {
    if (await knex.schema.hasTable(table)) await knex.schema.dropTable(table);
  }
};
