import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { db } from '../../db/index.js';
import * as procurement from '../procurement/service.js';
import * as assets from './service.js';
import type { AssetActor } from './types.js';

async function setup(tag = `A${Date.now()}${Math.floor(Math.random() * 10000)}`) {
  const [collegeId] = await db('colleges').insert({ name: `Asset College ${tag}`, code: `AC${tag}`.slice(0, 60) });
  const [otherCollegeId] = await db('colleges').insert({ name: `Other Asset College ${tag}`, code: `OA${tag}`.slice(0, 60) });
  const [deptId] = await db('departments').insert({ college_id: collegeId, name: 'IT Services', code: `IT${tag}`.slice(0, 60) });
  const [adminId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Asset Admin', email: `asset.admin.${tag}@test.edu`, password_hash: 'x', role: 'COLLEGE_ADMIN', is_active: true });
  const [managerId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Facilities Officer', email: `asset.facil.${tag}@test.edu`, password_hash: 'x', role: 'FACILITIES_OFFICER', is_active: true });
  const [facultyId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Faculty Viewer', email: `asset.fac.${tag}@test.edu`, password_hash: 'x', role: 'FACULTY', is_active: true });
  const [custodianId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Custodian', email: `asset.cust.${tag}@test.edu`, password_hash: 'x', role: 'FACULTY', is_active: true });
  const [crossAdminId] = await db('faculty_users').insert({ college_id: otherCollegeId, name: 'Cross Admin', email: `asset.cross.${tag}@test.edu`, password_hash: 'x', role: 'COLLEGE_ADMIN', is_active: true });
  const [roomId] = await db('rooms').insert({ college_id: collegeId, name: `Server Room ${tag}`, code: `SR${tag}`.slice(0, 60), type: 'OTHER' });

  const admin: AssetActor = { facultyUserId: Number(adminId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'COLLEGE_ADMIN' };
  const manager: AssetActor = { facultyUserId: Number(managerId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'FACILITIES_OFFICER' };
  const viewer: AssetActor = { facultyUserId: Number(facultyId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'FACULTY' };
  const cross: AssetActor = { facultyUserId: Number(crossAdminId), collegeId: Number(otherCollegeId), departmentId: null, role: 'COLLEGE_ADMIN' };

  const vendor = await procurement.createVendor(admin as any, { vendorCode: `AVEN${tag}`.slice(0, 60), name: `Asset Vendor ${tag}` });

  return { admin, manager, viewer, cross, deptId: Number(deptId), roomId: Number(roomId), custodianId: Number(custodianId), vendorId: Number(vendor.vendors[0].id), tag };
}

describe('Campus OS Phase 0: shared Asset Management engine', () => {
  it('registers an asset with tenant/vendor/department/room validation and duplicate tag protection', async () => {
    const c = await setup();
    const asset = await assets.registerAsset(c.admin, { assetTag: `TAG-${c.tag}`, name: 'Projector', category: 'IT_EQUIPMENT', vendorId: c.vendorId, departmentId: c.deptId, locationRoomId: c.roomId });
    assert.equal(asset.status, 'IN_STOCK');
    assert.equal(asset.vendorName, `Asset Vendor ${c.tag}`);
    assert.equal(asset.history.length, 1);
    assert.equal(asset.history[0].action, 'REGISTERED');

    await assert.rejects(() => assets.registerAsset(c.admin, { assetTag: `TAG-${c.tag}`, name: 'Duplicate', category: 'IT_EQUIPMENT' }), /Duplicate entry/);
    await assert.rejects(() => assets.registerAsset(c.admin, { assetTag: `TAG2-${c.tag}`, name: 'Bad vendor', category: 'IT_EQUIPMENT', vendorId: 999999 }), /Vendor not found/);
    await assert.rejects(() => assets.registerAsset(c.viewer, { assetTag: `TAG3-${c.tag}`, name: 'Denied', category: 'IT_EQUIPMENT' }), /permission/);
  });

  it('cross-college access is denied (IDOR protection)', async () => {
    const c = await setup();
    const asset = await assets.registerAsset(c.admin, { assetTag: `TAGX-${c.tag}`, name: 'Router', category: 'IT_EQUIPMENT' });
    await assert.rejects(() => assets.getAsset(c.cross, Number(asset.id)), /not found/);
    await assert.rejects(() => assets.assignAsset(c.cross, Number(asset.id), { custodianFacultyId: null }), /not found/);
  });

  it('assign / transfer / return lifecycle is tracked in history', async () => {
    const c = await setup();
    const asset = await assets.registerAsset(c.manager, { assetTag: `TAGY-${c.tag}`, name: 'Laptop', category: 'IT_EQUIPMENT' });
    const assigned = await assets.assignAsset(c.manager, Number(asset.id), { custodianFacultyId: c.custodianId, reason: 'Issued to staff' });
    assert.equal(assigned.status, 'ASSIGNED');
    assert.equal(Number(assigned.custodianFacultyId), c.custodianId);

    const transferred = await assets.transferAsset(c.manager, Number(asset.id), { locationRoomId: c.roomId, reason: 'Moved to server room' });
    assert.equal(Number(transferred.locationRoomId), c.roomId);

    const returned = await assets.assignAsset(c.manager, Number(asset.id), { custodianFacultyId: null, reason: 'Returned to store' });
    assert.equal(returned.status, 'IN_STOCK');
    assert.equal(returned.custodianFacultyId, null);

    const final = await assets.getAsset(c.manager, Number(asset.id));
    const actions = final.history.map((h: any) => h.action).reverse();
    assert.deepEqual(actions, ['REGISTERED', 'ASSIGNED', 'TRANSFERRED', 'RETURNED']);
  });

  it('retire/dispose are terminal and reject further lifecycle actions', async () => {
    const c = await setup();
    const asset = await assets.registerAsset(c.manager, { assetTag: `TAGZ-${c.tag}`, name: 'Old scanner', category: 'IT_EQUIPMENT' });
    await assert.rejects(() => assets.changeStatus(c.viewer, Number(asset.id), { status: 'RETIRED' }), /permission/);
    const retired = await assets.changeStatus(c.manager, Number(asset.id), { status: 'RETIRED', reason: 'End of life' });
    assert.equal(retired.status, 'RETIRED');
    await assert.rejects(() => assets.changeStatus(c.manager, Number(asset.id), { status: 'ACTIVE' }), /terminal state/);
    await assert.rejects(() => assets.assignAsset(c.manager, Number(asset.id), { custodianFacultyId: c.custodianId }), /cannot be reassigned/);
    await assert.rejects(() => assets.updateCondition(c.manager, Number(asset.id), { condition: 'GOOD' }), /can no longer be updated/);
  });

  it('rejects an invalid, non-adjacent status transition', async () => {
    const c = await setup();
    const asset = await assets.registerAsset(c.manager, { assetTag: `TAGW-${c.tag}`, name: 'Camera', category: 'IT_EQUIPMENT' });
    await assets.changeStatus(c.manager, Number(asset.id), { status: 'LOST' });
    await assert.rejects(() => assets.changeStatus(c.manager, Number(asset.id), { status: 'ACTIVE' }), /Invalid asset status transition/);
  });

  it('concurrent status changes do not corrupt history (row-locked)', async () => {
    const c = await setup();
    const asset = await assets.registerAsset(c.manager, { assetTag: `TAGV-${c.tag}`, name: 'Switch', category: 'IT_EQUIPMENT' });
    const calls = await Promise.allSettled([
      assets.changeStatus(c.manager, Number(asset.id), { status: 'ACTIVE' }),
      assets.changeStatus(c.manager, Number(asset.id), { status: 'UNDER_MAINTENANCE' }),
    ]);
    assert.equal(calls.filter((r) => r.status === 'fulfilled').length, 2);
    const final = await assets.getAsset(c.manager, Number(asset.id));
    // Sequential row-locked transitions: exactly one STATUS_CHANGED per call, no lost updates.
    assert.equal(final.history.filter((h: any) => h.action === 'STATUS_CHANGED').length, 2);
  });

  it('list filters by category/status/department and stays tenant-scoped', async () => {
    const c = await setup();
    await assets.registerAsset(c.manager, { assetTag: `TAGU-${c.tag}`, name: 'Fridge', category: 'FURNITURE' });
    await assets.registerAsset(c.manager, { assetTag: `TAGT-${c.tag}`, name: 'Router 2', category: 'IT_EQUIPMENT', departmentId: c.deptId });
    const itOnly = await assets.listAssets(c.admin, { category: 'IT_EQUIPMENT' });
    assert.ok(itOnly.every((a: any) => a.category === 'IT_EQUIPMENT'));
    const crossList = await assets.listAssets(c.cross);
    assert.equal(crossList.length, 0);
  });
});
