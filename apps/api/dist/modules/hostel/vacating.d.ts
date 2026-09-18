import type { HostelActor } from './types.js';
export declare function requestVacating(studentId: number, collegeId: number, reason: string, requestedVacateAt?: string): Promise<{
    id: number;
    status: string;
}>;
export declare function listVacatingRequests(actor: HostelActor, hostelId?: number): Promise<{
    id: number;
    residentId: number;
    usn: any;
    studentName: any;
    reason: any;
    status: any;
    keysReturned: boolean;
    assetsVerified: boolean;
    damageChecked: boolean;
    messCleared: boolean;
    financeChecked: boolean;
    requestedVacateAt: any;
}[]>;
export declare function updateVacatingChecklist(actor: HostelActor, vacatingId: number, checklist: {
    keysReturned?: boolean;
    assetsVerified?: boolean;
    damageChecked?: boolean;
    messCleared?: boolean;
    financeChecked?: boolean;
}): Promise<{
    id: number;
    status: string;
}>;
export declare function completeVacating(actor: HostelActor, vacatingId: number): Promise<{
    id: number;
    status: string;
    residentId: number;
}>;
export declare function assessDamage(actor: HostelActor, input: {
    residentId: number;
    roomId?: number;
    assetId?: number;
    description: string;
    estimatedAmount?: number;
}): Promise<{
    id: number;
    status: string;
}>;
export declare function approveDamageCharge(actor: HostelActor, damageId: number, finalAmount: number): Promise<{
    id: number;
    status: any;
    demandId: any;
}>;
