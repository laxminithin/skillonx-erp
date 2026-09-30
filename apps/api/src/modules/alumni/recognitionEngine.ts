/**
 * Recognition eligibility assistance, reciprocity, and suggestion discovery (C6).
 * Factual only — never ranks, scores, or auto-awards.
 */
import { db } from '../../db/index.js';
import type { AlumniAdminActor } from './service.js';

export type EligibilityCheck = {
  rule: string;
  met: boolean;
  detail: string;
};

export type ReciprocityItem = {
  direction: 'ALUMNI_TO_INSTITUTION' | 'INSTITUTION_TO_ALUMNI';
  kind: string;
  label: string;
  count: number;
  refs?: Array<{ type: string; id: number | string }>;
};

function parseJson<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  return raw as T;
}

function monthsAgo(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
}

/**
 * Assist reviewers with factual eligibility — never auto-approve.
 */
export async function assistEligibility(opts: {
  collegeId: number;
  alumniProfileId: number;
  rules?: Record<string, unknown> | null;
}): Promise<{ checks: EligibilityCheck[]; note: string }> {
  const profile = await db('alumni_profiles')
    .where({ id: opts.alumniProfileId, college_id: opts.collegeId })
    .first();
  if (!profile) {
    return {
      checks: [{ rule: 'profile_exists', met: false, detail: 'Alumni profile not found' }],
      note: 'Eligibility assistance only — human decision required',
    };
  }

  const rules = opts.rules || {};
  const checks: EligibilityCheck[] = [];

  const minYears = Number(rules.minYearsAfterGraduation || 0);
  if (minYears > 0) {
    const gy = profile.graduation_year != null ? Number(profile.graduation_year) : null;
    if (gy == null) {
      checks.push({
        rule: 'min_years_after_graduation',
        met: false,
        detail: `Requirement: ${minYears} years after graduation — graduation year unknown`,
      });
    } else {
      const years = new Date().getFullYear() - gy;
      checks.push({
        rule: 'min_years_after_graduation',
        met: years >= minYears,
        detail: `Requirement: ${minYears} years after graduation — authoritative graduation year ${gy} (${years} years)`,
      });
    }
  }

  const maxYears = Number(rules.maxYearsAfterGraduation || 0);
  if (maxYears > 0) {
    const gy = profile.graduation_year != null ? Number(profile.graduation_year) : null;
    if (gy == null) {
      checks.push({
        rule: 'max_years_after_graduation',
        met: false,
        detail: `Young-achiever style cap: ${maxYears} years — graduation year unknown`,
      });
    } else {
      const years = new Date().getFullYear() - gy;
      checks.push({
        rule: 'max_years_after_graduation',
        met: years <= maxYears,
        detail: `Cap: ${maxYears} years after graduation — year ${gy} (${years} years)`,
      });
    }
  }

  if (rules.requireVerified || rules.minVerifiedOutcomes) {
    const min = Number(rules.minVerifiedOutcomes || 1);
    let count = 0;
    if (await db.schema.hasTable('alumni_crm_outcomes')) {
      const row = await db('alumni_crm_outcomes')
        .where({ college_id: opts.collegeId, alumni_profile_id: opts.alumniProfileId, verification_status: 'VERIFIED' })
        .count('* as c')
        .first();
      count = Number((row as any)?.c || 0);
    }
    checks.push({
      rule: 'verified_contribution',
      met: count >= min,
      detail: `${count} verified CRM outcome(s) found (required ≥ ${min})`,
    });
  }

  if (rules.requireVerifiedFulfilment) {
    let count = 0;
    if (await db.schema.hasTable('alumni_connect_fulfilment')) {
      const row = await db('alumni_connect_fulfilment')
        .where({ college_id: opts.collegeId, alumni_profile_id: opts.alumniProfileId })
        .where('verified_quantity', '>', 0)
        .count('* as c')
        .first();
      count = Number((row as any)?.c || 0);
    }
    checks.push({
      rule: 'verified_fulfilment',
      met: count >= 1,
      detail: `${count} C5 fulfilment row(s) with verified quantity`,
    });
  }

  if (rules.requireVerifiedProfile) {
    checks.push({
      rule: 'verified_profile',
      met: profile.verification_state === 'VERIFIED',
      detail: `Profile verification_state=${profile.verification_state}`,
    });
  }

  if (!checks.length) {
    checks.push({
      rule: 'no_specific_rules',
      met: true,
      detail: 'No program eligibility rules configured — reviewer judgment applies',
    });
  }

  return {
    checks,
    note: 'Eligibility assistance only — does not rank candidates or auto-approve',
  };
}

