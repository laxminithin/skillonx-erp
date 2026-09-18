export function toMoney(value) {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n))
        return '0.00';
    return n.toFixed(2);
}
export function addMoney(...values) {
    const sum = values.reduce((acc, v) => acc + Number(toMoney(v)), 0);
    return sum.toFixed(2);
}
export function subtractMoney(a, b) {
    return (Number(toMoney(a)) - Number(toMoney(b))).toFixed(2);
}
export function multiplyMoney(a, pct) {
    return (Number(toMoney(a)) * (Number(pct) / 100)).toFixed(2);
}
export function compareMoney(a, b) {
    return Number(toMoney(a)) - Number(toMoney(b));
}
export function isZeroMoney(v) {
    return compareMoney(v, 0) === 0;
}
export function isPositiveMoney(v) {
    return compareMoney(v, 0) > 0;
}
export function minMoney(a, b) {
    return compareMoney(a, b) <= 0 ? toMoney(a) : toMoney(b);
}
export function formatMoney(v, currency = 'INR') {
    const amount = Number(toMoney(v));
    if (currency === 'INR') {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
}
