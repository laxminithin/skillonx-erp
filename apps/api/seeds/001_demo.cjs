const fs = require('node:fs');
const path = require('node:path');

function prepareRow(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (value != null && typeof value === 'object') {
      out[key] = JSON.stringify(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Restore the captured database snapshot (surveys, quiz bank, lesson plans).
 *
 * Refuses to run in production so a deployment pipeline can safely call
 * `db:migrate` without wiping real data via `db:seed`.
 *
 * Snapshot files live in ./data and are generated with:
 *   npm run export:seed-snapshot -w @skillonx/survey-api
 *
 * @param {import('knex').Knex} knex
 */
exports.seed = async function seed(knex) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== '1') {
    throw new Error(
      'Refusing to run the development seed with NODE_ENV=production (it wipes existing rows).\n' +
        'Load quiz bank and lesson plans without wiping surveys:\n' +
        '  npm run import:academic-content\n' +
        'To restore the full snapshot anyway, set ALLOW_PRODUCTION_SEED=1.',
    );
  }

  const dataDir = path.join(__dirname, 'data');
  const manifestPath = path.join(dataDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Seed snapshot missing at ${manifestPath}. Run export:seed-snapshot first.`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const tables = manifest.tables;
  if (!Array.isArray(tables) || tables.length === 0) {
    throw new Error('Seed snapshot manifest has no tables.');
  }

  await knex.raw('SET FOREIGN_KEY_CHECKS = 0');
  try {
    for (const table of [...tables].reverse()) {
      if (await knex.schema.hasTable(table)) {
        await knex(table).del();
      }
    }

    for (const table of tables) {
      if (!(await knex.schema.hasTable(table))) continue;
      const file = path.join(dataDir, `${table}.json`);
      if (!fs.existsSync(file)) continue;
      const rows = JSON.parse(fs.readFileSync(file, 'utf8')).map(prepareRow);
      if (!Array.isArray(rows) || rows.length === 0) continue;

      const chunkSize = 200;
      for (let i = 0; i < rows.length; i += chunkSize) {
        await knex(table).insert(rows.slice(i, i + chunkSize));
      }

      if (rows.some((row) => row && row.id != null)) {
        const maxId = rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0);
        await knex.raw('ALTER TABLE ?? AUTO_INCREMENT = ?', [table, maxId + 1]);
      }
    }
  } finally {
    await knex.raw('SET FOREIGN_KEY_CHECKS = 1');
  }
};
