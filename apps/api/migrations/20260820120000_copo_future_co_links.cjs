/**
 * Optional CO / Bloom columns for future question and lesson-plan linkage.
 * Does not assign values; existing question and lesson data stay unchanged.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if ((await knex.schema.hasTable('quiz_bank_questions')) && !(await knex.schema.hasColumn('quiz_bank_questions', 'course_outcome_id'))) {
    await knex.schema.alterTable('quiz_bank_questions', (t) => {
      t.integer('course_outcome_id').unsigned().nullable().references('id').inTable('course_outcomes').onDelete('SET NULL');
      t.string('blooms_level', 8).nullable();
    });
  }
  if ((await knex.schema.hasTable('lesson_topics')) && !(await knex.schema.hasColumn('lesson_topics', 'course_outcome_id'))) {
    await knex.schema.alterTable('lesson_topics', (t) => {
      t.integer('course_outcome_id').unsigned().nullable().references('id').inTable('course_outcomes').onDelete('SET NULL');
    });
  }
  if ((await knex.schema.hasTable('lesson_subtopics')) && !(await knex.schema.hasColumn('lesson_subtopics', 'course_outcome_id'))) {
    await knex.schema.alterTable('lesson_subtopics', (t) => {
      t.integer('course_outcome_id').unsigned().nullable().references('id').inTable('course_outcomes').onDelete('SET NULL');
    });
  }
};

exports.down = async function down(knex) {
  if (await knex.schema.hasColumn('quiz_bank_questions', 'course_outcome_id')) {
    await knex.schema.alterTable('quiz_bank_questions', (t) => {
      t.dropForeign(['course_outcome_id']);
      t.dropColumn('course_outcome_id');
      t.dropColumn('blooms_level');
    });
  }
  if (await knex.schema.hasColumn('lesson_topics', 'course_outcome_id')) {
    await knex.schema.alterTable('lesson_topics', (t) => {
      t.dropForeign(['course_outcome_id']);
      t.dropColumn('course_outcome_id');
    });
  }
  if (await knex.schema.hasColumn('lesson_subtopics', 'course_outcome_id')) {
    await knex.schema.alterTable('lesson_subtopics', (t) => {
      t.dropForeign(['course_outcome_id']);
      t.dropColumn('course_outcome_id');
    });
  }
};
