import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canApproveMappings,
  canEditMapping,
  canManageAllOperationalMappings,
  canManageOfficialMasters,
  decideMappingReadAccess,
  decideMasterWriteAccess,
  decideOperationalMappingAccess,
  decideOperationalMappingMutateAccess,
} from './access.js';

describe('CO–PO access', () => {
  it('restricts official master writes to college and platform admins', () => {
    assert.equal(canManageOfficialMasters('SUPER_ADMIN'), true);
    assert.equal(canManageOfficialMasters('COLLEGE_ADMIN'), true);
    assert.equal(canManageOfficialMasters('HOD'), false);
    assert.equal(canManageOfficialMasters('FACULTY'), false);
    assert.equal(canManageOfficialMasters('NBA_COORDINATOR'), false);
  });

  it('lets HOD and NBA coordinators approve mappings', () => {
    assert.equal(canApproveMappings('HOD'), true);
    assert.equal(canApproveMappings('NBA_COORDINATOR'), true);
    assert.equal(canApproveMappings('IQAC_COORDINATOR'), true);
    assert.equal(canApproveMappings('FACULTY'), false);
  });

  it('lets faculty edit drafts only when assigned', () => {
    assert.equal(canEditMapping('FACULTY', 'DRAFT', true), true);
    assert.equal(canEditMapping('FACULTY', 'DRAFT', false), false);
    assert.equal(canEditMapping('FACULTY', 'APPROVED', true), false);
    assert.equal(canEditMapping('COLLEGE_ADMIN', 'APPROVED', false), true);
    assert.equal(canEditMapping('SUPER_ADMIN', 'APPROVED', false), true);
    assert.equal(canEditMapping('FACULTY', 'SUBMITTED', true), false);
  });

  it('hides another college as not found', () => {
    const actor = { facultyUserId: 1, collegeId: 2, role: 'COLLEGE_ADMIN' };
    assert.equal(decideMasterWriteAccess(actor, 9), 'NOT_FOUND');
    assert.equal(
      decideMappingReadAccess(actor, { collegeId: 9, createdBy: 1 }),
      'NOT_FOUND',
    );
  });

  it('lets assigned faculty read their mapping', () => {
    const actor = { facultyUserId: 10, collegeId: 1, role: 'FACULTY' };
    assert.equal(
      decideMappingReadAccess(actor, { collegeId: 1, assignedFacultyIds: [10] }),
      'ALLOW',
    );
    assert.equal(
      decideMappingReadAccess(actor, { collegeId: 1, assignedFacultyIds: [99], createdBy: 3 }),
      'FORBIDDEN',
    );
  });
});

describe('operational mapping ownership (Survey-aligned)', () => {
  const mapping = { collegeId: 1, createdBy: 100, departmentId: 5 };

  it('lets Faculty A read their own operational mapping', () => {
    const actor = { facultyUserId: 100, collegeId: 1, role: 'FACULTY' };
    assert.equal(decideOperationalMappingAccess(actor, mapping), 'ALLOW');
    assert.equal(decideOperationalMappingMutateAccess(actor, mapping), 'ALLOW');
  });

  it('forbids Faculty B from Faculty A mapping in the same college', () => {
    const actor = { facultyUserId: 200, collegeId: 1, role: 'FACULTY' };
    assert.equal(decideOperationalMappingAccess(actor, mapping), 'FORBIDDEN');
    assert.equal(decideOperationalMappingMutateAccess(actor, mapping), 'FORBIDDEN');
  });

  it('does not grant access merely because Faculty B is assigned to the same subject', () => {
    const actor = { facultyUserId: 200, collegeId: 1, role: 'FACULTY' };
    assert.equal(
      decideOperationalMappingAccess(actor, {
        ...mapping,
        assignedFacultyIds: [200, 100],
      }),
      'FORBIDDEN',
    );
  });

  it('lets college admin manage institution operational mappings', () => {
    const actor = { facultyUserId: 300, collegeId: 1, role: 'COLLEGE_ADMIN' };
    assert.equal(decideOperationalMappingAccess(actor, mapping), 'ALLOW');
    assert.equal(decideOperationalMappingMutateAccess(actor, mapping), 'ALLOW');
    assert.equal(canManageAllOperationalMappings('COLLEGE_ADMIN'), true);
  });

  it('hides cross-tenant operational mappings as NOT_FOUND', () => {
    const actor = { facultyUserId: 100, collegeId: 2, role: 'FACULTY' };
    assert.equal(decideOperationalMappingAccess(actor, mapping), 'NOT_FOUND');
    const admin = { facultyUserId: 1, collegeId: 2, role: 'COLLEGE_ADMIN' };
    assert.equal(decideOperationalMappingAccess(admin, mapping), 'NOT_FOUND');
  });

  it('lets super admin access across institutions', () => {
    const actor = { facultyUserId: 1, collegeId: 99, role: 'SUPER_ADMIN' };
    assert.equal(decideOperationalMappingAccess(actor, mapping), 'ALLOW');
  });

  it('retains HOD department review read access', () => {
    const hod = { facultyUserId: 50, collegeId: 1, role: 'HOD', departmentId: 5 };
    assert.equal(decideOperationalMappingAccess(hod, mapping), 'ALLOW');
    // Mutate still requires creator (or admin) — HOD cannot edit another faculty draft by default
    assert.equal(decideOperationalMappingMutateAccess(hod, mapping), 'FORBIDDEN');
  });
});
