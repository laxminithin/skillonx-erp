/**
 * Campus OS Phase 0 — shared Workflow / Approval engine.
 *
 * A deliberately small institutional approval engine (definitions -> steps ->
 * transitions -> instances -> append-only history), for NEW WORK ONLY. No existing
 * module's approval logic (Procurement indents/POs, Grievance case engine, Lab
 * requirement chain, Admissions, Office register, etc.) is retrofitted onto this.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('workflow_definitions'))) {
    await knex.schema.createTable('workflow_definitions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 64).notNullable();
      t.string('name', 191).notNullable();
      t.integer('version').unsigned().notNullable().defaultTo(1);
      t.string('entity_type', 96).notNullable();
      t.boolean('is_active').notNullable().defaultTo(false);
      t.integer('created_by').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.timestamps(true, true);
      t.unique(['college_id', 'code', 'version'], { indexName: 'workflow_def_college_code_version_unique' });
      t.index(['college_id', 'entity_type'], 'workflow_def_college_entity_idx');
    });
  }

  if (!(await knex.schema.hasTable('workflow_steps'))) {
    await knex.schema.createTable('workflow_steps', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('definition_id').unsigned().notNullable().references('id').inTable('workflow_definitions').onDelete('CASCADE');
      t.string('step_key', 64).notNullable();
      t.string('name', 191).notNullable();
      t.integer('step_order').unsigned().notNullable();
      t.json('allowed_roles').notNullable();
      t.boolean('is_initial').notNullable().defaultTo(false);
      t.boolean('is_terminal').notNullable().defaultTo(false);
      t.string('terminal_status', 32).nullable();
      t.timestamps(true, true);
      t.unique(['definition_id', 'step_key'], { indexName: 'workflow_step_def_key_unique' });
      t.index(['college_id', 'definition_id'], 'workflow_step_college_def_idx');
    });
  }

  if (!(await knex.schema.hasTable('workflow_transitions'))) {
    await knex.schema.createTable('workflow_transitions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('definition_id').unsigned().notNullable().references('id').inTable('workflow_definitions').onDelete('CASCADE');
      t.integer('from_step_id').unsigned().nullable().references('id').inTable('workflow_steps').onDelete('CASCADE');
      t.string('action', 32).notNullable();
      t.integer('to_step_id').unsigned().notNullable().references('id').inTable('workflow_steps').onDelete('CASCADE');
      t.timestamps(true, true);
      t.index(['definition_id', 'from_step_id', 'action'], 'workflow_transition_lookup_idx');
    });
  }

  if (!(await knex.schema.hasTable('workflow_instances'))) {
    await knex.schema.createTable('workflow_instances', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('definition_id').unsigned().notNullable().references('id').inTable('workflow_definitions').onDelete('RESTRICT');
      t.integer('definition_version').unsigned().notNullable();
      t.string('entity_type', 96).notNullable();
      t.integer('entity_id').unsigned().notNullable();
      t.integer('current_step_id').unsigned().notNullable().references('id').inTable('workflow_steps').onDelete('RESTRICT');
      t.string('status', 32).notNullable().defaultTo('IN_PROGRESS');
      t.integer('initiator_faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.timestamp('completed_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'entity_type', 'entity_id'], 'workflow_instance_entity_idx');
      t.index(['college_id', 'status'], 'workflow_instance_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('workflow_instance_history'))) {
    await knex.schema.createTable('workflow_instance_history', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('instance_id').unsigned().notNullable().references('id').inTable('workflow_instances').onDelete('CASCADE');
      t.integer('from_step_id').unsigned().nullable().references('id').inTable('workflow_steps').onDelete('SET NULL');
      t.string('action', 32).notNullable();
      t.integer('to_step_id').unsigned().nullable().references('id').inTable('workflow_steps').onDelete('SET NULL');
      t.integer('actor_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.string('role_at_action', 64).notNullable();
      t.text('remarks').nullable();
      t.string('previous_status', 32).notNullable();
      t.string('resulting_status', 32).notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      t.index(['college_id', 'instance_id', 'created_at'], 'workflow_history_instance_idx');
    });
  }
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('workflow_instance_history');
  await knex.schema.dropTableIfExists('workflow_instances');
  await knex.schema.dropTableIfExists('workflow_transitions');
  await knex.schema.dropTableIfExists('workflow_steps');
  await knex.schema.dropTableIfExists('workflow_definitions');
};
