import type { MentoringActor } from './types.js';
import type { z } from 'zod';
import type { riskConfigSchema } from './types.js';
export declare function getRiskConfigView(collegeId: number): Promise<{
    effective: import("./riskEngine.js").RiskConfig;
    isCustom: boolean;
}>;
/** Only SUPER_ADMIN / COLLEGE_ADMIN may alter institution-wide risk rules. */
export declare function updateRiskConfig(actor: MentoringActor, input: z.infer<typeof riskConfigSchema>): Promise<{
    effective: import("./riskEngine.js").RiskConfig;
    isCustom: boolean;
}>;
