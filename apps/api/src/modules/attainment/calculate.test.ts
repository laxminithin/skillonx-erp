import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateRun } from './calculate.js';
import { SKILLONX_STANDARD_V1 } from './policy.js';
import type { AssessmentSourceInput } from './types.js';

describe('end-to-end calculateRun', () => {
  it('produces CIE, paper-weighted SEE, direct 80/20 final, and PO roll-up', () => {
    const cie: AssessmentSourceInput = {
      sourceKind: 'QUIZ',
      sourceId: 1,
      sourceLabel: 'Quiz',
      category: 'CIE',
      weight: 1,
      questions: [{ questionKey: 'Q1', maxMarks: 10, coCode: 'CO1' }],
      students: [{ studentKey: 'A', usn: '1', status: 'PRESENT' }],
      marks: [{ studentKey: 'A', questionKey: 'Q1', coCode: 'CO1', awarded: 8, maxMarks: 10, status: 'PRESENT' }],
    };
    const see: AssessmentSourceInput = {
      sourceKind: 'SEE',
      sourceId: 2,
      sourceLabel: 'SEE',
      category: 'SEE',
      weight: 1,
      questions: [],
      students: [{ studentKey: 'A', usn: '1', status: 'PRESENT', totalAwarded: 70, totalMax: 100 }],
      marks: [],
    };
    const result = calculateRun({
      policyRaw: SKILLONX_STANDARD_V1,
      outcomes: [{ id: 1, co_code: 'CO1', statement: 'SQL' }],
      cieSources: [cie],
      seeSources: [see],
      indirectSources: [],
      seePaperQuestions: [
        { questionKey: 'S1', coCode: 'CO1', maxMarks: 100 },
      ],
      cieWeight: 50,
      seeWeight: 50,
      components: [],
      poMappings: [{ coCode: 'CO1', outcomeCode: 'PO1', strength: 3 }],
      psoMappings: [],
    });
    assert.equal(result.seeDecision.method, 'PAPER_WEIGHTED');
    assert.equal(result.seeDecision.estimated, true);
    const co1 = result.cos[0];
    assert.equal(co1.cie, 3);
    assert.equal(co1.see, 3);
    assert.equal(co1.direct, 3);
    assert.equal(co1.final, 3);
    assert.equal(co1.formula.final.includes('Direct') || co1.formula.direct.includes('CIE'), true);
    assert.equal(result.po[0].outcomeCode, 'PO1');
    assert.equal(result.po[0].attainment, 3);
  });
});
