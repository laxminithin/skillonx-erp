/**
 * Alumni Impact calculation engine (C7).
 * Set-based aggregation from C1–C6. Never invents outcomes or criterion mappings.
 */
import { db } from '../../db/index.js';
import type { AlumniAdminActor } from './service.js';
import {
  METRIC_REGISTRY,
  MEANINGFUL_ENGAGEMENT_DEFINITION_V1,
  type AttributionLevel,
  type ImpactPeriod,
  type MetricDefinitionSeed,
  type MetricResult,
  type PeriodType,
} from './typesImpact.js';

export type ImpactFilters = {
  periodType?: PeriodType;
  periodLabel?: string | null;
  start?: string | null;
  end?: string | null;
  academicYearId?: number | null;
  departmentId?: number | null;
  programmeId?: number | null;
  batch?: string | null;
  graduationYear?: number | null;
  impactDomain?: string | null;
  metricKeys?: string[] | null;
};

function num(v: unknown) {
  return Number(v ?? 0) || 0;
}

function rate(numerator: number, denominator: number): { value: number | null; numerator: number; denominator: number } {
  if (denominator <= 0) return { value: null, numerator, denominator };
  return { value: Math.round((numerator / denominator) * 1000) / 10, numerator, denominator };
}

export function getMetricDef(metricKey: string, version?: number): MetricDefinitionSeed | null {
  const matches = METRIC_REGISTRY.filter((m) => m.metricKey === metricKey);
  if (!matches.length) return null;
  if (version != null) return matches.find((m) => m.version === version) ?? null;
  return matches.sort((a, b) => b.version - a.version)[0];
}

export function listMetricRegistry(activeOnly = true) {
  const rows = activeOnly ? METRIC_REGISTRY.filter((m) => !('retiredAt' in m)) : METRIC_REGISTRY;
  return rows.map((m) => ({
    ...m,
    definitionVersion: m.version,
  }));
}

/** Resolve reporting period. Prefer academic_years.is_current when unspecified. */
export async function resolvePeriod(collegeId: number, filters: ImpactFilters = {}): Promise<ImpactPeriod> {
  const periodType: PeriodType = filters.periodType ?? 'ACADEMIC_YEAR';

  if (periodType === 'CUSTOM' && filters.start && filters.end) {
    const today = new Date().toISOString().slice(0, 10);
    const complete = filters.end < today;
    return {
      periodType,
      periodLabel: filters.periodLabel ?? `${filters.start} → ${filters.end}`,
      start: filters.start,
      end: filters.end,
      complete,
      coverageNote: complete ? null : 'Current custom range is partial — do not compare to a full prior period without noting coverage.',
    };
  }

  if (periodType === 'CALENDAR_YEAR') {
    const year = filters.periodLabel ? Number(filters.periodLabel) : new Date().getFullYear();
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    const today = new Date().toISOString().slice(0, 10);
    const complete = end < today || (year < new Date().getFullYear());
    return {
      periodType,
      periodLabel: String(year),
      start,
      end,
      complete,
      coverageNote: complete ? null : `Calendar year ${year} is incomplete — partial period.`,
    };
  }

  // ACADEMIC_YEAR (default) or SEMESTER (uses AY window)
  let yearRow: any = null;
  if (filters.academicYearId) {
    yearRow = await db('academic_years').where({ id: filters.academicYearId, college_id: collegeId }).first();
  } else if (filters.periodLabel) {
    yearRow = await db('academic_years')
      .where({ college_id: collegeId, label: filters.periodLabel })
      .first();
  } else {
    yearRow = await db('academic_years').where({ college_id: collegeId, is_current: true }).first();
    if (!yearRow) {
      yearRow = await db('academic_years').where({ college_id: collegeId }).orderBy('id', 'desc').first();
    }
  }

  if (!yearRow) {
    // Fallback: last 12 months without claiming a full AY
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 12);
    return {
      periodType: 'CUSTOM',
      periodLabel: filters.periodLabel ?? 'Last 12 months (no academic_years row)',
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      complete: false,
      coverageNote: 'No academic_years configured — using rolling 12 months; mark as partial.',
    };
  }

  const start =
    (yearRow.start_date ? String(yearRow.start_date).slice(0, 10) : null) ||
    inferAyStart(String(yearRow.label || ''));
  const end =
    (yearRow.end_date ? String(yearRow.end_date).slice(0, 10) : null) ||
    inferAyEnd(String(yearRow.label || ''), start);
  const today = new Date().toISOString().slice(0, 10);
  const isCurrent = Boolean(yearRow.is_current);
  const complete = !isCurrent && end != null && end < today;

  return {
    periodType,
    periodLabel: String(yearRow.label || yearRow.code || filters.periodLabel || ''),
    start,
    end,
    complete: complete || (!isCurrent && Boolean(end)),
    academicYearId: Number(yearRow.id),
    academicYearLabel: String(yearRow.label || ''),
    coverageNote: isCurrent
      ? 'Current academic year is partial — do not compare against a completed prior year without noting coverage.'
      : null,
  };
}

function inferAyStart(label: string): string | null {
  const m = label.match(/(20\d{2})\s*[-–/]\s*(20\d{2}|\d{2})/);
  if (!m) return null;
  return `${m[1]}-07-01`;
}

function inferAyEnd(label: string, start: string | null): string | null {
  const m = label.match(/(20\d{2})\s*[-–/]\s*(20\d{2}|\d{2})/);
  if (m) {
    const endYear = m[2].length === 2 ? `20${m[2]}` : m[2];
    return `${endYear}-06-30`;
  }
  if (start) {
    const y = Number(start.slice(0, 4)) + 1;
    return `${y}-06-30`;
  }
  return null;
}

async function getConfig(collegeId: number) {
  if (!(await db.schema.hasTable('alumni_impact_config'))) {
    return { smallCohortThreshold: 5, engagementLookbackMonths: 12 };
  }
  const row = await db('alumni_impact_config').where({ college_id: collegeId }).first();
  return {
    smallCohortThreshold: Number(row?.small_cohort_threshold ?? 5),
    engagementLookbackMonths: Number(row?.engagement_lookback_months ?? 12),
  };
}

