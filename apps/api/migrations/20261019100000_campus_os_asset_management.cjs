/**
 * Campus OS Phase 0 — shared Asset Management engine.
 *
 * Generic, cross-department asset register + history. Intentionally separate from the
 * frozen Lab module's own `lab_assets`/`lab_asset_history` tables (Lab is not touched).
 * Nullable `vendor_id` references the canonical `procurement_vendors` table (Vendor
 * Master, P0.1) rather than duplicating vendor identity.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('campus_assets'))) {
    await knex.schema.createTable('campus_assets', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('asset_tag', 64).notNullable();
      t.string('name', 255).notNullable();
      t.string('category', 96).notNullable();
      t.text('description').nullable();
      t.string('manufacturer', 160).nullable();
      t.string('model', 160).nullable();
      t.string('serial_number', 160).nullable();
      t.integer('vendor_id').unsigned().nullable().references('id').inTable('procurement_vendors').onDelete('SET NULL');
      t.string('purchase_reference', 191).nullable();
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('custodian_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('location_room_id').unsigned().nullable().references('id').inTable('rooms').onDelete('SET NULL');
      t.string('location_note', 255).nullable();
      t.date('acquisition_date').nullable();
      t.date('warranty_start_date').nullable();
      t.date('warranty_end_date').nullable();
      t.string('amc_reference', 191).nullable();
      t.date('amc_expiry_date').nullable();
      t.string('status', 32).notNullable().defaultTo('IN_STOCK');
      t.string('condition', 32).nullable();
      t.text('notes').nullable();
      t.integer('created_by').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.timestamps(true, true);
      t.unique(['college_id', 'asset_tag'], { indexName: 'campus_assets_college_tag_unique' });
      t.unique(['college_id', 'serial_number'], { indexName: 'campus_assets_college_serial_unique' });
      t.index(['college_id', 'status'], 'campus_assets_college_status_idx');
      t.index(['college_id', 'category'], 'campus_assets_college_category_idx');
      t.index(['college_id', 'department_id'], 'campus_assets_college_dept_idx');
      t.index(['college_id', 'custodian_faculty_id'], 'campus_assets_college_custodian_idx');
    });
  }

  if (!(await knex.schema.hasTable('campus_asset_history'))) {
    await knex.schema.createTable('campus_asset_history', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('asset_id').unsigned().notNullable().references('id').inTable('campus_assets').onDelete('CASCADE');
      t.string('action', 48).notNullable();
      t.text('previous_value').nullable();
      t.text('new_value').nullable();
      t.integer('actor_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.text('reason').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      t.index(['college_id', 'asset_id', 'created_at'], 'campus_asset_history_asset_idx');
    });
  }
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('campus_asset_history');
  await knex.schema.dropTableIfExists('campus_assets');
};
