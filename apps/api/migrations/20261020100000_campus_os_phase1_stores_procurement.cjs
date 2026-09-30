/**
 * Campus OS Phase 1 — Procurement + Stores & Inventory.
 *
 * Two additive changes closing the two genuine gaps identified in
 * docs/CAMPUS_OS_PHASE1_PREIMPLEMENTATION_AUDIT.md:
 *  1) GRN idempotency (prevent duplicate stock receipt from client replay).
 *  2) Asset handoff linkage (GRN of an ASSET_TRACKABLE item -> governed registration
 *     in the frozen P0.2 Asset Management engine, idempotent per GRN line).
 *
 * Neither the frozen P0.2 `campus_assets`/`campus_asset_history` schema nor any
 * existing procurement table's existing columns are modified — this migration only
 * adds a nullable column and a brand-new, Procurement-owned join table.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const hasIdempotencyKey = await knex.schema.hasColumn('procurement_grns', 'idempotency_key');
  if (!hasIdempotencyKey) {
    await knex.schema.alterTable('procurement_grns', (t) => {
      t.string('idempotency_key', 191).nullable();
      // MySQL unique indexes permit multiple NULLs, so this is backward-compatible
      // with every existing/non-idempotent GRN creation call.
      t.unique(['college_id', 'po_id', 'idempotency_key'], { indexName: 'proc_grn_po_idempotency_unique' });
    });
  }

  if (!(await knex.schema.hasTable('procurement_asset_handoffs'))) {
    await knex.schema.createTable('procurement_asset_handoffs', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('grn_item_id').unsigned().notNullable().references('id').inTable('procurement_grn_items').onDelete('RESTRICT');
      t.integer('grn_id').unsigned().notNullable().references('id').inTable('procurement_grns').onDelete('RESTRICT');
      t.integer('item_id').unsigned().notNullable().references('id').inTable('inventory_items').onDelete('RESTRICT');
      t.json('asset_ids').notNullable();
      t.integer('created_by').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      // The core idempotency guarantee: at most one handoff may ever be recorded per GRN line.
      t.unique(['college_id', 'grn_item_id'], { indexName: 'proc_asset_handoff_grn_item_unique' });
    });
  }
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('procurement_asset_handoffs');
  const hasIdempotencyKey = await knex.schema.hasColumn('procurement_grns', 'idempotency_key');
  if (hasIdempotencyKey) {
    await knex.schema.alterTable('procurement_grns', (t) => {
      t.dropUnique(['college_id', 'po_id', 'idempotency_key'], 'proc_grn_po_idempotency_unique');
      t.dropColumn('idempotency_key');
    });
  }
};
