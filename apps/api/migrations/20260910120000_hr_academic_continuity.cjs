/**
 * HR academic continuity — class swaps, makeup metadata, attendance attribution.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('hr_leave_class_swaps'))) {
    await knex.schema.createTable('hr_leave_class_swaps', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('leave_request_id').unsigned().notNullable().references('id').inTable('hr_leave_requests').onDelete('CASCADE');
      t.integer('coverage_id').unsigned().notNullable().references('id').inTable('hr_leave_academic_coverage').onDelete('CASCADE');
      t.integer('requesting_employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.integer('swap_employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.integer('source_timetable_slot_id').unsigned().nullable().references('id').inTable('timetable_slots').onDelete('SET NULL');
      t.date('source_date').notNullable();
      t.integer('target_timetable_slot_id').unsigned().nullable().references('id').inTable('timetable_slots').onDelete('SET NULL');
      t.date('target_date').notNullable();
      t.string('status', 32).notNullable().defaultTo('PROPOSED');
      t.timestamp('requested_at').nullable();
      t.timestamp('accepted_at').nullable();
      t.timestamp('verified_at').nullable();
      t.integer('verified_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['coverage_id', 'status'], 'hlcs_coverage_status_idx');
      t.index(['college_id', 'status'], 'hlcs_college_status_idx');
    });
  }

  if (await knex.schema.hasTable('hr_leave_academic_coverage')) {
    const cols = [
      ['priority', (t) => t.string('priority', 16).nullable()],
      ['hod_action_required', (t) => t.boolean('hod_action_required').notNullable().defaultTo(false)],
      ['makeup_start_time', (t) => t.time('makeup_start_time').nullable()],
      ['makeup_end_time', (t) => t.time('makeup_end_time').nullable()],
      ['makeup_room_id', (t) => t.integer('makeup_room_id').unsigned().nullable().references('id').inTable('rooms').onDelete('SET NULL')],
      ['swap_id', (t) => t.integer('swap_id').unsigned().nullable()],
      ['secondary_override_id', (t) => t.integer('secondary_override_id').unsigned().nullable().references('id').inTable('timetable_overrides').onDelete('SET NULL')],
      ['makeup_kind', (t) => t.string('makeup_kind', 16).nullable()],
      ['verified_by_employee_id', (t) => t.integer('verified_by_employee_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL')],
    ];
    for (const [name, add] of cols) {
      if (!(await knex.schema.hasColumn('hr_leave_academic_coverage', name))) {
        await knex.schema.alterTable('hr_leave_academic_coverage', add);
      }
    }
  }

  if (await knex.schema.hasTable('hr_leave_coverage_requests')) {
    if (!(await knex.schema.hasColumn('hr_leave_coverage_requests', 'request_type'))) {
      await knex.schema.alterTable('hr_leave_coverage_requests', (t) => {
        t.string('request_type', 32).notNullable().defaultTo('SUBSTITUTE');
      });
    }
    if (!(await knex.schema.hasColumn('hr_leave_coverage_requests', 'swap_id'))) {
      await knex.schema.alterTable('hr_leave_coverage_requests', (t) => {
        t.integer('swap_id').unsigned().nullable();
      });
    }
  }

  if (await knex.schema.hasTable('attendance_sessions')) {
    const attCols = [
      ['original_faculty_id', (t) => t.integer('original_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL')],
      ['delivered_by_faculty_id', (t) => t.integer('delivered_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL')],
      ['session_source', (t) => t.string('session_source', 32).nullable()],
    ];
    for (const [name, add] of attCols) {
      if (!(await knex.schema.hasColumn('attendance_sessions', name))) {
        await knex.schema.alterTable('attendance_sessions', add);
      }
    }
  }
};

exports.down = async function down(knex) {
  if (await knex.schema.hasTable('attendance_sessions')) {
    for (const col of ['session_source', 'delivered_by_faculty_id', 'original_faculty_id']) {
      if (await knex.schema.hasColumn('attendance_sessions', col)) {
        await knex.schema.alterTable('attendance_sessions', (t) => t.dropColumn(col));
      }
    }
  }
  if (await knex.schema.hasTable('hr_leave_coverage_requests')) {
    for (const col of ['swap_id', 'request_type']) {
      if (await knex.schema.hasColumn('hr_leave_coverage_requests', col)) {
        await knex.schema.alterTable('hr_leave_coverage_requests', (t) => t.dropColumn(col));
      }
    }
  }
  if (await knex.schema.hasTable('hr_leave_academic_coverage')) {
    for (const col of [
      'verified_by_employee_id',
      'makeup_kind',
      'secondary_override_id',
      'swap_id',
      'makeup_room_id',
      'makeup_end_time',
      'makeup_start_time',
      'hod_action_required',
      'priority',
    ]) {
      if (await knex.schema.hasColumn('hr_leave_academic_coverage', col)) {
        await knex.schema.alterTable('hr_leave_academic_coverage', (t) => t.dropColumn(col));
      }
    }
  }
  if (await knex.schema.hasTable('hr_leave_class_swaps')) {
    await knex.schema.dropTable('hr_leave_class_swaps');
  }
};
