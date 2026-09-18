import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { HrActor } from './types.js';
import { assertHrPermission } from './access.js';
import { recordHrAudit } from './audit.js';
import { updatePrejoiningTaskSchema, type Row } from './recruitmentTypes.js';
import { ensureRecruitmentDefaults } from './recruitmentAccess.js';
import { loadApplication } from './recruitmentApplications.js';

export function serializePrejoiningTask(row: Row) {
  return {
    id: Number(row.id),
    collegeId: Number(row.college_id),
    applicationId: Number(row.application_id),
    offerId: row.offer_id != null ? Number(row.offer_id) : null,
    itemCode: row.item_code,
    name: row.name,
    status: row.status,
    mandatory: Boolean(row.mandatory),
    itemType: row.item_type,
    documentId: row.document_id != null ? Number(row.document_id) : null,
    notes: row.notes,
    verifiedBy: row.verified_by != null ? Number(row.verified_by) : null,
    verifiedAt: row.verified_at,
    bgvStatus: row.bgv_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function initializePrejoiningTasks(
  actor: HrActor,
  applicationId: number,
  offerId: number,
) {
  await ensureRecruitmentDefaults(actor.collegeId);
  const existing = await db('hr_prejoining_tasks').where({ application_id: applicationId }).first();
  if (existing) return listPrejoiningTasksInternal(applicationId);

  const tpl = await db('hr_prejoining_checklist_templates')
    .where({ college_id: actor.collegeId, code: 'DEFAULT', is_active: true })
    .first();
  if (!tpl) return [];

  const items = await db('hr_prejoining_checklist_items')
    .where({ template_id: tpl.id })
    .orderBy('sort_order');
  for (const item of items) {
    await db('hr_prejoining_tasks').insert({
      college_id: actor.collegeId,
      application_id: applicationId,
      offer_id: offerId,
      item_code: item.code,
      name: item.name,
      status: 'PENDING',
      mandatory: item.mandatory,
      item_type: item.item_type,
      bgv_status: item.item_type === 'BGV' ? 'NOT_STARTED' : null,
    });
  }
  await recordHrAudit({
    actor,
    action: 'PREJOINING_INITIALIZED',
    entityType: 'hr_recruitment_applications',
    entityId: applicationId,
    after: { offerId, taskCount: items.length },
  });
  return listPrejoiningTasksInternal(applicationId);
}

async function listPrejoiningTasksInternal(applicationId: number) {
  const rows = await db('hr_prejoining_tasks').where({ application_id: applicationId }).orderBy('id');
  return rows.map(serializePrejoiningTask);
}

export async function listPrejoiningTasks(actor: HrActor, applicationId: number) {
  assertHrPermission(actor, 'hr.recruitment.view');
  await loadApplication(actor, applicationId);
  return listPrejoiningTasksInternal(applicationId);
}

export async function updatePrejoiningTask(actor: HrActor, taskId: number, raw: unknown) {
  assertHrPermission(actor, 'hr.recruitment.manage');
  const input = updatePrejoiningTaskSchema.parse(raw);
  const task = await db('hr_prejoining_tasks').where({ id: taskId, college_id: actor.collegeId }).first();
  if (!task) throw new AppError(404, 'Pre-joining task not found');

  const updates: Row = {};
  if (input.status != null) {
    updates.status = input.status;
    if (['VERIFIED', 'WAIVED', 'NOT_APPLICABLE'].includes(input.status)) {
      updates.verified_by = actor.facultyUserId;
      updates.verified_at = db.fn.now();
    }
  }
  if (input.notes !== undefined) updates.notes = input.notes;
  if (input.bgvStatus !== undefined) updates.bgv_status = input.bgvStatus;
  if (input.documentId !== undefined) updates.document_id = input.documentId;

  if (Object.keys(updates).length) {
    await db('hr_prejoining_tasks').where({ id: taskId }).update(updates);
  }
  const after = await db('hr_prejoining_tasks').where({ id: taskId }).first();
  await recordHrAudit({
    actor,
    action: 'PREJOINING_TASK_UPDATED',
    entityType: 'hr_prejoining_tasks',
    entityId: taskId,
    after: serializePrejoiningTask(after!),
  });
  return serializePrejoiningTask(after!);
}

export async function assertJoiningReady(applicationId: number, collegeId: number) {
  const tasks = await db('hr_prejoining_tasks').where({ application_id: applicationId, college_id: collegeId });
  if (!tasks.length) {
    throw new AppError(400, 'Pre-joining checklist not initialized', undefined, 'PREJOINING_NOT_READY');
  }
  const incomplete = tasks.filter(
    (t: Row) =>
      Boolean(t.mandatory) &&
      !['VERIFIED', 'WAIVED', 'NOT_APPLICABLE'].includes(String(t.status)),
  );
  if (incomplete.length) {
    throw new AppError(
      400,
      'Mandatory pre-joining tasks incomplete',
      { missing: incomplete.map((t: Row) => t.item_code) },
      'PREJOINING_INCOMPLETE',
    );
  }
  const bgvBad = tasks.find(
    (t: Row) =>
      String(t.item_type) === 'BGV' &&
      Boolean(t.mandatory) &&
      t.bgv_status &&
      !['CLEAR', 'WAIVED'].includes(String(t.bgv_status)) &&
      String(t.status) !== 'WAIVED' &&
      String(t.status) !== 'NOT_APPLICABLE',
  );
  if (bgvBad && !['VERIFIED', 'WAIVED', 'NOT_APPLICABLE'].includes(String(bgvBad.status))) {
    throw new AppError(400, 'Background verification not clear', undefined, 'BGV_NOT_CLEAR');
  }
  return true;
}

export async function listCandidatePrejoiningTasks(collegeId: number, candidateId: number, applicationId: number) {
  const app = await db('hr_recruitment_applications')
    .where({ id: applicationId, college_id: collegeId, candidate_id: candidateId })
    .first();
  if (!app) throw new AppError(404, 'Application not found');
  return listPrejoiningTasksInternal(applicationId);
}
