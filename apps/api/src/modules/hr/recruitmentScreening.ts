import { AppError } from '../../utils/errors.js';
import { db } from '../../db/index.js';
import type { HrActor } from './types.js';
import { assertHrPermission } from './access.js';
import { screenApplicationSchema, shortlistSchema, selectCandidateSchema } from './recruitmentTypes.js';
import {
  loadApplication,
  serializeApplication,
  transitionApplication,
  assertApplicationTransition,
} from './recruitmentApplications.js';
import { notifyCandidate } from './recruitmentNotify.js';

export async function screenApplication(actor: HrActor, applicationId: number, raw: unknown) {
  assertHrPermission(actor, 'hr.recruitment.manage');
  const input = screenApplicationSchema.parse(raw);
  const row = await loadApplication(actor, applicationId);
  if (!['APPLIED', 'SCREENING'].includes(String(row.status))) {
    throw new AppError(400, 'Application is not in a screenable state', undefined, 'APPLICATION_NOT_SCREENABLE');
  }
  if (String(row.status) === 'APPLIED') {
    assertApplicationTransition(String(row.status), 'SCREENING');
  }

  if (input.decision === 'SHORTLIST') {
    const after = await transitionApplication(actor, applicationId, 'SHORTLISTED', {
      screened_by: actor.facultyUserId,
      screening_notes: input.notes ?? null,
      screening_decision: 'SHORTLIST',
      screened_at: new Date(),
      shortlist_by: actor.facultyUserId,
      shortlist_reason: input.notes ?? 'Screened and shortlisted',
      shortlisted_at: new Date(),
    });
    await notifyCandidate({
      candidateId: Number(after.candidate_id),
      collegeId: actor.collegeId,
      type: 'APPLICATION_SHORTLISTED',
      title: 'You have been shortlisted',
      body: 'Your application has been shortlisted for the next stage.',
      relatedType: 'hr_recruitment_applications',
      relatedId: applicationId,
      dedupeKey: `shortlist-${applicationId}`,
    });
    return serializeApplication(after, actor);
  }

  if (input.decision === 'REJECT') {
    const after = await transitionApplication(actor, applicationId, 'REJECTED', {
      screened_by: actor.facultyUserId,
      screening_notes: input.notes ?? null,
      screening_decision: 'REJECT',
      screened_at: new Date(),
    });
    await notifyCandidate({
      candidateId: Number(after.candidate_id),
      collegeId: actor.collegeId,
      type: 'APPLICATION_REJECTED',
      title: 'Application update',
      body: 'Your application was not shortlisted at this time.',
      relatedType: 'hr_recruitment_applications',
      relatedId: applicationId,
      dedupeKey: `reject-${applicationId}`,
    });
    return serializeApplication(after, actor);
  }

  // HOLD → move APPLIED→SCREENING; if already SCREENING just update notes
  if (String(row.status) === 'APPLIED') {
    const after = await transitionApplication(actor, applicationId, 'SCREENING', {
      screened_by: actor.facultyUserId,
      screening_notes: input.notes ?? null,
      screening_decision: 'HOLD',
      screened_at: new Date(),
    });
    return serializeApplication(after, actor);
  }
  await db('hr_recruitment_applications').where({ id: applicationId }).update({
    screened_by: actor.facultyUserId,
    screening_notes: input.notes ?? null,
    screening_decision: 'HOLD',
    screened_at: new Date(),
  });
  return serializeApplication(await loadApplication(actor, applicationId), actor);
}

export async function shortlistApplication(actor: HrActor, applicationId: number, raw?: unknown) {
  assertHrPermission(actor, 'hr.recruitment.manage');
  const input = shortlistSchema.parse(raw ?? {});
  const after = await transitionApplication(actor, applicationId, 'SHORTLISTED', {
    shortlist_by: actor.facultyUserId,
    shortlist_reason: input.reason ?? null,
    shortlisted_at: new Date(),
  });
  await notifyCandidate({
    candidateId: Number(after.candidate_id),
    collegeId: actor.collegeId,
    type: 'APPLICATION_SHORTLISTED',
    title: 'You have been shortlisted',
    relatedType: 'hr_recruitment_applications',
    relatedId: applicationId,
    dedupeKey: `shortlist-${applicationId}`,
  });
  return serializeApplication(after, actor);
}

export async function selectApplication(actor: HrActor, applicationId: number, raw?: unknown) {
  assertHrPermission(actor, 'hr.recruitment.manage');
  const input = selectCandidateSchema.parse(raw ?? {});
  const after = await transitionApplication(actor, applicationId, 'SELECTED', {
    selected_by: actor.facultyUserId,
    selection_reason: input.reason ?? null,
    selected_at: new Date(),
  });
  await notifyCandidate({
    candidateId: Number(after.candidate_id),
    collegeId: actor.collegeId,
    type: 'APPLICATION_SELECTED',
    title: 'You have been selected',
    body: 'Congratulations — you have been selected. An offer may follow.',
    relatedType: 'hr_recruitment_applications',
    relatedId: applicationId,
    dedupeKey: `selected-${applicationId}`,
  });
  return serializeApplication(after, actor);
}

export async function moveToInterview(actor: HrActor, applicationId: number) {
  assertHrPermission(actor, 'hr.recruitment.manage');
  const after = await transitionApplication(actor, applicationId, 'INTERVIEW');
  return serializeApplication(after, actor);
}
