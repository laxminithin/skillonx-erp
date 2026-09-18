import { db } from '../../db/index.js';
import type { PlacementActor } from './types.js';
import { assertManagementReadOnly, assertPlacementPermission, getCoordinatorScope } from './access.js';
import { bulkEvaluateEligibility } from './eligibility.js';

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export async function staffDashboard(actor: PlacementActor) {
  assertPlacementPermission(actor, 'placement.view');
  const collegeId = actor.collegeId;
  const [registered, applications, offers, uniquePlaced, openOpps, companies, drives] = await Promise.all([
    db('placement_registrations').where({ college_id: collegeId }).whereIn('status', ['REGISTERED', 'ACTIVE']).count({ c: '*' }).first(),
    db('placement_applications').where({ college_id: collegeId }).count({ c: '*' }).first(),
    db('placement_offers').where({ college_id: collegeId }).count({ c: '*' }).first(),
    db('placement_offers').where({ college_id: collegeId }).whereIn('offer_status', ['ACCEPTED', 'JOINED']).countDistinct({ c: 'student_id' }).first(),
    db('placement_opportunities').where({ college_id: collegeId }).whereIn('status', ['PUBLISHED', 'APPLICATION_OPEN']).count({ c: '*' }).first(),
    db('placement_companies').where({ college_id: collegeId, status: 'ACTIVE' }).count({ c: '*' }).first(),
    db('placement_drives').where({ college_id: collegeId }).count({ c: '*' }).first(),
  ]);

  return {
    registeredStudents: Number(registered?.c ?? 0),
    applications: Number(applications?.c ?? 0),
    totalOffers: Number(offers?.c ?? 0),
    uniqueStudentsPlaced: Number(uniquePlaced?.c ?? 0),
    openOpportunities: Number(openOpps?.c ?? 0),
    companyCount: Number(companies?.c ?? 0),
    driveCount: Number(drives?.c ?? 0),
  };
}

export async function managementAnalytics(actor: PlacementActor, seasonId?: number) {
  assertManagementReadOnly(actor);
  const collegeId = actor.collegeId;

  let regQ = db('placement_registrations').where({ college_id: collegeId }).whereIn('status', ['REGISTERED', 'ACTIVE']);
  if (seasonId) regQ = regQ.andWhere('placement_season_id', seasonId);
  const registered = await regQ.count({ c: '*' }).first();

  const offers = await db('placement_offers').where({ college_id: collegeId });
  const accepted = offers.filter((o) => ['ACCEPTED', 'JOINED'].includes(o.offer_status));
  const uniquePlaced = new Set(accepted.map((o) => o.student_id)).size;
  const ctcValues = accepted.map((o) => Number(o.ctc)).filter((v) => v > 0);

  const applications = await db('placement_applications').where({ college_id: collegeId }).count({ c: '*' }).first();
  const shortlisted = await db('placement_applications').where({ college_id: collegeId, status: 'SHORTLISTED' }).count({ c: '*' }).first();
  const joined = offers.filter((o) => o.offer_status === 'JOINED').length;

  const registeredCount = Number(registered?.c ?? 0);
  const placementRate = registeredCount ? Math.round((uniquePlaced / registeredCount) * 10000) / 100 : 0;

  return {
    registeredPlacementSeeking: registeredCount,
    totalApplications: Number(applications?.c ?? 0),
    shortlisted: Number(shortlisted?.c ?? 0),
    uniqueStudentsPlaced: uniquePlaced,
    totalOffers: offers.length,
    joined,
    notJoined: accepted.length - joined,
    placementPercentage: placementRate,
    denominator: 'registered_placement_seeking_students',
    highestCtc: ctcValues.length ? Math.max(...ctcValues) : null,
    averageCtc: ctcValues.length ? Math.round((ctcValues.reduce((a, b) => a + b, 0) / ctcValues.length) * 100) / 100 : null,
    medianCtc: median(ctcValues),
    internships: offers.filter((o) => o.opportunity_id).length,
  };
}

