import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  coverageFromItems,
  defaultSlotsForMarks,
  eligiblePool,
  selectForBlueprint,
  validateBlueprint,
  type Blueprint,
  type PoolQuestion,
} from './generator.js';

function q(
  id: string,
  marks: number,
  co: string,
  extra: Partial<PoolQuestion> = {},
): PoolQuestion {
  return {
    id,
    source: extra.source ?? 'PREVIOUS_YEAR',
    sourceQuestionId: extra.sourceQuestionId ?? Number(id.replace(/\D/g, '') || 1),
    questionText: extra.questionText ?? `Question ${id}`,
    marks,
    moduleName: extra.moduleName ?? 'Module 1',
    moduleId: extra.moduleId ?? 1,
    coCode: co,
    difficulty: extra.difficulty ?? 'INTERMEDIATE',
    bloomLevel: extra.bloomLevel ?? 'UNDERSTAND',
    fingerprint: extra.fingerprint ?? `fp-${id}`,
    examYear: extra.examYear ?? 2022,
    appearanceCount: extra.appearanceCount ?? 1,
    lastAppeared: extra.lastAppeared ?? '2022',
    isOrChoice: false,
    orGroupId: null,
    eligible: extra.eligible ?? true,
    sourcePaperId: extra.sourcePaperId ?? 'P1',
    readinessStatus: extra.readinessStatus ?? 'READY_FOR_INTERNAL_PAPER',
    hasScheme: extra.hasScheme ?? true,
    hasSolution: extra.hasSolution ?? true,
    sourceType: extra.sourceType ?? 'PREVIOUS_YEAR_QUESTION_PAPER',
    examType: extra.examType ?? 'SEE',
  };
}

function blueprint(overrides: Partial<Blueprint> = {}): Blueprint {
  const coTargets = overrides.coTargets ?? [
    { coCode: 'CO1', marks: 20 },
    { coCode: 'CO2', marks: 20 },
    { coCode: 'CO3', marks: 10 },
  ];
  return {
    examType: 'IA-1',
    maxMarks: 50,
    durationMinutes: 90,
    modules: ['Module 1', 'Module 2'],
    coTargets,
    patternLabel: '5 × 10 = 50',
    slots: overrides.slots ?? defaultSlotsForMarks(50, coTargets),
    allowOrChoices: false,
    sourceMix: { previousYear: true, questionBank: true, quizBank: false },
    previousYearWeight: 50,
    allowPreviousYearRepeats: true,
    recentYearExclusion: 0,
    modifiedFromCoEvaluation: false,
    ...overrides,
  };
}

