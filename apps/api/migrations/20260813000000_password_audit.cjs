/**
 * Track when a faculty/admin account last changed its password so the profile
 * Security tab can surface "Last password change".
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable('faculty_users', (t) => {
    t.timestamp('last_password_change_at').nullable();
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.alterTable('faculty_users', (t) => {
    t.dropColumn('last_password_change_at');
  });
};
