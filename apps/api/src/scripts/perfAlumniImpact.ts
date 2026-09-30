/**
 * Perf probe for Alumni Impact (C7).
 * Reports p50/p95 for executive dashboard, department, drill-down, trends, evidence, gaps, reports.
 */
import { db } from '../db/index.js';
import * as impact from '../modules/alumni/impactService.js';
import * as impactWorkspace from '../modules/alumni/impactWorkspace.js';
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
    .whereIn('role', ['COLLEGE_ADMIN', 'SUPER_ADMIN', 'ALUMNI_COORDINATOR', 'PRINCIPAL', 'MANAGEMENT'])
    .first();
  if (!admin) throw new Error('No admin faculty');

  const actor: AlumniAdminActor = {
    facultyUserId: Number(admin.id),
    collegeId: Number(college.id),
    departmentId: admin.department_id ?? null,
    role: admin.role,
    name: admin.name,
  };

  if (!(await db.schema.hasTable('alumni_impact_metric_defs'))) {
    console.log(JSON.stringify({ error: 'alumni_impact_c7 migration not applied' }));
    await db.destroy();
    return;
  }

  await impact.ensureMetricRegistrySeeded(actor.collegeId);

  const samples = {
    executive: [] as number[],
    department: [] as number[],
    drilldown: [] as number[],
    trends: [] as number[],
    evidence: [] as number[],
    gaps: [] as number[],
    report: [] as number[],
  };

  const rounds = 6;
  for (let i = 0; i < rounds; i++) {
    samples.executive.push(
      await timeMs(() => impactWorkspace.getImpactWorkspace(actor, { view: 'EXECUTIVE' })),
    );
    samples.drilldown.push(await timeMs(() => impact.getDrilldown(actor, 'alumni.verified', {})));
    samples.evidence.push(await timeMs(() => impact.listEvidenceLedger(actor, { limit: 50 })));
    samples.gaps.push(await timeMs(() => impact.analyzeGaps(actor, {})));
    samples.report.push(await timeMs(() => impact.buildReport(actor, { reportType: 'DATA_QUALITY' })));
    // Trends/department are heavier — sample fewer rounds
    if (i < 3) {
      samples.trends.push(await timeMs(() => impactWorkspace.getImpactWorkspace(actor, { view: 'TRENDS' })));
      samples.department.push(
        await timeMs(() => impactWorkspace.getImpactWorkspace(actor, { view: 'DEPARTMENT' })),
      );
    }
  }

  const summary: Record<string, { p50: number; p95: number }> = {};
  for (const [k, arr] of Object.entries(samples)) {
    const sorted = [...arr].sort((a, b) => a - b);
    summary[k] = {
      p50: Math.round(pct(sorted, 50)),
      p95: Math.round(pct(sorted, 95)),
    };
  }

  console.log(JSON.stringify({ collegeId: college.id, samples: rounds, ms: summary }, null, 2));
  await db.destroy();
}

main().catch(async (err) => {
  console.error(err);
  await db.destroy().catch(() => undefined);
  process.exit(1);
});