/**
 * Factual reciprocity view — no numeric score.
 */
export async function buildReciprocityView(opts: {
  collegeId: number;
  alumniProfileId: number;
  months?: number;
}): Promise<{
  windowMonths: number;
  alumniToInstitution: ReciprocityItem[];
  institutionToAlumni: ReciprocityItem[];
  guardrail: { triggered: boolean; message: string | null };
  note: string;
}> {
  const months = opts.months ?? 12;
  const since = monthsAgo(months);
  const alumniToInstitution: ReciprocityItem[] = [];
  const institutionToAlumni: ReciprocityItem[] = [];

  if (await db.schema.hasTable('alumni_crm_outcomes')) {
    const outcomes = await db('alumni_crm_outcomes')
      .where({
        college_id: opts.collegeId,
        alumni_profile_id: opts.alumniProfileId,
        verification_status: 'VERIFIED',
      })
      .where('created_at', '>=', since)
      .select('id', 'outcome_type', 'title', 'quantity');
    const byType = new Map<string, { count: number; refs: Array<{ type: string; id: number }> }>();
    for (const o of outcomes as any[]) {
      const key = String(o.outcome_type || 'OTHER');
      const cur = byType.get(key) || { count: 0, refs: [] };
      cur.count += Number(o.quantity || 1);
      cur.refs.push({ type: 'C2_OUTCOME', id: Number(o.id) });
      byType.set(key, cur);
    }
    for (const [kind, v] of byType) {
      alumniToInstitution.push({
        direction: 'ALUMNI_TO_INSTITUTION',
        kind,
        label: `Verified ${kind.replace(/_/g, ' ').toLowerCase()}`,
        count: v.count,
        refs: v.refs.slice(0, 20),
      });
    }
  }

  if (await db.schema.hasTable('alumni_connect_fulfilment')) {
    const fulfilments = await db('alumni_connect_fulfilment as f')
      .leftJoin('alumni_connect_needs as n', 'n.id', 'f.need_id')
      .where('f.college_id', opts.collegeId)
      .where('f.alumni_profile_id', opts.alumniProfileId)
      .where('f.verified_quantity', '>', 0)
      .where('f.updated_at', '>=', since)
      .select('f.id', 'f.verified_quantity', 'n.type as need_type', 'n.title');
    for (const f of fulfilments as any[]) {
      alumniToInstitution.push({
        direction: 'ALUMNI_TO_INSTITUTION',
        kind: String(f.need_type || 'FULFILMENT'),
        label: `Verified fulfilment: ${f.title || f.need_type || 'need'}`,
        count: Number(f.verified_quantity || 0),
        refs: [{ type: 'C5_FULFILMENT', id: Number(f.id) }],
      });
    }
  }

  if (await db.schema.hasTable('alumni_recognition_records')) {
    const recs = await db('alumni_recognition_records')
      .where({
        college_id: opts.collegeId,
        alumni_profile_id: opts.alumniProfileId,
      })
      .whereIn('status', ['ISSUED', 'CORRECTED'])
      .where('created_at', '>=', since)
      .select('id', 'title', 'category');
    if (recs.length) {
      institutionToAlumni.push({
        direction: 'INSTITUTION_TO_ALUMNI',
        kind: 'RECOGNITION',
        label: 'Recognition issued',
        count: recs.length,
        refs: recs.map((r: any) => ({ type: 'C6_RECOGNITION', id: Number(r.id) })),
      });
    }
  }

  if (await db.schema.hasTable('alumni_spotlights')) {
    const spots = await db('alumni_spotlights')
      .where({
        college_id: opts.collegeId,
        alumni_profile_id: opts.alumniProfileId,
        publication_status: 'PUBLISHED',
      })
      .where('updated_at', '>=', since)
      .count('* as c')
      .first();
    const c = Number((spots as any)?.c || 0);
    if (c > 0) {
      institutionToAlumni.push({
        direction: 'INSTITUTION_TO_ALUMNI',
        kind: 'SPOTLIGHT',
        label: 'Spotlight published',
        count: c,
      });
    }
  }

  if (await db.schema.hasTable('alumni_value_participations')) {
    const parts = await db('alumni_value_participations as p')
      .leftJoin('alumni_value_offerings as o', 'o.id', 'p.offering_id')
      .where('p.college_id', opts.collegeId)
      .where('p.alumni_profile_id', opts.alumniProfileId)
      .whereIn('p.status', ['REGISTERED', 'ACCEPTED', 'PARTICIPATED', 'COMPLETED'])
      .where('p.updated_at', '>=', since)
      .select('p.id', 'p.status', 'o.title', 'o.category');
    const byCat = new Map<string, number>();
    for (const p of parts as any[]) {
      const key = String(p.category || 'VALUE');
      byCat.set(key, (byCat.get(key) || 0) + 1);
    }
    for (const [kind, count] of byCat) {
      institutionToAlumni.push({
        direction: 'INSTITUTION_TO_ALUMNI',
        kind,
        label: `Value offering participation (${kind.replace(/_/g, ' ').toLowerCase()})`,
        count,
      });
    }
  }

  if (await db.schema.hasTable('alumni_recognition_certificates')) {
    const certs = await db('alumni_recognition_certificates')
      .where({
        college_id: opts.collegeId,
        alumni_profile_id: opts.alumniProfileId,
        status: 'ISSUED',
      })
      .where('created_at', '>=', since)
      .count('* as c')
      .first();
    const c = Number((certs as any)?.c || 0);
    if (c > 0) {
      institutionToAlumni.push({
        direction: 'INSTITUTION_TO_ALUMNI',
        kind: 'CERTIFICATE',
        label: 'Certificates / appreciations issued',
        count: c,
      });
    }
  }

  const contributionCount = alumniToInstitution.reduce((s, i) => s + i.count, 0);
  const valueCount = institutionToAlumni.reduce((s, i) => s + i.count, 0);
  const triggered = contributionCount >= 2 && valueCount === 0;

  return {
    windowMonths: months,
    alumniToInstitution,
    institutionToAlumni,
    guardrail: {
      triggered,
      message: triggered
        ? 'This alumnus has contributed repeatedly but has received no recorded recognition/value interaction recently.'
        : null,
    },
    note: 'Factual history only — no reciprocity score, fairness score, or automatic block',
  };
}