describe('internal QP generator', () => {
  it('builds 50-mark slots from CO Evaluation distribution', () => {
    const slots = defaultSlotsForMarks(50, [
      { coCode: 'CO1', marks: 20 },
      { coCode: 'CO2', marks: 20 },
      { coCode: 'CO3', marks: 10 },
    ]);
    assert.equal(slots.reduce((n, s) => n + s.marks, 0), 50);
    assert.equal(slots.filter((s) => s.coCode === 'CO1').reduce((n, s) => n + s.marks, 0), 20);
  });

  it('selects exact total marks and CO distribution without duplicates', () => {
    const pool = [
      q('py1', 10, 'CO1'),
      q('py2', 10, 'CO1'),
      q('py3', 10, 'CO2'),
      q('py4', 10, 'CO2'),
      q('py5', 10, 'CO3'),
      q('py6', 10, 'CO1'),
    ];
    const selected = selectForBlueprint(pool, blueprint(), () => 0.1);
    assert.equal(selected.length, 5);
    assert.equal(selected.reduce((n, s) => n + s.slot.marks, 0), 50);
    const fps = selected.map((s) => s.question.fingerprint);
    assert.equal(new Set(fps).size, fps.length);
    const cov = coverageFromItems(
      selected.map((s) => ({ marks: s.slot.marks, coCode: s.slot.coCode, source: s.question.source })),
    );
    assert.deepEqual(
      cov.byCo.sort((a, b) => a.coCode.localeCompare(b.coCode)),
      [
        { coCode: 'CO1', marks: 20 },
        { coCode: 'CO2', marks: 20 },
        { coCode: 'CO3', marks: 10 },
      ],
    );
  });

  it('can restrict to previous-year source only', () => {
    const pool = [
      q('py1', 10, 'CO1'),
      q('py2', 10, 'CO1'),
      q('py3', 10, 'CO2'),
      q('py4', 10, 'CO2'),
      q('py5', 10, 'CO3'),
      q('qb1', 10, 'CO3', { source: 'QUESTION_BANK' }),
    ];
    const selected = selectForBlueprint(
      pool,
      blueprint({ sourceMix: { previousYear: true, questionBank: false, quizBank: false } }),
      () => 0.2,
    );
    assert.ok(selected.every((s) => s.question.source === 'PREVIOUS_YEAR'));
  });

  it('rejects duplicate fingerprints in validation', () => {
    const result = validateBlueprint(blueprint(), [
      { marks: 10, fingerprint: 'a', coCode: 'CO1' },
      { marks: 10, fingerprint: 'a', coCode: 'CO1' },
      { marks: 10, fingerprint: 'b', coCode: 'CO2' },
      { marks: 10, fingerprint: 'c', coCode: 'CO2' },
      { marks: 10, fingerprint: 'd', coCode: 'CO3' },
    ]);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => /Duplicate/i.test(e)));
  });

  it('fills remaining slots without dropping already selected questions', () => {
    const pool = [
      q('kept', 10, 'CO1', { fingerprint: 'fp-kept' }),
      q('py2', 10, 'CO1'),
      q('py3', 10, 'CO2'),
      q('py4', 10, 'CO2'),
      q('py5', 10, 'CO3'),
    ];
    const bp = blueprint();
    const remaining = selectForBlueprint(pool, bp, () => 0.1, {
      usedFingerprints: ['fp-kept'],
      slots: bp.slots.slice(1),
      requireFullTotal: false,
    });
    assert.equal(remaining.length, 4);
    assert.equal(remaining.some((s) => s.question.fingerprint === 'fp-kept'), false);
  });

  it('excludes recent previous-year repeats when configured', () => {
    const pool = [
      q('old', 10, 'CO1', { examYear: 2020 }),
      q('new', 10, 'CO1', { examYear: 2026, fingerprint: 'fp-new' }),
    ];
    const filtered = eligiblePool(
      pool,
      blueprint({
        allowPreviousYearRepeats: false,
        recentYearExclusion: 3,
        sourceMix: { previousYear: true, questionBank: false, quizBank: false },
      }),
    );
    assert.ok(filtered.some((qst) => qst.id === 'old'));
    assert.equal(
      filtered.some((qst) => qst.id === 'new'),
      false,
    );
  });

  it('never selects non-PYQ sources even if they are in the pool', () => {
    const pool = [
      q('py1', 10, 'CO1'),
      q('py2', 10, 'CO1'),
      q('py3', 10, 'CO2'),
      q('py4', 10, 'CO2'),
      q('py5', 10, 'CO3'),
      q('qb1', 10, 'CO3', { source: 'QUESTION_BANK', sourceType: 'LECTURER_OR_BANK_LEGACY' }),
    ];
    const selected = selectForBlueprint(pool, blueprint(), () => 0.2);
    assert.ok(selected.every((s) => s.question.source === 'PREVIOUS_YEAR'));
  });

  it('never selects a Module 4 question when only Module 1 is in scope', () => {
    const pool = [
      q('m1a', 10, 'CO1', { moduleId: 1, moduleName: 'Module 1' }),
      q('m1b', 10, 'CO1', { moduleId: 1, moduleName: 'Module 1', fingerprint: 'fp-m1b' }),
      q('m4', 10, 'CO4', { moduleId: 4, moduleName: 'Module 4', fingerprint: 'fp-m4' }),
    ];
    const filtered = eligiblePool(
      pool,
      blueprint({
        modules: ['Module 1'],
        selectedModuleIds: [1],
        coTargets: [{ coCode: 'CO1', marks: 20 }],
        slots: defaultSlotsForMarks(20, [{ coCode: 'CO1', marks: 20 }]).map((s) => ({ ...s, moduleId: 1, moduleName: 'Module 1' })),
      }),
    );
    assert.equal(filtered.some((x) => x.id === 'm4'), false);
    assert.ok(filtered.every((x) => x.moduleId === 1));
  });
});
