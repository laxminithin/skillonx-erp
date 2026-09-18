import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canManageAllLessonPlans, decideLessonPlanAccess } from './access.js';

const plan = { collegeId: 1, createdBy: 100 };

describe('decideLessonPlanAccess', () => {
  it('lets a faculty member manage their own lesson plan', () => {
    const actor = { facultyUserId: 100, collegeId: 1, role: 'FACULTY' };
    assert.equal(decideLessonPlanAccess(actor, plan), 'ALLOW');
  });

  it("forbids another faculty member's lesson plan in the same college", () => {
    const actor = { facultyUserId: 200, collegeId: 1, role: 'FACULTY' };
    assert.equal(decideLessonPlanAccess(actor, plan), 'FORBIDDEN');
  });

  it('lets a college admin manage plans in their institution', () => {
    const actor = { facultyUserId: 300, collegeId: 1, role: 'COLLEGE_ADMIN' };
    assert.equal(decideLessonPlanAccess(actor, plan), 'ALLOW');
  });

  it('hides cross-college plans as NOT_FOUND', () => {
    const actor = { facultyUserId: 300, collegeId: 2, role: 'COLLEGE_ADMIN' };
    assert.equal(decideLessonPlanAccess(actor, plan), 'NOT_FOUND');
    const faculty = { facultyUserId: 100, collegeId: 2, role: 'FACULTY' };
    assert.equal(decideLessonPlanAccess(faculty, plan), 'NOT_FOUND');
  });

  it('lets a super admin manage plans across institutions', () => {
    const actor = { facultyUserId: 1, collegeId: 99, role: 'SUPER_ADMIN' };
    assert.equal(decideLessonPlanAccess(actor, plan), 'ALLOW');
  });
});

describe('canManageAllLessonPlans', () => {
  it('is true only for admin roles', () => {
    assert.equal(canManageAllLessonPlans('SUPER_ADMIN'), true);
    assert.equal(canManageAllLessonPlans('COLLEGE_ADMIN'), true);
    assert.equal(canManageAllLessonPlans('FACULTY'), false);
    assert.equal(canManageAllLessonPlans('HOD'), false);
  });
});
