/**
 * Alumni Intelligence engine (C3).
 *
 * Derives explainable evidence / willingness / relationship readiness from
 * C1 Alumni 360 + C2 CRM data. Never copies authoritative rows; never emits
 * opaque scores or wealth / sensitive profiling signals.
 */
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { AlumniAdminActor } from './service.js';
import { computeFreshness } from './freshness.js';
import {
  canViewIntelligence,
  isDepartmentScoped,
} from './accessIntelligence.js';
import {
  DIMENSION_CAPABILITY_DOMAINS,
  DIMENSION_OPPORTUNITY_TYPES,
  DIMENSION_OUTCOME_TYPES,
  DIMENSION_WILLINGNESS_KEY,
  INTELLIGENCE_DIMENSIONS,
  SENIORITY_STRONG,
  type CapabilityIntentCell,
  type DimensionIntelligence,
  type EvidenceItem,
  type EvidenceState,
  type IntelligenceDimension,
  type ProfileIntelligence,
  type RelationshipReadiness,
  type WillingnessState,
} from './typesIntelligence.js';

export type IntelligenceConfig = {
  recentContactDays: number;
  reactivationIdleDays: number;
  heavyEngagementActiveOpps: number;
  noResponseStreakWarn: number;
};

export async function getIntelligenceConfig(collegeId: number): Promise<IntelligenceConfig> {
  if (!(await db.schema.hasTable('alumni_intelligence_config'))) {
    return {
      recentContactDays: 7,
      reactivationIdleDays: 180,
      heavyEngagementActiveOpps: 2,
      noResponseStreakWarn: 3,
    };
  }
  let row = await db('alumni_intelligence_config').where({ college_id: collegeId }).first();
  if (!row) {
    await db('alumni_intelligence_config').insert({ college_id: collegeId });
    row = await db('alumni_intelligence_config').where({ college_id: collegeId }).first();
  }
  return {
    recentContactDays: Number(row.recent_contact_days),
    reactivationIdleDays: Number(row.reactivation_idle_days),
    heavyEngagementActiveOpps: Number(row.heavy_engagement_active_opps),
    noResponseStreakWarn: Number(row.no_response_streak_warn),
  };
}

export function assertIntelligenceAccess(actor: AlumniAdminActor) {
  if (!canViewIntelligence(actor)) throw new AppError(403, 'Alumni intelligence access required');
}

export async function loadAlumniInIntelScope(actor: AlumniAdminActor, alumniProfileId: number) {
  assertIntelligenceAccess(actor);
  const profile = await db('alumni_profiles')
    .where({ id: alumniProfileId, college_id: actor.collegeId })
    .first();
  if (!profile) throw new AppError(404, 'Alumni profile not found');
  if (isDepartmentScoped(actor) && actor.departmentId != null) {
    if (profile.historical_department_id != null && Number(profile.historical_department_id) !== actor.departmentId) {
      throw new AppError(403, 'Alumni profile outside your department scope');
    }
  }
  return profile;
}

function daysSince(iso: string | Date | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86400000);
}

function seniorityLooksStrong(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const norm = String(raw).toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  for (const token of SENIORITY_STRONG) {
    if (norm.includes(token)) return true;
  }
  return false;
}

function classifyEvidence(positiveCount: number, hasAnySignal: boolean): EvidenceState {
  if (!hasAnySignal) return 'INSUFFICIENT_DATA';
  if (positiveCount >= 3) return 'STRONG_EVIDENCE';
  if (positiveCount === 2) return 'MODERATE_EVIDENCE';
  if (positiveCount === 1) return 'LIMITED_EVIDENCE';
  return 'INSUFFICIENT_DATA';
}

function willingnessFromProfile(
  profile: Record<string, any>,
  dimension: IntelligenceDimension,
  recentDecline: boolean,
): WillingnessState {
  const key = DIMENSION_WILLINGNESS_KEY[dimension];
  if (!key) return 'NOT_ASKED';
  const val = profile[key];
  if (recentDecline) return 'TEMPORARILY_UNAVAILABLE';
  if (val === true || val === 1) return 'WILLING';
  if (val === false || val === 0) return 'NOT_WILLING';
  return 'NOT_ASKED';
}

