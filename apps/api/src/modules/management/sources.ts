/**
 * Management & Executive Portal — canonical source bridge.
 *
 * Every executive metric is derived from a CANONICAL domain read service. This
 * module is the single seam through which the portal reaches those services,
 * so the "consume, never duplicate" invariant is auditable in one place.
 *
 * `domainActor` normalizes the executive actor into the shared domain-actor
 * shape. `safe` wraps a canonical read so a college with no data for a domain
 * (missing table / empty tenant) yields a clean empty state rather than a 500 —
 * distinguishing "no data" from a real 0.
 */
import { db } from '../../db/index.js';
import type { ManagementActor } from './types.js';

export type DomainActor = {
  facultyUserId: number;
  collegeId: number;
  departmentId: number | null;
  role: string;
  name?: string;
  employeeId?: number | null;
  leadershipRoles?: string[];
  hodDepartmentIds?: number[];
};

/**
 * The role a canonical domain read should see. Leadership is often granted by a
 * separate `academic_leadership_assignments` row while the base `faculty_users`
 * role stays FACULTY — e.g. a Principal-by-assignment. Several canonical domains
 * authorize on `actor.role` alone (they have no leadership-role awareness), so we
 * present the executive's most-privileged *effective* role. This forges no
 * privilege: the actor genuinely holds that role, and the portal only ever calls
 * read functions.
 */
const EFFECTIVE_ROLE_PRIORITY = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'MANAGEMENT', 'CHAIRMAN', 'PRINCIPAL'];

export function effectiveRole(actor: ManagementActor): string {
  const roles = [actor.role, ...(actor.leadershipRoles ?? [])];
  for (const r of EFFECTIVE_ROLE_PRIORITY) if (roles.includes(r)) return r;
  return actor.role;
}

export function domainActor(actor: ManagementActor): DomainActor {
  return {
    facultyUserId: actor.facultyUserId,
    collegeId: actor.collegeId,
    departmentId: actor.departmentId ?? null,
    role: effectiveRole(actor),
    name: actor.name,
    employeeId: actor.employeeId ?? null,
    leadershipRoles: actor.leadershipRoles,
    hodDepartmentIds: actor.hodDepartmentIds,
  };
}

export type SourceResult<T> =
  | { available: true; data: T }
  | { available: false; reason: string };

/**
 * Run a canonical read, returning an unavailable marker instead of throwing
 * when the domain schema is not provisioned for this tenant. A genuine
 * authorization error (403) is re-thrown — the portal must not silently
 * swallow a permission failure into an empty state.
 */
export async function safe<T>(fn: () => Promise<T>): Promise<SourceResult<T>> {
  try {
    return { available: true, data: await fn() };
  } catch (err) {
    const e = err as { statusCode?: number; message?: string; code?: string };
    if (e?.statusCode === 403) throw err;
    // Missing table / not provisioned → treated as "domain not available here".
    if (
      e?.code === 'ER_NO_SUCH_TABLE' ||
      /no such table|doesn't exist|Unknown column|not provisioned/i.test(e?.message ?? '')
    ) {
      return { available: false, reason: 'DOMAIN_NOT_AVAILABLE' };
    }
    throw err;
  }
}

export async function tableExists(name: string): Promise<boolean> {
  try {
    return await db.schema.hasTable(name);
  } catch {
    return false;
  }
}

/** Percentage helper that never emits NaN/Infinity and marks true no-data. */
export function pct(numerator: number, denominator: number): number | null {
  if (!denominator || denominator <= 0) return null;
  const v = (numerator / denominator) * 100;
  if (!Number.isFinite(v)) return null;
  return Math.round(v * 100) / 100;
}

export function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
