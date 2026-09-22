exports.up = async function up(knex) {
  const tenant = (t) => t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
  if (!(await knex.schema.hasTable('exam_registration_exceptions'))) await knex.schema.createTable('exam_registration_exceptions', (t) => {
    t.increments('id').primary(); tenant(t); t.integer('registration_id').unsigned().notNullable().references('id').inTable('exam_registrations').onDelete('CASCADE');
    t.string('rule_code', 64).notNullable(); t.json('original_condition').notNullable(); t.text('reason').notNullable(); t.string('decision', 16).notNullable().defaultTo('PENDING');
    t.integer('decided_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL'); t.timestamp('decided_at').nullable(); t.timestamps(true, true);
  });
  if (!(await knex.schema.hasTable('exam_strong_room_records'))) await knex.schema.createTable('exam_strong_room_records', (t) => {
    t.increments('id').primary(); tenant(t); t.integer('exam_id').unsigned().notNullable().references('id').inTable('examinations').onDelete('CASCADE');
    t.integer('exam_subject_id').unsigned().notNullable().references('id').inTable('examination_subjects').onDelete('CASCADE'); t.string('paper_reference', 128).notNullable();
    t.string('packet_reference', 128).notNullable(); t.integer('quantity').unsigned().notNullable(); t.string('seal_status', 24).notNullable(); t.string('storage_reference', 255).nullable();
    t.integer('received_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL'); t.timestamp('received_at').notNullable(); t.string('status', 24).notNullable().defaultTo('RECEIVED'); t.text('remarks').nullable(); t.timestamps(true, true);
    t.unique(['college_id', 'packet_reference'], { indexName: 'exstrong_packet_uq' });
  });
  if (!(await knex.schema.hasTable('exam_custody_events'))) await knex.schema.createTable('exam_custody_events', (t) => {
    t.increments('id').primary(); tenant(t); t.string('resource_type', 32).notNullable(); t.integer('resource_id').unsigned().notNullable(); t.string('action', 24).notNullable();
    t.string('from_custody', 128).nullable(); t.string('to_custody', 128).nullable(); t.integer('quantity').unsigned().nullable(); t.string('reference', 128).nullable();
    t.integer('actor_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL'); t.text('remarks').nullable(); t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['college_id', 'resource_type', 'resource_id'], 'excust_resource_idx');
  });
  if (!(await knex.schema.hasTable('exam_form_a_sessions'))) await knex.schema.createTable('exam_form_a_sessions', (t) => {
    t.increments('id').primary(); tenant(t); t.integer('exam_subject_id').unsigned().notNullable().references('id').inTable('examination_subjects').onDelete('CASCADE');
    t.integer('room_id').unsigned().nullable().references('id').inTable('rooms').onDelete('SET NULL'); t.string('status', 16).notNullable().defaultTo('DRAFT');
    t.integer('frozen_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL'); t.timestamp('frozen_at').nullable(); t.timestamps(true, true);
    t.unique(['exam_subject_id', 'room_id'], { indexName: 'exforma_subject_room_uq' });
  });
  if (!(await knex.schema.hasTable('exam_form_a_records'))) await knex.schema.createTable('exam_form_a_records', (t) => {
    t.increments('id').primary(); tenant(t); t.integer('session_id').unsigned().notNullable().references('id').inTable('exam_form_a_sessions').onDelete('CASCADE');
    t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE'); t.string('status', 24).notNullable(); t.timestamps(true, true);
    t.unique(['session_id', 'student_id'], { indexName: 'exforma_student_uq' });
  });
  if (!(await knex.schema.hasTable('exam_form_a_corrections'))) await knex.schema.createTable('exam_form_a_corrections', (t) => {
    t.increments('id').primary(); tenant(t); t.integer('record_id').unsigned().notNullable().references('id').inTable('exam_form_a_records').onDelete('CASCADE');
    t.string('previous_status', 24).notNullable(); t.string('new_status', 24).notNullable(); t.text('reason').notNullable(); t.integer('corrected_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL'); t.timestamp('created_at').defaultTo(knex.fn.now());
  });
  if (!(await knex.schema.hasTable('exam_mpc_cases'))) await knex.schema.createTable('exam_mpc_cases', (t) => {
    t.increments('id').primary(); tenant(t); t.integer('exam_id').unsigned().notNullable().references('id').inTable('examinations').onDelete('CASCADE'); t.integer('exam_subject_id').unsigned().notNullable().references('id').inTable('examination_subjects').onDelete('CASCADE');
    t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE'); t.integer('room_id').unsigned().nullable().references('id').inTable('rooms').onDelete('SET NULL');
    t.text('invigilator_report').notNullable(); t.text('student_statement').nullable(); t.string('status', 24).notNullable().defaultTo('REPORTED'); t.json('committee').nullable(); t.string('decision', 64).nullable(); t.text('decision_reason').nullable(); t.string('penalty', 128).nullable();
    t.integer('decided_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL'); t.timestamp('decided_at').nullable(); t.timestamps(true, true);
  });
  if (!(await knex.schema.hasTable('exam_mpc_evidence'))) await knex.schema.createTable('exam_mpc_evidence', (t) => {
    t.increments('id').primary(); tenant(t); t.integer('case_id').unsigned().notNullable().references('id').inTable('exam_mpc_cases').onDelete('CASCADE'); t.string('file_reference', 512).notNullable(); t.string('file_hash', 64).notNullable(); t.json('metadata').nullable(); t.integer('uploaded_by').unsigned().nullable(); t.timestamp('created_at').defaultTo(knex.fn.now());
  });
  if (!(await knex.schema.hasTable('exam_answer_book_batches'))) await knex.schema.createTable('exam_answer_book_batches', (t) => {
    t.increments('id').primary(); tenant(t); t.integer('exam_id').unsigned().notNullable().references('id').inTable('examinations').onDelete('CASCADE'); t.string('series', 64).notNullable(); t.string('range_start', 64).nullable(); t.string('range_end', 64).nullable();
    t.integer('received_quantity').unsigned().notNullable(); t.integer('issued_quantity').unsigned().notNullable().defaultTo(0); t.integer('used_quantity').unsigned().notNullable().defaultTo(0); t.integer('unused_quantity').unsigned().notNullable().defaultTo(0); t.integer('damaged_quantity').unsigned().notNullable().defaultTo(0); t.integer('returned_quantity').unsigned().notNullable().defaultTo(0); t.timestamps(true, true);
  });
  if (!(await knex.schema.hasTable('exam_script_batches'))) await knex.schema.createTable('exam_script_batches', (t) => {
    t.increments('id').primary(); tenant(t); t.integer('exam_subject_id').unsigned().notNullable().references('id').inTable('examination_subjects').onDelete('CASCADE'); t.string('reference', 128).notNullable(); t.integer('expected_count').unsigned().notNullable(); t.integer('actual_count').unsigned().notNullable(); t.string('stage', 32).notNullable().defaultTo('VENUE'); t.timestamps(true, true); t.unique(['college_id', 'reference'], { indexName: 'exscript_ref_uq' });
  });
  if (!(await knex.schema.hasTable('exam_valuation_assignments'))) await knex.schema.createTable('exam_valuation_assignments', (t) => {
    t.increments('id').primary(); tenant(t); t.integer('exam_subject_id').unsigned().notNullable().references('id').inTable('examination_subjects').onDelete('CASCADE'); t.integer('script_batch_id').unsigned().notNullable().references('id').inTable('exam_script_batches').onDelete('RESTRICT'); t.integer('examiner_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT'); t.string('status', 16).notNullable().defaultTo('ASSIGNED'); t.json('marks_payload').nullable(); t.integer('assigned_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL'); t.timestamp('submitted_at').nullable(); t.timestamp('locked_at').nullable(); t.timestamps(true, true); t.unique(['script_batch_id', 'examiner_id'], { indexName: 'exval_batch_examiner_uq' });
  });
};
exports.down = async function down(knex) { for (const n of ['exam_valuation_assignments','exam_script_batches','exam_answer_book_batches','exam_mpc_evidence','exam_mpc_cases','exam_form_a_corrections','exam_form_a_records','exam_form_a_sessions','exam_custody_events','exam_strong_room_records','exam_registration_exceptions']) await knex.schema.dropTableIfExists(n); };
