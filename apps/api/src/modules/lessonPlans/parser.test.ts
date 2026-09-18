import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseLessonPlanWorkbook, parseModuleLabel, scanLessonPlanFiles } from './parser.js';
import { lessonPlanSearchRoots } from './parser.js';
import path from 'node:path';

describe('lesson plan source parser', () => {
  it('parses module and unit labels without assuming five modules', () => {
    assert.deepEqual(parseModuleLabel('Module 1'), { kind: 'MODULE', number: 1, label: 'Module 1' });
    assert.deepEqual(parseModuleLabel('Unit 8'), { kind: 'UNIT', number: 8, label: 'Unit 8' });
    assert.equal(parseModuleLabel('Appendix'), null);
  });

  it('reads the actual public lesson-plan workbook', async () => {
    const scan = await scanLessonPlanFiles();
    assert.ok(scan.filesInspected.length >= 1, 'expected lesson_plan_master.xlsx');
    assert.equal(scan.subjects.length, 12);
    const names = scan.subjects.map((s) => s.name);
    assert.ok(names.includes('Big Data Analytics'));
    assert.ok(names.includes('International Business'));
    assert.ok(names.includes('Computer Networks-I'));

    const bda = scan.rows.filter((r) => r.subjectName === 'Big Data Analytics');
    const ib = scan.rows.filter((r) => r.subjectName === 'International Business');
    const cn = scan.rows.filter((r) => r.subjectName === 'Computer Networks-I');
    assert.equal(new Set(bda.map((r) => r.moduleNumber)).size, 5);
    assert.equal(new Set(ib.map((r) => r.moduleNumber)).size, 6);
    assert.equal(new Set(cn.map((r) => r.moduleNumber)).size, 8);
    assert.equal(cn[0].moduleKind, 'UNIT');
    assert.ok(bda.every((r) => r.topicName && r.subtopicName));
    assert.ok(bda[0].hoursSource === 'ESTIMATED');
    assert.ok(!bda.some((r) => r.issues.includes('Missing topic')));
    assert.equal(scan.rows.length, 665);
  });

  it('keeps teaching order and does not invent quiz-derived topics', async () => {
    const file = path.join(lessonPlanSearchRoots()[0], 'lesson_plan_master.xlsx');
    const parsed = await parseLessonPlanWorkbook(file);
    const first = parsed.rows.find((r) => r.subjectName === 'Big Data Analytics' && r.moduleNumber === 2);
    assert.equal(first?.moduleName, 'Introduction to Hadoop');
    assert.equal(first?.topicName, 'Need for Hadoop and RDBMS comparison');
    assert.ok(first?.subtopicName.includes('Why Not Only RDBMS'));
  });
});
