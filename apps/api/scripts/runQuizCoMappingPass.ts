/**
 * CLI: controlled Quiz CO mapping pass over the question bank.
 *
 * Usage:
 *   npx tsx scripts/runQuizCoMappingPass.ts [--collegeId=1] [--courseId=N] [--force] [--dry-run]
 */
import { db } from '../src/db/index.js';
import { runQuizCoMappingPass } from '../src/modules/questions/quizCoMappingPass.js';

function arg(name: string) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

async function main() {
  const collegeId = Number(arg('collegeId') || process.env.COLLEGE_ID || 1);
  const courseId = arg('courseId') ? Number(arg('courseId')) : undefined;
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');

  console.log('Quiz CO mapping pass', { collegeId, courseId, force, dryRun });
  const report = await runQuizCoMappingPass({ collegeId, courseId, force, dryRun });
  console.log(JSON.stringify(report, null, 2));
  await db.destroy();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await db.destroy();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
