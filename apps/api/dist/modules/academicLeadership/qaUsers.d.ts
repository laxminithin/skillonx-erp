import type { HrActor } from '../hr/types.js';
export declare function ensureQaLeadershipUsers(actor: HrActor): Promise<{
    hod: {
        email: string;
        password: string;
        departmentId: number;
    };
    principal: {
        email: string;
        password: string;
    };
    accountant: {
        email: string;
        password: string;
    };
    coe: {
        email: string;
        password: string;
    };
    eceDepartmentId: number;
    collegeId: number;
    isolatedCollege: boolean;
}>;
