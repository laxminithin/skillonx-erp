/**
 * Matching workspace views & operational analytics (C5).
 */
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { AlumniAdminActor } from './service.js';
import { canAccessMatching, isDepartmentScopedMatching } from './accessMatching.js';
import { listNeeds, getSourceOfTruthMatrix } from './matchingService.js';
import { WORKSPACE_VIEWS } from './typesMatching.js';

function assertAccess(actor: AlumniAdminActor) {
  if (!canAccessMatching(actor)) throw new AppError(403, 'Matching access denied');
}

async function requireTables() {
  if (!(await db.schema.hasTable('alumni_connect_needs'))) {
    throw new AppError(503, 'Run migration alumni_matching_c5 first');
  }
}

function scope(actor: AlumniAdminActor, q: any) {
  q = q.where('n.college_id', actor.collegeId);
  if (isDepartmentScopedMatching(actor) && actor.departmentId != null) {
    q = q.andWhere((qb: any) => {
      qb.where('n.department_id', actor.departmentId).orWhereNull('n.department_id');
    });
  }
  return q;
}

export async function getMatchingWorkspace(actor: AlumniAdminActor, query: Record<string, unknown> = {}) {
  await requireTables();
  assertAccess(actor);
  const view = String(query.view || 'OPEN_NEEDS').toUpperCase();

  const metrics = await getMatchingAnalytics(actor);

  if (view === 'NEEDS_ATTENTION') {
    const tasks = await db('alumni_matching_tasks as t')
      .leftJoin('alumni_connect_needs as n', 'n.id', 't.need_id')
      .where('t.college_id', actor.collegeId)
      .where('t.status', 'OPEN')
      .modify((qb) => {
        if (isDepartmentScopedMatching(actor) && actor.departmentId != null) {
          qb.andWhere((inner) => {
            inner.where('n.department_id', actor.departmentId).orWhereNull('t.need_id');
          });
        }
      })
      .select('t.*', 'n.title as need_title', 'n.type as need_type', 'n.deadline')
      .orderBy('t.due_at', 'asc')
      .orderBy('t.id', 'desc')
      .limit(100);

    const deadlineSoon = await scope(actor, db('alumni_connect_needs as n'))
      .whereIn('n.status', ['OPEN', 'MATCHING', 'SHORTLISTED', 'ENGAGEMENT_IN_PROGRESS', 'PARTIALLY_FULFILLED'])
      .whereNotNull('n.deadline')
      .where('n.deadline', '<=', new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10))
      .select('n.*')
      .orderBy('n.deadline', 'asc')
      .limit(50);

    return {
      view,
      views: WORKSPACE_VIEWS,
      metrics,
      sourceOfTruth: getSourceOfTruthMatrix(),
      tasks: tasks.map((t: any) => ({
        id: Number(t.id),
        taskType: t.task_type,
        title: t.title,
        body: t.body,
        needId: t.need_id != null ? Number(t.need_id) : null,
        needTitle: t.need_title,
        needType: t.need_type,
        dueAt: t.due_at,
        status: t.status,
      })),
      deadlineSoon: deadlineSoon.map((n: any) => ({
        id: Number(n.id),
        title: n.title,
        type: n.type,
        deadline: n.deadline,
        status: n.status,
        priority: n.priority,
      })),
    };
  }

  const statusMap: Record<string, string[]> = {
    OPEN_NEEDS: ['DRAFT', 'OPEN'],
    MATCHING: ['MATCHING'],
    SHORTLISTED: ['SHORTLISTED'],
    ENGAGEMENT_IN_PROGRESS: ['ENGAGEMENT_IN_PROGRESS'],
    PARTIALLY_FULFILLED: ['PARTIALLY_FULFILLED'],
    FULFILLED: ['FULFILLED', 'CLOSED'],
  };
  const statuses = statusMap[view] || ['OPEN', 'MATCHING'];
  let q = scope(actor, db('alumni_connect_needs as n')).whereIn('n.status', statuses);
  if (query.type) q = q.where('n.type', String(query.type));
  if (query.departmentId) q = q.where('n.department_id', Number(query.departmentId));
  if (query.priority) q = q.where('n.priority', String(query.priority));
  if (query.domain) q = q.where('n.domain', 'like', `%${String(query.domain)}%`);
  if (query.ownerFacultyId) q = q.where('n.owner_faculty_id', Number(query.ownerFacultyId));

  const needs = await q.orderBy('n.deadline', 'asc').orderBy('n.updated_at', 'desc').limit(150);

  // Annotate with shortlist / candidate hints (set-based counts, not N+1 360)
  const needIds = needs.map((n: any) => Number(n.id));
  const shortlistCounts = new Map<number, number>();
  if (needIds.length && (await db.schema.hasTable('alumni_connect_shortlist'))) {
    const rows = await db('alumni_connect_shortlist')
      .whereIn('need_id', needIds)
      .whereNot('status', 'REMOVED')
      .groupBy('need_id')
      .select('need_id')
      .count('* as c');
    for (const r of rows as any[]) shortlistCounts.set(Number(r.need_id), Number(r.c));
  }

  return {
    view,
    views: WORKSPACE_VIEWS,
    metrics,
    sourceOfTruth: getSourceOfTruthMatrix(),
    needs: needs.map((n: any) => ({
      id: Number(n.id),
      type: n.type,
      title: n.title,
      status: n.status,
      priority: n.priority,
      domain: n.domain,
      departmentId: n.department_id != null ? Number(n.department_id) : null,
      programme: n.programme,
      deadline: n.deadline,
      ownerFacultyId: n.owner_faculty_id != null ? Number(n.owner_faculty_id) : null,
      quantityRequired: n.quantity_required != null ? Number(n.quantity_required) : null,
      quantityVerified: Number(n.quantity_verified || 0),
      quantityConfirmed: Number(n.quantity_confirmed || 0),
      shortlistCount: shortlistCounts.get(Number(n.id)) || 0,
      sourceType: n.source_type,
      updatedAt: n.updated_at ? new Date(n.updated_at).toISOString() : null,
    })),
  };
}