function applyAlumniFilters(q: any, filters: ImpactFilters, alias = 'ap') {
  if (filters.departmentId != null) {
    q = q.andWhere(`${alias}.historical_department_id`, filters.departmentId);
  }
  if (filters.graduationYear != null) {
    q = q.andWhere(`${alias}.graduation_year`, filters.graduationYear);
  }
  if (filters.batch) {
    q = q.andWhere(`${alias}.batch_label`, filters.batch);
  }
  return q;
}

function eligibleAlumniQuery(collegeId: number, filters: ImpactFilters) {
  let q = db('alumni_profiles as ap')
    .where('ap.college_id', collegeId)
    .whereNotIn('ap.lifecycle_state', ['ARCHIVED'])
    .where('ap.is_active', true);
  q = applyAlumniFilters(q, filters);
  return q;
}

async function countEligible(collegeId: number, filters: ImpactFilters) {
  const row = await eligibleAlumniQuery(collegeId, filters).count({ c: '*' }).first();
  return num(row?.c);
}

function inPeriod(column: string, period: ImpactPeriod) {
  return (qb: any) => {
    if (period.start) qb.where(column, '>=', period.start);
    if (period.end) qb.where(column, '<=', period.end);
  };
}

async function verifiedOutcomes(
  collegeId: number,
  filters: ImpactFilters,
  period: ImpactPeriod,
  outcomeTypes?: string[],
) {
  if (!(await db.schema.hasTable('alumni_crm_outcomes'))) return [];
  let q = db('alumni_crm_outcomes as o')
    .leftJoin('alumni_profiles as ap', 'ap.id', 'o.alumni_profile_id')
    .where('o.college_id', collegeId)
    .where('o.verification_status', 'VERIFIED')
    .modify(inPeriod('o.outcome_date', period))
    .select(
      'o.id',
      'o.outcome_type',
      'o.quantity',
      'o.alumni_profile_id',
      'o.beneficiary_type',
      'o.beneficiary_refs',
      'o.evidence_reference',
      'o.source_reference',
      'o.outcome_date',
      'ap.historical_department_id',
      'ap.historical_name',
      'ap.graduation_year',
    );
  q = applyAlumniFilters(q, filters);
  if (outcomeTypes?.length) q = q.whereIn('o.outcome_type', outcomeTypes);
  return q;
}

function parseBeneficiaryRefs(raw: unknown): string[] {
  if (raw == null) return [];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return raw ? [raw] : [];
    }
  }
  if (Array.isArray(raw)) return raw.map(String);
  return [];
}

function attributionForOutcome(outcomeType: string, hasEvidence: boolean): AttributionLevel {
  if (!hasEvidence) return 'UNKNOWN';
  if (['JOBS_REFERRED'].includes(outcomeType)) return 'DIRECT';
  if (
    [
      'PLACEMENTS_SUPPORTED',
      'INTERNSHIPS_ENABLED',
      'STUDENTS_MENTORED',
      'EXPERT_SESSIONS_DELIVERED',
      'PROJECTS_SUPPORTED',
    ].includes(outcomeType)
  ) {
    return 'SUPPORTED';
  }
  return 'ASSOCIATED';
}

function resultFromDef(
  def: MetricDefinitionSeed,
  period: ImpactPeriod,
  partial: Partial<MetricResult> & { value: number | null },
): MetricResult {
  return {
    metricKey: def.metricKey,
    name: def.name,
    version: def.version,
    impactDomain: def.impactDomain,
    value: partial.value,
    numerator: partial.numerator ?? null,
    denominator: partial.denominator ?? null,
    unit: def.unit,
    definition: def.description,
    sourceModules: def.sourceModules,
    attributionDefault: partial.attributionDefault ?? 'UNKNOWN',
    period,
    noData: partial.noData,
    dataQualityNote: partial.dataQualityNote ?? null,
    drilldownKey: partial.drilldownKey ?? def.metricKey,
  };
}

