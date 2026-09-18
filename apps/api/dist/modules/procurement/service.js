import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertDepartmentScope, assertProcurementPermission } from './access.js';
const itemTypes = ['CONSUMABLE', 'NON_CONSUMABLE', 'SPARE', 'EQUIPMENT', 'ASSET_TRACKABLE'];
const consumerModules = ['LAB', 'HOSTEL', 'TRANSPORT', 'MAINTENANCE', 'DEPARTMENT', 'ADMINISTRATION', 'IT', 'OTHER'];
export const unitSchema = z.object({ code: z.string().trim().min(1).max(32), name: z.string().trim().min(1).max(96) }).strict();
export const categorySchema = z.object({ code: z.string().trim().min(1).max(64), name: z.string().trim().min(1).max(128) }).strict();
export const storeSchema = z.object({
    code: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(160),
    storeType: z.string().trim().max(64).optional(),
    departmentId: z.number().int().positive().optional().nullable(),
    responsibleFacultyId: z.number().int().positive().optional().nullable(),
}).strict();
export const itemSchema = z.object({
    itemCode: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(255),
    description: z.string().trim().max(4000).optional().nullable(),
    categoryId: z.number().int().positive().optional().nullable(),
    subcategory: z.string().trim().max(128).optional().nullable(),
    unitId: z.number().int().positive(),
    itemType: z.enum(itemTypes).optional(),
    reorderLevel: z.number().nonnegative().optional(),
    preferredStoreId: z.number().int().positive().optional().nullable(),
    taxClassification: z.string().trim().max(96).optional().nullable(),
    manufacturer: z.string().trim().max(160).optional().nullable(),
    brand: z.string().trim().max(160).optional().nullable(),
    specifications: z.string().trim().max(4000).optional().nullable(),
}).strict();
const lineSchema = z.object({
    itemId: z.number().int().positive(),
    quantity: z.number().positive(),
    rate: z.number().nonnegative().optional(),
    estimatedRate: z.number().nonnegative().optional(),
    taxAmount: z.number().nonnegative().optional(),
    discountAmount: z.number().nonnegative().optional(),
    specifications: z.string().trim().max(4000).optional().nullable(),
}).strict();
export const indentSchema = z.object({
    departmentId: z.number().int().positive().optional().nullable(),
    consumerModule: z.enum(consumerModules).optional(),
    sourceEntityType: z.string().trim().max(96).optional().nullable(),
    sourceEntityId: z.number().int().positive().optional().nullable(),
    deliveryStoreId: z.number().int().positive().optional().nullable(),
    requiredDate: z.string().trim().max(16).optional().nullable(),
    urgency: z.enum(['LOW', 'NORMAL', 'URGENT', 'CRITICAL']).optional(),
    purpose: z.string().trim().max(4000).optional().nullable(),
    items: z.array(lineSchema).min(1).max(100),
}).strict();
export const decisionSchema = z.object({ action: z.enum(['APPROVE', 'REJECT', 'RETURN']), comments: z.string().trim().max(2000).optional().nullable() }).strict();
export const vendorSchema = z.object({
    vendorCode: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(255),
    address: z.string().trim().max(4000).optional().nullable(),
    contactPerson: z.string().trim().max(160).optional().nullable(),
    phone: z.string().trim().max(64).optional().nullable(),
    email: z.string().trim().email().max(255).optional().nullable(),
    taxIdentifier: z.string().trim().max(96).optional().nullable(),
    bankDetails: z.string().trim().max(4000).optional().nullable(),
    categories: z.array(z.string().trim().min(1).max(96)).optional(),
    notes: z.string().trim().max(4000).optional().nullable(),
}).strict();
export const rfqSchema = z.object({
    indentId: z.number().int().positive().optional().nullable(),
    dueDate: z.string().trim().max(16).optional().nullable(),
    terms: z.string().trim().max(4000).optional().nullable(),
    vendorIds: z.array(z.number().int().positive()).min(1).max(50),
}).strict();
export const quotationSchema = z.object({
    vendorId: z.number().int().positive(),
    quotationNo: z.string().trim().max(96).optional().nullable(),
    quotationDate: z.string().trim().max(16).optional().nullable(),
    validUntil: z.string().trim().max(16).optional().nullable(),
    deliveryPeriod: z.string().trim().max(96).optional().nullable(),
    warranty: z.string().trim().max(2000).optional().nullable(),
    paymentTerms: z.string().trim().max(2000).optional().nullable(),
    freightCharges: z.number().nonnegative().optional(),
    otherCharges: z.number().nonnegative().optional(),
    items: z.array(lineSchema).min(1).max(100),
}).strict();
export const selectQuotationSchema = z.object({ justification: z.string().trim().min(3).max(2000) }).strict();
export const poSchema = z.object({
    vendorId: z.number().int().positive(),
    indentId: z.number().int().positive().optional().nullable(),
    rfqId: z.number().int().positive().optional().nullable(),
    quotationId: z.number().int().positive().optional().nullable(),
    deliveryStoreId: z.number().int().positive().optional().nullable(),
    deliveryTerms: z.string().trim().max(2000).optional().nullable(),
    paymentTerms: z.string().trim().max(2000).optional().nullable(),
    expectedDate: z.string().trim().max(16).optional().nullable(),
    items: z.array(lineSchema.extend({ rate: z.number().nonnegative() })).min(1).max(100),
}).strict();
export const grnSchema = z.object({
    deliveryReference: z.string().trim().max(128).optional().nullable(),
    invoiceReference: z.string().trim().max(128).optional().nullable(),
    receivedDate: z.string().trim().max(16),
    receivingStoreId: z.number().int().positive(),
    inspectionStatus: z.enum(['ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED', 'PENDING_INSPECTION']).optional(),
    remarks: z.string().trim().max(2000).optional().nullable(),
    items: z.array(z.object({
        poItemId: z.number().int().positive(),
        receivedQuantity: z.number().positive(),
        acceptedQuantity: z.number().nonnegative(),
        rejectedQuantity: z.number().nonnegative().optional(),
        rejectionReason: z.string().trim().max(1000).optional().nullable(),
    }).strict()).min(1).max(100),
}).strict();
export const issueSchema = z.object({
    storeId: z.number().int().positive(),
    consumerModule: z.enum(consumerModules),
    departmentId: z.number().int().positive().optional().nullable(),
    recipientName: z.string().trim().max(160).optional().nullable(),
    sourceEntityType: z.string().trim().max(96).optional().nullable(),
    sourceEntityId: z.number().int().positive().optional().nullable(),
    purpose: z.string().trim().max(2000).optional().nullable(),
    issueDate: z.string().trim().max(16),
    items: z.array(lineSchema).min(1).max(100),
}).strict();
export const returnSchema = z.object({
    issueId: z.number().int().positive(),
    returnDate: z.string().trim().max(16),
    remarks: z.string().trim().max(2000).optional().nullable(),
    items: z.array(z.object({ issueItemId: z.number().int().positive(), quantity: z.number().positive() }).strict()).min(1).max(100),
}).strict();
export const transferSchema = z.object({
    fromStoreId: z.number().int().positive(),
    toStoreId: z.number().int().positive(),
    transferDate: z.string().trim().max(16),
    remarks: z.string().trim().max(2000).optional().nullable(),
    items: z.array(lineSchema).min(1).max(100),
}).strict();
export const adjustmentSchema = z.object({
    storeId: z.number().int().positive(),
    itemId: z.number().int().positive(),
    direction: z.enum(['IN', 'OUT']),
    quantity: z.number().positive(),
    reason: z.string().trim().min(3).max(2000),
}).strict();
export const financeHandoffSchema = z.object({ invoiceReference: z.string().trim().max(128).optional().nullable(), idempotencyKey: z.string().trim().max(191).optional().nullable() }).strict();
function n(value) { return Number(value ?? 0); }
function money(value) { return Number(value ?? 0).toFixed(2); }
function qty(value) { return Number(value ?? 0).toFixed(3); }
function normalizeName(name) { return name.trim().replace(/\s+/g, ' ').toLowerCase(); }
async function audit(actor, action, entityType, entityId, afterState, trx = db) {
    if (!(await trx.schema.hasTable('procurement_audit_log')))
        return;
    await trx('procurement_audit_log').insert({
        college_id: actor.collegeId,
        actor_id: actor.facultyUserId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        after_state: afterState ? JSON.stringify(afterState) : null,
    });
}
async function nextNo(trx, collegeId, series) {
    const year = new Date().getFullYear();
    let seq = await trx('procurement_number_sequences').where({ college_id: collegeId, series, year }).forUpdate().first();
    if (!seq) {
        await trx('procurement_number_sequences').insert({ college_id: collegeId, series, year, last_number: 0 });
        seq = await trx('procurement_number_sequences').where({ college_id: collegeId, series, year }).forUpdate().first();
    }
    const next = n(seq.last_number) + 1;
    await trx('procurement_number_sequences').where({ id: seq.id }).update({ last_number: next, updated_at: trx.fn.now() });
    return `${series}-${year}-${String(next).padStart(5, '0')}`;
}
async function assertCollegeRow(trx, table, collegeId, id) {
    const row = await trx(table).where({ id, college_id: collegeId }).first();
    if (!row)
        throw new AppError(404, 'Record not found');
    return row;
}
async function assertStoreScope(trx, actor, storeId, mutate = false) {
    const store = await assertCollegeRow(trx, 'inventory_stores', actor.collegeId, storeId);
    if (!store.is_active)
        throw new AppError(400, 'Store is inactive');
    if (!mutate)
        return store;
    if (['STORE_KEEPER', 'FACILITIES_OFFICER'].includes(actor.role) && store.responsible_faculty_id && n(store.responsible_faculty_id) !== actor.facultyUserId) {
        throw new AppError(403, 'This store is outside your assignment scope');
    }
    return store;
}
async function balanceForUpdate(trx, collegeId, itemId, storeId) {
    await trx('inventory_stock_balances').insert({ college_id: collegeId, item_id: itemId, store_id: storeId, quantity: 0 }).onConflict(['college_id', 'item_id', 'store_id']).ignore();
    const row = await trx('inventory_stock_balances').where({ college_id: collegeId, item_id: itemId, store_id: storeId }).forUpdate().first();
    if (!row)
        throw new AppError(500, 'Stock balance unavailable');
    return row;
}
async function postStock(trx, actor, input) {
    if (!(input.quantity > 0))
        throw new AppError(400, 'Quantity must be positive');
    await assertCollegeRow(trx, 'inventory_items', actor.collegeId, input.itemId);
    await assertStoreScope(trx, actor, input.storeId, true);
    const bal = await balanceForUpdate(trx, actor.collegeId, input.itemId, input.storeId);
    const sign = ['PURCHASE_RECEIPT', 'RETURN', 'TRANSFER_IN', 'ADJUSTMENT_IN', 'OPENING'].includes(input.movementType) ? 1 : -1;
    const next = n(bal.quantity) + sign * input.quantity;
    if (next < -0.0001)
        throw new AppError(400, 'Insufficient stock');
    await trx('inventory_stock_balances').where({ id: bal.id }).update({ quantity: qty(next), updated_at: trx.fn.now() });
    await trx('inventory_stock_ledger').insert({
        college_id: actor.collegeId,
        item_id: input.itemId,
        store_id: input.storeId,
        movement_type: input.movementType,
        quantity: qty(input.quantity),
        balance_after: qty(next),
        source_type: input.sourceType,
        source_id: input.sourceId ?? null,
        source_key: input.sourceKey ?? null,
        actor_id: actor.facultyUserId,
        remarks: input.remarks ?? null,
    });
    return next;
}
function shape(row) {
    return Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v]));
}
export async function dashboard(actor) {
    assertProcurementPermission(actor, 'procurement.analytics.view');
    const [items, lowStock, indents, rfqs, pos, grns, movements, handoffs] = await Promise.all([
        db('inventory_items').where({ college_id: actor.collegeId, is_active: true }).count('id as c').first(),
        db('inventory_stock_balances as b').join('inventory_items as i', 'i.id', 'b.item_id').where('b.college_id', actor.collegeId).whereRaw('b.quantity <= i.reorder_level').count('b.id as c').first(),
        db('procurement_indents').where({ college_id: actor.collegeId }).whereIn('status', ['SUBMITTED', 'RETURNED']).count('id as c').first(),
        db('procurement_rfqs').where({ college_id: actor.collegeId, status: 'ISSUED' }).count('id as c').first(),
        db('procurement_purchase_orders').where({ college_id: actor.collegeId }).whereIn('status', ['ISSUED', 'PARTIALLY_RECEIVED']).count('id as c').first(),
        db('procurement_grns').where({ college_id: actor.collegeId, inspection_status: 'PENDING_INSPECTION' }).count('id as c').first(),
        db('inventory_stock_ledger as l').join('inventory_items as i', 'i.id', 'l.item_id').join('inventory_stores as s', 's.id', 'l.store_id').where('l.college_id', actor.collegeId).select('l.*', 'i.name as item_name', 's.name as store_name').orderBy('l.id', 'desc').limit(10),
        db('procurement_finance_handoffs').where({ college_id: actor.collegeId, status: 'PENDING_FINANCE' }).count('id as c').first(),
    ]);
    return {
        metrics: {
            activeItems: n(items?.c),
            lowStock: n(lowStock?.c),
            pendingIndents: n(indents?.c),
            openRfqs: n(rfqs?.c),
            posAwaitingDelivery: n(pos?.c),
            grnsPendingInspection: n(grns?.c),
            financeHandoffsPending: n(handoffs?.c),
        },
        recentMovements: movements.map(shape),
    };
}
export async function listMasters(actor) {
    assertProcurementPermission(actor, 'inventory.view');
    const [units, categories, stores, items, vendors] = await Promise.all([
        db('inventory_units').where({ college_id: actor.collegeId }).orderBy('code'),
        db('inventory_item_categories').where({ college_id: actor.collegeId }).orderBy('name'),
        db('inventory_stores').where({ college_id: actor.collegeId }).orderBy('name'),
        db('inventory_items as i').leftJoin('inventory_units as u', 'u.id', 'i.unit_id').leftJoin('inventory_item_categories as c', 'c.id', 'i.category_id').where('i.college_id', actor.collegeId).select('i.*', 'u.code as unit_code', 'c.name as category_name').orderBy('i.name').limit(200),
        db('procurement_vendors').where({ college_id: actor.collegeId }).select('id', 'vendor_code', 'name', 'contact_person', 'phone', 'email', 'tax_identifier', 'verification_status', 'is_active', 'rating').orderBy('name').limit(200),
    ]);
    return { units: units.map(shape), categories: categories.map(shape), stores: stores.map(shape), items: items.map(shape), vendors: vendors.map(shape) };
}
export async function upsertUnit(actor, input) {
    assertProcurementPermission(actor, 'inventory.master.manage');
    await db('inventory_units').insert({ college_id: actor.collegeId, code: input.code.toUpperCase(), name: input.name }).onConflict(['college_id', 'code']).merge({ name: input.name, is_active: true, updated_at: db.fn.now() });
    return listMasters(actor);
}
export async function upsertCategory(actor, input) {
    assertProcurementPermission(actor, 'inventory.master.manage');
    await db('inventory_item_categories').insert({ college_id: actor.collegeId, code: input.code.toUpperCase(), name: input.name }).onConflict(['college_id', 'code']).merge({ name: input.name, is_active: true, updated_at: db.fn.now() });
    return listMasters(actor);
}
export async function createStore(actor, input) {
    assertProcurementPermission(actor, 'inventory.master.manage');
    if (input.departmentId)
        assertDepartmentScope(actor, input.departmentId);
    const [id] = await db('inventory_stores').insert({
        college_id: actor.collegeId,
        code: input.code.toUpperCase(),
        name: input.name,
        store_type: input.storeType ?? 'CENTRAL',
        department_id: input.departmentId ?? null,
        responsible_faculty_id: input.responsibleFacultyId ?? null,
    });
    await audit(actor, 'STORE_CREATE', 'inventory_store', n(id), input);
    return listMasters(actor);
}
export async function createItem(actor, input) {
    assertProcurementPermission(actor, 'inventory.master.manage');
    await assertCollegeRow(db, 'inventory_units', actor.collegeId, input.unitId);
    if (input.categoryId)
        await assertCollegeRow(db, 'inventory_item_categories', actor.collegeId, input.categoryId);
    if (input.preferredStoreId)
        await assertStoreScope(db, actor, input.preferredStoreId);
    const [id] = await db('inventory_items').insert({
        college_id: actor.collegeId,
        item_code: input.itemCode.toUpperCase(),
        name: input.name,
        description: input.description ?? null,
        category_id: input.categoryId ?? null,
        subcategory: input.subcategory ?? null,
        unit_id: input.unitId,
        item_type: input.itemType ?? 'CONSUMABLE',
        reorder_level: qty(input.reorderLevel ?? 0),
        preferred_store_id: input.preferredStoreId ?? null,
        tax_classification: input.taxClassification ?? null,
        manufacturer: input.manufacturer ?? null,
        brand: input.brand ?? null,
        specifications: input.specifications ?? null,
    });
    await audit(actor, 'ITEM_CREATE', 'inventory_item', n(id), input);
    return listMasters(actor);
}
export async function createVendor(actor, input) {
    assertProcurementPermission(actor, 'procurement.vendor.manage');
    const [id] = await db('procurement_vendors').insert({
        college_id: actor.collegeId,
        vendor_code: input.vendorCode.toUpperCase(),
        name: input.name,
        normalized_name: normalizeName(input.name),
        address: input.address ?? null,
        contact_person: input.contactPerson ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        tax_identifier: input.taxIdentifier || null,
        bank_details: input.bankDetails ?? null,
        categories: input.categories ? JSON.stringify(input.categories) : null,
        notes: input.notes ?? null,
    });
    await audit(actor, 'VENDOR_CREATE', 'procurement_vendor', n(id), input);
    return listMasters(actor);
}
export async function createIndent(actor, input) {
    assertProcurementPermission(actor, 'procurement.indent.create');
    const departmentId = input.departmentId ?? actor.departmentId;
    assertDepartmentScope(actor, departmentId);
    if (input.deliveryStoreId)
        await assertStoreScope(db, actor, input.deliveryStoreId);
    return db.transaction(async (trx) => {
        const indentNo = await nextNo(trx, actor.collegeId, 'IND');
        const estimatedTotal = input.items.reduce((sum, it) => sum + it.quantity * (it.estimatedRate ?? it.rate ?? 0), 0);
        const [id] = await trx('procurement_indents').insert({
            college_id: actor.collegeId,
            indent_no: indentNo,
            requester_id: actor.facultyUserId,
            department_id: departmentId ?? null,
            consumer_module: input.consumerModule ?? 'DEPARTMENT',
            source_entity_type: input.sourceEntityType ?? null,
            source_entity_id: input.sourceEntityId ?? null,
            delivery_store_id: input.deliveryStoreId ?? null,
            required_date: input.requiredDate ?? null,
            urgency: input.urgency ?? 'NORMAL',
            status: 'SUBMITTED',
            purpose: input.purpose ?? null,
            estimated_total: money(estimatedTotal),
        });
        for (const it of input.items) {
            await assertCollegeRow(trx, 'inventory_items', actor.collegeId, it.itemId);
            await trx('procurement_indent_items').insert({ college_id: actor.collegeId, indent_id: id, item_id: it.itemId, quantity: qty(it.quantity), estimated_rate: it.estimatedRate ?? it.rate ?? null, specifications: it.specifications ?? null });
        }
        await audit(actor, 'INDENT_SUBMIT', 'procurement_indent', n(id), input, trx);
        return getIndent(actor, n(id), trx);
    });
}
export async function getIndent(actor, id, trx = db) {
    assertProcurementPermission(actor, 'procurement.view');
    const row = await trx('procurement_indents').where({ id, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Indent not found');
    assertDepartmentScope(actor, row.department_id ? n(row.department_id) : null);
    const items = await trx('procurement_indent_items as ii').join('inventory_items as i', 'i.id', 'ii.item_id').where({ 'ii.college_id': actor.collegeId, indent_id: id }).select('ii.*', 'i.name as item_name', 'i.item_code');
    return { ...shape(row), items: items.map(shape) };
}
export async function listIndents(actor) {
    assertProcurementPermission(actor, 'procurement.view');
    let q = db('procurement_indents').where({ college_id: actor.collegeId }).orderBy('id', 'desc').limit(100);
    if (actor.role === 'HOD' && actor.departmentId)
        q = q.where('department_id', actor.departmentId);
    else if (!['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN', 'PROCUREMENT_OFFICER', 'ACCOUNTANT'].includes(actor.role))
        q = q.where('requester_id', actor.facultyUserId);
    return { indents: (await q).map(shape) };
}
export async function decideIndent(actor, id, input) {
    assertProcurementPermission(actor, 'procurement.indent.approve');
    return db.transaction(async (trx) => {
        const row = await trx('procurement_indents').where({ id, college_id: actor.collegeId }).forUpdate().first();
        if (!row)
            throw new AppError(404, 'Indent not found');
        assertDepartmentScope(actor, row.department_id ? n(row.department_id) : null);
        if (n(row.requester_id) === actor.facultyUserId)
            throw new AppError(403, 'Requester cannot approve own indent');
        if (!['SUBMITTED', 'RETURNED'].includes(row.status))
            throw new AppError(400, 'Indent is not pending approval');
        const status = input.action === 'APPROVE' ? 'APPROVED' : input.action === 'REJECT' ? 'REJECTED' : 'RETURNED';
        await trx('procurement_indents').where({ id }).update({ status, approved_by: status === 'APPROVED' ? actor.facultyUserId : null, approved_at: status === 'APPROVED' ? trx.fn.now() : null, last_decision_comment: input.comments ?? null, updated_at: trx.fn.now() });
        await trx('procurement_approvals').insert({ college_id: actor.collegeId, indent_id: id, action: input.action, actor_id: actor.facultyUserId, comments: input.comments ?? null });
        await audit(actor, `INDENT_${input.action}`, 'procurement_indent', id, input, trx);
        return getIndent(actor, id, trx);
    });
}
export async function createRfq(actor, input) {
    assertProcurementPermission(actor, 'procurement.rfq.manage');
    if (input.indentId) {
        const indent = await assertCollegeRow(db, 'procurement_indents', actor.collegeId, input.indentId);
        if (indent.status !== 'APPROVED')
            throw new AppError(400, 'RFQ requires an approved indent');
    }
    return db.transaction(async (trx) => {
        const rfqNo = await nextNo(trx, actor.collegeId, 'RFQ');
        const [id] = await trx('procurement_rfqs').insert({ college_id: actor.collegeId, rfq_no: rfqNo, indent_id: input.indentId ?? null, due_date: input.dueDate ?? null, terms: input.terms ?? null, created_by: actor.facultyUserId });
        for (const vendorId of input.vendorIds) {
            await assertCollegeRow(trx, 'procurement_vendors', actor.collegeId, vendorId);
            await trx('procurement_rfq_vendors').insert({ college_id: actor.collegeId, rfq_id: id, vendor_id: vendorId }).onConflict(['rfq_id', 'vendor_id']).ignore();
        }
        await audit(actor, 'RFQ_CREATE', 'procurement_rfq', n(id), input, trx);
        return { rfq: shape((await trx('procurement_rfqs').where({ id }).first())) };
    });
}
export async function issueRfq(actor, id) {
    assertProcurementPermission(actor, 'procurement.rfq.manage');
    const count = await db('procurement_rfq_vendors').where({ college_id: actor.collegeId, rfq_id: id }).count('id as c').first();
    if (!n(count?.c))
        throw new AppError(400, 'RFQ needs at least one vendor');
    await db('procurement_rfqs').where({ id, college_id: actor.collegeId }).update({ status: 'ISSUED', updated_at: db.fn.now() });
    await audit(actor, 'RFQ_ISSUE', 'procurement_rfq', id);
    return getRfqComparison(actor, id);
}
export async function recordQuotation(actor, rfqId, input) {
    assertProcurementPermission(actor, 'procurement.quotation.manage');
    await assertCollegeRow(db, 'procurement_rfqs', actor.collegeId, rfqId);
    await assertCollegeRow(db, 'procurement_vendors', actor.collegeId, input.vendorId);
    return db.transaction(async (trx) => {
        const totalLines = input.items.reduce((sum, it) => sum + it.quantity * (it.rate ?? 0) + (it.taxAmount ?? 0) - (it.discountAmount ?? 0), 0);
        const total = totalLines + (input.freightCharges ?? 0) + (input.otherCharges ?? 0);
        const [id] = await trx('procurement_quotations').insert({
            college_id: actor.collegeId, rfq_id: rfqId, vendor_id: input.vendorId, quotation_no: input.quotationNo ?? null,
            quotation_date: input.quotationDate ?? null, valid_until: input.validUntil ?? null, delivery_period: input.deliveryPeriod ?? null,
            warranty: input.warranty ?? null, payment_terms: input.paymentTerms ?? null, freight_charges: money(input.freightCharges ?? 0),
            other_charges: money(input.otherCharges ?? 0), total_amount: money(total),
        });
        for (const it of input.items) {
            await assertCollegeRow(trx, 'inventory_items', actor.collegeId, it.itemId);
            const lineTotal = it.quantity * (it.rate ?? 0) + (it.taxAmount ?? 0) - (it.discountAmount ?? 0);
            await trx('procurement_quotation_items').insert({ college_id: actor.collegeId, quotation_id: id, item_id: it.itemId, quantity: qty(it.quantity), rate: money(it.rate ?? 0), tax_amount: money(it.taxAmount ?? 0), discount_amount: money(it.discountAmount ?? 0), line_total: money(lineTotal), compliance_notes: it.specifications ?? null });
        }
        await audit(actor, 'QUOTATION_RECORD', 'procurement_quotation', n(id), input, trx);
        return getRfqComparison(actor, rfqId, trx);
    });
}
export async function selectQuotation(actor, rfqId, quotationId, input) {
    assertProcurementPermission(actor, 'procurement.quotation.manage');
    return db.transaction(async (trx) => {
        const q = await trx('procurement_quotations').where({ id: quotationId, rfq_id: rfqId, college_id: actor.collegeId }).forUpdate().first();
        if (!q)
            throw new AppError(404, 'Quotation not found');
        await trx('procurement_quotations').where({ rfq_id: rfqId, college_id: actor.collegeId }).update({ is_selected: false });
        await trx('procurement_quotations').where({ id: quotationId }).update({ is_selected: true, selection_justification: input.justification, selected_by: actor.facultyUserId, selected_at: trx.fn.now(), updated_at: trx.fn.now() });
        await audit(actor, 'QUOTATION_SELECT', 'procurement_quotation', quotationId, input, trx);
        return getRfqComparison(actor, rfqId, trx);
    });
}
export async function getRfqComparison(actor, rfqId, trx = db) {
    assertProcurementPermission(actor, 'procurement.view');
    const rfq = await trx('procurement_rfqs').where({ id: rfqId, college_id: actor.collegeId }).first();
    if (!rfq)
        throw new AppError(404, 'RFQ not found');
    const quotations = await trx('procurement_quotations as q').join('procurement_vendors as v', 'v.id', 'q.vendor_id').where({ 'q.college_id': actor.collegeId, rfq_id: rfqId }).select('q.*', 'v.name as vendor_name').orderBy('q.total_amount');
    return { rfq: shape(rfq), quotations: quotations.map(shape) };
}
export async function createPo(actor, input) {
    assertProcurementPermission(actor, 'procurement.po.create');
    await assertCollegeRow(db, 'procurement_vendors', actor.collegeId, input.vendorId);
    if (input.deliveryStoreId)
        await assertStoreScope(db, actor, input.deliveryStoreId);
    return db.transaction(async (trx) => {
        const poNo = await nextNo(trx, actor.collegeId, 'PO');
        const total = input.items.reduce((sum, it) => sum + it.quantity * it.rate + (it.taxAmount ?? 0) - (it.discountAmount ?? 0), 0);
        const [id] = await trx('procurement_purchase_orders').insert({
            college_id: actor.collegeId, po_no: poNo, vendor_id: input.vendorId, indent_id: input.indentId ?? null,
            rfq_id: input.rfqId ?? null, quotation_id: input.quotationId ?? null, delivery_store_id: input.deliveryStoreId ?? null,
            total_amount: money(total), delivery_terms: input.deliveryTerms ?? null, payment_terms: input.paymentTerms ?? null, expected_date: input.expectedDate ?? null,
        });
        for (const it of input.items) {
            await assertCollegeRow(trx, 'inventory_items', actor.collegeId, it.itemId);
            const lineTotal = it.quantity * it.rate + (it.taxAmount ?? 0) - (it.discountAmount ?? 0);
            await trx('procurement_purchase_order_items').insert({ college_id: actor.collegeId, po_id: id, item_id: it.itemId, quantity_ordered: qty(it.quantity), rate: money(it.rate), tax_amount: money(it.taxAmount ?? 0), discount_amount: money(it.discountAmount ?? 0), line_total: money(lineTotal) });
        }
        await audit(actor, 'PO_CREATE', 'procurement_purchase_order', n(id), input, trx);
        return getPo(actor, n(id), trx);
    });
}
export async function transitionPo(actor, id, action, reason) {
    if (action === 'approve')
        assertProcurementPermission(actor, 'procurement.po.approve');
    else
        assertProcurementPermission(actor, 'procurement.po.create');
    return db.transaction(async (trx) => {
        const po = await trx('procurement_purchase_orders').where({ id, college_id: actor.collegeId }).forUpdate().first();
        if (!po)
            throw new AppError(404, 'PO not found');
        const current = String(po.status);
        const next = action === 'approve' && current === 'DRAFT' ? 'APPROVED' : action === 'issue' && current === 'APPROVED' ? 'ISSUED' : action === 'cancel' && !['FULLY_RECEIVED', 'CLOSED', 'CANCELLED'].includes(current) ? 'CANCELLED' : null;
        if (!next)
            throw new AppError(400, 'Invalid PO state transition');
        await trx('procurement_purchase_orders').where({ id }).update({
            status: next,
            approved_by: next === 'APPROVED' ? actor.facultyUserId : po.approved_by,
            approved_at: next === 'APPROVED' ? trx.fn.now() : po.approved_at,
            issued_by: next === 'ISSUED' ? actor.facultyUserId : po.issued_by,
            issued_at: next === 'ISSUED' ? trx.fn.now() : po.issued_at,
            cancel_reason: next === 'CANCELLED' ? reason ?? null : po.cancel_reason,
            updated_at: trx.fn.now(),
        });
        await audit(actor, `PO_${action.toUpperCase()}`, 'procurement_purchase_order', id, { reason }, trx);
        return getPo(actor, id, trx);
    });
}
export async function getPo(actor, id, trx = db) {
    assertProcurementPermission(actor, 'procurement.view');
    const po = await trx('procurement_purchase_orders as po').join('procurement_vendors as v', 'v.id', 'po.vendor_id').where({ 'po.id': id, 'po.college_id': actor.collegeId }).select('po.*', 'v.name as vendor_name').first();
    if (!po)
        throw new AppError(404, 'PO not found');
    const items = await trx('procurement_purchase_order_items as pi').join('inventory_items as i', 'i.id', 'pi.item_id').where({ 'pi.college_id': actor.collegeId, po_id: id }).select('pi.*', 'i.name as item_name', 'i.item_code');
    return { ...shape(po), items: items.map(shape) };
}
export async function listPos(actor) {
    assertProcurementPermission(actor, 'procurement.view');
    const rows = await db('procurement_purchase_orders as po').join('procurement_vendors as v', 'v.id', 'po.vendor_id').where('po.college_id', actor.collegeId).select('po.*', 'v.name as vendor_name').orderBy('po.id', 'desc').limit(100);
    return { purchaseOrders: rows.map(shape) };
}
export async function createGrn(actor, poId, input) {
    assertProcurementPermission(actor, 'procurement.grn.create');
    return db.transaction(async (trx) => {
        const po = await trx('procurement_purchase_orders').where({ id: poId, college_id: actor.collegeId }).forUpdate().first();
        if (!po)
            throw new AppError(404, 'PO not found');
        if (!['ISSUED', 'PARTIALLY_RECEIVED'].includes(po.status))
            throw new AppError(400, 'PO is not receivable');
        await assertStoreScope(trx, actor, input.receivingStoreId, true);
        const grnNo = await nextNo(trx, actor.collegeId, 'GRN');
        const [grnId] = await trx('procurement_grns').insert({ college_id: actor.collegeId, grn_no: grnNo, po_id: poId, vendor_id: po.vendor_id, delivery_reference: input.deliveryReference ?? null, invoice_reference: input.invoiceReference ?? null, received_date: input.receivedDate, receiving_store_id: input.receivingStoreId, inspection_status: input.inspectionStatus ?? 'PENDING_INSPECTION', received_by: actor.facultyUserId, remarks: input.remarks ?? null });
        for (const it of input.items) {
            const poi = await trx('procurement_purchase_order_items').where({ id: it.poItemId, po_id: poId, college_id: actor.collegeId }).forUpdate().first();
            if (!poi)
                throw new AppError(404, 'PO item not found');
            const rejected = it.rejectedQuantity ?? Math.max(0, it.receivedQuantity - it.acceptedQuantity);
            if (Math.abs(it.receivedQuantity - it.acceptedQuantity - rejected) > 0.0001)
                throw new AppError(400, 'Received quantity must equal accepted plus rejected quantity');
            if (n(poi.quantity_accepted) + it.acceptedQuantity > n(poi.quantity_ordered) + 0.0001)
                throw new AppError(400, 'Accepted quantity exceeds ordered quantity');
            await trx('procurement_grn_items').insert({ college_id: actor.collegeId, grn_id: grnId, po_item_id: it.poItemId, item_id: poi.item_id, received_quantity: qty(it.receivedQuantity), accepted_quantity: qty(it.acceptedQuantity), rejected_quantity: qty(rejected), rejection_reason: it.rejectionReason ?? null });
            await trx('procurement_purchase_order_items').where({ id: it.poItemId }).update({
                quantity_received: qty(n(poi.quantity_received) + it.receivedQuantity),
                quantity_accepted: qty(n(poi.quantity_accepted) + it.acceptedQuantity),
                quantity_rejected: qty(n(poi.quantity_rejected) + rejected),
                updated_at: trx.fn.now(),
            });
            if (it.acceptedQuantity > 0)
                await postStock(trx, actor, { itemId: n(poi.item_id), storeId: input.receivingStoreId, movementType: 'PURCHASE_RECEIPT', quantity: it.acceptedQuantity, sourceType: 'GRN', sourceId: n(grnId), sourceKey: grnNo, remarks: input.remarks });
        }
        const rows = await trx('procurement_purchase_order_items').where({ po_id: poId, college_id: actor.collegeId });
        const allFull = rows.every((r) => n(r.quantity_accepted) >= n(r.quantity_ordered));
        const anyAccepted = rows.some((r) => n(r.quantity_accepted) > 0);
        await trx('procurement_purchase_orders').where({ id: poId }).update({ status: allFull ? 'FULLY_RECEIVED' : anyAccepted ? 'PARTIALLY_RECEIVED' : po.status, updated_at: trx.fn.now() });
        await audit(actor, 'GRN_CREATE', 'procurement_grn', n(grnId), input, trx);
        return getGrn(actor, n(grnId), trx);
    });
}
export async function getGrn(actor, id, trx = db) {
    assertProcurementPermission(actor, 'procurement.view');
    const grn = await trx('procurement_grns').where({ id, college_id: actor.collegeId }).first();
    if (!grn)
        throw new AppError(404, 'GRN not found');
    const items = await trx('procurement_grn_items as gi').join('inventory_items as i', 'i.id', 'gi.item_id').where({ 'gi.college_id': actor.collegeId, grn_id: id }).select('gi.*', 'i.name as item_name', 'i.item_code');
    return { ...shape(grn), items: items.map(shape) };
}
export async function listGrns(actor) {
    assertProcurementPermission(actor, 'procurement.view');
    return { grns: (await db('procurement_grns').where({ college_id: actor.collegeId }).orderBy('id', 'desc').limit(100)).map(shape) };
}
export async function listInventory(actor) {
    assertProcurementPermission(actor, 'inventory.view');
    const balances = await db('inventory_stock_balances as b').join('inventory_items as i', 'i.id', 'b.item_id').join('inventory_stores as s', 's.id', 'b.store_id').leftJoin('inventory_units as u', 'u.id', 'i.unit_id').where('b.college_id', actor.collegeId).select('b.*', 'i.name as item_name', 'i.item_code', 'i.reorder_level', 's.name as store_name', 'u.code as unit_code').orderBy('i.name').limit(500);
    return { balances: balances.map((r) => ({ ...shape(r), lowStock: n(r.quantity) <= n(r.reorder_level) })) };
}
export async function ledger(actor, filters) {
    assertProcurementPermission(actor, 'inventory.view');
    let q = db('inventory_stock_ledger as l').join('inventory_items as i', 'i.id', 'l.item_id').join('inventory_stores as s', 's.id', 'l.store_id').where('l.college_id', actor.collegeId).select('l.*', 'i.name as item_name', 's.name as store_name').orderBy('l.id', 'desc').limit(Math.min(filters.limit ?? 200, 500));
    if (filters.itemId)
        q = q.where('l.item_id', filters.itemId);
    if (filters.storeId)
        q = q.where('l.store_id', filters.storeId);
    return { movements: (await q).map(shape) };
}
export async function createIssue(actor, input) {
    assertProcurementPermission(actor, 'inventory.issue');
    assertDepartmentScope(actor, input.departmentId ?? null);
    return db.transaction(async (trx) => {
        await assertStoreScope(trx, actor, input.storeId, true);
        const issueNo = await nextNo(trx, actor.collegeId, 'ISS');
        const [id] = await trx('inventory_stock_issues').insert({ college_id: actor.collegeId, issue_no: issueNo, store_id: input.storeId, consumer_module: input.consumerModule, department_id: input.departmentId ?? null, recipient_name: input.recipientName ?? null, source_entity_type: input.sourceEntityType ?? null, source_entity_id: input.sourceEntityId ?? null, purpose: input.purpose ?? null, issue_date: input.issueDate, issued_by: actor.facultyUserId });
        for (const it of input.items) {
            await postStock(trx, actor, { itemId: it.itemId, storeId: input.storeId, movementType: 'ISSUE', quantity: it.quantity, sourceType: 'ISSUE', sourceId: n(id), sourceKey: issueNo, remarks: input.purpose });
            await trx('inventory_stock_issue_items').insert({ college_id: actor.collegeId, issue_id: id, item_id: it.itemId, quantity: qty(it.quantity) });
        }
        await audit(actor, 'STOCK_ISSUE', 'inventory_stock_issue', n(id), input, trx);
        return { issue: shape((await trx('inventory_stock_issues').where({ id }).first())) };
    });
}
export async function createReturn(actor, input) {
    assertProcurementPermission(actor, 'inventory.return');
    return db.transaction(async (trx) => {
        const issue = await trx('inventory_stock_issues').where({ id: input.issueId, college_id: actor.collegeId }).first();
        if (!issue)
            throw new AppError(404, 'Issue not found');
        await assertStoreScope(trx, actor, issue.store_id, true);
        const returnNo = await nextNo(trx, actor.collegeId, 'RET');
        const [id] = await trx('inventory_stock_returns').insert({ college_id: actor.collegeId, return_no: returnNo, issue_id: input.issueId, store_id: issue.store_id, return_date: input.returnDate, received_by: actor.facultyUserId, remarks: input.remarks ?? null });
        for (const it of input.items) {
            const issueItem = await trx('inventory_stock_issue_items').where({ id: it.issueItemId, issue_id: input.issueId, college_id: actor.collegeId }).forUpdate().first();
            if (!issueItem)
                throw new AppError(404, 'Issue item not found');
            if (n(issueItem.returned_quantity) + it.quantity > n(issueItem.quantity) + 0.0001)
                throw new AppError(400, 'Return exceeds issued quantity');
            await trx('inventory_stock_issue_items').where({ id: it.issueItemId }).update({ returned_quantity: qty(n(issueItem.returned_quantity) + it.quantity), updated_at: trx.fn.now() });
            await trx('inventory_stock_return_items').insert({ college_id: actor.collegeId, return_id: id, issue_item_id: it.issueItemId, item_id: issueItem.item_id, quantity: qty(it.quantity) });
            await postStock(trx, actor, { itemId: n(issueItem.item_id), storeId: n(issue.store_id), movementType: 'RETURN', quantity: it.quantity, sourceType: 'RETURN', sourceId: n(id), sourceKey: returnNo, remarks: input.remarks });
        }
        await audit(actor, 'STOCK_RETURN', 'inventory_stock_return', n(id), input, trx);
        return { return: shape((await trx('inventory_stock_returns').where({ id }).first())) };
    });
}
export async function createTransfer(actor, input) {
    assertProcurementPermission(actor, 'inventory.transfer');
    if (input.fromStoreId === input.toStoreId)
        throw new AppError(400, 'Source and destination stores must differ');
    return db.transaction(async (trx) => {
        await assertStoreScope(trx, actor, input.fromStoreId, true);
        await assertStoreScope(trx, actor, input.toStoreId, true);
        const transferNo = await nextNo(trx, actor.collegeId, 'TRF');
        const [id] = await trx('inventory_stock_transfers').insert({ college_id: actor.collegeId, transfer_no: transferNo, from_store_id: input.fromStoreId, to_store_id: input.toStoreId, transfer_date: input.transferDate, transferred_by: actor.facultyUserId, remarks: input.remarks ?? null });
        for (const it of input.items) {
            await postStock(trx, actor, { itemId: it.itemId, storeId: input.fromStoreId, movementType: 'TRANSFER_OUT', quantity: it.quantity, sourceType: 'TRANSFER', sourceId: n(id), sourceKey: transferNo, remarks: input.remarks });
            await postStock(trx, actor, { itemId: it.itemId, storeId: input.toStoreId, movementType: 'TRANSFER_IN', quantity: it.quantity, sourceType: 'TRANSFER', sourceId: n(id), sourceKey: transferNo, remarks: input.remarks });
            await trx('inventory_stock_transfer_items').insert({ college_id: actor.collegeId, transfer_id: id, item_id: it.itemId, quantity: qty(it.quantity) });
        }
        await audit(actor, 'STOCK_TRANSFER', 'inventory_stock_transfer', n(id), input, trx);
        return { transfer: shape((await trx('inventory_stock_transfers').where({ id }).first())) };
    });
}
export async function createAdjustment(actor, input) {
    assertProcurementPermission(actor, 'inventory.adjust');
    return db.transaction(async (trx) => {
        const adjustmentNo = await nextNo(trx, actor.collegeId, 'ADJ');
        const [id] = await trx('inventory_stock_adjustments').insert({ college_id: actor.collegeId, adjustment_no: adjustmentNo, store_id: input.storeId, item_id: input.itemId, direction: input.direction, quantity: qty(input.quantity), reason: input.reason, adjusted_by: actor.facultyUserId });
        await postStock(trx, actor, { itemId: input.itemId, storeId: input.storeId, movementType: input.direction === 'IN' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT', quantity: input.quantity, sourceType: 'ADJUSTMENT', sourceId: n(id), sourceKey: adjustmentNo, remarks: input.reason });
        await audit(actor, 'STOCK_ADJUSTMENT', 'inventory_stock_adjustment', n(id), input, trx);
        return { adjustment: shape((await trx('inventory_stock_adjustments').where({ id }).first())) };
    });
}
export async function reconcile(actor) {
    assertProcurementPermission(actor, 'inventory.view');
    const balances = await db('inventory_stock_balances').where({ college_id: actor.collegeId });
    const failures = [];
    for (const b of balances) {
        const rows = await db('inventory_stock_ledger').where({ college_id: actor.collegeId, item_id: b.item_id, store_id: b.store_id });
        const derived = rows.reduce((sum, r) => sum + (['PURCHASE_RECEIPT', 'RETURN', 'TRANSFER_IN', 'ADJUSTMENT_IN', 'OPENING'].includes(r.movement_type) ? n(r.quantity) : -n(r.quantity)), 0);
        if (Math.abs(derived - n(b.quantity)) > 0.001)
            failures.push({ itemId: n(b.item_id), storeId: n(b.store_id), balance: n(b.quantity), derived });
    }
    return { ok: failures.length === 0, checked: balances.length, failures };
}
export async function financeHandoff(actor, grnId, input) {
    assertProcurementPermission(actor, 'procurement.finance.handoff');
    return db.transaction(async (trx) => {
        const grn = await trx('procurement_grns').where({ id: grnId, college_id: actor.collegeId }).forUpdate().first();
        if (!grn)
            throw new AppError(404, 'GRN not found');
        const items = await trx('procurement_grn_items as gi').join('procurement_purchase_order_items as pi', 'pi.id', 'gi.po_item_id').where({ 'gi.college_id': actor.collegeId, grn_id: grnId }).select('gi.accepted_quantity', 'pi.rate', 'pi.tax_amount', 'pi.discount_amount', 'pi.quantity_ordered');
        const acceptedAmount = items.reduce((sum, it) => sum + n(it.accepted_quantity) * n(it.rate), 0);
        const key = input.idempotencyKey ?? `GRN:${actor.collegeId}:${grnId}:${input.invoiceReference ?? grn.invoice_reference ?? 'no-invoice'}`;
        const existing = await trx('procurement_finance_handoffs').where({ college_id: actor.collegeId, idempotency_key: key }).first();
        if (existing)
            return { handoff: shape(existing), idempotent: true };
        try {
            const [id] = await trx('procurement_finance_handoffs').insert({ college_id: actor.collegeId, po_id: grn.po_id, grn_id: grnId, vendor_id: grn.vendor_id, accepted_amount: money(acceptedAmount), invoice_reference: input.invoiceReference ?? grn.invoice_reference ?? null, idempotency_key: key, created_by: actor.facultyUserId });
            await audit(actor, 'FINANCE_HANDOFF_CREATE', 'procurement_finance_handoff', n(id), { acceptedAmount, invoiceReference: input.invoiceReference }, trx);
            return { handoff: shape((await trx('procurement_finance_handoffs').where({ id }).first())), idempotent: false };
        }
        catch (err) {
            if (err?.code !== 'ER_DUP_ENTRY')
                throw err;
            const row = await trx('procurement_finance_handoffs').where({ college_id: actor.collegeId, idempotency_key: key }).first();
            return { handoff: shape(row), idempotent: true };
        }
    });
}
export async function reports(actor) {
    assertProcurementPermission(actor, 'procurement.analytics.view');
    const [purchaseHistory, consumption, pendingPo] = await Promise.all([
        db('procurement_purchase_orders as po').join('procurement_vendors as v', 'v.id', 'po.vendor_id').where('po.college_id', actor.collegeId).select('v.name as vendor_name').sum({ total: 'po.total_amount' }).count({ orders: 'po.id' }).groupBy('v.name').limit(50),
        db('inventory_stock_issues').where({ college_id: actor.collegeId }).select('consumer_module').count({ issues: 'id' }).groupBy('consumer_module'),
        db('procurement_purchase_orders').where({ college_id: actor.collegeId }).whereIn('status', ['ISSUED', 'PARTIALLY_RECEIVED']).count('id as c').first(),
    ]);
    return { purchaseHistory: purchaseHistory.map(shape), consumption: consumption.map(shape), pendingPurchaseOrders: n(pendingPo?.c) };
}
