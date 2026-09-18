export declare function notifyCandidate(params: {
    candidateId: number;
    collegeId: number;
    type: string;
    title: string;
    body?: string | null;
    link?: string | null;
    relatedType?: string | null;
    relatedId?: number | null;
    dedupeKey?: string | null;
}): Promise<void>;
export declare function notifyRecruitmentEmployee(params: {
    employeeId: number;
    collegeId: number;
    type: string;
    title: string;
    body?: string | null;
    relatedType?: string | null;
    relatedId?: number | null;
    dedupeKey?: string | null;
}): Promise<void>;
