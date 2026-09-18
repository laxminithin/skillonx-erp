export declare function recordBoarding(input: {
    tripId: number;
    studentId: number;
    collegeId: number;
    routeStopId?: number;
    recordedBy?: number;
    source?: string;
    idempotencyKey?: string;
}): Promise<{
    id: number;
    eventType: any;
    duplicate: boolean;
}>;
export declare function recordAlighting(input: {
    tripId: number;
    studentId: number;
    collegeId: number;
    routeStopId?: number;
    recordedBy?: number;
    source?: string;
    idempotencyKey?: string;
}): Promise<{
    id: number;
    eventType: any;
    duplicate: boolean;
}>;
