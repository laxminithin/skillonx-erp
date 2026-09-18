/**
 * Offer versions share offer_number; uniqueness is per version.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('hr_recruitment_offers'))) return;
  try {
    await knex.schema.alterTable('hr_recruitment_offers', (t) => {
      t.dropUnique(['college_id', 'offer_number'], 'hro_college_number_uq');
    });
  } catch {
    /* index may already be dropped */
  }
  const has = await knex.raw(
    `SELECT COUNT(1) AS c FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'hr_recruitment_offers'
       AND index_name = 'hro_college_num_ver_uq'`,
  );
  const c = Number(has[0][0]?.c ?? has[0]?.c ?? 0);
  if (!c) {
    await knex.schema.alterTable('hr_recruitment_offers', (t) => {
      t.unique(['college_id', 'offer_number', 'version_no'], { indexName: 'hro_college_num_ver_uq' });
    });
  }
};

exports.down = async function down(knex) {
  if (!(await knex.schema.hasTable('hr_recruitment_offers'))) return;
  try {
    await knex.schema.alterTable('hr_recruitment_offers', (t) => {
      t.dropUnique(['college_id', 'offer_number', 'version_no'], 'hro_college_num_ver_uq');
    });
  } catch {
    /* ignore */
  }
  await knex.schema.alterTable('hr_recruitment_offers', (t) => {
    t.unique(['college_id', 'offer_number'], { indexName: 'hro_college_number_uq' });
  });
};
