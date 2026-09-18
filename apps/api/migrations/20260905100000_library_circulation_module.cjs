/**
 * Library Circulation domain — catalog, copies, membership, loans, reservations, fines.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  // ── Borrowing policies ───────────────────────────────────────────────
  if (!(await knex.schema.hasTable('library_borrowing_policies'))) {
    await knex.schema.createTable('library_borrowing_policies', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('member_type', 16).notNullable();
      t.integer('program_id').unsigned().nullable().references('id').inTable('programs').onDelete('SET NULL');
      t.integer('max_active_loans').unsigned().notNullable().defaultTo(4);
      t.integer('loan_days').unsigned().notNullable().defaultTo(14);
      t.integer('max_renewals').unsigned().notNullable().defaultTo(2);
      t.decimal('fine_per_day', 10, 2).notNullable().defaultTo(5);
      t.integer('grace_days').unsigned().notNullable().defaultTo(0);
      t.integer('reservation_limit').unsigned().notNullable().defaultTo(3);
      t.boolean('renewal_allowed').notNullable().defaultTo(true);
      t.decimal('fine_cap', 10, 2).nullable();
      t.boolean('block_issue_on_fine').notNullable().defaultTo(false);
      t.integer('pickup_hold_days').unsigned().notNullable().defaultTo(3);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.index(['college_id', 'member_type', 'is_active'], 'lbp_college_type_active_idx');
    });
  }

  // ── Catalog (bibliographic titles) ───────────────────────────────────
  if (!(await knex.schema.hasTable('library_catalog_items'))) {
    await knex.schema.createTable('library_catalog_items', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('title', 512).notNullable();
      t.string('isbn', 32).nullable();
      t.text('authors').nullable();
      t.string('publisher', 255).nullable();
      t.string('edition', 64).nullable();
      t.integer('publication_year').unsigned().nullable();
      t.text('subjects').nullable();
      t.string('call_number', 64).nullable();
      t.text('description').nullable();
      t.string('default_location', 128).nullable();
      t.string('digital_link', 512).nullable();
      t.integer('course_textbook_id').unsigned().nullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'lci_college_status_idx');
      t.index(['college_id', 'isbn'], 'lci_college_isbn_idx');
      t.index(['college_id', 'title'], 'lci_college_title_idx');
    });
  }

  // ── Physical copies / accessions ─────────────────────────────────────
  if (!(await knex.schema.hasTable('library_copies'))) {
    await knex.schema.createTable('library_copies', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('catalog_item_id').unsigned().notNullable().references('id').inTable('library_catalog_items').onDelete('RESTRICT');
      t.string('accession_number', 64).notNullable();
      t.string('barcode', 64).notNullable();
      t.string('location', 128).nullable();
      t.string('shelf', 64).nullable();
      t.string('status', 16).notNullable().defaultTo('AVAILABLE');
      t.timestamp('last_verified_at').nullable();
      t.text('notes').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'accession_number'], { indexName: 'lc_college_accession_unique' });
      t.unique(['college_id', 'barcode'], { indexName: 'lc_college_barcode_unique' });
      t.index(['college_id', 'catalog_item_id', 'status'], 'lc_college_catalog_status_idx');
      t.index(['college_id', 'status'], 'lc_college_status_idx');
    });
  }

  // ── Members ──────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('library_members'))) {
    await knex.schema.createTable('library_members', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('member_type', 16).notNullable();
      t.integer('student_id').unsigned().nullable().references('id').inTable('students').onDelete('SET NULL');
      t.integer('faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('membership_number', 64).notNullable();
      t.string('card_token', 64).notNullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.timestamp('joined_at').notNullable().defaultTo(knex.fn.now());
      t.timestamp('expires_at').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'membership_number'], { indexName: 'lm_college_number_unique' });
      t.unique(['college_id', 'card_token'], { indexName: 'lm_college_card_unique' });
      t.index(['college_id', 'student_id'], 'lm_college_student_idx');
      t.index(['college_id', 'faculty_id'], 'lm_college_faculty_idx');
      t.index(['college_id', 'status'], 'lm_college_status_idx');
    });
  }

  // ── Reservations ─────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('library_reservations'))) {
    await knex.schema.createTable('library_reservations', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('member_id').unsigned().notNullable().references('id').inTable('library_members').onDelete('CASCADE');
      t.integer('catalog_item_id').unsigned().notNullable().references('id').inTable('library_catalog_items').onDelete('CASCADE');
      t.integer('copy_id').unsigned().nullable().references('id').inTable('library_copies').onDelete('SET NULL');
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.integer('queue_position').unsigned().notNullable().defaultTo(1);
      t.timestamp('requested_at').notNullable().defaultTo(knex.fn.now());
      t.timestamp('expires_at').nullable();
      t.timestamp('fulfilled_at').nullable();
      t.timestamp('ready_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'catalog_item_id', 'status', 'queue_position'], 'lr_catalog_queue_idx');
      t.index(['college_id', 'member_id', 'status'], 'lr_member_status_idx');
    });
  }

  // ── Loans ────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('library_loans'))) {
    await knex.schema.createTable('library_loans', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('member_id').unsigned().notNullable().references('id').inTable('library_members').onDelete('RESTRICT');
      t.integer('copy_id').unsigned().notNullable().references('id').inTable('library_copies').onDelete('RESTRICT');
      t.integer('catalog_item_id').unsigned().notNullable().references('id').inTable('library_catalog_items').onDelete('RESTRICT');
      t.timestamp('issued_at').notNullable().defaultTo(knex.fn.now());
      t.timestamp('due_at').notNullable();
      t.timestamp('returned_at').nullable();
      t.integer('renewal_count').unsigned().notNullable().defaultTo(0);
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.integer('issued_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('returned_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('reservation_id').unsigned().nullable().references('id').inTable('library_reservations').onDelete('SET NULL');
      t.text('remarks').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'member_id', 'status'], 'll_member_status_idx');
      t.index(['college_id', 'copy_id', 'status'], 'll_copy_status_idx');
      t.index(['college_id', 'due_at', 'status'], 'll_due_status_idx');
      t.index(['college_id', 'status'], 'll_college_status_idx');
    });
  }

  // ── Fines ────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('library_fines'))) {
    await knex.schema.createTable('library_fines', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('member_id').unsigned().notNullable().references('id').inTable('library_members').onDelete('CASCADE');
      t.integer('loan_id').unsigned().nullable().references('id').inTable('library_loans').onDelete('SET NULL');
      t.string('fine_type', 16).notNullable();
      t.decimal('amount', 10, 2).notNullable();
      t.decimal('waived_amount', 10, 2).notNullable().defaultTo(0);
      t.decimal('paid_amount', 10, 2).notNullable().defaultTo(0);
      t.decimal('outstanding_amount', 10, 2).notNullable();
      t.string('status', 16).notNullable().defaultTo('DUE');
      t.integer('finance_demand_id').unsigned().nullable();
      t.text('remarks').nullable();
      t.integer('assessed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'member_id', 'status'], 'lf_member_status_idx');
      t.index(['college_id', 'status'], 'lf_college_status_idx');
    });
  }

  // ── Lost / damaged events ────────────────────────────────────────────
  if (!(await knex.schema.hasTable('library_damage_events'))) {
    await knex.schema.createTable('library_damage_events', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('loan_id').unsigned().notNullable().references('id').inTable('library_loans').onDelete('CASCADE');
      t.integer('copy_id').unsigned().notNullable().references('id').inTable('library_copies').onDelete('CASCADE');
      t.string('event_type', 16).notNullable();
      t.string('severity', 16).nullable();
      t.text('assessment').nullable();
      t.text('remarks').nullable();
      t.decimal('charge_amount', 10, 2).nullable();
      t.integer('fine_id').unsigned().nullable().references('id').inTable('library_fines').onDelete('SET NULL');
      t.integer('assessed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('replacement_isbn', 32).nullable();
      t.string('replacement_accession', 64).nullable();
      t.integer('accepted_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('accepted_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'loan_id'], 'lde_loan_idx');
    });
  }

  // ── Inventory sessions ───────────────────────────────────────────────
  if (!(await knex.schema.hasTable('library_inventory_sessions'))) {
    await knex.schema.createTable('library_inventory_sessions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('name', 255).notNullable();
      t.string('status', 16).notNullable().defaultTo('OPEN');
      t.integer('started_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('started_at').notNullable().defaultTo(knex.fn.now());
      t.timestamp('closed_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'lis_college_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('library_inventory_scans'))) {
    await knex.schema.createTable('library_inventory_scans', (t) => {
      t.increments('id').primary();
      t.integer('session_id').unsigned().notNullable().references('id').inTable('library_inventory_sessions').onDelete('CASCADE');
      t.integer('copy_id').unsigned().nullable().references('id').inTable('library_copies').onDelete('SET NULL');
      t.string('barcode', 64).nullable();
      t.string('scan_status', 16).notNullable();
      t.text('remarks').nullable();
      t.integer('scanned_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('scanned_at').notNullable().defaultTo(knex.fn.now());
      t.index(['session_id', 'copy_id'], 'lisc_session_copy_idx');
    });
  }

  // ── Audit log ────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('library_audit_log'))) {
    await knex.schema.createTable('library_audit_log', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('actor_id').unsigned().nullable();
      t.string('actor_type', 16).notNullable().defaultTo('FACULTY');
      t.string('action', 64).notNullable();
      t.string('entity_type', 64).notNullable();
      t.integer('entity_id').unsigned().nullable();
      t.json('before_state').nullable();
      t.json('after_state').nullable();
      t.text('reason').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['college_id', 'entity_type', 'entity_id'], 'lal_entity_idx');
      t.index(['college_id', 'created_at'], 'lal_college_time_idx');
    });
  }
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('library_inventory_scans');
  await knex.schema.dropTableIfExists('library_inventory_sessions');
  await knex.schema.dropTableIfExists('library_damage_events');
  await knex.schema.dropTableIfExists('library_fines');
  await knex.schema.dropTableIfExists('library_loans');
  await knex.schema.dropTableIfExists('library_reservations');
  await knex.schema.dropTableIfExists('library_copies');
  await knex.schema.dropTableIfExists('library_members');
  await knex.schema.dropTableIfExists('library_catalog_items');
  await knex.schema.dropTableIfExists('library_borrowing_policies');
  await knex.schema.dropTableIfExists('library_audit_log');
};
