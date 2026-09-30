/**
 * Campus OS Phase 11 — Events, Venue & Institutional Resource Booking, per
 * docs/CAMPUS_OS_PHASE11_PREIMPLEMENTATION_AUDIT.md (Option A, thin
 * orchestration domain).
 *
 * Adds ONLY:
 *   - campus_event_types          configurable event types per college
 *   - campus_bookable_resources   opt-in bookability config over canonical
 *                                 `rooms` / `campus_assets` (no new location
 *                                 hierarchy, no duplicate asset register)
 *   - campus_events               institutional event record + lifecycle
 *   - campus_resource_reservations reservation layer (event-linked or ad-hoc)
 *   - campus_event_registrations  participants + event participation marking
 *                                 (NOT academic attendance)
 *   - campus_events_audit_log     append-only audit
 *
 * Purely additive: no existing table is altered. Venue identity/capacity stays
 * in `rooms`, equipment identity/status stays in `campus_assets`, approval in
 * the Workflow Engine, documents in the Document Engine.
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('campus_event_types'))) {
    await knex.schema.createTable('campus_event_types', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 48).notNullable();
      t.string('name', 128).notNullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.integer('sort_order').notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'cev_type_college_code_uq' });
    });
  }

  if (!(await knex.schema.hasTable('campus_bookable_resources'))) {
    await knex.schema.createTable('campus_bookable_resources', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('resource_kind', 16).notNullable(); // ROOM | ASSET
      t.integer('room_id').unsigned().nullable().references('id').inTable('rooms').onDelete('RESTRICT');
      t.integer('asset_id').unsigned().nullable().references('id').inTable('campus_assets').onDelete('RESTRICT');
      t.boolean('is_active').notNullable().defaultTo(true);
      t.boolean('requires_approval').notNullable().defaultTo(false);
      t.integer('setup_buffer_minutes').unsigned().notNullable().defaultTo(0);
      t.integer('cleanup_buffer_minutes').unsigned().notNullable().defaultTo(0);
      t.string('notes', 500).nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['college_id', 'room_id'], { indexName: 'cbr_college_room_uq' });
      t.unique(['college_id', 'asset_id'], { indexName: 'cbr_college_asset_uq' });
      t.index(['college_id', 'resource_kind', 'is_active'], 'cbr_college_kind_active_idx');
    });
  }

  if (!(await knex.schema.hasTable('campus_events'))) {
    await knex.schema.createTable('campus_events', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('title', 255).notNullable();
      t.string('event_type', 48).notNullable();
      t.text('description').nullable();
      t.text('objective').nullable();
      t.string('organizer_unit_type', 16).notNullable().defaultTo('DEPARTMENT'); // INSTITUTION|DEPARTMENT|CLUB|CELL|COMMITTEE|OTHER
      t.string('organizer_unit_name', 191).nullable();
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('organizer_faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.dateTime('starts_at').notNullable();
      t.dateTime('ends_at').notNullable();
      t.string('external_venue', 255).nullable();
      t.integer('expected_participants').unsigned().nullable();
      t.string('visibility', 16).notNullable().defaultTo('INSTITUTION'); // DEPARTMENT|INSTITUTION
      t.boolean('registration_enabled').notNullable().defaultTo(false);
      t.string('registration_audience', 16).notNullable().defaultTo('ALL'); // STUDENTS|STAFF|ALL
      t.integer('registration_capacity').unsigned().nullable();
      t.dateTime('registration_closes_at').nullable();
      t.boolean('has_external_participants').notNullable().defaultTo(false);
      t.decimal('planned_budget', 14, 2).nullable(); // context only — Finance owns money
      t.string('status', 24).notNullable().defaultTo('DRAFT');
      t.integer('workflow_instance_id').unsigned().nullable();
      t.string('workflow_code', 64).nullable();
      t.text('review_remarks').nullable(); // internal — never exposed to participant views
      t.text('last_scheduling_error').nullable();
      t.boolean('capacity_override').notNullable().defaultTo(false);
      t.string('capacity_override_reason', 500).nullable();
      t.integer('capacity_override_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('outcome_summary').nullable();
      t.integer('actual_participants').unsigned().nullable();
      t.timestamp('submitted_at').nullable();
      t.timestamp('approved_at').nullable();
      t.timestamp('scheduled_at').nullable();
      t.timestamp('completed_at').nullable();
      t.timestamp('closed_at').nullable();
      t.integer('closed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('cancelled_at').nullable();
      t.integer('cancelled_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('cancellation_reason', 500).nullable();
      t.integer('reschedule_count').unsigned().notNullable().defaultTo(0);
      t.integer('created_by').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.timestamps(true, true);
      t.index(['college_id', 'status', 'starts_at'], 'cev_college_status_start_idx');
      t.index(['college_id', 'starts_at'], 'cev_college_start_idx');
      t.index(['college_id', 'department_id', 'starts_at'], 'cev_college_dept_start_idx');
      t.index(['college_id', 'organizer_faculty_id'], 'cev_college_organizer_idx');
    });
  }

  if (!(await knex.schema.hasTable('campus_resource_reservations'))) {
    await knex.schema.createTable('campus_resource_reservations', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('resource_id').unsigned().notNullable().references('id').inTable('campus_bookable_resources').onDelete('RESTRICT');
      t.integer('event_id').unsigned().nullable().references('id').inTable('campus_events').onDelete('RESTRICT');
      t.string('purpose', 255).nullable();
      t.dateTime('starts_at').notNullable();
      t.dateTime('ends_at').notNullable();
      // Buffer-expanded window actually used for overlap checks.
      t.dateTime('block_starts_at').notNullable();
      t.dateTime('block_ends_at').notNullable();
      t.string('status', 16).notNullable().defaultTo('REQUESTED'); // REQUESTED|CONFIRMED|REJECTED|CANCELLED
      t.string('idempotency_key', 96).nullable();
      t.integer('requested_by').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.integer('decided_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('decided_at').nullable();
      t.string('decision_remarks', 500).nullable();
      t.timestamp('cancelled_at').nullable();
      t.integer('cancelled_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['college_id', 'idempotency_key'], { indexName: 'crr_college_idem_uq' });
      t.unique(['event_id', 'resource_id'], { indexName: 'crr_event_resource_uq' });
      t.index(['resource_id', 'status', 'block_starts_at', 'block_ends_at'], 'crr_resource_status_window_idx');
      t.index(['college_id', 'status', 'starts_at'], 'crr_college_status_start_idx');
      t.index(['college_id', 'requested_by'], 'crr_college_requester_idx');
    });
  }

  if (!(await knex.schema.hasTable('campus_event_registrations'))) {
    await knex.schema.createTable('campus_event_registrations', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('event_id').unsigned().notNullable().references('id').inTable('campus_events').onDelete('CASCADE');
      t.string('participant_type', 16).notNullable(); // STUDENT|STAFF|EXTERNAL
      t.integer('student_id').unsigned().nullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('faculty_user_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      t.string('external_name', 191).nullable();
      t.string('external_email', 191).nullable();
      t.string('external_organization', 191).nullable();
      t.string('status', 16).notNullable().defaultTo('REGISTERED'); // REGISTERED|CANCELLED
      t.string('attendance_status', 16).notNullable().defaultTo('NOT_MARKED'); // NOT_MARKED|ATTENDED|ABSENT
      t.timestamp('attendance_marked_at').nullable();
      t.integer('attendance_marked_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('registered_via', 16).notNullable().defaultTo('SELF'); // SELF|ORGANIZER
      t.timestamp('registered_at').notNullable().defaultTo(knex.fn.now());
      t.timestamp('cancelled_at').nullable();
      t.timestamps(true, true);
      t.unique(['event_id', 'student_id'], { indexName: 'cereg_event_student_uq' });
      t.unique(['event_id', 'faculty_user_id'], { indexName: 'cereg_event_faculty_uq' });
      t.index(['college_id', 'event_id', 'status'], 'cereg_college_event_status_idx');
      t.index(['student_id', 'status'], 'cereg_student_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('campus_events_audit_log'))) {
    await knex.schema.createTable('campus_events_audit_log', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('actor_type', 16).notNullable().defaultTo('FACULTY'); // FACULTY|STUDENT|SYSTEM
      t.integer('actor_id').unsigned().nullable();
      t.string('action', 96).notNullable();
      t.string('entity_type', 64).notNullable();
      t.integer('entity_id').unsigned().nullable();
      t.json('before_state').nullable();
      t.json('after_state').nullable();
      t.text('reason').nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'entity_type', 'entity_id'], 'cev_audit_entity_idx');
      t.index(['college_id', 'action', 'created_at'], 'cev_audit_action_idx');
    });
  }
};

exports.down = async function down(knex) {
  // Children before parents.
  await knex.schema.dropTableIfExists('campus_events_audit_log');
  await knex.schema.dropTableIfExists('campus_event_registrations');
  await knex.schema.dropTableIfExists('campus_resource_reservations');
  await knex.schema.dropTableIfExists('campus_events');
  await knex.schema.dropTableIfExists('campus_bookable_resources');
  await knex.schema.dropTableIfExists('campus_event_types');
};
