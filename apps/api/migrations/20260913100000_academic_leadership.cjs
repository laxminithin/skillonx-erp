/**
 * Academic Leadership — HOD + Principal
 *
 * Effective-dated assignments layered on Employee Lifecycle identity.
 * Does not replace faculty_users.role or create parallel employee/leave masters.
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('academic_leadership_assignments'))) {
    await knex.schema.createTable('academic_leadership_assignments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.string('leadership_role', 32).notNullable();
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.date('effective_from').notNullable();
      t.date('effective_to').nullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.integer('created_by').unsigned().nullable();
      t.integer('updated_by').unsigned().nullable();
      t.text('remarks').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'leadership_role', 'department_id'], 'ala_col_role_dept_idx');
      t.index(['employee_id', 'status'], 'ala_emp_status_idx');
      t.index(['college_id', 'effective_from', 'effective_to'], 'ala_col_dates_idx');
      t.index(['college_id', 'status', 'leadership_role'], 'ala_col_stat_role_idx');
    });
  }

  if (await knex.schema.hasTable('hr_leave_requests')) {
    const addCol = async (col, builder) => {
      if (!(await knex.schema.hasColumn('hr_leave_requests', col))) {
        await knex.schema.alterTable('hr_leave_requests', builder);
      }
    };
    await addCol('academic_approver_employee_id', (t) => {
      t.integer('academic_approver_employee_id').unsigned().nullable();
    });
    await addCol('academic_approved_by_employee_id', (t) => {
      t.integer('academic_approved_by_employee_id').unsigned().nullable();
    });
    await addCol('academic_approved_at', (t) => {
      t.timestamp('academic_approved_at').nullable();
    });
    try {
      await knex.schema.alterTable('hr_leave_requests', (t) => {
        t.index(['academic_approver_employee_id', 'status'], 'hlr_acad_appr_status_idx');
      });
    } catch {
      /* index may already exist */
    }
  }
};

exports.down = async function down(knex) {
  if (await knex.schema.hasTable('hr_leave_requests')) {
    const dropCol = async (col) => {
      if (await knex.schema.hasColumn('hr_leave_requests', col)) {
        await knex.schema.alterTable('hr_leave_requests', (t) => t.dropColumn(col));
      }
    };
    try {
      await knex.schema.alterTable('hr_leave_requests', (t) => {
        t.dropIndex(['academic_approver_employee_id', 'status'], 'hlr_acad_appr_status_idx');
      });
    } catch {
      /* ignore */
    }
    await dropCol('academic_approved_at');
    await dropCol('academic_approved_by_employee_id');
    await dropCol('academic_approver_employee_id');
  }
  if (await knex.schema.hasTable('academic_leadership_assignments')) {
    await knex.schema.dropTable('academic_leadership_assignments');
  }
};
