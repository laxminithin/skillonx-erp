import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { HrActor } from './types.js';
import { assertHrPermission, hasHrPermission } from './access.js';
import { recordHrAudit } from './audit.js';
import { randomBytes } from 'node:crypto';
import {
  OPENING_TRANSITIONS,
  type OpeningStatus,
  type Row,
  createOpeningSchema,
  updateOpeningSchema,
} from './recruitmentTypes.js';
import {
  assertDeptScope,
  assertRecruitmentTransition,
  ensureRecruitmentDefaults,
  hodDepartmentIds,
  isHodActor,
} from './recruitmentAccess.js';

function nextOpeningCode() {
  return `JOB-${Date.now()}-${randomBytes(3).toString('hex')}`.slice(0, 48);
}

export function serializeOpening(row: Row, publicView = false) {
  const base = {
    id: Number(row.id),
    collegeId: Number(row.college_id),
    requisitionId: row.requisition_id != null ? Number(row.requisition_id) : null,
    code: row.code,
    title: row.title,
    departmentId: Number(row.department_id),
    designationId: Number(row.designation_id),
    employmentTypeId: Number(row.employment_type_id),
    headcount: Number(row.headcount),
    joinedCount: Number(row.joined_count ?? 0),
    remainingHeadcount: Math.max(0, Number(row.headcount) - Number(row.joined_count ?? 0)),
    location: row.location,
    description: row.description,
    responsibilities: row.responsibilities,
    qualification: row.qualification,
    experience: row.experience,
    skills: parseSkills(row.skills),
    applicationStart: row.application_start,
    applicationDeadline: row.application_deadline,
    status: row.status,
    jobCategory: row.job_category,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (publicView) {
    const { joinedCount: _j, remainingHeadcount: _r, ...pub } = base;
    return pub;
  }
  return base;
}

function parseSkills(skills: unknown) {
  if (skills == null) return null;
  if (Array.isArray(skills)) return skills;
  const s = String(skills);
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* plain text */
  }
  return s;
}

function skillsToStore(skills: string | string[] | null | undefined) {
  if (skills == null) return null;
  if (Array.isArray(skills)) return JSON.stringify(skills);
  return skills;
}

