export declare function normalizeWall(value: string): string;
export declare function wallToMs(wall: string): number;
export declare function msToWall(ms: number): string;
export declare function addMinutes(wall: string, minutes: number): string;
/** mysql2 returns DATETIME as a Date built in the process timezone; read it back with local getters. */
export declare function fromDb(value: unknown): string | null;
export declare function toApi(wall: string | null): string | null;
export declare function datePart(wall: string): string;
export declare function nowWall(timeZone: string, now?: Date): string;
/** Half-open interval overlap: [aStart, aEnd) ∩ [bStart, bEnd) ≠ ∅, so back-to-back slots do not conflict. */
export declare function windowsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean;
export declare function assertValidRange(start: string, end: string, maxDays: number): void;
