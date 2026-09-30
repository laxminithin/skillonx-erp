export type WorkflowActor = {
  facultyUserId: number;
  collegeId: number;
  departmentId: number | null;
  role: string;
  name?: string | null;
};

export type WorkflowPermission =
  | 'workflow.definition.manage'
  | 'workflow.instance.start'
  | 'workflow.instance.view'
  | 'workflow.instance.act';

export const WORKFLOW_ACTIONS = ['SUBMIT', 'APPROVE', 'REJECT', 'RETURN', 'CANCEL'] as const;
export type WorkflowAction = (typeof WORKFLOW_ACTIONS)[number];

export const WORKFLOW_INSTANCE_STATUSES = ['IN_PROGRESS', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;
export type WorkflowInstanceStatus = (typeof WORKFLOW_INSTANCE_STATUSES)[number];
