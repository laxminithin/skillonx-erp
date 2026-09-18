import type { Knex } from 'knex';
export interface PlatformActor {
    facultyUserId: number;
    role: string;
    collegeId: number | null;
    name?: string;
}
export declare const TENANT_STATUSES: readonly ["DRAFT", "ONBOARDING", "ACTIVE", "SUSPENDED", "ARCHIVED"];
export type TenantStatus = (typeof TENANT_STATUSES)[number];
export declare function audit(actor: PlatformActor | null, entry: {
    action: string;
    resourceType: string;
    resourceId?: string | number | null;
    collegeId?: number | null;
    success?: boolean;
    detail?: unknown;
}, trx?: Knex.Transaction): Promise<void>;
export interface TenantSummary {
    id: number;
    name: string;
    code: string;
    status: string;
    is_active: boolean;
    timezone: string;
    departmentCount: number;
    facultyCount: number;
    studentCount: number;
    modulesEnabled: number;
    hasActiveAdmin: boolean;
}
export declare function listTenants(): Promise<TenantSummary[]>;
export declare function getTenant(id: number): Promise<{
    id: number;
    name: any;
    code: any;
    status: any;
    isActive: boolean;
    timezone: any;
    domain: any;
    address: any;
    logoUrl: any;
    suspendedAt: any;
    archivedAt: any;
    modules: {
        key: string;
        name: string;
        category: string;
        description: string;
        requires: string[];
        core: boolean;
        enabled: boolean;
    }[];
    admins: {
        id: number;
        name: unknown;
        email: unknown;
        isActive: boolean;
    }[];
}>;
export interface CreateTenantInput {
    name: string;
    code: string;
    timezone?: string;
    domain?: string | null;
    address?: string | null;
    adminName: string;
    adminEmail: string;
}
/**
 * Transactionally create a tenant and provision its minimum defaults: default
 * module configuration and a primary COLLEGE_ADMIN. On any failure the whole
 * creation rolls back — no half-created hidden tenants.
 */
