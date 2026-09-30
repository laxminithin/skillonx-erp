/**
 * Alumni Impact service (C7) — registry sync, evidence ledger, accreditation,
 * reports, snapshots, gap analysis. Never edits C1–C6 authoritative sources.
 */
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { AlumniAdminActor } from './service.js';
import {
  canAccessImpact,
  canCreateSnapshot,
  canExportImpact,
  canManageAccreditationMappings,
  canOperateImpact,
  canVerifyAccreditationMappings,
  isDepartmentScopedImpact,
} from './accessImpact.js';
import {
  computeAllMetrics,
  drilldownMetric,
  getMetricDef,
  listMetricRegistry,
  resolvePeriod,
  type ImpactFilters,
} from './impactEngine.js';
import {
  FORBIDDEN_IMPACT_CLAIMS,
  KNOWN_LIMITATIONS,
  METRIC_REGISTRY,
  SOURCE_OF_TRUTH_MATRIX,
  criterionCreateSchema,
  frameworkCreateSchema,
  mappingCreateSchema,
  mappingVerifySchema,
  reportBuildSchema,
  snapshotCreateSchema,
  type AttributionLevel,
} from './typesImpact.js';
import { z } from 'zod';

export function assertAccess(actor: AlumniAdminActor) {
  if (!canAccessImpact(actor)) throw new AppError(403, 'Impact access denied');
}
export function assertOperate(actor: AlumniAdminActor) {
  if (!canOperateImpact(actor)) throw new AppError(403, 'Impact operate denied');
}

export function getSourceOfTruthMatrix() {
  return {
    matrix: SOURCE_OF_TRUTH_MATRIX,
    forbiddenClaims: FORBIDDEN_IMPACT_CLAIMS,
    knownLimitations: KNOWN_LIMITATIONS,
    principle:
      'C7 does not invent impact. Activity ≠ engagement ≠ opportunity ≠ outcome ≠ impact without evidence.',
  };
}

export async function audit(input: {
  collegeId: number;
  actorFacultyId?: number | null;
  action: string;
  entityType?: string | null;
  entityId?: number | null;
  metadata?: unknown;
}) {
  if (!(await db.schema.hasTable('alumni_audit_log'))) return;
  await db('alumni_audit_log').insert({
    college_id: input.collegeId,
    actor_type: 'FACULTY',
    actor_faculty_id: input.actorFacultyId ?? null,
    actor_alumni_id: null,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });
}

export async function requireTables() {
  if (!(await db.schema.hasTable('alumni_impact_metric_defs'))) {
    throw new AppError(503, 'Run migration alumni_impact_c7 first');
  }
}

export async function ensureMetricRegistrySeeded(collegeId: number) {
  await requireTables();
  for (const m of METRIC_REGISTRY) {
    const exists = await db('alumni_impact_metric_defs')
      .where({ college_id: null, metric_key: m.metricKey, version: m.version })
      .first()
      .catch(() => null);
    // MySQL NULL unique quirks — also check without college
    const existing = await db('alumni_impact_metric_defs')
      .where({ metric_key: m.metricKey, version: m.version })
      .whereNull('college_id')
      .first();
    if (existing) continue;
    await db('alumni_impact_metric_defs').insert({
      college_id: null,
      metric_key: m.metricKey,
      name: m.name,
      description: m.description,
      impact_domain: m.impactDomain,
      calculation_type: m.calculationType,
      numerator_definition: m.numeratorDefinition ?? null,
      denominator_definition: m.denominatorDefinition ?? null,
      unit: m.unit,
      source_modules: JSON.stringify(m.sourceModules),
      evidence_requirements: m.evidenceRequirements,
      supported_dimensions: JSON.stringify(m.supportedDimensions),
      freshness_expectations: m.freshnessExpectations,
      version: m.version,
      active_from: m.activeFrom,
      retired_at: null,
      is_active: true,
    });
  }
  if (!(await db('alumni_impact_config').where({ college_id: collegeId }).first())) {
    await db('alumni_impact_config').insert({
      college_id: collegeId,
      small_cohort_threshold: 5,
      engagement_lookback_months: 12,
    });
  }
  return { seeded: METRIC_REGISTRY.length };
}

export function getRegistry() {
  return {
    metrics: listMetricRegistry(true),
    versioningNote:
      'Metric definitions are versioned. Historical reports retain the version used at snapshot time. Never silently redefine.',
  };
}

function scopeDepartment(actor: AlumniAdminActor, filters: ImpactFilters): ImpactFilters {
  if (isDepartmentScopedImpact(actor) && actor.departmentId != null) {
    return { ...filters, departmentId: Number(actor.departmentId) };
  }
  return filters;
}

