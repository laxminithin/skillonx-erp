/**
 * Login-less engagement response tokens (C4.11–C4.14).
 * Signed random tokens — single-purpose, expiry, revocation, rate limiting,
 * tenant + alumni + action binding. No passwords in tokens.
 */
import crypto from 'node:crypto';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { AlumniAdminActor } from './service.js';
import { canOperateEngagement } from './accessEngagement.js';
import * as crm from './crmService.js';
import { upsertProvenance } from './provenance.js';
import { WILLINGNESS_DB } from './types360.js';
import { issueTokenSchema, responseSubmitSchema } from './typesEngagement.js';
import { z } from 'zod';

const TOKEN_PEPPER = process.env.ALUMNI_ENGAGEMENT_TOKEN_PEPPER || process.env.JWT_SECRET || 'skillonx-engagement-dev-pepper';

function hashToken(raw: string) {
  return crypto.createHmac('sha256', TOKEN_PEPPER).update(raw).digest('hex');
}

function generateRawToken() {
  return crypto.randomBytes(32).toString('base64url');
}

async function audit(input: {
  collegeId: number;
  actorFacultyId?: number | null;
  actorAlumniId?: number | null;
  actorType?: 'FACULTY' | 'ALUMNI' | 'SYSTEM';
  action: string;
  entityType?: string | null;
  entityId?: number | null;
  metadata?: unknown;
}) {
  if (!(await db.schema.hasTable('alumni_audit_log'))) return;
  await db('alumni_audit_log').insert({
    college_id: input.collegeId,
    actor_type: input.actorType === 'SYSTEM' ? 'FACULTY' : input.actorType ?? 'FACULTY',
    actor_faculty_id: input.actorFacultyId ?? null,
    actor_alumni_id: input.actorAlumniId ?? null,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });
}

export async function issueResponseToken(actor: AlumniAdminActor, body: z.infer<typeof issueTokenSchema>) {
  if (!canOperateEngagement(actor)) throw new AppError(403, 'Cannot issue response tokens');
  const input = issueTokenSchema.parse(body);
  const profile = await db('alumni_profiles')
    .where({ id: input.alumniProfileId, college_id: actor.collegeId })
    .first();
  if (!profile) throw new AppError(404, 'Alumni not found');
  if (input.campaignId) {
    const c = await db('alumni_engagement_campaigns')
      .where({ id: input.campaignId, college_id: actor.collegeId })
      .first();
    if (!c) throw new AppError(404, 'Campaign not found');
  }

  const raw = generateRawToken();
  const tokenHash = hashToken(raw);
  const hours = input.expiresInHours ?? 72;
  const expiresAt = new Date(Date.now() + hours * 3600 * 1000);
  const [id] = await db('alumni_engagement_response_tokens').insert({
    college_id: actor.collegeId,
    alumni_profile_id: input.alumniProfileId,
    campaign_id: input.campaignId ?? null,
    recipient_id: input.recipientId ?? null,
    token_hash: tokenHash,
    action_type: input.actionType,
    action_payload: input.actionPayload ? JSON.stringify(input.actionPayload) : null,
    expires_at: expiresAt,
    max_uses: input.maxUses ?? 1,
  });
  await audit({
    collegeId: actor.collegeId,
    actorFacultyId: actor.facultyUserId,
    action: 'ENGAGEMENT_TOKEN_ISSUE',
    entityType: 'alumni_engagement_response_tokens',
    entityId: Number(id),
    metadata: { actionType: input.actionType, alumniProfileId: input.alumniProfileId },
  });
  return {
    tokenId: Number(id),
    token: raw,
    expiresAt: expiresAt.toISOString(),
    actionType: input.actionType,
    /** Minimal public preview for staff to share — never embed password. */
    responsePath: `/alumni/engage/${raw}`,
  };
}

