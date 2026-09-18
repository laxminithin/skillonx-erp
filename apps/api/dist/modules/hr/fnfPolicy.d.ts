import type { HrActor } from './types.js';
export type FnfPolicy = {
    id: number;
    collegeId: number;
    effectiveFrom: string;
    encashableLeaveCodes: string[];
    maxEncashableDays: number | null;
    encashmentSalaryBasis: 'BASIC' | 'GROSS';
    encashmentDailyDivisor: number;
    noticeSalaryBasis: 'BASIC' | 'GROSS';
    noticeDailyDivisor: number;
    gratuityEnabled: boolean;
    gratuityMinYears: number | null;
    gratuityDaysPerYear: number | null;
    gratuityWageBasis: string | null;
    gratuityRuleVersion: string | null;
};
export declare function ensureFnfPolicy(collegeId: number, asOf?: string): Promise<FnfPolicy>;
export declare function getFnfPolicy(actor: HrActor, asOf?: string): Promise<FnfPolicy>;
