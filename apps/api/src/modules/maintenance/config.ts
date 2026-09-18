import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { MaintActor } from './types.js';
import { DEFAULT_CATEGORIES, DEFAULT_TEAMS } from './types.js';
import { assertMaintPermission } from './access.js';
import { auditConfig } from './audit.js';

/**
 * Idempotently ensure a college has the baseline teams, categories and routing
 * rules. Safe to call before any ticket create / config read. Never destructive.
 */
export async function ensureMaintenanceConfig(collegeId: number): Promise<void> {
  const teamCount = await db('service_teams').where({ college_id: collegeId }).count<{ n: number }[]>('* as n');
  if (Number(teamCount[0].n) === 0) {
    for (const t of DEFAULT_TEAMS) {
      await db('service_teams').insert({
        college_id: collegeId, code: t.code, name: t.name, kind: t.kind, is_triage: Boolean(t.triage), status: 'ACTIVE',
      });
    }
  }
  const teamByCode = new Map<string, number>();
  for (const row of await db('service_teams').where({ college_id: collegeId }).select('id', 'code')) {
    teamByCode.set(String(row.code), Number(row.id));
  }

  const catCount = await db('service_categories').where({ college_id: collegeId }).count<{ n: number }[]>('* as n');
  if (Number(catCount[0].n) === 0) {
    let sort = 10;
    for (const c of DEFAULT_CATEGORIES) {
      await db('service_categories').insert({
        college_id: collegeId, code: c.code, name: c.name, kind: c.kind,
        default_team_id: teamByCode.get(c.team) ?? teamByCode.get('TRIAGE') ?? null,
        default_priority: c.priority, ack_sla_mins: c.ackMins, resolve_sla_mins: c.resolveMins,
        is_active: true, sort_order: sort,
      });
      sort += 10;
    }
  }
}

// ── Categories ─────────────────────────────────────────────────────────────
export async function listCategories(actor: MaintActor, opts: { activeOnly?: boolean } = {}) {
  await ensureMaintenanceConfig(actor.collegeId);
  let q = db('service_categories as c')
    .leftJoin('service_teams as t', 't.id', 'c.default_team_id')
    .where('c.college_id', actor.collegeId)
    .select('c.*', 't.name as default_team_name')
    .orderBy('c.sort_order', 'asc').orderBy('c.name', 'asc');
  if (opts.activeOnly) q = q.where('c.is_active', true);
  return (await q).map(shapeCategory);
}

function shapeCategory(r: Record<string, unknown>) {
  return {
    id: Number(r.id), code: r.code, name: r.name, kind: r.kind,
    defaultTeamId: r.default_team_id ? Number(r.default_team_id) : null,
    defaultTeamName: (r.default_team_name as string) ?? null,
    defaultPriority: r.default_priority, ackSlaMins: r.ack_sla_mins != null ? Number(r.ack_sla_mins) : null,
    resolveSlaMins: r.resolve_sla_mins != null ? Number(r.resolve_sla_mins) : null,
    isActive: Boolean(r.is_active), sortOrder: Number(r.sort_order), description: r.description ?? null,
  };
}

export async function createCategory(actor: MaintActor, input: Record<string, unknown>) {
  assertMaintPermission(actor, 'maint.config');
  await ensureMaintenanceConfig(actor.collegeId);
  const [id] = await db('service_categories').insert({
    college_id: actor.collegeId, code: String(input.code).toUpperCase(), name: input.name,
    kind: input.kind ?? 'FACILITIES', default_team_id: input.defaultTeamId ?? null,
    default_priority: input.defaultPriority ?? 'NORMAL', ack_sla_mins: input.ackSlaMins ?? null,
    resolve_sla_mins: input.resolveSlaMins ?? null, is_active: input.isActive ?? true, sort_order: input.sortOrder ?? 100,
    description: input.description ?? null,
  });
  await auditConfig(actor, 'CATEGORY_CREATE', 'service_category', Number(id), { after: input });
  return shapeCategory((await db('service_categories').where({ id: Number(id) }).first())!);
}

