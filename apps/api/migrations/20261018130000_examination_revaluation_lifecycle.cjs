exports.up = async function up(knex) {
  const add = async (col, fn) => {
    if (!(await knex.schema.hasColumn('exam_revaluation_requests', col))) {
      await knex.schema.alterTable('exam_revaluation_requests', fn);
    }
  };
  await add('reviewed_by', (t) => t.integer('reviewed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL'));
  await add('reviewed_at', (t) => t.timestamp('reviewed_at').nullable());
  await add('examiner_id', (t) => t.integer('examiner_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL'));
  await add('assigned_at', (t) => t.timestamp('assigned_at').nullable());
  await add('revised_marks', (t) => t.decimal('revised_marks', 6, 2).nullable());
  await add('revised_max', (t) => t.decimal('revised_max', 6, 2).nullable());
  await add('revaluated_at', (t) => t.timestamp('revaluated_at').nullable());
  await add('decision', (t) => t.string('decision', 24).nullable()); // REVISED | UNCHANGED
  await add('decision_reason', (t) => t.text('decision_reason').nullable());
  await add('new_semester_result_id', (t) => t.integer('new_semester_result_id').unsigned().nullable());
  await add('completed_at', (t) => t.timestamp('completed_at').nullable());
};

exports.down = async function down(knex) {
  // reviewed_by / examiner_id carry FK constraints (added in up()) — drop those first,
  // or MySQL refuses to drop the column ("needed in a foreign key constraint").
  for (const fkCol of ['reviewed_by', 'examiner_id']) {
    if (await knex.schema.hasColumn('exam_revaluation_requests', fkCol)) {
      await knex.schema.alterTable('exam_revaluation_requests', (t) => t.dropForeign(fkCol));
    }
  }
  for (const col of [
    'reviewed_by', 'reviewed_at', 'examiner_id', 'assigned_at', 'revised_marks', 'revised_max',
    'revaluated_at', 'decision', 'decision_reason', 'new_semester_result_id', 'completed_at',
  ]) {
    if (await knex.schema.hasColumn('exam_revaluation_requests', col)) {
      await knex.schema.alterTable('exam_revaluation_requests', (t) => t.dropColumn(col));
    }
  }
};
