/** Deterministic: required satisfied / required total. Optional items never reduce completeness. */
export function evidenceCompleteness(items) {
    const required = items.filter((i) => i.required);
    const optional = items.filter((i) => !i.required);
    const requiredSatisfied = required.filter((i) => i.satisfied).length;
    const optionalSatisfied = optional.filter((i) => i.satisfied).length;
    const requiredTotal = required.length;
    const percent = requiredTotal === 0 ? 100 : Math.round((requiredSatisfied / requiredTotal) * 100);
    return {
        requiredTotal,
        requiredSatisfied,
        optionalSatisfied,
        optionalTotal: optional.length,
        percent,
        complete: requiredTotal === 0 || requiredSatisfied === requiredTotal,
        items,
    };
}
