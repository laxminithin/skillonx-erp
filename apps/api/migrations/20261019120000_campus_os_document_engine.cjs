/**
 * Campus OS Phase 0 — shared Document / Evidence storage engine.
 *
 * Metadata table only; bytes live on local disk under apps/api/uploads/campus-os-documents,
 * following the one storage convention that already exists in this repo
 * (apps/api/src/modules/studentServices/attachmentAccess.ts). No existing attachment
 * table (grievance/maintenance/student-services/etc.) is touched or migrated here.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('campus_documents'))) {
    await knex.schema.createTable('campus_documents', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('entity_type', 96).notNullable();
      t.integer('entity_id').unsigned().notNullable();
      t.string('category', 96).notNullable();
      t.string('original_filename', 255).notNullable();
      t.string('storage_key', 191).notNullable();
      t.string('mime_type', 128).notNullable();
      t.integer('size_bytes').unsigned().notNullable();
      t.string('checksum_sha256', 64).notNullable();
      t.string('status', 32).notNullable().defaultTo('ACTIVE');
      t.integer('version').unsigned().notNullable().defaultTo(1);
      t.integer('document_group_id').unsigned().nullable();
      t.integer('superseded_by_id').unsigned().nullable().references('id').inTable('campus_documents').onDelete('SET NULL');
      t.text('description').nullable();
      t.date('expiry_date').nullable();
      t.integer('uploaded_by_faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.timestamps(true, true);
      t.unique(['storage_key'], { indexName: 'campus_documents_storage_key_unique' });
      t.index(['college_id', 'entity_type', 'entity_id'], 'campus_documents_entity_idx');
      t.index(['college_id', 'document_group_id'], 'campus_documents_group_idx');
      t.index(['college_id', 'status'], 'campus_documents_status_idx');
    });
  }
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('campus_documents');
};
