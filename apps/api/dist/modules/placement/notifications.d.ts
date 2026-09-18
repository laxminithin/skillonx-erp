type NotifyInput = {
    studentId: number;
    collegeId: number;
    type: string;
    title: string;
    body?: string;
    link?: string;
    relatedType?: string;
    relatedId?: number;
};
export declare function notifyPlacementEvent(input: NotifyInput): Promise<void>;
export {};
