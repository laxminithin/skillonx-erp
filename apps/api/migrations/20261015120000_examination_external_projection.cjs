exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('exam_external_records'))) {
    await knex.schema.createTable('exam_external_records', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('batch_id').unsigned().notNullable().references('id').inTable('exam_import_batches').onDelete('RESTRICT');
      t.integer('import_row_id').unsigned().notNullable().references('id').inTable('exam_import_rows').onDelete('RESTRICT');
      t.integer('exam_id').unsigned().nullable().references('id').inTable('examinations').onDelete('SET NULL');
      t.string('artifact_type', 32).notNullable();
      t.string('natural_key', 255).notNullable();
      t.string('authority', 32).notNullable().defaultTo('EXTERNAL_UNIVERSITY');
      t.string('source', 16).notNullable().defaultTo('VTU');
      t.integer('version').unsigned().notNullable();
      t.string('change_type', 16).notNullable();
      t.json('payload').notNullable();
      t.boolean('is_current').notNullable().defaultTo(true);
      t.integer('supersedes_id').unsigned().nullable().references('id').inTable('exam_external_records').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['college_id', 'artifact_type', 'natural_key', 'version'], { indexName: 'exext_key_version_uq' });
      t.index(['college_id', 'artifact_type', 'is_current'], 'exext_current_idx');
    });
  }
};
exports.down = async function down(knex) { await knex.schema.dropTableIfExists('exam_external_records'); };
