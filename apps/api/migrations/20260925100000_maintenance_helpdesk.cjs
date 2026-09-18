/**
 * Maintenance / Facilities / IT Helpdesk closure.
 *
 * A CENTRAL service-request / ticketing layer for campus infrastructure and IT
 * support. It is the single operational queue behind every "something is broken
 * / I need service" request — Facilities AND IT share ONE engine.
 *
 * Deliberately REUSES (never duplicates):
 *   - `colleges`, `departments`, `faculty_users`, `students` for identity/scope
 *   - `rooms` (with its `building` / `floor`) for physical location — no second
 *     room/building master
 *   - `lab_faults.maintenance_ref` for Lab integration — no duplicate lab fault
 *   - `employee_notifications` for notification delivery
 *   - source module assets (lab_assets, library, hostel rooms, transport
 *     vehicles) by reference (source_module / source_entity_type / source_entity_id)
 *
 * Source modules retain domain ownership. Maintenance owns only service
 * execution: routing, assignment, SLA, work tracking, resolution, closure,
 * audit and analytics.
 *
 * New college-scoped concepts:
 *   service_teams, service_team_members, service_categories,
 *   service_routing_rules, service_tickets, service_ticket_events,
 *   service_comments, service_work_logs, service_assignment_history,
 *   service_part_requests, service_escalations, service_attachments,
 *   maintenance_audit_log.
 *
 * Parts/material requests carry `purchase_ref` / `store_ref` so a future
 * Stores/Purchase module can adopt them without a redesign (clean handoff).
 */
