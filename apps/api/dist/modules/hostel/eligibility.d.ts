import type { EligibilityResult } from './types.js';
export declare function evaluateHostelEligibility(studentId: number, applicationCycleId: number, collegeId: number): Promise<EligibilityResult>;
export declare function getOpenApplicationCycle(collegeId: number): Promise<any>;
