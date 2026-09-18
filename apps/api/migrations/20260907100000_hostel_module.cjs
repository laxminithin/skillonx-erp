/**
 * Hostel Management domain — accommodation lifecycle integrated with Finance, Student Services, RBAC.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  // ── College hostel policies ─────────────────────────────────────────────
  if (!(await knex.schema.hasTable('college_hostel_policies'))) {
    await knex.schema.createTable('college_hostel_policies', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.boolean('application_required').notNullable().defaultTo(true);
      t.boolean('approval_required').notNullable().defaultTo(true);
      t.string('room_allocation_mode', 32).notNullable().defaultTo('MANUAL');
      t.boolean('allow_student_room_preference').notNullable().defaultTo(true);
      t.boolean('allow_room_transfer').notNullable().defaultTo(true);
      t.boolean('transfer_approval_required').notNullable().defaultTo(true);
      t.boolean('security_deposit_required').notNullable().defaultTo(true);
      t.boolean('mess_mandatory').notNullable().defaultTo(false);
      t.boolean('allow_outpass').notNullable().defaultTo(true);
      t.string('outpass_approval_mode', 32).notNullable().defaultTo('WARDEN_ONLY');
      t.boolean('guardian_approval_required').notNullable().defaultTo(false);
      t.boolean('visitor_allowed').notNullable().defaultTo(true);
      t.string('night_return_cutoff', 8).nullable();
      t.string('late_entry_policy', 32).notNullable().defaultTo('WARNING');
      t.boolean('clearance_required').notNullable().defaultTo(true);
      t.boolean('fee_clearance_required').notNullable().defaultTo(true);
      t.string('allocation_payment_policy', 32).notNullable().defaultTo('PAY_BEFORE_ALLOCATION');
      t.string('reapplication_policy', 32).notNullable().defaultTo('ONE_PER_CYCLE');
      t.timestamps(true, true);
      t.unique(['college_id'], { indexName: 'chp_college_unique' });
    });
  }

  // ── Hostels ─────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostels'))) {
    await knex.schema.createTable('hostels', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 32).notNullable();
      t.string('name', 255).notNullable();
      t.string('hostel_type', 16).notNullable().defaultTo('BOYS');
      t.string('gender_policy', 16).notNullable().defaultTo('MALE');
      t.text('address').nullable();
      t.integer('capacity').unsigned().nullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'h_college_code_unique' });
      t.index(['college_id', 'status'], 'h_college_status_idx');
    });
  }

  // ── Blocks ────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_blocks'))) {
    await knex.schema.createTable('hostel_blocks', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('hostel_id').unsigned().notNullable().references('id').inTable('hostels').onDelete('CASCADE');
      t.string('code', 16).notNullable();
      t.string('name', 128).notNullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.unique(['hostel_id', 'code'], { indexName: 'hb_hostel_code_unique' });
      t.index(['college_id', 'hostel_id'], 'hb_college_hostel_idx');
    });
  }

  // ── Floors ────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_floors'))) {
    await knex.schema.createTable('hostel_floors', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('hostel_id').unsigned().notNullable().references('id').inTable('hostels').onDelete('CASCADE');
      t.integer('block_id').unsigned().notNullable().references('id').inTable('hostel_blocks').onDelete('CASCADE');
      t.integer('floor_number').notNullable();
      t.string('name', 64).nullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.unique(['block_id', 'floor_number'], { indexName: 'hf_block_floor_unique' });
      t.index(['college_id', 'hostel_id'], 'hf_college_hostel_idx');
    });
  }

  // ── Rooms ─────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_rooms'))) {
    await knex.schema.createTable('hostel_rooms', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('hostel_id').unsigned().notNullable().references('id').inTable('hostels').onDelete('CASCADE');
      t.integer('block_id').unsigned().notNullable().references('id').inTable('hostel_blocks').onDelete('CASCADE');
      t.integer('floor_id').unsigned().notNullable().references('id').inTable('hostel_floors').onDelete('CASCADE');
      t.string('room_number', 32).notNullable();
      t.string('room_type', 16).notNullable().defaultTo('TRIPLE');
      t.integer('capacity').unsigned().notNullable().defaultTo(3);
      t.string('gender_policy', 16).nullable();
      t.string('bathroom_type', 16).nullable();
      t.string('status', 16).notNullable().defaultTo('AVAILABLE');
      t.timestamps(true, true);
      t.unique(['hostel_id', 'block_id', 'room_number'], { indexName: 'hr_hostel_room_unique' });
      t.index(['college_id', 'hostel_id', 'status'], 'hr_college_hostel_status_idx');
    });
  }

  // ── Beds ──────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_beds'))) {
    await knex.schema.createTable('hostel_beds', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('hostel_id').unsigned().notNullable().references('id').inTable('hostels').onDelete('CASCADE');
      t.integer('room_id').unsigned().notNullable().references('id').inTable('hostel_rooms').onDelete('CASCADE');
      t.string('bed_code', 32).notNullable();
      t.string('status', 16).notNullable().defaultTo('AVAILABLE');
      t.timestamps(true, true);
      t.unique(['room_id', 'bed_code'], { indexName: 'hbed_room_code_unique' });
      t.index(['college_id', 'hostel_id', 'status'], 'hbed_college_hostel_status_idx');
    });
  }

  // ── Application cycles ────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_application_cycles'))) {
    await knex.schema.createTable('hostel_application_cycles', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.string('name', 255).notNullable();
      t.timestamp('opens_at').notNullable();
      t.timestamp('closes_at').notNullable();
      t.json('hostel_scope').nullable();
      t.json('eligible_programs').nullable();
      t.json('eligible_semesters').nullable();
      t.string('status', 16).notNullable().defaultTo('DRAFT');
      t.timestamps(true, true);
      t.index(['college_id', 'academic_year_id', 'status'], 'hac_college_year_status_idx');
    });
  }

  // ── Applications ──────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_applications'))) {
    await knex.schema.createTable('hostel_applications', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.integer('application_cycle_id').unsigned().notNullable().references('id').inTable('hostel_application_cycles').onDelete('RESTRICT');
      t.string('application_number', 64).notNullable();
      t.integer('preferred_hostel_id').unsigned().nullable().references('id').inTable('hostels').onDelete('SET NULL');
      t.string('preferred_room_type', 16).nullable();
      t.string('accommodation_period', 32).nullable();
      t.boolean('mess_required').notNullable().defaultTo(false);
      t.integer('mess_plan_id').unsigned().nullable();
      t.text('special_requirement').nullable();
      t.string('local_guardian_name', 255).nullable();
      t.string('local_guardian_phone', 32).nullable();
      t.string('emergency_contact_name', 255).nullable();
      t.string('emergency_contact_phone', 32).nullable();
      t.text('additional_note').nullable();
      t.boolean('rules_accepted').notNullable().defaultTo(false);
      t.boolean('declaration_accepted').notNullable().defaultTo(false);
      t.string('status', 16).notNullable().defaultTo('DRAFT');
      t.timestamp('submitted_at').nullable();
      t.integer('reviewed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('reviewed_at').nullable();
      t.text('rejection_reason').nullable();
      t.text('review_notes').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'application_number'], { indexName: 'ha_college_number_unique' });
      t.index(['college_id', 'student_id', 'status'], 'ha_college_student_status_idx');
      t.index(['college_id', 'application_cycle_id', 'status'], 'ha_college_cycle_status_idx');
    });
  }

  // ── Waitlist ────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_waitlist_entries'))) {
    await knex.schema.createTable('hostel_waitlist_entries', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('application_id').unsigned().notNullable().references('id').inTable('hostel_applications').onDelete('CASCADE');
      t.integer('hostel_id').unsigned().notNullable().references('id').inTable('hostels').onDelete('CASCADE');
      t.string('room_type_preference', 16).nullable();
      t.integer('priority').notNullable().defaultTo(0);
      t.integer('position').unsigned().notNullable().defaultTo(1);
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.index(['college_id', 'hostel_id', 'status', 'position'], 'hwe_hostel_queue_idx');
      t.index(['college_id', 'application_id'], 'hwe_application_idx');
    });
  }

  // ── Residents ─────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_residents'))) {
    await knex.schema.createTable('hostel_residents', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.integer('hostel_id').unsigned().notNullable().references('id').inTable('hostels').onDelete('RESTRICT');
      t.integer('application_id').unsigned().nullable().references('id').inTable('hostel_applications').onDelete('SET NULL');
      t.string('resident_number', 64).notNullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.timestamp('admitted_at').nullable();
      t.timestamp('expected_vacate_at').nullable();
      t.timestamp('vacated_at').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'resident_number'], { indexName: 'hres_college_number_unique' });
      t.index(['college_id', 'student_id', 'status'], 'hres_college_student_status_idx');
      t.index(['college_id', 'hostel_id', 'status'], 'hres_college_hostel_status_idx');
    });
  }

  // ── Bed allocations ───────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_bed_allocations'))) {
    await knex.schema.createTable('hostel_bed_allocations', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('resident_id').unsigned().notNullable().references('id').inTable('hostel_residents').onDelete('RESTRICT');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('hostel_id').unsigned().notNullable().references('id').inTable('hostels').onDelete('RESTRICT');
      t.integer('room_id').unsigned().notNullable().references('id').inTable('hostel_rooms').onDelete('RESTRICT');
      t.integer('bed_id').unsigned().notNullable().references('id').inTable('hostel_beds').onDelete('RESTRICT');
      t.string('allocation_type', 32).notNullable().defaultTo('INITIAL');
      t.timestamp('start_at').notNullable().defaultTo(knex.fn.now());
      t.timestamp('end_at').nullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.integer('allocated_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('reason').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'bed_id', 'status'], 'hba_bed_status_idx');
      t.index(['college_id', 'resident_id', 'status'], 'hba_resident_status_idx');
      t.index(['college_id', 'student_id', 'status'], 'hba_student_status_idx');
    });
  }

  // ── Room transfers ──────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_room_transfer_requests'))) {
    await knex.schema.createTable('hostel_room_transfer_requests', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('resident_id').unsigned().notNullable().references('id').inTable('hostel_residents').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('old_allocation_id').unsigned().nullable().references('id').inTable('hostel_bed_allocations').onDelete('SET NULL');
      t.integer('old_bed_id').unsigned().nullable();
      t.integer('new_bed_id').unsigned().nullable().references('id').inTable('hostel_beds').onDelete('SET NULL');
      t.string('transfer_type', 32).notNullable().defaultTo('STUDENT_REQUEST');
      t.string('status', 16).notNullable().defaultTo('REQUESTED');
      t.text('reason').nullable();
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('completed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('completed_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'resident_id', 'status'], 'htr_resident_status_idx');
    });
  }

  // ── Warden assignments ──────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_warden_assignments'))) {
    await knex.schema.createTable('hostel_warden_assignments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('hostel_id').unsigned().notNullable().references('id').inTable('hostels').onDelete('CASCADE');
      t.integer('faculty_user_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      t.string('assignment_role', 32).notNullable().defaultTo('WARDEN');
      t.timestamp('start_at').notNullable().defaultTo(knex.fn.now());
      t.timestamp('end_at').nullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.index(['college_id', 'hostel_id', 'status'], 'hwa_hostel_status_idx');
      t.index(['college_id', 'faculty_user_id', 'status'], 'hwa_faculty_status_idx');
    });
  }

  // ── Fee plans ───────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_fee_plans'))) {
    await knex.schema.createTable('hostel_fee_plans', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('hostel_id').unsigned().nullable().references('id').inTable('hostels').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('RESTRICT');
      t.string('room_type', 16).nullable();
      t.string('fee_type', 32).notNullable();
      t.decimal('amount', 12, 2).notNullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.index(['college_id', 'hostel_id', 'academic_year_id'], 'hfp_college_hostel_year_idx');
    });
  }

  // ── Mess plans ──────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('mess_plans'))) {
    await knex.schema.createTable('mess_plans', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('hostel_id').unsigned().nullable().references('id').inTable('hostels').onDelete('CASCADE');
      t.string('name', 128).notNullable();
      t.string('plan_type', 32).notNullable().defaultTo('FULL_BOARD');
      t.decimal('monthly_amount', 12, 2).nullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.index(['college_id', 'hostel_id', 'status'], 'mp_college_hostel_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('resident_mess_assignments'))) {
    await knex.schema.createTable('resident_mess_assignments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('resident_id').unsigned().notNullable().references('id').inTable('hostel_residents').onDelete('CASCADE');
      t.integer('mess_plan_id').unsigned().notNullable().references('id').inTable('mess_plans').onDelete('RESTRICT');
      t.timestamp('start_at').notNullable().defaultTo(knex.fn.now());
      t.timestamp('end_at').nullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.index(['college_id', 'resident_id', 'status'], 'rma_resident_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('mess_menu_cycles'))) {
    await knex.schema.createTable('mess_menu_cycles', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('hostel_id').unsigned().nullable().references('id').inTable('hostels').onDelete('CASCADE');
      t.string('name', 128).notNullable();
      t.date('week_start').notNullable();
      t.date('week_end').notNullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.timestamps(true, true);
      t.index(['college_id', 'hostel_id', 'week_start'], 'mmc_college_hostel_week_idx');
    });
  }

  if (!(await knex.schema.hasTable('mess_menu_items'))) {
    await knex.schema.createTable('mess_menu_items', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('menu_cycle_id').unsigned().notNullable().references('id').inTable('mess_menu_cycles').onDelete('CASCADE');
      t.date('menu_date').notNullable();
      t.string('meal_type', 16).notNullable();
      t.text('items').notNullable();
      t.string('timing', 32).nullable();
      t.timestamps(true, true);
      t.index(['menu_cycle_id', 'menu_date', 'meal_type'], 'mmi_cycle_date_meal_idx');
    });
  }

  if (!(await knex.schema.hasTable('mess_feedback'))) {
    await knex.schema.createTable('mess_feedback', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('resident_id').unsigned().notNullable().references('id').inTable('hostel_residents').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.date('meal_date').notNullable();
      t.string('meal_type', 16).notNullable();
      t.integer('rating').unsigned().notNullable();
      t.string('category', 32).nullable();
      t.text('comment').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'resident_id'], 'mf_resident_idx');
    });
  }

  // ── Outpasses ───────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_outpasses'))) {
    await knex.schema.createTable('hostel_outpasses', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('resident_id').unsigned().notNullable().references('id').inTable('hostel_residents').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.string('outpass_number', 64).notNullable();
      t.string('qr_token', 64).notNullable();
      t.text('purpose').notNullable();
      t.string('destination', 255).nullable();
      t.timestamp('expected_exit_at').notNullable();
      t.timestamp('expected_return_at').notNullable();
      t.string('status', 16).notNullable().defaultTo('REQUESTED');
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('approved_at').nullable();
      t.timestamp('actual_exit_at').nullable();
      t.timestamp('actual_return_at').nullable();
      t.integer('late_return_minutes').unsigned().nullable();
      t.text('rejection_reason').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'outpass_number'], { indexName: 'hop_college_number_unique' });
      t.unique(['college_id', 'qr_token'], { indexName: 'hop_college_token_unique' });
      t.index(['college_id', 'resident_id', 'status'], 'hop_resident_status_idx');
      t.index(['college_id', 'expected_return_at', 'status'], 'hop_return_status_idx');
    });
  }

  // ── Leave requests ──────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_leave_requests'))) {
    await knex.schema.createTable('hostel_leave_requests', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('resident_id').unsigned().notNullable().references('id').inTable('hostel_residents').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.string('leave_type', 32).notNullable().defaultTo('HOME_VISIT');
      t.timestamp('from_at').notNullable();
      t.timestamp('to_at').notNullable();
      t.string('destination', 255).nullable();
      t.text('reason').nullable();
      t.boolean('guardian_confirmed').notNullable().defaultTo(false);
      t.string('status', 16).notNullable().defaultTo('DRAFT');
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('approved_at').nullable();
      t.timestamp('actual_departure_at').nullable();
      t.timestamp('actual_return_at').nullable();
      t.text('rejection_reason').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'resident_id', 'status'], 'hlr_resident_status_idx');
    });
  }

  // ── Gate movements ──────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_gate_movements'))) {
    await knex.schema.createTable('hostel_gate_movements', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('resident_id').unsigned().notNullable().references('id').inTable('hostel_residents').onDelete('CASCADE');
      t.integer('outpass_id').unsigned().nullable().references('id').inTable('hostel_outpasses').onDelete('SET NULL');
      t.integer('leave_id').unsigned().nullable().references('id').inTable('hostel_leave_requests').onDelete('SET NULL');
      t.string('movement_type', 8).notNullable();
      t.timestamp('recorded_at').notNullable().defaultTo(knex.fn.now());
      t.string('gate', 64).nullable();
      t.integer('recorded_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('source', 16).notNullable().defaultTo('MANUAL');
      t.text('remarks').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'resident_id', 'recorded_at'], 'hgm_resident_time_idx');
      t.index(['college_id', 'movement_type', 'recorded_at'], 'hgm_type_time_idx');
    });
  }

  // ── Visitors ────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_visitors'))) {
    await knex.schema.createTable('hostel_visitors', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('name', 255).notNullable();
      t.string('phone', 32).nullable();
      t.string('relationship', 64).nullable();
      t.string('id_type', 32).nullable();
      t.string('id_reference_masked', 64).nullable();
      t.string('photo_reference', 512).nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'phone'], 'hv_college_phone_idx');
    });
  }

  if (!(await knex.schema.hasTable('hostel_visitor_visits'))) {
    await knex.schema.createTable('hostel_visitor_visits', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('visitor_id').unsigned().notNullable().references('id').inTable('hostel_visitors').onDelete('CASCADE');
      t.integer('resident_id').unsigned().notNullable().references('id').inTable('hostel_residents').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.text('purpose').nullable();
      t.timestamp('expected_exit_at').nullable();
      t.timestamp('entry_at').nullable();
      t.timestamp('actual_exit_at').nullable();
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('status', 16).notNullable().defaultTo('REQUESTED');
      t.timestamps(true, true);
      t.index(['college_id', 'resident_id', 'status'], 'hvv_resident_status_idx');
      t.index(['college_id', 'status', 'entry_at'], 'hvv_status_entry_idx');
    });
  }

  // ── Complaints ──────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_complaints'))) {
    await knex.schema.createTable('hostel_complaints', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('resident_id').unsigned().nullable().references('id').inTable('hostel_residents').onDelete('SET NULL');
      t.integer('student_id').unsigned().nullable().references('id').inTable('students').onDelete('SET NULL');
      t.integer('hostel_id').unsigned().notNullable().references('id').inTable('hostels').onDelete('CASCADE');
      t.integer('room_id').unsigned().nullable().references('id').inTable('hostel_rooms').onDelete('SET NULL');
      t.string('category', 32).notNullable();
      t.text('description').notNullable();
      t.string('priority', 16).notNullable().defaultTo('NORMAL');
      t.string('status', 16).notNullable().defaultTo('OPEN');
      t.integer('assigned_to').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('resolution_notes').nullable();
      t.timestamp('resolved_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'hostel_id', 'status'], 'hc_hostel_status_idx');
      t.index(['college_id', 'student_id'], 'hc_student_idx');
    });
  }

  // ── Incidents ───────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_incidents'))) {
    await knex.schema.createTable('hostel_incidents', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('hostel_id').unsigned().notNullable().references('id').inTable('hostels').onDelete('CASCADE');
      t.integer('resident_id').unsigned().nullable().references('id').inTable('hostel_residents').onDelete('SET NULL');
      t.string('incident_type', 32).notNullable();
      t.string('location', 255).nullable();
      t.timestamp('occurred_at').notNullable();
      t.string('severity', 16).notNullable().defaultTo('MEDIUM');
      t.text('description').notNullable();
      t.string('status', 16).notNullable().defaultTo('OPEN');
      t.integer('reported_by').unsigned().nullable();
      t.text('restricted_notes').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'hostel_id', 'status'], 'hi_hostel_status_idx');
    });
  }

  // ── Assets ──────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_assets'))) {
    await knex.schema.createTable('hostel_assets', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('hostel_id').unsigned().notNullable().references('id').inTable('hostels').onDelete('CASCADE');
      t.integer('room_id').unsigned().nullable().references('id').inTable('hostel_rooms').onDelete('SET NULL');
      t.integer('bed_id').unsigned().nullable().references('id').inTable('hostel_beds').onDelete('SET NULL');
      t.string('asset_code', 64).notNullable();
      t.string('asset_type', 32).notNullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.string('condition', 16).notNullable().defaultTo('GOOD');
      t.timestamps(true, true);
      t.unique(['college_id', 'asset_code'], { indexName: 'has_college_code_unique' });
      t.index(['college_id', 'room_id'], 'has_room_idx');
    });
  }

  // ── Damage assessments ──────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_damage_assessments'))) {
    await knex.schema.createTable('hostel_damage_assessments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('resident_id').unsigned().notNullable().references('id').inTable('hostel_residents').onDelete('CASCADE');
      t.integer('room_id').unsigned().nullable().references('id').inTable('hostel_rooms').onDelete('SET NULL');
      t.integer('asset_id').unsigned().nullable().references('id').inTable('hostel_assets').onDelete('SET NULL');
      t.text('description').notNullable();
      t.decimal('estimated_amount', 12, 2).nullable();
      t.decimal('final_amount', 12, 2).nullable();
      t.string('status', 16).notNullable().defaultTo('REPORTED');
      t.integer('assessed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('finance_demand_id').unsigned().nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'resident_id', 'status'], 'hda_resident_status_idx');
    });
  }

  // ── Vacating ────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_vacating_requests'))) {
    await knex.schema.createTable('hostel_vacating_requests', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('resident_id').unsigned().notNullable().references('id').inTable('hostel_residents').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.string('reason', 32).notNullable();
      t.string('status', 16).notNullable().defaultTo('REQUESTED');
      t.boolean('keys_returned').notNullable().defaultTo(false);
      t.boolean('assets_verified').notNullable().defaultTo(false);
      t.boolean('damage_checked').notNullable().defaultTo(false);
      t.boolean('mess_cleared').notNullable().defaultTo(false);
      t.boolean('finance_checked').notNullable().defaultTo(false);
      t.timestamp('requested_vacate_at').nullable();
      t.timestamp('completed_at').nullable();
      t.text('notes').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'resident_id', 'status'], 'hvr_resident_status_idx');
    });
  }

  // ── Audit log ───────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hostel_audit_log'))) {
    await knex.schema.createTable('hostel_audit_log', (t) => {
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
      t.index(['college_id', 'entity_type', 'entity_id'], 'hal_entity_idx');
      t.index(['college_id', 'created_at'], 'hal_college_time_idx');
    });
  }
};

exports.down = async function down(knex) {
  const tables = [
    'hostel_audit_log',
    'hostel_vacating_requests',
    'hostel_damage_assessments',
    'hostel_assets',
    'hostel_incidents',
    'hostel_complaints',
    'hostel_visitor_visits',
    'hostel_visitors',
    'hostel_gate_movements',
    'hostel_leave_requests',
    'hostel_outpasses',
    'mess_feedback',
    'mess_menu_items',
    'mess_menu_cycles',
    'resident_mess_assignments',
    'mess_plans',
    'hostel_fee_plans',
    'hostel_warden_assignments',
    'hostel_room_transfer_requests',
    'hostel_bed_allocations',
    'hostel_residents',
    'hostel_waitlist_entries',
    'hostel_applications',
    'hostel_application_cycles',
    'hostel_beds',
    'hostel_rooms',
    'hostel_floors',
    'hostel_blocks',
    'hostels',
    'college_hostel_policies',
  ];
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
};
