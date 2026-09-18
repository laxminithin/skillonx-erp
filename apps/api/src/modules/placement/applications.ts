import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { PlacementActor } from './types.js';
import { assertPlacementCollege, assertPlacementPermission, assertCoordinatorStudentAccess, isCollegeTpOperator, getCoordinatorScope } from './access.js';
import { recordPlacementAudit } from './audit.js';
import { evaluatePlacementEligibility } from './eligibility.js';
import { getStudentPlacementAcademicProfile } from './academicProfile.js';
import { buildResumeSnapshot } from './resume.js';
import { notifyPlacementEvent } from './notifications.js';
import { todayInTimezone } from '../timetable/time.js';

let appSeq = 0;

function parseJsonColumn(value: unknown) {
  if (value == null) return null;
  if (typeof value === 'string') return JSON.parse(value);
  return value;
}

async function nextApplicationNumber(collegeId: number, trx: typeof db) {
  const year = new Date().getFullYear();
  appSeq += 1;
  const count = await trx('placement_applications')
    .where({ college_id: collegeId })
    .whereRaw('application_number LIKE ?', [`SX/PLC/${year}/%`])
    .count({ c: '*' })
    .first();
  const seq = String(Number(count?.c ?? 0) + 1 + appSeq).padStart(6, '0');
  return `SX/PLC/${year}/${seq}`;
}

export async function listStudentOpportunities(studentId: number, collegeId: number, filter?: string) {
  const rows = await db('placement_opportunities as o')
    .join('placement_companies as c', 'c.id', 'o.company_id')
    .where({ 'o.college_id': collegeId })
    .whereIn('o.status', ['PUBLISHED', 'APPLICATION_OPEN', 'APPLICATION_CLOSED', 'IN_PROCESS'])
    .select('o.*', 'c.name as company_name', 'c.logo_reference')
    .orderBy('o.deadline', 'asc');

  const applied = await db('placement_applications')
    .where({ student_id: studentId })
    .select('opportunity_id', 'status');
  const appliedMap = new Map(applied.map((a) => [Number(a.opportunity_id), a.status]));

  const enriched = [];
  for (const row of rows) {
    const eligibility = await evaluatePlacementEligibility(studentId, Number(row.id), collegeId);
    const item = serializeOpportunity(row, eligibility, appliedMap.get(Number(row.id)));
    if (filter === 'eligible' && eligibility.status === 'NOT_ELIGIBLE') continue;
    if (filter === 'applied' && !appliedMap.has(Number(row.id))) continue;
    enriched.push(item);
  }
  return enriched;
}

export async function getStudentOpportunity(studentId: number, collegeId: number, opportunityId: number) {
  const row = await db('placement_opportunities as o')
    .join('placement_companies as c', 'c.id', 'o.company_id')
    .where({ 'o.id': opportunityId, 'o.college_id': collegeId })
    .select('o.*', 'c.name as company_name', 'c.description as company_description', 'c.website as company_website')
    .first();
  if (!row) throw new AppError(404, 'Opportunity not found');

  const rules = await db('placement_eligibility_rules').where({ opportunity_id: opportunityId });
  const locations = await db('placement_opportunity_locations').where({ opportunity_id: opportunityId });
  const eligibility = await evaluatePlacementEligibility(studentId, opportunityId, collegeId);
  const application = await db('placement_applications')
    .where({ student_id: studentId, opportunity_id: opportunityId })
    .first();

  return {
    ...serializeOpportunity(row, eligibility, application?.status),
    description: row.description,
    companyDescription: row.company_description,
    companyWebsite: row.company_website,
    bondDetails: row.bond_details,
    instructions: row.instructions,
    eligibilityRules: rules,
    locations,
    eligibility,
    application: application
      ? { id: Number(application.id), status: application.status, applicationNumber: application.application_number }
      : null,
  };
}

function serializeOpportunity(row: Record<string, unknown>, eligibility: Awaited<ReturnType<typeof evaluatePlacementEligibility>>, applicationStatus?: string) {
  return {
    id: Number(row.id),
    companyId: Number(row.company_id),
    companyName: row.company_name,
    title: row.title,
    role: row.role,
    opportunityType: row.opportunity_type,
    workMode: row.work_mode,
    ctcMin: row.ctc_min != null ? Number(row.ctc_min) : null,
    ctcMax: row.ctc_max != null ? Number(row.ctc_max) : null,
    stipend: row.stipend != null ? Number(row.stipend) : null,
    currency: row.currency,
    deadline: row.deadline,
    driveDate: row.drive_date,
    status: row.status,
    eligibilityStatus: eligibility.status,
    eligibilityReasons: eligibility.reasons,
    applicationStatus: applicationStatus ?? null,
  };
}

