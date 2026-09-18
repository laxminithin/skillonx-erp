/**
 * Dump live application tables into apps/api/seeds/data/*.json
 * so `npm run seed` can restore the current database.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../db/index.js';

const SKIP = new Set(['knex_migrations', 'knex_migrations_lock']);
const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../seeds/data');

function dateFormat(mysqlType: string) {
  const t = mysqlType.toLowerCase();
  if (t === 'date') return '%Y-%m-%d';
  if (t.includes('time') || t.includes('date')) return '%Y-%m-%d %H:%i:%s';
  return null;
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const [tableRows] = await db.raw('SHOW TABLES');
  const tables = tableRows
    .map((row: Record<string, string>) => Object.values(row)[0])
    .filter((name: string) => !SKIP.has(name))
    .sort();

  const manifest: { tables: string[]; exportedAt: string; counts: Record<string, number> } = {
    tables,
    exportedAt: new Date().toISOString(),
    counts: {},
  };

  for (const table of tables) {
    const [cols] = await db.raw('SHOW COLUMNS FROM ??', [table]);
    const select = cols.map((col: { Field: string; Type: string }) => {
      const fmt = dateFormat(col.Type);
      if (!fmt) return db.raw('??', [col.Field]);
      return db.raw('DATE_FORMAT(??, ?) as ??', [col.Field, fmt, col.Field]);
    });
    const rows = await db(table).select(select);
    const serialized = rows.map((row: Record<string, unknown>) => {
      const out: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        if (Buffer.isBuffer(value)) out[key] = value.toString('utf8');
        else out[key] = value;
      }
      return out;
    });
    await fs.writeFile(path.join(outDir, `${table}.json`), `${JSON.stringify(serialized)}\n`);
    manifest.counts[table] = serialized.length;
    console.log(`${table}: ${serialized.length}`);
  }

  await fs.writeFile(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nWrote ${tables.length} tables to ${outDir}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
