import type { CopyStatus, LibraryActor } from './types.js';
type Row = Record<string, unknown>;
export declare function serializeCopy(row: Row, title?: string): {
    id: number;
    catalogItemId: number;
    accessionNumber: unknown;
    barcode: unknown;
    location: unknown;
    shelf: unknown;
    status: CopyStatus;
    lastVerifiedAt: unknown;
    title: string | null;
};
export declare function findCopyByBarcode(collegeId: number, barcode: string): Promise<{
    id: number;
    catalogItemId: number;
    accessionNumber: unknown;
    barcode: unknown;
    location: unknown;
    shelf: unknown;
    status: CopyStatus;
    lastVerifiedAt: unknown;
    title: string | null;
}>;
export declare function createCopy(actor: LibraryActor, body: {
    catalogItemId: number;
    accessionNumber: string;
    barcode: string;
    location?: string;
    shelf?: string;
}): Promise<{
    id: number;
    catalogItemId: number;
    accessionNumber: unknown;
    barcode: unknown;
    location: unknown;
    shelf: unknown;
    status: CopyStatus;
    lastVerifiedAt: unknown;
    title: string | null;
}>;
export declare function listInventory(actor: LibraryActor, opts: {
    q?: string;
    status?: string;
    limit?: number;
    offset?: number;
}): Promise<{
    id: number;
    catalogItemId: number;
    accessionNumber: unknown;
    barcode: unknown;
    location: unknown;
    shelf: unknown;
    status: CopyStatus;
    lastVerifiedAt: unknown;
    title: string | null;
}[]>;
export declare function updateCopyStatus(actor: LibraryActor, copyId: number, status: CopyStatus, reason?: string): Promise<{
    id: number;
    catalogItemId: number;
    accessionNumber: unknown;
    barcode: unknown;
    location: unknown;
    shelf: unknown;
    status: CopyStatus;
    lastVerifiedAt: unknown;
    title: string | null;
}>;
export {};
