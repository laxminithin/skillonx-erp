import type { EmployeeScope } from './access.js';
import { type FacultyProfileActor } from './types.js';
import { z } from 'zod';
import type { evidenceMetaSchema } from './types.js';
type Row = Record<string, unknown>;
export declare function evidenceRoot(): string;
/** Attach an evidence document to a record (owner only). */
export declare function attachEvidence(actor: FacultyProfileActor, employee: EmployeeScope, recordId: number, input: z.infer<typeof evidenceMetaSchema>): Promise<{
    id: number;
    recordId: number;
    fileName: unknown;
    mimeType: unknown;
    fileSize: number;
    checksum: {} | null;
    evidenceCategory: {} | null;
    evidenceSubcategory: {} | null;
    description: {} | null;
    reference: {} | null;
    createdAt: unknown;
}>;
/**
 * Authorize + read an evidence file by id. Enforces tenant + profile-view
 * authorization (owner / HOD-dept / institution roles). Guards path traversal
 * and never returns storage paths.
 */
export declare function readEvidence(actor: FacultyProfileActor, evidenceId: number): Promise<{
    evidence: Row;
    body: NonSharedBuffer;
}>;
export declare function deleteEvidence(actor: FacultyProfileActor, employee: EmployeeScope, evidenceId: number): Promise<{
    ok: boolean;
}>;
export {};
