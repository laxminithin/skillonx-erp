import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import { requirePlatformCapability } from '../../middleware/platform.js';
import * as platform from './service.js';
import * as surfaces from './surfaces.js';
import { PLATFORM_MODULES, PLATFORM_CAPABILITIES } from './registry.js';

export const platformRouter = Router();
platformRouter.use(requireAuth);

function actor(req: AuthedRequest): platform.PlatformActor {
  return {
    facultyUserId: req.user!.facultyUserId,
    role: req.user!.role,
    collegeId: req.user!.collegeId ?? null,
    name: req.user!.name,
  };
}

/* -------- Overview -------- */
platformRouter.get(
  '/dashboard',
  requirePlatformCapability('platform.dashboard.view'),
  asyncHandler(async (_req, res) => res.json(await platform.dashboard())),
);

platformRouter.get(
  '/health',
  requirePlatformCapability('platform.health.view'),
  asyncHandler(async (_req, res) => res.json(await platform.health())),
);

/* -------- Registry (reference) -------- */
platformRouter.get(
  '/modules',
  requirePlatformCapability('platform.modules.view'),
  asyncHandler(async (_req, res) => res.json({ modules: PLATFORM_MODULES })),
);

platformRouter.get(
  '/capabilities',
  requirePlatformCapability('platform.rbac.view'),
  asyncHandler(async (_req, res) => res.json({ capabilities: PLATFORM_CAPABILITIES, roles: await platform.listRoleCapabilities() })),
);

/* -------- Tenants -------- */
platformRouter.get(
  '/tenants',
  requirePlatformCapability('platform.tenants.view'),
  asyncHandler(async (_req, res) => res.json({ tenants: await platform.listTenants() })),
);

platformRouter.get(
  '/tenants/:id',
  requirePlatformCapability('platform.tenants.view'),
  asyncHandler(async (req, res) => res.json(await platform.getTenant(Number(req.params.id)))),
);

const createTenantSchema = z.object({
  name: z.string().min(2).max(255),
  code: z.string().min(2).max(64).regex(/^[A-Za-z0-9_-]+$/),
  timezone: z.string().max(64).optional(),
  domain: z.string().max(255).nullable().optional(),
  address: z.string().max(512).nullable().optional(),
  adminName: z.string().min(2).max(255),
  adminEmail: z.string().email(),
});

platformRouter.post(
  '/tenants',
  requirePlatformCapability('platform.tenants.manage'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = validate(createTenantSchema, req.body);
    res.status(201).json(await platform.createTenant(actor(req), input));
  }),
);

const statusSchema = z.object({ status: z.enum(platform.TENANT_STATUSES) });
platformRouter.post(
  '/tenants/:id/status',
  requirePlatformCapability('platform.tenants.manage'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { status } = validate(statusSchema, req.body);
    res.json(await platform.setTenantStatus(actor(req), Number(req.params.id), status));
  }),
);

platformRouter.get(
  '/tenants/:id/config-validation',
  requirePlatformCapability('platform.config.view'),
  asyncHandler(async (req, res) => res.json({ issues: await platform.validateTenantConfig(Number(req.params.id)) })),
);

platformRouter.get(
  '/tenants/:id/diagnostics',
  requirePlatformCapability('platform.tenants.view'),
  asyncHandler(async (req, res) => res.json(await platform.tenantDiagnostics(Number(req.params.id)))),
);

/* -------- Module access -------- */
platformRouter.get(
  '/tenants/:id/modules',
  requirePlatformCapability('platform.modules.view'),
  asyncHandler(async (req, res) => res.json({ modules: await platform.getTenantModules(Number(req.params.id)) })),
);

const moduleSchema = z.object({ module: z.string().min(1), enabled: z.boolean() });
platformRouter.post(
  '/tenants/:id/modules',
  requirePlatformCapability('platform.modules.manage'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { module, enabled } = validate(moduleSchema, req.body);
    const collegeId = Number(req.params.id);
    const result = enabled
      ? await platform.enableModule(actor(req), collegeId, module)
      : await platform.disableModule(actor(req), collegeId, module);
    res.json(result);
  }),
);

