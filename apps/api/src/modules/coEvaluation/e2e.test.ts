import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { db } from '../../db/index.js';
import * as coEval from './service.js';
import { buildPrintModel } from './exportService.js';
import { importCoEvalMaster } from './importService.js';
import { discoverCoEvalMasterFiles } from './workbookParser.js';
import { readFile } from 'node:fs/promises';

const hasDb = Boolean(process.env.DATABASE_URL || process.env.DB_HOST || process.env.MYSQL_HOST);

describe('coEvaluation real db e2e', { skip: !hasDb && false }, () => {
  it('imports idempotently and generates TOC evaluation with ownership isolation', async () => {
    const college = await db('colleges').orderBy('id').first();
    assert.ok(college, 'college required');
    const collegeId = Number(college.id);

    const facultyA = await db('faculty_users').where({ college_id: collegeId }).orderBy('id').first();
    const facultyB = await db('faculty_users')
      .where({ college_id: collegeId })
      .whereNot('id', facultyA.id)
      .orderBy('id')
      .first();
    assert.ok(facultyA && facultyB, 'need two faculty users');

    const masters = await discoverCoEvalMasterFiles();
    assert.ok(masters.length);
    const buffer = await readFile(masters[0].filePath);
    const first = await importCoEvalMaster(
      collegeId,
      { facultyUserId: Number(facultyA.id) },
      buffer,
      masters[0].fileName,
    );
    assert.equal(first.errors.length, 0, first.errors.join('\n'));
    assert.equal(first.discovered.subjects, 15);
    assert.equal(first.discovered.coRows, 71);
    assert.equal(first.discovered.componentMappings, 313);
    assert.equal(first.discovered.justifications, 313);
    assert.equal(first.discovered.blockedSubjects, 1);
    assert.equal(first.discovered.evaluableSubjects, 14);
    assert.equal(first.blockedSubjects[0]?.courseCode, '10CS55');

    const second = await importCoEvalMaster(
      collegeId,
      { facultyUserId: Number(facultyA.id) },
      buffer,
      masters[0].fileName,
    );
    assert.ok(second.unchanged > 0);
    assert.equal(second.discovered.evaluableSubjects, 14);

    const course =
      (await db('courses').where({ college_id: collegeId, code: 'BCS503' }).first()) ||
      (await db('co_evaluation_subject_masters as s')
        .join('courses as c', 'c.id', 's.course_id')
        .where({ 's.college_id': collegeId, 's.course_code': 'BCS503', 's.is_evaluable': true })
        .select('c.*')
        .first()) ||
      (await db('courses')
        .where({ college_id: collegeId })
        .andWhere('name', 'like', '%Theory of Computation%')
        .first());
    assert.ok(course, 'BCS503 / Theory of Computation course must exist');
    const year = await db('academic_years').where({ college_id: collegeId }).orderBy('id', 'desc').first();
    assert.ok(year);

    const actorA = {
      facultyUserId: Number(facultyA.id),
      collegeId,
      role: 'FACULTY',
      departmentId: facultyA.department_id == null ? null : Number(facultyA.department_id),
    };
    const actorB = {
      facultyUserId: Number(facultyB.id),
      collegeId,
      role: 'FACULTY',
      departmentId: facultyB.department_id == null ? null : Number(facultyB.department_id),
    };

    // Clean prior test evaluations for these faculty on BCS503
    const prior = await db('faculty_co_evaluations')
      .where({ college_id: collegeId, course_id: course.id })
      .whereIn('created_by', [facultyA.id, facultyB.id])
      .select('id');
    if (prior.length) {
      await db('faculty_co_evaluations')
        .whereIn(
          'id',
          prior.map((p) => p.id),
        )
        .del();
    }

    const preview = await coEval.previewGeneration(actorA, {
      courseId: Number(course.id),
      academicYearId: Number(year.id),
    });
    assert.equal(preview.found, true);
    assert.equal(preview.counts?.courseOutcomes, 5);

    const created = await coEval.createFromMaster(actorA, {
      courseId: Number(course.id),
      academicYearId: Number(year.id),
    });
    assert.equal(created.cos.length, 5);
    assert.ok(created.components.length >= 3);
    assert.equal(created.status, 'DRAFT');
    assert.equal(created.validation.okForFinalize, true);

    // Dynamic columns present
    const names = created.components.map((c) => c.displayName);
    assert.ok(names.some((n) => /IA-1/i.test(n)));

    // Change one cell
    const cell = created.cells.find(
      (c) => c.coCode === 'CO1' && c.masterValue != null && Number(c.masterValue) > 0,
    );
    assert.ok(cell);
    const newValue = Number(cell!.masterValue) + 1;
    const updated = await coEval.updateCell(actorA, created.id, cell!.id, {
      currentValue: newValue,
      changeJustification: 'CO1 assessed more extensively in this delivery plan.',
    });
    const updatedCell = updated.cells.find((c) => c.id === cell!.id)!;
    assert.equal(Number(updatedCell.masterValue), Number(cell!.masterValue));
    assert.equal(Number(updatedCell.currentValue), newValue);
    assert.equal(updatedCell.modified, true);
    assert.ok(updated.validation.modifiedCellCount >= 1);

    // Ownership: Faculty B cannot list A's evaluation
    const listB = await coEval.listEvaluations(actorB);
    assert.ok(!listB.evaluations.some((e) => e.id === created.id));

    // Reset cell
    const resetOne = await coEval.resetCell(actorA, created.id, cell!.id);
    assert.equal(
      Number(resetOne.cells.find((c) => c.id === cell!.id)!.currentValue),
      Number(cell!.masterValue),
    );

    // Change again, fix totals by adjusting another cell if needed, finalize
    const again = await coEval.updateCell(actorA, created.id, cell!.id, {
      currentValue: Number(cell!.masterValue),
      changeJustification: null,
    });
    // Ensure valid then finalize
    if (!again.validation.okForFinalize) {
      await coEval.resetToStandard(actorA, created.id);
    }
    const finalized = await coEval.finalizeEvaluation(actorA, created.id);
    assert.equal(finalized.status, 'FINALIZED');

    // Snapshot immutability: reimport shouldn't change finalized current values
    const beforeCells = finalized.cells.map((c) => ({
      id: c.id,
      current: c.currentValue,
      master: c.masterValue,
    }));
    await importCoEvalMaster(collegeId, { facultyUserId: Number(facultyA.id) }, buffer, masters[0].fileName);
    const after = await coEval.getEvaluation(created.id, collegeId);
    assert.equal(after.status, 'FINALIZED');
    for (const b of beforeCells) {
      const a = after.cells.find((c) => c.id === b.id)!;
      assert.equal(Number(a.currentValue), Number(b.current));
      assert.equal(Number(a.masterValue), Number(b.master));
    }

    // Print model uses faculty owner
    const print = buildPrintModel(after);
    assert.equal(print.preparedBy, after.facultyName);
    assert.equal(print.subjectCode, String(after.courseCode));
    assert.ok(/BCS503|TOC/i.test(String(after.courseCode)) || /Theory of Computation/i.test(after.subjectName));

    // Second subject with different structure (INTEGRATED)
    const bis = await db('courses').where({ college_id: collegeId, code: 'BIS701' }).first();
    if (bis) {
      await db('faculty_co_evaluations')
        .where({ college_id: collegeId, course_id: bis.id, created_by: facultyA.id })
        .del();
      const integrated = await coEval.createFromMaster(actorA, {
        courseId: Number(bis.id),
        academicYearId: Number(year.id),
      });
      assert.ok(integrated.components.some((c) => /Lab/i.test(c.displayName)));
      assert.notEqual(
        integrated.components.map((c) => c.assessmentComponentId).sort().join(','),
        after.components.map((c) => c.assessmentComponentId).sort().join(','),
      );
    }

    // Blocked subject preview
    const blockedCourse = await db('courses').where({ college_id: collegeId, code: '10CS55' }).first();
    if (blockedCourse) {
      const blockedPreview = await coEval.previewGeneration(actorA, {
        courseId: Number(blockedCourse.id),
        academicYearId: Number(year.id),
      });
      assert.equal(blockedPreview.found, false);
      assert.match(String(blockedPreview.message || ''), /Course Outcomes|CO/i);
    }
  });
});
