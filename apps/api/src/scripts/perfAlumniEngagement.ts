/**
 * Perf probe for Alumni Engagement (C4).
 * Reports p50/p95 for workspace, calendar, campaign detail, audience evaluation, manual queue.
 */
import { db } from '../db/index.js';
import * as engagement from '../modules/alumni/engagementService.js';
import * as engagementWorkspace from '../modules/alumni/engagementWorkspace.js';
import { evaluateEligibilityBatch } from '../modules/alumni/eligibility.js';
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

  const ids = (
    await db('alumni_profiles').where({ college_id: college.id, is_active: true }).select('id').limit(200)
  ).map((r: any) => Number(r.id));

  const samples = {
    workspace: [] as number[],
    calendar: [] as number[],
    eligibility: [] as number[],
    manualQueue: [] as number[],
    campaignDetail: [] as number[],
  };

  const campaign = await db('alumni_engagement_campaigns').where({ college_id: college.id }).orderBy('id', 'desc').first();

  for (let i = 0; i < 12; i++) {
    samples.workspace.push(await timeMs(() => engagementWorkspace.getEngagementWorkspace(actor, { view: 'OVERVIEW' })));
    samples.calendar.push(await timeMs(() => engagementWorkspace.getEngagementCalendar(actor, { view: 'MONTH' })));
    samples.manualQueue.push(await timeMs(() => engagement.listManualOutreachQueue(actor, {})));
    if (ids.length) {
      samples.eligibility.push(
        await timeMs(() =>
          evaluateEligibilityBatch({
            actor,
            alumniProfileIds: ids,
            category: 'MENTORSHIP',
            channel: 'MANUAL',
          }),
        ),
      );
    }
    if (campaign) {
      samples.campaignDetail.push(await timeMs(() => engagement.getCampaignDetail(actor, Number(campaign.id))));
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

  console.log(JSON.stringify({ collegeId: college.id, audienceSize: ids.length, ms: report }, null, 2));
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
