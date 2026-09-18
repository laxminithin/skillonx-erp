/**
 * Map Primary CO (+ derived PO/PSO/SDG) for every quiz_bank_questions and quiz_questions row.
 * Does not change question text/options/answers/difficulty/module unless data error paths require notes.
 *
 * Usage:
 *   npx tsx src/scripts/mapQuizQuestionCos.ts [--college-code=CODE] [--dry-run]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../db/index.js';
import {
  inferPrimaryCoFromIntent,
  resolveDerivedOutcomes,
  snapshotDerivedOutcomes,
} from '../modules/questions/coMapping.js';

const collegeCode = process.argv.find((a) => a.startsWith('--college-code='))?.split('=')[1];
const dryRun = process.argv.includes('--dry-run');

type RowStats = {
  total: number;
  mapped: number;
  needsReview: number;
  blocked: number;
  unchanged: number;
};

async function mapTable(
  table: 'quiz_bank_questions' | 'quiz_questions',
  collegeId: number,
): Promise<{ stats: RowStats; perSubject: Record<string, Record<string, number>> }> {
  const stats: RowStats = { total: 0, mapped: 0, needsReview: 0, blocked: 0, unchanged: 0 };
  const perSubject: Record<string, Record<string, number>> = {};

  const hasTable = await db.schema.hasTable(table);
  if (!hasTable) return { stats, perSubject };

  let query = db(`${table} as q`);
  if (table === 'quiz_bank_questions') {
    query = query.where({ 'q.college_id': collegeId, 'q.is_active': true });
  } else {
    query = query
      .join('quizzes as z', 'z.id', 'q.quiz_id')
      .where({ 'z.college_id': collegeId });
  }

  const rows = await query.select(
    'q.id',
    table === 'quiz_bank_questions' ? 'q.course_id' : 'z.course_id as course_id',
    'q.question_text',
    'q.explanation',
    'q.primary_co_code',
    'q.module_id',
  );

  const cosCache = new Map<number, Array<{ id: number; coCode: string; statement: string }>>();
  async function cosFor(courseId: number) {
    let list = cosCache.get(courseId);
    if (!list) {
      const cos = await db('course_outcomes')
        .where({ college_id: collegeId, course_id: courseId, is_current: true })
        .select('id', 'co_code', 'statement');
      list = cos.map((c) => ({
        id: Number(c.id),
        coCode: String(c.co_code).toUpperCase(),
        statement: String(c.statement || ''),
      }));
      cosCache.set(courseId, list);
    }
    return list;
  }

  const courseNameCache = new Map<number, string>();
  async function courseName(courseId: number) {
    if (courseNameCache.has(courseId)) return courseNameCache.get(courseId)!;
    const row = await db('courses').where({ id: courseId }).first();
    const name = row ? String(row.name) : `course:${courseId}`;
    courseNameCache.set(courseId, name);
    return name;
  }

  const moduleNameCache = new Map<number, string>();
  async function moduleName(moduleId: number | null) {
    if (!moduleId) return null;
    if (moduleNameCache.has(moduleId)) return moduleNameCache.get(moduleId)!;
    const row = await db('subject_modules').where({ id: moduleId }).first();
    const name = row ? String(row.name) : null;
    if (name) moduleNameCache.set(moduleId, name);
    return name;
  }

  for (const row of rows) {
    stats.total += 1;
    const courseId = Number(row.course_id);
    if (!courseId) {
      stats.needsReview += 1;
      continue;
    }
    const subject = await courseName(courseId);
    perSubject[subject] = perSubject[subject] || {};

    const outcomes = await cosFor(courseId);
    const inference = inferPrimaryCoFromIntent({
      questionText: String(row.question_text || ''),
      modelAnswer: row.explanation != null ? String(row.explanation) : null,
      moduleHint: await moduleName(row.module_id != null ? Number(row.module_id) : null),
      outcomes,
    });

    let derivedSnapshot = null;
    if (inference.primaryCoCode && !inference.coMappingBlocked) {
      const derived = await resolveDerivedOutcomes({
        collegeId,
        courseId,
        primaryCoCode: inference.primaryCoCode,
        primaryCoId: inference.primaryCoId,
      });
      derivedSnapshot = snapshotDerivedOutcomes(derived);
    }

    if (inference.coMappingBlocked) {
      stats.blocked += 1;
    } else if (inference.needsReview || !inference.primaryCoCode) {
      stats.needsReview += 1;
    } else {
      stats.mapped += 1;
      const code = inference.primaryCoCode!;
      perSubject[subject][code] = (perSubject[subject][code] || 0) + 1;
    }

    const same =
      (row.primary_co_code || null) === inference.primaryCoCode &&
      !inference.coMappingBlocked;
    if (same && inference.primaryCoCode) stats.unchanged += 1;

    if (dryRun) continue;

    await db(table)
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
      });

    if (table === 'quiz_bank_questions' && inference.primaryCoId && inference.primaryCoCode) {
      const existing = await db('quiz_question_co_links')
        .where({ bank_question_id: row.id, is_primary: true })
        .first();
      if (existing) {
        await db('quiz_question_co_links')
          .where({ id: existing.id })
          .update({
            course_outcome_id: inference.primaryCoId,
            co_code: inference.primaryCoCode,
          });
      } else {
        await db('quiz_question_co_links').insert({
          bank_question_id: row.id,
          course_outcome_id: inference.primaryCoId,
          co_code: inference.primaryCoCode,
          is_primary: true,
        });
      }
    }
  }

  return { stats, perSubject };
}

async function main() {
  const colleges = collegeCode
    ? await db('colleges').where({ code: collegeCode })
    : await db('colleges').orderBy('id');
  if (!colleges.length) throw new Error('No college found');

  const report: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    dryRun,
    colleges: [] as unknown[],
  };

  for (const college of colleges) {
    console.log(`\n=== CO map quiz questions: ${college.code} ===`);
    const bank = await mapTable('quiz_bank_questions', Number(college.id));
    const instance = await mapTable('quiz_questions', Number(college.id));
    const entry = {
      collegeCode: college.code,
      quiz_bank_questions: bank.stats,
      quiz_questions: instance.stats,
      perSubjectBank: bank.perSubject,
      perSubjectInstance: instance.perSubject,
    };
    (report.colleges as unknown[]).push(entry);
    console.log('Bank:', bank.stats);
    console.log('Instance:', instance.stats);
  }

  const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..', 'apps/api/reports');
  await fs.mkdir(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'quiz-co-mapping-report.json');
  const mdPath = path.join(outDir, 'quiz-co-mapping-report.md');
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));

  const lines: string[] = ['# Quiz CO Mapping Report', '', `Generated: ${report.generatedAt}`, `Dry run: ${dryRun}`, ''];
  for (const c of report.colleges as Array<Record<string, unknown>>) {
    lines.push(`## ${c.collegeCode}`);
    lines.push('');
    lines.push('### quiz_bank_questions');
    lines.push('```json');
    lines.push(JSON.stringify(c.quiz_bank_questions, null, 2));
    lines.push('```');
    lines.push('');
    lines.push('### Per-subject CO counts (bank)');
    lines.push('```json');
    lines.push(JSON.stringify(c.perSubjectBank, null, 2));
    lines.push('```');
    lines.push('');
    lines.push('### quiz_questions');
    lines.push('```json');
    lines.push(JSON.stringify(c.quiz_questions, null, 2));
    lines.push('```');
    lines.push('');
  }
  await fs.writeFile(mdPath, lines.join('\n'));
  console.log(`\nWrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
