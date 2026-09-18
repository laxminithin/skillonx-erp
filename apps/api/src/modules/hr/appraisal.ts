/**
 * HRMS Performance & Appraisal orchestration.
 * Evaluation layer over Employee Lifecycle, Academic, Attendance, Survey, T&P.
 * Does not duplicate those engines. Research Management is deferred.
 *
 * Transfer / reviewer policy: resolve reviewer as of
 * cycle.review_cutoff_date ?? cycle.review_end ?? cycle.period_end
 * using employee reporting_manager / department / academic leadership as of that date.
 */
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { HrActor, HrPermission } from './types.js';
import {
  assertHrPermission,
  hasHrPermission,
  requireEmployeeForActor,
  resolveEmployeeForActor,
} from './access.js';
import { recordHrAudit } from './audit.js';
import { notifyEmployee } from './notifications.js';
import {
  APPRAISAL_LOCKED_STATUSES,
  APPRAISAL_TRANSITIONS,
  CYCLE_TRANSITIONS,
  type AppraisalStatus,
  type CycleStatus,
  createCycleSchema,
  createGoalSchema,
  createTemplateSchema,
  updateGoalSchema,
  updateCycleStatusSchema,
  selfAppraisalSchema,
  reviewAppraisalSchema,
  calibrateSchema,
  reopenSchema,
  developmentPlanSchema,
  pipSchema,
  enrollEmployeesSchema,
  goalDecisionSchema,
} from './appraisalTypes.js';
import { computeWeightedScore, mapScoreToRating, roundScore, validateTemplateWeights } from './appraisalScore.js';
import {
  assertCanReviewAppraisal,
  assertCanViewAppraisal,
  resolveAppraisalReviewer,
} from './appraisalReviewer.js';
import { collectEvidenceForEmployee, getSnapshots, snapshotEvidence } from './appraisalEvidence.js';

type Row = Record<string, unknown>;
type Trx = import('knex').Knex.Transaction;

const PERF_MANAGE = 'hr.performance.manage' as HrPermission;
const PERF_VIEW = 'hr.performance.view' as HrPermission;
const PERF_CALIBRATE = 'hr.performance.calibrate' as HrPermission;
const PERF_FINALIZE = 'hr.performance.finalize' as HrPermission;
const PERF_REOPEN = 'hr.performance.reopen' as HrPermission;

/** Normalize MySQL DATE / JS Date / ISO string to YYYY-MM-DD. */
function asYmd(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(value ?? '');
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  return s.slice(0, 10);
}

export async function appraisalSchemaReady(): Promise<boolean> {
  try {
    return (
      (await db.schema.hasTable('hr_appraisal_cycles')) &&
      (await db.schema.hasTable('hr_appraisal_templates')) &&
      (await db.schema.hasTable('hr_employee_appraisals'))
    );
  } catch {
    return false;
  }
}

function assertAppraisalTransition(from: string, to: AppraisalStatus) {
  const allowed = APPRAISAL_TRANSITIONS[from as AppraisalStatus] ?? [];
  if (!allowed.includes(to)) {
    throw new AppError(400, `Invalid appraisal transition ${from} → ${to}`, undefined, 'APPRAISAL_INVALID_TRANSITION');
  }
}

function assertCycleTransition(from: string, to: CycleStatus) {
  const allowed = CYCLE_TRANSITIONS[from as CycleStatus] ?? [];
  if (!allowed.includes(to)) {
    throw new AppError(400, `Invalid cycle transition ${from} → ${to}`, undefined, 'CYCLE_INVALID_TRANSITION');
  }
}

function assertAppraisalMutable(row: Row) {
  if (APPRAISAL_LOCKED_STATUSES.includes(String(row.status) as AppraisalStatus) || String(row.status) === 'LOCKED') {
    throw new AppError(400, 'Appraisal is locked', undefined, 'APPRAISAL_LOCKED');
  }
}

function reviewerCutoff(cycle: Row): string {
  // Transfer policy: resolve reviewer as of review_cutoff_date ?? review_end ?? period_end
  const raw = cycle.review_cutoff_date ?? cycle.review_end ?? cycle.period_end;
  return asYmd(raw);
}

