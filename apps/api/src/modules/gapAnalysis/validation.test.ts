import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { applicabilitySchema, closeGapSchema, coverageSchema, actionCreateSchema } from './service.js';

describe('gap analysis validation schemas', () => {
  it('accepts coverage 0–4', () => {
    assert.equal(coverageSchema.parse({ actualCoverageLevel: 0 }).actualCoverageLevel, 0);
    assert.equal(coverageSchema.parse({ actualCoverageLevel: 4 }).actualCoverageLevel, 4);
    assert.throws(() => coverageSchema.parse({ actualCoverageLevel: 5 }));
  });

  it('requires reason for NOT_APPLICABLE at service layer via schema optionality', () => {
    const ok = applicabilitySchema.parse({ applicability: 'NOT_APPLICABLE', reason: 'Already covered in lab' });
    assert.equal(ok.applicability, 'NOT_APPLICABLE');
    assert.throws(() => closeGapSchema.parse({ closureNote: '' }));
    assert.ok(closeGapSchema.parse({ closureNote: 'Closed after lab' }));
  });

  it('accepts controlled action types', () => {
    const row = actionCreateSchema.parse({
      actionType: 'HANDS_ON_LAB',
      title: 'Hands-on HDFS Lab',
    });
    assert.equal(row.actionType, 'HANDS_ON_LAB');
    assert.throws(() =>
      actionCreateSchema.parse({
        actionType: 'NOT_A_TYPE',
        title: 'x',
      } as unknown as z.infer<typeof actionCreateSchema>),
    );
  });
});