export async function revokeResponseToken(actor: AlumniAdminActor, tokenId: number) {
  if (!canOperateEngagement(actor)) throw new AppError(403, 'Cannot revoke tokens');
  const row = await db('alumni_engagement_response_tokens')
    .where({ id: tokenId, college_id: actor.collegeId })
    .first();
  if (!row) throw new AppError(404, 'Token not found');
  await db('alumni_engagement_response_tokens').where({ id: tokenId }).update({
    revoked_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  await audit({
    collegeId: actor.collegeId,
    actorFacultyId: actor.facultyUserId,
    action: 'ENGAGEMENT_TOKEN_REVOKE',
    entityType: 'alumni_engagement_response_tokens',
    entityId: tokenId,
  });
  return { ok: true };
}

/** Public peek — minimum data only. */
export async function peekResponseToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const row = await db('alumni_engagement_response_tokens').where({ token_hash: tokenHash }).first();
  if (!row) throw new AppError(404, 'Invalid or unknown response link');
  if (row.revoked_at) throw new AppError(410, 'This response link has been revoked');
  if (new Date(row.expires_at) < new Date()) throw new AppError(410, 'This response link has expired');
  if (Number(row.use_count) >= Number(row.max_uses)) throw new AppError(410, 'This response link has already been used');

  const college = await db('colleges').where({ id: row.college_id }).first();
  const profile = await db('alumni_profiles').where({ id: row.alumni_profile_id }).first();
  let campaignName: string | null = null;
  if (row.campaign_id) {
    const c = await db('alumni_engagement_campaigns').where({ id: row.campaign_id }).first();
    campaignName = c?.name ?? null;
  }
  const payload = row.action_payload
    ? typeof row.action_payload === 'string'
      ? JSON.parse(row.action_payload)
      : row.action_payload
    : {};

  return {
    actionType: row.action_type,
    institutionName: college?.name ?? null,
    alumniFirstName: String(profile?.historical_name || 'Alumni').split(/\s+/)[0],
    campaignName,
    options: payload.options || defaultOptions(row.action_type),
    formFields: payload.formFields || defaultFormFields(row.action_type),
    expiresAt: row.expires_at,
  };
}

function defaultOptions(actionType: string) {
  switch (actionType) {
    case 'MENTORSHIP_INTEREST':
    case 'EXPERT_SESSION_INTEREST':
      return ['YES', 'MAYBE_LATER', 'NO'];
    case 'RECRUITMENT_SUPPORT':
    case 'EVENT_RSVP':
    case 'RESEARCH_INTEREST':
    case 'GENERIC_YES_NO':
      return ['YES', 'NO'];
    case 'DATA_REFRESH':
      return ['NO_CHANGE', 'UPDATE'];
    default:
      return ['YES', 'NO'];
  }
}

function defaultFormFields(actionType: string) {
  switch (actionType) {
    case 'MENTORSHIP_INTEREST':
      return ['domains', 'availability', 'mode', 'studentLevel'];
    case 'RECRUITMENT_SUPPORT':
      return ['jobsInternships', 'domain', 'preferredCoordination'];
    case 'EXPERT_SESSION_INTEREST':
      return ['topics', 'mode', 'availability'];
    case 'RESEARCH_INTEREST':
      return ['domain', 'collaborationInterest'];
    case 'DATA_REFRESH':
      return ['organization', 'designation', 'email', 'phone', 'city', 'country'];
    default:
      return [];
  }
}

const rateBucket = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const cur = rateBucket.get(key);
  if (!cur || cur.resetAt < now) {
    rateBucket.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  cur.count += 1;
  if (cur.count > limit) throw new AppError(429, 'Too many response attempts');
}

export async function submitResponse(body: z.infer<typeof responseSubmitSchema>, meta?: { ipHint?: string }) {
  const input = responseSubmitSchema.parse(body);
  checkRateLimit(`tok:${input.token.slice(0, 16)}:${meta?.ipHint || 'x'}`);

  const tokenHash = hashToken(input.token);
  const row = await db('alumni_engagement_response_tokens').where({ token_hash: tokenHash }).first();
  if (!row) throw new AppError(404, 'Invalid or unknown response link');
  if (row.revoked_at) throw new AppError(410, 'This response link has been revoked');
  if (new Date(row.expires_at) < new Date()) throw new AppError(410, 'This response link has expired');
  if (Number(row.use_count) >= Number(row.max_uses)) throw new AppError(410, 'This response link has already been used');

  // Mark used first (optimistic) to reduce reuse races
  const updated = await db('alumni_engagement_response_tokens')
    .where({ id: row.id })
    .where('use_count', '<', Number(row.max_uses))
    .whereNull('revoked_at')
    .update({
      use_count: Number(row.use_count) + 1,
      used_at: db.fn.now(),
      updated_at: db.fn.now(),
    });
  if (!updated) throw new AppError(410, 'This response link has already been used');

  const choice = (input.choice || '').toUpperCase() || null;
  const form = input.form || null;

  const [responseId] = await db('alumni_engagement_responses').insert({
    college_id: row.college_id,
    alumni_profile_id: row.alumni_profile_id,
    campaign_id: row.campaign_id,
    recipient_id: row.recipient_id,
    token_id: row.id,
    action_type: row.action_type,
    choice,
    form_payload: form ? JSON.stringify(form) : null,
    source: 'ENGAGEMENT_RESPONSE',
    requires_staff_action: ['MAYBE', 'MAYBE_LATER', 'UPDATE'].includes(String(choice)),
  });

  const c1 = await applyResponseToC1(row, choice, form);
  const c2 = await applyResponseToC2(row, choice, form, Number(responseId));
  // C3 is derived at read — willingness update above is enough

  await db('alumni_engagement_responses').where({ id: responseId }).update({
    applied_to_c1: c1,
    applied_to_c2: c2,
    applied_to_c3_signal: c1, // willingness/capability feeds C3 immediately on next read
  });

  if (row.recipient_id) {
    const contactStatus =
      choice === 'YES' || choice === 'UPDATE'
        ? 'INTERESTED'
        : choice === 'NO' || choice === 'NOT_INTERESTED'
          ? 'DECLINED'
          : choice === 'NO_CHANGE'
            ? 'RESPONDED'
            : 'RESPONDED';
    const funnel =
      contactStatus === 'INTERESTED'
        ? 'INTERESTED'
        : contactStatus === 'DECLINED'
          ? 'RESPONDED'
          : 'RESPONDED';
    await db('alumni_engagement_recipients').where({ id: row.recipient_id }).update({
      contact_status: contactStatus,
      response_status: contactStatus,
      funnel_stage: funnel,
      responded_at: db.fn.now(),
      contacted_at: db.raw('COALESCE(contacted_at, NOW())'),
      updated_at: db.fn.now(),
    });
  }

  await audit({
    collegeId: row.college_id,
    actorType: 'ALUMNI',
    actorAlumniId: row.alumni_profile_id,
    action: 'ENGAGEMENT_RESPONSE_SUBMIT',
    entityType: 'alumni_engagement_responses',
    entityId: Number(responseId),
    metadata: { actionType: row.action_type, choice },
  });

  return {
    ok: true,
    message: 'Thank you — your response has been recorded.',
    choice,
    applied: { c1, c2, c3Signal: c1 },
  };
}

async function applyResponseToC1(
  token: Record<string, any>,
  choice: string | null,
  form: Record<string, unknown> | null,
): Promise<boolean> {
  const collegeId = Number(token.college_id);
  const profileId = Number(token.alumni_profile_id);
  const action = String(token.action_type);
  const patch: Record<string, unknown> = { updated_at: db.fn.now() };
  let applied = false;

  const setWillingness = async (key: keyof typeof WILLINGNESS_DB, value: boolean | null) => {
    const col = WILLINGNESS_DB[key];
    if (!(await db.schema.hasColumn('alumni_profiles', col))) return;
    if (value == null) return;
    patch[col] = value;
    patch.willingness_confirmed_at = db.fn.now();
    applied = true;
  };

  if (action === 'MENTORSHIP_INTEREST') {
    if (choice === 'YES') await setWillingness('openToMentoring', true);
    if (choice === 'NO') await setWillingness('openToMentoring', false);
    if (choice === 'MAYBE_LATER' || choice === 'MAYBE') {
      const until = form?.availableAfter || form?.until;
      if (until && (await db.schema.hasColumn('alumni_profiles', 'temporary_unavailable_until'))) {
        patch.temporary_unavailable_until = new Date(String(until));
        patch.temporary_unavailable_reason = 'Deferred mentorship via engagement response';
        applied = true;
      }
      // Do not silently set willingness true/false for maybe
    }
  }
  if (action === 'RECRUITMENT_SUPPORT') {
    if (choice === 'YES') await setWillingness('openToRecruitment', true);
    if (choice === 'NO') await setWillingness('openToRecruitment', false);
  }
  if (action === 'EXPERT_SESSION_INTEREST') {
    if (choice === 'YES') await setWillingness('openToExpertSessions', true);
    if (choice === 'NO') await setWillingness('openToExpertSessions', false);
    if (choice === 'MAYBE' || choice === 'MAYBE_LATER') {
      /* temporary only if until provided */
    }
  }
  if (action === 'RESEARCH_INTEREST') {
    if (choice === 'YES') await setWillingness('openToResearchCollaboration', true);
    if (choice === 'NO') await setWillingness('openToResearchCollaboration', false);
  }

  if (action === 'DATA_REFRESH') {
    if (choice === 'NO_CHANGE') {
      if (await db.schema.hasColumn('alumni_profiles', 'contact_verified_at')) {
        patch.contact_verified_at = db.fn.now();
      }
      // Confirm current employment verification without overwriting fields
      const emp = await db('alumni_employment')
        .where({ alumni_profile_id: profileId, college_id: collegeId, is_current: true })
        .first();
      if (emp && (await db.schema.hasColumn('alumni_employment', 'last_verified_at'))) {
        await db('alumni_employment').where({ id: emp.id }).update({
          last_verified_at: db.fn.now(),
          updated_at: db.fn.now(),
        });
      }
      applied = true;
    }
    if (choice === 'UPDATE' && form) {
      // Only update provided contact fields — never mass-assign arbitrary columns
      if (typeof form.email === 'string' && form.email.includes('@')) {
        patch.email = String(form.email).trim().toLowerCase();
        applied = true;
      }
      if (typeof form.phone === 'string') {
        patch.phone_override = String(form.phone).trim().slice(0, 32);
        applied = true;
      }
      if (typeof form.city === 'string') {
        patch.current_city = String(form.city).trim().slice(0, 128);
        applied = true;
      }
      if (typeof form.country === 'string') {
        patch.current_country = String(form.country).trim().slice(0, 128);
        applied = true;
      }
      if (await db.schema.hasColumn('alumni_profiles', 'contact_verified_at')) {
        patch.contact_verified_at = db.fn.now();
      }
      if (typeof form.organization === 'string' || typeof form.designation === 'string') {
        const emp = await db('alumni_employment')
          .where({ alumni_profile_id: profileId, college_id: collegeId, is_current: true })
          .first();
        const empPatch: Record<string, unknown> = { updated_at: db.fn.now() };
        if (typeof form.organization === 'string') empPatch.organization = String(form.organization).slice(0, 255);
        if (typeof form.designation === 'string') empPatch.designation = String(form.designation).slice(0, 255);
        if (await db.schema.hasColumn('alumni_employment', 'last_verified_at')) {
          empPatch.last_verified_at = db.fn.now();
        }
        if (emp) {
          await db('alumni_employment').where({ id: emp.id }).update(empPatch);
        } else if (form.organization) {
          await db('alumni_employment').insert({
            college_id: collegeId,
            alumni_profile_id: profileId,
            organization: String(form.organization).slice(0, 255),
            designation: form.designation ? String(form.designation).slice(0, 255) : null,
            is_current: true,
            verification_status: 'SELF_DECLARED',
            source_type: 'ENGAGEMENT_RESPONSE',
            last_verified_at: db.fn.now(),
          });
        }
        applied = true;
      }
    }
  }

  if (action === 'PREFERENCE_UPDATE' && form) {
    const prefMap: Record<string, string> = {
      email: 'comm_email_opt_in',
      sms: 'comm_sms_opt_in',
      phone: 'comm_phone_opt_in',
      whatsapp: 'comm_whatsapp_opt_in',
      globalOptOut: 'global_comm_opt_out',
    };
    for (const [k, col] of Object.entries(prefMap)) {
      if (typeof form[k] === 'boolean' && (await db.schema.hasColumn('alumni_profiles', col))) {
        patch[col] = form[k];
        applied = true;
      }
    }
  }

  if (Object.keys(patch).length > 1) {
    await db('alumni_profiles').where({ id: profileId, college_id: collegeId }).update(patch);
    await upsertProvenance({
      collegeId,
      alumniProfileId: profileId,
      entityType: 'alumni_profile',
      entityId: profileId,
      fieldName: action === 'DATA_REFRESH' ? 'contact_employment' : 'willingness',
      sourceType: 'ENGAGEMENT_RESPONSE',
      verificationStatus: 'SELF_DECLARED',
      valueSnapshot: { choice, form, action },
    });
  }
  return applied;
}

async function applyResponseToC2(
  token: Record<string, any>,
  choice: string | null,
  form: Record<string, unknown> | null,
  responseId: number,
): Promise<boolean> {
  const collegeId = Number(token.college_id);
  const profileId = Number(token.alumni_profile_id);

  // System-projected interaction — use a synthetic admin actor from relationship owner or first alumni coord
  let ownerId = null as number | null;
  const rel = await db('alumni_relationships').where({ college_id: collegeId, alumni_profile_id: profileId }).first();
  if (rel?.relationship_owner_id) ownerId = Number(rel.relationship_owner_id);
  if (!ownerId && token.campaign_id) {
    const c = await db('alumni_engagement_campaigns').where({ id: token.campaign_id }).first();
    ownerId = c?.owner_faculty_id ? Number(c.owner_faculty_id) : null;
  }
  if (!ownerId) {
    const fac = await db('faculty_users')
      .where({ college_id: collegeId, is_active: true })
      .whereIn('role', ['ALUMNI_COORDINATOR', 'COLLEGE_ADMIN', 'PRINCIPAL'])
      .first();
    ownerId = fac ? Number(fac.id) : null;
  }
  if (!ownerId) {
    // Still record response row; skip CRM write if no faculty actor
    return false;
  }

  const fac = await db('faculty_users').where({ id: ownerId }).first();
  const actor: AlumniAdminActor = {
    facultyUserId: ownerId,
    collegeId,
    departmentId: fac?.department_id ?? null,
    role: fac?.role || 'ALUMNI_COORDINATOR',
    name: fac?.name || 'Engagement System',
  };

  const outcomeStatus =
    choice === 'YES' || choice === 'UPDATE' || choice === 'NO_CHANGE'
      ? 'RESPONDED'
      : choice === 'NO'
        ? 'DECLINED'
        : 'RESPONDED';

  const interaction = await crm.createInteraction(actor, profileId, {
    interactionType: 'OTHER',
    channel: 'PORTAL',
    direction: 'INBOUND',
    purpose: `Engagement response: ${token.action_type}`,
    summary: `Choice=${choice || 'n/a'}; form=${form ? JSON.stringify(form).slice(0, 500) : 'none'}`,
    outcomeStatus: outcomeStatus as any,
    occurredAt: new Date().toISOString(),
    isContactAttempt: false,
    isMeaningfulEngagement: choice === 'YES' || choice === 'UPDATE',
    captureMode: 'MANUAL',
    evidenceReference: `engagement:response:${responseId}`,
    visibility: 'INSTITUTIONAL',
  });

  if (rowNeedsFollowup(choice, token.action_type)) {
    await crm.createFollowup(actor, profileId, {
      reason: `Engagement response requires follow-up (${token.action_type}: ${choice})`,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      interactionId: interaction.interaction.id,
      notes: form ? JSON.stringify(form).slice(0, 2000) : null,
    });
  }

  if (choice === 'YES' && ['MENTORSHIP_INTEREST', 'RECRUITMENT_SUPPORT', 'EXPERT_SESSION_INTEREST', 'RESEARCH_INTEREST'].includes(token.action_type)) {
    const typeMap: Record<string, string> = {
      MENTORSHIP_INTEREST: 'MENTORSHIP',
      RECRUITMENT_SUPPORT: 'RECRUITMENT',
      EXPERT_SESSION_INTEREST: 'EXPERT_SESSION',
      RESEARCH_INTEREST: 'RESEARCH_COLLABORATION',
    };
    const opp = await crm.createOpportunity(actor, profileId, {
      opportunityType: typeMap[token.action_type] as any,
      title: `Response interest — ${token.action_type}`,
      description: form ? JSON.stringify(form).slice(0, 2000) : null,
      sourceInteractionId: interaction.interaction.id,
      status: 'IDENTIFIED',
    });
    if (token.recipient_id) {
      await db('alumni_engagement_recipients').where({ id: token.recipient_id }).update({
        crm_interaction_id: interaction.interaction.id,
        crm_opportunity_id: opp.opportunity.id,
        funnel_stage: 'OPPORTUNITY_CREATED',
        updated_at: db.fn.now(),
      });
    }
  } else if (token.recipient_id) {
    await db('alumni_engagement_recipients').where({ id: token.recipient_id }).update({
      crm_interaction_id: interaction.interaction.id,
      updated_at: db.fn.now(),
    });
  }

  return true;
}

function rowNeedsFollowup(choice: string | null, actionType: string) {
  return choice === 'MAYBE' || choice === 'MAYBE_LATER' || (choice === 'YES' && actionType !== 'DATA_REFRESH');
}
