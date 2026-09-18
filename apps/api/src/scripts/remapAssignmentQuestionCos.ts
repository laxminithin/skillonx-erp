/**
 * Re-map Primary CO (+ derived outcomes) for every assignment_bank_questions row.
 * Does not change question text / marks / difficulty / module.
 */
import { db } from '../db/index.js';
import {
  inferPrimaryCoFromIntent,
  resolveDerivedOutcomes,
  snapshotDerivedOutcomes,
} from '../modules/questions/coMapping.js';

const collegeCode = process.argv.find((a) => a.startsWith('--college-code='))?.split('=')[1];
const dryRun = process.argv.includes('--dry-run');

async function main() {
  const colleges = collegeCode
    ? await db('colleges').where({ code: collegeCode })
    : await db('colleges').orderBy('id');

  for (const college of colleges) {
    console.log(`\n=== Remap assignment COs: ${college.code} ===`);
    const rows = await db('assignment_bank_questions as q')
      .leftJoin('subject_modules as m', 'm.id', 'q.module_id')
      .where({ 'q.college_id': college.id, 'q.is_active': true })
      .select(
        'q.id',
        'q.course_id',
        'q.question_text',
        'q.expected_answer_guidance',
        'm.name as module_name',
      );

    const cosCache = new Map<number, Array<{ id: number; coCode: string; statement: string }>>();
    let mapped = 0;
    let needsReview = 0;
    let blocked = 0;

    for (const row of rows) {
      const courseId = Number(row.course_id);
      let outcomes = cosCache.get(courseId);
      if (!outcomes) {
        const cos = await db('course_outcomes')
          .where({ college_id: college.id, course_id: courseId, is_current: true })
          .select('id', 'co_code', 'statement');
        outcomes = cos.map((c) => ({
          id: Number(c.id),
          coCode: String(c.co_code).toUpperCase(),
          statement: String(c.statement || ''),
        }));
        cosCache.set(courseId, outcomes);
      }

      const inference = inferPrimaryCoFromIntent({
        questionText: String(row.question_text || ''),
        modelAnswer: row.expected_answer_guidance != null ? String(row.expected_answer_guidance) : null,
        moduleHint: row.module_name != null ? String(row.module_name) : null,
        outcomes,
      });

      let derivedSnapshot = null;
      if (inference.primaryCoCode && !inference.coMappingBlocked) {
        const derived = await resolveDerivedOutcomes({
          collegeId: Number(college.id),
          courseId,
          primaryCoCode: inference.primaryCoCode,
          primaryCoId: inference.primaryCoId,
        });
        derivedSnapshot = snapshotDerivedOutcomes(derived);
      }

      if (inference.coMappingBlocked) blocked += 1;
      else if (inference.needsReview || !inference.primaryCoCode) needsReview += 1;
      else mapped += 1;

      if (dryRun) continue;

      await db('assignment_bank_questions')
        .where({ id: row.id })
        .update({
          primary_co_code: inference.primaryCoCode,
          primary_co_id: inference.primaryCoId,
          mapping_basis: inference.mappingBasis,
          mapping_source: 'Current CO Master + Question Intent',
          verification_status: inference.verificationStatus,
          co_mapping_blocked: inference.coMappingBlocked,
          co_mapping_block_reason: inference.coMappingBlockReason,
          derived_outcomes_snapshot: derivedSnapshot ? JSON.stringify(derivedSnapshot) : null,
          review_status: inference.needsReview ? 'NEEDS_REVIEW' : 'APPROVED',
        });

      await db('assignment_question_co_links').where({ bank_question_id: row.id }).del();
      if (inference.primaryCoId && inference.primaryCoCode) {
        await db('assignment_question_co_links').insert({
          bank_question_id: row.id,
          course_outcome_id: inference.primaryCoId,
          co_code: inference.primaryCoCode,
          is_primary: true,
        });
      }
    }

    console.log({ total: rows.length, mapped, needsReview, blocked, dryRun });
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
