/**
 * Faculty Profile — HOD verifier authorization (reconciliation regression).
 *
 * Proves that Faculty Profile access consumes the canonical Academic Leadership
 * HOD authority (`hodDepartmentIds`, populated from active leadership
 * assignments) AND keeps the legacy `faculty_users.role === 'HOD'` fallback,
 * without introducing a second HOD model. Pure functions; no DB.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canViewProfile, canVerify, canActAsVerifier, isOwner } from './access.js';
import type { EmployeeScope } from './access.js';
import type { FacultyProfileActor } from './types.js';

const emp = (over: Partial<EmployeeScope> = {}): EmployeeScope => ({
  id: 2,
  collegeId: 4,
  facultyUserId: 100,
  departmentId: 8,
  employmentStatus: 'ACTIVE',
  ...over,
});

// A leadership-model HOD: faculty_users.role stays FACULTY; HOD authority comes
// from the canonical Academic Leadership enrichment (hodDepartmentIds).
const leadershipHod = (over: Partial<FacultyProfileActor> = {}): FacultyProfileActor => ({
  facultyUserId: 830,
  collegeId: 4,
  departmentId: 8,
  role: 'FACULTY',
  name: 'QA CSE HOD',
  hodDepartmentIds: [8],
  ...over,
});

// A legacy role-based HOD: no leadership enrichment, authority via role + dept.
const legacyHod = (over: Partial<FacultyProfileActor> = {}): FacultyProfileActor => ({
  facultyUserId: 831,
  collegeId: 4,
  departmentId: 8,
  role: 'HOD',
  name: 'Legacy HOD',
  ...over,
});

describe('Faculty Profile — leadership-model HOD (role=FACULTY + assignment)', () => {
  it('can view and verify a same-department colleague', () => {
    const a = leadershipHod();
    const colleague = emp({ facultyUserId: 100, departmentId: 8 });
    assert.equal(canViewProfile(a, colleague), true);
    assert.equal(canVerify(a, colleague), true);
    assert.equal(canActAsVerifier(a), true);
  });

  it('cannot verify another department', () => {
    const a = leadershipHod();
    const other = emp({ facultyUserId: 200, departmentId: 9 });
    assert.equal(canViewProfile(a, other), false);
    assert.equal(canVerify(a, other), false);
  });

  it('cannot verify another tenant (college)', () => {
    const a = leadershipHod();
    const foreign = emp({ facultyUserId: 300, departmentId: 8, collegeId: 6 });
    assert.equal(canViewProfile(a, foreign), false);
    assert.equal(canVerify(a, foreign), false);
  });

  it('cannot self-verify even as department HOD', () => {
    const a = leadershipHod();
    const own = emp({ id: 830, facultyUserId: 830, departmentId: 8 });
    assert.equal(isOwner(a, own), true);
    assert.equal(canVerify(a, own), false); // hard self-verify guard wins
  });

  it('is scoped to its assigned department only (multi-dept HOD honored)', () => {
    const a = leadershipHod({ hodDepartmentIds: [8, 12] });
    assert.equal(canVerify(a, emp({ facultyUserId: 201, departmentId: 12 })), true);
    assert.equal(canVerify(a, emp({ facultyUserId: 202, departmentId: 13 })), false);
  });
});

describe('Faculty Profile — legacy role-based HOD still authorized (no enrichment)', () => {
  it('verifies same-department colleague via role fallback', () => {
    const a = legacyHod();
    assert.equal(canVerify(a, emp({ facultyUserId: 100, departmentId: 8 })), true);
    assert.equal(canActAsVerifier(a), true);
  });

  it('is denied outside its department', () => {
    const a = legacyHod();
    assert.equal(canVerify(a, emp({ facultyUserId: 200, departmentId: 9 })), false);
  });
});

describe('Faculty Profile — non-verifiers denied', () => {
  it('plain faculty cannot verify or act as verifier', () => {
    const a: FacultyProfileActor = {
      facultyUserId: 100, collegeId: 4, departmentId: 8, role: 'FACULTY', name: 'Faculty',
      hodDepartmentIds: [],
    };
    assert.equal(canVerify(a, emp({ facultyUserId: 200, departmentId: 8 })), false);
    assert.equal(canActAsVerifier(a), false);
  });

  it('SUPER_ADMIN is excluded from academic verification', () => {
    const a: FacultyProfileActor = {
      facultyUserId: 1, collegeId: 4, departmentId: null, role: 'SUPER_ADMIN', name: 'Root',
    };
    assert.equal(canVerify(a, emp({ facultyUserId: 200, departmentId: 8 })), false);
    assert.equal(canActAsVerifier(a), false);
  });

  it('institution verifier (PRINCIPAL) retains college-wide authority', () => {
    const a: FacultyProfileActor = {
      facultyUserId: 5, collegeId: 4, departmentId: null, role: 'PRINCIPAL', name: 'Principal',
    };
    assert.equal(canVerify(a, emp({ facultyUserId: 200, departmentId: 9 })), true);
    assert.equal(canActAsVerifier(a), true);
  });
});
