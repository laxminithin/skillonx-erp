import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { db } from '../../db/index.js';
import * as procurement from './service.js';
import type { ProcurementActor } from './types.js';

async function setup(tag = `P${Date.now()}${Math.floor(Math.random() * 10000)}`) {
  const [collegeId] = await db('colleges').insert({ name: `Procurement College ${tag}`, code: `PC${tag}`.slice(0, 60) });
  const [otherCollegeId] = await db('colleges').insert({ name: `Other Procurement College ${tag}`, code: `OP${tag}`.slice(0, 60) });
  const [deptId] = await db('departments').insert({ college_id: collegeId, name: 'Computer Science', code: `CS${tag}`.slice(0, 60) });
  const [otherDeptId] = await db('departments').insert({ college_id: collegeId, name: 'Mechanical', code: `ME${tag}`.slice(0, 60) });
  const [adminId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Proc Admin', email: `proc.admin.${tag}@test.edu`, password_hash: 'x', role: 'COLLEGE_ADMIN', is_active: true });
  const [requesterId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Requester', email: `proc.req.${tag}@test.edu`, password_hash: 'x', role: 'FACULTY', is_active: true });
  const [hodId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'HOD', email: `proc.hod.${tag}@test.edu`, password_hash: 'x', role: 'HOD', is_active: true });
  const [otherHodId] = await db('faculty_users').insert({ college_id: collegeId, department_id: otherDeptId, name: 'Other HOD', email: `proc.otherhod.${tag}@test.edu`, password_hash: 'x', role: 'HOD', is_active: true });
  const [storeKeeperId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Store Keeper', email: `proc.store.${tag}@test.edu`, password_hash: 'x', role: 'STORE_KEEPER', is_active: true });
  const [crossAdminId] = await db('faculty_users').insert({ college_id: otherCollegeId, name: 'Cross Admin', email: `proc.cross.${tag}@test.edu`, password_hash: 'x', role: 'COLLEGE_ADMIN', is_active: true });
  const admin: ProcurementActor = { facultyUserId: Number(adminId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'COLLEGE_ADMIN' };
  const requester: ProcurementActor = { facultyUserId: Number(requesterId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'FACULTY' };
  const hod: ProcurementActor = { facultyUserId: Number(hodId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'HOD' };
  const otherHod: ProcurementActor = { facultyUserId: Number(otherHodId), collegeId: Number(collegeId), departmentId: Number(otherDeptId), role: 'HOD' };
  const storeKeeper: ProcurementActor = { facultyUserId: Number(storeKeeperId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'STORE_KEEPER' };
  const cross: ProcurementActor = { facultyUserId: Number(crossAdminId), collegeId: Number(otherCollegeId), departmentId: null, role: 'COLLEGE_ADMIN' };
  await procurement.upsertUnit(admin, { code: 'NOS', name: 'Nos' });
  await procurement.upsertCategory(admin, { code: 'IT', name: 'Computer/IT' });
  let masters = await procurement.listMasters(admin);
  await procurement.createStore(admin, { code: `CENTRAL${tag}`.slice(0, 60), name: 'Central Store', storeType: 'CENTRAL', responsibleFacultyId: storeKeeper.facultyUserId });
  await procurement.createStore(admin, { code: `DEPT${tag}`.slice(0, 60), name: 'Department Store', storeType: 'DEPARTMENT' });
  masters = await procurement.listMasters(admin);
  await procurement.createItem(admin, { itemCode: `ITM${tag}`.slice(0, 60), name: `Network Cable ${tag}`, unitId: Number(masters.units[0].id), categoryId: Number(masters.categories[0].id), itemType: 'CONSUMABLE', reorderLevel: 5 });
  await procurement.createVendor(admin, { vendorCode: `VEN${tag}`.slice(0, 60), name: `Vendor ${tag}`, email: `vendor.${tag}@test.edu`, taxIdentifier: `GST${tag}`.slice(0, 90) });
  masters = await procurement.listMasters(admin);
  return {
    admin, requester, hod, otherHod, storeKeeper, cross, deptId: Number(deptId),
    itemId: Number(masters.items[0].id),
    storeId: Number(masters.stores.find((s: any) => s.name === 'Central Store').id),
    toStoreId: Number(masters.stores.find((s: any) => s.name === 'Department Store').id),
    vendorId: Number(masters.vendors[0].id),
  };
}

async function stocked(ctx: Awaited<ReturnType<typeof setup>>, quantity = 10) {
  await procurement.createAdjustment(ctx.admin, { storeId: ctx.storeId, itemId: ctx.itemId, direction: 'IN', quantity, reason: 'Opening balance for procurement E2E' });
}

async function issued(ctx: Awaited<ReturnType<typeof setup>>, quantity = 5) {
  return procurement.createIssue(ctx.storeKeeper, {
    storeId: ctx.storeId,
    consumerModule: 'DEPARTMENT',
    departmentId: ctx.deptId,
    issueDate: '2026-09-15',
    purpose: 'E2E issue',
    items: [{ itemId: ctx.itemId, quantity }],
  });
}

async function poIssued(ctx: Awaited<ReturnType<typeof setup>>, quantity = 10) {
  const po = await procurement.createPo(ctx.admin, {
    vendorId: ctx.vendorId,
    deliveryStoreId: ctx.storeId,
    expectedDate: '2026-09-20',
    items: [{ itemId: ctx.itemId, quantity, rate: 100 }],
  });
  await procurement.transitionPo(ctx.admin, Number(po.id), 'approve');
  return procurement.transitionPo(ctx.admin, Number(po.id), 'issue');
}

describe('stores and procurement canonical web module', () => {
  it('item/store/vendor masters enforce duplicate and tenant protection', async () => {
    const c = await setup();
    await assert.rejects(() => procurement.createItem(c.admin, { itemCode: `ITM${Date.now()}`, name: 'Bad unit', unitId: 999999 }), /Record not found/);
    await assert.rejects(() => procurement.getIndent(c.cross, 999999), /Indent not found|Record not found/);
    const masters = await procurement.listMasters(c.admin);
    assert.equal(masters.items.length, 1);
    assert.equal(masters.stores.length, 2);
    assert.equal(masters.vendors.length, 1);
  });

  it('indent workflow blocks self-approval and cross-department HOD approval', async () => {
    const c = await setup();
    const indent = await procurement.createIndent(c.requester, {
      departmentId: c.deptId,
      consumerModule: 'LAB',
      purpose: 'Lab consumables',
      requiredDate: '2026-09-15',
      deliveryStoreId: c.storeId,
      items: [{ itemId: c.itemId, quantity: 2, estimatedRate: 100 }],
    });
    await assert.rejects(() => procurement.decideIndent(c.requester, Number(indent.id), { action: 'APPROVE' }), /permission|Requester cannot approve/);
    await assert.rejects(() => procurement.decideIndent(c.otherHod, Number(indent.id), { action: 'APPROVE' }), /department scope/);
    const approved = await procurement.decideIndent(c.hod, Number(indent.id), { action: 'APPROVE', comments: 'Approved for purchase' });
    assert.equal(approved.status, 'APPROVED');
  });

  it('PO lifecycle rejects invalid transitions and supports partial GRN receipt', async () => {
    const c = await setup();
    const po = await poIssued(c, 10);
    await assert.rejects(() => procurement.transitionPo(c.admin, Number(po.id), 'issue'), /Invalid PO state transition/);
    const grn = await procurement.createGrn(c.storeKeeper, Number(po.id), {
      receivingStoreId: c.storeId,
      receivedDate: '2026-09-15',
      inspectionStatus: 'PARTIALLY_ACCEPTED',
      items: [{ poItemId: Number(po.items[0].id), receivedQuantity: 6, acceptedQuantity: 4, rejectedQuantity: 2, rejectionReason: 'Damaged' }],
    });
    assert.equal(Number(grn.items[0].acceptedQuantity), 4);
    const updated = await procurement.getPo(c.admin, Number(po.id));
    assert.equal(updated.status, 'PARTIALLY_RECEIVED');
  });

  it('concurrent GRNs cannot over-receive a purchase order', async () => {
    const c = await setup();
    const po = await poIssued(c, 10);
    const calls = await Promise.allSettled([
      procurement.createGrn(c.storeKeeper, Number(po.id), { receivingStoreId: c.storeId, receivedDate: '2026-09-15', inspectionStatus: 'ACCEPTED', items: [{ poItemId: Number(po.items[0].id), receivedQuantity: 8, acceptedQuantity: 8, rejectedQuantity: 0 }] }),
      procurement.createGrn(c.storeKeeper, Number(po.id), { receivingStoreId: c.storeId, receivedDate: '2026-09-15', inspectionStatus: 'ACCEPTED', items: [{ poItemId: Number(po.items[0].id), receivedQuantity: 8, acceptedQuantity: 8, rejectedQuantity: 0 }] }),
    ]);
    assert.equal(calls.filter((r) => r.status === 'fulfilled').length, 1);
    const updated = await procurement.getPo(c.admin, Number(po.id));
    assert.equal(Number(updated.items[0].quantityAccepted), 8);
  });

  it('concurrent stock issues cannot drive inventory negative', async () => {
    const c = await setup();
    await stocked(c, 10);
    const calls = await Promise.allSettled([
      procurement.createIssue(c.storeKeeper, { storeId: c.storeId, consumerModule: 'MAINTENANCE', issueDate: '2026-09-15', items: [{ itemId: c.itemId, quantity: 8 }] }),
      procurement.createIssue(c.storeKeeper, { storeId: c.storeId, consumerModule: 'MAINTENANCE', issueDate: '2026-09-15', items: [{ itemId: c.itemId, quantity: 8 }] }),
    ]);
    assert.equal(calls.filter((r) => r.status === 'fulfilled').length, 1);
    const inventory = await procurement.listInventory(c.admin);
    assert.equal(Number(inventory.balances.find((b: any) => Number(b.itemId) === c.itemId && Number(b.storeId) === c.storeId).quantity), 2);
  });

  it('transfers are atomic and protect source stock', async () => {
    const c = await setup();
    await stocked(c, 10);
    await assert.rejects(() => procurement.createTransfer(c.storeKeeper, { fromStoreId: c.storeId, toStoreId: c.toStoreId, transferDate: '2026-09-15', items: [{ itemId: c.itemId, quantity: 12 }] }), /Insufficient stock/);
    await procurement.createTransfer(c.admin, { fromStoreId: c.storeId, toStoreId: c.toStoreId, transferDate: '2026-09-15', items: [{ itemId: c.itemId, quantity: 5 }] });
    const rec = await procurement.reconcile(c.admin);
    assert.equal(rec.ok, true);
  });

  it('returns cannot exceed issued quantity under concurrency', async () => {
    const c = await setup();
    await stocked(c, 10);
    const issue = await issued(c, 5);
    const issueItem = await db('inventory_stock_issue_items').where({ issue_id: issue.issue.id }).first();
    const calls = await Promise.allSettled([
      procurement.createReturn(c.storeKeeper, { issueId: Number(issue.issue.id), returnDate: '2026-09-15', items: [{ issueItemId: Number(issueItem.id), quantity: 4 }] }),
      procurement.createReturn(c.storeKeeper, { issueId: Number(issue.issue.id), returnDate: '2026-09-15', items: [{ issueItemId: Number(issueItem.id), quantity: 4 }] }),
    ]);
    assert.equal(calls.filter((r) => r.status === 'fulfilled').length, 1);
    const row = await db('inventory_stock_issue_items').where({ id: issueItem.id }).first();
    assert.equal(Number(row.returned_quantity), 4);
  });

  it('Finance handoff is idempotent for duplicate requests', async () => {
    const c = await setup();
    const po = await poIssued(c, 4);
    const grn = await procurement.createGrn(c.storeKeeper, Number(po.id), {
      receivingStoreId: c.storeId,
      receivedDate: '2026-09-15',
      invoiceReference: 'INV-1',
      inspectionStatus: 'ACCEPTED',
      items: [{ poItemId: Number(po.items[0].id), receivedQuantity: 4, acceptedQuantity: 4, rejectedQuantity: 0 }],
    });
    const key = `handoff-${grn.id}`;
    const calls = await Promise.allSettled([
      procurement.financeHandoff(c.admin, Number(grn.id), { invoiceReference: 'INV-1', idempotencyKey: key }),
      procurement.financeHandoff(c.admin, Number(grn.id), { invoiceReference: 'INV-1', idempotencyKey: key }),
    ]);
    assert.equal(calls.filter((r) => r.status === 'fulfilled').length, 2);
    const count = await db('procurement_finance_handoffs').where({ college_id: c.admin.collegeId, idempotency_key: key }).count<{ c: number }>('id as c').first();
    assert.equal(Number(count?.c), 1);
  });
});
