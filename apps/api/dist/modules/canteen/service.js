import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertCanteenPermission } from './access.js';
import { CANTEEN_CUSTOMER_TYPES, CANTEEN_PAYMENT_METHODS } from './types.js';
import { createIssue, createReturn } from '../procurement/service.js';
export const menuItemSchema = z.object({
    itemId: z.number().int().positive(),
    category: z.string().trim().min(1).max(64).optional(),
    price: z.number().positive(),
    isAvailable: z.boolean().optional(),
}).strict();
const orderLineSchema = z.object({ menuItemId: z.number().int().positive(), quantity: z.number().positive() }).strict();
export const createOrderSchema = z.object({
    counterStoreId: z.number().int().positive(),
    customerType: z.enum(CANTEEN_CUSTOMER_TYPES),
    customerStudentId: z.number().int().positive().optional().nullable(),
    customerFacultyId: z.number().int().positive().optional().nullable(),
    items: z.array(orderLineSchema).min(1).max(50),
}).strict();
export const payOrderSchema = z.object({ paymentMethod: z.enum(CANTEEN_PAYMENT_METHODS) }).strict();
export const cancelOrderSchema = z.object({ reason: z.string().trim().max(2000).optional().nullable() }).strict();
export const refundOrderSchema = z.object({ reason: z.string().trim().min(3).max(2000) }).strict();
export const settlementSchema = z.object({ counterStoreId: z.number().int().positive(), businessDate: z.string().trim().max(16) }).strict();
function n(value) { return Number(value ?? 0); }
function money(value) { return Number(value ?? 0).toFixed(2); }
function qty(value) { return Number(value ?? 0).toFixed(3); }
function shape(row) {
    return Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v]));
}
async function assertCollegeRow(trx, table, collegeId, id, notFoundMessage = 'Record not found') {
    const row = await trx(table).where({ id, college_id: collegeId }).first();
    if (!row)
        throw new AppError(404, notFoundMessage);
    return row;
}
async function nextOrderNo(trx, collegeId) {
    // Reuses the same per-college, per-day-agnostic sequence style as Procurement's
    // nextNo(), scoped locally to Canteen rather than sharing Procurement's sequence
    // table (a different numbering series, same convention).
    const year = new Date().getFullYear();
    const series = 'CAN';
    let seq = await trx('procurement_number_sequences').where({ college_id: collegeId, series, year }).forUpdate().first();
    if (!seq) {
        await trx('procurement_number_sequences').insert({ college_id: collegeId, series, year, last_number: 0 });
        seq = await trx('procurement_number_sequences').where({ college_id: collegeId, series, year }).forUpdate().first();
    }
    const next = n(seq.last_number) + 1;
    await trx('procurement_number_sequences').where({ id: seq.id }).update({ last_number: next, updated_at: trx.fn.now() });
    return `${series}-${year}-${String(next).padStart(5, '0')}`;
}
function toProcurementActor(actor) {
    return { facultyUserId: actor.facultyUserId, collegeId: actor.collegeId, departmentId: actor.departmentId, role: actor.role, name: actor.name };
}
export async function upsertMenuItem(actor, input) {
    assertCanteenPermission(actor, 'canteen.menu.manage');
    await assertCollegeRow(db, 'inventory_items', actor.collegeId, input.itemId, 'Item not found in the item master');
    await db('canteen_menu_items')
        .insert({ college_id: actor.collegeId, item_id: input.itemId, category: input.category ?? 'OTHER', price: money(input.price), is_available: input.isAvailable ?? true, created_by: actor.facultyUserId })
        .onConflict(['college_id', 'item_id'])
        .merge({ category: input.category ?? 'OTHER', price: money(input.price), is_available: input.isAvailable ?? true, updated_at: db.fn.now() });
    return listMenu(actor);
}
export async function listMenu(actor, opts = {}) {
    assertCanteenPermission(actor, 'canteen.order.view');
    let query = db('canteen_menu_items as m').join('inventory_items as i', 'i.id', 'm.item_id').where('m.college_id', actor.collegeId);
    if (opts.availableOnly)
        query = query.andWhere('m.is_available', true);
    const rows = await query.select('m.*', 'i.name as item_name', 'i.item_code').orderBy('i.name').limit(500);
    return rows.map(shape);
}
export async function createOrder(actor, input) {
    assertCanteenPermission(actor, 'canteen.order.create');
    const menuItemIds = input.items.map((it) => it.menuItemId);
    if (new Set(menuItemIds).size !== menuItemIds.length) {
        // Each menu item may appear once per order (consolidate quantity into one line).
        // This also keeps the refund path's issue-item matching (by item_id) unambiguous.
        throw new AppError(400, 'Duplicate menu item in order; consolidate quantity into a single line');
    }
    await assertCollegeRow(db, 'inventory_stores', actor.collegeId, input.counterStoreId, 'Counter store not found');
    if (input.customerType === 'STUDENT' && input.customerStudentId) {
        await assertCollegeRow(db, 'students', actor.collegeId, input.customerStudentId, 'Student not found');
    }
    if ((input.customerType === 'FACULTY' || input.customerType === 'STAFF') && input.customerFacultyId) {
        await assertCollegeRow(db, 'faculty_users', actor.collegeId, input.customerFacultyId, 'Faculty/staff record not found');
    }
    return db.transaction(async (trx) => {
        const orderNo = await nextOrderNo(trx, actor.collegeId);
        const [orderId] = await trx('canteen_orders').insert({
            college_id: actor.collegeId,
            order_no: orderNo,
            counter_store_id: input.counterStoreId,
            customer_type: input.customerType,
            customer_student_id: input.customerStudentId ?? null,
            customer_faculty_id: input.customerFacultyId ?? null,
            status: 'PENDING',
            total_amount: 0,
            created_by: actor.facultyUserId,
        });
        let total = 0;
        for (const line of input.items) {
            // Price is always resolved server-side from the current menu, never trusted from the client.
            const menuItem = await trx('canteen_menu_items').where({ id: line.menuItemId, college_id: actor.collegeId }).first();
            if (!menuItem)
                throw new AppError(404, 'Menu item not found');
            if (!menuItem.is_available)
                throw new AppError(400, `${line.menuItemId} is not currently available`);
            const unitPrice = n(menuItem.price);
            const lineTotal = unitPrice * line.quantity;
            total += lineTotal;
            await trx('canteen_order_items').insert({
                college_id: actor.collegeId,
                order_id: n(orderId),
                menu_item_id: line.menuItemId,
                item_id: n(menuItem.item_id),
                quantity: qty(line.quantity),
                unit_price: money(unitPrice),
                line_total: money(lineTotal),
            });
        }
        await trx('canteen_orders').where({ id: orderId }).update({ total_amount: money(total), updated_at: trx.fn.now() });
        return getOrder(actor, n(orderId), trx);
    });
}
export async function getOrder(actor, orderId, trx = db) {
    assertCanteenPermission(actor, 'canteen.order.view');
    const order = await trx('canteen_orders').where({ id: orderId, college_id: actor.collegeId }).first();
    if (!order)
        throw new AppError(404, 'Order not found');
    const items = await trx('canteen_order_items as oi').join('inventory_items as i', 'i.id', 'oi.item_id').where({ 'oi.college_id': actor.collegeId, order_id: orderId }).select('oi.*', 'i.name as item_name');
    return { ...shape(order), items: items.map(shape) };
}
export async function listOrders(actor, filters = {}) {
    assertCanteenPermission(actor, 'canteen.order.view');
    let query = db('canteen_orders').where({ college_id: actor.collegeId });
    if (filters.status)
        query = query.andWhere({ status: filters.status });
    if (filters.counterStoreId)
        query = query.andWhere({ counter_store_id: filters.counterStoreId });
    const rows = await query.orderBy('id', 'desc').limit(200);
    return rows.map(shape);
}
export async function payOrder(actor, orderId, input) {
    assertCanteenPermission(actor, 'canteen.order.create');
    return db.transaction(async (trx) => {
        const order = await trx('canteen_orders').where({ id: orderId, college_id: actor.collegeId }).forUpdate().first();
        if (!order)
            throw new AppError(404, 'Order not found');
        if (order.status !== 'PENDING')
            throw new AppError(400, `Order is ${order.status} and cannot be paid`);
        const items = await trx('canteen_order_items').where({ college_id: actor.collegeId, order_id: orderId });
        if (items.length === 0)
            throw new AppError(400, 'Order has no items');
        const customerLabel = order.customer_type === 'GUEST' ? 'Guest customer' : `${order.customer_type} counter sale`;
        const issueResult = await createIssue(toProcurementActor(actor), {
            storeId: n(order.counter_store_id),
            consumerModule: 'CANTEEN',
            recipientName: customerLabel,
            sourceEntityType: 'CANTEEN_ORDER',
            sourceEntityId: orderId,
            issueDate: new Date().toISOString().slice(0, 10),
            purpose: `Canteen order ${order.order_no}`,
            items: items.map((it) => ({ itemId: n(it.item_id), quantity: n(it.quantity) })),
        });
        const issueId = n(issueResult.issue.id);
        await trx('canteen_orders').where({ id: orderId }).update({
            status: 'PAID',
            payment_method: input.paymentMethod,
            issue_id: issueId,
            paid_at: trx.fn.now(),
            updated_at: trx.fn.now(),
        });
        return getOrder(actor, orderId, trx);
    });
}
export async function cancelOrder(actor, orderId, input) {
    assertCanteenPermission(actor, 'canteen.order.create');
    return db.transaction(async (trx) => {
        const order = await trx('canteen_orders').where({ id: orderId, college_id: actor.collegeId }).forUpdate().first();
        if (!order)
            throw new AppError(404, 'Order not found');
        if (order.status !== 'PENDING')
            throw new AppError(400, `Order is ${order.status} and cannot be cancelled`);
        await trx('canteen_orders').where({ id: orderId }).update({ status: 'CANCELLED', reason: input.reason ?? null, cancelled_at: trx.fn.now(), updated_at: trx.fn.now() });
        return getOrder(actor, orderId, trx);
    });
}
export async function refundOrder(actor, orderId, input) {
    assertCanteenPermission(actor, 'canteen.settlement.manage');
    return db.transaction(async (trx) => {
        const order = await trx('canteen_orders').where({ id: orderId, college_id: actor.collegeId }).forUpdate().first();
        if (!order)
            throw new AppError(404, 'Order not found');
        if (order.status !== 'PAID')
            throw new AppError(400, `Order is ${order.status} and cannot be refunded`);
        if (!order.issue_id)
            throw new AppError(500, 'Paid order is missing its stock issue reference');
        const orderItems = await trx('canteen_order_items').where({ college_id: actor.collegeId, order_id: orderId });
        const issueItems = await trx('inventory_stock_issue_items').where({ college_id: actor.collegeId, issue_id: n(order.issue_id) });
        const returnLines = orderItems.map((oi) => {
            const match = issueItems.find((ii) => n(ii.item_id) === n(oi.item_id));
            if (!match)
                throw new AppError(500, 'Could not resolve the original stock issue line for refund');
            return { issueItemId: n(match.id), quantity: n(oi.quantity) };
        });
        await createReturn(toProcurementActor(actor), {
            issueId: n(order.issue_id),
            returnDate: new Date().toISOString().slice(0, 10),
            remarks: `Canteen refund: ${input.reason}`,
            items: returnLines,
        });
        await trx('canteen_orders').where({ id: orderId }).update({ status: 'REFUNDED', reason: input.reason, refunded_at: trx.fn.now(), updated_at: trx.fn.now() });
        return getOrder(actor, orderId, trx);
    });
}
export async function generateDailySettlement(actor, input) {
    assertCanteenPermission(actor, 'canteen.settlement.manage');
    await assertCollegeRow(db, 'inventory_stores', actor.collegeId, input.counterStoreId, 'Counter store not found');
    const existing = await db('canteen_finance_handoffs').where({ college_id: actor.collegeId, counter_store_id: input.counterStoreId, business_date: input.businessDate }).first();
    if (existing)
        return { handoff: shape(existing), idempotent: true };
    const paidOrders = await db('canteen_orders')
        .where({ college_id: actor.collegeId, counter_store_id: input.counterStoreId, status: 'PAID' })
        .whereRaw('DATE(paid_at) = ?', [input.businessDate]);
    const totals = paidOrders.reduce((acc, o) => {
        acc.total += n(o.total_amount);
        if (o.payment_method === 'CASH')
            acc.cash += n(o.total_amount);
        else if (o.payment_method === 'CARD')
            acc.card += n(o.total_amount);
        else if (o.payment_method === 'UPI')
            acc.upi += n(o.total_amount);
        return acc;
    }, { total: 0, cash: 0, card: 0, upi: 0 });
    try {
        const [id] = await db('canteen_finance_handoffs').insert({
            college_id: actor.collegeId,
            counter_store_id: input.counterStoreId,
            business_date: input.businessDate,
            total_sales_amount: money(totals.total),
            cash_amount: money(totals.cash),
            card_amount: money(totals.card),
            upi_amount: money(totals.upi),
            order_count: paidOrders.length,
            status: 'PENDING_FINANCE',
            created_by: actor.facultyUserId,
        });
        return { handoff: shape((await db('canteen_finance_handoffs').where({ id }).first())), idempotent: false };
    }
    catch (err) {
        if (err?.code !== 'ER_DUP_ENTRY')
            throw err;
        const row = await db('canteen_finance_handoffs').where({ college_id: actor.collegeId, counter_store_id: input.counterStoreId, business_date: input.businessDate }).first();
        return { handoff: shape(row), idempotent: true };
    }
}
export async function listSettlements(actor, counterStoreId) {
    assertCanteenPermission(actor, 'canteen.reports.view');
    let query = db('canteen_finance_handoffs').where({ college_id: actor.collegeId });
    if (counterStoreId)
        query = query.andWhere({ counter_store_id: counterStoreId });
    return (await query.orderBy('business_date', 'desc').limit(200)).map(shape);
}
export async function dashboard(actor) {
    assertCanteenPermission(actor, 'canteen.reports.view');
    const [pending, paidToday, menuCount] = await Promise.all([
        db('canteen_orders').where({ college_id: actor.collegeId, status: 'PENDING' }).count('id as c').first(),
        db('canteen_orders').where({ college_id: actor.collegeId, status: 'PAID' }).whereRaw('DATE(paid_at) = CURDATE()').sum({ total: 'total_amount' }).count({ orders: 'id' }).first(),
        db('canteen_menu_items').where({ college_id: actor.collegeId, is_available: true }).count('id as c').first(),
    ]);
    return {
        pendingOrders: n(pending?.c),
        todaySales: n(paidToday?.total),
        todayOrders: n(paidToday?.orders),
        availableMenuItems: n(menuCount?.c),
    };
}
