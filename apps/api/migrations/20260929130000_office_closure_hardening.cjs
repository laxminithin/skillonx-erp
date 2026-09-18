/** Additive Office closure hardening. */
exports.up = async function up(knex) {
  if (await knex.schema.hasTable('student_service_requests') && !(await knex.schema.hasColumn('student_service_requests', 'requester_type'))) {
    await knex.schema.alterTable('student_service_requests', (t) => {
      t.string('requester_type', 16).notNullable().defaultTo('STUDENT');
      t.integer('requester_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('assigned_to_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('assigned_at').nullable();
    });
    await knex.raw('ALTER TABLE student_service_requests MODIFY student_id INT UNSIGNED NULL');
    await knex.schema.alterTable('student_service_requests', (t) => {
      t.index(['college_id', 'requester_type', 'requester_faculty_id'], 'ssr_requester_scope_idx');
      t.index(['college_id', 'assigned_to_faculty_id', 'status'], 'ssr_assignee_status_idx');
    });
  }
  if (!(await knex.schema.hasTable('student_service_request_assignments'))) {
    await knex.schema.createTable('student_service_request_assignments', (t) => {
      t.bigIncrements('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('request_id').unsigned().notNullable().references('id').inTable('student_service_requests').onDelete('CASCADE');
      t.integer('from_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('to_faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.integer('actor_faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.string('reason', 1000).nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'request_id', 'created_at'], 'ssra_request_history_idx');
    });
  }
  if (await knex.schema.hasTable('student_service_documents') && !(await knex.schema.hasColumn('student_service_documents', 'reissued_from_id'))) {
    await knex.schema.alterTable('student_service_documents', (t) => {
      t.integer('reissued_from_id').unsigned().nullable().references('id').inTable('student_service_documents').onDelete('SET NULL');
    });
  }
};
exports.down = async function down(knex) {
  if (await knex.schema.hasTable('student_service_request_assignments')) await knex.schema.dropTable('student_service_request_assignments');
  if (await knex.schema.hasTable('student_service_documents') && await knex.schema.hasColumn('student_service_documents', 'reissued_from_id')) await knex.schema.alterTable('student_service_documents', (t) => t.dropColumn('reissued_from_id'));
};
