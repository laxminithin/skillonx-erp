export declare function notifyHrStaff(collegeId: number, payload: {
    type: string;
    title: string;
    body: string;
    relatedType: string;
    relatedId: number;
    dedupePrefix: string;
    link?: string;
}): Promise<void>;
export declare function notifyAcademicApprover(approverEmployeeId: number, collegeId: number, payload: {
    type: string;
    title: string;
    body: string;
    relatedId: number;
    link?: string;
}): Promise<void>;
