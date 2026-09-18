/**
 * Unified Academic Mapping: one operational record may include PO / PSO / SDG domains.
 * Legacy single-kind operational rows are backfilled to CO_PO / CO_PSO / CO_SDG.
 * Master rows (source_mapping_version_id IS NULL) keep mapping_type NULL.
 */
exports.up = async function up(knex) {
  const hasType = await knex.schema.hasColumn('copo_mapping_versions', 'mapping_type');
  if (!hasType) {
    await knex.schema.alterTable('copo_mapping_versions', (t) => {
      t.string('mapping_type', 32).nullable().after('mapping_kind');
      t.boolean('include_po').notNullable().defaultTo(false).after('mapping_type');
      t.boolean('include_pso').notNullable().defaultTo(false).after('include_po');
      t.boolean('include_sdg').notNullable().defaultTo(false).after('include_pso');
    });
  }

  const hasOverride = await knex.schema.hasColumn('copo_mapping_items', 'override_justification');
  if (!hasOverride) {
    await knex.schema.alterTable('copo_mapping_items', (t) => {
      t.text('override_justification').nullable().after('justification');
    });
  }

  // Backfill operational single-kind rows into the six-type model.
  await knex('copo_mapping_versions')
    .whereNotNull('source_mapping_version_id')
    .whereNull('mapping_type')
    .andWhere({ mapping_kind: 'PO' })
    .update({ mapping_type: 'CO_PO', include_po: true, include_pso: false, include_sdg: false });

  await knex('copo_mapping_versions')
    .whereNotNull('source_mapping_version_id')
    .whereNull('mapping_type')
    .andWhere({ mapping_kind: 'PSO' })
    .update({ mapping_type: 'CO_PSO', include_po: false, include_pso: true, include_sdg: false });

  await knex('copo_mapping_versions')
    .whereNotNull('source_mapping_version_id')
    .whereNull('mapping_type')
    .andWhere({ mapping_kind: 'SDG' })
    .update({ mapping_type: 'CO_SDG', include_po: false, include_pso: false, include_sdg: true });

  // Masters: set include flags from kind for diagnostics only; mapping_type stays null.
  await knex('copo_mapping_versions')
    .whereNull('source_mapping_version_id')
    .andWhere({ mapping_kind: 'PO' })
    .update({ include_po: true, include_pso: false, include_sdg: false });
  await knex('copo_mapping_versions')
    .whereNull('source_mapping_version_id')
    .andWhere({ mapping_kind: 'PSO' })
    .update({ include_po: false, include_pso: true, include_sdg: false });
  await knex('copo_mapping_versions')
    .whereNull('source_mapping_version_id')
    .andWhere({ mapping_kind: 'SDG' })
    .update({ include_po: false, include_pso: false, include_sdg: true });
};

exports.down = async function down(knex) {
  const hasOverride = await knex.schema.hasColumn('copo_mapping_items', 'override_justification');
  if (hasOverride) {
    await knex.schema.alterTable('copo_mapping_items', (t) => {
      t.dropColumn('override_justification');
    });
  }
  const hasType = await knex.schema.hasColumn('copo_mapping_versions', 'mapping_type');
  if (hasType) {
    await knex.schema.alterTable('copo_mapping_versions', (t) => {
      t.dropColumn('include_sdg');
      t.dropColumn('include_pso');
      t.dropColumn('include_po');
      t.dropColumn('mapping_type');
    });
  }
};