const APPLICATION_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['APPLIED', 'WITHDRAWN'],
  APPLIED: ['SHORTLISTED', 'REJECTED', 'WITHDRAWN', 'IN_PROCESS', 'ELIGIBLE'],
  ELIGIBLE: ['SHORTLISTED', 'REJECTED', 'IN_PROCESS'],
  SHORTLISTED: ['TEST', 'INTERVIEW', 'REJECTED', 'IN_PROCESS', 'SELECTED'],
  TEST: ['INTERVIEW', 'REJECTED', 'SHORTLISTED', 'IN_PROCESS'],
  INTERVIEW: ['SELECTED', 'REJECTED', 'IN_PROCESS'],
  IN_PROCESS: ['SHORTLISTED', 'TEST', 'INTERVIEW', 'SELECTED', 'REJECTED', 'OFFERED'],
  SELECTED: ['OFFERED', 'REJECTED'],
  OFFERED: ['JOINED', 'NOT_JOINED', 'ACCEPTED'],
  REJECTED: [],
  WITHDRAWN: ['APPLIED'],
  ACCEPTED: ['JOINED', 'NOT_JOINED'],
  JOINED: [],
  NOT_JOINED: [],
};

function deadlineHasPassed(deadline: unknown) {
  if (deadline == null || deadline === '') return false;
  const day = String(deadline).slice(0, 10);
  const today = todayInTimezone('Asia/Kolkata');
  return day < today;
}

