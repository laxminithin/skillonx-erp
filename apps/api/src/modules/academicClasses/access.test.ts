import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveClassAccess } from './access.js';

describe('class administration access', () => {
  it('does not let every subject lecturer approve students', () => {
    const access = resolveClassAccess({
      role: 'FACULTY',
      isCoordinator: false,
      isMapped: true,
      canManageAssignment: false,
      sameDepartment: true,
    });
    assert.equal(access.view, true);
    assert.equal(access.share, true);
    assert.equal(access.approve, false);
    assert.equal(access.manage, false);
  });

  it('lets the class coordinator approve once for the whole class', () => {
    const access = resolveClassAccess({
      role: 'FACULTY',
      isCoordinator: true,
      isMapped: true,
      canManageAssignment: false,
      sameDepartment: true,
    });
    assert.equal(access.approve, true);
    assert.equal(access.manage, true);
  });

  it('lets college admin manage class LMS links and approvals', () => {
    const access = resolveClassAccess({
      role: 'COLLEGE_ADMIN',
      isCoordinator: false,
      isMapped: false,
      canManageAssignment: false,
      sameDepartment: false,
    });
    assert.equal(access.approve, true);
    assert.equal(access.share, true);
    assert.equal(access.manage, true);
  });
});
