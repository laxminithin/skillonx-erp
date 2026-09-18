import { SEE_METHOD_LABELS } from './types.js';
import { classifyCoStatus, combineDirect, combineFinal, computeSourceCoAttainment, gap, rollupOutcomes, } from './formula.js';
import { decideSeeMethod, equalWeights, estimateSeeFromTotals, paperCoWeights, seePercentFromTotals } from './see.js';
import { recommendPlan, suggestRootCauses } from './recommend.js';
import { parsePolicy } from './policy.js';
function componentWeight(sourceKind, components) {
    const kind = sourceKind.toUpperCase();
    const match = components.find((c) => {
        const n = `${c.code} ${c.name}`.toUpperCase();
        if (kind === 'QUIZ')
            return n.includes('QUIZ');
        if (kind === 'ASSIGNMENT')
            return n.includes('ASSIGN');
        if (kind === 'INTERNAL_PAPER')
            return n.includes('IA') || n.includes('CIE') || n.includes('INTERNAL');
        if (kind === 'LAB')
            return n.includes('LAB');
        if (kind === 'PROJECT')
            return n.includes('PROJECT');
        return false;
    });
    return match?.weightage != null && match.weightage > 0 ? match.weightage : null;
}
export function calculateRun(input) {
    const policy = parsePolicy(input.policyRaw);
    const coCodes = input.outcomes.map((o) => String(o.co_code).toUpperCase());
    const cieDiagnostics = input.cieSources.map((s) => ({ source: s, rows: computeSourceCoAttainment(s, policy) }));
    const seeQuestionWise = input.seeSources.filter((s) => s.marks.some((m) => m.questionKey && m.coCode));
    const hasQuestionWiseSee = seeQuestionWise.some((s) => s.marks.length > 0 && s.questions.some((q) => q.coCode));
    const paperWeights = paperCoWeights(input.seePaperQuestions);
    const hasPaper = paperWeights.length > 0;
    const seeDecision = decideSeeMethod({
        hasQuestionWiseSeeMarks: hasQuestionWiseSee,
        hasSeePaperWithCoMapping: hasPaper,
        preferred: input.preferredSeeMethod,
    });
    let cieW = input.cieWeight;
    let seeW = input.seeWeight;
    if (cieW == null && seeW == null) {
        cieW = policy.defaultCieSeeSplitWhenMissing.cie * 100;
        seeW = policy.defaultCieSeeSplitWhenMissing.see * 100;
    }
    cieW = Number(cieW ?? 0);
    seeW = Number(seeW ?? 0);
    if (cieW + seeW === 0) {
        cieW = 50;
        seeW = 50;
    }
    const seeByCo = new Map();
    if (seeDecision.method === 'ACTUAL' && seeQuestionWise.length) {
        const actual = seeQuestionWise.map((s) => ({ source: s, rows: computeSourceCoAttainment(s, policy) }));
        for (const coCode of coCodes) {
            const parts = actual.flatMap((a) => a.rows.filter((r) => r.coCode === coCode));
            const attainment = parts.length && parts.every((p) => p.attainment != null)
                ? parts.reduce((s, p) => s + p.attainment, 0) / parts.length
                : parts.find((p) => p.attainment != null)?.attainment ?? null;
            seeByCo.set(coCode, {
                attainment,
                studentCount: parts.reduce((s, p) => Math.max(s, p.studentCount), 0),
                formula: 'Actual SEE question-wise marks converted to the 3-point scale, then class-averaged.',
            });
        }
    }
    else {
        const totalSheets = input.seeSources.filter((s) => s.students.some((st) => st.totalAwarded != null || st.totalMax != null));
        const students = (totalSheets[0]?.students || []).map((st) => ({
            ...st,
            seePercent: seePercentFromTotals(st.totalAwarded ?? null, st.totalMax ?? null),
        }));
        const weights = seeDecision.method === 'PAPER_WEIGHTED' && paperWeights.length ? paperWeights : equalWeights(coCodes);
        const est = estimateSeeFromTotals(students, weights, policy);
        for (const row of est.classAttainment) {
            seeByCo.set(row.coCode, {
                attainment: row.attainment,
                studentCount: row.studentCount,
                formula: `${SEE_METHOD_LABELS[seeDecision.method]}. Overall SEE percent applied uniformly to COs with paper exposure.`,
            });
        }
    }
    const indirectDiag = input.indirectSources.map((s) => ({ source: s, rows: computeSourceCoAttainment(s, policy) }));
    const cos = input.outcomes.map((outcome) => {
        const coCode = String(outcome.co_code).toUpperCase();
        const cieParts = cieDiagnostics.map((d) => {
            const row = d.rows.find((r) => r.coCode === coCode) ?? null;
            const w = componentWeight(d.source.sourceKind, input.components) ?? d.source.weight;
            return { d, row, w };
        });
        const ciePresent = cieParts.filter((p) => p.row?.attainment != null);
        const cieWeightSum = ciePresent.reduce((s, p) => s + p.w, 0);
        const cie = ciePresent.length && cieWeightSum > 0
            ? ciePresent.reduce((s, p) => s + p.row.attainment * p.w, 0) / cieWeightSum
            : ciePresent[0]?.row?.attainment ?? null;
        const cieFormula = ciePresent.length
            ? ciePresent.map((p) => `${p.d.source.sourceLabel} (${p.row?.attainment}) × ${p.w}`).join(' + ') + (cieWeightSum ? ` / ${cieWeightSum}` : '')
            : 'No CIE evidence for this CO';
        const see = seeByCo.get(coCode)?.attainment ?? null;
        const direct = combineDirect(cie, see, cieW, seeW);
        const indirectParts = indirectDiag.flatMap((d) => d.rows.filter((r) => r.coCode === coCode));
        const validIndirect = indirectParts.filter((r) => r.attainment != null);
        const indirect = validIndirect.length
            ? validIndirect.reduce((s, r) => s + r.attainment, 0) / validIndirect.length
            : null;
        const final = combineFinal(direct.result, Number.isFinite(indirect) ? indirect : null, policy);
        const diagnostics = cieParts.map((p) => p.row).filter((r) => Boolean(r));
        const weakStudentCount = Math.max(0, ...diagnostics.map((d) => d.weakStudentCount));
        const studentCount = Math.max(0, ...diagnostics.map((d) => d.studentCount), seeByCo.get(coCode)?.studentCount ?? 0);
        const weakStudentRatio = studentCount ? weakStudentCount / studentCount : 0;
        const componentGap = diagnostics.reduce((m, d) => {
            if (d.attainment == null || cie == null)
                return m;
            return Math.max(m, cie - d.attainment);
        }, 0);
        const status = classifyCoStatus({ actual: final.result, target: policy.defaultCoTarget, weakStudentRatio, weakComponentGap: componentGap }, policy);
        const causes = suggestRootCauses({
            coCode,
            attainment: final.result,
            target: policy.defaultCoTarget,
            sourceDiagnostics: diagnostics,
        });
        const studentMap = new Map();
        for (const d of diagnostics) {
            for (const s of d.studentScores) {
                studentMap.set(s.studentKey, { studentKey: s.studentKey, belowThreshold: s.belowThreshold, level: s.level });
            }
        }
        return {
            coCode,
            statement: outcome.statement ?? null,
            courseOutcomeId: outcome.id,
            target: policy.defaultCoTarget,
            cie,
            see,
            direct: direct.result,
            indirect,
            final: final.result,
            gap: gap(final.result, policy.defaultCoTarget),
            status,
            studentCount,
            weakStudentCount,
            weakStudentRatio,
            formula: {
                cie: cieFormula,
                see: seeByCo.get(coCode)?.formula,
                direct: direct.formula,
                final: final.formula,
            },
            sources: [
                ...cieParts.map((p) => ({
                    sourceKind: p.d.source.sourceKind,
                    sourceId: p.d.source.sourceId,
                    sourceLabel: p.d.source.sourceLabel,
                    category: p.d.source.category,
                    weight: p.w,
                    attainment: p.row?.attainment ?? null,
                    studentCount: p.row?.studentCount ?? 0,
                    diagnostics: p.row,
                })),
                ...input.seeSources.map((s) => ({
                    sourceKind: s.sourceKind,
                    sourceId: s.sourceId,
                    sourceLabel: s.sourceLabel,
                    category: 'SEE',
                    weight: seeW,
                    attainment: see,
                    studentCount: seeByCo.get(coCode)?.studentCount ?? 0,
                    diagnostics: null,
                })),
                ...indirectDiag.map((d) => ({
                    sourceKind: d.source.sourceKind,
                    sourceId: d.source.sourceId,
                    sourceLabel: d.source.sourceLabel,
                    category: 'INDIRECT',
                    weight: policy.indirectWeight,
                    attainment: d.rows.find((r) => r.coCode === coCode)?.attainment ?? null,
                    studentCount: d.rows.find((r) => r.coCode === coCode)?.studentCount ?? 0,
                    diagnostics: d.rows.find((r) => r.coCode === coCode) ?? null,
                })),
            ],
            students: [...studentMap.values()],
            recommendation: recommendPlan(causes),
        };
    });
    const coAttainments = cos.map((c) => ({ coCode: c.coCode, attainment: c.final }));
    return {
        policy,
        seeDecision,
        seeWeights: seeDecision.method === 'EQUAL_WEIGHT' ? equalWeights(coCodes) : paperWeights.length ? paperWeights : equalWeights(coCodes),
        cieWeightUsed: cieW,
        seeWeightUsed: seeW,
        cos,
        po: rollupOutcomes(coAttainments, input.poMappings),
        pso: rollupOutcomes(coAttainments, input.psoMappings),
        structure: {
            cieWeight: cieW,
            seeWeight: seeW,
            note: input.cieWeight != null || input.seeWeight != null
                ? 'CIE/SEE weights taken from the approved course assessment structure.'
                : 'Course assessment structure did not define CIE/SEE weights; SkillOnX default split was used.',
        },
    };
}