function capabilityIntentCell(evidence: EvidenceState, willingness: WillingnessState): CapabilityIntentCell {
  const high = evidence === 'STRONG_EVIDENCE' || evidence === 'MODERATE_EVIDENCE';
  if (evidence === 'INSUFFICIENT_DATA') return 'INSUFFICIENT_DATA';
  if (high && willingness === 'WILLING') return 'HIGH_EVIDENCE_WILLING';
  if (high && willingness === 'NOT_ASKED') return 'HIGH_EVIDENCE_NOT_ASKED';
  if (high && (willingness === 'NOT_WILLING' || willingness === 'TEMPORARILY_UNAVAILABLE')) {
    return 'HIGH_EVIDENCE_NOT_WILLING';
  }
  if ((evidence === 'LIMITED_EVIDENCE' || evidence === 'MODERATE_EVIDENCE') && willingness === 'WILLING') {
    return 'LIMITED_EVIDENCE_WILLING';
  }
  return 'OTHER';
}

export type SignalBundle = {
  profile: Record<string, any>;
  employment: Record<string, any>[];
  higherStudies: Record<string, any>[];
  entrepreneurship: Record<string, any>[];
  capabilities: Record<string, any>[];
  relationship: Record<string, any> | null;
  ownerName: string | null;
  opportunities: Record<string, any>[];
  outcomes: Record<string, any>[];
  followups: Record<string, any>[];
  recentInteractions: Record<string, any>[];
  mentoringCount: number;
  freshness: { domain: string; state: string; message: string; lastVerifiedAt: string | null }[];
  config: IntelligenceConfig;
};

export async function loadSignalBundle(collegeId: number, alumniProfileId: number, profile?: Record<string, any>): Promise<SignalBundle> {
  const p = profile ?? (await db('alumni_profiles').where({ id: alumniProfileId, college_id: collegeId }).first());
  if (!p) throw new AppError(404, 'Alumni profile not found');

  const config = await getIntelligenceConfig(collegeId);
  const studentId = Number(p.student_id);

  const [
    employment,
    higherStudies,
    entrepreneurship,
    capabilities,
    relationship,
    opportunities,
    outcomes,
    followups,
    recentInteractions,
  ] = await Promise.all([
    db.schema.hasTable('alumni_employment').then(async (ok) => {
      if (!ok) return [];
      const rows = await db('alumni_employment')
        .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
        .orderBy('is_current', 'desc')
        .orderBy('start_date', 'desc');
      return rows.filter((e: any) => e.is_archived !== true && e.is_archived !== 1);
    }),
    db.schema.hasTable('alumni_higher_studies').then((ok) =>
      ok ? db('alumni_higher_studies').where({ college_id: collegeId, alumni_profile_id: alumniProfileId }) : [],
    ),
    db.schema.hasTable('alumni_entrepreneurship').then((ok) =>
      ok ? db('alumni_entrepreneurship').where({ college_id: collegeId, alumni_profile_id: alumniProfileId }) : [],
    ),
    db.schema.hasTable('alumni_interest_capabilities').then((ok) =>
      ok
        ? db('alumni_interest_capabilities').where({
            college_id: collegeId,
            alumni_profile_id: alumniProfileId,
            is_active: true,
          })
        : [],
    ),
    db.schema.hasTable('alumni_relationships').then((ok) =>
      ok ? db('alumni_relationships').where({ college_id: collegeId, alumni_profile_id: alumniProfileId }).first() : null,
    ),
    db.schema.hasTable('alumni_crm_opportunities').then((ok) =>
      ok ? db('alumni_crm_opportunities').where({ college_id: collegeId, alumni_profile_id: alumniProfileId }) : [],
    ),
    db.schema.hasTable('alumni_crm_outcomes').then((ok) =>
      ok ? db('alumni_crm_outcomes').where({ college_id: collegeId, alumni_profile_id: alumniProfileId }) : [],
    ),
    db.schema.hasTable('alumni_crm_followups').then((ok) =>
      ok
        ? db('alumni_crm_followups')
            .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
            .whereIn('status', ['OPEN', 'IN_PROGRESS', 'OVERDUE'])
        : [],
    ),
    db.schema.hasTable('alumni_crm_interactions').then((ok) =>
      ok
        ? db('alumni_crm_interactions')
            .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
            .orderBy('occurred_at', 'desc')
            .limit(30)
        : [],
    ),
  ]);

  let mentoringCount = 0;
  try {
    if (studentId && (await db.schema.hasTable('mentor_assignments'))) {
      const row = await db('mentor_assignments')
        .where({ college_id: collegeId })
        .where((qb) => {
          qb.where('mentor_student_id', studentId).orWhere('student_id', studentId);
        })
        .count<{ c: number }[]>('* as c')
        .first()
        .catch(() => null);
      mentoringCount = Number((row as any)?.c ?? 0);
    }
  } catch {
    mentoringCount = 0;
  }

  let ownerName: string | null = null;
  if (relationship?.relationship_owner_id) {
    const owner = await db('faculty_users').where({ id: relationship.relationship_owner_id }).first();
    ownerName = owner?.name ?? null;
  }

  const freshness = await computeFreshness(collegeId, p, employment as any[]);

  return {
    profile: p,
    employment: employment as any[],
    higherStudies: higherStudies as any[],
    entrepreneurship: entrepreneurship as any[],
    capabilities: capabilities as any[],
    relationship: relationship as any,
    ownerName,
    opportunities: opportunities as any[],
    outcomes: outcomes as any[],
    followups: followups as any[],
    recentInteractions: recentInteractions as any[],
    mentoringCount,
    freshness: freshness.map((f) => ({
      domain: f.domain,
      state: f.state,
      message: f.message,
      lastVerifiedAt: f.lastVerifiedAt,
    })),
    config,
  };
}