export async function computeAllMetrics(
  actor: AlumniAdminActor,
  filters: ImpactFilters = {},
): Promise<{ period: ImpactPeriod; metrics: MetricResult[]; config: Awaited<ReturnType<typeof getConfig>> }> {
  const period = await resolvePeriod(actor.collegeId, filters);
  const config = await getConfig(actor.collegeId);
  const scopedFilters: ImpactFilters = { ...filters };
  // HOD scope enforced by caller via departmentId

  const keys = filters.metricKeys?.length
    ? filters.metricKeys
    : METRIC_REGISTRY.map((m) => m.metricKey);
  const domainFilter = filters.impactDomain;

  const metrics: MetricResult[] = [];
  const collegeId = actor.collegeId;

  const total = await countEligible(collegeId, scopedFilters);

  // Precompute common sets
  const verified = num(
    (
      await eligibleAlumniQuery(collegeId, scopedFilters)
        .andWhere('ap.verification_state', 'VERIFIED')
        .count({ c: '*' })
        .first()
    )?.c,
  );

  const reachable = num(
    (
      await eligibleAlumniQuery(collegeId, scopedFilters)
        .leftJoin('students as st', 'st.id', 'ap.student_id')
        .andWhere((qb) => {
          qb.whereNotNull('ap.phone_override')
            .orWhereNotNull('st.phone')
            .orWhereNotNull('ap.contact_verified_at')
            .orWhereNotNull('ap.email');
        })
        .countDistinct({ c: 'ap.id' })
        .first()
    )?.c,
  );

  const unreachable = Math.max(0, total - reachable);

  // Freshness: approximate with contact_verified_at within 365 days = current
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const yearAgoStr = yearAgo.toISOString().slice(0, 10);
  const profileCurrent = num(
    (
      await eligibleAlumniQuery(collegeId, scopedFilters)
        .andWhere('ap.contact_verified_at', '>=', yearAgoStr)
        .count({ c: '*' })
        .first()
    )?.c,
  );
  const profileStale = Math.max(0, total - profileCurrent);

  let careerCovered = 0;
  if (await db.schema.hasTable('alumni_employment')) {
    const emp = await db('alumni_employment as e')
      .join('alumni_profiles as ap', 'ap.id', 'e.alumni_profile_id')
      .where('ap.college_id', collegeId)
      .whereNotIn('ap.lifecycle_state', ['ARCHIVED'])
      .modify((qb) => applyAlumniFilters(qb, scopedFilters))
      .countDistinct({ c: 'e.alumni_profile_id' })
      .first();
    careerCovered = num(emp?.c);
  }
  if (await db.schema.hasTable('alumni_higher_studies')) {
    const hs = await db('alumni_higher_studies as h')
      .join('alumni_profiles as ap', 'ap.id', 'h.alumni_profile_id')
      .where('ap.college_id', collegeId)
      .whereNotIn('ap.lifecycle_state', ['ARCHIVED'])
      .modify((qb) => applyAlumniFilters(qb, scopedFilters))
      .countDistinct({ c: 'h.alumni_profile_id' })
      .first();
    careerCovered = Math.max(careerCovered, num(hs?.c)); // will union properly below
  }
  // Proper union for career coverage
  {
    const ids = new Set<number>();
    for (const table of ['alumni_employment', 'alumni_higher_studies', 'alumni_entrepreneurship']) {
      if (!(await db.schema.hasTable(table))) continue;
      const rows = await db(`${table} as t`)
        .join('alumni_profiles as ap', 'ap.id', 't.alumni_profile_id')
        .where('ap.college_id', collegeId)
        .whereNotIn('ap.lifecycle_state', ['ARCHIVED'])
        .modify((qb) => applyAlumniFilters(qb, scopedFilters))
        .distinct('t.alumni_profile_id');
      for (const r of rows) ids.add(Number(r.alumni_profile_id));
    }
    careerCovered = ids.size;
  }

  let willingnessCovered = 0;
  let capabilityCovered = 0;
  if (await db.schema.hasTable('alumni_interest_capabilities')) {
    const w = await db('alumni_interest_capabilities as ic')
      .join('alumni_profiles as ap', 'ap.id', 'ic.alumni_profile_id')
      .where('ap.college_id', collegeId)
      .whereNotIn('ap.lifecycle_state', ['ARCHIVED'])
      .modify((qb) => applyAlumniFilters(qb, scopedFilters))
      .countDistinct({ c: 'ic.alumni_profile_id' })
      .first();
    willingnessCovered = num(w?.c);
    capabilityCovered = willingnessCovered;
  }

  let identityUnresolved = 0;
  if (await db.schema.hasTable('alumni_identity_candidates')) {
    const row = await db('alumni_identity_candidates')
      .where({ college_id: collegeId })
      .whereIn('status', ['OPEN', 'PENDING', 'CANDIDATE'])
      .count({ c: '*' })
      .first()
      .catch(async () =>
        db('alumni_identity_candidates').where({ college_id: collegeId }).count({ c: '*' }).first(),
      );
    identityUnresolved = num(row?.c);
  }

  // Engagement
  let contacted = 0;
  let responded = 0;
  let engaged = 0;
  let repeat = 0;
  let openFollowups = 0;
  let overdueFollowups = 0;
  let programs = 0;
  let campaigns = 0;
  let oppCompleted = 0;
  let oppActive = 0;

  if (await db.schema.hasTable('alumni_relationships')) {
    const lookback = new Date();
    lookback.setMonth(lookback.getMonth() - config.engagementLookbackMonths);
    const lookbackStr = lookback.toISOString().slice(0, 10);

    contacted = num(
      (
        await db('alumni_relationships as r')
          .join('alumni_profiles as ap', 'ap.id', 'r.alumni_profile_id')
          .where('r.college_id', collegeId)
          .whereNotNull('r.last_contact_at')
          .modify((qb) => applyAlumniFilters(qb, scopedFilters))
          .countDistinct({ c: 'r.alumni_profile_id' })
          .first()
      )?.c,
    );
    responded = num(
      (
        await db('alumni_relationships as r')
          .join('alumni_profiles as ap', 'ap.id', 'r.alumni_profile_id')
          .where('r.college_id', collegeId)
          .whereNotNull('r.last_response_at')
          .modify((qb) => applyAlumniFilters(qb, scopedFilters))
          .countDistinct({ c: 'r.alumni_profile_id' })
          .first()
      )?.c,
    );

    const engagedIds = new Set<number>();
    const byEngagement = await db('alumni_relationships as r')
      .join('alumni_profiles as ap', 'ap.id', 'r.alumni_profile_id')
      .where('r.college_id', collegeId)
      .where('r.last_engagement_at', '>=', lookbackStr)
      .modify((qb) => applyAlumniFilters(qb, scopedFilters))
      .select('r.alumni_profile_id');
    for (const r of byEngagement) engagedIds.add(Number(r.alumni_profile_id));

    if (await db.schema.hasTable('alumni_crm_interactions')) {
      const meaningful = await db('alumni_crm_interactions as i')
        .join('alumni_profiles as ap', 'ap.id', 'i.alumni_profile_id')
        .where('i.college_id', collegeId)
        .where('i.is_meaningful_engagement', true)
        .where('i.occurred_at', '>=', lookbackStr)
        .modify((qb) => applyAlumniFilters(qb, scopedFilters))
        .select('i.alumni_profile_id');
      for (const r of meaningful) engagedIds.add(Number(r.alumni_profile_id));
    }

    const verifiedInPeriod = await verifiedOutcomes(collegeId, scopedFilters, period);
    for (const o of verifiedInPeriod) engagedIds.add(Number(o.alumni_profile_id));

    engaged = engagedIds.size;

    repeat = num(
      (
        await db('alumni_relationships as r')
          .join('alumni_profiles as ap', 'ap.id', 'r.alumni_profile_id')
          .where('r.college_id', collegeId)
          .where('r.relationship_stage', 'REPEAT_ENGAGEMENT')
          .modify((qb) => applyAlumniFilters(qb, scopedFilters))
          .countDistinct({ c: 'r.alumni_profile_id' })
          .first()
      )?.c,
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  if (await db.schema.hasTable('alumni_crm_followups')) {
    openFollowups = num(
      (
        await db('alumni_crm_followups')
          .where({ college_id: collegeId })
          .whereIn('status', ['OPEN', 'IN_PROGRESS', 'OVERDUE'])
          .count({ c: '*' })
          .first()
      )?.c,
    );
    overdueFollowups = num(
      (
        await db('alumni_crm_followups')
          .where({ college_id: collegeId })
          .where((b) => {
            b.where('status', 'OVERDUE').orWhere((b2) => {
              b2.whereIn('status', ['OPEN', 'IN_PROGRESS']).where('due_date', '<', today);
            });
          })
          .count({ c: '*' })
          .first()
      )?.c,
    );
  }

  if (await db.schema.hasTable('alumni_engagement_programs')) {
    let q = db('alumni_engagement_programs').where({ college_id: collegeId });
    if (period.periodLabel) q = q.andWhere((qb) => {
      qb.where('academic_year', period.periodLabel!).orWhereNull('academic_year');
    });
    if (scopedFilters.departmentId) q = q.andWhere('department_id', scopedFilters.departmentId);
    programs = num((await q.count({ c: '*' }).first())?.c);
  }
  if (await db.schema.hasTable('alumni_engagement_campaigns')) {
    campaigns = num(
      (await db('alumni_engagement_campaigns').where({ college_id: collegeId }).count({ c: '*' }).first())?.c,
    );
  }
  if (await db.schema.hasTable('alumni_crm_opportunities')) {
    oppCompleted = num(
      (
        await db('alumni_crm_opportunities')
          .where({ college_id: collegeId, status: 'COMPLETED' })
          .count({ c: '*' })
          .first()
      )?.c,
    );
    oppActive = num(
      (
        await db('alumni_crm_opportunities')
          .where({ college_id: collegeId })
          .whereIn('status', ['IDENTIFIED', 'QUALIFYING', 'CONFIRMED', 'IN_PROGRESS'])
          .count({ c: '*' })
          .first()
      )?.c,
    );
  }

  const allVerified = await verifiedOutcomes(collegeId, scopedFilters, period);
  const byType = (types: string[]) => allVerified.filter((o: any) => types.includes(String(o.outcome_type)));
  const uniqueAlumni = (rows: any[]) => new Set(rows.map((r) => Number(r.alumni_profile_id))).size;
  const sumQty = (rows: any[]) => rows.reduce((s, r) => s + (num(r.quantity) || 1), 0);

  const mentored = byType(['STUDENTS_MENTORED']);
  const placements = byType(['PLACEMENTS_SUPPORTED', 'JOBS_REFERRED']);
  const internships = byType(['INTERNSHIPS_ENABLED']);
  const experts = byType(['EXPERT_SESSIONS_DELIVERED']);
  const projects = byType(['PROJECTS_SUPPORTED']);
  const research = byType(['RESEARCH_COLLABORATIONS']);
  const bos = byType(['BOS_PARTICIPATION']);
  const startup = byType(['STARTUP_SUPPORT']);
  const industry = byType(['INDUSTRY_VISITS']);
  const financial = byType(['FINANCIAL_CONTRIBUTION']);
  const nonFin = byType(['NON_FINANCIAL_CONTRIBUTION']);

  let foundersEngaged = 0;
  if (await db.schema.hasTable('alumni_entrepreneurship')) {
    const founders = await db('alumni_entrepreneurship as e')
      .join('alumni_profiles as ap', 'ap.id', 'e.alumni_profile_id')
      .where('ap.college_id', collegeId)
      .whereNotIn('ap.lifecycle_state', ['ARCHIVED'])
      .modify((qb) => applyAlumniFilters(qb, scopedFilters))
      .select('e.alumni_profile_id');
    const founderIds = new Set<number>(founders.map((f: any) => Number(f.alumni_profile_id)));
    const startupAlumni = new Set<number>(startup.map((s: any) => Number(s.alumni_profile_id)));
    foundersEngaged = [...founderIds].filter((id) => startupAlumni.has(id) || engaged > 0).length;
    // Prefer: founders who appear in engaged set or have startup outcomes
    if (await db.schema.hasTable('alumni_relationships')) {
      const engagedFounders = await db('alumni_relationships as r')
        .where('r.college_id', collegeId)
        .whereIn('r.alumni_profile_id', [...founderIds])
        .whereNotNull('r.last_engagement_at')
        .countDistinct({ c: 'r.alumni_profile_id' })
        .first();
      foundersEngaged = Math.max(num(engagedFounders?.c), uniqueAlumni(startup));
    } else {
      foundersEngaged = uniqueAlumni(startup);
    }
  }

  let recognised = 0;
  let valueParticipants = 0;
  if (await db.schema.hasTable('alumni_recognition_records')) {
    let q = db('alumni_recognition_records as r')
      .join('alumni_profiles as ap', 'ap.id', 'r.alumni_profile_id')
      .where('r.college_id', collegeId)
      .whereIn('r.status', ['ISSUED', 'CORRECTED'])
      .modify((qb) => applyAlumniFilters(qb, scopedFilters));
    if (period.periodLabel) {
      q = q.andWhere((qb) => {
        qb.where('r.academic_year', period.periodLabel!).orWhereNull('r.academic_year');
      });
    }
    recognised = num((await q.countDistinct({ c: 'r.alumni_profile_id' }).first())?.c);
  }
  if (await db.schema.hasTable('alumni_value_participations')) {
    valueParticipants = num(
      (
        await db('alumni_value_participations as p')
          .join('alumni_profiles as ap', 'ap.id', 'p.alumni_profile_id')
          .where('p.college_id', collegeId)
          .whereNotIn('p.status', ['DECLINED', 'CANCELLED'])
          .modify((qb) => applyAlumniFilters(qb, scopedFilters))
          .countDistinct({ c: 'p.alumni_profile_id' })
          .first()
      )?.c,
    );
  }

  // Student beneficiaries
  const beneficiaryKeys = new Set<string>();
  let beneficiaryInteractions = 0;
  for (const o of allVerified) {
    const refs = parseBeneficiaryRefs(o.beneficiary_refs);
    if (refs.length) {
      for (const ref of refs) beneficiaryKeys.add(ref);
      beneficiaryInteractions += refs.length;
    } else if (o.quantity) {
      beneficiaryInteractions += num(o.quantity);
    }
  }
  if (await db.schema.hasTable('alumni_connect_beneficiaries')) {
    let bq = db('alumni_connect_beneficiaries as b')
      .join('alumni_connect_needs as n', 'n.id', 'b.need_id')
      .where('n.college_id', collegeId);
    if (scopedFilters.departmentId) bq = bq.andWhere('n.department_id', scopedFilters.departmentId);
    const brows = await bq.select('b.beneficiary_type', 'b.beneficiary_ref');
    for (const b of brows) {
      const key = `${b.beneficiary_type}:${b.beneficiary_ref}`;
      if (key) {
        beneficiaryKeys.add(key);
        beneficiaryInteractions += 1;
      }
    }
  }

  // Needs funnel
  let needsOpen = 0;
  let needsFulfilled = 0;
  if (await db.schema.hasTable('alumni_connect_needs')) {
    let nq = db('alumni_connect_needs').where({ college_id: collegeId });
    if (scopedFilters.departmentId) nq = nq.andWhere('department_id', scopedFilters.departmentId);
    needsOpen = num(
      (
        await nq
          .clone()
          .whereNotIn('status', ['FULFILLED', 'CANCELLED', 'CLOSED'])
          .count({ c: '*' })
          .first()
      )?.c,
    );
    needsFulfilled = num(
      (await nq.clone().whereIn('status', ['FULFILLED']).count({ c: '*' }).first())?.c,
    );
  }

  const verifiedRate = rate(verified, total);
  const careerRate = rate(careerCovered, total);
  const contactRate = rate(reachable, total);
  const willingnessRate = rate(willingnessCovered, total);
  const capabilityRate = rate(capabilityCovered, total);
  const responseRate = rate(responded, contacted);
  const oppConversion = rate(oppCompleted, oppCompleted + oppActive);

  const computed: Record<string, Partial<MetricResult> & { value: number | null }> = {
    'alumni.total': { value: total, numerator: total, denominator: null, attributionDefault: 'UNKNOWN' },
    'alumni.verified': { value: verified, numerator: verified, denominator: total, attributionDefault: 'UNKNOWN' },
    'alumni.verified_rate': {
      value: verifiedRate.value,
      numerator: verified,
      denominator: total,
      attributionDefault: 'UNKNOWN',
      dataQualityNote: total === 0 ? 'No eligible alumni population' : null,
    },
    'alumni.reachable': { value: reachable, numerator: reachable, denominator: total },
    'alumni.unreachable': { value: unreachable, numerator: unreachable, denominator: total },
    'alumni.profile_current': {
      value: profileCurrent,
      numerator: profileCurrent,
      denominator: total,
      dataQualityNote: 'Approximated via contact_verified_at within 12 months (C1 freshness proxy). Incomplete ≠ inactive.',
    },
    'alumni.profile_stale': {
      value: profileStale,
      numerator: profileStale,
      denominator: total,
      dataQualityNote: 'Stale ≠ inactive alumni.',
    },
    'alumni.career_coverage': { value: careerRate.value, numerator: careerCovered, denominator: total },
    'alumni.contact_coverage': { value: contactRate.value, numerator: reachable, denominator: total },
    'alumni.willingness_coverage': { value: willingnessRate.value, numerator: willingnessCovered, denominator: total },
    'alumni.capability_coverage': { value: capabilityRate.value, numerator: capabilityCovered, denominator: total },
    'alumni.identity_unresolved': { value: identityUnresolved },
    'engagement.contacted': { value: contacted },
    'engagement.responded': { value: responded },
    'engagement.active_alumni': {
      value: engaged,
      dataQualityNote: MEANINGFUL_ENGAGEMENT_DEFINITION_V1,
    },
    'engagement.repeat_alumni': { value: repeat },
    'engagement.response_rate': { value: responseRate.value, numerator: responded, denominator: contacted },
    'engagement.open_followups': { value: openFollowups },
    'engagement.overdue_followups': { value: overdueFollowups },
    'engagement.programs': { value: programs },
    'engagement.campaigns': { value: campaigns },
    'engagement.opportunity_conversion': {
      value: oppConversion.value,
      numerator: oppCompleted,
      denominator: oppCompleted + oppActive,
    },
    'mentorship.alumni_mentors': {
      value: uniqueAlumni(mentored),
      attributionDefault: 'SUPPORTED',
      dataQualityNote: 'Invitation/willingness not counted. Source: verified C2 STUDENTS_MENTORED.',
    },
    'mentorship.students_supported': {
      value: sumQty(mentored),
      attributionDefault: 'SUPPORTED',
    },
    'mentorship.completed_cycles': { value: mentored.length, attributionDefault: 'SUPPORTED' },
    'recruitment.alumni_recruiters': {
      value: uniqueAlumni(placements),
      attributionDefault: 'SUPPORTED',
      dataQualityNote: 'ALUMNI_SUPPORTED / ALUMNI_REFERRED — does not claim placement causation.',
    },
    'recruitment.opportunities': { value: placements.length + oppCompleted, attributionDefault: 'SUPPORTED' },
    'recruitment.placements_supported': {
      value: sumQty(byType(['PLACEMENTS_SUPPORTED'])),
      attributionDefault: 'SUPPORTED',
      dataQualityNote: 'ALUMNI_SUPPORTED. Not institutional placement rate (see placement/analytics).',
    },
    'internship.alumni_enablers': { value: uniqueAlumni(internships), attributionDefault: 'SUPPORTED' },
    'internship.positions_enabled': { value: sumQty(internships), attributionDefault: 'SUPPORTED' },
    'internship.students_benefited': {
      value: (() => {
        const keys = new Set<string>();
        for (const o of internships) {
          for (const ref of parseBeneficiaryRefs(o.beneficiary_refs)) keys.add(ref);
        }
        return keys.size || sumQty(internships);
      })(),
      attributionDefault: 'SUPPORTED',
      dataQualityNote: 'Unique beneficiary refs when present; else quantity sum (interactions).',
    },
    'experts.sessions_delivered': { value: sumQty(experts), attributionDefault: 'SUPPORTED' },
    'experts.unique_alumni': { value: uniqueAlumni(experts), attributionDefault: 'SUPPORTED' },
    'projects.alumni_mentors': { value: uniqueAlumni(projects), attributionDefault: 'SUPPORTED' },
    'projects.supported': { value: sumQty(projects), attributionDefault: 'SUPPORTED' },
    'research.collaborations': {
      value: research.length,
      attributionDefault: 'SUPPORTED',
      dataQualityNote: 'No Research module — verified C2/C5 only.',
      noData: research.length === 0 ? undefined : undefined,
    },
    'bos.participation': {
      value: bos.length,
      attributionDefault: 'SUPPORTED',
      dataQualityNote: 'No BoS module — verified C2/C5 only.',
    },
    'innovation.founders_engaged': { value: foundersEngaged, attributionDefault: 'ASSOCIATED' },
    'innovation.startup_support': {
      value: startup.length,
      attributionDefault: 'SUPPORTED',
      dataQualityNote: 'No funding/investment estimates.',
    },
    'industry.connections': { value: industry.length, attributionDefault: 'SUPPORTED' },
    'recognition.alumni_recognised': { value: recognised, attributionDefault: 'DIRECT' },
    'recognition.value_participants': { value: valueParticipants, attributionDefault: 'DIRECT' },
    'contribution.financial_refs': {
      value: financial.length,
      attributionDefault: 'SUPPORTED',
      dataQualityNote: 'Count of verified finance-referenced outcomes — not a fee-collection total.',
    },
    'contribution.non_financial': {
      value: nonFin.length + mentored.length + experts.length + projects.length,
      attributionDefault: 'SUPPORTED',
      dataQualityNote: 'No invented monetary value for non-financial contribution.',
    },
    'students.unique_benefited': { value: beneficiaryKeys.size, attributionDefault: 'SUPPORTED' },
    'students.beneficiary_interactions': { value: beneficiaryInteractions, attributionDefault: 'SUPPORTED' },
    'needs.open': { value: needsOpen },
    'needs.fulfilled': { value: needsFulfilled },
  };

  for (const key of keys) {
    const def = getMetricDef(key);
    if (!def) continue;
    if (domainFilter && def.impactDomain !== domainFilter) continue;
    const partial = computed[key];
    if (!partial) continue;
    metrics.push(resultFromDef(def, period, partial));
  }

  return { period, metrics, config };
}

export async function computeFunnels(actor: AlumniAdminActor, filters: ImpactFilters = {}) {
  const { period, metrics, config } = await computeAllMetrics(actor, filters);
  const pick = (k: string) => metrics.find((m) => m.metricKey === k)?.value ?? 0;

  const engagementFunnel = [
    { stage: 'ALUMNI_IDENTIFIED', value: pick('alumni.total'), note: 'Eligible alumni base' },
    { stage: 'REACHABLE', value: pick('alumni.reachable'), note: 'Has contact channel' },
    { stage: 'ENGAGED', value: pick('engagement.active_alumni'), note: MEANINGFUL_ENGAGEMENT_DEFINITION_V1 },
    { stage: 'OPPORTUNITY', value: pick('engagement.opportunity_conversion') != null
      ? (metrics.find((m) => m.metricKey === 'engagement.opportunity_conversion')?.denominator ?? 0)
      : 0, note: 'CRM opportunities (active+completed)' },
    { stage: 'ACTION', value: metrics.find((m) => m.metricKey === 'engagement.opportunity_conversion')?.numerator ?? 0, note: 'Completed opportunities' },
    { stage: 'VERIFIED_OUTCOME', value: metrics.filter((m) => ['mentorship.completed_cycles', 'recruitment.placements_supported', 'internship.positions_enabled', 'experts.sessions_delivered'].includes(m.metricKey)).reduce((s, m) => s + (m.value ?? 0), 0), note: 'Verified outcome counts (mixed domains)' },
  ];

  // C4 program funnel from recipients if available
  let programFunnel = [
    { stage: 'TARGETED', value: 0 },
    { stage: 'ELIGIBLE', value: 0 },
    { stage: 'CONTACTED', value: 0 },
    { stage: 'RESPONDED', value: 0 },
    { stage: 'INTERESTED', value: 0 },
    { stage: 'OPPORTUNITY', value: 0 },
    { stage: 'VERIFIED_OUTCOME', value: 0 },
  ];
  if (await db.schema.hasTable('alumni_engagement_recipients')) {
    const rows = (await db('alumni_engagement_recipients')
      .where({ college_id: actor.collegeId })
      .select('funnel_stage')
      .count({ c: '*' })
      .groupBy('funnel_stage')) as Array<{ funnel_stage: string | null; c: string | number }>;
    const map: Record<string, number> = {};
    for (const r of rows) map[String(r.funnel_stage)] = num(r.c);
    programFunnel = [
      { stage: 'TARGETED', value: map.TARGETED ?? Object.values(map).reduce((a, b) => a + b, 0) },
      { stage: 'ELIGIBLE', value: map.ELIGIBLE ?? 0 },
      { stage: 'CONTACTED', value: map.CONTACTED ?? 0 },
      { stage: 'RESPONDED', value: map.RESPONDED ?? 0 },
      { stage: 'INTERESTED', value: map.INTERESTED ?? 0 },
      { stage: 'OPPORTUNITY', value: map.OPPORTUNITY ?? map.OPPORTUNITY_IDENTIFIED ?? 0 },
      { stage: 'VERIFIED_OUTCOME', value: map.VERIFIED_OUTCOME ?? map.OUTCOME_ACHIEVED ?? 0 },
    ];
  }

  // Need-to-impact funnel (C5)
  let needFunnel = [
    { stage: 'NEEDS_CREATED', value: 0 },
    { stage: 'NEEDS_MATCHED', value: 0 },
    { stage: 'NEEDS_SHORTLISTED', value: 0 },
    { stage: 'ENGAGEMENT_INITIATED', value: 0 },
    { stage: 'OPPORTUNITIES_CREATED', value: 0 },
    { stage: 'PARTIALLY_FULFILLED', value: 0 },
    { stage: 'FULFILLED', value: pick('needs.fulfilled') },
    { stage: 'VERIFIED_BENEFICIARIES', value: pick('students.unique_benefited') },
  ];
  if (await db.schema.hasTable('alumni_connect_needs')) {
    let q = db('alumni_connect_needs').where({ college_id: actor.collegeId });
    if (filters.departmentId) q = q.andWhere('department_id', filters.departmentId);
    const byStatus = (await q.select('status').count({ c: '*' }).groupBy('status')) as Array<{
      status: string | null;
      c: string | number;
    }>;
    const map: Record<string, number> = {};
    for (const r of byStatus) map[String(r.status)] = num(r.c);
    const totalNeeds = Object.values(map).reduce((a, b) => a + b, 0);
    let shortlisted = 0;
    if (await db.schema.hasTable('alumni_connect_shortlist')) {
      shortlisted = num(
        (
          await db('alumni_connect_shortlist as s')
            .join('alumni_connect_needs as n', 'n.id', 's.need_id')
            .where('n.college_id', actor.collegeId)
            .countDistinct({ c: 's.need_id' })
            .first()
        )?.c,
      );
    }
    needFunnel = [
      { stage: 'NEEDS_CREATED', value: totalNeeds },
      { stage: 'NEEDS_MATCHED', value: map.MATCHED ?? map.MATCHING ?? shortlisted },
      { stage: 'NEEDS_SHORTLISTED', value: shortlisted },
      { stage: 'ENGAGEMENT_INITIATED', value: map.ENGAGEMENT_INITIATED ?? map.IN_PROGRESS ?? 0 },
      { stage: 'OPPORTUNITIES_CREATED', value: map.OPPORTUNITY ?? 0 },
      { stage: 'PARTIALLY_FULFILLED', value: map.PARTIALLY_FULFILLED ?? 0 },
      { stage: 'FULFILLED', value: map.FULFILLED ?? 0 },
      { stage: 'VERIFIED_BENEFICIARIES', value: pick('students.unique_benefited') },
    ];
  }

  return {
    period,
    config,
    note: 'Funnels are factual pipelines — not every alumnus is expected to traverse every stage.',
    engagementFunnel,
    programFunnel,
    needFunnel,
  };
}

export async function drilldownMetric(
  actor: AlumniAdminActor,
  metricKey: string,
  filters: ImpactFilters = {},
  opts: { allowPersonal?: boolean; smallCohortThreshold?: number } = {},
) {
  const period = await resolvePeriod(actor.collegeId, filters);
  const def = getMetricDef(metricKey);
  if (!def) return { error: 'Unknown metric', metricKey };

  const rows: any[] = [];
  const collegeId = actor.collegeId;

  if (metricKey.startsWith('alumni.')) {
    let q = eligibleAlumniQuery(collegeId, filters);
    if (metricKey === 'alumni.verified') q = q.andWhere('ap.verification_state', 'VERIFIED');
    if (metricKey === 'alumni.reachable') {
      q = q
        .leftJoin('students as st', 'st.id', 'ap.student_id')
        .andWhere((qb) => {
          qb.whereNotNull('ap.phone_override')
            .orWhereNotNull('st.phone')
            .orWhereNotNull('ap.contact_verified_at')
            .orWhereNotNull('ap.email');
        });
    }
    const list = await q
      .select(
        'ap.id',
        'ap.historical_name',
        'ap.historical_usn',
        'ap.verification_state',
        'ap.lifecycle_state',
        'ap.graduation_year',
        'ap.historical_department_id',
        'ap.batch_label',
      )
      .limit(200);
    for (const r of list) {
      rows.push({
        alumniProfileId: Number(r.id),
        name: r.historical_name,
        usn: r.historical_usn,
        verificationState: r.verification_state,
        lifecycleState: r.lifecycle_state,
        graduationYear: r.graduation_year,
        departmentId: r.historical_department_id != null ? Number(r.historical_department_id) : null,
        batch: r.batch_label,
        source: 'C1',
      });
    }
  } else if (
    [
      'mentorship.alumni_mentors',
      'mentorship.students_supported',
      'mentorship.completed_cycles',
      'recruitment.alumni_recruiters',
      'recruitment.placements_supported',
      'internship.alumni_enablers',
      'internship.positions_enabled',
      'internship.students_benefited',
      'experts.sessions_delivered',
      'experts.unique_alumni',
      'projects.alumni_mentors',
      'projects.supported',
      'research.collaborations',
      'bos.participation',
      'innovation.startup_support',
      'industry.connections',
      'contribution.financial_refs',
      'contribution.non_financial',
    ].includes(metricKey) ||
    metricKey.startsWith('recruitment.') ||
    metricKey.startsWith('internship.')
  ) {
    const typeMap: Record<string, string[]> = {
      'mentorship.alumni_mentors': ['STUDENTS_MENTORED'],
      'mentorship.students_supported': ['STUDENTS_MENTORED'],
      'mentorship.completed_cycles': ['STUDENTS_MENTORED'],
      'recruitment.alumni_recruiters': ['PLACEMENTS_SUPPORTED', 'JOBS_REFERRED'],
      'recruitment.opportunities': ['PLACEMENTS_SUPPORTED', 'JOBS_REFERRED'],
      'recruitment.placements_supported': ['PLACEMENTS_SUPPORTED'],
      'internship.alumni_enablers': ['INTERNSHIPS_ENABLED'],
      'internship.positions_enabled': ['INTERNSHIPS_ENABLED'],
      'internship.students_benefited': ['INTERNSHIPS_ENABLED'],
      'experts.sessions_delivered': ['EXPERT_SESSIONS_DELIVERED'],
      'experts.unique_alumni': ['EXPERT_SESSIONS_DELIVERED'],
      'projects.alumni_mentors': ['PROJECTS_SUPPORTED'],
      'projects.supported': ['PROJECTS_SUPPORTED'],
      'research.collaborations': ['RESEARCH_COLLABORATIONS'],
      'bos.participation': ['BOS_PARTICIPATION'],
      'innovation.startup_support': ['STARTUP_SUPPORT'],
      'industry.connections': ['INDUSTRY_VISITS'],
      'contribution.financial_refs': ['FINANCIAL_CONTRIBUTION'],
      'contribution.non_financial': ['NON_FINANCIAL_CONTRIBUTION'],
    };
    const types = typeMap[metricKey] ?? [];
    const outcomes = await verifiedOutcomes(collegeId, filters, period, types.length ? types : undefined);
    for (const o of outcomes) {
      const hasEvidence = Boolean(o.evidence_reference || o.source_reference);
      rows.push({
        outcomeId: Number(o.id),
        outcomeType: o.outcome_type,
        alumniProfileId: Number(o.alumni_profile_id),
        alumniName: o.historical_name,
        departmentId: o.historical_department_id != null ? Number(o.historical_department_id) : null,
        quantity: o.quantity != null ? Number(o.quantity) : 1,
        outcomeDate: o.outcome_date,
        beneficiaries: parseBeneficiaryRefs(o.beneficiary_refs),
        evidenceReference: o.evidence_reference,
        sourceReference: o.source_reference,
        verificationStatus: 'VERIFIED',
        attributionLevel: attributionForOutcome(String(o.outcome_type), hasEvidence),
        source: 'C2_OUTCOME',
      });
    }
  } else if (metricKey.startsWith('engagement.')) {
    if (await db.schema.hasTable('alumni_relationships')) {
      let q = db('alumni_relationships as r')
        .join('alumni_profiles as ap', 'ap.id', 'r.alumni_profile_id')
        .where('r.college_id', collegeId)
        .modify((qb) => applyAlumniFilters(qb, filters))
        .select(
          'r.alumni_profile_id',
          'ap.historical_name',
          'r.relationship_stage',
          'r.last_contact_at',
          'r.last_response_at',
          'r.last_engagement_at',
          'ap.historical_department_id',
        )
        .limit(200);
      if (metricKey === 'engagement.contacted') q = q.whereNotNull('r.last_contact_at');
      if (metricKey === 'engagement.responded') q = q.whereNotNull('r.last_response_at');
      if (metricKey === 'engagement.repeat_alumni') q = q.where('r.relationship_stage', 'REPEAT_ENGAGEMENT');
      if (metricKey === 'engagement.active_alumni') q = q.whereNotNull('r.last_engagement_at');
      const list = await q;
      for (const r of list) {
        rows.push({
          alumniProfileId: Number(r.alumni_profile_id),
          alumniName: r.historical_name,
          stage: r.relationship_stage,
          lastContactAt: r.last_contact_at,
          lastResponseAt: r.last_response_at,
          lastEngagementAt: r.last_engagement_at,
          departmentId: r.historical_department_id != null ? Number(r.historical_department_id) : null,
          source: 'C2',
        });
      }
    }
  } else if (metricKey.startsWith('recognition.') || metricKey.startsWith('needs.')) {
    // handled lightly
    if (metricKey === 'recognition.alumni_recognised' && (await db.schema.hasTable('alumni_recognition_records'))) {
      const list = await db('alumni_recognition_records as r')
        .join('alumni_profiles as ap', 'ap.id', 'r.alumni_profile_id')
        .where('r.college_id', collegeId)
        .whereIn('r.status', ['ISSUED', 'CORRECTED'])
        .modify((qb) => applyAlumniFilters(qb, filters))
        .select('r.id', 'r.title', 'r.category', 'r.award_date', 'r.academic_year', 'ap.historical_name', 'r.alumni_profile_id')
        .limit(200);
      for (const r of list) {
        rows.push({
          recognitionId: Number(r.id),
          title: r.title,
          category: r.category,
          awardDate: r.award_date,
          academicYear: r.academic_year,
          alumniProfileId: Number(r.alumni_profile_id),
          alumniName: r.historical_name,
          source: 'C6',
          attributionLevel: 'DIRECT',
        });
      }
    }
  }

  const threshold = opts.smallCohortThreshold ?? 5;
  const suppressPersonal = !opts.allowPersonal && rows.length > 0 && rows.length < threshold;

  return {
    metricKey,
    definition: def,
    period,
    count: rows.length,
    attributionNote: 'DIRECT/SUPPORTED/ASSOCIATED/UNKNOWN — ASSOCIATED is never silently promoted to DIRECT.',
    privacy: suppressPersonal
      ? { suppressed: true, reason: `Cohort size ${rows.length} below small-cohort threshold ${threshold}` }
      : { suppressed: false },
    rows: suppressPersonal
      ? []
      : rows.map((r) => {
          // Strip contact fields always
          const { email, phone, ...safe } = r;
          return safe;
        }),
    correctionHint:
      'C7 never edits source records. Correct data in C1–C6 modules, then recalculate.',
  };
}

export async function departmentBreakdown(actor: AlumniAdminActor, filters: ImpactFilters = {}) {
  const period = await resolvePeriod(actor.collegeId, filters);
  const depts = await db('departments').where({ college_id: actor.collegeId }).select('id', 'name', 'code').limit(40);
  const metricKeys = [
    'alumni.total',
    'alumni.verified',
    'alumni.reachable',
    'engagement.active_alumni',
    'mentorship.alumni_mentors',
    'mentorship.students_supported',
    'recruitment.placements_supported',
    'internship.positions_enabled',
    'experts.sessions_delivered',
    'projects.supported',
    'industry.connections',
    'recognition.alumni_recognised',
    'recognition.value_participants',
    'needs.open',
    'needs.fulfilled',
    'students.unique_benefited',
  ];
  const results = [];
  for (const d of depts) {
    const { metrics } = await computeAllMetrics(actor, {
      ...filters,
      departmentId: Number(d.id),
      metricKeys,
    });
    results.push({
      departmentId: Number(d.id),
      departmentName: d.name,
      departmentCode: d.code,
      metrics,
    });
  }
  return {
    period,
    departments: results,
    truncated: depts.length >= 40,
    note: 'Comparison allowed without declaring winner/best department.',
  };
}

export async function trendSeries(actor: AlumniAdminActor, filters: ImpactFilters = {}) {
  const years = await db('academic_years')
    .where({ college_id: actor.collegeId })
    .orderBy('id', 'desc')
    .limit(5);
  const series = [];
  for (const y of years) {
    const { period, metrics } = await computeAllMetrics(actor, {
      ...filters,
      periodType: 'ACADEMIC_YEAR',
      academicYearId: Number(y.id),
      periodLabel: y.label,
      metricKeys: [
        'engagement.active_alumni',
        'mentorship.students_supported',
        'internship.positions_enabled',
        'experts.sessions_delivered',
        'recruitment.placements_supported',
        'students.unique_benefited',
      ],
    });
    series.push({
      academicYearId: Number(y.id),
      label: y.label,
      isCurrent: Boolean(y.is_current),
      periodComplete: period.complete,
      coverageNote: period.coverageNote,
      metrics: metrics.map((m) => ({
        metricKey: m.metricKey,
        value: m.value,
        numerator: m.numerator,
        denominator: m.denominator,
        version: m.version,
      })),
    });
  }
  return {
    series,
    note: 'Partial current year is flagged. Avoid misleading % growth from tiny bases — absolute values included.',
  };
}
