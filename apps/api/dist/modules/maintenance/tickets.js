import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { OPEN_STATUSES, TERMINAL_STATUSES } from './types.js';
import { assertMaintPermission, assertTicketVisibility, assertCanWork, hasMaintPermission, isManager, isPrincipal, hodDepartmentIds, actorTeamIds, } from './access.js';
import { ensureMaintenanceConfig } from './config.js';
import { resolveRoute } from './routing.js';
import { computeState, overallSlaState, totalPausedMs, isWaiting } from './sla.js';
import { recordEvent } from './audit.js';
import { notifyFaculty } from './notify.js';
import { onTicketResolvedSyncSource } from './integrations.js';
import { findAssetRef, recordMaintenanceHistory } from '../assetManagement/service.js';
// ── Ticket number ────────────────────────────────────────────────────────
async function nextTicketNo(collegeId) {
    const year = new Date().getFullYear();
    const prefix = `SR-${year}-`;
    const last = await db('service_tickets')
        .where({ college_id: collegeId })
        .where('ticket_no', 'like', `${prefix}%`)
        .orderBy('id', 'desc')
        .first();
    let seq = 1;
    if (last?.ticket_no) {
        const n = parseInt(String(last.ticket_no).slice(prefix.length), 10);
        if (Number.isFinite(n))
            seq = n + 1;
    }
    return `${prefix}${String(seq).padStart(5, '0')}`;
}
// ── Shaping ────────────────────────────────────────────────────────────────
function slaSnapshot(row, now = Date.now()) {
    const paused = isWaiting(String(row.status)) || Boolean(row.sla_paused_at);
    const pausedMs = totalPausedMs(row, now);
    const ack = computeState({
        dueAt: row.sla_ack_due_at, createdAt: row.created_at, pausedMs,
        completedAt: row.acknowledged_at ?? null, paused, now,
    });
    const resolve = computeState({
        dueAt: row.sla_resolve_due_at, createdAt: row.created_at, pausedMs,
        completedAt: row.resolved_at ?? null, paused, now,
    });
    return {
        ackState: ack.state, ackDueAt: ack.dueAt ? new Date(ack.dueAt).toISOString() : null,
        resolveState: resolve.state, resolveDueAt: resolve.dueAt ? new Date(resolve.dueAt).toISOString() : null,
        overall: overallSlaState(ack.state, resolve.state),
        pausedMs,
    };
}
export function shapeTicket(row, visibility = 'REQUESTER') {
    const base = {
        id: Number(row.id), ticketNo: row.ticket_no, title: row.title, description: row.description ?? null,
        categoryId: row.category_id ? Number(row.category_id) : null, categoryName: row.category_name ?? null,
        categoryKind: row.category_kind ?? null, subcategory: row.subcategory ?? null,
        requesterType: row.requester_type, requesterName: row.requester_name ?? null,
        requesterFacultyId: row.requester_faculty_id ? Number(row.requester_faculty_id) : null,
        requesterStudentId: row.requester_student_id ? Number(row.requester_student_id) : null,
        departmentId: row.department_id ? Number(row.department_id) : null,
        departmentName: row.department_name ?? null,
        roomId: row.room_id ? Number(row.room_id) : null, roomName: row.room_name ?? null,
        building: row.building ?? null, locationNote: row.location_note ?? null,
        sourceModule: row.source_module, sourceEntityType: row.source_entity_type ?? null,
        sourceEntityId: row.source_entity_id ? Number(row.source_entity_id) : null, assetRef: row.asset_ref ?? null,
        assetId: row.asset_id ? Number(row.asset_id) : null,
        asset: row.asset_id ? {
            id: Number(row.asset_id), assetTag: row.asset_tag ?? null, name: row.asset_name ?? null,
            status: row.asset_status ?? null,
            warrantyEndDate: row.asset_warranty_end_date ?? null,
            amcReference: row.asset_amc_reference ?? null, amcExpiryDate: row.asset_amc_expiry_date ?? null,
        } : null,
        erpModule: row.erp_module ?? null, erpRoute: row.erp_route ?? null,
        priority: row.priority, status: row.status,
        teamId: row.team_id ? Number(row.team_id) : null, teamName: row.team_name ?? null,
        assignedTo: row.assigned_to ? Number(row.assigned_to) : null, assigneeName: row.assignee_name ?? null,
        routingExplanation: row.routing_explanation ?? null,
        createdAt: row.created_at, acknowledgedAt: row.acknowledged_at ?? null, startedAt: row.started_at ?? null,
        resolvedAt: row.resolved_at ?? null, confirmedAt: row.confirmed_at ?? null, closedAt: row.closed_at ?? null,
        resolutionSummary: row.resolution_summary ?? null, closureOutcome: row.closure_outcome ?? null,
        reopenCount: Number(row.reopen_count ?? 0), escalationLevel: row.escalation_level ?? 'NONE',
        sla: slaSnapshot(row),
    };
    if (visibility === 'FULL') {
        return {
            ...base,
            vendorName: row.vendor_name ?? null, vendorRef: row.vendor_ref ?? null,
            vendorSentDate: row.vendor_sent_date ?? null, vendorExpectedReturn: row.vendor_expected_return ?? null,
            vendorStatus: row.vendor_status ?? null,
        };
    }
    return base;
}
const ticketQuery = (collegeId) => db('service_tickets as t')
    .leftJoin('service_categories as c', 'c.id', 't.category_id')
    .leftJoin('service_teams as tm', 'tm.id', 't.team_id')
    .leftJoin('departments as d', 'd.id', 't.department_id')
    .leftJoin('rooms as r', 'r.id', 't.room_id')
    .leftJoin('faculty_users as af', 'af.id', 't.assigned_to')
    .leftJoin('faculty_users as rf', 'rf.id', 't.requester_faculty_id')
    .leftJoin('students as rs', 'rs.id', 't.requester_student_id')
    .leftJoin('campus_assets as ca', 'ca.id', 't.asset_id')
    .where('t.college_id', collegeId)
    .select('t.*', 'c.name as category_name', 'c.kind as category_kind', 'tm.name as team_name', 'd.name as department_name', 'r.name as room_name', 'af.name as assignee_name', db.raw('COALESCE(rf.name, rs.name) as requester_name'), 'ca.asset_tag as asset_tag', 'ca.name as asset_name', 'ca.status as asset_status', 'ca.warranty_end_date as asset_warranty_end_date', 'ca.amc_reference as asset_amc_reference', 'ca.amc_expiry_date as asset_amc_expiry_date');
