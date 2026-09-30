/**
 * Perf probe for Alumni Matching (C5).
 * Reports p50/p95 for workspace, need detail, candidate evaluation, bulk pool, 360 matching section.
 */
import { db } from '../db/index.js';
import * as matching from '../modules/alumni/matchingService.js';
import * as matchingWorkspace from '../modules/alumni/matchingWorkspace.js';
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

  if (!(await db.schema.hasTable('alumni_connect_needs'))) {
    console.log(JSON.stringify({ error: 'alumni_matching_c5 migration not applied' }));
    await db.destroy();
    return;
  }

  let need = await db('alumni_connect_needs').where({ college_id: college.id }).orderBy('id', 'desc').first();
  if (!need) {
    const created = await matching.createNeed(actor, {
      type: 'MENTORSHIP',
      title: 'Perf probe need',
      domain: 'Software',
      skillsTopics: ['Software'],
      quantityRequired: 50,
      status: 'OPEN',
    });
    need = await db('alumni_connect_needs').where({ id: created.need.id }).first();
  }

  const profile = await db('alumni_profiles').where({ college_id: college.id, is_active: true }).first();

  const samples = {
    workspace: [] as number[],
    needDetail: [] as number[],
    evaluate: [] as number[],
    bulkEvaluate: [] as number[],
    profileMatches: [] as number[],
  };

  for (let i = 0; i < 12; i++) {
    samples.workspace.push(await timeMs(() => matchingWorkspace.getMatchingWorkspace(actor, { view: 'OPEN_NEEDS' })));
    samples.needDetail.push(await timeMs(() => matching.getNeedDetail(actor, Number(need.id))));
    samples.evaluate.push(
      await timeMs(() => matching.evaluateNeed(actor, Number(need.id), { limit: 40, includeLimited: true })),
    );
    samples.bulkEvaluate.push(
      await timeMs(() =>
        matching.evaluateNeed(actor, Number(need.id), { limit: 100 }).then(async (r) => {
          // Force bulk path when quantity high
          if (Number(need.quantity_required) < 20) {
            await db('alumni_connect_needs').where({ id: need.id }).update({ quantity_required: 50 });
            need.quantity_required = 50;
            return matching.evaluateNeed(actor, Number(need.id), { limit: 100 });
          }
          return r;
        }),
      ),
    );
    if (profile) {
      samples.profileMatches.push(await timeMs(() => matching.getProfileMatches(actor, Number(profile.id))));
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

  console.log(JSON.stringify({ collegeId: college.id, needId: need.id, ms: report }, null, 2));
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
