import { FORMULA_VERSION, QUALITY_SCORE_VERSION, STANDARD_CODE, STANDARD_VERSION } from './types.js';
/** SkillOnX Academic Standard v1.0 — never hard-code these values at call sites. */
export const SKILLONX_STANDARD_V1 = {
    code: STANDARD_CODE,
    version: STANDARD_VERSION,
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
    formulaVersion: FORMULA_VERSION,
    qualityScoreVersion: QUALITY_SCORE_VERSION,
};
export function parsePolicy(raw) {
    const base = { ...SKILLONX_STANDARD_V1 };
    if (!raw || typeof raw !== 'object')
        return base;
    const obj = raw;
    const num = (k, fallback) => {
        const v = obj[k];
        return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
    };
    const bool = (k, fallback) => {
        const v = obj[k];
        return typeof v === 'boolean' ? v : fallback;
    };
    const thresholds = Array.isArray(obj.studentLevelThresholds)
        ? obj.studentLevelThresholds
            .map((t) => {
            const row = t;
            const minPercent = Number(row.minPercent);
            const level = Number(row.level);
            if (!Number.isFinite(minPercent) || !Number.isFinite(level))
                return null;
            return { minPercent, level };
        })
            .filter((t) => Boolean(t))
        : base.studentLevelThresholds;
    const split = obj.defaultCieSeeSplitWhenMissing;
    const priority = Array.isArray(obj.seeMethodPriority)
        ? obj.seeMethodPriority.filter((m) => m === 'ACTUAL' || m === 'PAPER_WEIGHTED' || m === 'EQUAL_WEIGHT')
        : base.seeMethodPriority;
    return {
        ...base,
        code: typeof obj.code === 'string' ? obj.code : base.code,
        version: typeof obj.version === 'string' ? obj.version : base.version,
        name: typeof obj.name === 'string' ? obj.name : base.name,
        coAttainmentScaleLevels: num('coAttainmentScaleLevels', base.coAttainmentScaleLevels),
        scaleMax: num('scaleMax', base.scaleMax),
        defaultCoTarget: num('defaultCoTarget', base.defaultCoTarget),
        defaultPoTarget: num('defaultPoTarget', base.defaultPoTarget),
        defaultPsoTarget: num('defaultPsoTarget', base.defaultPsoTarget),
        directWeight: num('directWeight', base.directWeight),
        indirectWeight: num('indirectWeight', base.indirectWeight),
        feedbackBenchmarkPercent: num('feedbackBenchmarkPercent', base.feedbackBenchmarkPercent),
        studentLevelThresholds: thresholds.length ? thresholds : base.studentLevelThresholds,
        studentWeakPercent: num('studentWeakPercent', base.studentWeakPercent),
        amberBand: num('amberBand', base.amberBand),
        amberWeakStudentRatio: num('amberWeakStudentRatio', base.amberWeakStudentRatio),
        amberComponentGap: num('amberComponentGap', base.amberComponentGap),
        greenComfortMargin: num('greenComfortMargin', base.greenComfortMargin),
        deteriorationThreshold: num('deteriorationThreshold', base.deteriorationThreshold),
        coBelowTargetRequiresImprovement: bool('coBelowTargetRequiresImprovement', true),
        poBelowTargetRequiresImprovement: bool('poBelowTargetRequiresImprovement', true),
        reassessmentMandatoryForRed: bool('reassessmentMandatoryForRed', true),
        evidenceMandatoryByIntervention: bool('evidenceMandatoryByIntervention', true),
        beforeAfterComparisonMandatory: bool('beforeAfterComparisonMandatory', true),
        facultyCannotSelfClose: bool('facultyCannotSelfClose', true),
        closureRequiresApproval: bool('closureRequiresApproval', true),
        seeMethodPriority: priority.length ? priority : base.seeMethodPriority,
        defaultCieSeeSplitWhenMissing: {
            cie: typeof split?.cie === 'number' ? split.cie : base.defaultCieSeeSplitWhenMissing.cie,
            see: typeof split?.see === 'number' ? split.see : base.defaultCieSeeSplitWhenMissing.see,
        },
        formulaVersion: typeof obj.formulaVersion === 'string' ? obj.formulaVersion : FORMULA_VERSION,
        qualityScoreVersion: typeof obj.qualityScoreVersion === 'string' ? obj.qualityScoreVersion : QUALITY_SCORE_VERSION,
    };
}
