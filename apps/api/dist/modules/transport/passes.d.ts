import type { Knex } from 'knex';
export declare function activatePass(trx: Knex.Transaction, input: {
    collegeId: number;
    transportMemberId: number;
    studentId: number;
    routeAssignmentId: number;
    validFrom?: Date;
    validUntil?: Date;
}): Promise<{
    id: null;
    status: string;
    passNumber?: undefined;
    verificationToken?: undefined;
} | {
    id: number;
    passNumber: any;
    verificationToken: any;
    status: string;
}>;
export declare function getStudentPass(studentId: number, collegeId: number): Promise<{
    id: number;
    passNumber: any;
    status: any;
    validFrom: any;
    validUntil: any;
    verificationToken: any;
    student: {
        name: any;
        usn: any;
    };
    route: {
        name: any;
        code: any;
    } | null;
    pickupStop: any;
    dropStop: any;
} | null>;
export declare function verifyPass(token: string, collegeId?: number): Promise<{
    status: "NOT_FOUND";
    passNumber?: undefined;
    studentName?: undefined;
    usn?: undefined;
    routeName?: undefined;
    validUntil?: undefined;
} | {
    status: "REVOKED";
    passNumber?: undefined;
    studentName?: undefined;
    usn?: undefined;
    routeName?: undefined;
    validUntil?: undefined;
} | {
    status: "EXPIRED";
    passNumber?: undefined;
    studentName?: undefined;
    usn?: undefined;
    routeName?: undefined;
    validUntil?: undefined;
} | {
    status: "VALID";
    passNumber: any;
    studentName: any;
    usn: any;
    routeName: any;
    validUntil: any;
}>;
export declare function revokePass(actorCollegeId: number, passId: number, actorId: number): Promise<{
    id: number;
    status: string;
}>;