/**
 * Batch reciprocity guardrail for C4 engagement (set-based, no N+1 360).
 */
export async function batchReciprocityGuardrails(opts: {
  collegeId: number;
  alumniProfileIds: number[];
  months?: number;
}): Promise<Map<number, { triggered: boolean; message: string | null }>> {
  const result = new Map<number, { triggered: boolean; message: string | null }>();
  const ids = [...new Set(opts.alumniProfileIds.filter((id) => Number.isFinite(id) && id > 0))];
  for (const id of ids) result.set(id, { triggered: false, message: null });
  if (!ids.length) return result;

  const months = opts.months ?? 12;
  const since = monthsAgo(months);

  const contrib = new Map<number, number>();
  if (await db.schema.hasTable('alumni_crm_outcomes')) {
    const rows = await db('alumni_crm_outcomes')
      .where({ college_id: opts.collegeId, verification_status: 'VERIFIED' })
      .whereIn('alumni_profile_id', ids)
      .where('created_at', '>=', since)
      .groupBy('alumni_profile_id')
      .select('alumni_profile_id')
      .count('* as c');
    for (const r of rows as any[]) contrib.set(Number(r.alumni_profile_id), Number(r.c || 0));
  }

  const value = new Map<number, number>();
  if (await db.schema.hasTable('alumni_recognition_records')) {
    const rows = await db('alumni_recognition_records')
      .where({ college_id: opts.collegeId })
      .whereIn('alumni_profile_id', ids)
      .whereIn('status', ['ISSUED', 'CORRECTED'])
      .where('created_at', '>=', since)
      .groupBy('alumni_profile_id')
      .select('alumni_profile_id')
      .count('* as c');
    for (const r of rows as any[]) value.set(Number(r.alumni_profile_id), Number(r.c || 0));
  }
  if (await db.schema.hasTable('alumni_value_participations')) {
    const rows = await db('alumni_value_participations')
      .where({ college_id: opts.collegeId })
      .whereIn('alumni_profile_id', ids)
      .whereIn('status', ['REGISTERED', 'ACCEPTED', 'PARTICIPATED', 'COMPLETED'])
      .where('updated_at', '>=', since)
      .groupBy('alumni_profile_id')
      .select('alumni_profile_id')
      .count('* as c');
    for (const r of rows as any[]) {
      const id = Number(r.alumni_profile_id);
      value.set(id, (value.get(id) || 0) + Number(r.c || 0));
    }
  }

  for (const id of ids) {
    const c = contrib.get(id) || 0;
    const v = value.get(id) || 0;
    if (c >= 2 && v === 0) {
      result.set(id, {
        triggered: true,
        message:
          'This alumnus has contributed repeatedly but has received no recorded recognition/value interaction recently.',
      });
    }
  }
  return result;
}

