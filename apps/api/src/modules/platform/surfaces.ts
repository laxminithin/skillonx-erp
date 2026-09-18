import type { Knex } from 'knex';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { audit, type PlatformActor } from './service.js';

/* ============================ reference seeds ============================ */

export const FEATURE_FLAGS = [
  { key: 'platform.onboardingWizard', description: 'Guided tenant onboarding wizard' },
  { key: 'platform.betaDashboards', description: 'Beta analytics dashboards for tenants' },
  { key: 'platform.maintenanceBanner', description: 'Global maintenance banner' },
] as const;

export const MASTER_TEMPLATES = [
  {
    domain: 'academic',
    key: 'academic.assessment-scheme',
    name: 'Standard Assessment Scheme',
    payload: { cieWeight: 50, seeWeight: 50, passPercent: 40, components: ['CIE-1', 'CIE-2', 'Assignment'] },
  },
  {
    domain: 'hr',
    key: 'hr.leave-types',
    name: 'Standard Leave Types',
    payload: { types: [{ code: 'CL', name: 'Casual Leave', annual: 12 }, { code: 'EL', name: 'Earned Leave', annual: 15 }] },
  },
  {
    domain: 'finance',
    key: 'finance.fee-heads',
    name: 'Standard Fee Heads',
    payload: { heads: [{ code: 'TUITION', name: 'Tuition Fee' }, { code: 'LIB', name: 'Library Fee' }] },
  },
] as const;

let surfacesReady = false;

/** Idempotently seed the code-defined surface reference data. */
export async function ensureSurfaces(force = false): Promise<void> {
  if (surfacesReady && !force) return;
  await db.transaction(async (trx: Knex.Transaction) => {
    for (const f of FEATURE_FLAGS) {
      const existing = await trx('platform_feature_flags').where({ flag_key: f.key }).first();
      if (!existing) await trx('platform_feature_flags').insert({ flag_key: f.key, description: f.description, enabled: false, rollout: 'OFF' });
    }
    for (const m of MASTER_TEMPLATES) {
      const existing = await trx('platform_master_templates').where({ template_key: m.key, version: 1 }).first();
      if (!existing) {
        await trx('platform_master_templates').insert({
          domain: m.domain,
          template_key: m.key,
          name: m.name,
          version: 1,
          payload: JSON.stringify(m.payload),
          status: 'ACTIVE',
        });
      }
    }
  });
  surfacesReady = true;
}

