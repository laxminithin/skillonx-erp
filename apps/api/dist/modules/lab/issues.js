import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertLabPermission, assertLabAccess, scopedLabIds } from './access.js';
import { auditFromActor } from './audit.js';
import { recordMovement } from './stock.js';
import { sqlDate } from '../lessonPlans/dates.js';
function today() { return new Date().toISOString().slice(0, 10); }
function shapeIssue(row) {
    const status = String(row.status);
    const expectedReturnDate = sqlDate(row.expected_return);
    const overdue = status === 'ISSUED' && expectedReturnDate != null && expectedReturnDate < today();
    return {
        id: Number(row.id),
        labId: Number(row.lab_id),
        labName: row.lab_name ?? null,
        itemKind: row.item_kind,
        assetId: row.asset_id ? Number(row.asset_id) : null,
        assetTag: row.asset_tag ?? null,
        stockItemId: row.stock_item_id ? Number(row.stock_item_id) : null,
        description: row.description ?? null,
        quantity: Number(row.quantity),
        recipientType: row.recipient_type,
        recipientFacultyId: row.recipient_faculty_id ? Number(row.recipient_faculty_id) : null,
        recipientStudentId: row.recipient_student_id ? Number(row.recipient_student_id) : null,
        recipientName: row.recipient_faculty_name ?? row.recipient_student_name ?? row.recipient_note ?? null,
        issueDate: row.issue_date,
        expectedReturn: expectedReturnDate,
        actualReturn: row.actual_return ?? null,
        conditionOut: row.condition_out ?? null,
        conditionIn: row.condition_in ?? null,
        status,
        overdue,
        remarks: row.remarks ?? null,
    };
}
function issueQuery(collegeId) {
    return db('lab_issues as i')
        .leftJoin('labs as l', 'l.id', 'i.lab_id')
        .leftJoin('lab_assets as a', 'a.id', 'i.asset_id')
        .leftJoin('faculty_users as f', 'f.id', 'i.recipient_faculty_id')
        .leftJoin('students as s', 's.id', 'i.recipient_student_id')
        .where('i.college_id', collegeId)
        .select('i.*', 'l.name as lab_name', 'a.asset_tag as asset_tag', 'f.name as recipient_faculty_name', 's.name as recipient_student_name');
}
export async function listIssues(actor, filters = {}) {
    assertLabPermission(actor, 'lab.view');
    const ids = await scopedLabIds(actor);
    if (ids !== 'ALL' && ids.length === 0)
        return [];
    let q = issueQuery(actor.collegeId).orderBy('i.issue_date', 'desc');
    if (ids !== 'ALL')
        q = q.whereIn('i.lab_id', ids);
    if (filters.labId)
        q = q.where('i.lab_id', filters.labId);
    if (filters.status)
        q = q.where('i.status', filters.status);
    if (filters.recipientType)
        q = q.where('i.recipient_type', filters.recipientType);
    if (filters.overdueOnly)
        q = q.where('i.status', 'ISSUED').whereNotNull('i.expected_return').where('i.expected_return', '<', today());
    const rows = await q;
    return rows.map(shapeIssue);
}
export async function createIssue(actor, input) {
    assertLabPermission(actor, 'lab.issue.manage');
    await assertLabAccess(actor, input.labId, 'operate');
    // Validate recipient identity strictly.
    if (input.recipientType === 'FACULTY') {
        if (!input.recipientFacultyId)
            throw new AppError(400, 'Faculty recipient required');
        const f = await db('faculty_users').where({ id: input.recipientFacultyId, college_id: actor.collegeId }).first();
        if (!f)
            throw new AppError(400, 'Faculty not found in this college');
    }
    else if (input.recipientType === 'STUDENT') {
        if (!input.recipientStudentId)
            throw new AppError(400, 'Student recipient required');
        const s = await db('students').where({ id: input.recipientStudentId, college_id: actor.collegeId }).first();
        if (!s)
            throw new AppError(400, 'Student not found in this college');
    }
    if (input.itemKind === 'ASSET') {
        if (!input.assetId)
            throw new AppError(400, 'Asset required');
        const asset = await db('lab_assets').where({ id: input.assetId, college_id: actor.collegeId }).first();
        if (!asset)
            throw new AppError(404, 'Asset not found');
        if (!['AVAILABLE', 'RESERVED'].includes(String(asset.operational_status))) {
            throw new AppError(400, `Asset is ${String(asset.operational_status).toLowerCase()} and cannot be issued`);
        }
    }
    if (input.itemKind === 'STOCK') {
        if (!input.stockItemId)
            throw new AppError(400, 'Stock item required');
    }
    const [id] = await db('lab_issues').insert({
        college_id: actor.collegeId, lab_id: input.labId, item_kind: input.itemKind,
        asset_id: input.assetId ?? null, stock_item_id: input.stockItemId ?? null,
        description: input.description ?? null, quantity: input.quantity ?? 1,
        recipient_type: input.recipientType, recipient_faculty_id: input.recipientFacultyId ?? null,
        recipient_student_id: input.recipientStudentId ?? null, recipient_note: input.recipientNote ?? null,
        issue_date: input.issueDate, expected_return: input.expectedReturn ?? null,
        condition_out: input.conditionOut ?? null, status: 'ISSUED', issuer_id: actor.facultyUserId,
        remarks: input.remarks ?? null,
    });
    // Side effects: mark asset IN_USE; decrement stock via a movement.
    if (input.itemKind === 'ASSET' && input.assetId) {
        await db('lab_assets').where({ id: input.assetId }).update({ operational_status: 'IN_USE', updated_at: db.fn.now() });
        await db('lab_asset_history').insert({
            college_id: actor.collegeId, asset_id: input.assetId, action: 'STATUS_CHANGE',
            from_status: 'AVAILABLE', to_status: 'IN_USE', actor_id: actor.facultyUserId, note: `Issued (issue #${Number(id)})`,
        });
    }
    if (input.itemKind === 'STOCK' && input.stockItemId) {
        await recordMovement(actor, input.stockItemId, { movementType: 'ISSUE', quantity: input.quantity ?? 1, reason: `Issue #${Number(id)}` });
    }
    await auditFromActor(actor, 'ISSUE_CREATE', 'lab_issue', Number(id), { after: input });
    const row = await issueQuery(actor.collegeId).where('i.id', Number(id)).first();
    return shapeIssue(row);
}
export async function returnIssue(actor, issueId, input) {
    assertLabPermission(actor, 'lab.issue.manage');
    const issue = await db('lab_issues').where({ id: issueId, college_id: actor.collegeId }).first();
    if (!issue)
        throw new AppError(404, 'Issue not found');
    if (String(issue.status) !== 'ISSUED')
        throw new AppError(400, 'This item is not currently issued');
    await assertLabAccess(actor, Number(issue.lab_id), 'operate');
    const finalStatus = input.status ?? 'RETURNED';
    await db('lab_issues').where({ id: issueId }).update({
        status: finalStatus, actual_return: input.actualReturn ?? today(),
        condition_in: input.conditionIn ?? null, remarks: input.remarks ?? issue.remarks, updated_at: db.fn.now(),
    });
    if (issue.item_kind === 'ASSET' && issue.asset_id) {
        if (finalStatus === 'RETURNED') {
            const toStatus = input.conditionIn === 'DAMAGED' ? 'FAULTY' : 'AVAILABLE';
            const patch = { operational_status: toStatus, updated_at: db.fn.now() };
            if (input.conditionIn)
                patch.condition = input.conditionIn;
            await db('lab_assets').where({ id: issue.asset_id }).update(patch);
            await db('lab_asset_history').insert({
                college_id: actor.collegeId, asset_id: Number(issue.asset_id), action: 'STATUS_CHANGE',
                from_status: 'IN_USE', to_status: toStatus, actor_id: actor.facultyUserId, note: `Returned (issue #${issueId})`,
            });
        }
        else {
            await db('lab_assets').where({ id: issue.asset_id }).update({ operational_status: 'LOST', updated_at: db.fn.now() });
            await db('lab_asset_history').insert({
                college_id: actor.collegeId, asset_id: Number(issue.asset_id), action: 'STATUS_CHANGE',
                to_status: 'LOST', actor_id: actor.facultyUserId, note: `Reported lost (issue #${issueId})`,
            });
        }
    }
    if (issue.item_kind === 'STOCK' && issue.stock_item_id && finalStatus === 'RETURNED') {
        await recordMovement(actor, Number(issue.stock_item_id), { movementType: 'RETURN', quantity: Number(issue.quantity), reason: `Return #${issueId}` });
    }
    await auditFromActor(actor, 'ISSUE_RETURN', 'lab_issue', issueId, { before: issue, after: input });
    const row = await issueQuery(actor.collegeId).where('i.id', issueId).first();
    return shapeIssue(row);
}
