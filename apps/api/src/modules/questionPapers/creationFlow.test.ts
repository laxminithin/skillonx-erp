import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  STANDARD_IA_PATTERN,
  buildPatternSlots,
  printedMarks,
  requiredAnswerMarks,
  patternLabel,
} from './pattern.js';
import {
  eligiblePool,
  inSelectedScope,
  selectForBlueprint,
  validateBlueprint,
  type Blueprint,
  type PoolQuestion,
} from './generator.js';
import { validateInternalPaper } from './validation.js';
import { rbtFromBloom } from './rbt.js';

function q(id: string, marks: number, extra: Partial<PoolQuestion> = {}): PoolQuestion {
  return {
    id,
    source: extra.source ?? 'PREVIOUS_YEAR',
    sourceQuestionId: extra.sourceQuestionId ?? Number(id.replace(/\D/g, '') || 1),
    questionText: extra.questionText ?? `Question ${id}`,
    marks,
    moduleName: extra.moduleName ?? 'Module 3 — SQL',
    moduleId: extra.moduleId ?? 3,
    coCode: extra.coCode ?? 'CO3',
    difficulty: extra.difficulty ?? 'INTERMEDIATE',
    bloomLevel: extra.bloomLevel ?? 'UNDERSTAND',
    rbtLevel: extra.rbtLevel ?? 'L2',
    fingerprint: extra.fingerprint ?? `fp-${id}`,
    examYear: extra.examYear ?? 2022,
    appearanceCount: extra.appearanceCount ?? 1,
    lastAppeared: extra.lastAppeared ?? '2022',
    isOrChoice: false,
    orGroupId: null,
    eligible: extra.eligible ?? true,
    sourcePaperId: extra.sourcePaperId ?? 'P1',
    verificationStatus: extra.verificationStatus ?? 'VERIFIED',
    readinessStatus: extra.readinessStatus ?? 'READY_FOR_INTERNAL_PAPER',
    hasScheme: extra.hasScheme ?? true,
    hasSolution: extra.hasSolution ?? true,
    coMappingBlocked: extra.coMappingBlocked ?? false,
    needsReview: extra.needsReview ?? false,
  };
}

describe('standard IA pattern', () => {
  it('is 20 + 20 + 10 = 50', () => {
    assert.equal(patternLabel(STANDARD_IA_PATTERN), '20 + 20 + 10 = 50');
    const slots = buildPatternSlots({ pattern: STANDARD_IA_PATTERN, includeOr: false });
    assert.equal(requiredAnswerMarks(slots), 50);
    assert.equal(printedMarks(slots), 50);
    assert.deepEqual(
      slots.filter((s) => s.countsTowardRequired).map((s) => s.marks),
      [10, 10, 10, 10, 10],
    );
  });

  it('printed marks exceed required when OR alternatives are included', () => {
    const slots = buildPatternSlots({ pattern: STANDARD_IA_PATTERN, includeOr: true });
    assert.equal(requiredAnswerMarks(slots), 50);
    assert.equal(printedMarks(slots), 100);
  });
});

