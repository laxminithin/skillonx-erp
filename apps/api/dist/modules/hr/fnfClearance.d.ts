import type { HrActor } from './types.js';
export declare function syncClearances(settlementId: number, employeeId: number, collegeId: number): Promise<void>;
export declare function listClearances(settlementId: number): Promise<{
    id: number;
    domain: string;
    status: string;
    sourceModule: unknown;
    dueAmount: string;
    blocking: boolean;
    actorFacultyId: number | null;
    decidedAt: unknown;
    remarks: unknown;
    overridden: boolean;
    overrideReason: unknown;
}[]>;
export declare function unresolvedMandatory(items: Array<{
    status: string;
    blocking: boolean;
    domain: string;
}>): {
    status: string;
    blocking: boolean;
    domain: string;
}[];
export declare function decideClearance(actor: HrActor, settlementId: number, domain: string, input: {
    status: string;
    remarks?: string;
    dueAmount?: number;
    waive?: boolean;
    override?: boolean;
    overrideReason?: string;
}): Promise<{
    id: number;
    domain: string;
    status: string;
    sourceModule: unknown;
    dueAmount: string;
    blocking: boolean;
    actorFacultyId: number | null;
    decidedAt: unknown;
    remarks: unknown;
    overridden: boolean;
    overrideReason: unknown;
}>;
export declare function listHodClearanceInbox(actor: HrActor): Promise<{
    clearanceId: number;
    settlementId: number;
    caseNumber: unknown;
    status: unknown;
    lastWorkingDate: unknown;
    employeeId: number;
    employeeName: unknown;
    employeeNumber: unknown;
    departmentId: number;
    remarks: unknown;
}[]>;
export declare function getHodClearanceDetail(actor: HrActor, settlementId: number): Promise<{
    settlementId: number;
    caseNumber: any;
    status: any;
    lastWorkingDate: any;
    separationType: any;
    employee: {
        id: number;
        name: any;
        employeeNumber: any;
        departmentId: number;
    };
    departmentClearance: {
        id: number;
        domain: string;
        status: string;
        sourceModule: unknown;
        dueAmount: string;
        blocking: boolean;
        actorFacultyId: number | null;
        decidedAt: unknown;
        remarks: unknown;
        overridden: boolean;
        overrideReason: unknown;
    } | null;
}>;
