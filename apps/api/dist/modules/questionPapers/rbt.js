import { BLOOMS_LEVELS, BLOOMS_LABELS } from '../copo/types.js';
const NAME_TO_RBT = {
    REMEMBER: 'L1',
    UNDERSTAND: 'L2',
    APPLY: 'L3',
    ANALYZE: 'L4',
    ANALYSE: 'L4',
    EVALUATE: 'L5',
    CREATE: 'L6',
};
export function rbtFromBloom(value) {
    if (!value)
        return null;
    const raw = String(value).trim().toUpperCase();
    if (BLOOMS_LEVELS.includes(raw))
        return raw;
    if (NAME_TO_RBT[raw])
        return NAME_TO_RBT[raw];
    const compact = raw.replace(/[^A-Z0-9]/g, '');
    if (BLOOMS_LEVELS.includes(compact))
        return compact;
    if (NAME_TO_RBT[compact])
        return NAME_TO_RBT[compact];
    return null;
}
export function bloomFromRbt(level) {
    const rbt = rbtFromBloom(level);
    if (!rbt)
        return null;
    return BLOOMS_LABELS[rbt].toUpperCase();
}
export function rbtLabel(level) {
    const rbt = rbtFromBloom(level);
    if (!rbt)
        return null;
    return `${rbt} — ${BLOOMS_LABELS[rbt]}`;
}
