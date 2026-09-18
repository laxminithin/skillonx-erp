import type { EligibilityResult } from './types.js';
export declare function getOpenApplicationCycle(collegeId: number): Promise<any>;
export declare function evaluateTransportEligibility(studentId: number, applicationCycleId: number, collegeId?: number): Promise<EligibilityResult>;
