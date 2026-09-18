import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { decideAssignmentAccess, canManageAllAssignments } from './access.js';

describe('decideAssignmentAccess', () => {
  const facultyA = { facultyUserId: 1, collegeId: 10, role: 'FACULTY' };
  const facultyB = { facultyUserId: 2, collegeId: 10, role: 'FACULTY' };
  const admin = { facultyUserId: 3, collegeId: 10, role: 'COLLEGE_ADMIN' };
  const superAdmin = { facultyUserId: 9, collegeId: 99, role: 'SUPER_ADMIN' };
  const otherCollege = { facultyUserId: 4, collegeId: 20, role: 'COLLEGE_ADMIN' };
  const otherFacultyCross = { facultyUserId: 1, collegeId: 20, role: 'FACULTY' };
  const owned = { collegeId: 10, createdBy: 1 };

  it('allows owning faculty', () => {
    assert.equal(decideAssignmentAccess(facultyA, owned), 'ALLOW');
  });

  it('forbids peer faculty', () => {
    assert.equal(decideAssignmentAccess(facultyB, owned), 'FORBIDDEN');
  });

  it('allows college admin in same college', () => {
    assert.equal(decideAssignmentAccess(admin, owned), 'ALLOW');
  });

  it('hides cross-tenant as NOT_FOUND', () => {
    assert.equal(decideAssignmentAccess(otherCollege, owned), 'NOT_FOUND');
  });

  it('hides cross-college faculty as NOT_FOUND (never FORBIDDEN)', () => {
    assert.equal(decideAssignmentAccess(otherFacultyCross, owned), 'NOT_FOUND');
  });

  it('allows super admin everywhere', () => {
    assert.equal(decideAssignmentAccess(superAdmin, owned), 'ALLOW');
  });
});

describe('canManageAllAssignments ownership helpers', () => {
  it('is true only for admin roles', () => {
    assert.equal(canManageAllAssignments('SUPER_ADMIN'), true);
    assert.equal(canManageAllAssignments('COLLEGE_ADMIN'), true);
    assert.equal(canManageAllAssignments('FACULTY'), false);
    assert.equal(canManageAllAssignments('HOD'), false);
  });
});
