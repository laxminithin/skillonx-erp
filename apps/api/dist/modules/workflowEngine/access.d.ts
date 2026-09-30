import type { WorkflowActor, WorkflowPermission } from './types.js';
export declare function workflowPermissionsForRole(role: string): WorkflowPermission[];
export declare function hasWorkflowPermission(actor: WorkflowActor, permission: WorkflowPermission): boolean;
export declare function assertWorkflowPermission(actor: WorkflowActor, permission: WorkflowPermission): void;
