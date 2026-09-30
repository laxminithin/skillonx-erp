/**
 * Engagement workspace, calendar, analytics (C4.6 / C4.18 / C4.21 / C4.23).
 */
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { AlumniAdminActor } from './service.js';
import { canAccessEngagement, isDepartmentScopedEngagement } from './accessEngagement.js';
import { listChannelCapabilities } from './channels.js';
import { ensureDefaultCategories, listManualOutreachQueue } from './engagementService.js';
import { ensureDefaultFatigueRules } from './eligibility.js';

function assertAccess(actor: AlumniAdminActor) {
  if (!canAccessEngagement(actor)) throw new AppError(403, 'Engagement access denied');
}

export async function getEngagementWorkspace(actor: AlumniAdminActor, query: Record<string, unknown> = {}) {
  assertAccess(actor);
  if (!(await db.schema.hasTable('alumni_engagement_programs'))) {
    throw new AppError(503, 'Alumni engagement schema not migrated');
  }
  await ensureDefaultCategories(actor.collegeId);
  await ensureDefaultFatigueRules(actor.collegeId);

  const view = String(query.view || 'OVERVIEW').toUpperCase();
  const today = new Date().toISOString().slice(0, 10);

  const [programsActive, campaignsUpcoming, pendingApprovals, responsesAction, overdueFollowups] = await Promise.all([
    db('alumni_engagement_programs')
      .where({ college_id: actor.collegeId })
      .whereIn('status', ['ACTIVE', 'PLANNED'])
      .count({ c: '*' })
      .first(),
    db('alumni_engagement_campaigns')
      .where({ college_id: actor.collegeId })
      .whereIn('status', ['APPROVED', 'SCHEDULED', 'IN_PROGRESS'])
      .count({ c: '*' })
      .first(),
    db('alumni_engagement_approvals as a')
      .join('alumni_engagement_campaigns as c', 'c.id', 'a.campaign_id')
      .where('a.college_id', actor.collegeId)
      .where('a.decision', 'PENDING')
      .whereNotIn('c.status', ['CANCELLED', 'COMPLETED'])
      .count({ c: '*' })
      .first(),
    db('alumni_engagement_responses')
      .where({ college_id: actor.collegeId, requires_staff_action: true })
      .whereNull('staff_actioned_at')
      .count({ c: '*' })
      .first(),
    db('alumni_crm_followups')
      .where({ college_id: actor.collegeId })
      .whereIn('status', ['OPEN', 'IN_PROGRESS', 'OVERDUE'])
      .andWhere('due_date', '<', today)
      .count({ c: '*' })
      .first(),
  ]);

  const metrics = {
    activePrograms: Number((programsActive as any)?.c || 0),
    upcomingCampaigns: Number((campaignsUpcoming as any)?.c || 0),
    pendingApprovals: Number((pendingApprovals as any)?.c || 0),
    responsesRequiringAction: Number((responsesAction as any)?.c || 0),
    overdueFollowups: Number((overdueFollowups as any)?.c || 0),
  };

  if (view === 'MANUAL_OUTREACH') {
    const queue = await listManualOutreachQueue(actor, query);
    return { view, metrics, channels: listChannelCapabilities(), ...queue };
  }

  if (view === 'APPROVALS') {
    let q = db('alumni_engagement_approvals as a')
      .join('alumni_engagement_campaigns as c', 'c.id', 'a.campaign_id')
      .join('alumni_engagement_programs as p', 'p.id', 'c.program_id')
      .where('a.college_id', actor.collegeId)
      .where('a.decision', 'PENDING')
      .select(
        'a.id',
        'a.step',
        'a.decision',
        'a.campaign_id',
        'c.name as campaign_name',
        'p.name as program_name',
        'c.department_id',
      );
    if (isDepartmentScopedEngagement(actor) && actor.departmentId != null) {
      q = q.andWhere('c.department_id', actor.departmentId);
    }
    const items = await q.orderBy('a.id', 'asc').limit(100);
    return { view, metrics, items, channels: listChannelCapabilities() };
  }

  if (view === 'RESPONSES') {
    const items = await db('alumni_engagement_responses as r')
      .leftJoin('alumni_profiles as ap', 'ap.id', 'r.alumni_profile_id')
      .leftJoin('alumni_engagement_campaigns as c', 'c.id', 'r.campaign_id')
      .where('r.college_id', actor.collegeId)
      .select(
        'r.*',
        'ap.historical_name as alumni_name',
        'c.name as campaign_name',
      )
      .orderBy('r.created_at', 'desc')
      .limit(100);
    return {
      view,
      metrics,
      items: items.map((r: any) => ({
        id: Number(r.id),
        alumniProfileId: Number(r.alumni_profile_id),
        alumniName: r.alumni_name,
        campaignName: r.campaign_name,
        actionType: r.action_type,
        choice: r.choice,
        requiresStaffAction: Boolean(r.requires_staff_action),
        createdAt: r.created_at,
      })),
      channels: listChannelCapabilities(),
    };
  }

  // OVERVIEW default
  const todaysOutreach = await listManualOutreachQueue(actor, {}).then((q) => q.items.slice(0, 15));
  const upcoming = await db('alumni_engagement_campaigns as c')
    .leftJoin('alumni_engagement_programs as p', 'p.id', 'c.program_id')
    .where('c.college_id', actor.collegeId)
    .whereIn('c.status', ['APPROVED', 'SCHEDULED', 'READY_FOR_REVIEW'])
    .select('c.id', 'c.name', 'c.status', 'c.scheduled_at', 'p.name as program_name')
    .orderBy('c.scheduled_at', 'asc')
    .limit(15);

  const atRisk = await db('alumni_engagement_programs')
    .where({ college_id: actor.collegeId })
    .whereIn('status', ['ACTIVE', 'PLANNED'])
    .whereNotNull('end_date')
    .andWhere('end_date', '<', new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10))
    .select('id', 'name', 'status', 'end_date')
    .limit(10);

  return {
    view,
    metrics,
    todaysOutreach,
    pendingApprovalsList: (
      await db('alumni_engagement_approvals as a')
        .join('alumni_engagement_campaigns as c', 'c.id', 'a.campaign_id')
        .where('a.college_id', actor.collegeId)
        .where('a.decision', 'PENDING')
        .select('a.id', 'a.step', 'c.name as campaign_name', 'a.campaign_id')
        .limit(10)
    ),
    upcomingCampaigns: upcoming,
    responsesRequiringAction: (
      await db('alumni_engagement_responses as r')
        .leftJoin('alumni_profiles as ap', 'ap.id', 'r.alumni_profile_id')
        .where('r.college_id', actor.collegeId)
        .where({ requires_staff_action: true })
        .whereNull('staff_actioned_at')
        .select('r.id', 'r.action_type', 'r.choice', 'ap.historical_name as alumni_name', 'r.alumni_profile_id')
        .limit(10)
    ),
    programsAtRisk: atRisk,
    channels: listChannelCapabilities(),
    note: 'Operational engagement workspace. No fake delivery/open/read metrics.',
  };
}

