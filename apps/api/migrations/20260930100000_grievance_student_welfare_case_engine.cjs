/**
 * Student Grievance & Welfare canonical case engine hardening.
 * Additive only: preserves the existing student_grievances surface and adds
 * concurrency-safe numbering, timeline, internal notes, communication,
 * referrals, assignments, resolutions, appeals, and configurable routing.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const hasTable = (name) => knex.schema.hasTable(name);
  const hasColumn = (table, column) => knex.schema.hasColumn(table, column);

  if (await hasTable('student_grievances')) {
    const add = async (column, cb) => {
      if (!(await hasColumn('student_grievances', column))) {
        await knex.schema.alterTable('student_grievances', cb);
      }
    };
    await add('case_type', (t) => t.string('case_type', 64).nullable().after('category'));
    await add('official_priority', (t) => t.string('official_priority', 16).notNullable().defaultTo('NORMAL').after('priority'));
    await add('student_urgency_reason', (t) => t.text('student_urgency_reason').nullable().after('official_priority'));
    await add('severity', (t) => t.string('severity', 16).notNullable().defaultTo('NORMAL').after('student_urgency_reason'));
    await add('assigned_role', (t) => t.string('assigned_role', 64).nullable().after('assigned_to_faculty_id'));
    await add('assigned_team', (t) => t.string('assigned_team', 64).nullable().after('assigned_role'));
    await add('source_module', (t) => t.string('source_module', 64).nullable().after('request_id'));
    await add('source_entity_type', (t) => t.string('source_entity_type', 64).nullable().after('source_module'));
    await add('source_entity_id', (t) => t.string('source_entity_id', 64).nullable().after('source_entity_type'));
    await add('linked_reference', (t) => t.string('linked_reference', 128).nullable().after('source_entity_id'));
    await add('is_anonymous', (t) => t.boolean('is_anonymous').notNullable().defaultTo(false).after('confidentiality'));
    await add('requester_visible_status', (t) => t.string('requester_visible_status', 32).nullable().after('status'));
    await add('acknowledged_by_faculty_id', (t) => t.integer('acknowledged_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL').after('submitted_at'));
    await add('first_response_at', (t) => t.timestamp('first_response_at').nullable().after('acknowledged_by_faculty_id'));
    await add('due_at', (t) => t.timestamp('due_at').nullable().after('resolution_sla_hours'));
    await add('sla_paused_at', (t) => t.timestamp('sla_paused_at').nullable().after('due_at'));
    await add('sla_paused_ms', (t) => t.bigInteger('sla_paused_ms').notNullable().defaultTo(0).after('sla_paused_at'));
    await add('resolution_public_summary', (t) => t.text('resolution_public_summary').nullable().after('resolution_summary'));
    await add('resolution_feedback', (t) => t.string('resolution_feedback', 32).nullable().after('student_acknowledged'));
    await add('resolution_feedback_reason', (t) => t.text('resolution_feedback_reason').nullable().after('resolution_feedback'));
    await add('reopen_count', (t) => t.integer('reopen_count').notNullable().defaultTo(0).after('acknowledged_at'));
    await add('appeal_count', (t) => t.integer('appeal_count').notNullable().defaultTo(0).after('reopen_count'));
  }

  if (!(await hasTable('student_grievance_sequences'))) {
    await knex.schema.createTable('student_grievance_sequences', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('series', 32).notNullable().defaultTo('GRV');
      t.string('academic_year', 16).notNullable();
      t.integer('last_number').notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.unique(['college_id', 'series', 'academic_year'], { indexName: 'sgseq_college_series_year_unique' });
    });
  }

  if (!(await hasTable('student_grievance_categories'))) {
    await knex.schema.createTable('student_grievance_categories', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 64).notNullable();
      t.string('label', 255).notNullable();
      t.string('case_type', 64).notNullable();
      t.string('default_confidentiality', 16).notNullable().defaultTo('NORMAL');
      t.string('default_priority', 16).notNullable().defaultTo('NORMAL');
      t.integer('response_sla_hours').nullable();
      t.integer('resolution_sla_hours').nullable();
      t.string('routing_role', 64).nullable();
      t.string('routing_module', 64).nullable();
      t.boolean('allow_student_confidentiality').notNullable().defaultTo(true);
      t.boolean('allow_appeal').notNullable().defaultTo(true);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.integer('sort_order').notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'sgcat_college_code_unique' });
      t.index(['college_id', 'is_active', 'sort_order'], 'sgcat_active_idx');
    });
  }

  if (!(await hasTable('student_grievance_assignments'))) {
    await knex.schema.createTable('student_grievance_assignments', (t) => {
      t.increments('id').primary();
      t.integer('grievance_id').unsigned().notNullable().references('id').inTable('student_grievances').onDelete('CASCADE');
      t.integer('previous_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('new_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('previous_role', 64).nullable();
      t.string('new_role', 64).nullable();
      t.integer('actor_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('reason').nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['grievance_id', 'created_at'], 'sgassign_case_created_idx');
    });
  }

  if (!(await hasTable('student_grievance_events'))) {
    await knex.schema.createTable('student_grievance_events', (t) => {
      t.increments('id').primary();
      t.integer('grievance_id').unsigned().notNullable().references('id').inTable('student_grievances').onDelete('CASCADE');
      t.string('event_type', 64).notNullable();
      t.string('from_value', 128).nullable();
      t.string('to_value', 128).nullable();
      t.integer('actor_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('actor_student_id').unsigned().nullable().references('id').inTable('students').onDelete('SET NULL');
      t.boolean('requester_visible').notNullable().defaultTo(false);
      t.text('public_message').nullable();
      t.text('internal_message').nullable();
      t.json('metadata').nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['grievance_id', 'created_at'], 'sgevt_case_created_idx');
      t.index(['grievance_id', 'requester_visible'], 'sgevt_case_visible_idx');
    });
  }

  if (!(await hasTable('student_grievance_messages'))) {
    await knex.schema.createTable('student_grievance_messages', (t) => {
      t.increments('id').primary();
      t.integer('grievance_id').unsigned().notNullable().references('id').inTable('student_grievances').onDelete('CASCADE');
      t.integer('author_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('author_student_id').unsigned().nullable().references('id').inTable('students').onDelete('SET NULL');
      t.string('message_type', 32).notNullable().defaultTo('REQUESTER_COMMUNICATION');
      t.text('body').notNullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['grievance_id', 'created_at'], 'sgmsg_case_created_idx');
    });
  }

  if (!(await hasTable('student_grievance_attachments'))) {
    await knex.schema.createTable('student_grievance_attachments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('grievance_id').unsigned().notNullable().references('id').inTable('student_grievances').onDelete('CASCADE');
      t.string('file_name', 255).notNullable();
      t.string('mime_type', 128).notNullable();
      t.integer('file_size').notNullable();
      t.string('storage_key', 512).notNullable();
      t.string('visibility', 16).notNullable().defaultTo('CASE');
      t.integer('uploaded_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('uploaded_by_student_id').unsigned().nullable().references('id').inTable('students').onDelete('SET NULL');
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'grievance_id'], 'sgatt_college_case_idx');
      t.index(['grievance_id', 'visibility'], 'sgatt_case_visibility_idx');
    });
  }

  if (!(await hasTable('student_grievance_notes'))) {
    await knex.schema.createTable('student_grievance_notes', (t) => {
      t.increments('id').primary();
      t.integer('grievance_id').unsigned().notNullable().references('id').inTable('student_grievances').onDelete('CASCADE');
      t.integer('author_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('visibility', 16).notNullable().defaultTo('TEAM');
      t.text('body').notNullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['grievance_id', 'visibility'], 'sgnote_case_visibility_idx');
    });
  }

  if (!(await hasTable('student_grievance_referrals'))) {
    await knex.schema.createTable('student_grievance_referrals', (t) => {
      t.increments('id').primary();
      t.integer('grievance_id').unsigned().notNullable().references('id').inTable('student_grievances').onDelete('CASCADE');
      t.string('target_module', 64).notNullable();
      t.string('target_entity_type', 64).nullable();
      t.string('target_entity_id', 64).nullable();
      t.string('safe_reference', 128).nullable();
      t.string('status', 32).notNullable().defaultTo('REFERRED');
      t.text('safe_summary').nullable();
      t.integer('created_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.timestamp('closed_at').nullable();
      t.index(['grievance_id', 'target_module'], 'sgref_case_module_idx');
    });
  }

  if (!(await hasTable('student_grievance_resolutions'))) {
    await knex.schema.createTable('student_grievance_resolutions', (t) => {
      t.increments('id').primary();
      t.integer('grievance_id').unsigned().notNullable().references('id').inTable('student_grievances').onDelete('CASCADE');
      t.text('internal_summary').nullable();
      t.text('public_summary').notNullable();
      t.string('responsible_authority', 128).nullable();
      t.integer('resolved_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.unique(['grievance_id'], { indexName: 'sgres_case_unique' });
    });
  }

  if (!(await hasTable('student_grievance_appeals'))) {
    await knex.schema.createTable('student_grievance_appeals', (t) => {
      t.increments('id').primary();
      t.integer('grievance_id').unsigned().notNullable().references('id').inTable('student_grievances').onDelete('CASCADE');
      t.integer('filed_by_student_id').unsigned().nullable().references('id').inTable('students').onDelete('SET NULL');
      t.integer('filed_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('reason').notNullable();
      t.string('status', 32).notNullable().defaultTo('SUBMITTED');
      t.string('routed_to_role', 64).nullable();
      t.integer('routed_to_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.timestamp('decided_at').nullable();
      t.index(['grievance_id', 'created_at'], 'sgappeal_case_created_idx');
    });
  }
};

exports.down = async function down(knex) {
  for (const table of [
    'student_grievance_appeals',
    'student_grievance_resolutions',
    'student_grievance_referrals',
    'student_grievance_notes',
    'student_grievance_attachments',
    'student_grievance_messages',
    'student_grievance_events',
    'student_grievance_assignments',
    'student_grievance_categories',
    'student_grievance_sequences',
  ]) {
    if (await knex.schema.hasTable(table)) await knex.schema.dropTable(table);
  }
};
