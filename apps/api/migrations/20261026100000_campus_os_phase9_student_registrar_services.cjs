/**
 * Campus OS Phase 9 — Student Services, Registrar Services & Academic
 * Record Requests. Per docs/CAMPUS_OS_PHASE9_PREIMPLEMENTATION_AUDIT.md
 * (Architecture Decision: Option B — minimal, additive generalization of
 * the existing `studentServices` engine). This migration adds ONLY:
 *
 * - `students.date_of_birth` — DOB is not a currently-correctable field
 *   (`profileCorrection.ts` had NAME/EMAIL/PHONE/SECTION only).
 * - `student_service_documents.duplicate_of_id` /
 *   `.duplicate_reason` — a "duplicate of a still-valid original"
 *   request needs a distinct linkage from the existing
 *   `reissued_from_id` (which only applies to a REVOKED original).
 *
 * No new tables, no new module, no touched frozen-domain data.
 */
exports.up = async function up(knex) {
  if (await knex.schema.hasTable('students') && !(await knex.schema.hasColumn('students', 'date_of_birth'))) {
    await knex.schema.alterTable('students', (t) => {
      t.date('date_of_birth').nullable();
    });
  }

  if (
    await knex.schema.hasTable('student_service_documents') &&
    !(await knex.schema.hasColumn('student_service_documents', 'duplicate_of_id'))
  ) {
    await knex.schema.alterTable('student_service_documents', (t) => {
      t.integer('duplicate_of_id').unsigned().nullable().references('id').inTable('student_service_documents').onDelete('SET NULL');
      t.text('duplicate_reason').nullable();
    });
  }
};

exports.down = async function down(knex) {
  if (
    await knex.schema.hasTable('student_service_documents') &&
    await knex.schema.hasColumn('student_service_documents', 'duplicate_of_id')
  ) {
    await knex.schema.alterTable('student_service_documents', (t) => {
      t.dropForeign('duplicate_of_id');
    });
    await knex.schema.alterTable('student_service_documents', (t) => {
      t.dropColumn('duplicate_of_id');
      t.dropColumn('duplicate_reason');
    });
  }
  if (await knex.schema.hasTable('students') && await knex.schema.hasColumn('students', 'date_of_birth')) {
    await knex.schema.alterTable('students', (t) => {
      t.dropColumn('date_of_birth');
    });
  }
};