export declare function createTenant(actor: PlatformActor, input: CreateTenantInput): Promise<{
    tenant: {
        id: number;
        name: any;
        code: any;
        status: any;
        isActive: boolean;
        timezone: any;
        domain: any;
        address: any;
        logoUrl: any;
        suspendedAt: any;
        archivedAt: any;
        modules: {
            key: string;
            name: string;
            category: string;
            description: string;
            requires: string[];
            core: boolean;
            enabled: boolean;
        }[];
        admins: {
            id: number;
            name: unknown;
            email: unknown;
            isActive: boolean;
        }[];
    };
    admin: {
        id: number;
        email: string;
        temporaryPassword: string;
        setupToken: string;
    };
}>;
export declare function setTenantStatus(actor: PlatformActor, id: number, next: TenantStatus): Promise<{
    id: number;
    status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "SUSPENDED" | "ONBOARDING";
    unchanged: boolean;
}>;
export declare function getTenantModules(collegeId: number): Promise<{
    key: string;
    name: string;
    category: string;
    description: string;
    requires: string[];
    core: boolean;
    enabled: boolean;
}[]>;
export declare function isModuleEnabled(collegeId: number, key: string): Promise<boolean>;
export declare function enableModule(actor: PlatformActor, collegeId: number, key: string): Promise<{
    collegeId: number;
    key: string;
    enabled: boolean;
    unchanged: boolean;
}>;
export declare function disableModule(actor: PlatformActor, collegeId: number, key: string): Promise<{
    collegeId: number;
    key: string;
    enabled: boolean;
    unchanged: boolean;
}>;
export declare function listUsers(params: {
    q?: string;
    collegeId?: number | null;
    role?: string;
    limit?: number;
}): Promise<{
    id: number;
    name: unknown;
    email: unknown;
    role: unknown;
    isActive: boolean;
    collegeId: number;
    collegeName: unknown;
    lastLoginAt: unknown;
    archived: boolean;
}[]>;
export declare function setUserActive(actor: PlatformActor, userId: number, isActive: boolean): Promise<{
    id: number;
    isActive: boolean;
}>;
export declare function changeUserRole(actor: PlatformActor, userId: number, nextRole: string): Promise<{
    id: number;
    role: string;
}>;
export declare function listRoleCapabilities(): Promise<Record<string, string[]>>;
export declare function grantRoleCapability(actor: PlatformActor, role: string, capability: string): Promise<{
    role: string;
    capability: string;
    unchanged: boolean;
}>;
export declare function revokeRoleCapability(actor: PlatformActor, role: string, capability: string): Promise<{
    role: string;
    capability: string;
    removed: boolean;
}>;
export declare function listIntegrations(): Promise<{
    key: string;
    name: string;
    configured: boolean;
    config: unknown;
    secretMask: string | null;
    secretRotatedAt: {} | null;
}[]>;
export declare function updateIntegration(actor: PlatformActor, key: string, input: {
    config?: Record<string, unknown> | null;
    secret?: string | null;
}): Promise<{
    key: string;
    name: string;
    configured: boolean;
    config: unknown;
    secretMask: string | null;
    secretRotatedAt: {} | null;
}>;
export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN';
export interface HealthCheck {
    service: string;
    status: HealthStatus;
    checkedAt: string;
    latencyMs: number | null;
    message: string;
}
export declare function health(): Promise<{
    overall: HealthStatus;
    checks: HealthCheck[];
}>;
export declare function dashboard(): Promise<{
    tenants: {
        total: number;
        active: number;
        onboarding: number;
        suspended: number;
        archived: number;
        draft: number;
    };
    activeUsers: number;
    activeStudents: number;
    modulesEnabled: number;
    health: HealthStatus;
    tenantsWithConfigIssues: number;
    recentChanges: {
        id: number;
        actorId: number | null;
        actorName: {} | null;
        actorRole: unknown;
        action: unknown;
        resourceType: unknown;
        resourceId: unknown;
        collegeId: number | null;
        success: boolean;
        detail: unknown;
        createdAt: unknown;
    }[];
}>;
export interface ConfigIssue {
    severity: 'ERROR' | 'WARNING' | 'INFO';
    code: string;
    message: string;
    remediation: string;
}
export declare function validateTenantConfig(collegeId: number): Promise<ConfigIssue[]>;
export declare function listAudit(params: {
    actorId?: number;
    collegeId?: number;
    action?: string;
    resourceType?: string;
    success?: boolean;
    limit?: number;
}): Promise<{
    id: number;
    actorId: number | null;
    actorName: {} | null;
    actorRole: unknown;
    action: unknown;
    resourceType: unknown;
    resourceId: unknown;
    collegeId: number | null;
    success: boolean;
    detail: unknown;
    createdAt: unknown;
}[]>;
export declare function tenantDiagnostics(collegeId: number): Promise<{
    tenant: {
        id: number;
        name: any;
        code: any;
        status: any;
        isActive: boolean;
        timezone: any;
        domain: any;
        address: any;
        logoUrl: any;
        suspendedAt: any;
        archivedAt: any;
        modules: {
            key: string;
            name: string;
            category: string;
            description: string;
            requires: string[];
            core: boolean;
            enabled: boolean;
        }[];
        admins: {
            id: number;
            name: unknown;
            email: unknown;
            isActive: boolean;
        }[];
    };
    modules: {
        key: string;
        name: string;
        category: string;
        description: string;
        requires: string[];
        core: boolean;
        enabled: boolean;
    }[];
    hasActiveAdmin: boolean;
    configIssues: ConfigIssue[];
    recentAudit: {
        id: number;
        actorId: number | null;
        actorName: {} | null;
        actorRole: unknown;
        action: unknown;
        resourceType: unknown;
        resourceId: unknown;
        collegeId: number | null;
        success: boolean;
        detail: unknown;
        createdAt: unknown;
    }[];
}>;
