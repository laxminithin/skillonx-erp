import { type PlatformActor } from './service.js';
export declare const FEATURE_FLAGS: readonly [{
    readonly key: "platform.onboardingWizard";
    readonly description: "Guided tenant onboarding wizard";
}, {
    readonly key: "platform.betaDashboards";
    readonly description: "Beta analytics dashboards for tenants";
}, {
    readonly key: "platform.maintenanceBanner";
    readonly description: "Global maintenance banner";
}];
export declare const MASTER_TEMPLATES: readonly [{
    readonly domain: "academic";
    readonly key: "academic.assessment-scheme";
    readonly name: "Standard Assessment Scheme";
    readonly payload: {
        readonly cieWeight: 50;
        readonly seeWeight: 50;
        readonly passPercent: 40;
        readonly components: readonly ["CIE-1", "CIE-2", "Assignment"];
    };
}, {
    readonly domain: "hr";
    readonly key: "hr.leave-types";
    readonly name: "Standard Leave Types";
    readonly payload: {
        readonly types: readonly [{
            readonly code: "CL";
            readonly name: "Casual Leave";
            readonly annual: 12;
        }, {
            readonly code: "EL";
            readonly name: "Earned Leave";
            readonly annual: 15;
        }];
    };
}, {
    readonly domain: "finance";
    readonly key: "finance.fee-heads";
    readonly name: "Standard Fee Heads";
    readonly payload: {
        readonly heads: readonly [{
            readonly code: "TUITION";
            readonly name: "Tuition Fee";
        }, {
            readonly code: "LIB";
            readonly name: "Library Fee";
        }];
    };
}];
/** Idempotently seed the code-defined surface reference data. */
export declare function ensureSurfaces(force?: boolean): Promise<void>;
export declare function listFeatureFlags(): Promise<{
    key: unknown;
    description: unknown;
    enabled: boolean;
    rollout: unknown;
    overrides: {
        collegeId: number;
        enabled: boolean;
    }[];
}[]>;
export declare function setFeatureFlag(actor: PlatformActor, key: string, enabled: boolean, rollout?: string): Promise<{
    key: string;
    enabled: boolean;
}>;
export declare function setTenantFeatureFlag(actor: PlatformActor, collegeId: number, key: string, enabled: boolean): Promise<{
    collegeId: number;
    key: string;
    enabled: boolean;
}>;
/** Effective flag value for a tenant (override wins over global). */
export declare function isFlagEnabled(collegeId: number, key: string): Promise<boolean>;
export declare function listMasterTemplates(): Promise<{
    id: number;
    domain: unknown;
    key: unknown;
    name: unknown;
    version: number;
    status: unknown;
    payload: unknown;
    updatedAt: unknown;
}[]>;
/**
 * Publish a new version of a master template (immutable versioning). Existing
 * versions are never mutated, so tenant adoption snapshots stay stable.
 */
export declare function versionMasterTemplate(actor: PlatformActor, key: string, payload: unknown, name?: string): Promise<{
    key: string;
    version: number;
}>;
/**
 * Adopt a template into a tenant. Copy-on-adopt: an immutable snapshot of the
 * template payload at this version is stored on the tenant. Later template
 * edits/versions never rewrite this snapshot.
 */
export declare function adoptMaster(actor: PlatformActor, collegeId: number, key: string): Promise<{
    collegeId: number;
    key: string;
    version: number;
    snapshot: unknown;
    unchanged: boolean;
}>;
export declare function listTenantAdoptions(collegeId: number): Promise<{
    key: unknown;
    version: number;
    snapshot: unknown;
    adoptedAt: unknown;
}[]>;
export declare function listAnnouncements(): Promise<{
    id: number;
    title: unknown;
    message: unknown;
    audience: unknown;
    severity: unknown;
    status: unknown;
    publishAt: unknown;
    expiryAt: unknown;
    targets: number[];
    createdAt: unknown;
}[]>;
export interface CreateAnnouncementInput {
    title: string;
    message: string;
    audience: 'ALL' | 'SELECTED';
    severity?: 'INFO' | 'WARNING' | 'CRITICAL';
    publishAt?: string | null;
    expiryAt?: string | null;
    collegeIds?: number[];
}
export declare function createAnnouncement(actor: PlatformActor, input: CreateAnnouncementInput): Promise<{
    id: number;
}>;
export declare function publishAnnouncement(actor: PlatformActor, id: number): Promise<{
    id: number;
    status: string;
}>;
export declare function expireAnnouncement(actor: PlatformActor, id: number): Promise<{
    id: number;
    status: string;
}>;
/** Flip PUBLISHED rows past expiry_at to EXPIRED (idempotent housekeeping). */
export declare function expireDueAnnouncements(): Promise<void>;
/** Announcements visible to a given tenant (respects targeting/isolation + expiry). */
export declare function announcementsForTenant(collegeId: number): Promise<{
    id: number;
    title: unknown;
    message: unknown;
    severity: unknown;
    publishAt: unknown;
    expiryAt: unknown;
}[]>;
export declare function getSettings(collegeId: number): Promise<{
    timezone: any;
    locale: any;
    dateFormat: any;
    employeeIdPrefix: any;
    receiptPrefix: any;
    notifyEmailEnabled: boolean;
    notifySmsEnabled: boolean;
}>;
export interface SettingsInput {
    timezone?: string;
    locale?: string;
    dateFormat?: string;
    employeeIdPrefix?: string | null;
    receiptPrefix?: string | null;
    notifyEmailEnabled?: boolean;
    notifySmsEnabled?: boolean;
}
export declare function updateSettings(actor: PlatformActor, collegeId: number, input: SettingsInput): Promise<{
    timezone: any;
    locale: any;
    dateFormat: any;
    employeeIdPrefix: any;
    receiptPrefix: any;
    notifyEmailEnabled: boolean;
    notifySmsEnabled: boolean;
}>;
export declare function getBranding(collegeId: number): Promise<{
    displayName: any;
    shortName: any;
    logoUrl: any;
    reportHeader: any;
    portalTitle: any;
    accentColor: any;
}>;
export interface BrandingInput {
    displayName?: string | null;
    shortName?: string | null;
    logoUrl?: string | null;
    reportHeader?: string | null;
    portalTitle?: string | null;
    accentColor?: string | null;
}
export declare function updateBranding(actor: PlatformActor, collegeId: number, input: BrandingInput): Promise<{
    displayName: any;
    shortName: any;
    logoUrl: any;
    reportHeader: any;
    portalTitle: any;
    accentColor: any;
}>;
