/**
 * Succession Planning — coverage metrics, talent risk, dashboard, reports,
 * exports, and the confidentiality-preserving employee self-surface.
 *
 * All coverage/risk formulas live here (single source; never duplicated in the UI).
 */
import { db } from '../../../db/index.js';
import ExcelJS from 'exceljs';
import { buildExportFilename } from '../../../utils/filename.js';
import { AppError } from '../../../utils/errors.js';
import type { HrActor } from '../types.js';
import { assertHrPermission, successionScope, requireSelfEmployee, selfEmployee } from './access.js';

const ACTIVE_CAND = ['NOMINATED', 'UNDER_REVIEW', 'APPROVED'];
const STALE_DAYS = 180;

function scopedRoles(actor: HrActor, scope: number[] | null) {
  let q = db('succession_critical_roles as r').where('r.college_id', actor.collegeId).where('r.is_active', true);
  if (scope) q = q.whereIn('r.department_id', scope);
  return q;
}

// ── Coverage ─────────────────────────────────────────────────────────────────
export async function coverageMetrics(actor: HrActor) {
  assertHrPermission(actor, 'hr.succession.view');
  const scope = successionScope(actor);

  const roles = await scopedRoles(actor, scope).select('r.id', 'r.criticality');
  const roleIds = roles.map((r) => Number(r.id));
  const total = roleIds.length;
  if (total === 0) {
    return { totalCriticalRoles: 0, rolesWithSuccessor: 0, rolesWithoutSuccessor: 0, rolesWithReadyNow: 0, coveragePct: 0, readyNowCoveragePct: 0, avgSuccessorsPerRole: 0, criticalVacancyExposure: 0 };
  }
  const cands = await db('succession_candidates').where('college_id', actor.collegeId).whereIn('critical_role_id', roleIds).whereIn('status', ACTIVE_CAND)
    .select('critical_role_id', 'readiness');
  const byRole = new Map<number, { count: number; readyNow: boolean }>();
  for (const c of cands) {
    const rid = Number(c.critical_role_id);
    const e = byRole.get(rid) ?? { count: 0, readyNow: false };
    e.count += 1;
    if (c.readiness === 'READY_NOW') e.readyNow = true;
    byRole.set(rid, e);
  }
  const rolesWithSuccessor = [...byRole.values()].length;
  const rolesWithReadyNow = [...byRole.values()].filter((v) => v.readyNow).length;
  const totalCandidates = [...byRole.values()].reduce((s, v) => s + v.count, 0);
  // Critical vacancy exposure: CRITICAL/HIGH roles with no active successor.
  const criticalVacancyExposure = roles.filter((r) => ['CRITICAL', 'HIGH'].includes(String(r.criticality)) && !byRole.has(Number(r.id))).length;

  const pct = (n: number) => Math.round((n / total) * 10000) / 100;
  return {
    totalCriticalRoles: total,
    rolesWithSuccessor,
    rolesWithoutSuccessor: total - rolesWithSuccessor,
    rolesWithReadyNow,
    coveragePct: pct(rolesWithSuccessor),
    readyNowCoveragePct: pct(rolesWithReadyNow),
    avgSuccessorsPerRole: rolesWithSuccessor > 0 ? Math.round((totalCandidates / rolesWithSuccessor) * 100) / 100 : 0,
    criticalVacancyExposure,
  };
}

