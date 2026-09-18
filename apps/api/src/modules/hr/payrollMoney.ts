/**
 * Canonical payroll monetary helpers — aligned with Finance money rounding (2 dp).
 */
export type Money = string;

export function toMoney(value: unknown): Money {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return '0.00';
  return (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2);
}

export function addMoney(...values: Array<unknown>): Money {
  const sum = values.reduce<number>((acc, v) => acc + Number(toMoney(v)), 0);
  return toMoney(sum);
}

export function subtractMoney(a: unknown, b: unknown): Money {
  return toMoney(Number(toMoney(a)) - Number(toMoney(b)));
}

export function multiplyMoney(a: unknown, factor: unknown): Money {
  return toMoney(Number(toMoney(a)) * Number(factor ?? 0));
}

export function percentOf(base: unknown, percentage: unknown): Money {
  return toMoney((Number(toMoney(base)) * Number(percentage ?? 0)) / 100);
}

export function compareMoney(a: unknown, b: unknown): number {
  return Number(toMoney(a)) - Number(toMoney(b));
}

export function isZeroMoney(v: unknown): boolean {
  return compareMoney(v, 0) === 0;
}

/** Banker's-style half-up via toFixed path used across Payroll + Finance. */
export function roundMoneyHalfUp(value: number): Money {
  return toMoney(value);
}
