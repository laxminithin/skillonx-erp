/**
 * Management & Executive Portal — Executive Approval Inbox.
 *
 * A cross-domain AGGREGATOR, not a second approval engine. The list is a
 * read-model computed on demand (no duplicate approval state is persisted).
 * Acting on an item dispatches to the CANONICAL domain service, which remains
 * the single authority: it enforces its own approval capability AND performs an
 * atomic, concurrency-safe status transition (row locks + idempotent guards).
 * Therefore a portal approval racing a native-module approval yields exactly
 * one valid transition.
 *
 * Governance boundary: listing requires `management.approvals.view`; acting
 * requires `management.approvals.act` here PLUS the canonical approval
 * capability at the domain layer. A pure MANAGEMENT/CHAIRMAN viewer can see the
 * inbox but cannot execute — Principal/admin (who hold canonical authority) act.
 */
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import * as leave from '../hr/leave.js';
import * as requisitions from '../hr/recruitmentRequisitions.js';
import { assertManagementPermission } from './access.js';
import { domainActor } from './sources.js';
const LEAVE_PENDING = ['SUBMITTED', 'UNDER_APPROVAL'];
const REQ_PENDING = ['SUBMITTED', 'DEPARTMENT_APPROVED', 'HR_REVIEW'];
function ageDays(d) {
    if (!d)
        return null;
    const t = new Date(d).getTime();
    if (!Number.isFinite(t))
        return null;
    return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}
export async function listApprovals(actor) {
    assertManagementPermission(actor, 'management.approvals.view');
    const collegeId = actor.collegeId;
    const items = [];
    if (await db.schema.hasTable('hr_leave_requests')) {
        const rows = await db('hr_leave_requests as r')
            .leftJoin('employees as e', 'e.id', 'r.employee_id')
            .leftJoin('departments as d', 'd.id', 'e.department_id')
            .leftJoin('hr_leave_types as t', 't.id', 'r.leave_type_id')
            .where('r.college_id', collegeId)
            .whereIn('r.status', LEAVE_PENDING)
            // DTO projection only — never the full ORM row (no PII beyond name/dept).
            .select('r.id', 'r.request_number as reference', 'r.status', 'r.is_emergency', 'r.requested_days', 'r.submitted_at', 'r.created_at', 't.name as leave_type', 'd.name as department', db.raw("concat_ws(' ', e.first_name, e.last_name) as requester"));
        for (const r of rows) {
            const when = (r.submitted_at ?? r.created_at);
            items.push({
                domain: 'LEAVE',
                type: 'LEAVE_REQUEST',
                id: Number(r.id),
                reference: r.reference ?? null,
                requester: r.requester?.trim() || null,
                department: r.department ?? null,
                date: when,
                ageDays: ageDays(when),
                summary: `${r.leave_type ?? 'Leave'} · ${Number(r.requested_days ?? 0)} day(s)`,
                status: String(r.status),
                priority: r.is_emergency ? 'HIGH' : 'NORMAL',
                canonicalRef: `/hr/leave/requests/${Number(r.id)}`,
                allowedActions: ['APPROVE', 'REJECT'],
            });
        }
    }
    if (await db.schema.hasTable('hr_recruitment_requisitions')) {
        const rows = await db('hr_recruitment_requisitions as q')
            .leftJoin('departments as d', 'd.id', 'q.department_id')
            .where('q.college_id', collegeId)
            .whereIn('q.status', REQ_PENDING)
            .select('q.id', 'q.code as reference', 'q.status', 'q.requested_headcount', 'q.created_at', 'q.desired_joining_date', 'd.name as department');
        for (const r of rows) {
            items.push({
                domain: 'RECRUITMENT',
                type: 'REQUISITION',
                id: Number(r.id),
                reference: r.reference ?? null,
                requester: null,
                department: r.department ?? null,
                date: r.created_at ?? null,
                ageDays: ageDays(r.created_at),
                summary: `Requisition · ${Number(r.requested_headcount ?? 0)} position(s)`,
                status: String(r.status),
                priority: 'NORMAL',
                canonicalRef: `/hr/recruitment/requisitions/${Number(r.id)}`,
                allowedActions: ['APPROVE', 'REJECT'],
            });
        }
    }
    items.sort((a, b) => (b.ageDays ?? 0) - (a.ageDays ?? 0));
    const byDomain = {};
    for (const it of items)
        byDomain[it.domain] = (byDomain[it.domain] ?? 0) + 1;
    return { items, total: items.length, byDomain };
}
/**
 * Execute a governance decision through the canonical domain service. The
 * canonical service enforces the domain approval capability and the atomic
 * transition, so this method never mutates domain tables directly.
 */
export async function actOnApproval(actor, input) {
    assertManagementPermission(actor, 'management.approvals.act');
    const a = domainActor(actor);
    switch (input.domain) {
        case 'LEAVE':
            return input.action === 'APPROVE'
                ? await leave.approveLeaveRequest(a, input.id, input.notes)
                : await leave.rejectLeaveRequest(a, input.id, input.notes);
        case 'RECRUITMENT':
            return input.action === 'APPROVE'
                ? await requisitions.approveRequisition(a, input.id)
                : await requisitions.rejectRequisition(a, input.id, input.notes);
        default:
            throw new AppError(400, 'Unsupported approval domain');
    }
}