function safeParse(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/* ============================ feature flags ============================= */

export async function listFeatureFlags() {
  await ensureSurfaces();
  const flags = await db('platform_feature_flags').orderBy('flag_key');
  const overrides = await db('college_feature_flags');
  return flags.map((f: Record<string, unknown>) => ({
    key: f.flag_key,
    description: f.description,
    enabled: Boolean(f.enabled),
    rollout: f.rollout,
    overrides: overrides
      .filter((o: Record<string, unknown>) => o.flag_key === f.flag_key)
      .map((o: Record<string, unknown>) => ({ collegeId: Number(o.college_id), enabled: Boolean(o.enabled) })),
  }));
}

export async function setFeatureFlag(actor: PlatformActor, key: string, enabled: boolean, rollout?: string) {
  await ensureSurfaces();
  if (!FEATURE_FLAGS.some((f) => f.key === key)) {
    throw new AppError(404, 'Unknown feature flag', undefined, 'UNKNOWN_FLAG');
  }
  const existing = await db('platform_feature_flags').where({ flag_key: key }).first();
  if (!existing) throw new AppError(404, 'Unknown feature flag', undefined, 'UNKNOWN_FLAG');
  await db('platform_feature_flags').where({ flag_key: key }).update({
    enabled,
    rollout: rollout ?? (enabled ? 'ON' : 'OFF'),
    updated_at: db.fn.now(),
  });
  await audit(actor, { action: 'flag.set', resourceType: 'feature_flag', resourceId: key, detail: { enabled } });
  return { key, enabled };
}

export async function setTenantFeatureFlag(actor: PlatformActor, collegeId: number, key: string, enabled: boolean) {
  await ensureSurfaces();
  const college = await db('colleges').where({ id: collegeId }).first();
  if (!college) throw new AppError(404, 'Tenant not found', undefined, 'TENANT_NOT_FOUND');
  const flag = await db('platform_feature_flags').where({ flag_key: key }).first();
  if (!flag) throw new AppError(404, 'Unknown feature flag', undefined, 'UNKNOWN_FLAG');
  // Registry-backed: reject keys that are not in the code-defined catalogue.
  if (!FEATURE_FLAGS.some((f) => f.key === key)) {
    throw new AppError(400, 'Unknown feature flag key', undefined, 'UNKNOWN_FLAG');
  }
  const existing = await db('college_feature_flags').where({ college_id: collegeId, flag_key: key }).first();
  if (existing) await db('college_feature_flags').where({ id: existing.id }).update({ enabled, updated_at: db.fn.now() });
  else await db('college_feature_flags').insert({ college_id: collegeId, flag_key: key, enabled });
  await audit(actor, { action: 'flag.tenant', resourceType: 'feature_flag', resourceId: key, collegeId, detail: { enabled } });
  return { collegeId, key, enabled };
}

/** Effective flag value for a tenant (override wins over global). */
export async function isFlagEnabled(collegeId: number, key: string): Promise<boolean> {
  const override = await db('college_feature_flags').where({ college_id: collegeId, flag_key: key }).first();
  if (override) return Boolean(override.enabled);
  const flag = await db('platform_feature_flags').where({ flag_key: key }).first();
  return flag ? Boolean(flag.enabled) : false;
}

/* ============================ master data =============================== */

export async function listMasterTemplates() {
  await ensureSurfaces();
  const rows = await db('platform_master_templates').orderBy(['domain', 'template_key', 'version']);
  return rows.map((r: Record<string, unknown>) => ({
    id: Number(r.id),
    domain: r.domain,
    key: r.template_key,
    name: r.name,
    version: Number(r.version),
    status: r.status,
    payload: safeParse(r.payload),
    updatedAt: r.updated_at,
  }));
}

/** Latest active version of a template. */
async function latestTemplate(key: string) {
  return db('platform_master_templates').where({ template_key: key }).orderBy('version', 'desc').first();
}

/**
 * Publish a new version of a master template (immutable versioning). Existing
 * versions are never mutated, so tenant adoption snapshots stay stable.
 */
export async function versionMasterTemplate(actor: PlatformActor, key: string, payload: unknown, name?: string) {
  await ensureSurfaces();
  const current = await latestTemplate(key);
  if (!current) throw new AppError(404, 'Unknown master template', undefined, 'UNKNOWN_TEMPLATE');
  const nextVersion = Number(current.version) + 1;
  await db('platform_master_templates').insert({
    domain: current.domain,
    template_key: key,
    name: name ?? current.name,
    version: nextVersion,
    payload: JSON.stringify(payload),
    status: 'ACTIVE',
  });
  await db('platform_master_templates').where({ template_key: key }).whereNot({ version: nextVersion }).update({ status: 'DEPRECATED' });
  await audit(actor, { action: 'master.version', resourceType: 'master_template', resourceId: key, detail: { version: nextVersion } });
  return { key, version: nextVersion };
}

/**
 * Adopt a template into a tenant. Copy-on-adopt: an immutable snapshot of the
 * template payload at this version is stored on the tenant. Later template
 * edits/versions never rewrite this snapshot.
 */
export async function adoptMaster(actor: PlatformActor, collegeId: number, key: string) {
  await ensureSurfaces();
  const college = await db('colleges').where({ id: collegeId }).first();
  if (!college) throw new AppError(404, 'Tenant not found', undefined, 'TENANT_NOT_FOUND');
  const template = await latestTemplate(key);
  if (!template) throw new AppError(404, 'Unknown master template', undefined, 'UNKNOWN_TEMPLATE');
  const existing = await db('tenant_adopted_masters').where({ college_id: collegeId, template_key: key }).first();
  if (existing) {
    return {
      collegeId,
      key,
      version: Number(existing.template_version),
      snapshot: safeParse(existing.snapshot),
      unchanged: true,
    };
  }
  const snapshot = safeParse(template.payload);
  await db('tenant_adopted_masters').insert({
    college_id: collegeId,
    template_key: key,
    template_version: template.version,
    snapshot: JSON.stringify(snapshot),
    adopted_by_faculty_user_id: actor.facultyUserId,
  });
  await audit(actor, { action: 'master.adopt', resourceType: 'master_template', resourceId: key, collegeId, detail: { version: template.version } });
  return { collegeId, key, version: Number(template.version), snapshot, unchanged: false };
}

export async function listTenantAdoptions(collegeId: number) {
  await ensureSurfaces();
  const rows = await db('tenant_adopted_masters').where({ college_id: collegeId });
  return rows.map((r: Record<string, unknown>) => ({
    key: r.template_key,
    version: Number(r.template_version),
    snapshot: safeParse(r.snapshot),
    adoptedAt: r.adopted_at,
  }));
}

/* ============================ announcements ============================= */

export async function listAnnouncements() {
  const rows = await db('platform_announcements').orderBy('created_at', 'desc');
  const targets = await db('platform_announcement_targets');
  return rows.map((r: Record<string, unknown>) => ({
    id: Number(r.id),
    title: r.title,
    message: r.message,
    audience: r.audience,
    severity: r.severity,
    status: r.status,
    publishAt: r.publish_at,
    expiryAt: r.expiry_at,
    targets: targets.filter((t: Record<string, unknown>) => Number(t.announcement_id) === Number(r.id)).map((t: Record<string, unknown>) => Number(t.college_id)),
    createdAt: r.created_at,
  }));
}

export interface CreateAnnouncementInput {
  title: string;
  message: string;
  audience: 'ALL' | 'SELECTED';
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  publishAt?: string | null;
  expiryAt?: string | null;
  collegeIds?: number[];
}

export async function createAnnouncement(actor: PlatformActor, input: CreateAnnouncementInput) {
  if (input.audience === 'SELECTED' && (!input.collegeIds || input.collegeIds.length === 0)) {
    throw new AppError(400, 'Select at least one tenant for a targeted announcement', undefined, 'NO_TARGETS');
  }
  return db.transaction(async (trx) => {
    const [id] = await trx('platform_announcements').insert({
      title: input.title.trim(),
      message: input.message.trim(),
      audience: input.audience,
      severity: input.severity ?? 'INFO',
      status: 'DRAFT',
      publish_at: input.publishAt ?? null,
      expiry_at: input.expiryAt ?? null,
      created_by_faculty_user_id: actor.facultyUserId,
    });
    if (input.audience === 'SELECTED' && input.collegeIds) {
      // Validate targets exist before inserting (no accidental cross-scope).
      const valid = await trx('colleges').whereIn('id', input.collegeIds).select('id');
      const validIds = new Set(valid.map((c: Record<string, unknown>) => Number(c.id)));
      const rows = input.collegeIds.filter((c) => validIds.has(c)).map((c) => ({ announcement_id: Number(id), college_id: c }));
      if (rows.length) await trx('platform_announcement_targets').insert(rows);
    }
    await audit(actor, { action: 'announcement.create', resourceType: 'announcement', resourceId: Number(id), detail: { audience: input.audience } }, trx);
    return { id: Number(id) };
  });
}

export async function publishAnnouncement(actor: PlatformActor, id: number) {
  const a = await db('platform_announcements').where({ id }).first();
  if (!a) throw new AppError(404, 'Announcement not found');
  if (a.status === 'EXPIRED') throw new AppError(400, 'Expired announcements cannot be republished', undefined, 'ALREADY_EXPIRED');
  await db('platform_announcements').where({ id }).update({ status: 'PUBLISHED', publish_at: a.publish_at ?? db.fn.now() });
  await audit(actor, { action: 'announcement.publish', resourceType: 'announcement', resourceId: id });
  return { id, status: 'PUBLISHED' };
}

export async function expireAnnouncement(actor: PlatformActor, id: number) {
  const a = await db('platform_announcements').where({ id }).first();
  if (!a) throw new AppError(404, 'Announcement not found');
  await db('platform_announcements').where({ id }).update({ status: 'EXPIRED', expiry_at: a.expiry_at ?? db.fn.now() });
  await audit(actor, { action: 'announcement.expire', resourceType: 'announcement', resourceId: id });
  return { id, status: 'EXPIRED' };
}

/** Flip PUBLISHED rows past expiry_at to EXPIRED (idempotent housekeeping). */
export async function expireDueAnnouncements() {
  const now = new Date();
  await db('platform_announcements')
    .where({ status: 'PUBLISHED' })
    .whereNotNull('expiry_at')
    .andWhere('expiry_at', '<=', now)
    .update({ status: 'EXPIRED' });
}

function isAnnouncementLive(a: Record<string, unknown>, now = new Date()): boolean {
  if (a.status !== 'PUBLISHED') return false;
  if (a.publish_at && new Date(String(a.publish_at)) > now) return false;
  if (a.expiry_at && new Date(String(a.expiry_at)) <= now) return false;
  return true;
}

/** Announcements visible to a given tenant (respects targeting/isolation + expiry). */
export async function announcementsForTenant(collegeId: number) {
  await expireDueAnnouncements();
  const published = await db('platform_announcements').where({ status: 'PUBLISHED' });
  const targets = await db('platform_announcement_targets').where({ college_id: collegeId });
  const targetedIds = new Set(targets.map((t: Record<string, unknown>) => Number(t.announcement_id)));
  const now = new Date();
  return published
    .filter((a: Record<string, unknown>) => isAnnouncementLive(a, now))
    .filter((a: Record<string, unknown>) => a.audience === 'ALL' || targetedIds.has(Number(a.id)))
    .map((a: Record<string, unknown>) => ({
      id: Number(a.id),
      title: a.title,
      message: a.message,
      severity: a.severity,
      publishAt: a.publish_at,
      expiryAt: a.expiry_at,
    }));
}

/* ============================ tenant settings =========================== */

export async function getSettings(collegeId: number) {
  const college = await db('colleges').where({ id: collegeId }).first();
  if (!college) throw new AppError(404, 'Tenant not found');
  const row = await db('college_settings').where({ college_id: collegeId }).first();
  return {
    timezone: college.timezone,
    locale: row?.locale ?? 'en-IN',
    dateFormat: row?.date_format ?? 'DD-MM-YYYY',
    employeeIdPrefix: row?.employee_id_prefix ?? null,
    receiptPrefix: row?.receipt_prefix ?? null,
    notifyEmailEnabled: row ? Boolean(row.notify_email_enabled) : true,
    notifySmsEnabled: row ? Boolean(row.notify_sms_enabled) : false,
  };
}

const PREFIX_RE = /^[A-Z0-9-]{0,16}$/;
const LOCALE_RE = /^[a-z]{2}(-[A-Z]{2})?$/;
const DATE_FORMATS = new Set(['DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD']);

export interface SettingsInput {
  timezone?: string;
  locale?: string;
  dateFormat?: string;
  employeeIdPrefix?: string | null;
  receiptPrefix?: string | null;
  notifyEmailEnabled?: boolean;
  notifySmsEnabled?: boolean;
}

export async function updateSettings(actor: PlatformActor, collegeId: number, input: SettingsInput) {
  const college = await db('colleges').where({ id: collegeId }).first();
  if (!college) throw new AppError(404, 'Tenant not found');
  if (input.locale !== undefined && !LOCALE_RE.test(input.locale)) {
    throw new AppError(400, 'Locale must look like en or en-IN.', undefined, 'INVALID_LOCALE');
  }
  if (input.dateFormat !== undefined && !DATE_FORMATS.has(input.dateFormat)) {
    throw new AppError(400, 'Unsupported date format.', undefined, 'INVALID_DATE_FORMAT');
  }
  if (input.employeeIdPrefix && !PREFIX_RE.test(input.employeeIdPrefix)) {
    throw new AppError(400, 'Employee ID prefix must be uppercase letters, digits or dashes (max 16).', undefined, 'INVALID_PREFIX');
  }
  if (input.receiptPrefix && !PREFIX_RE.test(input.receiptPrefix)) {
    throw new AppError(400, 'Receipt prefix must be uppercase letters, digits or dashes (max 16).', undefined, 'INVALID_PREFIX');
  }
  if (input.timezone) await db('colleges').where({ id: collegeId }).update({ timezone: input.timezone });
  const patch: Record<string, unknown> = { updated_at: db.fn.now() };
  if (input.locale !== undefined) patch.locale = input.locale;
  if (input.dateFormat !== undefined) patch.date_format = input.dateFormat;
  if (input.employeeIdPrefix !== undefined) patch.employee_id_prefix = input.employeeIdPrefix;
  if (input.receiptPrefix !== undefined) patch.receipt_prefix = input.receiptPrefix;
  if (input.notifyEmailEnabled !== undefined) patch.notify_email_enabled = input.notifyEmailEnabled;
  if (input.notifySmsEnabled !== undefined) patch.notify_sms_enabled = input.notifySmsEnabled;
  const existing = await db('college_settings').where({ college_id: collegeId }).first();
  if (existing) await db('college_settings').where({ college_id: collegeId }).update(patch);
  else await db('college_settings').insert({ college_id: collegeId, ...patch });
  await audit(actor, { action: 'settings.update', resourceType: 'settings', resourceId: collegeId, collegeId });
  return getSettings(collegeId);
}

/* ============================ branding ================================== */

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
// Reject anything that could be interpreted as markup/script if ever rendered.
const UNSAFE_RE = /[<>]/;

export async function getBranding(collegeId: number) {
  const college = await db('colleges').where({ id: collegeId }).first();
  if (!college) throw new AppError(404, 'Tenant not found');
  const row = await db('college_branding').where({ college_id: collegeId }).first();
  return {
    displayName: row?.display_name ?? college.name,
    shortName: row?.short_name ?? null,
    logoUrl: row?.logo_url ?? college.logo_url ?? null,
    reportHeader: row?.report_header ?? null,
    portalTitle: row?.portal_title ?? null,
    accentColor: row?.accent_color ?? null,
  };
}

export interface BrandingInput {
  displayName?: string | null;
  shortName?: string | null;
  logoUrl?: string | null;
  reportHeader?: string | null;
  portalTitle?: string | null;
  accentColor?: string | null;
}

export async function updateBranding(actor: PlatformActor, collegeId: number, input: BrandingInput) {
  const college = await db('colleges').where({ id: collegeId }).first();
  if (!college) throw new AppError(404, 'Tenant not found');
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === 'string' && UNSAFE_RE.test(v)) {
      throw new AppError(400, `Branding field ${k} may not contain markup characters.`, undefined, 'UNSAFE_BRANDING');
    }
  }
  if (input.accentColor && !HEX_RE.test(input.accentColor)) {
    throw new AppError(400, 'Accent colour must be a hex value like #2563EB.', undefined, 'INVALID_COLOR');
  }
  if (input.logoUrl && !/^https?:\/\//.test(input.logoUrl)) {
    throw new AppError(400, 'Logo URL must be an http(s) URL.', undefined, 'INVALID_URL');
  }
  const patch: Record<string, unknown> = { updated_at: db.fn.now() };
  if (input.displayName !== undefined) patch.display_name = input.displayName;
  if (input.shortName !== undefined) patch.short_name = input.shortName;
  if (input.logoUrl !== undefined) patch.logo_url = input.logoUrl;
  if (input.reportHeader !== undefined) patch.report_header = input.reportHeader;
  if (input.portalTitle !== undefined) patch.portal_title = input.portalTitle;
  if (input.accentColor !== undefined) patch.accent_color = input.accentColor;
  const existing = await db('college_branding').where({ college_id: collegeId }).first();
  if (existing) await db('college_branding').where({ college_id: collegeId }).update(patch);
  else await db('college_branding').insert({ college_id: collegeId, ...patch });
  await audit(actor, { action: 'branding.update', resourceType: 'branding', resourceId: collegeId, collegeId });
  return getBranding(collegeId);
}
