import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  decideInternalPaperAccess,
  decideInternalPaperMutateAccess,
  type QpActor,
} from './access.js';

const owner: QpActor = { facultyUserId: 1, collegeId: 10, role: 'FACULTY', departmentId: 5 };
const other: QpActor = { facultyUserId: 2, collegeId: 10, role: 'FACULTY', departmentId: 5 };
const admin: QpActor = { facultyUserId: 9, collegeId: 10, role: 'COLLEGE_ADMIN', departmentId: null };
const coe: QpActor = { facultyUserId: 10, collegeId: 10, role: 'COE', departmentId: null };
const cross: QpActor = { facultyUserId: 3, collegeId: 99, role: 'FACULTY', departmentId: 1 };
const paper = { collegeId: 10, createdBy: 1, departmentId: 5 };

describe('internal question paper ownership', () => {
  it('allows owning faculty to read and mutate', () => {
    assert.equal(decideInternalPaperAccess(owner, paper), 'ALLOW');
    assert.equal(decideInternalPaperMutateAccess(owner, paper), 'ALLOW');
  });

  it('forbids peer faculty from private internal papers', () => {
    assert.equal(decideInternalPaperAccess(other, paper), 'FORBIDDEN');
    assert.equal(decideInternalPaperMutateAccess(other, paper), 'FORBIDDEN');
  });

  it('hides cross-college as NOT_FOUND', () => {
    assert.equal(decideInternalPaperAccess(cross, paper), 'NOT_FOUND');
  });

  it('allows college admin', () => {
    assert.equal(decideInternalPaperAccess(admin, paper), 'ALLOW');
    assert.equal(decideInternalPaperMutateAccess(admin, paper), 'ALLOW');
  });

  it('does not grant COE confidential paper content access by default', () => {
    assert.equal(decideInternalPaperAccess(coe, paper), 'FORBIDDEN');
    assert.equal(decideInternalPaperMutateAccess(coe, paper), 'FORBIDDEN');
  });
});
