import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { discoverCbsMasterFiles, parseCbsWorkbook } from './workbookParser.js';

describe('CBS workbook parser', () => {
  it('discovers master workbook with BEYOND_SYLLABUS_MASTER', async () => {
    const masters = await discoverCbsMasterFiles();
    assert.ok(masters.length >= 1, 'expected CBS master workbook');
    assert.match(masters[0].fileName, /SkillonX_Academic_Mapping_Master/i);
    assert.ok(masters[0].sheets.includes('BEYOND_SYLLABUS_MASTER'));
  });

  it('parses stable CBS IDs and BIS701 enrichment quality', async () => {
    const masters = await discoverCbsMasterFiles();
    if (!masters.length) return;
    const parsed = await parseCbsWorkbook(masters[0].filePath);
    assert.equal(parsed.errors.length, 0, parsed.errors.join('\n'));
    assert.ok(parsed.items.length >= 15, `expected recommendations, got ${parsed.items.length}`);

    const bis = parsed.items.filter((i) => i.courseCode === 'BIS701');
    assert.ok(bis.length >= 5 && bis.length <= 10, `BIS701 count ${bis.length}`);
    const cloud = bis.find((i) => i.cbsId === 'CBS-BIS701-001');
    assert.ok(cloud, 'CBS-BIS701-001 missing');
    assert.match(cloud!.title, /Managed Cloud Data Processing Platforms/i);
    assert.equal(cloud!.originType, 'INDUSTRY_REQUIREMENT');
    assert.equal(cloud!.suggestedCo, 'CO2');
    assert.equal(cloud!.suggestedDeliveryMethod, 'DEMONSTRATION');
    assert.equal(cloud!.suggestedHours, 2);

    const ids = new Set(parsed.items.map((i) => i.cbsId));
    assert.equal(ids.size, parsed.items.length, 'CBS IDs must be unique');

    const gapLinked = parsed.items.filter((i) => i.relatedGapId || i.originType === 'GAP_ANALYSIS');
    assert.ok(gapLinked.length > 0, 'expected some gap-linked items');

    assert.ok(parsed.coLinks.length >= parsed.items.length * 0.8, 'most items should have CO links');
  });
});
