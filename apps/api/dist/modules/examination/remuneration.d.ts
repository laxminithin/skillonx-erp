import { z } from 'zod';
import type { ExamActor } from './access.js';
/**
 * Examination remuneration producer.
 * Examination owns: duty, beneficiary, quantity, rate/rule, calculation, COE approval.
 * Finance owns: the payable/posting (see finance/examRemunerationPosting.ts).
 * The amount is computed and frozen server-side; the browser never sets the payable (§6).
 */
export declare const remunerationSchema: z.ZodObject<{
    sourceType: z.ZodEnum<["INVIGILATION", "VALUATION", "EXAMINER"]>;
    sourceReferenceId: z.ZodNumber;
    employeeId: z.ZodNumber;
    quantity: z.ZodNumber;
    rate: z.ZodNumber;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    employeeId: number;
    sourceType: "VALUATION" | "INVIGILATION" | "EXAMINER";
    sourceReferenceId: number;
    quantity: number;
    rate: number;
    description?: string | undefined;
}, {
    employeeId: number;
    sourceType: "VALUATION" | "INVIGILATION" | "EXAMINER";
    sourceReferenceId: number;
    quantity: number;
    rate: number;
    description?: string | undefined;
}>;
export declare function createRemuneration(actor: ExamActor, body: z.infer<typeof remunerationSchema>): Promise<{
    id: number;
    status: string;
    amount: number;
}>;
export declare function approveRemuneration(actor: ExamActor, id: number): Promise<{
    id: number;
    status: string;
    amount: number;
}>;
export declare function listRemuneration(actor: ExamActor, status?: string): Promise<{
    id: number;
    sourceType: any;
    sourceReferenceId: number;
    beneficiaryName: any;
    employeeNumber: any;
    quantity: number;
    rate: number;
    amount: number;
    currency: any;
    status: any;
    financeStatus: any;
    postingNumber: any;
    approvedAt: any;
}[]>;
