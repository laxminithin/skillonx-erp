/**
 * HRMS — deterministic substitute consent policy per college.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (await knex.schema.hasTable('college_hrms_policies')) {
    if (!(await knex.schema.hasColumn('college_hrms_policies', 'substitute_consent_required'))) {
      await knex.schema.alterTable('college_hrms_policies', (t) => {
        t.boolean('substitute_consent_required').notNullable().defaultTo(true);
      });
    }
  }

  if (await knex.schema.hasTable('timetable_overrides')) {
    const hasIdx = await knex.raw(
      "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'timetable_overrides' AND index_name = 'tto_active_slot_date_kind_uidx' LIMIT 1",
    );
    const rows = hasIdx?.[0];
    if (!rows?.length) {
      await knex.schema.alterTable('timetable_overrides', (t) => {
        t.index(
          ['college_id', 'timetable_slot_id', 'override_date', 'kind', 'status'],
          'tto_slot_date_kind_status_idx',
        );
      });
    }
  }

  if (await knex.schema.hasTable('employee_notifications')) {
    const hasDedupeIdx = await knex.raw(
      "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'employee_notifications' AND index_name = 'en_employee_dedupe_uidx' LIMIT 1",
    );
    const rows = hasDedupeIdx?.[0];
    if (!rows?.length && (await knex.schema.hasColumn('employee_notifications', 'dedupe_key'))) {
      await knex.schema.alterTable('employee_notifications', (t) => {
        t.unique(['employee_id', 'dedupe_key'], { indexName: 'en_employee_dedupe_uidx' });
      });
    }
  }
};

exports.down = async function down(knex) {
  if (await knex.schema.hasTable('employee_notifications')) {
    const hasDedupeIdx = await knex.raw(
      "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'employee_notifications' AND index_name = 'en_employee_dedupe_uidx' LIMIT 1",
    );
    if (hasDedupeIdx?.[0]?.length) {
      await knex.schema.alterTable('employee_notifications', (t) => {
        t.dropUnique(['employee_id', 'dedupe_key'], 'en_employee_dedupe_uidx');
      });
    }
  }

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
    const hasNonUnique = await knex.raw(
      "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'timetable_overrides' AND index_name = 'tto_slot_date_kind_status_idx' LIMIT 1",
    );
    if (hasNonUnique?.[0]?.length) {
      await knex.schema.alterTable('timetable_overrides', (t) => {
        t.dropIndex(['college_id', 'timetable_slot_id', 'override_date', 'kind', 'status'], 'tto_slot_date_kind_status_idx');
      });
    }
  }

  if (await knex.schema.hasTable('college_hrms_policies')) {
    if (await knex.schema.hasColumn('college_hrms_policies', 'substitute_consent_required')) {
      await knex.schema.alterTable('college_hrms_policies', (t) => {
        t.dropColumn('substitute_consent_required');
      });
    }
  }
};
