/**
 * Single authoritative UAT/QA seed orchestrator: `npm run seed:uat`.
 *
 * Runs the documented dependency-ordered sequence of Web-portal QA seeders
 * against whichever database DATABASE_URL points at (run `npm run migrate`
 * first). Each step is idempotent and safe to rerun. Excludes
 * seed:e2e-mobile-users (mobile-only, needs MOBILE_E2E_*_PASSWORD secrets)
 * and `npm run seed` (knex seed:run — destructive snapshot restore, not
 * compatible with these additive QA seeders).
 */
import { db } from '../db/index.js';
import { seedLiveQa } from './seedLiveQa.js';
import { seedOfficeQa } from './seedOfficeQa.js';
import { seedAdmissionsQa } from './seedAdmissionsQa.js';
import { seedLabManagement } from './seedLabManagement.js';
import { seedMaintenance } from './seedMaintenance.js';
import { seedParentAlumniQa } from './seedParentAlumniQa.js';
import { seedIqacQa } from './seedIqacQa.js';

const STEPS: Array<{ name: string; run: () => Promise<unknown> }> = [
  { name: 'seed:live-qa (college + faculty/admin/management + student-lms-e2e + HOD/Principal/Accountant/COE)', run: seedLiveQa },
  { name: 'seed:office-qa (18 office-portal role identities)', run: seedOfficeQa },
  { name: 'seed:admissions-qa (admissions cycle + 10 applicants)', run: seedAdmissionsQa },
  { name: 'seed:lab-management (labs, assets, stock, HOD/Principal leadership overlay)', run: seedLabManagement },
  { name: 'seed:maintenance (maintenance/IT helpdesk tickets)', run: seedMaintenance },
  { name: 'seed:parent-alumni-qa (Parent + Alumni portal logins)', run: seedParentAlumniQa },
  { name: 'seed:iqac-qa (IQAC Coordinator login + framework/cycle/evidence/action-plan/audit/compliance fixtures)', run: seedIqacQa },
];

async function main() {
  console.log(`Running UAT seed orchestrator — ${STEPS.length} steps\n`);
  for (const [i, step] of STEPS.entries()) {
    console.log(`\n[${i + 1}/${STEPS.length}] ${step.name}`);
    await step.run();
  }
  console.log('\n========== UAT SEED COMPLETE ==========');
  await db.destroy();
}

main().catch((err) => {
  console.error('\nUAT seed orchestrator FAILED:', err);
  process.exit(1);
});
