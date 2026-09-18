/**
 * Operational CO-PO mapping fields for create-from-master workflow.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const hasItems = await knex.schema.hasTable('copo_mapping_items');
  if (hasItems) {
    if (!(await knex.schema.hasColumn('copo_mapping_items', 'master_strength'))) {
      await knex.schema.alterTable('copo_mapping_items', (t) => {
        t.integer('master_strength').unsigned().nullable();
      });
    }
    if (!(await knex.schema.hasColumn('copo_mapping_items', 'source_mapping_item_id'))) {
      await knex.schema.alterTable('copo_mapping_items', (t) => {
        t.integer('source_mapping_item_id').unsigned().nullable();
      });
    }
  }

  const hasVersions = await knex.schema.hasTable('copo_mapping_versions');
  if (hasVersions) {
    if (!(await knex.schema.hasColumn('copo_mapping_versions', 'source_mapping_version_id'))) {
      await knex.schema.alterTable('copo_mapping_versions', (t) => {
        t.integer('source_mapping_version_id').unsigned().nullable();
      });
    }
    if (!(await knex.schema.hasColumn('copo_mapping_versions', 'snapshot_meta'))) {
      await knex.schema.alterTable('copo_mapping_versions', (t) => {
        t.json('snapshot_meta').nullable();
      });
    }
  }
};

exports.down = async function down(knex) {
  if (await knex.schema.hasTable('copo_mapping_items')) {
    if (await knex.schema.hasColumn('copo_mapping_items', 'source_mapping_item_id')) {
      await knex.schema.alterTable('copo_mapping_items', (t) => {
        t.dropColumn('source_mapping_item_id');
      });
    }
    if (await knex.schema.hasColumn('copo_mapping_items', 'master_strength')) {
      await knex.schema.alterTable('copo_mapping_items', (t) => {
        t.dropColumn('master_strength');
      });
    }
  }
  if (await knex.schema.hasTable('copo_mapping_versions')) {
    if (await knex.schema.hasColumn('copo_mapping_versions', 'snapshot_meta')) {
      await knex.schema.alterTable('copo_mapping_versions', (t) => {
        t.dropColumn('snapshot_meta');
      });
    }
    if (await knex.schema.hasColumn('copo_mapping_versions', 'source_mapping_version_id')) {
      await knex.schema.alterTable('copo_mapping_versions', (t) => {
        t.dropColumn('source_mapping_version_id');
      });
    }
  }
};
