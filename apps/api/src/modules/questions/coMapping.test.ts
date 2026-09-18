import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  inferPrimaryCoFromIntent,
  snapshotDerivedOutcomes,
  tokenizeAcademicText,
  type DerivedOutcomes,
} from './coMapping.js';

describe('coMapping helpers', () => {
  it('tokenizes academic text and drops stop words', () => {
    const tokens = tokenizeAcademicText('Apply the fundamentals of automata to write DFA and NFA');
    assert.ok(tokens.includes('automata'));
    assert.ok(tokens.includes('dfa'));
    assert.ok(!tokens.includes('the'));
    assert.ok(!tokens.includes('apply'));
  });

  it('maps by intent keywords — never Module N = CO N', () => {
    const outcomes = [
      {
        id: 1,
        coCode: 'CO1',
        statement: 'Apply the fundamentals of automata theory to write DFA, NFA, Epsilon-NFA and conversion between them.',
      },
      {
        id: 2,
        coCode: 'CO2',
        statement: 'Prove the properties of regular languages using regular expressions.',
      },
      {
        id: 3,
        coCode: 'CO3',
        statement: 'Design context-free grammars (CFGs) and pushdown automata (PDAs) for formal languages.',
      },
      {
        id: 4,
        coCode: 'CO4',
        statement: 'Design Turing machines to solve the computational problems.',
      },
      {
        id: 5,
        coCode: 'CO5',
        statement: 'Explain the concepts of decidability and undecidability.',
      },
    ];

    // Module 3 folder/topic, but question is clearly about Turing machines → CO4, not CO3
    const tm = inferPrimaryCoFromIntent({
      questionText: 'Design a Turing machine that accepts {0^n 1^n | n≥0} using a cross-off strategy.',
      modelAnswer: 'Zig-zag marking 0s and 1s on the tape until empty; reject on mismatch.',
      moduleHint: 'Module 3 — Context Free Grammars and Pushdown Automata',
      outcomes,
    });
    assert.equal(tm.primaryCoCode, 'CO4');
    assert.equal(tm.coMappingBlocked, false);

    // Regex question → CO2 even if module hint says Module 1
    const re = inferPrimaryCoFromIntent({
      questionText: 'Convert the regular expression (0+1)*011 to an NFA using Thompson construction.',
      modelAnswer: 'Build fragments for union, concat and star; glue with ε-transitions.',
      moduleHint: 'Module 1 — Introduction to Automata',
      outcomes,
    });
    assert.equal(re.primaryCoCode, 'CO2');
  });

  it('blocks mapping when the subject has no course outcomes', () => {
    const blocked = inferPrimaryCoFromIntent({
      questionText: 'Anything',
      outcomes: [],
    });
    assert.equal(blocked.coMappingBlocked, true);
    assert.equal(blocked.verificationStatus, 'CO_MAPPING_BLOCKED');
    assert.equal(blocked.primaryCoCode, null);
  });

  it('marks needs review when overlap is weak', () => {
    const outcomes = [
      { id: 1, coCode: 'CO1', statement: 'Describe photosynthetic pathways in aquatic plants.' },
      { id: 2, coCode: 'CO2', statement: 'Analyse soil mineral cycles in temperate forests.' },
    ];
    const weak = inferPrimaryCoFromIntent({
      questionText: 'Explain deadlock prevention in operating systems using wait-die.',
      modelAnswer: 'Assign timestamps to transactions; younger dies or waits per policy.',
      outcomes,
    });
    assert.equal(weak.needsReview, true);
    // May attach a weak best-CO for faculty review, or leave null if zero overlap
    assert.ok(weak.verificationStatus === 'NEEDS_REVIEW');
  });

  it('snapshots derived outcomes to code lists', () => {
    const derived: DerivedOutcomes = {
      pos: [{ code: 'PO1' }, { code: 'PO2' }],
      psos: [{ code: 'PSO1' }],
      sdgs: [{ code: 'SDG4' }],
      provenance: 'DERIVED_FROM_CO_MAPPING',
      mappingVersionId: 9,
      blocked: false,
      blockReason: null,
    };
    assert.deepEqual(snapshotDerivedOutcomes(derived), {
      provenance: 'DERIVED_FROM_CO_MAPPING',
      mappingVersionId: 9,
      pos: ['PO1', 'PO2'],
      psos: ['PSO1'],
      sdgs: ['SDG4'],
    });
  });
});
