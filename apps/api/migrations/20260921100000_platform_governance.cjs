/**
 * Super Admin & Platform Governance.
 *
 * Platform-owned tables only. Nothing here copies operational/domain data;
 * these tables govern tenant lifecycle, module enablement, the platform
 * capability registry (mapped onto the existing role-string RBAC engine),
 * a unified platform audit trail, and masked integration configuration.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  // --- Tenant lifecycle on the canonical colleges (tenant) table ---------
  await knex.schema.alterTable('colleges', (t) => {
    // DRAFT | ONBOARDING | ACTIVE | SUSPENDED | ARCHIVED
    t.string('status', 24).notNullable().defaultTo('ACTIVE');
    t.timestamp('suspended_at').nullable();
    t.timestamp('archived_at').nullable();
  });
  // Backfill lifecycle from the pre-existing is_active flag.
  await knex('colleges').where({ is_active: false }).update({ status: 'SUSPENDED' });

  // --- Module registry (canonical platform modules) ----------------------
  await knex.schema.createTable('platform_modules', (t) => {
    t.increments('id').primary();
    t.string('module_key', 64).notNullable().unique();
    t.string('name', 128).notNullable();
    t.string('category', 64).notNullable();
    t.string('description', 512).nullable();
    // JSON array of module_keys this module depends on.
    t.json('requires').nullable();
    // Core modules cannot be disabled for a tenant.
    t.boolean('is_core').notNullable().defaultTo(false);
    t.integer('sort_order').notNullable().defaultTo(0);
    t.timestamps(true, true);
  });

  // --- Tenant module enablement -----------------------------------------
  await knex.schema.createTable('college_modules', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.string('module_key', 64).notNullable();
    t.boolean('enabled').notNullable().defaultTo(true);
    t.timestamp('enabled_at').nullable();
    t.timestamp('disabled_at').nullable();
    t.integer('updated_by_faculty_user_id').unsigned().nullable();
    t.timestamps(true, true);
    t.unique(['college_id', 'module_key']);
    t.index(['college_id']);
  });

  // --- Platform capability registry -------------------------------------
  await knex.schema.createTable('platform_capabilities', (t) => {
    t.increments('id').primary();
    t.string('capability_key', 96).notNullable().unique();
    t.string('description', 256).notNullable();
    t.string('domain', 64).notNullable();
    t.timestamps(true, true);
  });

  // --- Role -> capability mapping (governs the existing role-string RBAC) -
  await knex.schema.createTable('platform_role_capabilities', (t) => {
    t.increments('id').primary();
    t.string('role', 64).notNullable();
    t.string('capability_key', 96).notNullable();
    t.timestamps(true, true);
    t.unique(['role', 'capability_key']);
    t.index(['role']);
  });

  // --- Unified platform audit trail -------------------------------------
  await knex.schema.createTable('platform_audit_log', (t) => {
    t.increments('id').primary();
    t.integer('actor_faculty_user_id').unsigned().nullable();
    t.string('actor_role', 64).nullable();
    t.string('action', 96).notNullable();
    t.string('resource_type', 64).notNullable();
    t.string('resource_id', 96).nullable();
    t.integer('college_id').unsigned().nullable();
    t.boolean('success').notNullable().defaultTo(true);
    t.json('detail').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['created_at']);
    t.index(['actor_faculty_user_id']);
    t.index(['college_id']);
    t.index(['resource_type']);
  });

  // --- Integration configuration (secrets never serialized) --------------
  await knex.schema.createTable('platform_integrations', (t) => {
    t.increments('id').primary();
    t.string('integration_key', 64).notNullable().unique();
    t.string('name', 128).notNullable();
    t.boolean('configured').notNullable().defaultTo(false);
    // Non-secret config only (host, port, from-address, region, ...).
    t.json('config').nullable();
    // Last 4 chars of the configured secret for recognizability. Never the secret.
    t.string('secret_last4', 8).nullable();
    t.timestamp('secret_rotated_at').nullable();
    t.timestamps(true, true);
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('platform_integrations');
  await knex.schema.dropTableIfExists('platform_audit_log');
  await knex.schema.dropTableIfExists('platform_role_capabilities');
  await knex.schema.dropTableIfExists('platform_capabilities');
  await knex.schema.dropTableIfExists('college_modules');
  await knex.schema.dropTableIfExists('platform_modules');
  await knex.schema.alterTable('colleges', (t) => {
    t.dropColumn('status');
    t.dropColumn('suspended_at');
    t.dropColumn('archived_at');
  });
};
