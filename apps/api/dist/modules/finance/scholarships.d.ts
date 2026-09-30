import type { Knex } from 'knex';
import type { FinanceActor } from './types.js';
export declare function listScholarshipSchemes(collegeId: number): Promise<{
    id: number;
    code: any;
    name: any;
    description: any;
    provider: any;
}[]>;
export declare function createStudentScholarship(actor: FinanceActor, body: {
    studentId: number;
    schemeId: number;
    academicYearId: number;
    expectedAmount?: number;
    sanctionedAmount?: number;
    remarks?: string;
}): Promise<{
    id: number;
    studentId: number;
    studentName: {} | null;
    usn: {} | null;
    schemeId: number;
    schemeName: unknown;
    schemeCode: unknown;
    academicYearId: number;
    expectedAmount: string | null;
    sanctionedAmount: string | null;
    receivedAmount: string;
    status: unknown;
    createdAt: unknown;
}>;
export declare function sanctionScholarship(actor: FinanceActor, id: number, sanctionedAmount: number): Promise<{
    id: number;
    studentId: number;
    studentName: {} | null;
    usn: {} | null;
    schemeId: number;
    schemeName: unknown;
    schemeCode: unknown;
    academicYearId: number;
    expectedAmount: string | null;
    sanctionedAmount: string | null;
    receivedAmount: string;
    status: unknown;
    createdAt: unknown;
}>;
/**
 * Applies a sanctioned scholarship amount against a student's open demands,
 * oldest-first. Exported (not just used by `sanctionScholarship`) so the
 * Phase 10 scholarship-application finance handoff can reuse this exact
 * demand-walk logic inside its own transaction, keeping the application's
 * status flip and the financial effect atomic (directive §37/§63) instead
 * of duplicating this logic.
 */
export declare function applyScholarshipToDemands(collegeId: number, studentId: number, amount: number, existingTrx?: Knex.Transaction): Promise<void>;
export declare function getStudentScholarship(actor: FinanceActor, id: number): Promise<{
    id: number;
    studentId: number;
    studentName: {} | null;
    usn: {} | null;
    schemeId: number;
    schemeName: unknown;
    schemeCode: unknown;
    academicYearId: number;
    expectedAmount: string | null;
    sanctionedAmount: string | null;
    receivedAmount: string;
    status: unknown;
    createdAt: unknown;
}>;
export declare function listStudentScholarships(studentId: number, collegeId: number): Promise<{
    id: number;
    studentId: number;
    studentName: {} | null;
    usn: {} | null;
    schemeId: number;
    schemeName: unknown;
    schemeCode: unknown;
    academicYearId: number;
    expectedAmount: string | null;
    sanctionedAmount: string | null;
    receivedAmount: string;
    status: unknown;
    createdAt: unknown;
}[]>;
export declare function listScholarships(actor: FinanceActor, filters?: {
    status?: string;
}): Promise<{
    id: number;
    studentId: number;
    studentName: {} | null;
    usn: {} | null;
    schemeId: number;
    schemeName: unknown;
    schemeCode: unknown;
    academicYearId: number;
    expectedAmount: string | null;
    sanctionedAmount: string | null;
    receivedAmount: string;
    status: unknown;
    createdAt: unknown;
}[]>;
export declare function createConcession(actor: FinanceActor, body: {
    studentId: number;
    demandId?: number;
    feeHeadId?: number;
    concessionType: string;
    amount?: number;
    percentage?: number;
    reason: string;
}): Promise<{
    id: number;
    status: string;
}>;
export declare function listConcessions(actor: FinanceActor, filters?: {
    studentId?: number;
    status?: string;
}): Promise<{
    id: number;
    studentId: number;
    studentName: any;
    usn: any;
    concessionType: any;
    amount: string | null;
    percentage: number | null;
    reason: any;
    status: any;
    createdAt: any;
}[]>;
export declare function createRefund(actor: FinanceActor, body: {
    studentId: number;
    paymentId?: number;
    amount: number;
    reasonCode: string;
    reason?: string;
}): Promise<{
    id: number;
    status: string;
}>;
export declare function approveRefund(actor: FinanceActor, id: number): Promise<{
    id: number;
    status: string;
}>;
export declare function processRefund(actor: FinanceActor, id: number, paymentReference?: string): Promise<{
    id: number;
    status: string;
}>;
export declare function listRefunds(actor: FinanceActor, filters?: {
    status?: string;
}): Promise<{
    id: number;
    studentId: number;
    studentName: any;
    usn: any;
    amount: string;
    reasonCode: any;
    status: any;
    createdAt: any;
}[]>;
export declare function listStudentRefunds(studentId: number, collegeId: number): Promise<{
    id: number;
    amount: string;
    reasonCode: any;
    status: any;
    createdAt: any;
}[]>;
