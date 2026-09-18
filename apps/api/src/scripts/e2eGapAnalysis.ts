/**
 * Real-DB E2E smoke for Gap Analysis ownership + workflow.
 * Run: node --import tsx src/scripts/e2eGapAnalysis.ts
 */
import { db } from '../db/index.js';
import * as gap from '../modules/gapAnalysis/service.js';
import type { GapActor } from '../modules/gapAnalysis/access.js';
import { decideGapAnalysisAccess } from '../modules/gapAnalysis/access.js';
import { exportGapAnalysisXlsx, buildPrintModel } from '../modules/gapAnalysis/exportService.js';

async function main() {
  const college = await db('colleges').orderBy('id').first();
  if (!college) throw new Error('No college');
  const collegeId = Number(college.id);

  const facultyUsers = await db('faculty_users')
    .where({ college_id: collegeId, role: 'FACULTY' })
    .orderBy('id')
    .limit(2);
  if (facultyUsers.length < 2) {
    // fallback: any two users
    const any = await db('faculty_users').where({ college_id: collegeId }).orderBy('id').limit(2);
    facultyUsers.splice(0, facultyUsers.length, ...any);
  }
  if (facultyUsers.length < 2) throw new Error('Need at least two faculty users in college');

  const facultyA: GapActor = {
    facultyUserId: Number(facultyUsers[0].id),
    collegeId,
    role: 'FACULTY',
    departmentId: facultyUsers[0].department_id,
  };
  const facultyB: GapActor = {
    facultyUserId: Number(facultyUsers[1].id),
    collegeId,
    role: 'FACULTY',
    departmentId: facultyUsers[1].department_id,
  };
  const adminUser = await db('faculty_users')
    .where({ college_id: collegeId })
    .whereIn('role', ['COLLEGE_ADMIN', 'SUPER_ADMIN'])
    .orderBy('id')
    .first();
  const admin: GapActor = adminUser
    ? {
        facultyUserId: Number(adminUser.id),
        collegeId,
        role: String(adminUser.role),
        departmentId: adminUser.department_id,
      }
    : { ...facultyA, role: 'COLLEGE_ADMIN' };

  const course =
    (await db('courses').where({ college_id: collegeId, code: 'BIS701' }).first()) ||
    (await db('courses').where({ college_id: collegeId }).andWhere('name', 'like', '%Big Data%').first());
  if (!course) throw new Error('BIS701 course missing — run npm run seed:academic-master');

  const master =
    (await db('gap_masters').where({ college_id: collegeId, course_code: 'BIS701', is_active: true }).first()) ||
    (await db('gap_masters').whereNull('college_id').where({ course_code: 'BIS701', is_active: true }).first());
  if (!master) throw new Error('BIS701 gap master missing — run npm run seed:academic-master');

  const year = await db('academic_years').where({ college_id: collegeId }).orderBy('id', 'desc').first();
  if (!year) throw new Error('No academic year');

  // Clean prior E2E analyses for this pair
  const prior = await db('faculty_gap_analyses')
    .where({
      college_id: collegeId,
      created_by: facultyA.facultyUserId,
      course_id: course.id,
      academic_year_id: year.id,
    })
    .select('id');
  for (const p of prior) {
    await db('faculty_gap_analyses').where({ id: p.id }).del();
  }

  const input = {
    courseId: Number(course.id),
    academicYearId: Number(year.id),
    programId: null,
    semesterId: null as number | null,
    schemeId: course.scheme_id ? Number(course.scheme_id) : null,
  };

  const preview = await gap.previewGeneration(facultyA, input);
  console.log('Preview found:', preview.found, 'gaps:', preview.counts?.masterGaps);
  if (!preview.found) throw new Error('Expected master for BIS701');

  const created = await gap.createFromMaster(facultyA, input);
  console.log('Created analysis', created.id, 'items', created.items.length);
  if (created.items.length !== 3) throw new Error(`Expected 3 gaps, got ${created.items.length}`);

  // Duplicate protection
  let dupOk = false;
  try {
    await gap.createFromMaster(facultyA, input);
  } catch (e) {
    dupOk = (e as { code?: string }).code === 'DUPLICATE_GAP_ANALYSIS' || (e as { status?: number }).status === 409;
  }
  if (!dupOk) throw new Error('Expected duplicate protection');

  // Ownership: Faculty B cannot mutate
  const ownership = { collegeId, createdBy: facultyA.facultyUserId };
  if (decideGapAnalysisAccess(facultyB, ownership) !== 'FORBIDDEN') {
    throw new Error('Faculty B should be forbidden');
  }
  if (decideGapAnalysisAccess(admin, ownership) !== 'ALLOW') {
    throw new Error('Admin should allow');
  }

  const item1 = created.items[0];
  const item2 = created.items[1];

  let detail = await gap.updateCoverage(created.id, item1.id, facultyA, { actualCoverageLevel: 2 });
  console.log('Coverage updated', detail.items[0].actualCoverageLevel, detail.items[0].coveragePercent);

  detail = await gap.addAction(created.id, item1.id, facultyA, {
    actionType: 'HANDS_ON_LAB',
    title: 'Hands-on HDFS Operations Lab',
    plannedDate: '2026-09-01',
    expectedOutcome: 'Students perform HDFS ops',
    fromMasterRecommendation: true,
  });
  const actionId = detail.items.find((i) => i.id === item1.id)!.actions[0].id;
  detail = await gap.updateAction(created.id, actionId, facultyA, {
    status: 'COMPLETED',
    actualDate: '2026-09-02',
    actualOutcome: 'Lab completed with attendance',
    participants: 42,
  });

  detail = await gap.addEvidence(created.id, facultyA, {
    evidenceType: 'ATTENDANCE',
    title: 'Attendance Sheet',
    externalUrl: 'https://example.com/attendance.pdf',
    itemId: item1.id,
    actionId,
  });

  detail = await gap.closeGap(created.id, item1.id, facultyA, {
    closureNote: 'Lab completed; coverage restored to adequate.',
    actualCoverageLevel: 3,
    finalCoverageLevel: 3,
    actualOutcome: 'Students demonstrated HDFS operations',
  });
  const closed = detail.items.find((i) => i.id === item1.id)!;
  if (closed.itemStatus !== 'CLOSED') throw new Error('Gap 1 should be closed');

  detail = await gap.updateApplicability(created.id, item2.id, facultyA, {
    applicability: 'NOT_APPLICABLE',
    reason: 'Covered through department mandatory laboratory component.',
  });
  const na = detail.items.find((i) => i.id === item2.id)!;
  if (na.applicability !== 'NOT_APPLICABLE') throw new Error('Gap 2 should be NA');

  // Snapshot immutability: change master statement, existing analysis unchanged
  const originalStatement = item1.gapStatement;
  await db('gap_masters').where({ gap_id: item1.gapId }).update({
    gap_statement: `${master.gap_statement} [MUTATED FOR TEST]`,
  });
  detail = await gap.getAnalysis(created.id, collegeId);
  const still = detail.items.find((i) => i.gapId === item1.gapId)!;
  if (still.gapStatement !== originalStatement) {
    throw new Error('Snapshot mutated after master change');
  }
  await db('gap_masters').where({ gap_id: item1.gapId }).update({ gap_statement: originalStatement });

  const print = buildPrintModel(detail);
  if (print.preparedBy !== detail.preparedBy) throw new Error('Print preparedBy mismatch');
  const xlsx = await exportGapAnalysisXlsx(created.id, collegeId);
  if (!xlsx.filename.toLowerCase().includes('gap-analysis')) throw new Error('Bad export filename');
  console.log('Export filename:', xlsx.filename, 'bytes', xlsx.body.length);

  // Cannot complete while gap 3 open
  let blocked = false;
  try {
    await gap.completeAnalysis(created.id, facultyA);
  } catch {
    blocked = true;
  }
  if (!blocked) throw new Error('Complete should fail with open gaps');

  // Close remaining applicable gap
  const item3 = detail.items.find((i) => i.applicability === 'APPLICABLE' && i.itemStatus !== 'CLOSED')!;
  detail = await gap.updateCoverage(created.id, item3.id, facultyA, { actualCoverageLevel: 3 });
  detail = await gap.closeGap(created.id, item3.id, facultyA, {
    closureNote: 'Addressed via enrichment activity',
    actualCoverageLevel: 3,
    alternativeCoverageExplanation: 'Covered via existing workshop series already delivered this semester.',
  });
  detail = await gap.completeAnalysis(created.id, facultyA);
  if (detail.status !== 'COMPLETED') throw new Error('Analysis should be completed');

  console.log('E2E Gap Analysis OK');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
