import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

/** Pure aggregation helper mirrored from evaluationService logic for unit test. */
function aggregateCoPerformance(
  structure: Array<{ id: number; primaryCoCode: string | null; marks: number }>,
  submissions: Array<Array<{ questionId: number; awarded: number }>>,
) {
  const structureByCo = new Map<string, { questionCount: number; marksAvailable: number }>();
  for (const q of structure) {
    const co = String(q.primaryCoCode || 'UNMAPPED').toUpperCase();
    const bucket = structureByCo.get(co) ?? { questionCount: 0, marksAvailable: 0 };
    bucket.questionCount += 1;
    bucket.marksAvailable += q.marks;
    structureByCo.set(co, bucket);
  }
  const awardedByCo = new Map<string, number>();
  for (const sub of submissions) {
    for (const a of sub) {
      const q = structure.find((x) => x.id === a.questionId);
      const co = String(q?.primaryCoCode || 'UNMAPPED').toUpperCase();
      awardedByCo.set(co, (awardedByCo.get(co) || 0) + a.awarded);
    }
  }
  const n = submissions.length;
  return [...structureByCo.entries()].map(([co, meta]) => ({
    coCode: co,
    questionCount: meta.questionCount,
    marksAvailable: meta.marksAvailable,
    classAverage: n ? Math.round(((awardedByCo.get(co) || 0) / n) * 100) / 100 : 0,
  }));
}

describe('CO performance summary aggregation', () => {
  it('computes class average per CO without calling it attainment', () => {
    const structure = [
      { id: 1, primaryCoCode: 'CO1', marks: 10 },
      { id: 2, primaryCoCode: 'CO1', marks: 10 },
      { id: 3, primaryCoCode: 'CO2', marks: 15 },
    ];
    const rows = aggregateCoPerformance(structure, [
      [
        { questionId: 1, awarded: 8 },
        { questionId: 2, awarded: 7 },
        { questionId: 3, awarded: 12 },
      ],
      [
        { questionId: 1, awarded: 10 },
        { questionId: 2, awarded: 9 },
        { questionId: 3, awarded: 15 },
      ],
    ]);
    const co1 = rows.find((r) => r.coCode === 'CO1')!;
    const co2 = rows.find((r) => r.coCode === 'CO2')!;
    assert.equal(co1.questionCount, 2);
    assert.equal(co1.marksAvailable, 20);
    assert.equal(co1.classAverage, 17); // (15+19)/2
    assert.equal(co2.classAverage, 13.5);
  });
});