describe('syllabus scope filtering', () => {
  const blueprint: Blueprint = {
    examType: 'IA-2',
    maxMarks: 50,
    requiredAnswerMarks: 50,
    durationMinutes: 90,
    modules: ['Module 3 — SQL', 'Module 4 — Normalization'],
    selectedModuleIds: [3, 4],
    coTargets: [
      { coCode: 'CO3', marks: 25 },
      { coCode: 'CO4', marks: 25 },
    ],
    patternLabel: '20 + 20 + 10 = 50',
    slots: [],
    allowOrChoices: false,
    sourceMix: { previousYear: true, questionBank: true, quizBank: false },
    previousYearWeight: 40,
    allowPreviousYearRepeats: true,
    recentYearExclusion: 0,
    modifiedFromCoEvaluation: false,
    workflowVersion: 2,
  };

  it('never admits a Module 1 question into a Module 3+4 paper', () => {
    const pool = [
      q('m3', 10, { moduleId: 3, moduleName: 'Module 3 — SQL' }),
      q('m1', 10, { moduleId: 1, moduleName: 'Module 1 — Introduction', coCode: 'CO1' }),
    ];
    const filtered = eligiblePool(pool, blueprint);
    assert.equal(filtered.some((x) => x.id === 'm1'), false);
    assert.equal(inSelectedScope(pool[1], blueprint), false);
  });

  it('excludes CO_MAPPING_BLOCKED and NEEDS_REVIEW from the usable pool', () => {
    const pool = [
      q('ok', 10),
      q('blocked', 10, { fingerprint: 'fp-b', coMappingBlocked: true, verificationStatus: 'CO_MAPPING_BLOCKED', readinessStatus: 'CO_MAPPING_NEEDS_REVIEW', hasScheme: false, hasSolution: false }),
      q('review', 10, { fingerprint: 'fp-r', verificationStatus: 'NEEDS_REVIEW', readinessStatus: 'PYQ_EXTRACTED', needsReview: true, hasScheme: false, hasSolution: false }),
    ];
    const filtered = eligiblePool(pool, blueprint);
    assert.deepEqual(filtered.map((x) => x.id), ['ok']);
  });
});

describe('generation stays on the 50-mark blueprint', () => {
  it('fills 20+20+10 using in-scope 10-mark questions', () => {
    const slots = buildPatternSlots({ pattern: STANDARD_IA_PATTERN, includeOr: false }).map((s) => ({
      key: s.key,
      section: s.section,
      questionNumber: s.questionNumber,
      subLetter: s.subLetter,
      marks: s.marks,
      orGroupId: s.orGroupId,
      isOrChoice: s.isOrChoice,
      orAlternative: s.orAlternative,
      countsTowardRequired: s.countsTowardRequired,
      moduleId: s.questionNumber === 1 ? 3 : 4,
      coCode: s.questionNumber === 1 ? 'CO3' : 'CO4',
    }));
    const pool = [
      q('a', 10, { moduleId: 3, coCode: 'CO3' }),
      q('b', 10, { moduleId: 3, coCode: 'CO3' }),
      q('c', 10, { moduleId: 4, moduleName: 'Module 4', coCode: 'CO4' }),
      q('d', 10, { moduleId: 4, moduleName: 'Module 4', coCode: 'CO4' }),
      q('e', 10, { moduleId: 4, moduleName: 'Module 4', coCode: 'CO4' }),
      q('out', 10, { moduleId: 1, moduleName: 'Module 1', coCode: 'CO1', fingerprint: 'fp-out' }),
    ];
    const bp: Blueprint = {
      examType: 'IA-2',
      maxMarks: 50,
      requiredAnswerMarks: 50,
      durationMinutes: 90,
      modules: ['Module 3 — SQL', 'Module 4'],
      selectedModuleIds: [3, 4],
      coTargets: [
        { coCode: 'CO3', marks: 20 },
        { coCode: 'CO4', marks: 30 },
      ],
      patternLabel: '20 + 20 + 10 = 50',
      slots,
      allowOrChoices: false,
      sourceMix: { previousYear: true, questionBank: true, quizBank: false },
      previousYearWeight: 40,
      allowPreviousYearRepeats: true,
      recentYearExclusion: 0,
      modifiedFromCoEvaluation: false,
      workflowVersion: 2,
    };
    const selected = selectForBlueprint(pool, bp, () => 0.1);
    assert.equal(selected.length, 5);
    assert.equal(selected.every((s) => s.question.moduleId === 3 || s.question.moduleId === 4), true);
    assert.equal(selected.reduce((n, s) => n + s.slot.marks, 0), 50);
  });
});

