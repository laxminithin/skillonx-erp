exports.up = async function up(knex) {
  // Versioned result correction: a corrected V2 supersedes V1; V1 is retained as history (§28).
  if (!(await knex.schema.hasColumn('semester_results', 'superseded_at'))) {
    await knex.schema.alterTable('semester_results', (t) => {
      t.timestamp('superseded_at').nullable(); // null = current version
      t.integer('superseded_by_id').unsigned().nullable();
    });
  }

  if (!(await knex.schema.hasTable('exam_result_corrections'))) {
    await knex.schema.createTable('exam_result_corrections', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('base_semester_result_id').unsigned().notNullable().references('id').inTable('semester_results').onDelete('CASCADE');
      t.integer('new_semester_result_id').unsigned().notNullable().references('id').inTable('semester_results').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('exam_id').unsigned().notNullable().references('id').inTable('examinations').onDelete('CASCADE');
      t.integer('from_version').unsigned().notNullable();
      t.integer('to_version').unsigned().notNullable();
      t.json('changes').notNullable();
      t.text('reason').notNullable();
      t.integer('requested_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['college_id', 'student_id', 'exam_id'], 'exrescorr_student_exam_idx');
    });
  }
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('exam_result_corrections');
  for (const col of ['superseded_at', 'superseded_by_id']) {
    if (await knex.schema.hasColumn('semester_results', col)) {
      await knex.schema.alterTable('semester_results', (t) => t.dropColumn(col));
    }
  }
};
