/**
 * Campus OS Phase 4 — Security, Gate & Visitor Management (core scope).
 *
 * Per docs/CAMPUS_OS_PHASE4_PREIMPLEMENTATION_AUDIT.md, this adds only the
 * proven gaps: a tenant-scoped Gate/Location master, a generic (non-hostel)
 * Visitor identity + Visit lifecycle, an append-only visit event/movement
 * log, and a general Security Incident register. It does NOT touch or
 * duplicate any frozen module (Hostel, Transport, Stores/Procurement, Asset
 * Management, HR): vendor/contractor identity is referenced via
 * `procurement_vendors` (no second vendor table), hosts are referenced via
 * `faculty_users` / `students` (no new identity table), and evidence is
 * referenced via `campus_documents` (Document Engine, no new file store).
 */
exports.up = async function up(knex) {
  // ── Gate / Location master ──────────────────────────────────────────────
  if (!(await knex.schema.hasTable('security_gates'))) {
    await knex.schema.createTable('security_gates', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('name', 200).notNullable();
      t.string('code', 32).nullable();
      t.string('gate_type', 32).notNullable().defaultTo('GENERAL'); // MAIN | HOSTEL | SERVICE | VEHICLE | GENERAL | OTHER
      t.string('location_note', 255).nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['college_id', 'name'], { indexName: 'secgate_college_name_uq' });
    });
  }

  // ── Visitor identity (generic, independent of Hostel) ───────────────────
  if (!(await knex.schema.hasTable('security_visitors'))) {
    await knex.schema.createTable('security_visitors', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('name', 255).notNullable();
      t.string('phone', 32).nullable();
      t.string('email', 255).nullable();
      t.string('id_type', 32).nullable(); // AADHAAR | DRIVING_LICENSE | VOTER_ID | PASSPORT | OTHER
      t.string('id_reference_masked', 64).nullable();
      t.integer('photo_document_id').unsigned().nullable().references('id').inTable('campus_documents').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id'], 'secvisitor_college_idx');
    });
  }

  // ── Visit lifecycle: REQUESTED -> APPROVED -> CHECKED_IN -> CHECKED_OUT ──
  if (!(await knex.schema.hasTable('security_visits'))) {
    await knex.schema.createTable('security_visits', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('visitor_id').unsigned().notNullable().references('id').inTable('security_visitors').onDelete('CASCADE');
      t.integer('gate_id').unsigned().nullable().references('id').inTable('security_gates').onDelete('SET NULL');
      t.string('visit_type', 16).notNullable().defaultTo('GUEST'); // GUEST | VENDOR | CONTRACTOR | OFFICIAL | OTHER
      t.text('purpose').nullable();
      t.string('host_type', 16).notNullable().defaultTo('FACULTY'); // FACULTY | STUDENT
      t.integer('host_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('host_student_id').unsigned().nullable().references('id').inTable('students').onDelete('SET NULL');
      t.integer('vendor_id').unsigned().nullable().references('id').inTable('procurement_vendors').onDelete('SET NULL');
      t.integer('requested_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('status', 16).notNullable().defaultTo('REQUESTED'); // REQUESTED|APPROVED|REJECTED|CANCELLED|CHECKED_IN|CHECKED_OUT|EXPIRED
      t.integer('approved_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('rejected_reason').nullable();
      t.datetime('expected_entry_at').nullable();
      t.datetime('expected_exit_at').nullable();
      t.datetime('valid_until').nullable();
      t.datetime('entry_at').nullable();
      t.datetime('exit_at').nullable();
      t.text('remarks').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'secvisit_college_status_idx');
      t.index(['college_id', 'visitor_id'], 'secvisit_college_visitor_idx');
      t.index(['college_id', 'gate_id'], 'secvisit_college_gate_idx');
      t.index(['college_id', 'vendor_id'], 'secvisit_college_vendor_idx');
    });
  }

  // ── Append-only visit event / movement history ───────────────────────────
  if (!(await knex.schema.hasTable('security_visit_events'))) {
    await knex.schema.createTable('security_visit_events', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('visit_id').unsigned().notNullable().references('id').inTable('security_visits').onDelete('CASCADE');
      t.string('event_type', 24).notNullable(); // REQUESTED|APPROVED|REJECTED|CANCELLED|CHECKED_IN|CHECKED_OUT|EXPIRED
      t.integer('gate_id').unsigned().nullable().references('id').inTable('security_gates').onDelete('SET NULL');
      t.integer('recorded_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('remarks').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['college_id', 'visit_id'], 'secvisitevt_college_visit_idx');
    });
  }

  // ── General Security Incident log (distinct from hostel/transport ones) ─
  if (!(await knex.schema.hasTable('security_incidents'))) {
    await knex.schema.createTable('security_incidents', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('category', 64).notNullable();
      t.integer('gate_id').unsigned().nullable().references('id').inTable('security_gates').onDelete('SET NULL');
      t.string('location_note', 255).nullable();
      t.integer('reported_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('description').notNullable();
      t.string('severity', 16).notNullable().defaultTo('LOW'); // LOW|MEDIUM|HIGH|CRITICAL
      t.datetime('occurred_at').notNullable();
      t.string('status', 16).notNullable().defaultTo('OPEN'); // OPEN|INVESTIGATING|RESOLVED|CLOSED
      t.integer('evidence_document_id').unsigned().nullable().references('id').inTable('campus_documents').onDelete('SET NULL');
      t.text('resolution_notes').nullable();
      t.integer('resolved_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.datetime('resolved_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'secincident_college_status_idx');
      t.index(['college_id', 'severity'], 'secincident_college_severity_idx');
    });
  }
};

exports.down = async function down(knex) {
  // Drop children before parents to respect FK ordering (see Phase 3's
  // facilities/preventive migration for the same convention).
  if (await knex.schema.hasTable('security_incidents')) {
    await knex.schema.dropTable('security_incidents');
  }
  if (await knex.schema.hasTable('security_visit_events')) {
    await knex.schema.dropTable('security_visit_events');
  }
  if (await knex.schema.hasTable('security_visits')) {
    await knex.schema.dropTable('security_visits');
  }
  if (await knex.schema.hasTable('security_visitors')) {
    await knex.schema.dropTable('security_visitors');
  }
  if (await knex.schema.hasTable('security_gates')) {
    await knex.schema.dropTable('security_gates');
  }
};
