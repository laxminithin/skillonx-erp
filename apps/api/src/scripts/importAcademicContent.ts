import { db } from '../db/index.js';
import { importAcademicContent, type AcademicImportKind } from '../modules/academicContent.js';

const collegeCode = process.argv.find((a) => a.startsWith('--college-code='))?.split('=')[1];
const dryRun = process.argv.includes('--dry-run');
const quizOnly = process.argv.includes('--quiz-only');
const lessonOnly = process.argv.includes('--lesson-only');
const assignmentOnly = process.argv.includes('--assignment-only');

async function main() {
  const kinds: AcademicImportKind[] = quizOnly
    ? ['quiz']
    : lessonOnly
      ? ['lesson']
      : assignmentOnly
        ? ['assignment']
        : ['quiz', 'lesson', 'assignment'];
  await importAcademicContent({
    collegeCode,
    dryRun,
    createMissingSubjects: true,
    kinds,
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