export async function getEngagementCalendar(actor: AlumniAdminActor, query: Record<string, unknown> = {}) {
  assertAccess(actor);
  const view = String(query.view || 'MONTH').toUpperCase(); // MONTH | QUARTER | ACADEMIC_YEAR
  const year = Number(query.year || new Date().getFullYear());
  const month = Number(query.month || new Date().getMonth() + 1);
  const departmentId = query.departmentId != null ? Number(query.departmentId) : null;

  let start: Date;
  let end: Date;
  if (view === 'QUARTER') {
    const q = Math.floor((month - 1) / 3);
    start = new Date(year, q * 3, 1);
    end = new Date(year, q * 3 + 3, 0, 23, 59, 59);
  } else if (view === 'ACADEMIC_YEAR') {
    // Assume June–May academic year when month >= 6
    const ayStart = month >= 6 ? year : year - 1;
    start = new Date(ayStart, 5, 1);
    end = new Date(ayStart + 1, 4, 31, 23, 59, 59);
  } else {
    start = new Date(year, month - 1, 1);
    end = new Date(year, month, 0, 23, 59, 59);
  }

  let programsQ = db('alumni_engagement_programs')
    .where({ college_id: actor.collegeId })
    .whereNotIn('status', ['CANCELLED'])
    .andWhere((qb) => {
      qb.whereBetween('start_date', [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)])
        .orWhereBetween('end_date', [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)])
        .orWhere((qb2) => {
          qb2.where('start_date', '<=', start.toISOString().slice(0, 10)).andWhere('end_date', '>=', end.toISOString().slice(0, 10));
        });
    });
  if (departmentId) programsQ = programsQ.andWhere({ department_id: departmentId });
  if (isDepartmentScopedEngagement(actor) && actor.departmentId != null) {
    programsQ = programsQ.andWhere((qb) => {
      qb.where({ scope: 'INSTITUTION' }).orWhere({ department_id: actor.departmentId });
    });
  }
  const programs = await programsQ.select('*').limit(200);

  let campaignsQ = db('alumni_engagement_campaigns')
    .where({ college_id: actor.collegeId })
    .whereNotIn('status', ['CANCELLED'])
    .andWhere((qb) => {
      qb.whereBetween('scheduled_at', [start, end]).orWhereNull('scheduled_at');
    });
  if (departmentId) campaignsQ = campaignsQ.andWhere({ department_id: departmentId });
  const campaigns = await campaignsQ.select('*').limit(200);

  let events: any[] = [];
  if (await db.schema.hasTable('alumni_events')) {
    let eq = db('alumni_events')
      .where({ college_id: actor.collegeId })
      .whereBetween('starts_at', [start, end]);
    events = await eq.select('id', 'title', 'starts_at', 'venue').limit(100).catch(() => []);
  }

  return {
    view,
    range: { start: start.toISOString(), end: end.toISOString() },
    items: [
      ...programs.map((p: any) => ({
        kind: 'PROGRAM',
        id: Number(p.id),
        title: p.name,
        category: p.category,
        status: p.status,
        start: p.start_date,
        end: p.end_date,
        departmentId: p.department_id,
      })),
      ...campaigns.map((c: any) => ({
        kind: 'CAMPAIGN',
        id: Number(c.id),
        title: c.name,
        status: c.status,
        start: c.scheduled_at,
        end: c.scheduled_at,
        channel: c.channel,
        departmentId: c.department_id,
      })),
      ...events.map((e: any) => ({
        kind: 'EVENT',
        id: Number(e.id),
        title: e.title,
        start: e.starts_at,
        end: e.starts_at,
        location: e.venue,
      })),
    ],
  };
}