async function loadCycle(actor: HrActor, cycleId: number) {
  const row = await db('hr_appraisal_cycles').where({ id: cycleId, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Appraisal cycle not found');
  return row;
}

async function loadAppraisal(actor: HrActor, id: number) {
  const row = await db('hr_employee_appraisals').where({ id, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Appraisal not found');
  return row;
}

async function loadRatingLevels(scaleId: number | null, collegeId: number) {
  if (!scaleId) return { scaleMax: 5, levels: [] as { score: number; label: string; minScore: number | null; maxScore: number | null }[] };
  const levels = await db('hr_appraisal_rating_levels')
    .where({ scale_id: scaleId, college_id: collegeId })
    .orderBy('sort_order', 'asc');
  const scores = levels.map((l: Row) => Number(l.score));
  const scaleMax = scores.length ? Math.max(...scores) : 5;
  return {
    scaleMax,
    levels: levels.map((l: Row) => ({
      score: Number(l.score),
      label: String(l.label),
      minScore: l.min_score != null ? Number(l.min_score) : null,
      maxScore: l.max_score != null ? Number(l.max_score) : null,
    })),
  };
}

export async function ensureDefaultRatingScale(collegeId: number, actor?: HrActor) {
  if (!(await db.schema.hasTable('hr_appraisal_rating_scales'))) {
    throw new AppError(503, 'Appraisal schema not ready');
  }
  const existing = await db('hr_appraisal_rating_scales')
    .where({ college_id: collegeId, is_active: true })
    .orderBy('is_default', 'desc')
    .first();
  if (existing) return Number(existing.id);

  const [scaleId] = await db('hr_appraisal_rating_scales').insert({
    college_id: collegeId,
    code: 'DEFAULT_5',
    name: '5-Point Scale',
    is_active: true,
    is_default: true,
  });

  const levels = [
    { score: 1, label: 'Unsatisfactory', min_score: 0, max_score: 39.99, sort_order: 1 },
    { score: 2, label: 'Needs Improvement', min_score: 40, max_score: 54.99, sort_order: 2 },
    { score: 3, label: 'Meets Expectations', min_score: 55, max_score: 74.99, sort_order: 3 },
    { score: 4, label: 'Exceeds Expectations', min_score: 75, max_score: 89.99, sort_order: 4 },
    { score: 5, label: 'Outstanding', min_score: 90, max_score: 100, sort_order: 5 },
  ];
  await db('hr_appraisal_rating_levels').insert(
    levels.map((l) => ({
      scale_id: scaleId,
      college_id: collegeId,
      score: l.score,
      label: l.label,
      min_score: l.min_score,
      max_score: l.max_score,
      sort_order: l.sort_order,
    })),
  );

  if (actor) {
    await recordHrAudit({
      actor,
      action: 'APPRAISAL_RATING_SCALE_CREATED',
      entityType: 'hr_appraisal_rating_scales',
      entityId: Number(scaleId),
    });
  }
  return Number(scaleId);
}

function serializeCycle(row: Row) {
  return {
    id: Number(row.id),
    collegeId: Number(row.college_id),
    name: row.name,
    code: row.code,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    goalSettingStart: row.goal_setting_start,
    goalSettingEnd: row.goal_setting_end,
    selfReviewStart: row.self_review_start,
    selfReviewEnd: row.self_review_end,
    reviewStart: row.review_start,
    reviewEnd: row.review_end,
    calibrationStart: row.calibration_start,
    calibrationEnd: row.calibration_end,
    reviewCutoffDate: row.review_cutoff_date,
    status: row.status,
    defaultTemplateId: row.default_template_id != null ? Number(row.default_template_id) : null,
    ratingScaleId: row.rating_scale_id != null ? Number(row.rating_scale_id) : null,
    lockedAt: row.locked_at,
    createdAt: row.created_at,
  };
}

export async function createCycle(actor: HrActor, raw: unknown) {
  assertHrPermission(actor, PERF_MANAGE);
  const input = createCycleSchema.parse(raw);
  if (input.periodEnd < input.periodStart) {
    throw new AppError(400, 'periodEnd must be on or after periodStart');
  }
  const scaleId = input.ratingScaleId ?? (await ensureDefaultRatingScale(actor.collegeId, actor));
  try {
    const [id] = await db('hr_appraisal_cycles').insert({
      college_id: actor.collegeId,
      name: input.name,
      code: input.code,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      goal_setting_start: input.goalSettingStart ?? null,
      goal_setting_end: input.goalSettingEnd ?? null,
      self_review_start: input.selfReviewStart ?? null,
      self_review_end: input.selfReviewEnd ?? null,
      review_start: input.reviewStart ?? null,
      review_end: input.reviewEnd ?? null,
      calibration_start: input.calibrationStart ?? null,
      calibration_end: input.calibrationEnd ?? null,
      review_cutoff_date: input.reviewCutoffDate ?? null,
      rating_scale_id: scaleId,
      default_template_id: input.defaultTemplateId ?? null,
      status: 'DRAFT',
      created_by: actor.facultyUserId,
    });
    await recordHrAudit({
      actor,
      action: 'APPRAISAL_CYCLE_CREATED',
      entityType: 'hr_appraisal_cycles',
      entityId: Number(id),
    });
    return getCycle(actor, Number(id));
  } catch (err: unknown) {
    if (String((err as { code?: string })?.code) === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'Cycle code already exists for this college');
    }
    throw err;
  }
}

export async function listCycles(actor: HrActor) {
  assertHrPermission(actor, PERF_VIEW);
  const rows = await db('hr_appraisal_cycles')
    .where({ college_id: actor.collegeId })
    .orderBy('period_start', 'desc');
  return rows.map((r: Row) => serializeCycle(r));
}

export async function getCycle(actor: HrActor, cycleId: number) {
  assertHrPermission(actor, PERF_VIEW);
  return serializeCycle(await loadCycle(actor, cycleId));
}

export async function updateCycleStatus(actor: HrActor, cycleId: number, raw: unknown) {
  assertHrPermission(actor, PERF_MANAGE);
  const input = updateCycleStatusSchema.parse(raw);
  const cycle = await loadCycle(actor, cycleId);
  if (String(cycle.status) === 'LOCKED') {
    throw new AppError(400, 'Cycle is locked');
  }
  assertCycleTransition(String(cycle.status), input.status);
  await db('hr_appraisal_cycles').where({ id: cycleId }).update({
    status: input.status,
    updated_at: db.fn.now(),
    ...(input.status === 'LOCKED' ? { locked_at: db.fn.now() } : {}),
  });
  await recordHrAudit({
    actor,
    action: 'APPRAISAL_CYCLE_STATUS',
    entityType: 'hr_appraisal_cycles',
    entityId: cycleId,
    before: { status: cycle.status },
    after: { status: input.status },
    reason: input.reason ?? null,
  });
  return getCycle(actor, cycleId);
}

export async function lockCycle(actor: HrActor, cycleId: number) {
  return updateCycleStatus(actor, cycleId, { status: 'LOCKED' });
}

async function insertTemplateTree(
  trx: Trx,
  params: {
    collegeId: number;
    code: string;
    name: string;
    description: string | null;
    totalWeight: number;
    ratingScaleId: number | null;
    selfRatingEnabled: boolean;
    versionNo: number;
    parentTemplateId: number | null;
    status: string;
    createdBy: number;
    sections: ReturnType<typeof createTemplateSchema.parse>['sections'];
    applicability?: ReturnType<typeof createTemplateSchema.parse>['applicability'];
  },
) {
  validateTemplateWeights(params.sections, params.totalWeight);
  const [templateId] = await trx('hr_appraisal_templates').insert({
    college_id: params.collegeId,
    code: params.code,
    name: params.name,
    description: params.description,
    version_no: params.versionNo,
    parent_template_id: params.parentTemplateId,
    status: params.status,
    total_weight: params.totalWeight,
    rating_scale_id: params.ratingScaleId,
    self_rating_enabled: params.selfRatingEnabled,
    created_by: params.createdBy,
    published_at: params.status === 'ACTIVE' ? trx.fn.now() : null,
  });

  for (const [si, section] of params.sections.entries()) {
    const [sectionId] = await trx('hr_appraisal_template_sections').insert({
      template_id: templateId,
      college_id: params.collegeId,
      code: section.code,
      name: section.name,
      weight: section.weight,
      description: section.description ?? null,
      sort_order: section.sortOrder ?? si,
    });
    for (const [ci, crit] of section.criteria.entries()) {
      await trx('hr_appraisal_template_criteria').insert({
        template_id: templateId,
        section_id: sectionId,
        college_id: params.collegeId,
        code: crit.code,
        name: crit.name,
        description: crit.description ?? null,
        weight: crit.weight,
        measurement_type: crit.measurementType,
        target_value: crit.targetValue ?? null,
        self_rating_allowed: crit.selfRatingAllowed ?? true,
        reviewer_rating_allowed: crit.reviewerRatingAllowed ?? true,
        mandatory_evidence: crit.mandatoryEvidence ?? false,
        evidence_source: crit.evidenceSource ?? 'NONE',
        sort_order: crit.sortOrder ?? ci,
      });
    }
  }

  for (const rule of params.applicability ?? []) {
    await trx('hr_appraisal_template_applicability').insert({
      template_id: templateId,
      college_id: params.collegeId,
      employee_category: rule.employeeCategory ?? null,
      department_id: rule.departmentId ?? null,
      designation_id: rule.designationId ?? null,
      employment_type_id: rule.employmentTypeId ?? null,
      capability: rule.capability ?? null,
    });
  }

  return Number(templateId);
}

export async function createTemplate(actor: HrActor, raw: unknown) {
  assertHrPermission(actor, PERF_MANAGE);
  const input = createTemplateSchema.parse(raw);
  const scaleId = input.ratingScaleId ?? (await ensureDefaultRatingScale(actor.collegeId, actor));
  const id = await db.transaction(async (trx) =>
    insertTemplateTree(trx, {
      collegeId: actor.collegeId,
      code: input.code,
      name: input.name,
      description: input.description ?? null,
      totalWeight: input.totalWeight,
      ratingScaleId: scaleId,
      selfRatingEnabled: input.selfRatingEnabled ?? true,
      versionNo: 1,
      parentTemplateId: null,
      status: 'DRAFT',
      createdBy: actor.facultyUserId,
      sections: input.sections,
      applicability: input.applicability,
    }),
  );
  await recordHrAudit({
    actor,
    action: 'APPRAISAL_TEMPLATE_CREATED',
    entityType: 'hr_appraisal_templates',
    entityId: id,
  });
  return getTemplate(actor, id);
}

async function loadTemplateFull(collegeId: number, templateId: number) {
  const tpl = await db('hr_appraisal_templates').where({ id: templateId, college_id: collegeId }).first();
  if (!tpl) throw new AppError(404, 'Template not found');
  const sections = await db('hr_appraisal_template_sections')
    .where({ template_id: templateId, college_id: collegeId })
    .orderBy('sort_order', 'asc');
  const criteria = await db('hr_appraisal_template_criteria')
    .where({ template_id: templateId, college_id: collegeId })
    .orderBy('sort_order', 'asc');
  const applicability = await db('hr_appraisal_template_applicability').where({
    template_id: templateId,
    college_id: collegeId,
  });
  return { tpl, sections, criteria, applicability };
}

function serializeTemplate(tpl: Row, sections: Row[], criteria: Row[], applicability: Row[]) {
  return {
    id: Number(tpl.id),
    code: tpl.code,
    name: tpl.name,
    description: tpl.description,
    versionNo: Number(tpl.version_no),
    parentTemplateId: tpl.parent_template_id != null ? Number(tpl.parent_template_id) : null,
    status: tpl.status,
    totalWeight: Number(tpl.total_weight),
    ratingScaleId: tpl.rating_scale_id != null ? Number(tpl.rating_scale_id) : null,
    selfRatingEnabled: !!tpl.self_rating_enabled,
    publishedAt: tpl.published_at,
    applicability: applicability.map((a: Row) => ({
      employeeCategory: a.employee_category,
      departmentId: a.department_id != null ? Number(a.department_id) : null,
      designationId: a.designation_id != null ? Number(a.designation_id) : null,
      employmentTypeId: a.employment_type_id != null ? Number(a.employment_type_id) : null,
      capability: a.capability,
    })),
    sections: sections.map((s: Row) => ({
      id: Number(s.id),
      code: s.code,
      name: s.name,
      weight: Number(s.weight),
      description: s.description,
      sortOrder: Number(s.sort_order),
      criteria: criteria
        .filter((c: Row) => Number(c.section_id) === Number(s.id))
        .map((c: Row) => ({
          id: Number(c.id),
          code: c.code,
          name: c.name,
          description: c.description,
          weight: Number(c.weight),
          measurementType: c.measurement_type,
          targetValue: c.target_value != null ? Number(c.target_value) : null,
          selfRatingAllowed: !!c.self_rating_allowed,
          reviewerRatingAllowed: !!c.reviewer_rating_allowed,
          mandatoryEvidence: !!c.mandatory_evidence,
          evidenceSource: c.evidence_source,
          sortOrder: Number(c.sort_order),
        })),
    })),
  };
}

export async function listTemplates(actor: HrActor) {
  assertHrPermission(actor, PERF_VIEW);
  const rows = await db('hr_appraisal_templates')
    .where({ college_id: actor.collegeId })
    .orderBy('code', 'asc')
    .orderBy('version_no', 'desc');
  return rows.map((r: Row) => ({
    id: Number(r.id),
    code: r.code,
    name: r.name,
    versionNo: Number(r.version_no),
    status: r.status,
    totalWeight: Number(r.total_weight),
    publishedAt: r.published_at,
  }));
}

export async function getTemplate(actor: HrActor, templateId: number) {
  assertHrPermission(actor, PERF_VIEW);
  const { tpl, sections, criteria, applicability } = await loadTemplateFull(actor.collegeId, templateId);
  return serializeTemplate(tpl, sections, criteria, applicability);
}

export async function publishTemplate(actor: HrActor, templateId: number) {
  assertHrPermission(actor, PERF_MANAGE);
  const { tpl, sections, criteria } = await loadTemplateFull(actor.collegeId, templateId);
  if (String(tpl.status) === 'ACTIVE') return getTemplate(actor, templateId);
  validateTemplateWeights(
    sections.map((s: Row) => ({
      code: String(s.code),
      weight: Number(s.weight),
      criteria: criteria
        .filter((c: Row) => Number(c.section_id) === Number(s.id))
        .map((c: Row) => ({ code: String(c.code), weight: Number(c.weight) })),
    })),
    Number(tpl.total_weight),
  );
  // Archive other ACTIVE versions of same code
  await db('hr_appraisal_templates')
    .where({ college_id: actor.collegeId, code: tpl.code, status: 'ACTIVE' })
    .update({ status: 'ARCHIVED', updated_at: db.fn.now() });
  await db('hr_appraisal_templates').where({ id: templateId }).update({
    status: 'ACTIVE',
    published_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  await recordHrAudit({
    actor,
    action: 'APPRAISAL_TEMPLATE_PUBLISHED',
    entityType: 'hr_appraisal_templates',
    entityId: templateId,
  });
  return getTemplate(actor, templateId);
}

/**
 * Clone template to a new version_no. Leaves old template attached to existing appraisals.
 * Never mutates ACTIVE template criteria in place when appraisals exist.
 */
export async function versionTemplate(actor: HrActor, templateId: number) {
  assertHrPermission(actor, PERF_MANAGE);
  const { tpl, sections, criteria, applicability } = await loadTemplateFull(actor.collegeId, templateId);
  const maxVer = await db('hr_appraisal_templates')
    .where({ college_id: actor.collegeId, code: tpl.code })
    .max({ m: 'version_no' })
    .first();
  const nextVer = Number(maxVer?.m ?? tpl.version_no) + 1;

  const sectionPayload = sections.map((s: Row) => ({
    code: String(s.code),
    name: String(s.name),
    weight: Number(s.weight),
    description: (s.description as string) ?? null,
    sortOrder: Number(s.sort_order),
    criteria: criteria
      .filter((c: Row) => Number(c.section_id) === Number(s.id))
      .map((c: Row) => ({
        code: String(c.code),
        name: String(c.name),
        description: (c.description as string) ?? null,
        weight: Number(c.weight),
        measurementType: String(c.measurement_type) as 'RATING',
        targetValue: c.target_value != null ? Number(c.target_value) : null,
        selfRatingAllowed: !!c.self_rating_allowed,
        reviewerRatingAllowed: !!c.reviewer_rating_allowed,
        mandatoryEvidence: !!c.mandatory_evidence,
        evidenceSource: (c.evidence_source as 'NONE') ?? 'NONE',
        sortOrder: Number(c.sort_order),
      })),
  }));

  const newId = await db.transaction(async (trx) =>
    insertTemplateTree(trx, {
      collegeId: actor.collegeId,
      code: String(tpl.code),
      name: String(tpl.name),
      description: (tpl.description as string) ?? null,
      totalWeight: Number(tpl.total_weight),
      ratingScaleId: tpl.rating_scale_id != null ? Number(tpl.rating_scale_id) : null,
      selfRatingEnabled: !!tpl.self_rating_enabled,
      versionNo: nextVer,
      parentTemplateId: Number(tpl.id),
      status: 'DRAFT',
      createdBy: actor.facultyUserId,
      sections: sectionPayload,
      applicability: applicability.map((a: Row) => ({
        employeeCategory: (a.employee_category as string) ?? null,
        departmentId: a.department_id != null ? Number(a.department_id) : null,
        designationId: a.designation_id != null ? Number(a.designation_id) : null,
        employmentTypeId: a.employment_type_id != null ? Number(a.employment_type_id) : null,
        capability: (a.capability as string) ?? null,
      })),
    }),
  );

  await recordHrAudit({
    actor,
    action: 'APPRAISAL_TEMPLATE_VERSIONED',
    entityType: 'hr_appraisal_templates',
    entityId: newId,
    after: { fromTemplateId: templateId, versionNo: nextVer },
  });
  return getTemplate(actor, newId);
}

function matchesApplicability(emp: Row, rules: Row[]): boolean {
  if (!rules.length) return true;
  return rules.some((rule) => {
    if (rule.employee_category && String(rule.employee_category) !== String(emp.employee_category ?? '')) return false;
    if (rule.department_id != null && Number(rule.department_id) !== Number(emp.department_id ?? -1)) return false;
    if (rule.designation_id != null && Number(rule.designation_id) !== Number(emp.designation_id ?? -1)) return false;
    if (rule.employment_type_id != null && Number(rule.employment_type_id) !== Number(emp.employment_type_id ?? -1)) {
      return false;
    }
    // capability (HOD / TNP etc.) checked loosely — presence of faculty link for academic caps
    if (rule.capability) {
      // Soft match: capability filter requires faculty_user_id for faculty leadership caps
      if (!emp.faculty_user_id && String(rule.capability).toUpperCase().includes('HOD')) return false;
    }
    return true;
  });
}

export async function enrollEligibleEmployees(
  actor: HrActor,
  cycleId: number,
  opts: unknown,
) {
  assertHrPermission(actor, PERF_MANAGE);
  const input = enrollEmployeesSchema.parse(opts ?? {});
  const cycle = await loadCycle(actor, cycleId);
  if (String(cycle.status) === 'LOCKED') throw new AppError(400, 'Cycle is locked');

  const templateId = input.templateId ?? (cycle.default_template_id != null ? Number(cycle.default_template_id) : null);
  if (!templateId) throw new AppError(400, 'templateId or cycle defaultTemplateId is required');
  const tpl = await db('hr_appraisal_templates')
    .where({ id: templateId, college_id: actor.collegeId })
    .first();
  if (!tpl) throw new AppError(404, 'Template not found');
  if (String(tpl.status) !== 'ACTIVE' && String(tpl.status) !== 'DRAFT') {
    throw new AppError(400, 'Template must be ACTIVE or DRAFT to enroll');
  }

  const applicability = await db('hr_appraisal_template_applicability').where({
    template_id: templateId,
    college_id: actor.collegeId,
  });

  const periodStart = asYmd(cycle.period_start);
  const periodEnd = asYmd(cycle.period_end);
  const asOf = reviewerCutoff(cycle);

  let empQuery = db('employees').where({ college_id: actor.collegeId }).whereNotIn('employment_status', ['DRAFT']);
  empQuery = empQuery.andWhere((q) => {
    q.whereNull('date_of_joining').orWhere('date_of_joining', '<=', periodEnd);
  });
  empQuery = empQuery.andWhere((q) => {
    q.whereNull('last_working_date').orWhere('last_working_date', '>=', periodStart);
  });
  if (input.employeeIds?.length) {
    empQuery = empQuery.whereIn('id', input.employeeIds);
  } else if (!input.allEligible && !input.employeeIds) {
    throw new AppError(400, 'Provide employeeIds or allEligible=true');
  }

  const employees = await empQuery;
  const eligible = employees.filter((e: Row) => matchesApplicability(e, applicability));
  const created: number[] = [];
  const skipped: { employeeId: number; reason: string }[] = [];

  for (const emp of eligible) {
    const employeeId = Number(emp.id);
    const existing = await db('hr_employee_appraisals')
      .where({
        college_id: actor.collegeId,
        cycle_id: cycleId,
        employee_id: employeeId,
      })
      .orderBy('version_no', 'desc')
      .first();
    if (existing && String(existing.status) !== 'LOCKED') {
      skipped.push({ employeeId, reason: 'already_enrolled' });
      continue;
    }

    let resolved = await resolveAppraisalReviewer(employeeId, actor.collegeId, asOf);
    if (resolved.reviewerEmployeeId === employeeId) {
      resolved = { reviewerEmployeeId: null, source: null, asOf };
    }

    const [id] = await db('hr_employee_appraisals').insert({
      college_id: actor.collegeId,
      cycle_id: cycleId,
      employee_id: employeeId,
      template_id: templateId,
      template_version_no: Number(tpl.version_no),
      version_no: existing ? Number(existing.version_no) + 1 : 1,
      parent_appraisal_id: existing ? Number(existing.id) : null,
      status: 'NOT_STARTED',
      department_id: emp.department_id ?? null,
      designation_id: emp.designation_id ?? null,
      employee_category: emp.employee_category ?? null,
      reviewer_employee_id: resolved.reviewerEmployeeId,
      reviewer_source: resolved.source,
      reviewer_resolved_as_of: resolved.asOf,
      evidence_snapshot_version: 0,
    });
    created.push(Number(id));

    if (resolved.reviewerEmployeeId) {
      await notifyEmployee({
        employeeId: resolved.reviewerEmployeeId,
        collegeId: actor.collegeId,
        type: 'APPRAISAL_REVIEWER_ASSIGNED',
        title: 'Appraisal review assignment',
        body: `You have been assigned as reviewer for an appraisal in cycle ${cycle.code}`,
        relatedType: 'hr_employee_appraisals',
        relatedId: Number(id),
        dedupeKey: `appraisal-reviewer-${id}`,
      });
    }
  }

  await recordHrAudit({
    actor,
    action: 'APPRAISAL_ENROLL',
    entityType: 'hr_appraisal_cycles',
    entityId: cycleId,
    after: { created: created.length, skipped: skipped.length },
  });

  return { createdIds: created, skipped, count: created.length };
}

function goalsEditable(appraisal: Row) {
  if (appraisal.goals_locked_at) return false;
  const status = String(appraisal.status);
  if (['SELF_SUBMITTED', 'REVIEW_IN_PROGRESS', 'REVIEW_SUBMITTED', 'CALIBRATION', 'FINALIZED', 'LOCKED'].includes(status)) {
    return false;
  }
  return true;
}

export async function createGoal(actor: HrActor, appraisalId: number, raw: unknown) {
  const appraisal = await loadAppraisal(actor, appraisalId);
  const visibility = await assertCanViewAppraisal(actor, appraisal);
  void visibility;
  const self = await resolveEmployeeForActor(actor);
  const isOwner = self && Number(self.id) === Number(appraisal.employee_id);
  const isHr = hasHrPermission(actor, PERF_MANAGE);
  if (!isOwner && !isHr) throw new AppError(403, 'Only the employee or HR can create goals');
  assertAppraisalMutable(appraisal);
  if (!goalsEditable(appraisal)) throw new AppError(400, 'Goals are locked for this appraisal');

  const input = createGoalSchema.parse(raw);
  if (input.weight < 0) throw new AppError(400, 'Goal weight cannot be negative');

  const existing = await db('hr_appraisal_goals').where({ appraisal_id: appraisalId });
  const total = existing.reduce((s: number, g: Row) => s + Number(g.weight), 0) + input.weight;
  if (total > 100.01) throw new AppError(400, 'Total goal weights cannot exceed 100');

  const dup = existing.find(
    (g: Row) => String(g.title).trim().toLowerCase() === input.title.trim().toLowerCase(),
  );
  if (dup) throw new AppError(400, 'Duplicate goal title for this appraisal');

  const [id] = await db('hr_appraisal_goals').insert({
    appraisal_id: appraisalId,
    college_id: actor.collegeId,
    employee_id: appraisal.employee_id,
    title: input.title,
    description: input.description ?? null,
    category: input.category ?? null,
    target: input.target ?? null,
    weight: input.weight,
    start_date: input.startDate ?? null,
    end_date: input.endDate ?? null,
    status: 'DRAFT',
  });

  if (String(appraisal.status) === 'NOT_STARTED') {
    assertAppraisalTransition('NOT_STARTED', 'GOALS_PENDING');
    await db('hr_employee_appraisals').where({ id: appraisalId }).update({
      status: 'GOALS_PENDING',
      updated_at: db.fn.now(),
    });
  }

  return { id: Number(id) };
}

export async function updateGoal(actor: HrActor, goalId: number, raw: unknown) {
  const goal = await db('hr_appraisal_goals').where({ id: goalId, college_id: actor.collegeId }).first();
  if (!goal) throw new AppError(404, 'Goal not found');
  const appraisal = await loadAppraisal(actor, Number(goal.appraisal_id));
  await assertCanViewAppraisal(actor, appraisal);
  const self = await resolveEmployeeForActor(actor);
  const isOwner = self && Number(self.id) === Number(appraisal.employee_id);
  if (!isOwner && !hasHrPermission(actor, PERF_MANAGE)) throw new AppError(403, 'Cannot update goal');
  assertAppraisalMutable(appraisal);
  if (!goalsEditable(appraisal)) throw new AppError(400, 'Goals are locked');
  if (!['DRAFT', 'REJECTED'].includes(String(goal.status))) {
    throw new AppError(400, 'Only draft or rejected goals can be edited');
  }

  const input = updateGoalSchema.parse(raw);
  const siblings = await db('hr_appraisal_goals')
    .where({ appraisal_id: goal.appraisal_id })
    .whereNot('id', goalId);
  const newWeight = input.weight != null ? input.weight : Number(goal.weight);
  if (newWeight < 0) throw new AppError(400, 'Goal weight cannot be negative');
  const total = siblings.reduce((s: number, g: Row) => s + Number(g.weight), 0) + newWeight;
  if (total > 100.01) throw new AppError(400, 'Total goal weights cannot exceed 100');

  if (input.title) {
    const dup = siblings.find(
      (g: Row) => String(g.title).trim().toLowerCase() === input.title!.trim().toLowerCase(),
    );
    if (dup) throw new AppError(400, 'Duplicate goal title for this appraisal');
  }

  await db('hr_appraisal_goals')
    .where({ id: goalId })
    .update({
      ...(input.title != null ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.target !== undefined ? { target: input.target } : {}),
      ...(input.weight != null ? { weight: input.weight } : {}),
      ...(input.startDate !== undefined ? { start_date: input.startDate } : {}),
      ...(input.endDate !== undefined ? { end_date: input.endDate } : {}),
      updated_at: db.fn.now(),
    });
  return { id: goalId };
}

export async function submitGoals(actor: HrActor, appraisalId: number) {
  const appraisal = await loadAppraisal(actor, appraisalId);
  const self = await requireEmployeeForActor(actor);
  if (Number(self.id) !== Number(appraisal.employee_id) && !hasHrPermission(actor, PERF_MANAGE)) {
    throw new AppError(403, 'Only the employee can submit goals');
  }
  assertAppraisalMutable(appraisal);
  if (!goalsEditable(appraisal)) throw new AppError(400, 'Goals are locked');

  const goals = await db('hr_appraisal_goals').where({ appraisal_id: appraisalId });
  if (!goals.length) throw new AppError(400, 'No goals to submit');
  await db('hr_appraisal_goals')
    .where({ appraisal_id: appraisalId })
    .whereIn('status', ['DRAFT', 'REJECTED'])
    .update({ status: 'SUBMITTED', updated_at: db.fn.now() });

  if (String(appraisal.status) === 'NOT_STARTED') {
    assertAppraisalTransition('NOT_STARTED', 'GOALS_PENDING');
  }
  await db('hr_employee_appraisals').where({ id: appraisalId }).update({
    status: 'GOALS_PENDING',
    updated_at: db.fn.now(),
  });

  if (appraisal.reviewer_employee_id) {
    await notifyEmployee({
      employeeId: Number(appraisal.reviewer_employee_id),
      collegeId: actor.collegeId,
      type: 'APPRAISAL_GOALS_SUBMITTED',
      title: 'Goals submitted for approval',
      relatedType: 'hr_employee_appraisals',
      relatedId: appraisalId,
      dedupeKey: `appraisal-goals-submit-${appraisalId}-${Date.now()}`,
    });
  }
  return getAppraisalDetail(actor, appraisalId, 'reviewer');
}

export async function decideGoal(actor: HrActor, goalId: number, raw: unknown) {
  const { decision, reason } = (await import('./appraisalTypes.js')).goalDecisionSchema.parse(raw);
  const goal = await db('hr_appraisal_goals').where({ id: goalId, college_id: actor.collegeId }).first();
  if (!goal) throw new AppError(404, 'Goal not found');
  const appraisal = await loadAppraisal(actor, Number(goal.appraisal_id));
  await assertCanReviewAppraisal(actor, appraisal);
  assertAppraisalMutable(appraisal);
  if (String(goal.status) !== 'SUBMITTED') throw new AppError(400, 'Goal is not pending decision');

  const self = await resolveEmployeeForActor(actor);
  await db('hr_appraisal_goals')
    .where({ id: goalId })
    .update({
      status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      approved_by: decision === 'APPROVE' && self ? self.id : null,
      approved_at: decision === 'APPROVE' ? db.fn.now() : null,
      reviewer_comments: reason ?? goal.reviewer_comments,
      updated_at: db.fn.now(),
    });

  const remaining = await db('hr_appraisal_goals')
    .where({ appraisal_id: goal.appraisal_id, status: 'SUBMITTED' })
    .first();
  const rejected = await db('hr_appraisal_goals')
    .where({ appraisal_id: goal.appraisal_id, status: 'REJECTED' })
    .first();
  if (!remaining && !rejected) {
    assertAppraisalTransition(String(appraisal.status) === 'GOALS_PENDING' ? 'GOALS_PENDING' : String(appraisal.status), 'GOALS_APPROVED');
    if (String(appraisal.status) === 'GOALS_PENDING') {
      await db('hr_employee_appraisals').where({ id: goal.appraisal_id }).update({
        status: 'GOALS_APPROVED',
        updated_at: db.fn.now(),
      });
    }
  }

  await notifyEmployee({
    employeeId: Number(appraisal.employee_id),
    collegeId: actor.collegeId,
    type: decision === 'APPROVE' ? 'APPRAISAL_GOAL_APPROVED' : 'APPRAISAL_GOAL_REJECTED',
    title: decision === 'APPROVE' ? 'Goal approved' : 'Goal rejected',
    body: reason ?? null,
    relatedType: 'hr_appraisal_goals',
    relatedId: goalId,
  });
  return { id: goalId, decision };
}

export async function lockGoals(actor: HrActor, appraisalId: number) {
  assertHrPermission(actor, PERF_MANAGE);
  const appraisal = await loadAppraisal(actor, appraisalId);
  assertAppraisalMutable(appraisal);
  await db('hr_appraisal_goals')
    .where({ appraisal_id: appraisalId })
    .whereIn('status', ['APPROVED', 'SUBMITTED', 'DRAFT'])
    .update({ status: 'LOCKED', updated_at: db.fn.now() });
  await db('hr_employee_appraisals').where({ id: appraisalId }).update({
    goals_locked_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  await recordHrAudit({
    actor,
    action: 'APPRAISAL_GOALS_LOCKED',
    entityType: 'hr_employee_appraisals',
    entityId: appraisalId,
  });
  return getAppraisalDetail(actor, appraisalId, 'hr');
}

function serializeAppraisalBase(
  row: Row,
  opts: { canSeeReviewerPrivateNotes: boolean; canSeeHrNotes: boolean },
) {
  return {
    id: Number(row.id),
    collegeId: Number(row.college_id),
    cycleId: Number(row.cycle_id),
    employeeId: Number(row.employee_id),
    templateId: Number(row.template_id),
    templateVersionNo: Number(row.template_version_no),
    versionNo: Number(row.version_no),
    parentAppraisalId: row.parent_appraisal_id != null ? Number(row.parent_appraisal_id) : null,
    status: row.status,
    departmentId: row.department_id != null ? Number(row.department_id) : null,
    designationId: row.designation_id != null ? Number(row.designation_id) : null,
    employeeCategory: row.employee_category,
    reviewerEmployeeId: row.reviewer_employee_id != null ? Number(row.reviewer_employee_id) : null,
    reviewerSource: row.reviewer_source,
    reviewerResolvedAsOf: row.reviewer_resolved_as_of,
    selfScore: row.self_score != null ? Number(row.self_score) : null,
    reviewerScore: row.reviewer_score != null ? Number(row.reviewer_score) : null,
    calibratedScore: row.calibrated_score != null ? Number(row.calibrated_score) : null,
    finalScore: row.final_score != null ? Number(row.final_score) : null,
    finalRatingLabel: row.final_rating_label,
    finalRatingValue: row.final_rating_value != null ? Number(row.final_rating_value) : null,
    employeeSummary: row.employee_summary,
    reviewerSummary: row.reviewer_summary,
    reviewerPrivateNotes: opts.canSeeReviewerPrivateNotes ? row.reviewer_private_notes : undefined,
    hrNotes: opts.canSeeHrNotes ? row.hr_notes : undefined,
    promotionRecommendation: row.promotion_recommendation,
    incrementRecommendation: row.increment_recommendation,
    probationRecommendation: row.probation_recommendation,
    recommendationNotes: row.recommendation_notes,
    goalsLockedAt: row.goals_locked_at,
    selfSubmittedAt: row.self_submitted_at,
    reviewSubmittedAt: row.review_submitted_at,
    calibratedAt: row.calibrated_at,
    finalizedAt: row.finalized_at,
    lockedAt: row.locked_at,
    evidenceSnapshotVersion: Number(row.evidence_snapshot_version ?? 0),
  };
}

export async function getMyAppraisals(actor: HrActor) {
  const emp = await requireEmployeeForActor(actor);
  const rows = await db('hr_employee_appraisals as a')
    .join('hr_appraisal_cycles as c', 'c.id', 'a.cycle_id')
    .where({ 'a.college_id': actor.collegeId, 'a.employee_id': emp.id })
    .select('a.*', 'c.name as cycle_name', 'c.code as cycle_code')
    .orderBy('c.period_start', 'desc');
  return rows.map((r: Row) => ({
    ...serializeAppraisalBase(r, { canSeeReviewerPrivateNotes: false, canSeeHrNotes: false }),
    cycleName: r.cycle_name,
    cycleCode: r.cycle_code,
  }));
}

export async function getAppraisalDetail(
  actor: HrActor,
  id: number,
  viewerMode: 'employee' | 'reviewer' | 'hr' | 'principal' = 'employee',
) {
  const appraisal = await loadAppraisal(actor, id);
  const notes = await assertCanViewAppraisal(actor, appraisal, {
    includePrivateNotes: viewerMode !== 'employee',
  });
  const goals = await db('hr_appraisal_goals').where({ appraisal_id: id }).orderBy('id', 'asc');
  const responses = await db('hr_appraisal_criterion_responses').where({ appraisal_id: id });
  const evidence = await getSnapshots(id);
  const emp = await db('employees').where({ id: appraisal.employee_id }).first();

  return {
    ...serializeAppraisalBase(appraisal, notes),
    viewerMode,
    employeeName: emp?.display_name ?? null,
    employeeNumber: emp?.employee_number ?? null,
    goals: goals.map((g: Row) => ({
      id: Number(g.id),
      title: g.title,
      description: g.description,
      category: g.category,
      target: g.target,
      weight: Number(g.weight),
      status: g.status,
      selfProgress: g.self_progress != null ? Number(g.self_progress) : null,
      selfRating: g.self_rating != null ? Number(g.self_rating) : null,
      selfComments: g.self_comments,
      reviewerRating: g.reviewer_rating != null ? Number(g.reviewer_rating) : null,
      reviewerComments: g.reviewer_comments,
    })),
    criteria: responses.map((r: Row) => ({
      criterionId: Number(r.criterion_id),
      selfRating: r.self_rating != null ? Number(r.self_rating) : null,
      selfComments: r.self_comments,
      reviewerRating: r.reviewer_rating != null ? Number(r.reviewer_rating) : null,
      reviewerComments: r.reviewer_comments,
      systemValue: r.system_value != null ? Number(r.system_value) : null,
      systemDisplay: r.system_display,
      weightedContribution: r.weighted_contribution != null ? Number(r.weighted_contribution) : null,
    })),
    evidence: viewerMode === 'employee' ? evidence.map((e) => ({ ...e, payload: undefined })) : evidence,
  };
}

async function upsertCriterionResponses(
  trx: Trx,
  appraisalId: number,
  collegeId: number,
  items: { criterionId: number; selfRating?: number | null; selfComments?: string | null; reviewerRating?: number | null; reviewerComments?: string | null }[],
  mode: 'self' | 'reviewer',
) {
  for (const item of items) {
    const existing = await trx('hr_appraisal_criterion_responses')
      .where({ appraisal_id: appraisalId, criterion_id: item.criterionId })
      .forUpdate()
      .first();
    const patch: Row = { updated_at: trx.fn.now() };
    if (mode === 'self') {
      if (item.selfRating !== undefined) patch.self_rating = item.selfRating;
      if (item.selfComments !== undefined) patch.self_comments = item.selfComments;
      // Never allow client to set system_value
    } else {
      if (item.reviewerRating !== undefined) patch.reviewer_rating = item.reviewerRating;
      if (item.reviewerComments !== undefined) patch.reviewer_comments = item.reviewerComments;
    }
    if (existing) {
      await trx('hr_appraisal_criterion_responses').where({ id: existing.id }).update(patch);
    } else {
      await trx('hr_appraisal_criterion_responses').insert({
        appraisal_id: appraisalId,
        criterion_id: item.criterionId,
        college_id: collegeId,
        self_rating: mode === 'self' ? item.selfRating ?? null : null,
        self_comments: mode === 'self' ? item.selfComments ?? null : null,
        reviewer_rating: mode === 'reviewer' ? item.reviewerRating ?? null : null,
        reviewer_comments: mode === 'reviewer' ? item.reviewerComments ?? null : null,
      });
    }
  }
}

async function computeSelfOrReviewerScore(
  appraisal: Row,
  mode: 'self' | 'reviewer',
): Promise<number | null> {
  const criteria = await db('hr_appraisal_template_criteria').where({
    template_id: appraisal.template_id,
    college_id: appraisal.college_id,
  });
  const responses = await db('hr_appraisal_criterion_responses').where({ appraisal_id: appraisal.id });
  const tpl = await db('hr_appraisal_templates').where({ id: appraisal.template_id }).first();
  const cycle = await db('hr_appraisal_cycles').where({ id: appraisal.cycle_id }).first();
  const scaleId = tpl?.rating_scale_id ?? cycle?.rating_scale_id ?? null;
  const { scaleMax } = await loadRatingLevels(scaleId != null ? Number(scaleId) : null, Number(appraisal.college_id));

  const items = criteria.map((c: Row) => {
    const resp = responses.find((r: Row) => Number(r.criterion_id) === Number(c.id));
    const rating =
      mode === 'self'
        ? resp?.self_rating != null
          ? Number(resp.self_rating)
          : null
        : resp?.reviewer_rating != null
          ? Number(resp.reviewer_rating)
          : null;
    return { weight: Number(c.weight), rating };
  });
  return computeWeightedScore(items, scaleMax);
}

async function ensureEvidenceSnapshot(appraisal: Row, cycle: Row) {
  if (Number(appraisal.evidence_snapshot_version) > 0) return;
  const emp = await db('employees').where({ id: appraisal.employee_id }).first();
  const facultyUserId = emp?.faculty_user_id != null ? Number(emp.faculty_user_id) : null;
  const items = await collectEvidenceForEmployee(
    Number(appraisal.college_id),
    Number(appraisal.employee_id),
    asYmd(cycle.period_start),
    asYmd(cycle.period_end),
    facultyUserId,
  );
  await snapshotEvidence(
    Number(appraisal.id),
    Number(appraisal.college_id),
    Number(appraisal.employee_id),
    items,
    1,
  );

  // Stamp SYSTEM_DERIVED criterion responses from evidence where keys match
  const criteria = await db('hr_appraisal_template_criteria').where({
    template_id: appraisal.template_id,
    college_id: appraisal.college_id,
  });
  for (const c of criteria) {
    if (String(c.measurement_type) !== 'SYSTEM_DERIVED' && String(c.evidence_source) === 'NONE') continue;
    const src = String(c.evidence_source ?? '');
    const match = items.find((i) => i.sourceModule === src);
    if (!match) continue;
    const existing = await db('hr_appraisal_criterion_responses')
      .where({ appraisal_id: appraisal.id, criterion_id: c.id })
      .first();
    const patch = {
      system_value: match.valueNumeric,
      system_display: match.valueDisplay,
      evidence_attached: true,
      updated_at: db.fn.now(),
    };
    if (existing) {
      await db('hr_appraisal_criterion_responses').where({ id: existing.id }).update(patch);
    } else {
      await db('hr_appraisal_criterion_responses').insert({
        appraisal_id: appraisal.id,
        criterion_id: c.id,
        college_id: appraisal.college_id,
        ...patch,
      });
    }
  }
}

export async function saveSelfAppraisal(actor: HrActor, appraisalId: number, raw: unknown) {
  const input = selfAppraisalSchema.parse(raw);
  const emp = await requireEmployeeForActor(actor);

  await db.transaction(async (trx) => {
    const appraisal = await trx('hr_employee_appraisals')
      .where({ id: appraisalId, college_id: actor.collegeId })
      .forUpdate()
      .first();
    if (!appraisal) throw new AppError(404, 'Appraisal not found');
    if (Number(appraisal.employee_id) !== Number(emp.id)) {
      throw new AppError(403, 'Only the subject employee can save self-appraisal');
    }
    assertAppraisalMutable(appraisal);
    const status = String(appraisal.status);
    if (
      ['SELF_SUBMITTED', 'REVIEW_IN_PROGRESS', 'REVIEW_SUBMITTED', 'CALIBRATION', 'FINALIZED', 'LOCKED'].includes(
        status,
      )
    ) {
      if (input.submit && status === 'SELF_SUBMITTED') return; // idempotent
      throw new AppError(400, 'Self-appraisal already submitted');
    }

    if (['NOT_STARTED', 'GOALS_PENDING', 'GOALS_APPROVED'].includes(status)) {
      const from = status as AppraisalStatus;
      if (from === 'NOT_STARTED') assertAppraisalTransition('NOT_STARTED', 'SELF_REVIEW_IN_PROGRESS');
      else if (from === 'GOALS_PENDING') assertAppraisalTransition('GOALS_PENDING', 'SELF_REVIEW_IN_PROGRESS');
      else assertAppraisalTransition('GOALS_APPROVED', 'SELF_REVIEW_IN_PROGRESS');
      await trx('hr_employee_appraisals').where({ id: appraisalId }).update({
        status: 'SELF_REVIEW_IN_PROGRESS',
        updated_at: trx.fn.now(),
      });
    }

    if (input.employeeSummary !== undefined) {
      await trx('hr_employee_appraisals').where({ id: appraisalId }).update({
        employee_summary: input.employeeSummary,
        updated_at: trx.fn.now(),
      });
    }
    if (input.criteria?.length) {
      await upsertCriterionResponses(
        trx,
        appraisalId,
        actor.collegeId,
        input.criteria.map((c) => ({
          criterionId: c.criterionId,
          selfRating: c.selfRating,
          selfComments: c.selfComments,
        })),
        'self',
      );
    }
    if (input.goals?.length) {
      for (const g of input.goals) {
        await trx('hr_appraisal_goals')
          .where({ id: g.goalId, appraisal_id: appraisalId })
          .update({
            self_progress: g.selfProgress ?? null,
            self_rating: g.selfRating ?? null,
            self_comments: g.selfComments ?? null,
            updated_at: trx.fn.now(),
          });
      }
    }
  });

  if (input.submit) {
    return submitSelfAppraisal(actor, appraisalId);
  }
  return getAppraisalDetail(actor, appraisalId, 'employee');
}

export async function submitSelfAppraisal(actor: HrActor, appraisalId: number) {
  const emp = await requireEmployeeForActor(actor);

  // Snapshot evidence before status lock (read-only across modules)
  const pre = await db('hr_employee_appraisals')
    .where({ id: appraisalId, college_id: actor.collegeId })
    .first();
  if (!pre) throw new AppError(404, 'Appraisal not found');
  if (Number(pre.employee_id) !== Number(emp.id)) {
    throw new AppError(403, 'Only the subject employee can submit self-appraisal');
  }
  if (String(pre.status) === 'SELF_SUBMITTED') {
    return getAppraisalDetail(actor, appraisalId, 'employee');
  }

  const cycle = await db('hr_appraisal_cycles').where({ id: pre.cycle_id }).first();
  if (cycle && Number(pre.evidence_snapshot_version) <= 0) {
    await ensureEvidenceSnapshot(pre, cycle);
  }

  const refreshed = await db('hr_employee_appraisals').where({ id: appraisalId }).first();
  const selfScore = await computeSelfOrReviewerScore(refreshed!, 'self');

  const updated = await db.transaction(async (trx) => {
    const locked = await trx('hr_employee_appraisals')
      .where({ id: appraisalId, college_id: actor.collegeId })
      .forUpdate()
      .first();
    if (!locked) throw new AppError(404, 'Appraisal not found');
    if (Number(locked.employee_id) !== Number(emp.id)) {
      throw new AppError(403, 'Only the subject employee can submit self-appraisal');
    }
    if (String(locked.status) === 'SELF_SUBMITTED') return locked;
    if (
      ['REVIEW_IN_PROGRESS', 'REVIEW_SUBMITTED', 'CALIBRATION', 'FINALIZED', 'LOCKED'].includes(
        String(locked.status),
      )
    ) {
      throw new AppError(409, 'Concurrent submit conflict');
    }

    const status = String(locked.status);
    if (status === 'SELF_REVIEW_IN_PROGRESS') {
      assertAppraisalTransition('SELF_REVIEW_IN_PROGRESS', 'SELF_SUBMITTED');
    } else if (status === 'GOALS_APPROVED') {
      assertAppraisalTransition('GOALS_APPROVED', 'SELF_REVIEW_IN_PROGRESS');
      assertAppraisalTransition('SELF_REVIEW_IN_PROGRESS', 'SELF_SUBMITTED');
    } else if (status === 'NOT_STARTED') {
      assertAppraisalTransition('NOT_STARTED', 'SELF_REVIEW_IN_PROGRESS');
      assertAppraisalTransition('SELF_REVIEW_IN_PROGRESS', 'SELF_SUBMITTED');
    } else if (status === 'GOALS_PENDING') {
      assertAppraisalTransition('GOALS_PENDING', 'SELF_REVIEW_IN_PROGRESS');
      assertAppraisalTransition('SELF_REVIEW_IN_PROGRESS', 'SELF_SUBMITTED');
    } else {
      throw new AppError(400, 'Appraisal is not ready for self-submit');
    }

    await trx('hr_employee_appraisals').where({ id: appraisalId }).update({
      status: 'SELF_SUBMITTED',
      self_score: selfScore,
      self_submitted_at: trx.fn.now(),
      self_submitted_by: actor.facultyUserId,
      evidence_snapshot_version: Math.max(1, Number(locked.evidence_snapshot_version) || 0),
      updated_at: trx.fn.now(),
    });
    return locked;
  });

  if (updated.reviewer_employee_id) {
    await notifyEmployee({
      employeeId: Number(updated.reviewer_employee_id),
      collegeId: actor.collegeId,
      type: 'APPRAISAL_SELF_SUBMITTED',
      title: 'Self-appraisal submitted',
      relatedType: 'hr_employee_appraisals',
      relatedId: appraisalId,
      dedupeKey: `appraisal-self-submit-${appraisalId}`,
    });
  }
  await recordHrAudit({
    actor,
    action: 'APPRAISAL_SELF_SUBMITTED',
    entityType: 'hr_employee_appraisals',
    entityId: appraisalId,
  });
  return getAppraisalDetail(actor, appraisalId, 'employee');
}

export async function listPendingReviews(actor: HrActor) {
  const emp = await resolveEmployeeForActor(actor);
  if (!emp && !hasHrPermission(actor, PERF_VIEW)) {
    throw new AppError(403, 'No reviewer identity');
  }
  let q = db('hr_employee_appraisals as a')
    .join('employees as e', 'e.id', 'a.employee_id')
    .join('hr_appraisal_cycles as c', 'c.id', 'a.cycle_id')
    .where({ 'a.college_id': actor.collegeId })
    .whereIn('a.status', ['SELF_SUBMITTED', 'REVIEW_IN_PROGRESS'])
    .select(
      'a.id',
      'a.status',
      'a.employee_id',
      'a.reviewer_employee_id',
      'a.department_id',
      'e.display_name',
      'e.employee_number',
      'c.name as cycle_name',
      'c.code as cycle_code',
    );

  if (emp && !hasHrPermission(actor, PERF_MANAGE)) {
    q = q.andWhere('a.reviewer_employee_id', emp.id);
  }
  if (
    (actor.role === 'HOD' || (actor.leadershipRoles ?? []).includes('HOD')) &&
    !hasHrPermission(actor, PERF_MANAGE)
  ) {
    const depts = actor.hodDepartmentIds?.length
      ? actor.hodDepartmentIds
      : actor.departmentId
        ? [actor.departmentId]
        : [];
    if (depts.length) q = q.whereIn('a.department_id', depts);
  }

  const rows = await q.orderBy('a.updated_at', 'desc');
  return rows.map((r: Row) => ({
    id: Number(r.id),
    status: r.status,
    employeeId: Number(r.employee_id),
    employeeName: r.display_name,
    employeeNumber: r.employee_number,
    cycleName: r.cycle_name,
    cycleCode: r.cycle_code,
    reviewerEmployeeId: r.reviewer_employee_id != null ? Number(r.reviewer_employee_id) : null,
  }));
}

export async function saveReview(actor: HrActor, appraisalId: number, raw: unknown) {
  const input = reviewAppraisalSchema.parse(raw);

  await db.transaction(async (trx) => {
    const appraisal = await trx('hr_employee_appraisals')
      .where({ id: appraisalId, college_id: actor.collegeId })
      .forUpdate()
      .first();
    if (!appraisal) throw new AppError(404, 'Appraisal not found');
    await assertCanReviewAppraisal(actor, appraisal);
    assertAppraisalMutable(appraisal);

    const status = String(appraisal.status);
    if (['REVIEW_SUBMITTED', 'CALIBRATION', 'FINALIZED', 'LOCKED'].includes(status)) {
      if (input.submit && status === 'REVIEW_SUBMITTED') return;
      throw new AppError(400, 'Review already submitted');
    }
    if (!['SELF_SUBMITTED', 'REVIEW_IN_PROGRESS'].includes(status)) {
      throw new AppError(400, 'Appraisal is not ready for review');
    }

    if (status === 'SELF_SUBMITTED') {
      assertAppraisalTransition('SELF_SUBMITTED', 'REVIEW_IN_PROGRESS');
      await trx('hr_employee_appraisals').where({ id: appraisalId }).update({
        status: 'REVIEW_IN_PROGRESS',
        updated_at: trx.fn.now(),
      });
    }

    const patch: Row = { updated_at: trx.fn.now() };
    if (input.reviewerSummary !== undefined) patch.reviewer_summary = input.reviewerSummary;
    if (input.reviewerPrivateNotes !== undefined) patch.reviewer_private_notes = input.reviewerPrivateNotes;
    if (input.promotionRecommendation !== undefined) patch.promotion_recommendation = input.promotionRecommendation;
    if (input.incrementRecommendation !== undefined) patch.increment_recommendation = input.incrementRecommendation;
    if (input.probationRecommendation !== undefined) patch.probation_recommendation = input.probationRecommendation;
    if (input.recommendationNotes !== undefined) patch.recommendation_notes = input.recommendationNotes;
    await trx('hr_employee_appraisals').where({ id: appraisalId }).update(patch);

    if (input.criteria?.length) {
      await upsertCriterionResponses(
        trx,
        appraisalId,
        actor.collegeId,
        input.criteria.map((c) => ({
          criterionId: c.criterionId,
          reviewerRating: c.reviewerRating,
          reviewerComments: c.reviewerComments,
        })),
        'reviewer',
      );
    }
    if (input.goals?.length) {
      for (const g of input.goals) {
        await trx('hr_appraisal_goals')
          .where({ id: g.goalId, appraisal_id: appraisalId })
          .update({
            reviewer_rating: g.reviewerRating ?? null,
            reviewer_comments: g.reviewerComments ?? null,
            updated_at: trx.fn.now(),
          });
      }
    }
  });

  if (input.submit) {
    return submitReview(actor, appraisalId);
  }
  return getAppraisalDetail(actor, appraisalId, 'reviewer');
}

export async function submitReview(actor: HrActor, appraisalId: number) {
  const appraisal = await db.transaction(async (trx) => {
    const row = await trx('hr_employee_appraisals')
      .where({ id: appraisalId, college_id: actor.collegeId })
      .forUpdate()
      .first();
    if (!row) throw new AppError(404, 'Appraisal not found');
    if (String(row.status) === 'REVIEW_SUBMITTED') return row;
    await assertCanReviewAppraisal(actor, row);
    const status = String(row.status);
    if (status === 'REVIEW_IN_PROGRESS') {
      assertAppraisalTransition('REVIEW_IN_PROGRESS', 'REVIEW_SUBMITTED');
    } else if (status === 'SELF_SUBMITTED') {
      assertAppraisalTransition('SELF_SUBMITTED', 'REVIEW_SUBMITTED');
    } else {
      throw new AppError(400, 'Invalid status for review submit');
    }

    // Score from reviewer ratings only — never overwrite with self
    const responses = await trx('hr_appraisal_criterion_responses').where({ appraisal_id: appraisalId });
    const criteria = await trx('hr_appraisal_template_criteria').where({
      template_id: row.template_id,
      college_id: actor.collegeId,
    });
    const tpl = await trx('hr_appraisal_templates').where({ id: row.template_id }).first();
    const cycle = await trx('hr_appraisal_cycles').where({ id: row.cycle_id }).first();
    const scaleId = tpl?.rating_scale_id ?? cycle?.rating_scale_id ?? null;
    const { scaleMax } = await loadRatingLevels(scaleId != null ? Number(scaleId) : null, actor.collegeId);
    const items = criteria.map((c: Row) => {
      const resp = responses.find((r: Row) => Number(r.criterion_id) === Number(c.id));
      return {
        weight: Number(c.weight),
        rating: resp?.reviewer_rating != null ? Number(resp.reviewer_rating) : null,
      };
    });
    const reviewerScore = computeWeightedScore(items, scaleMax);

    await trx('hr_employee_appraisals').where({ id: appraisalId }).update({
      status: 'REVIEW_SUBMITTED',
      reviewer_score: reviewerScore,
      review_submitted_at: trx.fn.now(),
      review_submitted_by: actor.facultyUserId,
      updated_at: trx.fn.now(),
    });
    return row;
  });

  await notifyEmployee({
    employeeId: Number(appraisal.employee_id),
    collegeId: actor.collegeId,
    type: 'APPRAISAL_REVIEW_SUBMITTED',
    title: 'Manager review submitted',
    relatedType: 'hr_employee_appraisals',
    relatedId: appraisalId,
    dedupeKey: `appraisal-review-submit-${appraisalId}`,
  });
  await recordHrAudit({
    actor,
    action: 'APPRAISAL_REVIEW_SUBMITTED',
    entityType: 'hr_employee_appraisals',
    entityId: appraisalId,
  });
  return getAppraisalDetail(actor, appraisalId, 'reviewer');
}

export async function calibrateAppraisal(actor: HrActor, appraisalId: number, raw: unknown) {
  assertHrPermission(actor, PERF_CALIBRATE);
  const input = calibrateSchema.parse(raw);
  const appraisal = await loadAppraisal(actor, appraisalId);
  assertAppraisalMutable(appraisal);
  const status = String(appraisal.status);
  if (!['REVIEW_SUBMITTED', 'CALIBRATION'].includes(status)) {
    throw new AppError(400, 'Appraisal must be review-submitted before calibration');
  }
  if (status === 'REVIEW_SUBMITTED') {
    assertAppraisalTransition('REVIEW_SUBMITTED', 'CALIBRATION');
  }

  const cycle = await loadCycle(actor, Number(appraisal.cycle_id));
  const { levels } = await loadRatingLevels(
    cycle.rating_scale_id != null ? Number(cycle.rating_scale_id) : null,
    actor.collegeId,
  );
  const mapped = mapScoreToRating(input.calibratedScore, levels);

  await db.transaction(async (trx) => {
    const locked = await trx('hr_employee_appraisals')
      .where({ id: appraisalId })
      .forUpdate()
      .first();
    if (!locked) throw new AppError(404, 'Appraisal not found');
    // Preserve reviewer_score
    await trx('hr_appraisal_calibrations').insert({
      appraisal_id: appraisalId,
      college_id: actor.collegeId,
      reviewer_score_before: locked.reviewer_score,
      calibrated_score: roundScore(input.calibratedScore),
      calibrated_rating_label: mapped.label,
      reason: input.reason,
      actor_faculty_id: actor.facultyUserId,
    });
    await trx('hr_employee_appraisals').where({ id: appraisalId }).update({
      status: 'CALIBRATION',
      calibrated_score: roundScore(input.calibratedScore),
      final_score: roundScore(input.calibratedScore),
      final_rating_label: mapped.label,
      final_rating_value: mapped.value,
      calibrated_at: trx.fn.now(),
      calibrated_by: actor.facultyUserId,
      updated_at: trx.fn.now(),
    });
  });

  await recordHrAudit({
    actor,
    action: 'APPRAISAL_CALIBRATED',
    entityType: 'hr_employee_appraisals',
    entityId: appraisalId,
    reason: input.reason,
  });
  return getAppraisalDetail(actor, appraisalId, 'hr');
}

export async function finalizeAppraisal(actor: HrActor, appraisalId: number) {
  assertHrPermission(actor, PERF_FINALIZE);
  const appraisal = await loadAppraisal(actor, appraisalId);
  assertAppraisalMutable(appraisal);
  const status = String(appraisal.status);
  if (!['REVIEW_SUBMITTED', 'CALIBRATION'].includes(status)) {
    throw new AppError(400, 'Appraisal must be reviewed (or calibrated) before finalize');
  }
  assertAppraisalTransition(status as AppraisalStatus, 'FINALIZED');

  // Final score calculated server-side only — never accept from client
  const finalScoreRaw =
    appraisal.calibrated_score != null ? Number(appraisal.calibrated_score) : Number(appraisal.reviewer_score);
  if (!Number.isFinite(finalScoreRaw)) {
    throw new AppError(400, 'Reviewer score required before finalize');
  }
  const finalScore = roundScore(finalScoreRaw);

  const cycle = await loadCycle(actor, Number(appraisal.cycle_id));
  const tpl = await db('hr_appraisal_templates').where({ id: appraisal.template_id }).first();
  const scaleId = tpl?.rating_scale_id ?? cycle.rating_scale_id ?? null;
  const { levels } = await loadRatingLevels(scaleId != null ? Number(scaleId) : null, actor.collegeId);
  const mapped = mapScoreToRating(finalScore, levels);

  await db('hr_employee_appraisals').where({ id: appraisalId }).update({
    status: 'FINALIZED',
    final_score: finalScore,
    final_rating_label: mapped.label,
    final_rating_value: mapped.value,
    finalized_at: db.fn.now(),
    finalized_by: actor.facultyUserId,
    updated_at: db.fn.now(),
  });

  await notifyEmployee({
    employeeId: Number(appraisal.employee_id),
    collegeId: actor.collegeId,
    type: 'APPRAISAL_FINALIZED',
    title: 'Appraisal finalized',
    body: `Final rating: ${mapped.label}`,
    relatedType: 'hr_employee_appraisals',
    relatedId: appraisalId,
    dedupeKey: `appraisal-finalized-${appraisalId}`,
  });
  await recordHrAudit({
    actor,
    action: 'APPRAISAL_FINALIZED',
    entityType: 'hr_employee_appraisals',
    entityId: appraisalId,
  });
  return getAppraisalDetail(actor, appraisalId, 'hr');
}

export async function lockAppraisal(actor: HrActor, appraisalId: number) {
  assertHrPermission(actor, PERF_FINALIZE);
  const appraisal = await loadAppraisal(actor, appraisalId);
  if (String(appraisal.status) === 'LOCKED') return getAppraisalDetail(actor, appraisalId, 'hr');
  if (String(appraisal.status) !== 'FINALIZED') {
    throw new AppError(400, 'Only finalized appraisals can be locked');
  }
  assertAppraisalTransition('FINALIZED', 'LOCKED');
  await db('hr_employee_appraisals').where({ id: appraisalId }).update({
    status: 'LOCKED',
    locked_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  await recordHrAudit({
    actor,
    action: 'APPRAISAL_LOCKED',
    entityType: 'hr_employee_appraisals',
    entityId: appraisalId,
  });
  return getAppraisalDetail(actor, appraisalId, 'hr');
}

/**
 * Reopen creates a new version_no row copying prior; old stays LOCKED.
 */
export async function reopenAppraisal(actor: HrActor, appraisalId: number, raw: unknown) {
  assertHrPermission(actor, PERF_REOPEN);
  const input = reopenSchema.parse(raw);
  const appraisal = await loadAppraisal(actor, appraisalId);
  if (String(appraisal.status) !== 'LOCKED' && String(appraisal.status) !== 'FINALIZED') {
    throw new AppError(400, 'Only finalized or locked appraisals can be reopened');
  }

  // Ensure prior is locked
  if (String(appraisal.status) === 'FINALIZED') {
    assertAppraisalTransition('FINALIZED', 'LOCKED');
    await db('hr_employee_appraisals').where({ id: appraisalId }).update({
      status: 'LOCKED',
      locked_at: db.fn.now(),
      reopen_reason: input.reason,
      updated_at: db.fn.now(),
    });
  }

  let reviewerId =
    appraisal.reviewer_employee_id != null ? Number(appraisal.reviewer_employee_id) : null;
  if (reviewerId === Number(appraisal.employee_id)) reviewerId = null;

  const [newId] = await db('hr_employee_appraisals').insert({
    college_id: appraisal.college_id,
    cycle_id: appraisal.cycle_id,
    employee_id: appraisal.employee_id,
    template_id: appraisal.template_id,
    template_version_no: appraisal.template_version_no,
    version_no: Number(appraisal.version_no) + 1,
    parent_appraisal_id: appraisalId,
    status: 'SELF_REVIEW_IN_PROGRESS',
    department_id: appraisal.department_id,
    designation_id: appraisal.designation_id,
    employee_category: appraisal.employee_category,
    reviewer_employee_id: reviewerId,
    reviewer_source: appraisal.reviewer_source,
    reviewer_resolved_as_of: appraisal.reviewer_resolved_as_of,
    reopen_reason: input.reason,
    evidence_snapshot_version: 0,
  });

  await recordHrAudit({
    actor,
    action: 'APPRAISAL_REOPENED',
    entityType: 'hr_employee_appraisals',
    entityId: Number(newId),
    reason: input.reason,
    after: { parentAppraisalId: appraisalId },
  });
  await notifyEmployee({
    employeeId: Number(appraisal.employee_id),
    collegeId: actor.collegeId,
    type: 'APPRAISAL_REOPENED',
    title: 'Appraisal reopened',
    body: input.reason,
    relatedType: 'hr_employee_appraisals',
    relatedId: Number(newId),
  });
  return getAppraisalDetail(actor, Number(newId), 'hr');
}

export async function upsertDevelopmentPlan(actor: HrActor, appraisalId: number, raw: unknown) {
  assertHrPermission(actor, PERF_MANAGE);
  const input = developmentPlanSchema.parse(raw);
  const appraisal = await loadAppraisal(actor, appraisalId);

  const existing = await db('hr_appraisal_development_plans').where({ appraisal_id: appraisalId }).first();
  let planId: number;
  if (existing) {
    planId = Number(existing.id);
    await db('hr_appraisal_development_plans').where({ id: planId }).update({
      summary: input.summary ?? null,
      updated_at: db.fn.now(),
    });
    await db('hr_appraisal_development_actions').where({ plan_id: planId }).del();
  } else {
    const [id] = await db('hr_appraisal_development_plans').insert({
      appraisal_id: appraisalId,
      college_id: actor.collegeId,
      employee_id: appraisal.employee_id,
      status: 'OPEN',
      summary: input.summary ?? null,
      created_by: actor.facultyUserId,
    });
    planId = Number(id);
  }

  await db('hr_appraisal_development_actions').insert(
    input.actions.map((a) => ({
      plan_id: planId,
      college_id: actor.collegeId,
      development_area: a.developmentArea,
      recommended_training: a.recommendedTraining ?? null,
      target_competency: a.targetCompetency ?? null,
      action: a.action ?? null,
      owner_employee_id: a.ownerEmployeeId ?? null,
      due_date: a.dueDate ?? null,
      status: 'OPEN',
    })),
  );

  return getDevelopmentPlan(actor, appraisalId);
}

export async function getDevelopmentPlan(actor: HrActor, appraisalId: number) {
  const appraisal = await loadAppraisal(actor, appraisalId);
  await assertCanViewAppraisal(actor, appraisal);
  const plan = await db('hr_appraisal_development_plans').where({ appraisal_id: appraisalId }).first();
  if (!plan) return null;
  const actions = await db('hr_appraisal_development_actions').where({ plan_id: plan.id });
  return {
    id: Number(plan.id),
    appraisalId,
    status: plan.status,
    summary: plan.summary,
    actions: actions.map((a: Row) => ({
      id: Number(a.id),
      developmentArea: a.development_area,
      recommendedTraining: a.recommended_training,
      targetCompetency: a.target_competency,
      action: a.action,
      ownerEmployeeId: a.owner_employee_id != null ? Number(a.owner_employee_id) : null,
      dueDate: a.due_date,
      status: a.status,
    })),
  };
}

export async function createPip(actor: HrActor, appraisalId: number, raw: unknown) {
  assertHrPermission(actor, PERF_MANAGE);
  const input = pipSchema.parse(raw);
  const appraisal = await loadAppraisal(actor, appraisalId);
  let reviewerId = input.reviewerEmployeeId ?? (appraisal.reviewer_employee_id != null ? Number(appraisal.reviewer_employee_id) : null);
  if (reviewerId === Number(appraisal.employee_id)) {
    throw new AppError(400, 'PIP reviewer cannot be the subject employee');
  }

  const existing = await db('hr_appraisal_pips').where({ appraisal_id: appraisalId }).first();
  if (existing) throw new AppError(409, 'PIP already exists for this appraisal');

  const [id] = await db('hr_appraisal_pips').insert({
    appraisal_id: appraisalId,
    college_id: actor.collegeId,
    employee_id: appraisal.employee_id,
    reason: input.reason,
    objectives: input.objectives ?? null,
    review_date: input.reviewDate ?? null,
    support_actions: input.supportActions ?? null,
    reviewer_employee_id: reviewerId,
    status: 'OPEN',
  });

  await recordHrAudit({
    actor,
    action: 'APPRAISAL_PIP_CREATED',
    entityType: 'hr_appraisal_pips',
    entityId: Number(id),
  });
  await notifyEmployee({
    employeeId: Number(appraisal.employee_id),
    collegeId: actor.collegeId,
    type: 'APPRAISAL_PIP_CREATED',
    title: 'Performance Improvement Plan created',
    relatedType: 'hr_appraisal_pips',
    relatedId: Number(id),
  });
  return { id: Number(id) };
}

function deptFilter(actor: HrActor, q: import('knex').Knex.QueryBuilder, col = 'a.department_id') {
  if (hasHrPermission(actor, PERF_MANAGE) || actor.role === 'PRINCIPAL') return q;
  if (actor.role === 'HOD' || (actor.leadershipRoles ?? []).includes('HOD')) {
    const depts = actor.hodDepartmentIds?.length
      ? actor.hodDepartmentIds
      : actor.departmentId
        ? [actor.departmentId]
        : [];
    if (depts.length) return q.whereIn(col, depts);
  }
  return q;
}

export async function hrDashboard(actor: HrActor, cycleId?: number) {
  assertHrPermission(actor, PERF_VIEW);
  let q = db('hr_employee_appraisals as a').where({ 'a.college_id': actor.collegeId });
  if (cycleId) q = q.andWhere('a.cycle_id', cycleId);
  const rows = await q.select('a.status');
  const byStatus: Record<string, number> = {};
  for (const r of rows) {
    const s = String(r.status);
    byStatus[s] = (byStatus[s] ?? 0) + 1;
  }
  return { total: rows.length, byStatus };
}

export async function teamDashboard(actor: HrActor, cycleId?: number) {
  const emp = await requireEmployeeForActor(actor);
  let q = db('hr_employee_appraisals as a')
    .where({ 'a.college_id': actor.collegeId, 'a.reviewer_employee_id': emp.id });
  if (cycleId) q = q.andWhere('a.cycle_id', cycleId);
  q = deptFilter(actor, q);
  const rows = await q.select('a.status', 'a.final_score', 'a.final_rating_label');
  return {
    pendingReviews: rows.filter((r: Row) =>
      ['SELF_SUBMITTED', 'REVIEW_IN_PROGRESS'].includes(String(r.status)),
    ).length,
    total: rows.length,
    byStatus: rows.reduce((acc: Record<string, number>, r: Row) => {
      const s = String(r.status);
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {}),
  };
}

export async function principalDashboard(actor: HrActor, cycleId?: number) {
  if (actor.role !== 'PRINCIPAL' && !(actor.leadershipRoles ?? []).includes('PRINCIPAL')) {
    assertHrPermission(actor, PERF_VIEW);
  }
  let q = db('hr_employee_appraisals as a').where({ 'a.college_id': actor.collegeId });
  if (cycleId) q = q.andWhere('a.cycle_id', cycleId);
  const rows = await q.select('a.status', 'a.final_rating_label', 'a.department_id', 'a.final_score');
  const byDept: Record<string, number> = {};
  const byRating: Record<string, number> = {};
  for (const r of rows) {
    const d = String(r.department_id ?? 'none');
    byDept[d] = (byDept[d] ?? 0) + 1;
    if (r.final_rating_label) {
      const lab = String(r.final_rating_label);
      byRating[lab] = (byRating[lab] ?? 0) + 1;
    }
  }
  const hodAppraisals = await listPrincipalHodAppraisals(actor, cycleId);
  return { total: rows.length, byDepartment: byDept, byRating, hodAppraisals };
}

export async function employeeDashboard(actor: HrActor) {
  const emp = await requireEmployeeForActor(actor);
  const rows = await db('hr_employee_appraisals')
    .where({ college_id: actor.collegeId, employee_id: emp.id })
    .orderBy('id', 'desc');
  return {
    appraisals: rows.map((r: Row) => ({
      id: Number(r.id),
      cycleId: Number(r.cycle_id),
      status: r.status,
      finalScore: r.final_score != null ? Number(r.final_score) : null,
      finalRatingLabel: r.final_rating_label,
    })),
  };
}

export async function listRatingScales(actor: HrActor) {
  assertHrPermission(actor, PERF_VIEW);
  await ensureDefaultRatingScale(actor.collegeId, actor);
  const scales = await db('hr_appraisal_rating_scales')
    .where({ college_id: actor.collegeId })
    .orderBy('is_default', 'desc')
    .orderBy('id', 'asc');
  const out = [];
  for (const s of scales as Row[]) {
    const levels = await db('hr_appraisal_rating_levels')
      .where({ scale_id: s.id, college_id: actor.collegeId })
      .orderBy('sort_order', 'asc');
    out.push({
      id: Number(s.id),
      code: s.code,
      name: s.name,
      isActive: !!s.is_active,
      isDefault: !!s.is_default,
      levels: levels.map((l: Row) => ({
        score: Number(l.score),
        label: String(l.label),
        minScore: l.min_score != null ? Number(l.min_score) : null,
        maxScore: l.max_score != null ? Number(l.max_score) : null,
        sortOrder: Number(l.sort_order),
      })),
    });
  }
  return out;
}

export async function listAppraisals(
  actor: HrActor,
  filters: { cycleId?: number; status?: string; departmentId?: number } = {},
) {
  assertHrPermission(actor, PERF_VIEW);
  let q = db('hr_employee_appraisals as a')
    .leftJoin('employees as e', 'e.id', 'a.employee_id')
    .where({ 'a.college_id': actor.collegeId })
    .select(
      'a.*',
      'e.display_name as employee_name',
      'e.employee_number as employee_number',
    );
  if (filters.cycleId) q = q.andWhere('a.cycle_id', filters.cycleId);
  if (filters.status) q = q.andWhere('a.status', filters.status);
  if (filters.departmentId) q = q.andWhere('a.department_id', filters.departmentId);
  q = deptFilter(actor, q);
  const rows = await q.orderBy('a.updated_at', 'desc');
  return rows.map((r: Row) => ({
    ...serializeAppraisalBase(r, { canSeeReviewerPrivateNotes: false, canSeeHrNotes: false }),
    employeeName: r.employee_name ?? null,
    employeeNumber: r.employee_number ?? null,
  }));
}

export async function listPendingGoals(actor: HrActor) {
  const emp = await resolveEmployeeForActor(actor);
  if (!emp && !hasHrPermission(actor, PERF_VIEW)) {
    throw new AppError(403, 'No reviewer identity');
  }
  let q = db('hr_appraisal_goals as g')
    .join('hr_employee_appraisals as a', 'a.id', 'g.appraisal_id')
    .join('employees as e', 'e.id', 'a.employee_id')
    .join('hr_appraisal_cycles as c', 'c.id', 'a.cycle_id')
    .where({ 'a.college_id': actor.collegeId })
    .whereIn('g.status', ['SUBMITTED', 'DRAFT'])
    .whereIn('a.status', ['GOALS_PENDING', 'NOT_STARTED', 'GOALS_APPROVED'])
    .select(
      'a.id',
      'a.status',
      'a.employee_id',
      'a.reviewer_employee_id',
      'a.department_id',
      'e.display_name',
      'e.employee_number',
      'c.name as cycle_name',
      'c.code as cycle_code',
      'g.id as goal_id',
      'g.title as goal_title',
      'g.status as goal_status',
      'g.weight as goal_weight',
    );

  if (emp && !hasHrPermission(actor, PERF_MANAGE)) {
    q = q.andWhere('a.reviewer_employee_id', emp.id);
  }
  q = deptFilter(actor, q);

  const rows = await q.orderBy('a.updated_at', 'desc');
  return rows.map((r: Row) => ({
    id: Number(r.id),
    status: r.status,
    employeeId: Number(r.employee_id),
    employeeName: r.display_name,
    employeeNumber: r.employee_number,
    cycleName: r.cycle_name,
    cycleCode: r.cycle_code,
    reviewerEmployeeId: r.reviewer_employee_id != null ? Number(r.reviewer_employee_id) : null,
    goalId: Number(r.goal_id),
    goalTitle: r.goal_title,
    goalStatus: r.goal_status,
    goalWeight: r.goal_weight != null ? Number(r.goal_weight) : null,
  }));
}

export async function listPrincipalHodAppraisals(actor: HrActor, cycleId?: number) {
  if (actor.role !== 'PRINCIPAL' && !(actor.leadershipRoles ?? []).includes('PRINCIPAL')) {
    assertHrPermission(actor, PERF_VIEW);
  }
  let q = db('hr_employee_appraisals as a')
    .join('employees as e', 'e.id', 'a.employee_id')
    .leftJoin('faculty_users as f', 'f.id', 'e.faculty_user_id')
    .where({ 'a.college_id': actor.collegeId })
    .andWhere((qb) => {
      qb.where('f.role', 'HOD').orWhereExists(function () {
        this.select(db.raw('1'))
          .from('academic_leadership_assignments as ala')
          .whereRaw('ala.employee_id = a.employee_id')
          .andWhere({
            'ala.college_id': actor.collegeId,
            'ala.leadership_role': 'HOD',
            'ala.status': 'ACTIVE',
          });
      });
    })
    .select(
      'a.id',
      'a.status',
      'a.employee_id',
      'a.department_id',
      'a.final_score',
      'a.final_rating_label',
      'e.display_name',
      'e.employee_number',
    );
  if (cycleId) q = q.andWhere('a.cycle_id', cycleId);
  const rows = await q.orderBy('a.id', 'desc');
  return rows.map((r: Row) => ({
    id: Number(r.id),
    status: r.status,
    employeeId: Number(r.employee_id),
    employeeName: r.display_name,
    employeeNumber: r.employee_number,
    departmentId: r.department_id != null ? Number(r.department_id) : null,
    finalScore: r.final_score != null ? Number(r.final_score) : null,
    finalRatingLabel: r.final_rating_label,
  }));
}