export async function updateCategory(actor: MaintActor, id: number, input: Record<string, unknown>) {
  assertMaintPermission(actor, 'maint.config');
  const cat = await db('service_categories').where({ id, college_id: actor.collegeId }).first();
  if (!cat) throw new AppError(404, 'Category not found');
  const patch: Record<string, unknown> = { updated_at: db.fn.now() };
  for (const [k, col] of [
    ['name', 'name'], ['kind', 'kind'], ['defaultTeamId', 'default_team_id'], ['defaultPriority', 'default_priority'],
    ['ackSlaMins', 'ack_sla_mins'], ['resolveSlaMins', 'resolve_sla_mins'], ['isActive', 'is_active'],
    ['sortOrder', 'sort_order'], ['description', 'description'],
  ] as const) {
    if (input[k] !== undefined) patch[col] = input[k];
  }
  await db('service_categories').where({ id }).update(patch);
  await auditConfig(actor, 'CATEGORY_UPDATE', 'service_category', id, { before: cat, after: patch });
  return shapeCategory((await db('service_categories').where({ id }).first())!);
}

// ── Teams ────────────────────────────────────────────────────────────────
export async function listTeams(actor: MaintActor, opts: { activeOnly?: boolean } = {}) {
  await ensureMaintenanceConfig(actor.collegeId);
  let q = db('service_teams').where({ college_id: actor.collegeId }).orderBy('is_triage', 'desc').orderBy('name', 'asc');
  if (opts.activeOnly) q = q.where('status', 'ACTIVE');
  const teams = await q;
  const members = await db('service_team_members as m')
    .leftJoin('faculty_users as f', 'f.id', 'm.faculty_id')
    .where('m.college_id', actor.collegeId).where('m.status', 'ACTIVE')
    .select('m.id', 'm.team_id', 'm.faculty_id', 'm.is_lead', 'f.name as faculty_name', 'f.role as faculty_role');
  return teams.map((t) => ({
    id: Number(t.id), code: t.code, name: t.name, kind: t.kind, isTriage: Boolean(t.is_triage),
    status: t.status, description: t.description ?? null,
    members: members.filter((m) => Number(m.team_id) === Number(t.id)).map((m) => ({
      id: Number(m.id), facultyId: Number(m.faculty_id), name: (m.faculty_name as string) ?? null,
      role: (m.faculty_role as string) ?? null, isLead: Boolean(m.is_lead),
    })),
  }));
}

export async function createTeam(actor: MaintActor, input: Record<string, unknown>) {
  assertMaintPermission(actor, 'maint.config');
  await ensureMaintenanceConfig(actor.collegeId);
  const [id] = await db('service_teams').insert({
    college_id: actor.collegeId, code: String(input.code).toUpperCase(), name: input.name,
    kind: input.kind ?? 'FACILITIES', is_triage: input.isTriage ?? false, status: input.status ?? 'ACTIVE',
    description: input.description ?? null,
  });
  await syncMembers(actor.collegeId, Number(id), (input.memberFacultyIds as number[]) ?? null);
  await auditConfig(actor, 'TEAM_CREATE', 'service_team', Number(id), { after: input });
  return (await listTeams(actor)).find((t) => t.id === Number(id));
}

export async function updateTeam(actor: MaintActor, id: number, input: Record<string, unknown>) {
  assertMaintPermission(actor, 'maint.config');
  const team = await db('service_teams').where({ id, college_id: actor.collegeId }).first();
  if (!team) throw new AppError(404, 'Team not found');
  const patch: Record<string, unknown> = { updated_at: db.fn.now() };
  for (const [k, col] of [['name', 'name'], ['kind', 'kind'], ['status', 'status'], ['description', 'description'], ['isTriage', 'is_triage']] as const) {
    if (input[k] !== undefined) patch[col] = input[k];
  }
  await db('service_teams').where({ id }).update(patch);
  if (input.memberFacultyIds !== undefined) await syncMembers(actor.collegeId, id, (input.memberFacultyIds as number[]) ?? null);
  await auditConfig(actor, 'TEAM_UPDATE', 'service_team', id, { before: team, after: patch });
  return (await listTeams(actor)).find((t) => t.id === id);
}

async function syncMembers(collegeId: number, teamId: number, facultyIds: number[] | null) {
  if (facultyIds === null) return;
  const valid = await db('faculty_users').where({ college_id: collegeId }).whereIn('id', facultyIds.length ? facultyIds : [-1]).pluck('id');
  const validSet = new Set(valid.map(Number));
  await db('service_team_members').where({ college_id: collegeId, team_id: teamId }).update({ status: 'ENDED', updated_at: db.fn.now() });
  for (const fid of facultyIds) {
    if (!validSet.has(Number(fid))) continue;
    const existing = await db('service_team_members').where({ team_id: teamId, faculty_id: fid }).first();
    if (existing) {
      await db('service_team_members').where({ id: existing.id }).update({ status: 'ACTIVE', updated_at: db.fn.now() });
    } else {
      await db('service_team_members').insert({ college_id: collegeId, team_id: teamId, faculty_id: fid, status: 'ACTIVE' });
    }
  }
}

