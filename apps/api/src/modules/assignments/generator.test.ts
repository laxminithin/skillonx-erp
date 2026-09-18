import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  criteriaFromPreset,
  mulberry32,
  resolvePresetCounts,
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

describe('assignment generator presets', () => {
  it('SHORT = 5, STANDARD = 8, DEEP_DIVE = 10', () => {
    assert.equal(resolvePresetCounts('SHORT').total, 5);
    assert.equal(resolvePresetCounts('STANDARD').total, 8);
    assert.equal(resolvePresetCounts('DEEP_DIVE').total, 10);
  });

  it('CUSTOM requires at least one question', () => {
    assert.throws(() => resolvePresetCounts('CUSTOM', {}), (err) => err instanceof AppError);
  });

  it('selects STANDARD(8) with BALANCED distribution', () => {
    const criteria = criteriaFromPreset({
      courseId: 1,
      moduleIds: [1, 2],
      preset: 'STANDARD',
      distribution: 'BALANCED',
    });
    const result = selectQuestions(poolFor([1, 2], 20), criteria, mulberry32(42));
    assert.equal(result.selectedIds.length, 8);
    assert.equal(
      result.byDifficulty.EASY + result.byDifficulty.INTERMEDIATE + result.byDifficulty.DIFFICULT,
      8,
    );
  });

  it('selects only from requested modules', () => {
    const criteria = criteriaFromPreset({
      courseId: 1,
      moduleIds: [1],
      preset: 'SHORT',
    });
    const pool = [...poolFor([1], 10), ...poolFor([2], 10).map((p) => ({ ...p, id: p.id + 100 }))];
    const result = selectQuestions(pool, criteria, mulberry32(7));
    for (const id of result.selectedIds) {
      assert.ok(id < 100);
    }
  });
});
