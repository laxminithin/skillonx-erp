/**
 * Additive grievance-case attachment table for the canonical grievance engine.
 * Keeps request attachments untouched and stores only grievance-specific file
 * metadata keyed to student_grievances.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('student_grievance_attachments'))) {
    await knex.schema.createTable('student_grievance_attachments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('grievance_id').unsigned().notNullable().references('id').inTable('student_grievances').onDelete('CASCADE');
      t.string('file_name', 255).notNullable();
      t.string('mime_type', 128).notNullable();
      t.integer('file_size').notNullable();
      t.string('storage_key', 512).notNullable();
      t.string('visibility', 16).notNullable().defaultTo('CASE');
      t.integer('uploaded_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('uploaded_by_student_id').unsigned().nullable().references('id').inTable('students').onDelete('SET NULL');
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'grievance_id'], 'sgatt_college_case_idx');
      t.index(['grievance_id', 'visibility'], 'sgatt_case_visibility_idx');
    });
  }
};

exports.down = async function down(knex) {
  if (await knex.schema.hasTable('student_grievance_attachments')) {
    await knex.schema.dropTable('student_grievance_attachments');
  }
};
