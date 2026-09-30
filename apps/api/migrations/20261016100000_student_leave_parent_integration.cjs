/**
 * Parent-aware academic leave integration.
 *
 * Keeps academic leave in student_service_requests, hostel movement in hostel
 * tables, and attendance in attendance tables. Adds parent workflow metadata
 * without creating a parallel leave engine.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (await knex.schema.hasTable('student_service_requests')) {
    const addRequesterParent = !(await knex.schema.hasColumn('student_service_requests', 'requester_parent_user_id'));
    const addParentState = !(await knex.schema.hasColumn('student_service_requests', 'parent_action_state'));
    const addHostelCorrelation = !(await knex.schema.hasColumn('student_service_requests', 'hostel_correlation_id'));
    if (addRequesterParent || addParentState || addHostelCorrelation) {
      await knex.schema.alterTable('student_service_requests', (t) => {
        if (addRequesterParent) {
        t.integer('requester_parent_user_id').unsigned().nullable().references('id').inTable('parent_users').onDelete('SET NULL');
      }
        if (addParentState) {
        t.string('parent_action_state', 24).nullable();
      }
        if (addHostelCorrelation) {
        t.string('hostel_correlation_id', 64).nullable();
      }
      });
    }
  }

  if (await knex.schema.hasTable('student_request_actions')) {
    const addActionParent = !(await knex.schema.hasColumn('student_request_actions', 'acted_by_parent_user_id'));
    const addParentLink = !(await knex.schema.hasColumn('student_request_actions', 'parent_student_link_id'));
    if (addActionParent || addParentLink) {
      await knex.schema.alterTable('student_request_actions', (t) => {
        if (addActionParent) {
        t.integer('acted_by_parent_user_id').unsigned().nullable().references('id').inTable('parent_users').onDelete('SET NULL');
      }
        if (addParentLink) {
        t.integer('parent_student_link_id').unsigned().nullable().references('id').inTable('parent_student_links').onDelete('SET NULL');
      }
      });
    }
  }

  if (!(await knex.schema.hasTable('student_leave_policies'))) {
    await knex.schema.createTable('student_leave_policies', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('leave_type', 64).notNullable();
      t.integer('min_days').nullable();
      t.integer('max_days').nullable();
      t.boolean('requires_parent').notNullable().defaultTo(true);
      t.boolean('requires_mentor').notNullable().defaultTo(true);
      t.boolean('requires_coordinator').notNullable().defaultTo(true);
      t.boolean('requires_hod').notNullable().defaultTo(false);
      t.boolean('requires_principal').notNullable().defaultTo(false);
      t.boolean('parent_can_initiate').notNullable().defaultTo(true);
      t.boolean('evidence_required').notNullable().defaultTo(false);
      t.integer('evidence_after_days').nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.index(['college_id', 'leave_type', 'is_active'], 'slp_college_type_active_idx');
    });
  }

  if (!(await knex.schema.hasTable('student_leave_linked_requests'))) {
    await knex.schema.createTable('student_leave_linked_requests', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('academic_request_id').unsigned().notNullable().references('id').inTable('student_service_requests').onDelete('CASCADE');
      t.string('linked_domain', 32).notNullable();
      t.string('linked_entity_type', 64).notNullable();
      t.integer('linked_entity_id').unsigned().notNullable();
      t.string('correlation_id', 64).notNullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.unique(['academic_request_id', 'linked_domain', 'linked_entity_type', 'linked_entity_id'], { indexName: 'sllr_request_link_unique' });
      t.index(['college_id', 'correlation_id'], 'sllr_college_correlation_idx');
    });
  }

  const colleges = await knex('colleges').select('id');
  for (const college of colleges) {
    await seedLeavePolicies(knex, Number(college.id));
    await syncCanonicalLeaveWorkflow(knex, Number(college.id));
  }
};

async function seedLeavePolicies(knex, collegeId) {
  const policies = [
    { leave_type: 'SHORT_PERMISSION', min_days: 0, max_days: 0, requires_parent: false, requires_mentor: true, requires_coordinator: true, requires_hod: false, parent_can_initiate: false },
    { leave_type: 'NORMAL_LEAVE', min_days: 1, max_days: 1, requires_parent: true, requires_mentor: true, requires_coordinator: true, requires_hod: false },
    { leave_type: 'MULTI_DAY_LEAVE', min_days: 2, max_days: null, requires_parent: true, requires_mentor: true, requires_coordinator: true, requires_hod: true },
    { leave_type: 'MEDICAL_LEAVE', min_days: 1, max_days: null, requires_parent: true, requires_mentor: true, requires_coordinator: true, requires_hod: true, evidence_required: true, evidence_after_days: 2 },
    { leave_type: 'RETROSPECTIVE_LEAVE', min_days: 1, max_days: null, requires_parent: true, requires_mentor: true, requires_coordinator: true, requires_hod: true },
    { leave_type: 'OFFICIAL_DUTY', min_days: 0, max_days: null, requires_parent: false, requires_mentor: true, requires_coordinator: true, requires_hod: false, parent_can_initiate: false },
  ];
  for (const p of policies) {
    const exists = await knex('student_leave_policies').where({ college_id: collegeId, leave_type: p.leave_type }).first();
    if (!exists) await knex('student_leave_policies').insert({ college_id: collegeId, ...p });
  }
}

async function syncCanonicalLeaveWorkflow(knex, collegeId) {
  const definitions = [
    {
      code: 'STUDENT_LEAVE_REQUEST',
      steps: [
        ['PARENT_ACTION', 'Parent Action', 'PARENT'],
        ['MENTOR_APPROVAL', 'Mentor Approval', 'MENTOR'],
        ['COORDINATOR_APPROVAL', 'Class Coordinator Approval', 'CLASS_COORDINATOR'],
        ['HOD_APPROVAL', 'HOD Approval', 'HOD'],
      ],
    },
    {
      code: 'STUDENT_PERMISSION_REQUEST',
      steps: [
        ['MENTOR_REVIEW', 'Mentor Review', 'MENTOR'],
        ['COORDINATOR_APPROVAL', 'Class Coordinator Approval', 'CLASS_COORDINATOR'],
      ],
    },
  ];
  for (const def of definitions) {
    const type = await knex('student_service_request_types').where({ college_id: collegeId, code: def.code }).first();
    if (!type) continue;
    let workflow = await knex('student_request_workflows').where({ college_id: collegeId, request_type_id: type.id }).first();
    if (!workflow) {
      const [id] = await knex('student_request_workflows').insert({ college_id: collegeId, request_type_id: type.id, name: `${type.label} Workflow` });
      workflow = { id };
    }
    await knex('student_request_workflow_steps').where({ workflow_id: workflow.id }).delete();
    for (let i = 0; i < def.steps.length; i++) {
      const [step_key, label, actor_role] = def.steps[i];
      await knex('student_request_workflow_steps').insert({
        workflow_id: workflow.id,
        step_order: i + 1,
        step_key,
        label,
        actor_role,
        is_final: i === def.steps.length - 1,
      });
    }
  }
}

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  if (await knex.schema.hasTable('student_leave_linked_requests')) await knex.schema.dropTable('student_leave_linked_requests');
  if (await knex.schema.hasTable('student_leave_policies')) await knex.schema.dropTable('student_leave_policies');
  if (await knex.schema.hasTable('student_request_actions')) {
    await knex.schema.alterTable('student_request_actions', (t) => {
      t.dropColumn('parent_student_link_id');
      t.dropColumn('acted_by_parent_user_id');
    });
  }
  if (await knex.schema.hasTable('student_service_requests')) {
    await knex.schema.alterTable('student_service_requests', (t) => {
      t.dropColumn('hostel_correlation_id');
      t.dropColumn('parent_action_state');
      t.dropColumn('requester_parent_user_id');
    });
  }
};