exports.up = async function up(knex) {
  // ── Service teams (Facilities & IT queues) ────────────────────────────
  if (!(await knex.schema.hasTable('service_teams'))) {
    await knex.schema.createTable('service_teams', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 48).notNullable();
      t.string('name', 160).notNullable();
      t.string('kind', 16).notNullable().defaultTo('FACILITIES'); // FACILITIES | IT
      t.boolean('is_triage').notNullable().defaultTo(false); // the central unassigned/triage queue
      t.string('status', 16).notNullable().defaultTo('ACTIVE'); // ACTIVE | INACTIVE
      t.text('description').nullable();
      t.integer('created_by').unsigned().nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'svcteam_college_code_uq' });
      t.index(['college_id', 'kind', 'status'], 'svcteam_college_kind_status_idx');
    });
  }

  // ── Team membership (technicians / support agents) ────────────────────
  if (!(await knex.schema.hasTable('service_team_members'))) {
    await knex.schema.createTable('service_team_members', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('team_id').unsigned().notNullable().references('id').inTable('service_teams').onDelete('CASCADE');
      t.integer('faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      t.boolean('is_lead').notNullable().defaultTo(false);
      t.string('status', 16).notNullable().defaultTo('ACTIVE'); // ACTIVE | ENDED
      t.timestamps(true, true);
      t.unique(['team_id', 'faculty_id'], { indexName: 'svcteammem_team_faculty_uq' });
      t.index(['college_id', 'faculty_id', 'status'], 'svcteammem_college_faculty_idx');
    });
  }

  // ── Service categories (configurable classification) ──────────────────
  if (!(await knex.schema.hasTable('service_categories'))) {
    await knex.schema.createTable('service_categories', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 48).notNullable(); // IT_SYSTEMS | NETWORK | ELECTRICAL | PLUMBING | ...
      t.string('name', 160).notNullable();
      t.string('kind', 16).notNullable().defaultTo('FACILITIES'); // FACILITIES | IT — steers requester UX + routing
      t.integer('default_team_id').unsigned().nullable().references('id').inTable('service_teams').onDelete('SET NULL');
      t.string('default_priority', 12).notNullable().defaultTo('NORMAL'); // LOW | NORMAL | HIGH | CRITICAL
      t.integer('ack_sla_mins').unsigned().nullable(); // acknowledgement target (minutes)
      t.integer('resolve_sla_mins').unsigned().nullable(); // resolution target (minutes)
      t.boolean('is_active').notNullable().defaultTo(true);
      t.integer('sort_order').unsigned().notNullable().defaultTo(100);
      t.text('description').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'svccat_college_code_uq' });
      t.index(['college_id', 'is_active'], 'svccat_college_active_idx');
    });
  }

  // ── Routing rules (deterministic, explainable, ordered) ───────────────
  if (!(await knex.schema.hasTable('service_routing_rules'))) {
    await knex.schema.createTable('service_routing_rules', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('name', 160).notNullable();
      t.integer('priority').unsigned().notNullable().defaultTo(100); // lower = evaluated first
      // Match predicates (NULL = wildcard). ALL non-null predicates must match.
      t.integer('match_category_id').unsigned().nullable().references('id').inTable('service_categories').onDelete('CASCADE');
      t.string('match_source_module', 32).nullable(); // LAB | HOSTEL | LIBRARY | TRANSPORT | CLASSROOM | ERP | GENERAL
      t.string('match_building', 96).nullable();
      t.integer('match_department_id').unsigned().nullable().references('id').inTable('departments').onDelete('CASCADE');
      // Action
      t.integer('target_team_id').unsigned().notNullable().references('id').inTable('service_teams').onDelete('CASCADE');
      t.boolean('is_active').notNullable().defaultTo(true);
      t.text('explanation').nullable(); // human-readable reason surfaced on the ticket
      t.timestamps(true, true);
      t.index(['college_id', 'is_active', 'priority'], 'svcroute_college_active_prio_idx');
    });
  }

  // ── Central service ticket ────────────────────────────────────────────
  if (!(await knex.schema.hasTable('service_tickets'))) {
    await knex.schema.createTable('service_tickets', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('ticket_no', 32).notNullable(); // stable printable id, unique per college
      t.string('title', 200).notNullable();
      t.text('description').nullable();
      t.integer('category_id').unsigned().nullable().references('id').inTable('service_categories').onDelete('SET NULL');
      t.string('subcategory', 96).nullable();
      // Requester (faculty OR student)
      t.string('requester_type', 12).notNullable().defaultTo('FACULTY'); // FACULTY | STUDENT
      t.integer('requester_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('requester_student_id').unsigned().nullable().references('id').inTable('students').onDelete('SET NULL');
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      // Location (reuse rooms; keep free-text fallbacks)
      t.integer('room_id').unsigned().nullable().references('id').inTable('rooms').onDelete('SET NULL');
      t.string('building', 96).nullable();
      t.string('location_note', 200).nullable();
      // Source-module linkage (avoids duplicate issue records)
      t.string('source_module', 32).notNullable().defaultTo('GENERAL'); // GENERAL | LAB | HOSTEL | LIBRARY | TRANSPORT | CLASSROOM | ERP
      t.string('source_entity_type', 48).nullable(); // LAB_FAULT | ROOM | ASSET | VEHICLE | MODULE | ...
      t.integer('source_entity_id').unsigned().nullable();
      t.string('asset_ref', 96).nullable(); // printable reference to the source asset (not a duplicate row)
      t.string('erp_module', 64).nullable(); // for ERP tickets: module/page
      t.string('erp_route', 200).nullable();
      // Classification / lifecycle
      t.string('priority', 12).notNullable().defaultTo('NORMAL'); // LOW | NORMAL | HIGH | CRITICAL
      t.string('status', 24).notNullable().defaultTo('OPEN');
      // OPEN | TRIAGED | ASSIGNED | ACKNOWLEDGED | IN_PROGRESS |
      // WAITING_PARTS | WAITING_APPROVAL | WAITING_REQUESTER |
      // RESOLVED | CONFIRMED | CLOSED | CANCELLED | REOPENED
      t.integer('team_id').unsigned().nullable().references('id').inTable('service_teams').onDelete('SET NULL');
      t.integer('assigned_to').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.text('routing_explanation').nullable();
      // Timestamps
      t.timestamp('acknowledged_at').nullable();
      t.timestamp('started_at').nullable();
      t.timestamp('resolved_at').nullable();
      t.timestamp('confirmed_at').nullable();
      t.timestamp('closed_at').nullable();
      // SLA
      t.timestamp('sla_ack_due_at').nullable();
      t.timestamp('sla_resolve_due_at').nullable();
      t.integer('sla_paused_ms').notNullable().defaultTo(0); // accumulated paused duration
      t.timestamp('sla_paused_at').nullable(); // when the current pause started (NULL = running)
      t.string('sla_ack_state', 16).notNullable().defaultTo('PENDING'); // PENDING | MET | BREACHED
      t.string('sla_resolve_state', 16).notNullable().defaultTo('PENDING'); // PENDING | MET | BREACHED
      // Resolution / closure
      t.text('resolution_summary').nullable();
      t.string('closure_outcome', 24).nullable(); // RESOLVED | NOT_REPRODUCIBLE | DUPLICATE | REJECTED | CANCELLED
      t.integer('reopen_count').notNullable().defaultTo(0);
      t.string('escalation_level', 16).notNullable().defaultTo('NONE'); // NONE | MANAGER | PRINCIPAL
      // External vendor (lightweight service metadata — NOT procurement)
      t.string('vendor_name', 160).nullable();
      t.string('vendor_ref', 96).nullable();
      t.date('vendor_sent_date').nullable();
      t.date('vendor_expected_return').nullable();
      t.string('vendor_status', 24).nullable();
      t.integer('created_by').unsigned().nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'ticket_no'], { indexName: 'svcticket_college_no_uq' });
      t.index(['college_id', 'status', 'priority'], 'svcticket_college_status_prio_idx');
      t.index(['college_id', 'team_id', 'status'], 'svcticket_college_team_status_idx');
      t.index(['college_id', 'assigned_to', 'status'], 'svcticket_college_assignee_status_idx');
      t.index(['college_id', 'requester_faculty_id'], 'svcticket_college_reqfac_idx');
      t.index(['college_id', 'requester_student_id'], 'svcticket_college_reqstu_idx');
      t.index(['college_id', 'source_module', 'source_entity_type', 'source_entity_id'], 'svcticket_source_idx');
    });
  }

  // ── Ticket timeline / audit events ────────────────────────────────────
  if (!(await knex.schema.hasTable('service_ticket_events'))) {
    await knex.schema.createTable('service_ticket_events', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('ticket_id').unsigned().notNullable().references('id').inTable('service_tickets').onDelete('CASCADE');
      t.string('event_type', 48).notNullable(); // CREATED | ROUTED | TRIAGED | ASSIGNED | REASSIGNED | ACKNOWLEDGED | STARTED | STATUS_CHANGE | PRIORITY_CHANGE | WORK_LOG | PART_REQUEST | APPROVAL | RESOLVED | CONFIRMED | REOPENED | CLOSED | ESCALATED | SLA_PAUSE | SLA_RESUME | SLA_BREACH | VENDOR
      t.string('visibility', 12).notNullable().defaultTo('PUBLIC'); // PUBLIC (requester-visible) | INTERNAL
      t.string('actor_type', 12).notNullable().defaultTo('FACULTY'); // FACULTY | STUDENT | SYSTEM
      t.integer('actor_id').unsigned().nullable();
      t.string('actor_name', 160).nullable();
      t.string('from_value', 64).nullable();
      t.string('to_value', 64).nullable();
      t.text('note').nullable();
      t.text('meta').nullable(); // JSON
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['college_id', 'ticket_id', 'created_at'], 'svcevent_ticket_time_idx');
    });
  }

  // ── Comments (requester-visible vs internal work notes) ───────────────
  if (!(await knex.schema.hasTable('service_comments'))) {
    await knex.schema.createTable('service_comments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('ticket_id').unsigned().notNullable().references('id').inTable('service_tickets').onDelete('CASCADE');
      t.string('visibility', 12).notNullable().defaultTo('REQUESTER'); // REQUESTER (shared) | INTERNAL (staff only)
      t.string('author_type', 12).notNullable().defaultTo('FACULTY'); // FACULTY | STUDENT
      t.integer('author_id').unsigned().nullable();
      t.string('author_name', 160).nullable();
      t.text('body').notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['college_id', 'ticket_id', 'visibility'], 'svccomment_ticket_vis_idx');
    });
  }

  // ── Work logs (immutable technician record) ───────────────────────────
  if (!(await knex.schema.hasTable('service_work_logs'))) {
    await knex.schema.createTable('service_work_logs', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('ticket_id').unsigned().notNullable().references('id').inTable('service_tickets').onDelete('CASCADE');
      t.integer('technician_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('technician_name', 160).nullable();
      t.text('work_performed').notNullable();
      t.text('diagnosis').nullable();
      t.text('action').nullable();
      t.text('parts_used').nullable();
      t.text('next_step').nullable();
      t.integer('minutes_spent').unsigned().nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['college_id', 'ticket_id'], 'svcworklog_ticket_idx');
    });
  }

  // ── Assignment history ────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('service_assignment_history'))) {
    await knex.schema.createTable('service_assignment_history', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('ticket_id').unsigned().notNullable().references('id').inTable('service_tickets').onDelete('CASCADE');
      t.integer('from_team_id').unsigned().nullable();
      t.integer('to_team_id').unsigned().nullable();
      t.integer('from_technician_id').unsigned().nullable();
      t.integer('to_technician_id').unsigned().nullable();
      t.integer('actor_id').unsigned().nullable();
      t.string('actor_name', 160).nullable();
      t.text('reason').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['college_id', 'ticket_id'], 'svcasgnhist_ticket_idx');
    });
  }

  // ── Parts / material requests (clean Stores/Purchase handoff) ─────────
  if (!(await knex.schema.hasTable('service_part_requests'))) {
    await knex.schema.createTable('service_part_requests', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('ticket_id').unsigned().notNullable().references('id').inTable('service_tickets').onDelete('CASCADE');
      t.string('item', 200).notNullable();
      t.decimal('quantity', 12, 2).notNullable().defaultTo(1);
      t.string('unit', 24).nullable();
      t.text('reason').nullable();
      t.decimal('estimated_cost', 12, 2).nullable();
      t.string('status', 16).notNullable().defaultTo('REQUESTED'); // REQUESTED | APPROVED | REJECTED | FULFILLED
      t.integer('requested_by').unsigned().nullable();
      t.integer('decided_by').unsigned().nullable();
      t.text('decision_note').nullable();
      // Future Stores/Purchase integration boundary (unused today).
      t.string('store_ref', 64).nullable();
      t.string('purchase_ref', 64).nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'ticket_id', 'status'], 'svcpart_ticket_status_idx');
    });
  }

  // ── Escalations ───────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('service_escalations'))) {
    await knex.schema.createTable('service_escalations', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('ticket_id').unsigned().notNullable().references('id').inTable('service_tickets').onDelete('CASCADE');
      t.string('level', 16).notNullable(); // MANAGER | PRINCIPAL
      t.string('trigger', 32).notNullable(); // CRITICAL | SLA_BREACH | INACTIVITY | REASSIGN | MANUAL
      t.text('reason').nullable();
      t.integer('escalated_to').unsigned().nullable();
      t.integer('actor_id').unsigned().nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['college_id', 'ticket_id'], 'svcesc_ticket_idx');
    });
  }

  // ── Attachments (reuse: metadata + stored ref) ────────────────────────
  if (!(await knex.schema.hasTable('service_attachments'))) {
    await knex.schema.createTable('service_attachments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('ticket_id').unsigned().notNullable().references('id').inTable('service_tickets').onDelete('CASCADE');
      t.string('visibility', 12).notNullable().defaultTo('REQUESTER'); // REQUESTER | INTERNAL
      t.string('filename', 255).notNullable();
      t.string('mime_type', 128).nullable();
      t.integer('size_bytes').unsigned().nullable();
      t.text('data_url').nullable(); // base64 data URL (bounded) — reuses the JSON body upload path
      t.string('author_type', 12).notNullable().defaultTo('FACULTY');
      t.integer('uploaded_by').unsigned().nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['college_id', 'ticket_id', 'visibility'], 'svcattach_ticket_vis_idx');
    });
  }

  // ── Config / system audit (non-ticket actions) ────────────────────────
  if (!(await knex.schema.hasTable('maintenance_audit_log'))) {
    await knex.schema.createTable('maintenance_audit_log', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('actor_id').unsigned().nullable();
      t.string('actor_type', 16).notNullable().defaultTo('FACULTY');
      t.string('action', 48).notNullable();
      t.string('entity_type', 48).notNullable();
      t.integer('entity_id').unsigned().nullable();
      t.text('before_state').nullable();
      t.text('after_state').nullable();
      t.text('reason').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['college_id', 'entity_type', 'entity_id'], 'mntaudit_entity_idx');
    });
  }
};

exports.down = async function down(knex) {
  for (const table of [
    'maintenance_audit_log',
    'service_attachments',
    'service_escalations',
    'service_part_requests',
    'service_assignment_history',
    'service_work_logs',
    'service_comments',
    'service_ticket_events',
    'service_tickets',
    'service_routing_rules',
    'service_categories',
    'service_team_members',
    'service_teams',
  ]) {
    // eslint-disable-next-line no-await-in-loop
    await knex.schema.dropTableIfExists(table);
  }
};