// ── Talent risk (deterministic, no AI) ───────────────────────────────────────
export async function talentRisk(actor: HrActor) {
  assertHrPermission(actor, 'hr.succession.view');
  const scope = successionScope(actor);
  const roles = await scopedRoles(actor, scope).leftJoin('departments as d', 'd.id', 'r.department_id')
    .select('r.id', 'r.role_title', 'r.criticality', 'd.name as department');
  const roleIds = roles.map((r) => Number(r.id));
  const cands = roleIds.length
    ? await db('succession_candidates as c').join('employees as e', 'e.id', 'c.employee_id')
        .where('c.college_id', actor.collegeId).whereIn('c.critical_role_id', roleIds).whereIn('c.status', ACTIVE_CAND)
        .select('c.id', 'c.critical_role_id', 'c.readiness', 'c.development_gaps', 'e.employment_status', 'c.updated_at')
    : [];
  const staleReviewIds = roleIds.length
    ? new Set((await db('succession_readiness_reviews').where('college_id', actor.collegeId)
        .where('created_at', '>=', new Date(Date.now() - STALE_DAYS * 86400000)).distinct('candidate_id')).map((r) => Number(r.candidate_id)))
    : new Set<number>();

  const byRole = new Map<number, typeof cands>();
  for (const c of cands) { const rid = Number(c.critical_role_id); byRole.set(rid, [...(byRole.get(rid) ?? []), c]); }

  const flags: Array<{ type: string; roleId: number; roleTitle: string; department: string | null; detail: string }> = [];
  for (const r of roles) {
    const rid = Number(r.id);
    const list = byRole.get(rid) ?? [];
    const label = { roleId: rid, roleTitle: String(r.role_title), department: (r.department as string) ?? null };
    if (list.length === 0) flags.push({ type: 'NO_SUCCESSOR', ...label, detail: 'No active successor' });
    else if (list.length === 1) flags.push({ type: 'SINGLE_SUCCESSOR', ...label, detail: 'Only one active successor' });
    for (const c of list) {
      if (['SEPARATED', 'RETIRED', 'TERMINATED', 'INACTIVE'].includes(String(c.employment_status))) flags.push({ type: 'SUCCESSOR_INACTIVE', ...label, detail: `Successor no longer active (${c.employment_status})` });
      if (c.development_gaps && c.readiness !== 'READY_NOW') flags.push({ type: 'UNRESOLVED_GAPS', ...label, detail: 'Successor has unresolved development gaps' });
      if (!staleReviewIds.has(Number(c.id))) flags.push({ type: 'STALE_REVIEW', ...label, detail: `No readiness review within ${STALE_DAYS} days` });
    }
  }
  return { flags, count: flags.length };
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export async function dashboard(actor: HrActor) {
  assertHrPermission(actor, 'hr.succession.view');
  const scope = successionScope(actor);
  const [coverage, criticalityDist, readinessDist, deptCoverage, devActionStatus, poolCount, openActions] = await Promise.all([
    coverageMetrics(actor),
    scopedRoles(actor, scope).groupBy('r.criticality').select('r.criticality').count('r.id as count'),
    db('succession_candidates as c').join('succession_critical_roles as r', 'r.id', 'c.critical_role_id').where('c.college_id', actor.collegeId).whereIn('c.status', ACTIVE_CAND)
      .modify((q) => { if (scope) q.whereIn('r.department_id', scope); }).groupBy('c.readiness').select('c.readiness').count('c.id as count'),
    scopedRoles(actor, scope).leftJoin('departments as d', 'd.id', 'r.department_id')
      .leftJoin('succession_candidates as c', function () { this.on('c.critical_role_id', 'r.id').andOnIn('c.status', ACTIVE_CAND); })
      .groupBy('r.department_id', 'd.name').select('d.name as department', db.raw('count(distinct r.id) as roles'), db.raw('count(distinct case when c.id is not null then r.id end) as covered')),
    db('succession_development_actions as a').join('employees as e', 'e.id', 'a.employee_id').where('a.college_id', actor.collegeId)
      .modify((q) => { if (scope) q.whereIn('e.department_id', scope); }).groupBy('a.status').select('a.status').count('a.id as count'),
    db('succession_talent_pools').where({ college_id: actor.collegeId, is_active: true }).count<{ c: number }>('id as c').first(),
    db('succession_development_actions as a').join('employees as e', 'e.id', 'a.employee_id').where('a.college_id', actor.collegeId).whereIn('a.status', ['OPEN', 'IN_PROGRESS'])
      .modify((q) => { if (scope) q.whereIn('e.department_id', scope); }).count<{ c: number }>('a.id as c').first(),
  ]);

  return {
    kpis: {
      criticalRoles: coverage.totalCriticalRoles,
      coveredRoles: coverage.rolesWithSuccessor,
      rolesWithoutSuccessor: coverage.rolesWithoutSuccessor,
      readyNowCoveragePct: coverage.readyNowCoveragePct,
      coveragePct: coverage.coveragePct,
      talentPools: Number(poolCount?.c ?? 0),
      openDevelopmentActions: Number(openActions?.c ?? 0),
      criticalVacancyExposure: coverage.criticalVacancyExposure,
    },
    criticalityDistribution: (criticalityDist as Array<Record<string, unknown>>).map((r) => ({ criticality: r.criticality, count: Number(r.count) })),
    readinessDistribution: (readinessDist as Array<Record<string, unknown>>).map((r) => ({ readiness: r.readiness, count: Number(r.count) })),
    departmentCoverage: (deptCoverage as Array<Record<string, unknown>>).map((r) => ({ department: (r.department as string) ?? 'Unassigned', roles: Number(r.roles), covered: Number(r.covered) })).sort((a, b) => b.roles - a.roles).slice(0, 15),
    developmentActionStatus: (devActionStatus as Array<Record<string, unknown>>).map((r) => ({ status: r.status, count: Number(r.count) })),
  };
}

// ── Reports & exports ────────────────────────────────────────────────────────
export async function coverageReport(actor: HrActor) {
  assertHrPermission(actor, 'hr.succession.report');
  const scope = successionScope(actor);
  const rows = await scopedRoles(actor, scope).leftJoin('departments as d', 'd.id', 'r.department_id').leftJoin('employees as e', 'e.id', 'r.incumbent_employee_id')
    .select('r.id', 'r.role_title', 'd.name as department', 'r.criticality', 'e.display_name as incumbent');
  const roleIds = rows.map((r) => Number(r.id));
  const cands = roleIds.length ? await db('succession_candidates').where('college_id', actor.collegeId).whereIn('critical_role_id', roleIds).whereIn('status', ACTIVE_CAND).select('critical_role_id', 'readiness') : [];
  const byRole = new Map<number, { count: number; readyNow: number }>();
  for (const c of cands) { const rid = Number(c.critical_role_id); const e = byRole.get(rid) ?? { count: 0, readyNow: 0 }; e.count += 1; if (c.readiness === 'READY_NOW') e.readyNow += 1; byRole.set(rid, e); }
  return {
    rows: rows.map((r) => {
      const s = byRole.get(Number(r.id)) ?? { count: 0, readyNow: 0 };
      return { roleTitle: r.role_title, department: r.department ?? 'Unassigned', criticality: r.criticality, incumbent: r.incumbent ?? '—', successors: s.count, readyNow: s.readyNow, coverage: s.count > 0 ? 'COVERED' : 'UNCOVERED' };
    }),
  };
}

const EXPORTS: Record<string, (actor: HrActor) => Promise<{ title: string; columns: string[]; rows: Array<Array<string | number>> }>> = {
  coverage: async (actor) => {
    const rep = await coverageReport(actor);
    return { title: 'Succession Coverage', columns: ['Role', 'Department', 'Criticality', 'Incumbent', 'Successors', 'Ready Now', 'Coverage'], rows: rep.rows.map((r) => [String(r.roleTitle), String(r.department), String(r.criticality), String(r.incumbent), r.successors, r.readyNow, String(r.coverage)]) };
  },
  'development-gaps': async (actor) => {
    const scope = successionScope(actor);
    let q = db('succession_development_actions as a').join('employees as e', 'e.id', 'a.employee_id').where('a.college_id', actor.collegeId).whereIn('a.status', ['OPEN', 'IN_PROGRESS']);
    if (scope) q = q.whereIn('e.department_id', scope);
    const rows = await q.select('e.display_name', 'a.action_type', 'a.description', 'a.due_date', 'a.status');
    return { title: 'Development Gaps', columns: ['Employee', 'Action', 'Description', 'Due', 'Status'], rows: rows.map((r: Record<string, unknown>) => [String(r.display_name), String(r.action_type), String(r.description).slice(0, 80), String(r.due_date ?? '—'), String(r.status)]) };
  },
};

export async function exportReport(actor: HrActor, report: string, format: 'csv' | 'xlsx') {
  assertHrPermission(actor, 'hr.succession.report');
  const builder = EXPORTS[report];
  if (!builder) throw new AppError(404, `Unknown succession export: ${report}`);
  const table = await builder(actor);
  const filename = buildExportFilename(`Succession-${table.title}`, format);
  if (format === 'csv') {
    const esc = (v: string | number) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
    const body = [table.columns.map(esc).join(','), ...table.rows.map((r) => r.map(esc).join(','))].join('\n');
    return { contentType: 'text/csv', filename, body };
  }
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet(table.title.slice(0, 28));
  sheet.addRow(table.columns);
  for (const r of table.rows) sheet.addRow(r);
  return { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename, body: Buffer.from(await wb.xlsx.writeBuffer()) };
}

// ── Employee self-surface (confidentiality-preserving) ───────────────────────
/**
 * An employee sees ONLY their own development actions, pool names and linked
 * learning — never succession rankings, slates, other candidates, or potential
 * assessments.
 */
export async function myDevelopment(actor: HrActor) {
  assertHrPermission(actor, 'hr.succession.self');
  const self = await selfEmployee(actor);
  if (!self) return { linked: false, developmentActions: [], talentPools: [] };
  const [actions, pools] = await Promise.all([
    db('succession_development_actions as a')
      .leftJoin('ld_programs as p', 'p.id', 'a.linked_ld_program_id')
      .where({ 'a.college_id': actor.collegeId, 'a.employee_id': self.id })
      .orderBy('a.due_date')
      .select('a.id', 'a.action_type', 'a.description', 'a.due_date', 'a.status', 'p.title as linked_program'),
    db('succession_talent_pool_members as m').join('succession_talent_pools as pl', 'pl.id', 'm.pool_id')
      .where({ 'm.college_id': actor.collegeId, 'm.employee_id': self.id, 'm.status': 'ACTIVE' })
      .select('pl.name', 'm.entry_date'),
  ]);
  return { linked: true, developmentActions: actions, talentPools: pools };
}
