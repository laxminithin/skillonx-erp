import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { decideQuizAccess, canManageAllQuizzes } from './access.js';

const quiz = { collegeId: 1, createdBy: 100 };

describe('decideQuizAccess', () => {
  it('lets a faculty member manage their own quiz', () => {
    const actor = { facultyUserId: 100, collegeId: 1, role: 'FACULTY' };
    assert.equal(decideQuizAccess(actor, quiz), 'ALLOW');
  });

  it("forbids a faculty member from another faculty member's quiz in the same college", () => {
    const actor = { facultyUserId: 200, collegeId: 1, role: 'FACULTY' };
    assert.equal(decideQuizAccess(actor, quiz), 'FORBIDDEN');
  });

  it('lets a college admin manage any quiz in their institution', () => {
    const actor = { facultyUserId: 300, collegeId: 1, role: 'COLLEGE_ADMIN' };
    assert.equal(decideQuizAccess(actor, quiz), 'ALLOW');
  });

  it('hides cross-college quizzes from a college admin as NOT_FOUND', () => {
    const actor = { facultyUserId: 300, collegeId: 2, role: 'COLLEGE_ADMIN' };
    assert.equal(decideQuizAccess(actor, quiz), 'NOT_FOUND');
  });

  it('hides cross-college quizzes from faculty as NOT_FOUND (never FORBIDDEN)', () => {
    const actor = { facultyUserId: 100, collegeId: 2, role: 'FACULTY' };
    assert.equal(decideQuizAccess(actor, quiz), 'NOT_FOUND');
  });

  it('lets a super admin manage quizzes across institutions', () => {
    const actor = { facultyUserId: 1, collegeId: 99, role: 'SUPER_ADMIN' };
    assert.equal(decideQuizAccess(actor, quiz), 'ALLOW');
  });
});

describe('canManageAllQuizzes', () => {
  it('is true only for admin roles', () => {
    assert.equal(canManageAllQuizzes('SUPER_ADMIN'), true);
    assert.equal(canManageAllQuizzes('COLLEGE_ADMIN'), true);
    assert.equal(canManageAllQuizzes('FACULTY'), false);
    assert.equal(canManageAllQuizzes('HOD'), false);
  });
});
