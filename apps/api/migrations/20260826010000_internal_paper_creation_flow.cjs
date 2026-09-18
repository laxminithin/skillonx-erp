/**
 * Internal paper creation flow: pattern master, syllabus scope, marks
 * distinction (required vs printed), and draft workflow fields.
 * Existing papers remain readable; they are marked as legacy.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const hasCol = async (table, column) => knex.schema.hasColumn(table, column);

  if (!(await knex.schema.hasTable('internal_paper_pattern_templates'))) {
    await knex.schema.createTable('internal_paper_pattern_templates', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().nullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('code', 64).notNullable();
      t.string('name', 255).notNullable();
      t.decimal('max_marks', 10, 2).notNullable().defaultTo(50);
      t.decimal('required_answer_marks', 10, 2).notNullable().defaultTo(50);
      t.integer('duration_minutes').unsigned().nullable();
      t.json('sections_json').notNullable();
      t.boolean('allow_or_choices').notNullable().defaultTo(true);
      t.boolean('is_default').notNullable().defaultTo(false);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
      t.index(['college_id', 'code']);
    });
  }

  const STANDARD_SECTIONS = JSON.stringify([
    {
      key: 'Q1',
      label: 'Question / Section 1',
      requiredMarks: 20,
      questionNumber: 1,
      defaultSplit: [10, 10],
      allowedSplits: [
        [20],
        [10, 10],
        [12, 8],
        [8, 12],
        [5, 5, 10],
      ],
      allowOr: true,
    },
    {
      key: 'Q2',
      label: 'Question / Section 2',
      requiredMarks: 20,
      questionNumber: 2,
      defaultSplit: [10, 10],
      allowedSplits: [
        [20],
        [10, 10],
        [12, 8],
        [8, 12],
        [5, 5, 10],
      ],
      allowOr: true,
    },
    {
      key: 'Q3',
      label: 'Question / Section 3',
      requiredMarks: 10,
      questionNumber: 3,
      defaultSplit: [10],
      allowedSplits: [[10], [5, 5], [4, 6], [6, 4]],
      allowOr: true,
    },
  ]);

  const colleges = await knex('colleges').select('id');
  for (const college of colleges) {
    const existing = await knex('internal_paper_pattern_templates')
      .where({ college_id: college.id, code: 'STANDARD_IA_50' })
      .first();
    if (existing) continue;
    await knex('internal_paper_pattern_templates').insert({
      college_id: college.id,
      code: 'STANDARD_IA_50',
      name: 'STANDARD IA — 50 MARKS',
      max_marks: 50,
      required_answer_marks: 50,
      duration_minutes: 90,
      sections_json: STANDARD_SECTIONS,
      allow_or_choices: true,
      is_default: true,
      is_active: true,
    });
  }

  if (await knex.schema.hasTable('internal_question_papers')) {
    if (!(await hasCol('internal_question_papers', 'creation_flow_version'))) {
      await knex.schema.alterTable('internal_question_papers', (t) => {
        t.integer('creation_flow_version').unsigned().notNullable().defaultTo(1);
        t.string('workflow_step', 32).nullable();
        t.integer('pattern_template_id').unsigned().nullable();
        t.string('pattern_code', 64).nullable();
        t.decimal('required_answer_marks', 10, 2).nullable();
        t.decimal('printed_marks', 10, 2).nullable();
        t.json('selected_scope_json').nullable();
        t.boolean('coverage_warning_acknowledged').notNullable().defaultTo(false);
        t.string('build_mode', 32).nullable();
        t.string('course_type', 32).nullable();
        t.string('faculty_name_snapshot', 255).nullable();
        t.timestamp('autosaved_at').nullable();
      });
    }
    await knex('internal_question_papers').whereNull('workflow_step').update({
      workflow_step: knex.raw(`case when status = 'DRAFT' then 'SETUP' else 'REVIEW' end`),
    });
  }

  if (await knex.schema.hasTable('internal_question_paper_items')) {
    if (!(await hasCol('internal_question_paper_items', 'topic_id'))) {
      await knex.schema.alterTable('internal_question_paper_items', (t) => {
        t.integer('parent_item_id').unsigned().nullable();
        t.integer('topic_id').unsigned().nullable();
        t.string('topic_name', 512).nullable();
        t.string('rbt_level', 8).nullable();
        t.string('or_alternative', 8).nullable();
        t.string('verification_status', 64).nullable();
        t.boolean('needs_faculty_verification').notNullable().defaultTo(false);
        t.boolean('co_mapping_blocked').notNullable().defaultTo(false);
      });
    }
  }

  if (!(await knex.schema.hasTable('internal_paper_scope_modules'))) {
    await knex.schema.createTable('internal_paper_scope_modules', (t) => {
      t.increments('id').primary();
      t.integer('paper_id').unsigned().notNullable().references('id').inTable('internal_question_papers').onDelete('CASCADE');
      t.integer('module_id').unsigned().notNullable();
      t.string('module_name', 255).nullable();
      t.boolean('selected').notNullable().defaultTo(true);
      t.decimal('coverage_percent', 6, 2).nullable();
      t.decimal('teaching_hours', 8, 2).nullable();
      t.string('primary_co_code', 32).nullable();
      t.integer('sort_order').unsigned().notNullable().defaultTo(0);
      t.unique(['paper_id', 'module_id'], 'ipsm_paper_mod_uid');
    });
  }

  if (!(await knex.schema.hasTable('internal_paper_scope_topics'))) {
    await knex.schema.createTable('internal_paper_scope_topics', (t) => {
      t.increments('id').primary();
      t.integer('paper_id').unsigned().notNullable().references('id').inTable('internal_question_papers').onDelete('CASCADE');
      t.integer('module_id').unsigned().notNullable();
      t.integer('topic_id').unsigned().nullable();
      t.string('topic_name', 512).notNullable();
      t.boolean('selected').notNullable().defaultTo(true);
      t.integer('sort_order').unsigned().notNullable().defaultTo(0);
      t.index(['paper_id', 'module_id']);
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('internal_paper_scope_topics');
  await knex.schema.dropTableIfExists('internal_paper_scope_modules');
  if (await knex.schema.hasTable('internal_question_paper_items')) {
    if (await knex.schema.hasColumn('internal_question_paper_items', 'topic_id')) {
      await knex.schema.alterTable('internal_question_paper_items', (t) => {
        t.dropColumn('parent_item_id');
        t.dropColumn('topic_id');
        t.dropColumn('topic_name');
        t.dropColumn('rbt_level');
        t.dropColumn('or_alternative');
        t.dropColumn('verification_status');
        t.dropColumn('needs_faculty_verification');
        t.dropColumn('co_mapping_blocked');
      });
    }
  }
  if (await knex.schema.hasTable('internal_question_papers')) {
    if (await knex.schema.hasColumn('internal_question_papers', 'creation_flow_version')) {
      await knex.schema.alterTable('internal_question_papers', (t) => {
        t.dropColumn('creation_flow_version');
        t.dropColumn('workflow_step');
        t.dropColumn('pattern_template_id');
        t.dropColumn('pattern_code');
        t.dropColumn('required_answer_marks');
        t.dropColumn('printed_marks');
        t.dropColumn('selected_scope_json');
        t.dropColumn('coverage_warning_acknowledged');
        t.dropColumn('build_mode');
        t.dropColumn('course_type');
        t.dropColumn('faculty_name_snapshot');
        t.dropColumn('autosaved_at');
      });
    }
  }
  await knex.schema.dropTableIfExists('internal_paper_pattern_templates');
};
