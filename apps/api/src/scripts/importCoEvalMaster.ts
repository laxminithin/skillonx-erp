import { readFile } from 'node:fs/promises';
import { db } from '../db/index.js';
import { discoverCoEvalMasterFiles } from '../modules/coEvaluation/workbookParser.js';
import { importCoEvalMaster } from '../modules/coEvaluation/importService.js';
import { targetColleges } from '../modules/academicContent.js';

const collegeCode = process.argv.find((a) => a.startsWith('--college-code='))?.split('=')[1];
const dryRun = process.argv.includes('--dry-run');

async function main() {
  const masters = await discoverCoEvalMasterFiles();
  if (!masters.length) {
    throw new Error(
      'No CO Evaluation master workbook found (needs CO_EVALUATION_MASTER sheet) under apps/web/public.',
    );
  }
  const master = masters[0];
  console.log(`CO Evaluation master: ${master.filePath}`);
  console.log(
    `Sheets: ${master.sheets
      .filter(
        (s) =>
          s.startsWith('CO_EVALUATION_') ||
          s.startsWith('COURSE_ASSESSMENT_') ||
          s === 'ASSESSMENT_COMPONENT_MASTER',
      )
      .join(', ')}`,
  );

  const colleges = await targetColleges(collegeCode);
  if (!colleges.length) throw new Error('No college found.');
  const buffer = await readFile(master.filePath);

  for (const college of colleges) {
    const faculty = await db('faculty_users').where({ college_id: college.id }).orderBy('id').first();
    if (!faculty) {
      console.warn(`Skipping ${college.code}: no faculty user.`);
      continue;
    }

    const summary = await importCoEvalMaster(
      Number(college.id),
      { facultyUserId: Number(faculty.id) },
      buffer,
      master.fileName,
      { dryRun },
    );

    console.log(`\n=== ${college.code} ===`);
    console.log(`Subjects: ${summary.discovered.subjects}`);
    console.log(`Evaluable: ${summary.discovered.evaluableSubjects}`);
    console.log(`Blocked: ${summary.discovered.blockedSubjects}`);
    console.log(`Assessment components: ${summary.discovered.assessmentComponents}`);
    console.log(`Structures: ${summary.discovered.structures}`);
    console.log(`Course components: ${summary.discovered.courseComponents}`);
    console.log(`CO rows: ${summary.discovered.coRows}`);
    console.log(`Component mappings: ${summary.discovered.componentMappings}`);
    console.log(`Justifications: ${summary.discovered.justifications}`);
    console.log(`Sources: ${summary.discovered.sources}`);
    console.log(`Review queue: ${summary.discovered.reviewQueue}`);
    console.log(
      `Inserted: ${summary.inserted}  Updated: ${summary.updated}  Unchanged: ${summary.unchanged}`,
    );
    console.log(`Needs review: ${summary.needsReview}`);
    if (summary.blockedSubjects.length) {
      for (const b of summary.blockedSubjects) {
        console.log(`  BLOCKED ${b.courseCode} ${b.subjectName}: ${b.reason}`);
      }
    }
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