function buildRelationshipReadiness(bundle: SignalBundle, dimension: IntelligenceDimension): {
  readiness: RelationshipReadiness;
  cautions: EvidenceItem[];
  contextFlags: {
    recentDecline: boolean;
    activeForDimension: boolean;
    recentlyContacted: boolean;
    openFollowUp: boolean;
    heavyLoad: boolean;
  };
} {
  const cautions: EvidenceItem[] = [];
  const rel = bundle.relationship;
  const cfg = bundle.config;
  const oppTypes = DIMENSION_OPPORTUNITY_TYPES[dimension] ?? [];

  const activeOpps = bundle.opportunities.filter((o) =>
    ['IDENTIFIED', 'QUALIFYING', 'CONFIRMED', 'IN_PROGRESS'].includes(String(o.status)),
  );
  const activeForDimension = activeOpps.some((o) => oppTypes.includes(String(o.opportunity_type)));
  const openFollowUp = bundle.followups.length > 0;
  const lastContactDays = daysSince(rel?.last_contact_at);
  const lastEngagementDays = daysSince(rel?.last_engagement_at);
  const recentlyContacted = lastContactDays != null && lastContactDays <= cfg.recentContactDays;

  const recentDecline = bundle.recentInteractions.some((i) => {
    const days = daysSince(i.occurred_at);
    return i.outcome_status === 'DECLINED' && days != null && days <= 90;
  });

  const noResponseStreak = (() => {
    let streak = 0;
    for (const i of bundle.recentInteractions) {
      if (!i.is_contact_attempt) continue;
      if (i.outcome_status === 'NO_RESPONSE') streak += 1;
      else break;
    }
    return streak;
  })();

  const heavyLoad = activeOpps.length >= cfg.heavyEngagementActiveOpps;

  if (recentDecline) {
    cautions.push({
      code: 'RECENT_DECLINE',
      label: 'Recent decline recorded on interaction timeline',
      positive: false,
      caution: true,
      sourceType: 'CRM',
      sourceReference: 'alumni_crm_interactions',
    });
  }
  if (activeForDimension) {
    cautions.push({
      code: 'ACTIVE_OPPORTUNITY',
      label: `Active ${dimension.replace(/_/g, ' ').toLowerCase()} opportunity already exists`,
      positive: false,
      caution: true,
      sourceType: 'CRM',
      sourceReference: 'alumni_crm_opportunities',
    });
  }
  if (recentlyContacted) {
    cautions.push({
      code: 'RECENTLY_CONTACTED',
      label: `Contacted ${lastContactDays} day(s) ago — avoid over-contact`,
      positive: false,
      caution: true,
      sourceType: 'CRM',
      sourceReference: 'alumni_relationships.last_contact_at',
    });
  }
  if (heavyLoad) {
    cautions.push({
      code: 'HEAVY_ENGAGEMENT',
      label: `Already ${activeOpps.length} active opportunities — do not over-contact`,
      positive: false,
      caution: true,
      sourceType: 'CRM',
      sourceReference: 'alumni_crm_opportunities',
    });
  }
  if (noResponseStreak >= cfg.noResponseStreakWarn) {
    cautions.push({
      code: 'NO_RESPONSE_STREAK',
      label: `${noResponseStreak} consecutive no-response contact attempts`,
      positive: false,
      caution: true,
      sourceType: 'CRM',
      sourceReference: 'alumni_crm_interactions',
    });
  }
  if (openFollowUp) {
    cautions.push({
      code: 'OPEN_FOLLOWUP',
      label: 'Open follow-up already assigned',
      positive: false,
      caution: true,
      sourceType: 'CRM',
      sourceReference: 'alumni_crm_followups',
    });
  }

  let readiness: RelationshipReadiness = 'READY_FOR_REVIEW';
  if (recentDecline || rel?.relationship_status === 'CLOSED') {
    readiness = 'DO_NOT_CONTACT';
  } else if (activeForDimension || heavyLoad || ['ACTION_IN_PROGRESS', 'OPPORTUNITY_IDENTIFIED'].includes(String(rel?.relationship_stage))) {
    readiness = 'ACTIVE_ENGAGEMENT';
  } else if (openFollowUp) {
    readiness = 'FOLLOW_UP_DUE';
  } else if (recentlyContacted) {
    readiness = 'RECENTLY_CONTACTED';
  } else {
    const idle = lastEngagementDays ?? lastContactDays;
    const strongIdle =
      idle == null || idle >= cfg.reactivationIdleDays;
    const stageEarly = !rel || ['IDENTIFIED', 'REACHABLE', 'CONTACTED'].includes(String(rel.relationship_stage));
    if (strongIdle && stageEarly) {
      readiness = 'NEEDS_REACTIVATION';
    }
  }

  return {
    readiness,
    cautions,
    contextFlags: { recentDecline, activeForDimension, recentlyContacted, openFollowUp, heavyLoad },
  };
}