export async function driveFunnel(actor: PlacementActor, opportunityId: number) {
  assertPlacementPermission(actor, 'placement.report.view');
  const opp = await db('placement_opportunities').where({ id: opportunityId, college_id: actor.collegeId }).first();
  if (!opp) return null;

  const enrolled = await db('academic_class_enrollments as e')
    .join('students as s', 's.id', 'e.student_id')
    .where({ 's.college_id': actor.collegeId, 'e.status': 'APPROVED' })
    .select('s.id');
  const studentIds = enrolled.map((r) => Number(r.id));
  const { eligibleCount } = await bulkEvaluateEligibility(opportunityId, actor.collegeId, studentIds.slice(0, 500));

  const [applied, shortlisted, offered, accepted, joined] = await Promise.all([
    db('placement_applications').where({ opportunity_id: opportunityId }).count({ c: '*' }).first(),
    db('placement_applications').where({ opportunity_id: opportunityId, status: 'SHORTLISTED' }).count({ c: '*' }).first(),
    db('placement_offers').where({ opportunity_id: opportunityId }).count({ c: '*' }).first(),
    db('placement_offers').where({ opportunity_id: opportunityId, offer_status: 'ACCEPTED' }).count({ c: '*' }).first(),
    db('placement_offers').where({ opportunity_id: opportunityId, offer_status: 'JOINED' }).count({ c: '*' }).first(),
  ]);

  return {
    opportunityId,
    eligible: eligibleCount,
    applied: Number(applied?.c ?? 0),
    shortlisted: Number(shortlisted?.c ?? 0),
    offered: Number(offered?.c ?? 0),
    accepted: Number(accepted?.c ?? 0),
    joined: Number(joined?.c ?? 0),
  };
}

export async function coordinatorDashboard(actor: PlacementActor) {
  assertPlacementPermission(actor, 'placement.coordinator.view');
  const scope = await getCoordinatorScope(actor);
  let studentsQ = db('students as s')
    .join('academic_class_enrollments as e', 'e.student_id', 's.id')
    .join('academic_classes as ac', 'ac.id', 'e.academic_class_id')
    .where({ 's.college_id': actor.collegeId, 'e.status': 'APPROVED' });
  if (scope.departmentIds.length) studentsQ = studentsQ.whereIn('ac.department_id', scope.departmentIds);
  if (scope.programIds.length) studentsQ = studentsQ.whereIn('ac.program_id', scope.programIds);
  const students = await studentsQ.select('s.id').groupBy('s.id');
  const studentIds = students.map((s) => Number(s.id));

  const profiles = await db('student_career_profiles')
    .whereIn('student_id', studentIds.length ? studentIds : [0]);
  const incomplete = profiles.filter((p) => Number(p.profile_completion_percentage) < 60).length;
  const placed = profiles.filter((p) => ['PLACED', 'MULTIPLE_OFFERS'].includes(p.placement_status)).length;

  return {
    departmentStudentCount: studentIds.length,
    profileIncomplete: incomplete,
    placedStudents: placed,
    unplacedStudents: studentIds.length - placed,
  };
}

export async function departmentPlacementRates(actor: PlacementActor) {
  assertPlacementPermission(actor, 'placement.report.view');
  const collegeId = actor.collegeId;
  const depts = await db('departments').where({ college_id: collegeId }).select('id', 'name', 'code');
  const rates = [];
  for (const dept of depts) {
    const students = await db('students as s')
      .join('academic_class_enrollments as e', 'e.student_id', 's.id')
      .join('academic_classes as ac', 'ac.id', 'e.academic_class_id')
      .where({ 's.college_id': collegeId, 'e.status': 'APPROVED', 'ac.department_id': dept.id })
      .select('s.id')
      .groupBy('s.id');
    const ids = students.map((s) => Number(s.id));
    const placed = ids.length
      ? await db('placement_offers')
          .where({ college_id: collegeId })
          .whereIn('student_id', ids)
          .whereIn('offer_status', ['ACCEPTED', 'JOINED'])
          .countDistinct({ c: 'student_id' })
          .first()
      : { c: 0 };
    const registered = ids.length
      ? await db('placement_registrations')
          .where({ college_id: collegeId })
          .whereIn('student_id', ids)
          .whereIn('status', ['REGISTERED', 'ACTIVE'])
          .countDistinct({ c: 'student_id' })
          .first()
      : { c: 0 };
    const denom = Number(registered?.c ?? 0);
    const placedCount = Number(placed?.c ?? 0);
    rates.push({
      departmentId: Number(dept.id),
      departmentName: dept.name,
      departmentCode: dept.code,
      registered: denom,
      placed: placedCount,
      placementRate: denom ? Math.round((placedCount / denom) * 10000) / 100 : 0,
    });
  }
  return { departments: rates, denominator: 'registered_placement_seeking_students' };
}

export async function bulkEligibilityReport(actor: PlacementActor, opportunityId: number) {
  assertPlacementPermission(actor, 'placement.view');
  const students = await db('students').where({ college_id: actor.collegeId, is_active: true }).select('id');
  const ids = students.map((s) => Number(s.id));
  return bulkEvaluateEligibility(opportunityId, actor.collegeId, ids);
}
