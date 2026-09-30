/**
 * Alumni Intelligence Assistant (Phase C8) — governance, sessions, audit.
 *
 * C8 is NOT a new operational SoT. It orchestrates C1–C7 under RBAC.
 * AI never becomes authoritative. Provider status is honest.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const fk = (col, table, onDelete, name) =>
    col.unsigned().references('id').inTable(table).onDelete(onDelete).withKeyName(name);

  if (!(await knex.schema.hasTable('alumni_assistant_config'))) {
    await knex.schema.createTable('alumni_assistant_config', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aacfg_college_fk');
      t.boolean('enabled').notNullable().defaultTo(false);
      /** NOT_CONFIGURED | CONFIGURED_NOT_VALIDATED | VALIDATED */
      t.string('provider_status', 32).notNullable().defaultTo('NOT_CONFIGURED');
      t.string('provider_name', 64).nullable();
      t.string('model_id', 128).nullable();
      t.integer('max_requests_per_user_hour').unsigned().notNullable().defaultTo(60);
      t.integer('max_input_chars').unsigned().notNullable().defaultTo(4000);
      t.integer('max_output_chars').unsigned().notNullable().defaultTo(8000);
      t.integer('provider_timeout_ms').unsigned().notNullable().defaultTo(15000);
      /** Days to retain conversation/audit rows; null = indefinite until policy set */
      t.integer('retention_days').unsigned().nullable();
      t.text('notes').nullable();
      t.timestamps(true, true);
      t.unique(['college_id'], { indexName: 'aacfg_college_uq' });
    });
  }

  if (!(await knex.schema.hasTable('alumni_assistant_sessions'))) {
    await knex.schema.createTable('alumni_assistant_sessions', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aas_college_fk');
      fk(t.integer('faculty_user_id').notNullable(), 'faculty_users', 'CASCADE', 'aas_faculty_fk');
      t.string('role_snapshot', 64).notNullable();
      t.integer('department_id').unsigned().nullable();
      /** Optional contextual alumni id — server re-resolves; never trust client blobs */
      fk(t.integer('context_alumni_profile_id').nullable(), 'alumni_profiles', 'SET NULL', 'aas_ctx_alumni_fk');
      t.string('context_surface', 64).nullable();
      t.timestamp('last_activity_at').notNullable().defaultTo(knex.fn.now());
      t.timestamps(true, true);
      t.index(['college_id', 'faculty_user_id'], 'aas_user_idx');
      t.index(['college_id', 'last_activity_at'], 'aas_activity_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_assistant_messages'))) {
    await knex.schema.createTable('alumni_assistant_messages', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aam_college_fk');
      fk(t.integer('session_id').notNullable(), 'alumni_assistant_sessions', 'CASCADE', 'aam_session_fk');
      /** USER | ASSISTANT | SYSTEM */
      t.string('role', 16).notNullable();
      t.text('content').notNullable();
      /** JSON: intent, tools, evidence refs, data quality, draft actions — not alumni SoT */
      t.text('structured_payload').nullable();
      t.timestamps(true, true);
      t.index(['session_id', 'id'], 'aam_session_id_idx');
      t.index(['college_id', 'created_at'], 'aam_college_time_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_assistant_audit'))) {
    await knex.schema.createTable('alumni_assistant_audit', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aaa_college_fk');
      fk(t.integer('faculty_user_id').notNullable(), 'faculty_users', 'CASCADE', 'aaa_faculty_fk');
      fk(t.integer('session_id').nullable(), 'alumni_assistant_sessions', 'SET NULL', 'aaa_session_fk');
      t.string('intent', 64).nullable();
      /** Safe truncated representation of question — avoid unnecessary PII */
      t.string('question_safe', 512).nullable();
      t.text('tools_used').nullable();
      t.text('source_references').nullable();
      t.string('action_proposed', 64).nullable();
      t.boolean('action_confirmed').nullable();
      t.string('provider_status', 32).notNullable().defaultTo('NOT_CONFIGURED');
      t.string('provider_model', 128).nullable();
      t.integer('latency_ms').unsigned().nullable();
      t.integer('provider_latency_ms').unsigned().nullable();
      t.boolean('blocked').notNullable().defaultTo(false);
      t.string('block_reason', 128).nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'created_at'], 'aaa_college_time_idx');
      t.index(['college_id', 'faculty_user_id'], 'aaa_user_idx');
      t.index(['college_id', 'intent'], 'aaa_intent_idx');
    });
  }

  if (!(await knex.schema.hasTable('alumni_assistant_telemetry'))) {
    await knex.schema.createTable('alumni_assistant_telemetry', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aat_college_fk');
      t.string('event_type', 64).notNullable();
      t.string('intent', 64).nullable();
      t.string('tool_name', 64).nullable();
      t.integer('latency_ms').unsigned().nullable();
      t.boolean('success').notNullable().defaultTo(true);
      t.string('error_code', 64).nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'event_type', 'created_at'], 'aat_event_idx');
    });
  }
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('alumni_assistant_telemetry');
  await knex.schema.dropTableIfExists('alumni_assistant_audit');
  await knex.schema.dropTableIfExists('alumni_assistant_messages');
  await knex.schema.dropTableIfExists('alumni_assistant_sessions');
  await knex.schema.dropTableIfExists('alumni_assistant_config');
};