function evaluateDimension(dimension: IntelligenceDimension, bundle: SignalBundle): DimensionIntelligence {
  const evidence: EvidenceItem[] = [];
  const dataQualityWarnings: string[] = [];
  const current = bundle.employment.find((e) => e.is_current) ?? bundle.employment[0] ?? null;
  const willKey = DIMENSION_WILLINGNESS_KEY[dimension];
  const capDomains = DIMENSION_CAPABILITY_DOMAINS[dimension] ?? [];
  const oppTypes = DIMENSION_OPPORTUNITY_TYPES[dimension] ?? [];
  const outcomeTypes = DIMENSION_OUTCOME_TYPES[dimension] ?? [];

  const { readiness, cautions, contextFlags } = buildRelationshipReadiness(bundle, dimension);
  const willingnessState = willingnessFromProfile(bundle.profile, dimension, contextFlags.recentDecline);

  // Explicit willingness (intent — never inferred from title)
  if (willKey && (bundle.profile[willKey] === true || bundle.profile[willKey] === 1)) {
    evidence.push({
      code: 'EXPLICIT_WILLINGNESS',
      label: 'Explicitly willing for this activity',
      positive: true,
      sourceType: 'C1',
      sourceReference: `alumni_profiles.${willKey}`,
    });
  } else if (willKey && (bundle.profile[willKey] === false || bundle.profile[willKey] === 0)) {
    evidence.push({
      code: 'EXPLICIT_DECLINE',
      label: 'Explicitly not willing for this activity',
      positive: false,
      caution: true,
      sourceType: 'C1',
      sourceReference: `alumni_profiles.${willKey}`,
    });
  }

  // Declared capability
  for (const cap of bundle.capabilities) {
    if (capDomains.includes(String(cap.capability_domain))) {
      evidence.push({
        code: 'DECLARED_CAPABILITY',
        label: `Declared capability: ${cap.capability_domain}`,
        positive: true,
        sourceType: 'C1',
        sourceReference: `alumni_interest_capabilities:${cap.id}`,
      });
    }
  }

  // Career evidence (capability signals only — never willingness)
  if (current) {
    if (current.designation) {
      evidence.push({
        code: 'CURRENT_ROLE',
        label: `Current role: ${current.designation}${current.organization ? ` at ${current.organization}` : ''}`,
        positive: true,
        sourceType: 'C1',
        sourceReference: `alumni_employment:${current.id}`,
      });
    }
    if (seniorityLooksStrong(current.seniority) || seniorityLooksStrong(current.designation)) {
      evidence.push({
        code: 'SENIORITY',
        label: `Seniority / leadership signal: ${current.seniority || current.designation}`,
        positive: true,
        sourceType: 'C1',
        sourceReference: `alumni_employment:${current.id}`,
      });
    }
    if (current.industry && ['RECRUITMENT', 'INTERNSHIP', 'INDUSTRY_PROJECT', 'INDUSTRIAL_VISIT', 'MOU_COLLABORATION'].includes(dimension)) {
      evidence.push({
        code: 'INDUSTRY',
        label: `Industry: ${current.industry}`,
        positive: true,
        sourceType: 'C1',
        sourceReference: `alumni_employment:${current.id}`,
      });
    }
  }

  if (dimension === 'STARTUP_SUPPORT' && bundle.entrepreneurship.length) {
    evidence.push({
      code: 'ENTREPRENEURSHIP',
      label: 'Entrepreneurship / founder record present',
      positive: true,
      sourceType: 'C1',
      sourceReference: 'alumni_entrepreneurship',
    });
  }

  if (dimension === 'RESEARCH_COLLABORATION' || dimension === 'BOS_ADVISORY' || dimension === 'CURRICULUM_SUPPORT' || dimension === 'EXPERT_SESSION') {
    const phd = bundle.higherStudies.some((h) => {
      const deg = String(h.degree || h.program || '').toUpperCase();
      return deg.includes('PHD') || deg.includes('PH.D') || deg.includes('DOCTOR');
    });
    if (phd) {
      evidence.push({
        code: 'HIGHER_QUALIFICATION',
        label: 'Higher studies / research qualification on record',
        positive: true,
        sourceType: 'C1',
        sourceReference: 'alumni_higher_studies',
      });
    }
    const researchExp = (() => {
      try {
        const raw = bundle.profile.research_expertise;
        const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(arr) && arr.length > 0;
      } catch {
        return false;
      }
    })();
    if (researchExp) {
      evidence.push({
        code: 'RESEARCH_EXPERTISE',
        label: 'Research expertise declared on profile',
        positive: true,
        sourceType: 'C1',
        sourceReference: 'alumni_profiles.research_expertise',
      });
    }
  }

  // Institutional history — verified outcomes (highest institutional confidence)
  for (const out of bundle.outcomes) {
    if (!outcomeTypes.includes(String(out.outcome_type))) continue;
    const verified = String(out.verification_status) === 'VERIFIED';
    evidence.push({
      code: verified ? 'VERIFIED_OUTCOME' : 'RECORDED_OUTCOME',
      label: `${verified ? 'Verified' : 'Recorded'} outcome: ${out.title || out.outcome_type}`,
      positive: true,
      sourceType: 'C2',
      sourceReference: `alumni_crm_outcomes:${out.id}`,
    });
  }

  // Completed CRM opportunities
  for (const opp of bundle.opportunities) {
    if (!oppTypes.includes(String(opp.opportunity_type))) continue;
    if (String(opp.status) === 'COMPLETED') {
      evidence.push({
        code: 'COMPLETED_OPPORTUNITY',
        label: `Completed opportunity: ${opp.title}`,
        positive: true,
        sourceType: 'C2',
        sourceReference: `alumni_crm_opportunities:${opp.id}`,
      });
    }
  }

  if (dimension === 'MENTORSHIP' && bundle.mentoringCount > 0) {
    evidence.push({
      code: 'MENTORING_HISTORY',
      label: `Mentoring engine history linked (${bundle.mentoringCount})`,
      positive: true,
      sourceType: 'MENTORING',
      sourceReference: 'mentor_assignments',
    });
  }

  // Data quality — degrade stale employment as current fact
  const empFresh = bundle.freshness.find((f) => f.domain === 'EMPLOYMENT');
  if (empFresh && (empFresh.state === 'STALE' || empFresh.state === 'NEEDS_CONFIRMATION') && current) {
    dataQualityWarnings.push(`Employment ${empFresh.state.replace(/_/g, ' ').toLowerCase()}: ${empFresh.message}`);
  }
  const contactFresh = bundle.freshness.find((f) => f.domain === 'CONTACT');
  if (contactFresh && contactFresh.state === 'STALE') {
    dataQualityWarnings.push(`Contact stale: ${contactFresh.message}`);
    cautions.push({
      code: 'STALE_CONTACT',
      label: 'Contact information is stale',
      positive: false,
      caution: true,
      sourceType: 'C1',
      sourceReference: 'alumni_profiles.contact_verified_at',
    });
  }
  const willFresh = bundle.freshness.find((f) => f.domain === 'WILLINGNESS');
  if (willFresh && willFresh.state === 'STALE' && willingnessState === 'WILLING') {
    dataQualityWarnings.push(`Willingness confirmation stale: ${willFresh.message}`);
  }

  const positives = evidence.filter((e) => e.positive);
  // Willingness alone does not count as capability evidence for classifyEvidence "capability" —
  // but EXPLICIT_WILLINGNESS is still a positive signal for institutional targeting of intent.
  // Spec: Capability ≠ willingness. So for evidenceState we exclude EXPLICIT_WILLINGNESS / EXPLICIT_DECLINE.
  const capabilityPositives = positives.filter((e) => e.code !== 'EXPLICIT_WILLINGNESS');
  const hasAnySignal = capabilityPositives.length > 0 || positives.some((e) => e.code === 'EXPLICIT_WILLINGNESS');
  let evidenceState = classifyEvidence(capabilityPositives.length, hasAnySignal || capabilityPositives.length > 0);
  if (capabilityPositives.length === 0 && positives.some((e) => e.code === 'EXPLICIT_WILLINGNESS')) {
    // Willing but no capability evidence → limited at best for capability side
    evidenceState = 'LIMITED_EVIDENCE';
  }
  if (capabilityPositives.length === 0 && !positives.some((e) => e.code === 'EXPLICIT_WILLINGNESS')) {
    evidenceState = 'INSUFFICIENT_DATA';
  }

  const cell = capabilityIntentCell(evidenceState, willingnessState);

  const why: string[] = [];
  for (const e of positives.slice(0, 8)) why.push(e.label);
  if (!why.length) why.push('Insufficient corroborating signals for this dimension');

  const sources = [...evidence, ...cautions].map((e) => ({
    label: e.label,
    sourceType: e.sourceType,
    sourceReference: e.sourceReference,
  }));

  const qualifies =
    evidenceState !== 'INSUFFICIENT_DATA' &&
    willingnessState !== 'NOT_WILLING' &&
    readiness !== 'DO_NOT_CONTACT';

  return {
    dimension,
    evidenceState,
    willingnessState,
    relationshipReadiness: readiness,
    capabilityIntentCell: cell,
    evidence: positives,
    cautions,
    why,
    sources,
    dataQualityWarnings,
    qualifies,
  };
}

