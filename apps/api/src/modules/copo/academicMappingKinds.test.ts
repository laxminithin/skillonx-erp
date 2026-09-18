import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cycleCorrelation, isMappingKind, MAPPING_KINDS } from './types.js';
import { targetColumn } from './helpers.js';

describe('academic mapping kinds', () => {
  it('supports PO, PSO, and SDG kinds', () => {
    assert.deepEqual([...MAPPING_KINDS], ['PO', 'PSO', 'SDG']);
    assert.equal(isMappingKind('PSO'), true);
    assert.equal(isMappingKind('SDG'), true);
    assert.equal(isMappingKind('XYZ'), false);
  });

  it('maps kinds to target columns', () => {
    assert.equal(targetColumn('PO'), 'program_outcome_id');
    assert.equal(targetColumn('PSO'), 'program_specific_outcome_id');
    assert.equal(targetColumn('SDG'), 'sdg_id');
  });

  it('cycles correlation 1→2→3→null', () => {
    assert.equal(cycleCorrelation(null), 1);
    assert.equal(cycleCorrelation(1), 2);
    assert.equal(cycleCorrelation(2), 3);
    assert.equal(cycleCorrelation(3), null);
  });
});