export async function getMetrics(actor: AlumniAdminActor, filters: ImpactFilters = {}) {
  assertAccess(actor);
  await ensureMetricRegistrySeeded(actor.collegeId);
  return computeAllMetrics(actor, scopeDepartment(actor, filters));
}

export async function getDrilldown(
  actor: AlumniAdminActor,
  metricKey: string,
  filters: ImpactFilters = {},
) {
  assertAccess(actor);
  const { canDrillPersonal } = await import('./accessImpact.js');
  const config = await db('alumni_impact_config').where({ college_id: actor.collegeId }).first();
  return drilldownMetric(actor, metricKey, scopeDepartment(actor, filters), {
    allowPersonal: canDrillPersonal(actor),
    smallCohortThreshold: Number(config?.small_cohort_threshold ?? 5),
  });
}

/** Project C2 verified outcomes (+ C5/C6) into the evidence ledger without duplicating SoT. */
export async function syncEvidenceLedger(actor: AlumniAdminActor, filters: ImpactFilters = {}) {
  assertOperate(actor);
  await requireTables();
  const period = await resolvePeriod(actor.collegeId, scopeDepartment(actor, filters));
  let inserted = 0;
  let skipped = 0;

  if (await db.schema.hasTable('alumni_crm_outcomes')) {
    let q = db('alumni_crm_outcomes as o')
      .leftJoin('alumni_profiles as ap', 'ap.id', 'o.alumni_profile_id')
      .where('o.college_id', actor.collegeId)
      .select('o.*', 'ap.historical_department_id');
    if (period.start) q = q.andWhere('o.outcome_date', '>=', period.start);
    if (period.end) q = q.andWhere('o.outcome_date', '<=', period.end);
    if (filters.departmentId) q = q.andWhere('ap.historical_department_id', filters.departmentId);
    const outcomes = await q;

    const domainFor = (t: string) => {
      const map: Record<string, string> = {
        STUDENTS_MENTORED: 'MENTORSHIP',
        INTERNSHIPS_ENABLED: 'INTERNSHIP',
        PLACEMENTS_SUPPORTED: 'RECRUITMENT',
        JOBS_REFERRED: 'RECRUITMENT',
        EXPERT_SESSIONS_DELIVERED: 'EXPERT_ENGAGEMENT',
        PROJECTS_SUPPORTED: 'PROJECT_SUPPORT',
        RESEARCH_COLLABORATIONS: 'RESEARCH_COLLABORATION',
        INDUSTRY_VISITS: 'INDUSTRY_CONNECT',
        STARTUP_SUPPORT: 'INNOVATION_STARTUP',
        BOS_PARTICIPATION: 'BOS_CURRICULUM',
        FINANCIAL_CONTRIBUTION: 'CONTRIBUTION',
        NON_FINANCIAL_CONTRIBUTION: 'CONTRIBUTION',
      };
      return map[t] ?? 'OTHER';
    };
    const metricFor = (t: string) => {
      const map: Record<string, string> = {
        STUDENTS_MENTORED: 'mentorship.completed_cycles',
        INTERNSHIPS_ENABLED: 'internship.positions_enabled',
        PLACEMENTS_SUPPORTED: 'recruitment.placements_supported',
        JOBS_REFERRED: 'recruitment.opportunities',
        EXPERT_SESSIONS_DELIVERED: 'experts.sessions_delivered',
        PROJECTS_SUPPORTED: 'projects.supported',
        RESEARCH_COLLABORATIONS: 'research.collaborations',
        INDUSTRY_VISITS: 'industry.connections',
        STARTUP_SUPPORT: 'innovation.startup_support',
        BOS_PARTICIPATION: 'bos.participation',
        FINANCIAL_CONTRIBUTION: 'contribution.financial_refs',
        NON_FINANCIAL_CONTRIBUTION: 'contribution.non_financial',
      };
      return map[t] ?? null;
    };
    const attr = (t: string, hasEv: boolean): AttributionLevel => {
      if (!hasEv) return 'UNKNOWN';
      if (t === 'JOBS_REFERRED') return 'DIRECT';
      return 'SUPPORTED';
    };

    for (const o of outcomes) {
      const metricKey = metricFor(String(o.outcome_type));
      const sourceRef = `alumni_crm_outcomes:${o.id}`;
      const existing = await db('alumni_impact_evidence_ledger')
        .where({
          college_id: actor.collegeId,
          source_type: 'C2_OUTCOME',
          source_reference: sourceRef,
          metric_key: metricKey,
        })
        .first();
      if (existing) {
        skipped += 1;
        continue;
      }
      await db('alumni_impact_evidence_ledger').insert({
        college_id: actor.collegeId,
        impact_domain: domainFor(String(o.outcome_type)),
        metric_key: metricKey,
        source_type: 'C2_OUTCOME',
        source_reference: sourceRef,
        evidence_reference: o.evidence_reference,
        department_id: o.historical_department_id ?? null,
        programme_id: null,
        academic_year: period.periodLabel,
        event_date: o.outcome_date,
        verification_status: o.verification_status === 'VERIFIED' ? 'VERIFIED' : o.verification_status,
        verified_by: o.verified_by,
        verified_at: o.verified_at,
        attribution_level: attr(String(o.outcome_type), Boolean(o.evidence_reference || o.source_reference)),
        alumni_profile_id: o.alumni_profile_id,
        beneficiary_type: o.beneficiary_type,
        beneficiary_ref: null,
        quantity: o.quantity,
        notes: o.title,
      });
      inserted += 1;
    }
  }

  await audit({
    collegeId: actor.collegeId,
    actorFacultyId: actor.facultyUserId,
    action: 'IMPACT_EVIDENCE_LEDGER_SYNC',
    metadata: { inserted, skipped, period },
  });

  return { inserted, skipped, period };
}

