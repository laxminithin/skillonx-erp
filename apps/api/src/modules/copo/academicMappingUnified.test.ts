import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ACADEMIC_MAPPING_TYPES,
  availableMappingTypes,
  domainsFromType,
  isAcademicMappingType,
  isStrictDomainUpgrade,
  typeFromDomains,
} from './academicMappingTypes.js';

describe('unified academic mapping types', () => {
  it('round-trips all six supported domain combinations', () => {
    for (const type of ACADEMIC_MAPPING_TYPES) {
      assert.equal(typeFromDomains(domainsFromType(type)), type);
    }
  });

  it('disables every PSO combination when its master is missing', () => {
    const availability = availableMappingTypes({ po: true, pso: false, sdg: true });
    for (const entry of availability) {
      assert.equal(entry.available, !domainsFromType(entry.type).pso);
      if (domainsFromType(entry.type).pso) assert.ok(entry.missing.includes('CO–PSO Master Mapping'));
    }
  });

  it('only accepts strict domain supersets as upgrades', () => {
    assert.equal(
      isStrictDomainUpgrade(domainsFromType('CO_PO'), domainsFromType('CO_PO_PSO')),
      true,
    );
    assert.equal(
      isStrictDomainUpgrade(domainsFromType('CO_PO_PSO'), domainsFromType('CO_PO_PSO')),
      false,
    );
    assert.equal(
      isStrictDomainUpgrade(domainsFromType('CO_PO_PSO'), domainsFromType('CO_PO_SDG')),
      false,
    );
  });

  it('recognizes only stable academic mapping type values', () => {
    for (const type of ACADEMIC_MAPPING_TYPES) assert.equal(isAcademicMappingType(type), true);
    assert.equal(isAcademicMappingType('PO'), false);
    assert.equal(isAcademicMappingType('CO_PSO_SDG'), false);
    assert.equal(isAcademicMappingType(null), false);
  });
});
