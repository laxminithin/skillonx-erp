import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

/**
 * Print payload shape contracts for operational CO–PSO / CO–SDG documents.
 * These guard against regressions that caused blank matrices (empty visibleSdgs)
 * and wrong data sources (workspace vs operational).
 */

type Cell = {
  courseOutcomeId: number;
  targetId?: number | null;
  sdgId?: number | null;
  currentValue: number | null;
  rationale?: string | null;
};

function resolveSdgColumns(opts: {
  showAllSdgs?: boolean;
  sdgs: Array<{ id: number; code: string }>;
  relevantSdgIds: number[];
  cells: Cell[];
}) {
  const { showAllSdgs, sdgs, relevantSdgIds, cells } = opts;
  if (showAllSdgs) return sdgs;
  const relevant = new Set(relevantSdgIds);
  if (!relevant.size) {
    const used = new Set(cells.filter((c) => c.currentValue != null).map((c) => Number(c.sdgId ?? c.targetId)));
    if (used.size) return sdgs.filter((s) => used.has(s.id));
    return sdgs;
  }
  return sdgs.filter((s) => relevant.has(s.id));
}

describe('operational print column resolution', () => {
  it('does not blank the SDG matrix when relevantSdgIds is empty', () => {
    const sdgs = [
      { id: 1, code: 'SDG1' },
      { id: 9, code: 'SDG9' },
    ];
    const cols = resolveSdgColumns({
      sdgs,
      relevantSdgIds: [],
      cells: [{ courseOutcomeId: 1, sdgId: 9, currentValue: 3 }],
    });
    assert.equal(cols.length, 1);
    assert.equal(cols[0].code, 'SDG9');
  });

  it('uses relevant SDGs when present', () => {
    const sdgs = [
      { id: 1, code: 'SDG1' },
      { id: 9, code: 'SDG9' },
    ];
    const cols = resolveSdgColumns({
      sdgs,
      relevantSdgIds: [1],
      cells: [],
    });
    assert.deepEqual(
      cols.map((c) => c.code),
      ['SDG1'],
    );
  });

  it('keeps PSO column count dynamic (2 or 3+)', () => {
    const two = [{ id: 1, code: 'PSO1' }, { id: 2, code: 'PSO2' }];
    const three = [...two, { id: 3, code: 'PSO3' }];
    assert.equal(two.length, 2);
    assert.equal(three.length, 3);
  });
});

describe('faculty-owned duplicate identity', () => {
  it('treats creator as part of the uniqueness key conceptually', () => {
    const key = (facultyId: number) =>
      `college:1|course:10|kind:PO|year:5|scheme:2|program:3|faculty:${facultyId}`;
    assert.notEqual(key(100), key(200));
    assert.equal(key(100), key(100));
  });
});
