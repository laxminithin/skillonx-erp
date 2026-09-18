import type { ManagementActor } from './types.js';
export type ApprovalItem = {
    domain: 'LEAVE' | 'RECRUITMENT';
    type: string;
    id: number;
    reference: string | null;
    requester: string | null;
    department: string | null;
    date: string | null;
    ageDays: number | null;
    summary: string;
    status: string;
    priority: 'HIGH' | 'NORMAL';
    canonicalRef: string;
    allowedActions: Array<'APPROVE' | 'REJECT'>;
};
export declare function listApprovals(actor: ManagementActor): Promise<{
    items: ApprovalItem[];
    total: number;
    byDomain: Record<string, number>;
}>;
export type ApprovalAction = {
    domain: 'LEAVE' | 'RECRUITMENT';
    id: number;
    action: 'APPROVE' | 'REJECT';
    notes?: string;
};
/**
 * Execute a governance decision through the canonical domain service. The
 * canonical service enforces the domain approval capability and the atomic
 * transition, so this method never mutates domain tables directly.
 */
export declare function actOnApproval(actor: ManagementActor, input: ApprovalAction): Promise<{
    id: number;
    status: string;
} | {
    id: number;
    collegeId: number;
    code: unknown;
    departmentId: number;
    designationId: number;
    employmentTypeId: number;
    requestedHeadcount: number;
    approvedHeadcount: number | null;
    reason: unknown;
    positionType: unknown;
    replacementEmployeeId: number | null;
    budgetReference: unknown;
    desiredJoiningDate: unknown;
    requestedBy: number | null;
    status: unknown;
    departmentApprovedBy: number | null;
    departmentApprovedAt: unknown;
    hrReviewedBy: number | null;
    hrReviewedAt: unknown;
    approvedBy: number | null;
    approvedAt: unknown;
    rejectedBy: number | null;
    rejectedAt: unknown;
    rejectionReason: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