export async function getEngagementAnalytics(actor: AlumniAdminActor, query: Record<string, unknown> = {}) {
  assertAccess(actor);
  const programId = query.programId != null ? Number(query.programId) : null;
  const campaignId = query.campaignId != null ? Number(query.campaignId) : null;

  let rq = db('alumni_engagement_recipients as r')
    .join('alumni_engagement_campaigns as c', 'c.id', 'r.campaign_id')
    .where('r.college_id', actor.collegeId);
  if (programId) rq = rq.andWhere('c.program_id', programId);
  if (campaignId) rq = rq.andWhere('r.campaign_id', campaignId);
  const rows = await rq.select('r.*', 'c.channel');

  const program = {
    targeted: rows.length,
    eligible: rows.filter((r: any) => r.eligibility === 'ELIGIBLE').length,
    contacted: rows.filter((r: any) => r.contact_status !== 'NOT_CONTACTED').length,
    responded: rows.filter((r: any) =>
      ['RESPONDED', 'INTERESTED', 'DECLINED'].includes(r.contact_status),
    ).length,
    interested: rows.filter((r: any) => r.contact_status === 'INTERESTED').length,
    opportunities: rows.filter((r: any) => r.crm_opportunity_id).length,
  };

  const byChannel: Record<string, { attempts: number; responses: number }> = {};
  for (const r of rows) {
    const ch = r.channel || 'MANUAL';
    if (!byChannel[ch]) byChannel[ch] = { attempts: 0, responses: 0 };
    if (r.contact_status !== 'NOT_CONTACTED') byChannel[ch].attempts++;
    if (['RESPONDED', 'INTERESTED', 'DECLINED'].includes(r.contact_status)) byChannel[ch].responses++;
  }

  return {
    program,
    channel: byChannel,
    note: 'No delivery/open/read metrics — providers do not supply them.',
  };
}