// ── Create ─────────────────────────────────────────────────────────────────
export async function createTicket(actor, input) {
    assertMaintPermission(actor, 'maint.ticket.create');
    await ensureMaintenanceConfig(actor.collegeId);
    // Resolve category (by id or code).
    let category;
    if (input.categoryId) {
        category = await db('service_categories').where({ id: input.categoryId, college_id: actor.collegeId, is_active: true }).first();
    }
    else if (input.categoryCode) {
        category = await db('service_categories').where({ college_id: actor.collegeId, code: String(input.categoryCode).toUpperCase(), is_active: true }).first();
    }
    if (!category) {
        category = await db('service_categories').where({ college_id: actor.collegeId, code: 'OTHER' }).first();
    }
    const categoryId = category ? Number(category.id) : null;
    // Priority: requesters cannot arbitrarily set CRITICAL — clamp to HIGH unless operator.
    let priority = input.priority ?? category?.default_priority ?? 'NORMAL';
    if (priority === 'CRITICAL' && !hasMaintPermission(actor, 'maint.triage'))
        priority = 'HIGH';
    // Location / room resolution (reuse rooms; derive building).
    let roomId = input.roomId ?? null;
    let building = input.building ?? null;
    let departmentId = actor.departmentId ?? null;
    if (roomId) {
        const room = await db('rooms').where({ id: roomId, college_id: actor.collegeId }).first();
        if (!room)
            throw new AppError(404, 'Location (room) not found');
        if (!building)
            building = room.building ?? null;
    }
    // Canonical asset reference (P0.2) — optional; tenant-scoped, never trusted blind.
    let assetId = null;
    let assetRef = input.assetRef ?? null;
    if (input.assetId) {
        const asset = await findAssetRef(actor.collegeId, Number(input.assetId));
        if (!asset)
            throw new AppError(404, 'Asset not found');
        assetId = asset.id;
        if (!assetRef)
            assetRef = asset.assetTag;
    }
    const sourceModule = input.sourceModule ?? 'GENERAL';
    const route = await resolveRoute({
        collegeId: actor.collegeId, categoryId,
        categoryName: category?.name, sourceModule, building, departmentId,
    });
    const now = new Date();
    const ackMins = category?.ack_sla_mins != null ? Number(category.ack_sla_mins) : null;
    const resolveMins = category?.resolve_sla_mins != null ? Number(category.resolve_sla_mins) : null;
    // CRITICAL tickets halve their targets (operational-impact aware, deterministic).
    const factor = priority === 'CRITICAL' ? 0.5 : priority === 'HIGH' ? 0.75 : 1;
    const ackDue = ackMins != null ? new Date(now.getTime() + ackMins * factor * 60000) : null;
    const resolveDue = resolveMins != null ? new Date(now.getTime() + resolveMins * factor * 60000) : null;
    const ticketNo = await nextTicketNo(actor.collegeId);
    const status = route.triaged ? 'TRIAGED' : 'ASSIGNED';
    const [id] = await db('service_tickets').insert({
        college_id: actor.collegeId, ticket_no: ticketNo, title: input.title, description: input.description ?? null,
        category_id: categoryId, subcategory: input.subcategory ?? null,
        requester_type: actor.kind,
        requester_faculty_id: actor.kind === 'FACULTY' ? actor.facultyUserId : null,
        requester_student_id: actor.kind === 'STUDENT' ? actor.studentId : null,
        department_id: departmentId, room_id: roomId, building, location_note: input.locationNote ?? null,
        source_module: sourceModule, source_entity_type: input.sourceEntityType ?? null,
        source_entity_id: input.sourceEntityId ?? null, asset_ref: assetRef, asset_id: assetId,
        erp_module: input.erpModule ?? null, erp_route: input.erpRoute ?? null,
        priority, status, team_id: route.teamId, routing_explanation: route.explanation,
        sla_ack_due_at: ackDue, sla_resolve_due_at: resolveDue,
        created_by: actor.kind === 'FACULTY' ? actor.facultyUserId : null,
    });
    const ticketId = Number(id);
    await recordEvent({ collegeId: actor.collegeId, ticketId, eventType: 'CREATED', actor, toValue: status, note: `Ticket ${ticketNo} raised` });
    await recordEvent({ collegeId: actor.collegeId, ticketId, eventType: 'ROUTED', actor: null, actorTypeOverride: 'SYSTEM', toValue: route.teamId ? String(route.teamId) : null, note: route.explanation, visibility: 'INTERNAL' });
    if (assetId) {
        // Best-effort — traceable from the asset side (§8); never blocks ticket creation.
        await recordMaintenanceHistory(actor.collegeId, assetId, 'MAINTENANCE_TICKET_LINKED', { ticketNo, ticketId }, actor.kind === 'FACULTY' ? actor.facultyUserId ?? null : null).catch(() => { });
    }
    // Attachments.
    const attachments = input.attachments ?? [];
    for (const a of attachments) {
        await db('service_attachments').insert({
            college_id: actor.collegeId, ticket_id: ticketId, visibility: 'REQUESTER',
            filename: a.filename, mime_type: a.mimeType ?? null, size_bytes: a.sizeBytes ?? null,
            data_url: a.dataUrl ?? null, author_type: actor.kind,
            uploaded_by: actor.kind === 'FACULTY' ? actor.facultyUserId : actor.studentId,
        });
    }
    // Notify the team lead(s) of the routed team.
    if (route.teamId)
        await notifyTeamLeads(actor.collegeId, route.teamId, ticketNo, ticketId, 'New service ticket routed to your team');
    const row = await ticketQuery(actor.collegeId).where('t.id', ticketId).first();
    return shapeTicket(row, 'FULL');
}
async function notifyTeamLeads(collegeId, teamId, ticketNo, ticketId, title) {
    const leads = await db('service_team_members').where({ college_id: collegeId, team_id: teamId, status: 'ACTIVE' }).select('faculty_id', 'is_lead');
    const targets = leads.filter((l) => l.is_lead).length ? leads.filter((l) => l.is_lead) : leads;
    for (const m of targets) {
        await notifyFaculty({
            collegeId, facultyUserId: Number(m.faculty_id), type: 'SERVICE_TICKET',
            title: `${title}: ${ticketNo}`, link: `/maintenance/tickets/${ticketId}`,
            relatedId: ticketId, dedupeKey: `svc-route-${ticketId}-${m.faculty_id}`,
        });
    }
}
// ── List (scoped + filtered + paginated) ─────────────────────────────────
export async function listTickets(actor, filters = {}) {
    const page = Math.max(1, Number(filters.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize) || 20));
    let q = ticketQuery(actor.collegeId);
    const scope = await visibilityScope(actor);
    if (scope.mode === 'NONE')
        return { rows: [], total: 0, page, pageSize };
    if (scope.mode === 'OWN') {
        q = actor.kind === 'FACULTY'
            ? q.where('t.requester_faculty_id', actor.facultyUserId)
            : q.where('t.requester_student_id', actor.studentId);
    }
    else if (scope.mode === 'TEAM') {
        q = q.where(function () {
            this.whereIn('t.team_id', scope.teamIds.length ? scope.teamIds : [-1])
                .orWhere('t.assigned_to', actor.facultyUserId)
                .orWhere('t.requester_faculty_id', actor.facultyUserId);
        });
    }
    else if (scope.mode === 'DEPARTMENT') {
        q = q.where(function () {
            this.whereIn('t.department_id', scope.departmentIds.length ? scope.departmentIds : [-1])
                .orWhere('t.requester_faculty_id', actor.facultyUserId);
        });
    }
    // ALL → no extra scope (college already applied).
    if (filters.status)
        q = q.where('t.status', String(filters.status));
    if (filters.statusGroup === 'OPEN')
        q = q.whereIn('t.status', OPEN_STATUSES);
    if (filters.statusGroup === 'CLOSED')
        q = q.whereIn('t.status', ['CLOSED', 'CONFIRMED', 'CANCELLED']);
    if (filters.priority)
        q = q.where('t.priority', String(filters.priority));
    if (filters.categoryId)
        q = q.where('t.category_id', Number(filters.categoryId));
    if (filters.teamId)
        q = q.where('t.team_id', Number(filters.teamId));
    if (filters.assignedTo)
        q = q.where('t.assigned_to', Number(filters.assignedTo));
    if (filters.sourceModule)
        q = q.where('t.source_module', String(filters.sourceModule));
    if (filters.departmentId)
        q = q.where('t.department_id', Number(filters.departmentId));
    if (filters.mine && actor.kind === 'FACULTY')
        q = q.where('t.assigned_to', actor.facultyUserId);
    if (filters.q) {
        const term = `%${String(filters.q)}%`;
        q = q.where(function () {
            this.where('t.ticket_no', 'like', term).orWhere('t.title', 'like', term).orWhere('t.description', 'like', term);
        });
    }
    const countRows = await q.clone().clearSelect().clearOrder().count('t.id as n');
    const total = Number(countRows[0]?.n ?? 0);
    const rows = await q.orderBy('t.created_at', 'desc').limit(pageSize).offset((page - 1) * pageSize);
    // SLA filter (post-computed) — only when requested.
    let shaped = rows.map((r) => shapeTicket(r, scope.internal ? 'FULL' : 'REQUESTER'));
    if (filters.slaState)
        shaped = shaped.filter((t) => t.sla.overall === String(filters.slaState));
    return { rows: shaped, total, page, pageSize };
}
async function visibilityScope(actor) {
    if (isManager(actor))
        return { mode: 'ALL', internal: true };
    if (await isPrincipal(actor))
        return { mode: 'ALL', internal: false };
    if (actor.role === 'MANAGEMENT' || actor.role === 'CHAIRMAN')
        return { mode: 'ALL', internal: false };
    if (hasMaintPermission(actor, 'maint.work') && actor.kind === 'FACULTY') {
        return { mode: 'TEAM', internal: true, teamIds: await actorTeamIds(actor) };
    }
    if (actor.role === 'HOD')
        return { mode: 'DEPARTMENT', internal: false, departmentIds: await hodDepartmentIds(actor) };
    return { mode: 'OWN', internal: false };
}
// ── Get one (with timeline / comments / worklogs / parts / attachments) ───
export async function getTicket(actor, ticketId) {
    const raw = await ticketQuery(actor.collegeId).where('t.id', ticketId).first();
    if (!raw)
        throw new AppError(404, 'Ticket not found');
    const visibility = await assertTicketVisibility(actor, raw);
    const ticket = shapeTicket(raw, visibility);
    const eventsQ = db('service_ticket_events').where({ college_id: actor.collegeId, ticket_id: ticketId }).orderBy('created_at', 'asc').orderBy('id', 'asc');
    const events = visibility === 'FULL' ? await eventsQ : await eventsQ.clone().where('visibility', 'PUBLIC');
    const commentsQ = db('service_comments').where({ college_id: actor.collegeId, ticket_id: ticketId }).orderBy('created_at', 'asc');
    const comments = visibility === 'FULL' ? await commentsQ : await commentsQ.clone().where('visibility', 'REQUESTER');
    const attachQ = db('service_attachments').where({ college_id: actor.collegeId, ticket_id: ticketId }).orderBy('created_at', 'asc');
    const attachments = visibility === 'FULL' ? await attachQ : await attachQ.clone().where('visibility', 'REQUESTER');
    // Work logs, parts, assignment history: INTERNAL only.
    const workLogs = visibility === 'FULL'
        ? await db('service_work_logs').where({ college_id: actor.collegeId, ticket_id: ticketId }).orderBy('created_at', 'desc')
        : [];
    const parts = await db('service_part_requests').where({ college_id: actor.collegeId, ticket_id: ticketId }).orderBy('created_at', 'desc');
    return {
        ...ticket,
        canWork: await canWorkSafe(actor, raw),
        isRequester: (actor.kind === 'FACULTY' && Number(raw.requester_faculty_id) === actor.facultyUserId)
            || (actor.kind === 'STUDENT' && Number(raw.requester_student_id) === actor.studentId),
        timeline: events.map((e) => ({
            id: Number(e.id), type: e.event_type, visibility: e.visibility, actorName: e.actor_name,
            fromValue: e.from_value, toValue: e.to_value, note: e.note, createdAt: e.created_at,
        })),
        comments: comments.map((c) => ({
            id: Number(c.id), visibility: c.visibility, authorName: c.author_name, authorType: c.author_type,
            body: c.body, createdAt: c.created_at,
        })),
        workLogs: workLogs.map((w) => ({
            id: Number(w.id), technicianName: w.technician_name, workPerformed: w.work_performed,
            diagnosis: w.diagnosis, action: w.action, partsUsed: w.parts_used, nextStep: w.next_step,
            minutesSpent: w.minutes_spent != null ? Number(w.minutes_spent) : null, createdAt: w.created_at,
        })),
        parts: parts.map((p) => ({
            id: Number(p.id), item: p.item, quantity: Number(p.quantity), unit: p.unit, reason: p.reason,
            estimatedCost: p.estimated_cost != null ? Number(p.estimated_cost) : null, status: p.status,
            storeRef: p.store_ref, purchaseRef: p.purchase_ref, decisionNote: p.decision_note, createdAt: p.created_at,
        })),
        attachments: attachments.map((a) => ({
            id: Number(a.id), filename: a.filename, mimeType: a.mime_type, sizeBytes: a.size_bytes,
            visibility: a.visibility, dataUrl: a.data_url, createdAt: a.created_at,
        })),
    };
}
async function canWorkSafe(actor, raw) {
    try {
        await assertCanWork(actor, raw);
        return true;
    }
    catch {
        return false;
    }
}
// ── Load helper for mutations ────────────────────────────────────────────
async function loadTicket(actor, ticketId) {
    const t = await db('service_tickets').where({ id: ticketId, college_id: actor.collegeId }).first();
    if (!t)
        throw new AppError(404, 'Ticket not found');
    return t;
}
async function reshape(actor, ticketId, visibility = 'FULL') {
    const row = await ticketQuery(actor.collegeId).where('t.id', ticketId).first();
    return shapeTicket(row, visibility);
}
// ── Assignment / triage ──────────────────────────────────────────────────
export async function assignTicket(actor, ticketId, input) {
    assertMaintPermission(actor, 'maint.assign');
    const t = await loadTicket(actor, ticketId);
    if (TERMINAL_STATUSES.includes(t.status))
        throw new AppError(409, 'Cannot assign a closed ticket');
    let teamId = t.team_id ? Number(t.team_id) : null;
    if (input.teamId !== undefined) {
        const team = await db('service_teams').where({ id: input.teamId, college_id: actor.collegeId, status: 'ACTIVE' }).first();
        if (!team)
            throw new AppError(404, 'Team not found');
        teamId = Number(team.id);
    }
    let techId = t.assigned_to ? Number(t.assigned_to) : null;
    if (input.technicianId !== undefined) {
        if (input.technicianId === null)
            techId = null;
        else {
            // technician must be an ACTIVE member of the (new) team.
            const member = await db('service_team_members').where({ college_id: actor.collegeId, team_id: teamId ?? -1, faculty_id: input.technicianId, status: 'ACTIVE' }).first();
            if (!member)
                throw new AppError(400, 'Technician must be an active member of the assigned team');
            techId = Number(input.technicianId);
        }
    }
    const patch = { team_id: teamId, assigned_to: techId, updated_at: db.fn.now() };
    // Advance status out of OPEN/TRIAGED when a team is set.
    if (['OPEN', 'TRIAGED'].includes(t.status) && teamId)
        patch.status = 'ASSIGNED';
    await db('service_assignment_history').insert({
        college_id: actor.collegeId, ticket_id: ticketId,
        from_team_id: t.team_id ?? null, to_team_id: teamId, from_technician_id: t.assigned_to ?? null, to_technician_id: techId,
        actor_id: actor.facultyUserId ?? null, actor_name: actor.name, reason: input.reason ?? null,
    });
    await db('service_tickets').where({ id: ticketId }).update(patch);
    // A true reassignment means a technician was already assigned, or the team is
    // genuinely being changed. A ticket merely auto-ROUTED to a team at creation
    // (no technician yet) being assigned for the first time is the initial ASSIGNED.
    const reassign = Boolean(t.assigned_to) || Boolean(t.team_id && teamId && Number(t.team_id) !== teamId);
    await recordEvent({
        collegeId: actor.collegeId, ticketId, eventType: reassign ? 'REASSIGNED' : 'ASSIGNED', actor,
        fromValue: t.team_id ? String(t.team_id) : null, toValue: teamId ? String(teamId) : null, note: input.reason ?? null,
    });
    if (techId) {
        await notifyFaculty({ collegeId: actor.collegeId, facultyUserId: techId, type: 'SERVICE_TICKET', title: `Ticket assigned to you: ${t.ticket_no}`, link: `/maintenance/tickets/${ticketId}`, relatedId: ticketId, dedupeKey: `svc-assign-${ticketId}-${techId}-${Date.now()}` });
    }
    else if (teamId) {
        await notifyTeamLeadsLite(actor.collegeId, teamId, String(t.ticket_no), ticketId);
    }
    return reshape(actor, ticketId);
}
async function notifyTeamLeadsLite(collegeId, teamId, ticketNo, ticketId) {
    const leads = await db('service_team_members').where({ college_id: collegeId, team_id: teamId, status: 'ACTIVE', is_lead: true });
    for (const m of leads) {
        await notifyFaculty({ collegeId, facultyUserId: Number(m.faculty_id), type: 'SERVICE_TICKET', title: `Ticket assigned to your team: ${ticketNo}`, link: `/maintenance/tickets/${ticketId}`, relatedId: ticketId, dedupeKey: `svc-teamasg-${ticketId}-${m.faculty_id}-${Date.now()}` });
    }
}
// ── Acknowledge / start ──────────────────────────────────────────────────
export async function acknowledgeTicket(actor, ticketId) {
    const t = await loadTicket(actor, ticketId);
    await assertCanWork(actor, t);
    if (t.acknowledged_at)
        return reshape(actor, ticketId);
    await db('service_tickets').where({ id: ticketId }).update({
        acknowledged_at: db.fn.now(), status: t.status === 'ASSIGNED' || t.status === 'TRIAGED' ? 'ACKNOWLEDGED' : t.status, updated_at: db.fn.now(),
    });
    await recordEvent({ collegeId: actor.collegeId, ticketId, eventType: 'ACKNOWLEDGED', actor, toValue: 'ACKNOWLEDGED' });
    await notifyRequester(actor.collegeId, t, `${t.ticket_no} acknowledged`, ticketId);
    return reshape(actor, ticketId);
}
export async function startWork(actor, ticketId) {
    const t = await loadTicket(actor, ticketId);
    await assertCanWork(actor, t);
    const patch = { status: 'IN_PROGRESS', updated_at: db.fn.now() };
    if (!t.started_at)
        patch.started_at = db.fn.now();
    if (!t.acknowledged_at)
        patch.acknowledged_at = db.fn.now();
    await db('service_tickets').where({ id: ticketId }).update(patch);
    await recordEvent({ collegeId: actor.collegeId, ticketId, eventType: 'STARTED', actor, fromValue: t.status, toValue: 'IN_PROGRESS' });
    return reshape(actor, ticketId);
}
// ── Generic status change (with SLA pause/resume for waiting states) ──────
export async function setStatus(actor, ticketId, input) {
    const t = await loadTicket(actor, ticketId);
    await assertCanWork(actor, t);
    const from = t.status;
    const to = input.status;
    if (from === to)
        return reshape(actor, ticketId);
    // Guard: resolution/confirmation/closure go through dedicated endpoints.
    if (['RESOLVED', 'CONFIRMED', 'CLOSED'].includes(to))
        throw new AppError(400, `Use the dedicated action to move a ticket to ${to}`);
    if (TERMINAL_STATUSES.includes(from))
        throw new AppError(409, `Ticket is ${from}`);
    const allowed = ['ACKNOWLEDGED', 'IN_PROGRESS', 'WAITING_PARTS', 'WAITING_APPROVAL', 'WAITING_REQUESTER', 'CANCELLED'];
    if (!allowed.includes(to))
        throw new AppError(400, `Invalid status transition to ${to}`);
    const patch = { status: to, updated_at: db.fn.now() };
    await applySlaPauseResume(t, from, to, patch, actor, ticketId, input.note ?? null);
    if (to === 'CANCELLED') {
        patch.closed_at = db.fn.now();
        patch.closure_outcome = 'CANCELLED';
    }
    await db('service_tickets').where({ id: ticketId }).update(patch);
    await recordEvent({ collegeId: actor.collegeId, ticketId, eventType: 'STATUS_CHANGE', actor, fromValue: from, toValue: to, note: input.note ?? null });
    if (to === 'WAITING_REQUESTER')
        await notifyRequester(actor.collegeId, t, `${t.ticket_no}: information requested`, ticketId);
    return reshape(actor, ticketId);
}
/** Start/stop the SLA pause clock when crossing into/out of a WAITING_* state. */
async function applySlaPauseResume(t, from, to, patch, actor, ticketId, note) {
    const wasWaiting = isWaiting(from);
    const willWait = isWaiting(to);
    if (!wasWaiting && willWait) {
        patch.sla_paused_at = db.fn.now();
        await recordEvent({ collegeId: actor.collegeId, ticketId, eventType: 'SLA_PAUSE', actor, toValue: to, note: `SLA paused (${to})${note ? `: ${note}` : ''}`, visibility: 'INTERNAL' });
    }
    else if (wasWaiting && !willWait && t.sla_paused_at) {
        const elapsed = Date.now() - new Date(t.sla_paused_at).getTime();
        patch.sla_paused_ms = Number(t.sla_paused_ms ?? 0) + Math.max(0, elapsed);
        patch.sla_paused_at = null;
        await recordEvent({ collegeId: actor.collegeId, ticketId, eventType: 'SLA_RESUME', actor, fromValue: from, note: `SLA resumed after ${Math.round(elapsed / 60000)} min paused`, visibility: 'INTERNAL' });
    }
}
// ── Priority ───────────────────────────────────────────────────────────────
export async function setPriority(actor, ticketId, input) {
    assertMaintPermission(actor, 'maint.triage');
    const t = await loadTicket(actor, ticketId);
    if (t.priority === input.priority)
        return reshape(actor, ticketId);
    await db('service_tickets').where({ id: ticketId }).update({ priority: input.priority, updated_at: db.fn.now() });
    await recordEvent({ collegeId: actor.collegeId, ticketId, eventType: 'PRIORITY_CHANGE', actor, fromValue: t.priority, toValue: input.priority, note: input.reason ?? null });
    return reshape(actor, ticketId);
}
// ── Resolve ──────────────────────────────────────────────────────────────
export async function resolveTicket(actor, ticketId, input) {
    const t = await loadTicket(actor, ticketId);
    await assertCanWork(actor, t);
    if (TERMINAL_STATUSES.includes(t.status))
        throw new AppError(409, `Ticket is ${t.status}`);
    const patch = {
        status: 'RESOLVED', resolved_at: db.fn.now(), resolution_summary: input.resolutionSummary,
        closure_outcome: input.closureOutcome ?? 'RESOLVED', updated_at: db.fn.now(),
    };
    // Leaving any waiting state — resume clock.
    await applySlaPauseResume(t, t.status, 'RESOLVED', patch, actor, ticketId, null);
    if (!t.acknowledged_at)
        patch.acknowledged_at = db.fn.now();
    await db('service_tickets').where({ id: ticketId }).update(patch);
    await recordEvent({ collegeId: actor.collegeId, ticketId, eventType: 'RESOLVED', actor, fromValue: t.status, toValue: 'RESOLVED', note: input.resolutionSummary });
    await notifyRequester(actor.collegeId, t, `${t.ticket_no} resolved — please confirm`, ticketId);
    // Safe source-module sync (e.g. Lab repair context) — never mutates source lifecycle directly.
    await onTicketResolvedSyncSource(actor, { ...t, resolution_summary: input.resolutionSummary });
    if (t.asset_id) {
        await recordMaintenanceHistory(actor.collegeId, Number(t.asset_id), 'MAINTENANCE_COMPLETED', { ticketNo: t.ticket_no, resolutionSummary: input.resolutionSummary }, actor.kind === 'FACULTY' ? actor.facultyUserId ?? null : null).catch(() => { });
    }
    return reshape(actor, ticketId);
}
// ── Requester confirmation / reopen ────────────────────────────────────────
export async function confirmResolution(actor, ticketId, input) {
    const t = await loadTicket(actor, ticketId);
    const isRequester = (actor.kind === 'FACULTY' && Number(t.requester_faculty_id) === actor.facultyUserId)
        || (actor.kind === 'STUDENT' && Number(t.requester_student_id) === actor.studentId);
    if (!isRequester && !isManager(actor))
        throw new AppError(403, 'Only the requester or a manager can confirm this ticket');
    if (t.status !== 'RESOLVED')
        throw new AppError(409, 'Ticket is not awaiting confirmation');
    await db('service_tickets').where({ id: ticketId }).update({
        status: 'CLOSED', confirmed_at: db.fn.now(), closed_at: db.fn.now(), updated_at: db.fn.now(),
    });
    await recordEvent({ collegeId: actor.collegeId, ticketId, eventType: 'CONFIRMED', actor, toValue: 'CLOSED', note: input.note ?? null });
    await recordEvent({ collegeId: actor.collegeId, ticketId, eventType: 'CLOSED', actor: null, actorTypeOverride: 'SYSTEM', toValue: 'CLOSED', note: 'Closed after requester confirmation' });
    return reshape(actor, ticketId, isRequester && !isManager(actor) ? 'REQUESTER' : 'FULL');
}
export async function reopenTicket(actor, ticketId, input) {
    const t = await loadTicket(actor, ticketId);
    const isRequester = (actor.kind === 'FACULTY' && Number(t.requester_faculty_id) === actor.facultyUserId)
        || (actor.kind === 'STUDENT' && Number(t.requester_student_id) === actor.studentId);
    if (!isRequester && !isManager(actor))
        throw new AppError(403, 'Only the requester or a manager can reopen this ticket');
    if (!['RESOLVED', 'CLOSED'].includes(t.status))
        throw new AppError(409, 'Only resolved or closed tickets can be reopened');
    await db('service_tickets').where({ id: ticketId }).update({
        status: 'REOPENED', reopen_count: Number(t.reopen_count ?? 0) + 1,
        resolved_at: null, confirmed_at: null, closed_at: null, closure_outcome: null, updated_at: db.fn.now(),
    });
    await recordEvent({ collegeId: actor.collegeId, ticketId, eventType: 'REOPENED', actor, fromValue: t.status, toValue: 'REOPENED', note: input.reason });
    if (t.assigned_to)
        await notifyFaculty({ collegeId: actor.collegeId, facultyUserId: Number(t.assigned_to), type: 'SERVICE_TICKET', title: `Ticket reopened: ${t.ticket_no}`, link: `/maintenance/tickets/${ticketId}`, relatedId: ticketId, dedupeKey: `svc-reopen-${ticketId}-${Date.now()}` });
    return reshape(actor, ticketId, isRequester && !isManager(actor) ? 'REQUESTER' : 'FULL');
}
// ── Comments ─────────────────────────────────────────────────────────────
export async function addComment(actor, ticketId, input) {
    const raw = await loadTicket(actor, ticketId);
    const vis = await assertTicketVisibility(actor, raw);
    let visibility = input.visibility ?? 'REQUESTER';
    // Only staff with FULL visibility may post INTERNAL notes; requesters are forced to REQUESTER.
    if (visibility === 'INTERNAL' && vis !== 'FULL')
        throw new AppError(403, 'You cannot post internal notes');
    const [id] = await db('service_comments').insert({
        college_id: actor.collegeId, ticket_id: ticketId, visibility,
        author_type: actor.kind, author_id: actor.kind === 'FACULTY' ? actor.facultyUserId : actor.studentId,
        author_name: actor.name, body: input.body,
    });
    await recordEvent({ collegeId: actor.collegeId, ticketId, eventType: 'COMMENT', actor, visibility: visibility === 'INTERNAL' ? 'INTERNAL' : 'PUBLIC', note: visibility === 'INTERNAL' ? 'Internal note added' : 'Comment added' });
    // Notify the counterpart.
    if (visibility === 'REQUESTER' && vis === 'FULL')
        await notifyRequester(actor.collegeId, raw, `New update on ${raw.ticket_no}`, ticketId);
    return { id: Number(id), visibility };
}
// ── Work log ───────────────────────────────────────────────────────────────
export async function addWorkLog(actor, ticketId, input) {
    const t = await loadTicket(actor, ticketId);
    await assertCanWork(actor, t);
    const [id] = await db('service_work_logs').insert({
        college_id: actor.collegeId, ticket_id: ticketId,
        technician_id: actor.facultyUserId ?? null, technician_name: actor.name,
        work_performed: input.workPerformed, diagnosis: input.diagnosis ?? null, action: input.action ?? null,
        parts_used: input.partsUsed ?? null, next_step: input.nextStep ?? null, minutes_spent: input.minutesSpent ?? null,
    });
    // Auto-advance to IN_PROGRESS if still assigned/acknowledged.
    if (['ASSIGNED', 'ACKNOWLEDGED', 'TRIAGED', 'REOPENED'].includes(t.status)) {
        await db('service_tickets').where({ id: ticketId }).update({ status: 'IN_PROGRESS', started_at: t.started_at ?? db.fn.now(), updated_at: db.fn.now() });
    }
    await recordEvent({ collegeId: actor.collegeId, ticketId, eventType: 'WORK_LOG', actor, visibility: 'INTERNAL', note: String(input.workPerformed).slice(0, 200) });
    return { id: Number(id) };
}
// ── Parts / material requests ──────────────────────────────────────────────
export async function requestPart(actor, ticketId, input) {
    const t = await loadTicket(actor, ticketId);
    await assertCanWork(actor, t);
    const [id] = await db('service_part_requests').insert({
        college_id: actor.collegeId, ticket_id: ticketId, item: input.item, quantity: input.quantity ?? 1,
        unit: input.unit ?? null, reason: input.reason ?? null, estimated_cost: input.estimatedCost ?? null,
        status: 'REQUESTED', requested_by: actor.facultyUserId ?? null,
    });
    // Move ticket to WAITING_PARTS (pauses SLA).
    const patch = { status: 'WAITING_PARTS', updated_at: db.fn.now() };
    await applySlaPauseResume(t, t.status, 'WAITING_PARTS', patch, actor, ticketId, `Part requested: ${input.item}`);
    if (!isWaiting(t.status))
        await db('service_tickets').where({ id: ticketId }).update(patch);
    await recordEvent({ collegeId: actor.collegeId, ticketId, eventType: 'PART_REQUEST', actor, visibility: 'INTERNAL', note: `Requested ${input.quantity ?? 1} × ${input.item}` });
    return { id: Number(id) };
}
export async function decidePart(actor, ticketId, partId, input) {
    assertMaintPermission(actor, 'maint.parts.approve');
    const t = await loadTicket(actor, ticketId);
    const part = await db('service_part_requests').where({ id: partId, ticket_id: ticketId, college_id: actor.collegeId }).first();
    if (!part)
        throw new AppError(404, 'Part request not found');
    await db('service_part_requests').where({ id: partId }).update({
        status: input.status, decided_by: actor.facultyUserId ?? null, decision_note: input.note ?? null,
        store_ref: input.storeRef ?? part.store_ref, purchase_ref: input.purchaseRef ?? part.purchase_ref, updated_at: db.fn.now(),
    });
    await recordEvent({ collegeId: actor.collegeId, ticketId, eventType: 'APPROVAL', actor, visibility: 'INTERNAL', fromValue: part.status, toValue: String(input.status), note: `Part "${part.item}" ${input.status}` });
    return { id: partId, status: input.status };
}
// ── Escalation ───────────────────────────────────────────────────────────
export async function escalateTicket(actor, ticketId, input) {
    assertMaintPermission(actor, 'maint.work');
    const t = await loadTicket(actor, ticketId);
    await db('service_escalations').insert({
        college_id: actor.collegeId, ticket_id: ticketId, level: input.level, trigger: 'MANUAL',
        reason: input.reason ?? null, actor_id: actor.facultyUserId ?? null,
    });
    await db('service_tickets').where({ id: ticketId }).update({ escalation_level: input.level, updated_at: db.fn.now() });
    await recordEvent({ collegeId: actor.collegeId, ticketId, eventType: 'ESCALATED', actor, toValue: input.level, note: input.reason ?? null, visibility: 'INTERNAL' });
    return reshape(actor, ticketId);
}
// ── Vendor metadata ────────────────────────────────────────────────────────
export async function updateVendor(actor, ticketId, input) {
    const t = await loadTicket(actor, ticketId);
    await assertCanWork(actor, t);
    await db('service_tickets').where({ id: ticketId }).update({
        vendor_name: input.vendorName ?? t.vendor_name, vendor_ref: input.vendorRef ?? t.vendor_ref,
        vendor_sent_date: input.vendorSentDate ?? t.vendor_sent_date, vendor_expected_return: input.vendorExpectedReturn ?? t.vendor_expected_return,
        vendor_status: input.vendorStatus ?? t.vendor_status, updated_at: db.fn.now(),
    });
    await recordEvent({ collegeId: actor.collegeId, ticketId, eventType: 'VENDOR', actor, visibility: 'INTERNAL', note: `Vendor: ${input.vendorName ?? t.vendor_name ?? ''} (${input.vendorStatus ?? ''})` });
    return reshape(actor, ticketId);
}
// ── Attachments ──────────────────────────────────────────────────────────
export async function addAttachment(actor, ticketId, input) {
    const raw = await loadTicket(actor, ticketId);
    const vis = await assertTicketVisibility(actor, raw);
    const visibility = input.visibility === 'INTERNAL' && vis === 'FULL' ? 'INTERNAL' : 'REQUESTER';
    const [id] = await db('service_attachments').insert({
        college_id: actor.collegeId, ticket_id: ticketId, visibility, filename: input.filename,
        mime_type: input.mimeType ?? null, size_bytes: input.sizeBytes ?? null, data_url: input.dataUrl ?? null,
        author_type: actor.kind, uploaded_by: actor.kind === 'FACULTY' ? actor.facultyUserId : actor.studentId,
    });
    return { id: Number(id) };
}
// ── Notifications ──────────────────────────────────────────────────────────
async function notifyRequester(collegeId, t, title, ticketId) {
    if (t.requester_type === 'FACULTY' && t.requester_faculty_id) {
        await notifyFaculty({ collegeId, facultyUserId: Number(t.requester_faculty_id), type: 'SERVICE_TICKET', title, link: `/maintenance/tickets/${ticketId}`, relatedId: ticketId, dedupeKey: `svc-req-${ticketId}-${title.slice(0, 20)}` });
    }
}
