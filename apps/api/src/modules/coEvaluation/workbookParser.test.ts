import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decideCoEvaluationAccess, decideCoEvaluationMutateAccess } from './access.js';
import { validateEvaluationMatrix, computeMarksDistribution } from './matrixValidation.js';
import { parseCoEvalWorkbook, discoverCoEvalMasterFiles } from './workbookParser.js';
import { nearlyEqual } from './types.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const publicMaster = path.resolve(here, '../../../../web/public/SkillonX_Academic_Mapping_Master.xlsx');

describe('coEvaluation access', () => {
  const owner = { collegeId: 1, createdBy: 10, departmentId: 5 };
  it('allows owning faculty', () => {
    assert.equal(
      decideCoEvaluationAccess(
        { facultyUserId: 10, collegeId: 1, role: 'FACULTY', departmentId: 5 },
        owner,
      ),
      'ALLOW',
    );
  });
  it('forbids peer faculty', () => {
    assert.equal(
      decideCoEvaluationAccess(
        { facultyUserId: 11, collegeId: 1, role: 'FACULTY', departmentId: 5 },
        owner,
      ),
      'FORBIDDEN',
    );
  });
  it('hides cross-college as not found', () => {
    assert.equal(
      decideCoEvaluationAccess(
        { facultyUserId: 10, collegeId: 2, role: 'FACULTY', departmentId: 5 },
        owner,
      ),
      'NOT_FOUND',
    );
  });
  it('allows college admin mutate', () => {
    assert.equal(
      decideCoEvaluationMutateAccess(
        { facultyUserId: 99, collegeId: 1, role: 'COLLEGE_ADMIN', departmentId: null },
        owner,
      ),
      'ALLOW',
    );
  });
  it('forbids HOD mutate of others', () => {
    assert.equal(
      decideCoEvaluationMutateAccess(
        { facultyUserId: 20, collegeId: 1, role: 'HOD', departmentId: 5 },
        owner,
      ),
      'FORBIDDEN',
    );
  });
});

describe('coEvaluation matrix validation', () => {
  const components = [
    { assessmentComponentId: 'AC_IA_1', displayName: 'IA-1', officialMaxMarks: 50 },
    { assessmentComponentId: 'AC_IA_2', displayName: 'IA-2', officialMaxMarks: 50 },
  ];
  const cos = [
    { coCode: 'CO1', currentMarksDistribution: 25, currentEvaluationPercent: 50 },
    { coCode: 'CO2', currentMarksDistribution: 75, currentEvaluationPercent: 50 },
  ];

  it('accepts exact totals and 100%', () => {
    const result = validateEvaluationMatrix({
      components,
      cos,
      cells: [
        { coCode: 'CO1', assessmentComponentId: 'AC_IA_1', currentValue: 20, masterValue: 20 },
        { coCode: 'CO1', assessmentComponentId: 'AC_IA_2', currentValue: 5, masterValue: 5 },
        { coCode: 'CO2', assessmentComponentId: 'AC_IA_1', currentValue: 30, masterValue: 30 },
        { coCode: 'CO2', assessmentComponentId: 'AC_IA_2', currentValue: 45, masterValue: 45 },
      ],
    });
    assert.equal(result.okForFinalize, true);
    assert.equal(result.evaluationPercentStatus, 'valid');
    assert.equal(result.componentTotals.every((c) => c.status === 'valid'), true);
  });

  it('rejects over-allocation', () => {
    const result = validateEvaluationMatrix({
      components,
      cos,
      cells: [
        { coCode: 'CO1', assessmentComponentId: 'AC_IA_1', currentValue: 30, masterValue: 20, changeJustification: 'x' },
        { coCode: 'CO1', assessmentComponentId: 'AC_IA_2', currentValue: 5, masterValue: 5 },
        { coCode: 'CO2', assessmentComponentId: 'AC_IA_1', currentValue: 30, masterValue: 30 },
        { coCode: 'CO2', assessmentComponentId: 'AC_IA_2', currentValue: 45, masterValue: 45 },
      ],
    });
    assert.equal(result.okForFinalize, false);
    assert.ok(result.issues.some((i) => i.code === 'COMPONENT_OVER_ALLOCATED'));
  });

  it('rejects under-allocation for finalize', () => {
    const result = validateEvaluationMatrix({
      components,
      cos,
      cells: [
        { coCode: 'CO1', assessmentComponentId: 'AC_IA_1', currentValue: 10, masterValue: 20, changeJustification: 'x' },
        { coCode: 'CO1', assessmentComponentId: 'AC_IA_2', currentValue: 5, masterValue: 5 },
        { coCode: 'CO2', assessmentComponentId: 'AC_IA_1', currentValue: 30, masterValue: 30 },
        { coCode: 'CO2', assessmentComponentId: 'AC_IA_2', currentValue: 45, masterValue: 45 },
      ],
    });
    assert.equal(result.okForFinalize, false);
    assert.ok(result.issues.some((i) => i.code === 'COMPONENT_UNDER_ALLOCATED'));
  });

  it('rejects eval percent under/over', () => {
    const under = validateEvaluationMatrix({
      components,
      cos: [
        { coCode: 'CO1', currentMarksDistribution: 25, currentEvaluationPercent: 45 },
        { coCode: 'CO2', currentMarksDistribution: 75, currentEvaluationPercent: 50 },
      ],
      cells: [
        { coCode: 'CO1', assessmentComponentId: 'AC_IA_1', currentValue: 20, masterValue: 20 },
        { coCode: 'CO1', assessmentComponentId: 'AC_IA_2', currentValue: 5, masterValue: 5 },
        { coCode: 'CO2', assessmentComponentId: 'AC_IA_1', currentValue: 30, masterValue: 30 },
        { coCode: 'CO2', assessmentComponentId: 'AC_IA_2', currentValue: 45, masterValue: 45 },
      ],
    });
    assert.equal(under.evaluationPercentStatus, 'under');
    assert.equal(under.okForFinalize, false);

    const over = validateEvaluationMatrix({
      components,
      cos: [
        { coCode: 'CO1', currentMarksDistribution: 25, currentEvaluationPercent: 55 },
        { coCode: 'CO2', currentMarksDistribution: 75, currentEvaluationPercent: 50 },
      ],
      cells: [
        { coCode: 'CO1', assessmentComponentId: 'AC_IA_1', currentValue: 20, masterValue: 20 },
        { coCode: 'CO1', assessmentComponentId: 'AC_IA_2', currentValue: 5, masterValue: 5 },
        { coCode: 'CO2', assessmentComponentId: 'AC_IA_1', currentValue: 30, masterValue: 30 },
        { coCode: 'CO2', assessmentComponentId: 'AC_IA_2', currentValue: 45, masterValue: 45 },
      ],
    });
    assert.equal(over.evaluationPercentStatus, 'over');
  });

  it('requires justification for modified cells', () => {
    const result = validateEvaluationMatrix({
      components,
      cos,
      cells: [
        { coCode: 'CO1', assessmentComponentId: 'AC_IA_1', currentValue: 25, masterValue: 20 },
        { coCode: 'CO1', assessmentComponentId: 'AC_IA_2', currentValue: 5, masterValue: 5 },
        { coCode: 'CO2', assessmentComponentId: 'AC_IA_1', currentValue: 25, masterValue: 30, changeJustification: 'ok' },
        { coCode: 'CO2', assessmentComponentId: 'AC_IA_2', currentValue: 45, masterValue: 45 },
      ],
    });
    assert.ok(result.missingJustifications.some((m) => m.coCode === 'CO1'));
    assert.equal(result.modifiedCellCount, 2);
  });

  it('computes marks distribution from cells', () => {
    const sum = computeMarksDistribution(
      [
        { coCode: 'CO1', assessmentComponentId: 'A', currentValue: 10, masterValue: 10 },
        { coCode: 'CO1', assessmentComponentId: 'B', currentValue: 5, masterValue: 5 },
        { coCode: 'CO2', assessmentComponentId: 'A', currentValue: 8, masterValue: 8 },
      ],
      'CO1',
    );
    assert.equal(sum, 15);
  });

  it('nearlyEqual tolerates decimals', () => {
    assert.equal(nearlyEqual(100, 100.02), true);
    assert.equal(nearlyEqual(100, 100.2), false);
  });
});

