/**
 * Student Academic Services: requests, workflows, certificates, grievances, mentoring.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  // ── Request type master ──────────────────────────────────────────────
  if (!(await knex.schema.hasTable('student_service_request_types'))) {
    await knex.schema.createTable('student_service_request_types', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 64).notNullable();
      t.string('label', 255).notNullable();
      t.string('category', 32).notNullable().defaultTo('REQUEST');
      t.text('description').nullable();
      t.text('instructions').nullable();
      t.string('estimated_process', 255).nullable();
      t.boolean('requires_approval').notNullable().defaultTo(true);
      t.boolean('auto_approve').notNullable().defaultTo(false);
      t.boolean('generates_certificate').notNullable().defaultTo(false);
      t.string('certificate_series', 32).nullable();
      t.json('form_schema').nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.integer('sort_order').notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'ssrt_college_code_unique' });
      t.index(['college_id', 'is_active', 'sort_order'], 'ssrt_college_active_idx');
    });
  }

  // ── Workflow definitions per request type ────────────────────────────
  if (!(await knex.schema.hasTable('student_request_workflows'))) {
    await knex.schema.createTable('student_request_workflows', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('request_type_id').unsigned().notNullable().references('id').inTable('student_service_request_types').onDelete('CASCADE');
      t.string('name', 255).notNullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.index(['college_id', 'request_type_id'], 'srw_college_type_idx');
    });
  }

  if (!(await knex.schema.hasTable('student_request_workflow_steps'))) {
    await knex.schema.createTable('student_request_workflow_steps', (t) => {
      t.increments('id').primary();
      t.integer('workflow_id').unsigned().notNullable().references('id').inTable('student_request_workflows').onDelete('CASCADE');
      t.integer('step_order').notNullable();
      t.string('step_key', 64).notNullable();
      t.string('label', 255).notNullable();
      t.string('actor_role', 64).notNullable();
      t.string('action_type', 32).notNullable().defaultTo('APPROVE');
      t.boolean('is_final').notNullable().defaultTo(false);
      t.timestamps(true, true);
      t.unique(['workflow_id', 'step_order'], { indexName: 'srws_workflow_order_unique' });
    });
  }

  // ── Core request engine ──────────────────────────────────────────────
  if (!(await knex.schema.hasTable('student_service_requests'))) {
    await knex.schema.createTable('student_service_requests', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('request_type_id').unsigned().notNullable().references('id').inTable('student_service_request_types').onDelete('RESTRICT');
      t.integer('workflow_id').unsigned().nullable().references('id').inTable('student_request_workflows').onDelete('SET NULL');
      t.string('request_number', 64).nullable();
      t.string('title', 255).notNullable();
      t.text('description').nullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      t.string('priority', 16).notNullable().defaultTo('NORMAL');
      t.string('current_stage', 128).nullable();
      t.integer('current_step_order').nullable();
      t.json('form_data').nullable();
      t.timestamp('submitted_at').nullable();
      t.timestamp('completed_at').nullable();
      t.timestamp('cancelled_at').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'request_number'], { indexName: 'ssr_college_number_unique' });
      t.index(['college_id', 'student_id', 'status'], 'ssr_college_student_status_idx');
      t.index(['college_id', 'request_type_id', 'status'], 'ssr_college_type_status_idx');
      t.index(['college_id', 'status', 'current_stage'], 'ssr_college_stage_idx');
      t.index(['college_id', 'submitted_at'], 'ssr_college_submitted_idx');
    });
  }

  if (!(await knex.schema.hasTable('student_request_actions'))) {
    await knex.schema.createTable('student_request_actions', (t) => {
      t.increments('id').primary();
      t.integer('request_id').unsigned().notNullable().references('id').inTable('student_service_requests').onDelete('CASCADE');
      t.integer('step_order').notNullable();
      t.string('step_key', 64).notNullable();
      t.string('step_label', 255).notNullable();
      t.string('actor_role', 64).notNullable();
      t.integer('acted_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('acted_by_student_id').unsigned().nullable().references('id').inTable('students').onDelete('SET NULL');
      t.string('status', 32).notNullable().defaultTo('PENDING');
      t.text('remarks').nullable();
      t.boolean('is_internal').notNullable().defaultTo(false);
      t.timestamp('acted_at').nullable();
      t.timestamps(true, true);
      t.index(['request_id', 'step_order'], 'sra_request_step_idx');
      t.index(['request_id', 'status'], 'sra_request_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('student_request_comments'))) {
    await knex.schema.createTable('student_request_comments', (t) => {
      t.increments('id').primary();
      t.integer('request_id').unsigned().notNullable().references('id').inTable('student_service_requests').onDelete('CASCADE');
      t.integer('author_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('author_student_id').unsigned().nullable().references('id').inTable('students').onDelete('SET NULL');
      t.text('body').notNullable();
      t.boolean('is_internal').notNullable().defaultTo(false);
      t.timestamps(true, true);
      t.index(['request_id', 'created_at'], 'src_request_created_idx');
    });
  }

  if (!(await knex.schema.hasTable('student_service_attachments'))) {
    await knex.schema.createTable('student_service_attachments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('request_id').unsigned().nullable().references('id').inTable('student_service_requests').onDelete('CASCADE');
      t.integer('document_id').unsigned().nullable();
      t.string('file_name', 255).notNullable();
      t.string('mime_type', 128).notNullable();
      t.integer('file_size').notNullable();
      t.string('storage_key', 512).notNullable();
      t.string('visibility', 16).notNullable().defaultTo('STUDENT');
      t.integer('uploaded_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('uploaded_by_student_id').unsigned().nullable().references('id').inTable('students').onDelete('SET NULL');
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['request_id'], 'ssa_request_idx');
      t.index(['college_id', 'document_id'], 'ssa_college_doc_idx');
    });
  }

  // ── Certificate templates & documents ────────────────────────────────
  if (!(await knex.schema.hasTable('certificate_templates'))) {
    await knex.schema.createTable('certificate_templates', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('certificate_type', 64).notNullable();
      t.string('title', 255).notNullable();
      t.json('header_config').nullable();
      t.text('body_template').nullable();
      t.json('footer_config').nullable();
      t.json('signatory_config').nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'certificate_type'], { indexName: 'ct_college_type_unique' });
    });
  }

  if (!(await knex.schema.hasTable('certificate_number_sequences'))) {
    await knex.schema.createTable('certificate_number_sequences', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('series_code', 32).notNullable();
      t.integer('year').notNullable();
      t.integer('last_number').notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.unique(['college_id', 'series_code', 'year'], { indexName: 'cns_college_series_year_unique' });
    });
  }

  if (!(await knex.schema.hasTable('student_service_documents'))) {
    await knex.schema.createTable('student_service_documents', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('request_id').unsigned().nullable().references('id').inTable('student_service_requests').onDelete('SET NULL');
      t.string('document_type', 64).notNullable();
      t.string('certificate_number', 64).notNullable();
      t.string('document_uuid', 36).notNullable();
      t.string('verification_code', 64).notNullable();
      t.string('status', 16).notNullable().defaultTo('VALID');
      t.integer('superseded_by_id').unsigned().nullable();
      t.json('document_data').nullable();
      t.integer('issued_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('issued_at').notNullable().defaultTo(knex.fn.now());
      t.timestamp('revoked_at').nullable();
      t.text('revoke_reason').nullable();
      t.timestamps(true, true);
      t.unique(['document_uuid'], { indexName: 'ssd_uuid_unique' });
      t.unique(['verification_code'], { indexName: 'ssd_verify_code_unique' });
      t.unique(['college_id', 'certificate_number'], { indexName: 'ssd_college_cert_unique' });
      t.index(['college_id', 'student_id', 'document_type'], 'ssd_college_student_type_idx');
      t.index(['college_id', 'status'], 'ssd_college_status_idx');
    });
  }

  // ── Grievances ───────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('student_grievances'))) {
    await knex.schema.createTable('student_grievances', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('request_id').unsigned().nullable().references('id').inTable('student_service_requests').onDelete('SET NULL');
      t.string('grievance_number', 64).nullable();
      t.string('category', 64).notNullable();
      t.string('subject', 255).notNullable();
      t.text('description').notNullable();
      t.string('priority', 16).notNullable().defaultTo('NORMAL');
      t.string('confidentiality', 16).notNullable().defaultTo('STANDARD');
      t.string('status', 32).notNullable().defaultTo('SUBMITTED');
      t.integer('assigned_to_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('response_sla_hours').nullable();
      t.integer('resolution_sla_hours').nullable();
      t.timestamp('submitted_at').notNullable().defaultTo(knex.fn.now());
      t.timestamp('resolved_at').nullable();
      t.text('resolution_summary').nullable();
      t.integer('resolved_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.boolean('student_acknowledged').notNullable().defaultTo(false);
      t.timestamp('acknowledged_at').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'grievance_number'], { indexName: 'sg_college_number_unique' });
      t.index(['college_id', 'student_id', 'status'], 'sg_college_student_status_idx');
      t.index(['college_id', 'category', 'status'], 'sg_college_category_status_idx');
      t.index(['college_id', 'assigned_to_faculty_id', 'status'], 'sg_college_assigned_idx');
    });
  }

  if (!(await knex.schema.hasTable('student_grievance_escalations'))) {
    await knex.schema.createTable('student_grievance_escalations', (t) => {
      t.increments('id').primary();
      t.integer('grievance_id').unsigned().notNullable().references('id').inTable('student_grievances').onDelete('CASCADE');
      t.string('from_role', 64).notNullable();
      t.string('to_role', 64).notNullable();
      t.integer('escalated_to_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('reason').nullable();
      t.boolean('is_automatic').notNullable().defaultTo(false);
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['grievance_id'], 'sge_grievance_idx');
    });
  }

  // ── Mentoring ────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('mentor_assignments'))) {
    await knex.schema.createTable('mentor_assignments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('mentor_faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      t.integer('academic_year_id').unsigned().nullable().references('id').inTable('academic_years').onDelete('SET NULL');
      t.date('effective_from').nullable();
      t.date('effective_to').nullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.boolean('is_primary').notNullable().defaultTo(true);
      t.integer('assigned_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'student_id', 'status'], 'ma_college_student_status_idx');
      t.index(['college_id', 'mentor_faculty_id', 'status'], 'ma_college_mentor_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('mentor_meetings'))) {
    await knex.schema.createTable('mentor_meetings', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('mentor_faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      t.integer('mentor_assignment_id').unsigned().nullable().references('id').inTable('mentor_assignments').onDelete('SET NULL');
      t.string('status', 16).notNullable().defaultTo('REQUESTED');
      t.string('meeting_type', 32).notNullable().defaultTo('GENERAL');
      t.timestamp('scheduled_at').nullable();
      t.text('agenda').nullable();
      t.text('student_visible_notes').nullable();
      t.text('private_notes').nullable();
      t.date('follow_up_date').nullable();
      t.string('referral_status', 16).nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'student_id', 'status'], 'mm_college_student_status_idx');
      t.index(['college_id', 'mentor_faculty_id', 'status'], 'mm_college_mentor_status_idx');
    });
  }

  // ── Academic alerts ──────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('student_academic_alerts'))) {
    await knex.schema.createTable('student_academic_alerts', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.string('alert_type', 64).notNullable();
      t.string('severity', 16).notNullable().defaultTo('INFO');
      t.string('title', 255).notNullable();
      t.text('message').notNullable();
      t.string('related_type', 32).nullable();
      t.integer('related_id').unsigned().nullable();
      t.boolean('visible_to_student').notNullable().defaultTo(true);
      t.boolean('visible_to_mentor').notNullable().defaultTo(true);
      t.string('status', 16).notNullable().defaultTo('ACTIVE');
      t.string('dedupe_key', 191).notNullable();
      t.timestamp('resolved_at').nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.unique(['student_id', 'dedupe_key'], { indexName: 'saa_student_dedupe_unique' });
      t.index(['college_id', 'student_id', 'status'], 'saa_college_student_status_idx');
    });
  }

  // ── Audit log ────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('student_services_audit_log'))) {
    await knex.schema.createTable('student_services_audit_log', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('actor_id').unsigned().nullable();
      t.string('actor_type', 16).notNullable().defaultTo('FACULTY');
      t.string('actor_name', 255).nullable();
      t.string('action', 64).notNullable();
      t.string('entity_type', 64).notNullable();
      t.integer('entity_id').unsigned().nullable();
      t.json('before_state').nullable();
      t.json('after_state').nullable();
      t.text('reason').nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'entity_type', 'entity_id'], 'ssal_college_entity_idx');
      t.index(['college_id', 'action', 'created_at'], 'ssal_college_action_idx');
    });
  }

  // ── College grievance SLA config ─────────────────────────────────────
  if (!(await knex.schema.hasTable('college_grievance_policies'))) {
    await knex.schema.createTable('college_grievance_policies', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('category', 64).notNullable();
      t.integer('response_sla_hours').nullable();
      t.integer('resolution_sla_hours').nullable();
      t.string('default_assignee_role', 64).nullable();
      t.boolean('allow_sensitive').notNullable().defaultTo(false);
      t.timestamps(true, true);
      t.unique(['college_id', 'category'], { indexName: 'cgp_college_category_unique' });
    });
  }
};

exports.down = async function down(knex) {
  const tables = [
    'college_grievance_policies',
    'student_services_audit_log',
    'student_academic_alerts',
    'mentor_meetings',
    'mentor_assignments',
    'student_grievance_escalations',
    'student_grievances',
    'student_service_documents',
    'certificate_number_sequences',
    'certificate_templates',
    'student_service_attachments',
    'student_request_comments',
    'student_request_actions',
    'student_service_requests',
    'student_request_workflow_steps',
    'student_request_workflows',
    'student_service_request_types',
  ];
  for (const table of tables) {
    if (await knex.schema.hasTable(table)) await knex.schema.dropTable(table);
  }
};
