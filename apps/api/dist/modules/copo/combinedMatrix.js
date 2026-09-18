const GROUP_LABELS = {
    PO: 'PROGRAM OUTCOMES',
    PSO: 'PROGRAM SPECIFIC OUTCOMES',
    SDG: 'SUSTAINABLE DEVELOPMENT GOALS',
};
/**
 * Build ordered column groups for ONE combined academic mapping matrix.
 * SDG targets should already be filtered to relevant (or all-17) by the caller.
 */
export function buildCombinedMatrixGroups(input) {
    const groups = [];
    if (input.flags.po) {
        const targets = input.programOutcomes || [];
        groups.push({
            type: 'PO',
            label: GROUP_LABELS.PO,
            colSpan: Math.max(targets.length, 0),
            targets,
        });
    }
    if (input.flags.pso) {
        const targets = input.programSpecificOutcomes || [];
        groups.push({
            type: 'PSO',
            label: GROUP_LABELS.PSO,
            colSpan: Math.max(targets.length, 0),
            targets,
        });
    }
    if (input.flags.sdg) {
        const targets = input.sdgs || [];
        groups.push({
            type: 'SDG',
            label: GROUP_LABELS.SDG,
            colSpan: Math.max(targets.length, 0),
            targets,
        });
    }
    return groups.filter((g) => g.colSpan > 0);
}
/** Flatten groups into ordered columns with domain tags (one row of cells). */
export function flattenMatrixColumns(groups) {
    return groups.flatMap((g) => g.targets.map((t) => ({ ...t, domain: g.type })));
}
/**
 * Relevant SDGs = those with at least one active 1/2/3 relationship.
 * Falls back to provided relevantIds when no active cells yet.
 */
export function filterRelevantSdgs(allSdgs, options) {
    if (options.showAll)
        return allSdgs;
    const active = new Set(options.activeSdgIds || []);
    if (active.size)
        return allSdgs.filter((s) => active.has(s.id));
    const relevant = new Set(options.relevantIds || []);
    if (relevant.size)
        return allSdgs.filter((s) => relevant.has(s.id));
    return allSdgs;
}
export function totalGroupColSpan(groups) {
    return groups.reduce((sum, g) => sum + g.colSpan, 0);
}
