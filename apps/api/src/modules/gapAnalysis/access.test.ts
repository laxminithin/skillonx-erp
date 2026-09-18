import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { decideGapAnalysisAccess, decideGapAnalysisMutateAccess } from './access.js';

const facultyA = { facultyUserId: 1, collegeId: 10, role: 'FACULTY' };
const facultyB = { facultyUserId: 2, collegeId: 10, role: 'FACULTY' };
const facultyOtherCollege = { facultyUserId: 3, collegeId: 99, role: 'FACULTY' };
const collegeAdmin = { facultyUserId: 4, collegeId: 10, role: 'COLLEGE_ADMIN' };
const superAdmin = { facultyUserId: 5, collegeId: 1, role: 'SUPER_ADMIN' };
const hod = { facultyUserId: 6, collegeId: 10, role: 'HOD', departmentId: 7 };

const owned = { collegeId: 10, createdBy: 1, departmentId: 7 };
const otherDept = { collegeId: 10, createdBy: 1, departmentId: 8 };

describe('gap analysis ownership', () => {
  it('allows owning faculty', () => {
    assert.equal(decideGapAnalysisAccess(facultyA, owned), 'ALLOW');
    assert.equal(decideGapAnalysisMutateAccess(facultyA, owned), 'ALLOW');
  });

  it('forbids same-college non-owner faculty', () => {
    assert.equal(decideGapAnalysisAccess(facultyB, owned), 'FORBIDDEN');
    assert.equal(decideGapAnalysisMutateAccess(facultyB, owned), 'FORBIDDEN');
  });

  it('returns not found for cross-tenant faculty', () => {
    assert.equal(decideGapAnalysisAccess(facultyOtherCollege, owned), 'NOT_FOUND');
    assert.equal(decideGapAnalysisMutateAccess(facultyOtherCollege, owned), 'NOT_FOUND');
  });

  it('allows college admin institution-wide', () => {
    assert.equal(decideGapAnalysisAccess(collegeAdmin, owned), 'ALLOW');
    assert.equal(decideGapAnalysisMutateAccess(collegeAdmin, owned), 'ALLOW');
  });

  it('allows super admin cross-institution', () => {
    assert.equal(decideGapAnalysisAccess(superAdmin, owned), 'ALLOW');
  });

  it('allows HOD read in department, forbids mutate unless owner', () => {
    assert.equal(decideGapAnalysisAccess(hod, owned), 'ALLOW');
    assert.equal(decideGapAnalysisAccess(hod, otherDept), 'FORBIDDEN');
    assert.equal(decideGapAnalysisMutateAccess(hod, owned), 'FORBIDDEN');
  });
});
