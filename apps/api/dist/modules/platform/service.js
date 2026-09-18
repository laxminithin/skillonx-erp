import bcrypt from 'bcrypt';
import net from 'node:net';
import { randomBytes } from 'node:crypto';
import { db } from '../../db/index.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';
import { isSuperAdmin } from '../../utils/permissions.js';
import { PLATFORM_MODULES, PLATFORM_CAPABILITY_KEYS, ensureRegistry, moduleDef, dependentsOf, } from './registry.js';
/* ------------------------------- lifecycle ------------------------------- */
export const TENANT_STATUSES = ['DRAFT', 'ONBOARDING', 'ACTIVE', 'SUSPENDED', 'ARCHIVED'];
const TENANT_TRANSITIONS = {
    DRAFT: ['ONBOARDING', 'ACTIVE', 'ARCHIVED'],
    ONBOARDING: ['ACTIVE', 'ARCHIVED'],
    ACTIVE: ['SUSPENDED', 'ARCHIVED'],
    SUSPENDED: ['ACTIVE', 'ARCHIVED'],
    ARCHIVED: ['ACTIVE'], // non-destructive restore only
};
/** Modules enabled by default when a tenant is provisioned. */
const DEFAULT_ENABLED_MODULES = ['academics', 'examination', 'finance', 'library', 'hrms'];
/* -------------------------------- audit --------------------------------- */
export async function audit(actor, entry, trx) {
    const runner = trx ?? db;
    await runner('platform_audit_log').insert({
        actor_faculty_user_id: actor?.facultyUserId ?? null,
        actor_role: actor?.role ?? null,
        action: entry.action,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId != null ? String(entry.resourceId) : null,
        college_id: entry.collegeId ?? null,
        success: entry.success ?? true,
        detail: entry.detail != null ? JSON.stringify(entry.detail) : null,
    });
}
export async function listTenants() {
    const rows = await db('colleges as c')
        .select('c.id', 'c.name', 'c.code', 'c.status', 'c.is_active', 'c.timezone', db.raw('(select count(*) from departments d where d.college_id = c.id) as department_count'), db.raw("(select count(*) from faculty_users f where f.college_id = c.id and f.archived_at is null) as faculty_count"), db.raw('(select count(*) from students st where st.college_id = c.id) as student_count'), db.raw("(select count(*) from college_modules cm where cm.college_id = c.id and cm.enabled = 1) as explicit_enabled"), db.raw("(select count(*) from faculty_users f where f.college_id = c.id and f.role = 'COLLEGE_ADMIN' and f.is_active = 1) as active_admins"))
        .orderBy('c.name');
    return rows.map((r) => ({
        id: Number(r.id),
        name: String(r.name),
        code: String(r.code),
        status: String(r.status),
        is_active: Boolean(r.is_active),
        timezone: String(r.timezone),
        departmentCount: Number(r.department_count),
        facultyCount: Number(r.faculty_count),
        studentCount: Number(r.student_count),
        modulesEnabled: Number(r.explicit_enabled),
        hasActiveAdmin: Number(r.active_admins) > 0,
    }));
}
export async function getTenant(id) {
    const c = await db('colleges').where({ id }).first();
    if (!c)
        throw new AppError(404, 'Tenant not found');
    const modules = await getTenantModules(id);
    const admins = await db('faculty_users')
        .where({ college_id: id, role: 'COLLEGE_ADMIN' })
        .whereNull('archived_at')
        .select('id', 'name', 'email', 'is_active');
    return {
        id: Number(c.id),
        name: c.name,
        code: c.code,
        status: c.status,
        isActive: Boolean(c.is_active),
        timezone: c.timezone,
        domain: c.domain,
        address: c.address,
        logoUrl: c.logo_url,
        suspendedAt: c.suspended_at,
        archivedAt: c.archived_at,
        modules,
        admins: admins.map((a) => ({
            id: Number(a.id),
            name: a.name,
            email: a.email,
            isActive: Boolean(a.is_active),
        })),
    };
}
/**
 * Transactionally create a tenant and provision its minimum defaults: default
 * module configuration and a primary COLLEGE_ADMIN. On any failure the whole
 * creation rolls back — no half-created hidden tenants.
 */
