/**
 * Deterministic IQAC Coordinator QA seed (idempotent).
 *
 * Closes a UAT gap: the `/iqac` portal existed and worked, but no dedicated
 * IQAC_COORDINATOR QA login existed anywhere, so role-specific IQAC behavior
 * (self-verification block, cycle-approve two-party control, dashboard
 * counts) was untestable. Drives the module's own service-layer functions
 * (not raw inserts) so every FK/status-transition/uniqueness rule is
 * enforced exactly as the real UI would trigger it.
 *
 * Requires seed:student-lms-e2e (or seed:live-qa, which runs it) to have run
 * first — it looks up the VVIET college and Anita (FACULTY) by email and
 * soft-skips if either is absent.
 */
import bcrypt from 'bcrypt';
import { pathToFileURL } from 'node:url';
import { db } from '../db/index.js';
import * as iqac from '../modules/iqac/service.js';
import type { IqacActor } from '../modules/iqac/types.js';

const COORDINATOR_EMAIL = 'qa.iqac.coordinator@vviet.edu.in';
const PASSWORD = process.env.LIVE_QA_FACULTY_PASSWORD || 'Password123';

async function ensureFaculty(collegeId: number, departmentId: number | null, email: string, name: string, role: string) {
  const hash = await bcrypt.hash(PASSWORD, 10);
  let user = await db('faculty_users').where({ email }).first();
  if (!user) {
    const [id] = await db('faculty_users').insert({
      college_id: collegeId, department_id: departmentId, name, email, role,
      password_hash: hash, is_active: true, employee_id: `QA-${role}`.slice(0, 32),
    });
    user = await db('faculty_users').where({ id }).first();
  } else {
    await db('faculty_users').where({ id: user.id }).update({ role, department_id: departmentId, password_hash: hash, is_active: true });
    user = await db('faculty_users').where({ id: user.id }).first();
  }
  return user!;
}

