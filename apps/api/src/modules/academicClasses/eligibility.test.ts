import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  describeClass,
  evaluateClassEligibility,
  snapshotFromRegistration,
} from './eligibility.js';

const cse3a = {
  collegeId: 4,
  programId: 3,
  departmentId: 7,
  semesterId: 3,
  classSectionId: 7,
  schemeId: 5,
  academicYearId: 4,
};

const labels = {
  class: { departmentCode: 'CSE', semesterNumber: 3, sectionLabel: 'A' },
  student: { departmentCode: 'CSE', semesterNumber: 3, sectionLabel: 'A' },
};

describe('class enrollment eligibility', () => {
  it('allows a matching CSE 3A registration', () => {
    const result = evaluateClassEligibility(cse3a, cse3a, labels);
    assert.equal(result.ok, true);
  });

  it('rejects a different section without altering the student profile', () => {
    const result = evaluateClassEligibility(
      { ...cse3a, classSectionId: 8 },
      cse3a,
      {
        class: labels.class,
        student: { ...labels.student, sectionLabel: 'B' },
      },
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.message, /CSE Semester 3 Section A/);
    assert.match(result.message, /Section B/);
    assert.equal(result.mismatches[0]?.field, 'classSectionId');
  });

  it('rejects a different branch', () => {
    const result = evaluateClassEligibility({ ...cse3a, departmentId: 9 }, cse3a, {
      class: labels.class,
      student: { departmentCode: 'ISE', semesterNumber: 3, sectionLabel: 'A' },
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.message, /branch/);
  });

  it('treats missing optional scheme as compatible', () => {
    const result = evaluateClassEligibility({ ...cse3a, schemeId: null }, cse3a, labels);
    assert.equal(result.ok, true);
  });

  it('describes the class in student-facing copy', () => {
    assert.equal(describeClass({ departmentCode: 'CSE', semesterNumber: 3, sectionLabel: 'A' }), 'CSE Semester 3 Section A');
  });

  it('maps a semester registration row onto the eligibility snapshot', () => {
    const snap = snapshotFromRegistration({
      college_id: 4,
      program_id: 3,
      department_id: 7,
      semester_id: 3,
      class_section_id: 7,
      scheme_id: 5,
      academic_year_id: 4,
    });
    assert.deepEqual(snap, cse3a);
  });
});
