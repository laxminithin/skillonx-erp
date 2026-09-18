import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { HrActor } from './types.js';
import { assertHrPermission, resolveEmployeeForActor } from './access.js';
import { recordHrAudit } from './audit.js';
import { evaluateInterviewSchema, scheduleInterviewSchema, type Row } from './recruitmentTypes.js';
import { assertInterviewerAccess, canManageRecruitment } from './recruitmentAccess.js';
import { loadApplication, serializeApplication, transitionApplication } from './recruitmentApplications.js';
import { notifyCandidate, notifyRecruitmentEmployee } from './recruitmentNotify.js';

export function serializeInterview(row: Row) {
  return {
    id: Number(row.id),
    collegeId: Number(row.college_id),
    applicationId: Number(row.application_id),
    roundId: Number(row.round_id),
    scheduledAt: row.scheduled_at,
    timezone: row.timezone,
    mode: row.mode,
    locationOrLink: row.location_or_link,
    status: row.status,
    notes: row.notes,
    scheduledBy: row.scheduled_by != null ? Number(row.scheduled_by) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function scheduleInterview(actor: HrActor, applicationId: number, raw: unknown) {
  assertHrPermission(actor, 'hr.recruitment.manage');
  const input = scheduleInterviewSchema.parse(raw);
  const app = await loadApplication(actor, applicationId);
  if (!['SHORTLISTED', 'INTERVIEW', 'SELECTED'].includes(String(app.status))) {
    throw new AppError(400, 'Application is not ready for interview scheduling', undefined, 'APPLICATION_NOT_INTERVIEWABLE');
  }

  const round = await db('hr_job_interview_rounds')
    .where({ id: input.roundId, opening_id: app.opening_id, college_id: actor.collegeId })
    .first();
  if (!round) throw new AppError(404, 'Interview round not found for this opening');

  return db.transaction(async (trx) => {
    if (String(app.status) === 'SHORTLISTED') {
      await trx('hr_recruitment_applications').where({ id: applicationId }).update({ status: 'INTERVIEW' });
    }

    const [id] = await trx('hr_interviews').insert({
      college_id: actor.collegeId,
      application_id: applicationId,
      round_id: input.roundId,
      scheduled_at: new Date(input.scheduledAt),
      timezone: input.timezone ?? 'Asia/Kolkata',
      mode: input.mode,
      location_or_link: input.locationOrLink ?? null,
      status: 'SCHEDULED',
      notes: input.notes ?? null,
      scheduled_by: actor.facultyUserId,
    });

    for (const empId of input.panelEmployeeIds) {
      const emp = await trx('employees').where({ id: empId, college_id: actor.collegeId }).first();
      if (!emp) throw new AppError(400, `Panel employee ${empId} not found`);
      await trx('hr_interview_panel').insert({
        college_id: actor.collegeId,
        interview_id: id,
        employee_id: empId,
        is_external: false,
        status: 'INVITED',
      });
      await notifyRecruitmentEmployee({
        employeeId: empId,
        collegeId: actor.collegeId,
        type: 'INTERVIEW_PANEL_INVITE',
        title: 'Interview panel invitation',
        body: `You are invited to interview panel for application #${applicationId}`,
        relatedType: 'hr_interviews',
        relatedId: id,
        dedupeKey: `panel-${id}-${empId}`,
      });
    }
    for (const ext of input.externalPanel ?? []) {
      await trx('hr_interview_panel').insert({
        college_id: actor.collegeId,
        interview_id: id,
        employee_id: null,
        is_external: true,
        external_name: ext.name,
        external_email: ext.email ?? null,
        status: 'INVITED',
      });
    }

    const row = await trx('hr_interviews').where({ id }).first();
    await recordHrAudit({
      actor,
      action: 'INTERVIEW_SCHEDULED',
      entityType: 'hr_interviews',
      entityId: id,
      after: serializeInterview(row!),
    });
    await notifyCandidate({
      candidateId: Number(app.candidate_id),
      collegeId: actor.collegeId,
      type: 'INTERVIEW_SCHEDULED',
      title: 'Interview scheduled',
      body: `An interview has been scheduled for ${input.scheduledAt}`,
      relatedType: 'hr_interviews',
      relatedId: id,
      dedupeKey: `interview-sched-${id}`,
    });
    return serializeInterview(row!);
  });
}

export async function rescheduleInterview(actor: HrActor, interviewId: number, scheduledAt: string) {
  assertHrPermission(actor, 'hr.recruitment.manage');
  const row = await db('hr_interviews').where({ id: interviewId, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Interview not found');
  if (!['SCHEDULED', 'RESCHEDULED'].includes(String(row.status))) {
    throw new AppError(400, 'Interview cannot be rescheduled', undefined, 'INTERVIEW_NOT_RESCHEDULABLE');
  }
  await db('hr_interviews').where({ id: interviewId }).update({
    scheduled_at: new Date(scheduledAt),
    status: 'RESCHEDULED',
  });
  return serializeInterview((await db('hr_interviews').where({ id: interviewId }).first())!);
}

export async function cancelInterview(actor: HrActor, interviewId: number) {
  assertHrPermission(actor, 'hr.recruitment.manage');
  const row = await db('hr_interviews').where({ id: interviewId, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Interview not found');
  await db('hr_interviews').where({ id: interviewId }).update({ status: 'CANCELLED' });
  return serializeInterview((await db('hr_interviews').where({ id: interviewId }).first())!);
}

export async function getInterview(actor: HrActor, interviewId: number) {
  const interview = await assertInterviewerAccess(actor, interviewId);
  const panel = await db('hr_interview_panel').where({ interview_id: interviewId });
  const evaluations = await db('hr_interview_evaluations').where({ interview_id: interviewId });
  const canSeePrivate = canManageRecruitment(actor);
  return {
    ...serializeInterview(interview),
    panel: panel.map((p: Row) => ({
      id: Number(p.id),
      employeeId: p.employee_id != null ? Number(p.employee_id) : null,
      isExternal: Boolean(p.is_external),
      externalName: p.external_name,
      externalEmail: p.external_email,
      status: p.status,
    })),
    evaluations: evaluations.map((e: Row) => ({
      id: Number(e.id),
      employeeId: e.employee_id != null ? Number(e.employee_id) : null,
      overallScore: e.overall_score != null ? Number(e.overall_score) : null,
      comments: e.comments,
      privateNotes: canSeePrivate ? e.private_notes : undefined,
      recommendation: e.recommendation,
      scores: e.scores_json
        ? typeof e.scores_json === 'string'
          ? JSON.parse(String(e.scores_json))
          : e.scores_json
        : null,
      submittedAt: e.submitted_at,
    })),
  };
}

export async function submitEvaluation(actor: HrActor, interviewId: number, raw: unknown) {
  const input = evaluateInterviewSchema.parse(raw);
  const interview = await assertInterviewerAccess(actor, interviewId);
  const emp = await resolveEmployeeForActor(actor);
  if (!emp && !canManageRecruitment(actor)) {
    throw new AppError(403, 'Only panel members can evaluate');
  }
  let panelMember = emp
    ? await db('hr_interview_panel').where({ interview_id: interviewId, employee_id: emp.id }).first()
    : null;
  if (!panelMember && canManageRecruitment(actor) && emp) {
    const [pid] = await db('hr_interview_panel').insert({
      college_id: actor.collegeId,
      interview_id: interviewId,
      employee_id: emp.id,
      is_external: false,
      status: 'ACCEPTED',
    });
    panelMember = await db('hr_interview_panel').where({ id: pid }).first();
  }
  if (!emp) throw new AppError(403, 'Employee record required to evaluate');

  const existing = await db('hr_interview_evaluations')
    .where({ interview_id: interviewId, employee_id: emp.id })
    .first();
  const payload = {
    college_id: actor.collegeId,
    interview_id: interviewId,
    panel_member_id: panelMember ? Number(panelMember.id) : null,
    employee_id: emp.id,
    scores_json: input.scores ? JSON.stringify(input.scores) : null,
    overall_score: input.overallScore ?? null,
    comments: input.comments ?? null,
    private_notes: input.privateNotes ?? null,
    recommendation: input.recommendation,
    submitted_at: new Date(),
  };
  if (existing) {
    await db('hr_interview_evaluations').where({ id: existing.id }).update(payload);
  } else {
    await db('hr_interview_evaluations').insert(payload);
  }
  await db('hr_interview_panel')
    .where({ interview_id: interviewId, employee_id: emp.id })
    .update({ status: 'COMPLETED' });

  await recordHrAudit({
    actor,
    action: 'INTERVIEW_EVALUATION_SUBMITTED',
    entityType: 'hr_interviews',
    entityId: interviewId,
    after: { recommendation: input.recommendation, employeeId: emp.id },
  });
  return getInterview(actor, interviewId);
}

export async function completeInterview(actor: HrActor, interviewId: number, outcome?: 'NO_SHOW') {
  assertHrPermission(actor, 'hr.recruitment.manage');
  const row = await db('hr_interviews').where({ id: interviewId, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Interview not found');
  const status = outcome === 'NO_SHOW' ? 'NO_SHOW' : 'COMPLETED';
  await db('hr_interviews').where({ id: interviewId }).update({ status });
  if (outcome === 'NO_SHOW') {
    await transitionApplication(actor, Number(row.application_id), 'NO_SHOW');
  }
  return serializeInterview((await db('hr_interviews').where({ id: interviewId }).first())!);
}

export async function listInterviewsForApplication(actor: HrActor, applicationId: number) {
  assertHrPermission(actor, 'hr.recruitment.view');
  await loadApplication(actor, applicationId);
  const rows = await db('hr_interviews')
    .where({ application_id: applicationId, college_id: actor.collegeId })
    .orderBy('scheduled_at');
  return rows.map(serializeInterview);
}

export async function listMyPanelInterviews(actor: HrActor) {
  const emp = await resolveEmployeeForActor(actor);
  if (!emp) return [];
  const rows = await db('hr_interviews as i')
    .join('hr_interview_panel as p', 'p.interview_id', 'i.id')
    .where({ 'p.employee_id': emp.id, 'i.college_id': actor.collegeId })
    .select('i.*')
    .orderBy('i.scheduled_at', 'desc');
  return rows.map(serializeInterview);
}
