/** Governed VTU imports and autonomous examination registration. */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('exam_import_batches'))) {
    await knex.schema.createTable('exam_import_batches', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('exam_id').unsigned().nullable().references('id').inTable('examinations').onDelete('SET NULL');
      t.string('artifact_type', 32).notNullable();
      t.string('source', 32).notNullable().defaultTo('VTU');
      t.string('authority', 32).notNullable().defaultTo('EXTERNAL_UNIVERSITY');
      t.string('academic_year', 32).nullable();
      t.string('semester', 32).nullable();
      t.string('exam_cycle', 64).nullable();
      t.string('file_name', 255).notNullable();
      t.string('file_hash', 64).notNullable();
      t.string('validation_state', 24).notNullable().defaultTo('PENDING');
      t.string('reconciliation_state', 24).notNullable().defaultTo('PENDING');
      t.integer('version').unsigned().notNullable().defaultTo(1);
      t.integer('imported_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('committed_at').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'artifact_type', 'file_hash'], { indexName: 'eximp_college_type_hash_uq' });
      t.index(['college_id', 'artifact_type', 'created_at'], 'eximp_lookup_idx');
    });
  }
  if (!(await knex.schema.hasTable('exam_import_rows'))) {
    await knex.schema.createTable('exam_import_rows', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('batch_id').unsigned().notNullable().references('id').inTable('exam_import_batches').onDelete('CASCADE');
      t.integer('row_number').unsigned().notNullable();
      t.json('original_row').notNullable();
      t.string('status', 16).notNullable();
      t.json('issues').nullable();
      t.integer('student_id').unsigned().nullable().references('id').inTable('students').onDelete('SET NULL');
      t.integer('course_id').unsigned().nullable().references('id').inTable('courses').onDelete('SET NULL');
      t.integer('exam_subject_id').unsigned().nullable().references('id').inTable('examination_subjects').onDelete('SET NULL');
      t.string('external_reference', 128).nullable();
      t.json('normalized_data').nullable();
      t.timestamp('reconciled_at').nullable();
      t.timestamps(true, true);
      t.unique(['batch_id', 'row_number'], { indexName: 'eximprow_batch_row_uq' });
      t.index(['college_id', 'status'], 'eximprow_college_status_idx');
    });
  }
  if (!(await knex.schema.hasTable('exam_registration_windows'))) {
    await knex.schema.createTable('exam_registration_windows', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('exam_id').unsigned().notNullable().references('id').inTable('examinations').onDelete('CASCADE');
      t.string('status', 16).notNullable().defaultTo('DRAFT');
      t.timestamp('opens_at').nullable();
      t.timestamp('closes_at').nullable();
      t.timestamp('frozen_at').nullable();
      t.integer('frozen_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('reopen_reason').nullable();
      t.integer('reopened_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('reopened_at').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'exam_id'], { indexName: 'exregwin_college_exam_uq' });
    });
  }
  if (!(await knex.schema.hasTable('exam_registrations'))) {
    await knex.schema.createTable('exam_registrations', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('window_id').unsigned().notNullable().references('id').inTable('exam_registration_windows').onDelete('CASCADE');
      t.integer('exam_id').unsigned().notNullable().references('id').inTable('examinations').onDelete('CASCADE');
      t.integer('exam_subject_id').unsigned().notNullable().references('id').inTable('examination_subjects').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.string('attempt_type', 24).notNullable().defaultTo('REGULAR');
      t.string('status', 16).notNullable().defaultTo('SUBMITTED');
      t.string('source', 24).notNullable().defaultTo('INSTITUTION');
      t.integer('verified_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('exception_reason').nullable();
      t.timestamps(true, true);
      t.unique(['exam_subject_id', 'student_id', 'attempt_type'], { indexName: 'exreg_subject_student_attempt_uq' });
      t.index(['college_id', 'exam_id', 'status'], 'exreg_lookup_idx');
    });
  }
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('exam_registrations');
  await knex.schema.dropTableIfExists('exam_registration_windows');
  await knex.schema.dropTableIfExists('exam_import_rows');
  await knex.schema.dropTableIfExists('exam_import_batches');
};
