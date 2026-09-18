import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { decideCbsPlanAccess, decideCbsPlanMutateAccess, type CbsActor } from './access.js';

const owner: CbsActor = { facultyUserId: 1, collegeId: 10, role: 'FACULTY', departmentId: 5 };
const other: CbsActor = { facultyUserId: 2, collegeId: 10, role: 'FACULTY', departmentId: 5 };
const admin: CbsActor = { facultyUserId: 9, collegeId: 10, role: 'COLLEGE_ADMIN', departmentId: null };
const crossCollege: CbsActor = { facultyUserId: 3, collegeId: 99, role: 'FACULTY', departmentId: 1 };
const plan = { collegeId: 10, createdBy: 1, departmentId: 5 };

describe('CBS access', () => {
  it('allows owning faculty to read and mutate', () => {
    assert.equal(decideCbsPlanAccess(owner, plan), 'ALLOW');
    assert.equal(decideCbsPlanMutateAccess(owner, plan), 'ALLOW');
  });

  it('forbids peer faculty', () => {
    assert.equal(decideCbsPlanAccess(other, plan), 'FORBIDDEN');
    assert.equal(decideCbsPlanMutateAccess(other, plan), 'FORBIDDEN');
  });

  it('hides cross-college as NOT_FOUND', () => {
    assert.equal(decideCbsPlanAccess(crossCollege, plan), 'NOT_FOUND');
    assert.equal(decideCbsPlanMutateAccess(crossCollege, plan), 'NOT_FOUND');
  });

  it('allows college admin', () => {
    assert.equal(decideCbsPlanAccess(admin, plan), 'ALLOW');
    assert.equal(decideCbsPlanMutateAccess(admin, plan), 'ALLOW');
  });
});
