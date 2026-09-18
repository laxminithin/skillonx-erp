import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  mulberry32,
  pickReplacement,
  selectQuestions,
  type GeneratorPoolItem,
} from './generator.js';
import { AppError } from '../../utils/errors.js';

function item(
  id: number,
  moduleId: number,
  difficulty: 'EASY' | 'INTERMEDIATE' | 'DIFFICULT',
  extra: Partial<GeneratorPoolItem> = {},
): GeneratorPoolItem {
  return {
    id,
    courseId: 1,
    moduleId,
    difficulty,
    fingerprint: extra.fingerprint ?? `q-${id}`,
    reviewStatus: extra.reviewStatus ?? 'APPROVED',
    ...extra,
  };
}

function poolFor(modules: number[], perDiff: number) {
  const items: GeneratorPoolItem[] = [];
  let id = 1;
  for (const moduleId of modules) {
    for (const difficulty of ['EASY', 'INTERMEDIATE', 'DIFFICULT'] as const) {
      for (let i = 0; i < perDiff; i += 1) {
        items.push(item(id, moduleId, difficulty));
        id += 1;
      }
    }
  }
  return items;
}

describe('quiz generator selection', () => {
  it('selects 10 Easy + 5 Intermediate + 5 Difficult = 20', () => {
    const result = selectQuestions(poolFor([1], 20), {
      courseId: 1,
      moduleIds: [1],
      easyCount: 10,
      intermediateCount: 5,
      difficultCount: 5,
      distribution: 'BALANCED',
    });
    assert.equal(result.selectedIds.length, 20);
    assert.equal(result.byDifficulty.EASY, 10);
    assert.equal(result.byDifficulty.INTERMEDIATE, 5);
    assert.equal(result.byDifficulty.DIFFICULT, 5);
  });

  it('selects 0 Easy + 10 Intermediate + 10 Difficult = 20', () => {
    const result = selectQuestions(poolFor([1], 20), {
      courseId: 1,
      moduleIds: [1],
      easyCount: 0,
      intermediateCount: 10,
      difficultCount: 10,
      distribution: 'BALANCED',
    });
    assert.equal(result.selectedIds.length, 20);
    assert.equal(result.byDifficulty.EASY, 0);
    assert.equal(result.byDifficulty.INTERMEDIATE, 10);
    assert.equal(result.byDifficulty.DIFFICULT, 10);
  });

  it('uses only selected modules', () => {
    const pool = [...poolFor([1], 10), ...poolFor([2], 10).map((p) => ({ ...p, id: p.id + 100 }))];
    const result = selectQuestions(pool, {
      courseId: 1,
      moduleIds: [1],
      easyCount: 5,
      intermediateCount: 0,
      difficultCount: 0,
      distribution: 'RANDOM',
    });
    const selected = new Set(result.selectedIds);
    for (const p of pool) {
      if (selected.has(p.id)) assert.equal(p.moduleId, 1);
    }
  });

  it('never selects another subject', () => {
    const pool = [
      ...poolFor([1], 8),
      item(900, 1, 'EASY', { courseId: 2, fingerprint: 'other-subject' }),
    ];
    const result = selectQuestions(pool, {
      courseId: 1,
      moduleIds: [1],
      easyCount: 8,
      intermediateCount: 0,
      difficultCount: 0,
      distribution: 'RANDOM',
    });
    assert.equal(result.selectedIds.includes(900), false);
  });

  it('Easy request returns only EASY', () => {
    const result = selectQuestions(poolFor([1], 12), {
      courseId: 1,
      moduleIds: [1],
      easyCount: 6,
      intermediateCount: 0,
      difficultCount: 0,
      distribution: 'RANDOM',
    });
    assert.equal(result.byDifficulty.EASY, 6);
    assert.equal(result.byDifficulty.INTERMEDIATE, 0);
    assert.equal(result.byDifficulty.DIFFICULT, 0);
  });

  it('Intermediate request returns only INTERMEDIATE', () => {
    const result = selectQuestions(poolFor([1], 12), {
      courseId: 1,
      moduleIds: [1],
      easyCount: 0,
      intermediateCount: 4,
      difficultCount: 0,
      distribution: 'RANDOM',
    });
    assert.equal(result.byDifficulty.INTERMEDIATE, 4);
    assert.equal(result.selectedIds.length, 4);
  });

  it('Difficult request returns only DIFFICULT', () => {
    const result = selectQuestions(poolFor([1], 12), {
      courseId: 1,
      moduleIds: [1],
      easyCount: 0,
      intermediateCount: 0,
      difficultCount: 7,
      distribution: 'RANDOM',
    });
    assert.equal(result.byDifficulty.DIFFICULT, 7);
  });

  it('insufficient inventory returns a clean validation error', () => {
    assert.throws(
      () =>
        selectQuestions(poolFor([1], 3), {
          courseId: 1,
          moduleIds: [1],
          easyCount: 20,
          intermediateCount: 0,
          difficultCount: 0,
          distribution: 'BALANCED',
        }),
      (err: unknown) =>
        err instanceof AppError &&
        err.code === 'INSUFFICIENT_INVENTORY' &&
        /Only 3 Easy questions are available/.test(err.message),
    );
  });

  it('never selects NEEDS_REVIEW questions', () => {
    const pool = [
      item(1, 1, 'EASY', { reviewStatus: 'NEEDS_REVIEW' }),
      item(2, 1, 'EASY'),
      item(3, 1, 'EASY'),
    ];
    const result = selectQuestions(pool, {
      courseId: 1,
      moduleIds: [1],
      easyCount: 2,
      intermediateCount: 0,
      difficultCount: 0,
      distribution: 'RANDOM',
    });
    assert.equal(result.selectedIds.includes(1), false);
  });

  it('does not select duplicate fingerprint groups twice', () => {
    const pool = [
      item(1, 1, 'EASY', { fingerprint: 'same' }),
      item(2, 1, 'EASY', { fingerprint: 'same' }),
      item(3, 1, 'EASY', { fingerprint: 'other' }),
    ];
    assert.throws(
      () =>
        selectQuestions(pool, {
          courseId: 1,
          moduleIds: [1],
          easyCount: 3,
          intermediateCount: 0,
          difficultCount: 0,
          distribution: 'RANDOM',
        }),
      (err: unknown) => err instanceof AppError && err.code === 'INSUFFICIENT_INVENTORY',
    );
    const result = selectQuestions(pool, {
      courseId: 1,
      moduleIds: [1],
      easyCount: 2,
      intermediateCount: 0,
      difficultCount: 0,
      distribution: 'RANDOM',
    });
    assert.equal(result.selectedIds.length, 2);
    assert.equal(result.selectedIds.includes(1) && result.selectedIds.includes(2), false);
  });

  it('balances Easy=9 across three modules as 3/3/3', () => {
    const rng = mulberry32(7);
    const result = selectQuestions(poolFor([1, 2, 3], 10), {
      courseId: 1,
      moduleIds: [1, 2, 3],
      easyCount: 9,
      intermediateCount: 0,
      difficultCount: 0,
      distribution: 'BALANCED',
    }, rng);
    assert.equal(result.byModule[1], 3);
    assert.equal(result.byModule[2], 3);
    assert.equal(result.byModule[3], 3);
  });

  it('redistributes when one module has insufficient Easy inventory', () => {
    const pool = [
      item(1, 1, 'EASY'),
      ...Array.from({ length: 8 }, (_, i) => item(10 + i, 2, 'EASY')),
      ...Array.from({ length: 8 }, (_, i) => item(20 + i, 3, 'EASY')),
    ];
    const result = selectQuestions(pool, {
      courseId: 1,
      moduleIds: [1, 2, 3],
      easyCount: 9,
      intermediateCount: 0,
      difficultCount: 0,
      distribution: 'BALANCED',
    }, mulberry32(3));
    assert.equal(result.byModule[1], 1);
    assert.equal(result.selectedIds.length, 9);
    assert.equal(new Set(result.selectedIds).size, 9);
  });

  it('replace keeps difficulty and never duplicates a quiz question', () => {
    const pool = poolFor([1], 5);
    const used = [1, 2, 3];
    const picked = pickReplacement(pool, {
      courseId: 1,
      moduleIds: [1],
      difficulty: 'EASY',
      excludeIds: used,
    }, mulberry32(1));
    assert.ok(picked);
    assert.equal(picked!.difficulty, 'EASY');
    assert.equal(used.includes(picked!.id), false);
  });

  it('regenerate-equivalent selection preserves criteria counts', () => {
    const criteria = {
      courseId: 1,
      moduleIds: [1, 2],
      easyCount: 8,
      intermediateCount: 8,
      difficultCount: 4,
      distribution: 'BALANCED' as const,
    };
    const a = selectQuestions(poolFor([1, 2], 20), criteria, mulberry32(11));
    const b = selectQuestions(poolFor([1, 2], 20), criteria, mulberry32(99));
    assert.deepEqual(a.byDifficulty, b.byDifficulty);
    assert.equal(a.selectedIds.length, 20);
    assert.equal(b.selectedIds.length, 20);
  });
});
