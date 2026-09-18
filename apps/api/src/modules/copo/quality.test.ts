import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { detectQualityIssues, detectPsoQualityIssues, detectSdgQualityIssues, summarizeMapping } from './quality.js';
import { cycleCorrelation } from './types.js';
import { suggestJustification, suggestMappings } from './suggest.js';

const pos = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, code: `PO${i + 1}` }));
const cos = [
  { id: 1, code: 'CO1' },
  { id: 2, code: 'CO2' },
];

describe('CO–PO quality checks', () => {
  it('flags a CO with no PO correlation', () => {
    const flags = detectQualityIssues({
      courseOutcomes: cos,
      programOutcomes: pos,
      items: [{ courseOutcomeId: 1, programOutcomeId: 1, strength: 2 }],
    });
    assert.ok(flags.some((f) => f.code === 'CO_UNMAPPED' && f.courseOutcomeId === 2));
  });

  it('flags over-mapping when a CO maps to every PO', () => {
    const items = pos.map((po) => ({ courseOutcomeId: 1, programOutcomeId: po.id, strength: 3 as const }));
    const flags = detectQualityIssues({
      courseOutcomes: [cos[0]],
      programOutcomes: pos,
      items,
    });
    assert.ok(flags.some((f) => f.code === 'OVER_MAPPING'));
  });

  it('counts mapped cells and missing justifications without treating blank as zero', () => {
    const summary = summarizeMapping({
      courseOutcomes: cos,
      programOutcomes: pos.slice(0, 4),
      items: [
        { courseOutcomeId: 1, programOutcomeId: 1, strength: 3, justification: 'Direct analysis contribution.' },
        { courseOutcomeId: 1, programOutcomeId: 2, strength: 2 },
        { courseOutcomeId: 2, programOutcomeId: 1, strength: null },
      ],
    });
    assert.equal(summary.mappedRelationships, 2);
    assert.equal(summary.high, 1);
    assert.equal(summary.moderate, 1);
    assert.equal(summary.missingJustifications, 1);
  });
});

describe('PSO and SDG quality checks', () => {
  it('does not treat an unmapped CO as an SDG error', () => {
    const flags = detectSdgQualityIssues({
      courseOutcomes: cos,
      programOutcomes: [
        { id: 4, code: 'SDG4' },
        { id: 9, code: 'SDG9' },
      ],
      items: [{ courseOutcomeId: 1, programOutcomeId: 9, strength: 2, justification: 'Industry contribution.' }],
    });
    assert.equal(
      flags.some((f) => f.courseOutcomeId === 2 && f.code === 'CO_UNMAPPED'),
      false,
    );
  });

  it('flags every CO mapped to SDG4 as generic', () => {
    const flags = detectSdgQualityIssues({
      courseOutcomes: cos,
      programOutcomes: [{ id: 4, code: 'SDG4' }],
      items: [
        { courseOutcomeId: 1, programOutcomeId: 4, strength: 2, justification: 'Education.' },
        { courseOutcomeId: 2, programOutcomeId: 4, strength: 1, justification: 'Education.' },
      ],
    });
    assert.ok(flags.some((f) => f.code === 'GENERIC_SDG4'));
  });

  it('flags a CO mapped to every PSO', () => {
    const flags = detectPsoQualityIssues({
      courseOutcomes: [cos[0]],
      programOutcomes: [
        { id: 1, code: 'PSO1' },
        { id: 2, code: 'PSO2' },
      ],
      items: [
        { courseOutcomeId: 1, programOutcomeId: 1, strength: 3, justification: 'Discipline-specific computing.' },
        { courseOutcomeId: 1, programOutcomeId: 2, strength: 3, justification: 'Discipline-specific computing.' },
      ],
    });
    assert.ok(flags.some((f) => f.code === 'PSO_OVER_MAPPING'));
  });
});

describe('mapping helpers', () => {
  it('cycles blank → 1 → 2 → 3 → blank and never uses zero', () => {
    assert.equal(cycleCorrelation(null), 1);
    assert.equal(cycleCorrelation(1), 2);
    assert.equal(cycleCorrelation(2), 3);
    assert.equal(cycleCorrelation(3), null);
    assert.equal(cycleCorrelation(0), 1);
  });

  it('does not silently treat AI suggestions as approved mappings', () => {
    const suggestions = suggestMappings(
      [{ id: 1, code: 'CO1', statement: 'Analyse process scheduling and synchronization problems', bloomsLevel: 'L4' }],
      [{ id: 9, code: 'PO2', shortTitle: 'Problem Analysis', statement: 'Identify, formulate and analyse complex engineering problems' }],
    );
    assert.ok(suggestions.length === 0 || suggestions.every((s) => s.rationale.includes('Not approved')));
  });

  it('builds a justification draft that does not merely repeat official statements', () => {
    const text = suggestJustification({
      coCode: 'CO3',
      coStatement: 'Apply CPU scheduling algorithms to given problems',
      poCode: 'PO2',
      poTitle: 'Problem Analysis',
      poStatement: 'Identify, formulate, review research literature, and analyse complex engineering problems',
      strength: 3,
      bloomsLevel: 'L4',
      subjectName: 'Operating Systems',
    });
    assert.ok(text.includes('CO3'));
    assert.ok(text.includes('PO2'));
    assert.ok(text.includes('Review and edit'));
    assert.notEqual(text.trim(), 'Apply CPU scheduling algorithms to given problems');
  });
});
