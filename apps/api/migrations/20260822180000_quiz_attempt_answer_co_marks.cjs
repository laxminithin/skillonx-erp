/**
 * Persist Question→CO + max marks on each quiz attempt answer for CO Performance.
 * Snapshot remains source of truth for historical mapping; these columns enable analytics.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const has = await knex.schema.hasTable('quiz_attempt_answers');
  if (!has) return;
  const hasMax = await knex.schema.hasColumn('quiz_attempt_answers', 'max_marks');
  if (!hasMax) {
    await knex.schema.alterTable('quiz_attempt_answers', (t) => {
      t.decimal('max_marks', 8, 2).nullable();
      t.string('primary_co_code', 32).nullable();
      t.integer('primary_co_id').unsigned().nullable();
      t.index(['primary_co_code']);
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  const has = await knex.schema.hasTable('quiz_attempt_answers');
  if (!has) return;
  const hasMax = await knex.schema.hasColumn('quiz_attempt_answers', 'max_marks');
  if (hasMax) {
    await knex.schema.alterTable('quiz_attempt_answers', (t) => {
      t.dropIndex(['primary_co_code']);
      t.dropColumn('max_marks');
      t.dropColumn('primary_co_code');
      t.dropColumn('primary_co_id');
    });
  }
};
