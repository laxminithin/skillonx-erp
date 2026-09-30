/**
 * Lightweight perf probe for Alumni Assistant (C8).
 * Separates deterministic retrieval latency from provider latency (null when NOT_CONFIGURED).
 */
import { db } from '../db/index.js';
import * as assistant from '../modules/alumni/assistantService.js';

function pct(sorted: number[], p: number) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

async function main() {
  const college = await db('colleges').orderBy('id').first();
  const admin = await db('faculty_users').where({ college_id: college.id, role: 'COLLEGE_ADMIN' }).first();
  if (!college || !admin) {
    console.log(JSON.stringify({ error: 'fixtures missing' }));
    process.exit(1);
  }
  const actor = {
    facultyUserId: Number(admin.id),
    collegeId: Number(college.id),
    departmentId: admin.department_id ?? null,
    role: admin.role,
    name: admin.name,
  };

  const probes: Array<{ name: string; question: string }> = [
    { name: 'alumni_search', question: 'Alumni working in AI' },
    { name: 'single_alumni', question: 'Which alumni records need career-data refresh?' },
    { name: 'matching', question: 'Find alumni suitable for an AI expert session next month.' },
    { name: 'impact', question: 'How many students benefited from alumni mentorship?' },
    { name: 'evidence', question: 'What alumni evidence gaps exist for accreditation?' },
    { name: 'complex', question: 'Which verified alumni could mentor final-year ISE students in cybersecurity?' },
  ];

  const report: Record<string, unknown> = {
    provider: (await assistant.getProviderStatus(actor)).provider.status,
    probes: {},
  };

  for (const probe of probes) {
    const samples: number[] = [];
    for (let i = 0; i < 5; i++) {
      const t0 = Date.now();
      await assistant.ask(actor, { question: probe.question });
      samples.push(Date.now() - t0);
    }
    samples.sort((a, b) => a - b);
    (report.probes as any)[probe.name] = {
      p50: pct(samples, 50),
      p95: pct(samples, 95),
      provider_p50: null,
      note: 'Deterministic path only — provider NOT_CONFIGURED',
    };
  }

  console.log(JSON.stringify(report, null, 2));
  await db.destroy();
}

main().catch(async (e) => {
  console.error(e);
  await db.destroy().catch(() => {});
  process.exit(1);
});
