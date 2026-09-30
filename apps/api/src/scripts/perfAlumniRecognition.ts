/**
 * Perf probe for Alumni Recognition (C6).
 * Reports p50/p95 for workspace, analytics, management summary, programs, nominations.
 */
import { db } from '../db/index.js';
import * as recognition from '../modules/alumni/recognitionService.js';
import * as recognitionWorkspace from '../modules/alumni/recognitionWorkspace.js';
import type { AlumniAdminActor } from '../modules/alumni/service.js';

function pct(sorted: number[], p: number) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

async function timeMs(fn: () => Promise<unknown>) {
  const t0 = performance.now();
  await fn();
  return performance.now() - t0;
}

async function main() {
  const college = await db('colleges').orderBy('id').first();
  if (!college) throw new Error('No college');
  const admin = await db('faculty_users')
    .where({ college_id: college.id, is_active: true })
    .whereIn('role', ['COLLEGE_ADMIN', 'SUPER_ADMIN', 'ALUMNI_COORDINATOR', 'PRINCIPAL'])
    .first();
  if (!admin) throw new Error('No admin faculty');

  const actor: AlumniAdminActor = {
    facultyUserId: Number(admin.id),
    collegeId: Number(college.id),
    departmentId: admin.department_id ?? null,
    role: admin.role,
    name: admin.name,
  };

  if (!(await db.schema.hasTable('alumni_recognition_programs'))) {
    console.log(JSON.stringify({ error: 'alumni_recognition_c6 migration not applied' }));
    await db.destroy();
    return;
  }

  await recognition.ensureDefaultCategories(actor.collegeId);

  let program = await db('alumni_recognition_programs').where({ college_id: college.id }).orderBy('id', 'desc').first();
  if (!program) {
    const created = await recognition.createProgram(actor, {
      name: 'Perf probe recognition program',
      category: 'INSTITUTIONAL_SERVICE',
      status: 'DRAFT',
    });
    program = await db('alumni_recognition_programs').where({ id: created.program.id }).first();
  }

  const profile = await db('alumni_profiles').where({ college_id: college.id, is_active: true }).first();

  const samples = {
    workspace: [] as number[],
    reviewQueue: [] as number[],
    analytics: [] as number[],
    managementSummary: [] as number[],
    programs: [] as number[],
    nominations: [] as number[],
    valueCatalogue: [] as number[],
    communities: [] as number[],
    reciprocity: [] as number[],
    recognition360: [] as number[],
  };

  for (let i = 0; i < 12; i++) {
    samples.workspace.push(
      await timeMs(() => recognitionWorkspace.getRecognitionWorkspace(actor, { view: 'OVERVIEW' })),
    );
    samples.reviewQueue.push(
      await timeMs(() => recognitionWorkspace.getRecognitionWorkspace(actor, { view: 'REVIEW_QUEUE' })),
    );
    samples.analytics.push(await timeMs(() => recognitionWorkspace.getRecognitionAnalytics(actor)));
    samples.managementSummary.push(await timeMs(() => recognitionWorkspace.getManagementSummary(actor)));
    samples.programs.push(await timeMs(() => recognition.listPrograms(actor, {})));
    samples.nominations.push(await timeMs(() => recognition.listNominations(actor, { limit: 50 })));
    samples.valueCatalogue.push(await timeMs(() => recognition.listValueOfferings(actor, { status: 'OPEN' })));
    samples.communities.push(await timeMs(() => recognition.listCommunities(actor, {})));
    if (profile) {
      samples.reciprocity.push(
        await timeMs(() => recognition.getReciprocity(actor, Number(profile.id), 12)),
      );
      samples.recognition360.push(
        await timeMs(() => recognition.buildRecognition360Section(Number(college.id), Number(profile.id))),
      );
    }
  }

  const report: Record<string, { p50: number; p95: number; n: number }> = {};
  for (const [k, arr] of Object.entries(samples)) {
    const sorted = [...arr].sort((a, b) => a - b);
    report[k] = {
      p50: Math.round(pct(sorted, 50)),
      p95: Math.round(pct(sorted, 95)),
      n: sorted.length,
    };
  }

  console.log(
    JSON.stringify({ collegeId: college.id, programId: program?.id ?? null, ms: report }, null, 2),
  );
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
