import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  classifyCoStatus,
  combineDirect,
  combineFinal,
  computeSourceCoAttainment,
  courseHealthPercent,
  gap,
  improvementDelta,
  percentToLevel,
  rollupOutcomes,
  weightedAverage,
} from './formula.js';
import { SKILLONX_STANDARD_V1 } from './policy.js';
import { parsePolicy } from './policy.js';
import { decideSeeMethod, estimateSeeFromTotals, paperCoWeights } from './see.js';
import type { AssessmentSourceInput } from './types.js';

const policy = SKILLONX_STANDARD_V1;

describe('SkillOnX Academic Standard v1.0 scale', () => {
  it('maps percents onto the 3-level scale', () => {
    assert.equal(percentToLevel(70, policy), 3);
    assert.equal(percentToLevel(69.9, policy), 2);
    assert.equal(percentToLevel(60, policy), 2);
    assert.equal(percentToLevel(50, policy), 1);
    assert.equal(percentToLevel(49.9, policy), 0);
  });
});

function source(partial: Partial<AssessmentSourceInput> = {}): AssessmentSourceInput {
  return {
    sourceKind: 'QUIZ',
    sourceId: 1,
    sourceLabel: 'Quiz 1',
    category: 'CIE',
    weight: 1,
    questions: [
      { questionKey: 'Q1', maxMarks: 10, coCode: 'CO1', bloomLevel: 'REMEMBER' },
      { questionKey: 'Q2', maxMarks: 10, coCode: 'CO2', bloomLevel: 'APPLY', topic: 'SQL' },
    ],
    students: [
      { studentKey: 'A', usn: '1', status: 'PRESENT' },
      { studentKey: 'B', usn: '2', status: 'PRESENT' },
    ],
    marks: [
      { studentKey: 'A', questionKey: 'Q1', coCode: 'CO1', awarded: 8, maxMarks: 10, status: 'PRESENT' },
      { studentKey: 'A', questionKey: 'Q2', coCode: 'CO2', awarded: 4, maxMarks: 10, status: 'PRESENT' },
      { studentKey: 'B', questionKey: 'Q1', coCode: 'CO1', awarded: 9, maxMarks: 10, status: 'PRESENT' },
      { studentKey: 'B', questionKey: 'Q2', coCode: 'CO2', awarded: 3, maxMarks: 10, status: 'PRESENT' },
    ],
    ...partial,
  };
}

describe('CIE / source CO attainment', () => {
  it('averages student 3-point levels per CO', () => {
    const rows = computeSourceCoAttainment(source(), policy);
    const co1 = rows.find((r) => r.coCode === 'CO1')!;
    const co2 = rows.find((r) => r.coCode === 'CO2')!;
    // A 80%→3, B 90%→3
    assert.equal(co1.attainment, 3);
    // A 40%→0, B 30%→0
    assert.equal(co2.attainment, 0);
    assert.equal(co2.weakStudentCount, 2);
    assert.equal(co2.topicWeakness[0]?.topic, 'SQL');
  });

  it('excludes absent students from the class average', () => {
    const rows = computeSourceCoAttainment(
      source({
        students: [
          { studentKey: 'A', usn: '1', status: 'PRESENT' },
          { studentKey: 'C', usn: '3', status: 'ABSENT' },
        ],
        marks: [
          { studentKey: 'A', questionKey: 'Q1', coCode: 'CO1', awarded: 8, maxMarks: 10, status: 'PRESENT' },
          { studentKey: 'C', questionKey: 'Q1', coCode: 'CO1', awarded: 0, maxMarks: 10, status: 'ABSENT' },
        ],
      }),
      policy,
    );
    assert.equal(rows.find((r) => r.coCode === 'CO1')?.studentCount, 1);
  });
});