/**
 * Discover contribution-based CONSIDER_FOR_RECOGNITION suggestions from C2/C5.
 * Does not auto-award.
 */
export async function discoverContributionSuggestions(opts: {
  collegeId: number;
  alumniProfileId?: number;
  limit?: number;
}): Promise<Array<{
  alumniProfileId: number;
  suggestionType: 'CONSIDER_FOR_RECOGNITION';
  category: string;
  title: string;
  rationale: string;
  evidenceRefs: Array<Record<string, unknown>>;
}>> {
  const out: Array<{
    alumniProfileId: number;
    suggestionType: 'CONSIDER_FOR_RECOGNITION';
    category: string;
    title: string;
    rationale: string;
    evidenceRefs: Array<Record<string, unknown>>;
  }> = [];
  const limit = opts.limit ?? 50;

  const outcomeMap: Record<string, { category: string; title: string }> = {
    STUDENTS_MENTORED: { category: 'MENTORSHIP_CONTRIBUTION', title: 'Consider mentor appreciation' },
    EXPERT_SESSIONS_DELIVERED: { category: 'EXPERT_CONTRIBUTION', title: 'Consider expert-session appreciation' },
    INTERNSHIPS_ENABLED: { category: 'INTERNSHIP_SUPPORT', title: 'Consider internship-support recognition' },
    PLACEMENTS_SUPPORTED: { category: 'RECRUITMENT_CONTRIBUTION', title: 'Consider recruitment contribution recognition' },
    JOBS_REFERRED: { category: 'RECRUITMENT_CONTRIBUTION', title: 'Consider recruitment contribution recognition' },
    PROJECTS_SUPPORTED: { category: 'PROJECT_SUPPORT', title: 'Consider project-support appreciation' },
    RESEARCH_COLLABORATIONS: { category: 'RESEARCH_COLLABORATION', title: 'Consider research collaboration recognition' },
    STARTUP_SUPPORT: { category: 'STARTUP_SUPPORT', title: 'Consider startup-support recognition' },
  };

  if (await db.schema.hasTable('alumni_crm_outcomes')) {
    let q = db('alumni_crm_outcomes')
      .where({ college_id: opts.collegeId, verification_status: 'VERIFIED' })
      .whereIn('outcome_type', Object.keys(outcomeMap))
      .orderBy('id', 'desc')
      .limit(limit * 2);
    if (opts.alumniProfileId) q = q.where('alumni_profile_id', opts.alumniProfileId);
    const rows = await q.select('id', 'alumni_profile_id', 'outcome_type', 'title', 'quantity');
    for (const r of rows as any[]) {
      const map = outcomeMap[r.outcome_type];
      if (!map) continue;
      out.push({
        alumniProfileId: Number(r.alumni_profile_id),
        suggestionType: 'CONSIDER_FOR_RECOGNITION',
        category: map.category,
        title: map.title,
        rationale: `Verified CRM outcome ${r.outcome_type}${r.title ? `: ${r.title}` : ''} (qty ${r.quantity || 1})`,
        evidenceRefs: [{ sourceType: 'C2_OUTCOME', sourceReference: String(r.id), verificationStatus: 'VERIFIED' }],
      });
      if (out.length >= limit) break;
    }
  }

  if (out.length < limit && (await db.schema.hasTable('alumni_connect_fulfilment'))) {
    let q = db('alumni_connect_fulfilment as f')
      .leftJoin('alumni_connect_needs as n', 'n.id', 'f.need_id')
      .where('f.college_id', opts.collegeId)
      .where('f.verified_quantity', '>', 0)
      .orderBy('f.id', 'desc')
      .limit(limit);
    if (opts.alumniProfileId) q = q.where('f.alumni_profile_id', opts.alumniProfileId);
    const rows = await q.select('f.id', 'f.alumni_profile_id', 'f.verified_quantity', 'n.type', 'n.title');
    for (const r of rows as any[]) {
      out.push({
        alumniProfileId: Number(r.alumni_profile_id),
        suggestionType: 'CONSIDER_FOR_RECOGNITION',
        category: 'INSTITUTIONAL_SERVICE',
        title: 'Consider recognition for verified institutional support',
        rationale: `C5 verified fulfilment on need "${r.title || r.type}" (qty ${r.verified_quantity})`,
        evidenceRefs: [{ sourceType: 'C5_FULFILMENT', sourceReference: String(r.id), verificationStatus: 'VERIFIED' }],
      });
      if (out.length >= limit) break;
    }
  }

  return out.slice(0, limit);
}

