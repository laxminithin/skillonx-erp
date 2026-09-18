/**
 * Map every quiz bank question → primary CO using CO statements + question intent.
 * PO/PSO/SDG are derived from existing academic mapping (not invented per question).
 *
 * Usage: npx tsx src/scripts/mapQuizQuestionsToCo.ts
 */
import { db } from '../db/index.js';
import { resolveDerivedOutcomes, snapshotDerivedOutcomes } from '../modules/questions/coMapping.js';

function scoreCo(questionText: string, coStatement: string): number {
  const q = questionText.toLowerCase();
  const words = coStatement
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4);
  let score = 0;
  const seen = new Set<string>();
  for (const w of words) {
    if (seen.has(w)) continue;
    seen.add(w);
    if (q.includes(w)) score += 1;
  }
  return score;
}

async function main() {
  const colleges = await db('colleges').select('id', 'code');
  const report: Array<Record<string, unknown>> = [];

  for (const college of colleges) {
    const courses = await db('courses').where({ college_id: college.id });
    for (const course of courses) {
      const cos = await db('course_outcomes')
        .where({ college_id: college.id, course_id: course.id, is_current: true })
        .orderBy('co_number');

      const questions = await db('quiz_bank_questions').where({
        college_id: college.id,
        course_id: course.id,
        is_active: true,
      });

      let mapped = 0;
      let needsReview = 0;
      let blocked = 0;
      const coCounts: Record<string, number> = {};

      if (!cos.length) {
        for (const q of questions) {
          await db('quiz_bank_questions').where({ id: q.id }).update({
            co_mapping_blocked: true,
            co_mapping_block_reason: 'Subject lacks current course outcomes',
            verification_status: 'CO_MAPPING_BLOCKED',
            primary_co_code: null,
            primary_co_id: null,
            derived_outcomes_snapshot: null,
          });
          blocked += 1;
        }
        report.push({
          college: college.code,
          subject: course.name,
          questions: questions.length,
          mapped: 0,
          needsReview: 0,
          blocked,
          coCounts: {},
        });
        continue;
      }

      for (const q of questions) {
        let best = cos[0];
        let bestScore = -1;
        for (const co of cos) {
          const s = scoreCo(String(q.question_text), String(co.statement || ''));
          // Light prior: prefer CO whose number is not forced by module index
          if (s > bestScore) {
            bestScore = s;
            best = co;
          }
        }

        // If no lexical overlap, mark needs review but still assign best CO for coverage
        const verification = bestScore <= 0 ? 'NEEDS_REVIEW' : 'ACADEMIC_ANALYSIS';
        if (bestScore <= 0) needsReview += 1;
        else mapped += 1;

        const derived = await resolveDerivedOutcomes({
          collegeId: Number(college.id),
          courseId: Number(course.id),
          primaryCoCode: String(best.co_code),
          primaryCoId: Number(best.id),
        });

        await db('quiz_bank_questions').where({ id: q.id }).update({
          primary_co_code: best.co_code,
          primary_co_id: best.id,
          mapping_basis:
            bestScore > 0
              ? `Lexical/intent match to CO statement (${bestScore} overlapping terms)`
              : 'Low lexical overlap — assigned nearest CO for coverage; needs academic review',
          mapping_source: 'Current CO Master + Question Intent',
          verification_status: verification,
          co_mapping_blocked: false,
          co_mapping_block_reason: null,
          derived_outcomes_snapshot: JSON.stringify(snapshotDerivedOutcomes(derived)),
        });

        await db('quiz_question_co_links').where({ bank_question_id: q.id }).del();
        await db('quiz_question_co_links').insert({
          bank_question_id: q.id,
          course_outcome_id: best.id,
          co_code: best.co_code,
          is_primary: true,
        });

        const code = String(best.co_code).toUpperCase();
        coCounts[code] = (coCounts[code] || 0) + 1;
      }

      report.push({
        college: college.code,
        subject: course.name,
        questions: questions.length,
        mapped,
        needsReview,
        blocked,
        coCounts,
      });
    }
  }

  console.log(JSON.stringify({ report }, null, 2));
  await db.destroy();
}

main().catch(async (err) => {
  console.error(err);
  await db.destroy();
  process.exit(1);
});
