/** Add immutable state evidence for Office correspondence registers. */
exports.up = async function up(knex) {
  if (await knex.schema.hasTable('student_service_documents') && !(await knex.schema.hasColumn('student_service_documents', 'issue_key'))) {
    await knex.schema.alterTable('student_service_documents', (t) => {
      t.string('issue_key', 96).nullable().unique('ssd_issue_key_unique');
    });
    await knex('student_service_documents').where('status', 'VALID').whereNotNull('request_id').update({ issue_key: knex.raw("CONCAT('request:', request_id)") });
  }
  if (!(await knex.schema.hasTable('student_service_number_sequences'))) {
    await knex.schema.createTable('student_service_number_sequences', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('year').notNullable();
      t.integer('last_number').notNullable().defaultTo(0);
      t.unique(['college_id', 'year'], { indexName: 'ssns_college_year_unique' });
    });
  }
  if (!(await knex.schema.hasTable('office_register_events'))) {
    await knex.schema.createTable('office_register_events', (t) => {
      t.bigIncrements('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.enum('register_type', ['INWARD', 'OUTWARD']).notNullable();
      t.integer('register_id').unsigned().notNullable();
      t.string('from_state', 32).nullable();
      t.string('to_state', 32).notNullable();
      t.integer('actor_faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'register_type', 'register_id', 'created_at'], 'ore_register_history_idx');
    });
  }
};

exports.down = async function down(knex) {
  if (await knex.schema.hasTable('office_register_events')) await knex.schema.dropTable('office_register_events');
};