export async function listEvidenceLedger(actor: AlumniAdminActor, query: Record<string, unknown> = {}) {
  assertAccess(actor);
  await requireTables();
  const filters = scopeDepartment(actor, {
    departmentId: query.departmentId ? Number(query.departmentId) : null,
    impactDomain: query.impactDomain ? String(query.impactDomain) : null,
  });
  let q = db('alumni_impact_evidence_ledger as e')
    .leftJoin('alumni_profiles as ap', 'ap.id', 'e.alumni_profile_id')
    .where('e.college_id', actor.collegeId)
    .select(
      'e.*',
      'ap.historical_name as alumni_name',
    )
    .orderBy('e.event_date', 'desc')
    .orderBy('e.id', 'desc')
    .limit(Math.min(Number(query.limit ?? 100), 300));

  if (filters.departmentId) q = q.andWhere('e.department_id', filters.departmentId);
  if (filters.impactDomain) q = q.andWhere('e.impact_domain', filters.impactDomain);
  if (query.metricKey) q = q.andWhere('e.metric_key', String(query.metricKey));
  if (query.verificationStatus) q = q.andWhere('e.verification_status', String(query.verificationStatus));
  if (query.attributionLevel) q = q.andWhere('e.attribution_level', String(query.attributionLevel));

  const rows = await q;
  return {
    items: rows.map((r: any) => ({
      id: Number(r.id),
      impactDomain: r.impact_domain,
      metricKey: r.metric_key,
      sourceType: r.source_type,
      sourceReference: r.source_reference,
      evidenceReference: r.evidence_reference,
      departmentId: r.department_id != null ? Number(r.department_id) : null,
      academicYear: r.academic_year,
      eventDate: r.event_date,
      verificationStatus: r.verification_status,
      attributionLevel: r.attribution_level,
      alumniProfileId: r.alumni_profile_id != null ? Number(r.alumni_profile_id) : null,
      alumniName: r.alumni_name,
      quantity: r.quantity != null ? Number(r.quantity) : null,
      notes: r.notes,
      // never expose contact
    })),
    note: 'Ledger projects source references — authoritative records remain in C1–C6.',
  };
}

