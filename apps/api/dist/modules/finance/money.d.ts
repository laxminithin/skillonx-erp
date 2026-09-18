/** Safe decimal money handling — never use raw float for currency. */
export type Money = string;
export declare function toMoney(value: unknown): Money;
export declare function addMoney(...values: Array<unknown>): Money;
export declare function subtractMoney(a: unknown, b: unknown): Money;
export declare function multiplyMoney(a: unknown, pct: unknown): Money;
export declare function compareMoney(a: unknown, b: unknown): number;
export declare function isZeroMoney(v: unknown): boolean;
export declare function isPositiveMoney(v: unknown): boolean;
export declare function minMoney(a: unknown, b: unknown): Money;
export declare function formatMoney(v: unknown, currency?: string): string;
