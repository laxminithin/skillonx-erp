/**
 * Parent / Guardian Web Portal identity and verified student links.
 *
 * Uses the same password/JWT stack as existing ERP identities, but keeps
 * parent accounts separate from faculty/student records and gates every
 * student-facing read through parent_student_links.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('parent_users'))) {
    await knex.schema.createTable('parent_users', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('name', 255).notNullable();
      t.string('email', 255).notNullable();
      t.string('phone', 32).nullable();
      t.string('password_hash', 255).notNullable();
      t.boolean('identity_verified').notNullable().defaultTo(false);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.string('reset_token', 255).nullable();
      t.timestamp('reset_token_expires_at').nullable();
      t.timestamp('last_login_at').nullable();
      t.timestamp('last_password_change_at').nullable();
      t.timestamps(true, true);
      t.unique(['email'], { indexName: 'parent_users_email_global_unique' });
      t.index(['college_id', 'is_active'], 'parent_users_college_active_idx');
    });
  }

  if (!(await knex.schema.hasTable('parent_student_links'))) {
    await knex.schema.createTable('parent_student_links', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('parent_user_id').unsigned().notNullable().references('id').inTable('parent_users').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.string('relationship_type', 32).notNullable();
      t.boolean('is_primary_guardian').notNullable().defaultTo(false);
      t.string('verification_state', 24).notNullable().defaultTo('PENDING');
      t.boolean('is_active').notNullable().defaultTo(true);
      t.integer('verified_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('verified_at').nullable();
      t.json('verification_metadata').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'parent_user_id', 'student_id'], { indexName: 'psl_college_parent_student_unique' });
      t.index(['college_id', 'student_id', 'is_active'], 'psl_college_student_active_idx');
      t.index(['college_id', 'parent_user_id', 'is_active'], 'psl_college_parent_active_idx');
    });
  }

  if (!(await knex.schema.hasTable('parent_audit_log'))) {
    await knex.schema.createTable('parent_audit_log', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('parent_user_id').unsigned().nullable().references('id').inTable('parent_users').onDelete('SET NULL');
      t.integer('student_id').unsigned().nullable().references('id').inTable('students').onDelete('SET NULL');
      t.string('action', 64).notNullable();
      t.string('entity_type', 64).nullable();
      t.integer('entity_id').unsigned().nullable();
      t.json('metadata').nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'parent_user_id', 'created_at'], 'pal_college_parent_created_idx');
      t.index(['college_id', 'student_id', 'created_at'], 'pal_college_student_created_idx');
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  for (const table of ['parent_audit_log', 'parent_student_links', 'parent_users']) {
    if (await knex.schema.hasTable(table)) await knex.schema.dropTable(table);
  }
};
