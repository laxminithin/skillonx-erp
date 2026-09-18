import { readFile } from 'node:fs/promises';
import { db } from '../db/index.js';
import { discoverGapMasterFiles } from '../modules/gapAnalysis/workbookParser.js';
import { importGapMaster } from '../modules/gapAnalysis/importService.js';
import { targetColleges } from '../modules/academicContent.js';

const collegeCode = process.argv.find((a) => a.startsWith('--college-code='))?.split('=')[1];
const dryRun = process.argv.includes('--dry-run');

async function main() {
  const masters = await discoverGapMasterFiles();
  if (!masters.length) {
    throw new Error('No Gap Analysis master workbook found (needs GAP_MASTER sheet) under apps/web/public.');
  }
  const master = masters[0];
  console.log(`Gap master: ${master.filePath}`);
  console.log(`Sheets: ${master.sheets.filter((s) => s.startsWith('GAP_')).join(', ')}`);

  const colleges = await targetColleges(collegeCode);
  if (!colleges.length) throw new Error('No college found.');
  const buffer = await readFile(master.filePath);

  for (const college of colleges) {
    const faculty = await db('faculty_users').where({ college_id: college.id }).orderBy('id').first();
    if (!faculty) {
      console.warn(`Skipping ${college.code}: no faculty user.`);
      continue;
    }

    const summary = await importGapMaster(
      Number(college.id),
      { facultyUserId: Number(faculty.id) },
      buffer,
      master.fileName,
      { dryRun },
    );

    console.log(`\n=== ${college.code} ===`);
    console.log(`Discovered subjects: ${summary.discovered.subjects}`);
    console.log(`Gaps: ${summary.discovered.gaps}`);
    console.log(`CO links: ${summary.discovered.coLinks}`);
    console.log(`Outcome links: ${summary.discovered.outcomeLinks}`);
    console.log(`Actions: ${summary.discovered.actions}`);
    console.log(`Sources: ${summary.discovered.sources}`);
    console.log(`Review queue: ${summary.discovered.reviewQueue}`);
    console.log(
      `Inserted: ${summary.inserted}  Updated: ${summary.updated}  Unchanged: ${summary.unchanged}  Skipped: ${summary.skipped}`,
    );
    console.log(`Needs review: ${summary.needsReview}`);
    if (summary.warnings.length) console.log(`Warnings: ${summary.warnings.length}`);
    if (summary.errors.length) console.log(`Errors:\n${summary.errors.join('\n')}`);
    console.log(`Batch: ${summary.batchId}${dryRun ? ' (dry-run)' : ''}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
