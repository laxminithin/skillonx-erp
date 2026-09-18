import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { discoverCopoMasterFiles, parseCopoWorkbook } from './workbookParser.js';

describe('SkillonX academic mapping workbook parser', () => {
  it('discovers the unified academic master and parses CO/PO/PSO/SDG sheets', async () => {
    const masters = await discoverCopoMasterFiles();
    assert.ok(masters.length >= 1, 'expected a master workbook in apps/web/public');
    assert.match(masters[0].fileName, /SkillonX_Academic_Mapping_Master/i);

    const buffer = await readFile(masters[0].filePath);
    const parsed = await parseCopoWorkbook(buffer);
    assert.equal(parsed.errors.length, 0, parsed.errors.join('\n'));

    // Counts grow with the master; assert structural coverage, not a hard-coded subject total.
    assert.ok(parsed.subjects.length >= 13);
    assert.ok(parsed.outcomes.length >= 61);
    assert.ok(parsed.mappings.length >= 80);
    assert.ok(parsed.programOutcomes.length >= 12);
    assert.ok(parsed.programSpecificOutcomes.length >= 3);
    assert.ok(parsed.coPsoMappings.length >= 1);
    assert.equal(parsed.sdgs.length, 17);
    assert.ok(parsed.coSdgMappings.length >= 1);

    const bda = parsed.subjects.find((s) => s.code === 'BIS701');
    assert.equal(bda?.name, 'Big Data Analytics');
    assert.equal(bda?.importReady, true);

    const isePsos = parsed.programSpecificOutcomes.filter((p) => p.program.includes('Information Science'));
    assert.ok(isePsos.length >= 3);
    assert.ok(isePsos.every((p) => p.verificationStatus === 'VERIFIED_SOURCE' || p.verificationStatus === 'VERIFIED'));
    assert.ok(isePsos.some((p) => p.psoCode === 'PSO3'));

    const bdaPso = parsed.coPsoMappings.filter((m) => m.subjectCode === 'BIS701');
    assert.ok(bdaPso.length >= 1);

    // Gap sheets may coexist in the same workbook; discovery still prefers this master.
    assert.ok(masters[0].sheets.includes('SUBJECT_MASTER'));
    assert.ok(masters[0].sheets.includes('CO_MASTER'));
  });
});
