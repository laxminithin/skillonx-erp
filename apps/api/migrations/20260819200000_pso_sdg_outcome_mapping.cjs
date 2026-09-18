/**
 * Additive PSO master, UN SDG master, and independent CO–PSO / CO–SDG mapping.
 *
 * Reuses course_outcomes, copo_mapping_versions, copo_mapping_items, audit, and
 * review comments. Does not duplicate COs or subjects. Existing CO–PO rows are
 * labelled mapping_kind = PO and remain independently versioned from PSO/SDG.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('program_specific_outcomes', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('scheme_id').unsigned().notNullable().references('id').inTable('academic_schemes').onDelete('CASCADE');
    t.integer('program_id').unsigned().notNullable().references('id').inTable('programs').onDelete('CASCADE');
    t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
    t.integer('pso_number').unsigned().notNullable();
    t.string('pso_code', 32).notNullable();
    t.string('short_title', 255).nullable();
    t.text('official_statement').nullable();
    t.string('effective_academic_year', 32).nullable();
    t.integer('version_number').unsigned().notNullable().defaultTo(1);
    t.boolean('is_current').notNullable().defaultTo(true);
    t.string('source', 255).nullable();
    t.string('approval_reference', 255).nullable();
    t.string('status', 32).notNullable().defaultTo('ACTIVE');
    t.boolean('official_text_pending').notNullable().defaultTo(true);
    t.integer('supersedes_id').unsigned().nullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.integer('updated_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
    t.timestamps(true, true);
    t.unique(['college_id', 'scheme_id', 'program_id', 'pso_code', 'version_number'], 'pso_code_version_unique');
    t.index(['college_id', 'scheme_id', 'program_id', 'is_current'], 'pso_current_idx');
    t.index(['college_id', 'status']);
  });

  await knex.schema.createTable('sustainable_development_goals', (t) => {
    t.increments('id').primary();
    t.integer('sdg_number').unsigned().notNullable().unique();
    t.string('sdg_code', 16).notNullable().unique();
    t.string('official_title', 255).notNullable();
    t.text('official_description').notNullable();
    t.string('icon_key', 64).nullable();
    t.string('color_hex', 16).nullable();
    t.string('source', 255).notNullable().defaultTo('United Nations Sustainable Development Goals');
    t.string('source_url', 512).nullable();
    t.boolean('active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

  const hasMappingKind = await knex.schema.hasColumn('copo_mapping_versions', 'mapping_kind');
  if (!hasMappingKind) {
    await knex.schema.alterTable('copo_mapping_versions', (t) => {
      t.string('mapping_kind', 16).notNullable().defaultTo('PO');
      t.boolean('show_all_sdgs').notNullable().defaultTo(false);
    });
    await knex.raw(
      'ALTER TABLE copo_mapping_versions ADD INDEX copo_versions_kind_current (college_id, course_id, mapping_kind, is_current)',
    );
  }

  await knex.raw('ALTER TABLE copo_mapping_items MODIFY program_outcome_id INT UNSIGNED NULL');

  const hasPsoItem = await knex.schema.hasColumn('copo_mapping_items', 'program_specific_outcome_id');
  if (!hasPsoItem) {
    await knex.schema.alterTable('copo_mapping_items', (t) => {
      t.integer('program_specific_outcome_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('program_specific_outcomes')
        .onDelete('RESTRICT');
      t.integer('sdg_id').unsigned().nullable().references('id').inTable('sustainable_development_goals').onDelete('RESTRICT');
    });
    await knex.raw(
      'ALTER TABLE copo_mapping_items ADD UNIQUE KEY copo_items_pso_unique (mapping_version_id, course_outcome_id, program_specific_outcome_id)',
    );
    await knex.raw(
      'ALTER TABLE copo_mapping_items ADD UNIQUE KEY copo_items_sdg_unique (mapping_version_id, course_outcome_id, sdg_id)',
    );
  }

  const checks = await knex.raw(
    `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'copo_mapping_items' AND CONSTRAINT_NAME = 'chk_copo_item_one_target'`,
  );
  if (!checks[0]?.length) {
    await knex.raw(`
      ALTER TABLE copo_mapping_items
      ADD CONSTRAINT chk_copo_item_one_target
      CHECK (
        (CASE WHEN program_outcome_id IS NOT NULL THEN 1 ELSE 0 END)
        + (CASE WHEN program_specific_outcome_id IS NOT NULL THEN 1 ELSE 0 END)
        + (CASE WHEN sdg_id IS NOT NULL THEN 1 ELSE 0 END) = 1
      )
    `);
  }

  await knex.schema.createTable('copo_mapping_relevant_sdgs', (t) => {
    t.increments('id').primary();
    t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
    t.integer('mapping_version_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('copo_mapping_versions')
      .onDelete('CASCADE');
    t.integer('sdg_id').unsigned().notNullable().references('id').inTable('sustainable_development_goals').onDelete('CASCADE');
    t.timestamps(true, true);
    t.unique(['mapping_version_id', 'sdg_id']);
  });

  const hasAuditKind = await knex.schema.hasColumn('copo_audit_log', 'mapping_kind');
  if (!hasAuditKind) {
    await knex.schema.alterTable('copo_audit_log', (t) => {
      t.string('mapping_kind', 16).nullable();
      t.integer('program_specific_outcome_id').unsigned().nullable();
      t.integer('sdg_id').unsigned().nullable();
    });
  }

  const hasCommentPso = await knex.schema.hasColumn('mapping_review_comments', 'program_specific_outcome_id');
  if (!hasCommentPso) {
    await knex.schema.alterTable('mapping_review_comments', (t) => {
      t.integer('program_specific_outcome_id').unsigned().nullable();
      t.integer('sdg_id').unsigned().nullable();
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  if (await knex.schema.hasColumn('mapping_review_comments', 'program_specific_outcome_id')) {
    await knex.schema.alterTable('mapping_review_comments', (t) => {
      t.dropColumn('program_specific_outcome_id');
      t.dropColumn('sdg_id');
    });
  }
  if (await knex.schema.hasColumn('copo_audit_log', 'mapping_kind')) {
    await knex.schema.alterTable('copo_audit_log', (t) => {
      t.dropColumn('mapping_kind');
      t.dropColumn('program_specific_outcome_id');
      t.dropColumn('sdg_id');
    });
  }
  await knex.raw('ALTER TABLE copo_mapping_items DROP CHECK chk_copo_item_one_target').catch(() => undefined);
  await knex.schema.dropTableIfExists('copo_mapping_relevant_sdgs');
  if (await knex.schema.hasColumn('copo_mapping_items', 'program_specific_outcome_id')) {
    await knex.raw('ALTER TABLE copo_mapping_items DROP INDEX copo_items_pso_unique');
    await knex.raw('ALTER TABLE copo_mapping_items DROP INDEX copo_items_sdg_unique');
    await knex.schema.alterTable('copo_mapping_items', (t) => {
      t.dropForeign(['program_specific_outcome_id']);
      t.dropForeign(['sdg_id']);
      t.dropColumn('program_specific_outcome_id');
      t.dropColumn('sdg_id');
    });
  }
  if (await knex.schema.hasColumn('copo_mapping_versions', 'mapping_kind')) {
    await knex.raw('ALTER TABLE copo_mapping_versions DROP INDEX copo_versions_kind_current');
    await knex.schema.alterTable('copo_mapping_versions', (t) => {
      t.dropColumn('mapping_kind');
      t.dropColumn('show_all_sdgs');
    });
  }
  await knex.schema.dropTableIfExists('program_specific_outcomes');
  await knex.schema.dropTableIfExists('sustainable_development_goals');
};
