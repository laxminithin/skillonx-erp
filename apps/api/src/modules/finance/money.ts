/** Safe decimal money handling — never use raw float for currency. */
export type Money = string;

export function toMoney(value: unknown): Money {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}

export function addMoney(...values: Array<unknown>): Money {
  const sum = values.reduce<number>((acc, v) => acc + Number(toMoney(v)), 0);
  return sum.toFixed(2);
}

export function subtractMoney(a: unknown, b: unknown): Money {
  return (Number(toMoney(a)) - Number(toMoney(b))).toFixed(2);
}

export function multiplyMoney(a: unknown, pct: unknown): Money {
  return (Number(toMoney(a)) * (Number(pct) / 100)).toFixed(2);
}

export function compareMoney(a: unknown, b: unknown): number {
  return Number(toMoney(a)) - Number(toMoney(b));
}

export function isZeroMoney(v: unknown): boolean {
  return compareMoney(v, 0) === 0;
}

export function isPositiveMoney(v: unknown): boolean {
  return compareMoney(v, 0) > 0;
}

export function minMoney(a: unknown, b: unknown): Money {
  return compareMoney(a, b) <= 0 ? toMoney(a) : toMoney(b);
}

export function formatMoney(v: unknown, currency = 'INR'): string {
  const amount = Number(toMoney(v));
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
}
