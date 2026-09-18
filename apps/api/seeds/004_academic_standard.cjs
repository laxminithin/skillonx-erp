/**
 * SkillOnX Academic Standard v1.0 + root-cause / action / evidence libraries.
 * Idempotent. Never deletes operational data.
 *
 * @param {import('knex').Knex} knex
 */
exports.seed = async function seed(knex) {
  if (!(await knex.schema.hasTable('academic_standards'))) return;

  const policy = {
    code: 'SKILLONX_ACADEMIC_STANDARD',
    version: '1.0',
    name: 'SkillOnX Academic Standard v1.0',
    coAttainmentScaleLevels: 3,
    scaleMax: 3,
    defaultCoTarget: 2.5,
    defaultPoTarget: 2.5,
    defaultPsoTarget: 2.5,
    directWeight: 0.8,
    indirectWeight: 0.2,
    feedbackBenchmarkPercent: 80,
    studentLevelThresholds: [
      { minPercent: 70, level: 3 },
      { minPercent: 60, level: 2 },
      { minPercent: 50, level: 1 },
      { minPercent: 0, level: 0 },
    ],
    studentWeakPercent: 50,
    amberBand: 0.15,
    amberWeakStudentRatio: 0.25,
    amberComponentGap: 0.5,
    greenComfortMargin: 0,
    deteriorationThreshold: 0.1,
    coBelowTargetRequiresImprovement: true,
    poBelowTargetRequiresImprovement: true,
    reassessmentMandatoryForRed: true,
    evidenceMandatoryByIntervention: true,
    beforeAfterComparisonMandatory: true,
    facultyCannotSelfClose: true,
    closureRequiresApproval: true,
    seeMethodPriority: ['ACTUAL', 'PAPER_WEIGHTED', 'EQUAL_WEIGHT'],
    defaultCieSeeSplitWhenMissing: { cie: 0.5, see: 0.5 },
    formulaVersion: 'skillonx-attainment-formula-v1.0',
    qualityScoreVersion: 'skillonx-qp-quality-v1.0',
  };

  let standard = await knex('academic_standards').where({ code: policy.code, scope_key: 'PLATFORM' }).first();
  if (!standard) {
    const ids = await knex('academic_standards').insert({
      code: policy.code,
      name: policy.name,
      scope: 'PLATFORM',
      scope_key: 'PLATFORM',
      is_active: true,
    });
    standard = { id: ids[0] };
  }

  const version = await knex('academic_standard_versions')
    .where({ standard_id: standard.id, version: '1.0' })
    .first();
  if (!version) {
    await knex('academic_standard_versions').where({ standard_id: standard.id }).update({ is_current: false });
    await knex('academic_standard_versions').insert({
      standard_id: standard.id,
      version: '1.0',
      status: 'ACTIVE',
      is_current: true,
      policy_json: JSON.stringify(policy),
      formula_version: policy.formulaVersion,
      published_at: knex.fn.now(),
    });
  }
};
