export declare function notifyHostelEvent(input: {
    studentId: number;
    collegeId: number;
    type: string;
    title: string;
    body: string;
    link?: string;
    relatedType?: string;
    relatedId?: number;
}): Promise<void>;
