import { db } from '../db/index.js';
import { importAcademicContent } from '../modules/academicContent.js';

const collegeCode = process.argv.find((a) => a.startsWith('--college-code='))?.split('=')[1];
const dryRun = process.argv.includes('--dry-run');
const createMissing = !process.argv.includes('--no-create-subjects');

async function main() {
  await importAcademicContent({
    collegeCode,
    dryRun,
    createMissingSubjects: createMissing,
    kinds: ['lesson'],
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