describe('paper validation messages', () => {
  it('names the question when scheme totals do not match marks', () => {
    const report = validateInternalPaper({
      maxMarks: 50,
      requiredAnswerMarks: 50,
      patternMarks: [20, 20, 10],
      blueprint: {
        examType: 'IA-2',
        maxMarks: 50,
        requiredAnswerMarks: 50,
        durationMinutes: 90,
        modules: ['Module 3'],
        selectedModuleIds: [3],
        coTargets: [{ coCode: 'CO3', marks: 50 }],
        patternLabel: '20 + 20 + 10',
        slots: [],
        allowOrChoices: false,
        sourceMix: { previousYear: true, questionBank: true, quizBank: false },
        previousYearWeight: 40,
        allowPreviousYearRepeats: true,
        recentYearExclusion: 0,
        modifiedFromCoEvaluation: false,
        workflowVersion: 2,
      },
      items: [
        { itemKey: 'Q1-A-a', questionNumber: 1, subLetter: 'a', maxMarks: 10, fingerprint: '1', primaryCo: 'CO3', moduleId: 3, moduleOrUnit: 'Module 3', scheme: [{ maxMarks: 8, label: 'Explanation' }], modelAnswer: 'Full solution' },
        { itemKey: 'Q1-A-b', questionNumber: 1, subLetter: 'b', maxMarks: 10, fingerprint: '2', primaryCo: 'CO3', moduleId: 3, moduleOrUnit: 'Module 3', scheme: [{ maxMarks: 10, label: 'Full' }], modelAnswer: 'Full solution' },
        { itemKey: 'Q2-A-a', questionNumber: 2, subLetter: 'a', maxMarks: 10, fingerprint: '3', primaryCo: 'CO3', moduleId: 3, moduleOrUnit: 'Module 3', scheme: [{ maxMarks: 10, label: 'Full' }], modelAnswer: 'Full solution' },
        { itemKey: 'Q2-A-b', questionNumber: 2, subLetter: 'b', maxMarks: 10, fingerprint: '4', primaryCo: 'CO3', moduleId: 3, moduleOrUnit: 'Module 3', scheme: [{ maxMarks: 10, label: 'Full' }], modelAnswer: 'Full solution' },
        { itemKey: 'Q3-A', questionNumber: 3, maxMarks: 10, fingerprint: '5', primaryCo: 'CO3', moduleId: 5, moduleOrUnit: 'Module 5', scheme: [{ maxMarks: 10, label: 'Full' }], modelAnswer: 'Full solution' },
      ],
    });
    assert.equal(report.canFinalize, false);
    assert.ok(report.issues.some((i) => /Q1\(a\): Scheme totals 8 marks but question carries 10 marks/.test(i.message)));
    assert.ok(report.issues.some((i) => /belongs to Module 5 and is outside the selected Internal Assessment scope/.test(i.message)));
  });
});

