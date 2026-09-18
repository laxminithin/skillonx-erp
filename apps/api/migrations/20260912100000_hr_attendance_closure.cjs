/**
 * HRMS Attendance & Leave Closure — schema extensions.
 * Reuses employee_attendance_records, hr_shifts, employee_shift_assignments,
 * employee_attendance_adjustments, hr_work_schedules from hrms_module.
 */
exports.up = async function up(knex) {
  // ── Attendance institution settings ─────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_attendance_settings'))) {
    await knex.schema.createTable('hr_attendance_settings', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('default_work_schedule_id').unsigned().nullable();
      t.integer('default_shift_id').unsigned().nullable();
      t.string('sandwich_leave_policy', 32).notNullable().defaultTo('DISABLED');
      t.boolean('late_marks_count_as_lop').notNullable().defaultTo(false);
      t.boolean('auto_flag_missing_punch').notNullable().defaultTo(true);
      t.integer('missing_punch_grace_hours').unsigned().notNullable().defaultTo(24);
      t.boolean('require_regularization_approval').notNullable().defaultTo(true);
      t.json('settings_json').nullable();
      t.timestamps(true, true);
      t.unique(['college_id']);
    });
  }

  // ── HR holiday calendar ─────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_attendance_holidays'))) {
    await knex.schema.createTable('hr_attendance_holidays', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('name', 128).notNullable();
      t.date('holiday_date').notNullable();
      t.string('holiday_type', 32).notNullable().defaultTo('INSTITUTION');
      t.text('description').nullable();
      t.integer('department_id').unsigned().nullable();
      t.string('employee_category', 32).nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.index(['college_id', 'holiday_date'], 'hr_hol_col_date_idx');
      t.unique(['college_id', 'holiday_date', 'name'], 'hr_hol_unique');
    });
  }

  // ── Extend hr_shifts ────────────────────────────────────────────────────
  if (await knex.schema.hasTable('hr_shifts')) {
    const addCol = async (col, def) => {
      if (!(await knex.schema.hasColumn('hr_shifts', col))) {
        await knex.schema.alterTable('hr_shifts', (t) => {
          if (def === 'int') t.integer(col).unsigned().nullable();
          else if (def === 'bool') t.boolean(col).notNullable().defaultTo(false);
          else if (def === 'date') t.date(col).nullable();
        });
      }
    };
    await addCol('break_duration_minutes', 'int');
    await addCol('grace_in_minutes', 'int');
    await addCol('grace_out_minutes', 'int');
    await addCol('late_threshold_minutes', 'int');
    await addCol('early_out_threshold_minutes', 'int');
    await addCol('minimum_full_day_minutes', 'int');
    await addCol('minimum_half_day_minutes', 'int');
    await addCol('crosses_midnight', 'bool');
    await addCol('effective_from', 'date');
    await addCol('effective_to', 'date');
  }

  // ── Extend employee_shift_assignments ───────────────────────────────────
  if (await knex.schema.hasTable('employee_shift_assignments')) {
    if (!(await knex.schema.hasColumn('employee_shift_assignments', 'college_id'))) {
      await knex.schema.alterTable('employee_shift_assignments', (t) => {
        t.integer('college_id').unsigned().nullable();
        t.string('source', 32).nullable();
        t.text('remarks').nullable();
      });
    }
  }

  // ── Raw punch events ────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('employee_attendance_punches'))) {
    await knex.schema.createTable('employee_attendance_punches', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.timestamp('punch_at').notNullable();
      t.string('punch_type', 16).nullable();
      t.string('source', 32).notNullable().defaultTo('MANUAL');
      t.string('device_id', 64).nullable();
      t.string('external_event_id', 128).nullable();
      t.timestamp('imported_at').nullable();
      t.json('raw_metadata').nullable();
      t.timestamps(true, true);
      t.index(['employee_id', 'punch_at'], 'eap_emp_punch_idx');
      t.index(['college_id', 'punch_at'], 'eap_col_punch_idx');
      t.unique(['college_id', 'external_event_id'], 'eap_ext_event_unique');
    });
  }

  // ── Extend daily attendance records ─────────────────────────────────────
  if (await knex.schema.hasTable('employee_attendance_records')) {
    const addEarCol = async (col, type) => {
      if (!(await knex.schema.hasColumn('employee_attendance_records', col))) {
        await knex.schema.alterTable('employee_attendance_records', (t) => {
          if (type === 'int') t.integer(col).unsigned().nullable();
          else if (type === 'bool') t.boolean(col).notNullable().defaultTo(false);
          else if (type === 'str') t.string(col, 32).nullable();
        });
      }
    };
    await addEarCol('shift_id', 'int');
    await addEarCol('leave_request_id', 'int');
    await addEarCol('holiday_id', 'int');
    await addEarCol('overtime_minutes', 'int');
    await addEarCol('calculation_version', 'int');
    await addEarCol('is_manual_override', 'bool');
    await addEarCol('is_locked', 'bool');
    await addEarCol('override_reason', 'str');
    if (!(await knex.schema.hasColumn('employee_attendance_records', 'early_out_minutes'))) {
      if (await knex.schema.hasColumn('employee_attendance_records', 'early_exit_minutes')) {
        // keep early_exit_minutes; add alias column only if missing both semantics
      } else {
        await knex.schema.alterTable('employee_attendance_records', (t) => {
          t.integer('early_out_minutes').unsigned().nullable().defaultTo(0);
        });
      }
    }
  }

  // ── Extend regularization/adjustments ───────────────────────────────────
  if (await knex.schema.hasTable('employee_attendance_adjustments')) {
    const addAdjCol = async (col, type) => {
      if (!(await knex.schema.hasColumn('employee_attendance_adjustments', col))) {
        await knex.schema.alterTable('employee_attendance_adjustments', (t) => {
          if (type === 'ts') t.timestamp(col).nullable();
          else if (type === 'str') t.string(col, 64).nullable();
          else if (type === 'text') t.text(col).nullable();
          else if (type === 'int') t.integer(col).unsigned().nullable();
        });
      }
    };
    await addAdjCol('requested_in_at', 'ts');
    await addAdjCol('requested_out_at', 'ts');
    await addAdjCol('regularization_reason', 'str');
    await addAdjCol('decision_remarks', 'text');
    await addAdjCol('attendance_record_id', 'int');
    await addAdjCol('rejected_by', 'int');
    await addAdjCol('rejected_at', 'ts');
  }

  // ── Monthly attendance summary ──────────────────────────────────────────
  if (!(await knex.schema.hasTable('employee_monthly_attendance'))) {
    await knex.schema.createTable('employee_monthly_attendance', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.integer('year').unsigned().notNullable();
      t.integer('month').unsigned().notNullable();
      t.integer('calendar_days').unsigned().notNullable().defaultTo(0);
      t.integer('employment_applicable_days').unsigned().notNullable().defaultTo(0);
      t.integer('working_days').unsigned().notNullable().defaultTo(0);
      t.integer('holidays').unsigned().notNullable().defaultTo(0);
      t.integer('weekly_offs').unsigned().notNullable().defaultTo(0);
      t.decimal('present_days', 6, 2).notNullable().defaultTo(0);
      t.decimal('paid_leave_days', 6, 2).notNullable().defaultTo(0);
      t.decimal('unpaid_leave_days', 6, 2).notNullable().defaultTo(0);
      t.decimal('half_days', 6, 2).notNullable().defaultTo(0);
      t.decimal('absence_days', 6, 2).notNullable().defaultTo(0);
      t.decimal('od_wfh_days', 6, 2).notNullable().defaultTo(0);
      t.decimal('payable_days', 6, 2).notNullable().defaultTo(0);
      t.decimal('lop_days', 6, 2).notNullable().defaultTo(0);
      t.integer('late_count').unsigned().notNullable().defaultTo(0);
      t.integer('early_out_count').unsigned().notNullable().defaultTo(0);
      t.integer('unresolved_count').unsigned().notNullable().defaultTo(0);
      t.string('status', 32).notNullable().defaultTo('OPEN');
      t.integer('calculation_version').unsigned().notNullable().defaultTo(1);
      t.timestamp('calculated_at').nullable();
      t.timestamps(true, true);
      t.unique(['employee_id', 'year', 'month'], 'ema_emp_ym_unique');
      t.index(['college_id', 'year', 'month'], 'ema_col_ym_idx');
    });
  }

  // ── Month closure ───────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_attendance_month_closures'))) {
    await knex.schema.createTable('hr_attendance_month_closures', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('year').unsigned().notNullable();
      t.integer('month').unsigned().notNullable();
      t.string('status', 32).notNullable().defaultTo('OPEN');
      t.integer('exception_count').unsigned().notNullable().defaultTo(0);
      t.integer('processed_by').unsigned().nullable();
      t.timestamp('processed_at').nullable();
      t.integer('finalized_by').unsigned().nullable();
      t.timestamp('finalized_at').nullable();
      t.integer('locked_by').unsigned().nullable();
      t.timestamp('locked_at').nullable();
      t.integer('reopened_by').unsigned().nullable();
      t.timestamp('reopened_at').nullable();
      t.text('reopen_reason').nullable();
      t.integer('calculation_version').unsigned().notNullable().defaultTo(1);
      t.timestamps(true, true);
      t.unique(['college_id', 'year', 'month'], 'hamc_col_ym_unique');
    });
  }

  // ── HR override audit trail ─────────────────────────────────────────────
  if (!(await knex.schema.hasTable('hr_attendance_overrides'))) {
    await knex.schema.createTable('hr_attendance_overrides', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('attendance_record_id').unsigned().notNullable();
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.date('attendance_date').notNullable();
      t.string('before_status', 32).notNullable();
      t.string('after_status', 32).notNullable();
      t.text('reason').notNullable();
      t.integer('actor_faculty_id').unsigned().nullable();
      t.timestamps(true, true);
      t.index(['employee_id', 'attendance_date'], 'hao_emp_date_idx');
    });
  }
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('hr_attendance_overrides');
  await knex.schema.dropTableIfExists('hr_attendance_month_closures');
  await knex.schema.dropTableIfExists('employee_monthly_attendance');
  await knex.schema.dropTableIfExists('employee_attendance_punches');
  await knex.schema.dropTableIfExists('hr_attendance_holidays');
  await knex.schema.dropTableIfExists('hr_attendance_settings');
};
