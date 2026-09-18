import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertLabPermission, assertLabAccess, scopedLabIds } from './access.js';
import { auditFromActor } from './audit.js';
function shapeItem(row) {
    return {
        id: Number(row.id),
        labId: Number(row.lab_id),
        labName: row.lab_name ?? null,
        name: row.name,
        code: row.code ?? null,
        category: row.category,
        unit: row.unit,
        openingStock: Number(row.opening_stock),
        currentStock: Number(row.current_stock),
        minThreshold: Number(row.min_threshold),
        lowStock: Number(row.current_stock) <= Number(row.min_threshold),
        status: row.status,
    };
}
export async function listStock(actor, filters = {}) {
    assertLabPermission(actor, 'lab.view');
    const ids = await scopedLabIds(actor);
    if (ids !== 'ALL' && ids.length === 0)
        return [];
    let q = db('lab_stock_items as s')
        .leftJoin('labs as l', 'l.id', 's.lab_id')
        .where('s.college_id', actor.collegeId)
        .select('s.*', 'l.name as lab_name')
        .orderBy('s.name');
    if (ids !== 'ALL')
        q = q.whereIn('s.lab_id', ids);
    if (filters.labId)
        q = q.where('s.lab_id', filters.labId);
    if (filters.category)
        q = q.where('s.category', filters.category);
    if (filters.q)
        q = q.where((b) => b.whereILike('s.name', `%${filters.q}%`).orWhereILike('s.code', `%${filters.q}%`));
    if (filters.lowOnly)
        q = q.whereRaw('s.current_stock <= s.min_threshold');
    const rows = await q;
    return rows.map(shapeItem);
}
export async function createStockItem(actor, input) {
    assertLabPermission(actor, 'lab.stock.manage');
    await assertLabAccess(actor, input.labId, 'operate');
    const opening = input.openingStock ?? 0;
    const [id] = await db('lab_stock_items').insert({
        college_id: actor.collegeId, lab_id: input.labId, name: input.name, code: input.code ?? null,
        category: input.category ?? 'CONSUMABLE', unit: input.unit ?? 'NOS',
        opening_stock: opening, current_stock: opening, min_threshold: input.minThreshold ?? 0,
        created_by: actor.facultyUserId,
    });
    if (opening > 0) {
        await db('lab_stock_movements').insert({
            college_id: actor.collegeId, stock_item_id: Number(id), lab_id: input.labId,
            movement_type: 'RECEIPT', quantity: opening, balance_after: opening,
            reason: 'Opening stock', actor_id: actor.facultyUserId,
        });
    }
    await auditFromActor(actor, 'STOCK_ITEM_CREATE', 'lab_stock_item', Number(id), { after: input });
    const row = await db('lab_stock_items').where({ id: Number(id) }).first();
    return shapeItem(row);
}
const INCREASE = new Set(['RECEIPT', 'RETURN']);
const DECREASE = new Set(['ISSUE', 'CONSUMPTION', 'SCRAP', 'TRANSFER']);
export async function recordMovement(actor, itemId, input) {
    assertLabPermission(actor, 'lab.stock.manage');
    return db.transaction(async (trx) => {
        const item = await trx('lab_stock_items').where({ id: itemId, college_id: actor.collegeId }).forUpdate().first();
        if (!item)
            throw new AppError(404, 'Stock item not found');
        // Enforce assignment/department access to the item's lab.
        await assertLabAccess(actor, Number(item.lab_id), 'operate');
        const qty = Number(input.quantity);
        if (!(qty > 0))
            throw new AppError(400, 'Quantity must be positive');
        let balance = Number(item.current_stock);
        if (INCREASE.has(input.movementType))
            balance += qty;
        else if (DECREASE.has(input.movementType))
            balance -= qty;
        else if (input.movementType === 'ADJUSTMENT')
            balance = qty; // set absolute
        else
            throw new AppError(400, 'Unknown movement type');
        if (balance < 0)
            throw new AppError(400, 'Insufficient stock — movement would drive the balance negative');
        await trx('lab_stock_items').where({ id: itemId }).update({ current_stock: balance, updated_at: trx.fn.now() });
        const [movId] = await trx('lab_stock_movements').insert({
            college_id: actor.collegeId, stock_item_id: itemId, lab_id: Number(item.lab_id),
            movement_type: input.movementType, quantity: qty, balance_after: balance,
            to_lab_id: input.toLabId ?? null, reason: input.reason ?? null, reference: input.reference ?? null,
            actor_id: actor.facultyUserId,
        });
        await trx('lab_audit_log').insert({
            college_id: actor.collegeId, actor_id: actor.facultyUserId, action: 'STOCK_MOVEMENT',
            entity_type: 'lab_stock_item', entity_id: itemId,
            after_state: JSON.stringify({ movementType: input.movementType, quantity: qty, balanceAfter: balance }),
        });
        const updated = await trx('lab_stock_items').where({ id: itemId }).first();
        return { item: shapeItem(updated), movementId: Number(movId), balanceAfter: balance };
    });
}
export async function itemLedger(actor, itemId) {
    assertLabPermission(actor, 'lab.view');
    const item = await db('lab_stock_items').where({ id: itemId, college_id: actor.collegeId }).first();
    if (!item)
        throw new AppError(404, 'Stock item not found');
    const rows = await db('lab_stock_movements')
        .where({ college_id: actor.collegeId, stock_item_id: itemId })
        .orderBy('created_at', 'desc').limit(200);
    return {
        item: shapeItem(item),
        movements: rows.map((m) => ({
            id: Number(m.id), movementType: m.movement_type, quantity: Number(m.quantity),
            balanceAfter: Number(m.balance_after), reason: m.reason, reference: m.reference,
            actorId: m.actor_id ? Number(m.actor_id) : null, createdAt: m.created_at,
        })),
    };
}
