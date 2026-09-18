import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildCombinedMatrixGroups,
  filterRelevantSdgs,
  flattenMatrixColumns,
  totalGroupColSpan,
} from './combinedMatrix.js';
import { domainsFromType } from './academicMappingTypes.js';

const pos = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, code: `PO${i + 1}` }));
const psos2 = [
  { id: 101, code: 'PSO1' },
  { id: 102, code: 'PSO2' },
];
const psos3 = [...psos2, { id: 103, code: 'PSO3' }];
const sdgs = [
  { id: 8, code: 'SDG8' },
  { id: 9, code: 'SDG9' },
  { id: 12, code: 'SDG12' },
  { id: 4, code: 'SDG4' },
];

describe('combined academic mapping matrix', () => {
  it('CO–PO–PSO puts PO and PSO in the same ordered group list', () => {
    const groups = buildCombinedMatrixGroups({
      flags: domainsFromType('CO_PO_PSO'),
      programOutcomes: pos,
      programSpecificOutcomes: psos2,
    });
    assert.equal(groups.length, 2);
    assert.equal(groups[0].type, 'PO');
    assert.equal(groups[0].colSpan, 12);
    assert.equal(groups[1].type, 'PSO');
    assert.equal(groups[1].colSpan, 2);
    const flat = flattenMatrixColumns(groups);
    assert.equal(flat.length, 14);
    assert.equal(flat[0].domain, 'PO');
    assert.equal(flat[12].domain, 'PSO');
  });

  it('CO–PO–SDG puts PO and SDG in the same table groups', () => {
    const groups = buildCombinedMatrixGroups({
      flags: domainsFromType('CO_PO_SDG'),
      programOutcomes: pos,
      sdgs: sdgs.slice(0, 3),
    });
    assert.deepEqual(
      groups.map((g) => g.type),
      ['PO', 'SDG'],
    );
    assert.equal(totalGroupColSpan(groups), 15);
  });

  it('CO–PO–PSO–SDG includes all three groups in one matrix', () => {
    const groups = buildCombinedMatrixGroups({
      flags: domainsFromType('CO_PO_PSO_SDG'),
      programOutcomes: pos,
      programSpecificOutcomes: psos3,
      sdgs: sdgs.slice(0, 3),
    });
    assert.deepEqual(
      groups.map((g) => g.type),
      ['PO', 'PSO', 'SDG'],
    );
    assert.equal(groups[1].colSpan, 3); // dynamic PSO count
    assert.equal(totalGroupColSpan(groups), 12 + 3 + 3);
  });

  it('uses dynamic PSO colspan for PSO1–PSO3', () => {
    const groups = buildCombinedMatrixGroups({
      flags: { po: false, pso: true, sdg: false },
      programSpecificOutcomes: psos3,
    });
    assert.equal(groups[0].colSpan, 3);
    assert.deepEqual(
      groups[0].targets.map((t) => t.code),
      ['PSO1', 'PSO2', 'PSO3'],
    );
  });

  it('filters relevant SDGs by active relationships', () => {
    const filtered = filterRelevantSdgs(sdgs, {
      showAll: false,
      relevantIds: [8, 9, 12, 4],
      activeSdgIds: [9, 12],
    });
    assert.deepEqual(
      filtered.map((s) => s.code),
      ['SDG9', 'SDG12'],
    );
  });

  it('show-all toggle returns full SDG set without inventing relationships', () => {
    const all = filterRelevantSdgs(sdgs, { showAll: true, activeSdgIds: [9] });
    assert.equal(all.length, sdgs.length);
  });

  it('single-domain types produce exactly one group', () => {
    assert.equal(
      buildCombinedMatrixGroups({ flags: domainsFromType('CO_PO'), programOutcomes: pos }).length,
      1,
    );
    assert.equal(
      buildCombinedMatrixGroups({ flags: domainsFromType('CO_PSO'), programSpecificOutcomes: psos2 }).length,
      1,
    );
    assert.equal(buildCombinedMatrixGroups({ flags: domainsFromType('CO_SDG'), sdgs }).length, 1);
  });

  it('does not fabricate empty groups', () => {
    const groups = buildCombinedMatrixGroups({
      flags: domainsFromType('CO_PO_PSO_SDG'),
      programOutcomes: pos,
      programSpecificOutcomes: [],
      sdgs: [],
    });
    assert.deepEqual(
      groups.map((g) => g.type),
      ['PO'],
    );
  });
});
