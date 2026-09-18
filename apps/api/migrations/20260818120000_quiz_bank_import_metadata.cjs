/**
 * Question-bank import metadata, longer option text, and difficulty/status
 * vocabulary used by the academic quiz generator.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable('quiz_bank_questions', (t) => {
    t.string('source_file', 512).nullable();
    t.string('source_reference', 64).nullable();
    t.string('original_module', 255).nullable();
    t.string('original_difficulty', 64).nullable();
    t.string('import_batch', 64).nullable();
    t.string('duplicate_group', 64).nullable();
    t.index(['college_id', 'import_batch']);
    t.index(['college_id', 'duplicate_group']);
  });

  await knex.raw('ALTER TABLE quiz_bank_options MODIFY label TEXT NOT NULL');
  await knex.raw('ALTER TABLE quiz_question_options MODIFY label TEXT NOT NULL');

  await knex('quiz_bank_questions').where({ review_status: 'READY' }).update({ review_status: 'APPROVED' });
  await knex('quiz_bank_questions').whereIn('difficulty', ['MEDIUM', 'MODERATE']).update({
    difficulty: 'INTERMEDIATE',
  });
  await knex('quiz_bank_questions').whereIn('difficulty', ['HARD', 'ADVANCED']).update({
    difficulty: 'DIFFICULT',
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex('quiz_bank_questions').where({ review_status: 'APPROVED' }).update({ review_status: 'READY' });
  await knex('quiz_bank_questions').where({ difficulty: 'INTERMEDIATE' }).update({ difficulty: 'MEDIUM' });
  await knex('quiz_bank_questions').where({ difficulty: 'DIFFICULT' }).update({ difficulty: 'HARD' });

  await knex.schema.alterTable('quiz_bank_questions', (t) => {
    t.dropIndex(['college_id', 'import_batch']);
    t.dropIndex(['college_id', 'duplicate_group']);
    t.dropColumn('source_file');
    t.dropColumn('source_reference');
    t.dropColumn('original_module');
    t.dropColumn('original_difficulty');
    t.dropColumn('import_batch');
    t.dropColumn('duplicate_group');
  });
};
