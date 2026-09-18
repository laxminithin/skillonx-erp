import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hasOfficeCapability } from './access.js';

describe('Office RBAC isolation matrix', () => {
  const cases: Array<[string, boolean, boolean, boolean]> = [
    ['STUDENT', false, false, false], ['FACULTY', false, false, false], ['HOD', false, false, false],
    ['OFFICE_ADMIN', true, true, false], ['OFFICE_SUPERINTENDENT', true, true, true], ['PRINCIPAL', true, false, true],
    ['MANAGEMENT', false, false, true], ['ACCOUNTANT', false, false, false], ['COE', false, false, false],
    ['ADMISSIONS_OFFICER', false, false, false], ['LAB_ASSISTANT', false, false, false], ['MAINTENANCE', false, false, false],
    ['LIBRARIAN', false, false, false], ['WARDEN', false, false, false], ['TRANSPORT', false, false, false],
    ['T&P', false, false, false], ['HR', false, false, false], ['SUPER_ADMIN', false, false, false],
  ];
  for (const [role, canView, canAssign, canAnalytics] of cases) it(`${role} has intentional Office boundaries`, () => {
    assert.equal(hasOfficeCapability(role, 'request.view'), canView);
    assert.equal(hasOfficeCapability(role, 'assignment.manage'), canAssign);
    assert.equal(hasOfficeCapability(role, 'analytics.view'), canAnalytics);
    assert.equal(hasOfficeCapability(role, 'finance.mutate'), false);
  });
  it('all 18 role categories are represented', () => assert.equal(cases.length, 18));
});
