export function toMoney(value) {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n))
        return '0.00';
    return (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2);
}
export function addMoney(...values) {
    const sum = values.reduce((acc, v) => acc + Number(toMoney(v)), 0);
    return toMoney(sum);
}
export function subtractMoney(a, b) {
    return toMoney(Number(toMoney(a)) - Number(toMoney(b)));
}
export function multiplyMoney(a, factor) {
    return toMoney(Number(toMoney(a)) * Number(factor ?? 0));
}
export function percentOf(base, percentage) {
    return toMoney((Number(toMoney(base)) * Number(percentage ?? 0)) / 100);
}
export function compareMoney(a, b) {
    return Number(toMoney(a)) - Number(toMoney(b));
}
export function isZeroMoney(v) {
    return compareMoney(v, 0) === 0;
}
/** Banker's-style half-up via toFixed path used across Payroll + Finance. */
export function roundMoneyHalfUp(value) {
    return toMoney(value);
}
