export declare function createTransportFeeDemand(collegeId: number, studentId: number, applicationId: number, academicYearId: number, routeId?: number): Promise<any>;
export declare function getStudentTransportDues(studentId: number, collegeId: number): Promise<{
    totalOutstanding: any;
    items: {
        demandType: any;
        description: any;
        amount: number;
        paid: number;
        outstanding: number;
        status: any;
        demandId: number;
    }[];
}>;
export declare function isTransportFinanceClear(studentId: number, collegeId: number): Promise<boolean>;
export declare function canAssignAfterPayment(studentId: number, collegeId: number): Promise<boolean>;