export async function analyzeGaps(actor: AlumniAdminActor, filters: ImpactFilters = {}) {
  assertAccess(actor);
  const scoped = scopeDepartment(actor, filters);
  const period = await resolvePeriod(actor.collegeId, scoped);
  const gaps: Array<{
    gapType: string;
    severity: 'INFO' | 'WARN' | 'HIGH';
    sourceType: string;
    sourceReference: string;
    detail: string;
    metricKey?: string | null;
  }> = [];

  if (await db.schema.hasTable('alumni_crm_outcomes')) {
    let q = db('alumni_crm_outcomes as o')
      .leftJoin('alumni_profiles as ap', 'ap.id', 'o.alumni_profile_id')
      .where('o.college_id', actor.collegeId);
    if (period.start) q = q.andWhere('o.outcome_date', '>=', period.start);
    if (period.end) q = q.andWhere('o.outcome_date', '<=', period.end);
    if (scoped.departmentId) q = q.andWhere('ap.historical_department_id', scoped.departmentId);
    const outcomes = await q.select('o.*', 'ap.historical_department_id');

    for (const o of outcomes) {
      const ref = `alumni_crm_outcomes:${o.id}`;
      if (o.verification_status === 'VERIFIED' && !o.evidence_reference && !o.source_reference) {
        gaps.push({
          gapType: 'OUTCOME_WITHOUT_EVIDENCE',
          severity: 'HIGH',
          sourceType: 'C2_OUTCOME',
          sourceReference: ref,
          detail: `Verified outcome "${o.title}" has no evidence_reference`,
        });
      }
      if (['UNVERIFIED', 'PENDING'].includes(String(o.verification_status))) {
        gaps.push({
          gapType: 'EVIDENCE_UNVERIFIED',
          severity: 'WARN',
          sourceType: 'C2_OUTCOME',
          sourceReference: ref,
          detail: `Outcome "${o.title}" verification_status=${o.verification_status}`,
        });
      }
      if (
        ['STUDENTS_MENTORED', 'INTERNSHIPS_ENABLED', 'PLACEMENTS_SUPPORTED'].includes(String(o.outcome_type)) &&
        !o.beneficiary_refs
      ) {
        gaps.push({
          gapType: 'MISSING_BENEFICIARY_LINK',
          severity: 'WARN',
          sourceType: 'C2_OUTCOME',
          sourceReference: ref,
          detail: `Outcome type ${o.outcome_type} lacks beneficiary_refs`,
        });
      }
      if (o.historical_department_id == null) {
        gaps.push({
          gapType: 'MISSING_DEPARTMENT_LINK',
          severity: 'INFO',
          sourceType: 'C2_OUTCOME',
          sourceReference: ref,
          detail: 'Alumni profile missing historical_department_id',
        });
      }
      if (o.verification_status === 'VERIFIED' && !o.evidence_reference) {
        gaps.push({
          gapType: 'ATTRIBUTION_UNKNOWN',
          severity: 'WARN',
          sourceType: 'C2_OUTCOME',
          sourceReference: ref,
          detail: 'Insufficient evidence for attribution stronger than UNKNOWN/ASSOCIATED',
        });
      }
    }
  }

  // Stale profile dependency for engaged alumni
  if (await db.schema.hasTable('alumni_relationships')) {
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    const staleEngaged = await db('alumni_relationships as r')
      .join('alumni_profiles as ap', 'ap.id', 'r.alumni_profile_id')
      .where('r.college_id', actor.collegeId)
      .whereNotNull('r.last_engagement_at')
      .andWhere((qb) => {
        qb.whereNull('ap.contact_verified_at').orWhere('ap.contact_verified_at', '<', yearAgo.toISOString().slice(0, 10));
      })
      .select('ap.id', 'ap.historical_name')
      .limit(50);
    for (const r of staleEngaged) {
      gaps.push({
        gapType: 'STALE_PROFILE_DEPENDENCY',
        severity: 'INFO',
        sourceType: 'C1_PROFILE',
        sourceReference: `alumni_profiles:${r.id}`,
        detail: `Engaged alumnus "${r.historical_name}" has stale/unconfirmed contact`,
      });
    }
  }

  // Metric source incompleteness flags
  const { metrics } = await computeAllMetrics(actor, {
    ...scoped,
    metricKeys: ['alumni.career_coverage', 'alumni.willingness_coverage', 'research.collaborations', 'bos.participation'],
  });
  for (const m of metrics) {
    if (m.denominator != null && m.denominator > 0 && (m.numerator ?? 0) / m.denominator < 0.2) {
      gaps.push({
        gapType: 'METRIC_SOURCE_INCOMPLETE',
        severity: 'WARN',
        sourceType: 'METRIC',
        sourceReference: m.metricKey,
        detail: `${m.name}: ${m.numerator}/${m.denominator} — metric coverage is low; do not over-generalise.`,
        metricKey: m.metricKey,
      });
    }
    if (['research.collaborations', 'bos.participation'].includes(m.metricKey) && (m.value ?? 0) === 0) {
      gaps.push({
        gapType: 'METRIC_SOURCE_INCOMPLETE',
        severity: 'INFO',
        sourceType: 'METRIC',
        sourceReference: m.metricKey,
        detail: m.dataQualityNote ?? 'No verified evidence; module absent — reported as limitation.',
        metricKey: m.metricKey,
      });
    }
  }

  return {
    period,
    gapCount: gaps.length,
    byType: gaps.reduce((acc: Record<string, number>, g) => {
      acc[g.gapType] = (acc[g.gapType] ?? 0) + 1;
      return acc;
    }, {}),
    gaps: gaps.slice(0, 200),
    note: 'Gaps are reported — problematic records are not silently excluded from executive totals without context.',
  };
}

