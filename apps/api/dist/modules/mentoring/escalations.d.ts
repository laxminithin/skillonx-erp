import type { MentoringActor } from './types.js';
import type { z } from 'zod';
import type { createEscalationSchema, resolveEscalationSchema, createReferralSchema, closeReferralSchema, createParentInteractionSchema } from './types.js';
export declare function createEscalation(actor: MentoringActor, input: z.infer<typeof createEscalationSchema>): Promise<{
    id: number;
    status: string;
}>;
/** Escalations raised by the acting mentor. */
export declare function listMentorEscalations(actor: MentoringActor): Promise<{
    id: number;
    studentId: number;
    studentName: unknown;
    usn: unknown;
    mentorName: {} | null;
    department: {} | null;
    reasonCode: unknown;
    reason: unknown;
    targetLevel: unknown;
    status: unknown;
    resolution: {} | null;
    createdAt: unknown;
    acknowledgedAt: {} | null;
    resolvedAt: {} | null;
}[]>;
/** Escalations targeted at leadership scope (HOD department / Principal institution). */
export declare function listLeadershipEscalations(actor: MentoringActor, opts: {
    departmentIds: number[] | null;
    level?: 'HOD' | 'PRINCIPAL';
    status?: string;
}): Promise<{
    id: number;
    studentId: number;
    studentName: unknown;
    usn: unknown;
    mentorName: {} | null;
    department: {} | null;
    reasonCode: unknown;
    reason: unknown;
    targetLevel: unknown;
    status: unknown;
    resolution: {} | null;
    createdAt: unknown;
    acknowledgedAt: {} | null;
    resolvedAt: {} | null;
}[]>;
export declare function resolveEscalation(actor: MentoringActor, escalationId: number, departmentIds: number[] | null, input: z.infer<typeof resolveEscalationSchema>): Promise<{
    id: number;
    status: any;
    targetLevel: any;
}>;
export declare function createReferral(actor: MentoringActor, input: z.infer<typeof createReferralSchema>): Promise<{
    id: number;
    status: string;
}>;
export declare function listReferrals(actor: MentoringActor, studentId: number): Promise<{
    id: number;
    targetFunction: any;
    subject: any;
    context: any;
    status: any;
    outcome: any;
    createdAt: any;
}[]>;
export declare function closeReferral(actor: MentoringActor, referralId: number, input: z.infer<typeof closeReferralSchema>): Promise<{
    id: number;
    status: string;
}>;
export declare function createParentInteraction(actor: MentoringActor, input: z.infer<typeof createParentInteractionSchema>): Promise<{
    id: number;
}>;
export declare function listParentInteractions(actor: MentoringActor, studentId: number): Promise<{
    id: number;
    interactionDate: any;
    mode: any;
    initiatedBy: any;
    purpose: any;
    summary: any;
    agreedFollowUp: any;
    visibility: any;
    createdAt: any;
}[]>;
