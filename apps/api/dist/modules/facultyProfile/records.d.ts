import type { EmployeeScope } from './access.js';
import { type FacultyProfileActor, type RecordCreateInput } from './types.js';
type Row = Record<string, unknown>;
export type RecordFilters = {
    domain?: string;
    academicYearLabel?: string;
    category?: string;
    status?: string;
    verificationStatus?: string;
    recordType?: string;
    includeArchived?: boolean;
};
export declare function serializeRecord(row: Row, evidenceCount?: number): Record<string, unknown>;
export declare function listRecords(actor: FacultyProfileActor, employee: EmployeeScope, filters: RecordFilters): Promise<Record<string, unknown>[]>;
export declare function loadRecordRow(actor: FacultyProfileActor, employee: EmployeeScope, recordId: number): Promise<Row>;
export declare function getRecord(actor: FacultyProfileActor, employee: EmployeeScope, recordId: number): Promise<{
    evidence: {
        id: number;
        fileName: unknown;
        mimeType: unknown;
        fileSize: number;
        checksum: {} | null;
        evidenceCategory: {} | null;
        evidenceSubcategory: {} | null;
        description: {} | null;
        reference: {} | null;
        createdAt: unknown;
    }[];
    verificationHistory: {
        id: number;
        action: unknown;
        fromStatus: {} | null;
        toStatus: unknown;
        actedByRole: {} | null;
        remarks: {} | null;
        createdAt: unknown;
    }[];
}>;
export declare function createRecord(actor: FacultyProfileActor, employee: EmployeeScope, input: RecordCreateInput): Promise<{
    evidence: {
        id: number;
        fileName: unknown;
        mimeType: unknown;
        fileSize: number;
        checksum: {} | null;
        evidenceCategory: {} | null;
        evidenceSubcategory: {} | null;
        description: {} | null;
        reference: {} | null;
        createdAt: unknown;
    }[];
    verificationHistory: {
        id: number;
        action: unknown;
        fromStatus: {} | null;
        toStatus: unknown;
        actedByRole: {} | null;
        remarks: {} | null;
        createdAt: unknown;
    }[];
}>;
export declare function updateRecord(actor: FacultyProfileActor, employee: EmployeeScope, recordId: number, patch: Partial<RecordCreateInput>): Promise<{
    evidence: {
        id: number;
        fileName: unknown;
        mimeType: unknown;
        fileSize: number;
        checksum: {} | null;
        evidenceCategory: {} | null;
        evidenceSubcategory: {} | null;
        description: {} | null;
        reference: {} | null;
        createdAt: unknown;
    }[];
    verificationHistory: {
        id: number;
        action: unknown;
        fromStatus: {} | null;
        toStatus: unknown;
        actedByRole: {} | null;
        remarks: {} | null;
        createdAt: unknown;
    }[];
}>;
export declare function archiveRecord(actor: FacultyProfileActor, employee: EmployeeScope, recordId: number): Promise<{
    ok: boolean;
}>;
export {};
