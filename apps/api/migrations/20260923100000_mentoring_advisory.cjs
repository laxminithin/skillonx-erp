/**
 * Mentoring & Student Advisory closure.
 *
 * Extends existing mentoring primitives (mentor_assignments, mentor_meetings,
 * student_academic_alerts, student_services_audit_log) with a full advisory
 * workflow: session categorisation + confidentiality, action plans, follow-up
 * derivation, escalation, referral, parent interaction, and per-college risk
 * configuration. Deliberately reuses academic source systems (attendance,
 * assessment, examination, LMS) rather than duplicating them.
 */
exports.up = async function up(knex) {
  // ── Extend mentor_meetings into full mentoring sessions ──────────────
  if (await knex.schema.hasTable('mentor_meetings')) {
    const hasVisibility = await knex.schema.hasColumn('mentor_meetings', 'visibility');
    if (!hasVisibility) {
      await knex.schema.alterTable('mentor_meetings', (t) => {
        // SHARED | MENTORING_TEAM | CONFIDENTIAL — governs private_notes exposure.
        t.string('visibility', 24).notNullable().defaultTo('MENTORING_TEAM');
        t.string('session_category', 48).nullable();
        t.text('observations').nullable();
        t.text('outcome').nullable();
        t.integer('created_by_faculty_id').unsigned().nullable();
        t.string('follow_up_status', 16).nullable(); // PENDING | DONE | null
        t.timestamp('follow_up_completed_at').nullable();
      });
    }
  }

  // ── Mentoring action plan items ──────────────────────────────────────
  if (!(await knex.schema.hasTable('mentoring_actions'))) {
    await knex.schema.createTable('mentoring_actions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('mentor_faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      t.integer('meeting_id').unsigned().nullable().references('id').inTable('mentor_meetings').onDelete('SET NULL');
      t.string('title', 255).notNullable();
      t.text('description').nullable();
      t.string('owner', 16).notNullable().defaultTo('STUDENT'); // STUDENT | MENTOR
      t.string('status', 16).notNullable().defaultTo('OPEN'); // OPEN | IN_PROGRESS | COMPLETED | CANCELLED
      t.string('priority', 8).notNullable().defaultTo('NORMAL'); // LOW | NORMAL | HIGH
      t.date('due_date').nullable();
      t.timestamp('completed_at').nullable();
      t.text('outcome').nullable();
      t.boolean('student_visible').notNullable().defaultTo(true);
      t.integer('created_by_faculty_id').unsigned().nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'student_id', 'status'], 'mact_college_student_status_idx');
      t.index(['college_id', 'mentor_faculty_id', 'status'], 'mact_college_mentor_status_idx');
    });
  }

  // ── Mentoring escalations (Mentor → HOD → Principal) ─────────────────
  if (!(await knex.schema.hasTable('mentoring_escalations'))) {
    await knex.schema.createTable('mentoring_escalations', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('mentor_faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      t.integer('meeting_id').unsigned().nullable().references('id').inTable('mentor_meetings').onDelete('SET NULL');
      t.string('reason_code', 48).notNullable();
      t.text('reason').notNullable();
      t.string('target_level', 16).notNullable().defaultTo('HOD'); // HOD | PRINCIPAL
      t.integer('assigned_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('status', 16).notNullable().defaultTo('OPEN'); // OPEN | ACKNOWLEDGED | RETURNED | RESOLVED
      t.integer('initiated_by_faculty_id').unsigned().nullable();
      t.text('resolution').nullable();
      t.timestamp('acknowledged_at').nullable();
      t.timestamp('resolved_at').nullable();
      t.integer('resolved_by_faculty_id').unsigned().nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'department_id', 'status'], 'mesc_college_dept_status_idx');
      t.index(['college_id', 'mentor_faculty_id', 'status'], 'mesc_college_mentor_status_idx');
      t.index(['college_id', 'student_id'], 'mesc_college_student_idx');
    });
  }

  // ── Mentoring referrals to other institutional functions ─────────────
  if (!(await knex.schema.hasTable('mentoring_referrals'))) {
    await knex.schema.createTable('mentoring_referrals', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('mentor_faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      // ACADEMIC_SERVICES | TP | FINANCE | GRIEVANCE | HOD | PRINCIPAL | OTHER
      t.string('target_function', 32).notNullable();
      t.string('subject', 255).notNullable();
      // Minimum-necessary context only — never confidential narrative notes.
      t.text('context').nullable();
      t.string('status', 16).notNullable().defaultTo('OPEN'); // OPEN | ACCEPTED | CLOSED
      t.integer('created_by_faculty_id').unsigned().nullable();
      t.text('outcome').nullable();
      t.timestamp('closed_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'student_id', 'status'], 'mref_college_student_status_idx');
    });
  }

  // ── Parent / guardian interaction log ────────────────────────────────
  if (!(await knex.schema.hasTable('mentoring_parent_interactions'))) {
    await knex.schema.createTable('mentoring_parent_interactions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('mentor_faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('CASCADE');
      t.date('interaction_date').notNullable();
      t.string('mode', 24).notNullable().defaultTo('PHONE'); // PHONE | IN_PERSON | ONLINE | LETTER | OTHER
      t.string('initiated_by', 24).notNullable().defaultTo('MENTOR'); // MENTOR | PARENT | INSTITUTION
      t.string('purpose', 255).notNullable();
      t.text('summary').nullable();
      t.text('agreed_follow_up').nullable();
      t.string('visibility', 24).notNullable().defaultTo('MENTORING_TEAM');
      t.integer('created_by_faculty_id').unsigned().nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'student_id'], 'mpi_college_student_idx');
    });
  }

  // ── Per-college risk configuration ───────────────────────────────────
  if (!(await knex.schema.hasTable('mentoring_risk_config'))) {
    await knex.schema.createTable('mentoring_risk_config', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('attendance_attention_pct').notNullable().defaultTo(75);
      t.integer('attendance_high_pct').notNullable().defaultTo(65);
      t.integer('cie_attention_pct').notNullable().defaultTo(40);
      t.integer('assignment_miss_attention').notNullable().defaultTo(2);
      t.integer('assignment_miss_high').notNullable().defaultTo(4);
      t.integer('backlog_watch').notNullable().defaultTo(1);
      t.integer('backlog_attention').notNullable().defaultTo(2);
      t.integer('backlog_high').notNullable().defaultTo(4);
      t.integer('followup_overdue_days').notNullable().defaultTo(0);
      t.integer('updated_by_faculty_id').unsigned().nullable();
      t.timestamps(true, true);
      t.unique(['college_id'], { indexName: 'mrc_college_unique' });
    });
  }
};

exports.down = async function down(knex) {
  const tables = [
    'mentoring_risk_config',
    'mentoring_parent_interactions',
    'mentoring_referrals',
    'mentoring_escalations',
    'mentoring_actions',
  ];
  for (const table of tables) {
    if (await knex.schema.hasTable(table)) await knex.schema.dropTable(table);
  }
  if (await knex.schema.hasTable('mentor_meetings')) {
    const cols = ['visibility', 'session_category', 'observations', 'outcome', 'created_by_faculty_id', 'follow_up_status', 'follow_up_completed_at'];
    for (const c of cols) {
      if (await knex.schema.hasColumn('mentor_meetings', c)) {
        await knex.schema.alterTable('mentor_meetings', (t) => t.dropColumn(c));
      }
    }
  }
};
