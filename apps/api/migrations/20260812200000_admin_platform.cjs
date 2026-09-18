/**
 * Admin portal + faculty profile fields for multi-institution management.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable('colleges', (t) => {
    t.string('address', 512).nullable();
    t.string('logo_url', 512).nullable();
    t.boolean('is_active').notNullable().defaultTo(true);
  });

  await knex.schema.alterTable('faculty_users', (t) => {
    t.string('employee_id', 64).nullable();
    t.string('phone', 32).nullable();
    t.string('designation', 128).nullable();
    t.json('permissions').nullable();
    t.timestamp('last_login_at').nullable();
    t.timestamp('archived_at').nullable();
  });

  await knex.schema.createTable('programs', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
    t.string('name', 255).notNullable();
    t.string('code', 64).notNullable();
    t.timestamps(true, true);
    t.unique(['college_id', 'code']);
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('programs');

  await knex.schema.alterTable('faculty_users', (t) => {
    t.dropColumn('employee_id');
    t.dropColumn('phone');
    t.dropColumn('designation');
    t.dropColumn('permissions');
    t.dropColumn('last_login_at');
    t.dropColumn('archived_at');
  });

  await knex.schema.alterTable('colleges', (t) => {
    t.dropColumn('address');
    t.dropColumn('logo_url');
    t.dropColumn('is_active');
  });
};