export async function applyToOpportunity(
  studentId: number,
  collegeId: number,
  opportunityId: number,
  resumeVersionId?: number,
) {
  const eligibility = await evaluatePlacementEligibility(studentId, opportunityId, collegeId);
  if (eligibility.status === 'NOT_ELIGIBLE') {
    throw new AppError(403, 'Not eligible for this opportunity', { reasons: eligibility.reasons }, 'NOT_ELIGIBLE');
  }

  const academic = await getStudentPlacementAcademicProfile(studentId, collegeId);
  const resumeSnapshot = await buildResumeSnapshot(studentId, collegeId, resumeVersionId);
  const eligibilitySnapshot = { evaluatedAt: new Date().toISOString(), ...eligibility, academic };

  try {
    return await db.transaction(async (trx) => {
      const opp = await trx('placement_opportunities')
        .where({ id: opportunityId, college_id: collegeId })
        .forUpdate()
        .first();
      if (!opp || !['PUBLISHED', 'APPLICATION_OPEN'].includes(String(opp.status))) {
        throw new AppError(404, 'Opportunity not open for applications');
      }
      if (deadlineHasPassed(opp.deadline)) {
        throw new AppError(400, 'Application deadline has passed', undefined, 'DEADLINE_PASSED');
      }

      const existing = await trx('placement_applications')
        .where({ student_id: studentId, opportunity_id: opportunityId })
        .forUpdate()
        .first();
      if (existing && existing.status !== 'DRAFT' && existing.status !== 'WITHDRAWN') {
        throw new AppError(409, 'Application already exists', undefined, 'DUPLICATE_APPLICATION');
      }

      const appNumber = await nextApplicationNumber(collegeId, trx);
      const payload = {
        college_id: collegeId,
        student_id: studentId,
        opportunity_id: opportunityId,
        application_number: appNumber,
        status: 'APPLIED',
        applied_at: trx.fn.now(),
        resume_version_id: resumeVersionId ?? null,
        resume_snapshot: JSON.stringify(resumeSnapshot),
        eligibility_snapshot: JSON.stringify(eligibilitySnapshot),
        updated_at: trx.fn.now(),
      };

      let appId: number;
      if (existing) {
        await trx('placement_applications').where({ id: existing.id }).update(payload);
        appId = Number(existing.id);
      } else {
        const [id] = await trx('placement_applications').insert(payload);
        appId = Number(id);
      }

      await notifyPlacementEvent({
        studentId,
        collegeId,
        type: 'PLACEMENT_APPLICATION_SUBMITTED',
        title: 'Application submitted',
        body: `Your application ${appNumber} has been submitted.`,
        link: `/lms/placements/applications/${appId}`,
        relatedType: 'placement_application',
        relatedId: appId,
      });

      return trx('placement_applications').where({ id: appId }).first();
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'ER_DUP_ENTRY' || code === 'DUPLICATE_APPLICATION') {
      throw new AppError(409, 'Application already exists', undefined, 'DUPLICATE_APPLICATION');
    }
    throw err;
  }
}

export async function listStudentApplications(studentId: number, collegeId: number) {
  const rows = await db('placement_applications as a')
    .join('placement_opportunities as o', 'o.id', 'a.opportunity_id')
    .join('placement_companies as c', 'c.id', 'o.company_id')
    .where({ 'a.student_id': studentId, 'a.college_id': collegeId })
    .select('a.*', 'o.title', 'o.role', 'c.name as company_name')
    .orderBy('a.applied_at', 'desc');
  return rows.map((r) => ({
    id: Number(r.id),
    applicationNumber: r.application_number,
    status: r.status,
    appliedAt: r.applied_at,
    companyName: r.company_name,
    title: r.title,
    role: r.role,
  }));
}

export async function getStudentApplication(studentId: number, collegeId: number, applicationId: number) {
  const row = await db('placement_applications as a')
    .join('placement_opportunities as o', 'o.id', 'a.opportunity_id')
    .join('placement_companies as c', 'c.id', 'o.company_id')
    .where({ 'a.id': applicationId, 'a.student_id': studentId, 'a.college_id': collegeId })
    .select('a.*', 'o.title', 'o.role', 'c.name as company_name')
    .first();
  if (!row) throw new AppError(404, 'Application not found');

  const rounds = await db('placement_rounds').where({ opportunity_id: row.opportunity_id }).orderBy('round_order');
  const participants = await db('placement_round_participants as p')
    .join('placement_rounds as r', 'r.id', 'p.round_id')
    .where({ 'p.application_id': applicationId })
    .select('p.*', 'r.name as round_name', 'r.round_type', 'r.scheduled_at');

  return {
    id: Number(row.id),
    applicationNumber: row.application_number,
    status: row.status,
    appliedAt: row.applied_at,
    companyName: row.company_name,
    title: row.title,
    role: row.role,
    eligibilitySnapshot: parseJsonColumn(row.eligibility_snapshot),
    rounds: participants.map((p) => ({
      roundName: p.round_name,
      roundType: p.round_type,
      scheduledAt: p.scheduled_at,
      status: p.status,
      result: p.result,
      score: p.score != null ? Number(p.score) : null,
    })),
    upcomingRounds: rounds.filter((r) => r.status === 'PLANNED' || r.status === 'OPEN'),
  };
}

export async function withdrawApplication(studentId: number, collegeId: number, applicationId: number, reason?: string) {
  const app = await db('placement_applications')
    .where({ id: applicationId, student_id: studentId, college_id: collegeId })
    .first();
  if (!app) throw new AppError(404, 'Application not found');
  if (!['APPLIED', 'SHORTLISTED', 'IN_PROCESS'].includes(app.status)) {
    throw new AppError(400, 'Application cannot be withdrawn in current status');
  }
  await db('placement_applications').where({ id: applicationId }).update({
    status: 'WITHDRAWN',
    withdraw_reason: reason ?? null,
    updated_at: db.fn.now(),
  });
  return db('placement_applications').where({ id: applicationId }).first();
}

export async function listStaffApplications(actor: PlacementActor, filters?: { opportunityId?: number; status?: string }) {
  assertPlacementPermission(actor, 'placement.application.manage');
  let q = db('placement_applications as a')
    .join('students as s', 's.id', 'a.student_id')
    .join('placement_opportunities as o', 'o.id', 'a.opportunity_id')
    .join('placement_companies as c', 'c.id', 'o.company_id')
    .where({ 'a.college_id': actor.collegeId })
    .select('a.*', 's.name as student_name', 's.usn', 'o.title', 'c.name as company_name');
  if (!isCollegeTpOperator(actor)) {
    const scope = await getCoordinatorScope(actor);
    if (scope.departmentIds.length) {
      q = q
        .join('academic_class_enrollments as e', function joinEnroll() {
          this.on('e.student_id', 'a.student_id').andOnVal('e.status', 'APPROVED');
        })
        .join('academic_classes as ac', 'ac.id', 'e.academic_class_id')
        .whereIn('ac.department_id', scope.departmentIds);
    }
  }
  if (filters?.opportunityId) q = q.andWhere('a.opportunity_id', filters.opportunityId);
  if (filters?.status) q = q.andWhere('a.status', filters.status);
  const rows = await q.orderBy('a.applied_at', 'desc').limit(500);
  return rows.map((r) => ({
    id: Number(r.id),
    applicationNumber: r.application_number,
    status: r.status,
    studentName: r.student_name,
    usn: r.usn,
    companyName: r.company_name,
    title: r.title,
    appliedAt: r.applied_at,
  }));
}

export async function updateApplicationStatus(
  actor: PlacementActor,
  applicationId: number,
  status: string,
  reason?: string,
) {
  assertPlacementPermission(actor, 'placement.application.manage');
  const before = await assertPlacementCollege('placement_applications', applicationId, actor.collegeId);
  if (!isCollegeTpOperator(actor)) {
    await assertCoordinatorStudentAccess(actor, Number(before.student_id));
  }
  const allowed = APPLICATION_STATUS_TRANSITIONS[String(before.status)] ?? [];
  if (allowed.length && !allowed.includes(status) && status !== before.status) {
    throw new AppError(400, `Invalid application transition ${before.status} → ${status}`, undefined, 'INVALID_APPLICATION_TRANSITION');
  }
  await db('placement_applications').where({ id: applicationId }).update({ status, updated_at: db.fn.now() });

  if (status === 'SHORTLISTED') {
    await notifyPlacementEvent({
      studentId: Number(before.student_id),
      collegeId: actor.collegeId,
      type: 'PLACEMENT_SHORTLISTED',
      title: 'You have been shortlisted',
      body: 'You have been shortlisted for the next round.',
      link: `/lms/placements/applications/${applicationId}`,
      relatedType: 'placement_application',
      relatedId: applicationId,
    });
  }
  if (status === 'INTERVIEW' || status === 'TEST') {
    await notifyPlacementEvent({
      studentId: Number(before.student_id),
      collegeId: actor.collegeId,
      type: status === 'INTERVIEW' ? 'PLACEMENT_INTERVIEW_SCHEDULED' : 'PLACEMENT_TEST_SCHEDULED',
      title: status === 'INTERVIEW' ? 'Interview scheduled' : 'Test scheduled',
      body: 'Please check your placement calendar for details.',
      link: `/lms/placements/applications/${applicationId}`,
      relatedType: 'placement_application',
      relatedId: applicationId,
    });
  }

  await recordPlacementAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'APPLICATION_STATUS_UPDATED',
    entityType: 'placement_application',
    entityId: applicationId,
    beforeState: { status: before.status },
    afterState: { status },
    reason,
  });

  return db('placement_applications').where({ id: applicationId }).first();
}

