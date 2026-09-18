/**
 * Canonical platform module registry. Dependencies (`requires`) reflect real
 * architectural relationships only (e.g. Payroll/Recruitment/Performance/L&D/
 * Succession are built on the HRMS engine). Core modules cannot be disabled.
 */
export interface ModuleDef {
    key: string;
    name: string;
    category: string;
    description: string;
    requires: string[];
    core: boolean;
}
export declare const PLATFORM_MODULES: ModuleDef[];
export declare const MODULE_KEYS: string[];
/**
 * Platform capability registry. These are governance-only capabilities layered
 * onto the existing role-string RBAC engine — they never bypass domain
 * authorization.
 */
export interface CapabilityDef {
    key: string;
    description: string;
    domain: string;
}
export declare const PLATFORM_CAPABILITIES: CapabilityDef[];
export declare const PLATFORM_CAPABILITY_KEYS: string[];
/**
 * Default role -> capability grants. SUPER_ADMIN is always granted every
 * platform capability at the code level (see roleHasPlatformCapability) as a
 * bootstrap-safety guarantee; this map is the seed for the governance table so
 * that additional platform-delegated roles can be introduced later.
 */
export declare const DEFAULT_ROLE_CAPABILITIES: Record<string, string[]>;
/** Idempotently sync the code-defined registry into the governance tables. */
export declare function ensureRegistry(force?: boolean): Promise<void>;
export declare function moduleDef(key: string): ModuleDef | undefined;
/** Modules that depend (directly) on the given module key. */
export declare function dependentsOf(key: string): ModuleDef[];
