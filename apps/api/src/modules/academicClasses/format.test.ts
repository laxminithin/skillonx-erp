import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classCode, classDisplayName, joinClassUrl, semesterTitle, subjectKindFromCourseType } from './format.js';

describe('academic class format', () => {
  it('builds the student-facing class title', () => {
    assert.equal(
      classDisplayName({ departmentCode: 'CSE', semesterNumber: 3, sectionLabel: 'A' }),
      'CSE – Semester III – Section A',
    );
  });

  it('builds a stable class code', () => {
    assert.equal(
      classCode({
        departmentCode: 'CSE',
        semesterNumber: 3,
        sectionLabel: 'A',
        yearLabel: '2026–27',
      }),
      'CSE-3A-2026-27',
    );
  });

  it('maps elective course types without treating them as core', () => {
    assert.equal(subjectKindFromCourseType('Professional Elective'), 'ELECTIVE');
    assert.equal(subjectKindFromCourseType('OPEN ELECTIVE'), 'OPEN_ELECTIVE');
    assert.equal(subjectKindFromCourseType(null), 'CORE');
  });

  it('formats the public join URL', () => {
    assert.equal(joinClassUrl('https://survey.skillonx.net/', '7GKH92'), 'https://survey.skillonx.net/join/class/7GKH92');
  });

  it('uses roman numerals for semester titles', () => {
    assert.equal(semesterTitle('3', 3), 'Semester III');
  });
});
