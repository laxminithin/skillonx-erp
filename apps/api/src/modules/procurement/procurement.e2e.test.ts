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

async function assetTrackableGrnItem(ctx: Awaited<ReturnType<typeof setup>>, quantity = 2) {
  const masters = await procurement.listMasters(ctx.admin);
  const assetItem = await procurement.createItem(ctx.admin, {
    itemCode: `ASSETITM${Date.now()}${Math.floor(Math.random() * 10000)}`.slice(0, 60),
    name: 'Desktop Computer',
    unitId: Number(masters.units[0].id),
    categoryId: Number(masters.categories[0].id),
    itemType: 'ASSET_TRACKABLE',
  });
  const itemId = Number(assetItem.items.find((i: any) => i.itemType === 'ASSET_TRACKABLE').id);
  const po = await procurement.createPo(ctx.admin, {
    vendorId: ctx.vendorId,
    deliveryStoreId: ctx.storeId,
    expectedDate: '2026-09-20',
    items: [{ itemId, quantity, rate: 45000 }],
  });
  await procurement.transitionPo(ctx.admin, Number(po.id), 'approve');
  await procurement.transitionPo(ctx.admin, Number(po.id), 'issue');
  const grn = await procurement.createGrn(ctx.storeKeeper, Number(po.id), {
    receivingStoreId: ctx.storeId,
    receivedDate: '2026-09-21',
    inspectionStatus: 'ACCEPTED',
    items: [{ poItemId: Number(po.items[0].id), receivedQuantity: quantity, acceptedQuantity: quantity, rejectedQuantity: 0 }],
  });
  return { grnItemId: Number(grn.items[0].id), itemId };
}

describe('Campus OS Phase 1: GRN idempotency', () => {
  it('a client replay with the same idempotency key returns the original GRN and does not double-post stock', async () => {
    const c = await setup();
    const po = await poIssued(c, 10);
    const beforeBalance = (await procurement.listInventory(c.admin)).balances.find((b: any) => b.itemId === c.itemId && b.storeId === c.storeId);
    const beforeQty = beforeBalance ? Number(beforeBalance.quantity) : 0;

    const key = `grn-idem-${Date.now()}`;
    const first = await procurement.createGrn(c.storeKeeper, Number(po.id), {
      receivingStoreId: c.storeId, receivedDate: '2026-09-15', inspectionStatus: 'ACCEPTED', idempotencyKey: key,
      items: [{ poItemId: Number(po.items[0].id), receivedQuantity: 5, acceptedQuantity: 5, rejectedQuantity: 0 }],
    });
    const second = await procurement.createGrn(c.storeKeeper, Number(po.id), {
      receivingStoreId: c.storeId, receivedDate: '2026-09-15', inspectionStatus: 'ACCEPTED', idempotencyKey: key,
      items: [{ poItemId: Number(po.items[0].id), receivedQuantity: 5, acceptedQuantity: 5, rejectedQuantity: 0 }],
    });
    assert.equal(second.id, first.id);

    const afterBalance = (await procurement.listInventory(c.admin)).balances.find((b: any) => b.itemId === c.itemId && b.storeId === c.storeId);
    assert.equal(Number(afterBalance.quantity), beforeQty + 5, 'stock must be posted exactly once, not twice');
    const grnCount = await db('procurement_grns').where({ college_id: c.admin.collegeId, po_id: Number(po.id), idempotency_key: key }).count<{ c: number }>('id as c').first();
    assert.equal(Number(grnCount?.c), 1);
  });

  it('concurrent replay of the same idempotency key is safe under real DB concurrency', async () => {
    const c = await setup();
    const po = await poIssued(c, 10);
    const key = `grn-idem-conc-${Date.now()}`;
    const calls = await Promise.allSettled([
      procurement.createGrn(c.storeKeeper, Number(po.id), { receivingStoreId: c.storeId, receivedDate: '2026-09-15', inspectionStatus: 'ACCEPTED', idempotencyKey: key, items: [{ poItemId: Number(po.items[0].id), receivedQuantity: 5, acceptedQuantity: 5, rejectedQuantity: 0 }] }),
      procurement.createGrn(c.storeKeeper, Number(po.id), { receivingStoreId: c.storeId, receivedDate: '2026-09-15', inspectionStatus: 'ACCEPTED', idempotencyKey: key, items: [{ poItemId: Number(po.items[0].id), receivedQuantity: 5, acceptedQuantity: 5, rejectedQuantity: 0 }] }),
    ]);
    assert.equal(calls.filter((r) => r.status === 'fulfilled').length, 2, 'both calls resolve (idempotent), neither should reject');
    const grnCount = await db('procurement_grns').where({ college_id: c.admin.collegeId, po_id: Number(po.id), idempotency_key: key }).count<{ c: number }>('id as c').first();
    assert.equal(Number(grnCount?.c), 1, 'exactly one GRN must exist despite two concurrent identical requests');
    const balance = (await procurement.listInventory(c.admin)).balances.find((b: any) => b.itemId === c.itemId && b.storeId === c.storeId);
    assert.equal(Number(balance.quantity), 5, 'stock posted exactly once');
  });

  it('a different idempotency key legitimately creates a second, independent partial GRN', async () => {
    const c = await setup();
    const po = await poIssued(c, 10);
    await procurement.createGrn(c.storeKeeper, Number(po.id), { receivingStoreId: c.storeId, receivedDate: '2026-09-15', inspectionStatus: 'ACCEPTED', idempotencyKey: 'k1', items: [{ poItemId: Number(po.items[0].id), receivedQuantity: 4, acceptedQuantity: 4, rejectedQuantity: 0 }] });
    await procurement.createGrn(c.storeKeeper, Number(po.id), { receivingStoreId: c.storeId, receivedDate: '2026-09-15', inspectionStatus: 'ACCEPTED', idempotencyKey: 'k2', items: [{ poItemId: Number(po.items[0].id), receivedQuantity: 4, acceptedQuantity: 4, rejectedQuantity: 0 }] });
    const balance = (await procurement.listInventory(c.admin)).balances.find((b: any) => b.itemId === c.itemId && b.storeId === c.storeId);
    assert.equal(Number(balance.quantity), 8);
  });
});

