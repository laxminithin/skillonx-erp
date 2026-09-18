/**
 * Real-DB smoke for Content Beyond Syllabus (BIS701).
 * Run: npx tsx apps/api/src/scripts/e2eBeyondSyllabus.ts
 */
import { db } from '../db/index.js';
import * as cbs from '../modules/contentBeyondSyllabus/service.js';
import type { CbsActor } from '../modules/contentBeyondSyllabus/access.js';
import { decideCbsPlanAccess } from '../modules/contentBeyondSyllabus/access.js';

async function main() {
  const college = await db('colleges').orderBy('id').first();
  if (!college) throw new Error('No college');
  const facultyA = await db('faculty_users').where({ college_id: college.id }).orderBy('id').first();
  const facultyB = await db('faculty_users')
    .where({ college_id: college.id })
    .andWhereNot('id', facultyA.id)
    .orderBy('id')
    .first();
  if (!facultyA) throw new Error('No faculty');

  const course = await db('courses')
    .where({ college_id: college.id })
    .andWhere((b) => b.where('code', 'BIS701').orWhere('name', 'like', '%Big Data%'))
    .first();
  if (!course) throw new Error('BIS701 course missing — run npm run seed:academic-master');

  const year = await db('academic_years').where({ college_id: college.id }).orderBy('id', 'desc').first();
  if (!year) throw new Error('No academic year');

  const masterCount = await db('cbs_masters')
    .where({ course_code: 'BIS701', is_active: true })
    .andWhere((b) => b.whereNull('college_id').orWhere('college_id', college.id))
    .count({ c: '*' })
    .first();
  console.log('BIS701 master recommendations:', Number(masterCount?.c || 0));
  if (Number(masterCount?.c || 0) < 1) throw new Error('BIS701 CBS master missing — run npm run seed:academic-master');

  const actorA: CbsActor = {
    facultyUserId: Number(facultyA.id),
    collegeId: Number(college.id),
    role: 'FACULTY',
    departmentId: facultyA.department_id ?? null,
  };

  // cleanup prior e2e plans
  const prior = await db('faculty_cbs_plans').where({
    college_id: college.id,
    created_by: facultyA.id,
    course_id: course.id,
    academic_year_id: year.id,
  });
  for (const p of prior) {
    await db('faculty_cbs_plans').where({ id: p.id }).del();
  }

  const preview = await cbs.previewGeneration(actorA, {
    courseId: Number(course.id),
    academicYearId: Number(year.id),
  });
  console.log('Preview found:', preview.found, preview.counts);

  const masters = await db('cbs_masters')
    .where({ course_code: 'BIS701', is_active: true })
    .andWhere((b) => b.whereNull('college_id').orWhere('college_id', college.id))
    .orderBy('cbs_id')
    .select('cbs_id', 'origin_type', 'college_id');
  const selected = [
    masters.find((m) => m.origin_type === 'GAP_ANALYSIS' || String(m.cbs_id).endsWith('-002'))?.cbs_id,
    masters.find((m) => m.origin_type === 'INDUSTRY_REQUIREMENT')?.cbs_id,
    masters.find((m) => m.origin_type === 'FACULTY_ENRICHMENT')?.cbs_id,
  ].filter(Boolean) as string[];

  const plan = await cbs.createFromMaster(actorA, {
    courseId: Number(course.id),
    academicYearId: Number(year.id),
    selectedCbsIds: selected.length ? selected : masters.slice(0, 3).map((m) => String(m.cbs_id)),
  });
  console.log('Created plan', plan.id, 'items', plan.items.length);

  const item =
    plan.items.find((i) => !i.assessmentRequired) ||
    plan.items.find((i) => i.assessmentType === 'NONE') ||
    plan.items[0];

  // If assessment is required, clear the requirement for this smoke path (or complete after link).
  if (item.assessmentRequired) {
    await cbs.updateItem(plan.id, item.id, actorA, { assessmentRequired: false, assessmentType: 'NONE' });
  }

  const delivered = await cbs.markDelivered(plan.id, item.id, actorA, {
    actualDate: '2026-08-22',
    actualHours: Number(item.plannedHours || 2),
    deliveryNotes: 'E2E delivery',
    participants: 52,
  });
  console.log('Delivered', delivered.items.find((i) => i.id === item.id)?.status);

  await cbs.addEvidence(plan.id, actorA, {
    evidenceType: 'ATTENDANCE',
    title: 'E2E Attendance',
    itemId: item.id,
    externalUrl: 'https://example.com/attendance',
  });

  const completed = await cbs.completeItem(plan.id, item.id, actorA, {
    actualOutcome:
      'Students were able to identify differences between self-managed and managed cloud data platforms.',
    assessmentResult: '78%',
    impactBenefit: 'Improved industry-aligned understanding',
    participants: 52,
  });
  console.log('Completed', completed.items.find((i) => i.id === item.id)?.status);

  // ownership
  if (facultyB) {
    const actorB: CbsActor = {
      facultyUserId: Number(facultyB.id),
      collegeId: Number(college.id),
      role: 'FACULTY',
      departmentId: facultyB.department_id ?? null,
    };
    const listB = await cbs.listPlans(actorB);
    const leak = listB.plans.find((p) => p.id === plan.id);
    if (leak) throw new Error('Faculty B listed Faculty A plan');
    const decision = decideCbsPlanAccess(actorB, {
      collegeId: Number(college.id),
      createdBy: Number(facultyA.id),
      departmentId: null,
    });
    if (decision !== 'FORBIDDEN') throw new Error(`Expected FORBIDDEN, got ${decision}`);
    console.log('Ownership OK — Faculty B cannot access Faculty A plan');
  }

  // formal attainment default
  const flag = completed.items.every((i) => i.includeInFormalAttainment === false);
  if (!flag) throw new Error('includeInFormalAttainment should default false');
  console.log('Formal attainment default NO — OK');

  console.log('E2E Beyond Syllabus passed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
