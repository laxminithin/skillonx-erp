/**
 * Preserve mapping origin / verification for CO–PSO and CO–SDG master + snapshots.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (await knex.schema.hasTable('copo_mapping_items')) {
    if (!(await knex.schema.hasColumn('copo_mapping_items', 'mapping_origin'))) {
      await knex.schema.alterTable('copo_mapping_items', (t) => {
        t.string('mapping_origin', 64).nullable();
      });
    }
    if (!(await knex.schema.hasColumn('copo_mapping_items', 'verification_status'))) {
      await knex.schema.alterTable('copo_mapping_items', (t) => {
        t.string('verification_status', 64).nullable();
      });
    }
  }

  if (await knex.schema.hasTable('program_specific_outcomes')) {
    if (!(await knex.schema.hasColumn('program_specific_outcomes', 'verification_status'))) {
      await knex.schema.alterTable('program_specific_outcomes', (t) => {
        t.string('verification_status', 64).nullable();
      });
    }
    if (!(await knex.schema.hasColumn('program_specific_outcomes', 'external_pso_id'))) {
      await knex.schema.alterTable('program_specific_outcomes', (t) => {
        t.string('external_pso_id', 64).nullable();
      });
    }
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  if (await knex.schema.hasTable('copo_mapping_items')) {
    if (await knex.schema.hasColumn('copo_mapping_items', 'verification_status')) {
      await knex.schema.alterTable('copo_mapping_items', (t) => t.dropColumn('verification_status'));
    }
    if (await knex.schema.hasColumn('copo_mapping_items', 'mapping_origin')) {
      await knex.schema.alterTable('copo_mapping_items', (t) => t.dropColumn('mapping_origin'));
    }
  }
  if (await knex.schema.hasTable('program_specific_outcomes')) {
    if (await knex.schema.hasColumn('program_specific_outcomes', 'external_pso_id')) {
      await knex.schema.alterTable('program_specific_outcomes', (t) => t.dropColumn('external_pso_id'));
    }
    if (await knex.schema.hasColumn('program_specific_outcomes', 'verification_status')) {
      await knex.schema.alterTable('program_specific_outcomes', (t) => t.dropColumn('verification_status'));
    }
  }
};
