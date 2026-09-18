/**
 * Extract previous-year QPs into Excel master and import into the active college(s).
 */
import { applyPreviousYearImport } from '../modules/questionPapers/importService.js';
import { targetColleges } from '../modules/academicContent.js';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  const colleges = await targetColleges();
  if (!colleges.length) throw new Error('No college found');
  for (const college of colleges) {
    const faculty = await (await import('../db/index.js')).db('faculty_users').where({ college_id: college.id }).orderBy('id').first();
    console.log(`\n=== ${college.code} previous-year question papers ===`);
    const report = await applyPreviousYearImport({
      collegeId: Number(college.id),
      importedBy: faculty ? Number(faculty.id) : null,
      dryRun,
      writeWorkbook: true,
    });
    console.log(JSON.stringify(report, null, 2));
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
