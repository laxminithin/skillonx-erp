import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hasTransportPermission, transportPermissionsForRole } from './access.js';
import type { TransportActor } from './types.js';

const actor = (role: string): TransportActor => ({
  facultyUserId: 1,
  collegeId: 1,
  departmentId: null,
  role,
});

describe('transport ownership and RBAC', () => {
  it('keeps routine operations with Transport Officer', () => {
    assert.equal(hasTransportPermission(actor('TRANSPORT_OFFICER'), 'transport.route.manage'), true);
    assert.equal(hasTransportPermission(actor('TRANSPORT_OFFICER'), 'transport.assignment.manage'), true);
    assert.equal(hasTransportPermission(actor('TRANSPORT_OFFICER'), 'transport.pass.manage'), true);
  });

  it('does not grant generic admin routine transport mutation', () => {
    for (const role of ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'HOD', 'FACULTY', 'ACCOUNTANT', 'MANAGEMENT']) {
      assert.equal(hasTransportPermission(actor(role), 'transport.assignment.manage'), false, role);
      assert.equal(hasTransportPermission(actor(role), 'transport.pass.manage'), false, role);
    }
  });

  it('keeps platform/admin roles limited to oversight/configuration', () => {
    assert.deepEqual(transportPermissionsForRole('SUPER_ADMIN'), ['transport.view', 'transport.config.manage', 'transport.report.view']);
    assert.equal(hasTransportPermission(actor('SUPER_ADMIN'), 'transport.route.manage'), false);
    assert.equal(hasTransportPermission(actor('COLLEGE_ADMIN'), 'transport.config.manage'), true);
  });

  it('keeps finance and maintenance boundaries explicit', () => {
    assert.equal(hasTransportPermission(actor('ACCOUNTANT'), 'transport.view'), false);
    assert.equal(hasTransportPermission(actor('MAINTENANCE_STAFF'), 'transport.maintenance.manage'), false);
    assert.equal(hasTransportPermission(actor('TRANSPORT_OFFICER'), 'transport.maintenance.manage'), false);
  });
});
