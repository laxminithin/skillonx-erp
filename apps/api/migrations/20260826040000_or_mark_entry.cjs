/**
 * OR mark-entry model for Internal Question Papers.
 *
 * Internal papers are mandatory-OR: each question slot prints two alternatives
 * (Q(A) OR Q(B)) and the student answers exactly one. The mark sheet must carry
 * BOTH alternatives so the attempted one can be recorded and the unchosen one
 * marked NOT_ATTEMPTED_DUE_TO_OR (never zero). This migration adds the OR grouping
 * columns to the mark-question rows so the attempt state can be resolved per slot.
 *
 * The per-mark `status` column already exists on assessment_student_question_marks
 * (varchar 32) and now additionally carries ATTEMPTED / NOT_ATTEMPTED_DUE_TO_OR.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const hasCol = async (table, column) => knex.schema.hasColumn(table, column);

  if (await knex.schema.hasTable('assessment_mark_questions')) {
    if (!(await hasCol('assessment_mark_questions', 'or_group_id'))) {
      await knex.schema.alterTable('assessment_mark_questions', (t) => {
        t.string('or_group_id', 64).nullable();
        t.string('or_alternative', 2).nullable();
        t.integer('question_number').unsigned().nullable();
        t.string('sub_letter', 8).nullable();
        t.index(['sheet_id', 'or_group_id'], 'amq_sheet_orgroup_idx');
      });
    }
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  if (await knex.schema.hasTable('assessment_mark_questions')) {
    const hasCol = await knex.schema.hasColumn('assessment_mark_questions', 'or_group_id');
    if (hasCol) {
      await knex.schema.alterTable('assessment_mark_questions', (t) => {
        t.dropIndex(['sheet_id', 'or_group_id'], 'amq_sheet_orgroup_idx');
        t.dropColumn('or_group_id');
        t.dropColumn('or_alternative');
        t.dropColumn('question_number');
        t.dropColumn('sub_letter');
      });
    }
  }
};