/* -------- Identity -------- */
platformRouter.get(
  '/users',
  requirePlatformCapability('platform.identity.view'),
  asyncHandler(async (req, res) => {
    res.json({
      users: await platform.listUsers({
        q: typeof req.query.q === 'string' ? req.query.q : undefined,
        collegeId: req.query.collegeId ? Number(req.query.collegeId) : null,
        role: typeof req.query.role === 'string' ? req.query.role : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      }),
    });
  }),
);

const activeSchema = z.object({ isActive: z.boolean() });
platformRouter.post(
  '/users/:id/active',
  requirePlatformCapability('platform.identity.manage'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { isActive } = validate(activeSchema, req.body);
    res.json(await platform.setUserActive(actor(req), Number(req.params.id), isActive));
  }),
);

const roleSchema = z.object({ role: z.string().min(2).max(64) });
platformRouter.post(
  '/users/:id/role',
  requirePlatformCapability('platform.identity.manage'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { role } = validate(roleSchema, req.body);
    res.json(await platform.changeUserRole(actor(req), Number(req.params.id), role));
  }),
);

/* -------- RBAC governance -------- */
const capSchema = z.object({ role: z.string().min(2).max(64), capability: z.string().min(3).max(96) });
platformRouter.post(
  '/rbac/grant',
  requirePlatformCapability('platform.rbac.manage'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { role, capability } = validate(capSchema, req.body);
    res.json(await platform.grantRoleCapability(actor(req), role, capability));
  }),
);

platformRouter.post(
  '/rbac/revoke',
  requirePlatformCapability('platform.rbac.manage'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { role, capability } = validate(capSchema, req.body);
    res.json(await platform.revokeRoleCapability(actor(req), role, capability));
  }),
);

/* -------- Integrations -------- */
platformRouter.get(
  '/integrations',
  requirePlatformCapability('platform.integrations.view'),
  asyncHandler(async (_req, res) => res.json({ integrations: await platform.listIntegrations() })),
);

const integrationSchema = z.object({
  config: z.record(z.string(), z.unknown()).nullable().optional(),
  secret: z.string().min(1).max(512).nullable().optional(),
});
platformRouter.put(
  '/integrations/:key',
  requirePlatformCapability('platform.integrations.manage'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = validate(integrationSchema, req.body);
    res.json(await platform.updateIntegration(actor(req), req.params.key, input));
  }),
);

/* -------- Audit -------- */
platformRouter.get(
  '/audit',
  requirePlatformCapability('platform.audit.view'),
  asyncHandler(async (req, res) => {
    res.json({
      entries: await platform.listAudit({
        actorId: req.query.actorId ? Number(req.query.actorId) : undefined,
        collegeId: req.query.collegeId ? Number(req.query.collegeId) : undefined,
        action: typeof req.query.action === 'string' ? req.query.action : undefined,
        resourceType: typeof req.query.resourceType === 'string' ? req.query.resourceType : undefined,
        success: req.query.success === 'true' ? true : req.query.success === 'false' ? false : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      }),
    });
  }),
);

/* -------- Feature flags -------- */
platformRouter.get(
  '/feature-flags',
  requirePlatformCapability('platform.config.view'),
  asyncHandler(async (_req, res) => res.json({ flags: await surfaces.listFeatureFlags() })),
);

const flagSchema = z.object({ enabled: z.boolean(), rollout: z.enum(['OFF', 'PARTIAL', 'ON']).optional() });
platformRouter.put(
  '/feature-flags/:key',
  requirePlatformCapability('platform.config.manage'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { enabled, rollout } = validate(flagSchema, req.body);
    res.json(await surfaces.setFeatureFlag(actor(req), req.params.key, enabled, rollout));
  }),
);

const tenantFlagSchema = z.object({ collegeId: z.number().int().positive(), enabled: z.boolean() });
platformRouter.put(
  '/feature-flags/:key/tenant',
  requirePlatformCapability('platform.config.manage'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { collegeId, enabled } = validate(tenantFlagSchema, req.body);
    res.json(await surfaces.setTenantFeatureFlag(actor(req), collegeId, req.params.key, enabled));
  }),
);

/* -------- Master data -------- */
platformRouter.get(
  '/masters',
  requirePlatformCapability('platform.masters.view'),
  asyncHandler(async (_req, res) => res.json({ templates: await surfaces.listMasterTemplates() })),
);

