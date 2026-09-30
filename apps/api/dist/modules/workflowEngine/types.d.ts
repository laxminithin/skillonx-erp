export type WorkflowActor = {
    facultyUserId: number;
    collegeId: number;
    departmentId: number | null;
    role: string;
    name?: string | null;
};
export type WorkflowPermission = 'workflow.definition.manage' | 'workflow.instance.start' | 'workflow.instance.view' | 'workflow.instance.act';
export declare const WORKFLOW_ACTIONS: readonly ["SUBMIT", "APPROVE", "REJECT", "RETURN", "CANCEL"];
export type WorkflowAction = (typeof WORKFLOW_ACTIONS)[number];
export declare const WORKFLOW_INSTANCE_STATUSES: readonly ["IN_PROGRESS", "APPROVED", "REJECTED", "CANCELLED"];
export type WorkflowInstanceStatus = (typeof WORKFLOW_INSTANCE_STATUSES)[number];