export async function seedIqacQa(options: { closeDb?: boolean } = {}) {
  if (!(await db.schema.hasTable('iqac_frameworks'))) {
    console.log('IQAC tables absent — run migrations first; skipping IQAC QA seed.');
    if (options.closeDb) await db.destroy();
    return null;
  }
  const anita = await db('faculty_users').where({ email: 'anita@vviet.edu.in' }).first();
  if (!anita) {
    console.log('anita@vviet.edu.in absent — run seed:student-lms-e2e / seed:live-qa first; skipping IQAC QA seed.');
    if (options.closeDb) await db.destroy();
    return null;
  }
  const collegeId = Number(anita.college_id);
  const departmentId = anita.department_id != null ? Number(anita.department_id) : null;

  const coordinatorUser = await ensureFaculty(collegeId, departmentId, COORDINATOR_EMAIL, 'QA IQAC Coordinator', 'IQAC_COORDINATOR');
  const coordinator: IqacActor = {
    facultyUserId: Number(coordinatorUser.id), collegeId, departmentId, role: 'IQAC_COORDINATOR', name: coordinatorUser.name,
  };
  const submitter: IqacActor = {
    facultyUserId: Number(anita.id), collegeId, departmentId: anita.department_id != null ? Number(anita.department_id) : null, role: 'FACULTY', name: anita.name,
  };

  let framework = (await iqac.listFrameworks(coordinator)).find((f: any) => f.code === 'QA-NAAC');
  if (!framework) framework = await iqac.createFramework(coordinator, { name: 'QA NAAC Framework', code: 'QA-NAAC', description: null });

  let version = (await iqac.listFrameworkVersions(coordinator, framework.id)).find((v: any) => v.version_label === 'v1');
  if (!version) {
    const draft = await iqac.createFrameworkVersion(coordinator, framework.id, { versionLabel: 'v1', effectiveFrom: '2026-01-01', effectiveTo: null });
    version = draft.status === 'ACTIVE' ? draft : await iqac.activateFrameworkVersion(coordinator, draft.id);
  } else if (version.status !== 'ACTIVE') {
    version = await iqac.activateFrameworkVersion(coordinator, version.id);
  }

  let criterion = (await iqac.listCriteria(coordinator, version.id)).find((c: any) => c.code === 'C1');
  if (!criterion) criterion = await iqac.createCriterion(coordinator, version.id, { code: 'C1', title: 'Curricular Aspects', description: null, level: 'CRITERION', parentId: null, weight: null, sortOrder: 1 });

  let metricOk = (await iqac.listMetrics(coordinator, { frameworkVersionId: version.id })).find((m: any) => m.code === 'QA-M1');
  if (!metricOk) metricOk = await iqac.createMetric(coordinator, { frameworkVersionId: version.id, criterionId: criterion.id, code: 'QA-M1', name: 'QA Manual Metric (healthy)', description: null, sourceType: 'MANUAL', sourceModule: null, unit: 'percent', targetValue: 90 });
  await iqac.setManualMetricValue(coordinator, metricOk.id, { periodLabel: '2026', value: 92, valueStatus: 'OK', cycleId: null });

  let metricGap = (await iqac.listMetrics(coordinator, { frameworkVersionId: version.id })).find((m: any) => m.code === 'QA-M2');
  if (!metricGap) metricGap = await iqac.createMetric(coordinator, { frameworkVersionId: version.id, criterionId: criterion.id, code: 'QA-M2', name: 'QA Manual Metric (needs data)', description: null, sourceType: 'MANUAL', sourceModule: null, unit: 'count', targetValue: null });
  await iqac.setManualMetricValue(coordinator, metricGap.id, { periodLabel: '2026', value: null, valueStatus: 'NO_DATA', cycleId: null });

  let cycle = (await iqac.listCycles(coordinator)).find((c: any) => c.name === 'QA IQAC Cycle 2026');
  if (!cycle) cycle = await iqac.createCycle(coordinator, { frameworkVersionId: version.id, name: 'QA IQAC Cycle 2026', academicYear: '2026-27' });
  if (cycle.status === 'DRAFT') cycle = await iqac.advanceCycle(coordinator, cycle.id, 'DATA_COLLECTION');

  const existingEvidence = (await iqac.listEvidence(coordinator, { cycleId: cycle.id })).find((e: any) => e.external_reference === 'QA-EVIDENCE-1');
  if (!existingEvidence) {
    await iqac.submitEvidence(submitter, {
      cycleId: cycle.id, criterionId: criterion.id, metricId: metricOk.id,
      provenance: 'EXTERNAL_REFERENCE', sourceModule: null, sourceRecordType: null, sourceRecordId: null,
      documentId: null, externalReference: 'QA-EVIDENCE-1', periodLabel: '2026', academicYear: '2026-27',
    });
  }

  const existingPlan = (await iqac.listActionPlans(coordinator, {})).find((p: any) => p.finding === 'QA seeded overdue finding');
  if (!existingPlan) {
    await iqac.createActionPlan(coordinator, {
      sourceType: 'IQAC_MEETING', sourceRef: null, finding: 'QA seeded overdue finding',
      action: 'QA seeded remediation action', ownerUserId: coordinatorUser.id, departmentId,
      targetDate: '2026-01-01',
    });
  }

  let audit = (await iqac.listAudits(coordinator, {})).find((a: any) => a.name === 'QA IQAC Audit 2026');
  if (!audit) {
    audit = await iqac.createAudit(coordinator, {
      name: 'QA IQAC Audit 2026', academicYear: '2026-27', departmentId, auditorUserId: coordinatorUser.id,
      checklist: [{ code: 'CHK1', text: 'QA checklist item' }], scheduledDate: '2026-01-01',
    });
  }
  const existingFinding = (await db('iqac_audit_findings').where({ college_id: collegeId, audit_id: audit.id }).first());
  if (!existingFinding) {
    await iqac.addFinding(coordinator, audit.id, { checklistItemCode: 'CHK1', finding: 'QA seeded open finding', severity: 'MEDIUM' });
  }

  const existingCompliance = await db('iqac_compliance_items').where({ college_id: collegeId, requirement: 'QA seeded compliance item' }).first();
  if (!existingCompliance) {
    await iqac.createComplianceItem(coordinator, {
      requirement: 'QA seeded compliance item', authority: 'AICTE', periodLabel: '2026',
      dueDate: '2026-01-01', ownerUserId: coordinatorUser.id,
    });
  }

  console.log('\n========== IQAC QA READY ==========');
  console.log(JSON.stringify({ coordinator: { email: COORDINATOR_EMAIL, path: '/iqac' }, framework: framework.code, cycle: cycle.name }, null, 2));

  if (options.closeDb) await db.destroy();
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  seedIqacQa({ closeDb: true }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
