/**
 * Canonical payroll monetary helpers — aligned with Finance money rounding (2 dp).
 */
export type Money = string;
export declare function toMoney(value: unknown): Money;
export declare function addMoney(...values: Array<unknown>): Money;
export declare function subtractMoney(a: unknown, b: unknown): Money;
export declare function multiplyMoney(a: unknown, factor: unknown): Money;
export declare function percentOf(base: unknown, percentage: unknown): Money;
export declare function compareMoney(a: unknown, b: unknown): number;
export declare function isZeroMoney(v: unknown): boolean;
/** Banker's-style half-up via toFixed path used across Payroll + Finance. */
export declare function roundMoneyHalfUp(value: number): Money;
