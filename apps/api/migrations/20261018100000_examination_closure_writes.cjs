exports.up = async function up(knex) {
  const tenant = (t) =>
    t
      .integer('college_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('colleges')
      .onDelete('CASCADE');

  // --- Answer-book movement ledger (append-only) ---
  if (!(await knex.schema.hasTable('exam_answer_book_movements'))) {
    await knex.schema.createTable('exam_answer_book_movements', (t) => {
      t.increments('id').primary();
      tenant(t);
      t
        .integer('batch_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('exam_answer_book_batches')
        .onDelete('CASCADE');
      t.string('movement_type', 24).notNullable(); // RECEIVED|ISSUED|USED|UNUSED|DAMAGED|RETURNED
      t.integer('quantity').unsigned().notNullable();
      t.string('range_start', 64).nullable();
      t.string('range_end', 64).nullable();
      t.string('from_holder', 128).nullable();
      t.string('to_holder', 128).nullable();
      t
        .integer('actor_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('faculty_users')
        .onDelete('SET NULL');
      t.text('remarks').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['college_id', 'batch_id'], 'exabmv_batch_idx');
    });
  }

  // --- Answer-book variance investigation columns ---
  await knex.schema.alterTable('exam_answer_book_batches', (t) => {
    t.string('reconciliation_status', 16).notNullable().defaultTo('OPEN'); // OPEN|CLOSED
    t.string('variance_status', 16).notNullable().defaultTo('NONE'); // NONE|UNRESOLVED|RESOLVED
    t.text('variance_reason').nullable();
    t.text('investigation_note').nullable();
    t.text('resolution').nullable();
    t
      .integer('resolved_by')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('faculty_users')
      .onDelete('SET NULL');
    t.timestamp('resolved_at').nullable();
  });

  // --- Script transfer / acknowledgement ledger ---
  if (!(await knex.schema.hasTable('exam_script_transfers'))) {
    await knex.schema.createTable('exam_script_transfers', (t) => {
      t.increments('id').primary();
      tenant(t);
      t
        .integer('script_batch_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('exam_script_batches')
        .onDelete('CASCADE');
      t.string('from_holder', 128).notNullable();
      t.string('to_holder', 128).notNullable();
      t
        .integer('sender_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('faculty_users')
        .onDelete('SET NULL');
      t.integer('expected_count').unsigned().notNullable();
      t.timestamp('sent_at').notNullable();
      t
        .integer('receiver_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('faculty_users')
        .onDelete('SET NULL');
      t.integer('received_count').unsigned().nullable();
      t.timestamp('acknowledged_at').nullable();
      t.integer('variance').notNullable().defaultTo(0);
      t.string('status', 16).notNullable().defaultTo('SENT'); // SENT|ACKNOWLEDGED
      t.string('variance_status', 16).notNullable().defaultTo('NONE'); // NONE|UNRESOLVED|RESOLVED
      t.text('variance_reason').nullable();
      t.text('resolution').nullable();
      t
        .integer('resolved_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('faculty_users')
        .onDelete('SET NULL');
      t.timestamp('resolved_at').nullable();
      t.text('remarks').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'script_batch_id'], 'exstx_batch_idx');
    });
  }

  // --- Question-wise valuation authoritative totals ---
  await knex.schema.alterTable('exam_valuation_assignments', (t) => {
    t.integer('total_marks').nullable();
    t.integer('max_marks').nullable();
  });

  // --- Governed valuation correction history (post-lock) ---
  if (!(await knex.schema.hasTable('exam_valuation_corrections'))) {
    await knex.schema.createTable('exam_valuation_corrections', (t) => {
      t.increments('id').primary();
      tenant(t);
      t
        .integer('assignment_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('exam_valuation_assignments')
        .onDelete('CASCADE');
      t.string('question_ref', 64).notNullable();
      t.integer('old_marks').nullable();
      t.integer('new_marks').notNullable();
      t.integer('old_total').nullable();
      t.integer('new_total').notNullable();
      t.text('reason').notNullable();
      t
        .integer('requested_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('faculty_users')
        .onDelete('SET NULL');
      t
        .integer('approved_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('faculty_users')
        .onDelete('SET NULL');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['college_id', 'assignment_id'], 'exvalcorr_assignment_idx');
    });
  }
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('exam_valuation_corrections');
  if (await knex.schema.hasColumn('exam_valuation_assignments', 'total_marks')) {
    await knex.schema.alterTable('exam_valuation_assignments', (t) => {
      t.dropColumn('total_marks');
      t.dropColumn('max_marks');
    });
  }
  await knex.schema.dropTableIfExists('exam_script_transfers');
  for (const col of [
    'reconciliation_status',
    'variance_status',
    'variance_reason',
    'investigation_note',
    'resolution',
    'resolved_by',
    'resolved_at',
  ]) {
    if (await knex.schema.hasColumn('exam_answer_book_batches', col)) {
      await knex.schema.alterTable('exam_answer_book_batches', (t) => t.dropColumn(col));
    }
  }
  await knex.schema.dropTableIfExists('exam_answer_book_movements');
};
