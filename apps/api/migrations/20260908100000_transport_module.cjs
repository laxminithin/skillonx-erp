/**
 * Transport Management domain — integrated with Finance, Student Services, RBAC.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  // ── College transport policies ──────────────────────────────────────────
  if (!(await knex.schema.hasTable('college_transport_policies'))) {
    await knex.schema.createTable('college_transport_policies', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.boolean('application_required').notNullable().defaultTo(true);
      t.boolean('approval_required').notNullable().defaultTo(true);
      t.string('assignment_payment_policy', 32).notNullable().defaultTo('PAY_BEFORE_ASSIGNMENT');
      t.boolean('allow_route_preference').notNullable().defaultTo(true);
      t.boolean('allow_stop_change').notNullable().defaultTo(true);
      t.boolean('allow_route_change').notNullable().defaultTo(true);
      t.boolean('change_approval_required').notNullable().defaultTo(true);
      t.boolean('allow_temporary_stop_change').notNullable().defaultTo(true);
      t.boolean('allow_one_way_service').notNullable().defaultTo(true);
      t.boolean('transport_pass_required').notNullable().defaultTo(true);
      t.boolean('boarding_tracking_enabled').notNullable().defaultTo(true);
      t.boolean('driver_panel_enabled').notNullable().defaultTo(true);
      t.boolean('conductor_panel_enabled').notNullable().defaultTo(true);
      t.boolean('vehicle_capacity_enforced').notNullable().defaultTo(true);
      t.boolean('clearance_required').notNullable().defaultTo(true);
      t.string('refund_policy', 32).notNullable().defaultTo('POLICY_BASED');
      t.string('cancellation_policy', 32).notNullable().defaultTo('APPROVAL_REQUIRED');
      t.boolean('academic_exit_auto_cancel').notNullable().defaultTo(true);
      t.json('notification_preferences').nullable();
      t.timestamps(true, true);
      t.unique(['college_id'], { indexName: 'ctp_college_unique' });
    });
  }

  // ── Transport zones ─────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_zones'))) {
    await knex.schema.createTable('transport_zones', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 32).notNullable();
      t.string('name', 128).notNullable();
      t.text('description').nullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'tz_college_code_unique' });
      t.index(['college_id', 'status'], 'tz_college_status_idx');
    });
  }

  // ── Transport stops ─────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_stops'))) {
    await knex.schema.createTable('transport_stops', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 32).notNullable();
      t.string('name', 255).notNullable();
      t.string('landmark', 255).nullable();
      t.text('address').nullable();
      t.decimal('latitude', 10, 7).nullable();
      t.decimal('longitude', 10, 7).nullable();
      t.integer('zone_id').unsigned().nullable().references('id').inTable('transport_zones').onDelete('SET NULL');
      t.string('status', 24).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'ts_college_code_unique' });
      t.index(['college_id', 'status'], 'ts_college_status_idx');
    });
  }

  // ── Transport routes ────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_routes'))) {
    await knex.schema.createTable('transport_routes', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 32).notNullable();
      t.string('name', 255).notNullable();
      t.string('origin', 255).notNullable();
      t.string('destination', 255).notNullable();
      t.string('direction_type', 32).notNullable().defaultTo('BIDIRECTIONAL');
      t.decimal('estimated_distance', 10, 2).nullable();
      t.integer('estimated_duration').unsigned().nullable();
      t.string('status', 16).notNullable().defaultTo('DRAFT');
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'tr_college_code_unique' });
      t.index(['college_id', 'status'], 'tr_college_status_idx');
    });
  }

  // ── Route stops ─────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_route_stops'))) {
    await knex.schema.createTable('transport_route_stops', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('route_id').unsigned().notNullable().references('id').inTable('transport_routes').onDelete('CASCADE');
      t.integer('stop_id').unsigned().notNullable().references('id').inTable('transport_stops').onDelete('RESTRICT');
      t.integer('sequence_number').unsigned().notNullable();
      t.string('scheduled_pickup_time', 8).nullable();
      t.string('scheduled_drop_time', 8).nullable();
      t.decimal('distance_from_origin', 10, 2).nullable();
      t.boolean('boarding_allowed').notNullable().defaultTo(true);
      t.boolean('alighting_allowed').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['route_id', 'sequence_number'], { indexName: 'trs_route_seq_unique' });
      t.unique(['route_id', 'stop_id'], { indexName: 'trs_route_stop_unique' });
      t.index(['college_id', 'route_id'], 'trs_college_route_idx');
    });
  }

  // ── Application cycles ──────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_application_cycles'))) {
    await knex.schema.createTable('transport_application_cycles', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.string('name', 255).notNullable();
      t.timestamp('opens_at').notNullable();
      t.timestamp('closes_at').notNullable();
      t.timestamp('effective_from').nullable();
      t.timestamp('effective_to').nullable();
      t.json('eligible_programs').nullable();
      t.json('eligible_semesters').nullable();
      t.string('status', 16).notNullable().defaultTo('DRAFT');
      t.timestamps(true, true);
      t.index(['college_id', 'academic_year_id', 'status'], 'tac_college_year_status_idx');
    });
  }

  // ── Applications ──────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_applications'))) {
    await knex.schema.createTable('transport_applications', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('application_cycle_id').unsigned().notNullable().references('id').inTable('transport_application_cycles').onDelete('RESTRICT');
      t.string('application_number', 64).notNullable();
      t.integer('pickup_stop_preference_id').unsigned().nullable().references('id').inTable('transport_stops').onDelete('SET NULL');
      t.integer('drop_stop_preference_id').unsigned().nullable().references('id').inTable('transport_stops').onDelete('SET NULL');
      t.integer('preferred_route_id').unsigned().nullable().references('id').inTable('transport_routes').onDelete('SET NULL');
      t.string('service_type', 16).notNullable().defaultTo('TWO_WAY');
      t.string('transport_period', 64).nullable();
      t.text('special_requirement').nullable();
      t.string('emergency_contact_name', 255).nullable();
      t.string('emergency_contact_phone', 32).nullable();
      t.boolean('rules_accepted').notNullable().defaultTo(false);
      t.boolean('declaration_accepted').notNullable().defaultTo(false);
      t.string('status', 16).notNullable().defaultTo('DRAFT');
      t.timestamp('submitted_at').nullable();
      t.integer('reviewed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('reviewed_at').nullable();
      t.text('rejection_reason').nullable();
      t.integer('finance_demand_id').unsigned().nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'application_number'], { indexName: 'ta_college_number_unique' });
      t.index(['college_id', 'student_id', 'status'], 'ta_college_student_status_idx');
      t.index(['college_id', 'application_cycle_id', 'status'], 'ta_college_cycle_status_idx');
    });
  }

  // ── Waitlist ────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_waitlist_entries'))) {
    await knex.schema.createTable('transport_waitlist_entries', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('application_id').unsigned().notNullable().references('id').inTable('transport_applications').onDelete('CASCADE');
      t.integer('route_id').unsigned().nullable().references('id').inTable('transport_routes').onDelete('SET NULL');
      t.integer('stop_id').unsigned().nullable().references('id').inTable('transport_stops').onDelete('SET NULL');
      t.integer('priority').notNullable().defaultTo(0);
      t.integer('position').unsigned().notNullable().defaultTo(1);
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.index(['college_id', 'route_id', 'status', 'position'], 'twe_route_queue_idx');
      t.index(['college_id', 'application_id'], 'twe_application_idx');
    });
  }

  // ── Vehicles ────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_vehicles'))) {
    await knex.schema.createTable('transport_vehicles', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('vehicle_number', 32).notNullable();
      t.string('internal_code', 32).nullable();
      t.string('vehicle_type', 16).notNullable().defaultTo('BUS');
      t.string('manufacturer', 128).nullable();
      t.string('model', 128).nullable();
      t.integer('year').unsigned().nullable();
      t.integer('seating_capacity').unsigned().notNullable();
      t.integer('standing_capacity').unsigned().nullable();
      t.integer('total_capacity').unsigned().notNullable();
      t.date('registration_expiry').nullable();
      t.date('insurance_expiry').nullable();
      t.date('fitness_expiry').nullable();
      t.date('permit_expiry').nullable();
      t.date('pollution_expiry').nullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.string('operational_status', 24).notNullable().defaultTo('AVAILABLE');
      t.timestamps(true, true);
      t.unique(['college_id', 'vehicle_number'], { indexName: 'tv_college_number_unique' });
      t.index(['college_id', 'status'], 'tv_college_status_idx');
    });
  }

  // ── Vehicle documents (metadata only) ───────────────────────────────────
  if (!(await knex.schema.hasTable('transport_vehicle_documents'))) {
    await knex.schema.createTable('transport_vehicle_documents', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('vehicle_id').unsigned().notNullable().references('id').inTable('transport_vehicles').onDelete('CASCADE');
      t.string('document_type', 32).notNullable();
      t.string('reference', 512).nullable();
      t.date('expiry_date').nullable();
      t.string('status', 16).notNullable().defaultTo('VALID');
      t.timestamps(true, true);
      t.index(['college_id', 'vehicle_id', 'document_type'], 'tvd_vehicle_type_idx');
    });
  }

  // ── Personnel ───────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_personnel'))) {
    await knex.schema.createTable('transport_personnel', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_reference').unsigned().nullable();
      t.string('name', 255).notNullable();
      t.string('phone', 32).nullable();
      t.string('personnel_type', 24).notNullable().defaultTo('DRIVER');
      t.string('license_number', 64).nullable();
      t.date('license_expiry').nullable();
      t.integer('faculty_user_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.index(['college_id', 'personnel_type', 'status'], 'tp_college_type_status_idx');
    });
  }

  // ── Route vehicle assignments ───────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_route_vehicle_assignments'))) {
    await knex.schema.createTable('transport_route_vehicle_assignments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('route_id').unsigned().notNullable().references('id').inTable('transport_routes').onDelete('CASCADE');
      t.integer('vehicle_id').unsigned().notNullable().references('id').inTable('transport_vehicles').onDelete('RESTRICT');
      t.string('shift_type', 32).nullable();
      t.timestamp('effective_from').notNullable().defaultTo(knex.fn.now());
      t.timestamp('effective_to').nullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.index(['college_id', 'route_id', 'status'], 'trva_route_status_idx');
      t.index(['college_id', 'vehicle_id', 'status'], 'trva_vehicle_status_idx');
    });
  }

  // ── Staff assignments ───────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_staff_assignments'))) {
    await knex.schema.createTable('transport_staff_assignments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('route_id').unsigned().nullable().references('id').inTable('transport_routes').onDelete('SET NULL');
      t.integer('vehicle_id').unsigned().nullable().references('id').inTable('transport_vehicles').onDelete('SET NULL');
      t.integer('trip_id').unsigned().nullable();
      t.integer('personnel_id').unsigned().notNullable().references('id').inTable('transport_personnel').onDelete('RESTRICT');
      t.string('role', 16).notNullable();
      t.timestamp('effective_from').notNullable().defaultTo(knex.fn.now());
      t.timestamp('effective_to').nullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.index(['college_id', 'personnel_id', 'status'], 'tsa_personnel_status_idx');
      t.index(['college_id', 'route_id', 'status'], 'tsa_route_status_idx');
    });
  }

  // ── Fee plans ───────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_fee_plans'))) {
    await knex.schema.createTable('transport_fee_plans', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.integer('route_id').unsigned().nullable().references('id').inTable('transport_routes').onDelete('SET NULL');
      t.integer('zone_id').unsigned().nullable().references('id').inTable('transport_zones').onDelete('SET NULL');
      t.integer('stop_id').unsigned().nullable().references('id').inTable('transport_stops').onDelete('SET NULL');
      t.string('service_type', 16).notNullable().defaultTo('TWO_WAY');
      t.string('fee_head_code', 64).notNullable().defaultTo('TRANSPORT_FEE');
      t.decimal('amount', 12, 2).notNullable();
      t.string('billing_frequency', 32).notNullable().defaultTo('ANNUAL');
      t.timestamp('effective_from').nullable();
      t.timestamp('effective_to').nullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.index(['college_id', 'academic_year_id', 'status'], 'tfp_college_year_status_idx');
    });
  }

  // ── Transport members ───────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_members'))) {
    await knex.schema.createTable('transport_members', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.integer('application_id').unsigned().nullable().references('id').inTable('transport_applications').onDelete('SET NULL');
      t.string('member_number', 64).notNullable();
      t.string('status', 24).notNullable().defaultTo('PENDING');
      t.timestamp('activated_at').nullable();
      t.timestamp('deactivated_at').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'member_number'], { indexName: 'tm_college_number_unique' });
      t.index(['college_id', 'student_id', 'status'], 'tm_college_student_status_idx');
    });
  }

  // ── Student transport assignments ───────────────────────────────────────
  if (!(await knex.schema.hasTable('student_transport_assignments'))) {
    await knex.schema.createTable('student_transport_assignments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('transport_member_id').unsigned().notNullable().references('id').inTable('transport_members').onDelete('RESTRICT');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('route_id').unsigned().notNullable().references('id').inTable('transport_routes').onDelete('RESTRICT');
      t.integer('pickup_stop_id').unsigned().notNullable().references('id').inTable('transport_stops').onDelete('RESTRICT');
      t.integer('drop_stop_id').unsigned().notNullable().references('id').inTable('transport_stops').onDelete('RESTRICT');
      t.string('service_type', 16).notNullable().defaultTo('TWO_WAY');
      t.timestamp('start_at').notNullable().defaultTo(knex.fn.now());
      t.timestamp('end_at').nullable();
      t.string('status', 16).notNullable().defaultTo('PENDING');
      t.integer('assigned_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('reason').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'transport_member_id', 'status'], 'sta_member_status_idx');
      t.index(['college_id', 'student_id', 'status'], 'sta_student_status_idx');
      t.index(['college_id', 'route_id', 'status'], 'sta_route_status_idx');
    });
  }

  // ── Change requests ─────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_change_requests'))) {
    await knex.schema.createTable('transport_change_requests', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('transport_member_id').unsigned().notNullable().references('id').inTable('transport_members').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('old_assignment_id').unsigned().nullable().references('id').inTable('student_transport_assignments').onDelete('SET NULL');
      t.string('change_type', 32).notNullable();
      t.integer('requested_route_id').unsigned().nullable().references('id').inTable('transport_routes').onDelete('SET NULL');
      t.integer('requested_pickup_stop_id').unsigned().nullable().references('id').inTable('transport_stops').onDelete('SET NULL');
      t.integer('requested_drop_stop_id').unsigned().nullable().references('id').inTable('transport_stops').onDelete('SET NULL');
      t.string('requested_service_type', 16).nullable();
      t.timestamp('effective_date').nullable();
      t.text('reason').nullable();
      t.string('status', 16).notNullable().defaultTo('REQUESTED');
      t.integer('reviewed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('reviewed_at').nullable();
      t.integer('new_assignment_id').unsigned().nullable().references('id').inTable('student_transport_assignments').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'student_id', 'status'], 'tcr_student_status_idx');
    });
  }

  // ── Transport passes ──────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_passes'))) {
    await knex.schema.createTable('transport_passes', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('transport_member_id').unsigned().notNullable().references('id').inTable('transport_members').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('route_assignment_id').unsigned().nullable().references('id').inTable('student_transport_assignments').onDelete('SET NULL');
      t.string('pass_number', 64).notNullable();
      t.timestamp('valid_from').notNullable();
      t.timestamp('valid_until').notNullable();
      t.string('status', 16).notNullable().defaultTo('PENDING');
      t.string('verification_token', 64).notNullable();
      t.timestamp('issued_at').nullable();
      t.timestamp('revoked_at').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'pass_number'], { indexName: 'tp_college_pass_unique' });
      t.unique(['college_id', 'verification_token'], { indexName: 'tp_college_token_unique' });
      t.index(['college_id', 'student_id', 'status'], 'tp_student_status_idx');
    });
  }

  // ── Route schedules ─────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_route_schedules'))) {
    await knex.schema.createTable('transport_route_schedules', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('route_id').unsigned().notNullable().references('id').inTable('transport_routes').onDelete('CASCADE');
      t.integer('day_of_week').unsigned().notNullable();
      t.string('trip_type', 24).notNullable();
      t.string('start_time', 8).notNullable();
      t.string('expected_end_time', 8).nullable();
      t.timestamp('effective_from').nullable();
      t.timestamp('effective_to').nullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.index(['college_id', 'route_id', 'day_of_week', 'trip_type'], 'trs_schedule_idx');
    });
  }

  // ── Trips ───────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_trips'))) {
    await knex.schema.createTable('transport_trips', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('route_id').unsigned().notNullable().references('id').inTable('transport_routes').onDelete('RESTRICT');
      t.integer('vehicle_id').unsigned().nullable().references('id').inTable('transport_vehicles').onDelete('SET NULL');
      t.date('trip_date').notNullable();
      t.string('trip_type', 24).notNullable();
      t.string('idempotency_key', 128).nullable();
      t.timestamp('scheduled_start_at').nullable();
      t.timestamp('scheduled_end_at').nullable();
      t.timestamp('actual_start_at').nullable();
      t.timestamp('actual_end_at').nullable();
      t.string('status', 16).notNullable().defaultTo('SCHEDULED');
      t.timestamps(true, true);
      t.unique(['college_id', 'idempotency_key'], { indexName: 'tt_idempotency_unique' });
      t.index(['college_id', 'trip_date', 'status'], 'tt_college_date_status_idx');
      t.index(['college_id', 'route_id', 'trip_date'], 'tt_college_route_date_idx');
    });
  }

  // ── Trip overrides ──────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_trip_overrides'))) {
    await knex.schema.createTable('transport_trip_overrides', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('trip_id').unsigned().nullable().references('id').inTable('transport_trips').onDelete('CASCADE');
      t.integer('route_id').unsigned().nullable().references('id').inTable('transport_routes').onDelete('SET NULL');
      t.date('override_date').nullable();
      t.string('override_type', 32).notNullable();
      t.text('reason').nullable();
      t.integer('actor_id').unsigned().nullable();
      t.json('payload').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'trip_id'], 'tto_trip_idx');
    });
  }

  // ── Boarding events ─────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_boarding_events'))) {
    await knex.schema.createTable('transport_boarding_events', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('trip_id').unsigned().notNullable().references('id').inTable('transport_trips').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('transport_member_id').unsigned().nullable().references('id').inTable('transport_members').onDelete('SET NULL');
      t.integer('route_stop_id').unsigned().nullable().references('id').inTable('transport_route_stops').onDelete('SET NULL');
      t.string('event_type', 16).notNullable();
      t.timestamp('recorded_at').notNullable().defaultTo(knex.fn.now());
      t.integer('recorded_by').unsigned().nullable();
      t.string('source', 16).notNullable().defaultTo('MANUAL');
      t.string('idempotency_key', 128).nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'idempotency_key'], { indexName: 'tbe_idempotency_unique' });
      t.index(['college_id', 'trip_id', 'student_id'], 'tbe_trip_student_idx');
    });
  }

  // ── Vehicle maintenance ─────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_vehicle_maintenance'))) {
    await knex.schema.createTable('transport_vehicle_maintenance', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('vehicle_id').unsigned().notNullable().references('id').inTable('transport_vehicles').onDelete('CASCADE');
      t.string('maintenance_type', 32).notNullable();
      t.text('description').nullable();
      t.timestamp('scheduled_at').nullable();
      t.timestamp('started_at').nullable();
      t.timestamp('completed_at').nullable();
      t.integer('odometer').unsigned().nullable();
      t.string('status', 16).notNullable().defaultTo('SCHEDULED');
      t.string('vendor_reference', 255).nullable();
      t.string('cost_reference', 255).nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'vehicle_id', 'status'], 'tvm_vehicle_status_idx');
    });
  }

  // ── Incidents ───────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_incidents'))) {
    await knex.schema.createTable('transport_incidents', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('route_id').unsigned().nullable().references('id').inTable('transport_routes').onDelete('SET NULL');
      t.integer('trip_id').unsigned().nullable().references('id').inTable('transport_trips').onDelete('SET NULL');
      t.integer('vehicle_id').unsigned().nullable().references('id').inTable('transport_vehicles').onDelete('SET NULL');
      t.integer('student_id').unsigned().nullable().references('id').inTable('students').onDelete('SET NULL');
      t.integer('reported_by').unsigned().nullable();
      t.string('reported_by_type', 16).notNullable().defaultTo('FACULTY');
      t.string('incident_type', 32).notNullable();
      t.timestamp('occurred_at').notNullable();
      t.string('severity', 16).notNullable().defaultTo('MEDIUM');
      t.text('description').notNullable();
      t.string('status', 16).notNullable().defaultTo('OPEN');
      t.text('restricted_notes').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'ti_college_status_idx');
      t.index(['college_id', 'trip_id'], 'ti_trip_idx');
    });
  }

  // ── Complaints ──────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_complaints'))) {
    await knex.schema.createTable('transport_complaints', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('transport_member_id').unsigned().nullable().references('id').inTable('transport_members').onDelete('SET NULL');
      t.integer('student_id').unsigned().nullable().references('id').inTable('students').onDelete('SET NULL');
      t.integer('route_id').unsigned().nullable().references('id').inTable('transport_routes').onDelete('SET NULL');
      t.integer('trip_id').unsigned().nullable().references('id').inTable('transport_trips').onDelete('SET NULL');
      t.string('category', 32).notNullable();
      t.text('description').notNullable();
      t.string('status', 16).notNullable().defaultTo('OPEN');
      t.integer('assigned_to').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('resolution_notes').nullable();
      t.timestamp('resolved_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'student_id', 'status'], 'tc_student_status_idx');
      t.index(['college_id', 'status'], 'tc_college_status_idx');
    });
  }

  // ── Cancellation requests ─────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_cancellation_requests'))) {
    await knex.schema.createTable('transport_cancellation_requests', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('transport_member_id').unsigned().notNullable().references('id').inTable('transport_members').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.text('reason').nullable();
      t.timestamp('requested_effective_date').nullable();
      t.string('status', 16).notNullable().defaultTo('REQUESTED');
      t.integer('reviewed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('approved_effective_date').nullable();
      t.integer('finance_adjustment_reference').unsigned().nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'student_id', 'status'], 'tcr_cancel_student_status_idx');
    });
  }

  // ── Audit log ───────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transport_audit_log'))) {
    await knex.schema.createTable('transport_audit_log', (t) => {
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
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'entity_type', 'entity_id'], 'tal_entity_idx');
      t.index(['college_id', 'created_at'], 'tal_college_time_idx');
    });
  }
};

exports.down = async function down(knex) {
  const tables = [
    'transport_audit_log',
    'transport_cancellation_requests',
    'transport_complaints',
    'transport_incidents',
    'transport_vehicle_maintenance',
    'transport_boarding_events',
    'transport_trip_overrides',
    'transport_trips',
    'transport_route_schedules',
    'transport_passes',
    'transport_change_requests',
    'student_transport_assignments',
    'transport_members',
    'transport_fee_plans',
    'transport_staff_assignments',
    'transport_route_vehicle_assignments',
    'transport_personnel',
    'transport_vehicle_documents',
    'transport_vehicles',
    'transport_waitlist_entries',
    'transport_applications',
    'transport_application_cycles',
    'transport_route_stops',
    'transport_routes',
    'transport_stops',
    'transport_zones',
    'college_transport_policies',
  ];
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
};
