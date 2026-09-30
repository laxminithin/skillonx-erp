#!/usr/bin/env node
/**
 * Alumni Intelligence (C3) performance samples (p50/p95).
 * Usage: npx tsx src/scripts/perfAlumniIntel.ts
 */
import { db } from '../db/index.js';
import { getAlumni360 } from '../modules/alumni/aggregate360.js';
import { getProfileIntelligence } from '../modules/alumni/intelligenceEngine.js';
import * as intelWorkspace from '../modules/alumni/intelligenceWorkspace.js';
import * as segments from '../modules/alumni/segmentService.js';
import type { AlumniAdminActor } from '../modules/alumni/service.js';

function percentile(sorted: number[], p: number) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

async function time(fn: () => Promise<unknown>, n = 12) {
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
  alumni360WithIntelligence: await time(() =>
    getAlumni360({
      collegeId: actor.collegeId,
      profileId: Number(profile.id),
      viewer: 'admin',
      actorFacultyId: actor.facultyUserId,
      actorRole: actor.role,
      actorDepartmentId: actor.departmentId,
    }),
  ),
  profileIntelligence: await time(() => getProfileIntelligence(actor, Number(profile.id))),
  intelligenceWorkspace: await time(() => intelWorkspace.getIntelligenceWorkspace(actor, { view: 'MENTORSHIP', limit: 50 })),
  singleDimension: await time(() => intelWorkspace.getDimensionBoard(actor, 'RECRUITMENT', { limit: 50 })),
  complexSegment: await time(() =>
    segments.evaluateRules(actor, {
      ruleDefinition: {
        combinator: 'AND',
        filters: [
          { field: 'dimension', value: 'MENTORSHIP' },
          { field: 'evidenceState', op: 'in', value: ['STRONG_EVIDENCE', 'MODERATE_EVIDENCE', 'LIMITED_EVIDENCE'] },
          { field: 'willingnessState', op: 'neq', value: 'NOT_WILLING' },
          { field: 'graduationYearMin', value: 2015 },
        ],
      },
      limit: 50,
    }),
  ),
  note: 'Local samples — not production SLOs. No AI / LinkedIn / WhatsApp enrichment.',
};

console.log(JSON.stringify(results, null, 2));
process.exit(0);
