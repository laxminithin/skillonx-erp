#!/usr/bin/env node
/**
 * Alumni CRM + 360 performance samples (p50/p95).
 * Usage: npx tsx src/scripts/perfAlumniCrm.ts
 */
import { db } from '../db/index.js';
import { getAlumni360 } from '../modules/alumni/aggregate360.js';
import * as crmTimeline from '../modules/alumni/crmTimeline.js';
import * as crmWorkspace from '../modules/alumni/crmWorkspace.js';
import type { AlumniAdminActor } from '../modules/alumni/service.js';

function percentile(sorted: number[], p: number) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

async function time(fn: () => Promise<unknown>, n = 15) {
  const samples: number[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    await fn();
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);
  return {
    n,
    p50: Math.round(percentile(samples, 50) * 100) / 100,
    p95: Math.round(percentile(samples, 95) * 100) / 100,
    max: Math.round(samples[samples.length - 1] * 100) / 100,
  };
}

const college = await db('colleges').orderBy('id').first();
if (!college) {
  console.log(JSON.stringify({ error: 'No college', note: 'NOT TESTED' }));
  process.exit(0);
}

const admin = await db('faculty_users').where({ college_id: college.id, role: 'COLLEGE_ADMIN' }).first();
const profile = await db('alumni_profiles').where({ college_id: college.id, verification_state: 'VERIFIED' }).first();
if (!admin || !profile) {
  console.log(JSON.stringify({ error: 'Need COLLEGE_ADMIN + verified alumni', note: 'NOT TESTED' }));
  process.exit(0);
}

const actor: AlumniAdminActor = {
  facultyUserId: Number(admin.id),
  collegeId: Number(college.id),
  departmentId: admin.department_id ?? null,
  role: admin.role,
  name: admin.name,
};

const results = {
  alumni360WithCrm: await time(() =>
    getAlumni360({
      collegeId: actor.collegeId,
      profileId: Number(profile.id),
      viewer: 'admin',
      actorFacultyId: actor.facultyUserId,
      actorRole: actor.role,
      actorDepartmentId: actor.departmentId,
    }),
  ),
  timeline: await time(() => crmTimeline.getTimelineForAdmin(actor, Number(profile.id))),
  crmWorkspace: await time(() => crmWorkspace.getCrmWorkspace(actor, { view: 'MY_ALUMNI', limit: 50 })),
  followups: await time(() => crmWorkspace.getCrmWorkspace(actor, { view: 'MY_FOLLOWUPS', limit: 50 })),
  opportunities: await time(() => crmWorkspace.getCrmWorkspace(actor, { view: 'ACTIVE_OPPORTUNITIES', limit: 50 })),
  note: 'Local samples with CRM sections — not production SLOs. WhatsApp/email delivery NOT integrated.',
};

console.log(JSON.stringify(results, null, 2));
process.exit(0);