export async function getMatchingAnalytics(actor: AlumniAdminActor) {
  await requireTables();
  assertAccess(actor);

  let base = scope(actor, db('alumni_connect_needs as n'));
  const all = await base.clone().select('n.status', 'n.id', 'n.created_at', 'n.updated_at');
  const byStatus: Record<string, number> = {};
  for (const r of all as any[]) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  }

  const needIds = (all as any[]).map((r) => Number(r.id));
  let shortlistedAlumni = 0;
  let engagementInitiated = 0;
  let accepted = 0;
  let declined = 0;
  if (needIds.length) {
    const sl = await db('alumni_connect_shortlist').whereIn('need_id', needIds).whereNot('status', 'REMOVED');
    shortlistedAlumni = sl.length;
    engagementInitiated = sl.filter((s: any) =>
      ['ENGAGEMENT_REQUESTED', 'ACCEPTED', 'COMPLETED', 'DECLINED'].includes(s.status),
    ).length;
    accepted = sl.filter((s: any) => ['ACCEPTED', 'COMPLETED'].includes(s.status)).length;
    declined = sl.filter((s: any) => s.status === 'DECLINED').length;
  }

  // Needs with / without shortlist
  const withShortlist = new Set<number>();
  if (needIds.length) {
    const rows = await db('alumni_connect_shortlist')
      .whereIn('need_id', needIds)
      .whereNot('status', 'REMOVED')
      .distinct('need_id');
    for (const r of rows as any[]) withShortlist.add(Number(r.need_id));
  }
  const openish = (all as any[]).filter((r) =>
    ['OPEN', 'MATCHING', 'SHORTLISTED', 'ENGAGEMENT_IN_PROGRESS'].includes(r.status),
  );
  const needsWithoutMatches = openish.filter((r) => !withShortlist.has(Number(r.id))).length;
  const needsWithMatches = openish.filter((r) => withShortlist.has(Number(r.id))).length;

  // Average time to shortlist / fulfil (operational, not C7 impact)
  const shortlistTimes: number[] = [];
  const fulfilTimes: number[] = [];
  if (needIds.length) {
    const firstSl = await db('alumni_connect_shortlist')
      .whereIn('need_id', needIds)
      .whereNotNull('shortlisted_at')
      .select('need_id')
      .min('shortlisted_at as first_at')
      .groupBy('need_id');
    const needCreated = new Map((all as any[]).map((r) => [Number(r.id), r.created_at]));
    for (const r of firstSl as any[]) {
      const created = needCreated.get(Number(r.need_id));
      if (created && r.first_at) {
        const days = (new Date(r.first_at).getTime() - new Date(created).getTime()) / 86400000;
        if (days >= 0) shortlistTimes.push(days);
      }
    }
    for (const r of all as any[]) {
      if (['FULFILLED', 'PARTIALLY_FULFILLED'].includes(r.status) && r.created_at && r.updated_at) {
        const days = (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) / 86400000;
        if (days >= 0) fulfilTimes.push(days);
      }
    }
  }

  const avg = (arr: number[]) => (arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null);

  return {
    openNeeds: (byStatus.OPEN || 0) + (byStatus.DRAFT || 0) + (byStatus.MATCHING || 0),
    needsWithMatches,
    needsWithoutSuitableMatches: needsWithoutMatches,
    shortlistedAlumni,
    engagementInitiated,
    accepted,
    declined,
    partiallyFulfilled: byStatus.PARTIALLY_FULFILLED || 0,
    fulfilled: byStatus.FULFILLED || 0,
    byStatus,
    averageTimeToShortlistDays: avg(shortlistTimes),
    averageTimeToFulfilDays: avg(fulfilTimes),
  };
}

export async function listNeedsForWorkspace(actor: AlumniAdminActor, query: Record<string, unknown>) {
  return listNeeds(actor, query);
}
