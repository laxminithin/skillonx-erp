/**
 * Assignment evaluation marks + solution release policy.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const hasAssignments = await knex.schema.hasTable('assignments');
  if (hasAssignments) {
    const hasNumber = await knex.schema.hasColumn('assignments', 'assignment_number');
    if (!hasNumber) {
      await knex.schema.alterTable('assignments', (t) => {
        t.string('assignment_number', 64).nullable();
        t.string('solution_release_policy', 32).notNullable().defaultTo('MANUAL_RELEASE');
        t.timestamp('solutions_released_at').nullable();
      });
    }
  }

  const hasAnswers = await knex.schema.hasTable('assignment_answers');
  if (hasAnswers) {
    const hasScheme = await knex.schema.hasColumn('assignment_answers', 'scheme_marks');
    if (!hasScheme) {
      await knex.schema.alterTable('assignment_answers', (t) => {
        t.json('scheme_marks').nullable();
      });
    }
  }

  const hasSubs = await knex.schema.hasTable('assignment_submissions');
  if (hasSubs) {
    const hasFeedback = await knex.schema.hasColumn('assignment_submissions', 'overall_feedback');
    if (!hasFeedback) {
      await knex.schema.alterTable('assignment_submissions', (t) => {
        t.text('overall_feedback').nullable();
      });
    }
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  if (await knex.schema.hasTable('assignment_submissions')) {
    if (await knex.schema.hasColumn('assignment_submissions', 'overall_feedback')) {
      await knex.schema.alterTable('assignment_submissions', (t) => t.dropColumn('overall_feedback'));
    }
  }
  if (await knex.schema.hasTable('assignment_answers')) {
    if (await knex.schema.hasColumn('assignment_answers', 'scheme_marks')) {
      await knex.schema.alterTable('assignment_answers', (t) => t.dropColumn('scheme_marks'));
    }
  }
  if (await knex.schema.hasTable('assignments')) {
    for (const col of ['assignment_number', 'solution_release_policy', 'solutions_released_at']) {
      if (await knex.schema.hasColumn('assignments', col)) {
        await knex.schema.alterTable('assignments', (t) => t.dropColumn(col));
      }
    }
  }
};