describe('SEE modes', () => {
  it('prefers actual question-wise marks', () => {
    const d = decideSeeMethod({ hasQuestionWiseSeeMarks: true, hasSeePaperWithCoMapping: true });
    assert.equal(d.method, 'ACTUAL');
    assert.equal(d.confidence, 'HIGH');
    assert.equal(d.estimated, false);
  });

  it('uses paper-weighted estimate when only totals exist with a mapped paper', () => {
    const d = decideSeeMethod({ hasQuestionWiseSeeMarks: false, hasSeePaperWithCoMapping: true });
    assert.equal(d.method, 'PAPER_WEIGHTED');
    assert.equal(d.confidence, 'MEDIUM');
    assert.equal(d.estimated, true);
  });

  it('falls back to equal-weight and labels it as estimated', () => {
    const d = decideSeeMethod({ hasQuestionWiseSeeMarks: false, hasSeePaperWithCoMapping: false });
    assert.equal(d.method, 'EQUAL_WEIGHT');
    assert.equal(d.confidence, 'LOW');
    assert.match(d.label, /Equal-Weight Estimate/);
  });

  it('builds a CO exposure matrix from the SEE paper', () => {
    const weights = paperCoWeights([
      { questionKey: '1', coCode: 'CO1', maxMarks: 15 },
      { questionKey: '2', coCode: 'CO2', maxMarks: 25 },
      { questionKey: '3', coCode: 'CO3', maxMarks: 30 },
      { questionKey: '4', coCode: 'CO4', maxMarks: 20 },
      { questionKey: '5', coCode: 'CO5', maxMarks: 10 },
    ]);
    assert.equal(weights.find((w) => w.coCode === 'CO1')?.weight, 0.15);
    assert.equal(weights.find((w) => w.coCode === 'CO3')?.weight, 0.3);
  });

  it('applies overall SEE percent uniformly in paper-weighted estimate', () => {
    const weights = paperCoWeights([
      { questionKey: '1', coCode: 'CO1', maxMarks: 40 },
      { questionKey: '2', coCode: 'CO2', maxMarks: 60 },
    ]);
    const est = estimateSeeFromTotals(
      [{ studentKey: 'A', usn: '1', status: 'PRESENT', seePercent: 70 }],
      weights,
      policy,
    );
    assert.equal(est.classAttainment.find((c) => c.coCode === 'CO1')?.attainment, 3);
    assert.equal(est.students[0].coLevels.CO1, est.students[0].coLevels.CO2);
  });
});

describe('direct / indirect / final CO attainment', () => {
  it('combines CIE and SEE using the course structure weights', () => {
    const direct = combineDirect(2.0, 3.0, 0.4, 0.6);
    assert.equal(direct.result, 2.6);
    assert.match(direct.formula, /CIE/);
  });

  it('renormalizes when SEE is missing', () => {
    const direct = combineDirect(2.4, null, 0.5, 0.5);
    assert.equal(direct.result, 2.4);
    assert.deepEqual(direct.missing, ['SEE']);
  });

  it('uses policy 80:20 rather than a hard-coded split', () => {
    const custom = parsePolicy({ ...policy, directWeight: 0.7, indirectWeight: 0.3 });
    const final = combineFinal(2.5, 2.0, custom);
    assert.equal(final.result, 2.35);
  });

  it('falls back to 100% direct when indirect is missing', () => {
    const final = combineFinal(2.4, null, policy);
    assert.equal(final.result, 2.4);
    assert.equal(final.indirectMissing, true);
  });
});

describe('CO status engine', () => {
  it('marks below-target COs RED', () => {
    assert.equal(classifyCoStatus({ actual: 2.15, target: 2.5, weakStudentRatio: 0, weakComponentGap: 0 }, policy), 'RED');
  });

  it('marks attained COs with a large weak cohort AMBER', () => {
    assert.equal(
      classifyCoStatus({ actual: 2.61, target: 2.5, weakStudentRatio: 17 / 60, weakComponentGap: 0 }, policy),
      'AMBER',
    );
  });

  it('marks clean attainment GREEN', () => {
    assert.equal(classifyCoStatus({ actual: 2.7, target: 2.5, weakStudentRatio: 0.1, weakComponentGap: 0 }, policy), 'GREEN');
  });
});

describe('PO / PSO roll-up', () => {
  it('weights contributing COs by mapping strength', () => {
    const rows = rollupOutcomes(
      [
        { coCode: 'CO1', attainment: 3 },
        { coCode: 'CO2', attainment: 1.5 },
      ],
      [
        { coCode: 'CO1', outcomeCode: 'PO1', strength: 3 },
        { coCode: 'CO2', outcomeCode: 'PO1', strength: 1 },
      ],
    );
    assert.equal(rows[0].outcomeCode, 'PO1');
    assert.equal(rows[0].attainment, (3 * 3 + 1.5 * 1) / 4);
  });
});

describe('improvement calculation', () => {
  it('computes revised minus previous and does not treat small gains as success', () => {
    assert.equal(improvementDelta(2.55, 2.15), 0.4);
    assert.equal(improvementDelta(2.2, 2.15), 0.05);
    assert.equal(gap(2.15, 2.5), 0.35);
    assert.ok(2.2 < 2.5);
  });
});

describe('course health', () => {
  it('scores green=1 amber=0.5 red=0', () => {
    assert.equal(courseHealthPercent(['GREEN', 'RED', 'GREEN', 'AMBER', 'GREEN']), 70);
  });
});

describe('weightedAverage empty', () => {
  it('returns null rather than inventing a number', () => {
    assert.equal(weightedAverage([]).result, null);
  });
});