export async function createTenant(actor, input) {
    await ensureRegistry();
    const code = input.code.trim().toUpperCase();
    const existing = await db('colleges').where({ code }).first();
    if (existing)
        throw new AppError(409, 'A tenant with this code already exists', undefined, 'TENANT_CODE_TAKEN');
    const temporaryPassword = randomBytes(5).toString('hex') + 'Aa1!';
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const setupToken = randomBytes(24).toString('hex');
    let tenantId = 0;
    let adminId = 0;
    try {
        await db.transaction(async (trx) => {
            const [id] = await trx('colleges').insert({
                name: input.name.trim(),
                code,
                domain: input.domain ?? null,
                address: input.address ?? null,
                timezone: input.timezone ?? 'Asia/Kolkata',
                status: 'ONBOARDING',
                is_active: false,
            });
            tenantId = Number(id);
            const rows = PLATFORM_MODULES.map((m) => ({
                college_id: tenantId,
                module_key: m.key,
                enabled: m.core || DEFAULT_ENABLED_MODULES.includes(m.key),
                enabled_at: m.core || DEFAULT_ENABLED_MODULES.includes(m.key) ? trx.fn.now() : null,
                updated_by_faculty_user_id: actor.facultyUserId,
            }));
            await trx('college_modules').insert(rows);
            const [fid] = await trx('faculty_users').insert({
                college_id: tenantId,
                name: input.adminName.trim(),
                email: input.adminEmail.trim().toLowerCase(),
                password_hash: passwordHash,
                role: 'COLLEGE_ADMIN',
                is_active: true,
                reset_token: setupToken,
                reset_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            });
            adminId = Number(fid);
            await audit(actor, { action: 'tenant.create', resourceType: 'tenant', resourceId: tenantId, collegeId: tenantId, detail: { code, adminId } }, trx);
        });
    }
    catch (err) {
        const e = err;
        if (e.code === 'ER_DUP_ENTRY') {
            throw new AppError(409, 'A tenant with this code already exists', undefined, 'TENANT_CODE_TAKEN');
        }
        throw err;
    }
    return {
        tenant: await getTenant(tenantId),
        admin: { id: adminId, email: input.adminEmail.trim().toLowerCase(), temporaryPassword, setupToken },
    };
}
export async function setTenantStatus(actor, id, next) {
    if (!TENANT_STATUSES.includes(next))
        throw new AppError(400, 'Invalid tenant status');
    return db.transaction(async (trx) => {
        const c = await trx('colleges').where({ id }).forUpdate().first();
        if (!c)
            throw new AppError(404, 'Tenant not found');
        const current = c.status;
        if (current === next)
            return { id, status: next, unchanged: true };
        if (!TENANT_TRANSITIONS[current]?.includes(next)) {
            throw new AppError(409, `Cannot move tenant from ${current} to ${next}`, undefined, 'INVALID_TRANSITION');
        }
        const patch = {
            status: next,
            is_active: next === 'ACTIVE',
            suspended_at: next === 'SUSPENDED' ? trx.fn.now() : null,
            archived_at: next === 'ARCHIVED' ? trx.fn.now() : c.archived_at,
        };
        if (next === 'ACTIVE')
            patch.archived_at = null;
        await trx('colleges').where({ id }).update(patch);
        await audit(actor, { action: 'tenant.status', resourceType: 'tenant', resourceId: id, collegeId: id, detail: { from: current, to: next } }, trx);
        return { id, status: next, unchanged: false };
    });
}
/* ---------------------------- module governance -------------------------- */
export async function getTenantModules(collegeId) {
    await ensureRegistry();
    const rows = await db('college_modules').where({ college_id: collegeId });
    const byKey = new Map(rows.map((r) => [String(r.module_key), r]));
    return PLATFORM_MODULES.map((m) => {
        const row = byKey.get(m.key);
        // Backward-compatible default: a tenant with no explicit row has the
        // module enabled (existing colleges predate module governance).
        const enabled = row ? Boolean(row.enabled) : true;
        return {
            key: m.key,
            name: m.name,
            category: m.category,
            description: m.description,
            requires: m.requires,
            core: m.core,
            enabled,
        };
    });
}
export async function isModuleEnabled(collegeId, key) {
    const row = await db('college_modules').where({ college_id: collegeId, module_key: key }).first();
    return row ? Boolean(row.enabled) : true;
}
async function upsertModule(trx, actor, collegeId, key, enabled) {
    const existing = await trx('college_modules').where({ college_id: collegeId, module_key: key }).first();
    const patch = {
        enabled,
        enabled_at: enabled ? trx.fn.now() : existing?.enabled_at ?? null,
        disabled_at: enabled ? null : trx.fn.now(),
        updated_by_faculty_user_id: actor.facultyUserId,
        updated_at: trx.fn.now(),
    };
    if (existing)
        await trx('college_modules').where({ id: existing.id }).update(patch);
    else
        await trx('college_modules').insert({ college_id: collegeId, module_key: key, ...patch });
}
export async function enableModule(actor, collegeId, key) {
    await ensureRegistry();
    const def = moduleDef(key);
    if (!def)
        throw new AppError(400, 'Unknown module', undefined, 'UNKNOWN_MODULE');
    const college = await db('colleges').where({ id: collegeId }).first();
    if (!college)
        throw new AppError(404, 'Tenant not found');
    if (await isModuleEnabled(collegeId, key)) {
        return { collegeId, key, enabled: true, unchanged: true };
    }
    // Enabling requires its dependencies to be enabled.
    const missing = [];
    for (const dep of def.requires) {
        if (!(await isModuleEnabled(collegeId, dep)))
            missing.push(dep);
    }
    if (missing.length) {
        throw new AppError(409, `Enable ${missing.map((k) => moduleDef(k)?.name ?? k).join(', ')} first — ${def.name} depends on it.`, { missing }, 'MODULE_DEPENDENCY');
    }
    return db.transaction(async (trx) => {
        await upsertModule(trx, actor, collegeId, key, true);
        await audit(actor, { action: 'module.enable', resourceType: 'module', resourceId: key, collegeId }, trx);
        return { collegeId, key, enabled: true, unchanged: false };
    });
}
export async function disableModule(actor, collegeId, key) {
    await ensureRegistry();
    const def = moduleDef(key);
    if (!def)
        throw new AppError(400, 'Unknown module', undefined, 'UNKNOWN_MODULE');
    if (def.core)
        throw new AppError(409, `${def.name} is a core module and cannot be disabled.`, undefined, 'CORE_MODULE');
    const college = await db('colleges').where({ id: collegeId }).first();
    if (!college)
        throw new AppError(404, 'Tenant not found');
    if (!(await isModuleEnabled(collegeId, key))) {
        return { collegeId, key, enabled: false, unchanged: true };
    }
    // Cannot disable a module that other *enabled* modules depend on.
    const blockers = [];
    for (const dep of dependentsOf(key)) {
        if (await isModuleEnabled(collegeId, dep.key))
            blockers.push(dep.key);
    }
    if (blockers.length) {
        throw new AppError(409, `Disable ${blockers.map((k) => moduleDef(k)?.name ?? k).join(', ')} first — they depend on ${def.name}.`, { blockers }, 'MODULE_DEPENDENCY');
    }
    return db.transaction(async (trx) => {
        // Data preservation: only the enablement flag flips; domain data is untouched.
        await upsertModule(trx, actor, collegeId, key, false);
        await audit(actor, { action: 'module.disable', resourceType: 'module', resourceId: key, collegeId }, trx);
        return { collegeId, key, enabled: false, unchanged: false };
    });
}
/* --------------------------- identity governance ------------------------- */
export async function listUsers(params) {
    let q = db('faculty_users as f')
        .leftJoin('colleges as c', 'c.id', 'f.college_id')
        .select('f.id', 'f.name', 'f.email', 'f.role', 'f.is_active', 'f.college_id', 'c.name as college_name', 'f.last_login_at', 'f.archived_at')
        .orderBy('f.name')
        .limit(Math.min(params.limit ?? 100, 500));
    if (params.q)
        q = q.where((b) => b.whereILike('f.name', `%${params.q}%`).orWhereILike('f.email', `%${params.q}%`));
    if (params.collegeId != null)
        q = q.where('f.college_id', params.collegeId);
    if (params.role)
        q = q.where('f.role', params.role);
    const rows = await q;
    // DTO: password_hash, reset_token and other auth internals are never selected.
    return rows.map((r) => ({
        id: Number(r.id),
        name: r.name,
        email: r.email,
        role: r.role,
        isActive: Boolean(r.is_active),
        collegeId: Number(r.college_id),
        collegeName: r.college_name,
        lastLoginAt: r.last_login_at,
        archived: r.archived_at != null,
    }));
}
async function countActiveSuperAdmins(trx) {
    const rows = await trx('faculty_users')
        .where({ role: 'SUPER_ADMIN', is_active: true })
        .whereNull('archived_at')
        .forUpdate()
        .select('id');
    return rows.length;
}
/**
 * Bootstrap safety: the platform can never end with zero usable Super Admins.
 * Serialized with FOR UPDATE so concurrent attempts cannot both succeed.
 */
