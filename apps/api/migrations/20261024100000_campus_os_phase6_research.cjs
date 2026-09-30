/**
 * Campus OS Phase 6 — Research, Grants, Consultancy, Innovation & IPR
 * (minimal administrative scope), per
 * docs/CAMPUS_OS_PHASE6_PREIMPLEMENTATION_AUDIT.md.
 *
 * This adds ONLY the proven, explicitly-approved gap: a structured, queryable
 * grants-*administration* layer — funding-agency master, proposal team
 * (real PI/Co-PI faculty links), a proposal -> approval -> award -> project
 * lifecycle (approval reuses the existing Workflow Engine, P0.3), and
 * record-only sanction/utilization tracking.
 *
 * It does NOT touch or duplicate the Faculty Academic Record
 * (`facultyProfile` / `faculty_records`), which remains the frozen, sole
 * owner of CV-shaped publications/patents/projects-as-achievement/
 * consultancy/conferences/FDP/awards. It also does not add consultancy
 * revenue-distribution, an institutional IPR case lifecycle, student
 * research participation, or Procurement/Asset funding-source hooks — all
 * explicitly out of scope for this pass.
 */
exports.up = async function up(knex) {
  // ── Funding agency master ────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('research_funding_agencies'))) {
    await knex.schema.createTable('research_funding_agencies', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('name', 255).notNullable();
      t.string('agency_type', 32).notNullable().defaultTo('OTHER'); // GOVERNMENT|INDUSTRY|UNIVERSITY|FOUNDATION|INTERNAL|OTHER
      t.string('contact_name', 255).nullable();
      t.string('contact_email', 255).nullable();
      t.string('contact_phone', 32).nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.unique(['college_id', 'name'], { indexName: 'res_agency_college_name_uq' });
    });
  }

  // ── Code sequence generator (locked, concurrency-safe project codes) ─────
  if (!(await knex.schema.hasTable('research_code_sequences'))) {
    await knex.schema.createTable('research_code_sequences', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('sequence_key', 32).notNullable(); // e.g. 'PROJECT'
      t.integer('next_value').unsigned().notNullable().defaultTo(1);
      t.timestamps(true, true);
      t.unique(['college_id', 'sequence_key'], { indexName: 'res_seq_college_key_uq' });
    });
  }

  // ── Proposal ──────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('research_proposals'))) {
    await knex.schema.createTable('research_proposals', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('title', 512).notNullable();
      t.string('project_type', 32).notNullable(); // SPONSORED_RESEARCH|INTERNAL_RESEARCH|SEED_GRANT|CONSULTANCY|INDUSTRY_PROJECT|COLLABORATIVE_RESEARCH|STUDENT_RESEARCH
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('pi_faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.integer('funding_agency_id').unsigned().nullable().references('id').inTable('research_funding_agencies').onDelete('SET NULL');
      t.decimal('requested_amount', 14, 2).nullable();
      t.integer('duration_months').unsigned().nullable();
      t.text('abstract').nullable();
      t.string('status', 32).notNullable().defaultTo('DRAFT');
      // DRAFT|UNDER_REVIEW|RETURNED|APPROVED_INTERNALLY|REJECTED_INTERNALLY|WITHDRAWN|AWARDED|CONVERTED_TO_PROJECT
      t.integer('workflow_instance_id').unsigned().nullable(); // points at workflow_instances.id; no FK — Workflow Engine is a separate module
      t.decimal('sanctioned_amount', 14, 2).nullable();
      t.string('sanction_reference', 128).nullable();
      t.date('sanction_date').nullable();
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.index(['college_id', 'status'], 'res_prop_college_status_idx');
      t.index(['college_id', 'department_id'], 'res_prop_college_dept_idx');
      t.index(['college_id', 'pi_faculty_id'], 'res_prop_college_pi_idx');
      t.index(['college_id', 'workflow_instance_id'], 'res_prop_college_wf_idx');
    });
  }

  // ── Proposal team (real PI/Co-PI/Co-Investigator/Team-Member links) ──────
  if (!(await knex.schema.hasTable('research_proposal_team'))) {
    await knex.schema.createTable('research_proposal_team', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('proposal_id').unsigned().notNullable().references('id').inTable('research_proposals').onDelete('CASCADE');
      t.integer('faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      t.string('role_in_project', 32).notNullable(); // PI|CO_PI|CO_INVESTIGATOR|TEAM_MEMBER
      t.timestamps(true, true);
      t.unique(['proposal_id', 'faculty_id'], { indexName: 'res_propteam_proposal_faculty_uq' });
    });
  }

  // ── Project (converted from exactly one awarded proposal) ────────────────
  if (!(await knex.schema.hasTable('research_projects'))) {
    await knex.schema.createTable('research_projects', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('proposal_id').unsigned().notNullable().unique().references('id').inTable('research_proposals').onDelete('RESTRICT');
      t.string('project_code', 64).notNullable();
      t.string('title', 512).notNullable();
      t.string('project_type', 32).notNullable();
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('pi_faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.integer('funding_agency_id').unsigned().nullable().references('id').inTable('research_funding_agencies').onDelete('SET NULL');
      t.decimal('sanctioned_amount', 14, 2).notNullable();
      t.string('sanction_reference', 128).nullable();
      t.date('sanction_date').nullable();
      t.date('start_date').nullable();
      t.date('end_date').nullable();
      t.string('status', 32).notNullable().defaultTo('ACTIVE'); // ACTIVE|ON_HOLD|COMPLETION_PENDING|COMPLETED|CLOSED|CANCELLED
      t.timestamp('closed_at').nullable();
      t.integer('closed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['college_id', 'project_code'], { indexName: 'res_proj_college_code_uq' });
      t.index(['college_id', 'status'], 'res_proj_college_status_idx');
      t.index(['college_id', 'department_id'], 'res_proj_college_dept_idx');
      t.index(['college_id', 'pi_faculty_id'], 'res_proj_college_pi_idx');
    });
  }

  // ── Project team (copied from proposal team at conversion time) ─────────
  if (!(await knex.schema.hasTable('research_project_team'))) {
    await knex.schema.createTable('research_project_team', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('project_id').unsigned().notNullable().references('id').inTable('research_projects').onDelete('CASCADE');
      t.integer('faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      t.string('role_in_project', 32).notNullable();
      t.timestamps(true, true);
      t.unique(['project_id', 'faculty_id'], { indexName: 'res_projteam_project_faculty_uq' });
    });
  }

  // ── Utilization entries — explicitly RECORD-ONLY / non-authoritative-for-
  //    accounting. This is NOT a Finance ledger entry: Finance has no
  //    institutional-ledger/cost-centre dimension to plug into (confirmed by
  //    the Phase 6 audit), so these rows exist purely so the institution can
  //    see a running utilization figure against a sanctioned grant. Append-
  //    only by design (no `updated_at`, no edit/delete endpoint). ─────────
  if (!(await knex.schema.hasTable('research_project_utilization_entries'))) {
    await knex.schema.createTable('research_project_utilization_entries', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('project_id').unsigned().notNullable().references('id').inTable('research_projects').onDelete('CASCADE');
      t.decimal('amount', 14, 2).notNullable();
      t.string('description', 500).nullable();
      t.date('recorded_at').notNullable();
      t.integer('recorded_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.index(['college_id', 'project_id'], 'res_util_college_project_idx');
    });
  }

  // ── Audit log — mirrors admission_audit_log's exact shape ────────────────
  if (!(await knex.schema.hasTable('research_audit_log'))) {
    await knex.schema.createTable('research_audit_log', (t) => {
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
      t.index(['college_id', 'entity_type', 'entity_id'], 'res_audit_entity_idx');
      t.index(['college_id', 'action', 'created_at'], 'res_audit_action_idx');
    });
  }
};

exports.down = async function down(knex) {
  // Drop children before parents to respect FK ordering.
  if (await knex.schema.hasTable('research_project_utilization_entries')) {
    await knex.schema.dropTable('research_project_utilization_entries');
  }
  if (await knex.schema.hasTable('research_project_team')) {
    await knex.schema.dropTable('research_project_team');
  }
  if (await knex.schema.hasTable('research_projects')) {
    await knex.schema.dropTable('research_projects');
  }
  if (await knex.schema.hasTable('research_proposal_team')) {
    await knex.schema.dropTable('research_proposal_team');
  }
  if (await knex.schema.hasTable('research_proposals')) {
    await knex.schema.dropTable('research_proposals');
  }
  if (await knex.schema.hasTable('research_funding_agencies')) {
    await knex.schema.dropTable('research_funding_agencies');
  }
  if (await knex.schema.hasTable('research_code_sequences')) {
    await knex.schema.dropTable('research_code_sequences');
  }
  if (await knex.schema.hasTable('research_audit_log')) {
    await knex.schema.dropTable('research_audit_log');
  }
};
