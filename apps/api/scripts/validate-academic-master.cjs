/**
 * Validate academic-master JSON (and optionally the live database).
 *
 *   node scripts/validate-academic-master.cjs
 *   node scripts/validate-academic-master.cjs --db
 */
const fs = require('node:fs');
const path = require('node:path');

const DATA = path.resolve(__dirname, '../seeds/academic');
const checkDb = process.argv.includes('--db');

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8'));
}

function norm(code) {
  return String(code || '')
    .replace(/\s+/g, '')
    .toUpperCase();
}

function mainJson() {
  const manifest = readJson('manifest.json');
  const subjects = readJson('subjects.json');
  const modules = readJson('modules.json');
  const cos = readJson('cos.json');
  const copo = readJson('copo.json');
  const copso = readJson('copso.json');
  const cosdg = readJson('cosdg.json');
  const gaps = readJson('gap-analysis.json');
  const actions = readJson('recommended-actions.json');
  const cbs = readJson('beyond-syllabus.json');
  const schemes = readJson('schemes.json');
  const programs = readJson('programs.json');
  const pos = readJson('pos.json');
  const psos = readJson('psos.json');
  const sdgs = readJson('sdgs.json');

  const subjectCodes = subjects.map((s) => norm(s.subjectCode));
  const rows = [];
  const unsupported = [];

  for (const subject of subjects) {
    const code = norm(subject.subjectCode);
    const moduleCount = modules.filter((m) => norm(m.subjectCode) === code).length;
    const coCount = cos.filter((c) => norm(c.subjectCode) === code).length;
    const copoCount = copo.filter((m) => norm(m.subjectCode) === code).length;
    const copsoCount = copso.filter((m) => norm(m.subjectCode) === code).length;
    const cosdgCount = cosdg.filter((m) => norm(m.subjectCode) === code).length;
    const gapCount = gaps.filter((g) => norm(g.courseCode) === code).length;
    const cbsCount = cbs.filter((g) => norm(g.courseCode) === code).length;
    const programHasPsos = psos.some((p) => String(p.program || '') === String(subject.program || ''));
    const missing = [];
    if (moduleCount < 1) missing.push('Modules');
    if (coCount < 1) missing.push('COs');
    if (coCount >= 1 && copoCount < 1) missing.push('CO-PO');
    if (programHasPsos && copsoCount < 1) missing.push('CO-PSO');
    if (gapCount < 1) missing.push('Gap Analysis');
    if (cbsCount < 1) missing.push('Beyond Syllabus');
    const status = missing.length ? 'INCOMPLETE' : 'READY';
    if (status !== 'READY') unsupported.push({ code, name: subject.subjectName, missing });
    rows.push({
      code,
      name: subject.subjectName,
      scheme: subject.scheme,
      semester: subject.semesterNumber,
      modules: moduleCount,
      cos: coCount,
      copo: copoCount ? 'OK' : 'MISSING',
      copso: copsoCount ? 'OK' : 'MISSING',
      cosdg: cosdgCount ? 'OK' : 'MISSING',
      gaps: gapCount,
      beyondSyllabus: cbsCount,
      status,
      missing,
    });
  }

  const orphanGaps = gaps.filter((g) => !subjectCodes.includes(norm(g.courseCode)));
  const orphanCbs = cbs.filter((g) => !subjectCodes.includes(norm(g.courseCode)));

  console.log('=== Academic master validation (JSON) ===');
  console.log(`Schemes: ${schemes.length}`);
  console.log(`Programs: ${programs.length}`);
  console.log(`Subjects: ${subjects.length}`);
  console.log(`Modules: ${modules.length}`);
  console.log(`COs: ${cos.length}`);
  console.log(`POs: ${pos.length}`);
  console.log(`PSOs: ${psos.length}`);
  console.log(`SDGs: ${sdgs.length}`);
  console.log(`CO-PO mappings: ${copo.length}`);
  console.log(`CO-PSO mappings: ${copso.length}`);
  console.log(`CO-SDG mappings: ${cosdg.length}`);
  console.log(`Gap Analysis master: ${gaps.length}`);
  console.log(`Recommended actions: ${actions.length}`);
  console.log(`Beyond-Syllabus recommendations: ${cbs.length}`);
  console.log('');
  for (const row of rows) {
    console.log(
      `${row.code}\n  Modules: ${row.modules}  COs: ${row.cos}  CO-PO: ${row.copo}  CO-PSO: ${row.copso}  CO-SDG: ${row.cosdg}  Gap Analysis: ${row.gaps}  Beyond Syllabus: ${row.beyondSyllabus}\n  STATUS: ${row.status}${row.missing.length ? ` (${row.missing.join(', ')})` : ''}`,
    );
  }
  console.log(`\nREADY: ${rows.filter((r) => r.status === 'READY').length}/${rows.length}`);
  if (unsupported.length) {
    console.log('\nIncomplete / unsupported subjects:');
    for (const u of unsupported) console.log(`  ${u.code} ${u.name}: missing ${u.missing.join(', ')}`);
  }
  if (orphanGaps.length || orphanCbs.length) {
    console.log(`\nUnmapped gap rows: ${orphanGaps.length}  Unmapped CBS rows: ${orphanCbs.length}`);
  }

  const hardFail = rows.every((r) => r.status !== 'READY');
  return { rows, unsupported, hardFail, manifest };
}

async function mainDb() {
  const knex = require('knex')(require('../knexfile.cjs'));
  try {
    const globalGaps = await knex('gap_masters').whereNull('college_id').where({ is_active: true }).count({ c: '*' }).first();
    const globalCbs = await knex('cbs_masters').whereNull('college_id').where({ is_active: true }).count({ c: '*' }).first();
    const collegeGaps = await knex('gap_masters').whereNotNull('college_id').count({ c: '*' }).first();
    const collegeCbs = await knex('cbs_masters').whereNotNull('college_id').count({ c: '*' }).first();
    console.log('\n=== Database ===');
    console.log(`Global gap masters: ${Number(globalGaps?.c || 0)}`);
    console.log(`Global beyond-syllabus masters: ${Number(globalCbs?.c || 0)}`);
    console.log(`College-scoped gap overlays (kept): ${Number(collegeGaps?.c || 0)}`);
    console.log(`College-scoped CBS overlays (kept): ${Number(collegeCbs?.c || 0)}`);
    if (Number(globalGaps?.c || 0) < 1 || Number(globalCbs?.c || 0) < 1) {
      throw new Error('Global academic masters are missing. Run npm run seed:academic-master.');
    }
  } finally {
    await knex.destroy();
  }
}

async function main() {
  const result = mainJson();
  if (checkDb) await mainDb();
  if (result.hardFail) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