export async function importShortlist(
  actor: PlacementActor,
  opportunityId: number,
  rows: Array<{ usn: string; roundResult?: string; score?: number }>,
  dryRun = true,
) {
  assertPlacementPermission(actor, 'placement.application.manage');
  await assertPlacementCollege('placement_opportunities', opportunityId, actor.collegeId);

  const errors: string[] = [];
  const updates: Array<{ applicationId: number; usn: string }> = [];

  for (const row of rows) {
    const student = await db('students').where({ usn: row.usn.trim(), college_id: actor.collegeId }).first();
    if (!student) {
      errors.push(`Unknown USN: ${row.usn}`);
      continue;
    }
    const app = await db('placement_applications')
      .where({ student_id: student.id, opportunity_id: opportunityId })
      .first();
    if (!app) {
      errors.push(`Not applied: ${row.usn}`);
      continue;
    }
    updates.push({ applicationId: Number(app.id), usn: row.usn });
  }

  if (dryRun) return { dryRun: true, valid: updates.length, errors };

  for (const u of updates) {
    await updateApplicationStatus(actor, u.applicationId, 'SHORTLISTED', 'Bulk shortlist import');
  }
  await recordPlacementAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'SHORTLIST_IMPORT',
    entityType: 'placement_opportunity',
    entityId: opportunityId,
    afterState: { count: updates.length },
  });
  return { dryRun: false, updated: updates.length, errors };
}
