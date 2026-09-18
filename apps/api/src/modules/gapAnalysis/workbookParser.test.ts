import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverGapMasterFiles, parseGapWorkbook } from './workbookParser.js';

const publicMaster = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../web/public/SkillonX_Academic_Mapping_Master.xlsx',
);

describe('gap master workbook parser', () => {
  it('discovers academic mapping master with GAP sheets', async () => {
    const masters = await discoverGapMasterFiles();
    assert.ok(masters.length >= 1, 'expected at least one GAP_MASTER workbook');
    assert.ok(masters[0].sheets.includes('GAP_MASTER'));
  });

  it('parses gap sheets with stable IDs and preserves verification', async () => {
    const parsed = await parseGapWorkbook(publicMaster);
    assert.equal(parsed.errors.length, 0, parsed.errors.join('; '));
    assert.ok(parsed.gaps.length >= 1, 'expected gap rows');
    assert.ok(parsed.gaps.every((g) => g.gapId.startsWith('GAP-')), 'stable Gap IDs');

    const subjects = new Set(parsed.gaps.map((g) => g.courseCode));
    // Runtime must not hard-code subject count; fixture currently has multiple subjects.
    assert.ok(subjects.size >= 1);

    const bda = parsed.gaps.filter((g) => g.courseCode === 'BIS701');
    assert.equal(bda.length, 3);
    assert.ok(bda.every((g) => g.verificationStatus === 'ACADEMIC_ANALYSIS'));
    assert.ok(bda.every((g) => g.mappingOrigin === 'ACADEMIC_ANALYSIS'));

    assert.ok(parsed.coLinks.length >= bda.length);
    assert.ok(parsed.actions.some((a) => a.gapId === 'GAP-BIS701-001'));
    assert.ok(parsed.sources.some((s) => s.gapId === 'GAP-BIS701-001'));

    // Computer Networks review condition preserved in review queue
    assert.ok(parsed.reviewQueue.some((r) => String(r.courseCode).includes('10CS55')));
  });

  it('does not invent verified source from academic analysis', async () => {
    const parsed = await parseGapWorkbook(publicMaster);
    const academic = parsed.gaps.filter((g) => g.mappingOrigin === 'ACADEMIC_ANALYSIS');
    assert.ok(academic.length > 0);
    assert.ok(academic.every((g) => g.verificationStatus !== 'VERIFIED_SOURCE'));
  });
});
