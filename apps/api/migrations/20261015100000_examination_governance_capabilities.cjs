/**
 * Examination governance and capability ownership.
 *
 * Keeps one examination engine while making institution-vs-university authority
 * configurable per college.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('college_examination_governance'))) {
    await knex.schema.createTable('college_examination_governance', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('governance_type', 32).notNullable().defaultTo('AUTONOMOUS');
      t.string('affiliating_university', 255).nullable();
      t.json('capability_overrides').nullable();
      t.boolean('is_active').notNullable().defaultTo(true);
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['college_id'], { indexName: 'ceg_college_unique' });
      t.index(['governance_type', 'is_active'], 'ceg_type_active_idx');
    });
  }

  if (await knex.schema.hasTable('colleges')) {
    const colleges = await knex('colleges').select('id');
    for (const college of colleges) {
      const existing = await knex('college_examination_governance').where({ college_id: college.id }).first();
      if (!existing) {
        await knex('college_examination_governance').insert({
          college_id: college.id,
          governance_type: 'AUTONOMOUS',
          is_active: true,
        });
      }
    }
  }

  if (await knex.schema.hasTable('examinations')) {
    if (!(await knex.schema.hasColumn('examinations', 'governance_type'))) {
      await knex.schema.alterTable('examinations', (t) => {
        t.string('governance_type', 32).nullable();
        t.string('source_of_truth', 64).nullable();
        t.string('external_reference', 128).nullable();
        t.timestamp('frozen_at').nullable();
        t.integer('frozen_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
        t.index(['college_id', 'governance_type', 'status'], 'exam_college_gov_status_idx');
      });
    }
  }

  if (await knex.schema.hasTable('semester_results')) {
    if (!(await knex.schema.hasColumn('semester_results', 'source_of_truth'))) {
      await knex.schema.alterTable('semester_results', (t) => {
        t.string('source_of_truth', 64).notNullable().defaultTo('INSTITUTION');
        t.string('external_reference', 128).nullable();
        t.text('revision_reason').nullable();
        t.integer('previous_result_id').unsigned().nullable().references('id').inTable('semester_results').onDelete('SET NULL');
        t.index(['college_id', 'source_of_truth'], 'semres_college_source_idx');
      });
    }
  }
};

exports.down = async function down(knex) {
  if (await knex.schema.hasTable('semester_results')) {
    await knex.schema.alterTable('semester_results', (t) => {
      if (t.dropIndex) t.dropIndex(['college_id', 'source_of_truth'], 'semres_college_source_idx');
    }).catch(() => {});
    if (await knex.schema.hasColumn('semester_results', 'previous_result_id')) {
      await knex.schema.alterTable('semester_results', (t) => t.dropColumn('previous_result_id'));
    }
    if (await knex.schema.hasColumn('semester_results', 'revision_reason')) {
      await knex.schema.alterTable('semester_results', (t) => t.dropColumn('revision_reason'));
    }
    if (await knex.schema.hasColumn('semester_results', 'external_reference')) {
      await knex.schema.alterTable('semester_results', (t) => t.dropColumn('external_reference'));
    }
    if (await knex.schema.hasColumn('semester_results', 'source_of_truth')) {
      await knex.schema.alterTable('semester_results', (t) => t.dropColumn('source_of_truth'));
    }
  }
  if (await knex.schema.hasTable('examinations')) {
    await knex.schema.alterTable('examinations', (t) => {
      if (t.dropIndex) t.dropIndex(['college_id', 'governance_type', 'status'], 'exam_college_gov_status_idx');
    }).catch(() => {});
    for (const column of ['frozen_by', 'frozen_at', 'external_reference', 'source_of_truth', 'governance_type']) {
      if (await knex.schema.hasColumn('examinations', column)) {
        await knex.schema.alterTable('examinations', (t) => t.dropColumn(column));
      }
    }
  }
  await knex.schema.dropTableIfExists('college_examination_governance');
};
