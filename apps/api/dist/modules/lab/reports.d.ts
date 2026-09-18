import type { LabActor } from './types.js';
export declare const REPORT_TYPES: readonly ["asset-register", "lab-inventory", "faulty-assets", "repair-history", "issue-return", "overdue-items", "stock-ledger", "low-stock", "software-license", "warranty-amc-expiry", "lab-readiness", "requirement-status"];
export declare function runReport(actor: LabActor, type: string, filters?: {
    labId?: number;
}): Promise<{
    type: string;
    columns: never[];
    rows: never[];
    generatedAt: string;
} | {
    type: "asset-register" | "faulty-assets";
    columns: string[];
    rows: any[];
    generatedAt: string;
} | {
    type: "lab-inventory";
    columns: string[];
    rows: {
        count: number;
    }[];
    generatedAt: string;
} | {
    type: "repair-history";
    columns: string[];
    rows: any[];
    generatedAt: string;
} | {
    type: "issue-return" | "overdue-items";
    columns: string[];
    rows: any[];
    generatedAt: string;
} | {
    type: "stock-ledger";
    columns: string[];
    rows: any[];
    generatedAt: string;
} | {
    type: "low-stock";
    columns: string[];
    rows: any[];
    generatedAt: string;
} | {
    type: "software-license";
    columns: string[];
    rows: any[];
    generatedAt: string;
} | {
    type: "warranty-amc-expiry";
    columns: string[];
    rows: any[];
    generatedAt: string;
} | {
    type: "lab-readiness";
    columns: string[];
    rows: any[];
    generatedAt: string;
} | {
    type: "requirement-status";
    columns: string[];
    rows: any[];
    generatedAt: string;
}>;
