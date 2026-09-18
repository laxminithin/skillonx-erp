/**
 * Effective-dated T&P Officer / Coordinator assignments.
 * Capability overlay on Employee + Faculty — does not replace faculty_users.role.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('tp_leadership_assignments'))) {
    await knex.schema.createTable('tp_leadership_assignments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
      t.string('tp_role', 40).notNullable();
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.date('effective_from').notNullable();
      t.date('effective_to').nullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.integer('created_by').unsigned().nullable();
      t.integer('updated_by').unsigned().nullable();
      t.text('remarks').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'tp_role', 'department_id'], 'tla_col_role_dept_idx');
      t.index(['employee_id', 'status'], 'tla_emp_status_idx');
      t.index(['college_id', 'status', 'tp_role'], 'tla_col_stat_role_idx');
    });
  }
};

exports.down = async function down(knex) {
  if (await knex.schema.hasTable('tp_leadership_assignments')) {
    await knex.schema.dropTable('tp_leadership_assignments');
  }
};
