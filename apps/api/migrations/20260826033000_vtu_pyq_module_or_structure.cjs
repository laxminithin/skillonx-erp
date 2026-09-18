/**
 * VTU PYQ module / OR-pair columns on the master question bank.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const addIfMissing = async (table, col, fn) => {
    if (!(await knex.schema.hasTable(table))) return;
    const has = await knex.schema.hasColumn(table, col);
    if (!has) {
      await knex.schema.alterTable(table, (t) => fn(t));
    }
  };

  await addIfMissing('previous_year_questions', 'or_pair_id', (t) => t.string('or_pair_id', 64).nullable());
  await addIfMissing('previous_year_questions', 'or_alternative', (t) => t.string('or_alternative', 8).nullable());
  await addIfMissing('previous_year_questions', 'module_assignment_method', (t) => t.string('module_assignment_method', 64).nullable());
  await addIfMissing('previous_year_questions', 'main_question_total', (t) => t.decimal('main_question_total', 10, 2).nullable());
  await addIfMissing('previous_year_questions', 'source_verified', (t) => t.boolean('source_verified').notNullable().defaultTo(true));
  await addIfMissing('previous_year_questions', 'readiness_reason', (t) => t.string('readiness_reason', 512).nullable());

  if (await knex.schema.hasTable('previous_year_questions')) {
    if (await knex.schema.hasColumn('previous_year_questions', 'or_pair_id')) {
      await knex('previous_year_questions')
        .whereNull('or_pair_id')
        .whereNotNull('or_group_id')
        .update({
          or_pair_id: knex.raw('or_group_id'),
        });
    }
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  if (!(await knex.schema.hasTable('previous_year_questions'))) return;
  await knex.schema.alterTable('previous_year_questions', (t) => {
    t.dropColumn('or_pair_id');
    t.dropColumn('or_alternative');
    t.dropColumn('module_assignment_method');
    t.dropColumn('main_question_total');
    t.dropColumn('source_verified');
    t.dropColumn('readiness_reason');
  });
};