/**
 * Surface C1 achievements as POTENTIAL_RECOGNITION_CANDIDATE — no external scrape.
 */
export async function discoverAchievementCandidates(opts: {
  collegeId: number;
  alumniProfileId?: number;
  limit?: number;
}): Promise<Array<{
  alumniProfileId: number;
  suggestionType: 'POTENTIAL_RECOGNITION_CANDIDATE';
  category: string;
  title: string;
  rationale: string;
  evidenceRefs: Array<Record<string, unknown>>;
}>> {
  const out: Array<{
    alumniProfileId: number;
    suggestionType: 'POTENTIAL_RECOGNITION_CANDIDATE';
    category: string;
    title: string;
    rationale: string;
    evidenceRefs: Array<Record<string, unknown>>;
  }> = [];
  if (!(await db.schema.hasTable('alumni_achievements'))) return out;

  const typeMap: Record<string, string> = {
    PATENT: 'PATENT_IP',
    PUBLICATION: 'PUBLICATION',
    AWARD: 'PROFESSIONAL_ACHIEVEMENT',
    RESEARCH: 'RESEARCH_INNOVATION',
    ENTREPRENEURSHIP: 'ENTREPRENEURSHIP',
    HIGHER_EDUCATION: 'HIGHER_EDUCATION',
    PROMOTION: 'INDUSTRY_ACHIEVEMENT',
    PROFESSIONAL: 'PROFESSIONAL_ACHIEVEMENT',
  };

  let q = db('alumni_achievements')
    .where({ college_id: opts.collegeId })
    .where((b) => b.whereNull('moderation_state').orWhereNot('moderation_state', 'REJECTED'))
    .orderBy('id', 'desc')
    .limit(opts.limit ?? 50);
  if (opts.alumniProfileId) q = q.where('alumni_profile_id', opts.alumniProfileId);
  const rows = await q.select('id', 'alumni_profile_id', 'title', 'achievement_type', 'moderation_state');

  for (const r of rows as any[]) {
    const at = String(r.achievement_type || 'OTHER').toUpperCase();
    const moderated = String(r.moderation_state || '').toUpperCase() === 'APPROVED';
    out.push({
      alumniProfileId: Number(r.alumni_profile_id),
      suggestionType: 'POTENTIAL_RECOGNITION_CANDIDATE',
      category: typeMap[at] || 'OTHER',
      title: `Potential recognition: ${r.title || at}`,
      rationale: `C1 achievement (${at}) — moderation_state=${r.moderation_state || 'UNKNOWN'}. Human review required.`,
      evidenceRefs: [{
        sourceType: 'C1_ACHIEVEMENT',
        sourceReference: String(r.id),
        verificationStatus: moderated ? 'INSTITUTIONAL' : 'SELF_DECLARED',
      }],
    });
  }
  return out;
}

export function parseEligibilityRules(raw: unknown): Record<string, unknown> | null {
  return parseJson(raw, null);
}

/** Stub actor for system projections. */
export function systemActor(collegeId: number): AlumniAdminActor {
  return {
    facultyUserId: 0,
    collegeId,
    departmentId: null,
    role: 'COLLEGE_ADMIN',
    name: 'system',
  };
}
