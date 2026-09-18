import type { LabActor } from './types.js';
export declare function listStock(actor: LabActor, filters?: {
    labId?: number;
    lowOnly?: boolean;
    q?: string;
    category?: string;
}): Promise<{
    id: number;
    labId: number;
    labName: string;
    name: unknown;
    code: {} | null;
    category: unknown;
    unit: unknown;
    openingStock: number;
    currentStock: number;
    minThreshold: number;
    lowStock: boolean;
    status: unknown;
}[]>;
export declare function createStockItem(actor: LabActor, input: {
    labId: number;
    name: string;
    code?: string | null;
    category?: string;
    unit?: string;
    openingStock?: number;
    minThreshold?: number;
}): Promise<{
    id: number;
    labId: number;
    labName: string;
    name: unknown;
    code: {} | null;
    category: unknown;
    unit: unknown;
    openingStock: number;
    currentStock: number;
    minThreshold: number;
    lowStock: boolean;
    status: unknown;
}>;
export declare function recordMovement(actor: LabActor, itemId: number, input: {
    movementType: string;
    quantity: number;
    reason?: string | null;
    reference?: string | null;
    toLabId?: number | null;
}): Promise<{
    item: {
        id: number;
        labId: number;
        labName: string;
        name: unknown;
        code: {} | null;
        category: unknown;
        unit: unknown;
        openingStock: number;
        currentStock: number;
        minThreshold: number;
        lowStock: boolean;
        status: unknown;
    };
    movementId: number;
    balanceAfter: number;
}>;
export declare function itemLedger(actor: LabActor, itemId: number): Promise<{
    item: {
        id: number;
        labId: number;
        labName: string;
        name: unknown;
        code: {} | null;
        category: unknown;
        unit: unknown;
        openingStock: number;
        currentStock: number;
        minThreshold: number;
        lowStock: boolean;
        status: unknown;
    };
    movements: {
        id: number;
        movementType: any;
        quantity: number;
        balanceAfter: number;
        reason: any;
        reference: any;
        actorId: number | null;
        createdAt: any;
    }[];
}>;