describe('Campus OS Phase 1: Asset handoff (GRN -> P0.2 Asset Management)', () => {
  it('registers exactly one asset per accepted unit, and is idempotent on replay', async () => {
    const c = await setup();
    const { grnItemId } = await assetTrackableGrnItem(c, 2);
    const tagBase = `AH-${Date.now()}`;
    const first = await procurement.handoffGrnItemToAssets(c.admin, grnItemId, { assets: [{ assetTag: `${tagBase}-1` }, { assetTag: `${tagBase}-2` }] });
    assert.equal(first.idempotent, false);
    assert.equal(first.assetIds.length, 2);

    const countAfterFirst = await db('campus_assets').whereIn('id', first.assetIds).count<{ c: number }>('id as c').first();
    assert.equal(Number(countAfterFirst?.c), 2);

    const second = await procurement.handoffGrnItemToAssets(c.admin, grnItemId, { assets: [{ assetTag: `${tagBase}-1` }, { assetTag: `${tagBase}-2` }] });
    assert.equal(second.idempotent, true);
    assert.deepEqual(second.assetIds.sort(), first.assetIds.sort());

    const countAfterSecond = await db('campus_assets').where({ college_id: c.admin.collegeId }).whereIn('asset_tag', [`${tagBase}-1`, `${tagBase}-2`]).count<{ c: number }>('id as c').first();
    assert.equal(Number(countAfterSecond?.c), 2, 'replay must not create duplicate assets');
  });

  it('rejects handoff for a non-ASSET_TRACKABLE item (a normal CONSUMABLE GRN line)', async () => {
    const c = await setup();
    const po = await poIssued(c, 4);
    const grn = await procurement.createGrn(c.storeKeeper, Number(po.id), {
      receivingStoreId: c.storeId, receivedDate: '2026-09-15', inspectionStatus: 'ACCEPTED',
      items: [{ poItemId: Number(po.items[0].id), receivedQuantity: 4, acceptedQuantity: 4, rejectedQuantity: 0 }],
    });
    await assert.rejects(
      () => procurement.handoffGrnItemToAssets(c.admin, Number(grn.items[0].id), { assets: [{ assetTag: `WRONGTYPE-${Date.now()}` }] }),
      /Only ASSET_TRACKABLE items/,
    );
  });

  it('rejects a mismatched asset-registration count vs. accepted quantity', async () => {
    const c = await setup();
    const { grnItemId } = await assetTrackableGrnItem(c, 2);
    await assert.rejects(() => procurement.handoffGrnItemToAssets(c.admin, grnItemId, { assets: [{ assetTag: `WRONGCOUNT-${Date.now()}` }] }), /Expected exactly 2/);
  });

  it('rejects handoff RBAC for a role without procurement.asset.handoff', async () => {
    const c = await setup();
    const { grnItemId } = await assetTrackableGrnItem(c, 1);
    await assert.rejects(() => procurement.handoffGrnItemToAssets(c.requester, grnItemId, { assets: [{ assetTag: `DENIED-${Date.now()}` }] }), /permission/);
  });

  it('cross-college actor cannot hand off another college\'s GRN line', async () => {
    const c = await setup();
    const { grnItemId } = await assetTrackableGrnItem(c, 1);
    await assert.rejects(() => procurement.handoffGrnItemToAssets(c.cross, grnItemId, { assets: [{ assetTag: `CROSS-${Date.now()}` }] }), /not found/);
  });

  it('concurrent handoff of the same GRN line is safe under real DB concurrency (no duplicate assets, one handoff record)', async () => {
    const c = await setup();
    const { grnItemId } = await assetTrackableGrnItem(c, 1);
    const tag = `AHCONC-${Date.now()}`;
    const calls = await Promise.allSettled([
      procurement.handoffGrnItemToAssets(c.admin, grnItemId, { assets: [{ assetTag: tag }] }),
      procurement.handoffGrnItemToAssets(c.admin, grnItemId, { assets: [{ assetTag: tag }] }),
    ]);
    assert.equal(calls.filter((r) => r.status === 'fulfilled').length, 2);
    const handoffCount = await db('procurement_asset_handoffs').where({ college_id: c.admin.collegeId, grn_item_id: grnItemId }).count<{ c: number }>('id as c').first();
    assert.equal(Number(handoffCount?.c), 1, 'exactly one handoff record must exist');
    const assetCount = await db('campus_assets').where({ college_id: c.admin.collegeId, asset_tag: tag }).count<{ c: number }>('id as c').first();
    assert.equal(Number(assetCount?.c), 1, 'exactly one asset must exist despite the race');
  });

  it('getAssetHandoff returns null before handoff and the record afterward', async () => {
    const c = await setup();
    const { grnItemId } = await assetTrackableGrnItem(c, 1);
    const before = await procurement.getAssetHandoff(c.admin, grnItemId);
    assert.equal(before, null);
    const tag = `AHGET-${Date.now()}`;
    await procurement.handoffGrnItemToAssets(c.admin, grnItemId, { assets: [{ assetTag: tag }] });
    const after = await procurement.getAssetHandoff(c.admin, grnItemId);
    assert.equal(after?.assetIds.length, 1);
  });
});

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

  it('Campus OS Phase 0: vendor directory is tenant-scoped and findVendorRef degrades gracefully', async () => {
    const c = await setup();
    const directory = await procurement.listVendorDirectory(c.admin);
    assert.equal(directory.length, 1);
    assert.equal(directory[0].id, c.vendorId);
    assert.ok(Array.isArray(directory[0].categories));
    await assert.rejects(() => procurement.listVendorDirectory({ ...c.admin, role: 'STUDENT' as any }), /permission/);

    const ref = await procurement.findVendorRef(c.admin.collegeId, c.vendorId);
    assert.equal(ref?.id, c.vendorId);
    const crossTenantRef = await procurement.findVendorRef(c.cross.collegeId, c.vendorId);
    assert.equal(crossTenantRef, null);
    const missingRef = await procurement.findVendorRef(c.admin.collegeId, 999999);
    assert.equal(missingRef, null);
    const nullRef = await procurement.findVendorRef(c.admin.collegeId, null);
    assert.equal(nullRef, null);
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
