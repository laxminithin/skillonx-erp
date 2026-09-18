export declare function notifyTransportEvent(input: {
    studentId: number;
    collegeId: number;
    type: string;
    title: string;
    body: string;
    link?: string;
    relatedType?: string;
    relatedId?: number;
}): Promise<void>;
