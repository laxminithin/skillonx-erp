/**
 * Backfill assignment_bank_questions.evaluation_rubric where null/invalid.
 * Run: node --import tsx src/scripts/backfillAssignmentSchemes.ts
 */
import { db } from '../db/index.js';
import type { AssignmentQuestionType } from '../types/assignment.js';
import { buildDefaultScheme, parseEvaluationScheme, schemeTotalMarks } from '../modules/assignments/scheme.js';

async function main() {
  const rows = await db('assignment_bank_questions').select(
    'id',
    'question_type',
    'marks',
    'evaluation_rubric',
  );
  let fixed = 0;
  let ok = 0;
  for (const row of rows) {
    const marks = Number(row.marks);
    const parsed = parseEvaluationScheme(row.evaluation_rubric);
    const valid =
      parsed && Math.abs(schemeTotalMarks(parsed) - marks) <= 0.05;
    if (valid) {
      ok += 1;
      continue;
    }
    const scheme = buildDefaultScheme(
      (row.question_type as AssignmentQuestionType) || 'DESCRIPTIVE',
      marks,
    );
    await db('assignment_bank_questions')
      .where({ id: row.id })
      .update({ evaluation_rubric: JSON.stringify(scheme) });
    fixed += 1;
  }
  console.log(JSON.stringify({ total: rows.length, ok, fixed }));
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
