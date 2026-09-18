import type { LibraryActor } from './types.js';
export declare function startInventorySession(actor: LibraryActor, name: string): Promise<any>;
export declare function scanInventoryCopy(actor: LibraryActor, sessionId: number, barcode: string): Promise<{
    scanId: number;
    scanStatus: string;
    copyId: number | null;
}>;
export declare function closeInventorySession(actor: LibraryActor, sessionId: number): Promise<{
    closed: boolean;
}>;
