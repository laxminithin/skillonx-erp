/**
 * Allow academic master rows to be global (college_id NULL).
 * Institution-specific Excel imports remain as overlays keyed by the same natural IDs.
 *
 * @param {import('knex').Knex} knex
 */
async function dropForeignKeysOnCollegeId(knex, table) {
  const [rows] = await knex.raw(
    `SELECT CONSTRAINT_NAME AS name
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = 'college_id'
       AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [table],
  );
  for (const row of rows) {
    await knex.raw('ALTER TABLE ?? DROP FOREIGN KEY ??', [table, row.name]);
  }
}

async function uniqueIndexesOnCollegeId(knex, table) {
  const [rows] = await knex.raw('SHOW INDEX FROM ??', [table]);
  const grouped = new Map();
  for (const row of rows) {
    if (row.Non_unique !== 0) continue;
    const name = String(row.Key_name);
    if (name === 'PRIMARY') continue;
    if (!grouped.has(name)) grouped.set(name, []);
    grouped.get(name).push({ column: row.Column_name, seq: row.Seq_in_index });
  }
  return [...grouped.entries()]
    .map(([name, cols]) => ({
      name,
      columns: cols.sort((a, b) => a.seq - b.seq).map((c) => c.column),
    }))
    .filter((idx) => idx.columns.includes('college_id'));
}

async function makeMasterGlobal(knex, table) {
  if (!(await knex.schema.hasTable(table))) return;
  if (!(await knex.schema.hasColumn(table, 'college_id'))) return;

  await dropForeignKeysOnCollegeId(knex, table);

  if (!(await knex.schema.hasColumn(table, 'scope_college_id'))) {
    await knex.raw(
      'ALTER TABLE ?? ADD COLUMN scope_college_id INT UNSIGNED GENERATED ALWAYS AS (IFNULL(college_id, 0)) STORED',
      [table],
    );
  }

  const uniques = await uniqueIndexesOnCollegeId(knex, table);
  for (const idx of uniques) {
    await knex.raw('ALTER TABLE ?? DROP INDEX ??', [table, idx.name]);
  }

  await knex.raw('ALTER TABLE ?? MODIFY college_id INT UNSIGNED NULL', [table]);

  for (const idx of uniques) {
    const cols = idx.columns.map((c) => (c === 'college_id' ? 'scope_college_id' : c));
    const newName = `${idx.name}_scope`.slice(0, 64);
    const [existing] = await knex.raw('SHOW INDEX FROM ??', [table]);
    const names = new Set(existing.map((row) => String(row.Key_name)));
    if (names.has(newName)) continue;
    await knex.raw(`ALTER TABLE ?? ADD UNIQUE KEY ?? (${cols.map(() => '??').join(', ')})`, [
      table,
      newName,
      ...cols,
    ]);
  }

  // InnoDB rejects a foreign key on college_id when a stored generated column
  // (scope_college_id) references that same column. Application code always
  // writes a real college id or NULL; overlay rows stay college-scoped.
}

const MASTER_TABLES = [
  'gap_masters',
  'gap_master_co_links',
  'gap_master_outcome_links',
  'gap_master_actions',
  'gap_master_sources',
  'gap_master_review_queue',
  'cbs_masters',
  'cbs_master_co_links',
  'cbs_master_actions',
  'cbs_master_sources',
  'cbs_master_review_queue',
  'assessment_component_masters',
  'course_assessment_structures',
  'course_assessment_components',
  'co_evaluation_subject_masters',
  'co_evaluation_co_masters',
  'co_evaluation_component_masters',
  'co_evaluation_justification_masters',
  'co_evaluation_sources',
  'co_evaluation_review_queue',
];

exports.up = async function up(knex) {
  for (const table of MASTER_TABLES) {
    await makeMasterGlobal(knex, table);
  }
};

exports.down = async function down() {
  // Global master rows (college_id NULL) are additive and safe to keep.
};
