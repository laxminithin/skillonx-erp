/**
 * Campus OS Phase 2 — Food Services (Canteen / POS).
 *
 * Reuses, unmodified: `inventory_items`/`inventory_item_categories` (menu items),
 * `inventory_stores` (counter location), `createIssue`/`createReturn` (stock
 * consumption/reversal via the existing Procurement stock ledger). No prepaid wallet
 * and no independent financial ledger — see
 * docs/CAMPUS_OS_PHASE2_PREIMPLEMENTATION_AUDIT.md for the architecture decision.
 * Finance itself is not touched; `canteen_finance_handoffs` mirrors the existing,
 * already-accepted `procurement_finance_handoffs` pattern exactly.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('canteen_menu_items'))) {
    await knex.schema.createTable('canteen_menu_items', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('item_id').unsigned().notNullable().references('id').inTable('inventory_items').onDelete('RESTRICT');
      t.string('category', 64).notNullable().defaultTo('OTHER');
      t.decimal('price', 10, 2).notNullable();
      t.boolean('is_available').notNullable().defaultTo(true);
      t.integer('created_by').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.timestamps(true, true);
      t.unique(['college_id', 'item_id'], { indexName: 'canteen_menu_college_item_unique' });
      t.index(['college_id', 'is_available'], 'canteen_menu_college_available_idx');
    });
  }

  if (!(await knex.schema.hasTable('canteen_orders'))) {
    await knex.schema.createTable('canteen_orders', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('order_no', 64).notNullable();
      t.integer('counter_store_id').unsigned().notNullable().references('id').inTable('inventory_stores').onDelete('RESTRICT');
      t.string('customer_type', 32).notNullable();
      t.integer('customer_student_id').unsigned().nullable().references('id').inTable('students').onDelete('SET NULL');
      t.integer('customer_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('status', 32).notNullable().defaultTo('PENDING');
      t.string('payment_method', 32).nullable();
      t.decimal('total_amount', 10, 2).notNullable().defaultTo(0);
      t.integer('issue_id').unsigned().nullable().references('id').inTable('inventory_stock_issues').onDelete('SET NULL');
      t.integer('created_by').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.text('reason').nullable();
      t.timestamp('paid_at').nullable();
      t.timestamp('cancelled_at').nullable();
      t.timestamp('refunded_at').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'order_no'], { indexName: 'canteen_order_no_unique' });
      t.index(['college_id', 'status'], 'canteen_order_status_idx');
      t.index(['college_id', 'counter_store_id', 'created_at'], 'canteen_order_counter_date_idx');
    });
  }

  if (!(await knex.schema.hasTable('canteen_order_items'))) {
    await knex.schema.createTable('canteen_order_items', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('order_id').unsigned().notNullable().references('id').inTable('canteen_orders').onDelete('CASCADE');
      t.integer('menu_item_id').unsigned().notNullable().references('id').inTable('canteen_menu_items').onDelete('RESTRICT');
      t.integer('item_id').unsigned().notNullable().references('id').inTable('inventory_items').onDelete('RESTRICT');
      t.decimal('quantity', 10, 3).notNullable();
      t.decimal('unit_price', 10, 2).notNullable();
      t.decimal('line_total', 10, 2).notNullable();
      t.timestamps(true, true);
      t.index(['college_id', 'order_id'], 'canteen_order_item_order_idx');
    });
  }

  if (!(await knex.schema.hasTable('canteen_finance_handoffs'))) {
    await knex.schema.createTable('canteen_finance_handoffs', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('counter_store_id').unsigned().notNullable().references('id').inTable('inventory_stores').onDelete('RESTRICT');
      t.date('business_date').notNullable();
      t.decimal('total_sales_amount', 10, 2).notNullable().defaultTo(0);
      t.decimal('cash_amount', 10, 2).notNullable().defaultTo(0);
      t.decimal('card_amount', 10, 2).notNullable().defaultTo(0);
      t.decimal('upi_amount', 10, 2).notNullable().defaultTo(0);
      t.integer('order_count').unsigned().notNullable().defaultTo(0);
      t.string('status', 32).notNullable().defaultTo('PENDING_FINANCE');
      t.integer('created_by').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      t.unique(['college_id', 'counter_store_id', 'business_date'], { indexName: 'canteen_handoff_counter_date_unique' });
    });
  }
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('canteen_finance_handoffs');
  await knex.schema.dropTableIfExists('canteen_order_items');
  await knex.schema.dropTableIfExists('canteen_orders');
  await knex.schema.dropTableIfExists('canteen_menu_items');
};
