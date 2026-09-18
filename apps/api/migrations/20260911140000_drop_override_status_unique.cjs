/**
 * Drop overly strict timetable override unique index — it blocked legal CANCELLED history rows.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (await knex.schema.hasTable('timetable_overrides')) {
    const hasIdx = await knex.raw(
      "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'timetable_overrides' AND index_name = 'tto_active_slot_date_kind_uidx' LIMIT 1",
    );
    if (hasIdx?.[0]?.length) {
      await knex.schema.alterTable('timetable_overrides', (t) => {
        t.dropUnique(
          ['college_id', 'timetable_slot_id', 'override_date', 'kind', 'status'],
          'tto_active_slot_date_kind_uidx',
        );
      });
    }
  }
};

exports.down = async function down(knex) {
  if (await knex.schema.hasTable('timetable_overrides')) {
    const hasIdx = await knex.raw(
      "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'timetable_overrides' AND index_name = 'tto_active_slot_date_kind_uidx' LIMIT 1",
    );
    if (!hasIdx?.[0]?.length) {
      await knex.schema.alterTable('timetable_overrides', (t) => {
        t.unique(
          ['college_id', 'timetable_slot_id', 'override_date', 'kind', 'status'],
          { indexName: 'tto_active_slot_date_kind_uidx' },
        );
      });
    }
  }
};
