/**
 * Audience eligibility gate + contact fatigue (C4.4 / C4.5).
 * Set-based evaluation — does not N+1 full Alumni 360 aggregates.
 */
import { db } from '../../db/index.js';
import type { AlumniAdminActor } from './service.js';
import { isDepartmentScopedEngagement } from './accessEngagement.js';
import {
  CATEGORY_PREF_COL,
  CATEGORY_WILLINGNESS_KEY,
  type ChannelType,
  type EligibilityState,
  type EngagementCategory,
} from './typesEngagement.js';
import { WILLINGNESS_DB } from './types360.js';
import { getIntelligenceConfig } from './intelligenceEngine.js';
import { batchReciprocityGuardrails } from './recognitionEngine.js';

export type EligibilityResult = {
  alumniProfileId: number;
  eligibility: EligibilityState;
  reasons: string[];
  /** Factual C6 reminder only — never used to block/suppress eligibility. */
  reciprocityGuardrail?: { triggered: boolean; message: string | null };
};

type FatigueRule = {
  category_code: string;
  min_days_between_equivalent: number;
  warn_recent_contact_days: number;
  suppress_active_opportunity: boolean;
  suppress_open_followup: boolean;
  warn_open_followup: boolean;
};

const DEFAULT_FATIGUE: FatigueRule = {
  category_code: '*',
  min_days_between_equivalent: 30,
  warn_recent_contact_days: 14,
  suppress_active_opportunity: true,
  suppress_open_followup: false,
  warn_open_followup: true,
};

export async function ensureDefaultFatigueRules(collegeId: number) {
  if (!(await db.schema.hasTable('alumni_engagement_fatigue_rules'))) return;
  const existing = await db('alumni_engagement_fatigue_rules').where({ college_id: collegeId }).first();
  if (existing) return;
  await db('alumni_engagement_fatigue_rules').insert({
    college_id: collegeId,
    category_code: '*',
    min_days_between_equivalent: 30,
    warn_recent_contact_days: 14,
    suppress_active_opportunity: true,
    suppress_open_followup: false,
    warn_open_followup: true,
    is_active: true,
  });
  const defaults: Array<[string, number]> = [
    ['MENTORSHIP', 45],
    ['RECRUITMENT', 30],
    ['DATA_REFRESH', 90],
    ['REUNION', 180],
    ['RECOGNITION', 60],
  ];
  for (const [code, days] of defaults) {
    await db('alumni_engagement_fatigue_rules').insert({
      college_id: collegeId,
      category_code: code,
      min_days_between_equivalent: days,
      warn_recent_contact_days: Math.min(14, days),
      suppress_active_opportunity: true,
      suppress_open_followup: false,
      warn_open_followup: true,
      is_active: true,
    });
  }
}

