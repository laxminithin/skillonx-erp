import { z } from 'zod';
export declare const FNF_STATUSES: readonly ["DRAFT", "CLEARANCE_PENDING", "READY_FOR_CALCULATION", "CALCULATED", "REVIEW", "APPROVED", "FINANCE_POSTED", "SETTLED", "CLOSED", "ON_HOLD", "REJECTED", "CANCELLED", "REOPENED"];
export type FnfStatus = (typeof FNF_STATUSES)[number];
export declare const FNF_LOCKED_STATUSES: FnfStatus[];
export declare const FNF_TRANSITIONS: Record<FnfStatus, FnfStatus[]>;
export declare const CLEARANCE_DOMAINS: readonly ["DEPARTMENT", "HR", "FINANCE", "LIBRARY", "HOSTEL", "TRANSPORT", "ASSET", "IT", "OTHER"];
export type ClearanceDomain = (typeof CLEARANCE_DOMAINS)[number];
export declare const CLEARANCE_STATUSES: readonly ["PENDING", "CLEARED", "DUE", "WAIVED", "NOT_APPLICABLE"];
export type ClearanceStatus = (typeof CLEARANCE_STATUSES)[number];
export declare const FNF_SNAPSHOT_VERSION = "1";
export declare const createFnfCaseSchema: z.ZodObject<{
    separationRequestId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    separationRequestId: number;
}, {
    separationRequestId: number;
}>;
export declare const clearanceDecisionSchema: z.ZodObject<{
    status: z.ZodEnum<["PENDING", "CLEARED", "DUE", "WAIVED", "NOT_APPLICABLE"]>;
    remarks: z.ZodOptional<z.ZodString>;
    dueAmount: z.ZodOptional<z.ZodNumber>;
    waive: z.ZodOptional<z.ZodBoolean>;
    override: z.ZodOptional<z.ZodBoolean>;
    overrideReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "PENDING" | "NOT_APPLICABLE" | "DUE" | "WAIVED" | "CLEARED";
    remarks?: string | undefined;
    waive?: boolean | undefined;
    dueAmount?: number | undefined;
    override?: boolean | undefined;
    overrideReason?: string | undefined;
}, {
    status: "PENDING" | "NOT_APPLICABLE" | "DUE" | "WAIVED" | "CLEARED";
    remarks?: string | undefined;
    waive?: boolean | undefined;
    dueAmount?: number | undefined;
    override?: boolean | undefined;
    overrideReason?: string | undefined;
}>;
export declare const noticeWaiverSchema: z.ZodObject<{
    waived: z.ZodBoolean;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
    waived: boolean;
}, {
    reason: string;
    waived: boolean;
}>;
export declare const fnfAdjustmentSchema: z.ZodObject<{
    side: z.ZodEnum<["PAYABLE", "RECOVERY"]>;
    code: z.ZodDefault<z.ZodString>;
    amount: z.ZodNumber;
    reason: z.ZodString;
    supportingReference: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    reason: string;
    amount: number;
    side: "RECOVERY" | "PAYABLE";
    supportingReference?: string | undefined;
}, {
    reason: string;
    amount: number;
    side: "RECOVERY" | "PAYABLE";
    code?: string | undefined;
    supportingReference?: string | undefined;
}>;
export declare const fnfRejectSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const fnfReopenSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const fnfHoldSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const fnfAssetItemSchema: z.ZodObject<{
    itemCode: z.ZodString;
    itemName: z.ZodString;
    recoveryAmount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    itemCode: string;
    itemName: string;
    recoveryAmount?: number | undefined;
}, {
    itemCode: string;
    itemName: string;
    recoveryAmount?: number | undefined;
}>;
export declare const employeeFinanceDueSchema: z.ZodObject<{
    employeeId: z.ZodNumber;
    dueType: z.ZodEnum<["LOAN", "ADVANCE", "MISC", "ASSET", "OTHER"]>;
    amount: z.ZodNumber;
    sourceRef: z.ZodOptional<z.ZodString>;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    employeeId: number;
    amount: number;
    dueType: "OTHER" | "ASSET" | "LOAN" | "ADVANCE" | "MISC";
    remarks?: string | undefined;
    sourceRef?: string | undefined;
}, {
    employeeId: number;
    amount: number;
    dueType: "OTHER" | "ASSET" | "LOAN" | "ADVANCE" | "MISC";
    remarks?: string | undefined;
    sourceRef?: string | undefined;
}>;
export type FnfComponentInput = {
    side: 'PAYABLE' | 'RECOVERY';
    code: string;
    name: string;
    source: string;
    basis?: string | null;
    quantity?: number | null;
    rate?: string | null;
    amount: string;
    ruleReference?: string | null;
    sourceRef?: string | null;
    trace?: Record<string, unknown>;
};
