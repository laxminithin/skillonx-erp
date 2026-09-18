/**
 * Tighten identity constraints for production:
 *   - faculty email is globally unique (login resolves by email alone, so a
 *     duplicate across colleges would make sign-in ambiguous).
 *   - employee_id is unique within an institution (multiple NULLs allowed).
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  // Normalize existing values so the new constraints apply to clean data.
  await knex('faculty_users').update({
    email: knex.raw('LOWER(TRIM(email))'),
  });
  await knex('faculty_users')
    .whereNotNull('employee_id')
    .update({ employee_id: knex.raw('TRIM(employee_id)') });
  await knex('faculty_users').where('employee_id', '').update({ employee_id: null });

  await knex.schema.alterTable('faculty_users', (t) => {
    t.unique(['email'], { indexName: 'faculty_users_email_global_unique' });
    t.unique(['college_id', 'employee_id'], {
      indexName: 'faculty_users_college_employee_unique',
    });
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.alterTable('faculty_users', (t) => {
    t.dropUnique(['email'], 'faculty_users_email_global_unique');
    t.dropUnique(['college_id', 'employee_id'], 'faculty_users_college_employee_unique');
  });
};
