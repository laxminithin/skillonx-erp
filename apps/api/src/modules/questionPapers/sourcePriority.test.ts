import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { STANDARD_IA_PATTERN, buildPatternSlots } from './pattern.js';
import { selectForBlueprint, sourceSummaryFromItems, replacementCandidates, type Blueprint, type PoolQuestion } from './generator.js';
import { classifyMasterSource, isSeeExamType, isAllowedInternalSource } from './sourcePolicy.js';
import { validateInternalPaper } from './validation.js';

function q(id: string, source: 'VTU_SEE_PYQ' | 'MODULE_QUESTION_BANK' | 'OTHER_SOURCE', extra: Partial<PoolQuestion> = {}): PoolQuestion {
  return {
    id,
    source: 'PREVIOUS_YEAR',
    sourceType: 'PREVIOUS_YEAR_QUESTION_PAPER',
    sourceQuestionId: Number(id.replace(/\D/g, '') || 1),
    questionText: `Question ${id}`,
    marks: extra.marks ?? 10,
    moduleName: extra.moduleName ?? 'Module 3',
    moduleId: extra.moduleId ?? 3,
    coCode: extra.coCode ?? 'CO3',
    difficulty: extra.difficulty ?? 'INTERMEDIATE',
    bloomLevel: extra.bloomLevel ?? 'UNDERSTAND',
    rbtLevel: extra.rbtLevel ?? 'L2',
    fingerprint: extra.fingerprint ?? `fp-${id}`,
    examYear: extra.examYear ?? 2023,
    examType: source === 'VTU_SEE_PYQ' ? 'SEE' : source === 'OTHER_SOURCE' ? 'IA-1' : 'INTERNAL',
    appearanceCount: 1,
    lastAppeared: '2023',
    isOrChoice: false,
    orGroupId: null,
    masterSource: source,
    eligible: true,
    readinessStatus: 'READY_FOR_INTERNAL_PAPER',
    reviewStatus: 'READY_FOR_INTERNAL_PAPER',
    verificationStatus: 'VERIFIED',
    hasScheme: true,
    hasSolution: true,
    ...extra,
  };
}

// A single 10-mark OR slot (Q3) in Module 3.
function singleOrSlotBlueprint(): Blueprint {
  const built = buildPatternSlots({
    pattern: { ...STANDARD_IA_PATTERN, sections: [STANDARD_IA_PATTERN.sections[2]] },
    includeOr: true,
  }).map((s) => ({ ...s, moduleId: 3, moduleName: 'Module 3', coCode: 'CO3' }));
  return {
    examType: 'IA-2',
    maxMarks: 10,
    requiredAnswerMarks: 10,
    durationMinutes: 60,
    modules: ['Module 3'],
    selectedModuleIds: [3],
    coTargets: [{ coCode: 'CO3', marks: 10 }],
    patternLabel: '10',
    slots: built,
    allowOrChoices: true,
    sourceMix: { previousYear: true, questionBank: false, quizBank: false },
    previousYearWeight: 50,
    allowPreviousYearRepeats: true,
    recentYearExclusion: 0,
    modifiedFromCoEvaluation: false,
    workflowVersion: 2,
  };
}

describe('master source classification', () => {
  it('classifies by real provenance: SEE→VTU_SEE_PYQ, explicit module bank→MODULE_QUESTION_BANK, else OTHER_SOURCE', () => {
    assert.equal(classifyMasterSource({ examType: 'SEE' }), 'VTU_SEE_PYQ');
    assert.equal(classifyMasterSource({ examType: 'Semester End Examination (SEE)' }), 'VTU_SEE_PYQ');
    // Non-SEE PYQs must NOT be relabelled as Module Question Bank.
    assert.equal(classifyMasterSource({ examType: 'INTERNAL' }), 'OTHER_SOURCE');
    assert.equal(classifyMasterSource({ examType: 'MODEL' }), 'OTHER_SOURCE');
    assert.equal(classifyMasterSource({ examType: 'IA-1' }), 'OTHER_SOURCE');
    assert.equal(classifyMasterSource({ examType: null }), 'OTHER_SOURCE');
    // Genuine module-bank provenance is honoured regardless of exam type.
    assert.equal(classifyMasterSource({ sourceType: 'MODULE_QUESTION_BANK', examType: 'INTERNAL' }), 'MODULE_QUESTION_BANK');
    assert.equal(classifyMasterSource({ sourceType: 'MODULE_QUESTION_BANK', examType: null }), 'MODULE_QUESTION_BANK');
    assert.equal(isSeeExamType('SEE'), true);
    assert.equal(isSeeExamType('IA-1'), false);
  });

  it('only allows VTU SEE PYQ and Module Question Bank sources', () => {
    assert.equal(isAllowedInternalSource('VTU_SEE_PYQ'), true);
    assert.equal(isAllowedInternalSource('MODULE_QUESTION_BANK'), true);
    assert.equal(isAllowedInternalSource('PREVIOUS_YEAR'), true); // legacy
    assert.equal(isAllowedInternalSource('AI_GENERATED'), false);
    assert.equal(isAllowedInternalSource('CUSTOM'), false);
    assert.equal(isAllowedInternalSource('QUIZ_BANK'), false);
  });
});

