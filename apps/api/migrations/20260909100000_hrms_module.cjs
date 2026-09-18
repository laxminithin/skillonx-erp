/**
 * HRMS — Human Resource Management System
 * Canonical employee identity, employment lifecycle, attendance, leave, payroll.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  // ── College HR policy ───────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('college_hrms_policies'))) {
    await knex.schema.createTable('college_hrms_policies', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('employee_number_series', 16).notNullable().defaultTo('EMP');
      t.string('leave_request_series', 16).notNullable().defaultTo('HR/LV');
      t.boolean('emergency_leave_enabled').notNullable().defaultTo(true);
      t.boolean('academic_coverage_required').notNullable().defaultTo(true);
      t.integer('default_work_schedule_id').unsigned().nullable();
      t.timestamps(true, true);
      t.unique(['college_id']);
    });
  }

  // ── Employment types ────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('employment_types'))) {
    await knex.schema.createTable('employment_types', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 32).notNullable();
      t.string('name', 128).notNullable();
      t.text('description').nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'code']);
    });
  }

  // ── HR designations ─────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_designations'))) {
    await knex.schema.createTable('hr_designations', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 32).notNullable();
      t.string('name', 128).notNullable();
      t.string('category', 32).nullable();
      t.integer('sort_order').notNullable().defaultTo(0);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'code']);
    });
  }

  // ── Employees (canonical identity) ──────────────────────────────────────
  if (!(await knex.schema.hasTable('employees'))) {
    await knex.schema.createTable('employees', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('employee_number', 64).notNullable();
      t.integer('faculty_user_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('title', 16).nullable();
      t.string('first_name', 128).notNullable();
      t.string('middle_name', 128).nullable();
      t.string('last_name', 128).notNullable();
      t.string('display_name', 255).notNullable();
      t.string('official_email', 255).nullable();
      t.string('personal_email', 255).nullable();
      t.string('official_phone', 32).nullable();
      t.string('personal_phone', 32).nullable();
      t.string('gender', 16).nullable();
      t.date('date_of_birth').nullable();
      t.date('date_of_joining').nullable();
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('designation_id').unsigned().nullable().references('id').inTable('hr_designations').onDelete('SET NULL');
      t.integer('employment_type_id').unsigned().nullable().references('id').inTable('employment_types').onDelete('SET NULL');
      t.integer('reporting_manager_employee_id').unsigned().nullable();
      t.string('employment_status', 32).notNullable().defaultTo('ACTIVE');
      t.date('confirmation_date').nullable();
      t.date('probation_end_date').nullable();
      t.date('retirement_date').nullable();
      t.string('profile_photo_reference', 512).nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'employee_number']);
      t.unique(['faculty_user_id']);
      t.index(['college_id', 'employment_status'], 'emp_college_status_idx');
      t.index(['college_id', 'department_id'], 'emp_college_dept_idx');
      t.index(['reporting_manager_employee_id'], 'emp_manager_idx');
    });
    await knex.schema.alterTable('employees', (t) => {
      t.foreign('reporting_manager_employee_id').references('id').inTable('employees').onDelete('SET NULL');
    });
  }

  // ── Service history ─────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('employee_service_events'))) {
    await knex.schema.createTable('employee_service_events', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.string('event_type', 32).notNullable();
      t.date('effective_date').notNullable();
      t.json('details').nullable();
      t.integer('recorded_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('notes').nullable();
      t.timestamps(true, true);
      t.index(['employee_id', 'effective_date'], 'ese_emp_date_idx');
    });
  }

  // ── Onboarding ──────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('employee_onboarding_records'))) {
    await knex.schema.createTable('employee_onboarding_records', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.string('status', 32).notNullable().defaultTo('IN_PROGRESS');
      t.date('offer_accepted_at').nullable();
      t.date('completed_at').nullable();
      t.integer('assigned_to').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['employee_id']);
    });
  }

  if (!(await knex.schema.hasTable('employee_onboarding_tasks'))) {
    await knex.schema.createTable('employee_onboarding_tasks', (t) => {
      t.increments('id').primary();
      t.integer('onboarding_id').unsigned().notNullable().references('id').inTable('employee_onboarding_records').onDelete('CASCADE');
      t.string('task_code', 64).notNullable();
      t.string('title', 255).notNullable();
      t.string('status', 32).notNullable().defaultTo('PENDING');
      t.timestamp('completed_at').nullable();
      t.timestamps(true, true);
      t.index(['onboarding_id', 'status'], 'eot_onboarding_status_idx');
    });
  }

  // ── Documents ───────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('employee_documents'))) {
    await knex.schema.createTable('employee_documents', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.string('document_type', 64).notNullable();
      t.string('title', 255).notNullable();
      t.string('file_reference', 512).nullable();
      t.date('issued_date').nullable();
      t.date('expiry_date').nullable();
      t.string('status', 32).notNullable().defaultTo('ACTIVE');
      t.integer('uploaded_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['employee_id', 'document_type'], 'edoc_emp_type_idx');
      t.index(['college_id', 'expiry_date'], 'edoc_expiry_idx');
    });
  }

  // ── Work schedules & shifts ─────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_work_schedules'))) {
    await knex.schema.createTable('hr_work_schedules', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 32).notNullable();
      t.string('name', 128).notNullable();
      t.json('working_days').notNullable();
      t.time('start_time').notNullable();
      t.time('end_time').notNullable();
      t.integer('grace_minutes').unsigned().notNullable().defaultTo(15);
      t.integer('half_day_threshold_minutes').unsigned().nullable();
      t.integer('full_day_minutes').unsigned().nullable();
      t.json('weekly_off').nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'code']);
    });
  }

  if (!(await knex.schema.hasTable('hr_shifts'))) {
    await knex.schema.createTable('hr_shifts', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 32).notNullable();
      t.string('name', 128).notNullable();
      t.time('start_time').notNullable();
      t.time('end_time').notNullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'code']);
    });
  }

  if (!(await knex.schema.hasTable('employee_work_schedule_assignments'))) {
    await knex.schema.createTable('employee_work_schedule_assignments', (t) => {
      t.increments('id').primary();
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.integer('work_schedule_id').unsigned().notNullable().references('id').inTable('hr_work_schedules').onDelete('CASCADE');
      t.date('effective_from').notNullable();
      t.date('effective_to').nullable();
      t.timestamps(true, true);
      t.index(['employee_id', 'effective_from'], 'ewsa_emp_from_idx');
    });
  }

  if (!(await knex.schema.hasTable('employee_shift_assignments'))) {
    await knex.schema.createTable('employee_shift_assignments', (t) => {
      t.increments('id').primary();
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.integer('shift_id').unsigned().notNullable().references('id').inTable('hr_shifts').onDelete('CASCADE');
      t.date('effective_from').notNullable();
      t.date('effective_to').nullable();
      t.timestamps(true, true);
      t.index(['employee_id', 'effective_from'], 'esa_emp_from_idx');
    });
  }

  // ── Employee attendance ─────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('employee_attendance_records'))) {
    await knex.schema.createTable('employee_attendance_records', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.date('attendance_date').notNullable();
      t.timestamp('first_in_at').nullable();
      t.timestamp('last_out_at').nullable();
      t.integer('work_minutes').unsigned().nullable();
      t.integer('late_minutes').unsigned().nullable().defaultTo(0);
      t.integer('early_exit_minutes').unsigned().nullable().defaultTo(0);
      t.string('attendance_status', 32).notNullable();
      t.string('source', 32).notNullable().defaultTo('MANUAL');
      t.text('remarks').nullable();
      t.integer('approved_adjustment_id').unsigned().nullable();
      t.timestamps(true, true);
      t.unique(['employee_id', 'attendance_date'], { indexName: 'ear_emp_date_unique' });
      t.index(['college_id', 'attendance_date', 'attendance_status'], 'ear_college_date_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('employee_attendance_adjustments'))) {
    await knex.schema.createTable('employee_attendance_adjustments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.date('attendance_date').notNullable();
      t.string('previous_status', 32).nullable();
      t.string('new_status', 32).notNullable();
      t.text('reason').notNullable();
      t.string('status', 32).notNullable().defaultTo('PENDING');
      t.integer('requested_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['employee_id', 'status'], 'eaa_emp_status_idx');
    });
  }

  // ── Leave types & policies ────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_leave_types'))) {
    await knex.schema.createTable('hr_leave_types', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 16).notNullable();
      t.string('name', 128).notNullable();
      t.boolean('is_paid').notNullable().defaultTo(true);
      t.boolean('requires_document').notNullable().defaultTo(false);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'code']);
    });
  }

  if (!(await knex.schema.hasTable('hr_leave_policies'))) {
    await knex.schema.createTable('hr_leave_policies', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('leave_type_id').unsigned().notNullable().references('id').inTable('hr_leave_types').onDelete('CASCADE');
      t.integer('employment_type_id').unsigned().nullable().references('id').inTable('employment_types').onDelete('SET NULL');
      t.integer('designation_id').unsigned().nullable().references('id').inTable('hr_designations').onDelete('SET NULL');
      t.decimal('annual_entitlement', 6, 2).notNullable().defaultTo(0);
      t.decimal('max_carry_forward', 6, 2).nullable();
      t.string('accrual_method', 32).notNullable().defaultTo('ANNUAL');
      t.string('minimum_unit', 16).notNullable().defaultTo('HALF_DAY');
      t.integer('max_continuous_days').unsigned().nullable();
      t.integer('advance_notice_days').unsigned().nullable();
      t.boolean('sandwich_policy').notNullable().defaultTo(false);
      t.boolean('negative_balance_allowed').notNullable().defaultTo(false);
      t.boolean('probation_eligible').notNullable().defaultTo(false);
      t.boolean('encashment_eligible').notNullable().defaultTo(false);
      t.boolean('academic_coverage_required').notNullable().defaultTo(true);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.index(['college_id', 'leave_type_id'], 'hlp_college_type_idx');
    });
  }

  if (!(await knex.schema.hasTable('employee_leave_balances'))) {
    await knex.schema.createTable('employee_leave_balances', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.integer('leave_type_id').unsigned().notNullable().references('id').inTable('hr_leave_types').onDelete('CASCADE');
      t.integer('year').unsigned().notNullable();
      t.decimal('opening_balance', 6, 2).notNullable().defaultTo(0);
      t.decimal('credited', 6, 2).notNullable().defaultTo(0);
      t.decimal('availed', 6, 2).notNullable().defaultTo(0);
      t.decimal('adjusted', 6, 2).notNullable().defaultTo(0);
      t.decimal('carried_forward', 6, 2).notNullable().defaultTo(0);
      t.decimal('available_balance', 6, 2).notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.unique(['employee_id', 'leave_type_id', 'year'], { indexName: 'elb_emp_type_year_unique' });
    });
  }

  if (!(await knex.schema.hasTable('employee_leave_balance_transactions'))) {
    await knex.schema.createTable('employee_leave_balance_transactions', (t) => {
      t.increments('id').primary();
      t.integer('balance_id').unsigned().notNullable().references('id').inTable('employee_leave_balances').onDelete('CASCADE');
      t.string('transaction_type', 32).notNullable();
      t.decimal('amount', 6, 2).notNullable();
      t.decimal('balance_after', 6, 2).notNullable();
      t.string('reference_type', 64).nullable();
      t.integer('reference_id').unsigned().nullable();
      t.integer('recorded_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('notes').nullable();
      t.timestamps(true, true);
      t.index(['balance_id', 'created_at'], 'elbt_balance_created_idx');
    });
  }

  // ── Approval workflows ────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_approval_workflows'))) {
    await knex.schema.createTable('hr_approval_workflows', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 64).notNullable();
      t.string('name', 128).notNullable();
      t.string('workflow_type', 32).notNullable().defaultTo('LEAVE');
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'code']);
    });
  }

  if (!(await knex.schema.hasTable('hr_approval_workflow_steps'))) {
    await knex.schema.createTable('hr_approval_workflow_steps', (t) => {
      t.increments('id').primary();
      t.integer('workflow_id').unsigned().notNullable().references('id').inTable('hr_approval_workflows').onDelete('CASCADE');
      t.integer('step_order').unsigned().notNullable();
      t.string('approver_type', 32).notNullable();
      t.integer('specific_employee_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL');
      t.string('role_code', 64).nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.index(['workflow_id', 'step_order'], 'hawfs_workflow_order_idx');
    });
  }

  // ── Leave requests ──────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_leave_requests'))) {
    await knex.schema.createTable('hr_leave_requests', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.string('request_number', 64).notNullable();
      t.integer('leave_type_id').unsigned().notNullable().references('id').inTable('hr_leave_types').onDelete('RESTRICT');
      t.date('from_date').notNullable();
      t.date('to_date').notNullable();
      t.string('from_session', 16).notNullable().defaultTo('FULL_DAY');
      t.string('to_session', 16).notNullable().defaultTo('FULL_DAY');
      t.decimal('requested_days', 6, 2).notNullable();
      t.text('reason').nullable();
      t.boolean('is_emergency').notNullable().defaultTo(false);
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.timestamp('submitted_at').nullable();
      t.integer('current_approval_step').unsigned().nullable();
      t.string('academic_coverage_status', 32).nullable();
      t.integer('workflow_id').unsigned().nullable().references('id').inTable('hr_approval_workflows').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['request_number']);
      t.index(['employee_id', 'status'], 'hlr_emp_status_idx');
      t.index(['college_id', 'from_date', 'to_date'], 'hlr_college_dates_idx');
    });
  }

  if (!(await knex.schema.hasTable('hr_leave_actions'))) {
    await knex.schema.createTable('hr_leave_actions', (t) => {
      t.increments('id').primary();
      t.integer('leave_request_id').unsigned().notNullable().references('id').inTable('hr_leave_requests').onDelete('CASCADE');
      t.string('action', 32).notNullable();
      t.integer('actor_employee_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL');
      t.integer('actor_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('notes').nullable();
      t.json('metadata').nullable();
      t.timestamps(true, true);
      t.index(['leave_request_id', 'created_at'], 'hla_request_created_idx');
    });
  }

  // ── Academic coverage ───────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_leave_academic_coverage'))) {
    await knex.schema.createTable('hr_leave_academic_coverage', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('leave_request_id').unsigned().notNullable().references('id').inTable('hr_leave_requests').onDelete('CASCADE');
      t.integer('timetable_slot_id').unsigned().nullable().references('id').inTable('timetable_slots').onDelete('SET NULL');
      t.date('affected_date').notNullable();
      t.integer('original_faculty_employee_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL');
      t.integer('original_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('coverage_type', 32).nullable();
      t.integer('substitute_employee_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL');
      t.integer('substitute_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('swap_timetable_slot_id').unsigned().nullable().references('id').inTable('timetable_slots').onDelete('SET NULL');
      t.date('makeup_date').nullable();
      t.string('status', 32).notNullable().defaultTo('UNRESOLVED');
      t.timestamp('requested_at').nullable();
      t.timestamp('accepted_at').nullable();
      t.timestamp('verified_at').nullable();
      t.integer('verified_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('timetable_override_id').unsigned().nullable().references('id').inTable('timetable_overrides').onDelete('SET NULL');
      t.text('reason').nullable();
      t.timestamps(true, true);
      t.index(['leave_request_id', 'status'], 'hlac_request_status_idx');
      t.index(['substitute_faculty_id', 'status'], 'hlac_sub_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('hr_leave_coverage_requests'))) {
    await knex.schema.createTable('hr_leave_coverage_requests', (t) => {
      t.increments('id').primary();
      t.integer('coverage_id').unsigned().notNullable().references('id').inTable('hr_leave_academic_coverage').onDelete('CASCADE');
      t.integer('requested_to_employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.integer('requested_by_employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.string('status', 32).notNullable().defaultTo('PENDING');
      t.text('message').nullable();
      t.timestamp('responded_at').nullable();
      t.timestamps(true, true);
      t.index(['requested_to_employee_id', 'status'], 'hlcr_to_status_idx');
    });
  }

  // ── Promotion / transfer / separation ───────────────────────────────────
  if (!(await knex.schema.hasTable('employee_promotion_records'))) {
    await knex.schema.createTable('employee_promotion_records', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.integer('old_designation_id').unsigned().nullable().references('id').inTable('hr_designations').onDelete('SET NULL');
      t.integer('new_designation_id').unsigned().notNullable().references('id').inTable('hr_designations').onDelete('RESTRICT');
      t.date('effective_date').notNullable();
      t.text('reason').nullable();
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['employee_id', 'effective_date'], 'epr_emp_date_idx');
    });
  }

  if (!(await knex.schema.hasTable('employee_transfer_records'))) {
    await knex.schema.createTable('employee_transfer_records', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.integer('from_department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('to_department_id').unsigned().notNullable().references('id').inTable('departments').onDelete('RESTRICT');
      t.integer('old_reporting_manager_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL');
      t.integer('new_reporting_manager_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL');
      t.date('effective_date').notNullable();
      t.text('reason').nullable();
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['employee_id', 'effective_date'], 'etr_emp_date_idx');
    });
  }

  if (!(await knex.schema.hasTable('employee_probation_reviews'))) {
    await knex.schema.createTable('employee_probation_reviews', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.string('recommendation', 32).notNullable();
      t.text('manager_notes').nullable();
      t.text('hr_notes').nullable();
      t.date('review_date').notNullable();
      t.integer('reviewed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['employee_id'], 'eprv_emp_idx');
    });
  }

  if (!(await knex.schema.hasTable('employee_separation_requests'))) {
    await knex.schema.createTable('employee_separation_requests', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.string('separation_type', 32).notNullable();
      t.date('requested_last_working_date').nullable();
      t.date('approved_last_working_date').nullable();
      t.text('reason').nullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.timestamps(true, true);
      t.index(['employee_id', 'status'], 'esr_emp_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('employee_separation_clearance'))) {
    await knex.schema.createTable('employee_separation_clearance', (t) => {
      t.increments('id').primary();
      t.integer('separation_request_id').unsigned().notNullable().references('id').inTable('employee_separation_requests').onDelete('CASCADE');
      t.string('domain', 32).notNullable();
      t.string('status', 32).notNullable().defaultTo('PENDING');
      t.integer('cleared_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('cleared_at').nullable();
      t.text('notes').nullable();
      t.timestamps(true, true);
      t.unique(['separation_request_id', 'domain'], { indexName: 'esc_sep_domain_unique' });
    });
  }

  // ── Payroll ───────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('salary_components'))) {
    await knex.schema.createTable('salary_components', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 32).notNullable();
      t.string('name', 128).notNullable();
      t.string('component_type', 32).notNullable();
      t.boolean('is_statutory').notNullable().defaultTo(false);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'code']);
    });
  }

  if (!(await knex.schema.hasTable('salary_structures'))) {
    await knex.schema.createTable('salary_structures', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 32).notNullable();
      t.string('name', 128).notNullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'code']);
    });
  }

  if (!(await knex.schema.hasTable('salary_structure_components'))) {
    await knex.schema.createTable('salary_structure_components', (t) => {
      t.increments('id').primary();
      t.integer('structure_id').unsigned().notNullable().references('id').inTable('salary_structures').onDelete('CASCADE');
      t.integer('component_id').unsigned().notNullable().references('id').inTable('salary_components').onDelete('CASCADE');
      t.string('calculation_type', 32).notNullable().defaultTo('FIXED');
      t.decimal('amount', 12, 2).nullable();
      t.decimal('percentage', 8, 4).nullable();
      t.integer('percentage_of_component_id').unsigned().nullable().references('id').inTable('salary_components').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['structure_id', 'component_id'], { indexName: 'ssc_struct_comp_unique' });
    });
  }

  if (!(await knex.schema.hasTable('employee_salary_structures'))) {
    await knex.schema.createTable('employee_salary_structures', (t) => {
      t.increments('id').primary();
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.integer('structure_id').unsigned().notNullable().references('id').inTable('salary_structures').onDelete('RESTRICT');
      t.date('effective_from').notNullable();
      t.date('effective_to').nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.index(['employee_id', 'effective_from'], 'ess_emp_from_idx');
    });
  }

  if (!(await knex.schema.hasTable('payroll_periods'))) {
    await knex.schema.createTable('payroll_periods', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('label', 64).notNullable();
      t.date('start_date').notNullable();
      t.date('end_date').notNullable();
      t.string('status', 32).notNullable().defaultTo('OPEN');
      t.timestamps(true, true);
      t.unique(['college_id', 'label']);
    });
  }

  if (!(await knex.schema.hasTable('payroll_runs'))) {
    await knex.schema.createTable('payroll_runs', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('period_id').unsigned().notNullable().references('id').inTable('payroll_periods').onDelete('RESTRICT');
      t.string('run_number', 64).notNullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.integer('calculated_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('locked_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('locked_at').nullable();
      t.timestamps(true, true);
      t.unique(['run_number']);
      t.index(['college_id', 'status'], 'pr_college_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('payroll_run_employees'))) {
    await knex.schema.createTable('payroll_run_employees', (t) => {
      t.increments('id').primary();
      t.integer('payroll_run_id').unsigned().notNullable().references('id').inTable('payroll_runs').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.decimal('gross_amount', 12, 2).notNullable().defaultTo(0);
      t.decimal('deduction_amount', 12, 2).notNullable().defaultTo(0);
      t.decimal('net_amount', 12, 2).notNullable().defaultTo(0);
      t.string('status', 32).notNullable().defaultTo('CALCULATED');
      t.text('exception_notes').nullable();
      t.timestamps(true, true);
      t.unique(['payroll_run_id', 'employee_id'], { indexName: 'pre_run_emp_unique' });
    });
  }

  if (!(await knex.schema.hasTable('payroll_run_components'))) {
    await knex.schema.createTable('payroll_run_components', (t) => {
      t.increments('id').primary();
      t.integer('payroll_run_employee_id').unsigned().notNullable().references('id').inTable('payroll_run_employees').onDelete('CASCADE');
      t.integer('component_id').unsigned().notNullable().references('id').inTable('salary_components').onDelete('RESTRICT');
      t.decimal('amount', 12, 2).notNullable();
      t.timestamps(true, true);
      t.index(['payroll_run_employee_id'], 'prc_run_emp_idx');
    });
  }

  if (!(await knex.schema.hasTable('payroll_adjustments'))) {
    await knex.schema.createTable('payroll_adjustments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.integer('payroll_run_id').unsigned().nullable().references('id').inTable('payroll_runs').onDelete('SET NULL');
      t.integer('component_id').unsigned().nullable().references('id').inTable('salary_components').onDelete('SET NULL');
      t.decimal('amount', 12, 2).notNullable();
      t.text('reason').notNullable();
      t.string('status', 32).notNullable().defaultTo('PENDING');
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['employee_id', 'status'], 'pa_emp_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('payslips'))) {
    await knex.schema.createTable('payslips', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.integer('payroll_run_id').unsigned().notNullable().references('id').inTable('payroll_runs').onDelete('CASCADE');
      t.integer('payroll_run_employee_id').unsigned().notNullable().references('id').inTable('payroll_run_employees').onDelete('CASCADE');
      t.string('payslip_number', 64).notNullable();
      t.decimal('gross_amount', 12, 2).notNullable();
      t.decimal('deduction_amount', 12, 2).notNullable();
      t.decimal('net_amount', 12, 2).notNullable();
      t.json('breakdown').nullable();
      t.timestamps(true, true);
      t.unique(['payslip_number']);
      t.unique(['payroll_run_id', 'employee_id'], { indexName: 'payslip_run_emp_unique' });
    });
  }

  // ── HR employee requests ──────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_employee_requests'))) {
    await knex.schema.createTable('hr_employee_requests', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.string('request_type', 64).notNullable();
      t.string('request_number', 64).notNullable();
      t.text('description').nullable();
      t.string('status', 32).notNullable().defaultTo('SUBMITTED');
      t.json('payload').nullable();
      t.integer('assigned_to').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['request_number']);
      t.index(['employee_id', 'status'], 'her_emp_status_idx');
    });
  }

  // ── Faculty/employee notifications ────────────────────────────────────────
  if (!(await knex.schema.hasTable('employee_notifications'))) {
    await knex.schema.createTable('employee_notifications', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.integer('faculty_user_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      t.string('type', 64).notNullable();
      t.string('title', 255).notNullable();
      t.text('body').nullable();
      t.string('link', 512).nullable();
      t.string('related_type', 64).nullable();
      t.integer('related_id').unsigned().nullable();
      t.string('dedupe_key', 128).nullable();
      t.timestamp('read_at').nullable();
      t.timestamps(true, true);
      t.index(['employee_id', 'read_at'], 'enotif_emp_read_idx');
      t.unique(['employee_id', 'dedupe_key'], { indexName: 'enotif_emp_dedupe_unique' });
    });
  }

  // ── HR audit log ──────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_audit_log'))) {
    await knex.schema.createTable('hr_audit_log', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('actor_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('actor_employee_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL');
      t.string('action', 64).notNullable();
      t.string('entity_type', 64).notNullable();
      t.integer('entity_id').unsigned().nullable();
      t.json('before_state').nullable();
      t.json('after_state').nullable();
      t.text('reason').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'entity_type', 'entity_id'], 'hal_entity_idx');
      t.index(['college_id', 'created_at'], 'hal_college_created_idx');
    });
  }

  // ── Timetable override HR source tracking ─────────────────────────────────
  if (await knex.schema.hasTable('timetable_overrides')) {
    if (!(await knex.schema.hasColumn('timetable_overrides', 'source_type'))) {
      await knex.schema.alterTable('timetable_overrides', (t) => {
        t.string('source_type', 32).nullable();
        t.integer('source_id').unsigned().nullable();
      });
    }
  }

  // ── Transport personnel HR link ───────────────────────────────────────────
  if (await knex.schema.hasTable('transport_personnel')) {
    if (!(await knex.schema.hasColumn('transport_personnel', 'employee_id'))) {
      await knex.schema.alterTable('transport_personnel', (t) => {
        t.integer('employee_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL');
      });
    }
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  const tables = [
    'hr_audit_log',
    'employee_notifications',
    'hr_employee_requests',
    'payslips',
    'payroll_adjustments',
    'payroll_run_components',
    'payroll_run_employees',
    'payroll_runs',
    'payroll_periods',
    'employee_salary_structures',
    'salary_structure_components',
    'salary_structures',
    'salary_components',
    'employee_separation_clearance',
    'employee_separation_requests',
    'employee_probation_reviews',
    'employee_transfer_records',
    'employee_promotion_records',
    'hr_leave_coverage_requests',
    'hr_leave_academic_coverage',
    'hr_leave_actions',
    'hr_leave_requests',
    'hr_approval_workflow_steps',
    'hr_approval_workflows',
    'employee_leave_balance_transactions',
    'employee_leave_balances',
    'hr_leave_policies',
    'hr_leave_types',
    'employee_attendance_adjustments',
    'employee_attendance_records',
    'employee_shift_assignments',
    'employee_work_schedule_assignments',
    'hr_shifts',
    'hr_work_schedules',
    'employee_documents',
    'employee_onboarding_tasks',
    'employee_onboarding_records',
    'employee_service_events',
    'employees',
    'hr_designations',
    'employment_types',
    'college_hrms_policies',
  ];
  for (const table of tables) {
    if (await knex.schema.hasTable(table)) {
      await knex.schema.dropTable(table);
    }
  }
  if (await knex.schema.hasTable('timetable_overrides')) {
    if (await knex.schema.hasColumn('timetable_overrides', 'source_type')) {
      await knex.schema.alterTable('timetable_overrides', (t) => {
        t.dropColumn('source_type');
        t.dropColumn('source_id');
      });
    }
  }
  if (await knex.schema.hasTable('transport_personnel')) {
    if (await knex.schema.hasColumn('transport_personnel', 'employee_id')) {
      await knex.schema.alterTable('transport_personnel', (t) => {
        t.dropForeign(['employee_id']);
        t.dropColumn('employee_id');
      });
    }
  }
};