// ── Accreditation (configurable — no fabricated criteria) ─────────────────

export async function listFrameworks(actor: AlumniAdminActor) {
  assertAccess(actor);
  await requireTables();
  const rows = await db('alumni_impact_accred_frameworks')
    .where({ college_id: actor.collegeId })
    .orderBy('code');
  return {
    frameworks: rows.map((r: any) => ({
      id: Number(r.id),
      code: r.code,
      label: r.label,
      description: r.description,
      isActive: Boolean(r.is_active),
    })),
    note: 'No NBA/NAAC criteria are hard-coded. Institutions configure frameworks explicitly.',
  };
}

export async function createFramework(actor: AlumniAdminActor, body: z.infer<typeof frameworkCreateSchema>) {
  if (!canManageAccreditationMappings(actor)) throw new AppError(403, 'Accreditation mapping denied');
  await requireTables();
  const [id] = await db('alumni_impact_accred_frameworks').insert({
    college_id: actor.collegeId,
    code: body.code,
    label: body.label,
    description: body.description ?? null,
    is_active: true,
    created_by_faculty_id: actor.facultyUserId,
  });
  await audit({
    collegeId: actor.collegeId,
    actorFacultyId: actor.facultyUserId,
    action: 'IMPACT_ACCRED_FRAMEWORK_CREATE',
    entityType: 'alumni_impact_accred_frameworks',
    entityId: Number(id),
  });
  return { framework: { id: Number(id), ...body } };
}

export async function createCriterion(actor: AlumniAdminActor, body: z.infer<typeof criterionCreateSchema>) {
  if (!canManageAccreditationMappings(actor)) throw new AppError(403, 'Accreditation mapping denied');
  await requireTables();
  const fw = await db('alumni_impact_accred_frameworks')
    .where({ id: body.frameworkId, college_id: actor.collegeId })
    .first();
  if (!fw) throw new AppError(404, 'Framework not found');
  const [id] = await db('alumni_impact_accred_criteria').insert({
    college_id: actor.collegeId,
    framework_id: body.frameworkId,
    code: body.code,
    label: body.label,
    parent_code: body.parentCode ?? null,
    description: body.description ?? null,
    sort_order: body.sortOrder ?? 0,
    is_active: true,
  });
  await audit({
    collegeId: actor.collegeId,
    actorFacultyId: actor.facultyUserId,
    action: 'IMPACT_ACCRED_CRITERION_CREATE',
    entityType: 'alumni_impact_accred_criteria',
    entityId: Number(id),
  });
  return { criterion: { id: Number(id), ...body } };
}

export async function listCriteria(actor: AlumniAdminActor, frameworkId: number) {
  assertAccess(actor);
  const rows = await db('alumni_impact_accred_criteria')
    .where({ college_id: actor.collegeId, framework_id: frameworkId })
    .orderBy('sort_order')
    .orderBy('code');
  return {
    criteria: rows.map((r: any) => ({
      id: Number(r.id),
      frameworkId: Number(r.framework_id),
      code: r.code,
      label: r.label,
      parentCode: r.parent_code,
      description: r.description,
      sortOrder: Number(r.sort_order),
    })),
  };
}

export async function createMapping(actor: AlumniAdminActor, body: z.infer<typeof mappingCreateSchema>) {
  if (!canManageAccreditationMappings(actor)) throw new AppError(403, 'Accreditation mapping denied');
  await requireTables();
  if (body.metricKey && !getMetricDef(body.metricKey)) {
    throw new AppError(400, `Unknown metric_key: ${body.metricKey}`);
  }
  const [id] = await db('alumni_impact_accred_mappings').insert({
    college_id: actor.collegeId,
    framework_id: body.frameworkId,
    criterion_id: body.criterionId,
    metric_key: body.metricKey ?? null,
    impact_domain: body.impactDomain ?? null,
    outcome_type: body.outcomeType ?? null,
    academic_year: body.academicYear ?? null,
    evidence_references: body.evidenceReferences ? JSON.stringify(body.evidenceReferences) : null,
    notes: body.notes ?? null,
    verification_status: 'DRAFT',
    created_by_faculty_id: actor.facultyUserId,
  });
  await audit({
    collegeId: actor.collegeId,
    actorFacultyId: actor.facultyUserId,
    action: 'IMPACT_ACCRED_MAPPING_CREATE',
    entityType: 'alumni_impact_accred_mappings',
    entityId: Number(id),
  });
  return { mapping: { id: Number(id), ...body, verificationStatus: 'DRAFT' } };
}

