import type { Knex } from 'knex';
import { db } from '../../db/index.js';

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

export const PLATFORM_MODULES: ModuleDef[] = [
  { key: 'academics', name: 'Academics / LMS', category: 'Academic', description: 'Courses, classes, lesson plans, assessments and outcomes.', requires: [], core: true },
  { key: 'examination', name: 'Examination', category: 'Academic', description: 'Internal and semester-end examination management.', requires: ['academics'], core: false },
  { key: 'finance', name: 'Finance', category: 'Operations', description: 'Fee heads, receipts, refunds and financial ledgers.', requires: [], core: false },
  { key: 'library', name: 'Library', category: 'Campus', description: 'Catalogue and circulation management.', requires: [], core: false },
  { key: 'hostel', name: 'Hostel', category: 'Campus', description: 'Room allocation, gate and residency operations.', requires: [], core: false },
  { key: 'transport', name: 'Transport', category: 'Campus', description: 'Routes, passes and trip operations.', requires: [], core: false },
  { key: 'placement', name: 'Training & Placement', category: 'Career', description: 'Drives, offers and placement tracking.', requires: [], core: false },
  { key: 'hrms', name: 'HRMS', category: 'Human Resources', description: 'Employee lifecycle, attendance and leave engine.', requires: [], core: false },
  { key: 'payroll', name: 'Payroll', category: 'Human Resources', description: 'Salary processing and final settlement.', requires: ['hrms'], core: false },
  { key: 'recruitment', name: 'Recruitment', category: 'Human Resources', description: 'Job openings, interviews and offers.', requires: ['hrms'], core: false },
  { key: 'performance', name: 'Performance & Appraisal', category: 'Human Resources', description: 'Appraisal cycles and performance reviews.', requires: ['hrms'], core: false },
  { key: 'ld', name: 'Learning & Development', category: 'Human Resources', description: 'Employee training and development programmes.', requires: ['hrms'], core: false },
  { key: 'succession', name: 'Succession Planning', category: 'Human Resources', description: 'Critical roles and succession pipelines.', requires: ['hrms'], core: false },
  { key: 'management', name: 'Management Portal', category: 'Governance', description: 'Executive command-centre reads and approvals.', requires: [], core: false },
];

export const MODULE_KEYS = PLATFORM_MODULES.map((m) => m.key);

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

export const PLATFORM_CAPABILITIES: CapabilityDef[] = [
  { key: 'platform.dashboard.view', description: 'View the platform dashboard', domain: 'overview' },
  { key: 'platform.tenants.view', description: 'View tenants / colleges', domain: 'tenants' },
  { key: 'platform.tenants.manage', description: 'Create and govern tenant lifecycle', domain: 'tenants' },
  { key: 'platform.identity.view', description: 'View platform identities', domain: 'identity' },
  { key: 'platform.identity.manage', description: 'Govern platform identities', domain: 'identity' },
  { key: 'platform.rbac.view', description: 'View roles and capabilities', domain: 'rbac' },
  { key: 'platform.rbac.manage', description: 'Govern roles and capability mappings', domain: 'rbac' },
  { key: 'platform.modules.view', description: 'View tenant module access', domain: 'modules' },
  { key: 'platform.modules.manage', description: 'Govern tenant module enablement', domain: 'modules' },
  { key: 'platform.masters.view', description: 'View master-data templates', domain: 'masters' },
  { key: 'platform.masters.manage', description: 'Govern master-data templates and adoption', domain: 'masters' },
  { key: 'platform.announcements.manage', description: 'Govern platform announcements', domain: 'announcements' },
  { key: 'platform.config.view', description: 'View platform / tenant configuration', domain: 'config' },
  { key: 'platform.config.manage', description: 'Govern platform / tenant configuration', domain: 'config' },
  { key: 'platform.integrations.view', description: 'View integration configuration', domain: 'integrations' },
  { key: 'platform.integrations.manage', description: 'Govern integration configuration', domain: 'integrations' },
  { key: 'platform.health.view', description: 'View platform health', domain: 'health' },
  { key: 'platform.audit.view', description: 'View the platform audit trail', domain: 'audit' },
];

export const PLATFORM_CAPABILITY_KEYS = PLATFORM_CAPABILITIES.map((c) => c.key);

/**
 * Default role -> capability grants. SUPER_ADMIN is always granted every
 * platform capability at the code level (see roleHasPlatformCapability) as a
 * bootstrap-safety guarantee; this map is the seed for the governance table so
 * that additional platform-delegated roles can be introduced later.
 */
export const DEFAULT_ROLE_CAPABILITIES: Record<string, string[]> = {
  SUPER_ADMIN: [...PLATFORM_CAPABILITY_KEYS],
};

let ensured = false;

/** Idempotently sync the code-defined registry into the governance tables. */
export async function ensureRegistry(force = false): Promise<void> {
  if (ensured && !force) return;
  await db.transaction(async (trx: Knex.Transaction) => {
    for (const m of PLATFORM_MODULES) {
      const row = {
        module_key: m.key,
        name: m.name,
        category: m.category,
        description: m.description,
        requires: JSON.stringify(m.requires),
        is_core: m.core,
        sort_order: PLATFORM_MODULES.indexOf(m),
      };
      const existing = await trx('platform_modules').where({ module_key: m.key }).first();
      if (existing) await trx('platform_modules').where({ module_key: m.key }).update(row);
      else await trx('platform_modules').insert(row);
    }
    for (const c of PLATFORM_CAPABILITIES) {
      const existing = await trx('platform_capabilities').where({ capability_key: c.key }).first();
      const row = { capability_key: c.key, description: c.description, domain: c.domain };
      if (existing) await trx('platform_capabilities').where({ capability_key: c.key }).update(row);
      else await trx('platform_capabilities').insert(row);
    }
    for (const [role, caps] of Object.entries(DEFAULT_ROLE_CAPABILITIES)) {
      for (const cap of caps) {
        const existing = await trx('platform_role_capabilities').where({ role, capability_key: cap }).first();
        if (!existing) await trx('platform_role_capabilities').insert({ role, capability_key: cap });
      }
    }
  });
  ensured = true;
}

export function moduleDef(key: string): ModuleDef | undefined {
  return PLATFORM_MODULES.find((m) => m.key === key);
}

/** Modules that depend (directly) on the given module key. */
export function dependentsOf(key: string): ModuleDef[] {
  return PLATFORM_MODULES.filter((m) => m.requires.includes(key));
}
