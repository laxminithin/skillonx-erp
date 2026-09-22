/**
 * APPROVED CROSS-MODULE CHANGE: Examination remuneration -> Finance receiver.
 * Examination owns the duty/calculation/approval; Finance owns the payable posting.
 * Finance is NOT reopened for general development — this is the minimum governed receiver.
 */
exports.up = async function up(knex) {
  const tenant = (t) =>
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');

  // Examination-owned approved remuneration obligation (source of truth for amount).
  if (!(await knex.schema.hasTable('exam_remuneration_items'))) {
    await knex.schema.createTable('exam_remuneration_items', (t) => {
      t.increments('id').primary();
      tenant(t);
      t.string('source_type', 24).notNullable(); // INVIGILATION | VALUATION | EXAMINER
      t.integer('source_reference_id').unsigned().notNullable(); // duty / assignment id
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('RESTRICT');
      t.integer('quantity').unsigned().notNullable().defaultTo(1);
      t.decimal('rate', 14, 2).notNullable();
      t.decimal('amount', 14, 2).notNullable(); // server-computed = quantity * rate
      t.string('currency', 8).notNullable().defaultTo('INR');
      t.string('description', 255).nullable();
      t.string('status', 16).notNullable().defaultTo('CALCULATED'); // CALCULATED | APPROVED | HANDED_OFF | REVERSED
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('approved_at').nullable();
      t.integer('finance_posting_id').unsigned().nullable();
      t.timestamps(true, true);
      // one obligation per distinct duty (§8): different duties stay distinct, same duty cannot duplicate
      t.unique(['college_id', 'source_type', 'source_reference_id'], { indexName: 'exremun_source_uq' });
      t.index(['college_id', 'status'], 'exremun_college_status_idx');
    });
  }

  // Finance-owned receiver posting (idempotent on the remuneration obligation).
  if (!(await knex.schema.hasTable('finance_exam_remuneration_postings'))) {
    await knex.schema.createTable('finance_exam_remuneration_postings', (t) => {
      t.increments('id').primary();
      tenant(t);
      t.integer('remuneration_item_id').unsigned().notNullable().references('id').inTable('exam_remuneration_items').onDelete('RESTRICT');
      t.string('posting_number', 64).notNullable();
      t.string('status', 16).notNullable().defaultTo('POSTED'); // POSTED | REVERSED
      t.decimal('debit_total', 14, 2).notNullable().defaultTo(0);
      t.decimal('credit_total', 14, 2).notNullable().defaultTo(0);
      t.integer('posted_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('posted_at').nullable();
      t.text('reason').nullable();
      t.timestamps(true, true);
      t.unique(['remuneration_item_id'], { indexName: 'ferp_item_uq' }); // idempotency key (§7)
      t.unique(['posting_number'], { indexName: 'ferp_number_uq' });
      t.index(['college_id', 'status'], 'ferp_college_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('finance_exam_remuneration_posting_lines'))) {
    await knex.schema.createTable('finance_exam_remuneration_posting_lines', (t) => {
      t.increments('id').primary();
      t.integer('posting_id').unsigned().notNullable().references('id').inTable('finance_exam_remuneration_postings').onDelete('CASCADE');
      tenant(t);
      t.integer('account_id').unsigned().notNullable().references('id').inTable('finance_gl_accounts').onDelete('RESTRICT');
      t.string('side', 8).notNullable(); // DEBIT | CREDIT
      t.decimal('amount', 14, 2).notNullable();
      t.string('line_key', 64).notNullable();
      t.string('description', 255).nullable();
      t.timestamps(true, true);
      t.index(['posting_id'], 'ferpl_posting_idx');
    });
  }
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('finance_exam_remuneration_posting_lines');
  await knex.schema.dropTableIfExists('finance_exam_remuneration_postings');
  await knex.schema.dropTableIfExists('exam_remuneration_items');
};