export async function verifyMapping(
  actor: AlumniAdminActor,
  mappingId: number,
  body: z.infer<typeof mappingVerifySchema>,
) {
  if (!canVerifyAccreditationMappings(actor)) throw new AppError(403, 'Verify mapping denied');
  const row = await db('alumni_impact_accred_mappings')
    .where({ id: mappingId, college_id: actor.collegeId })
    .first();
  if (!row) throw new AppError(404, 'Mapping not found');
  await db('alumni_impact_accred_mappings').where({ id: mappingId }).update({
    verification_status: body.verificationStatus,
    verified_by: body.verificationStatus === 'VERIFIED' ? actor.facultyUserId : row.verified_by,
    verified_at: body.verificationStatus === 'VERIFIED' ? db.fn.now() : row.verified_at,
    updated_at: db.fn.now(),
  });
  await audit({
    collegeId: actor.collegeId,
    actorFacultyId: actor.facultyUserId,
    action: 'IMPACT_ACCRED_MAPPING_VERIFY',
    entityType: 'alumni_impact_accred_mappings',
    entityId: mappingId,
    metadata: body,
  });
  return { ok: true, id: mappingId, verificationStatus: body.verificationStatus };
}

export async function listMappings(actor: AlumniAdminActor, query: Record<string, unknown> = {}) {
  assertAccess(actor);
  let q = db('alumni_impact_accred_mappings as m')
    .leftJoin('alumni_impact_accred_frameworks as f', 'f.id', 'm.framework_id')
    .leftJoin('alumni_impact_accred_criteria as c', 'c.id', 'm.criterion_id')
    .where('m.college_id', actor.collegeId)
    .select(
      'm.*',
      'f.code as framework_code',
      'f.label as framework_label',
      'c.code as criterion_code',
      'c.label as criterion_label',
    )
    .orderBy('m.id', 'desc')
    .limit(200);
  if (query.frameworkId) q = q.andWhere('m.framework_id', Number(query.frameworkId));
  if (query.academicYear) q = q.andWhere('m.academic_year', String(query.academicYear));
  const rows = await q;
  return {
    mappings: rows.map((r: any) => ({
      id: Number(r.id),
      frameworkId: Number(r.framework_id),
      frameworkCode: r.framework_code,
      frameworkLabel: r.framework_label,
      criterionId: Number(r.criterion_id),
      criterionCode: r.criterion_code,
      criterionLabel: r.criterion_label,
      metricKey: r.metric_key,
      impactDomain: r.impact_domain,
      outcomeType: r.outcome_type,
      academicYear: r.academic_year,
      evidenceReferences: r.evidence_references
        ? typeof r.evidence_references === 'string'
          ? JSON.parse(r.evidence_references)
          : r.evidence_references
        : [],
      notes: r.notes,
      verificationStatus: r.verification_status,
    })),
  };
}

export async function buildEvidencePack(actor: AlumniAdminActor, body: z.infer<typeof reportBuildSchema>) {
  assertAccess(actor);
  if (!canExportImpact(actor)) throw new AppError(403, 'Export denied');
  const filters: ImpactFilters = scopeDepartment(actor, body);
  const { period, metrics } = await computeAllMetrics(actor, filters);
  const evidence = await listEvidenceLedger(actor, {
    departmentId: filters.departmentId,
    impactDomain: filters.impactDomain,
    limit: 200,
  });
  const gaps = await analyzeGaps(actor, filters);
  const pack = {
    institutionCollegeId: actor.collegeId,
    departmentId: filters.departmentId ?? null,
    programmeId: filters.programmeId ?? null,
    academicYear: period.periodLabel,
    period,
    reportType: body.reportType,
    metrics: metrics.map((m) => ({
      metricKey: m.metricKey,
      name: m.name,
      version: m.version,
      definition: m.definition,
      value: m.value,
      numerator: m.numerator,
      denominator: m.denominator,
      unit: m.unit,
      sourceModules: m.sourceModules,
      attributionDefault: m.attributionDefault,
      dataQualityNote: m.dataQualityNote,
    })),
    evidenceReferences: evidence.items,
    gaps: gaps.byType,
    generatedAt: new Date().toISOString(),
    generatedBy: { facultyUserId: actor.facultyUserId, role: actor.role, name: actor.name },
    limitations: KNOWN_LIMITATIONS,
    fabricationNote: 'Evidence pack does not fabricate missing documents or criterion mappings.',
  };

  let snapshotId: number | null = null;
  if (body.createSnapshot) {
    const snap = await createSnapshot(actor, {
      reportType: body.reportType,
      title: `${body.reportType} Evidence Pack ${period.periodLabel ?? ''}`.trim(),
      periodType: period.periodType,
      periodLabel: period.periodLabel,
      start: period.start,
      end: period.end,
      departmentId: filters.departmentId,
      programmeId: filters.programmeId,
      batch: filters.batch,
      graduationYear: filters.graduationYear,
      impactDomain: filters.impactDomain as any,
    });
    snapshotId = snap.snapshot.id;
  }

  await audit({
    collegeId: actor.collegeId,
    actorFacultyId: actor.facultyUserId,
    action: 'IMPACT_EVIDENCE_PACK_GENERATE',
    metadata: { reportType: body.reportType, snapshotId },
  });

  return { pack, snapshotId };
}

