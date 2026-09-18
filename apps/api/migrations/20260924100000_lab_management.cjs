/**
 * Lab Assistant / Laboratory Management closure.
 *
 * Adds an operational laboratory-management layer on top of existing academic
 * structures. Deliberately REUSES:
 *   - `rooms` (type='LAB') for physical location — no duplicate room/building data
 *   - `departments`, `colleges`, `faculty_users`, `students`, `academic_class_batches`
 *   - `timetable_slots` for practical-session context — no second attendance system
 *   - `academic_leadership_assignments` for HOD/Principal oversight overlay
 *
 * New normalized concepts (all college-scoped):
 *   labs, lab_assignments, lab_assets, lab_asset_history, lab_stock_items,
 *   lab_stock_movements, lab_issues, lab_sessions (readiness), lab_faults,
 *   lab_repairs, lab_software, lab_software_requests, lab_requirements,
 *   lab_maintenance_schedules, lab_audit_log.
 *
 * Fault/repair carry a `maintenance_ref` so a future central Maintenance / IT
 * Helpdesk module can adopt them without a duplicate repair data model.
 */
exports.up = async function up(knex) {
  // ── Lab master ───────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('labs'))) {
    await knex.schema.createTable('labs', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('room_id').unsigned().nullable().references('id').inTable('rooms').onDelete('SET NULL');
      t.string('name', 160).notNullable();
      t.string('code', 48).notNullable();
      t.string('lab_type', 48).notNullable().defaultTo('GENERAL'); // COMPUTING | ELECTRONICS | MECHANICAL | ...
      t.integer('capacity').unsigned().nullable();
      t.string('status', 16).notNullable().defaultTo('ACTIVE'); // ACTIVE | INACTIVE
      t.text('description').nullable();
      t.integer('created_by').unsigned().nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'labs_college_code_uq' });
      t.index(['college_id', 'department_id', 'status'], 'labs_college_dept_status_idx');
    });
  }

  // ── Lab assignments (Lab Assistant / Lab In-charge) — history preserving ─
  if (!(await knex.schema.hasTable('lab_assignments'))) {
    await knex.schema.createTable('lab_assignments', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('lab_id').unsigned().notNullable().references('id').inTable('labs').onDelete('CASCADE');
      t.integer('faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      t.string('assignment_role', 16).notNullable().defaultTo('LAB_ASSISTANT'); // LAB_ASSISTANT | LAB_INCHARGE
      t.boolean('is_primary').notNullable().defaultTo(true);
      t.string('status', 16).notNullable().defaultTo('ACTIVE'); // ACTIVE | ENDED
      t.date('effective_from').nullable();
      t.date('effective_to').nullable();
      t.integer('assigned_by').unsigned().nullable();
      t.text('remarks').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'lab_id', 'status'], 'labasg_college_lab_status_idx');
      t.index(['college_id', 'faculty_id', 'status'], 'labasg_college_faculty_status_idx');
    });
  }

  // ── Lab assets (durable equipment, computers, peripherals) ────────────
  if (!(await knex.schema.hasTable('lab_assets'))) {
    await knex.schema.createTable('lab_assets', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('lab_id').unsigned().nullable().references('id').inTable('labs').onDelete('SET NULL');
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.string('asset_tag', 64).notNullable(); // stable printable id — QR/barcode ready
      t.string('serial_number', 128).nullable();
      t.string('category', 48).notNullable().defaultTo('EQUIPMENT'); // DESKTOP | LAPTOP | MONITOR | UPS | PRINTER | PROJECTOR | NETWORK | BOARD | INSTRUMENT | TOOL | FURNITURE | PERIPHERAL | OTHER
      t.string('asset_class', 16).notNullable().defaultTo('ASSET'); // ASSET | COMPUTER | ACCESSORY
      t.string('name', 160).notNullable();
      t.string('make', 96).nullable();
      t.string('model', 96).nullable();
      t.date('purchase_date').nullable();
      t.decimal('cost', 12, 2).nullable();
      t.string('vendor', 160).nullable();
      t.date('warranty_start').nullable();
      t.date('warranty_end').nullable();
      t.date('amc_start').nullable();
      t.date('amc_end').nullable();
      t.string('operational_status', 16).notNullable().defaultTo('AVAILABLE'); // AVAILABLE | IN_USE | FAULTY | UNDER_REPAIR | RESERVED | RETIRED | LOST
      t.string('condition', 12).notNullable().defaultTo('GOOD'); // GOOD | FAIR | POOR | DAMAGED
      t.integer('custodian_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      // Computer/system metadata (nullable — only for COMPUTER class)
      t.string('hostname', 96).nullable();
      t.string('system_number', 48).nullable();
      t.string('processor', 96).nullable();
      t.string('ram', 48).nullable();
      t.string('storage', 96).nullable();
      t.string('os', 96).nullable();
      t.text('remarks').nullable();
      t.integer('created_by').unsigned().nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'asset_tag'], { indexName: 'labasset_college_tag_uq' });
      t.index(['college_id', 'lab_id', 'operational_status'], 'labasset_college_lab_status_idx');
      t.index(['college_id', 'category'], 'labasset_college_category_idx');
    });
  }

  // ── Asset history (status/location/custodian changes) ─────────────────
  if (!(await knex.schema.hasTable('lab_asset_history'))) {
    await knex.schema.createTable('lab_asset_history', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('asset_id').unsigned().notNullable().references('id').inTable('lab_assets').onDelete('CASCADE');
      t.string('action', 48).notNullable(); // CREATED | STATUS_CHANGE | TRANSFER | CONDITION_CHANGE | CUSTODIAN_CHANGE | RETIRED
      t.string('from_status', 16).nullable();
      t.string('to_status', 16).nullable();
      t.integer('from_lab_id').unsigned().nullable();
      t.integer('to_lab_id').unsigned().nullable();
      t.integer('from_custodian').unsigned().nullable();
      t.integer('to_custodian').unsigned().nullable();
      t.text('note').nullable();
      t.integer('actor_id').unsigned().nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['college_id', 'asset_id'], 'labassethist_college_asset_idx');
    });
  }

  // ── Consumable stock items ────────────────────────────────────────────
  if (!(await knex.schema.hasTable('lab_stock_items'))) {
    await knex.schema.createTable('lab_stock_items', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('lab_id').unsigned().notNullable().references('id').inTable('labs').onDelete('CASCADE');
      t.string('name', 160).notNullable();
      t.string('code', 48).nullable();
      t.string('category', 48).notNullable().defaultTo('CONSUMABLE');
      t.string('unit', 24).notNullable().defaultTo('NOS'); // NOS | MTR | BOX | SET | ...
      t.decimal('opening_stock', 12, 2).notNullable().defaultTo(0);
      t.decimal('current_stock', 12, 2).notNullable().defaultTo(0);
      t.decimal('min_threshold', 12, 2).notNullable().defaultTo(0);
      t.string('status', 16).notNullable().defaultTo('ACTIVE'); // ACTIVE | INACTIVE
      t.integer('created_by').unsigned().nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'lab_id', 'status'], 'labstock_college_lab_status_idx');
    });
  }

  // ── Stock movements (audited ledger) ──────────────────────────────────
  if (!(await knex.schema.hasTable('lab_stock_movements'))) {
    await knex.schema.createTable('lab_stock_movements', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('stock_item_id').unsigned().notNullable().references('id').inTable('lab_stock_items').onDelete('CASCADE');
      t.integer('lab_id').unsigned().notNullable().references('id').inTable('labs').onDelete('CASCADE');
      t.string('movement_type', 16).notNullable(); // RECEIPT | ISSUE | RETURN | CONSUMPTION | TRANSFER | ADJUSTMENT | SCRAP
      t.decimal('quantity', 12, 2).notNullable();
      t.decimal('balance_after', 12, 2).notNullable();
      t.integer('from_lab_id').unsigned().nullable();
      t.integer('to_lab_id').unsigned().nullable();
      t.string('reason', 255).nullable();
      t.string('reference', 96).nullable();
      t.integer('actor_id').unsigned().nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['college_id', 'stock_item_id'], 'labstockmov_college_item_idx');
      t.index(['college_id', 'lab_id', 'movement_type'], 'labstockmov_college_lab_type_idx');
    });
  }

  // ── Issue / return of reusable assets & accessories ───────────────────
  if (!(await knex.schema.hasTable('lab_issues'))) {
    await knex.schema.createTable('lab_issues', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('lab_id').unsigned().notNullable().references('id').inTable('labs').onDelete('CASCADE');
      t.string('item_kind', 12).notNullable().defaultTo('ASSET'); // ASSET | ACCESSORY | STOCK
      t.integer('asset_id').unsigned().nullable().references('id').inTable('lab_assets').onDelete('SET NULL');
      t.integer('stock_item_id').unsigned().nullable().references('id').inTable('lab_stock_items').onDelete('SET NULL');
      t.string('description', 200).nullable();
      t.decimal('quantity', 12, 2).notNullable().defaultTo(1);
      t.string('recipient_type', 12).notNullable(); // FACULTY | STUDENT | LAB | DEPARTMENT
      t.integer('recipient_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('recipient_student_id').unsigned().nullable().references('id').inTable('students').onDelete('SET NULL');
      t.string('recipient_note', 200).nullable();
      t.date('issue_date').notNullable();
      t.date('expected_return').nullable();
      t.date('actual_return').nullable();
      t.string('condition_out', 12).nullable();
      t.string('condition_in', 12).nullable();
      t.string('status', 12).notNullable().defaultTo('ISSUED'); // ISSUED | RETURNED | LOST
      t.integer('issuer_id').unsigned().nullable();
      t.text('remarks').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'lab_id', 'status'], 'labissue_college_lab_status_idx');
      t.index(['college_id', 'status', 'expected_return'], 'labissue_college_status_due_idx');
    });
  }

  // ── Practical-session readiness (consumes timetable) ──────────────────
  if (!(await knex.schema.hasTable('lab_sessions'))) {
    await knex.schema.createTable('lab_sessions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('lab_id').unsigned().notNullable().references('id').inTable('labs').onDelete('CASCADE');
      t.integer('timetable_slot_id').unsigned().nullable().references('id').inTable('timetable_slots').onDelete('SET NULL');
      t.integer('course_id').unsigned().nullable();
      t.integer('academic_class_id').unsigned().nullable();
      t.integer('batch_id').unsigned().nullable();
      t.integer('faculty_id').unsigned().nullable();
      t.date('session_date').notNullable();
      t.time('start_time').nullable();
      t.time('end_time').nullable();
      t.string('readiness_status', 16).notNullable().defaultTo('NOT_STARTED'); // NOT_STARTED | IN_PREPARATION | READY | ISSUE_REPORTED | COMPLETED
      t.json('checklist').nullable(); // [{ key, label, done }]
      t.text('notes').nullable();
      t.integer('prepared_by').unsigned().nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'timetable_slot_id', 'session_date'], 'labsession_slot_date_uq');
      t.index(['college_id', 'lab_id', 'session_date'], 'labsession_college_lab_date_idx');
    });
  }

  // ── Fault / breakdown log (integration-ready) ─────────────────────────
  if (!(await knex.schema.hasTable('lab_faults'))) {
    await knex.schema.createTable('lab_faults', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('lab_id').unsigned().notNullable().references('id').inTable('labs').onDelete('CASCADE');
      t.integer('asset_id').unsigned().nullable().references('id').inTable('lab_assets').onDelete('SET NULL');
      t.integer('reported_by').unsigned().nullable();
      t.string('fault_category', 48).notNullable().defaultTo('GENERAL');
      t.text('description').notNullable();
      t.string('severity', 12).notNullable().defaultTo('MEDIUM'); // LOW | MEDIUM | HIGH | CRITICAL
      t.string('impact', 200).nullable();
      t.string('status', 20).notNullable().defaultTo('OPEN'); // OPEN | ACKNOWLEDGED | UNDER_DIAGNOSIS | UNDER_REPAIR | RESOLVED | CLOSED
      // Maintenance integration boundary — stable linkage to a future central ticket.
      t.string('maintenance_ref', 96).nullable();
      t.timestamp('resolved_at').nullable();
      t.integer('resolved_by').unsigned().nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'lab_id', 'status'], 'labfault_college_lab_status_idx');
      t.index(['college_id', 'status', 'severity'], 'labfault_college_status_severity_idx');
    });
  }

  // ── Repair requests (lab-side lifecycle; maintenance handoff) ─────────
  if (!(await knex.schema.hasTable('lab_repairs'))) {
    await knex.schema.createTable('lab_repairs', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('lab_id').unsigned().notNullable().references('id').inTable('labs').onDelete('CASCADE');
      t.integer('asset_id').unsigned().nullable().references('id').inTable('lab_assets').onDelete('SET NULL');
      t.integer('fault_id').unsigned().nullable().references('id').inTable('lab_faults').onDelete('SET NULL');
      t.text('requested_action').notNullable();
      t.string('priority', 12).notNullable().defaultTo('NORMAL'); // LOW | NORMAL | HIGH | URGENT
      t.string('vendor', 160).nullable();
      t.decimal('estimated_cost', 12, 2).nullable();
      t.decimal('actual_cost', 12, 2).nullable();
      t.string('approval_status', 12).notNullable().defaultTo('PENDING'); // PENDING | APPROVED | REJECTED
      t.integer('approved_by').unsigned().nullable();
      t.string('status', 12).notNullable().defaultTo('REQUESTED'); // REQUESTED | IN_PROGRESS | COMPLETED | CANCELLED
      t.string('post_repair_condition', 12).nullable();
      t.string('maintenance_ref', 96).nullable(); // integration boundary
      t.timestamp('completed_at').nullable();
      t.integer('requested_by').unsigned().nullable();
      t.text('remarks').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'lab_id', 'status'], 'labrepair_college_lab_status_idx');
    });
  }

  // ── Software inventory (metadata only — no license secrets) ────────────
  if (!(await knex.schema.hasTable('lab_software'))) {
    await knex.schema.createTable('lab_software', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('lab_id').unsigned().notNullable().references('id').inTable('labs').onDelete('CASCADE');
      t.string('name', 160).notNullable();
      t.string('version', 48).nullable();
      t.string('license_type', 32).notNullable().defaultTo('FREE'); // FREE | PROPRIETARY | SUBSCRIPTION | ACADEMIC | TRIAL
      t.integer('license_count').unsigned().nullable();
      t.date('expiry_date').nullable();
      t.string('installation_status', 16).notNullable().defaultTo('INSTALLED'); // INSTALLED | PENDING | PARTIAL
      t.string('vendor_ref', 160).nullable(); // metadata / reference only
      t.text('remarks').nullable();
      t.integer('created_by').unsigned().nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'lab_id'], 'labsoftware_college_lab_idx');
    });
  }

  // ── Software installation requests ────────────────────────────────────
  if (!(await knex.schema.hasTable('lab_software_requests'))) {
    await knex.schema.createTable('lab_software_requests', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('lab_id').unsigned().notNullable().references('id').inTable('labs').onDelete('CASCADE');
      t.string('software_name', 160).notNullable();
      t.string('version', 48).nullable();
      t.integer('course_id').unsigned().nullable();
      t.text('reason').nullable();
      t.date('needed_by').nullable();
      t.string('status', 16).notNullable().defaultTo('REQUESTED'); // REQUESTED | UNDER_REVIEW | COMPLETED | REJECTED
      t.integer('requested_by').unsigned().nullable();
      t.integer('reviewed_by').unsigned().nullable();
      t.text('resolution').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'lab_id', 'status'], 'labswreq_college_lab_status_idx');
    });
  }

  // ── Requirement / purchase requests (approval chain + purchase handoff) ─
  if (!(await knex.schema.hasTable('lab_requirements'))) {
    await knex.schema.createTable('lab_requirements', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('lab_id').unsigned().notNullable().references('id').inTable('labs').onDelete('CASCADE');
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.string('request_type', 16).notNullable().defaultTo('CONSUMABLES'); // NEW_ASSET | REPLACEMENT | CONSUMABLES | SOFTWARE | REPAIR | UPGRADE
      t.string('item', 200).notNullable();
      t.decimal('quantity', 12, 2).notNullable().defaultTo(1);
      t.text('reason').nullable();
      t.text('academic_justification').nullable();
      t.string('priority', 12).notNullable().defaultTo('NORMAL');
      t.decimal('estimated_cost', 12, 2).nullable();
      t.integer('course_id').unsigned().nullable();
      t.string('semester', 24).nullable();
      t.integer('student_strength').unsigned().nullable();
      t.decimal('current_stock', 12, 2).nullable();
      t.decimal('shortfall', 12, 2).nullable();
      // SUBMITTED → INCHARGE_APPROVED → HOD_APPROVED → PRINCIPAL_APPROVED → FULFILLED ; or REJECTED
      t.string('status', 20).notNullable().defaultTo('SUBMITTED');
      t.integer('requested_by').unsigned().nullable();
      t.integer('incharge_by').unsigned().nullable();
      t.integer('hod_by').unsigned().nullable();
      t.integer('principal_by').unsigned().nullable();
      t.string('purchase_ref', 96).nullable(); // handoff to future Stores/Purchase
      t.text('remarks').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'lab_id', 'status'], 'labreq_college_lab_status_idx');
      t.index(['college_id', 'department_id', 'status'], 'labreq_college_dept_status_idx');
    });
  }

  // ── Preventive maintenance schedules ──────────────────────────────────
  if (!(await knex.schema.hasTable('lab_maintenance_schedules'))) {
    await knex.schema.createTable('lab_maintenance_schedules', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('lab_id').unsigned().notNullable().references('id').inTable('labs').onDelete('CASCADE');
      t.integer('asset_id').unsigned().nullable().references('id').inTable('lab_assets').onDelete('SET NULL');
      t.string('maintenance_type', 96).notNullable();
      t.date('due_date').notNullable();
      t.date('completed_date').nullable();
      t.integer('performed_by').unsigned().nullable();
      t.text('result').nullable();
      t.string('status', 12).notNullable().defaultTo('SCHEDULED'); // SCHEDULED | DONE | CANCELLED
      t.timestamps(true, true);
      t.index(['college_id', 'lab_id', 'status'], 'labmaint_college_lab_status_idx');
    });
  }

  // ── Audit log ─────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('lab_audit_log'))) {
    await knex.schema.createTable('lab_audit_log', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('actor_id').unsigned().nullable();
      t.string('actor_type', 16).notNullable().defaultTo('FACULTY');
      t.string('action', 64).notNullable();
      t.string('entity_type', 48).notNullable();
      t.integer('entity_id').unsigned().nullable();
      t.text('before_state').nullable();
      t.text('after_state').nullable();
      t.string('reason', 255).nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.index(['college_id', 'entity_type', 'entity_id'], 'labaudit_college_entity_idx');
    });
  }
};

exports.down = async function down(knex) {
  const tables = [
    'lab_audit_log',
    'lab_maintenance_schedules',
    'lab_requirements',
    'lab_software_requests',
    'lab_software',
    'lab_repairs',
    'lab_faults',
    'lab_sessions',
    'lab_issues',
    'lab_stock_movements',
    'lab_stock_items',
    'lab_asset_history',
    'lab_assets',
    'lab_assignments',
    'labs',
  ];
  for (const table of tables) {
    if (await knex.schema.hasTable(table)) await knex.schema.dropTable(table);
  }
};