// ── Routing rules ──────────────────────────────────────────────────────────
export async function listRoutingRules(actor: MaintActor) {
  assertMaintPermission(actor, 'maint.config');
  await ensureMaintenanceConfig(actor.collegeId);
  const rows = await db('service_routing_rules as r')
    .leftJoin('service_teams as t', 't.id', 'r.target_team_id')
    .leftJoin('service_categories as c', 'c.id', 'r.match_category_id')
    .where('r.college_id', actor.collegeId)
    .select('r.*', 't.name as target_team_name', 'c.name as match_category_name')
    .orderBy('r.priority', 'asc').orderBy('r.id', 'asc');
  return rows.map((r) => ({
    id: Number(r.id), name: r.name, priority: Number(r.priority),
    matchCategoryId: r.match_category_id ? Number(r.match_category_id) : null,
    matchCategoryName: (r.match_category_name as string) ?? null,
    matchSourceModule: r.match_source_module ?? null, matchBuilding: r.match_building ?? null,
    matchDepartmentId: r.match_department_id ? Number(r.match_department_id) : null,
    targetTeamId: Number(r.target_team_id), targetTeamName: (r.target_team_name as string) ?? null,
    isActive: Boolean(r.is_active), explanation: r.explanation ?? null,
  }));
}

export async function createRoutingRule(actor: MaintActor, input: Record<string, unknown>) {
  assertMaintPermission(actor, 'maint.config');
  const team = await db('service_teams').where({ id: input.targetTeamId, college_id: actor.collegeId }).first();
  if (!team) throw new AppError(404, 'Target team not found');
  const [id] = await db('service_routing_rules').insert({
    college_id: actor.collegeId, name: input.name, priority: input.priority ?? 100,
    match_category_id: input.matchCategoryId ?? null, match_source_module: input.matchSourceModule ?? null,
    match_building: input.matchBuilding ?? null, match_department_id: input.matchDepartmentId ?? null,
    target_team_id: input.targetTeamId, is_active: input.isActive ?? true, explanation: input.explanation ?? null,
  });
  await auditConfig(actor, 'ROUTING_RULE_CREATE', 'service_routing_rule', Number(id), { after: input });
  return (await listRoutingRules(actor)).find((r) => r.id === Number(id));
}

export async function updateRoutingRule(actor: MaintActor, id: number, input: Record<string, unknown>) {
  assertMaintPermission(actor, 'maint.config');
  const rule = await db('service_routing_rules').where({ id, college_id: actor.collegeId }).first();
  if (!rule) throw new AppError(404, 'Routing rule not found');
  const patch: Record<string, unknown> = { updated_at: db.fn.now() };
  for (const [k, col] of [
    ['name', 'name'], ['priority', 'priority'], ['matchCategoryId', 'match_category_id'],
    ['matchSourceModule', 'match_source_module'], ['matchBuilding', 'match_building'],
    ['matchDepartmentId', 'match_department_id'], ['targetTeamId', 'target_team_id'],
    ['isActive', 'is_active'], ['explanation', 'explanation'],
  ] as const) {
    if (input[k] !== undefined) patch[col] = input[k];
  }
  await db('service_routing_rules').where({ id }).update(patch);
  await auditConfig(actor, 'ROUTING_RULE_UPDATE', 'service_routing_rule', id, { before: rule, after: patch });
  return (await listRoutingRules(actor)).find((r) => r.id === id);
}

export async function deleteRoutingRule(actor: MaintActor, id: number) {
  assertMaintPermission(actor, 'maint.config');
  const rule = await db('service_routing_rules').where({ id, college_id: actor.collegeId }).first();
  if (!rule) throw new AppError(404, 'Routing rule not found');
  await db('service_routing_rules').where({ id }).del();
  await auditConfig(actor, 'ROUTING_RULE_DELETE', 'service_routing_rule', id, { before: rule });
  return { ok: true };
}