describe('mandatory OR-pair validation', () => {
  const orBlueprint: Blueprint = {
    examType: 'IA-1',
    maxMarks: 50,
    requiredAnswerMarks: 50,
    durationMinutes: 90,
    modules: ['Module 3 — SQL'],
    selectedModuleIds: [3],
    coTargets: [{ coCode: 'CO3', marks: 50 }],
    patternLabel: '20 + 20 + 10',
    slots: [],
    allowOrChoices: true,
    sourceMix: { previousYear: true, questionBank: false, quizBank: false },
    previousYearWeight: 50,
    allowPreviousYearRepeats: true,
    recentYearExclusion: 0,
    modifiedFromCoEvaluation: false,
    workflowVersion: 2,
  };

  function item(overrides: Record<string, unknown>) {
    return {
      itemKey: String(overrides.itemKey),
      questionNumber: Number(overrides.questionNumber),
      maxMarks: 20,
      fingerprint: String(overrides.fingerprint),
      primaryCo: 'CO3',
      moduleId: 3,
      moduleOrUnit: 'Module 3 — SQL',
      rbtLevel: 'L2',
      difficulty: 'INTERMEDIATE',
      sourceKind: 'PREVIOUS_YEAR',
      sourceType: 'PREVIOUS_YEAR_QUESTION_PAPER',
      readinessStatus: 'READY_FOR_INTERNAL_PAPER',
      verificationStatus: 'READY_FOR_INTERNAL_PAPER',
      scheme: [{ maxMarks: 20, label: 'Full' }],
      modelAnswer: 'Full solution',
      ...overrides,
    };
  }

  it('flags a slot printed without its OR alternative', () => {
    const report = validateInternalPaper({
      maxMarks: 50,
      requiredAnswerMarks: 50,
      patternMarks: [20, 20, 10],
      blueprint: orBlueprint,
      items: [
        item({ itemKey: 'Q1-A', questionNumber: 1, fingerprint: '1', orGroupId: 'Q1', orAlternative: 'A' }),
        item({ itemKey: 'Q1-B', questionNumber: 1, fingerprint: '2', orGroupId: 'Q1', orAlternative: 'B' }),
        item({ itemKey: 'Q2-A', questionNumber: 2, fingerprint: '3', orGroupId: 'Q2', orAlternative: 'A' }),
        item({ itemKey: 'Q2-B', questionNumber: 2, fingerprint: '4', orGroupId: 'Q2', orAlternative: 'B' }),
        // Q3 has no OR alternative — this must be rejected.
        item({ itemKey: 'Q3-A', questionNumber: 3, maxMarks: 10, fingerprint: '5', scheme: [{ maxMarks: 10, label: 'Full' }] }),
      ],
    });
    assert.equal(report.canFinalize, false);
    assert.ok(report.issues.some((i) => i.code === 'OR_MISSING_ALTERNATIVE' && /Q3/.test(i.message)));
  });

  it('rejects an OR pair whose alternatives come from different modules', () => {
    const report = validateInternalPaper({
      maxMarks: 50,
      requiredAnswerMarks: 50,
      patternMarks: [20, 20, 10],
      blueprint: orBlueprint,
      items: [
        item({ itemKey: 'Q1-A', questionNumber: 1, fingerprint: '1', orGroupId: 'Q1', orAlternative: 'A' }),
        // Alternative B is from a different module than A.
        item({ itemKey: 'Q1-B', questionNumber: 1, fingerprint: '2', orGroupId: 'Q1', orAlternative: 'B', moduleId: 4, moduleOrUnit: 'Module 4' }),
        item({ itemKey: 'Q2-A', questionNumber: 2, fingerprint: '3', orGroupId: 'Q2', orAlternative: 'A' }),
        item({ itemKey: 'Q2-B', questionNumber: 2, fingerprint: '4', orGroupId: 'Q2', orAlternative: 'B' }),
        item({ itemKey: 'Q3-A', questionNumber: 3, maxMarks: 10, fingerprint: '5', orGroupId: 'Q3', orAlternative: 'A', scheme: [{ maxMarks: 10, label: 'Full' }] }),
        item({ itemKey: 'Q3-B', questionNumber: 3, maxMarks: 10, fingerprint: '6', orGroupId: 'Q3', orAlternative: 'B', scheme: [{ maxMarks: 10, label: 'Full' }] }),
      ],
    });
    assert.equal(report.canFinalize, false);
    assert.ok(report.issues.some((i) => i.code === 'OR_MODULE'));
  });

  it('accepts a balanced 20 OR 20 / 20 OR 20 / 10 OR 10 paper (answerable 50, printed 100)', () => {
    const report = validateInternalPaper({
      maxMarks: 50,
      requiredAnswerMarks: 50,
      patternMarks: [20, 20, 10],
      blueprint: orBlueprint,
      items: [
        item({ itemKey: 'Q1-A', questionNumber: 1, fingerprint: '1', orGroupId: 'Q1', orAlternative: 'A' }),
        item({ itemKey: 'Q1-B', questionNumber: 1, fingerprint: '2', orGroupId: 'Q1', orAlternative: 'B' }),
        item({ itemKey: 'Q2-A', questionNumber: 2, fingerprint: '3', orGroupId: 'Q2', orAlternative: 'A' }),
        item({ itemKey: 'Q2-B', questionNumber: 2, fingerprint: '4', orGroupId: 'Q2', orAlternative: 'B' }),
        item({ itemKey: 'Q3-A', questionNumber: 3, maxMarks: 10, fingerprint: '5', orGroupId: 'Q3', orAlternative: 'A', scheme: [{ maxMarks: 10, label: 'Full' }] }),
        item({ itemKey: 'Q3-B', questionNumber: 3, maxMarks: 10, fingerprint: '6', orGroupId: 'Q3', orAlternative: 'B', scheme: [{ maxMarks: 10, label: 'Full' }] }),
      ],
    });
    assert.equal(report.requiredAnswerMarks, 50);
    assert.equal(report.printedMarks, 100);
    assert.equal(report.issues.some((i) => i.severity === 'CRITICAL'), false);
    assert.equal(report.canFinalize, true);
  });

  it('pairs an OR alternative from the same module as its partner', () => {
    const built = buildPatternSlots({ pattern: STANDARD_IA_PATTERN, includeOr: true }).map((s) => ({
      ...s,
      moduleId: 3,
      moduleName: 'Module 3 — SQL',
      coCode: 'CO3',
    }));
    // Module-4 question is cheap on marks but wrong module: it must never be chosen
    // as the OR partner of a Module-3 alternative.
    const pool = [
      q('a', 10, { moduleId: 3, fingerprint: 'fp-a' }),
      q('b', 10, { moduleId: 3, fingerprint: 'fp-b' }),
      q('c', 10, { moduleId: 3, fingerprint: 'fp-c' }),
      q('d', 10, { moduleId: 3, fingerprint: 'fp-d' }),
      q('e', 10, { moduleId: 3, fingerprint: 'fp-e' }),
      q('f', 10, { moduleId: 3, fingerprint: 'fp-f' }),
      q('g', 10, { moduleId: 3, fingerprint: 'fp-g' }),
      q('h', 10, { moduleId: 3, fingerprint: 'fp-h' }),
      q('i', 10, { moduleId: 3, fingerprint: 'fp-i' }),
      q('j', 10, { moduleId: 3, fingerprint: 'fp-j' }),
      q('wrong', 10, { moduleId: 4, moduleName: 'Module 4', coCode: 'CO3', fingerprint: 'fp-wrong' }),
    ];
    const selected = selectForBlueprint(pool, { ...orBlueprint, slots: built }, () => 0.1);
    assert.equal(selected.every((s) => s.question.moduleId === 3), true);
  });
});

describe('RBT mapping', () => {
  it('maps Bloom names to L1–L6', () => {
    assert.equal(rbtFromBloom('UNDERSTAND'), 'L2');
    assert.equal(rbtFromBloom('L3'), 'L3');
    assert.equal(rbtFromBloom('APPLY'), 'L3');
  });
});

describe('legacy blueprint validation still accepts equal totals', () => {
  it('rejects duplicates', () => {
    const result = validateBlueprint(
      {
        examType: 'IA-1',
        maxMarks: 50,
        durationMinutes: 90,
        modules: [],
        coTargets: [],
        patternLabel: '',
        slots: [],
        allowOrChoices: false,
        sourceMix: { previousYear: true, questionBank: true, quizBank: false },
        previousYearWeight: 50,
        allowPreviousYearRepeats: true,
        recentYearExclusion: 0,
        modifiedFromCoEvaluation: false,
      },
      [
        { marks: 10, fingerprint: 'a' },
        { marks: 10, fingerprint: 'a' },
        { marks: 10, fingerprint: 'b' },
        { marks: 10, fingerprint: 'c' },
        { marks: 10, fingerprint: 'd' },
      ],
    );
    assert.equal(result.ok, false);
  });
});
