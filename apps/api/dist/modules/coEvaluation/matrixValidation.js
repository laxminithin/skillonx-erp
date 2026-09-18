import { nearlyEqual, numOrNull } from './types.js';
function toNum(v) {
    return v == null || !Number.isFinite(Number(v)) ? 0 : Number(v);
}
export function computeMarksDistribution(cells, coCode) {
    return cells
        .filter((c) => c.coCode === coCode)
        .reduce((sum, c) => sum + toNum(c.currentValue), 0);
}
export function validateEvaluationMatrix(input) {
    const issues = [];
    const matrixComponents = input.components.filter((c) => c.includeInMatrix !== false);
    const componentTotals = matrixComponents.map((comp) => {
        const allocated = input.cells
            .filter((c) => c.assessmentComponentId === comp.assessmentComponentId)
            .reduce((sum, c) => sum + toNum(c.currentValue), 0);
        const expected = numOrNull(comp.officialMaxMarks);
        let status = 'unknown';
        let delta = null;
        if (expected != null) {
            delta = allocated - expected;
            if (nearlyEqual(allocated, expected))
                status = 'valid';
            else if (allocated < expected)
                status = 'under';
            else
                status = 'over';
            if (status === 'over') {
                issues.push({
                    code: 'COMPONENT_OVER_ALLOCATED',
                    severity: 'error',
                    message: `${comp.displayName}: ${allocated} / ${expected}. Over-allocated by ${Math.abs(delta)} marks.`,
                    assessmentComponentId: comp.assessmentComponentId,
                });
            }
            else if (status === 'under') {
                issues.push({
                    code: 'COMPONENT_UNDER_ALLOCATED',
                    severity: input.allowUnderAllocation ? 'warning' : 'error',
                    message: `${comp.displayName}: ${allocated} / ${expected}. ${Math.abs(delta)} marks remain unallocated.`,
                    assessmentComponentId: comp.assessmentComponentId,
                });
            }
        }
        return {
            assessmentComponentId: comp.assessmentComponentId,
            displayName: comp.displayName,
            allocated,
            expected,
            delta,
            status,
        };
    });
    const evaluationPercentTotal = input.cos.reduce((sum, co) => sum + toNum(co.currentEvaluationPercent), 0);
    let evaluationPercentStatus = 'valid';
    if (nearlyEqual(evaluationPercentTotal, 100)) {
        evaluationPercentStatus = 'valid';
    }
    else if (evaluationPercentTotal < 100) {
        evaluationPercentStatus = 'under';
        issues.push({
            code: 'EVAL_PERCENT_UNDER',
            severity: 'error',
            message: `${(100 - evaluationPercentTotal).toFixed(2)}% unassigned.`,
        });
    }
    else {
        evaluationPercentStatus = 'over';
        issues.push({
            code: 'EVAL_PERCENT_OVER',
            severity: 'error',
            message: `${(evaluationPercentTotal - 100).toFixed(2)}% over-assigned.`,
        });
    }
    if (!input.cos.length) {
        issues.push({
            code: 'NO_COS',
            severity: 'error',
            message: 'No Course Outcomes are represented in this evaluation.',
        });
    }
    const missingJustifications = [];
    let modifiedCellCount = 0;
    for (const cell of input.cells) {
        const master = toNum(cell.masterValue);
        const current = toNum(cell.currentValue);
        const changed = !nearlyEqual(master, current);
        if (!changed)
            continue;
        modifiedCellCount += 1;
        if (!String(cell.changeJustification || '').trim()) {
            missingJustifications.push({
                coCode: cell.coCode,
                assessmentComponentId: cell.assessmentComponentId,
            });
            issues.push({
                code: 'CHANGE_JUSTIFICATION_REQUIRED',
                severity: 'error',
                message: `${cell.coCode} → ${cell.assessmentComponentId}: change justification required.`,
                coCode: cell.coCode,
                assessmentComponentId: cell.assessmentComponentId,
            });
        }
    }
    for (const co of input.cos) {
        const masterDist = computeMarksDistribution(input.cells.map((c) => ({ ...c, currentValue: c.masterValue })), co.coCode);
        // Marks distribution should track sum of current component values when derived
        const derived = computeMarksDistribution(input.cells, co.coCode);
        if (co.currentMarksDistribution != null && !nearlyEqual(Number(co.currentMarksDistribution), derived)) {
            issues.push({
                code: 'MARKS_DISTRIBUTION_MISMATCH',
                severity: 'warning',
                message: `${co.coCode}: Marks Distribution ${co.currentMarksDistribution} differs from component sum ${derived}.`,
                coCode: co.coCode,
            });
        }
        void masterDist;
    }
    const allocatedMarks = componentTotals.reduce((s, c) => s + c.allocated, 0);
    const expectedMarks = componentTotals.every((c) => c.expected != null)
        ? componentTotals.reduce((s, c) => s + Number(c.expected), 0)
        : null;
    const hasBlocking = issues.some((i) => i.severity === 'error');
    return {
        okForFinalize: !hasBlocking && evaluationPercentStatus === 'valid',
        componentTotals,
        evaluationPercentTotal,
        evaluationPercentStatus,
        allocatedMarks,
        expectedMarks,
        modifiedCellCount,
        missingJustifications,
        issues,
    };
}
