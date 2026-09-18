import type { LabActor } from './types.js';
export declare function listRequirements(actor: LabActor, filters?: {
    labId?: number;
    status?: string;
    departmentId?: number;
}): Promise<{
    id: number;
    labId: number;
    labName: string;
    departmentId: number | null;
    requestType: unknown;
    item: unknown;
    quantity: number;
    reason: {} | null;
    academicJustification: {} | null;
    priority: unknown;
    estimatedCost: number | null;
    semester: {} | null;
    studentStrength: number | null;
    currentStock: number | null;
    shortfall: number | null;
    status: unknown;
    requestedBy: number | null;
    requesterName: string;
    purchaseRef: {} | null;
    remarks: {} | null;
    createdAt: unknown;
}[]>;
export declare function createRequirement(actor: LabActor, input: Record<string, any>): Promise<{
    id: number;
    labId: number;
    labName: string;
    departmentId: number | null;
    requestType: unknown;
    item: unknown;
    quantity: number;
    reason: {} | null;
    academicJustification: {} | null;
    priority: unknown;
    estimatedCost: number | null;
    semester: {} | null;
    studentStrength: number | null;
    currentStock: number | null;
    shortfall: number | null;
    status: unknown;
    requestedBy: number | null;
    requesterName: string;
    purchaseRef: {} | null;
    remarks: {} | null;
    createdAt: unknown;
}>;
/**
 * Advance the approval chain. Which transition is allowed depends on the
 * actor's role and the current status:
 *   SUBMITTED         → INCHARGE_APPROVED   (Lab In-charge / admin)
 *   INCHARGE_APPROVED → HOD_APPROVED        (HOD of the lab's department / admin)
 *   HOD_APPROVED      → PRINCIPAL_APPROVED  (Principal / admin)
 *   PRINCIPAL_APPROVED→ FULFILLED           (admin — Stores/Purchase handoff)
 * REJECT is allowed by any approver in the chain. FULFILL records purchase_ref.
 */
export declare function decideRequirement(actor: LabActor, id: number, input: {
    decision: 'APPROVE' | 'REJECT' | 'FULFILL';
    remarks?: string | null;
    purchaseRef?: string | null;
}): Promise<{
    id: number;
    labId: number;
    labName: string;
    departmentId: number | null;
    requestType: unknown;
    item: unknown;
    quantity: number;
    reason: {} | null;
    academicJustification: {} | null;
    priority: unknown;
    estimatedCost: number | null;
    semester: {} | null;
    studentStrength: number | null;
    currentStock: number | null;
    shortfall: number | null;
    status: unknown;
    requestedBy: number | null;
    requesterName: string;
    purchaseRef: {} | null;
    remarks: {} | null;
    createdAt: unknown;
}>;
