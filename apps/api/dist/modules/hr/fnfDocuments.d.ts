import type { HrActor } from './types.js';
export declare function generateDocuments(actor: HrActor, settlementId: number): Promise<Record<string, unknown>>;
export declare function getDocument(actor: HrActor, settlementId: number, docType: string): Promise<{
    id: number;
    docType: unknown;
    releaseStatus: unknown;
    releasedAt: unknown;
    fields: {};
    body: unknown;
}>;
