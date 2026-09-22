exports.up = async function up(knex) {
  const tenant = (t) =>
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');

  // Append-only MPC lifecycle transition timeline (§16 Timeline).
  if (!(await knex.schema.hasTable('exam_mpc_transitions'))) {
    await knex.schema.createTable('exam_mpc_transitions', (t) => {
      t.increments('id').primary();
      tenant(t);
      t
        .integer('case_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('exam_mpc_cases')
        .onDelete('CASCADE');
      t.string('from_status', 24).nullable();
      t.string('to_status', 24).notNullable();
      t.text('note').nullable();
      t
        .integer('actor_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('faculty_users')
        .onDelete('SET NULL');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['college_id', 'case_id'], 'exmpctr_case_idx');
    });
  }

  // Governed result consequence linkage — MPC never overwrites a published result directly (§17).
  if (!(await knex.schema.hasTable('exam_mpc_result_actions'))) {
    await knex.schema.createTable('exam_mpc_result_actions', (t) => {
      t.increments('id').primary();
      tenant(t);
      t
        .integer('case_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('exam_mpc_cases')
        .onDelete('CASCADE');
      t.string('action_type', 32).notNullable(); // RESULT_WITHHELD|RESULT_INVALIDATED|SUBJECT_CANCELLED|NO_ACTION
      t.string('result_reference', 128).nullable();
      t.string('result_version', 32).nullable();
      t.text('note').nullable();
      t
        .integer('actor_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('faculty_users')
        .onDelete('SET NULL');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['college_id', 'case_id'], 'exmpcra_case_idx');
    });
  }

  // Private storage reference + governance columns for evidence access control (§15).
  if (!(await knex.schema.hasColumn('exam_mpc_evidence', 'storage_key'))) {
    await knex.schema.alterTable('exam_mpc_evidence', (t) => {
      t.string('storage_key', 128).nullable(); // opaque server-side key; never a public URL
      t.string('content_type', 128).nullable();
      t.string('description', 255).nullable();
    });
  }
};

exports.down = async function down(knex) {
  for (const col of ['storage_key', 'content_type', 'description']) {
    if (await knex.schema.hasColumn('exam_mpc_evidence', col)) {
      await knex.schema.alterTable('exam_mpc_evidence', (t) => t.dropColumn(col));
    }
  }
  await knex.schema.dropTableIfExists('exam_mpc_result_actions');
  await knex.schema.dropTableIfExists('exam_mpc_transitions');
};
