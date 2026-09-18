import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildMatrix, reconcileSubject } from './reconcile.js';

const catalog = [
  { id: 1, name: 'Big Data Analytics', code: 'BIS701', schemeCode: 'VTU-2022' },
  { id: 2, name: 'Chemistry', code: 'CHEM101', schemeCode: 'VTU-2022' },
  { id: 3, name: 'Computer Networks-I', code: 'CN1', schemeId: null, schemeCode: null },
  { id: 4, name: 'Database Management Systems', code: 'BCS403', schemeCode: 'VTU-2022' },
];

describe('CO–PO subject reconciliation', () => {
  it('matches course code + scheme first', () => {
    const rec = reconcileSubject({ name: 'Big Data Analytics', code: 'BIS701', scheme: '2022' }, catalog);
    assert.equal(rec.status, 'MATCHED');
    assert.equal(rec.course?.id, 1);
  });

  it('matches exact course code', () => {
    const rec = reconcileSubject({ name: 'DBMS', code: 'BCS403', scheme: '2022' }, catalog);
    assert.equal(rec.status, 'MATCHED');
    assert.equal(rec.course?.id, 4);
  });

  it('matches chemistry via alias without overwriting the existing code', () => {
    const rec = reconcileSubject(
      { name: 'Applied Chemistry for Smart Systems', code: '1BCHES102/202', scheme: '2025', aliasName: 'Chemistry' },
      catalog,
    );
    assert.equal(rec.status, 'COURSE_CODE_CONFLICT');
    assert.equal(rec.course?.id, 2);
    assert.equal(rec.existing?.code, 'CHEM101');
    assert.equal(rec.mapper.code, '1BCHES102/202');
  });

  it('reports scheme conflict for the same code on another scheme', () => {
    const rec = reconcileSubject({ name: 'Big Data Analytics', code: 'BIS701', scheme: '2018' }, catalog);
    assert.equal(rec.status, 'SCHEME_CONFLICT');
  });

  it('marks unknown subjects as NEW', () => {
    const rec = reconcileSubject({ name: 'Artificial Intelligence', code: 'BCS515B', scheme: '2022' }, catalog);
    assert.equal(rec.status, 'NEW');
    assert.equal(rec.course, null);
  });

  it('marks ambiguous name matches', () => {
    const rec = reconcileSubject(
      { name: 'Chemistry', code: 'X', scheme: '2022' },
      [...catalog, { id: 9, name: 'Chemistry', code: 'OTHER' }],
    );
    assert.equal(rec.status, 'AMBIGUOUS');
  });
});

describe('CO–PO matrix shape', () => {
  const pos = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, code: `PO${i + 1}` }));

  it('renders 3, 5, and 6 course outcomes against PO1–PO12', () => {
    for (const n of [3, 5, 6]) {
      const cos = Array.from({ length: n }, (_, i) => ({ id: i + 1, code: `CO${i + 1}` }));
      const items = [{ courseOutcomeId: 1, programOutcomeId: 1, strength: 3 as const }];
      const matrix = buildMatrix(cos, pos, items);
      assert.equal(matrix.length, n);
      assert.equal(matrix[0].cells.length, 12);
      assert.equal(matrix[0].cells[0].strength, 3);
      assert.equal(matrix[0].cells[1].strength, null);
    }
  });
});
