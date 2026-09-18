export declare function ensureCollegeServicesDefaults(collegeId: number): Promise<void>;
export declare function getRequestType(collegeId: number, code: string): Promise<any>;
export declare function getWorkflowForType(collegeId: number, requestTypeId: number): Promise<{
    workflow: any;
    steps: any[];
} | null>;