async function loadOpening(actor: HrActor, id: number) {
  const row = await db('hr_job_openings').where({ id, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Job opening not found');
  return row;
}

export async function createOpening(actor: HrActor, raw: unknown) {
  assertHrPermission(actor, 'hr.recruitment.manage');
  await ensureRecruitmentDefaults(actor.collegeId);
  const input = createOpeningSchema.parse(raw);
  assertDeptScope(actor, input.departmentId, 'hr.recruitment.manage');

  let headcount = input.headcount;
  if (input.requisitionId) {
    const req = await db('hr_recruitment_requisitions')
      .where({ id: input.requisitionId, college_id: actor.collegeId })
      .first();
    if (!req) throw new AppError(404, 'Requisition not found');
    if (!['APPROVED', 'OPENED'].includes(String(req.status))) {
      throw new AppError(400, 'Requisition must be APPROVED or OPENED', undefined, 'REQUISITION_NOT_OPENABLE');
    }
    const approved = Number(req.approved_headcount ?? req.requested_headcount);
    const used = await db('hr_job_openings')
      .where({ requisition_id: input.requisitionId })
      .whereNotIn('status', ['CANCELLED'])
      .sum({ total: 'headcount' })
      .first();
    const already = Number((used as Row)?.total ?? 0);
    if (already + headcount > approved) {
      throw new AppError(400, 'Opening headcount exceeds requisition approved headcount', undefined, 'HEADCOUNT_EXCEEDED');
    }
  }

  return db.transaction(async (trx) => {
    const code = input.code ?? nextOpeningCode();
    const [id] = await trx('hr_job_openings').insert({
      college_id: actor.collegeId,
      requisition_id: input.requisitionId ?? null,
      code,
      title: input.title,
      department_id: input.departmentId,
      designation_id: input.designationId,
      employment_type_id: input.employmentTypeId,
      headcount,
      joined_count: 0,
      location: input.location ?? null,
      description: input.description ?? null,
      responsibilities: input.responsibilities ?? null,
      qualification: input.qualification ?? null,
      experience: input.experience ?? null,
      skills: skillsToStore(input.skills),
      application_start: input.applicationStart ?? null,
      application_deadline: input.applicationDeadline ?? null,
      status: 'DRAFT',
      job_category: input.jobCategory ?? null,
      created_by: actor.facultyUserId,
    });

    let rounds = input.rounds;
    if (!rounds?.length) {
      const tpl = await trx('hr_interview_round_templates')
        .where({ college_id: actor.collegeId, code: 'DEFAULT', is_active: true })
        .first();
      if (tpl) {
        const items = await trx('hr_interview_round_template_items')
          .where({ template_id: tpl.id })
          .orderBy('sequence');
        rounds = items.map((it: Row) => ({
          name: String(it.name),
          sequence: Number(it.sequence),
          roundType: String(it.round_type),
          required: Boolean(it.required),
          evaluationTemplate: it.evaluation_criteria,
        }));
      }
    }
    if (rounds?.length) {
      for (const [i, r] of rounds.entries()) {
        await trx('hr_job_interview_rounds').insert({
          college_id: actor.collegeId,
          opening_id: id,
          name: r.name,
          sequence: r.sequence ?? i + 1,
          round_type: r.roundType ?? 'TECHNICAL',
          required: r.required ?? true,
          evaluation_template_json: r.evaluationTemplate
            ? JSON.stringify(r.evaluationTemplate)
            : null,
        });
      }
    }

    if (input.requisitionId) {
      const req = await trx('hr_recruitment_requisitions').where({ id: input.requisitionId }).first();
      if (req && String(req.status) === 'APPROVED') {
        await trx('hr_recruitment_requisitions').where({ id: input.requisitionId }).update({ status: 'OPENED' });
      }
    }

    const row = await trx('hr_job_openings').where({ id }).first();
    await recordHrAudit({
      actor,
      action: 'OPENING_CREATED',
      entityType: 'hr_job_openings',
      entityId: id,
      after: serializeOpening(row!),
    });
    return serializeOpening(row!);
  });
}

export async function updateOpening(actor: HrActor, id: number, raw: unknown) {
  assertHrPermission(actor, 'hr.recruitment.manage');
  const existing = await loadOpening(actor, id);
  if (!['DRAFT', 'PAUSED'].includes(String(existing.status))) {
    throw new AppError(400, 'Opening is not editable in current status', undefined, 'OPENING_NOT_EDITABLE');
  }
  const input = updateOpeningSchema.parse(raw);
  const updates: Row = {};
  if (input.title != null) updates.title = input.title;
  if (input.departmentId != null) updates.department_id = input.departmentId;
  if (input.designationId != null) updates.designation_id = input.designationId;
  if (input.employmentTypeId != null) updates.employment_type_id = input.employmentTypeId;
  if (input.headcount != null) {
    if (input.headcount < Number(existing.joined_count ?? 0)) {
      throw new AppError(400, 'Headcount cannot be below joined count', undefined, 'HEADCOUNT_BELOW_JOINED');
    }
    updates.headcount = input.headcount;
  }
  if (input.location !== undefined) updates.location = input.location;
  if (input.description !== undefined) updates.description = input.description;
  if (input.responsibilities !== undefined) updates.responsibilities = input.responsibilities;
  if (input.qualification !== undefined) updates.qualification = input.qualification;
  if (input.experience !== undefined) updates.experience = input.experience;
  if (input.skills !== undefined) updates.skills = skillsToStore(input.skills);
  if (input.applicationStart !== undefined) updates.application_start = input.applicationStart;
  if (input.applicationDeadline !== undefined) updates.application_deadline = input.applicationDeadline;
  if (input.jobCategory !== undefined) updates.job_category = input.jobCategory;
  if (Object.keys(updates).length) await db('hr_job_openings').where({ id }).update(updates);
  return serializeOpening(await loadOpening(actor, id));
}

async function transitionOpening(actor: HrActor, id: number, to: OpeningStatus, extra: Row = {}) {
  assertHrPermission(actor, 'hr.recruitment.manage');
  const row = await loadOpening(actor, id);
  const from = String(row.status) as OpeningStatus;
  assertRecruitmentTransition('OPENING', from, to, OPENING_TRANSITIONS[from] ?? []);
  await db('hr_job_openings').where({ id }).update({ status: to, ...extra });
  const after = await loadOpening(actor, id);
  await recordHrAudit({
    actor,
    action: `OPENING_${to}`,
    entityType: 'hr_job_openings',
    entityId: id,
    before: { status: from },
    after: serializeOpening(after),
  });
  return serializeOpening(after);
}

export async function publishOpening(actor: HrActor, id: number) {
  return transitionOpening(actor, id, 'PUBLISHED', { published_at: db.fn.now() });
}

export async function pauseOpening(actor: HrActor, id: number) {
  return transitionOpening(actor, id, 'PAUSED');
}

export async function resumeOpening(actor: HrActor, id: number) {
  return transitionOpening(actor, id, 'PUBLISHED');
}

export async function closeOpening(actor: HrActor, id: number) {
  return transitionOpening(actor, id, 'CLOSED');
}

export async function cancelOpening(actor: HrActor, id: number) {
  return transitionOpening(actor, id, 'CANCELLED');
}

export async function getOpening(actor: HrActor, id: number) {
  assertHrPermission(actor, 'hr.recruitment.view');
  const row = await loadOpening(actor, id);
  assertDeptScope(actor, Number(row.department_id));
  const rounds = await db('hr_job_interview_rounds').where({ opening_id: id }).orderBy('sequence');
  return {
    ...serializeOpening(row),
    rounds: rounds.map((r: Row) => ({
      id: Number(r.id),
      name: r.name,
      sequence: Number(r.sequence),
      roundType: r.round_type,
      required: Boolean(r.required),
      evaluationTemplate: r.evaluation_template_json
        ? typeof r.evaluation_template_json === 'string'
          ? JSON.parse(String(r.evaluation_template_json))
          : r.evaluation_template_json
        : null,
    })),
  };
}

export async function listOpenings(actor: HrActor, status?: string) {
  assertHrPermission(actor, 'hr.recruitment.view');
  let q = db('hr_job_openings').where({ college_id: actor.collegeId });
  if (status) q = q.andWhere({ status });
  if (isHodActor(actor) && !hasHrPermission(actor, 'hr.recruitment.manage')) {
    const depts = hodDepartmentIds(actor);
    if (!depts.length) return [];
    q = q.whereIn('department_id', depts);
  }
  const rows = await q.orderBy('id', 'desc');
  return rows.map((r) => serializeOpening(r));
}

export async function countJoinedForOpening(trx: import('knex').Knex | import('knex').Knex.Transaction, openingId: number) {
  const row = await trx('hr_recruitment_applications')
    .where({ opening_id: openingId, status: 'JOINED' })
    .count({ c: '*' })
    .first();
  return Number((row as Row)?.c ?? 0);
}

export async function assertHeadcountAvailable(
  trx: import('knex').Knex | import('knex').Knex.Transaction,
  openingId: number,
) {
  const opening = await trx('hr_job_openings').where({ id: openingId }).forUpdate().first();
  if (!opening) throw new AppError(404, 'Job opening not found');
  if (['CLOSED', 'CANCELLED'].includes(String(opening.status))) {
    throw new AppError(400, 'Opening is not open for joining', undefined, 'OPENING_NOT_JOINABLE');
  }
  const joined = await countJoinedForOpening(trx, openingId);
  if (joined >= Number(opening.headcount) || String(opening.status) === 'FILLED') {
    throw new AppError(409, 'No remaining headcount for this opening', undefined, 'HEADCOUNT_FULL');
  }
  return { opening, joined };
}
