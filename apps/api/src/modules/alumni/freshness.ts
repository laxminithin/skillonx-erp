import { db } from '../../db/index.js';
import { DEFAULT_FRESHNESS, type FreshnessState } from './types360.js';

export type DomainFreshness = {
  domain: string;
  state: FreshnessState;
  lastVerifiedAt: string | null;
  lastUpdatedAt: string | null;
  staleAfterDays: number;
  confirmAfterDays: number;
  message: string;
};

async function configFor(collegeId: number, domain: string) {
  if (await db.schema.hasTable('alumni_freshness_config')) {
    const row = await db('alumni_freshness_config').where({ college_id: collegeId, domain }).first();
    if (row) {
      return {
        staleAfterDays: Number(row.stale_after_days),
        confirmAfterDays: Number(row.confirm_after_days),
      };
    }
  }
  return DEFAULT_FRESHNESS[domain] ?? { staleAfterDays: 365, confirmAfterDays: 180 };
}

export async function ensureDefaultFreshnessConfig(collegeId: number) {
  if (!(await db.schema.hasTable('alumni_freshness_config'))) return;
  for (const [domain, cfg] of Object.entries(DEFAULT_FRESHNESS)) {
    const existing = await db('alumni_freshness_config').where({ college_id: collegeId, domain }).first();
    if (!existing) {
      await db('alumni_freshness_config').insert({
        college_id: collegeId,
        domain,
        stale_after_days: cfg.staleAfterDays,
        confirm_after_days: cfg.confirmAfterDays,
      });
    }
  }
}

function classify(
  lastVerifiedAt: Date | null,
  lastUpdatedAt: Date | null,
  cfg: { staleAfterDays: number; confirmAfterDays: number },
  hasValue: boolean,
): { state: FreshnessState; message: string } {
  if (!hasValue) return { state: 'UNVERIFIED', message: 'No value recorded yet.' };
  const anchor = lastVerifiedAt ?? lastUpdatedAt;
  if (!anchor) return { state: 'UNVERIFIED', message: 'Value present but never verified.' };
  const ageDays = (Date.now() - anchor.getTime()) / (24 * 60 * 60 * 1000);
  if (ageDays > cfg.staleAfterDays) {
    return { state: 'STALE', message: `Last confirmed ${Math.floor(ageDays)} days ago — please update.` };
  }
  if (ageDays > cfg.confirmAfterDays) {
    return { state: 'NEEDS_CONFIRMATION', message: `Please reconfirm (last touch ${Math.floor(ageDays)} days ago).` };
  }
  return { state: 'VERIFIED_RECENTLY', message: 'Verified recently.' };
}

export async function computeFreshness(collegeId: number, profile: Record<string, any>, employmentRows: Record<string, any>[]): Promise<DomainFreshness[]> {
  const current = employmentRows.find((e) => e.is_current) ?? employmentRows[0] ?? null;
  const empCfg = await configFor(collegeId, 'EMPLOYMENT');
  const contactCfg = await configFor(collegeId, 'CONTACT');
  const willCfg = await configFor(collegeId, 'WILLINGNESS');
  const skillsCfg = await configFor(collegeId, 'SKILLS');

  const empVerified = current?.last_verified_at ? new Date(current.last_verified_at) : null;
  const empUpdated = current?.updated_at ? new Date(current.updated_at) : (profile.employment_confirmed_at ? new Date(profile.employment_confirmed_at) : null);
  const empClass = classify(empVerified, empUpdated, empCfg, Boolean(current));

  const contactVerified = profile.contact_verified_at ? new Date(profile.contact_verified_at) : null;
  const contactUpdated = profile.updated_at ? new Date(profile.updated_at) : null;
  const hasContact = Boolean(profile.email || profile.phone_override || profile.student_phone || profile.current_city);
  const contactClass = classify(contactVerified, contactUpdated, contactCfg, hasContact);

  const willVerified = profile.willingness_confirmed_at ? new Date(profile.willingness_confirmed_at) : null;
  const hasWillingness = [
    profile.open_to_mentoring,
    profile.open_to_recruitment,
    profile.open_to_internships,
    profile.open_to_project_mentoring,
    profile.open_to_expert_sessions,
    profile.open_to_bos_advisory,
    profile.open_to_research_collaboration,
    profile.open_to_startup_mentoring,
    profile.open_to_industry_collaboration,
    profile.open_to_institutional_contribution,
    profile.mentorship_available,
    profile.networking_available,
  ].some((v) => v != null);
  const willClass = classify(willVerified, willVerified, willCfg, hasWillingness);

  const skillsUpdated = profile.updated_at ? new Date(profile.updated_at) : null;
  const hasSkills = Boolean(profile.skills);
  const skillsClass = classify(null, skillsUpdated, skillsCfg, hasSkills);

  return [
    {
      domain: 'EMPLOYMENT',
      state: empClass.state,
      lastVerifiedAt: empVerified?.toISOString() ?? null,
      lastUpdatedAt: empUpdated?.toISOString() ?? null,
      staleAfterDays: empCfg.staleAfterDays,
      confirmAfterDays: empCfg.confirmAfterDays,
      message: empClass.message,
    },
    {
      domain: 'CONTACT',
      state: contactClass.state,
      lastVerifiedAt: contactVerified?.toISOString() ?? null,
      lastUpdatedAt: contactUpdated?.toISOString() ?? null,
      staleAfterDays: contactCfg.staleAfterDays,
      confirmAfterDays: contactCfg.confirmAfterDays,
      message: contactClass.message,
    },
    {
      domain: 'WILLINGNESS',
      state: willClass.state,
      lastVerifiedAt: willVerified?.toISOString() ?? null,
      lastUpdatedAt: willVerified?.toISOString() ?? null,
      staleAfterDays: willCfg.staleAfterDays,
      confirmAfterDays: willCfg.confirmAfterDays,
      message: willClass.message,
    },
    {
      domain: 'SKILLS',
      state: skillsClass.state,
      lastVerifiedAt: null,
      lastUpdatedAt: skillsUpdated?.toISOString() ?? null,
      staleAfterDays: skillsCfg.staleAfterDays,
      confirmAfterDays: skillsCfg.confirmAfterDays,
      message: skillsClass.message,
    },
    {
      domain: 'ACADEMIC',
      state: 'VERIFIED_RECENTLY',
      lastVerifiedAt: profile.verified_at ? new Date(profile.verified_at).toISOString() : null,
      lastUpdatedAt: null,
      staleAfterDays: 0,
      confirmAfterDays: 0,
      message: 'Academic history is authoritative and does not expire.',
    },
  ];
}

export function attentionFromFreshness(freshness: DomainFreshness[]) {
  return freshness.filter((f) => f.state === 'STALE' || f.state === 'NEEDS_CONFIRMATION' || f.state === 'UNVERIFIED');
}