describe('coEvaluation workbook parser', () => {
  it('discovers academic master and parses CO evaluation sheets', async () => {
    const masters = await discoverCoEvalMasterFiles();
    assert.ok(masters.length >= 1);
    assert.match(masters[0].fileName, /SkillonX_Academic_Mapping_Master/i);

    const parsed = await parseCoEvalWorkbook(publicMaster);
    assert.equal(parsed.errors.length, 0, parsed.errors.join('\n'));
    assert.equal(parsed.assessmentComponents.length, 11);
    assert.equal(parsed.structures.length, 15);
    assert.equal(parsed.courseComponents.length, 72);
    assert.equal(parsed.coMasters.length, 71);
    assert.equal(parsed.componentMappings.length, 313);
    assert.equal(parsed.justifications.length, 313);
    assert.ok(parsed.summaries.length >= 15);

    const toc = parsed.coMasters.filter((c) => c.courseCode === 'BCS503');
    assert.equal(toc.length, 5);
    const tocComps = [
      ...new Set(
        parsed.componentMappings
          .filter((c) => c.courseCode === 'BCS503')
          .map((c) => c.assessmentComponentId),
      ),
    ];
    assert.ok(tocComps.includes('AC_IA_1'));
    assert.ok(tocComps.includes('AC_ASSIGNMENT'));

    const blocked = parsed.summaries.find((s) => s.courseCode === '10CS55');
    assert.ok(blocked);
    assert.equal(blocked.coCount, 0);
    assert.match(String(blocked.standardEvaluationStatus), /BLOCKED/i);

    const skill = [
      ...new Set(
        parsed.componentMappings
          .filter((c) => c.courseCode === 'BRMK557')
          .map((c) => c.assessmentComponentName),
      ),
    ];
    assert.ok(skill.length >= 2);

    const integrated = [
      ...new Set(
        parsed.componentMappings
          .filter((c) => c.courseCode === 'BIS701')
          .map((c) => c.assessmentComponentName),
      ),
    ];
    assert.ok(integrated.some((n) => /Lab/i.test(n)));
  });
});
