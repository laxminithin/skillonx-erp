import type { MemberType } from './types.js';
export type BorrowingPolicy = {
    id: number;
    memberType: MemberType;
    programId: number | null;
    maxActiveLoans: number;
    loanDays: number;
    maxRenewals: number;
    finePerDay: number;
    graceDays: number;
    reservationLimit: number;
    renewalAllowed: boolean;
    fineCap: number | null;
    blockIssueOnFine: boolean;
    pickupHoldDays: number;
};
export declare function listPolicies(collegeId: number): Promise<BorrowingPolicy[]>;
export declare function resolvePolicyForMember(memberId: number, collegeId: number): Promise<BorrowingPolicy>;
