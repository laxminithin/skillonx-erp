import type { AcademicPolicy } from './types.js';
/** SkillOnX Academic Standard v1.0 — never hard-code these values at call sites. */
export declare const SKILLONX_STANDARD_V1: AcademicPolicy;
export declare function parsePolicy(raw: unknown): AcademicPolicy;