async function assertNotLastSuperAdmin(trx, targetUser) {
    if (targetUser.role === 'SUPER_ADMIN' && targetUser.is_active) {
        const remaining = await countActiveSuperAdmins(trx);
        if (remaining <= 1) {
            throw new AppError(409, 'This is the only active Super Admin. Assign another before removing platform access.', undefined, 'LAST_SUPER_ADMIN');
        }
    }
}
export async function setUserActive(actor, userId, isActive) {
    return db.transaction(async (trx) => {
        const user = await trx('faculty_users').where({ id: userId }).forUpdate().first();
        if (!user)
            throw new AppError(404, 'User not found');
        if (!isActive)
            await assertNotLastSuperAdmin(trx, user);
        await trx('faculty_users').where({ id: userId }).update({ is_active: isActive });
        await audit(actor, { action: isActive ? 'user.activate' : 'user.deactivate', resourceType: 'user', resourceId: userId, collegeId: Number(user.college_id) }, trx);
        return { id: userId, isActive };
    });
}
export async function changeUserRole(actor, userId, nextRole) {
    return db.transaction(async (trx) => {
        const user = await trx('faculty_users').where({ id: userId }).forUpdate().first();
        if (!user)
            throw new AppError(404, 'User not found');
        // Only a Super Admin may grant the Super Admin role (escalation guard).
        if (nextRole === 'SUPER_ADMIN' && !isSuperAdmin(actor.role)) {
            throw new AppError(403, 'Only a Super Admin can grant the Super Admin role', undefined, 'ESCALATION_BLOCKED');
        }
        // Removing Super Admin from the last active one is blocked.
        if (user.role === 'SUPER_ADMIN' && nextRole !== 'SUPER_ADMIN') {
            await assertNotLastSuperAdmin(trx, user);
        }
        await trx('faculty_users').where({ id: userId }).update({ role: nextRole });
        await audit(actor, { action: 'user.role', resourceType: 'user', resourceId: userId, collegeId: Number(user.college_id), detail: { from: user.role, to: nextRole } }, trx);
        return { id: userId, role: nextRole };
    });
}
/* --------------------------- capability governance ----------------------- */
export async function listRoleCapabilities() {
    await ensureRegistry();
    const rows = await db('platform_role_capabilities').select('role', 'capability_key').orderBy(['role', 'capability_key']);
    const byRole = {};
    for (const r of rows) {
        (byRole[r.role] ??= []).push(r.capability_key);
    }
    // SUPER_ADMIN always holds every capability at the code level.
    byRole.SUPER_ADMIN = [...PLATFORM_CAPABILITY_KEYS];
    return byRole;
}
export async function grantRoleCapability(actor, role, capability) {
    await ensureRegistry();
    if (!PLATFORM_CAPABILITY_KEYS.includes(capability)) {
        throw new AppError(400, 'Unknown platform capability', undefined, 'UNKNOWN_CAPABILITY');
    }
    const existing = await db('platform_role_capabilities').where({ role, capability_key: capability }).first();
    if (existing)
        return { role, capability, unchanged: true };
    await db('platform_role_capabilities').insert({ role, capability_key: capability });
    await audit(actor, { action: 'rbac.grant', resourceType: 'capability', resourceId: capability, detail: { role } });
    return { role, capability, unchanged: false };
}
export async function revokeRoleCapability(actor, role, capability) {
    await ensureRegistry();
    if (role === 'SUPER_ADMIN') {
        // SUPER_ADMIN cannot be stripped of platform access (bootstrap safety).
        throw new AppError(409, 'Super Admin platform capabilities cannot be revoked', undefined, 'PROTECTED_ROLE');
    }
    const n = await db('platform_role_capabilities').where({ role, capability_key: capability }).del();
    await audit(actor, { action: 'rbac.revoke', resourceType: 'capability', resourceId: capability, success: n > 0, detail: { role } });
    return { role, capability, removed: n > 0 };
}
/* ------------------------------ integrations ----------------------------- */
const INTEGRATION_DEFS = [
    { key: 'smtp', name: 'Email (SMTP)' },
    { key: 'sms', name: 'SMS Gateway' },
    { key: 'storage', name: 'Object Storage' },
    { key: 'payment', name: 'Payment Gateway' },
];
export async function listIntegrations() {
    const rows = await db('platform_integrations');
    const byKey = new Map(rows.map((r) => [String(r.integration_key), r]));
    return INTEGRATION_DEFS.map((d) => {
        const row = byKey.get(d.key);
        // Secrets are NEVER serialized — only masked metadata leaves the service.
        return {
            key: d.key,
            name: d.name,
            configured: row ? Boolean(row.configured) : false,
            config: row?.config ? safeParse(row.config) : null,
            secretMask: row?.secret_last4 ? `••••${row.secret_last4}` : null,
            secretRotatedAt: row?.secret_rotated_at ?? null,
        };
    });
}
export async function updateIntegration(actor, key, input) {
    const def = INTEGRATION_DEFS.find((d) => d.key === key);
    if (!def)
        throw new AppError(400, 'Unknown integration', undefined, 'UNKNOWN_INTEGRATION');
    const existing = await db('platform_integrations').where({ integration_key: key }).first();
    const patch = {
        integration_key: key,
        name: def.name,
        config: input.config != null ? JSON.stringify(input.config) : existing?.config ?? null,
        updated_at: db.fn.now(),
    };
    if (input.secret) {
        // Store ONLY the last 4 chars for recognizability. The raw secret is never
        // persisted in the governance table and never returned to any caller.
        patch.secret_last4 = input.secret.slice(-4);
        patch.secret_rotated_at = db.fn.now();
        patch.configured = true;
    }
    else if (!existing) {
        patch.configured = Boolean(input.config);
    }
    if (existing)
        await db('platform_integrations').where({ integration_key: key }).update(patch);
    else
        await db('platform_integrations').insert(patch);
    await audit(actor, { action: 'integration.update', resourceType: 'integration', resourceId: key, detail: { secretRotated: Boolean(input.secret) } });
    return (await listIntegrations()).find((i) => i.key === key);
}
function safeParse(raw) {
    if (typeof raw !== 'string')
        return raw;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
async function tcpProbe(host, port, timeoutMs = 1500) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let done = false;
        const finish = (ok) => {
            if (done)
                return;
            done = true;
            socket.destroy();
            resolve(ok);
        };
        socket.setTimeout(timeoutMs);
        socket.once('connect', () => finish(true));
        socket.once('timeout', () => finish(false));
        socket.once('error', () => finish(false));
        socket.connect(port, host);
    });
}
export async function health() {
    const now = () => new Date().toISOString();
    const checks = await Promise.allSettled([
        // Database — a real dependency.
        (async () => {
            const t = Date.now();
            try {
                await db.raw('select 1');
                return { service: 'database', status: 'HEALTHY', checkedAt: now(), latencyMs: Date.now() - t, message: 'Connected' };
            }
            catch {
                return { service: 'database', status: 'UNAVAILABLE', checkedAt: now(), latencyMs: null, message: 'Connection failed' };
            }
        })(),
        // API self.
        (async () => ({ service: 'api', status: 'HEALTHY', checkedAt: now(), latencyMs: 0, message: 'Serving' }))(),
        // Mail (SMTP) — checked only if configured; never leaks credentials.
        (async () => {
            if (!env.SMTP_HOST) {
                return { service: 'mail', status: 'UNKNOWN', checkedAt: now(), latencyMs: null, message: 'Not configured' };
            }
            const t = Date.now();
            const ok = await tcpProbe(env.SMTP_HOST, env.SMTP_PORT);
            return {
                service: 'mail',
                status: ok ? 'HEALTHY' : 'DEGRADED',
                checkedAt: now(),
                latencyMs: ok ? Date.now() - t : null,
                message: ok ? 'Reachable' : 'SMTP host unreachable',
            };
        })(),
    ]);
    const resolved = checks.map((c, i) => c.status === 'fulfilled'
        ? c.value
        : { service: ['database', 'api', 'mail'][i] ?? 'unknown', status: 'UNKNOWN', checkedAt: now(), latencyMs: null, message: 'Check failed' });
    const overall = resolved.some((c) => c.status === 'UNAVAILABLE')
        ? 'DEGRADED'
        : resolved.every((c) => c.status === 'HEALTHY')
            ? 'HEALTHY'
            : 'DEGRADED';
    return { overall, checks: resolved };
}
/* ------------------------------- dashboard ------------------------------- */
export async function dashboard() {
    await ensureRegistry();
    const [tenantRows] = await Promise.all([db('colleges').select('status')]);
    const byStatus = {};
    for (const r of tenantRows)
        byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    const [{ n: activeUsers }] = await db('faculty_users').where({ is_active: true }).whereNull('archived_at').count('* as n');
    const [{ n: activeStudents }] = await db('students').where({ is_active: true }).count('* as n');
    const [{ n: enabledModules }] = await db('college_modules').where({ enabled: true }).count('* as n');
    const h = await health();
    const issues = await countTenantsWithIssues();
    const recentChanges = await listAudit({ limit: 12 });
    return {
        tenants: {
            total: tenantRows.length,
            active: byStatus.ACTIVE ?? 0,
            onboarding: byStatus.ONBOARDING ?? 0,
            suspended: byStatus.SUSPENDED ?? 0,
            archived: byStatus.ARCHIVED ?? 0,
            draft: byStatus.DRAFT ?? 0,
        },
        activeUsers: Number(activeUsers),
        activeStudents: Number(activeStudents),
        modulesEnabled: Number(enabledModules),
        health: h.overall,
        tenantsWithConfigIssues: issues,
        recentChanges,
    };
}
export async function validateTenantConfig(collegeId) {
    await ensureRegistry();
    const college = await db('colleges').where({ id: collegeId }).first();
    if (!college)
        throw new AppError(404, 'Tenant not found');
    const issues = [];
    const [{ n: admins }] = await db('faculty_users')
        .where({ college_id: collegeId, role: 'COLLEGE_ADMIN', is_active: true })
        .whereNull('archived_at')
        .count('* as n');
    if (Number(admins) === 0) {
        issues.push({ severity: 'ERROR', code: 'NO_ACTIVE_ADMIN', message: 'No active College Admin.', remediation: 'Provision or activate a College Admin for this tenant.' });
    }
    const [{ n: years }] = await db('academic_years').where({ college_id: collegeId }).count('* as n');
    if (Number(years) === 0) {
        issues.push({ severity: 'ERROR', code: 'NO_ACADEMIC_YEAR', message: 'No academic year defined.', remediation: 'Create an academic year in Academic setup.' });
    }
    const [{ n: depts }] = await db('departments').where({ college_id: collegeId }).count('* as n');
    if (Number(depts) === 0) {
        issues.push({ severity: 'WARNING', code: 'NO_DEPARTMENTS', message: 'No departments defined.', remediation: 'Add departments in Academic setup.' });
    }
    // Module dependency integrity.
    for (const m of PLATFORM_MODULES) {
        if (!(await isModuleEnabled(collegeId, m.key)))
            continue;
        for (const dep of m.requires) {
            if (!(await isModuleEnabled(collegeId, dep))) {
                issues.push({
                    severity: 'ERROR',
                    code: 'MODULE_DEP_MISSING',
                    message: `${m.name} is enabled but its dependency ${moduleDef(dep)?.name ?? dep} is disabled.`,
                    remediation: `Enable ${moduleDef(dep)?.name ?? dep} or disable ${m.name}.`,
                });
            }
        }
    }
    // Management portal expects a management-tier user.
    if (await isModuleEnabled(collegeId, 'management')) {
        const [{ n: mgmt }] = await db('faculty_users')
            .where({ college_id: collegeId, is_active: true })
            .whereIn('role', ['MANAGEMENT', 'PRINCIPAL', 'CHAIRMAN'])
            .count('* as n');
        if (Number(mgmt) === 0) {
            issues.push({ severity: 'WARNING', code: 'NO_MANAGEMENT_USER', message: 'Management Portal is enabled but no Management/Principal user exists.', remediation: 'Assign a Management, Principal or Chairman user.' });
        }
    }
    if (college.status === 'ONBOARDING') {
        issues.push({ severity: 'INFO', code: 'ONBOARDING_INCOMPLETE', message: 'Tenant is still onboarding.', remediation: 'Complete onboarding and activate the tenant.' });
    }
    return issues;
}
async function countTenantsWithIssues() {
    const colleges = await db('colleges').select('id');
    let count = 0;
    for (const c of colleges) {
        const issues = await validateTenantConfig(Number(c.id));
        if (issues.some((i) => i.severity === 'ERROR'))
            count += 1;
    }
    return count;
}
/* -------------------------------- audit read ----------------------------- */
export async function listAudit(params) {
    let q = db('platform_audit_log as a')
        .leftJoin('faculty_users as f', 'f.id', 'a.actor_faculty_user_id')
        .select('a.*', 'f.name as actor_name', 'f.email as actor_email')
        .orderBy('a.created_at', 'desc')
        .limit(Math.min(params.limit ?? 100, 500));
    if (params.actorId != null)
        q = q.where('a.actor_faculty_user_id', params.actorId);
    if (params.collegeId != null)
        q = q.where('a.college_id', params.collegeId);
    if (params.action)
        q = q.where('a.action', params.action);
    if (params.resourceType)
        q = q.where('a.resource_type', params.resourceType);
    if (params.success != null)
        q = q.where('a.success', params.success);
    const rows = await q;
    return rows.map((r) => ({
        id: Number(r.id),
        actorId: r.actor_faculty_user_id != null ? Number(r.actor_faculty_user_id) : null,
        actorName: r.actor_name ?? null,
        actorRole: r.actor_role,
        action: r.action,
        resourceType: r.resource_type,
        resourceId: r.resource_id,
        collegeId: r.college_id != null ? Number(r.college_id) : null,
        success: Boolean(r.success),
        detail: safeParse(r.detail),
        createdAt: r.created_at,
    }));
}
/* ------------------------------ diagnostics ------------------------------ */
export async function tenantDiagnostics(collegeId) {
    const tenant = await getTenant(collegeId);
    const [issues, recentAudit] = await Promise.all([
        validateTenantConfig(collegeId),
        listAudit({ collegeId, limit: 20 }),
    ]);
    return {
        tenant,
        modules: tenant.modules,
        hasActiveAdmin: tenant.admins.some((a) => a.isActive),
        configIssues: issues,
        recentAudit,
    };
}
