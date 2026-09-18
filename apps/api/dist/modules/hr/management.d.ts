import type { HrActor } from './types.js';
export declare function managementDashboard(actor: HrActor): Promise<{
    totalHeadcount: number;
    byDepartment: any[];
    byDesignation: any[];
    byEmploymentType: any[];
}>;
