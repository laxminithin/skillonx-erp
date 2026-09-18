import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeCgpa, computeSgpa, gradeForMarks, subjectPass } from './grading.js';
import { DEFAULT_GRADE_BANDS } from './types.js';

describe('examination grading', () => {
  it('assigns grade from percentage bands', () => {
    const g = gradeForMarks(86, 100, DEFAULT_GRADE_BANDS);
    assert.equal(g.grade, 'A+');
    assert.equal(g.gradePoints, 9);
  });

  it('computes SGPA from passed subjects only', () => {
    const sgpa = computeSgpa([
      { gradePoints: 9, credits: 4, resultStatus: 'PASS' },
      { gradePoints: 8, credits: 3, resultStatus: 'PASS' },
      { gradePoints: 0, credits: 3, resultStatus: 'FAIL' },
    ]);
    assert.equal(sgpa, 8.57);
  });

  it('computes CGPA across semesters', () => {
    const cgpa = computeCgpa([
      { sgpa: 8.5, creditsEarned: 20 },
      { sgpa: 9, creditsEarned: 22 },
    ]);
    assert.ok(cgpa != null && cgpa > 8.7 && cgpa < 8.8);
  });

  it('evaluates subject pass threshold', () => {
    assert.equal(subjectPass(45, 100, 40), true);
    assert.equal(subjectPass(35, 100, 40), false);
    assert.equal(subjectPass(50, 100, 40, 20, 15), false);
  });
});
