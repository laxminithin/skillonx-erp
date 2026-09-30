import type { Knex } from 'knex';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { type DocumentActor } from './types.js';
export declare const uploadSchema: z.ZodObject<{
    entityType: z.ZodString;
    entityId: z.ZodNumber;
    category: z.ZodString;
    fileName: z.ZodString;
    mimeType: z.ZodString;
    contentBase64: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    expiryDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    category: string;
    fileName: string;
    mimeType: string;
    contentBase64: string;
    entityType: string;
    entityId: number;
    description?: string | null | undefined;
    expiryDate?: string | null | undefined;
}, {
    category: string;
    fileName: string;
    mimeType: string;
    contentBase64: string;
    entityType: string;
    entityId: number;
    description?: string | null | undefined;
    expiryDate?: string | null | undefined;
}>;
export declare function uploadDocument(actor: DocumentActor, input: z.infer<typeof uploadSchema>): Promise<{
    [k: string]: unknown;
}>;
export declare function uploadNewVersion(actor: DocumentActor, documentId: number, input: z.infer<typeof uploadSchema>): Promise<{
    [k: string]: unknown;
}>;
export declare function getDocumentMetadata(actor: DocumentActor, documentId: number, trx?: Knex.Transaction | typeof db): Promise<{
    [k: string]: unknown;
}>;
export declare function downloadDocument(actor: DocumentActor, documentId: number): Promise<{
    metadata: {
        [k: string]: unknown;
    };
    buffer: NonSharedBuffer;
}>;
export declare function archiveDocument(actor: DocumentActor, documentId: number): Promise<{
    [k: string]: unknown;
}>;
export declare function listDocumentsForEntity(actor: DocumentActor, entityType: string, entityId: number): Promise<{
    [k: string]: unknown;
}[]>;
