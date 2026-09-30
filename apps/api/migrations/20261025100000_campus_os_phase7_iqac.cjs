/**
 * Campus OS Phase 7 — IQAC, Accreditation, Compliance & Institutional Quality.
 * See docs/CAMPUS_OS_PHASE7_PREIMPLEMENTATION_AUDIT.md (Option C: thin
 * evidence/snapshot/orchestration layer).
 *
 * This module owns ONLY: a configurable accreditation framework/criterion/
 * metric registry, evidence linkage (reusing documentEngine for files),
 * accreditation cycles with immutable freeze snapshots, a continuous-
 * improvement/action-plan engine shared by NBA/NAAC/audit/survey findings,
 * academic/internal audits, generic committee/meeting governance, and a
 * compliance calendar.
 *
 * It does NOT duplicate CO/PO/PSO mapping (`copo`), attainment
 * (`attainment`), survey capture (`surveys`), faculty CV data
 * (`facultyProfile`), research (`research`), or document storage
 * (`documentEngine`) — all remain authoritative and are only referenced.
 */
exports.up = async function up(knex) {
  // ── Framework / Version ──────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('iqac_frameworks'))) {
    await knex.schema.createTable('iqac_frameworks', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('name', 255).notNullable();
      t.string('code', 32).notNullable(); // e.g. NBA|NAAC|NIRF|INTERNAL|OTHER — institution-configured, not hardcoded content
      t.text('description').nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'iqac_fw_college_code_uq' });
    });
  }

  if (!(await knex.schema.hasTable('iqac_framework_versions'))) {
    await knex.schema.createTable('iqac_framework_versions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('framework_id').unsigned().notNullable().references('id').inTable('iqac_frameworks').onDelete('CASCADE');
      t.string('version_label', 64).notNullable(); // e.g. "2023", "v2"
      t.date('effective_from').nullable();
      t.date('effective_to').nullable();
      t.string('status', 24).notNullable().defaultTo('DRAFT'); // DRAFT|ACTIVE|RETIRED
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['framework_id', 'version_label'], { indexName: 'iqac_fwv_framework_label_uq' });
      t.index(['college_id', 'status'], 'iqac_fwv_college_status_idx');
    });
  }

  // ── Criterion / Key Indicator (self-referencing hierarchy) ──────────────
  if (!(await knex.schema.hasTable('iqac_criteria'))) {
    await knex.schema.createTable('iqac_criteria', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('framework_version_id').unsigned().notNullable().references('id').inTable('iqac_framework_versions').onDelete('CASCADE');
      t.integer('parent_id').unsigned().nullable().references('id').inTable('iqac_criteria').onDelete('CASCADE');
      t.string('level', 24).notNullable().defaultTo('CRITERION'); // CRITERION|KEY_INDICATOR
      t.string('code', 32).notNullable();
      t.string('title', 512).notNullable();
      t.text('description').nullable();
      t.decimal('weight', 6, 2).nullable();
      t.integer('sort_order').unsigned().notNullable().defaultTo(0);
      t.timestamps(true, true);
      t.unique(['framework_version_id', 'code'], { indexName: 'iqac_crit_fwv_code_uq' });
      t.index(['college_id', 'framework_version_id'], 'iqac_crit_college_fwv_idx');
      t.index(['parent_id'], 'iqac_crit_parent_idx');
    });
  }

  // ── Metric definitions ────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('iqac_metrics'))) {
    await knex.schema.createTable('iqac_metrics', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('framework_version_id').unsigned().nullable().references('id').inTable('iqac_framework_versions').onDelete('CASCADE');
      t.integer('criterion_id').unsigned().nullable().references('id').inTable('iqac_criteria').onDelete('SET NULL');
      t.string('code', 64).notNullable();
      t.string('name', 255).notNullable();
      t.text('description').nullable();
      t.string('source_type', 24).notNullable(); // SYSTEM_DERIVED|MANUAL
      t.string('source_module', 64).nullable(); // e.g. 'attainment'|'facultyProfile'|'examination' — only for SYSTEM_DERIVED
      t.string('unit', 32).nullable();
      t.decimal('target_value', 14, 2).nullable();
      t.integer('owner_department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.boolean('is_active').notNullable().defaultTo(true);
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['college_id', 'code'], { indexName: 'iqac_metric_college_code_uq' });
      t.index(['college_id', 'framework_version_id'], 'iqac_metric_college_fwv_idx');
      t.index(['college_id', 'criterion_id'], 'iqac_metric_college_crit_idx');
    });
  }

  // ── Accreditation cycle ───────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('iqac_cycles'))) {
    await knex.schema.createTable('iqac_cycles', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('framework_version_id').unsigned().notNullable().references('id').inTable('iqac_framework_versions').onDelete('RESTRICT');
      t.string('name', 255).notNullable();
      t.string('academic_year', 16).notNullable();
      t.string('status', 24).notNullable().defaultTo('DRAFT');
      // DRAFT|DATA_COLLECTION|REVIEW|APPROVED|FROZEN|SUBMITTED|CLOSED
      t.integer('started_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('started_at').nullable();
      t.integer('approved_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('approved_at').nullable();
      t.integer('frozen_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('frozen_at').nullable();
      t.integer('submitted_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('submitted_at').nullable();
      t.string('submission_reference', 128).nullable();
      t.integer('closed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('closed_at').nullable();
      t.timestamps(true, true);
      t.unique(['college_id', 'framework_version_id', 'academic_year'], { indexName: 'iqac_cycle_college_fwv_year_uq' });
      t.index(['college_id', 'status'], 'iqac_cycle_college_status_idx');
    });
  }

  // ── Metric values (one per metric per period) ────────────────────────────
  if (!(await knex.schema.hasTable('iqac_metric_values'))) {
    await knex.schema.createTable('iqac_metric_values', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('metric_id').unsigned().notNullable().references('id').inTable('iqac_metrics').onDelete('CASCADE');
      t.integer('cycle_id').unsigned().nullable().references('id').inTable('iqac_cycles').onDelete('SET NULL');
      t.string('period_label', 32).notNullable(); // e.g. '2025-26'
      t.string('value_status', 32).notNullable();
      // OK|ZERO|NO_DATA|NOT_APPLICABLE|NOT_CONFIGURED|SOURCE_ERROR|PENDING_VERIFICATION
      t.decimal('value', 18, 4).nullable();
      t.json('raw_value').nullable();
      t.json('source_ref').nullable(); // { module, recordType, recordId, query } — lineage
      t.boolean('is_override').notNullable().defaultTo(false);
      t.decimal('previous_value', 18, 4).nullable();
      t.string('previous_status', 32).nullable();
      t.text('override_reason').nullable();
      t.integer('override_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('override_at').nullable();
      t.integer('computed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('computed_at').notNullable().defaultTo(knex.fn.now());
      t.timestamps(true, true);
      t.unique(['metric_id', 'period_label'], { indexName: 'iqac_mval_metric_period_uq' });
      t.index(['college_id', 'cycle_id'], 'iqac_mval_college_cycle_idx');
    });
  }

  // ── Immutable freeze snapshots (append-only; a revision after freeze adds
  //    a new row, never mutates an existing one) ────────────────────────────
  if (!(await knex.schema.hasTable('iqac_snapshots'))) {
    await knex.schema.createTable('iqac_snapshots', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('cycle_id').unsigned().notNullable().references('id').inTable('iqac_cycles').onDelete('CASCADE');
      t.integer('revision').unsigned().notNullable().defaultTo(1);
      t.json('metric_values_snapshot').notNullable(); // frozen copy of iqac_metric_values rows for this cycle
      t.json('evidence_index_snapshot').notNullable(); // frozen copy of iqac_evidence rows for this cycle
      t.text('reason').nullable(); // required for revision > 1
      t.integer('taken_by').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.timestamp('taken_at').notNullable().defaultTo(knex.fn.now());
      t.unique(['cycle_id', 'revision'], { indexName: 'iqac_snap_cycle_rev_uq' });
    });
  }

  // ── Evidence linkage (files reuse documentEngine by id; no binary storage
  //    here) ──────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('iqac_evidence'))) {
    await knex.schema.createTable('iqac_evidence', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('cycle_id').unsigned().nullable().references('id').inTable('iqac_cycles').onDelete('SET NULL');
      t.integer('criterion_id').unsigned().nullable().references('id').inTable('iqac_criteria').onDelete('SET NULL');
      t.integer('metric_id').unsigned().nullable().references('id').inTable('iqac_metrics').onDelete('SET NULL');
      t.string('provenance', 24).notNullable(); // SYSTEM_DERIVED|SYSTEM_DOCUMENT|MANUAL_UPLOAD|EXTERNAL_REFERENCE
      t.string('source_module', 64).nullable();
      t.string('source_record_type', 64).nullable();
      t.integer('source_record_id').unsigned().nullable();
      t.integer('document_id').unsigned().nullable(); // campus_documents.id — no cross-module FK, documentEngine is a separate bounded module
      t.string('external_reference', 512).nullable();
      t.string('period_label', 32).nullable();
      t.string('academic_year', 16).nullable();
      t.string('verification_status', 24).notNullable().defaultTo('SUBMITTED');
      // SUBMITTED|REVIEWED|VERIFIED|RETURNED|REJECTED
      t.integer('submitted_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('submitted_at').notNullable().defaultTo(knex.fn.now());
      t.integer('verified_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('verified_at').nullable();
      t.text('remarks').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'cycle_id'], 'iqac_ev_college_cycle_idx');
      t.index(['college_id', 'criterion_id'], 'iqac_ev_college_crit_idx');
      t.index(['college_id', 'verification_status'], 'iqac_ev_college_status_idx');
    });
  }

  // ── Continuous improvement / action plans (shared by NBA gaps, NAAC
  //    observations, academic-audit findings, survey feedback, IQAC
  //    meetings, compliance gaps — one engine, not several) ─────────────────
  if (!(await knex.schema.hasTable('iqac_action_plans'))) {
    await knex.schema.createTable('iqac_action_plans', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('source_type', 32).notNullable();
      // NBA_ATTAINMENT_GAP|NAAC_OBSERVATION|ACADEMIC_AUDIT|SURVEY_FEEDBACK|MANAGEMENT_REVIEW|IQAC_MEETING|COMPLIANCE_GAP|OTHER
      t.json('source_ref').nullable(); // { module, recordType, recordId }
      t.text('finding').notNullable();
      t.text('action').notNullable();
      t.integer('owner_user_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.date('target_date').nullable();
      t.string('status', 24).notNullable().defaultTo('PLANNED');
      // PLANNED|IN_PROGRESS|COMPLETED|CLOSED|CANCELLED
      t.integer('evidence_document_id').unsigned().nullable();
      t.text('review_remarks').nullable();
      t.integer('closed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('closed_at').nullable();
      t.integer('reopen_count').unsigned().notNullable().defaultTo(0);
      t.text('reopen_reason').nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'iqac_ap_college_status_idx');
      t.index(['college_id', 'department_id'], 'iqac_ap_college_dept_idx');
      t.index(['college_id', 'source_type'], 'iqac_ap_college_source_idx');
    });
  }

  // ── Academic / internal quality audits ────────────────────────────────────
  if (!(await knex.schema.hasTable('iqac_audits'))) {
    await knex.schema.createTable('iqac_audits', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('name', 255).notNullable();
      t.string('academic_year', 16).notNullable();
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('auditor_user_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.json('checklist').notNullable(); // [{ code, text }] — configuration-driven, supplied at creation
      t.string('status', 24).notNullable().defaultTo('DRAFT'); // DRAFT|IN_PROGRESS|COMPLETED|CLOSED
      t.date('scheduled_date').nullable();
      t.timestamp('completed_at').nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'department_id'], 'iqac_aud_college_dept_idx');
      t.index(['college_id', 'status'], 'iqac_aud_college_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('iqac_audit_findings'))) {
    await knex.schema.createTable('iqac_audit_findings', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('audit_id').unsigned().notNullable().references('id').inTable('iqac_audits').onDelete('CASCADE');
      t.string('checklist_item_code', 32).nullable();
      t.text('finding').notNullable();
      t.string('severity', 16).notNullable().defaultTo('MEDIUM'); // LOW|MEDIUM|HIGH|CRITICAL
      t.string('status', 24).notNullable().defaultTo('OPEN'); // OPEN|ACTION_PLANNED|IN_PROGRESS|CLOSED
      t.integer('action_plan_id').unsigned().nullable().references('id').inTable('iqac_action_plans').onDelete('SET NULL');
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'audit_id'], 'iqac_af_college_audit_idx');
    });
  }

  // ── Generic governed committees (IQAC and others — one capability, not one
  //    module per committee) ────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('iqac_committees'))) {
    await knex.schema.createTable('iqac_committees', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('name', 255).notNullable();
      t.string('committee_type', 32).notNullable().defaultTo('IQAC'); // IQAC|ACADEMIC|RESEARCH|STATUTORY|OTHER
      t.text('description').nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'committee_type'], 'iqac_cmt_college_type_idx');
    });
  }

  if (!(await knex.schema.hasTable('iqac_committee_members'))) {
    await knex.schema.createTable('iqac_committee_members', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('committee_id').unsigned().notNullable().references('id').inTable('iqac_committees').onDelete('CASCADE');
      t.integer('user_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      t.string('external_name', 255).nullable();
      t.string('external_designation', 255).nullable();
      t.string('role_in_committee', 24).notNullable().defaultTo('MEMBER'); // CHAIRPERSON|COORDINATOR|MEMBER|EXTERNAL_MEMBER
      t.date('term_start').nullable();
      t.date('term_end').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'committee_id'], 'iqac_cm_college_committee_idx');
    });
  }

  if (!(await knex.schema.hasTable('iqac_meetings'))) {
    await knex.schema.createTable('iqac_meetings', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('committee_id').unsigned().notNullable().references('id').inTable('iqac_committees').onDelete('CASCADE');
      t.date('meeting_date').notNullable();
      t.text('agenda').nullable();
      t.text('minutes').nullable();
      t.integer('minutes_document_id').unsigned().nullable(); // campus_documents.id, no cross-module FK
      t.string('status', 24).notNullable().defaultTo('SCHEDULED'); // SCHEDULED|HELD|CANCELLED
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'committee_id'], 'iqac_mtg_college_committee_idx');
    });
  }

  // ── Compliance calendar ───────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('iqac_compliance_items'))) {
    await knex.schema.createTable('iqac_compliance_items', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('requirement', 512).notNullable();
      t.string('authority', 128).notNullable(); // e.g. AICTE|UGC|VTU|NAAC|NBA|STATE|OTHER
      t.string('period_label', 32).nullable();
      t.date('due_date').notNullable();
      t.integer('owner_user_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('evidence_document_id').unsigned().nullable();
      t.string('submission_reference', 128).nullable();
      t.string('status', 24).notNullable().defaultTo('PENDING'); // PENDING|SUBMITTED|OVERDUE|WAIVED|COMPLETED
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'iqac_ci_college_status_idx');
      t.index(['college_id', 'due_date'], 'iqac_ci_college_due_idx');
    });
  }

  // ── Audit log — mirrors research_audit_log's exact shape ─────────────────
  if (!(await knex.schema.hasTable('iqac_audit_log'))) {
    await knex.schema.createTable('iqac_audit_log', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('actor_type', 32).notNullable().defaultTo('FACULTY');
      t.integer('actor_id').unsigned().nullable();
      t.string('action', 96).notNullable();
      t.string('entity_type', 64).notNullable();
      t.integer('entity_id').unsigned().nullable();
      t.json('before_state').nullable();
      t.json('after_state').nullable();
      t.text('reason').nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'entity_type', 'entity_id'], 'iqac_audit_entity_idx');
      t.index(['college_id', 'action', 'created_at'], 'iqac_audit_action_idx');
    });
  }
};

exports.down = async function down(knex) {
  // Drop children before parents to respect FK ordering.
  for (const table of [
    'iqac_audit_log',
    'iqac_compliance_items',
    'iqac_meetings',
    'iqac_committee_members',
    'iqac_committees',
    'iqac_audit_findings',
    'iqac_audits',
    'iqac_action_plans',
    'iqac_evidence',
    'iqac_snapshots',
    'iqac_metric_values',
    'iqac_cycles',
    'iqac_metrics',
    'iqac_criteria',
    'iqac_framework_versions',
    'iqac_frameworks',
  ]) {
    if (await knex.schema.hasTable(table)) {
      await knex.schema.dropTable(table);
    }
  }
};