export async function buildReport(actor: AlumniAdminActor, body: z.infer<typeof reportBuildSchema>) {
  assertAccess(actor);
  const filters = scopeDepartment(actor, body);
  const metricKeysByReport: Record<string, string[]> = {
    ANNUAL_IMPACT: METRIC_REGISTRY.map((m) => m.metricKey),
    DEPARTMENT: [
      'alumni.total',
      'alumni.verified',
      'engagement.active_alumni',
      'mentorship.students_supported',
      'recruitment.placements_supported',
      'internship.positions_enabled',
      'experts.sessions_delivered',
      'projects.supported',
      'industry.connections',
      'recognition.alumni_recognised',
      'needs.open',
      'needs.fulfilled',
    ],
    MENTORSHIP: ['mentorship.alumni_mentors', 'mentorship.students_supported', 'mentorship.completed_cycles'],
    RECRUITMENT_INTERNSHIP: [
      'recruitment.alumni_recruiters',
      'recruitment.opportunities',
      'recruitment.placements_supported',
      'internship.alumni_enablers',
      'internship.positions_enabled',
      'internship.students_benefited',
    ],
    EXPERT_INDUSTRY: [
      'experts.sessions_delivered',
      'experts.unique_alumni',
      'industry.connections',
      'research.collaborations',
      'bos.participation',
      'innovation.startup_support',
    ],
    RECOGNITION_VALUE: [
      'recognition.alumni_recognised',
      'recognition.value_participants',
      'contribution.financial_refs',
      'contribution.non_financial',
    ],
    ACCREDITATION_EVIDENCE: METRIC_REGISTRY.map((m) => m.metricKey),
    DATA_QUALITY: [
      'alumni.total',
      'alumni.verified_rate',
      'alumni.career_coverage',
      'alumni.contact_coverage',
      'alumni.willingness_coverage',
      'alumni.capability_coverage',
      'alumni.profile_current',
      'alumni.profile_stale',
      'alumni.identity_unresolved',
    ],
    CUSTOM: METRIC_REGISTRY.map((m) => m.metricKey),
  };

  const { period, metrics, config } = await computeAllMetrics(actor, {
    ...filters,
    metricKeys: metricKeysByReport[body.reportType] ?? metricKeysByReport.CUSTOM,
  });

  const report = {
    title: `${body.reportType.replace(/_/g, ' ')} Report`,
    reportType: body.reportType,
    period,
    filters,
    metrics,
    config,
    generatedAt: new Date().toISOString(),
    generatedBy: { facultyUserId: actor.facultyUserId, role: actor.role },
    metricVersions: metrics.map((m) => ({ metricKey: m.metricKey, version: m.version })),
  };

  let snapshotId: number | null = null;
  if (body.createSnapshot) {
    const snap = await createSnapshot(actor, {
      ...body,
      title: report.title,
    });
    snapshotId = snap.snapshot.id;
  }

  await audit({
    collegeId: actor.collegeId,
    actorFacultyId: actor.facultyUserId,
    action: 'IMPACT_REPORT_GENERATE',
    metadata: { reportType: body.reportType, snapshotId },
  });

  return { report, snapshotId };
}

