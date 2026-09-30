/**
 * Phase 3 — Facilities & Maintenance: proven gaps only.
 *
 * The pre-implementation audit (docs/CAMPUS_OS_PHASE3_PREIMPLEMENTATION_AUDIT.md)
 * found a full, frozen, generic work-order/ticket engine already at
 * `service_tickets` (Maintenance/Facilities/IT Helpdesk closure). This
 * migration does NOT create a second work-order table. It adds only the two
 * evidence-backed gaps:
 *
 *   1. `service_tickets.asset_id` — a real FK to the canonical `campus_assets`
 *      register (P0.2), so a work order against generic/campus equipment can
 *      be traced from the asset side without duplicating asset identity.
 *      Existing free-text `asset_ref` is kept for non-FK sources (Lab/Hostel
 *      local asset tables, which remain out of scope — see the audit).
 *
 *   2. `maintenance_preventive_plans` + `maintenance_preventive_occurrences`
 *      — a preventive-maintenance schedule. Nothing like this exists anywhere
 *      in the repo (confirmed by the audit). A plan optionally references an
 *      asset (`campus_assets`), a category/team (reusing `service_categories`
 *      / `service_teams`) and a vendor (reusing `procurement_vendors` — no
 *      second vendor master). Generation is idempotent per (plan, occurrence
 *      date) via a unique constraint, and produces an ordinary `service_tickets`
 *      row — the same frozen ticket engine, never a parallel one.
 *
 * AMC/warranty data is intentionally NOT duplicated here: `campus_assets`
 * already carries `warranty_start_date` / `warranty_end_date` /
 * `amc_reference` / `amc_expiry_date` (P0.2, frozen). Phase 3 only surfaces
 * those fields to the Maintenance operator (read-only) — see
 * `assetManagement/service.ts:findAssetRef`.
 */
exports.up = async function up(knex) {
  // ── service_tickets.asset_id (additive FK; asset_ref free text unchanged) ──
  if (await knex.schema.hasTable('service_tickets')) {
    const hasCol = await knex.schema.hasColumn('service_tickets', 'asset_id');
    if (!hasCol) {
      await knex.schema.alterTable('service_tickets', (t) => {
        t.integer('asset_id').unsigned().nullable().references('id').inTable('campus_assets').onDelete('SET NULL');
      });
      await knex.schema.alterTable('service_tickets', (t) => {
        t.index(['college_id', 'asset_id'], 'svcticket_college_asset_idx');
      });
    }
  }

  // ── Preventive maintenance plan ─────────────────────────────────────────
  if (!(await knex.schema.hasTable('maintenance_preventive_plans'))) {
    await knex.schema.createTable('maintenance_preventive_plans', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('name', 200).notNullable();
      t.text('description').nullable();
      // Asset-less plans are legitimate (§27) — e.g. "quarterly fire extinguisher check, Block B".
      t.integer('asset_id').unsigned().nullable().references('id').inTable('campus_assets').onDelete('SET NULL');
      t.integer('category_id').unsigned().nullable().references('id').inTable('service_categories').onDelete('SET NULL');
      t.integer('team_id').unsigned().nullable().references('id').inTable('service_teams').onDelete('SET NULL');
      t.integer('vendor_id').unsigned().nullable().references('id').inTable('procurement_vendors').onDelete('SET NULL');
      t.integer('room_id').unsigned().nullable().references('id').inTable('rooms').onDelete('SET NULL');
      t.string('building', 96).nullable();
      t.string('frequency_unit', 12).notNullable().defaultTo('MONTHS'); // DAYS | WEEKS | MONTHS | YEARS
      t.integer('frequency_value').unsigned().notNullable().defaultTo(1);
      t.string('priority', 12).notNullable().defaultTo('NORMAL'); // LOW | NORMAL | HIGH | CRITICAL
      t.text('checklist').nullable(); // JSON array of strings
      t.date('next_due_date').notNullable();
      t.date('last_generated_date').nullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE'); // ACTIVE | PAUSED | ENDED
      t.text('notes').nullable();
      t.integer('created_by').unsigned().nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'status', 'next_due_date'], 'mpp_college_status_due_idx');
      t.index(['college_id', 'asset_id'], 'mpp_college_asset_idx');
    });
  }

  // ── Preventive occurrences (idempotency + audit trail of each generation) ─
  if (!(await knex.schema.hasTable('maintenance_preventive_occurrences'))) {
    await knex.schema.createTable('maintenance_preventive_occurrences', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('plan_id').unsigned().notNullable().references('id').inTable('maintenance_preventive_plans').onDelete('CASCADE');
      t.date('occurrence_date').notNullable();
      t.string('status', 16).notNullable().defaultTo('PENDING'); // PENDING | GENERATED | SKIPPED
      t.integer('ticket_id').unsigned().nullable().references('id').inTable('service_tickets').onDelete('SET NULL');
      t.timestamp('generated_at').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      // The idempotency guarantee: one occurrence row per plan per due date, ever.
      t.unique(['plan_id', 'occurrence_date'], { indexName: 'mpo_plan_date_uq' });
      t.index(['college_id', 'plan_id'], 'mpo_college_plan_idx');
    });
  }
};

exports.down = async function down(knex) {
  if (await knex.schema.hasTable('maintenance_preventive_occurrences')) {
    await knex.schema.dropTable('maintenance_preventive_occurrences');
  }
  if (await knex.schema.hasTable('maintenance_preventive_plans')) {
    await knex.schema.dropTable('maintenance_preventive_plans');
  }
  if (await knex.schema.hasTable('service_tickets')) {
    const hasCol = await knex.schema.hasColumn('service_tickets', 'asset_id');
    if (hasCol) {
      await knex.schema.alterTable('service_tickets', (t) => {
        t.dropIndex(['college_id', 'asset_id'], 'svcticket_college_asset_idx');
        t.dropForeign(['asset_id']);
      });
      await knex.schema.alterTable('service_tickets', (t) => {
        t.dropColumn('asset_id');
      });
    }
  }
};
