#!/usr/bin/env node
/**
 * Lightweight Alumni 360 performance samples (p50/p95).
 * Usage: npx tsx src/scripts/perfAlumni360.ts
 */
import { db } from '../db/index.js';
import { getAlumni360 } from '../modules/alumni/aggregate360.js';
import * as alumni from '../modules/alumni/service.js';

function percentile(sorted: number[], p: number) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

async function time(fn: () => Promise<unknown>, n = 20) {
  const samples: number[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    await fn();
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);
  return { n, p50: Math.round(percentile(samples, 50) * 100) / 100, p95: Math.round(percentile(samples, 95) * 100) / 100, max: Math.round(samples[samples.length - 1] * 100) / 100 };
}

const college = await db('colleges').orderBy('id').first();
if (!college) {
  console.log(JSON.stringify({ error: 'No college seeded', note: 'NOT TESTED' }));
  process.exit(0);
}

const profile = await db('alumni_profiles').where({ college_id: college.id, verification_state: 'VERIFIED' }).first();
if (!profile) {
  console.log(JSON.stringify({ error: 'No verified alumni', note: 'NOT TESTED — seed alumni first' }));
  process.exit(0);
}

const actor: alumni.AlumniActor = {
  alumniProfileId: Number(profile.id),
  studentId: Number(profile.student_id),
  collegeId: Number(profile.college_id),
  role: 'ALUMNI',
  email: profile.email,
  name: profile.historical_name,
};

const results = {
  getAlumni360: await time(() => getAlumni360({ collegeId: actor.collegeId, profileId: actor.alumniProfileId, viewer: 'self' })),
  directory: await time(() => alumni.directory(actor, { limit: 20 })),
  careerHistory: await time(() => alumni.listEmployment(actor)),
  note: 'Local samples only — not production SLOs.',
};

console.log(JSON.stringify(results, null, 2));
process.exit(0);