const versionSchema = z.object({ payload: z.unknown(), name: z.string().max(160).optional() });
platformRouter.post(
  '/masters/:key/version',
  requirePlatformCapability('platform.masters.manage'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { payload, name } = validate(versionSchema, req.body);
    res.json(await surfaces.versionMasterTemplate(actor(req), req.params.key, payload, name));
  }),
);

const adoptSchema = z.object({ collegeId: z.number().int().positive(), key: z.string().min(3) });
platformRouter.post(
  '/masters/adopt',
  requirePlatformCapability('platform.masters.manage'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { collegeId, key } = validate(adoptSchema, req.body);
    res.json(await surfaces.adoptMaster(actor(req), collegeId, key));
  }),
);

platformRouter.get(
  '/tenants/:id/masters',
  requirePlatformCapability('platform.masters.view'),
  asyncHandler(async (req, res) => res.json({ adoptions: await surfaces.listTenantAdoptions(Number(req.params.id)) })),
);

/* -------- Announcements -------- */
platformRouter.get(
  '/announcements',
  requirePlatformCapability('platform.announcements.manage'),
  asyncHandler(async (_req, res) => res.json({ announcements: await surfaces.listAnnouncements() })),
);

const announcementSchema = z.object({
  title: z.string().min(2).max(200),
  message: z.string().min(2),
  audience: z.enum(['ALL', 'SELECTED']),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
  publishAt: z.string().nullable().optional(),
  expiryAt: z.string().nullable().optional(),
  collegeIds: z.array(z.number().int().positive()).optional(),
});
platformRouter.post(
  '/announcements',
  requirePlatformCapability('platform.announcements.manage'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = validate(announcementSchema, req.body);
    res.status(201).json(await surfaces.createAnnouncement(actor(req), input));
  }),
);

platformRouter.post(
  '/announcements/:id/publish',
  requirePlatformCapability('platform.announcements.manage'),
  asyncHandler(async (req: AuthedRequest, res) => res.json(await surfaces.publishAnnouncement(actor(req), Number(req.params.id)))),
);

platformRouter.post(
  '/announcements/:id/expire',
  requirePlatformCapability('platform.announcements.manage'),
  asyncHandler(async (req: AuthedRequest, res) => res.json(await surfaces.expireAnnouncement(actor(req), Number(req.params.id)))),
);

/** Tenant-scoped announcement feed (still platform-capability gated for Super Admin diagnostics). */
platformRouter.get(
  '/tenants/:id/announcements',
  requirePlatformCapability('platform.announcements.manage'),
  asyncHandler(async (req, res) => res.json({ announcements: await surfaces.announcementsForTenant(Number(req.params.id)) })),
);

/* -------- Tenant settings & branding -------- */
platformRouter.get(
  '/tenants/:id/settings',
  requirePlatformCapability('platform.config.view'),
  asyncHandler(async (req, res) => res.json(await surfaces.getSettings(Number(req.params.id)))),
);

const settingsSchema = z.object({
  timezone: z.string().max(64).optional(),
  locale: z.string().max(16).optional(),
  dateFormat: z.string().max(24).optional(),
  employeeIdPrefix: z.string().max(16).nullable().optional(),
  receiptPrefix: z.string().max(16).nullable().optional(),
  notifyEmailEnabled: z.boolean().optional(),
  notifySmsEnabled: z.boolean().optional(),
});
platformRouter.put(
  '/tenants/:id/settings',
  requirePlatformCapability('platform.config.manage'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = validate(settingsSchema, req.body);
    res.json(await surfaces.updateSettings(actor(req), Number(req.params.id), input));
  }),
);

platformRouter.get(
  '/tenants/:id/branding',
  requirePlatformCapability('platform.config.view'),
  asyncHandler(async (req, res) => res.json(await surfaces.getBranding(Number(req.params.id)))),
);

const brandingSchema = z.object({
  displayName: z.string().max(200).nullable().optional(),
  shortName: z.string().max(64).nullable().optional(),
  logoUrl: z.string().max(512).nullable().optional(),
  reportHeader: z.string().max(200).nullable().optional(),
  portalTitle: z.string().max(120).nullable().optional(),
  accentColor: z.string().max(9).nullable().optional(),
});
platformRouter.put(
  '/tenants/:id/branding',
  requirePlatformCapability('platform.config.manage'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = validate(brandingSchema, req.body);
    res.json(await surfaces.updateBranding(actor(req), Number(req.params.id), input));
  }),
);
