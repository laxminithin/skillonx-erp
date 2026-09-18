/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable('colleges', (t) => {
    t.string('timezone', 64).notNullable().defaultTo('Asia/Kolkata');
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.alterTable('colleges', (t) => {
    t.dropColumn('timezone');
  });
};