export function evaluateAllDimensions(bundle: SignalBundle): DimensionIntelligence[] {
  return INTELLIGENCE_DIMENSIONS.map((d) => evaluateDimension(d, bundle));
}

export function buildProfileIntelligence(bundle: SignalBundle): ProfileIntelligence {
  const dimensions = evaluateAllDimensions(bundle);
  const matrixSummary = {
    HIGH_EVIDENCE_WILLING: 0,
    HIGH_EVIDENCE_NOT_ASKED: 0,
    HIGH_EVIDENCE_NOT_WILLING: 0,
    LIMITED_EVIDENCE_WILLING: 0,
    INSUFFICIENT_DATA: 0,
    OTHER: 0,
  } as Record<CapabilityIntentCell, number>;
  for (const d of dimensions) {
    matrixSummary[d.capabilityIntentCell] += 1;
  }

  const rel = bundle.relationship;
  const activeOpps = bundle.opportunities.filter((o) =>
    ['IDENTIFIED', 'QUALIFYING', 'CONFIRMED', 'IN_PROGRESS'].includes(String(o.status)),
  );
  const recentDecline = bundle.recentInteractions.some((i) => i.outcome_status === 'DECLINED');

  return {
    alumniProfileId: Number(bundle.profile.id),
    dimensions,
    relationshipContext: {
      stage: rel?.relationship_stage ?? null,
      status: rel?.relationship_status ?? null,
      ownerFacultyId: rel?.relationship_owner_id != null ? Number(rel.relationship_owner_id) : null,
      ownerName: bundle.ownerName,
      lastContactAt: rel?.last_contact_at ? new Date(rel.last_contact_at).toISOString() : null,
      lastEngagementAt: rel?.last_engagement_at ? new Date(rel.last_engagement_at).toISOString() : null,
      openFollowUp: bundle.followups.length > 0,
      activeOpportunityCount: activeOpps.length,
      recentDecline,
      engagementLoad: activeOpps.length,
    },
    matrixSummary,
    generatedAt: new Date().toISOString(),
    note: 'Derived explainable intelligence from Alumni 360 + CRM. No opaque scores. Capability and willingness are separate.',
  };
}

