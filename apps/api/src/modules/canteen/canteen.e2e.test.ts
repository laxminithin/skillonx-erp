import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { db } from '../../db/index.js';
import * as procurement from '../procurement/service.js';
import * as canteen from './service.js';
import type { CanteenActor } from './types.js';

async function setup(tag = `C${Date.now()}${Math.floor(Math.random() * 10000)}`) {
  const [collegeId] = await db('colleges').insert({ name: `Canteen College ${tag}`, code: `CC${tag}`.slice(0, 60) });
  const [otherCollegeId] = await db('colleges').insert({ name: `Other Canteen College ${tag}`, code: `OC${tag}`.slice(0, 60) });
  const [deptId] = await db('departments').insert({ college_id: collegeId, name: 'Canteen Ops', code: `CN${tag}`.slice(0, 60) });
  const [adminId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Canteen Admin', email: `can.admin.${tag}@test.edu`, password_hash: 'x', role: 'COLLEGE_ADMIN', is_active: true });
  const [managerId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Canteen Manager', email: `can.mgr.${tag}@test.edu`, password_hash: 'x', role: 'CANTEEN_MANAGER', is_active: true });
  const [staffId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Canteen Staff', email: `can.staff.${tag}@test.edu`, password_hash: 'x', role: 'CANTEEN_STAFF', is_active: true });
  const [facultyId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Regular Faculty', email: `can.fac.${tag}@test.edu`, password_hash: 'x', role: 'FACULTY', is_active: true });
  const [crossAdminId] = await db('faculty_users').insert({ college_id: otherCollegeId, name: 'Cross Admin', email: `can.cross.${tag}@test.edu`, password_hash: 'x', role: 'COLLEGE_ADMIN', is_active: true });
  const [studentId] = await db('students').insert({ college_id: collegeId, name: 'Canteen Customer', usn: `USN${tag}`.slice(0, 30), email: `can.stu.${tag}@test.edu`, is_active: true });

  const admin: CanteenActor = { facultyUserId: Number(adminId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'COLLEGE_ADMIN' };
  const manager: CanteenActor = { facultyUserId: Number(managerId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'CANTEEN_MANAGER' };
  const staff: CanteenActor = { facultyUserId: Number(staffId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'CANTEEN_STAFF' };
  const faculty: CanteenActor = { facultyUserId: Number(facultyId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'FACULTY' };
  const cross: CanteenActor = { facultyUserId: Number(crossAdminId), collegeId: Number(otherCollegeId), departmentId: null, role: 'COLLEGE_ADMIN' };

  // Item master + stock reused from Procurement (not duplicated).
  const masters = await procurement.listMasters(admin as any);
  await procurement.upsertUnit(admin as any, { code: 'NOS', name: 'Nos' });
  const item = await procurement.createItem(admin as any, { itemCode: `SNACK${tag}`.slice(0, 60), name: 'Samosa', unitId: Number((await procurement.listMasters(admin as any)).units[0].id), itemType: 'CONSUMABLE' });
  const itemId = Number(item.items.find((i: any) => i.itemCode === `SNACK${tag}`.slice(0, 60).toUpperCase()).id);
  // Deliberately no responsibleFacultyId here: an unassigned store is open to any
  // authorized canteen role, matching Procurement's own convention (assertStoreScope
  // only restricts when a store IS assigned). The dedicated store-scope test below
  // creates its own assigned store to prove the restriction still works.
  const store = await procurement.createStore(admin as any, { code: `CANTEEN${tag}`.slice(0, 60), name: 'Main Canteen Counter', storeType: 'CANTEEN' });
  const counterStoreId = Number(store.stores.find((s: any) => s.name === 'Main Canteen Counter').id);
  await procurement.createAdjustment(admin as any, { storeId: counterStoreId, itemId, direction: 'IN', quantity: 100, reason: 'Opening stock for canteen E2E' });

  const menu = await canteen.upsertMenuItem(admin, { itemId, category: 'SNACK', price: 20 });
  const menuItemId = Number(menu.find((m: any) => m.itemId === itemId).id);

  return { admin, manager, staff, faculty, cross, collegeId: Number(collegeId), otherCollegeId: Number(otherCollegeId), counterStoreId, itemId, menuItemId, studentId: Number(studentId), tag };
}

describe('Campus OS Phase 2: Canteen (Food Services) — menu, POS orders, settlement', () => {
  it('menu reuses the item master (no duplicate inventory engine) and RBAC-gates menu management', async () => {
    const c = await setup();
    const menu = await canteen.listMenu(c.admin);
    assert.equal(menu.length, 1);
    assert.equal(menu[0].itemName, 'Samosa');
    await assert.rejects(() => canteen.upsertMenuItem(c.staff, { itemId: c.itemId, price: 25 }), /permission/);
    await assert.rejects(() => canteen.upsertMenuItem(c.admin, { itemId: 999999, price: 25 }), /Item not found/);
  });

  it('creates an order with server-derived pricing (client price is never trusted) and pays it, posting stock consumption via the existing Procurement issue path', async () => {
    const c = await setup();
    const order = await canteen.createOrder(c.staff, { counterStoreId: c.counterStoreId, customerType: 'STUDENT', customerStudentId: c.studentId, items: [{ menuItemId: c.menuItemId, quantity: 3 }] });
    assert.equal(order.status, 'PENDING');
    assert.equal(Number(order.totalAmount), 60);

    const balanceBefore = (await procurement.listInventory(c.admin as any)).balances.find((b: any) => b.itemId === c.itemId && b.storeId === c.counterStoreId);
    const paid = await canteen.payOrder(c.staff, Number(order.id), { paymentMethod: 'CASH' });
    assert.equal(paid.status, 'PAID');
    assert.ok(paid.issueId);

    const balanceAfter = (await procurement.listInventory(c.admin as any)).balances.find((b: any) => b.itemId === c.itemId && b.storeId === c.counterStoreId);
    assert.equal(Number(balanceBefore.quantity) - Number(balanceAfter.quantity), 3, 'stock consumption must be posted through the existing ledger');

    await assert.rejects(() => canteen.payOrder(c.staff, Number(order.id), { paymentMethod: 'CASH' }), /cannot be paid/);
  });

  it('rejects duplicate menu-item lines, unavailable items, and mismatched-tenant counters', async () => {
    const c = await setup();
    await assert.rejects(
      () => canteen.createOrder(c.staff, { counterStoreId: c.counterStoreId, customerType: 'GUEST', items: [{ menuItemId: c.menuItemId, quantity: 1 }, { menuItemId: c.menuItemId, quantity: 2 }] }),
      /Duplicate menu item/,
    );
    await canteen.upsertMenuItem(c.admin, { itemId: c.itemId, price: 20, isAvailable: false });
    await assert.rejects(() => canteen.createOrder(c.staff, { counterStoreId: c.counterStoreId, customerType: 'GUEST', items: [{ menuItemId: c.menuItemId, quantity: 1 }] }), /not currently available/);
  });

  it('cancel only works on a PENDING order; a PAID order cannot be cancelled', async () => {
    const c = await setup();
    const order = await canteen.createOrder(c.staff, { counterStoreId: c.counterStoreId, customerType: 'GUEST', items: [{ menuItemId: c.menuItemId, quantity: 1 }] });
    const cancelled = await canteen.cancelOrder(c.staff, Number(order.id), { reason: 'Customer changed mind' });
    assert.equal(cancelled.status, 'CANCELLED');
    await assert.rejects(() => canteen.payOrder(c.staff, Number(order.id), { paymentMethod: 'CASH' }), /cannot be paid/);

    const order2 = await canteen.createOrder(c.staff, { counterStoreId: c.counterStoreId, customerType: 'GUEST', items: [{ menuItemId: c.menuItemId, quantity: 1 }] });
    await canteen.payOrder(c.staff, Number(order2.id), { paymentMethod: 'CASH' });
    await assert.rejects(() => canteen.cancelOrder(c.staff, Number(order2.id), { reason: 'too late' }), /cannot be cancelled/);
  });

  it('refund reverses stock through the existing return path and requires elevated (settlement) permission', async () => {
    const c = await setup();
    const order = await canteen.createOrder(c.staff, { counterStoreId: c.counterStoreId, customerType: 'GUEST', items: [{ menuItemId: c.menuItemId, quantity: 4 }] });
    await canteen.payOrder(c.staff, Number(order.id), { paymentMethod: 'CARD' });
    const balanceAfterSale = (await procurement.listInventory(c.admin as any)).balances.find((b: any) => b.itemId === c.itemId && b.storeId === c.counterStoreId);

    await assert.rejects(() => canteen.refundOrder(c.staff, Number(order.id), { reason: 'Wrong order' }), /permission/);
    const refunded = await canteen.refundOrder(c.manager, Number(order.id), { reason: 'Wrong order given to customer' });
    assert.equal(refunded.status, 'REFUNDED');

    const balanceAfterRefund = (await procurement.listInventory(c.admin as any)).balances.find((b: any) => b.itemId === c.itemId && b.storeId === c.counterStoreId);
    assert.equal(Number(balanceAfterRefund.quantity) - Number(balanceAfterSale.quantity), 4, 'refund must restore stock via the existing return ledger');

    await assert.rejects(() => canteen.refundOrder(c.manager, Number(order.id), { reason: 'again' }), /cannot be refunded/);
  });

  it('cross-college tenant isolation: cannot view, pay, or list another college\'s orders/counters', async () => {
    const c = await setup();
    const order = await canteen.createOrder(c.staff, { counterStoreId: c.counterStoreId, customerType: 'GUEST', items: [{ menuItemId: c.menuItemId, quantity: 1 }] });
    await assert.rejects(() => canteen.getOrder(c.cross, Number(order.id)), /not found/);
    await assert.rejects(() => canteen.payOrder(c.cross, Number(order.id), { paymentMethod: 'CASH' }), /not found/);
    await assert.rejects(() => canteen.createOrder(c.cross, { counterStoreId: c.counterStoreId, customerType: 'GUEST', items: [{ menuItemId: c.menuItemId, quantity: 1 }] }), /not found/);
    const crossMenu = await canteen.listMenu(c.cross);
    assert.equal(crossMenu.length, 0);
  });

  it('a role without canteen.order.create is denied', async () => {
    const c = await setup();
    await assert.rejects(() => canteen.createOrder(c.faculty, { counterStoreId: c.counterStoreId, customerType: 'GUEST', items: [{ menuItemId: c.menuItemId, quantity: 1 }] }), /permission/);
  });

  it('a Canteen Staff actor not assigned to a scoped counter is denied mutation on it (store scope)', async () => {
    const c = await setup();
    const [assignedStaffId] = await db('faculty_users').insert({ college_id: c.collegeId, department_id: null, name: 'Assigned Counter Staff', email: `can.assigned.${c.tag}@test.edu`, password_hash: 'x', role: 'CANTEEN_STAFF', is_active: true });
    const [otherStaffId] = await db('faculty_users').insert({ college_id: c.collegeId, department_id: null, name: 'Other Counter Staff', email: `can.other.${c.tag}@test.edu`, password_hash: 'x', role: 'CANTEEN_STAFF', is_active: true });
    const assignedStaff: CanteenActor = { facultyUserId: Number(assignedStaffId), collegeId: c.collegeId, departmentId: null, role: 'CANTEEN_STAFF' };
    const otherStaff: CanteenActor = { facultyUserId: Number(otherStaffId), collegeId: c.collegeId, departmentId: null, role: 'CANTEEN_STAFF' };
    const scopedStore = await procurement.createStore(c.admin as any, { code: `SCOPED${c.tag}`.slice(0, 60), name: 'Scoped Counter', storeType: 'CANTEEN', responsibleFacultyId: assignedStaff.facultyUserId });
    const scopedStoreId = Number(scopedStore.stores.find((s: any) => s.name === 'Scoped Counter').id);
    await procurement.createAdjustment(c.admin as any, { storeId: scopedStoreId, itemId: c.itemId, direction: 'IN', quantity: 10, reason: 'Opening stock for scoped counter' });

    // Assigned staff may operate on their own scoped counter.
    const ownOrder = await canteen.createOrder(assignedStaff, { counterStoreId: scopedStoreId, customerType: 'GUEST', items: [{ menuItemId: c.menuItemId, quantity: 1 }] });
    await canteen.payOrder(assignedStaff, Number(ownOrder.id), { paymentMethod: 'CASH' });

    // A different staff member is denied on that same scoped counter.
    await assert.rejects(
      () => canteen.createOrder(otherStaff, { counterStoreId: scopedStoreId, customerType: 'GUEST', items: [{ menuItemId: c.menuItemId, quantity: 1 }] }).then((o) => canteen.payOrder(otherStaff, Number(o.id), { paymentMethod: 'CASH' })),
      /outside your assignment scope/,
    );
  });

  it('negative stock is prevented at the counter (server-authoritative, real DB concurrency)', async () => {
    const c = await setup();
    // Opening stock is 100 from setup(); drain it down to 5 first.
    await procurement.createAdjustment(c.admin as any, { storeId: c.counterStoreId, itemId: c.itemId, direction: 'OUT', quantity: 95, reason: 'Drain for negative-stock test' });
    const orderA = await canteen.createOrder(c.staff, { counterStoreId: c.counterStoreId, customerType: 'GUEST', items: [{ menuItemId: c.menuItemId, quantity: 4 }] });
    const orderB = await canteen.createOrder(c.staff, { counterStoreId: c.counterStoreId, customerType: 'GUEST', items: [{ menuItemId: c.menuItemId, quantity: 4 }] });
    const results = await Promise.allSettled([
      canteen.payOrder(c.staff, Number(orderA.id), { paymentMethod: 'CASH' }),
      canteen.payOrder(c.staff, Number(orderB.id), { paymentMethod: 'CASH' }),
    ]);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1, 'only one of two 4-unit sales against 5 remaining units may succeed');
    const balance = (await procurement.listInventory(c.admin as any)).balances.find((b: any) => b.itemId === c.itemId && b.storeId === c.counterStoreId);
    assert.equal(Number(balance.quantity), 1, 'stock must never go negative');
  });

  it('daily settlement handoff is idempotent per counter+date and aggregates paid orders by payment method', async () => {
    const c = await setup();
    const o1 = await canteen.createOrder(c.staff, { counterStoreId: c.counterStoreId, customerType: 'GUEST', items: [{ menuItemId: c.menuItemId, quantity: 2 }] });
    await canteen.payOrder(c.staff, Number(o1.id), { paymentMethod: 'CASH' });
    const o2 = await canteen.createOrder(c.staff, { counterStoreId: c.counterStoreId, customerType: 'GUEST', items: [{ menuItemId: c.menuItemId, quantity: 1 }] });
    await canteen.payOrder(c.staff, Number(o2.id), { paymentMethod: 'CARD' });

    const today = new Date().toISOString().slice(0, 10);
    const first = await canteen.generateDailySettlement(c.manager, { counterStoreId: c.counterStoreId, businessDate: today });
    assert.equal(first.idempotent, false);
    assert.equal(Number(first.handoff.orderCount), 2);
    assert.equal(Number(first.handoff.totalSalesAmount), 60);
    assert.equal(Number(first.handoff.cashAmount), 40);
    assert.equal(Number(first.handoff.cardAmount), 20);

    const second = await canteen.generateDailySettlement(c.manager, { counterStoreId: c.counterStoreId, businessDate: today });
    assert.equal(second.idempotent, true);
    assert.equal(second.handoff.id, first.handoff.id);
    const count = await db('canteen_finance_handoffs').where({ college_id: c.collegeId, counter_store_id: c.counterStoreId, business_date: today }).count<{ c: number }>('id as c').first();
    assert.equal(Number(count?.c), 1);
  });

  it('concurrent settlement generation for the same counter+date is safe under real DB concurrency', async () => {
    const c = await setup();
    const o1 = await canteen.createOrder(c.staff, { counterStoreId: c.counterStoreId, customerType: 'GUEST', items: [{ menuItemId: c.menuItemId, quantity: 1 }] });
    await canteen.payOrder(c.staff, Number(o1.id), { paymentMethod: 'CASH' });
    const today = new Date().toISOString().slice(0, 10);
    const calls = await Promise.allSettled([
      canteen.generateDailySettlement(c.manager, { counterStoreId: c.counterStoreId, businessDate: today }),
      canteen.generateDailySettlement(c.manager, { counterStoreId: c.counterStoreId, businessDate: today }),
    ]);
    assert.equal(calls.filter((r) => r.status === 'fulfilled').length, 2);
    const count = await db('canteen_finance_handoffs').where({ college_id: c.collegeId, counter_store_id: c.counterStoreId, business_date: today }).count<{ c: number }>('id as c').first();
    assert.equal(Number(count?.c), 1, 'exactly one settlement must exist despite the race');
  });

  it('dashboard reports pending orders, today\'s sales, and available menu count, tenant-scoped', async () => {
    const c = await setup();
    const order = await canteen.createOrder(c.staff, { counterStoreId: c.counterStoreId, customerType: 'GUEST', items: [{ menuItemId: c.menuItemId, quantity: 2 }] });
    const dashBefore = await canteen.dashboard(c.admin);
    assert.equal(dashBefore.pendingOrders, 1);
    await canteen.payOrder(c.staff, Number(order.id), { paymentMethod: 'CASH' });
    const dashAfter = await canteen.dashboard(c.admin);
    assert.equal(dashAfter.pendingOrders, 0);
    assert.equal(dashAfter.todaySales, 40);
    assert.equal(dashAfter.availableMenuItems, 1);
  });
});
