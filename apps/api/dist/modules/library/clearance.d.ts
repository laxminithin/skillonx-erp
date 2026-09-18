import type { LibraryNoDueReason, LibraryNoDueStatus } from './types.js';
export declare function getLibraryNoDueStatus(studentId: number, collegeId: number): Promise<{
    status: LibraryNoDueStatus;
    reasons: LibraryNoDueReason[];
}>;
export declare function getLibraryMemberStatus(userId: number, collegeId: number, userType: 'STUDENT' | 'FACULTY'): Promise<{
    isMember: boolean;
    status: null;
    membershipNumber: null;
    memberId?: undefined;
} | {
    isMember: boolean;
    status: any;
    membershipNumber: any;
    memberId: number;
}>;
export declare function getLibraryOutstanding(studentId: number, collegeId: number): Promise<string>;
