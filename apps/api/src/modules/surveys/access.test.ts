import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { decideSurveyAccess, canManageAllSurveys } from './access.js';

const survey = { collegeId: 1, createdBy: 100 };

describe('decideSurveyAccess', () => {
  it('lets a faculty member manage their own survey', () => {
    const actor = { facultyUserId: 100, collegeId: 1, role: 'FACULTY' };
    assert.equal(decideSurveyAccess(actor, survey), 'ALLOW');
  });

  it("forbids a faculty member from another faculty member's survey in the same college", () => {
    const actor = { facultyUserId: 200, collegeId: 1, role: 'FACULTY' };
    assert.equal(decideSurveyAccess(actor, survey), 'FORBIDDEN');
  });

  it('lets a college admin manage any survey in their institution', () => {
    const actor = { facultyUserId: 300, collegeId: 1, role: 'COLLEGE_ADMIN' };
    assert.equal(decideSurveyAccess(actor, survey), 'ALLOW');
  });

  it('hides cross-college surveys from a college admin as NOT_FOUND', () => {
    const actor = { facultyUserId: 300, collegeId: 2, role: 'COLLEGE_ADMIN' };
    assert.equal(decideSurveyAccess(actor, survey), 'NOT_FOUND');
  });

  it('hides cross-college surveys from faculty as NOT_FOUND (never FORBIDDEN)', () => {
    const actor = { facultyUserId: 100, collegeId: 2, role: 'FACULTY' };
    assert.equal(decideSurveyAccess(actor, survey), 'NOT_FOUND');
  });

  it('lets a super admin manage surveys across institutions', () => {
    const actor = { facultyUserId: 1, collegeId: 99, role: 'SUPER_ADMIN' };
    assert.equal(decideSurveyAccess(actor, survey), 'ALLOW');
  });

  it('treats HOD/coordinator roles as faculty (own surveys only)', () => {
    const owner = { facultyUserId: 100, collegeId: 1, role: 'HOD' };
    const other = { facultyUserId: 200, collegeId: 1, role: 'HOD' };
    assert.equal(decideSurveyAccess(owner, survey), 'ALLOW');
    assert.equal(decideSurveyAccess(other, survey), 'FORBIDDEN');
  });
});

describe('canManageAllSurveys', () => {
  it('is true only for admin roles', () => {
    assert.equal(canManageAllSurveys('SUPER_ADMIN'), true);
    assert.equal(canManageAllSurveys('COLLEGE_ADMIN'), true);
    assert.equal(canManageAllSurveys('FACULTY'), false);
    assert.equal(canManageAllSurveys('HOD'), false);
  });
});