export async function getProfileIntelligence(actor: AlumniAdminActor, alumniProfileId: number): Promise<ProfileIntelligence> {
  const profile = await loadAlumniInIntelScope(actor, alumniProfileId);
  const bundle = await loadSignalBundle(actor.collegeId, alumniProfileId, profile);
  return buildProfileIntelligence(bundle);
}

/** Batch-load signal data for many profiles — avoids N+1 on workspace / segment evaluate. */
export async function loadSignalBundlesBatch(
  collegeId: number,
  profiles: Record<string, any>[],
): Promise<Map<number, SignalBundle>> {
  const config = await getIntelligenceConfig(collegeId);
  const ids = profiles.map((p) => Number(p.id));
  const map = new Map<number, SignalBundle>();
  if (!ids.length) return map;

  const [
    employmentAll,
    higherAll,
    entreAll,
    capsAll,
    relsAll,
    oppsAll,
    outsAll,
    fupsAll,
    intsAll,
  ] = await Promise.all([
    db.schema.hasTable('alumni_employment').then((ok) =>
      ok
        ? db('alumni_employment').where({ college_id: collegeId }).whereIn('alumni_profile_id', ids)
        : [],
    ),
    db.schema.hasTable('alumni_higher_studies').then((ok) =>
      ok
        ? db('alumni_higher_studies').where({ college_id: collegeId }).whereIn('alumni_profile_id', ids)
        : [],
    ),
    db.schema.hasTable('alumni_entrepreneurship').then((ok) =>
      ok
        ? db('alumni_entrepreneurship').where({ college_id: collegeId }).whereIn('alumni_profile_id', ids)
        : [],
    ),
    db.schema.hasTable('alumni_interest_capabilities').then((ok) =>
      ok
        ? db('alumni_interest_capabilities')
            .where({ college_id: collegeId, is_active: true })
            .whereIn('alumni_profile_id', ids)
        : [],
    ),
    db.schema.hasTable('alumni_relationships').then((ok) =>
      ok
        ? db('alumni_relationships').where({ college_id: collegeId }).whereIn('alumni_profile_id', ids)
        : [],
    ),
    db.schema.hasTable('alumni_crm_opportunities').then((ok) =>
      ok
        ? db('alumni_crm_opportunities').where({ college_id: collegeId }).whereIn('alumni_profile_id', ids)
        : [],
    ),
    db.schema.hasTable('alumni_crm_outcomes').then((ok) =>
      ok
        ? db('alumni_crm_outcomes').where({ college_id: collegeId }).whereIn('alumni_profile_id', ids)
        : [],
    ),
    db.schema.hasTable('alumni_crm_followups').then((ok) =>
      ok
        ? db('alumni_crm_followups')
            .where({ college_id: collegeId })
            .whereIn('alumni_profile_id', ids)
            .whereIn('status', ['OPEN', 'IN_PROGRESS', 'OVERDUE'])
        : [],
    ),
    db.schema.hasTable('alumni_crm_interactions').then((ok) =>
      ok
        ? db('alumni_crm_interactions')
            .where({ college_id: collegeId })
            .whereIn('alumni_profile_id', ids)
            .orderBy('occurred_at', 'desc')
        : [],
    ),
  ]);

  const ownerIds = [...new Set((relsAll as any[]).map((r) => r.relationship_owner_id).filter(Boolean))];
  const owners = ownerIds.length
    ? await db('faculty_users').whereIn('id', ownerIds).select('id', 'name')
    : [];
  const ownerMap = new Map(owners.map((o: any) => [Number(o.id), o.name as string]));

  const group = <T extends { alumni_profile_id: number }>(rows: T[]) => {
    const m = new Map<number, T[]>();
    for (const r of rows) {
      const id = Number(r.alumni_profile_id);
      if (!m.has(id)) m.set(id, []);
      m.get(id)!.push(r);
    }
    return m;
  };

  const empG = group(employmentAll as any[]);
  const hsG = group(higherAll as any[]);
  const enG = group(entreAll as any[]);
  const capG = group(capsAll as any[]);
  const oppG = group(oppsAll as any[]);
  const outG = group(outsAll as any[]);
  const fupG = group(fupsAll as any[]);
  const intG = group(intsAll as any[]);
  const relMap = new Map((relsAll as any[]).map((r) => [Number(r.alumni_profile_id), r]));

  for (const p of profiles) {
    const id = Number(p.id);
    const employment = (empG.get(id) || []).filter((e: any) => !e.is_archived);
    const relationship = relMap.get(id) ?? null;
    const interactions = (intG.get(id) || []).slice(0, 30);
    const freshness = await computeFreshness(collegeId, p, employment);
    map.set(id, {
      profile: p,
      employment,
      higherStudies: hsG.get(id) || [],
      entrepreneurship: enG.get(id) || [],
      capabilities: capG.get(id) || [],
      relationship,
      ownerName: relationship?.relationship_owner_id ? ownerMap.get(Number(relationship.relationship_owner_id)) ?? null : null,
      opportunities: oppG.get(id) || [],
      outcomes: outG.get(id) || [],
      followups: fupG.get(id) || [],
      recentInteractions: interactions,
      mentoringCount: 0,
      freshness: freshness.map((f) => ({
        domain: f.domain,
        state: f.state,
        message: f.message,
        lastVerifiedAt: f.lastVerifiedAt,
      })),
      config,
    });
  }
  return map;
}
