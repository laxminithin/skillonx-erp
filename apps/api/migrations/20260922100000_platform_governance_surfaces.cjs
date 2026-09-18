/**
 * Super Admin & Platform Governance — remaining freeze surfaces.
 * Feature flags, master templates + immutable tenant adoption snapshots,
 * platform announcements + tenant targeting, typed tenant settings, and safe
 * tenant branding. All platform-owned; no operational/domain data copied.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  // --- Feature flags (global + tenant override) --------------------------
  await knex.schema.createTable('platform_feature_flags', (t) => {
    t.increments('id').primary();
    t.string('flag_key', 96).notNullable().unique();
    t.string('description', 256).notNullable();
    t.boolean('enabled').notNullable().defaultTo(false); // global default
    t.string('rollout', 32).notNullable().defaultTo('OFF'); // OFF | PARTIAL | ON
    t.timestamps(true, true);
  });
  await knex.schema.createTable('college_feature_flags', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.string('flag_key', 96).notNullable();
    t.boolean('enabled').notNullable();
    t.timestamps(true, true);
    t.unique(['college_id', 'flag_key']);
  });

  // --- Master templates + immutable adoption snapshots -------------------
  await knex.schema.createTable('platform_master_templates', (t) => {
    t.increments('id').primary();
    t.string('domain', 32).notNullable(); // academic | hr | finance | campus | career
    t.string('template_key', 96).notNullable();
    t.string('name', 160).notNullable();
    t.integer('version').notNullable().defaultTo(1);
    t.json('payload').notNullable();
    t.string('status', 16).notNullable().defaultTo('ACTIVE'); // ACTIVE | DEPRECATED
    t.timestamps(true, true);
    t.unique(['template_key', 'version']);
    t.index(['domain']);
  });
  await knex.schema.createTable('tenant_adopted_masters', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.string('template_key', 96).notNullable();
    t.integer('template_version').notNullable();
    // Immutable copy-on-adopt snapshot; never mutated when the template changes.
    t.json('snapshot').notNullable();
    t.integer('adopted_by_faculty_user_id').unsigned().nullable();
    t.timestamp('adopted_at').notNullable().defaultTo(knex.fn.now());
    t.unique(['college_id', 'template_key']);
    t.index(['college_id']);
  });

  // --- Platform announcements + tenant targeting -------------------------
  await knex.schema.createTable('platform_announcements', (t) => {
    t.increments('id').primary();
    t.string('title', 200).notNullable();
    t.text('message').notNullable();
    t.string('audience', 16).notNullable().defaultTo('ALL'); // ALL | SELECTED
    t.string('severity', 16).notNullable().defaultTo('INFO'); // INFO | WARNING | CRITICAL
    t.string('status', 16).notNullable().defaultTo('DRAFT'); // DRAFT | PUBLISHED | EXPIRED
    t.timestamp('publish_at').nullable();
    t.timestamp('expiry_at').nullable();
    t.integer('created_by_faculty_user_id').unsigned().nullable();
    t.timestamps(true, true);
    t.index(['status']);
  });
  await knex.schema.createTable('platform_announcement_targets', (t) => {
    t.increments('id').primary();
    t.integer('announcement_id').unsigned().notNullable().references('id').inTable('platform_announcements').onDelete('CASCADE');
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.unique(['announcement_id', 'college_id']);
  });

  // --- Typed tenant settings --------------------------------------------
  await knex.schema.createTable('college_settings', (t) => {
    t.integer('college_id').unsigned().primary().references('id').inTable('colleges').onDelete('CASCADE');
    t.string('locale', 16).notNullable().defaultTo('en-IN');
    t.string('date_format', 24).notNullable().defaultTo('DD-MM-YYYY');
    t.string('employee_id_prefix', 16).nullable();
    t.string('receipt_prefix', 16).nullable();
    t.boolean('notify_email_enabled').notNullable().defaultTo(true);
    t.boolean('notify_sms_enabled').notNullable().defaultTo(false);
    t.timestamps(true, true);
  });

  // --- Safe tenant branding (plain strings only; never rendered as HTML) --
  await knex.schema.createTable('college_branding', (t) => {
    t.integer('college_id').unsigned().primary().references('id').inTable('colleges').onDelete('CASCADE');
    t.string('display_name', 200).nullable();
    t.string('short_name', 64).nullable();
    t.string('logo_url', 512).nullable();
    t.string('report_header', 200).nullable();
    t.string('portal_title', 120).nullable();
    t.string('accent_color', 9).nullable(); // #RRGGBB validated at service layer
    t.timestamps(true, true);
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('college_branding');
  await knex.schema.dropTableIfExists('college_settings');
  await knex.schema.dropTableIfExists('platform_announcement_targets');
  await knex.schema.dropTableIfExists('platform_announcements');
  await knex.schema.dropTableIfExists('tenant_adopted_masters');
  await knex.schema.dropTableIfExists('platform_master_templates');
  await knex.schema.dropTableIfExists('college_feature_flags');
  await knex.schema.dropTableIfExists('platform_feature_flags');
};
