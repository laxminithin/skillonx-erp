import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { findModule, matchCourse, preferredModuleName } from './match.js';

const courses = [
  { id: 1, name: 'Big Data Analytics', code: 'BIS701' },
  { id: 2, name: 'Information and Network Security', code: 'BCS703' },
  { id: 3, name: 'Computer Networks-I', code: '10CS55' },
  { id: 4, name: 'Parallel Computing', code: 'BCS515C' },
  { id: 5, name: 'Chemistry', code: '1BCHES102' },
  { id: 6, name: 'Object Oriented Programming with Java', code: 'BCS306A' },
];

describe('lesson plan subject matching', () => {
  it('matches aliases to existing subjects instead of creating duplicates', () => {
    assert.equal(matchCourse('BDA', 'BIS701', courses).course?.id, 1);
    assert.equal(matchCourse('INS', null, courses).course?.name, 'Information and Network Security');
  it('matches TOC and Java aliases to existing catalog names', () => {
    const withToc = [...courses, { id: 7, name: 'Theory of Computation', code: 'BCS503' }];
    assert.equal(matchCourse('TOC', null, withToc).course?.id, 7);
    assert.equal(matchCourse('Java', '1BCS302', courses).course?.id, 6);
  });
  });

  it('matches by name when lesson-plan course codes differ from the catalog', () => {
    const pc = matchCourse('Parallel Computing', 'BCS702', courses);
    assert.equal(pc.mapping, 'matched');
    assert.equal(pc.course?.code, 'BCS515C');
  });

  it('matches chemistry code prefixes without duplicating the subject', () => {
    const chem = matchCourse('Chemistry', '1BCHES102/202', courses);
    assert.equal(chem.mapping, 'matched');
    assert.equal(chem.course?.id, 5);
  });

  it('reports unknown subjects instead of silently creating them', () => {
    const miss = matchCourse('Quantum Basket Weaving', 'QBW101', courses);
    assert.equal(miss.mapping, 'unmatched');
    assert.equal(miss.course, null);
  });
});

describe('module mapping', () => {
  it('reuses Module 1 even when titles are richer', () => {
    const modules = [
      { id: 10, name: 'Module 1 — Introduction to Hadoop' },
      { id: 11, name: 'Module 2 — Hive' },
    ];
    const found = findModule(modules, 'MODULE', 1, 'Introduction to Hadoop');
    assert.equal(found?.id, 10);
    assert.equal(preferredModuleName('UNIT', 8, 'Network Layer'), 'Unit 8 — Network Layer');
  });
});
