/**
 * Admissions notifications: applicant-facing channel.
 *
 * Reuses the platform's established per-audience notification architecture
 * (employee_notifications for staff, student_notifications for students,
 * hr_candidate_notifications for external HR candidates). Admission applicants
 * are external parties (not yet students), so they get the analogous table
 * keyed by applicant_id. Staff-facing admissions notifications reuse
 * employee_notifications; converted students reuse student_notifications.
 * Finance remains canonical for financial receipt/transaction notifications.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (
    (await knex.schema.hasTable('admission_applicants')) &&
    !(await knex.schema.hasTable('admission_applicant_notifications'))
  ) {
    await knex.schema.createTable('admission_applicant_notifications', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('applicant_id').unsigned().notNullable().references('id').inTable('admission_applicants').onDelete('CASCADE');
      t.string('type', 64).notNullable();
      t.string('title', 255).notNullable();
      t.text('body').nullable();
      t.string('link', 500).nullable();
      t.string('related_type', 64).nullable();
      t.integer('related_id').unsigned().nullable();
      t.string('dedupe_key', 128).nullable();
      t.timestamp('read_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'applicant_id', 'read_at'], 'adm_notif_college_app_read_idx');
      t.unique(['applicant_id', 'dedupe_key'], { indexName: 'adm_notif_app_dedupe_unique' });
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('admission_applicant_notifications');
};