export async function createSnapshot(actor: AlumniAdminActor, body: z.infer<typeof snapshotCreateSchema>) {
  if (!canCreateSnapshot(actor)) throw new AppError(403, 'Snapshot denied');
  await requireTables();
  const filters = scopeDepartment(actor, body);
  const { period, metrics } = await computeAllMetrics(actor, {
    ...filters,
    metricKeys: body.metricKeys ?? undefined,
  });
  const evidence = await listEvidenceLedger(actor, { departmentId: filters.departmentId, limit: 100 });
  const defs = metrics.map((m) => {
    const def = getMetricDef(m.metricKey, m.version);
    return { metricKey: m.metricKey, version: m.version, definition: def };
  });

  const [id] = await db('alumni_impact_report_snapshots').insert({
    college_id: actor.collegeId,
    report_type: body.reportType,
    title: body.title,
    period_type: period.periodType,
    period_label: period.periodLabel,
    period_start: period.start,
    period_end: period.end,
    period_complete: period.complete,
    filters_json: JSON.stringify(filters),
    metric_defs_json: JSON.stringify(defs),
    results_json: JSON.stringify(metrics),
    evidence_refs_json: JSON.stringify(evidence.items.map((i) => i.sourceReference)),
    data_quality_json: JSON.stringify({
      coverageNotes: metrics.filter((m) => m.dataQualityNote).map((m) => ({
        metricKey: m.metricKey,
        note: m.dataQualityNote,
      })),
      periodCoverageNote: period.coverageNote,
    }),
    status: 'FINAL',
    generated_by: actor.facultyUserId,
    generated_at: db.fn.now(),
  });

  await audit({
    collegeId: actor.collegeId,
    actorFacultyId: actor.facultyUserId,
    action: 'IMPACT_SNAPSHOT_CREATE',
    entityType: 'alumni_impact_report_snapshots',
    entityId: Number(id),
  });

  return {
    snapshot: {
      id: Number(id),
      title: body.title,
      reportType: body.reportType,
      period,
      immutable: true,
      note: 'Later source changes must not silently alter this snapshot.',
    },
  };
}

export async function getSnapshot(actor: AlumniAdminActor, id: number) {
  assertAccess(actor);
  const row = await db('alumni_impact_report_snapshots')
    .where({ id, college_id: actor.collegeId })
    .first();
  if (!row) throw new AppError(404, 'Snapshot not found');
  return {
    snapshot: {
      id: Number(row.id),
      reportType: row.report_type,
      title: row.title,
      periodType: row.period_type,
      periodLabel: row.period_label,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      periodComplete: Boolean(row.period_complete),
      filters: JSON.parse(row.filters_json || '{}'),
      metricDefs: JSON.parse(row.metric_defs_json || '[]'),
      results: JSON.parse(row.results_json || '[]'),
      evidenceRefs: JSON.parse(row.evidence_refs_json || '[]'),
      dataQuality: JSON.parse(row.data_quality_json || '{}'),
      status: row.status,
      generatedBy: row.generated_by != null ? Number(row.generated_by) : null,
      generatedAt: row.generated_at ? new Date(row.generated_at).toISOString() : null,
      immutable: true,
    },
  };
}

export async function listSnapshots(actor: AlumniAdminActor) {
  assertAccess(actor);
  const rows = await db('alumni_impact_report_snapshots')
    .where({ college_id: actor.collegeId })
    .orderBy('generated_at', 'desc')
    .limit(50);
  return {
    snapshots: rows.map((r: any) => ({
      id: Number(r.id),
      reportType: r.report_type,
      title: r.title,
      periodLabel: r.period_label,
      periodComplete: Boolean(r.period_complete),
      generatedAt: r.generated_at ? new Date(r.generated_at).toISOString() : null,
      status: r.status,
    })),
  };
}

export async function exportReportCsv(actor: AlumniAdminActor, body: z.infer<typeof reportBuildSchema>) {
  if (!canExportImpact(actor)) throw new AppError(403, 'Export denied');
  const { report } = await buildReport(actor, { ...body, createSnapshot: false });
  const lines = [
    ['report_title', 'period', 'period_complete', 'metric_key', 'metric_version', 'name', 'value', 'numerator', 'denominator', 'unit', 'definition', 'generated_at'].join(','),
  ];
  for (const m of report.metrics) {
    const cells = [
      report.title,
      report.period.periodLabel ?? '',
      String(report.period.complete),
      m.metricKey,
      String(m.version),
      m.name,
      m.value ?? '',
      m.numerator ?? '',
      m.denominator ?? '',
      m.unit,
      `"${(m.definition || '').replace(/"/g, '""')}"`,
      report.generatedAt,
    ];
    lines.push(cells.join(','));
  }
  await audit({
    collegeId: actor.collegeId,
    actorFacultyId: actor.facultyUserId,
    action: 'IMPACT_REPORT_EXPORT',
    metadata: { reportType: body.reportType, format: 'csv' },
  });
  return {
    filename: `alumni-impact-${body.reportType}-${report.period.periodLabel || 'custom'}.csv`,
    contentType: 'text/csv',
    csv: lines.join('\n'),
    period: report.period,
    generatedAt: report.generatedAt,
  };
}
