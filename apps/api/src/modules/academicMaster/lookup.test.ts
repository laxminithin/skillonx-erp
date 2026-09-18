import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  courseCodeVariants,
  missingAcademicMasterPayload,
  normalizeCourseCode,
  overlayByNaturalKey,
} from './lookup.js';

describe('academic master lookup', () => {
  it('normalizes and expands course codes', () => {
    assert.equal(normalizeCourseCode('1BCS 302'), '1BCS302');
    assert.deepEqual(courseCodeVariants('1BCHES102/202').sort(), ['1BCHES102', '1BCHES102/202', '1BCHES202']);
  });

  it('overlays college-specific extras but prefers global rows on the same natural key', () => {
    const rows = [
      { college_id: null, gap_id: 'GAP-1', title: 'global' },
      { college_id: 4, gap_id: 'GAP-1', title: 'college' },
      { college_id: 4, gap_id: 'GAP-LOCAL', title: 'college-only' },
      { college_id: null, gap_id: 'GAP-2', title: 'global-only' },
    ];
    const overlay = overlayByNaturalKey(rows as Array<Record<string, unknown>>, (r) => String(r.gap_id));
    assert.equal(overlay.length, 3);
    assert.equal(overlay.find((r) => r.gap_id === 'GAP-1')?.title, 'global');
    assert.equal(overlay.find((r) => r.gap_id === 'GAP-2')?.title, 'global-only');
    assert.equal(overlay.find((r) => r.gap_id === 'GAP-LOCAL')?.title, 'college-only');
  });

  it('builds faculty-facing diagnostics without a contact-admin-only message', () => {
    const payload = missingAcademicMasterPayload({
      subjectCode: '1BCS302',
      scheme: 'VTU 2025 Scheme',
      semester: 'Semester 3',
      missing: ['Gap Analysis master'],
    });
    assert.equal(payload.message, 'Academic master data for this subject has not yet been configured.');
    assert.deepEqual(payload.diagnostics.missing, ['Gap Analysis master']);
    assert.equal(payload.diagnostics.subjectCode, '1BCS302');
  });
});
