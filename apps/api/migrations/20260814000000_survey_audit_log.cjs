/**
 * Lightweight audit trail for survey lifecycle actions — institutional
 * accountability without a full event-sourcing system.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('survey_audit_log', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('survey_id').unsigned().notNullable().references('id').inTable('surveys').onDelete('CASCADE');
    t.integer('actor_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.string('actor_name', 255).nullable();
    t.string('action', 48).notNullable();
    t.json('metadata').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['survey_id', 'created_at']);
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('survey_audit_log');
};