describe('SEE-first source priority', () => {
  it('prefers VTU SEE PYQ when both SEE and Module Bank candidates exist', () => {
    const pool = [
      q('see1', 'VTU_SEE_PYQ'),
      q('see2', 'VTU_SEE_PYQ', { fingerprint: 'fp-see2' }),
      q('bank1', 'MODULE_QUESTION_BANK', { fingerprint: 'fp-bank1' }),
      q('bank2', 'MODULE_QUESTION_BANK', { fingerprint: 'fp-bank2' }),
    ];
    const selected = selectForBlueprint(pool, singleOrSlotBlueprint(), () => 0.1);
    // Both alternatives (A and B) of the 10-mark slot should be SEE.
    assert.equal(selected.length, 2);
    assert.ok(selected.every((s) => s.question.masterSource === 'VTU_SEE_PYQ'), 'both alternatives should be SEE');
  });

  it('does NOT use Module Bank when enough SEE questions exist (0 fallback)', () => {
    const pool = [
      q('see1', 'VTU_SEE_PYQ'),
      q('see2', 'VTU_SEE_PYQ', { fingerprint: 'fp-see2' }),
      q('bank1', 'MODULE_QUESTION_BANK', { fingerprint: 'fp-bank1', difficulty: 'INTERMEDIATE' }),
    ];
    const selected = selectForBlueprint(pool, singleOrSlotBlueprint(), () => 0.1);
    assert.equal(selected.filter((s) => s.question.masterSource === 'MODULE_QUESTION_BANK').length, 0);
  });

  it('falls back to Module Question Bank for the partner when SEE cannot supply a second alternative', () => {
    const pool = [
      q('see1', 'VTU_SEE_PYQ'), // only ONE eligible SEE for the module
      q('bank1', 'MODULE_QUESTION_BANK', { fingerprint: 'fp-bank1' }),
      q('bank2', 'MODULE_QUESTION_BANK', { fingerprint: 'fp-bank2' }),
    ];
    const selected = selectForBlueprint(pool, singleOrSlotBlueprint(), () => 0.1);
    assert.equal(selected.length, 2);
    const sources = selected.map((s) => s.question.masterSource).sort();
    // Alternative A → SEE, Alternative B → Module Bank fallback.
    assert.deepEqual(sources, ['MODULE_QUESTION_BANK', 'VTU_SEE_PYQ']);
  });

  it('uses Module Bank when no eligible SEE candidate exists at all', () => {
    const pool = [
      q('bank1', 'MODULE_QUESTION_BANK', { fingerprint: 'fp-bank1' }),
      q('bank2', 'MODULE_QUESTION_BANK', { fingerprint: 'fp-bank2' }),
    ];
    const selected = selectForBlueprint(pool, singleOrSlotBlueprint(), () => 0.1);
    assert.equal(selected.length, 2);
    assert.ok(selected.every((s) => s.question.masterSource === 'MODULE_QUESTION_BANK'));
  });

  it('throws INSUFFICIENT_QUESTION_COVERAGE when neither source can fill a slot', () => {
    const pool = [q('see1', 'VTU_SEE_PYQ')]; // only one question → cannot fill A and B
    let err: unknown;
    try {
      selectForBlueprint(pool, singleOrSlotBlueprint(), () => 0.1);
    } catch (e) {
      err = e;
    }
    assert.ok(err);
    assert.equal((err as { code?: string }).code, 'INSUFFICIENT_QUESTION_COVERAGE');
  });

  it('never auto-selects OTHER_SOURCE (non-SEE PYQ) even to complete the paper', () => {
    // One SEE + plenty of non-SEE PYQs (previous IA/model). The paper cannot be
    // completed from SEE alone, and OTHER_SOURCE must NOT be used to fill it.
    const pool = [
      q('see1', 'VTU_SEE_PYQ'),
      q('ia1', 'OTHER_SOURCE', { fingerprint: 'fp-ia1' }),
      q('ia2', 'OTHER_SOURCE', { fingerprint: 'fp-ia2' }),
      q('model1', 'OTHER_SOURCE', { fingerprint: 'fp-model1' }),
    ];
    let err: unknown;
    try {
      selectForBlueprint(pool, singleOrSlotBlueprint(), () => 0.1);
    } catch (e) {
      err = e;
    }
    assert.ok(err, 'must not fill the second alternative from OTHER_SOURCE');
    assert.equal((err as { code?: string }).code, 'INSUFFICIENT_QUESTION_COVERAGE');
  });

  it('uses a GENUINE Module Question Bank question (not a non-SEE PYQ) as fallback', () => {
    const pool = [
      q('see1', 'VTU_SEE_PYQ'),
      q('ia1', 'OTHER_SOURCE', { fingerprint: 'fp-ia1' }), // must be ignored
      q('bank1', 'MODULE_QUESTION_BANK', { fingerprint: 'fp-bank1' }),
    ];
    const selected = selectForBlueprint(pool, singleOrSlotBlueprint(), () => 0.1);
    assert.equal(selected.length, 2);
    assert.equal(selected.filter((s) => s.question.masterSource === 'OTHER_SOURCE').length, 0);
    assert.deepEqual(selected.map((s) => s.question.masterSource).sort(), ['MODULE_QUESTION_BANK', 'VTU_SEE_PYQ']);
  });

  it('ranks a SEE question above a stronger Module Bank question (source priority first)', () => {
    const blueprint = singleOrSlotBlueprint();
    const selected = [{ slot: blueprint.slots[0], question: q('see1', 'VTU_SEE_PYQ') }];
    const pool = [
      // Module-bank question is a perfect CO/RBT match; SEE is a slightly weaker match.
      q('bankPerfect', 'MODULE_QUESTION_BANK', { fingerprint: 'fp-bp', coCode: 'CO3', rbtLevel: 'L2' }),
      q('seeOk', 'VTU_SEE_PYQ', { fingerprint: 'fp-so', coCode: 'CO3', rbtLevel: 'L2' }),
    ];
    const candidates = replacementCandidates(pool, blueprint, selected[0], selected);
    assert.equal(candidates[0].masterSource, 'VTU_SEE_PYQ', 'SEE outranks Module Bank for replacement');
  });
});

