/**
 * Upgrade path for databases that already ran the initial schema.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const hasStructureLocked = await knex.schema.hasColumn('surveys', 'structure_locked');
  if (!hasStructureLocked) {
    await knex.schema.alterTable('surveys', (t) => {
      t.boolean('structure_locked').notNullable().defaultTo(false);
      t.integer('structure_version').unsigned().notNullable().defaultTo(1);
      t.json('published_snapshot').nullable();
    });
  }

  const hasAllowComment = await knex.schema.hasColumn('questions', 'allow_comment');
  if (!hasAllowComment) {
    await knex.schema.alterTable('questions', (t) => {
      t.boolean('allow_comment').notNullable().defaultTo(false);
      t.integer('structure_version').unsigned().notNullable().defaultTo(1);
    });
  }

  const hasComment = await knex.schema.hasColumn('survey_answers', 'comment');
  if (!hasComment) {
    await knex.schema.alterTable('survey_answers', (t) => {
      t.text('comment').nullable();
      t.integer('question_structure_version').unsigned().notNullable().defaultTo(1);
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  if (await knex.schema.hasColumn('survey_answers', 'comment')) {
    await knex.schema.alterTable('survey_answers', (t) => {
      t.dropColumn('comment');
      t.dropColumn('question_structure_version');
    });
  }
  if (await knex.schema.hasColumn('questions', 'allow_comment')) {
    await knex.schema.alterTable('questions', (t) => {
      t.dropColumn('allow_comment');
      t.dropColumn('structure_version');
    });
  }
  if (await knex.schema.hasColumn('surveys', 'structure_locked')) {
    await knex.schema.alterTable('surveys', (t) => {
      t.dropColumn('structure_locked');
      t.dropColumn('structure_version');
      t.dropColumn('published_snapshot');
    });
  }
};
