/**
 * Hostel allocation hardening.
 *
 * MySQL does not support partial unique indexes directly, so active-only
 * generated columns enforce uniqueness while allowing unlimited historical
 * TRANSFERRED/VACATED/CANCELLED allocation rows.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const hasTable = await knex.schema.hasTable('hostel_bed_allocations');
  if (!hasTable) return;

  const dupBeds = await knex('hostel_bed_allocations')
    .select('college_id', 'bed_id')
    .where({ status: 'ACTIVE' })
    .groupBy('college_id', 'bed_id')
    .havingRaw('COUNT(*) > 1')
    .limit(1);
  if (dupBeds.length) {
    throw new Error('Cannot add hostel active-bed uniqueness: duplicate ACTIVE bed allocations exist.');
  }

  const dupStudents = await knex('hostel_bed_allocations')
    .select('college_id', 'student_id')
    .where({ status: 'ACTIVE' })
    .groupBy('college_id', 'student_id')
    .havingRaw('COUNT(*) > 1')
    .limit(1);
  if (dupStudents.length) {
    throw new Error('Cannot add hostel active-student uniqueness: duplicate ACTIVE student allocations exist.');
  }

  if (!(await knex.schema.hasColumn('hostel_bed_allocations', 'active_bed_key'))) {
    await knex.raw(
      "ALTER TABLE hostel_bed_allocations ADD COLUMN active_bed_key INT GENERATED ALWAYS AS (CASE WHEN status = 'ACTIVE' THEN bed_id ELSE NULL END) VIRTUAL",
    );
  }
  if (!(await knex.schema.hasColumn('hostel_bed_allocations', 'active_student_key'))) {
    await knex.raw(
      "ALTER TABLE hostel_bed_allocations ADD COLUMN active_student_key INT GENERATED ALWAYS AS (CASE WHEN status = 'ACTIVE' THEN student_id ELSE NULL END) VIRTUAL",
    );
  }

  const indexes = await knex.raw("SHOW INDEX FROM hostel_bed_allocations WHERE Key_name IN ('hba_active_bed_unique', 'hba_active_student_unique')");
  const rows = Array.isArray(indexes) ? indexes[0] : [];
  const names = new Set(rows.map((r) => r.Key_name));
  if (!names.has('hba_active_bed_unique')) {
    await knex.raw('CREATE UNIQUE INDEX hba_active_bed_unique ON hostel_bed_allocations (college_id, active_bed_key)');
  }
  if (!names.has('hba_active_student_unique')) {
    await knex.raw('CREATE UNIQUE INDEX hba_active_student_unique ON hostel_bed_allocations (college_id, active_student_key)');
  }
};

exports.down = async function down(knex) {
  const hasTable = await knex.schema.hasTable('hostel_bed_allocations');
  if (!hasTable) return;

  const indexes = await knex.raw("SHOW INDEX FROM hostel_bed_allocations WHERE Key_name IN ('hba_active_bed_unique', 'hba_active_student_unique')");
  const rows = Array.isArray(indexes) ? indexes[0] : [];
  const names = new Set(rows.map((r) => r.Key_name));
  if (names.has('hba_active_student_unique')) {
    await knex.raw('DROP INDEX hba_active_student_unique ON hostel_bed_allocations');
  }
  if (names.has('hba_active_bed_unique')) {
    await knex.raw('DROP INDEX hba_active_bed_unique ON hostel_bed_allocations');
  }

  if (await knex.schema.hasColumn('hostel_bed_allocations', 'active_student_key')) {
    await knex.raw('ALTER TABLE hostel_bed_allocations DROP COLUMN active_student_key');
  }
  if (await knex.schema.hasColumn('hostel_bed_allocations', 'active_bed_key')) {
    await knex.raw('ALTER TABLE hostel_bed_allocations DROP COLUMN active_bed_key');
  }
};
