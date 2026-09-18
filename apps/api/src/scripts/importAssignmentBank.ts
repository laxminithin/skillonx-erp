import { db } from '../db/index.js';
import { applyAssignmentBankImport } from '../modules/assignments/importApply.js';

const collegeCode = process.argv.find((a) => a.startsWith('--college-code='))?.split('=')[1];
const dryRun = process.argv.includes('--dry-run');
const createMissing = !process.argv.includes('--no-create-subjects');

async function main() {
  const colleges = collegeCode
    ? await db('colleges').where({ code: collegeCode })
    : await db('colleges').orderBy('id');
  if (!colleges.length) throw new Error('No college found');

  for (const college of colleges) {
    const faculty = await db('faculty_users').where({ college_id: college.id }).orderBy('id').first();
    if (!faculty) {
      console.warn(`Skipping ${college.code}: no faculty user`);
      continue;
    }
    console.log(`\n=== ${college.code} assignment bank ===`);
    const report = await applyAssignmentBankImport({
      collegeId: Number(college.id),
      createdBy: Number(faculty.id),
      createMissingSubjects: createMissing,
      dryRun,
    });
    console.log(`Files: ${report.filesDiscovered}`);
    console.log(`Subjects: ${report.subjectsFound}`);
    console.log(`Discovered: ${report.questionsDiscovered}`);
    console.log(`Imported: ${report.imported}`);
    console.log(`Duplicates: ${report.duplicates}`);
    console.log(`Needs review: ${report.needsReview}`);
    console.log(`CO mapped: ${report.coMapped}  needs review: ${report.coNeedsReview}  blocked: ${report.coBlocked}`);
    if (report.unmatchedSubjects.length) {
      console.log(`Unmatched: ${report.unmatchedSubjects.join(', ')}`);
    }
    if (report.createdSubjects.length) {
      console.log(`Created subjects: ${report.createdSubjects.join(', ')}`);
    }
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
