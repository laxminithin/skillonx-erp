/**
 * Alumni Segmentation, Capability & Opportunity Intelligence (Phase C3).
 *
 * Explainable intelligence layer over C1 Alumni 360 + C2 CRM.
 * Does NOT duplicate career / placement / mentoring / Finance / CRM rows.
 * Does NOT store opaque scores, wealth indicators, or alumni membership lists.
 *
 * New storage is limited to:
 *   - saved segment RULE definitions (evaluated dynamically)
 *   - college-level intelligence thresholds (contact / reactivation windows)
 *
 * Derived evidence / willingness / readiness are computed at read time.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const fk = (col, table, onDelete, name) =>
    col.unsigned().references('id').inTable(table).onDelete(onDelete).withKeyName(name);

  if (!(await knex.schema.hasTable('alumni_intelligence_config'))) {
    await knex.schema.createTable('alumni_intelligence_config', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'ainc_college_fk');
      t.integer('recent_contact_days').notNullable().defaultTo(7);
      t.integer('reactivation_idle_days').notNullable().defaultTo(180);
      t.integer('heavy_engagement_active_opps').notNullable().defaultTo(2);
      t.integer('no_response_streak_warn').notNullable().defaultTo(3);
      t.timestamps(true, true);
      t.unique(['college_id'], { indexName: 'ainc_college_unique' });
    });
  }

  if (!(await knex.schema.hasTable('alumni_intelligence_segments'))) {
    await knex.schema.createTable('alumni_intelligence_segments', (t) => {
      t.increments('id').primary();
      fk(t.integer('college_id').notNullable(), 'colleges', 'CASCADE', 'aiseg_college_fk');
      t.string('name', 255).notNullable();
      t.text('description').nullable();
      /** JSON rule definition — never a copied alumni list. */
      t.text('rule_definition').notNullable();
      t.string('scope', 32).notNullable().defaultTo('INSTITUTION'); // INSTITUTION | DEPARTMENT | PERSONAL
      fk(t.integer('department_id').nullable(), 'departments', 'SET NULL', 'aiseg_dept_fk');
      fk(t.integer('owner_faculty_id').nullable(), 'faculty_users', 'SET NULL', 'aiseg_owner_fk');
      t.boolean('is_active').notNullable().defaultTo(true);
      t.boolean('is_institutional').notNullable().defaultTo(false);
      t.timestamps(true, true);
      t.index(['college_id', 'is_active'], 'aiseg_college_active_idx');
      t.index(['college_id', 'owner_faculty_id'], 'aiseg_owner_idx');
      t.index(['college_id', 'department_id'], 'aiseg_dept_idx');
    });
  }
};

exports.down = async function down(knex) {
  if (await knex.schema.hasTable('alumni_intelligence_segments')) {
    await knex.schema.dropTable('alumni_intelligence_segments');
  }
  if (await knex.schema.hasTable('alumni_intelligence_config')) {
    await knex.schema.dropTable('alumni_intelligence_config');
  }
};
