import type { ServicesActor } from './types.js';
export declare function applyProfileCorrection(actor: ServicesActor, requestId: number): Promise<void>;
export declare function rejectProfileCorrection(actor: ServicesActor, requestId: number, reason: string): Promise<void>;