export async function getFatigueRule(collegeId: number, category: string): Promise<FatigueRule> {
  await ensureDefaultFatigueRules(collegeId);
  if (!(await db.schema.hasTable('alumni_engagement_fatigue_rules'))) return DEFAULT_FATIGUE;
  const specific = await db('alumni_engagement_fatigue_rules')
    .where({ college_id: collegeId, category_code: category, is_active: true })
    .first();
  if (specific) return specific as FatigueRule;
  const star = await db('alumni_engagement_fatigue_rules')
    .where({ college_id: collegeId, category_code: '*', is_active: true })
    .first();
  return (star as FatigueRule) || DEFAULT_FATIGUE;
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Evaluate eligibility for a set of alumni profile IDs (batch).
 */
export async function evaluateEligibilityBatch(opts: {
  actor: AlumniAdminActor;
  alumniProfileIds: number[];
  category: EngagementCategory | string;
  channel: ChannelType;
  campaignId?: number | null;
  excludeCampaignId?: number | null;
}): Promise<EligibilityResult[]> {
  const { actor, category, channel } = opts;
  const ids = [...new Set(opts.alumniProfileIds.map(Number))].filter((n) => n > 0);
  if (!ids.length) return [];

  const fatigue = await getFatigueRule(actor.collegeId, category);
  const intelCfg = await getIntelligenceConfig(actor.collegeId).catch(() => ({
    recentContactDays: 7,
    reactivationIdleDays: 180,
    heavyEngagementActiveOpps: 2,
    noResponseStreakWarn: 3,
  }));

  let profileQ = db('alumni_profiles as ap')
    .where('ap.college_id', actor.collegeId)
    .whereIn('ap.id', ids)
    .where('ap.is_active', true)
    .select('ap.*');
  if (isDepartmentScopedEngagement(actor) && actor.departmentId != null) {
    profileQ = profileQ.andWhere('ap.historical_department_id', actor.departmentId);
  }
  const profiles = await profileQ;
  const profileMap = new Map(profiles.map((p: any) => [Number(p.id), p]));

  const rels = await db('alumni_relationships')
    .where({ college_id: actor.collegeId })
    .whereIn('alumni_profile_id', ids)
    .select('alumni_profile_id', 'last_contact_at', 'relationship_status', 'relationship_stage');
  const relMap = new Map(rels.map((r: any) => [Number(r.alumni_profile_id), r]));

  const activeOpps = await db('alumni_crm_opportunities')
    .where({ college_id: actor.collegeId })
    .whereIn('alumni_profile_id', ids)
    .whereIn('status', ['IDENTIFIED', 'QUALIFYING', 'CONFIRMED', 'IN_PROGRESS'])
    .select('alumni_profile_id', 'opportunity_type', 'title');
  const oppByProfile = new Map<number, any[]>();
  for (const o of activeOpps) {
    const pid = Number(o.alumni_profile_id);
    if (!oppByProfile.has(pid)) oppByProfile.set(pid, []);
    oppByProfile.get(pid)!.push(o);
  }

  const openFollowups = await db('alumni_crm_followups')
    .where({ college_id: actor.collegeId })
    .whereIn('alumni_profile_id', ids)
    .whereIn('status', ['OPEN', 'IN_PROGRESS', 'OVERDUE'])
    .select('alumni_profile_id', 'reason', 'due_date');
  const followByProfile = new Map<number, any[]>();
  for (const f of openFollowups) {
    const pid = Number(f.alumni_profile_id);
    if (!followByProfile.has(pid)) followByProfile.set(pid, []);
    followByProfile.get(pid)!.push(f);
  }

  // Recent equivalent-purpose contact via engagement recipients
  let recentEquiv = new Set<number>();
  if (await db.schema.hasTable('alumni_engagement_recipients')) {
    const since = daysAgo(fatigue.min_days_between_equivalent);
    let eq = db('alumni_engagement_recipients as r')
      .join('alumni_engagement_campaigns as c', 'c.id', 'r.campaign_id')
      .join('alumni_engagement_programs as p', 'p.id', 'c.program_id')
      .where('r.college_id', actor.collegeId)
      .whereIn('r.alumni_profile_id', ids)
      .where('p.category', category)
      .whereIn('r.contact_status', ['CONTACTED', 'NO_RESPONSE', 'RESPONDED', 'INTERESTED', 'DECLINED', 'FOLLOW_UP'])
      .where('r.contacted_at', '>=', since)
      .select('r.alumni_profile_id');
    if (opts.excludeCampaignId) eq = eq.andWhereNot('r.campaign_id', opts.excludeCampaignId);
    const rows = await eq;
    recentEquiv = new Set(rows.map((r: any) => Number(r.alumni_profile_id)));
  }

  // Duplicate exposure: already in other active campaigns same category
  let dupExposure = new Set<number>();
  if (await db.schema.hasTable('alumni_engagement_recipients')) {
    let dq = db('alumni_engagement_recipients as r')
      .join('alumni_engagement_campaigns as c', 'c.id', 'r.campaign_id')
      .join('alumni_engagement_programs as p', 'p.id', 'c.program_id')
      .where('r.college_id', actor.collegeId)
      .whereIn('r.alumni_profile_id', ids)
      .where('p.category', category)
      .whereIn('c.status', ['APPROVED', 'SCHEDULED', 'IN_PROGRESS'])
      .whereIn('r.eligibility', ['ELIGIBLE', 'REQUIRES_REVIEW'])
      .select('r.alumni_profile_id');
    if (opts.excludeCampaignId) dq = dq.andWhereNot('r.campaign_id', opts.excludeCampaignId);
    const rows = await dq;
    dupExposure = new Set(rows.map((r: any) => Number(r.alumni_profile_id)));
  }

  // Freshness: employment last_verified / updated
  const employment = await db('alumni_employment')
    .where({ college_id: actor.collegeId, is_current: true })
    .whereIn('alumni_profile_id', ids)
    .select('alumni_profile_id', 'updated_at', 'last_verified_at');
  const empMap = new Map(employment.map((e: any) => [Number(e.alumni_profile_id), e]));

  const willingnessKey = CATEGORY_WILLINGNESS_KEY[category as EngagementCategory];
  const willingnessCol = willingnessKey ? WILLINGNESS_DB[willingnessKey as keyof typeof WILLINGNESS_DB] : null;
  const topicPrefCol = CATEGORY_PREF_COL[category as EngagementCategory];

  const reciprocityMap = await batchReciprocityGuardrails({
    collegeId: actor.collegeId,
    alumniProfileIds: ids,
    months: 12,
  }).catch(() => new Map<number, { triggered: boolean; message: string | null }>());

  const results: EligibilityResult[] = [];

  for (const id of ids) {
    const reasons: string[] = [];
    let eligibility: EligibilityState = 'ELIGIBLE';
    const profile = profileMap.get(id);

    if (!profile) {
      results.push({
        alumniProfileId: id,
        eligibility: 'SUPPRESSED',
        reasons: ['Out of tenant/department scope or inactive'],
        reciprocityGuardrail: reciprocityMap.get(id) || { triggered: false, message: null },
      });
      continue;
    }

    if (profile.global_comm_opt_out) {
      eligibility = 'SUPPRESSED';
      reasons.push('Global communication opt-out');
    }

    const channelDenied = (col: string | undefined, defaultOptIn: boolean) => {
      if (!col) return false;
      const v = profile[col];
      if (v == null) return !defaultOptIn;
      return Number(v) === 0;
    };

    if (channel === 'EMAIL' && channelDenied('comm_email_opt_in', true)) {
      eligibility = 'SUPPRESSED';
      reasons.push('Email opt-out');
    }
    if (channel === 'WHATSAPP' && channelDenied('comm_whatsapp_opt_in', false)) {
      eligibility = 'SUPPRESSED';
      reasons.push('WhatsApp not opted in');
    }
    if (channel === 'SMS' && channelDenied('comm_sms_opt_in', false)) {
      eligibility = 'SUPPRESSED';
      reasons.push('SMS not opted in');
    }
    if (channel === 'PHONE' && channelDenied('comm_phone_opt_in', true)) {
      // phone default historically false in C1 — only suppress when explicitly false
      if (profile.comm_phone_opt_in != null && Number(profile.comm_phone_opt_in) === 0) {
        eligibility = 'SUPPRESSED';
        reasons.push('Phone contact declined');
      }
    }

    if (topicPrefCol && channelDenied(topicPrefCol, true)) {
      eligibility = 'SUPPRESSED';
      reasons.push(`Topic preference declined for ${category}`);
    }

    if (profile.temporary_unavailable_until && new Date(profile.temporary_unavailable_until) > new Date()) {
      eligibility = 'SUPPRESSED';
      reasons.push(`Temporarily unavailable until ${new Date(profile.temporary_unavailable_until).toISOString().slice(0, 10)}${profile.temporary_unavailable_reason ? `: ${profile.temporary_unavailable_reason}` : ''}`);
    }

    if (willingnessCol && profile[willingnessCol] != null && Number(profile[willingnessCol]) === 0) {
      eligibility = 'SUPPRESSED';
      reasons.push(`Willingness = NOT_WILLING (${willingnessKey})`);
    }

    // Contact availability for channel
    if (['EMAIL', 'WHATSAPP', 'SMS'].includes(channel) && !profile.email && channel === 'EMAIL') {
      if (eligibility === 'ELIGIBLE') eligibility = 'REQUIRES_REVIEW';
      reasons.push('No email on file');
    }
    if (['PHONE', 'SMS', 'WHATSAPP'].includes(channel)) {
      const phone = profile.phone_override;
      if (!phone && channel !== 'PHONE') {
        if (eligibility === 'ELIGIBLE') eligibility = 'REQUIRES_REVIEW';
        reasons.push('No phone override on file (student phone may exist)');
      } else if (!phone && channel === 'PHONE') {
        // Phone outreach can use student phone at execution time — warn only
        reasons.push('No phone override on file — confirm reachable number before calling');
      }
    }

    const rel = relMap.get(id);
    if (rel?.relationship_status === 'CLOSED') {
      eligibility = 'SUPPRESSED';
      reasons.push('Relationship status CLOSED');
    }

    if (rel?.last_contact_at) {
      const last = new Date(rel.last_contact_at);
      const warnDays = Math.max(fatigue.warn_recent_contact_days, intelCfg.recentContactDays || 7);
      if (last >= daysAgo(warnDays)) {
        if (eligibility === 'ELIGIBLE') eligibility = 'REQUIRES_REVIEW';
        reasons.push(`Contacted recently (${Math.floor((Date.now() - last.getTime()) / 86400000)} days ago)`);
      }
    }

    if (recentEquiv.has(id)) {
      eligibility = 'SUPPRESSED';
      reasons.push(`Equivalent ${category} contact within ${fatigue.min_days_between_equivalent} days`);
    }

    if (dupExposure.has(id)) {
      if (eligibility === 'ELIGIBLE') eligibility = 'REQUIRES_REVIEW';
      reasons.push('Already targeted by another active campaign in same category');
    }

    const opps = oppByProfile.get(id) || [];
    if (opps.length) {
      if (fatigue.suppress_active_opportunity) {
        if (eligibility !== 'SUPPRESSED') eligibility = 'REQUIRES_REVIEW';
        reasons.push(`Active opportunity: ${opps[0].title}`);
      } else {
        reasons.push(`Active opportunity (warn): ${opps[0].title}`);
        if (eligibility === 'ELIGIBLE') eligibility = 'REQUIRES_REVIEW';
      }
    }

    const fus = followByProfile.get(id) || [];
    if (fus.length) {
      if (fatigue.suppress_open_followup) {
        eligibility = 'SUPPRESSED';
        reasons.push(`Open follow-up: ${fus[0].reason}`);
      } else if (fatigue.warn_open_followup) {
        if (eligibility === 'ELIGIBLE') eligibility = 'REQUIRES_REVIEW';
        reasons.push(`Open follow-up: ${fus[0].reason}`);
      }
    }

    // Data freshness — missing employment is intentional for DATA_REFRESH; stale data warns
    if (['DATA_REFRESH', 'RECRUITMENT', 'MENTORSHIP', 'CAREER'].includes(category)) {
      const emp = empMap.get(id);
      const verifiedAt = emp?.last_verified_at || emp?.updated_at || profile.contact_verified_at || null;
      if (verifiedAt) {
        const ageMonths = (Date.now() - new Date(verifiedAt).getTime()) / (30 * 86400000);
        if (ageMonths > 24) {
          if (eligibility === 'ELIGIBLE') eligibility = 'REQUIRES_REVIEW';
          reasons.push(`Employment/contact stale > 24 months`);
        }
      } else if (category === 'RECRUITMENT' || category === 'CAREER') {
        if (eligibility === 'ELIGIBLE') eligibility = 'REQUIRES_REVIEW';
        reasons.push('No employment verification timestamp');
      } else if (category === 'DATA_REFRESH') {
        reasons.push('Candidate for data refresh (no recent verification)');
      }
    }

    if (!reasons.length && eligibility === 'ELIGIBLE') {
      reasons.push('Passed consent, fatigue, and readiness gates');
    }

    // C6 reciprocity — factual reminder only; never changes eligibility to block
    const reciprocityGuardrail = reciprocityMap.get(id) || { triggered: false, message: null };
    if (reciprocityGuardrail.triggered && reciprocityGuardrail.message) {
      reasons.push(`Reciprocity reminder: ${reciprocityGuardrail.message}`);
    }

    results.push({ alumniProfileId: id, eligibility, reasons, reciprocityGuardrail });
  }

  return results;
}