describe('finalization source validation', () => {
  const orBlueprint: Blueprint = {
    examType: 'IA-2',
    maxMarks: 50,
    requiredAnswerMarks: 50,
    durationMinutes: 90,
    modules: ['Module 3'],
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
  const base = (overrides: Record<string, unknown>) => ({
    itemKey: String(overrides.itemKey),
    questionNumber: Number(overrides.questionNumber),
    maxMarks: 20,
    fingerprint: String(overrides.fingerprint),
    primaryCo: 'CO3',
    moduleId: 3,
    moduleOrUnit: 'Module 3',
    rbtLevel: 'L2',
    difficulty: 'INTERMEDIATE',
    sourceKind: 'VTU_SEE_PYQ',
    sourceType: 'PREVIOUS_YEAR_QUESTION_PAPER',
    readinessStatus: 'READY_FOR_INTERNAL_PAPER',
    verificationStatus: 'READY_FOR_INTERNAL_PAPER',
    scheme: [{ maxMarks: 20, label: 'Full' }],
    modelAnswer: 'x',
    ...overrides,
  });

  it('accepts a mixed OR pair (A = VTU SEE, B = Module Bank) with equal marks and same module', () => {
    const report = validateInternalPaper({
      maxMarks: 50,
      requiredAnswerMarks: 50,
      patternMarks: [20, 20, 10],
      blueprint: orBlueprint,
      items: [
        base({ itemKey: 'Q1-A', questionNumber: 1, fingerprint: '1', orGroupId: 'Q1', orAlternative: 'A', sourceKind: 'VTU_SEE_PYQ' }),
        base({ itemKey: 'Q1-B', questionNumber: 1, fingerprint: '2', orGroupId: 'Q1', orAlternative: 'B', sourceKind: 'MODULE_QUESTION_BANK' }),
        base({ itemKey: 'Q2-A', questionNumber: 2, fingerprint: '3', orGroupId: 'Q2', orAlternative: 'A' }),
        base({ itemKey: 'Q2-B', questionNumber: 2, fingerprint: '4', orGroupId: 'Q2', orAlternative: 'B' }),
        base({ itemKey: 'Q3-A', questionNumber: 3, maxMarks: 10, fingerprint: '5', orGroupId: 'Q3', orAlternative: 'A', scheme: [{ maxMarks: 10, label: 'Full' }] }),
        base({ itemKey: 'Q3-B', questionNumber: 3, maxMarks: 10, fingerprint: '6', orGroupId: 'Q3', orAlternative: 'B', scheme: [{ maxMarks: 10, label: 'Full' }] }),
      ],
    });
    assert.equal(report.issues.some((i) => i.code === 'SOURCE'), false);
    assert.equal(report.canFinalize, true);
  });

  it('rejects finalization when any component has a forbidden source', () => {
    const report = validateInternalPaper({
      maxMarks: 50,
      requiredAnswerMarks: 50,
      patternMarks: [20, 20, 10],
      blueprint: orBlueprint,
      items: [
        base({ itemKey: 'Q1-A', questionNumber: 1, fingerprint: '1', orGroupId: 'Q1', orAlternative: 'A', sourceKind: 'AI_GENERATED', sourceType: 'AI_GENERATED' }),
        base({ itemKey: 'Q1-B', questionNumber: 1, fingerprint: '2', orGroupId: 'Q1', orAlternative: 'B' }),
        base({ itemKey: 'Q2-A', questionNumber: 2, fingerprint: '3', orGroupId: 'Q2', orAlternative: 'A' }),
        base({ itemKey: 'Q2-B', questionNumber: 2, fingerprint: '4', orGroupId: 'Q2', orAlternative: 'B' }),
        base({ itemKey: 'Q3-A', questionNumber: 3, maxMarks: 10, fingerprint: '5', orGroupId: 'Q3', orAlternative: 'A', scheme: [{ maxMarks: 10, label: 'Full' }] }),
        base({ itemKey: 'Q3-B', questionNumber: 3, maxMarks: 10, fingerprint: '6', orGroupId: 'Q3', orAlternative: 'B', scheme: [{ maxMarks: 10, label: 'Full' }] }),
      ],
    });
    assert.equal(report.canFinalize, false);
    assert.ok(report.issues.some((i) => i.code === 'SOURCE_NOT_ALLOWED_FOR_INTERNAL'));
  });
});

describe('sourceSummaryFromItems', () => {
  it('summarizes 5/6 SEE + 1/6 Module Bank fallback with a reason', () => {
    const items = [
      { questionNumber: 1, orAlternative: 'A', orGroupId: 'Q1', sourceKind: 'VTU_SEE_PYQ', moduleName: 'Module 3' },
      { questionNumber: 1, orAlternative: 'B', orGroupId: 'Q1', sourceKind: 'VTU_SEE_PYQ', moduleName: 'Module 3' },
      { questionNumber: 2, orAlternative: 'A', orGroupId: 'Q2', sourceKind: 'VTU_SEE_PYQ', moduleName: 'Module 4' },
      { questionNumber: 2, orAlternative: 'B', orGroupId: 'Q2', sourceKind: 'MODULE_QUESTION_BANK', moduleName: 'Module 4' },
      { questionNumber: 3, orAlternative: 'A', orGroupId: 'Q3', sourceKind: 'VTU_SEE_PYQ', moduleName: 'Module 3' },
      { questionNumber: 3, orAlternative: 'B', orGroupId: 'Q3', sourceKind: 'VTU_SEE_PYQ', moduleName: 'Module 3' },
    ];
    const summary = sourceSummaryFromItems(items);
    assert.equal(summary.total, 6);
    assert.equal(summary.vtuSeePyq, 5);
    assert.equal(summary.moduleQuestionBank, 1);
    assert.equal(summary.seeComponents, 5);
    assert.equal(summary.moduleBankComponents, 1);
    assert.equal(summary.fallbackReasons.length, 1);
    assert.match(summary.fallbackReasons[0], /Q2\(B\)/);
  });

  it('treats a 20-mark alternative built partly from Module Bank as a fallback alternative', () => {
    const items = [
      // Q1(A) is two 10-mark components: one SEE, one Module Bank → counts as fallback.
      { questionNumber: 1, orAlternative: 'A', orGroupId: 'Q1', sourceKind: 'VTU_SEE_PYQ', moduleName: 'Module 3' },
      { questionNumber: 1, orAlternative: 'A', orGroupId: 'Q1', sourceKind: 'MODULE_QUESTION_BANK', moduleName: 'Module 3' },
      { questionNumber: 1, orAlternative: 'B', orGroupId: 'Q1', sourceKind: 'VTU_SEE_PYQ', moduleName: 'Module 3' },
    ];
    const summary = sourceSummaryFromItems(items);
    assert.equal(summary.total, 2);
    assert.equal(summary.moduleQuestionBank, 1);
    assert.equal(summary.seeComponents, 2);
    assert.equal(summary.moduleBankComponents, 1);
  });
});

describe('module hard filter and OR quality', () => {
  it('never borrows from another module even when that module has excellent candidates', () => {
    const pool = [
      q('m2see', 'VTU_SEE_PYQ', { moduleId: 2, moduleName: 'Module 2' }),
      // Module 3 has abundant SEE — must not be used for a Module 2 slot.
      q('m3a', 'VTU_SEE_PYQ', { moduleId: 3, moduleName: 'Module 3', fingerprint: 'fp-m3a' }),
      q('m3b', 'VTU_SEE_PYQ', { moduleId: 3, moduleName: 'Module 3', fingerprint: 'fp-m3b' }),
      q('m3c', 'VTU_SEE_PYQ', { moduleId: 3, moduleName: 'Module 3', fingerprint: 'fp-m3c' }),
      q('m2bank', 'MODULE_QUESTION_BANK', { moduleId: 2, moduleName: 'Module 2', fingerprint: 'fp-m2b' }),
    ];
    const bp = singleOrSlotBlueprint();
    bp.modules = ['Module 2'];
    bp.selectedModuleIds = [2];
    bp.slots = bp.slots.map((s) => ({ ...s, moduleId: 2, moduleName: 'Module 2' }));
    const selected = selectForBlueprint(pool, bp, () => 0.1);
    assert.ok(selected.every((s) => s.question.moduleId === 2));
    assert.deepEqual(selected.map((s) => s.question.masterSource).sort(), ['MODULE_QUESTION_BANK', 'VTU_SEE_PYQ']);
  });

  it('avoids near-duplicate OR alternatives when a distinct SEE partner exists', () => {
    const stem =
      'Explain normalization and discuss the need for first second and third normal forms with examples from relational databases';
    const pool = [
      q('seeA', 'VTU_SEE_PYQ', { questionText: stem, fingerprint: 'fp-a' }),
      q('seeDup', 'VTU_SEE_PYQ', {
        questionText: `${stem} with suitable illustrations`,
        fingerprint: 'fp-dup',
        examYear: 2024,
      }),
      q('seeDistinct', 'VTU_SEE_PYQ', {
        questionText: 'Compare ACID properties of transactions and illustrate concurrency control with locking protocols',
        fingerprint: 'fp-distinct',
        examYear: 2022,
      }),
    ];
    const selected = selectForBlueprint(pool, singleOrSlotBlueprint(), () => 0.1);
    assert.equal(selected.length, 2);
    const texts = selected.map((s) => s.question.questionText);
    assert.ok(texts.some((t) => /ACID/i.test(t)), 'should prefer the academically distinct OR partner');
  });

  it('includes module and slot detail in shortage errors', () => {
    const pool = [q('see1', 'VTU_SEE_PYQ', { moduleId: 4, moduleName: 'Module 4' })];
    const bp = singleOrSlotBlueprint();
    bp.modules = ['Module 4'];
    bp.selectedModuleIds = [4];
    bp.slots = bp.slots.map((s) => ({ ...s, moduleId: 4, moduleName: 'Module 4' }));
    let err: unknown;
    try {
      selectForBlueprint(pool, bp, () => 0.1);
    } catch (e) {
      err = e;
    }
    assert.ok(err);
    assert.equal((err as { code?: string }).code, 'INSUFFICIENT_QUESTION_COVERAGE');
    assert.match(String((err as Error).message), /Module: Module 4/);
    assert.match(String((err as Error).message), /Q3\(B\)|Q3/);
  });

  it('excludes unverified SEE extraction from automatic selection', () => {
    const pool = [
      q('bad', 'VTU_SEE_PYQ', { sourceVerified: false, fingerprint: 'fp-bad' }),
      q('bank1', 'MODULE_QUESTION_BANK', { fingerprint: 'fp-bank1' }),
      q('bank2', 'MODULE_QUESTION_BANK', { fingerprint: 'fp-bank2' }),
    ];
    const selected = selectForBlueprint(pool, singleOrSlotBlueprint(), () => 0.1);
    assert.ok(selected.every((s) => s.question.masterSource === 'MODULE_QUESTION_BANK'));
    assert.equal(selected.filter((s) => s.question.id === 'bad').length, 0);
  });
});
